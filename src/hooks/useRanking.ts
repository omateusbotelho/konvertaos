import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface RankingItem {
  id: string;
  nome: string;
  avatar_url: string | null;
  cargo: string | null;
  setor: string | null;
  tarefas_concluidas: number;
  tarefas_no_prazo: number;
  taxa_prazo: number;
  clientes_atendidos: number;
  pontuacao: number;
}

export interface MeuDesempenho {
  posicao: number;
  tarefas_concluidas: number;
  taxa_prazo: number;
  clientes_atendidos: number;
  variacao_mes_anterior: number;
}

export function useRanking(mes?: Date, setor?: string) {
  const { profile } = useAuth();
  const mesAtual = mes || new Date();
  const inicioMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
  const fimMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0, 23, 59, 59);

  return useQuery({
    queryKey: ['ranking', inicioMes.toISOString(), setor || profile?.setor],
    queryFn: async () => {
      const setorFiltro = setor || profile?.setor;
      if (!setorFiltro) return [];

      // Buscar colaboradores do setor
      const { data: colaboradores, error: colabError } = await supabase
        .from('profiles')
        .select('id, nome, avatar_url, cargo, setor')
        .eq('ativo', true)
        .eq('setor', setorFiltro as "comercial" | "financeiro" | "social_media" | "trafego");

      if (colabError) throw colabError;
      if (!colaboradores?.length) return [];

      // Para cada colaborador, calcular métricas
      const ranking: RankingItem[] = await Promise.all(
        colaboradores.map(async (colab) => {
          // Tarefas concluídas no mês
          const { count: tarefasConcluidas } = await supabase
            .from('tarefas')
            .select('*', { count: 'exact', head: true })
            .eq('responsavel_id', colab.id)
            .eq('concluida', true)
            .gte('concluida_em', inicioMes.toISOString())
            .lte('concluida_em', fimMes.toISOString());

          // Tarefas concluídas no prazo
          const { data: tarefasPrazo } = await supabase
            .from('tarefas')
            .select('id, data_vencimento, concluida_em')
            .eq('responsavel_id', colab.id)
            .eq('concluida', true)
            .gte('concluida_em', inicioMes.toISOString())
            .lte('concluida_em', fimMes.toISOString());

          const tarefasNoPrazo = tarefasPrazo?.filter(t => 
            t.data_vencimento && t.concluida_em && 
            new Date(t.concluida_em) <= new Date(t.data_vencimento)
          ).length || 0;

          const taxaPrazo = tarefasConcluidas && tarefasConcluidas > 0 
            ? Math.round((tarefasNoPrazo / tarefasConcluidas) * 100) 
            : 0;

          // Clientes atendidos (tarefas únicas por cliente)
          const { data: clientesData } = await supabase
            .from('tarefas')
            .select('cliente_id')
            .eq('responsavel_id', colab.id)
            .eq('concluida', true)
            .gte('concluida_em', inicioMes.toISOString())
            .lte('concluida_em', fimMes.toISOString());

          const clientesUnicos = new Set(clientesData?.map(t => t.cliente_id) || []);

          // Pontuação: tarefas * taxa_prazo / 100 + clientes * 5
          const pontuacao = Math.round(
            (tarefasConcluidas || 0) * (taxaPrazo / 100) + clientesUnicos.size * 5
          );

          return {
            id: colab.id,
            nome: colab.nome,
            avatar_url: colab.avatar_url,
            cargo: colab.cargo,
            setor: colab.setor,
            tarefas_concluidas: tarefasConcluidas || 0,
            tarefas_no_prazo: tarefasNoPrazo,
            taxa_prazo: taxaPrazo,
            clientes_atendidos: clientesUnicos.size,
            pontuacao
          };
        })
      );

      // Ordenar por pontuação
      return ranking.sort((a, b) => b.pontuacao - a.pontuacao);
    },
    enabled: !!profile?.setor
  });
}

export function useMeuDesempenho() {
  const { user, profile } = useAuth();
  const mesAtual = new Date();
  const inicioMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
  const fimMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0, 23, 59, 59);
  const inicioMesAnterior = new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1);
  const fimMesAnterior = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 0, 23, 59, 59);

  return useQuery({
    queryKey: ['meu-desempenho', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Tarefas do mês atual
      const { count: tarefasMesAtual } = await supabase
        .from('tarefas')
        .select('*', { count: 'exact', head: true })
        .eq('responsavel_id', user.id)
        .eq('concluida', true)
        .gte('concluida_em', inicioMes.toISOString())
        .lte('concluida_em', fimMes.toISOString());

      // Tarefas do mês anterior
      const { count: tarefasMesAnterior } = await supabase
        .from('tarefas')
        .select('*', { count: 'exact', head: true })
        .eq('responsavel_id', user.id)
        .eq('concluida', true)
        .gte('concluida_em', inicioMesAnterior.toISOString())
        .lte('concluida_em', fimMesAnterior.toISOString());

      // Tarefas no prazo
      const { data: tarefasPrazo } = await supabase
        .from('tarefas')
        .select('id, data_vencimento, concluida_em')
        .eq('responsavel_id', user.id)
        .eq('concluida', true)
        .gte('concluida_em', inicioMes.toISOString())
        .lte('concluida_em', fimMes.toISOString());

      const tarefasNoPrazo = tarefasPrazo?.filter(t => 
        t.data_vencimento && t.concluida_em && 
        new Date(t.concluida_em) <= new Date(t.data_vencimento)
      ).length || 0;

      const taxaPrazo = tarefasMesAtual && tarefasMesAtual > 0 
        ? Math.round((tarefasNoPrazo / tarefasMesAtual) * 100) 
        : 0;

      // Clientes atendidos
      const { data: clientesData } = await supabase
        .from('tarefas')
        .select('cliente_id')
        .eq('responsavel_id', user.id)
        .eq('concluida', true)
        .gte('concluida_em', inicioMes.toISOString())
        .lte('concluida_em', fimMes.toISOString());

      const clientesUnicos = new Set(clientesData?.map(t => t.cliente_id) || []);

      // Variação
      const variacao = tarefasMesAnterior && tarefasMesAnterior > 0
        ? Math.round(((tarefasMesAtual || 0) - tarefasMesAnterior) / tarefasMesAnterior * 100)
        : 0;

      return {
        posicao: 0, // Será calculado no ranking
        tarefas_concluidas: tarefasMesAtual || 0,
        taxa_prazo: taxaPrazo,
        clientes_atendidos: clientesUnicos.size,
        variacao_mes_anterior: variacao
      } as MeuDesempenho;
    },
    enabled: !!user?.id
  });
}
