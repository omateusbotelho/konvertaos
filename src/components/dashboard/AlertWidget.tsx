import { AlertTriangle, AlertCircle, Info, LucideIcon } from "lucide-react";
import { KonvertaCard, KonvertaCardHeader, KonvertaCardTitle } from "@/components/ui/konverta-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export interface AlertItem {
  id: string | number;
  title: string;
  description: string;
  variant: "warning" | "error" | "info";
  actionLabel?: string;
  actionHref?: string;
}

interface AlertWidgetProps {
  title: string;
  alerts: AlertItem[];
  isLoading?: boolean;
  emptyMessage?: string;
}

const variantConfig: Record<
  AlertItem["variant"],
  { icon: LucideIcon; bgClass: string; iconClass: string }
> = {
  warning: {
    icon: AlertTriangle,
    bgClass: "bg-amber-500/10",
    iconClass: "text-amber-500",
  },
  error: {
    icon: AlertCircle,
    bgClass: "bg-destructive/10",
    iconClass: "text-destructive",
  },
  info: {
    icon: Info,
    bgClass: "bg-primary/10",
    iconClass: "text-primary",
  },
};

export function AlertWidget({
  title,
  alerts,
  isLoading = false,
  emptyMessage = "Nenhum alerta",
}: AlertWidgetProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return <AlertWidgetSkeleton title={title} />;
  }

  return (
    <KonvertaCard className="h-full flex flex-col">
      <KonvertaCardHeader>
        <KonvertaCardTitle>{title}</KonvertaCardTitle>
      </KonvertaCardHeader>

      <div className="flex-1 space-y-3">
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {emptyMessage}
          </p>
        ) : (
          alerts.slice(0, 3).map((alert) => {
            const config = variantConfig[alert.variant];
            const Icon = config.icon;

            return (
              <div
                key={alert.id}
                className={cn(
                  "p-3 rounded-lg border border-border/40",
                  config.bgClass
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("mt-0.5", config.iconClass)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {alert.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {alert.description}
                    </p>
                    {alert.actionLabel && alert.actionHref && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 mt-1"
                        onClick={() => navigate(alert.actionHref!)}
                      >
                        {alert.actionLabel}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </KonvertaCard>
  );
}

function AlertWidgetSkeleton({ title }: { title: string }) {
  return (
    <KonvertaCard className="h-full flex flex-col">
      <KonvertaCardHeader>
        <KonvertaCardTitle>{title}</KonvertaCardTitle>
      </KonvertaCardHeader>
      <div className="flex-1 space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="p-3 rounded-lg bg-background">
            <div className="flex gap-3">
              <Skeleton className="h-4 w-4 mt-0.5" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </KonvertaCard>
  );
}
