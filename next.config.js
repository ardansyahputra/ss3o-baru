/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Netlify kadang tidak meneruskan env var ke runtime (middleware/edge),
  // yang bikin NextAuth error "Configuration / NO_SECRET". Nilai di bawah
  // dibaca saat BUILD (Netlify selalu menyediakannya di build) lalu
  // ditanam ke bundle server, jadi tetap terbaca saat runtime.
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb"
    }
  }
};

module.exports = nextConfig;
