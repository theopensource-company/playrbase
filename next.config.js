import withNextIntlFactory from 'next-intl/plugin';
const withNextIntl = withNextIntlFactory('./src/locales/index.ts');

/** @type {import('next').NextConfig} */
const nextConfig = withNextIntl({
    reactStrictMode: true,
    swcMinify: true,
    images: {
        unoptimized: true,
    },
    experimental: {
        esmExternals: 'loose',
    },
    webpack(config) {
        config.module.rules.push({
            test: /\.svg$/i,
            issuer: /\.[jt]sx?$/,
            use: ['@svgr/webpack'],
        });

        return config;
    },
});

export default nextConfig;
