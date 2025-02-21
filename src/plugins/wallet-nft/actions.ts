import { Action, Content, IAgentRuntime, Memory, ServiceType, State, elizaLogger } from "@elizaos/core"
import { AlchemyApiService } from "./services/alchemy-api-service";

interface CheckNFTContent extends Content {
  contractAddress: string;
  text: string;
}

interface CheckNFTResponse {
  success: boolean;
  response: string;
}

export const checkNFTOwnerAction: Action = {
  name: 'CHECK_NFT_OWNER',
  description:
    "Call this to chat to get information, data and prices from a blockchain using natural language.  You can: \n" +
    "1) query and retrieve information on block and transaction data for a blockchain network, \n" +
    "2) read contract data from a blockchain, \n" +
    "3) get token price and exchange rate for tokens or cryptocurrencies, \n" +
    "4) detailed transaction information from the blockchain, \n" +
    "5) get wallet balances for tokens and NFTs, \n" +
    "6) resolve ENS name to wallet address",
  similes: [
    'CHECK_NFT_OWNER',
    'CHECK_NFT_OWNER_OF',
  ],
  examples: [
    [
      {
        user: '{{user1}}',
        content: { text: 'CHECK_NFT_OWNER' } as CheckNFTContent
      },
      {
        user: '{{agentName}}',
        content: {
          text: 'looks like you do not have any NFTs',
          action: 'CHECK_NFT_OWNER'
        }
      }
    ],
    [
      {
        user: '{{user1}}',
        content: { text: 'CHECK_NFT_OWNER' } as CheckNFTContent
      },
      {
        user: '{{agentName}}',
        content: {
          text: 'looks like you do not have any NFTs',
          action: 'CHECK_NFT_OWNER'
        }
      }
    ],
    [
      {
        user: '{{user1}}',
        content: { text: 'CHECK_NFT_OWNER' } as CheckNFTContent
      },
      {
        user: '{{agentName}}',
        content: {
          text: 'looks like you do not have any NFTs',
          action: 'CHECK_NFT_OWNER'
        }
      }
    ],
  ],
  validate: async (runtime: IAgentRuntime, message: Memory, state?: State): Promise<boolean> => {
    try {
      const content = message.content as CheckNFTContent;
      if (typeof content.text !== 'string') {
        return false;
      }
      const parts = content.text.split(/\s+/);
      return parts.length === 3 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[2]));
    } catch {
      return false;
    }
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state?: State): Promise<CheckNFTResponse> => {
    const contractAddress = "0x60e4d786628fea6478f785a6d7e704777c86a7c6";
    const userAddress = "0x0000000000000000000000000000000000000000";
    try {
      elizaLogger.log("Starting blockchain chat handler");

      const blockchainService = runtime.services.get(
        "alchemy-api" as ServiceType
      ) as AlchemyApiService;

      if (!blockchainService) {
        elizaLogger.error("Nebula blockchain service is not available");
        throw new Error("Nebula blockchain service is not available");
      }

      const response = await blockchainService.checkNFT(
        contractAddress,
        userAddress
      );

      // callback({ text: response, content: {} });
      return { success: true, response: response.ownedNfts.length > 0 ? "true" : "false" };
    } catch (error) {
      elizaLogger.error("Nebula blockchain chat failed:", error);
      throw new Error(`Nebula blockchain chat failed: ${error.message}`);
    }
  }
};
