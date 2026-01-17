import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KonvertaAvatar } from "@/components/ui/konverta-avatar";
import { Trophy, Target, CheckCircle2, Users, TrendingUp, TrendingDown } from "lucide-react";
import { useRanking, useMeuDesempenho } from "@/hooks/useRanking";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

const SETORES = [
  { value: 'comercial', label: 'Comercial' },
  { value: 'trafego', label: 'Tráfego' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'financeiro', label: 'Financeiro' },
];

export default function Ranking() {
  const { profile } = useAuth();
  const [mes, setMes] = useState(new Date());
  const [setor, setSetor] = useState<string | undefined>(undefined);

  const { data: ranking, isLoading: rankingLoading } = useRanking(mes, setor);
  const { data: meuDesempenho, isLoading: desempenhoLoading } = useMeuDesempenho();

  // Encontrar posição do usuário atual no ranking
  const minhaPosicao = ranking?.findIndex(r => r.id === profile?.id) ?? -1;
  const posicaoDisplay = minhaPosicao >= 0 ? minhaPosicao + 1 : null;

  // Gerar últimos 6 meses para seleção
  const mesesDisponiveis = Array.from({ length: 6 }, (_, i) => {
    const data = subMonths(new Date(), i);
    return {
      value: data.toISOString(),
      label: format(data, "MMMM 'de' yyyy", { locale: ptBR })
    };
  });

  const getMedalha = (posicao: number) => {
    switch (posicao) {
      case 0: return "🥇";
      case 1: return "🥈";
      case 2: return "🥉";
      default: return posicao + 1;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold">Ranking - {format(mes, "MMMM yyyy", { locale: ptBR })}</h1>
          <div className="flex gap-2">
            <Select value={mes.toISOString()} onValueChange={(v) => setMes(new Date(v))}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {mesesDisponiveis.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={setor || profile?.setor || ''} onValueChange={(v) => setSetor(v || undefined)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Setor" />
              </SelectTrigger>
              <SelectContent>
                {SETORES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Meu Desempenho */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Seu Desempenho
            </CardTitle>
          </CardHeader>
          <CardContent>
            {desempenhoLoading ? (
              <div className="flex gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24 flex-1" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-4 items-start">
                <div className="flex items-center gap-4">
                  <KonvertaAvatar
                    src={profile?.avatar_url}
                    name={profile?.nome || ''}
                    size="lg"
                  />
                  <div>
                    <p className="font-semibold text-lg">{profile?.nome}</p>
                    {posicaoDisplay && (
                      <p className="text-muted-foreground">
                        #{posicaoDisplay} no ranking
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{meuDesempenho?.tarefas_concluidas || 0}</p>
                      <p className="text-xs text-muted-foreground">Tarefas</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      <Target className="h-6 w-6 mx-auto mb-2 text-green-500" />
                      <p className="text-2xl font-bold">{meuDesempenho?.taxa_prazo || 0}%</p>
                      <p className="text-xs text-muted-foreground">No Prazo</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                      <p className="text-2xl font-bold">{meuDesempenho?.clientes_atendidos || 0}</p>
                      <p className="text-xs text-muted-foreground">Clientes</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      {(meuDesempenho?.variacao_mes_anterior || 0) >= 0 ? (
                        <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
                      ) : (
                        <TrendingDown className="h-6 w-6 mx-auto mb-2 text-red-500" />
                      )}
                      <p className={`text-2xl font-bold ${(meuDesempenho?.variacao_mes_anterior || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(meuDesempenho?.variacao_mes_anterior || 0) >= 0 ? '+' : ''}{meuDesempenho?.variacao_mes_anterior || 0}%
                      </p>
                      <p className="text-xs text-muted-foreground">vs Mês Anterior</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ranking do Setor */}
        <Card>
          <CardHeader>
            <CardTitle>
              Ranking do Setor: {SETORES.find(s => s.value === (setor || profile?.setor))?.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rankingLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : ranking?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum dado de ranking disponível para este período.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium text-muted-foreground w-12">#</th>
                      <th className="pb-3 font-medium text-muted-foreground">Colaborador</th>
                      <th className="pb-3 font-medium text-muted-foreground text-center">Tarefas</th>
                      <th className="pb-3 font-medium text-muted-foreground text-center">No Prazo</th>
                      <th className="pb-3 font-medium text-muted-foreground text-center">Clientes</th>
                      <th className="pb-3 font-medium text-muted-foreground">Pontuação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking?.map((item, index) => (
                      <tr 
                        key={item.id} 
                        className={`border-b last:border-0 ${item.id === profile?.id ? 'bg-primary/5' : ''}`}
                      >
                        <td className="py-4 text-lg font-semibold">
                          {getMedalha(index)}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <KonvertaAvatar
                              src={item.avatar_url}
                              name={item.nome}
                              size="sm"
                            />
                            <span className="font-medium">{item.nome}</span>
                          </div>
                        </td>
                        <td className="py-4 text-center font-medium">
                          {item.tarefas_concluidas}
                        </td>
                        <td className="py-4 text-center">
                          <span className={`font-medium ${item.taxa_prazo >= 90 ? 'text-green-600' : item.taxa_prazo >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {item.taxa_prazo}%
                          </span>
                        </td>
                        <td className="py-4 text-center font-medium">
                          {item.clientes_atendidos}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-2 max-w-[100px]">
                              <div 
                                className="bg-primary rounded-full h-2 transition-all"
                                style={{ width: `${Math.min(100, (item.pontuacao / (ranking[0]?.pontuacao || 1)) * 100)}%` }}
                              />
                            </div>
                            <span className="font-bold text-sm w-8">{item.pontuacao}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground text-center">
          O ranking não exibe comissões ou valores financeiros.
        </p>
      </div>
    </AppLayout>
  );
}
