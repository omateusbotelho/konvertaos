import { cn, getInitials } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

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

interface KonvertaAvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  name?: string;
}

export function KonvertaAvatar({
  className,
  size,
  src,
  alt,
  name,
  ...props
}: KonvertaAvatarProps) {
  if (src) {
    return (
      <div className={cn(avatarVariants({ size }), className)} {...props}>
        <img
          src={src}
          alt={alt || name}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={cn(avatarVariants({ size }), className)} {...props}>
      {name ? getInitials(name) : "?"}
    </div>
  );
}
