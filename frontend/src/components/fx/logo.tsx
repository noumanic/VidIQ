"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

/** The VidIQ logo mark — uses the bundled SVG (vector, scales perfectly
 *  at any size) with a subtle glow halo. */
export function LogoMark({
  size = 36,
  className,
  glow = true,
}: {
  size?: number;
  className?: string;
  glow?: boolean;
}) {
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {glow && (
        <span
          aria-hidden
          className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-purple-600 opacity-60 blur-xl"
        />
      )}
      <Image
        src="/vidiq_logo_black_bg.svg"
        alt="VidIQ"
        width={size}
        height={size}
        priority
        className="rounded-xl object-cover"
      />
    </span>
  );
}

/** Big animated splash version for hero. */
export function LogoSplash({ size = 120 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex animate-float items-center justify-center"
      style={{ width: size, height: size }}
    >
      <span
        aria-hidden
        className="absolute -inset-6 rounded-full bg-gradient-to-br from-violet-500/40 via-fuchsia-500/30 to-cyan-500/20 blur-3xl"
      />
      <span
        aria-hidden
        className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 blur-md"
      />
      <Image
        src="/vidiq_logo_black_bg.svg"
        alt="VidIQ"
        width={size}
        height={size}
        priority
        className="relative rounded-3xl object-cover ring-1 ring-white/10"
      />
    </span>
  );
}
