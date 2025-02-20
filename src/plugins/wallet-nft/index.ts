import { IAgentRuntime, Plugin } from "@elizaos/core";
import { ethers } from "ethers";
import { Alchemy, Network } from "alchemy-sdk";
import { AlchemyApiService } from "./services/alchemy-api-service.ts";


export const walletNFTPlugin: Plugin = {
  name: "WALLET_NFT",
  description:
    "Search the blockchain with alchemy for information about wallet addresses, token prices, token owners, transactions and their details.",
  actions: [],
  evaluators: [],
  providers: [],
  services: [new AlchemyApiService()],
};


declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface WalletNFTPluginConfig {
  alchemyApiKey?: string;
  network?: Network;
}

// export class WalletNFTPlugin implements Plugin {
//   name = "wallet-nft";
//   description = "Plugin for wallet connection and NFT verification";

//   private provider: ethers.BrowserProvider;
//   private alchemy: Alchemy;
//   private connectedAddress: string | null = null;

//   constructor(private config: WalletNFTPluginConfig = {}) {
//     this.config.network = this.config.network || Network.ETH_MAINNET;

//     if (typeof window !== 'undefined' && window.ethereum) {
//       this.provider = new ethers.BrowserProvider(window.ethereum);
//     }

//     if (this.config.alchemyApiKey) {
//       this.alchemy = new Alchemy({
//         apiKey: this.config.alchemyApiKey,
//         network: this.config.network
//       });
//     }
//   }

//   initialize(runtime: IAgentRuntime): void {
//     // Register actions for handling wallet and NFT functionality
//     // runtime.registerAction({
//     //   name: 'connect-wallet',
//     //   description: 'Connect to a wallet',
//     //   similes: ['Connect to MetaMask', 'Link wallet'],
//     //   examples: [[{ user: 'User', content: { text: 'connect-wallet' } }]],
//     //   validate: async () => true,
//     //   handler: this.handleConnectWallet.bind(this)
//     // });
//     runtime.registerAction({
//       name: 'check-nft',
//       description: 'Check if the user has an NFT',
//       similes: ['Check NFT ownership', 'Verify NFT holdings'],
//       examples: [[{ user: 'User', content: { text: 'check-nft' } }]],
//       validate: async () => true,
//       handler: this.handleCheckNFT.bind(this)
//     });
//   }

//   private async handleConnectWallet(): Promise<string> {
//     if (!this.provider) {
//       throw new Error('No Web3 provider available');
//     }

//     try {
//       const accounts = await this.provider.send("eth_requestAccounts", []);
//       this.connectedAddress = accounts[0];
//       return this.connectedAddress;
//     } catch (error) {
//       throw new Error(`Failed to connect wallet: ${error.message}`);
//     }
//   }

//   private async handleCheckNFT(contractAddress: string, userAddress: string): Promise<boolean> {
//     if (!this.alchemy) {
//       throw new Error('Alchemy API key not configured');
//     }

//     if (!this.connectedAddress) {
//       throw new Error('No wallet connected');
//     }

//     console.log("Checking NFTs for address:", contractAddress);

//     try {
//       const nfts = await this.alchemy.nft.getNftsForOwner(this.connectedAddress);
//       return nfts.ownedNfts.some(nft =>
//         nft.contract.address.toLowerCase() === contractAddress.toLowerCase()
//       );
//     } catch (error) {
//       throw new Error(`Failed to check NFTs: ${error.message}`);
//     }
//   }
// }


// export function createWalletNFTPlugin(config?: WalletNFTPluginConfig): Plugin {
//   return new WalletNFTPlugin(config);
// }
