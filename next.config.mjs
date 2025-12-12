/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ['better-sqlite3', 'pdf-parse', 'mongoose', 'puppeteer-extra', 'puppeteer-extra-plugin-stealth', 'puppeteer-core'],
    output: 'standalone',
    eslint: {
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;
