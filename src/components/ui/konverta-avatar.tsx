import { useState } from "react";
import { cn, getInitials } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { User } from "lucide-react";

const avatarVariants = cva(
  "inline-flex items-center justify-center rounded-full bg-primary/10 text-primary font-medium overflow-hidden",
  {
    variants: {
      size: {
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
        xl: "h-16 w-16 text-lg",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
};

interface KonvertaAvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  name?: string;
}

export function KonvertaAvatar({
  className,
  size = "md",
  src,
  alt,
  name,
  ...props
}: KonvertaAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const initials = name ? getInitials(name) : null;
  const iconSize = iconSizes[size || "md"];

  // Show image if src exists and hasn't errored
  if (src && !imageError) {
    return (
      <div className={cn(avatarVariants({ size }), className)} {...props}>
        <img
          src={src}
          alt={alt || name || "Avatar"}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Show initials if name is available
  if (initials) {
    return (
      <div className={cn(avatarVariants({ size }), className)} {...props}>
        {initials}
      </div>
    );
  }

  // Fallback: show generic user icon
  return (
    <div className={cn(avatarVariants({ size }), "bg-muted", className)} {...props}>
      <User className={cn(iconSize, "text-muted-foreground")} />
    </div>
  );
}
