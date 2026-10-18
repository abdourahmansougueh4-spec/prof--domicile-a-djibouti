import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = "https://prof-domicile-a-djibouti.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Djib Superprof | Professeurs vérifiés à Djibouti",
    template: "%s | Djib Superprof",
  },
  description:
    "Djib Superprof — Trouvez un professeur vérifié à Djibouti pour du soutien scolaire, Coran, langues, informatique, arts et plus. Inscription gratuite.",
  keywords: [
    "djib superprof",
    "djibsuperprof",
    "professeur Djibouti",
    "prof à domicile Djibouti",
    "cours particuliers Djibouti",
    "soutien scolaire Djibouti",
    "prof maths Djibouti",
    "prof Coran Djibouti",
    "prof arabe Djibouti",
    "prof anglais Djibouti",
    "tuteur Djibouti",
    "professeur Balbala",
    "professeur Héron",
    "professeur Q1 Djibouti",
  ],
  authors: [{ name: "Djib Superprof" }],
  creator: "Djib Superprof",
  publisher: "Djib Superprof",
  category: "education",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: baseUrl,
    siteName: "Djib Superprof",
    title: "Djib Superprof | Professeurs vérifiés à Djibouti",
    description:
      "Trouvez un professeur vérifié à Djibouti. Soutien scolaire, Coran, langues, informatique. Inscription gratuite.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Djib Superprof",
    description:
      "Trouvez un professeur vérifié à Djibouti. Inscription gratuite.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: baseUrl,
  },
  verification: {
    google: "kIrgf0PIKghzsLY6ttr8k1op8On3KmV4QnuFp9nOd70",
  },
};

// ============================================================
// SCHEMA.ORG — SEO LOCAL
// ============================================================

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "Djib Superprof",
  alternateName: "DjibSuperprof",
  url: baseUrl,
  description:
    "Plateforme de mise en relation entre parents et professeurs particuliers vérifiés à Djibouti.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Djibouti",
    addressCountry: "DJ",
  },
  areaServed: {
    "@type": "Country",
    name: "Djibouti",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+25377741482",
    contactType: "customer service",
    availableLanguage: ["French", "Arabic", "Somali", "Afar", "English"],
  },
  sameAs: ["https://wa.me/25377741482"],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Djib Superprof",
  url: baseUrl,
  inLanguage: "fr-FR",
  potentialAction: {
    "@type": "SearchAction",
    target: `${baseUrl}/professeurs?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="canonical" href={baseUrl} />
        <meta name="geo.region" content="DJ" />
        <meta name="geo.placename" content="Djibouti" />
        <meta name="language" content="French" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}