import { Alchemy, Network, NftTokenType } from "alchemy-sdk";
import dotenv from "dotenv";

dotenv.config();

export class AlchemyApi {
  public config = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.ARB_SEPOLIA,
    contractAddress: process.env.THINK_AGENT_CONTRACT_ADDRESS,
  };
  public alchemy: Alchemy;

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

  async getThinkAgentAddress(walletAddress: string) {
    const nfts = await this.alchemy.nft.getNftsForOwner(walletAddress);
    // verify the nft is a think agent
    console.log("nfts:", nfts);

    const thinkAgentNft = nfts.ownedNfts.find((nft) => nft.contract.address === this.config.contractAddress);
    console.log("thinkAgentNft:", thinkAgentNft);
    if (!thinkAgentNft) {
      throw new Error("No think agent nft found");
    }
    return thinkAgentNft.tokenId;
  }

  async getNFTMetadata(address: string) {
    const response = await this.alchemy.nft.getNftMetadata(this.config.contractAddress, address);
    // const nft = await this.alchemy.nft.getNftMetadata(address);
    // return nft;
    console.log("nft metadata:", response);
    // const metadata = response;
    return response;
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

// alchemy.initialize();
// console.log(alchemy.config);

// console.log("getting nft metadata:");

// // alchemy.getNFTMetadata("0x164000A29FED2c67184E22C0523c7C0596e00686");
// const nftId = await alchemy.getThinkAgentAddress("0x164000A29FED2c67184E22C0523c7C0596e00686");
// console.log("nftId:", nftId);
// const nftMetadata = await alchemy.getNFTMetadata(nftId);
// console.log("nftMetadata:", nftMetadata);