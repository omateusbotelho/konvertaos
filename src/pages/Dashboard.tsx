import { Suspense, lazy } from "react";
import { AppLayout } from "@/components/layout";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load dashboard views for each role
const AdminDashboard = lazy(() => import("@/components/dashboard/views/AdminDashboard"));
const SDRDashboard = lazy(() => import("@/components/dashboard/views/SDRDashboard"));
const CloserDashboard = lazy(() => import("@/components/dashboard/views/CloserDashboard"));
const OperacionalDashboard = lazy(() => import("@/components/dashboard/views/OperacionalDashboard"));
const FinanceiroDashboard = lazy(() => import("@/components/dashboard/views/FinanceiroDashboard"));

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header skeleton matching final layout */}
      <div>
        <Skeleton className="h-8 w-56 mb-2" />
        <Skeleton className="h-5 w-40" />
      </div>

      {/* Stats grid skeleton - matches StatCard layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border/20 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Skeleton className="h-5 w-16 rounded" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Second row skeleton - matches ListWidget/ProgressWidget layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { dashboardData, userName, greeting, formattedDate, isLoading } = useDashboardData();

  if (isLoading) {
    return (
      <AppLayout>
        <DashboardSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {greeting}, {userName.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground mt-1 capitalize">
            {formattedDate}
          </p>
        </div>

        {/* Role-based Dashboard Content */}
        <Suspense fallback={<DashboardSkeleton />}>
          {dashboardData.tipo === "admin" && <AdminDashboard data={dashboardData.data} />}
          {dashboardData.tipo === "sdr" && <SDRDashboard data={dashboardData.data} />}
          {dashboardData.tipo === "closer" && <CloserDashboard data={dashboardData.data} />}
          {dashboardData.tipo === "operacional" && <OperacionalDashboard data={dashboardData.data} />}
          {dashboardData.tipo === "financeiro" && <FinanceiroDashboard data={dashboardData.data} />}
        </Suspense>
      </div>
    </AppLayout>
  );
}
