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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          client_message_id: string | null
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          client_message_id?: string | null
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          client_message_id?: string | null
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      check_ins: {
        Row: {
          check_in_date: string
          created_at: string
          feeling: string | null
          id: string
          repeated: boolean
          trigger_note: string | null
          user_id: string
          what_happened: string | null
        }
        Insert: {
          check_in_date?: string
          created_at?: string
          feeling?: string | null
          id?: string
          repeated: boolean
          trigger_note?: string | null
          user_id: string
          what_happened?: string | null
        }
        Update: {
          check_in_date?: string
          created_at?: string
          feeling?: string | null
          id?: string
          repeated?: boolean
          trigger_note?: string | null
          user_id?: string
          what_happened?: string | null
        }
        Relationships: []
      }
      coach_messages: {
        Row: {
          created_at: string
          id: string
          kind: string
          message: string
          message_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          message: string
          message_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          message?: string
          message_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      consequence_logs: {
        Row: {
          amount: number
          created_at: string
          id: string
          log_date: string
          metric_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          log_date?: string
          metric_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          log_date?: string
          metric_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consequence_logs_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "consequence_metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      consequence_metrics: {
        Row: {
          amount_per_slip: number
          created_at: string
          id: string
          label: string
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_per_slip?: number
          created_at?: string
          id?: string
          label: string
          unit: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_per_slip?: number
          created_at?: string
          id?: string
          label?: string
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          browser_category: string | null
          created_at: string
          device_category: string | null
          feedback_type: string
          id: string
          message: string
          page_path: string | null
          user_id: string | null
        }
        Insert: {
          browser_category?: string | null
          created_at?: string
          device_category?: string | null
          feedback_type: string
          id?: string
          message: string
          page_path?: string | null
          user_id?: string | null
        }
        Update: {
          browser_category?: string | null
          created_at?: string
          device_category?: string | null
          feedback_type?: string
          id?: string
          message?: string
          page_path?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      if_then_plans: {
        Row: {
          alternative: string
          created_at: string
          id: string
          trigger_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alternative: string
          created_at?: string
          id?: string
          trigger_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alternative?: string
          created_at?: string
          id?: string
          trigger_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      interventions: {
        Row: {
          alternative_suggested: string | null
          coaching_style: string | null
          commitment: string | null
          created_at: string
          decision: string | null
          emotion: string | null
          helped: boolean | null
          id: string
          message: string | null
          trigger_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alternative_suggested?: string | null
          coaching_style?: string | null
          commitment?: string | null
          created_at?: string
          decision?: string | null
          emotion?: string | null
          helped?: boolean | null
          id?: string
          message?: string | null
          trigger_key?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alternative_suggested?: string | null
          coaching_style?: string | null
          commitment?: string | null
          created_at?: string
          decision?: string | null
          emotion?: string | null
          helped?: boolean | null
          id?: string
          message?: string | null
          trigger_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          entry_date: string
          id: string
          mood: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entry_date?: string
          id?: string
          mood?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          mood?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          content_mode: string | null
          created_at: string
          dedupe_key: string | null
          error_detail: string | null
          feedback: string | null
          feedback_at: string | null
          id: string
          notification_type: string
          schedule_id: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: string
          timezone: string | null
          user_id: string
        }
        Insert: {
          content_mode?: string | null
          created_at?: string
          dedupe_key?: string | null
          error_detail?: string | null
          feedback?: string | null
          feedback_at?: string | null
          id?: string
          notification_type: string
          schedule_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          timezone?: string | null
          user_id: string
        }
        Update: {
          content_mode?: string | null
          created_at?: string
          dedupe_key?: string | null
          error_detail?: string | null
          feedback?: string | null
          feedback_at?: string | null
          id?: string
          notification_type?: string
          schedule_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          timezone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "reminder_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          content_mode: string
          created_at: string
          enabled: boolean
          quiet_end: string | null
          quiet_start: string | null
          timezone: string
          type_check_in: boolean
          type_commitment: boolean
          type_intervention: boolean
          type_weekly: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          content_mode?: string
          created_at?: string
          enabled?: boolean
          quiet_end?: string | null
          quiet_start?: string | null
          timezone?: string
          type_check_in?: boolean
          type_commitment?: boolean
          type_intervention?: boolean
          type_weekly?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          content_mode?: string
          created_at?: string
          enabled?: boolean
          quiet_end?: string | null
          quiet_start?: string | null
          timezone?: string
          type_check_in?: boolean
          type_commitment?: boolean
          type_intervention?: boolean
          type_weekly?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_personalization: boolean
          coaching_styles: string[]
          created_at: string
          display_name: string | null
          friction_level: string
          future_self: string | null
          future_self_message: string | null
          habit: string | null
          id: string
          journey_started_at: string
          motivation: string | null
          onboarding_completed: boolean
          reminder_preference: string | null
          triggers: string | null
          updated_at: string
        }
        Insert: {
          ai_personalization?: boolean
          coaching_styles?: string[]
          created_at?: string
          display_name?: string | null
          friction_level?: string
          future_self?: string | null
          future_self_message?: string | null
          habit?: string | null
          id: string
          journey_started_at?: string
          motivation?: string | null
          onboarding_completed?: boolean
          reminder_preference?: string | null
          triggers?: string | null
          updated_at?: string
        }
        Update: {
          ai_personalization?: boolean
          coaching_styles?: string[]
          created_at?: string
          display_name?: string | null
          friction_level?: string
          future_self?: string | null
          future_self_message?: string | null
          habit?: string | null
          id?: string
          journey_started_at?: string
          motivation?: string | null
          onboarding_completed?: boolean
          reminder_preference?: string | null
          triggers?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          device_label: string | null
          endpoint: string
          failure_count: number
          id: string
          last_success_at: string | null
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          device_label?: string | null
          endpoint: string
          failure_count?: number
          id?: string
          last_success_at?: string | null
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          device_label?: string | null
          endpoint?: string
          failure_count?: number
          id?: string
          last_success_at?: string | null
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reminder_schedules: {
        Row: {
          created_at: string
          days_of_week: number[]
          enabled: boolean
          frequency: string
          id: string
          label: string | null
          last_sent_on: string | null
          notification_type: string
          time_of_day: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_of_week?: number[]
          enabled?: boolean
          frequency?: string
          id?: string
          label?: string | null
          last_sent_on?: string | null
          notification_type?: string
          time_of_day?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_of_week?: number[]
          enabled?: boolean
          frequency?: string
          id?: string
          label?: string | null
          last_sent_on?: string | null
          notification_type?: string
          time_of_day?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_insights: {
        Row: {
          best_day: string | null
          common_emotion: string | null
          common_trigger: string | null
          created_at: string
          id: string
          summary: string
          trend: string | null
          updated_at: string
          user_id: string
          week_start: string
          worst_day: string | null
        }
        Insert: {
          best_day?: string | null
          common_emotion?: string | null
          common_trigger?: string | null
          created_at?: string
          id?: string
          summary: string
          trend?: string | null
          updated_at?: string
          user_id: string
          week_start: string
          worst_day?: string | null
        }
        Update: {
          best_day?: string | null
          common_emotion?: string | null
          common_trigger?: string | null
          created_at?: string
          id?: string
          summary?: string
          trend?: string | null
          updated_at?: string
          user_id?: string
          week_start?: string
          worst_day?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
