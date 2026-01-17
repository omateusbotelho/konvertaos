import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KonvertaAvatar } from "@/components/ui/konverta-avatar";
import { ArrowLeft, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuditLog, useAuditEntidades, useAuditUsuarios, AuditLogFilters } from "@/hooks/useAuditLog";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ACOES = [
  { value: 'Criou', label: 'Criou' },
  { value: 'Atualizou', label: 'Atualizou' },
  { value: 'Excluiu', label: 'Excluiu' },
];

const ENTIDADE_LABELS: Record<string, string> = {
  clientes: 'Clientes',
  leads: 'Leads',
  tarefas: 'Tarefas',
  cobrancas: 'Cobranças',
  projetos: 'Projetos',
  reunioes: 'Reuniões',
};

export default function Auditoria() {
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data: auditData, isLoading } = useAuditLog(filters, page, pageSize);
  const { data: entidades } = useAuditEntidades();
  const { data: usuarios } = useAuditUsuarios();

  const totalPages = Math.ceil((auditData?.totalCount || 0) / pageSize);

  const getDetalhes = (entry: { acao: string; entidade: string; dados_anteriores?: Record<string, unknown> | null; dados_novos?: Record<string, unknown> | null }) => {
    if (entry.acao === 'Atualizou' && entry.dados_anteriores && entry.dados_novos) {
      const changes: string[] = [];
      const keys = new Set([
        ...Object.keys(entry.dados_anteriores || {}),
        ...Object.keys(entry.dados_novos || {})
      ]);

      keys.forEach(key => {
        if (key === 'updated_at' || key === 'created_at' || key === 'id') return;
        const oldVal = entry.dados_anteriores?.[key];
        const newVal = entry.dados_novos?.[key];
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          changes.push(`${key}: ${oldVal} → ${newVal}`);
        }
      });

      return changes.slice(0, 2).join(', ') + (changes.length > 2 ? '...' : '');
    }

    if (entry.dados_novos) {
      const nome = (entry.dados_novos as Record<string, unknown>).nome || 
                   (entry.dados_novos as Record<string, unknown>).titulo || 
                   (entry.dados_novos as Record<string, unknown>).razao_social;
      if (nome) return `"${nome}"`;
    }

    return '';
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/configuracoes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Log de Auditoria</h1>
            <p className="text-muted-foreground">
              Histórico de todas as alterações no sistema
            </p>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <Select 
                value={filters.usuario_id || ''} 
                onValueChange={(v) => {
                  setFilters({ ...filters, usuario_id: v || undefined });
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os usuários</SelectItem>
                  {usuarios?.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={filters.acao || ''} 
                onValueChange={(v) => {
                  setFilters({ ...filters, acao: v || undefined });
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as ações</SelectItem>
                  {ACOES.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={filters.entidade || ''} 
                onValueChange={(v) => {
                  setFilters({ ...filters, entidade: v || undefined });
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Entidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as entidades</SelectItem>
                  {entidades?.map((e) => (
                    <SelectItem key={e} value={e}>
                      {ENTIDADE_LABELS[e] || e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !filters.dataInicio && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dataInicio ? format(filters.dataInicio, "dd/MM/yyyy") : "Data início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dataInicio}
                    onSelect={(date) => {
                      setFilters({ ...filters, dataInicio: date || undefined });
                      setPage(0);
                    }}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !filters.dataFim && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dataFim ? format(filters.dataFim, "dd/MM/yyyy") : "Data fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dataFim}
                    onSelect={(date) => {
                      setFilters({ ...filters, dataFim: date || undefined });
                      setPage(0);
                    }}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>

              {(filters.usuario_id || filters.acao || filters.entidade || filters.dataInicio || filters.dataFim) && (
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setFilters({});
                    setPage(0);
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-4 p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : auditData?.data.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">
                Nenhum registro encontrado
              </p>
            ) : (
              <div className="divide-y">
                {auditData?.data.map((entry) => (
                  <div key={entry.id} className="p-4 hover:bg-muted/50">
                    <div className="flex items-start gap-4">
                      <div className="text-sm text-muted-foreground w-40 shrink-0">
                        {format(new Date(entry.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </div>
                      <div className="flex items-center gap-2 w-36 shrink-0">
                        <KonvertaAvatar
                          src={entry.usuario?.avatar_url}
                          name={entry.usuario?.nome || 'Sistema'}
                          size="sm"
                        />
                        <span className="text-sm truncate">
                          {entry.usuario?.nome || 'Sistema'}
                        </span>
                      </div>
                      <div className="w-24 shrink-0">
                        <span className={cn(
                          "text-sm font-medium",
                          entry.acao === 'Criou' && 'text-green-600',
                          entry.acao === 'Atualizou' && 'text-blue-600',
                          entry.acao === 'Excluiu' && 'text-red-600'
                        )}>
                          {entry.acao}
                        </span>
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">
                          {ENTIDADE_LABELS[entry.entidade] || entry.entidade}
                        </span>
                        {getDetalhes(entry) && (
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {getDetalhes(entry)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {page * pageSize + 1} a {Math.min((page + 1) * pageSize, auditData?.totalCount || 0)} de {auditData?.totalCount} registros
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1}
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
