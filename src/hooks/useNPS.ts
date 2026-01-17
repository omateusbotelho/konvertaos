import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types
export interface NPSConfig {
  id: string;
  ativo: boolean;
  frequencia_meses: number;
  email_assunto: string;
  email_corpo: string;
  created_at: string;
  updated_at: string;
}

export interface NPSEnvio {
  id: string;
  cliente_id: string;
  token: string;
  enviado_em: string;
  expira_em: string;
  respondido: boolean;
  resposta_id: string | null;
  created_at: string;
  cliente?: {
    razao_social: string;
    nome_fantasia: string | null;
    email: string;
  };
}

export interface NPSResposta {
  id: string;
  cliente_id: string;
  score: number;
  comentario: string | null;
  enviado_em: string | null;
  respondido_em: string | null;
  created_at: string;
  cliente?: {
    razao_social: string;
    nome_fantasia: string | null;
  };
}

export interface NPSStats {
  npsScore: number;
  totalRespostas: number;
  promotores: number;
  neutros: number;
  detratores: number;
  taxaResposta: number;
}

// Hook para buscar configuração do NPS
export function useNPSConfig() {
  return useQuery({
    queryKey: ['nps-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nps_config')
        .select('*')
        .single();

      if (error) throw error;
      return data as NPSConfig;
    },
  });
}

