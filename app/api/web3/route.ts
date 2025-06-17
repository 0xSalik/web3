import { NextResponse } from "next/server";

const POCKETBASE_URL = process.env.POCKETBASE_URL || "https://pb.sal.lol";
const POCKETBASE_COLLECTION = "token_data";

interface PocketBaseRecord {
  id: string;
  current_index: number;
  available_tokens: number;
  token_value: number;
  solana_price: number;
  price_change_24h: number;
  volume_24h: number;
  market_cap: number;
  last_updated: string;
  created: string;
  updated: string;
}

interface TokenData {
  currentIndex: number;
  availableTokens: number;
  tokenValue: number;
  solanaPrice: number;
  totalValue: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: string;
}

export async function GET() {
  try {
    // Fetch the latest record from PocketBase
    const response = await fetch(
      `${POCKETBASE_URL}/api/collections/${POCKETBASE_COLLECTION}/records?sort=-created&perPage=1`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Add cache control to ensure fresh data
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        `PocketBase API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      // Return default values if no data found
      return NextResponse.json({
        currentIndex: 0,
        availableTokens: 0,
        tokenValue: 0,
        solanaPrice: 0,
        totalValue: 0,
        priceChange24h: 0,
        volume24h: 0,
        marketCap: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    const record: PocketBaseRecord = data.items[0];

    // Transform PocketBase data to match our frontend interface
    const tokenData: TokenData = {
      currentIndex: record.current_index,
      availableTokens: record.available_tokens,
      tokenValue: record.token_value,
      solanaPrice: record.solana_price,
      totalValue:
        record.available_tokens * record.token_value * record.solana_price,
      priceChange24h: record.price_change_24h,
      volume24h: record.volume_24h,
      marketCap: record.market_cap,
      lastUpdated: record.last_updated,
    };

    return NextResponse.json(tokenData);
  } catch (error) {
    console.error("Error fetching token data:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch token data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Optional: POST endpoint to update token data
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(
      `${POCKETBASE_URL}/api/collections/${POCKETBASE_COLLECTION}/records`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_index: body.currentIndex,
          available_tokens: body.availableTokens,
          token_value: body.tokenValue,
          solana_price: body.solanaPrice,
          price_change_24h: body.priceChange24h,
          volume_24h: body.volume24h,
          market_cap: body.marketCap,
          last_updated: new Date().toISOString(),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `PocketBase API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error("Error creating token data:", error);

    return NextResponse.json(
      {
        error: "Failed to create token data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
