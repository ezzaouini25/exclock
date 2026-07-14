"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Clock,
  Globe,
  Timer,
  Hourglass,
  Bell,
  Calendar,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface PageLayoutProps {
  isFullscreen?: boolean;
}

export function PageLayout({ isFullscreen = false }: PageLayoutProps) {
  const pathname = usePathname();
  const { t, language } = useTranslation();
  const { resolvedTheme } = useTheme();
  const currentYear = new Date().getFullYear();
  const [mounted, setMounted] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isFullscreen) {
    return null;
  }

  const isRTL = language === "ar";

  const getLocalizedPath = (href: string) => {
    if (language === "en") return href;
    const cleanHref = href.startsWith("/") ? href.slice(1) : href;
    return `/${language}/${cleanHref}`;
  };

  const getLogoSource = () => {
    if (!mounted) return "/img/logo-light.png";
    return resolvedTheme === "dark" ? "/img/logo-dark.png" : "/img/logo-light.png";
  };

  const Logo = () => {
    if (logoError) {
      return (
        <span className="font-bold text-lg md:text-xl tracking-tight text-foreground">
          ExClock
        </span>
      );
    }

    return (
      <Image
        key={mounted ? (resolvedTheme === "dark" ? "dark" : "light") : "ssr"}
        src={getLogoSource()}
        alt="ExClock"
        width={180}
        height={54}
        className="h-10 md:h-12 w-auto"
        priority
        quality={100}
        onError={() => setLogoError(true)}
      />
    );
  };

  const pageLinks = [
    { name: t.nav?.clock || "Clock", href: "/", icon: Clock },
    { name: t.nav?.worldClock || "World Clock", href: "/world-clock", icon: Globe },
    { name: t.nav?.timer || "Timer", href: "/timer", icon: Hourglass },
    { name: t.nav?.alarms || "Alarms", href: "/alarms", icon: Bell },
    { name: t.footer?.pages?.holidays || "Holidays", href: "/holidays", icon: Calendar },
  ];

  const legalLinks = [
    { name: t.footer?.legal?.cookies || "Cookies", href: "/legal/cookies" },
    { name: t.footer?.legal?.disclaimer || "Disclaimer", href: "/legal/disclaimer" },
    { name: t.footer?.legal?.terms || "Terms", href: "/legal/terms" },
    { name: t.footer?.legal?.privacy || "Privacy", href: "/legal/privacy" },
    { name: t.footer?.legal?.contact || "Contact", href: "/legal/contact" },
  ];

  return (
    <footer className="w-full bg-background border-t border-border mt-auto relative z-20">
      <div className={cn(
        "max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-6 md:py-10 lg:py-12",
        isRTL && "rtl"
      )}>
        
        <div className="pb-16 sm:pb-20 md:pb-24 lg:pb-0"></div>

        <div className="flex flex-col space-y-6 md:space-y-8 lg:space-y-10">
          
          {/* Top Segment */}
          <div className={cn(
            "flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8 pb-6 md:pb-8 border-b border-border",
            isRTL ? "lg:flex-row" : "lg:flex-row"
          )}>

            {/* Logo - RIGHT for Arabic, LEFT for English */}
            <div className={cn(
              "flex flex-col items-center space-y-2 md:space-y-3",
              isRTL ? "order-1 items-end" : "order-0 items-start"
            )}>
              <Link href={getLocalizedPath("/")} className="flex items-center gap-2 shrink-0 group">
                <Logo />
              </Link>
              <p className={cn(
                "text-muted-foreground text-[10px] md:text-xs tracking-wide font-medium max-w-xs",
                isRTL ? "text-right" : "text-left"
              )}>
                {t.footer?.tagline || "Your complete time management solution. Track time across the globe with precision and style."}
              </p>
            </div>

            {/* Pages - LEFT for Arabic, RIGHT for English */}
            <nav className={cn(
              "flex flex-wrap items-center gap-x-6 md:gap-x-8 gap-y-2 md:gap-y-3 text-[10px] md:text-xs uppercase font-bold tracking-widest",
              isRTL ? "order-0 flex-row" : "order-1 flex-row"
            )}>
              {pageLinks.map((item) => {
                const localizedHref = getLocalizedPath(item.href);
                const Icon = item.icon;
                const isActive = pathname === localizedHref || (item.href !== "/" && pathname.startsWith(localizedHref));
                return (
                  <Link
                    key={item.href}
                    href={localizedHref}
                    className={cn(
                      "flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-all duration-300 relative py-1 after:absolute after:bottom-0 after:w-0 after:h-[1px] after:bg-primary hover:after:w-full after:transition-all after:duration-300",
                      isRTL ? "after:right-0" : "after:left-0",
                      isActive && "text-foreground after:w-full"
                    )}
                  >
                    <Icon className={cn(
                      "w-3 h-3 md:w-3.5 md:h-3.5",
                      isRTL && "order-1"
                    )} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Segment */}
          <div className={cn(
            "flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4 text-[10px] md:text-[11px] font-medium tracking-wide text-muted-foreground",
            isRTL ? "md:flex-row" : "md:flex-row"
          )}>

            {/* Copyright */}
            <div className={cn(
              "flex flex-wrap items-center justify-center gap-2",
              isRTL ? "order-1" : "order-0"
            )}>
              <span>© {currentYear} ExClock. {t.footer?.copyright || "All rights reserved."}</span>
              <span className="hidden sm:inline text-border">|</span>
              <span className={cn(
                "hidden sm:flex items-center gap-1 text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-wider",
                isRTL && "flex-row-reverse"
              )}>
                {t.footer?.madeWith || "Made with"}
                <Heart className="w-2 h-2 md:w-2.5 md:h-2.5 text-primary fill-primary/20" />
                {t.footer?.forTimeLovers || "for time lovers"}
              </span>
            </div>

            {/* Legal Links */}
            <div className={cn(
              "flex flex-wrap justify-center gap-x-4 md:gap-x-6 gap-y-1.5 md:gap-y-2",
              isRTL ? "order-0 flex-row-reverse" : "order-1 flex-row"
            )}>
              {legalLinks.map((link) => {
                const localizedHref = getLocalizedPath(link.href);
                return (
                  <Link
                    key={link.href}
                    href={localizedHref}
                    className={cn(
                      "hover:text-foreground transition-colors",
                      pathname === localizedHref && "text-foreground"
                    )}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pt-16 sm:pt-20 md:pt-24 lg:pt-0"></div>
      </div>
    </footer>
  );
}