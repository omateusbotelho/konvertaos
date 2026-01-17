import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { KonvertaCard } from "@/components/ui/konverta-card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  variacao?: number;
  sparklineData?: { value: number }[];
  href?: string;
  isLoading?: boolean;
  prefix?: string;
  suffix?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  variacao,
  sparklineData,
  href,
  isLoading = false,
  prefix = "",
  suffix = "",
}: StatCardProps) {
  const navigate = useNavigate();
  const isPositive = variacao !== undefined && variacao >= 0;

  if (isLoading) {
    return <StatCardSkeleton />;
  }

  return (
    <KonvertaCard
      className={cn(
        "group transition-all duration-150",
        href && "cursor-pointer hover:border-primary/30"
      )}
      onClick={() => href && navigate(href)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold text-foreground mt-1">
            {prefix}{typeof value === "number" ? value.toLocaleString("pt-BR") : value}{suffix}
          </p>
        </div>
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        {variacao !== undefined && (
          <div className="flex items-center gap-1">
            <div
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded",
                isPositive
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {isPositive ? "+" : ""}{variacao.toFixed(1)}%
            </div>
            <span className="text-xs text-muted-foreground">vs mês anterior</span>
          </div>
        )}

        {sparklineData && sparklineData.length > 0 && (
          <div className="h-8 w-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </KonvertaCard>
  );
}

export function StatCardSkeleton() {
  return (
    <KonvertaCard>
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      <div className="mt-3">
        <Skeleton className="h-4 w-32" />
      </div>
    </KonvertaCard>
  );
}
