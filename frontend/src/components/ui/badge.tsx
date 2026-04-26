import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/20",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-red-500/15 text-red-200 ring-1 ring-red-400/30",
        outline: "border-white/[0.08] bg-white/[0.02] text-foreground",
        success:
          "border-transparent bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30",
        warning:
          "border-transparent bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30",
        live: "border-transparent bg-red-500/15 text-red-200 ring-1 ring-red-400/30",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
