import {
  Service,
  ServiceType,
  IAgentRuntime,
  Memory,
  State,
  elizaLogger,
} from "@elizaos/core";
import { Alchemy, Network, OwnedNftsResponse } from "alchemy-sdk";

export class AlchemyApiService implements Service {
  private config = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET,
  };
  private alchemy: Alchemy;

  get serviceType(): ServiceType {
    return "alchemy-api" as ServiceType;
  }

  name = "alchemy-api-service";
  description =
    "Manages authentication and sessions with the alchemy api";

  async initialize(): Promise<void> {
    const secretKey = process.env.ALCHEMY_API_KEY;
    if (!secretKey) {
      throw new Error(
        "ALCHEMY_API_KEY environment variable is required"
      );
    }

    try {
      this.alchemy = new Alchemy(this.config);
    } catch (error) {
      console.error(
        "Failed to initialize alchemy api service:",
        error
      );
      throw error;
    }
  }

  async checkNFT(contractAddress: string, userAddress: string): Promise<OwnedNftsResponse> {
    elizaLogger.log("Alchemy checking NFT: ", contractAddress, userAddress);

    const response = await this.alchemy.nft.getNftsForOwner(userAddress, {
      contractAddresses: [contractAddress],
    });

    // const address = "johnnyclem.eth";

    // MAYC contract address
    // const contractAddress = "0x60e4d786628fea6478f785a6d7e704777c86a7c6";

    try {
      // Use alchemy SDK instead of raw fetch
      const response = await this.alchemy.nft.verifyNftOwnership(
        userAddress,
        contractAddress
      );
      console.log(`\nIs ${userAddress} a MAYC holder? ${response}`);
    } catch (err) {
      console.error(err);
    }

    return response;

    // if (!response) {
    //   throw new Error(`Chat request failed: ${response.statusText}`);
    // }

    // const data = await response.json();
    // elizaLogger.log("Nebula response:", data);
    // return data?.message;
  }

  async handler(
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State
  ): Promise<OwnedNftsResponse> {
    try {
      return await this.checkNFT(
        message.content.contractAddress as string,
        message.content.userAddress as string
      );
    } catch (error) {
      console.error("Error in AlchemyApiService handler:", error);
      throw error;
    }
  }
}
