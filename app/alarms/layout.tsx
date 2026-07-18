// app/alarms/layout.tsx
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { en } from "@/lib/i18n/en";
import { fr } from "@/lib/i18n/fr";
import { es } from "@/lib/i18n/es";
import { de } from "@/lib/i18n/de";
import { it } from "@/lib/i18n/it";
import { ar } from "@/lib/i18n/ar";
import { ru } from "@/lib/i18n/ru";

const translations = { en, fr, es, de, it, ar, ru };
type Lang = keyof typeof translations;

function getLangFromPath(pathname: string): Lang {
  const seg = pathname.split("/")[1];
  return (seg && seg in translations ? seg : "en") as Lang;
}

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const pathname = h.get("x-pathname") || "/alarms";
  const lang = getLangFromPath(pathname);
  const t = translations[lang];

  const m = t.metadata_alarms;

  const canonical = lang === "en" 
    ? "https://www.exclock.com/alarms" 
    : `https://www.exclock.com/${lang}/alarms`;

  return {
    title: m.title,
    description: m.description,
    keywords: m.keywords,
    metadataBase: new URL("https://www.exclock.com"),
    alternates: {
      canonical: m.canonical,
      languages: {
        "en": "https://www.exclock.com/alarms",
        "fr": "https://www.exclock.com/fr/alarms",
        "es": "https://www.exclock.com/es/alarms",
        "de": "https://www.exclock.com/de/alarms",
        "it": "https://www.exclock.com/it/alarms",
        "ar": "https://www.exclock.com/ar/alarms",
        "ru": "https://www.exclock.com/ru/alarms",
        "x-default": "https://www.exclock.com/alarms",
      },
    },
    openGraph: {
      title: m.ogTitle,
      description: m.ogDescription,
      url: canonical,
      siteName: "ExClock",
      locale: lang === "en" ? "en_US" : `${lang}_${lang.toUpperCase()}`,
      type: "website",
      images: [
        {
          url: "/img/logo.png",
          width: 1200,
          height: 630,
          alt: m.ogTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: m.twitterTitle,
      description: m.twitterDescription,
      images: ["/og/alarms.jpg"],
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

// JSON-LD Structured Data for Alarms page
function AlarmsJsonLd({ lang }: { lang: Lang }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: lang === "en" ? "Alarm Clock" : translations[lang].alarms.title,
    description: translations[lang].metadata_alarms.description,
    url: lang === "en" 
      ? "https://www.exclock.com/alarms" 
      : `https://www.exclock.com/${lang}/alarms`,
    mainEntity: {
      "@type": "WebApplication",
      name: "ExClock Alarm Clock",
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
        "Free online alarm clock",
        "Multiple alarm creation",
        "Custom alarm sounds",
        "Recurring daily alarms",
        "Browser notification support",
        "Works on all devices",
      ],
    },
    publisher: {
      "@type": "Organization",
      name: "ExClock",
      url: "https://www.exclock.com",
      logo: {
        "@type": "ImageObject",
        url: "https://www.exclock.com/logo.png",
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

// Breadcrumb JSON-LD
function BreadcrumbJsonLd({ lang }: { lang: Lang }) {
  const homeUrl = lang === "en" ? "https://www.exclock.com" : `https://www.exclock.com/${lang}`;
  const alarmsUrl = lang === "en" 
    ? "https://www.exclock.com/alarms" 
    : `https://www.exclock.com/${lang}/alarms`;

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
      {
        "@type": "ListItem",
        position: 2,
        name: lang === "en" ? "Alarm Clock" : translations[lang].alarms.title,
        item: alarmsUrl,
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

// FAQ JSON-LD from SEO content
function FaqJsonLd({ lang }: { lang: Lang }) {
  const seoContent = translations[lang].seo?.alarms;
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

export default async function AlarmsLayout({ children }: { children: ReactNode }) {
  const h = await headers();
  const pathname = h.get("x-pathname") || "/alarms";
  const lang = getLangFromPath(pathname);

  return (
    <>
      <AlarmsJsonLd lang={lang} />
      <BreadcrumbJsonLd lang={lang} />
      <FaqJsonLd lang={lang} />
      {children}
    </>
  );
}