import { logs, SeverityNumber } from "@opentelemetry/api-logs";

const LOGGER_NAME = "portfolio";

function getLogger() {
  return logs.getLogger(LOGGER_NAME, "1.0.0");
}

type LogLevel = "debug" | "info" | "warn" | "error";

const SEVERITY: Record<LogLevel, SeverityNumber> = {
  debug: SeverityNumber.DEBUG,
  info: SeverityNumber.INFO,
  warn: SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
};

function log(
  level: LogLevel,
  message: string,
  attributes?: Record<string, string | number | boolean>
): void {
  // Also write to stdout so local dev has visibility even without Grafana
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  fn(`[${level.toUpperCase()}] ${message}`, attributes ?? "");

  try {
    getLogger().emit({
      severityNumber: SEVERITY[level],
      severityText: level.toUpperCase(),
      body: message,
      attributes,
    });
  } catch {
    // OTel SDK not yet registered — no-op (safe during startup)
  }
}

export const logger = {
  debug: (msg: string, attrs?: Record<string, string | number | boolean>) =>
    log("debug", msg, attrs),
  info: (msg: string, attrs?: Record<string, string | number | boolean>) =>
    log("info", msg, attrs),
  warn: (msg: string, attrs?: Record<string, string | number | boolean>) =>
    log("warn", msg, attrs),
  error: (msg: string, attrs?: Record<string, string | number | boolean>) =>
    log("error", msg, attrs),
};
