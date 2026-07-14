// components/LanguageSync.tsx
"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSettingsStore, LanguageCode } from '@/lib/i18n';

export function LanguageSync() {
  const pathname = usePathname();
  const { setLanguage } = useSettingsStore();

  useEffect(() => {
    // Extract language from URL path
    const pathSegments = pathname.split('/');
    const firstSegment = pathSegments[1];
    
    const validLanguages = ['fr', 'es', 'de', 'it', 'ar', 'ru'];
    
    // If the first segment is a valid language, set it
    if (firstSegment && validLanguages.includes(firstSegment)) {
      setLanguage(firstSegment as LanguageCode);
    } else {
      // Default to English
      setLanguage('en');
    }
  }, [pathname, setLanguage]);

  return null;
}