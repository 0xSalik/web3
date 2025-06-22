// app/api/tokens/claim/route.ts
import { PocketBaseTokenSystem, TokenAPI } from "@/app/lib/token-system";

const tokenSystem = new PocketBaseTokenSystem(
  process.env.POCKETBASE_URL || "https://pb.sal.lol",
  process.env.TOKEN_MINT_ADDRESS!,
  process.env.TREASURY_PRIVATE_KEY!,
  "devnet",
  "token_data"
);

const tokenAPI = new TokenAPI(tokenSystem);

export async function POST() {
  return tokenAPI.claimTokens();
}
