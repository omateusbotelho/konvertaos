import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary green button with enhanced hover
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/85 hover:shadow-md active:scale-[0.98]",
        // Secondary with brand blue
        secondary: "bg-secondary text-secondary-foreground border border-border/30 hover:bg-secondary/80 hover:border-border/50",
        // Ghost - subtle hover
        ghost: "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        // Destructive - red
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98]",
        // Link style
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        // Outline - bordered
        outline: "border border-border bg-transparent text-foreground hover:bg-muted/30 hover:border-primary/50",
        // Success variant (same as primary for this theme)
        success: "bg-primary text-primary-foreground hover:bg-primary/85 active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-6 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
