import { cn } from "@/lib/utils";

interface KonvertaCardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function KonvertaCard({
  className,
  padding = "md",
  children,
  ...props
}: KonvertaCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-card border border-border/20",
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface KonvertaCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function KonvertaCardHeader({
  className,
  children,
  ...props
}: KonvertaCardHeaderProps) {
  return (
    <div
      className={cn("flex items-center justify-between mb-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface KonvertaCardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {}

export function KonvertaCardTitle({
  className,
  children,
  ...props
}: KonvertaCardTitleProps) {
  return (
    <h3 className={cn("text-lg font-medium text-foreground", className)} {...props}>
      {children}
    </h3>
  );
}
