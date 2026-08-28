import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  webpack(config) {
    // These are optional peer dependencies of @opentelemetry/sdk-node and
    // @opentelemetry/instrumentation-winston that we don't use. Aliasing them
    // to `false` tells webpack to resolve them as empty modules instead of
    // emitting "Module not found" errors.
    config.resolve.alias = {
      ...config.resolve.alias,
      "@opentelemetry/exporter-jaeger": false,
      "@opentelemetry/winston-transport": false,
    };
    return config;
  },
  // No `images.remotePatterns` for the R2 photo host: photo galleries are
  // served via R2Image (pre-generated WebP derivatives, plain <img>) rather
  // than next/image, so they never go through Vercel's Image Optimization
  // API. next/image is still used for small local static assets only.
};

export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
    automaticVercelMonitors: true,
  },
});