// Hook para atualizar configuração do NPS
export function useUpdateNPSConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (config: Partial<NPSConfig>) => {
      const { data, error } = await supabase
        .from('nps_config')
        .update(config)
        .eq('id', config.id!)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nps-config'] });
      toast({
        title: 'Configuração atualizada',
        description: 'As configurações de NPS foram salvas.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook para buscar respostas do NPS
export function useNPSRespostas(filters?: { periodo?: 'mes' | 'trimestre' | 'ano' | 'todos' }) {
  return useQuery({
    queryKey: ['nps-respostas', filters],
    queryFn: async () => {
      let query = supabase
        .from('nps_respostas')
        .select(`
          *,
          cliente:clientes(razao_social, nome_fantasia)
        `)
        .order('created_at', { ascending: false });

      // Filtrar por período
      if (filters?.periodo && filters.periodo !== 'todos') {
        const now = new Date();
        let startDate: Date;
        
        switch (filters.periodo) {
          case 'mes':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'trimestre':
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            break;
          case 'ano':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as NPSResposta[];
    },
  });
}

// Hook para calcular estatísticas do NPS (usando RPC otimizada)
export function useNPSStats() {
  return useQuery({
    queryKey: ['nps-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('calculate_nps_stats');

      if (error) throw error;

      // Mapear resposta da RPC para a interface NPSStats
      const stats = data as {
        nps_score: number;
        total_respostas: number;
        promotores: number;
        neutros: number;
        detratores: number;
        taxa_resposta: number;
      };

      return {
        npsScore: stats.nps_score,
        totalRespostas: stats.total_respostas,
        promotores: stats.promotores,
        neutros: stats.neutros,
        detratores: stats.detratores,
        taxaResposta: stats.taxa_resposta,
      } as NPSStats;
    },
  });
}

// Hook para evolução do NPS nos últimos meses
export function useNPSEvolucao(meses: number = 6) {
  return useQuery({
    queryKey: ['nps-evolucao', meses],
    queryFn: async () => {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - meses + 1, 1);

      const { data, error } = await supabase
        .from('nps_respostas')
        .select('score, created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Agrupar por mês e calcular NPS
      const porMes: Record<string, number[]> = {};
      
      data.forEach((resposta) => {
        const date = new Date(resposta.created_at!);
        const mesAno = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!porMes[mesAno]) {
          porMes[mesAno] = [];
        }
        porMes[mesAno].push(resposta.score);
      });

      // Calcular NPS para cada mês
      const resultado = Object.entries(porMes).map(([mesAno, scores]) => {
        const total = scores.length;
        const promotores = scores.filter(s => s >= 9).length;
        const detratores = scores.filter(s => s <= 6).length;
        const nps = total > 0 ? Math.round(((promotores - detratores) / total) * 100) : 0;

        const [ano, mes] = mesAno.split('-');
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        return {
          name: meses[parseInt(mes) - 1],
          value: nps,
          respostas: total,
        };
      });

      return resultado;
    },
  });
}

// Hook para buscar detratores recentes
export function useNPSDetratores(limit: number = 5) {
  return useQuery({
    queryKey: ['nps-detratores', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nps_respostas')
        .select(`
          *,
          cliente:clientes(razao_social, nome_fantasia)
        `)
        .lte('score', 6)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as NPSResposta[];
    },
  });
}

// Hook para buscar envio por token (público)
export function useNPSEnvioPorToken(token: string) {
  return useQuery({
    queryKey: ['nps-envio-token', token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nps_envios')
        .select(`
          *,
          cliente:clientes(razao_social, nome_fantasia, email)
        `)
        .eq('token', token)
        .single();

      if (error) throw error;
      return data as NPSEnvio;
    },
    enabled: !!token,
  });
}

// Hook para enviar resposta do NPS (público)
export function useEnviarRespostaNPS() {
  return useMutation({
    mutationFn: async ({ 
      token, 
      score, 
      comentario 
    }: { 
      token: string; 
      score: number; 
      comentario?: string;
    }) => {
      // Buscar o envio pelo token
      const { data: envio, error: envioError } = await supabase
        .from('nps_envios')
        .select('*')
        .eq('token', token)
        .single();

      if (envioError) throw new Error('Link inválido ou expirado');
      if (!envio) throw new Error('Link não encontrado');
      if (envio.respondido) throw new Error('Esta pesquisa já foi respondida');
      if (new Date(envio.expira_em) < new Date()) throw new Error('Este link expirou');

      // Criar a resposta
      const { data: resposta, error: respostaError } = await supabase
        .from('nps_respostas')
        .insert({
          cliente_id: envio.cliente_id,
          score,
          comentario: comentario || null,
          enviado_em: envio.enviado_em,
          respondido_em: new Date().toISOString(),
        })
        .select()
        .single();

      if (respostaError) throw respostaError;

      // Atualizar o envio como respondido
      const { error: updateError } = await supabase
        .from('nps_envios')
        .update({
          respondido: true,
          resposta_id: resposta.id,
        })
        .eq('id', envio.id);

      if (updateError) throw updateError;

      return resposta;
    },
  });
}

// Hook para enviar NPS manualmente para um cliente
export function useEnviarNPSManual() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (clienteId: string) => {
      const token = crypto.randomUUID();
      const expiraEm = new Date();
      expiraEm.setDate(expiraEm.getDate() + 7);

      const { data, error } = await supabase
        .from('nps_envios')
        .insert({
          cliente_id: clienteId,
          token,
          expira_em: expiraEm.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nps-envios'] });
      toast({
        title: 'Pesquisa enviada',
        description: 'O link da pesquisa foi gerado. O e-mail será enviado em breve.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao enviar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook para buscar clientes elegíveis para NPS
export function useClientesElegiveisNPS() {
  const { data: config } = useNPSConfig();

  return useQuery({
    queryKey: ['clientes-elegiveis-nps', config?.frequencia_meses],
    queryFn: async () => {
      if (!config) return [];

      const mesesAtras = new Date();
      mesesAtras.setMonth(mesesAtras.getMonth() - config.frequencia_meses);

      // Buscar clientes ativos há mais de 30 dias
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

      const { data: clientes, error: clientesError } = await supabase
        .from('clientes')
        .select('id, razao_social, nome_fantasia, email, data_ativacao')
        .eq('status', 'ativo')
        .lt('data_ativacao', trintaDiasAtras.toISOString());

      if (clientesError) throw clientesError;

      // Buscar envios recentes
      const { data: enviosRecentes, error: enviosError } = await supabase
        .from('nps_envios')
        .select('cliente_id')
        .gt('enviado_em', mesesAtras.toISOString());

      if (enviosError) throw enviosError;

      const clientesComEnvio = new Set(enviosRecentes.map(e => e.cliente_id));

      // Filtrar clientes que não receberam NPS recentemente
      return clientes.filter(c => !clientesComEnvio.has(c.id));
    },
    enabled: !!config,
  });
}
