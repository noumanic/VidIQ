"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/lib/theme";

export function ThemedToaster() {
  const { resolved } = useTheme();
  return (
    <Toaster
      theme={resolved}
      richColors
      position="top-right"
      toastOptions={{
        style: {
          background:
            resolved === "dark"
              ? "hsl(265 30% 10% / 0.95)"
              : "hsl(0 0% 100% / 0.95)",
          border:
            resolved === "dark"
              ? "1px solid hsl(270 30% 100% / 0.08)"
              : "1px solid hsl(270 20% 90%)",
          backdropFilter: "blur(12px)",
        },
      }}
    />
  );
}
