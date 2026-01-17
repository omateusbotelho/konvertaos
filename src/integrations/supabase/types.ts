export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      atividades_lead: {
        Row: {
          created_at: string | null
          data_atividade: string | null
          descricao: string
          id: string
          lead_id: string
          realizado_por_id: string
          tipo: Database["public"]["Enums"]["atividade_tipo"]
        }
        Insert: {
          created_at?: string | null
          data_atividade?: string | null
          descricao: string
          id?: string
          lead_id: string
          realizado_por_id: string
          tipo: Database["public"]["Enums"]["atividade_tipo"]
        }
        Update: {
          created_at?: string | null
          data_atividade?: string | null
          descricao?: string
          id?: string
          lead_id?: string
          realizado_por_id?: string
          tipo?: Database["public"]["Enums"]["atividade_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "atividades_lead_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_lead_realizado_por_id_fkey"
            columns: ["realizado_por_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_acessos: {
        Row: {
          cliente_id: string
          created_at: string | null
          id: string
          observacoes: string | null
          senha: string | null
          tipo: string
          updated_at: string | null
          url: string | null
          usuario: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          id?: string
          observacoes?: string | null
          senha?: string | null
          tipo: string
          updated_at?: string | null
          url?: string | null
          usuario?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          id?: string
          observacoes?: string | null
          senha?: string | null
          tipo?: string
          updated_at?: string | null
          url?: string | null
          usuario?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cliente_acessos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_arquivos: {
        Row: {
          cliente_id: string
          created_at: string | null
          id: string
          nome: string
          tipo: Database["public"]["Enums"]["tipo_arquivo"] | null
          uploaded_por_id: string | null
          url: string
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          id?: string
          nome: string
          tipo?: Database["public"]["Enums"]["tipo_arquivo"] | null
          uploaded_por_id?: string | null
          url: string
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          id?: string
          nome?: string
          tipo?: Database["public"]["Enums"]["tipo_arquivo"] | null
          uploaded_por_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_arquivos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_arquivos_uploaded_por_id_fkey"
            columns: ["uploaded_por_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_servicos: {
        Row: {
          cliente_id: string
          created_at: string | null
          data_cancelamento: string | null
          data_inicio: string | null
          id: string
          responsavel_id: string
          servico_id: string
          status: string | null
          valor: number
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          data_cancelamento?: string | null
          data_inicio?: string | null
          id?: string
          responsavel_id: string
          servico_id: string
          status?: string | null
          valor: number
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          data_cancelamento?: string | null
          data_inicio?: string | null
          id?: string
          responsavel_id?: string
          servico_id?: string
          status?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "cliente_servicos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_servicos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_servicos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_timeline: {
        Row: {
          cliente_id: string
          created_at: string | null
          dados_json: Json | null
          descricao: string
          id: string
          realizado_por_id: string | null
          tipo: Database["public"]["Enums"]["tipo_timeline"]
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          dados_json?: Json | null
          descricao: string
          id?: string
          realizado_por_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_timeline"]
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          dados_json?: Json | null
          descricao?: string
          id?: string
          realizado_por_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_timeline"]
        }
        Relationships: [
          {
            foreignKeyName: "cliente_timeline_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_timeline_realizado_por_id_fkey"
            columns: ["realizado_por_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          asaas_customer_id: string | null
          cep: string | null
          cidade: string | null
          closer_responsavel_id: string | null
          cnpj: string | null
          cpf: string | null
          created_at: string | null
          data_ativacao: string | null
          data_cancelamento: string | null
          dia_vencimento: number | null
          email: string
          endereco: string | null
          estado: string | null
          fee_mensal: number
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"] | null
          id: string
          lead_id: string | null
          modelo_cobranca: Database["public"]["Enums"]["modelo_cobranca"] | null
          motivo_cancelamento: string | null
          nome_fantasia: string | null
          percentual: number | null
          razao_social: string
          sdr_responsavel_id: string | null
          status: Database["public"]["Enums"]["status_cliente"] | null
          telefone: string
          updated_at: string | null
        }
        Insert: {
          asaas_customer_id?: string | null
          cep?: string | null
          cidade?: string | null
          closer_responsavel_id?: string | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string | null
          data_ativacao?: string | null
          data_cancelamento?: string | null
          dia_vencimento?: number | null
          email: string
          endereco?: string | null
          estado?: string | null
          fee_mensal: number
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          lead_id?: string | null
          modelo_cobranca?:
            | Database["public"]["Enums"]["modelo_cobranca"]
            | null
          motivo_cancelamento?: string | null
          nome_fantasia?: string | null
          percentual?: number | null
          razao_social: string
          sdr_responsavel_id?: string | null
          status?: Database["public"]["Enums"]["status_cliente"] | null
          telefone: string
          updated_at?: string | null
        }
        Update: {
          asaas_customer_id?: string | null
          cep?: string | null
          cidade?: string | null
          closer_responsavel_id?: string | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string | null
          data_ativacao?: string | null
          data_cancelamento?: string | null
          dia_vencimento?: number | null
          email?: string
          endereco?: string | null
          estado?: string | null
          fee_mensal?: number
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          lead_id?: string | null
          modelo_cobranca?:
            | Database["public"]["Enums"]["modelo_cobranca"]
            | null
          motivo_cancelamento?: string | null
          nome_fantasia?: string | null
          percentual?: number | null
          razao_social?: string
          sdr_responsavel_id?: string | null
          status?: Database["public"]["Enums"]["status_cliente"] | null
          telefone?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_closer_responsavel_id_fkey"
            columns: ["closer_responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_sdr_responsavel_id_fkey"
            columns: ["sdr_responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      convites: {
        Row: {
          cargo: Database["public"]["Enums"]["cargo_tipo"]
          convidado_por: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          nome: string
          role: Database["public"]["Enums"]["app_role"] | null
          setor: Database["public"]["Enums"]["setor_tipo"]
          token: string
          usado: boolean | null
        }
        Insert: {
          cargo: Database["public"]["Enums"]["cargo_tipo"]
          convidado_por?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          nome: string
          role?: Database["public"]["Enums"]["app_role"] | null
          setor: Database["public"]["Enums"]["setor_tipo"]
          token: string
          usado?: boolean | null
        }
        Update: {
          cargo?: Database["public"]["Enums"]["cargo_tipo"]
          convidado_por?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          nome?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          setor?: Database["public"]["Enums"]["setor_tipo"]
          token?: string
          usado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "convites_convidado_por_fkey"
            columns: ["convidado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          concluido: boolean | null
          concluido_em: string | null
          created_at: string | null
          criado_por_id: string
          data_programada: string
          descricao: string | null
          id: string
          lead_id: string
        }
        Insert: {
          concluido?: boolean | null
          concluido_em?: string | null
          created_at?: string | null
          criado_por_id: string
          data_programada: string
          descricao?: string | null
          id?: string
          lead_id: string
        }
        Update: {
          concluido?: boolean | null
          concluido_em?: string | null
          created_at?: string | null
          criado_por_id?: string
          data_programada?: string
          descricao?: string | null
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_criado_por_id_fkey"
            columns: ["criado_por_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          closer_responsavel_id: string | null
          created_at: string | null
          data_agendamento: string | null
          data_conversao: string | null
          data_perda: string | null
          email: string | null
          empresa: string | null
          etapa_closer: Database["public"]["Enums"]["etapa_closer"] | null
          etapa_frios: Database["public"]["Enums"]["etapa_frios"] | null
          etapa_sdr: Database["public"]["Enums"]["etapa_sdr"] | null
          funil_atual: Database["public"]["Enums"]["funil_tipo"] | null
          id: string
          motivo_perda_id: string | null
          nome: string
          observacoes: string | null
          origem_id: string | null
          sdr_responsavel_id: string | null
          servico_interesse_id: string | null
          telefone: string
          updated_at: string | null
          valor_proposta: number | null
        }
        Insert: {
          closer_responsavel_id?: string | null
          created_at?: string | null
          data_agendamento?: string | null
          data_conversao?: string | null
          data_perda?: string | null
          email?: string | null
          empresa?: string | null
          etapa_closer?: Database["public"]["Enums"]["etapa_closer"] | null
          etapa_frios?: Database["public"]["Enums"]["etapa_frios"] | null
          etapa_sdr?: Database["public"]["Enums"]["etapa_sdr"] | null
          funil_atual?: Database["public"]["Enums"]["funil_tipo"] | null
          id?: string
          motivo_perda_id?: string | null
          nome: string
          observacoes?: string | null
          origem_id?: string | null
          sdr_responsavel_id?: string | null
          servico_interesse_id?: string | null
          telefone: string
          updated_at?: string | null
          valor_proposta?: number | null
        }
        Update: {
          closer_responsavel_id?: string | null
          created_at?: string | null
          data_agendamento?: string | null
          data_conversao?: string | null
          data_perda?: string | null
          email?: string | null
          empresa?: string | null
          etapa_closer?: Database["public"]["Enums"]["etapa_closer"] | null
          etapa_frios?: Database["public"]["Enums"]["etapa_frios"] | null
          etapa_sdr?: Database["public"]["Enums"]["etapa_sdr"] | null
          funil_atual?: Database["public"]["Enums"]["funil_tipo"] | null
          id?: string
          motivo_perda_id?: string | null
          nome?: string
          observacoes?: string | null
          origem_id?: string | null
          sdr_responsavel_id?: string | null
          servico_interesse_id?: string | null
          telefone?: string
          updated_at?: string | null
          valor_proposta?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_closer_responsavel_id_fkey"
            columns: ["closer_responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_motivo_perda_id_fkey"
            columns: ["motivo_perda_id"]
            isOneToOne: false
            referencedRelation: "motivos_perda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_origem_id_fkey"
            columns: ["origem_id"]
            isOneToOne: false
            referencedRelation: "origens_lead"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_sdr_responsavel_id_fkey"
            columns: ["sdr_responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_servico_interesse_id_fkey"
            columns: ["servico_interesse_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      motivos_perda: {
        Row: {
          aplicavel_a: string | null
          ativo: boolean | null
          created_at: string | null
          id: string
          nome: string
        }
        Insert: {
          aplicavel_a?: string | null
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome: string
        }
        Update: {
          aplicavel_a?: string | null
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      origens_lead: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean | null
          avatar_url: string | null
          cargo: Database["public"]["Enums"]["cargo_tipo"] | null
          created_at: string | null
          email: string
          id: string
          nome: string
          setor: Database["public"]["Enums"]["setor_tipo"] | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          avatar_url?: string | null
          cargo?: Database["public"]["Enums"]["cargo_tipo"] | null
          created_at?: string | null
          email: string
          id: string
          nome: string
          setor?: Database["public"]["Enums"]["setor_tipo"] | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          avatar_url?: string | null
          cargo?: Database["public"]["Enums"]["cargo_tipo"] | null
          created_at?: string | null
          email?: string
          id?: string
          nome?: string
          setor?: Database["public"]["Enums"]["setor_tipo"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      servicos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          setor_responsavel: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          setor_responsavel: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          setor_responsavel?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "colaborador"
      atividade_tipo: "ligacao" | "whatsapp" | "email" | "reuniao" | "anotacao"
      cargo_tipo:
        | "sdr"
        | "closer"
        | "gestor_trafego"
        | "social_media"
        | "financeiro"
      etapa_closer:
        | "reuniao_agendada"
        | "reuniao_realizada"
        | "proposta_enviada"
        | "negociacao"
        | "fechado_ganho"
        | "perdido"
      etapa_frios: "esfriar" | "reativacao" | "reativado" | "descartado"
      etapa_sdr:
        | "novo"
        | "tentativa_contato"
        | "contato_realizado"
        | "qualificado"
        | "reuniao_agendada"
        | "perdido"
      forma_pagamento: "boleto" | "pix" | "cartao"
      funil_tipo: "sdr" | "closer" | "frios" | "convertido"
      modelo_cobranca: "fee" | "fee_percentual" | "avulso"
      origem_lead:
        | "formulario_site"
        | "anuncio_meta"
        | "anuncio_google"
        | "indicacao"
        | "ligacao"
        | "outro"
      setor_tipo: "comercial" | "trafego" | "social_media" | "financeiro"
      status_cliente: "ativo" | "inadimplente" | "cancelado"
      tipo_arquivo: "contrato" | "briefing" | "documento" | "outro"
      tipo_timeline:
        | "criado"
        | "servico_adicionado"
        | "servico_cancelado"
        | "valor_alterado"
        | "responsavel_alterado"
        | "pagamento_confirmado"
        | "pagamento_atrasado"
        | "tarefa_concluida"
        | "comentario"
        | "contrato_enviado"
        | "contrato_assinado"
        | "nps_recebido"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "colaborador"],
      atividade_tipo: ["ligacao", "whatsapp", "email", "reuniao", "anotacao"],
      cargo_tipo: [
        "sdr",
        "closer",
        "gestor_trafego",
        "social_media",
        "financeiro",
      ],
      etapa_closer: [
        "reuniao_agendada",
        "reuniao_realizada",
        "proposta_enviada",
        "negociacao",
        "fechado_ganho",
        "perdido",
      ],
      etapa_frios: ["esfriar", "reativacao", "reativado", "descartado"],
      etapa_sdr: [
        "novo",
        "tentativa_contato",
        "contato_realizado",
        "qualificado",
        "reuniao_agendada",
        "perdido",
      ],
      forma_pagamento: ["boleto", "pix", "cartao"],
      funil_tipo: ["sdr", "closer", "frios", "convertido"],
      modelo_cobranca: ["fee", "fee_percentual", "avulso"],
      origem_lead: [
        "formulario_site",
        "anuncio_meta",
        "anuncio_google",
        "indicacao",
        "ligacao",
        "outro",
      ],
      setor_tipo: ["comercial", "trafego", "social_media", "financeiro"],
      status_cliente: ["ativo", "inadimplente", "cancelado"],
      tipo_arquivo: ["contrato", "briefing", "documento", "outro"],
      tipo_timeline: [
        "criado",
        "servico_adicionado",
        "servico_cancelado",
        "valor_alterado",
        "responsavel_alterado",
        "pagamento_confirmado",
        "pagamento_atrasado",
        "tarefa_concluida",
        "comentario",
        "contrato_enviado",
        "contrato_assinado",
        "nps_recebido",
      ],
    },
  },
} as const
