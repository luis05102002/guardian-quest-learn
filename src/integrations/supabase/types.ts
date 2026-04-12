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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_key: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_key: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_key?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ctf_challenges: {
        Row: {
          id: string
          title: string
          description: string
          category: string
          difficulty: string
          points: number
          flag: string
          hint: string
          module_id: number | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          category: string
          difficulty: string
          points: number
          flag: string
          hint?: string
          module_id?: number | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category?: string
          difficulty?: string
          points?: number
          flag?: string
          hint?: string
          module_id?: number | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      ctf_submissions: {
        Row: {
          id: string
          user_id: string
          challenge_id: string
          submitted_flag: string
          is_correct: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          challenge_id: string
          submitted_flag: string
          is_correct?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          challenge_id?: string
          submitted_flag?: string
          is_correct?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ctf_submissions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "ctf_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_completions: {
        Row: {
          id: string
          user_id: string
          lab_key: string
          score: number
          completed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lab_key: string
          score?: number
          completed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lab_key?: string
          score?: number
          completed_at?: string
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          id: string
          slug: string
          title: string
          content: string
          version: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          content: string
          version?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          content?: string
          version?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_feedback: {
        Row: {
          comment: string
          created_at: string
          id: string
          rating: number | null
          submission_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          comment?: string
          created_at?: string
          id?: string
          rating?: number | null
          submission_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          rating?: number | null
          submission_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_feedback_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "project_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      project_submissions: {
        Row: {
          description: string | null
          github_url: string
          id: string
          module_id: number
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          description?: string | null
          github_url: string
          id?: string
          module_id: number
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          description?: string | null
          github_url?: string
          id?: string
          module_id?: number
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_results: {
        Row: {
          answers: Json | null
          completed_at: string
          id: string
          module_id: number
          score: number
          total: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string
          id?: string
          module_id: number
          score?: number
          total?: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string
          id?: string
          module_id?: number
          score?: number
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      student_doubts: {
        Row: {
          created_at: string
          id: string
          module_context: string | null
          question: string
          topic: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_context?: string | null
          question: string
          topic?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module_context?: string | null
          question?: string
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
      tutoring_bookings: {
        Row: {
          cancelled_at: string | null
          created_at: string
          id: string
          notes: string | null
          slot_id: string
          status: string
          student_id: string
          whatsapp_phone: string | null
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          slot_id: string
          status?: string
          student_id: string
          whatsapp_phone?: string | null
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          slot_id?: string
          status?: string
          student_id?: string
          whatsapp_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tutoring_bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "tutoring_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      tutoring_slots: {
        Row: {
          created_at: string
          end_time: string
          id: string
          is_available: boolean
          slot_date: string
          start_time: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          is_available?: boolean
          slot_date: string
          start_time: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          is_available?: boolean
          slot_date?: string
          start_time?: string
          teacher_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          completed_at: string
          id: string
          lesson_key: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          lesson_key: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          lesson_key?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "student" | "teacher"
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
      app_role: ["admin", "student", "teacher"],
    },
  },
} as const
