import { NextResponse } from "next/server";
import { isConfigured } from "@/lib/env";
import packageJson from "@/package.json";

/**
 * Liveness/readiness probe for deployment platforms and monitors.
 * Never exposes secret values — only whether configuration is present.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "ok",
    version: packageJson.version,
    uptime: Math.round(process.uptime()),
    configured: isConfigured(),
  });
}
