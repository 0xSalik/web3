/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  transfer,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

interface TokenData {
  id: string;
  current_index: number;
  available_tokens: number;
  token_value: number;
  solana_price: number;
  price_change_24h: number;
  volume_24h: number;
  market_cap: number;
  last_updated: string;
  solana_wallet?: string;
  total_tokens_claimed?: number;
  last_claim?: string;
}

export class PocketBaseTokenSystem {
  private connection: Connection;
  private treasuryKeypair: Keypair;
  private mint: PublicKey;
  private pocketbaseUrl: string;
  private collectionName: string;

  // Configuration
  private readonly CONVERSION_RATE = 1; // 1 available_token = 1 Solana token
  private readonly MIN_CLAIM_AMOUNT = 1;
  private readonly DECIMALS = 9;

  constructor(
    pocketbaseUrl: string,
    mintAddress: string,
    treasuryPrivateKey: string,
    network: "devnet" | "mainnet-beta" = "devnet",
    collectionName: string = "token_data"
  ) {
    this.connection = new Connection(clusterApiUrl(network), "confirmed");
    this.mint = new PublicKey(mintAddress);
    this.treasuryKeypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(treasuryPrivateKey))
    );
    this.pocketbaseUrl = pocketbaseUrl;
    this.collectionName = collectionName;
  }

  /**
   * Get the latest token data from PocketBase
   */
  private async getLatestTokenData(): Promise<TokenData> {
    const response = await fetch(
      `${this.pocketbaseUrl}/api/collections/${this.collectionName}/records?sort=-created&perPage=1`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch token data: ${response.status}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      throw new Error("No token data found");
    }

    return data.items[0];
  }

  /**
   * Update token data in PocketBase
   */
  private async updateTokenData(
    recordId: string,
    updates: Partial<TokenData>
  ): Promise<TokenData> {
    const response = await fetch(
      `${this.pocketbaseUrl}/api/collections/${this.collectionName}/records/${recordId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update token data: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Link Solana wallet to the token data record
   */
  async linkWallet(walletAddress: string): Promise<void> {
    try {
      const publicKey = new PublicKey(walletAddress);

      const latestData = await this.getLatestTokenData();

      await this.updateTokenData(latestData.id, {
        solana_wallet: walletAddress,
        total_tokens_claimed: latestData.total_tokens_claimed || 0,
      });

      console.log(`✅ Wallet linked: ${walletAddress}`);

      // Auto-claim if there are available tokens
      if (latestData.available_tokens >= this.MIN_CLAIM_AMOUNT) {
        console.log(
          `Found ${latestData.available_tokens} available tokens, auto-claiming...`
        );
        await this.claimTokens();
      }
    } catch (error) {
      console.error("Error linking wallet:", error);
      throw error;
    }
  }

  /**
   * Claim available tokens and convert them to real Solana tokens
   */
  async claimTokens(): Promise<string> {
    try {
      const latestData = await this.getLatestTokenData();

      if (!latestData.solana_wallet) {
        throw new Error("No wallet linked. Call linkWallet() first.");
      }

      if (latestData.available_tokens < this.MIN_CLAIM_AMOUNT) {
        throw new Error(
          `Need at least ${this.MIN_CLAIM_AMOUNT} available tokens to claim`
        );
      }

      const recipientWallet = new PublicKey(latestData.solana_wallet);
      const tokenAmount = Math.floor(
        latestData.available_tokens * this.CONVERSION_RATE
      );

      console.log(
        `Converting ${latestData.available_tokens} available tokens to ${tokenAmount} Solana tokens`
      );

      // Get or create user's token account
      const userTokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        this.treasuryKeypair,
        this.mint,
        recipientWallet
      );

      // Get treasury token account
      const treasuryTokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        this.treasuryKeypair,
        this.mint,
        this.treasuryKeypair.publicKey
      );

      // Transfer tokens from treasury to user
      const signature = await transfer(
        this.connection,
        this.treasuryKeypair,
        treasuryTokenAccount.address,
        userTokenAccount.address,
        this.treasuryKeypair,
        tokenAmount * Math.pow(10, this.DECIMALS)
      );

      // Update database - reset available_tokens to 0, update claimed total
      await this.updateTokenData(latestData.id, {
        available_tokens: 0,
        total_tokens_claimed:
          (latestData.total_tokens_claimed || 0) + tokenAmount,
        last_claim: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      });

      console.log(`✅ Successfully distributed ${tokenAmount} tokens!`);
      console.log(`Transaction signature: ${signature}`);

      return signature;
    } catch (error) {
      console.error("Error claiming tokens:", error);
      throw error;
    }
  }

  /**
   * Get current status and stats
   */
  async getStats(): Promise<any> {
    try {
      const latestData = await this.getLatestTokenData();
      let onChainBalance = 0;

      if (latestData.solana_wallet) {
        onChainBalance = await this.getTokenBalance(latestData.solana_wallet);
      }

      return {
        availableTokens: latestData.available_tokens,
        onChainBalance,
        totalClaimed: latestData.total_tokens_claimed || 0,
        walletLinked: !!latestData.solana_wallet,
        walletAddress: latestData.solana_wallet,
        canClaim: latestData.available_tokens >= this.MIN_CLAIM_AMOUNT,
        lastClaim: latestData.last_claim,
        tokenValue: latestData.token_value,
        lastUpdated: latestData.last_updated,
      };
    } catch (error) {
      console.error("Error getting stats:", error);
      throw error;
    }
  }

  /**
   * Get user's on-chain token balance
   */
  async getTokenBalance(walletAddress: string): Promise<number> {
    try {
      const wallet = new PublicKey(walletAddress);
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        this.treasuryKeypair,
        this.mint,
        wallet
      );

      const account = await getAccount(this.connection, tokenAccount.address);
      return Number(account.amount) / Math.pow(10, this.DECIMALS);
    } catch (error) {
      console.error("Error getting token balance:", error);
      return 0;
    }
  }

  /**
   * Force sync - claim tokens if wallet is linked and tokens are available
   */
  async syncTokens(): Promise<void> {
    try {
      const latestData = await this.getLatestTokenData();

      if (
        latestData.solana_wallet &&
        latestData.available_tokens >= this.MIN_CLAIM_AMOUNT
      ) {
        console.log("Auto-syncing available tokens...");
        await this.claimTokens();
      } else if (!latestData.solana_wallet) {
        console.log("No wallet linked - tokens remain as available_tokens");
      } else {
        console.log(
          `Only ${latestData.available_tokens} available tokens, need ${this.MIN_CLAIM_AMOUNT} minimum`
        );
      }
    } catch (error) {
      console.error("Error syncing tokens:", error);
      throw error;
    }
  }

  /**
   * Add wallet fields to existing token_data collection (run once)
   */
  async initializeWalletFields(): Promise<void> {
    try {
      const latestData = await this.getLatestTokenData();

      if (!latestData.hasOwnProperty("solana_wallet")) {
        await this.updateTokenData(latestData.id, {
          solana_wallet: undefined,
          total_tokens_claimed: 0,
          last_claim: undefined,
        });
        console.log("Wallet fields initialized");
      }
    } catch (error) {
      console.error("Error initializing wallet fields:", error);
      throw error;
    }
  }
}

// Next.js API route example for linking wallet
export class TokenAPI {
  private tokenSystem: PocketBaseTokenSystem;

  constructor(tokenSystem: PocketBaseTokenSystem) {
    this.tokenSystem = tokenSystem;
  }

  // API endpoint to link wallet
  async linkWallet(request: Request): Promise<Response> {
    try {
      const { walletAddress } = await request.json();
      await this.tokenSystem.linkWallet(walletAddress);

      return Response.json({
        success: true,
        message: "Wallet linked successfully",
      });
    } catch (error: any) {
      return Response.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
  }

  // API endpoint to claim tokens
  async claimTokens(): Promise<Response> {
    try {
      const signature = await this.tokenSystem.claimTokens();

      return Response.json({
        success: true,
        signature,
        message: "Tokens claimed successfully",
      });
    } catch (error: any) {
      return Response.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
  }

  // API endpoint to get stats
  async getStats(): Promise<Response> {
    try {
      const stats = await this.tokenSystem.getStats();
      return Response.json({ success: true, data: stats });
    } catch (error: any) {
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
  }

  // API endpoint to sync tokens
  async syncTokens(): Promise<Response> {
    try {
      await this.tokenSystem.syncTokens();
      return Response.json({
        success: true,
        message: "Tokens synced successfully",
      });
    } catch (error: any) {
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
  }
}
