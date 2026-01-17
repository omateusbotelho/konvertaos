import { ArrowUpRight } from "lucide-react";
import { KonvertaCard, KonvertaCardHeader, KonvertaCardTitle } from "@/components/ui/konverta-card";
import { KonvertaBadge } from "@/components/ui/konverta-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface ListItem {
  id: string | number;
  primary: string;
  secondary?: string;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "warning" | "success" | "info";
  };
  href?: string;
}

interface ListWidgetProps {
  title: string;
  items: ListItem[];
  viewAllHref?: string;
  viewAllLabel?: string;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function ListWidget({
  title,
  items,
  viewAllHref,
  viewAllLabel = "Ver todos",
  isLoading = false,
  emptyMessage = "Nenhum item encontrado",
}: ListWidgetProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return <ListWidgetSkeleton title={title} />;
  }

  return (
    <KonvertaCard className="h-full flex flex-col">
      <KonvertaCardHeader>
        <KonvertaCardTitle>{title}</KonvertaCardTitle>
        {viewAllHref && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(viewAllHref)}
          >
            {viewAllLabel}
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        )}
      </KonvertaCardHeader>

      <div className="flex-1 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {emptyMessage}
          </p>
        ) : (
          items.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg bg-background hover:bg-background-secondary transition-colors",
                item.href && "cursor-pointer"
              )}
              onClick={() => item.href && navigate(item.href)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.primary}
                </p>
                {item.secondary && (
                  <p className="text-xs text-muted-foreground truncate">
                    {item.secondary}
                  </p>
                )}
              </div>
              {item.badge && (
                <KonvertaBadge variant={item.badge.variant || "secondary"}>
                  {item.badge.text}
                </KonvertaBadge>
              )}
            </div>
          ))
        )}
      </div>
    </KonvertaCard>
  );
}

function ListWidgetSkeleton({ title }: { title: string }) {
  return (
    <KonvertaCard className="h-full flex flex-col">
      <KonvertaCardHeader>
        <KonvertaCardTitle>{title}</KonvertaCardTitle>
      </KonvertaCardHeader>
      <div className="flex-1 space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 rounded-lg bg-background">
            <Skeleton className="h-4 w-3/4 mb-1" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </KonvertaCard>
  );
}
