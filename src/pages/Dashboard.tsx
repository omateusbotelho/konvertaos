import { AppLayout } from "@/components/layout";
import { KonvertaCard, KonvertaCardHeader, KonvertaCardTitle } from "@/components/ui/konverta-card";
import { KonvertaBadge } from "@/components/ui/konverta-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  Users,
  FolderKanban,
  TrendingUp,
  Clock,
  Plus,
  ArrowUpRight,
  LayoutDashboard,
} from "lucide-react";

const stats = [
  {
    title: "Clientes Ativos",
    value: "24",
    change: "+12%",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    title: "Projetos em Andamento",
    value: "18",
    change: "+5%",
    changeType: "positive" as const,
    icon: FolderKanban,
  },
  {
    title: "Taxa de Conversão",
    value: "68%",
    change: "+8%",
    changeType: "positive" as const,
    icon: TrendingUp,
  },
  {
    title: "Horas Registradas",
    value: "342h",
    change: "-3%",
    changeType: "negative" as const,
    icon: Clock,
  },
];

const recentProjects = [
  { id: 1, name: "Campanha Black Friday", client: "TechStore", status: "Em andamento" },
  { id: 2, name: "Rebranding", client: "FoodCo", status: "Revisão" },
  { id: 3, name: "Social Media Q1", client: "FashionBrand", status: "Planejamento" },
];

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1>Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Visão geral da sua agência
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4" />
            Novo Projeto
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <KonvertaCard key={stat.title} className="group hover:border-border/40 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-semibold text-foreground mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1">
                <KonvertaBadge
                  variant={stat.changeType === "positive" ? "success" : "destructive"}
                >
                  {stat.change}
                </KonvertaBadge>
                <span className="text-xs text-muted-foreground">vs mês anterior</span>
              </div>
            </KonvertaCard>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Projects */}
          <KonvertaCard className="lg:col-span-2">
            <KonvertaCardHeader>
              <KonvertaCardTitle>Projetos Recentes</KonvertaCardTitle>
              <Button variant="ghost" size="sm">
                Ver todos
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </KonvertaCardHeader>

            <div className="space-y-3">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-background-secondary transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FolderKanban className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {project.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {project.client}
                      </p>
                    </div>
                  </div>
                  <KonvertaBadge
                    variant={
                      project.status === "Em andamento"
                        ? "info"
                        : project.status === "Revisão"
                        ? "warning"
                        : "secondary"
                    }
                  >
                    {project.status}
                  </KonvertaBadge>
                </div>
              ))}
            </div>
          </KonvertaCard>

          {/* Quick Actions */}
          <KonvertaCard>
            <KonvertaCardHeader>
              <KonvertaCardTitle>Ações Rápidas</KonvertaCardTitle>
            </KonvertaCardHeader>

            <div className="space-y-2">
              <Button variant="secondary" className="w-full justify-start">
                <Users className="h-4 w-4" />
                Adicionar Cliente
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                <FolderKanban className="h-4 w-4" />
                Criar Projeto
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                <Clock className="h-4 w-4" />
                Registrar Horas
              </Button>
            </div>
          </KonvertaCard>
        </div>

        {/* Activity section placeholder */}
        <KonvertaCard>
          <KonvertaCardHeader>
            <KonvertaCardTitle>Atividade Recente</KonvertaCardTitle>
          </KonvertaCardHeader>
          <EmptyState
            icon={LayoutDashboard}
            title="Nenhuma atividade recente"
            description="As atividades da equipe aparecerão aqui conforme forem registradas."
          />
        </KonvertaCard>
      </div>
    </AppLayout>
  );
}
