import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium",
    "ring-offset-background transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:size-4 [&_svg]:shrink-0",
    "active:scale-[0.97]",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30",
        destructive:
          "rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "rounded-lg border border-white/[0.08] bg-white/[0.02] text-foreground backdrop-blur-sm hover:bg-white/[0.06] hover:border-white/[0.12]",
        secondary:
          "rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "rounded-lg text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: [
          "group relative overflow-hidden rounded-lg",
          "bg-[linear-gradient(110deg,#7c3aed_0%,#a855f7_40%,#d946ef_70%,#7c3aed_100%)] bg-[length:200%_100%]",
          "text-white shadow-lg shadow-violet-600/30",
          "hover:bg-[length:200%_100%] hover:bg-right hover:shadow-xl hover:shadow-violet-600/50",
          "transition-[background-position,box-shadow] duration-700",
        ].join(" "),
        glass:
          "rounded-lg border border-white/[0.08] bg-white/[0.04] text-foreground backdrop-blur-md hover:bg-white/[0.08] hover:border-white/[0.16]",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-6 text-sm",
        xl: "h-14 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
