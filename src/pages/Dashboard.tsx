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
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
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
