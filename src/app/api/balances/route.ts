import { NextResponse } from "next/server";
import { fetchBalances } from "@/lib/appkit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const balances = await fetchBalances();
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
