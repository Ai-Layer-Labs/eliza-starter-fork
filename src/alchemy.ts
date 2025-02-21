import { Alchemy, Network } from "alchemy-sdk";

export class AlchemyApi {
  private config = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET,
  };
  private alchemy: Alchemy;

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

  async getNFTMetadata(address: string) {
    // const nft = await this.alchemy.nft.getNftMetadata(address);
    // return nft;
    return {
      metadata: {
        attributes: [
          { trait_type: "Murur Matrix", value: "1" },
        ],
      },
    };
  }
}

export const alchemy = new AlchemyApi();
