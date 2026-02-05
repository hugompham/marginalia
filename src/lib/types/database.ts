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
      api_keys: {
        Row: {
          created_at: string | null
          encrypted_key: string
          id: string
          is_active: boolean | null
          key_hint: string | null
          model: string
          provider: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          encrypted_key: string
          id?: string
          is_active?: boolean | null
          key_hint?: string | null
          model: string
          provider: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          encrypted_key?: string
          id?: string
          is_active?: boolean | null
          key_hint?: string | null
          model?: string
          provider?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          ai_confidence: number | null
          answer: string
          cloze_text: string | null
          created_at: string | null
          difficulty: number | null
          due: string | null
          elapsed_days: number | null
          highlight_id: string
          id: string
          is_ai_generated: boolean | null
          is_suspended: boolean | null
          lapses: number | null
          last_review: string | null
          question: string
          question_type: string
          reps: number | null
          scheduled_days: number | null
          stability: number | null
          state: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          answer: string
          cloze_text?: string | null
          created_at?: string | null
          difficulty?: number | null
          due?: string | null
          elapsed_days?: number | null
          highlight_id: string
          id?: string
          is_ai_generated?: boolean | null
          is_suspended?: boolean | null
          lapses?: number | null
          last_review?: string | null
          question: string
          question_type: string
          reps?: number | null
          scheduled_days?: number | null
          stability?: number | null
          state?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          answer?: string
          cloze_text?: string | null
          created_at?: string | null
          difficulty?: number | null
          due?: string | null
          elapsed_days?: number | null
          highlight_id?: string
          id?: string
          is_ai_generated?: boolean | null
          is_suspended?: boolean | null
          lapses?: number | null
          last_review?: string | null
          question?: string
          question_type?: string
          reps?: number | null
          scheduled_days?: number | null
          stability?: number | null
          state?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_highlight_id_fkey"
            columns: ["highlight_id"]
            isOneToOne: false
            referencedRelation: "highlights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          author: string | null
          card_count: number | null
          cover_image_url: string | null
          created_at: string | null
          highlight_count: number | null
          id: string
          source_type: string
          source_url: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          author?: string | null
          card_count?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          highlight_count?: number | null
          id?: string
          source_type: string
          source_url?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          author?: string | null
          card_count?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          highlight_count?: number | null
          id?: string
          source_type?: string
          source_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      highlight_tags: {
        Row: {
          highlight_id: string
          tag_id: string
        }
        Insert: {
          highlight_id: string
          tag_id: string
        }
        Update: {
          highlight_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlight_tags_highlight_id_fkey"
            columns: ["highlight_id"]
            isOneToOne: false
            referencedRelation: "highlights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "highlight_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      highlights: {
        Row: {
          chapter: string | null
          collection_id: string
          context_after: string | null
          context_before: string | null
          created_at: string | null
          has_cards: boolean | null
          id: string
          is_archived: boolean | null
          location_percent: number | null
          note: string | null
          page_number: number | null
          text: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chapter?: string | null
          collection_id: string
          context_after?: string | null
          context_before?: string | null
          created_at?: string | null
          has_cards?: boolean | null
          id?: string
          is_archived?: boolean | null
          location_percent?: number | null
          note?: string | null
          page_number?: number | null
          text: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chapter?: string | null
          collection_id?: string
          context_after?: string | null
          context_before?: string | null
          created_at?: string | null
          has_cards?: boolean | null
          id?: string
          is_archived?: boolean | null
          location_percent?: number | null
          note?: string | null
          page_number?: number | null
          text?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlights_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "highlights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_questions: {
        Row: {
          ai_confidence: number | null
          answer: string
          cloze_text: string | null
          created_at: string | null
          highlight_id: string
          id: string
          question: string
          question_type: string
          status: string | null
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          answer: string
          cloze_text?: string | null
          created_at?: string | null
          highlight_id: string
          id?: string
          question: string
          question_type: string
          status?: string | null
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          answer?: string
          cloze_text?: string | null
          created_at?: string | null
          highlight_id?: string
          id?: string
          question?: string
          question_type?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_questions_highlight_id_fkey"
            columns: ["highlight_id"]
            isOneToOne: false
            referencedRelation: "highlights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          daily_review_goal: number | null
          display_name: string | null
          id: string
          preferred_question_types: string[] | null
          theme: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          daily_review_goal?: number | null
          display_name?: string | null
          id: string
          preferred_question_types?: string[] | null
          theme?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          daily_review_goal?: number | null
          display_name?: string | null
          id?: string
          preferred_question_types?: string[] | null
          theme?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          card_id: string
          difficulty_before: number | null
          duration_ms: number | null
          id: string
          rating: string
          reviewed_at: string | null
          stability_before: number | null
          state_before: string | null
          user_id: string
        }
        Insert: {
          card_id: string
          difficulty_before?: number | null
          duration_ms?: number | null
          id?: string
          rating: string
          reviewed_at?: string | null
          stability_before?: number | null
          state_before?: string | null
          user_id: string
        }
        Update: {
          card_id?: string
          difficulty_before?: number | null
          duration_ms?: number | null
          id?: string
          rating?: string
          reviewed_at?: string | null
          stability_before?: number | null
          state_before?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_due_cards_count: { Args: { p_user_id: string }; Returns: number }
      get_today_review_count: { Args: { p_user_id: string }; Returns: number }
      get_user_streak: { Args: { p_user_id: string }; Returns: number }
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

