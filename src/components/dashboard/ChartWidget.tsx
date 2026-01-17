import { lazy, Suspense } from "react";
import { KonvertaCard, KonvertaCardHeader, KonvertaCardTitle } from "@/components/ui/konverta-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
} from "recharts";

export type ChartType = "line" | "bar" | "pie";

export interface ChartDataPoint {
  name: string;
  value: number;
  value2?: number;
  [key: string]: string | number | undefined;
}

interface ChartWidgetProps {
  title: string;
  type: ChartType;
  data: ChartDataPoint[];
  config: ChartConfig;
  isLoading?: boolean;
  height?: number;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function ChartWidget({
  title,
  type,
  data,
  config,
  isLoading = false,
  height = 200,
}: ChartWidgetProps) {
  if (isLoading) {
    return <ChartWidgetSkeleton title={title} height={height} />;
  }

  return (
    <KonvertaCard className="h-full flex flex-col">
      <KonvertaCardHeader>
        <KonvertaCardTitle>{title}</KonvertaCardTitle>
      </KonvertaCardHeader>

      <div className="flex-1 min-h-0" style={{ height }}>
        {type === "line" && (
          <ChartContainer config={config} className="h-full w-full">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
              />
              {data[0]?.value2 !== undefined && (
                <Line
                  type="monotone"
                  dataKey="value2"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 0, r: 3 }}
                />
              )}
            </LineChart>
          </ChartContainer>
        )}

        {type === "bar" && (
          <ChartContainer config={config} className="h-full w-full">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              {data[0]?.value2 !== undefined && (
                <Bar dataKey="value2" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ChartContainer>
        )}

        {type === "pie" && (
          <ChartContainer config={config} className="h-full w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </div>
    </KonvertaCard>
  );
}

function ChartWidgetSkeleton({ title, height }: { title: string; height: number }) {
  return (
    <KonvertaCard className="h-full flex flex-col">
      <KonvertaCardHeader>
        <KonvertaCardTitle>{title}</KonvertaCardTitle>
      </KonvertaCardHeader>
      <div className="flex-1 flex items-center justify-center" style={{ height }}>
        <Skeleton className="w-full h-full rounded-lg" />
      </div>
    </KonvertaCard>
  );
}
