import { AppLayout } from "@/components/layout/AppLayout";
import { KonvertaCard } from "@/components/ui/konverta-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, TrendingDown, DollarSign, Users, ClipboardList, Download } from "lucide-react";
import { Link } from "react-router-dom";

const relatorios = [
  {
    id: "receitas",
    icon: DollarSign,
    title: "Relatório de Receitas",
    description: "Detalhamento de todas as receitas do período",
    color: "text-success",
  },
  {
    id: "despesas",
    icon: TrendingDown,
    title: "Relatório de Despesas",
    description: "Detalhamento de todos os custos fixos e variáveis",
    color: "text-destructive",
  },
  {
    id: "margem",
    icon: FileText,
    title: "Margem por Cliente",
    description: "Receita, custos e margem de lucro por cliente",
    color: "text-primary",
  },
  {
    id: "comissoes",
    icon: Users,
    title: "Relatório de Comissões",
    description: "Comissões pagas e pendentes por colaborador",
    color: "text-info",
  },
  {
    id: "dre",
    icon: ClipboardList,
    title: "DRE Simplificado",
    description: "Demonstrativo de Resultado do Exercício",
    color: "text-warning",
  },
];

export default function Relatorios() {
  const handleDownload = (tipo: string, formato: "pdf" | "excel") => {
    // TODO: Implement report generation
    console.log(`Gerando ${formato.toUpperCase()} para ${tipo}`);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/financeiro">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1>Relatórios Financeiros</h1>
            <p className="text-muted-foreground">Gere relatórios em PDF ou Excel</p>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {relatorios.map((relatorio) => {
            const Icon = relatorio.icon;
            return (
              <KonvertaCard key={relatorio.id} className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-card ${relatorio.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{relatorio.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {relatorio.description}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(relatorio.id, "pdf")}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(relatorio.id, "excel")}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                    </div>
                  </div>
                </div>
              </KonvertaCard>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
