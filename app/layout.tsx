// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppLayout } from "@/components/AppLayout";
import { en } from "@/lib/i18n/en";
import { fr } from "@/lib/i18n/fr";
import { es } from "@/lib/i18n/es";
import { de } from "@/lib/i18n/de";
import { it } from "@/lib/i18n/it";
import { ar } from "@/lib/i18n/ar";
import { ru } from "@/lib/i18n/ru";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const translations = { en, fr, es, de, it, ar, ru };
type Lang = keyof typeof translations;

function getLangFromPath(pathname: string): Lang {
  const seg = pathname.split("/")[1];
  return (seg && seg in translations ? seg : "en") as Lang;
}

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const pathname = h.get("x-pathname") || "/";
  const lang = getLangFromPath(pathname);
  const t = translations[lang];
  const m = t.metadata_home;

  return {
    title: { default: m.title, template: "%s | ExClock" },
    description: m.description,
    keywords: m.keywords,
    metadataBase: new URL("https://exclock.com"),
    alternates: {
      canonical: m.canonical,
      languages: {
        "en": "https://exclock.com",
        "fr": "https://exclock.com/fr",
        "es": "https://exclock.com/es",
        "de": "https://exclock.com/de",
        "it": "https://exclock.com/it",
        "ar": "https://exclock.com/ar",
        "ru": "https://exclock.com/ru",
        "x-default": "https://exclock.com",
      },
    },
    openGraph: {
      title: m.ogTitle,
      description: m.ogDescription,
      url: lang === "en" ? "https://exclock.com" : `https://exclock.com/${lang}`,
      siteName: "ExClock",
      locale: lang === "en" ? "en_US" : `${lang}_${lang.toUpperCase()}`,
      type: "website",
      images: [{ url: "/img/logo.png", width: 1200, height: 630, alt: m.ogTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: m.twitterTitle,
      description: m.twitterDescription,
      images: ["/img/logo.png"],
    },
    icons: {
      icon: [
        { url: "/img/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/img/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/img/favicons/favicon-48x48.png", sizes: "48x48", type: "image/png" },
        { url: "/img/favicons/favicon-64x64.png", sizes: "64x64", type: "image/png" },
        { url: "/img/favicons/favicon-96x96.png", sizes: "96x96", type: "image/png" },
        { url: "/img/favicons/favicon-128x128.png", sizes: "128x128", type: "image/png" },
        { url: "/img/favicons/favicon-256x256.png", sizes: "256x256", type: "image/png" },
        { url: "/img/favicons/android-chrome-48x48.png", sizes: "48x48", type: "image/png" },
        { url: "/img/favicons/android-chrome-72x72.png", sizes: "72x72", type: "image/png" },
        { url: "/img/favicons/android-chrome-96x96.png", sizes: "96x96", type: "image/png" },
        { url: "/img/favicons/android-chrome-144x144.png", sizes: "144x144", type: "image/png" },
        { url: "/img/favicons/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
        { url: "/img/favicons/android-chrome-256x256.png", sizes: "256x256", type: "image/png" },
        { url: "/img/favicons/android-chrome-384x384.png", sizes: "384x384", type: "image/png" },
        { url: "/img/favicons/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [
        { url: "/img/favicons/apple-touch-icon-57x57.png", sizes: "57x57", type: "image/png" },
        { url: "/img/favicons/apple-touch-icon-72x72.png", sizes: "72x72", type: "image/png" },
        { url: "/img/favicons/apple-touch-icon-114x114.png", sizes: "114x114", type: "image/png" },
        { url: "/img/favicons/apple-touch-icon-120x120.png", sizes: "120x120", type: "image/png" },
        { url: "/img/favicons/apple-touch-icon-144x144.png", sizes: "144x144", type: "image/png" },
        { url: "/img/favicons/apple-touch-icon-152x152.png", sizes: "152x152", type: "image/png" },
        { url: "/img/favicons/apple-touch-icon-180x180.png", sizes: "180x180", type: "image/png" },
      ],
      other: [
        { rel: "mask-icon", url: "/img/favicons/safari-pinned-tab.svg" },
        { rel: "shortcut icon", url: "/img/favicons/favicon.ico" },
      ],
    },
    manifest: "/img/favicons/site.webmanifest",
    verification: {
      google: "your-google-verification-code",
      // ✅ Added msvalidate
      other: {
        "msvalidate.01": "C4C55666E7EEE671B6401706A8D96A0F",
      },
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
    authors: [{ name: "ExClock" }],
    creator: "ExClock",
    publisher: "ExClock",
    applicationName: "ExClock",
    category: "tools",
    other: {
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-title": "ExClock",
      "format-detection": "telephone=no",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#09090B",
  width: "device-width",
  initialScale: 1,
};

function HomeJsonLd({ lang }: { lang: Lang }) {
  const t = translations[lang];
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t.metadata_home.title,
    description: t.metadata_home.description,
    url: lang === "en" ? "https://exclock.com" : `https://exclock.com/${lang}`,
    mainEntity: {
      "@type": "WebApplication",
      name: "ExClock",
      applicationCategory: "UtilityApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript. Requires HTML5.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        ratingCount: "1250",
      },
      featureList: [
        "Live countdowns to major holidays",
        "Christmas, New Year, Ramadan, Easter countdowns",
        "Real-time day, hour, minute updates",
        "International holiday tracking",
        "Mobile responsive design",
      ],
    },
    publisher: {
      "@type": "Organization",
      name: "ExClock",
      url: "https://exclock.com",
      logo: {
        "@type": "ImageObject",
        url: "https://exclock.com/logo.png",
        width: 512,
        height: 512,
      },
    },
    inLanguage: lang === "en" ? "en-US" : `${lang}-${lang.toUpperCase()}`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

function BreadcrumbJsonLd({ lang }: { lang: Lang }) {
  const homeUrl = lang === "en" ? "https://exclock.com" : `https://exclock.com/${lang}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: homeUrl,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

function FaqJsonLd({ lang }: { lang: Lang }) {
  const seoContent = translations[lang].seo?.home;
  if (!seoContent) return null;

  const faqBlock = seoContent.find((item: any) => item.type === "faq");
  if (!faqBlock || !faqBlock.items) return null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqBlock.items.map((faq: any) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

// ✅ GTM Component
function GoogleTagManager() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-WNM5Z2NK');
        `,
      }}
    />
  );
}

// ✅ GTM NoScript (for body)
function GoogleTagManagerNoScript() {
  return (
    <noscript>
      <iframe
        src="https://www.googletagmanager.com/ns.html?id=GTM-WNM5Z2NK"
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const pathname = h.get("x-pathname") || "/";
  const lang = getLangFromPath(pathname);

  return (
    <html
      lang={lang}
      dir={lang === "ar" ? "rtl" : "ltr"}
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* ✅ Google Fonts Link */}
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Outfit:wght@300;500;700;900&display=swap"
          rel="stylesheet"
        />
        {/* ✅ Google Tag Manager */}
        <GoogleTagManager />
      </head>
      <body
        className="font-sans antialiased overflow-x-hidden min-h-screen selection:bg-primary/20"
        suppressHydrationWarning
      >
        {/* ✅ Google Tag Manager NoScript (must be right after opening body) */}
        <GoogleTagManagerNoScript />

        <HomeJsonLd lang={lang} />
        <BreadcrumbJsonLd lang={lang} />
        <FaqJsonLd lang={lang} />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <AppLayout>
            {children}
          </AppLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}