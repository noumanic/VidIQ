"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "vidiq-theme";

type Ctx = {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

const ThemeCtx = createContext<Ctx | null>(null);

function readStored(): Theme {
  if (typeof window === "undefined") return "dark";
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === "light" || v === "dark" || v === "system") return v;
  return "dark";
}

function systemPref(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyClass(t: "light" | "dark") {
  const root = document.documentElement;
  if (t === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  // Also flip the meta theme-color so browser chrome matches.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", t === "dark" ? "#0a0612" : "#faf7ff");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [resolved, setResolved] = useState<"light" | "dark">("dark");

  // Load on mount
  useEffect(() => {
    const stored = readStored();
    const eff = stored === "system" ? systemPref() : stored;
    setThemeState(stored);
    setResolved(eff);
    applyClass(eff);
  }, []);

  // React to OS preference changes when in "system" mode
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => {
      const eff = mq.matches ? "light" : "dark";
      setResolved(eff);
      applyClass(eff);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    window.localStorage.setItem(STORAGE_KEY, t);
    const eff = t === "system" ? systemPref() : t;
    setResolved(eff);
    applyClass(eff);
  }, []);

  const toggle = useCallback(() => {
    setTheme(resolved === "dark" ? "light" : "dark");
  }, [resolved, setTheme]);

  return (
    <ThemeCtx.Provider value={{ theme, resolved, setTheme, toggle }}>{children}</ThemeCtx.Provider>
  );
}

export function useTheme(): Ctx {
  const ctx = useContext(ThemeCtx);
  if (!ctx)
    return {
      theme: "dark",
      resolved: "dark",
      setTheme: () => {},
      toggle: () => {},
    };
  return ctx;
}

/** Inline script body — runs in <head> before hydration to apply the
 *  stored theme synchronously and avoid a flash of wrong colours. */
export const THEME_INIT_SCRIPT = `
(function() {
  try {
    var k = "${STORAGE_KEY}";
    var stored = localStorage.getItem(k);
    var t = stored === "light" || stored === "dark" || stored === "system" ? stored : "dark";
    var eff = t === "system"
      ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
      : t;
    var root = document.documentElement;
    if (eff === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  } catch (e) {}
})();
`.trim();
