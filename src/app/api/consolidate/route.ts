import { NextResponse } from "next/server";
import { consolidate } from "@/lib/appkit";
import type { ConsolidateRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ConsolidateRequest;

    // Базовая валидация
    if (!body.sourceChains?.length) {
      return NextResponse.json(
        { error: "sourceChains is required" },
        { status: 400 }
      );
    }
    if (!body.targetChainId) {
      return NextResponse.json(
        { error: "targetChainId is required" },
        { status: 400 }
      );
    }
    if (!body.amount || parseFloat(body.amount) <= 0) {
      return NextResponse.json(
        { error: "amount must be > 0" },
        { status: 400 }
      );
    }
    if (!body.recipientAddress) {
      // В demo-режиме используем placeholder адрес
      body.recipientAddress = "0x0000000000000000000000000000000000000001";
    }

    const result = await consolidate(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Consolidation failed", transactions: [] },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[/api/consolidate] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
