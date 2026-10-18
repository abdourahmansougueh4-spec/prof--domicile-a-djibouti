import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://prof-domicile-a-djibouti.vercel.app'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/espace-parent/',
          '/espace-professeur/',
          '/api/',
          '/zx-4f8b2e-9d3a-ctrl/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}