import type { NextConfig } from 'next'

const securityHeaders = [
  // Clickjacking: nothing may embed this app in a frame
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  // Never MIME-sniff responses into executable types
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Don't leak dashboard URLs (which contain workspace context) to external sites
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // This app uses no sensors/camera/mic — say so explicitly
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
  async redirects() {
    return [
      // Legacy Vercel URL → duebird.io. /api is excluded: the daily cron and the
      // Gmail OAuth callback are still invoked on this host, and a cross-host
      // redirect would drop their auth headers.
      {
        source: '/:path((?!api/).*)',
        has: [{ type: 'host', value: 'cashflow-copilot-six.vercel.app' }],
        destination: 'https://duebird.io/:path',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.duebird.io' }],
        destination: 'https://duebird.io/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
