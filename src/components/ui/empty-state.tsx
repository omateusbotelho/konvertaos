import { cn } from "@/lib/utils";
import { LucideIcon, SearchX, FileX, Inbox, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  variant?: "default" | "table" | "minimal";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  variant = "default",
}: EmptyStateProps) {
  const DefaultIcon = Icon || Inbox;

  if (variant === "minimal") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-8 px-4 text-center",
          className
        )}
      >
        <DefaultIcon className="h-6 w-6 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-16 px-4 text-center",
          className
        )}
      >
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 blur-xl scale-150" />
          <div className="relative rounded-full bg-gradient-to-br from-card to-background-secondary p-5 border border-border/30 shadow-lg">
            <DefaultIcon className="h-10 w-10 text-muted-foreground/70" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-xs">
            {description}
          </p>
        )}
        {action && <div className="mt-5">{action}</div>}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="mb-4 rounded-full bg-gradient-to-br from-background-secondary to-card p-4 border border-border/20">
        <DefaultIcon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Pre-configured empty states for common use cases
export function TableEmptyState({
  title = "Nenhum registro encontrado",
  description,
  action,
  icon,
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      variant="table"
      icon={icon || FolderOpen}
      title={title}
      description={description}
      action={action}
    />
  );
}

export function SearchEmptyState({
  title = "Nenhum resultado encontrado",
  description = "Tente ajustar os filtros ou termo de busca",
  action,
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      variant="table"
      icon={SearchX}
      title={title}
      description={description}
      action={action}
    />
  );
}

export function NoDataEmptyState({
  title = "Sem dados disponíveis",
  description,
  action,
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      variant="table"
      icon={FileX}
      title={title}
      description={description}
      action={action}
    />
  );
}
