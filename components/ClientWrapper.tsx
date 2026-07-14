// components/ClientWrapper.tsx

"use client";

import { ThemeProvider } from "next-themes";
import { useSettingsStore, useTranslation } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const { language, uiScale } = useSettingsStore();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const scaleMap = {
      small: "15px",
      default: "16px",
      large: "17px",
    };
    document.documentElement.style.fontSize = scaleMap[uiScale];
  }, [uiScale]);

  useEffect(() => {
    // Get metadata from t.metadata_home (your actual key)
    const metadata = t.metadata_home || {};
    
    if (metadata.title) {
      document.title = metadata.title;
    }

    const updateMeta = (name: string, content: string, isProperty = false) => {
      if (!content) return;
      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (meta) {
        meta.setAttribute("content", content);
      } else {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        meta.setAttribute("content", content);
        document.head.appendChild(meta);
      }
    };
    
    if (metadata.description) {
      updateMeta("description", metadata.description);
    }
    
    // Open Graph
    if (metadata.ogTitle) {
      updateMeta("og:title", metadata.ogTitle, true);
    }
    if (metadata.ogDescription) {
      updateMeta("og:description", metadata.ogDescription, true);
    }
    
    // Twitter
    if (metadata.twitterTitle) {
      updateMeta("twitter:title", metadata.twitterTitle);
    }
    if (metadata.twitterDescription) {
      updateMeta("twitter:description", metadata.twitterDescription);
    }
    
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [t, language]);

  const dir = language === "ar" ? "rtl" : "ltr";

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div
        suppressHydrationWarning
        dir={dir}
        className={cn(
          "min-h-screen transition-transform duration-300",
          !mounted && "opacity-0"
        )}
      >
        {children}
      </div>
    </ThemeProvider>
  );
}