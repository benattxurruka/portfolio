import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { NodeSDK } = await import("@opentelemetry/sdk-node");
    const { OTLPTraceExporter } = await import(
      "@opentelemetry/exporter-trace-otlp-http"
    );
    const { OTLPMetricExporter } = await import(
      "@opentelemetry/exporter-metrics-otlp-http"
    );
    const { OTLPLogExporter } = await import(
      "@opentelemetry/exporter-logs-otlp-http"
    );
    const { PeriodicExportingMetricReader } = await import(
      "@opentelemetry/sdk-metrics"
    );
    const { SimpleLogRecordProcessor } = await import("@opentelemetry/sdk-logs");
    const { Resource } = await import("@opentelemetry/resources");
    const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = await import(
      "@opentelemetry/semantic-conventions"
    );
    const { getNodeAutoInstrumentations } = await import(
      "@opentelemetry/auto-instrumentations-node"
    );
    const { diag, DiagConsoleLogger, DiagLogLevel } =
      await import("@opentelemetry/api");
    const { logs, SeverityNumber } = await import("@opentelemetry/api-logs");

    // Print OTel SDK internal warnings/errors to stdout.
    // This exposes auth failures, unreachable endpoints, serialisation errors, etc.
    // DiagLogLevel.ERROR only — the WARN-level "could not deserialize response"
    // from the -otlp-http exporters is harmless (Grafana returns an empty 200
    // body which is spec-compliant but trips JSON.parse). Real failures such as
    // auth errors or unreachable endpoints are logged at ERROR level.
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

    const otlpEndpoint = process.env.GRAFANA_OTLP_ENDPOINT;
    const otlpToken    = process.env.GRAFANA_OTLP_TOKEN;

    if (!otlpEndpoint || !otlpToken) {
      console.warn(
        "[otel] GRAFANA_OTLP_ENDPOINT or GRAFANA_OTLP_TOKEN not set — skipping OTel setup"
      );
      return;
    }

    console.info(`[otel] Configuring SDK — endpoint: ${otlpEndpoint}`);

    // Only pass Authorization — proto exporters set Content-Type automatically.
    const headers = {
      Authorization: `Basic ${Buffer.from(otlpToken).toString("base64")}`,
    };

    const sdk = new NodeSDK({
      resource: new Resource({
        [ATTR_SERVICE_NAME]: "portfolio",
        [ATTR_SERVICE_VERSION]: process.env.npm_package_version ?? "0.0.0",
        "deployment.environment": process.env.NODE_ENV ?? "development",
      }),

      traceExporter: new OTLPTraceExporter({
        url: `${otlpEndpoint}/v1/traces`,
        headers,
      }),

      metricReader: new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({
          url: `${otlpEndpoint}/v1/metrics`,
          headers,
        }),
        exportIntervalMillis: 30_000,
      }),

      // SimpleLogRecordProcessor ships every record immediately as its own
      // HTTP request — no buffering delay.  If the export fails the OTel
      // DiagConsoleLogger (set above) will print the error to stdout.
      logRecordProcessors: [
        new SimpleLogRecordProcessor(
          new OTLPLogExporter({ url: `${otlpEndpoint}/v1/logs`, headers })
        ),
      ],

      instrumentations: [
        getNodeAutoInstrumentations({
          "@opentelemetry/instrumentation-fs": { enabled: false },
        }),
      ],
    });

    sdk.start();
    console.info("[otel] SDK started");

    // ── Startup heartbeat ────────────────────────────────────────────────
    // This log record is exported immediately (SimpleLogRecordProcessor) and
    // should appear in Grafana Loki within seconds of server start.
    // Loki query to verify:  {service_name="portfolio"} | json
    logs.getLogger("portfolio", "1.0.0").emit({
      severityNumber: SeverityNumber.INFO,
      severityText: "INFO",
      body: "[otel] startup heartbeat — Loki pipeline active",
      attributes: {
        otlp_endpoint:  otlpEndpoint,
        environment:    process.env.NODE_ENV ?? "development",
        node_version:   process.version,
      },
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
