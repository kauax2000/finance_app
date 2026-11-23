// GERADO POR `npm run db:types` (supabase gen types typescript --local). Não edite à mão.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      attachments: {
        Row: {
          bill_instance_id: string | null
          created_at: string
          created_by: string
          id: string
          mime: string
          path: string
          size_bytes: number
          statement_total_id: string | null
          transaction_id: string | null
          workspace_id: string
        }
        Insert: {
          bill_instance_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          mime: string
          path: string
          size_bytes: number
          statement_total_id?: string | null
          transaction_id?: string | null
          workspace_id: string
        }
        Update: {
          bill_instance_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          mime?: string
          path?: string
          size_bytes?: number
          statement_total_id?: string | null
          transaction_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_bill_instance_id_fkey"
            columns: ["bill_instance_id"]
            isOneToOne: false
            referencedRelation: "bill_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_statement_total_id_fkey"
            columns: ["statement_total_id"]
            isOneToOne: false
            referencedRelation: "credit_card_statement_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_instances: {
        Row: {
          amount: number | null
          bill_id: string
          client_id: string | null
          created_at: string
          due_date: string
          id: string
          notes: string | null
          paid_amount: number | null
          paid_at: string | null
          payment_credit_card_id: string | null
          payment_method: string | null
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          amount?: number | null
          bill_id: string
          client_id?: string | null
          created_at?: string
          due_date: string
          id?: string
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_credit_card_id?: string | null
          payment_method?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          amount?: number | null
          bill_id?: string
          client_id?: string | null
          created_at?: string
          due_date?: string
          id?: string
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_credit_card_id?: string | null
          payment_method?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_instances_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_instances_payment_credit_card_id_fkey"
            columns: ["payment_credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_instances_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_instances_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_notification_dedupe: {
        Row: {
          bill_instance_id: string
          id: string
          reminder_offset_days: number
          sent_on: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          bill_instance_id: string
          id?: string
          reminder_offset_days: number
          sent_on?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          bill_instance_id?: string
          id?: string
          reminder_offset_days?: number
          sent_on?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_notification_dedupe_bill_instance_id_fkey"
            columns: ["bill_instance_id"]
            isOneToOne: false
            referencedRelation: "bill_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_notification_dedupe_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_avisos: {
        Row: {
          enviado_em: string
          pendente: boolean
          referencia: string
          tentativas: number
          tipo: string
          user_id: string
        }
        Insert: {
          enviado_em?: string
          pendente?: boolean
          tentativas?: number
          referencia: string
          tipo: string
          user_id: string
        }
        Update: {
          enviado_em?: string
          pendente?: boolean
          referencia?: string
          tentativas?: number
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      billing_events: {
        Row: {
          id: string
          processado_em: string | null
          recebido_em: string
          tipo: string
        }
        Insert: {
          id: string
          processado_em?: string | null
          recebido_em?: string
          tipo: string
        }
        Update: {
          id?: string
          processado_em?: string | null
          recebido_em?: string
          tipo?: string
        }
        Relationships: []
      }
      billing_parcelamentos: {
        Row: {
          ativado_em: string | null
          criado_em: string
          estorno_status: string | null
          estorno_tentado_em: string | null
          installment: string
          subscription_id: string
        }
        Insert: {
          ativado_em?: string | null
          criado_em?: string
          estorno_status?: string | null
          estorno_tentado_em?: string | null
          installment: string
          subscription_id: string
        }
        Update: {
          ativado_em?: string | null
          criado_em?: string
          estorno_status?: string | null
          estorno_tentado_em?: string | null
          installment?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_parcelamentos_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "billing_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_settings: {
        Row: {
          enforced_since: string | null
          id: boolean
        }
        Insert: {
          enforced_since?: string | null
          id?: boolean
        }
        Update: {
          enforced_since?: string | null
          id?: boolean
        }
        Relationships: []
      }
      billing_subscriptions: {
        Row: {
          asaas_customer_id: string | null
          cancel_at_period_end: boolean
          card_brand: string | null
          card_last4: string | null
          card_token: string | null
          checkout_criado_em: string | null
          checkout_ref: string | null
          checkout_url: string | null
          created_at: string
          current_period_end: string | null
          founder: boolean
          grace_until: string | null
          id: string
          interval: string
          nfse_para: string | null
          plan: string
          price_cents: number | null
          provider: string
          provider_ref: string | null
          reembolsavel_ate: string | null
          status: string
          ultimo_ip: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asaas_customer_id?: string | null
          cancel_at_period_end?: boolean
          card_brand?: string | null
          card_last4?: string | null
          card_token?: string | null
          checkout_criado_em?: string | null
          checkout_ref?: string | null
          checkout_url?: string | null
          created_at?: string
          current_period_end?: string | null
          founder?: boolean
          grace_until?: string | null
          id?: string
          interval?: string
          nfse_para?: string | null
          plan?: string
          price_cents?: number | null
          provider: string
          provider_ref?: string | null
          reembolsavel_ate?: string | null
          status: string
          ultimo_ip?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asaas_customer_id?: string | null
          cancel_at_period_end?: boolean
          card_brand?: string | null
          card_last4?: string | null
          card_token?: string | null
          checkout_criado_em?: string | null
          checkout_ref?: string | null
          checkout_url?: string | null
          created_at?: string
          current_period_end?: string | null
          founder?: boolean
          grace_until?: string | null
          id?: string
          interval?: string
          nfse_para?: string | null
          plan?: string
          price_cents?: number | null
          provider?: string
          provider_ref?: string | null
          reembolsavel_ate?: string | null
          status?: string
          ultimo_ip?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bills: {
        Row: {
          amount_estimated: number | null
          category_id: string | null
          client_id: string | null
          created_at: string
          default_payment_credit_card_id: string | null
          default_payment_method: string | null
          description: string | null
          due_day_of_month: number
          end_date: string | null
          frequency: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          reminder_days_before: number[]
          start_date: string
          updated_at: string
          user_id: string
          valor_variavel: boolean
          workspace_id: string
        }
        Insert: {
          amount_estimated?: number | null
          category_id?: string | null
          client_id?: string | null
          created_at?: string
          default_payment_credit_card_id?: string | null
          default_payment_method?: string | null
          description?: string | null
          due_day_of_month?: number
          end_date?: string | null
          frequency?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          reminder_days_before?: number[]
          start_date: string
          updated_at?: string
          user_id: string
          valor_variavel?: boolean
          workspace_id: string
        }
        Update: {
          amount_estimated?: number | null
          category_id?: string | null
          client_id?: string | null
          created_at?: string
          default_payment_credit_card_id?: string | null
          default_payment_method?: string | null
          description?: string | null
          due_day_of_month?: number
          end_date?: string | null
          frequency?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          reminder_days_before?: number[]
          start_date?: string
          updated_at?: string
          user_id?: string
          valor_variavel?: boolean
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_default_payment_credit_card_id_fkey"
            columns: ["default_payment_credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount: number
          category_id: string
          client_id: string | null
          created_at: string
          id: string
          month: number
          period_end: string
          period_start: string
          repeats: boolean
          threshold_100_sent_at: string | null
          threshold_80_sent_at: string | null
          threshold_over_sent_at: string | null
          updated_at: string
          user_id: string
          workspace_id: string
          year: number
        }
        Insert: {
          amount: number
          category_id: string
          client_id?: string | null
          created_at?: string
          id?: string
          month: number
          period_end: string
          period_start: string
          repeats?: boolean
          threshold_100_sent_at?: string | null
          threshold_80_sent_at?: string | null
          threshold_over_sent_at?: string | null
          updated_at?: string
          user_id: string
          workspace_id: string
          year: number
        }
        Update: {
          amount?: number
          category_id?: string
          client_id?: string | null
          created_at?: string
          id?: string
          month?: number
          period_end?: string
          period_start?: string
          repeats?: boolean
          threshold_100_sent_at?: string | null
          threshold_80_sent_at?: string | null
          threshold_over_sent_at?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      capture_tokens: {
        Row: {
          atalho_gatilho: string | null
          atalho_versao: number | null
          created_at: string
          id: string
          last_used_at: string | null
          name: string
          revoked_at: string | null
          token_hash: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          atalho_gatilho?: string | null
          atalho_versao?: number | null
          created_at?: string
          id?: string
          last_used_at?: string | null
          name: string
          revoked_at?: string | null
          token_hash: string
          user_id: string
          workspace_id: string
        }
        Update: {
          atalho_gatilho?: string | null
          atalho_versao?: number | null
          created_at?: string
          id?: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          token_hash?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "capture_tokens_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          client_id: string | null
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          type: string
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          client_id?: string | null
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          client_id?: string | null
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_card_category_spend_alerts: {
        Row: {
          category_id: string | null
          created_at: string
          created_by: string
          credit_card_id: string
          id: string
          threshold_brl: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_by: string
          credit_card_id: string
          id?: string
          threshold_brl: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_by?: string
          credit_card_id?: string
          id?: string
          threshold_brl?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_card_category_spend_alerts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_category_spend_alerts_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_category_spend_alerts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_card_invoice_payments: {
        Row: {
          created_at: string
          created_by: string
          credit_card_id: string
          id: string
          paid_at: string
          statement_close_date: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          credit_card_id: string
          id?: string
          paid_at?: string
          statement_close_date: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          credit_card_id?: string
          id?: string
          paid_at?: string
          statement_close_date?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_card_invoice_payments_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_invoice_payments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_card_notification_dedupe: {
        Row: {
          credit_card_id: string
          dedupe_key: string
          id: string
          sent_at: string
          workspace_id: string
        }
        Insert: {
          credit_card_id: string
          dedupe_key: string
          id?: string
          sent_at?: string
          workspace_id: string
        }
        Update: {
          credit_card_id?: string
          dedupe_key?: string
          id?: string
          sent_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_card_notification_dedupe_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_notification_dedupe_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_card_statement_totals: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bank_total: number
          created_at: string
          created_by: string
          credit_card_id: string
          id: string
          source: string
          statement_close_date: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bank_total: number
          created_at?: string
          created_by?: string
          credit_card_id: string
          id?: string
          source: string
          statement_close_date: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bank_total?: number
          created_at?: string
          created_by?: string
          credit_card_id?: string
          id?: string
          source?: string
          statement_close_date?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_card_statement_totals_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_statement_totals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_cards: {
        Row: {
          brand: string | null
          client_id: string | null
          closing_day: number
          created_at: string
          credit_limit: number | null
          due_day: number
          expiry_month: number | null
          expiry_year: number | null
          holder_user_id: string | null
          id: string
          is_active: boolean
          last_four: string
          name: string
          updated_at: string
          user_id: string
          wallet_alias: string | null
          workspace_id: string
        }
        Insert: {
          brand?: string | null
          client_id?: string | null
          closing_day: number
          created_at?: string
          credit_limit?: number | null
          due_day: number
          expiry_month?: number | null
          expiry_year?: number | null
          holder_user_id?: string | null
          id?: string
          is_active?: boolean
          last_four: string
          name: string
          updated_at?: string
          user_id: string
          wallet_alias?: string | null
          workspace_id: string
        }
        Update: {
          brand?: string | null
          client_id?: string | null
          closing_day?: number
          created_at?: string
          credit_limit?: number | null
          due_day?: number
          expiry_month?: number | null
          expiry_year?: number | null
          holder_user_id?: string | null
          id?: string
          is_active?: boolean
          last_four?: string
          name?: string
          updated_at?: string
          user_id?: string
          wallet_alias?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_cards_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ia_cache: {
        Row: {
          chave: string
          created_at: string
          resultado: Json
          tarefa: string
        }
        Insert: {
          chave: string
          created_at?: string
          resultado: Json
          tarefa: string
        }
        Update: {
          chave?: string
          created_at?: string
          resultado?: Json
          tarefa?: string
        }
        Relationships: []
      }
      ia_eventos: {
        Row: {
          dia: string
          modelo: string
          provedor: string
          status: string
          total: number
        }
        Insert: {
          dia: string
          modelo: string
          provedor: string
          status: string
          total?: number
        }
        Update: {
          dia?: string
          modelo?: string
          provedor?: string
          status?: string
          total?: number
        }
        Relationships: []
      }
      ia_uso: {
        Row: {
          chamadas: number
          dia: string
          user_id: string
        }
        Insert: {
          chamadas?: number
          dia: string
          user_id: string
        }
        Update: {
          chamadas?: number
          dia?: string
          user_id?: string
        }
        Relationships: []
      }
      insights: {
        Row: {
          created_at: string
          dedupe_key: string
          id: string
          kind: string
          payload: Json
          status: string
          updated_at: string
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          dedupe_key: string
          id?: string
          kind: string
          payload?: Json
          status?: string
          updated_at?: string
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          dedupe_key?: string
          id?: string
          kind?: string
          payload?: Json
          status?: string
          updated_at?: string
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insights_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      insights_push_semana: {
        Row: {
          enviados: number
          semana: string
          user_id: string
        }
        Insert: {
          enviados?: number
          semana: string
          user_id: string
        }
        Update: {
          enviados?: number
          semana?: string
          user_id?: string
        }
        Relationships: []
      }
      insights_silenciados: {
        Row: {
          criado_em: string
          kind: string
          user_id: string
        }
        Insert: {
          criado_em?: string
          kind: string
          user_id: string
        }
        Update: {
          criado_em?: string
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      limites_avisados: {
        Row: {
          avisado_em: string
          nivel: number
          user_id: string
          workspace_id: string
          ym: string
        }
        Insert: {
          avisado_em?: string
          nivel: number
          user_id: string
          workspace_id: string
          ym: string
        }
        Update: {
          avisado_em?: string
          nivel?: number
          user_id?: string
          workspace_id?: string
          ym?: string
        }
        Relationships: [
          {
            foreignKeyName: "limites_avisados_workspace_id_user_id_fkey"
            columns: ["workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "workspace_members"
            referencedColumns: ["workspace_id", "user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          metadata: Json
          read_at: string | null
          title: string
          type: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          metadata?: Json
          read_at?: string | null
          title: string
          type: string
          user_id: string
          workspace_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          metadata?: Json
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos_copiados: {
        Row: {
          copiado_em: string
          period_start: string
          workspace_id: string
        }
        Insert: {
          copiado_em?: string
          period_start: string
          workspace_id: string
        }
        Update: {
          copiado_em?: string
          period_start?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_copiados_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_color: string | null
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_color?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_color?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          archived_at: string | null
          budget_total: number | null
          created_at: string
          created_by: string | null
          ends_on: string | null
          id: string
          name: string
          starts_on: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          budget_total?: number | null
          created_at?: string
          created_by?: string | null
          ends_on?: string | null
          id?: string
          name: string
          starts_on?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          budget_total?: number | null
          created_at?: string
          created_by?: string | null
          ends_on?: string | null
          id?: string
          name?: string
          starts_on?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      review_reminder_dedupe: {
        Row: {
          sent_on: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          sent_on: string
          user_id: string
          workspace_id: string
        }
        Update: {
          sent_on?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reminder_dedupe_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      settlements: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          from_user: string
          id: string
          note: string | null
          settled_on: string
          to_user: string
          workspace_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          from_user: string
          id?: string
          note?: string | null
          settled_on?: string
          to_user: string
          workspace_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          from_user?: string
          id?: string
          note?: string | null
          settled_on?: string
          to_user?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_shares: {
        Row: {
          amount: number
          transaction_id: string
          user_id: string
        }
        Insert: {
          amount: number
          transaction_id: string
          user_id: string
        }
        Update: {
          amount?: number
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_shares_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          capture_meta: Json | null
          category_id: string | null
          client_id: string | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          import_batch_id: string | null
          installment_plan_id: string | null
          installment_sequence: number | null
          is_recurring: boolean | null
          needs_review: boolean
          paid_by: string | null
          payment_credit_card_id: string | null
          payment_method: string | null
          project_id: string | null
          recurring_interval: string | null
          shares_manual: boolean
          source: string
          subscription_id: string | null
          type: string
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          amount: number
          capture_meta?: Json | null
          category_id?: string | null
          client_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          import_batch_id?: string | null
          installment_plan_id?: string | null
          installment_sequence?: number | null
          is_recurring?: boolean | null
          needs_review?: boolean
          paid_by?: string | null
          payment_credit_card_id?: string | null
          payment_method?: string | null
          project_id?: string | null
          recurring_interval?: string | null
          shares_manual?: boolean
          source?: string
          subscription_id?: string | null
          type: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          amount?: number
          capture_meta?: Json | null
          category_id?: string | null
          client_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          import_batch_id?: string | null
          installment_plan_id?: string | null
          installment_sequence?: number | null
          is_recurring?: boolean | null
          needs_review?: boolean
          paid_by?: string | null
          payment_credit_card_id?: string | null
          payment_method?: string | null
          project_id?: string | null
          recurring_interval?: string | null
          shares_manual?: boolean
          source?: string
          subscription_id?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_installment_plan_id_fkey"
            columns: ["installment_plan_id"]
            isOneToOne: false
            referencedRelation: "workspace_installment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_payment_credit_card_id_fkey"
            columns: ["payment_credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "workspace_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          created_at: string | null
          dedupe_key: string | null
          description: string
          device: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          status: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dedupe_key?: string | null
          description: string
          device?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          status?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          dedupe_key?: string | null
          description?: string
          device?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          status?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          auth_session_id: string | null
          browser: string | null
          created_at: string | null
          device_fingerprint: string | null
          device_id: string | null
          device_name: string | null
          device_type: string | null
          id: string
          ip_address: unknown
          is_active: boolean | null
          last_active_at: string | null
          os: string | null
          token_hash: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_session_id?: string | null
          browser?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          device_id?: string | null
          device_name?: string | null
          device_type?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_active_at?: string | null
          os?: string | null
          token_hash?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_session_id?: string | null
          browser?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          device_id?: string | null
          device_name?: string | null
          device_type?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_active_at?: string | null
          os?: string | null
          token_hash?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          current_workspace_id: string | null
          jornada_concluida_em: string | null
          lancamento_inteligente: boolean
          lancamento_inteligente_em: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_workspace_id?: string | null
          jornada_concluida_em?: string | null
          lancamento_inteligente?: boolean
          lancamento_inteligente_em?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_workspace_id?: string | null
          jornada_concluida_em?: string | null
          lancamento_inteligente?: boolean
          lancamento_inteligente_em?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_current_workspace_id_fkey"
            columns: ["current_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_ex_convidados: {
        Row: {
          saiu_em: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          saiu_em?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          saiu_em?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_ex_convidados_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_installment_plans: {
        Row: {
          billing_anchor_day: number | null
          category_id: string | null
          created_at: string
          description: string | null
          final_installment_amount: number
          generated_count: number
          id: string
          installment_amount: number
          is_active: boolean
          next_billing_date: string
          payment_credit_card_id: string | null
          payment_method: string | null
          split_weights: Json | null
          total_installments: number
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          billing_anchor_day?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          final_installment_amount: number
          generated_count?: number
          id?: string
          installment_amount: number
          is_active?: boolean
          next_billing_date: string
          payment_credit_card_id?: string | null
          payment_method?: string | null
          split_weights?: Json | null
          total_installments: number
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          billing_anchor_day?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          final_installment_amount?: number
          generated_count?: number
          id?: string
          installment_amount?: number
          is_active?: boolean
          next_billing_date?: string
          payment_credit_card_id?: string | null
          payment_method?: string | null
          split_weights?: Json | null
          total_installments?: number
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_installment_plans_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_installment_plans_payment_credit_card_id_fkey"
            columns: ["payment_credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_installment_plans_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invites: {
        Row: {
          accepted_at: string | null
          consentimento_em: string | null
          created_at: string
          created_by: string
          expires_at: string
          id: string
          invited_email: string | null
          max_uses: number | null
          menor: boolean
          role: string
          status: string
          token_hash: string
          usage_count: number
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          consentimento_em?: string | null
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          invited_email?: string | null
          max_uses?: number | null
          menor?: boolean
          role?: string
          status?: string
          token_hash: string
          usage_count?: number
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          consentimento_em?: string | null
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          invited_email?: string | null
          max_uses?: number | null
          menor?: boolean
          role?: string
          status?: string
          token_hash?: string
          usage_count?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invites_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_member_limits: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_member_limits_workspace_id_user_id_fkey"
            columns: ["workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "workspace_members"
            referencedColumns: ["workspace_id", "user_id"]
          },
        ]
      }
      workspace_member_notification_prefs: {
        Row: {
          created_at: string
          notify_bills: boolean
          notify_budget: boolean
          notify_credit_card_calendar: boolean
          notify_credit_cards: boolean
          notify_email: boolean
          notify_in_app: boolean
          notify_insights: boolean
          notify_promotions: boolean
          notify_push: boolean
          notify_review: boolean
          notify_transactions: boolean
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          notify_bills?: boolean
          notify_budget?: boolean
          notify_credit_card_calendar?: boolean
          notify_credit_cards?: boolean
          notify_email?: boolean
          notify_in_app?: boolean
          notify_insights?: boolean
          notify_promotions?: boolean
          notify_push?: boolean
          notify_review?: boolean
          notify_transactions?: boolean
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          notify_bills?: boolean
          notify_budget?: boolean
          notify_credit_card_calendar?: boolean
          notify_credit_cards?: boolean
          notify_email?: boolean
          notify_in_app?: boolean
          notify_insights?: boolean
          notify_promotions?: boolean
          notify_push?: boolean
          notify_review?: boolean
          notify_transactions?: boolean
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_member_notification_prefs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          joined_at: string
          role: string
          sponsor_user_id: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          joined_at?: string
          role: string
          sponsor_user_id?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          joined_at?: string
          role?: string
          sponsor_user_id?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_split_weights: {
        Row: {
          user_id: string
          weight: number
          workspace_id: string
        }
        Insert: {
          user_id: string
          weight: number
          workspace_id: string
        }
        Update: {
          user_id?: string
          weight?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_split_weights_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_subscriptions: {
        Row: {
          amount: number
          billing_anchor_day: number | null
          billing_interval: string
          category_id: string | null
          client_id: string | null
          created_at: string
          currency: string
          day_of_month: number | null
          id: string
          is_active: boolean
          kind: string
          name: string
          next_billing_date: string | null
          notes: string | null
          payment_credit_card_id: string | null
          payment_method: string | null
          start_date: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          amount: number
          billing_anchor_day?: number | null
          billing_interval: string
          category_id?: string | null
          client_id?: string | null
          created_at?: string
          currency?: string
          day_of_month?: number | null
          id?: string
          is_active?: boolean
          kind?: string
          name: string
          next_billing_date?: string | null
          notes?: string | null
          payment_credit_card_id?: string | null
          payment_method?: string | null
          start_date: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          amount?: number
          billing_anchor_day?: number | null
          billing_interval?: string
          category_id?: string | null
          client_id?: string | null
          created_at?: string
          currency?: string
          day_of_month?: number | null
          id?: string
          is_active?: boolean
          kind?: string
          name?: string
          next_billing_date?: string | null
          notes?: string | null
          payment_credit_card_id?: string | null
          payment_method?: string | null
          start_date?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_subscriptions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_subscriptions_payment_credit_card_id_fkey"
            columns: ["payment_credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          budget_total: number | null
          categories_onboarding_completed_at: string | null
          created_at: string
          created_by: string
          ends_on: string | null
          icon: string
          icon_background_color: string
          id: string
          monthly_savings_target: number | null
          name: string
          purpose: string
          split_mode: string
          split_since: string | null
          starts_on: string | null
          type: string
          updated_at: string
        }
        Insert: {
          budget_total?: number | null
          categories_onboarding_completed_at?: string | null
          created_at?: string
          created_by: string
          ends_on?: string | null
          icon?: string
          icon_background_color?: string
          id?: string
          monthly_savings_target?: number | null
          name: string
          purpose?: string
          split_mode?: string
          split_since?: string | null
          starts_on?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          budget_total?: number | null
          categories_onboarding_completed_at?: string | null
          created_at?: string
          created_by?: string
          ends_on?: string | null
          icon?: string
          icon_background_color?: string
          id?: string
          monthly_savings_target?: number | null
          name?: string
          purpose?: string
          split_mode?: string
          split_since?: string | null
          starts_on?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_workspace_invite: {
        Args: { p_token_hash: string; p_user_email: string; p_user_id: string }
        Returns: Json
      }
      anexo_oculto: { Args: { p_statement_total_id: string }; Returns: boolean }
      app_today: { Args: never; Returns: string }
      avisos_de_teste_pendentes: {
        Args: never
        Returns: {
          email: string
          fim_do_teste: string
          relatorio: Json
          user_id: string
          workspace_id: string
        }[]
      }
      billing_lancar: { Args: never; Returns: undefined }
      catch_up_recurring_billing: { Args: never; Returns: Json }
      charge_subscription_cycle: {
        Args: { p_subscription_id: string }
        Returns: number
      }
      charge_workspace_installment_plan_step: {
        Args: { p_plan_id: string }
        Returns: number
      }
      cleanup_expired_sessions: { Args: never; Returns: undefined }
      cleanup_old_activity_logs: { Args: never; Returns: undefined }
      complete_workspace_categories_onboarding: {
        Args: { p_workspace_id: string }
        Returns: undefined
      }
      conferencia_liberada: {
        Args: { p_credit_card_id: string; p_workspace_id: string }
        Returns: boolean
      }
      consumir_cota_ia: {
        Args: { p_dia: string; p_limite: number; p_user_id: string }
        Returns: boolean
      }
      copiar_orcamentos_do_mes: {
        Args: { p_period_start: string; p_workspace_id?: string }
        Returns: number
      }
      create_capture_token: {
        Args: { p_gatilho?: string; p_name: string; p_workspace_id: string }
        Returns: string
      }
      create_shared_workspace: {
        Args: {
          p_icon: string
          p_icon_background_color: string
          p_name: string
        }
        Returns: {
          budget_total: number | null
          categories_onboarding_completed_at: string | null
          created_at: string
          created_by: string
          ends_on: string | null
          icon: string
          icon_background_color: string
          id: string
          monthly_savings_target: number | null
          name: string
          purpose: string
          split_mode: string
          split_since: string | null
          starts_on: string | null
          type: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "workspaces"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_workspace_installment_plan: {
        Args: {
          p_capture_meta?: Json
          p_category_id: string
          p_description: string
          p_final_installment_amount: number
          p_installment_amount: number
          p_needs_review?: boolean
          p_next_billing_date: string
          p_payment_credit_card_id: string
          p_payment_method: string
          p_source?: string
          p_total_installments: number
          p_workspace_id: string
        }
        Returns: string
      }
      criar_carteira_de_modelo: {
        Args: { p_modelo: string; p_nome: string }
        Returns: string
      }
      criar_plano_parcelado: {
        Args: {
          p_capture_meta?: Json
          p_category_id: string
          p_client_id?: string
          p_description: string
          p_final_installment_amount: number
          p_installment_amount: number
          p_needs_review?: boolean
          p_next_billing_date: string
          p_payment_credit_card_id: string
          p_payment_method: string
          p_source?: string
          p_total_installments: number
          p_user_id: string
          p_workspace_id: string
        }
        Returns: string
      }
      definir_partes: {
        Args: { p_partes: Json; p_transaction_id: string }
        Returns: undefined
      }
      delete_workspace: { Args: { p_workspace_id: string }; Returns: undefined }
      delete_workspace_installment_plan_cascade: {
        Args: { p_plan_id: string }
        Returns: undefined
      }
      dividir_em_partes: {
        Args: { p_pagador: string; p_pesos: Json; p_total_centavos: number }
        Returns: {
          centavos: number
          user_id: string
        }[]
      }
      garantir_orcamentos_do_mes: {
        Args: { p_workspace_id: string }
        Returns: number
      }
      get_account_delete_impact: {
        Args: never
        Returns: Json
      }
      get_device_info_from_user_agent: {
        Args: { user_agent_text: string }
        Returns: Json
      }
      get_workspace_delete_impact: {
        Args: { p_workspace_id: string }
        Returns: Json
      }
      historico_da_frase: {
        Args: { p_user_id?: string; p_workspace_id: string }
        Returns: {
          category_id: string | null
          date: string
          description: string | null
          n: number
          payment_credit_card_id: string | null
          payment_method: string | null
          type: string
        }[]
      }
      inserir_insights: {
        Args: { p_linhas: Json }
        Returns: Database["public"]["Tables"]["insights"]["Row"][]
      }
      is_workspace_adult: { Args: { p_workspace_id: string }; Returns: boolean }
      is_workspace_member: { Args: { workspace_id: string }; Returns: boolean }
      is_workspace_owner: { Args: { workspace_id: string }; Returns: boolean }
      ligar_pagamento_da_conta: {
        Args: {
          p_instance_id: string
          p_next_due_date: string
          p_transaction_id: string
        }
        Returns: undefined
      }
      marcar_insight: {
        Args: { p_id: string; p_status: string }
        Returns: undefined
      }
      meu_plano: { Args: never; Returns: Json }
      next_subscription_billing_date:
        | { Args: { p_from: string; p_interval: string }; Returns: string }
        | {
            Args: { p_anchor_day: number; p_from: string; p_interval: string }
            Returns: string
          }
      objeto_de_anexo_oculto: { Args: { p_name: string }; Returns: boolean }
      pay_bill_instance: {
        Args: {
          p_amount: number
          p_category_id: string
          p_description: string
          p_instance_id: string
          p_next_due_date: string
          p_paid_date: string
          p_payment_credit_card_id: string
          p_payment_method: string
        }
        Returns: string
      }
      plano_do_usuario: { Args: { p_user_id: string }; Returns: string }
      pular_instancia_da_conta: {
        Args: { p_instance_id: string; p_next_due_date: string }
        Returns: undefined
      }
      registrar_evento_ia: {
        Args: {
          p_dia: string
          p_modelo: string
          p_provedor: string
          p_status: string
        }
        Returns: undefined
      }
      registrar_insight: {
        Args: {
          p_dedupe_key: string
          p_kind: string
          p_payload: Json
          p_workspace_id: string
        }
        Returns: string
      }
      reivindicar_push_de_insight: {
        Args: { p_semana: string; p_user_id: string }
        Returns: boolean
      }
      set_capture_token_workspace: {
        Args: { p_id: string; p_workspace_id: string }
        Returns: undefined
      }
      revoke_capture_token: { Args: { p_id: string }; Returns: undefined }
      rpc_fetch_bills_page_bundle: {
        Args: { p_workspace_id: string }
        Returns: Json
      }
      rpc_fetch_category_detail_bundle: {
        Args: {
          p_category_id: string
          p_workspace_id: string
          p_year_month: string
        }
        Returns: Json
      }
      rpc_fetch_subscriptions_page_bundle: {
        Args: { p_workspace_id: string }
        Returns: Json
      }
      run_installment_billing: { Args: never; Returns: number }
      run_subscription_billing: { Args: never; Returns: number }
      saldos_da_carteira: {
        Args: { p_workspace_id: string }
        Returns: {
          acertos: number
          pago: number
          partes: number
          saiu: boolean
          saldo: number
          user_id: string
        }[]
      }
      tem_cobertura: { Args: { p_user_id: string }; Returns: boolean }
      tem_plano_proprio: { Args: { p_user_id: string }; Returns: boolean }
      trocar_papel: {
        Args: { p_role: string; p_user_id: string; p_workspace_id: string }
        Returns: undefined
      }
      virar_assinatura: {
        Args: {
          p_card_id: string | null
          p_category_id: string | null
          p_dia: number
          p_insight_id: string
          p_nome: string
          p_payment_method: string | null
          p_valor: number
        }
        Returns: string
      }
      virar_conta: {
        Args: {
          p_category_id: string | null
          p_dia: number
          p_insight_id: string
          p_next_due_date: string | null
          p_nome: string
          p_valor_variavel: boolean
        }
        Returns: string
      }
      workspace_has_members: {
        Args: { p_workspace_id: string }
        Returns: boolean
      }
      workspace_member_directory: {
        Args: { p_workspace_id: string }
        Returns: {
          avatar_color: string
          avatar_url: string
          email: string
          full_name: string
          user_id: string
        }[]
      }
      workspace_plan: { Args: { p_workspace_id: string }; Returns: string }
      workspace_role: { Args: { workspace_id: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

