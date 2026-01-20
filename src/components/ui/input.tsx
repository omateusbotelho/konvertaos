import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  "aria-label"?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, "aria-label": ariaLabel, ...props }, ref) => {
    const inputClasses = cn(
      // Base styles
      "flex h-10 w-full rounded-lg text-base sm:text-sm text-foreground",
      // Background & Border
      "bg-muted/50 border border-border/40",
      // Placeholder
      "placeholder:text-muted-foreground",
      // Transitions
      "transition-all duration-200 ease-out",
      // Focus states - green accent
      "focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-muted/70",
      // Hover state
      "hover:border-border/60 hover:bg-muted/60",
      // Disabled state
      "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-muted/50",
      className
    );

    if (icon) {
      return (
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none flex items-center justify-center w-5 h-5">
            {icon}
          </div>
          <input
            type={type}
            aria-label={ariaLabel}
            className={cn(inputClasses, "px-3 py-2 pl-11")}
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
        className={cn(inputClasses, "px-3 py-2")}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
