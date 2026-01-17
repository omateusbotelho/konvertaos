import { PostgrestError } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

// ============= SUPABASE ERROR TYPE =============
export type SupabaseError = PostgrestError;

// ============= DATABASE TABLE TYPES =============
export type Tables = Database["public"]["Tables"];
export type Enums = Database["public"]["Enums"];

// Table row types
export type LeadRow = Tables["leads"]["Row"];
export type ProfileRow = Tables["profiles"]["Row"];
export type ClienteRow = Tables["clientes"]["Row"];
export type ProjetoRow = Tables["projetos"]["Row"];
export type TarefaRow = Tables["tarefas"]["Row"];
export type CobrancaRow = Tables["cobrancas"]["Row"];
export type ComissaoRow = Tables["comissoes"]["Row"];
export type ReuniaoRow = Tables["reunioes"]["Row"];
export type NotificacaoRow = Tables["notificacoes"]["Row"];
export type AuditLogRow = Tables["audit_log"]["Row"];
export type OrigemLeadRow = Tables["origens_lead"]["Row"];
export type ServicoRow = Tables["servicos"]["Row"];
export type SLAConfigRow = Tables["sla_config"]["Row"];
export type FollowUpRow = Tables["follow_ups"]["Row"];
export type AtividadeLeadRow = Tables["atividades_lead"]["Row"];
export type ClienteServicoRow = Tables["cliente_servicos"]["Row"];
export type EtapaKanbanRow = Tables["etapas_kanban"]["Row"];

// Insert types
export type LeadInsert = Tables["leads"]["Insert"];
export type TarefaInsert = Tables["tarefas"]["Insert"];
export type CobrancaInsert = Tables["cobrancas"]["Insert"];
export type ComissaoInsert = Tables["comissoes"]["Insert"];

// Update types
export type LeadUpdate = Tables["leads"]["Update"];
export type TarefaUpdate = Tables["tarefas"]["Update"];
export type ProjetoUpdate = Tables["projetos"]["Update"];

// ============= ENUM TYPES =============
export type EtapaSDR = Enums["etapa_sdr"];
export type EtapaCloser = Enums["etapa_closer"];
export type EtapaFrios = Enums["etapa_frios"];
export type CargoTipo = Enums["cargo_tipo"];
export type SetorTipo = Enums["setor_tipo"];
export type StatusCliente = Enums["status_cliente"];
export type StatusCobranca = Enums["status_cobranca"];
export type StatusComissao = Enums["status_comissao"];
export type StatusReuniao = Enums["status_reuniao"];
export type TipoReuniao = Enums["tipo_reuniao"];
export type TipoAusencia = Enums["tipo_ausencia"];
export type StatusAusencia = Enums["status_ausencia"];
export type PrioridadeTarefa = Enums["prioridade_tarefa"];
export type StatusProjeto = Enums["status_projeto"];
export type FormaPagamento = Enums["forma_pagamento"];
export type ModeloCobranca = Enums["modelo_cobranca"];
export type CategoriaCusto = Enums["categoria_custo"];
export type TipoComissao = Enums["tipo_comissao"];
export type TipoCobranca = Enums["tipo_cobranca"];
export type TipoNotificacao = Enums["tipo_notificacao"];
export type TipoTimeline = Enums["tipo_timeline"];
export type TipoArquivo = Enums["tipo_arquivo"];
export type TipoHistoricoTarefa = Enums["tipo_historico_tarefa"];
export type AtividadeTipo = Enums["atividade_tipo"];
export type AppRole = Enums["app_role"];

// ============= EMBEDDED QUERY TYPES =============
// Types for joined/embedded data from Supabase queries

export interface EmbeddedProfile {
  id: string;
  nome: string;
  avatar_url?: string | null;
  cargo?: CargoTipo | null;
  setor?: SetorTipo | null;
  email?: string;
}

export interface EmbeddedCliente {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  telefone?: string;
  email?: string;
}

export interface EmbeddedProjeto {
  id: string;
  nome: string;
}

export interface EmbeddedServico {
  id?: string;
  nome: string;
  setor_responsavel?: string;
}

export interface EmbeddedOrigem {
  nome: string;
}

export interface EmbeddedMotivoPerda {
  nome: string;
}

export interface EmbeddedFollowUp {
  data_programada: string;
  descricao: string | null;
  concluido: boolean | null;
}

export interface EmbeddedAtividade {
  data_atividade: string | null;
}

// ============= RPC RESULT TYPES =============
export interface ProjetosTaskCounts {
  projeto_id: string;
  total_tarefas: number;
  tarefas_concluidas: number;
  tarefas_atrasadas: number;
}

export interface ProjetosStats {
  projetos_ativos: number;
  tarefas_pendentes: number;
  tarefas_atrasadas: number;
  onboardings: number;
}

export interface FinanceiroSummary {
  receita: number;
  despesa: number;
  lucro: number;
  inadimplencia: number;
  taxa_inadimplencia: number;
  clientes_inadimplentes: number;
  total_custos_fixos: number;
  total_custos_variaveis: number;
  cobrancas_no_periodo: number;
  cobrancas_pagas: number;
  cobrancas_atrasadas: number;
}

export interface NPSStatsRPC {
  nps_score: number;
  total_respostas: number;
  promotores: number;
  neutros: number;
  detratores: number;
  taxa_resposta: number;
}

// ============= UTILITY TYPES =============
export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
}
