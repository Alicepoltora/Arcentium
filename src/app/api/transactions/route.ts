import { NextResponse } from "next/server";
import { fetchTransactions } from "@/lib/appkit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const transactions = await fetchTransactions();
    return NextResponse.json(transactions);
  } catch (error) {
    console.error("[/api/transactions] Error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
