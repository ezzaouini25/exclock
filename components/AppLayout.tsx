"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Clock,
  Globe,
  Timer,
  Hourglass,
  Settings,
  Bell,
  Menu,
  X,
  Calendar,
  Maximize,
  Minimize,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { useTheme } from "next-themes";
import { SettingsModal } from "./SettingsModal";
import { PageLayout } from "./PageLayout";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t, language } = useTranslation();
  const { resolvedTheme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else {
      await document.exitFullscreen().catch(err => console.error(err));
    }
  };

  const isRTL = language === "ar";

  const getLocalizedPath = (href: string) => {
    if (language === "en") return href;
    const cleanHref = href.startsWith("/") ? href.slice(1) : href;
    return `/${language}/${cleanHref}`;
  };

  const isPathActive = (href: string, localizedHref: string) => {
    if (href === "/") {
      return pathname === "/" || pathname === `/${language}` || pathname === `/${language}/`;
    }
    return pathname === localizedHref || pathname.startsWith(localizedHref + "/");
  };

  const mainNav = [
    { name: t.nav.clock, href: "/", icon: Clock },
    { name: t.nav.worldClock, href: "/world-clock", icon: Globe },
    { name: t.nav.stopwatch, href: "/stopwatch", icon: Timer },
    { name: t.nav.timer, href: "/timer", icon: Hourglass },
  ];

  const moreNav = [
    { name: t.nav.alarms, href: "/alarms", icon: Bell },
    { name: t.nav.countdown, href: "/countdown", icon: Calendar },
  ];

  const isDark = resolvedTheme === "dark";

  const getLogoSource = () => {
    if (!mounted) return "/img/logo-light.png";
    return isDark ? "/img/logo-dark.png" : "/img/logo-light.png";
  };

  const Logo = ({ className }: { className?: string }) => {
    if (logoError) {
      return (
        <span className={cn("font-display font-bold tracking-tight text-2xl md:text-3xl", className)}>
          ExClock
        </span>
      );
    }

    return (
      <Image
        key={mounted ? (isDark ? "dark" : "light") : "ssr"}
        src={getLogoSource()}
        alt="ExClock"
        width={150}
        height={650}
        className={cn("w-auto", className)}
        priority
        quality={100}
        onError={() => setLogoError(true)}
        style={{ width: 'auto', height: '100%' }}
      />
    );
  };

  return (
    <div className={cn(
      "flex flex-col min-h-screen w-full bg-background text-foreground transition-colors",
      isRTL ? "rtl" : "ltr"
    )}>

      {/* Desktop Top Navigation */}
      {!isFullscreen && (
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-background/80 backdrop-blur-xl border-b border-border sticky top-0 z-50">
          {/* Logo - RIGHT for RTL, LEFT for LTR */}
          <div className={cn(
            "flex items-center gap-3 flex-shrink-0",
            isRTL ? "order-1" : "order-0"
          )}>
            <Link href={getLocalizedPath("/")}>
              <Logo className="h-14" />
            </Link>
          </div>

          {/* Navigation - CENTER */}
          <nav className={cn(
            "flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2",
            isRTL ? "flex-row-reverse" : "flex-row"
          )}>
            {[...mainNav, ...moreNav].map((item) => {
              const localizedHref = getLocalizedPath(item.href);
              const isActive = isPathActive(item.href, localizedHref);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={localizedHref}
                  className={cn(
                    "relative flex items-center px-4 py-2 rounded-full transition-all duration-300 font-medium group",
                    isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    isRTL ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                  <span className={cn(
                    "max-w-0 overflow-hidden opacity-0 whitespace-nowrap transition-all duration-300 group-hover:max-w-xs group-hover:opacity-100",
                    isRTL ? "group-hover:mr-2" : "group-hover:ml-2"
                  )}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Buttons - LEFT for RTL, RIGHT for LTR */}
          <div className={cn(
            "flex items-center gap-4 flex-shrink-0",
            isRTL ? "order-0" : "order-1"
          )}>
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors hidden sm:block"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>
      )}

      {/* Mobile Top Header */}
      {!isFullscreen && (
        <header className="md:hidden flex items-center justify-between p-4 bg-background/80 backdrop-blur-xl border-b border-border sticky top-0 z-50">
          <div className={cn(
            "flex items-center gap-2",
            isRTL ? "order-1" : "order-0"
          )}>
            <Link href={getLocalizedPath("/")}>
              <Logo className="h-12" />
            </Link>
          </div>
          <button
            onClick={toggleFullscreen}
            className={cn(
              "p-2 rounded-lg bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors",
              isRTL ? "order-0" : "order-1"
            )}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </header>
      )}

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 w-full max-w-7xl mx-auto flex flex-col",
        isFullscreen ? "p-0 items-center justify-center h-screen" : "p-4 pb-32 md:p-8 md:pb-8"
      )}>
        {children}
      </main>

      {/* FOOTER */}
      <PageLayout isFullscreen={isFullscreen} />

      {/* MOBILE BOTTOM NAVIGATION */}
      {!isFullscreen && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[40]">
          <div className="bg-card/95 backdrop-blur-xl border-t border-border/10 px-2 py-1.5 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
            <div className={cn(
              "flex items-end justify-around max-w-md mx-auto",
              isRTL ? "flex-row-reverse" : "flex-row"
            )}>
              {mainNav.map((item) => {
                const localizedHref = getLocalizedPath(item.href);
                const isActive = isPathActive(item.href, localizedHref);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={localizedHref}
                    className="flex flex-col items-center justify-end py-1"
                    style={{ width: "60px", minHeight: "56px" }}
                  >
                    <div className="relative flex items-center justify-center w-11 h-11">
                      <div
                        className={cn(
                          "absolute inset-0 rounded-full bg-primary transition-all duration-300",
                          isActive ? "scale-100 opacity-100" : "scale-0 opacity-0"
                        )}
                      />
                      <Icon
                        className={cn(
                          "w-[20px] h-[20px] transition-all duration-300 relative z-10",
                          isActive ? "text-primary-foreground" : "text-primary"
                        )}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-medium transition-all duration-300 leading-tight mt-0.5",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {item.name}
                    </span>
                  </Link>
                );
              })}

              <button
                onClick={() => setIsMobileMoreOpen(true)}
                className="flex flex-col items-center justify-end py-1"
                style={{ width: "60px", minHeight: "56px" }}
              >
                <div className="relative flex items-center justify-center w-11 h-11">
                  <Menu
                    className="w-[20px] h-[20px] text-primary transition-all duration-300 relative z-10"
                    strokeWidth={2}
                  />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground transition-all duration-300 leading-tight mt-0.5">
                  {t.common.more}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile More Menu Overlay */}
      <AnimatePresence>
        {isMobileMoreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn(
                "absolute inset-x-0 bottom-0 bg-card border-t border-border p-6 rounded-t-3xl flex flex-col shadow-2xl pb-[max(env(safe-area-inset-bottom),1.5rem)]",
                isRTL && "rtl"
              )}
            >
              <div className={cn(
                "flex justify-between items-center mb-6",
                isRTL ? "flex-row-reverse" : "flex-row"
              )}>
                <span className="font-display font-bold text-xl">{t.common.more}</span>
                <button onClick={() => setIsMobileMoreOpen(false)} className="p-2 bg-muted rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className={cn(
                "flex flex-col gap-3",
                isRTL && "items-end"
              )}>
                {moreNav.map((item) => {
                  const localizedHref = getLocalizedPath(item.href);
                  const Icon = item.icon;
                  const isActive = isPathActive(item.href, localizedHref);
                  return (
                    <Link
                      key={item.href}
                      href={localizedHref}
                      onClick={() => setIsMobileMoreOpen(false)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl transition-colors border w-full",
                        isActive ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted border-transparent text-foreground hover:bg-muted/80",
                        isRTL ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="font-medium text-lg">{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <button
                  onClick={() => {
                    setIsMobileMoreOpen(false);
                    setIsSettingsOpen(true);
                  }}
                  className={cn(
                    "w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-muted hover:bg-muted/80 transition-colors border border-transparent",
                    isRTL ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">{t.common.settings}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}