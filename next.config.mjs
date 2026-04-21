import createNextIntlPlugin from "next-intl/plugin";
import { validateEnv } from "./src/services/validateEnv.mjs";

const env = validateEnv();
const devOrigins = env.NEXT_ALLOWED_DEV_ORIGINS?.split(",") ?? [
  "127.0.0.1",
  "127.0.0.1:3000",
  "127.0.0.1:9012",
  "localhost:3000"
];
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    ...env,
    NEXT_PUBLIC_DEMO_MODE: env.DEMO_MODE,
    NEXT_PUBLIC_ENABLED_DATA_SOURCES: env.ENABLED_DATA_SOURCES,
    NEXT_PUBLIC_DONOR_ID_INPUT_METHOD: env.DONOR_ID_INPUT_METHOD,
    NEXT_PUBLIC_DONOR_SURVEY_ENABLED: env.DONOR_SURVEY_ENABLED,
    NEXT_PUBLIC_DONOR_SURVEY_LINK: env.DONOR_SURVEY_LINK,
    NEXT_PUBLIC_FEEDBACK_SURVEY_ENABLED: env.FEEDBACK_SURVEY_ENABLED,
    NEXT_PUBLIC_FEEDBACK_SURVEY_LINK: env.FEEDBACK_SURVEY_LINK
  },
  allowedDevOrigins: devOrigins,
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
      allowedOrigins: [...devOrigins, "https://nyu.dona.tf.uni-bielefeld.de"]
    }
  },
  // Tell Next.js to skip bundling sql.js - it will be loaded dynamically at runtime
  transpilePackages: [],
  webpack: (config, { isServer }) => {
    // Ignores fs module so that sql.js can be used in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
      // Also add alias to ensure fs is not bundled
      config.resolve.alias = {
        ...config.resolve.alias,
        fs: false,
        path: false,
      };
      // Mark sql.js as external for client bundles - it will be loaded via CDN or dynamic import
      config.externals = config.externals || [];
      config.externals.push({
        'sql.js': 'sql.js',
        'sql.js/dist/sql-wasm.js': 'sql.js'
      });
    }
    // Allows loading svg from .svg file with SVGR
    config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            svgo: false,
            titleProp: true,
            ref: true,
          },
        },
      ],
    });
    return config;
  }
};

export default withNextIntl(nextConfig);
