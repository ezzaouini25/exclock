// components/SettingsModal.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Moon,
  Sun,
  Type,
  Languages,
  ChevronDown,
  Check,
  AArrowUp,
  AArrowDown,
  Settings,
} from "lucide-react";
import ReactCountryFlag from "react-country-flag";
import { useTranslation, useSettingsStore, LanguageCode } from "@/lib/i18n";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { t, language, dir } = useTranslation();
  const { uiScale, setLanguage, setUiScale } = useSettingsStore();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Language configuration
  const languages: { code: LanguageCode; label: string; countryCode: string }[] = [
    { code: "en", label: "English", countryCode: "US" },
    { code: "fr", label: "Français", countryCode: "FR" },
    { code: "es", label: "Español", countryCode: "ES" },
    { code: "de", label: "Deutsch", countryCode: "DE" },
    { code: "it", label: "Italiano", countryCode: "IT" },
    { code: "ar", label: "العربية", countryCode: "SA" },
    { code: "ru", label: "Русский", countryCode: "RU" },
  ];

  const validLangCodes = languages.map(l => l.code);

  // Get language from URL path - ALWAYS read from URL
  const getLangFromPath = (): LanguageCode => {
    if (typeof window === 'undefined') return "en";
    
    const pathSegments = pathname.split('/').filter(Boolean);
    const firstSegment = pathSegments[0];
    
    // Check if first segment is a valid language code
    if (firstSegment && validLangCodes.includes(firstSegment as LanguageCode)) {
      return firstSegment as LanguageCode;
    }
    
    // Default to English if no language prefix
    return "en";
  };

  // FORCE SYNC: Always update store to match URL whenever pathname changes
  useEffect(() => {
    setMounted(true);
    
    const urlLang = getLangFromPath();
    
    // Force update the store to match URL
    // This ensures /timer -> English, /fr/timer -> French, etc.
    if (urlLang !== language) {
      setLanguage(urlLang);
    }
  }, [pathname]); // Re-run EVERY TIME pathname changes

  // ALSO sync when the component mounts or when modal opens
  useEffect(() => {
    if (isOpen) {
      const urlLang = getLangFromPath();
      if (urlLang !== language) {
        setLanguage(urlLang);
      }
    }
  }, [isOpen]);

  // Get current language from URL (ALWAYS from URL, not from store)
  const currentLangCode = getLangFromPath();
  const currentLang = languages.find((l) => l.code === currentLangCode) || languages[0];

  const scaleMap: Record<string, number> = {
    small: 0.85,
    default: 1,
    large: 1.15,
  };

  const currentScaleValue = scaleMap[uiScale] || 1;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const adjustScale = (direction: "up" | "down") => {
    const scales = ["small", "default", "large"] as const;
    const currentIdx = scales.indexOf(uiScale as "small" | "default" | "large");
    if (direction === "up" && currentIdx < scales.length - 1) {
      setUiScale(scales[currentIdx + 1]);
    } else if (direction === "down" && currentIdx > 0) {
      setUiScale(scales[currentIdx - 1]);
    }
  };

  const handleLanguageChange = (langCode: LanguageCode) => {
    // Update settings store
    setLanguage(langCode);
    setLangDropdownOpen(false);

    // Get current path without language prefix
    let currentPath = pathname;
    const pathSegments = currentPath.split('/').filter(Boolean);
    
    // Remove existing language prefix if present
    if (validLangCodes.includes(pathSegments[0] as LanguageCode)) {
      pathSegments.shift();
    }
    
    // Construct clean path
    let cleanPath = '/' + pathSegments.join('/');
    if (cleanPath === '/') cleanPath = '/';

    // Navigate: if English (default), no prefix; otherwise add language prefix
    if (langCode === 'en') {
      router.push(cleanPath);
    } else {
      const newPath = `/${langCode}${cleanPath === '/' ? '' : cleanPath}`;
      router.push(newPath);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleThemeChange = (mode: "light" | "dark") => {
    setTheme(mode);
  };

  // Active theme detection
  const activeTheme = mounted 
    ? (theme === "system" ? resolvedTheme : theme) 
    : "dark";

  if (!mounted) {
    return (
      <div className="hidden fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl p-5">
          <div className="animate-pulse space-y-4">
            <div className="h-9 bg-muted rounded-xl w-1/2"></div>
            <div className="h-20 bg-muted rounded-xl"></div>
            <div className="h-20 bg-muted rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          dir={dir}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
          />

          {/* Floating Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  {t.settings.title}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-xl hover:bg-black text-muted-foreground hover:text-primary-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div
              className="flex-1 overflow-y-auto p-5 space-y-6"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              <style>{`
                .settings-content::-webkit-scrollbar {
                  display: none;
                }
              `}</style>

              {/* ===== THEME SECTION ===== */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Sun className="w-4 h-4" />
                  <h3 className="text-sm font-medium">
                    {t.settings.theme}
                  </h3>
                </div>

                <div className="flex gap-2">
                  {(["light", "dark"] as const).map((mode) => {
                    const isActive = activeTheme === mode;
                    
                    return (
                      <button
                        key={mode}
                        onClick={() => handleThemeChange(mode)}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-primary text-white"
                            : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        {mode === "light" ? (
                          <Sun className="w-4 h-4" />
                        ) : (
                          <Moon className="w-4 h-4" />
                        )}
                        <span>
                          {mode === "light" ? t.settings.light : t.settings.dark}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* ===== LANGUAGE SECTION ===== */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Languages className="w-4 h-4" />
                  <h3 className="text-sm font-medium">
                    {t.settings.language}
                  </h3>
                </div>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                    className={cn(
                      "w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200",
                      langDropdownOpen
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border bg-muted hover:bg-muted/80"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <ReactCountryFlag
                        countryCode={currentLang.countryCode}
                        svg
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                      <span className="font-medium text-foreground text-sm">
                        {currentLang.label}
                      </span>
                    </div>
                    <motion.div
                      animate={{ rotate: langDropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {langDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-2xl shadow-xl overflow-hidden z-50"
                      >
                        <div
                          className="max-h-60 overflow-y-auto"
                          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                        >
                          {languages.map((lang) => (
                            <button
                              key={lang.code}
                              onClick={() => handleLanguageChange(lang.code)}
                              className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 transition-colors text-left",
                                currentLangCode === lang.code
                                  ? "bg-primary/10 text-primary"
                                  : "hover:bg-muted text-foreground"
                              )}
                            >
                              <ReactCountryFlag
                                countryCode={lang.countryCode}
                                svg
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  borderRadius: "50%",
                                  objectFit: "cover",
                                }}
                              />
                              <span className="font-medium flex-1 text-sm">
                                {lang.label}
                              </span>
                              {currentLangCode === lang.code && (
                                <Check className="w-4 h-4 text-primary" />
                              )}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </section>

              {/* ===== TEXT SIZE SECTION ===== */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Type className="w-4 h-4" />
                  <h3 className="text-sm font-medium">
                    {t.settings.uiScale}
                  </h3>
                </div>

                <div className="bg-muted rounded-2xl p-4 space-y-4">
                  {/* Preview */}
                  <div className="flex items-center justify-center py-3 px-4 bg-card rounded-xl border border-border">
                    <p
                      className="font-medium text-center transition-all duration-300"
                      style={{ fontSize: `${14 * currentScaleValue}px` }}
                    >
                      {"Preview Text Size"}
                    </p>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => adjustScale("down")}
                      disabled={uiScale === "small"}
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 border",
                        uiScale === "small"
                          ? "bg-muted border-border text-muted-foreground/30 cursor-not-allowed"
                          : "bg-card border-border text-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary"
                      )}
                    >
                      <AArrowDown className="w-4 h-4" />
                    </button>

                    <div className="flex-1 space-y-2">
                      <div className="relative h-2 bg-border rounded-full overflow-hidden">
                        <motion.div
                          className="absolute top-0 left-0 h-full bg-primary rounded-full"
                          initial={false}
                          animate={{
                            width:
                              uiScale === "small"
                                ? "0%"
                                : uiScale === "default"
                                ? "50%"
                                : "100%",
                          }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        />
                        <div className="absolute top-0 left-0 w-full h-full flex justify-between px-[2px]">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className={cn(
                                "w-1.5 h-1.5 rounded-full -mt-[1px] transition-colors duration-300",
                                (uiScale === "small" && i === 0) ||
                                (uiScale === "default" && i === 1) ||
                                (uiScale === "large" && i === 2)
                                  ? "bg-primary-foreground"
                                  : "bg-border"
                              )}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className={cn("transition-colors", uiScale === "small" && "text-primary font-medium")}>
                          {t.settings.scaleSmall || "Small"}
                        </span>
                        <span className={cn("transition-colors", uiScale === "default" && "text-primary font-medium")}>
                          {t.settings.scaleDefault || "Default"}
                        </span>
                        <span className={cn("transition-colors", uiScale === "large" && "text-primary font-medium")}>
                          {t.settings.scaleLarge || "Large"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => adjustScale("up")}
                      disabled={uiScale === "large"}
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 border",
                        uiScale === "large"
                          ? "bg-muted border-border text-muted-foreground/30 cursor-not-allowed"
                          : "bg-card border-border text-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary"
                      )}
                    >
                      <AArrowUp className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Percentage badge */}
                  <div className="flex justify-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      <Type className="w-3 h-3" />
                      {Math.round(currentScaleValue * 100)}%
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}