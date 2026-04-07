import { NextResponse } from "next/server";
import { logger } from "@/lib/otel/logger";
import { metrics } from "@opentelemetry/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const endpoint = process.env.GRAFANA_OTLP_ENDPOINT;
  const tokenSet = !!process.env.GRAFANA_OTLP_TOKEN;

  const config = {
    otlpEndpoint: endpoint ?? "(not set)",
    otlpTokenSet: tokenSet,
    nodeEnv: process.env.NODE_ENV ?? "(not set)",
    nodeVersion: process.version,
  };

  // Emit a test log — will appear in Grafana Loki if the pipeline is working.
  logger.info("[loki-test] debug ping", {
    ...config,
    ts: new Date().toISOString(),
  });

  // Emit a test metric — will appear in Grafana Mimir/metrics if the pipeline is working.
  try {
    const meter = metrics.getMeter("portfolio", "1.0.0");
    meter.createCounter("portfolio.debug.loki_test").add(1, { env: process.env.NODE_ENV ?? "unknown" });
  } catch (err) {
    // SDK not yet started — safe to ignore
    logger.warn("[loki-test] could not emit test metric", { error: String(err) });
  }

  return NextResponse.json({
    ok: true,
    message: "Test log + metric emitted. Check Grafana Loki (label: service_name=portfolio) and Mimir (metric: portfolio_debug_loki_test_total).",
    config,
  });
}
