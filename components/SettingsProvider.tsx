"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";

type FontSize = "sm" | "base" | "lg" | "xl";

interface SettingsContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  reduceMotion: boolean;
  setReduceMotion: (reduce: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSize] = useLocalStorage<FontSize>(
    "exclock-font-size",
    "base",
    { initializeWithValue: false },
  );
  const [reduceMotion, setReduceMotion] = useLocalStorage<boolean>(
    "exclock-reduce-motion",
    false,
    { initializeWithValue: false },
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let scale = 100;
    if (fontSize === "sm") scale = 87.5;
    if (fontSize === "base") scale = 100;
    if (fontSize === "lg") scale = 112.5;
    if (fontSize === "xl") scale = 125;
    document.documentElement.style.fontSize = `${scale}%`;
  }, [fontSize, mounted]);

  useEffect(() => {
    if (reduceMotion) {
      document.body.classList.add("reduce-motion");
    } else {
      document.body.classList.remove("reduce-motion");
    }
  }, [reduceMotion]);

  return (
    <SettingsContext.Provider
      value={{ fontSize, setFontSize, reduceMotion, setReduceMotion }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
