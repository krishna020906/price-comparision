/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
        // Amazon images
        {
            protocol: 'https',
            hostname: 'm.media-amazon.com',
            pathname: '/**'
        },
        // Flipkart (example hosts — check actual hostnames in your debug screenshots)
        {
            protocol: 'https',
            hostname: 'rukminim1.flixcart.com',
            pathname: '/**'
        },
         { protocol: 'https', hostname: 'images-eu.ssl-images-amazon.com', pathname: '/**' },
        ],
    },
};

export default nextConfig;
