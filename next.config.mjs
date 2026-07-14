/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "img.clerk.com",
            }
        ]
    },
    allowedDevOrigins: ['192.168.42.142'],
};

export default nextConfig;
