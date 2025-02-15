/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config, { dev, isServer }) => {
        if (dev) {
            config.watchOptions = {
                poll: 1000,
                ignored: /node_modules/
            }
        }
        return config
    },
    images: {
        unoptimized: true
    }
}

module.exports = nextConfig