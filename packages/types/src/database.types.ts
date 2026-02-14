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
      correction_requests: {
        Row: {
          id: string
          company_id: string
          employee_id: string
          session_id: string | null
          request_type: string
          original_start_time: string | null
          original_end_time: string | null
          original_state: string | null
          requested_start_time: string | null
          requested_end_time: string | null
          requested_state: string | null
          date: string
          reason: string
          status: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          admin_notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          employee_id: string
          session_id?: string | null
          request_type: string
          original_start_time?: string | null
          original_end_time?: string | null
          original_state?: string | null
          requested_start_time?: string | null
          requested_end_time?: string | null
          requested_state?: string | null
          date: string
          reason: string
          status?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          admin_notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          employee_id?: string
          session_id?: string | null
          request_type?: string
          original_start_time?: string | null
          original_end_time?: string | null
          original_state?: string | null
          requested_start_time?: string | null
          requested_end_time?: string | null
          requested_state?: string | null
          date?: string
          reason?: string
          status?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          admin_notes?: string | null
          created_at?: string | null
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
            foreignKeyName: "correction_requests_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string | null
          daily_work_hours: number | null
          grace_period_minutes: number | null
          id: string
          name: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          updated_at: string | null
          work_start_time: string | null
          working_days_per_month: number | null
        }
        Insert: {
          created_at?: string | null
          daily_work_hours?: number | null
          grace_period_minutes?: number | null
          id?: string
          name: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          work_start_time?: string | null
          working_days_per_month?: number | null
        }
        Update: {
          created_at?: string | null
          daily_work_hours?: number | null
          grace_period_minutes?: number | null
          id?: string
          name?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          work_start_time?: string | null
          working_days_per_month?: number | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          assigned_to: string | null
          company_id: string
          created_at: string | null
          customer_name: string | null
          customer_phone: string | null
          description: string | null
          id: string
          lat: number | null
          lng: number | null
          radius: number | null
          status: string | null
          title: string
          updated_at: string | null
          workshop_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          company_id: string
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          radius?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
          workshop_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          company_id?: string
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          radius?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
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
      users: {
        Row: {
          company_id: string
          created_at: string | null
          daily_shift_hours: number | null
          email: string
          full_name: string
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          monthly_salary: number | null
          phone: string | null
          role: string
          updated_at: string | null
          workshop_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          daily_shift_hours?: number | null
          email: string
          full_name: string
          hourly_rate?: number | null
          id: string
          is_active?: boolean | null
          monthly_salary?: number | null
          phone?: string | null
          role: string
          updated_at?: string | null
          workshop_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          daily_shift_hours?: number | null
          email?: string
          full_name?: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          monthly_salary?: number | null
          phone?: string | null
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
      get_my_company_id: { Args: never; Returns: string }
      get_my_role: { Args: never; Returns: string }
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
  public: {
    Enums: {},
  },
} as const
