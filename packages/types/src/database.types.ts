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
    PostgrestVersion: "14.5"
  }
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
      attendance_import_rows: {
        Row: {
          company_id: string
          created_at: string
          daily_statuses: Json
          days_worked: number
          employee_id: string | null
          fingerprint_emp_id: string | null
          fingerprint_name: string
          id: string
          import_id: string
          ot_hours: number
          raw_summary: Json | null
          summary_absent: number | null
          summary_half: number | null
          summary_present: number | null
          sundays_excluded: number
          total_hours: number | null
          weekday_absents: number
        }
        Insert: {
          company_id: string
          created_at?: string
          daily_statuses?: Json
          days_worked?: number
          employee_id?: string | null
          fingerprint_emp_id?: string | null
          fingerprint_name: string
          id?: string
          import_id: string
          ot_hours?: number
          raw_summary?: Json | null
          summary_absent?: number | null
          summary_half?: number | null
          summary_present?: number | null
          sundays_excluded?: number
          total_hours?: number | null
          weekday_absents?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          daily_statuses?: Json
          days_worked?: number
          employee_id?: string | null
          fingerprint_emp_id?: string | null
          fingerprint_name?: string
          id?: string
          import_id?: string
          ot_hours?: number
          raw_summary?: Json | null
          summary_absent?: number | null
          summary_half?: number | null
          summary_present?: number | null
          sundays_excluded?: number
          total_hours?: number | null
          weekday_absents?: number
        }
        Relationships: [
          {
            foreignKeyName: "attendance_import_rows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_import_rows_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_import_rows_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "attendance_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_imports: {
        Row: {
          company_id: string
          created_at: string
          eligible_days: number
          file_name: string
          id: string
          month: number
          ot_rate_multiplier: number
          salary_month: string
          uploaded_at: string
          uploaded_by: string | null
          year: number
        }
        Insert: {
          company_id: string
          created_at?: string
          eligible_days: number
          file_name: string
          id?: string
          month: number
          ot_rate_multiplier?: number
          salary_month: string
          uploaded_at?: string
          uploaded_by?: string | null
          year: number
        }
        Update: {
          company_id?: string
          created_at?: string
          eligible_days?: number
          file_name?: string
          id?: string
          month?: number
          ot_rate_multiplier?: number
          salary_month?: string
          uploaded_at?: string
          uploaded_by?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "attendance_imports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_imports_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_sessions: {
        Row: {
          company_id: string
          created_at: string | null
          duration_minutes: number | null
          employee_id: string
          end_time: string | null
          id: string
          job_id: string | null
          start_time: string
          state: string
          workshop_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          duration_minutes?: number | null
          employee_id: string
          end_time?: string | null
          id?: string
          job_id?: string | null
          start_time?: string
          state: string
          workshop_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          duration_minutes?: number | null
          employee_id?: string
          end_time?: string | null
          id?: string
          job_id?: string | null
          start_time?: string
          state?: string
          workshop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          company_id: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          summary: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          company_id: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          summary?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          summary?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string | null
          bank_name: string
          company_id: string
          created_at: string | null
          deleted_at: string | null
          id: string
          ifsc_code: string | null
          is_deleted: boolean
          opening_balance: number
          updated_at: string | null
        }
        Insert: {
          account_name: string
          account_number?: string | null
          bank_name: string
          company_id: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          ifsc_code?: string | null
          is_deleted?: boolean
          opening_balance?: number
          updated_at?: string | null
        }
        Update: {
          account_name?: string
          account_number?: string | null
          bank_name?: string
          company_id?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          ifsc_code?: string | null
          is_deleted?: boolean
          opening_balance?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          amount: number
          bank_id: string
          company_id: string
          created_at: string | null
          created_by: string | null
          id: string
          remark: string | null
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          amount: number
          bank_id: string
          company_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          remark?: string | null
          transaction_date?: string
          transaction_type: string
        }
        Update: {
          amount?: number
          bank_id?: string
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          remark?: string | null
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transfers: {
        Row: {
          amount: number
          company_id: string
          created_at: string | null
          created_by: string | null
          from_bank_id: string
          id: string
          remark: string | null
          to_bank_id: string
          transfer_date: string
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string | null
          created_by?: string | null
          from_bank_id: string
          id?: string
          remark?: string | null
          to_bank_id: string
          transfer_date?: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          from_bank_id?: string
          id?: string
          remark?: string | null
          to_bank_id?: string
          transfer_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transfers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transfers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transfers_from_bank_id_fkey"
            columns: ["from_bank_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transfers_to_bank_id_fkey"
            columns: ["to_bank_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      client_payments: {
        Row: {
          amount: number
          bank_id: string | null
          client_id: string
          company_id: string
          created_at: string | null
          created_by: string | null
          id: string
          payment_date: string
          payment_mode: string
          remark: string | null
        }
        Insert: {
          amount: number
          bank_id?: string | null
          client_id: string
          company_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          payment_date?: string
          payment_mode: string
          remark?: string | null
        }
        Update: {
          amount?: number
          bank_id?: string | null
          client_id?: string
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          payment_date?: string
          payment_mode?: string
          remark?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_payments_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          alias: string | null
          company_id: string
          contact: string | null
          created_at: string | null
          deleted_at: string | null
          gst_number: string | null
          id: string
          is_deleted: boolean
          name: string
          opening_balance: number
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          alias?: string | null
          company_id: string
          contact?: string | null
          created_at?: string | null
          deleted_at?: string | null
          gst_number?: string | null
          id?: string
          is_deleted?: boolean
          name: string
          opening_balance?: number
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          alias?: string | null
          company_id?: string
          contact?: string | null
          created_at?: string | null
          deleted_at?: string | null
          gst_number?: string | null
          id?: string
          is_deleted?: boolean
          name?: string
          opening_balance?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          created_at: string | null
          daily_work_hours: number | null
          dashboard_experience: string
          data_lock_pin_hash: string | null
          email: string | null
          grace_period_minutes: number | null
          id: string
          logo_url: string | null
          name: string
          ot_rate_multiplier: number
          phone: string | null
          salary_mode: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          tagline: string | null
          trial_ends_at: string | null
          ui_language: string
          updated_at: string | null
          work_start_time: string | null
          working_days_per_month: number | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          daily_work_hours?: number | null
          dashboard_experience?: string
          data_lock_pin_hash?: string | null
          email?: string | null
          grace_period_minutes?: number | null
          id?: string
          logo_url?: string | null
          name: string
          ot_rate_multiplier?: number
          phone?: string | null
          salary_mode?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          tagline?: string | null
          trial_ends_at?: string | null
          ui_language?: string
          updated_at?: string | null
          work_start_time?: string | null
          working_days_per_month?: number | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          daily_work_hours?: number | null
          dashboard_experience?: string
          data_lock_pin_hash?: string | null
          email?: string | null
          grace_period_minutes?: number | null
          id?: string
          logo_url?: string | null
          name?: string
          ot_rate_multiplier?: number
          phone?: string | null
          salary_mode?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          tagline?: string | null
          trial_ends_at?: string | null
          ui_language?: string
          updated_at?: string | null
          work_start_time?: string | null
          working_days_per_month?: number | null
        }
        Relationships: []
      }
      correction_requests: {
        Row: {
          admin_notes: string | null
          company_id: string
          created_at: string | null
          date: string
          employee_id: string
          id: string
          original_end_time: string | null
          original_start_time: string | null
          original_state: string | null
          reason: string
          request_type: string
          requested_end_time: string | null
          requested_start_time: string | null
          requested_state: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          session_id: string | null
          status: string | null
        }
        Insert: {
          admin_notes?: string | null
          company_id: string
          created_at?: string | null
          date: string
          employee_id: string
          id?: string
          original_end_time?: string | null
          original_start_time?: string | null
          original_state?: string | null
          reason: string
          request_type: string
          requested_end_time?: string | null
          requested_start_time?: string | null
          requested_state?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_id?: string | null
          status?: string | null
        }
        Update: {
          admin_notes?: string | null
          company_id?: string
          created_at?: string | null
          date?: string
          employee_id?: string
          id?: string
          original_end_time?: string | null
          original_start_time?: string | null
          original_state?: string | null
          reason?: string
          request_type?: string
          requested_end_time?: string | null
          requested_start_time?: string | null
          requested_state?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "correction_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correction_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correction_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correction_requests_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_fingerprint_aliases: {
        Row: {
          company_id: string
          created_at: string
          employee_id: string
          fingerprint_name: string
          id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          employee_id: string
          fingerprint_name: string
          id?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          employee_id?: string
          fingerprint_name?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_fingerprint_aliases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_fingerprint_aliases_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          gst_percent: number
          id: string
          invoice_id: string
          quantity: number
          sort_order: number
          unit_price: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          gst_percent?: number
          id?: string
          invoice_id: string
          quantity?: number
          sort_order?: number
          unit_price: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          gst_percent?: number
          id?: string
          invoice_id?: string
          quantity?: number
          sort_order?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          bank_amount: number
          bank_id: string | null
          cash_amount: number
          client_id: string
          company_id: string
          created_at: string | null
          created_by: string | null
          credit_amount: number
          deleted_at: string | null
          gst_amount: number
          gst_percent: number
          id: string
          invoice_date: string
          invoice_number: string | null
          is_deleted: boolean
          job_id: string | null
          payment_mode: string
          remark: string | null
          taxable_amount: number
          total_amount: number
          updated_at: string | null
          vehicle_number: string | null
        }
        Insert: {
          bank_amount?: number
          bank_id?: string | null
          cash_amount?: number
          client_id: string
          company_id: string
          created_at?: string | null
          created_by?: string | null
          credit_amount?: number
          deleted_at?: string | null
          gst_amount?: number
          gst_percent: number
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          is_deleted?: boolean
          job_id?: string | null
          payment_mode: string
          remark?: string | null
          taxable_amount: number
          total_amount: number
          updated_at?: string | null
          vehicle_number?: string | null
        }
        Update: {
          bank_amount?: number
          bank_id?: string | null
          cash_amount?: number
          client_id?: string
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          credit_amount?: number
          deleted_at?: string | null
          gst_amount?: number
          gst_percent?: number
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          is_deleted?: boolean
          job_id?: string | null
          payment_mode?: string
          remark?: string | null
          taxable_amount?: number
          total_amount?: number
          updated_at?: string | null
          vehicle_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          assigned_to: string | null
          client_id: string | null
          company_id: string
          created_at: string | null
          customer_name: string | null
          customer_phone: string | null
          deleted_at: string | null
          description: string | null
          id: string
          lat: number | null
          lng: number | null
          radius: number | null
          status: string | null
          title: string
          updated_at: string | null
          vehicle_number: string | null
          workshop_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          client_id?: string | null
          company_id: string
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          radius?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
          vehicle_number?: string | null
          workshop_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          client_id?: string | null
          company_id?: string
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          radius?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
          vehicle_number?: string | null
          workshop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          amount: number
          bank_id: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          entity_id: string
          entity_type: string
          entry_date: string
          entry_type: string
          id: string
          payment_mode: string | null
          reference_id: string | null
          reference_type: string | null
          remark: string | null
        }
        Insert: {
          amount: number
          bank_id?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          entity_id: string
          entity_type: string
          entry_date?: string
          entry_type: string
          id?: string
          payment_mode?: string | null
          reference_id?: string | null
          reference_type?: string | null
          remark?: string | null
        }
        Update: {
          amount?: number
          bank_id?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          entry_date?: string
          entry_type?: string
          id?: string
          payment_mode?: string | null
          reference_id?: string | null
          reference_type?: string | null
          remark?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          company_id: string
          created_at: string | null
          deleted_at: string | null
          id: string
          is_deleted: boolean
          name: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          name: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_invoices: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          gst_amount: number
          gst_percent: number
          id: string
          invoice_date: string
          invoice_number: string | null
          invoice_type: string
          is_deleted: boolean
          remark: string | null
          supplier_id: string
          taxable_amount: number
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          gst_amount?: number
          gst_percent: number
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          invoice_type: string
          is_deleted?: boolean
          remark?: string | null
          supplier_id: string
          taxable_amount: number
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          gst_amount?: number
          gst_percent?: number
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          invoice_type?: string
          is_deleted?: boolean
          remark?: string | null
          supplier_id?: string
          taxable_amount?: number
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          company_id: string
          expo_push_token: string
          id: string
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          expo_push_token: string
          id?: string
          platform?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          expo_push_token?: string
          id?: string
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_advances: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string | null
          employee_id: string
          id: string
          notes: string | null
          reason: string | null
          requested_at: string | null
          salary_month: string | null
          status: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          reason?: string | null
          requested_at?: string | null
          salary_month?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          reason?: string | null
          requested_at?: string | null
          salary_month?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salary_advances_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_advances_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_advances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_deposits: {
        Row: {
          amount: number
          company_id: string
          created_at: string | null
          created_by: string | null
          deposit_date: string
          employee_id: string
          id: string
          remark: string | null
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string | null
          created_by?: string | null
          deposit_date?: string
          employee_id: string
          id?: string
          remark?: string | null
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          deposit_date?: string
          employee_id?: string
          id?: string
          remark?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salary_deposits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_deposits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_deposits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_register_imports: {
        Row: {
          clients_created: number
          company_id: string
          created_at: string
          entry_date: string
          file_name: string
          id: string
          invoice_count: number
          skipped_existing: number
          total_amount: number
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          clients_created?: number
          company_id: string
          created_at?: string
          entry_date: string
          file_name: string
          id?: string
          invoice_count?: number
          skipped_existing?: number
          total_amount?: number
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          clients_created?: number
          company_id?: string
          created_at?: string
          entry_date?: string
          file_name?: string
          id?: string
          invoice_count?: number
          skipped_existing?: number
          total_amount?: number
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_register_imports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_register_imports_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_payments: {
        Row: {
          amount: number
          bank_id: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          employee_id: string
          id: string
          payment_date: string
          payment_mode: string | null
          payment_type: string
          remark: string | null
          salary_month: string | null
          slip_snapshot: Json | null
        }
        Insert: {
          amount: number
          bank_id?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          employee_id: string
          id?: string
          payment_date?: string
          payment_mode?: string | null
          payment_type: string
          remark?: string | null
          salary_month?: string | null
          slip_snapshot?: Json | null
        }
        Update: {
          amount?: number
          bank_id?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          employee_id?: string
          id?: string
          payment_date?: string
          payment_mode?: string | null
          payment_type?: string
          remark?: string | null
          salary_month?: string | null
          slip_snapshot?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_payments_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_payments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sticky_notes: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          note_date: string
          title: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          note_date?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          note_date?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sticky_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sticky_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_payments: {
        Row: {
          amount: number
          bank_id: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          id: string
          payment_date: string
          payment_mode: string
          remark: string | null
          supplier_id: string
        }
        Insert: {
          amount: number
          bank_id?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          payment_date?: string
          payment_mode: string
          remark?: string | null
          supplier_id: string
        }
        Update: {
          amount?: number
          bank_id?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          payment_date?: string
          payment_mode?: string
          remark?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          alias: string | null
          company_id: string
          contact: string | null
          created_at: string | null
          deleted_at: string | null
          gst_number: string | null
          id: string
          is_deleted: boolean
          name: string
          opening_balance: number
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          alias?: string | null
          company_id: string
          contact?: string | null
          created_at?: string | null
          deleted_at?: string | null
          gst_number?: string | null
          id?: string
          is_deleted?: boolean
          name: string
          opening_balance?: number
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          alias?: string | null
          company_id?: string
          contact?: string | null
          created_at?: string | null
          deleted_at?: string | null
          gst_number?: string | null
          id?: string
          is_deleted?: boolean
          name?: string
          opening_balance?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          bank_id: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          id: string
          particular: string
          payment_mode: string
          remark: string | null
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          amount: number
          bank_id?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          particular: string
          payment_mode: string
          remark?: string | null
          transaction_date?: string
          transaction_type: string
        }
        Update: {
          amount?: number
          bank_id?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          particular?: string
          payment_mode?: string
          remark?: string | null
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          account_no: string | null
          address: string | null
          company_id: string
          created_at: string | null
          daily_shift_hours: number | null
          deleted_at: string | null
          email: string
          full_name: string
          hourly_rate: number | null
          id: string
          ifsc_code: string | null
          is_active: boolean | null
          joining_date: string | null
          monthly_salary: number | null
          phone: string | null
          post_id: string | null
          role: string
          updated_at: string | null
          workshop_id: string | null
        }
        Insert: {
          account_no?: string | null
          address?: string | null
          company_id: string
          created_at?: string | null
          daily_shift_hours?: number | null
          deleted_at?: string | null
          email: string
          full_name: string
          hourly_rate?: number | null
          id: string
          ifsc_code?: string | null
          is_active?: boolean | null
          joining_date?: string | null
          monthly_salary?: number | null
          phone?: string | null
          post_id?: string | null
          role: string
          updated_at?: string | null
          workshop_id?: string | null
        }
        Update: {
          account_no?: string | null
          address?: string | null
          company_id?: string
          created_at?: string | null
          daily_shift_hours?: number | null
          deleted_at?: string | null
          email?: string
          full_name?: string
          hourly_rate?: number | null
          id?: string
          ifsc_code?: string | null
          is_active?: boolean | null
          joining_date?: string | null
          monthly_salary?: number | null
          phone?: string | null
          post_id?: string | null
          role?: string
          updated_at?: string | null
          workshop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshops: {
        Row: {
          address: string | null
          company_id: string
          created_at: string | null
          deleted_at: string | null
          id: string
          is_active: boolean | null
          lat: number
          lng: number
          name: string
          radius: number | null
        }
        Insert: {
          address?: string | null
          company_id: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          lat: number
          lng: number
          name: string
          radius?: number | null
        }
        Update: {
          address?: string | null
          company_id?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          lat?: number
          lng?: number
          name?: string
          radius?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workshops_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_daily_attendance_payroll: {
        Args: {
          p_company_id: string
          p_end_date: string
          p_grace_minutes: number
          p_start_date: string
          p_work_start_time: string
        }
        Returns: {
          day_credit: number
          employee_id: string
          first_punch_at: string
          total_minutes: number
          work_date: string
        }[]
      }
      get_monthly_attendance_summary: {
        Args: { p_company_id: string; p_end_time: string; p_start_time: string }
        Returns: {
          employee_id: string
          state: string
          total_duration_minutes: number
        }[]
      }
      get_my_company_id: { Args: never; Returns: string }
      get_my_role: { Args: never; Returns: string }
      recalculate_hourly_rates: {
        Args: {
          p_company_id: string
          p_daily_hours: number
          p_working_days: number
        }
        Returns: undefined
      }
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
