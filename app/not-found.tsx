// app/not-found.tsx
"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { useEffect, useState } from "react";

export default function NotFound() {
  const router = useRouter();
  const { t, language, dir } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleGoHome = () => {
    // If English, go to /, otherwise go to /{language}
    const homePath = language === 'en' ? '/' : `/${language}`;
    router.push(homePath);
  };

  if (!isMounted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="text-8xl sm:text-9xl md:text-[10rem] lg:text-[12rem] font-bold text-muted-foreground/10">
          404
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] relative" dir={dir}>
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center space-y-8 px-4 relative z-10"
      >
        {/* 404 Number */}
        <motion.div
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 200 }}
          className="relative"
        >
          <span className="text-8xl sm:text-9xl md:text-[10rem] lg:text-[12rem] font-bold text-muted-foreground/10 select-none tracking-tighter">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
          </div>

        </motion.div>

        {/* Title - Just like SettingsModal uses t.settings.title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground text-center"
        >
          {t.page404?.title || "Page Not Found"}
        </motion.h1>

        {/* Back to Home Button - Just like SettingsModal uses t.settings.theme */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={handleGoHome}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-full border transition-all duration-300 mt-4",
            "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 hover:bg-primary/90"
          )}
        >
          <Icons.House className="w-4 h-4" />
          <span className="text-sm font-medium">
            {t.page404?.backHome || "Back to Home"}
          </span>
        </motion.button>

        {/* Decorative dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 1 }}
          className="flex items-center gap-2 mt-8"
        >
          <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse delay-75" />
          <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse delay-150" />
        </motion.div>
      </motion.div>
    </div>
  );
}