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
    default: "Prof À Domicile Djibouti | Professeurs particuliers vérifiés",
    template: "%s | Prof À Domicile Djibouti",
  },
  description:
    "Trouvez un professeur à domicile vérifié à Djibouti : soutien scolaire, Coran, langues, informatique, arts. Inscription gratuite, mise en relation en 24h.",
  keywords: [
    "djib tutors",
    "professeurs à domicile Djibouti",
    "prof à domicile",
    "prof particulier Djibouti",
    "cours particuliers Djibouti",
    "soutien scolaire Djibouti",
    "prof maths Djibouti",
    "prof Coran Djibouti",
    "prof arabe Djibouti",
    "prof anglais Djibouti",
    "prof français Djibouti",
    "tuteur Djibouti",
    "cours à domicile Djibouti",
    "professeur Balbala",
    "professeur Héron",
    "professeur Q1 Djibouti",
    "professeur Centre-ville Djibouti",
  ],
  authors: [{ name: "Prof À Domicile Djibouti" }],
  creator: "Prof À Domicile Djibouti",
  publisher: "Prof À Domicile Djibouti",
  category: "education",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    alternateLocale: "ar_DJ",
    url: baseUrl,
    siteName: "Prof À Domicile Djibouti",
    title: "Prof À Domicile Djibouti | Professeurs particuliers vérifiés",
    description:
      "Trouvez un professeur à domicile vérifié à Djibouti. Soutien scolaire, Coran, langues, informatique. Inscription gratuite.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prof À Domicile Djibouti",
    description:
      "Trouvez un professeur à domicile vérifié à Djibouti. Inscription gratuite.",
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
    google: "REMPLACE_PAR_TON_CODE_GOOGLE",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

// ============================================================
// BALISE STRUCTURÉE (SCHEMA.ORG) — SEO LOCAL
// ============================================================

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "Prof À Domicile Djibouti",
  alternateName: "Prof À Domicile",
  url: baseUrl,
  description:
    "Plateforme de mise en relation entre parents et professeurs particuliers vérifiés à Djibouti. Soutien scolaire, Coran, langues, informatique.",
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
  sameAs: [
    "https://wa.me/25377741482",
  ],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "DJF",
    description: "Inscription gratuite pour les parents",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Prof À Domicile Djibouti",
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