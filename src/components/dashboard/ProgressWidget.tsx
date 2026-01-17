import { KonvertaCard, KonvertaCardHeader, KonvertaCardTitle } from "@/components/ui/konverta-card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ProgressWidgetProps {
  title: string;
  current: number;
  target: number;
  label?: string;
  showPercentage?: boolean;
  isLoading?: boolean;
}

export function ProgressWidget({
  title,
  current,
  target,
  label,
  showPercentage = true,
  isLoading = false,
}: ProgressWidgetProps) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const isComplete = current >= target;

  if (isLoading) {
    return <ProgressWidgetSkeleton title={title} />;
  }

  return (
    <KonvertaCard className="h-full flex flex-col">
      <KonvertaCardHeader>
        <KonvertaCardTitle>{title}</KonvertaCardTitle>
      </KonvertaCardHeader>

      <div className="flex-1 flex flex-col justify-center space-y-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-foreground">
            {current.toLocaleString("pt-BR")}
            <span className="text-lg font-normal text-muted-foreground">
              {" "}/ {target.toLocaleString("pt-BR")}
            </span>
          </p>
          {label && (
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
          )}
        </div>

        <div className="space-y-2">
          <Progress
            value={percentage}
            className={cn(
              "h-3",
              isComplete && "[&>div]:bg-emerald-500"
            )}
          />
          {showPercentage && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span
                className={cn(
                  "font-medium",
                  isComplete ? "text-emerald-500" : "text-primary"
                )}
              >
                {percentage.toFixed(0)}%
              </span>
              <span>100%</span>
            </div>
          )}
        </div>
      </div>
    </KonvertaCard>
  );
}

function ProgressWidgetSkeleton({ title }: { title: string }) {
  return (
    <KonvertaCard className="h-full flex flex-col">
      <KonvertaCardHeader>
        <KonvertaCardTitle>{title}</KonvertaCardTitle>
      </KonvertaCardHeader>
      <div className="flex-1 flex flex-col justify-center space-y-4">
        <div className="text-center">
          <Skeleton className="h-9 w-24 mx-auto mb-2" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
        <Skeleton className="h-3 w-full" />
      </div>
    </KonvertaCard>
  );
}
