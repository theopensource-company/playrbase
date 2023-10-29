import withNextIntlFactory from 'next-intl/plugin';
const withNextIntl = withNextIntlFactory('./src/locales/index.ts');

/** @type {import('next').NextConfig} */
const nextConfig = withNextIntl({
    reactStrictMode: true,
    swcMinify: true,
    images: {
        unoptimized: true,
    },
    webpack: (config) => {
        config.externals.push({
            'utf-8-validate': 'commonjs utf-8-validate',
            bufferutil: 'commonjs bufferutil',
        });
        return config;
    },
    experimental: {
        webpackBuildWorker: true,
        esmExternals: 'loose',
    },
});

export default nextConfig;
