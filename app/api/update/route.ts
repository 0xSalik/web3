import { NextResponse } from "next/server";

const POCKETBASE_URL = process.env.POCKETBASE_URL || "https://pb.sal.lol";
const POCKETBASE_COLLECTION = "token_data";

export async function GET() {
  try {
    // Get the latest record
    const getResponse = await fetch(
      `${POCKETBASE_URL}/api/collections/${POCKETBASE_COLLECTION}/records?sort=-created&perPage=1`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!getResponse.ok) {
      throw new Error(`Failed to fetch current data: ${getResponse.status}`);
    }

    const currentData = await getResponse.json();

    if (!currentData.items || currentData.items.length === 0) {
      return NextResponse.json(
        {
          error: "No existing token data found. Please initialize data first.",
        },
        { status: 404 }
      );
    }

    const latestRecord = currentData.items[0];

    // Create new record with available_tokens + 1, keep everything else the same
    const newRecordData = {
      current_index: latestRecord.current_index,
      available_tokens: latestRecord.available_tokens + 1,
      token_value: latestRecord.token_value,
      solana_price: latestRecord.solana_price,
      price_change_24h: latestRecord.price_change_24h,
      volume_24h: latestRecord.volume_24h,
      market_cap: latestRecord.market_cap,
      last_updated: new Date().toISOString(),
    };

    // Create the new record in PocketBase
    const createResponse = await fetch(
      `${POCKETBASE_URL}/api/collections/${POCKETBASE_COLLECTION}/records`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newRecordData),
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(
        `PocketBase create failed: ${createResponse.status} - ${errorText}`
      );
    }

    const newRecord = await createResponse.json();

    return NextResponse.json({
      success: true,
      message: "Token added successfully",
      data: {
        id: newRecord.id,
        availableTokens: newRecord.available_tokens,
        previousTokens: latestRecord.available_tokens,
        tokensAdded: 1,
        lastUpdated: newRecord.last_updated,
      },
    });
  } catch (error) {
    console.error("Error adding token:", error);

    return NextResponse.json(
      {
        error: "Failed to add token",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
