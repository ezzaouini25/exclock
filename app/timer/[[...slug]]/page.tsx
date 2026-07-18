import { Metadata } from 'next';
import { headers } from 'next/headers';
import { Suspense } from 'react';
import TimerClient from './client';
import Loading from '@/app/loading';
import { en } from '@/lib/i18n/en';
import { fr } from '@/lib/i18n/fr';
import { es } from '@/lib/i18n/es';
import { de } from '@/lib/i18n/de';
import { it } from '@/lib/i18n/it';
import { ar } from '@/lib/i18n/ar';
import { ru } from '@/lib/i18n/ru';

const translations = { en, fr, es, de, it, ar, ru };
type Lang = keyof typeof translations;

function getLangFromPath(pathname: string): Lang {
  const seg = pathname.split("/")[1];
  return (seg && seg in translations ? seg : "en") as Lang;
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug?.[0] || "";
  const match = slug.match(/^(\d+)-(minute|hour|second)-timer$/);
  
  const h = await headers();
  const pathname = h.get("x-pathname") || "/timer";
  const lang = getLangFromPath(pathname);
  const t = translations[lang];

  // ─── Timer preset metadata (5min, 10min, etc.) ───
  if (match) {
    const val = parseInt(match[1]);
    const unit = match[2];
    const metaKey = `metadata_timer_${val}` as keyof typeof t;
    const meta = t[metaKey] as typeof t.metadata_timer_5 | undefined;

    if (meta) {
      const canonical = lang === "en"
        ? `https://www.exclock.com/timer/${slug}`
        : `https://www.exclock.com/${lang}/timer/${slug}`;

      return {
        title: meta.title,
        description: meta.description,
        keywords: meta.keywords,
        metadataBase: new URL("https://www.exclock.com"),
        alternates: {
          canonical: meta.canonical,
          languages: {
            "en": `https://www.exclock.com/timer/${slug}`,
            "fr": `https://www.exclock.com/fr/timer/${slug}`,
            "es": `https://www.exclock.com/es/timer/${slug}`,
            "de": `https://www.exclock.com/de/timer/${slug}`,
            "it": `https://www.exclock.com/it/timer/${slug}`,
            "ar": `https://www.exclock.com/ar/timer/${slug}`,
            "ru": `https://www.exclock.com/ru/timer/${slug}`,
            "x-default": `https://www.exclock.com/timer/${slug}`,
          },
        },
        openGraph: {
          title: meta.ogTitle,
          description: meta.ogDescription,
          url: canonical,
          siteName: "ExClock",
          locale: lang === "en" ? "en_US" : `${lang}_${lang.toUpperCase()}`,
          type: "website",
          images: [
            {
              url: "/og/timer.jpg",
              width: 1200,
              height: 630,
              alt: meta.ogTitle,
            },
          ],
        },
        twitter: {
          card: "summary_large_image",
          title: meta.twitterTitle,
          description: meta.twitterDescription,
          images: ["/og/timer.jpg"],
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
      };
    }

    // Fallback for undefined preset
    return {
      title: `${val} ${unit.charAt(0).toUpperCase() + unit.slice(1)} Timer - ExClock`,
      description: `Set a ${val} ${unit} timer online. Perfect for quick tasks, short breaks, or Pomodoro sessions.`,
    };
  }

  // ─── Main timer page metadata ───
  const m = t.metadata_timer;

  const canonical = lang === "en"
    ? "https://www.exclock.com/timer"
    : `https://www.exclock.com/${lang}/timer`;

  return {
    title: m.title,
    description: m.description,
    keywords: m.keywords,
    metadataBase: new URL("https://www.exclock.com"),
    alternates: {
      canonical: m.canonical,
      languages: {
        "en": "https://www.exclock.com/timer",
        "fr": "https://www.exclock.com/fr/timer",
        "es": "https://www.exclock.com/es/timer",
        "de": "https://www.exclock.com/de/timer",
        "it": "https://www.exclock.com/it/timer",
        "ar": "https://www.exclock.com/ar/timer",
        "ru": "https://www.exclock.com/ru/timer",
        "x-default": "https://www.exclock.com/timer",
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
          url: "/og/timer.jpg",
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
      images: ["/og/timer.jpg"],
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
  };
}

// ─── JSON-LD for timer preset pages ───
function TimerPresetJsonLd({ val, unit, lang }: { val: number; unit: string; lang: Lang }) {
  const t = translations[lang];
  const metaKey = `metadata_timer_${val}` as keyof typeof t;
  const meta = t[metaKey] as typeof t.metadata_timer_5 | undefined;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: meta?.title || `${val} ${unit} Timer`,
    description: meta?.description || `Set a ${val} ${unit} timer online.`,
    url: lang === "en"
      ? `https://www.exclock.com/timer/${val}-${unit}-timer`
      : `https://www.exclock.com/${lang}/timer/${val}-${unit}-timer`,
    mainEntity: {
      "@type": "WebApplication",
      name: `ExClock ${val} ${unit} Timer`,
      applicationCategory: "UtilityApplication",
      operatingSystem: "Any",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Free online countdown timer",
        "Precise timing with alarm",
        "Pause, resume, and reset",
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

// ─── JSON-LD for main timer page ───
function TimerMainJsonLd({ lang }: { lang: Lang }) {
  const t = translations[lang];
  const m = t.metadata_timer;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: m.title,
    description: m.description,
    url: lang === "en"
      ? "https://www.exclock.com/timer"
      : `https://www.exclock.com/${lang}/timer`,
    mainEntity: {
      "@type": "WebApplication",
      name: "ExClock Online Timer",
      applicationCategory: "UtilityApplication",
      operatingSystem: "Any",
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
        "Free online countdown timer",
        "Preset timers: 5, 10, 15, 25, 30, 60 minutes",
        "Custom timer creation",
        "Alarm sound notifications",
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

// ─── Breadcrumb JSON-LD ───
function BreadcrumbJsonLd({ slug, lang }: { slug?: string; lang: Lang }) {
  const homeUrl = lang === "en" ? "https://www.exclock.com" : `https://www.exclock.com/${lang}`;
  const timerUrl = lang === "en" ? "https://www.exclock.com/timer" : `https://www.exclock.com/${lang}/timer`;

  const items: any[] = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: homeUrl,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: translations[lang].timer?.title || "Timer",
      item: timerUrl,
    },
  ];

  if (slug) {
    const match = slug.match(/^(\d+)-(minute|hour|second)-timer$/);
    if (match) {
      const val = match[1];
      const unit = match[2];
      const presetUrl = lang === "en"
        ? `https://www.exclock.com/timer/${slug}`
        : `https://www.exclock.com/${lang}/timer/${slug}`;
      items.push({
        "@type": "ListItem",
        position: 3,
        name: `${val} ${unit} Timer`,
        item: presetUrl,
      });
    }
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug?.[0] || "";
  const match = slug.match(/^(\d+)-(minute|hour|second)-timer$/);

  const h = await headers();
  const pathname = h.get("x-pathname") || "/timer";
  const lang = getLangFromPath(pathname);

  return (
    <>
      {match ? (
        <TimerPresetJsonLd
          val={parseInt(match[1])}
          unit={match[2]}
          lang={lang}
        />
      ) : (
        <TimerMainJsonLd lang={lang} />
      )}
      <BreadcrumbJsonLd slug={slug} lang={lang} />
      <Suspense fallback={<Loading />}>
        <TimerClient params={params} />
      </Suspense>
    </>
  );
}