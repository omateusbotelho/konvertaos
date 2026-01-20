import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          // Base styles
          "flex min-h-[100px] w-full rounded-lg text-sm text-foreground resize-none",
          // Background & Border
          "bg-muted/50 border border-border/40",
          // Padding
          "px-3 py-2.5",
          // Placeholder
          "placeholder:text-muted-foreground",
          // Transitions
          "transition-all duration-200 ease-out",
          // Focus states - green accent
          "focus:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus:bg-muted/70",
          // Hover state
          "hover:border-border/60 hover:bg-muted/60",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-muted/50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
