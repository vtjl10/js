import createMDX from "@next/mdx";
import remarkGfm from "remark-gfm";
import { redirects } from "./redirects.mjs";

const ContentSecurityPolicy = `
  default-src 'self';
  img-src * data: blob:;
  media-src * data: blob:;
  object-src 'none';
  style-src 'self' 'unsafe-inline';
  font-src 'self';
  frame-src * data:;
  script-src 'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval' 'inline-speculation-rules' thirdweb.com *.thirdweb.com thirdweb-dev.com *.thirdweb-dev.com vercel.live js.stripe.com;
  connect-src * data: blob:;
  worker-src 'self' blob:;
  block-all-mixed-content;
`;

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy.replace(/\s{2,}/g, " ").trim(),
  },
];

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverSourceMaps: false,
    webpackBuildWorker: true,
    webpackMemoryOptimizations: true,
  },
  async headers() {
    return [
      {
        headers: securityHeaders,
        source: "/(.*)",
      },
    ];
  },
  pageExtensions: ["mdx", "tsx", "ts"],
  productionBrowserSourceMaps: false,
  redirects,
  async rewrites() {
    return [
      {
        destination: "https://us-assets.i.posthog.com/static/:path*",
        source: "/_ph/static/:path*",
      },
      {
        destination: "https://us.i.posthog.com/:path*",
        source: "/_ph/:path*",
      },
      {
        destination: "https://us.i.posthog.com/decide",
        source: "/_ph/decide",
      },
    ];
  },
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default withMDX(nextConfig);
