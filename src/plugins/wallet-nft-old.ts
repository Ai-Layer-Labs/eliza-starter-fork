// import { Plugin, IAgentRuntime } from "@elizaos/core";
// import { ethers } from "ethers";
// import { Alchemy, Network } from "alchemy-sdk";

// // Extend IAgentRuntime interface to include message handling methods
// declare module "@elizaos/core" {
//   interface IAgentRuntime {
//     on(event: string, handler: (...args: any[]) => Promise<any>): void;
//   }
// }

// // Declare global window interface with ethereum property
// declare global {
//   interface Window {
//     ethereum?: any;
//   }
// }

// interface WalletNFTPluginConfig {
//   alchemyApiKey: string;
//   network: Network;
// }

// export class WalletNFTPlugin implements Plugin {
//   name = "wallet-nft";
//   description = "Plugin for wallet connection and NFT checking";
//   private provider: ethers.BrowserProvider | null = null;
//   private signer: ethers.JsonRpcSigner | null = null;
//   private alchemy: Alchemy | null = null;
//   private connectedAddress: string | null = null;

//   constructor(private config: WalletNFTPluginConfig) {
//     this.alchemy = new Alchemy({
//       apiKey: config.alchemyApiKey,
//       network: config.network,
//     });
//   }

//   async initialize(runtime: IAgentRuntime): Promise<void> {
//     // Register message handlers using event emitter pattern
//     runtime.on("connect_wallet", async () => {
//       return await this.connectWallet();
//     });

//     runtime.on("check_nfts", async (contractAddress: string) => {
//       return await this.checkNFTs(contractAddress);
//     });
//   }

//   private async connectWallet(): Promise<{ success: boolean; address?: string; error?: string }> {
//     try {
//       if (!window.ethereum) {
//         return { success: false, error: "MetaMask not installed" };
//       }

//       this.provider = new ethers.BrowserProvider(window.ethereum);
//       const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

//       if (accounts.length === 0) {
//         return { success: false, error: "No accounts found" };
//       }

//       this.signer = await this.provider.getSigner();
//       this.connectedAddress = accounts[0];

//       return { success: true, address: this.connectedAddress };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   private async checkNFTs(contractAddress: string): Promise<{ success: boolean; nfts?: any[]; error?: string }> {
//     try {
//       if (!this.connectedAddress) {
//         return { success: false, error: "Wallet not connected" };
//       }

//       if (!this.alchemy) {
//         return { success: false, error: "Alchemy not initialized" };
//       }

//       // Get all NFTs for the connected address
//       const nfts = await this.alchemy.nft.getNftsForOwner(this.connectedAddress);

//       // Filter NFTs by contract address if provided
//       const filteredNfts = contractAddress
//         ? nfts.ownedNfts.filter(nft => nft.contract.address.toLowerCase() === contractAddress.toLowerCase())
//         : nfts.ownedNfts;

//       return { success: true, nfts: filteredNfts };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }
// }