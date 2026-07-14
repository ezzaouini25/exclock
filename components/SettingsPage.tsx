"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useSettings } from "./SettingsProvider";
import { Moon, Sun, Monitor } from "lucide-react";

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { fontSize, setFontSize, reduceMotion, setReduceMotion } =
    useSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted)
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto space-y-8 p-4 md:p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-[var(--fox-text)] tracking-tight">
          Settings
        </h1>
        <p className="text-[var(--fox-muted)] mt-2">
          Customize appearance, text size, and accessibility.
        </p>
      </div>

      {/* Appearance */}
      <section className="bg-[var(--fox-panel)] border border-[var(--fox-border)] rounded-3xl p-6 md:p-8 shadow-xl">
        <h2 className="text-xl font-bold mb-6 text-[var(--fox-text)]">
          Appearance
        </h2>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-[var(--fox-text)]">Theme</h3>
              <p className="text-sm text-[var(--fox-muted)]">
                Select your preferred color scheme.
              </p>
            </div>
            <div className="flex bg-[var(--fox-input)] p-1 rounded-xl">
              <button
                onClick={() => setTheme("light")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${theme === "light" ? "bg-[var(--fox-panel)] text-blue-500 shadow-sm" : "text-[var(--fox-muted)] hover:text-[var(--fox-text)]"}`}
              >
                <Sun size={18} />
                <span className="text-sm font-medium">Light</span>
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${theme === "dark" ? "bg-[var(--fox-panel)] text-blue-500 shadow-sm" : "text-[var(--fox-muted)] hover:text-[var(--fox-text)]"}`}
              >
                <Moon size={18} />
                <span className="text-sm font-medium">Dark</span>
              </button>
              <button
                onClick={() => setTheme("system")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${theme === "system" ? "bg-[var(--fox-panel)] text-blue-500 shadow-sm" : "text-[var(--fox-muted)] hover:text-[var(--fox-text)]"}`}
              >
                <Monitor size={18} />
                <span className="text-sm font-medium">System</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Accessibility */}
      <section className="bg-[var(--fox-panel)] border border-[var(--fox-border)] rounded-3xl p-6 md:p-8 shadow-xl">
        <h2 className="text-xl font-bold mb-6 text-[var(--fox-text)]">
          Accessibility
        </h2>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-[var(--fox-text)]">
                Text Size
              </h3>
              <p className="text-sm text-[var(--fox-muted)]">
                Adjust the text size for better readability.
              </p>
            </div>
            <div className="flex bg-[var(--fox-input)] p-1 rounded-xl">
              <button
                onClick={() => setFontSize("sm")}
                className={`flex items-center justify-center w-12 h-10 rounded-lg transition-colors ${fontSize === "sm" ? "bg-[var(--fox-panel)] text-blue-500 shadow-sm" : "text-[var(--fox-muted)] hover:text-[var(--fox-text)]"}`}
                title="Small"
              >
                <span className="text-xs font-bold">A</span>
              </button>
              <button
                onClick={() => setFontSize("base")}
                className={`flex items-center justify-center w-12 h-10 rounded-lg transition-colors ${fontSize === "base" ? "bg-[var(--fox-panel)] text-blue-500 shadow-sm" : "text-[var(--fox-muted)] hover:text-[var(--fox-text)]"}`}
                title="Default"
              >
                <span className="text-sm font-bold">A</span>
              </button>
              <button
                onClick={() => setFontSize("lg")}
                className={`flex items-center justify-center w-12 h-10 rounded-lg transition-colors ${fontSize === "lg" ? "bg-[var(--fox-panel)] text-blue-500 shadow-sm" : "text-[var(--fox-muted)] hover:text-[var(--fox-text)]"}`}
                title="Large"
              >
                <span className="text-base font-bold">A</span>
              </button>
              <button
                onClick={() => setFontSize("xl")}
                className={`flex items-center justify-center w-12 h-10 rounded-lg transition-colors ${fontSize === "xl" ? "bg-[var(--fox-panel)] text-blue-500 shadow-sm" : "text-[var(--fox-muted)] hover:text-[var(--fox-text)]"}`}
                title="Extra Large"
              >
                <span className="text-lg font-bold">A</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-[var(--fox-border)] w-full"></div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-[var(--fox-text)]">
                Reduce Motion
              </h3>
              <p className="text-sm text-[var(--fox-muted)]">
                Minimize animations across the application.
              </p>
            </div>
            <label className="flex items-center cursor-pointer relative">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={reduceMotion}
                onChange={(e) => setReduceMotion(e.target.checked)}
              />
              <div className="w-14 h-7 bg-[var(--fox-border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}
