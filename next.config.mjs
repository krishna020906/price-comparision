/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: [
            "images-na.ssl-images-amazon.com",
            "m.media-amazon.com",
            // add any domains your image URLs use
        ],
    },
};

export default nextConfig;
