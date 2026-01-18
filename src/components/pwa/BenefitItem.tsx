import { LucideIcon } from "lucide-react";

interface BenefitItemProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function BenefitItem({ icon: Icon, title, description }: BenefitItemProps) {
  return (
    <div className="group flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/10 transition-all duration-200 hover:bg-muted/50 hover:border-border/30 hover:shadow-sm cursor-default">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:bg-primary/15 group-hover:scale-105">
        <Icon className="w-5 h-5 text-primary transition-colors duration-200 group-hover:text-primary" />
      </div>
      <div className="space-y-0.5">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
