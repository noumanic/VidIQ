"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/** Thin gradient progress bar at the very top of the viewport.
 *
 *  App Router doesn't expose router events, so we watch document-level
 *  clicks on internal anchors / `<Link>` elements (those produce same-
 *  origin `<a>` tags) and start an in-flight bar. When the pathname
 *  changes we complete it. If the navigation never happens (e.g. user
 *  cancelled), we time out after a few seconds. */
export function NavigationProgress() {
  const path = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const startedAt = useRef<number | null>(null);
  const navTo = useRef<string | null>(null);
  const tickRef = useRef<number | null>(null);
  const safetyRef = useRef<number | null>(null);

  useEffect(() => {
    function start(targetHref: string) {
      navTo.current = targetHref;
      startedAt.current = performance.now();
      setVisible(true);
      setProgress(8);
      // Animate towards 80% asymptotically while the route loads.
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = window.setInterval(() => {
        setProgress((p) => {
          if (p >= 85) return p;
          // Ease towards 85%
          return p + Math.max(1, (85 - p) * 0.06);
        });
      }, 90);
      // Safety timeout — if navigation stalls, finish after 6 s.
      if (safetyRef.current) window.clearTimeout(safetyRef.current);
      safetyRef.current = window.setTimeout(finish, 6000);
    }

    function finish() {
      if (tickRef.current) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
      if (safetyRef.current) {
        window.clearTimeout(safetyRef.current);
        safetyRef.current = null;
      }
      navTo.current = null;
      setProgress(100);
      // Hide after the fill animation finishes.
      window.setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 220);
    }

    function onClick(e: MouseEvent) {
      // Only same-origin left-clicks without modifier keys count as navigation.
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const t = e.target as HTMLElement | null;
      const a = t?.closest?.("a") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href) return;
      // Ignore external, hash-only, mailto, tel.
      if (
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#") ||
        a.target === "_blank" ||
        a.hasAttribute("download")
      )
        return;
      // Same path → no-op
      try {
        const url = new URL(a.href);
        if (url.pathname === window.location.pathname) return;
        start(url.pathname);
      } catch {
        /* ignore */
      }
    }

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (tickRef.current) window.clearInterval(tickRef.current);
      if (safetyRef.current) window.clearTimeout(safetyRef.current);
    };
  }, []);

  // Whenever pathname actually changes, finish the bar.
  useEffect(() => {
    if (!visible) return;
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setProgress(100);
    const t = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 220);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed left-0 right-0 top-0 z-[80] h-[2px]"
      style={{ contain: "layout paint" }}
    >
      <div
        className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]"
        style={{
          width: `${progress}%`,
          transition: "width 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
    </div>
  );
}
