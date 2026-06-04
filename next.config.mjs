/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { webpack }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    config.externals = config.externals || [];
    if (Array.isArray(config.externals)) {
      config.externals.push("pino-pretty", "lokijs", "encoding");
    }
    // Optional wallet connectors pulled in by Reown's bundled @wagmi/connectors
    // and by @wagmi/core's experimental "tempo" connector. We don't use them.
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "porto/internal": false,
      "porto/wagmi": false,
      porto: false,
      "@metamask/connect-evm": false,
      "@base-org/account": false,
      "@base-org/account/dist/index.js": false,
      "@base-org/account/dist/index.node.js": false,
      "@wagmi/core/tempo": false,
    };
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^accounts$/,
      })
    );
    return config;
  },
};

export default nextConfig;
