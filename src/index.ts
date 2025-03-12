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
// Import THINK plugin dynamically to avoid circular dependencies
// import thinkProtocolPlugin from "./plugins/think-protocol-plugin/src/index.ts";
import fs from "fs";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";
import { initializeDbCache } from "./cache/index.ts";
import { soulsGeneratorCharacter } from "./character.ts";
import { startChat } from "./chat/index.ts";
import { initializeClients } from "./clients/index.ts";
import {
  getTokenForProvider,
  loadCharacters,
  parseArguments,
} from "./config/index.ts";
import { initializeDatabase } from "./database/index.ts";
import { elizaCharacter } from "../characters/eliza.character.ts";
import { metatronCharacter } from "../characters/metatron.character.ts";
import { Network } from "alchemy-sdk";
import { ethers } from "ethers";
import { PostgresDatabaseAdapter } from "@elizaos/adapter-postgres";
import { SqliteDatabaseAdapter } from "@elizaos/adapter-sqlite";
import { alchemy } from "./alchemy.ts";
// Import THINK plugin actions using CommonJS compatible approach
// import * as agentActions from "./plugins/think-protocol-plugin/src/actions/agent-actions.ts";
// import * as communicationActions from "./plugins/think-protocol-plugin/src/actions/communication-actions.ts";
// import * as escrowActions from "./plugins/think-protocol-plugin/src/actions/escrow-actions.ts";

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

  // We'll add the THINK plugin later after initialization to avoid circular dependencies
  const plugins = [
    bootstrapPlugin,
    nodePlugin,
    character.settings?.secrets?.WALLET_PUBLIC_KEY ? solanaPlugin : null,
    // walletNFTPlugin,
  ].filter(Boolean);

  // Create the agent runtime
  const runtime = new AgentRuntime({
    databaseAdapter: db,
    token,
    modelProvider: character.modelProvider,
    evaluators: [],
    character,
    plugins,
    providers: [],
    actions: [],
    services: [],
    managers: [],
    cacheManager: cache,
  });

  // We'll load the THINK plugin later in the startAgents function

  return runtime;
}

// Add this function to load the THINK plugin actions after the agent is created
async function loadThinkPluginActions(runtime) {
  try {
    // TEMPORARILY DISABLED UNTIL WE FIX THE ISSUES
    // const thinkPlugin = {
    //   name: 'think',
    //   description: 'THINK Protocol integration for ElizaOS',
    //   initialize: async (rt) => {
    //     elizaLogger.info('Initializing simplified THINK Protocol plugin');
    //   }
    // };

    // if (runtime.plugins) {
    //   runtime.plugins.push(thinkPlugin);
    //   elizaLogger.success("THINK protocol plugin loaded successfully");
    // }
    elizaLogger.info("THINK plugin loading temporarily disabled for debugging");
  } catch (error) {
    elizaLogger.error("Failed to load THINK protocol plugin:", error);
  }
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

    // Load the THINK protocol plugin actions after initialization
    await loadThinkPluginActions(runtime);

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

      const nfi = await verifyWalletHasNFI(address);
      if (!nfi) {
        return res.status(401).json({ error: "Wallet does not have a NFI" });
      }

      // if the wallet has a NFI, then we need to get the soul's generator agent
      const soulGeneratorAgent = soulsGeneratorCharacter;

      // const thinkAgent = await getThinkAgent();
      // let characters = await getThinkAgent("NFT_ADDRESS");
      elizaLogger.info("soulGeneratorAgent:", soulGeneratorAgent);

      const runtime = await startAgent(soulGeneratorAgent, directClient as DirectClient);

      // Store wallet and NFT info in database
      try {
        await runtime.cacheManager.set(`${runtime.agentId}:walletAddress`, address);
        await runtime.cacheManager.set(`${runtime.agentId}:nftAddress`, nfi);
        elizaLogger.info("Stored wallet and NFT addresses in database for agent:", runtime.agentId);
      } catch (dbError) {
        elizaLogger.error("Failed to store wallet/NFT info in database:", dbError);
      }


      res.json({
        success: true,
        address
      });
    } catch (error) {
      elizaLogger.error("Authentication error:", error);
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

  try {
    // Dynamically load and initialize the THINK plugin
    /*
    try {
      elizaLogger.info("Dynamically loading THINK protocol plugin...");
      const thinkPluginModule = await import("./plugins/think-protocol-plugin/src/index.ts");
      const thinkProtocolPlugin = thinkPluginModule.default;

      if (thinkProtocolPlugin && typeof thinkProtocolPlugin.initialize === 'function') {
        elizaLogger.info("Initializing THINK protocol plugin...");
        // Pass elizaLogger as the logger property
        await thinkProtocolPlugin.initialize({
          logger: elizaLogger,
          getSetting: (key: string) => settings[key] || ""
        });
        elizaLogger.info("THINK protocol plugin initialized successfully");
      }
    } catch (error) {
      elizaLogger.error("Failed to load or initialize THINK protocol plugin:", error);
    }
    */

    elizaLogger.info("THINK plugin loading disabled to resolve circular dependency issues");

    for (const character of characters) {
      elizaLogger.info("Starting agent for character:", character.name);
      await startAgent(character, directClient as DirectClient);
      elizaLogger.info("Successfully started agent for character:", character.name);
    }
  } catch (error) {
    elizaLogger.error("Error starting agents:", error);
    console.error("Detailed error:", error);
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
    elizaLogger.error("Error verifying signature:", error);
    return false;
  }
};

const verifyWalletHasNFI = async (walletAddress: string) => {
  // const character = elizaCharacter;
  // return character;

  // get the nft address from the wallet address
  elizaLogger.info("getting think agent for wallet address:", walletAddress);
  try {
    const nftAddress = await alchemy.getThinkAgentAddress(walletAddress);
    elizaLogger.info("nftAddress:", nftAddress);

    // get the nft from alchemy
    const nftMetadata = await alchemy.getNFTMetadata(nftAddress)
    elizaLogger.info("nftMetadata:", nftMetadata);
    // get the murur matrix from the nft metadata
    // const mururMatrix = nftMetadata.metadata.attributes.find((attribute: any) => attribute.trait_type === "Murur Matrix");
    const mururMatrix = nftMetadata;
    elizaLogger.info("mururMatrix:", mururMatrix);
    const thinkAgent = await getThinkAgentFromMururMatrix(mururMatrix);
    elizaLogger.info("return thinkAgent:", thinkAgent);
    return thinkAgent;

    // get the think agent from the murur matrix
    // const thinkAgent = await getThinkAgentFromMururMatrix(mururMatrix);

    // return thinkAgent;
  } catch (error) {
    elizaLogger.error("Error getting think agent:", error);
    return null;
  }
};

const getThinkAgentFromMururMatrix = async (mururMatrix: any) => {
  // turn the murur matrix into a character
  // const character = await turnMururMatrixIntoCharacter(mururMatrix);

  const character = soulsGeneratorCharacter;
  return character;
};

startAgents().catch((error) => {
  elizaLogger.error("Unhandled error in startAgents:", error);
  process.exit(1);
});