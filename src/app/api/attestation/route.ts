/**
 * Proxy for Circle attestation API.
 * Avoids CORS issues when calling from the browser directly.
 *
 * GET /api/attestation?domain={sourceDomain}&txHash={burnTxHash}
 *
 * Forwards to: https://iris-api-sandbox.circle.com/v1/messages/{domain}/{txHash}
 *
 * Response shape:
 *   { messages: [{ status: "complete"|"pending", message: "0x...", attestation: "0x..." }] }
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");
  const txHash = searchParams.get("txHash");

  if (!domain || !txHash) {
    return NextResponse.json(
      { error: "Missing required params: domain, txHash" },
      { status: 400 }
    );
  }

  const url = `https://iris-api-sandbox.circle.com/v1/messages/${domain}/${txHash}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      // Disable Next.js caching — we want fresh attestation status every poll
      cache: "no-store",
    });

    if (!res.ok) {
      // Circle returns 404 while tx is not yet indexed — treat as pending
      return NextResponse.json({ messages: [] }, { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[attestation proxy] fetch error:", error);
    // Return empty rather than 500 so client keeps polling
    return NextResponse.json({ messages: [] }, { status: 200 });
  }
}
