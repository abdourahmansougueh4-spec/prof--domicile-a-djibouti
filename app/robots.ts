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
          '/abdrhmn-zou_2022-2032/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}