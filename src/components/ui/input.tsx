import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  "aria-label"?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, "aria-label": ariaLabel, ...props }, ref) => {
    if (icon) {
      return (
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none flex items-center justify-center w-5 h-5">
            {icon}
          </div>
          <input
            type={type}
            aria-label={ariaLabel}
            className={cn(
              "flex h-10 w-full rounded-lg border border-border/40 bg-input px-3 py-2 pl-11 text-base sm:text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150 ease-in-out focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
      );
    }

    return (
      <input
        type={type}
        aria-label={ariaLabel}
        className={cn(
          "flex h-10 w-full rounded-lg border border-border/40 bg-input px-3 py-2 text-base sm:text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150 ease-in-out focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
