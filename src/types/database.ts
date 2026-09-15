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
          id: string
          is_active: boolean
          last_four: string
          name: string
          updated_at: string
          user_id: string
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
          id?: string
          is_active?: boolean
          last_four: string
          name: string
          updated_at?: string
          user_id: string
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
          id?: string
          is_active?: boolean
          last_four?: string
          name?: string
          updated_at?: string
          user_id?: string
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
      transaction_splits: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          id: string
          percentage: number
          transaction_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          id?: string
          percentage: number
          transaction_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          id?: string
          percentage?: number
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_splits_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_splits_transaction_id_fkey"
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
          category_id: string | null
          client_id: string | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          installment_plan_id: string | null
          installment_sequence: number | null
          is_recurring: boolean | null
          payment_credit_card_id: string | null
          payment_method: string | null
          recurring_interval: string | null
          subscription_id: string | null
          type: string
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          client_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          installment_plan_id?: string | null
          installment_sequence?: number | null
          is_recurring?: boolean | null
          payment_credit_card_id?: string | null
          payment_method?: string | null
          recurring_interval?: string | null
          subscription_id?: string | null
          type: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          client_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          installment_plan_id?: string | null
          installment_sequence?: number | null
          is_recurring?: boolean | null
          payment_credit_card_id?: string | null
          payment_method?: string | null
          recurring_interval?: string | null
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
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_workspace_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_workspace_id?: string | null
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
          created_at: string
          created_by: string
          expires_at: string
          id: string
          invited_email: string | null
          max_uses: number | null
          role: string
          status: string
          token_hash: string
          usage_count: number
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          invited_email?: string | null
          max_uses?: number | null
          role?: string
          status?: string
          token_hash: string
          usage_count?: number
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          invited_email?: string | null
          max_uses?: number | null
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
      workspace_member_notification_prefs: {
        Row: {
          created_at: string
          notify_bills: boolean
          notify_budget: boolean
          notify_credit_card_calendar: boolean
          notify_credit_cards: boolean
          notify_email: boolean
          notify_in_app: boolean
          notify_promotions: boolean
          notify_push: boolean
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
          notify_promotions?: boolean
          notify_push?: boolean
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
          notify_promotions?: boolean
          notify_push?: boolean
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
          user_id: string
          workspace_id: string
        }
        Insert: {
          joined_at?: string
          role: string
          user_id: string
          workspace_id: string
        }
        Update: {
          joined_at?: string
          role?: string
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
          categories_onboarding_completed_at: string | null
          created_at: string
          created_by: string
          icon: string
          icon_background_color: string
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          categories_onboarding_completed_at?: string | null
          created_at?: string
          created_by: string
          icon?: string
          icon_background_color?: string
          id?: string
          name: string
          type?: string
          updated_at?: string
        }
        Update: {
          categories_onboarding_completed_at?: string | null
          created_at?: string
          created_by?: string
          icon?: string
          icon_background_color?: string
          id?: string
          name?: string
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
      app_today: { Args: never; Returns: string }
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
      create_shared_workspace: {
        Args: {
          p_icon: string
          p_icon_background_color: string
          p_name: string
        }
        Returns: {
          categories_onboarding_completed_at: string | null
          created_at: string
          created_by: string
          icon: string
          icon_background_color: string
          id: string
          name: string
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
          p_category_id: string
          p_description: string
          p_final_installment_amount: number
          p_installment_amount: number
          p_next_billing_date: string
          p_payment_credit_card_id: string
          p_payment_method: string
          p_total_installments: number
          p_workspace_id: string
        }
        Returns: string
      }
      delete_workspace: { Args: { p_workspace_id: string }; Returns: undefined }
      delete_workspace_installment_plan_cascade: {
        Args: { p_plan_id: string }
        Returns: undefined
      }
      get_device_info_from_user_agent: {
        Args: { user_agent_text: string }
        Returns: Json
      }
      get_workspace_delete_impact: {
        Args: { p_workspace_id: string }
        Returns: Json
      }
      is_workspace_member: { Args: { workspace_id: string }; Returns: boolean }
      is_workspace_owner: { Args: { workspace_id: string }; Returns: boolean }
      next_subscription_billing_date:
        | { Args: { p_from: string; p_interval: string }; Returns: string }
        | {
            Args: { p_anchor_day: number; p_from: string; p_interval: string }
            Returns: string
          }
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

