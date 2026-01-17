import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  useNPSStats, 
  useNPSRespostas, 
  useNPSDetratores,
  useNPSEvolucao 
} from '@/hooks/useNPS';
import { KonvertaCard } from '@/components/ui/konverta-card';
import { StatCard } from '@/components/dashboard';
import { ChartWidget } from '@/components/dashboard/ChartWidget';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  TrendingUp, 
  Users, 
  ThumbsUp, 
  ThumbsDown,
  AlertTriangle,
  Settings,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function NPSDashboard() {
  const [periodo, setPeriodo] = useState<'mes' | 'trimestre' | 'ano' | 'todos'>('todos');
  
  const { data: stats, isLoading: loadingStats } = useNPSStats();
  const { data: respostas, isLoading: loadingRespostas } = useNPSRespostas({ periodo });
  const { data: detratores, isLoading: loadingDetratores } = useNPSDetratores(5);
  const { data: evolucao, isLoading: loadingEvolucao } = useNPSEvolucao(6);

  const getNPSLabel = (score: number) => {
    if (score >= 75) return { label: 'Excelente!', color: 'text-green-500' };
    if (score >= 50) return { label: 'Muito Bom', color: 'text-green-400' };
    if (score >= 0) return { label: 'Bom', color: 'text-yellow-500' };
    return { label: 'Precisa Melhorar', color: 'text-red-500' };
  };

  const getScoreType = (score: number) => {
    if (score >= 9) return { label: 'Promotor', variant: 'default' as const, color: 'bg-green-500' };
    if (score >= 7) return { label: 'Neutro', variant: 'secondary' as const, color: 'bg-yellow-500' };
    return { label: 'Detrator', variant: 'destructive' as const, color: 'bg-red-500' };
  };

  const npsInfo = stats ? getNPSLabel(stats.npsScore) : null;

  const chartConfig = {
    nps: { label: 'NPS', color: 'hsl(var(--primary))' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">NPS - Net Promoter Score</h1>
          <p className="text-muted-foreground">Acompanhe a satisfação dos seus clientes</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/configuracoes/nps">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KonvertaCard className="p-6">
          <div className="flex flex-col items-center text-center">
            <span className="text-sm text-muted-foreground mb-2">NPS Atual</span>
            <span className={`text-5xl font-bold ${npsInfo?.color || ''}`}>
              {stats?.npsScore !== undefined ? (stats.npsScore >= 0 ? '+' : '') + stats.npsScore : '--'}
            </span>
            <span className={`text-sm mt-1 ${npsInfo?.color || 'text-muted-foreground'}`}>
              {npsInfo?.label || 'Sem dados'}
            </span>
          </div>
        </KonvertaCard>

        <StatCard
          label="Total de Respostas"
          value={stats?.totalRespostas || 0}
          icon={Users}
          isLoading={loadingStats}
        />

        <StatCard
          label="Promotores"
          value={stats?.promotores || 0}
          icon={ThumbsUp}
          variacao={stats?.totalRespostas ? Math.round((stats.promotores / stats.totalRespostas) * 100) : undefined}
          isLoading={loadingStats}
        />

        <StatCard
          label="Detratores"
          value={stats?.detratores || 0}
          icon={ThumbsDown}
          variacao={stats?.totalRespostas ? -Math.round((stats.detratores / stats.totalRespostas) * 100) : undefined}
          isLoading={loadingStats}
        />
      </div>

      {/* Distribution and Evolution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution */}
        <KonvertaCard>
          <div className="p-4 border-b">
            <h3 className="font-semibold">Distribuição de Respostas</h3>
          </div>
          <div className="p-6 space-y-4">
            {/* Promotores */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  Promotores (9-10)
                </span>
                <span className="font-medium">
                  {stats?.promotores || 0} ({stats?.totalRespostas ? Math.round((stats.promotores / stats.totalRespostas) * 100) : 0}%)
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats?.totalRespostas ? (stats.promotores / stats.totalRespostas) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Neutros */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-500" />
                  Neutros (7-8)
                </span>
                <span className="font-medium">
                  {stats?.neutros || 0} ({stats?.totalRespostas ? Math.round((stats.neutros / stats.totalRespostas) * 100) : 0}%)
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats?.totalRespostas ? (stats.neutros / stats.totalRespostas) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Detratores */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  Detratores (0-6)
                </span>
                <span className="font-medium">
                  {stats?.detratores || 0} ({stats?.totalRespostas ? Math.round((stats.detratores / stats.totalRespostas) * 100) : 0}%)
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats?.totalRespostas ? (stats.detratores / stats.totalRespostas) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </KonvertaCard>

        {/* Evolution Chart */}
        <ChartWidget
          title="Evolução do NPS (últimos 6 meses)"
          type="line"
          data={evolucao || []}
          config={chartConfig}
          isLoading={loadingEvolucao}
          height={200}
        />
      </div>

      {/* Detractors Alert */}
      {detratores && detratores.length > 0 && (
        <KonvertaCard>
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <h3 className="font-semibold">Alertas - Detratores Recentes</h3>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/nps/respostas?tipo=detrator">Ver todos</Link>
            </Button>
          </div>
          <div className="divide-y">
            {detratores.map((resposta) => (
              <div key={resposta.id} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <span className="text-red-600 dark:text-red-400 font-bold">{resposta.score}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {resposta.cliente?.nome_fantasia || resposta.cliente?.razao_social}
                  </p>
                  {resposta.comentario && (
                    <p className="text-sm text-muted-foreground truncate">
                      "{resposta.comentario}"
                    </p>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {resposta.created_at && format(new Date(resposta.created_at), "dd/MM", { locale: ptBR })}
                </span>
              </div>
            ))}
          </div>
        </KonvertaCard>
      )}

      {/* Recent Responses Table */}
      <KonvertaCard>
        <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="font-semibold">Respostas Recentes</h3>
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as typeof periodo)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes">Este mês</SelectItem>
              <SelectItem value="trimestre">Último trimestre</SelectItem>
              <SelectItem value="ano">Este ano</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-center">Score</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Comentário</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingRespostas ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : respostas && respostas.length > 0 ? (
              respostas.slice(0, 10).map((resposta) => {
                const tipo = getScoreType(resposta.score);
                return (
                  <TableRow key={resposta.id}>
                    <TableCell className="font-medium">
                      {resposta.cliente?.nome_fantasia || resposta.cliente?.razao_social}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm ${tipo.color}`}>
                        {resposta.score}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tipo.variant}>{tipo.label}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {resposta.comentario || '-'}
                    </TableCell>
                    <TableCell>
                      {resposta.created_at && format(new Date(resposta.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhuma resposta encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {respostas && respostas.length > 10 && (
          <div className="p-4 border-t text-center">
            <Button variant="ghost" asChild>
              <Link to="/nps/respostas">
                Ver todas as respostas
                <ExternalLink className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}
      </KonvertaCard>
    </div>
  );
}
