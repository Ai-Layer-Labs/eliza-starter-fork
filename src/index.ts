import { DirectClient } from "@elizaos/client-direct";
import { config } from "dotenv";
config(); // Load environment variables from .env file

import {
  AgentRuntime,
  elizaLogger,
  settings,
  stringToUuid,
  type Character,
  type IAgentRuntime,
} from "@elizaos/core";
import { bootstrapPlugin } from "@elizaos/plugin-bootstrap";
import { createNodePlugin } from "@elizaos/plugin-node";
import { solanaPlugin } from "@elizaos/plugin-solana";
// import { walletNFTPlugin } from "./plugins/wallet-nft/index.ts";
import fs from "fs";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";
import { initializeDbCache } from "./cache/index.ts";
import { character } from "./character.ts";
import { startChat } from "./chat/index.ts";
import { initializeClients } from "./clients/index.ts";
import {
  getTokenForProvider,
  loadCharacters,
  parseArguments,
} from "./config/index.ts";
import { initializeDatabase } from "./database/index.ts";
import { elizaCharacter } from "../characters/eliza.character.ts";
import { Network } from "alchemy-sdk";
import { ethers } from "ethers";
import { PostgresDatabaseAdapter } from "@elizaos/adapter-postgres";
import { SqliteDatabaseAdapter } from "@elizaos/adapter-sqlite";
import { alchemy } from "./alchemy.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const wait = (minTime: number = 1000, maxTime: number = 3000) => {
  const waitTime =
    Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
  return new Promise((resolve) => setTimeout(resolve, waitTime));
};

let nodePlugin: any | undefined;

export function createAgent(
  character: Character,
  db: any,
  cache: any,
  token: string
) {
  elizaLogger.success(
    elizaLogger.successesTitle,
    "Creating runtime for character",
    character.name,
  );

  nodePlugin ??= createNodePlugin();

  // Initialize WalletNFTPlugin if ALCHEMY_API_KEY is present
  // const walletNFTPlugin =  new walletNFTPlugin()

  return new AgentRuntime({
    databaseAdapter: db,
    token,
    modelProvider: character.modelProvider,
    evaluators: [],
    character,
    plugins: [
      bootstrapPlugin,
      nodePlugin,
      character.settings?.secrets?.WALLET_PUBLIC_KEY ? solanaPlugin : null,
      // walletNFTPlugin,
    ].filter(Boolean),
    providers: [],
    actions: [],
    services: [],
    managers: [],
    cacheManager: cache,
  });
}

async function startAgent(character: Character, directClient: DirectClient) {
  try {
    character.id ??= stringToUuid(character.name);
    character.username ??= character.name;

    const token = getTokenForProvider(character.modelProvider, character);
    const dataDir = path.join(__dirname, "../data");

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const db = initializeDatabase(dataDir);

    await db.init();

    const cache = initializeDbCache(character, db);

    const runtime = createAgent(character, db, cache, token);

    await runtime.initialize();

    runtime.clients = await initializeClients(character, runtime as unknown as IAgentRuntime);

    directClient.registerAgent(runtime);

    // report to console
    elizaLogger.debug(`Started ${character.name} as ${runtime.agentId}`);

    return runtime;
  } catch (error) {
    elizaLogger.error(
      `Error starting agent for character ${character.name}:`,
      error,
    );
    console.error(error);
    throw error;
  }
}

const checkPortAvailable = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        resolve(false);
      }
    });

    server.once("listening", () => {
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
};

const startAgents = async () => {
  const directClient = new DirectClient();

  directClient.app.post("/authenticate", async (req: any, res: any) => {
    try {
      const { address, signature } = req.body;

      if (!address || !signature) {
        return res.status(400).json({ error: "Address and signature are required" });
      }

      const isValid = await verifySignature(address, signature);

      if (!isValid) {
        return res.status(401).json({ error: "Invalid signature" });
      }

      const thinkAgent = await getThinkAgent(address);
      // let characters = await getThinkAgent("NFT_ADDRESS");

      const runtime = await startAgent(thinkAgent, directClient as DirectClient);

      res.json({
        success: true,
        address
      });
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });


  let serverPort = parseInt(settings.SERVER_PORT || "3000");
  const args = parseArguments();

  // let charactersArg = args.characters || args.character;
  let characters = [];

  // console.log("charactersArg", charactersArg);
  // if (charactersArg) {
  // characters = await loadCharacters(charactersArg);
  // }
  console.log("characters", characters);
  try {
    for (const character of characters) {
      await startAgent(character, directClient as DirectClient);
    }
  } catch (error) {
    elizaLogger.error("Error starting agents:", error);
  }

  while (!(await checkPortAvailable(serverPort))) {
    elizaLogger.warn(`Port ${serverPort} is in use, trying ${serverPort + 1}`);
    serverPort++;
  }

  // upload some agent functionality into directClient
  directClient.startAgent = async (character: Character) => {
    // wrap it so we don't have to inject directClient later
    return startAgent(character, directClient);
  };

  directClient.start(serverPort);

  if (serverPort !== parseInt(settings.SERVER_PORT || "3000")) {
    elizaLogger.log(`Server started on alternate port ${serverPort}`);
  }

  const isDaemonProcess = process.env.DAEMON_PROCESS === "true";
  if (!isDaemonProcess) {
    elizaLogger.log("Chat started. Type 'exit' to quit.");
    const chat = startChat(characters);
    chat();
  }
};

const verifySignature = async (address: string, signature: string): Promise<boolean> => {
  try {
    // The message that was signed
    const message = "Welcome to Think Agents! This signature is required to verify your wallet ownership.";

    // Recover the address from the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);

    // Check if the recovered address matches the provided address
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
};

// startAgents().catch((error) => {
//   elizaLogger.error("Unhandled error in startAgents:", error);
//   process.exit(1);
// });


const getThinkAgent = async (nftAddress: string) => {
  const character = elizaCharacter;
  return character;
  // get the nft from alchemy
  // const nft = await alchemy.getNftMetadata(nftAddress);

  // get the murur matrix from the nft metadata
  // const mururMatrix = nft.metadata.attributes.find((attribute: any) => attribute.trait_type === "Murur Matrix");

  // get the think agent from the murur matrix
  // const thinkAgent = await getThinkAgentFromMururMatrix(mururMatrix);

  // return thinkAgent;
};


const getThinkAgentFromMururMatrix = async (mururMatrix: string) => {
  // turn the murur matrix into a character
  // const character = await turnMururMatrixIntoCharacter(mururMatrix);

  const character = elizaCharacter;
  return character;
};


startAgents()