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
      ausencias: {
        Row: {
          aprovado_em: string | null
          aprovado_por_id: string | null
          colaborador_id: string
          created_at: string | null
          data_fim: string
          data_inicio: string
          id: string
          motivo: string | null
          observacoes: string | null
          status: Database["public"]["Enums"]["status_ausencia"] | null
          tipo: Database["public"]["Enums"]["tipo_ausencia"]
          updated_at: string | null
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por_id?: string | null
          colaborador_id: string
          created_at?: string | null
          data_fim: string
          data_inicio: string
          id?: string
          motivo?: string | null
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_ausencia"] | null
          tipo: Database["public"]["Enums"]["tipo_ausencia"]
          updated_at?: string | null
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por_id?: string | null
          colaborador_id?: string
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          id?: string
          motivo?: string | null
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_ausencia"] | null
          tipo?: Database["public"]["Enums"]["tipo_ausencia"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ausencias_aprovado_por_id_fkey"
            columns: ["aprovado_por_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ausencias_colaborador_id_fkey"
            columns: ["colaborador_id"]
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
          {
            foreignKeyName: "cliente_acessos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "margem_por_cliente"
            referencedColumns: ["cliente_id"]
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
            foreignKeyName: "cliente_arquivos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "margem_por_cliente"
            referencedColumns: ["cliente_id"]
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
            foreignKeyName: "cliente_servicos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "margem_por_cliente"
            referencedColumns: ["cliente_id"]
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
            foreignKeyName: "cliente_timeline_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "margem_por_cliente"
            referencedColumns: ["cliente_id"]
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
      cobrancas: {
        Row: {
          asaas_payment_id: string | null
          cliente_id: string
          created_at: string | null
          data_pagamento: string | null
          data_vencimento: string
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"] | null
          id: string
          linha_digitavel: string | null
          observacoes: string | null
          pix_copia_cola: string | null
          status: Database["public"]["Enums"]["status_cobranca"] | null
          tentativas: number | null
          tipo: Database["public"]["Enums"]["tipo_cobranca"] | null
          updated_at: string | null
          url_boleto: string | null
          url_pix: string | null
          valor: number
        }
        Insert: {
          asaas_payment_id?: string | null
          cliente_id: string
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          linha_digitavel?: string | null
          observacoes?: string | null
          pix_copia_cola?: string | null
          status?: Database["public"]["Enums"]["status_cobranca"] | null
          tentativas?: number | null
          tipo?: Database["public"]["Enums"]["tipo_cobranca"] | null
          updated_at?: string | null
          url_boleto?: string | null
          url_pix?: string | null
          valor: number
        }
        Update: {
          asaas_payment_id?: string | null
          cliente_id?: string
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          linha_digitavel?: string | null
          observacoes?: string | null
          pix_copia_cola?: string | null
          status?: Database["public"]["Enums"]["status_cobranca"] | null
          tentativas?: number | null
          tipo?: Database["public"]["Enums"]["tipo_cobranca"] | null
          updated_at?: string | null
          url_boleto?: string | null
          url_pix?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "cobrancas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobrancas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "margem_por_cliente"
            referencedColumns: ["cliente_id"]
          },
        ]
      }
      comissao_config: {
        Row: {
          ativo: boolean | null
          colaborador_id: string
          created_at: string | null
          id: string
          tipo: string | null
          updated_at: string | null
          valor: number
        }
        Insert: {
          ativo?: boolean | null
          colaborador_id: string
          created_at?: string | null
          id?: string
          tipo?: string | null
          updated_at?: string | null
          valor: number
        }
        Update: {
          ativo?: boolean | null
          colaborador_id?: string
          created_at?: string | null
          id?: string
          tipo?: string | null
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "comissao_config_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comissoes: {
        Row: {
          aprovado_por_id: string | null
          cliente_id: string
          cobranca_id: string | null
          colaborador_id: string
          created_at: string | null
          data_pagamento: string | null
          data_referencia: string
          id: string
          observacoes: string | null
          percentual: number | null
          status: Database["public"]["Enums"]["status_comissao"] | null
          tipo_colaborador: Database["public"]["Enums"]["tipo_comissao"]
          updated_at: string | null
          valor: number
        }
        Insert: {
          aprovado_por_id?: string | null
          cliente_id: string
          cobranca_id?: string | null
          colaborador_id: string
          created_at?: string | null
          data_pagamento?: string | null
          data_referencia: string
          id?: string
          observacoes?: string | null
          percentual?: number | null
          status?: Database["public"]["Enums"]["status_comissao"] | null
          tipo_colaborador: Database["public"]["Enums"]["tipo_comissao"]
          updated_at?: string | null
          valor: number
        }
        Update: {
          aprovado_por_id?: string | null
          cliente_id?: string
          cobranca_id?: string | null
          colaborador_id?: string
          created_at?: string | null
          data_pagamento?: string | null
          data_referencia?: string
          id?: string
          observacoes?: string | null
          percentual?: number | null
          status?: Database["public"]["Enums"]["status_comissao"] | null
          tipo_colaborador?: Database["public"]["Enums"]["tipo_comissao"]
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_aprovado_por_id_fkey"
            columns: ["aprovado_por_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "margem_por_cliente"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "comissoes_cobranca_id_fkey"
            columns: ["cobranca_id"]
            isOneToOne: false
            referencedRelation: "cobrancas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_colaborador_id_fkey"
            columns: ["colaborador_id"]
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
      custos_fixos: {
        Row: {
          ativo: boolean | null
          categoria: Database["public"]["Enums"]["categoria_custo"]
          created_at: string | null
          dia_vencimento: number | null
          id: string
          nome: string
          observacoes: string | null
          recorrente: boolean | null
          updated_at: string | null
          valor: number
        }
        Insert: {
          ativo?: boolean | null
          categoria: Database["public"]["Enums"]["categoria_custo"]
          created_at?: string | null
          dia_vencimento?: number | null
          id?: string
          nome: string
          observacoes?: string | null
          recorrente?: boolean | null
          updated_at?: string | null
          valor: number
        }
        Update: {
          ativo?: boolean | null
          categoria?: Database["public"]["Enums"]["categoria_custo"]
          created_at?: string | null
          dia_vencimento?: number | null
          id?: string
          nome?: string
          observacoes?: string | null
          recorrente?: boolean | null
          updated_at?: string | null
          valor?: number
        }
        Relationships: []
      }
      custos_variaveis: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_custo"]
          cliente_id: string | null
          created_at: string | null
          data_referencia: string
          id: string
          lancado_por_id: string
          nome: string
          observacoes: string | null
          valor: number
        }
        Insert: {
          categoria: Database["public"]["Enums"]["categoria_custo"]
          cliente_id?: string | null
          created_at?: string | null
          data_referencia: string
          id?: string
          lancado_por_id: string
          nome: string
          observacoes?: string | null
          valor: number
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_custo"]
          cliente_id?: string | null
          created_at?: string | null
          data_referencia?: string
          id?: string
          lancado_por_id?: string
          nome?: string
          observacoes?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "custos_variaveis_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custos_variaveis_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "margem_por_cliente"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "custos_variaveis_lancado_por_id_fkey"
            columns: ["lancado_por_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      etapas_kanban: {
        Row: {
          cor: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          is_done: boolean | null
          nome: string
          ordem: number
        }
        Insert: {
          cor?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          is_done?: boolean | null
          nome: string
          ordem: number
        }
        Update: {
          cor?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          is_done?: boolean | null
          nome?: string
          ordem?: number
        }
        Relationships: []
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
      lancamentos: {
        Row: {
          categoria: string
          cliente_id: string | null
          cobranca_id: string | null
          created_at: string | null
          custo_fixo_id: string | null
          custo_variavel_id: string | null
          data: string
          descricao: string
          id: string
          lancado_por_id: string
          tipo: Database["public"]["Enums"]["tipo_lancamento"]
          valor: number
        }
        Insert: {
          categoria: string
          cliente_id?: string | null
          cobranca_id?: string | null
          created_at?: string | null
          custo_fixo_id?: string | null
          custo_variavel_id?: string | null
          data: string
          descricao: string
          id?: string
          lancado_por_id: string
          tipo: Database["public"]["Enums"]["tipo_lancamento"]
          valor: number
        }
        Update: {
          categoria?: string
          cliente_id?: string | null
          cobranca_id?: string | null
          created_at?: string | null
          custo_fixo_id?: string | null
          custo_variavel_id?: string | null
          data?: string
          descricao?: string
          id?: string
          lancado_por_id?: string
          tipo?: Database["public"]["Enums"]["tipo_lancamento"]
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "margem_por_cliente"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "lancamentos_cobranca_id_fkey"
            columns: ["cobranca_id"]
            isOneToOne: false
            referencedRelation: "cobrancas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_custo_fixo_id_fkey"
            columns: ["custo_fixo_id"]
            isOneToOne: false
            referencedRelation: "custos_fixos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_custo_variavel_id_fkey"
            columns: ["custo_variavel_id"]
            isOneToOne: false
            referencedRelation: "custos_variaveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_lancado_por_id_fkey"
            columns: ["lancado_por_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      notificacoes: {
        Row: {
          created_at: string | null
          dados: Json | null
          id: string
          lida: boolean | null
          lida_em: string | null
          link: string | null
          mensagem: string
          tipo: Database["public"]["Enums"]["tipo_notificacao"]
          titulo: string
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          dados?: Json | null
          id?: string
          lida?: boolean | null
          lida_em?: string | null
          link?: string | null
          mensagem: string
          tipo: Database["public"]["Enums"]["tipo_notificacao"]
          titulo: string
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          dados?: Json | null
          id?: string
          lida?: boolean | null
          lida_em?: string | null
          link?: string | null
          mensagem?: string
          tipo?: Database["public"]["Enums"]["tipo_notificacao"]
          titulo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nps_config: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          email_assunto: string | null
          email_corpo: string | null
          frequencia_meses: number | null
          id: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          email_assunto?: string | null
          email_corpo?: string | null
          frequencia_meses?: number | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          email_assunto?: string | null
          email_corpo?: string | null
          frequencia_meses?: number | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      nps_envios: {
        Row: {
          cliente_id: string
          created_at: string | null
          enviado_em: string | null
          expira_em: string
          id: string
          respondido: boolean | null
          resposta_id: string | null
          token: string
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          enviado_em?: string | null
          expira_em: string
          id?: string
          respondido?: boolean | null
          resposta_id?: string | null
          token: string
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          enviado_em?: string | null
          expira_em?: string
          id?: string
          respondido?: boolean | null
          resposta_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "nps_envios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nps_envios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "margem_por_cliente"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "nps_envios_resposta_id_fkey"
            columns: ["resposta_id"]
            isOneToOne: false
            referencedRelation: "nps_respostas"
            referencedColumns: ["id"]
          },
        ]
      }
      nps_respostas: {
        Row: {
          cliente_id: string
          comentario: string | null
          created_at: string | null
          enviado_em: string | null
          id: string
          respondido_em: string | null
          score: number
        }
        Insert: {
          cliente_id: string
          comentario?: string | null
          created_at?: string | null
          enviado_em?: string | null
          id?: string
          respondido_em?: string | null
          score: number
        }
        Update: {
          cliente_id?: string
          comentario?: string | null
          created_at?: string | null
          enviado_em?: string | null
          id?: string
          respondido_em?: string | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "nps_respostas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nps_respostas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "margem_por_cliente"
            referencedColumns: ["cliente_id"]
          },
        ]
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
      projetos: {
        Row: {
          cliente_id: string
          cliente_servico_id: string | null
          created_at: string | null
          data_conclusao: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          nome: string
          responsavel_principal_id: string | null
          status: Database["public"]["Enums"]["status_projeto"] | null
          updated_at: string | null
        }
        Insert: {
          cliente_id: string
          cliente_servico_id?: string | null
          created_at?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          nome: string
          responsavel_principal_id?: string | null
          status?: Database["public"]["Enums"]["status_projeto"] | null
          updated_at?: string | null
        }
        Update: {
          cliente_id?: string
          cliente_servico_id?: string | null
          created_at?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          responsavel_principal_id?: string | null
          status?: Database["public"]["Enums"]["status_projeto"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projetos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "margem_por_cliente"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "projetos_cliente_servico_id_fkey"
            columns: ["cliente_servico_id"]
            isOneToOne: false
            referencedRelation: "cliente_servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_responsavel_principal_id_fkey"
            columns: ["responsavel_principal_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reuniao_ata_tarefas: {
        Row: {
          ata_id: string
          created_at: string | null
          id: string
          tarefa_id: string
        }
        Insert: {
          ata_id: string
          created_at?: string | null
          id?: string
          tarefa_id: string
        }
        Update: {
          ata_id?: string
          created_at?: string | null
          id?: string
          tarefa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reuniao_ata_tarefas_ata_id_fkey"
            columns: ["ata_id"]
            isOneToOne: false
            referencedRelation: "reuniao_atas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reuniao_ata_tarefas_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      reuniao_atas: {
        Row: {
          conteudo: string
          created_at: string | null
          created_by_id: string
          id: string
          reuniao_id: string
          updated_at: string | null
        }
        Insert: {
          conteudo: string
          created_at?: string | null
          created_by_id: string
          id?: string
          reuniao_id: string
          updated_at?: string | null
        }
        Update: {
          conteudo?: string
          created_at?: string | null
          created_by_id?: string
          id?: string
          reuniao_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reuniao_atas_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reuniao_atas_reuniao_id_fkey"
            columns: ["reuniao_id"]
            isOneToOne: true
            referencedRelation: "reunioes"
            referencedColumns: ["id"]
          },
        ]
      }
      reuniao_participantes: {
        Row: {
          confirmado: boolean | null
          created_at: string | null
          id: string
          participante_id: string
          reuniao_id: string
        }
        Insert: {
          confirmado?: boolean | null
          created_at?: string | null
          id?: string
          participante_id: string
          reuniao_id: string
        }
        Update: {
          confirmado?: boolean | null
          created_at?: string | null
          id?: string
          participante_id?: string
          reuniao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reuniao_participantes_participante_id_fkey"
            columns: ["participante_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reuniao_participantes_reuniao_id_fkey"
            columns: ["reuniao_id"]
            isOneToOne: false
            referencedRelation: "reunioes"
            referencedColumns: ["id"]
          },
        ]
      }
      reunioes: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          data_fim: string
          data_inicio: string
          descricao: string | null
          id: string
          lead_id: string | null
          local: string | null
          organizador_id: string
          projeto_id: string | null
          recorrencia_config: Json | null
          recorrente: boolean | null
          status: Database["public"]["Enums"]["status_reuniao"] | null
          tipo: Database["public"]["Enums"]["tipo_reuniao"] | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          data_fim: string
          data_inicio: string
          descricao?: string | null
          id?: string
          lead_id?: string | null
          local?: string | null
          organizador_id: string
          projeto_id?: string | null
          recorrencia_config?: Json | null
          recorrente?: boolean | null
          status?: Database["public"]["Enums"]["status_reuniao"] | null
          tipo?: Database["public"]["Enums"]["tipo_reuniao"] | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          id?: string
          lead_id?: string | null
          local?: string | null
          organizador_id?: string
          projeto_id?: string | null
          recorrencia_config?: Json | null
          recorrente?: boolean | null
          status?: Database["public"]["Enums"]["status_reuniao"] | null
          tipo?: Database["public"]["Enums"]["tipo_reuniao"] | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reunioes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunioes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "margem_por_cliente"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "reunioes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunioes_organizador_id_fkey"
            columns: ["organizador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunioes_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
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
      tarefa_anexos: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          tamanho: number | null
          tarefa_id: string
          tipo: string | null
          uploaded_por_id: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          tamanho?: number | null
          tarefa_id: string
          tipo?: string | null
          uploaded_por_id?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          tamanho?: number | null
          tarefa_id?: string
          tipo?: string | null
          uploaded_por_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefa_anexos_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefa_anexos_uploaded_por_id_fkey"
            columns: ["uploaded_por_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefa_comentario_anexos: {
        Row: {
          comentario_id: string
          created_at: string | null
          id: string
          nome: string
          tamanho: number | null
          tipo: string | null
          url: string
        }
        Insert: {
          comentario_id: string
          created_at?: string | null
          id?: string
          nome: string
          tamanho?: number | null
          tipo?: string | null
          url: string
        }
        Update: {
          comentario_id?: string
          created_at?: string | null
          id?: string
          nome?: string
          tamanho?: number | null
          tipo?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefa_comentario_anexos_comentario_id_fkey"
            columns: ["comentario_id"]
            isOneToOne: false
            referencedRelation: "tarefa_comentarios"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefa_comentarios: {
        Row: {
          autor_id: string
          conteudo: string
          created_at: string | null
          id: string
          tarefa_id: string
          updated_at: string | null
        }
        Insert: {
          autor_id: string
          conteudo: string
          created_at?: string | null
          id?: string
          tarefa_id: string
          updated_at?: string | null
        }
        Update: {
          autor_id?: string
          conteudo?: string
          created_at?: string | null
          id?: string
          tarefa_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tarefa_comentarios_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefa_comentarios_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefa_historico: {
        Row: {
          created_at: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          descricao: string
          id: string
          realizado_por_id: string
          tarefa_id: string
          tipo: Database["public"]["Enums"]["tipo_historico_tarefa"]
        }
        Insert: {
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          descricao: string
          id?: string
          realizado_por_id: string
          tarefa_id: string
          tipo: Database["public"]["Enums"]["tipo_historico_tarefa"]
        }
        Update: {
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          descricao?: string
          id?: string
          realizado_por_id?: string
          tarefa_id?: string
          tipo?: Database["public"]["Enums"]["tipo_historico_tarefa"]
        }
        Relationships: [
          {
            foreignKeyName: "tarefa_historico_realizado_por_id_fkey"
            columns: ["realizado_por_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefa_historico_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefa_mencoes: {
        Row: {
          comentario_id: string
          created_at: string | null
          id: string
          usuario_mencionado_id: string
        }
        Insert: {
          comentario_id: string
          created_at?: string | null
          id?: string
          usuario_mencionado_id: string
        }
        Update: {
          comentario_id?: string
          created_at?: string | null
          id?: string
          usuario_mencionado_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefa_mencoes_comentario_id_fkey"
            columns: ["comentario_id"]
            isOneToOne: false
            referencedRelation: "tarefa_comentarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefa_mencoes_usuario_mencionado_id_fkey"
            columns: ["usuario_mencionado_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas: {
        Row: {
          cliente_id: string
          concluida: boolean | null
          concluida_em: string | null
          concluida_por_id: string | null
          created_at: string | null
          created_by_id: string
          data_vencimento: string | null
          descricao: string | null
          etapa_id: string
          id: string
          ordem: number | null
          prioridade: Database["public"]["Enums"]["prioridade_tarefa"] | null
          projeto_id: string
          recorrencia_config: Json | null
          recorrente: boolean | null
          responsavel_id: string | null
          tarefa_pai_id: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          cliente_id: string
          concluida?: boolean | null
          concluida_em?: string | null
          concluida_por_id?: string | null
          created_at?: string | null
          created_by_id: string
          data_vencimento?: string | null
          descricao?: string | null
          etapa_id: string
          id?: string
          ordem?: number | null
          prioridade?: Database["public"]["Enums"]["prioridade_tarefa"] | null
          projeto_id: string
          recorrencia_config?: Json | null
          recorrente?: boolean | null
          responsavel_id?: string | null
          tarefa_pai_id?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          cliente_id?: string
          concluida?: boolean | null
          concluida_em?: string | null
          concluida_por_id?: string | null
          created_at?: string | null
          created_by_id?: string
          data_vencimento?: string | null
          descricao?: string | null
          etapa_id?: string
          id?: string
          ordem?: number | null
          prioridade?: Database["public"]["Enums"]["prioridade_tarefa"] | null
          projeto_id?: string
          recorrencia_config?: Json | null
          recorrente?: boolean | null
          responsavel_id?: string | null
          tarefa_pai_id?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "margem_por_cliente"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "tarefas_concluida_por_id_fkey"
            columns: ["concluida_por_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "etapas_kanban"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_tarefa_pai_id_fkey"
            columns: ["tarefa_pai_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      template_onboarding_tarefas: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          ordem: number
          prazo_dias: number | null
          setor_responsavel: string | null
          template_id: string
          titulo: string
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          ordem: number
          prazo_dias?: number | null
          setor_responsavel?: string | null
          template_id: string
          titulo: string
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          ordem?: number
          prazo_dias?: number | null
          setor_responsavel?: string | null
          template_id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_onboarding_tarefas_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates_onboarding"
            referencedColumns: ["id"]
          },
        ]
      }
      templates_onboarding: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          nome: string
          servico_id: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome: string
          servico_id: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome?: string
          servico_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_onboarding_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
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
      margem_por_cliente: {
        Row: {
          cliente_id: string | null
          custos_variaveis: number | null
          margem: number | null
          nome_fantasia: string | null
          razao_social: string | null
          receita_mensal: number | null
        }
        Relationships: []
      }
      mrr_atual: {
        Row: {
          mrr: number | null
          total_clientes: number | null
        }
        Relationships: []
      }
      resumo_financeiro_mensal: {
        Row: {
          despesa: number | null
          lucro: number | null
          mes: string | null
          receita: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      criar_notificacao: {
        Args: {
          p_dados?: Json
          p_link?: string
          p_mensagem: string
          p_tipo: Database["public"]["Enums"]["tipo_notificacao"]
          p_titulo: string
          p_usuario_id: string
        }
        Returns: string
      }
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
      is_admin_or_financeiro: { Args: never; Returns: boolean }
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
      categoria_custo:
        | "ferramenta"
        | "pessoal"
        | "infraestrutura"
        | "midia"
        | "freelancer"
        | "outros"
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
      prioridade_tarefa: "baixa" | "media" | "alta" | "urgente"
      setor_tipo: "comercial" | "trafego" | "social_media" | "financeiro"
      status_ausencia: "pendente" | "aprovada" | "recusada"
      status_cliente: "ativo" | "inadimplente" | "cancelado"
      status_cobranca: "pendente" | "pago" | "atrasado" | "cancelado" | "falhou"
      status_comissao: "pendente" | "aprovada" | "paga" | "cancelada"
      status_projeto: "ativo" | "pausado" | "concluido" | "cancelado"
      status_reuniao: "agendada" | "realizada" | "cancelada"
      tipo_arquivo: "contrato" | "briefing" | "documento" | "outro"
      tipo_ausencia: "ferias" | "ausencia"
      tipo_cobranca: "recorrente" | "avulsa"
      tipo_comissao: "sdr" | "closer"
      tipo_historico_tarefa:
        | "criada"
        | "etapa_alterada"
        | "responsavel_alterado"
        | "prioridade_alterada"
        | "prazo_alterado"
        | "concluida"
        | "reaberta"
        | "editada"
      tipo_lancamento: "receita" | "despesa"
      tipo_notificacao:
        | "tarefa_atribuida"
        | "tarefa_prazo"
        | "tarefa_comentario"
        | "tarefa_mencao"
        | "lead_recebido"
        | "reuniao_agendada"
        | "reuniao_lembrete"
        | "cliente_ativado"
        | "pagamento_confirmado"
        | "pagamento_atrasado"
        | "sla_alerta"
        | "ausencia_solicitada"
        | "ausencia_aprovada"
        | "nps_detrator"
        | "contrato_vencendo"
        | "geral"
      tipo_reuniao: "weekly" | "1:1" | "projeto" | "cliente" | "outro"
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
      categoria_custo: [
        "ferramenta",
        "pessoal",
        "infraestrutura",
        "midia",
        "freelancer",
        "outros",
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
      prioridade_tarefa: ["baixa", "media", "alta", "urgente"],
      setor_tipo: ["comercial", "trafego", "social_media", "financeiro"],
      status_ausencia: ["pendente", "aprovada", "recusada"],
      status_cliente: ["ativo", "inadimplente", "cancelado"],
      status_cobranca: ["pendente", "pago", "atrasado", "cancelado", "falhou"],
      status_comissao: ["pendente", "aprovada", "paga", "cancelada"],
      status_projeto: ["ativo", "pausado", "concluido", "cancelado"],
      status_reuniao: ["agendada", "realizada", "cancelada"],
      tipo_arquivo: ["contrato", "briefing", "documento", "outro"],
      tipo_ausencia: ["ferias", "ausencia"],
      tipo_cobranca: ["recorrente", "avulsa"],
      tipo_comissao: ["sdr", "closer"],
      tipo_historico_tarefa: [
        "criada",
        "etapa_alterada",
        "responsavel_alterado",
        "prioridade_alterada",
        "prazo_alterado",
        "concluida",
        "reaberta",
        "editada",
      ],
      tipo_lancamento: ["receita", "despesa"],
      tipo_notificacao: [
        "tarefa_atribuida",
        "tarefa_prazo",
        "tarefa_comentario",
        "tarefa_mencao",
        "lead_recebido",
        "reuniao_agendada",
        "reuniao_lembrete",
        "cliente_ativado",
        "pagamento_confirmado",
        "pagamento_atrasado",
        "sla_alerta",
        "ausencia_solicitada",
        "ausencia_aprovada",
        "nps_detrator",
        "contrato_vencendo",
        "geral",
      ],
      tipo_reuniao: ["weekly", "1:1", "projeto", "cliente", "outro"],
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
