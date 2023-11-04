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
});

export default nextConfig;
