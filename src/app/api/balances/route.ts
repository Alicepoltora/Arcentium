import { NextRequest, NextResponse } from "next/server";
import { fetchBalances } from "@/lib/appkit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Accept connected wallet address from query param: ?address=0x...
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address") ?? undefined;

    const balances = await fetchBalances(address);
    return NextResponse.json(balances);
  } catch (error) {
    console.error("[/api/balances] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch balances",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
