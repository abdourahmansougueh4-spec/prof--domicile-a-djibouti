import type { NextConfig } from 'next'

// ============================================================
// HEADERS DE SÉCURITÉ
// ============================================================

const securityHeaders = [
  // Empêche l'inclusion du site dans une iframe (clickjacking)
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  // Empêche le navigateur de deviner le type MIME
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Politique de référence
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Désactive les permissions sensibles du navigateur
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
  },
  // Force HTTPS
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Protection XSS (legacy mais utile)
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  // Content Security Policy (protège contre les scripts malveillants)
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel.app",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vercel.live https://*.vercel.app",
      "frame-src 'self' https://vercel.live",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
]

// ============================================================
// CONFIG NEXT.JS
// ============================================================

const nextConfig: NextConfig = {
  // Cache les informations techniques
  poweredByHeader: false,

  // Compression
  compress: true,

  // Réagir strictement en dev (bonnes pratiques)
  reactStrictMode: true,

  // Headers de sécurité sur toutes les routes
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // Cache agressif pour les assets statiques
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Empêche les redirections dangereuses
  async redirects() {
    return [
      // Si quelqu'un tente d'accéder à un ancien chemin d'admin, on le renvoie
      {
        source: '/admin',
        destination: '/',
        permanent: false,
      },
      {
        source: '/admin/:path*',
        destination: '/',
        permanent: false,
      },
    ]
  },

  // Images autorisées (Supabase Storage)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
