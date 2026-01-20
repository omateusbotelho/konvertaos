import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type AtividadeTipo = Database["public"]["Enums"]["atividade_tipo"];

export interface LeadAtividade {
  id: string;
  leadId: string;
  tipo: AtividadeTipo;
  descricao: string;
  realizadoPor: {
    id: string;
    nome: string;
  } | null;
  dataAtividade: Date;
  createdAt: Date;
}

interface UseLeadAtividadesOptions {
  leadId: string | null;
  tipoFilter?: AtividadeTipo | null;
}

export function useLeadAtividades({ leadId, tipoFilter }: UseLeadAtividadesOptions) {
  return useQuery({
    queryKey: ["lead-atividades", leadId, tipoFilter],
    queryFn: async (): Promise<LeadAtividade[]> => {
      if (!leadId) return [];

      let query = supabase
        .from("atividades_lead")
        .select(`
          id,
          lead_id,
          tipo,
          descricao,
          data_atividade,
          created_at,
          realizado_por:profiles!realizado_por_id(id, nome)
        `)
        .eq("lead_id", leadId)
        .order("data_atividade", { ascending: false });

      if (tipoFilter) {
        query = query.eq("tipo", tipoFilter);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      return (data || []).map((item) => ({
        id: item.id,
        leadId: item.lead_id,
        tipo: item.tipo,
        descricao: item.descricao,
        realizadoPor: item.realizado_por
          ? {
              id: (item.realizado_por as any).id,
              nome: (item.realizado_por as any).nome,
            }
          : null,
        dataAtividade: new Date(item.data_atividade || item.created_at || Date.now()),
        createdAt: new Date(item.created_at || Date.now()),
      }));
    },
    enabled: !!leadId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Mapeamento de tipos para labels em português
export const ATIVIDADE_TIPO_LABELS: Record<AtividadeTipo, string> = {
  ligacao: "Ligação",
  whatsapp: "WhatsApp",
  email: "E-mail",
  reuniao: "Reunião",
  anotacao: "Anotação",
};

// Tipos disponíveis para filtro
export const ATIVIDADE_TIPOS: AtividadeTipo[] = [
  "ligacao",
  "whatsapp",
  "email",
  "reuniao",
  "anotacao",
];
