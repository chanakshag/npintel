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
  public: {
    Tables: {
      changes: {
        Row: {
          change_type: string
          component_ref: string | null
          created_at: string
          description: string | null
          id: string
          impact: Json
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          change_type?: string
          component_ref?: string | null
          created_at?: string
          description?: string | null
          id?: string
          impact?: Json
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          change_type?: string
          component_ref?: string | null
          created_at?: string
          description?: string | null
          id?: string
          impact?: Json
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string | null
          created_at: string
          file_path: string
          id: string
          key_points: Json | null
          mime_type: string | null
          name: string
          size_bytes: number | null
          status: string
          summary: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          file_path: string
          id?: string
          key_points?: Json | null
          mime_type?: string | null
          name: string
          size_bytes?: number | null
          status?: string
          summary?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          file_path?: string
          id?: string
          key_points?: Json | null
          mime_type?: string | null
          name?: string
          size_bytes?: number | null
          status?: string
          summary?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gate_reviews: {
        Row: {
          checklist: Json
          created_at: string
          gate_type: string
          id: string
          name: string
          status: string
          user_id: string
        }
        Insert: {
          checklist?: Json
          created_at?: string
          gate_type: string
          id?: string
          name: string
          status?: string
          user_id: string
        }
        Update: {
          checklist?: Json
          created_at?: string
          gate_type?: string
          id?: string
          name?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_artifacts: {
        Row: {
          artifact_type: string
          content: string
          created_at: string
          id: string
          prompt: string | null
          source_ids: string[]
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          artifact_type?: string
          content?: string
          created_at?: string
          id?: string
          prompt?: string | null
          source_ids?: string[]
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          artifact_type?: string
          content?: string
          created_at?: string
          id?: string
          prompt?: string | null
          source_ids?: string[]
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_sources: {
        Row: {
          abstract: string | null
          authors: string[] | null
          citation: string | null
          created_at: string
          doi: string | null
          file_path: string | null
          id: string
          key_findings: Json
          kind: string
          mime_type: string | null
          size_bytes: number | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          venue: string | null
          year: number | null
        }
        Insert: {
          abstract?: string | null
          authors?: string[] | null
          citation?: string | null
          created_at?: string
          doi?: string | null
          file_path?: string | null
          id?: string
          key_findings?: Json
          kind?: string
          mime_type?: string | null
          size_bytes?: number | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          venue?: string | null
          year?: number | null
        }
        Update: {
          abstract?: string | null
          authors?: string[] | null
          citation?: string | null
          created_at?: string
          doi?: string | null
          file_path?: string | null
          id?: string
          key_findings?: Json
          kind?: string
          mime_type?: string | null
          size_bytes?: number | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          venue?: string | null
          year?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_phase_documents: {
        Row: {
          artifact_id: string | null
          created_at: string
          document_id: string | null
          id: string
          output_key: string
          phase_id: string
          user_id: string
        }
        Insert: {
          artifact_id?: string | null
          created_at?: string
          document_id?: string | null
          id?: string
          output_key: string
          phase_id: string
          user_id: string
        }
        Update: {
          artifact_id?: string | null
          created_at?: string
          document_id?: string | null
          id?: string
          output_key?: string
          phase_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_phase_documents_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      project_phases: {
        Row: {
          badge_color: string
          created_at: string
          custom: boolean
          gate_checked: Json
          gate_criteria: Json
          id: string
          locked: boolean
          outputs: Json
          phase_index: number
          project_id: string
          status: string
          subtitle: string | null
          tasks: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          badge_color?: string
          created_at?: string
          custom?: boolean
          gate_checked?: Json
          gate_criteria?: Json
          id?: string
          locked?: boolean
          outputs?: Json
          phase_index: number
          project_id: string
          status?: string
          subtitle?: string | null
          tasks?: Json
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          badge_color?: string
          created_at?: string
          custom?: boolean
          gate_checked?: Json
          gate_criteria?: Json
          id?: string
          locked?: boolean
          outputs?: Json
          phase_index?: number
          project_id?: string
          status?: string
          subtitle?: string | null
          tasks?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          active_phase_index: number
          created_at: string
          gate_standard: string
          id: string
          industry: string
          name: string
          product_description: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_phase_index?: number
          created_at?: string
          gate_standard: string
          id?: string
          industry: string
          name: string
          product_description: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_phase_index?: number
          created_at?: string
          gate_standard?: string
          id?: string
          industry?: string
          name?: string
          product_description?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      requirements: {
        Row: {
          created_at: string
          description: string | null
          gate_stage: string | null
          id: string
          owner: string | null
          ref_id: string
          status: string
          subsystem: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          gate_stage?: string | null
          id?: string
          owner?: string | null
          ref_id: string
          status?: string
          subsystem?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          gate_stage?: string | null
          id?: string
          owner?: string | null
          ref_id?: string
          status?: string
          subsystem?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      trace_links: {
        Row: {
          created_at: string
          from_req: string
          id: string
          link_type: string
          to_req: string
          user_id: string
        }
        Insert: {
          created_at?: string
          from_req: string
          id?: string
          link_type?: string
          to_req: string
          user_id: string
        }
        Update: {
          created_at?: string
          from_req?: string
          id?: string
          link_type?: string
          to_req?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trace_links_from_req_fkey"
            columns: ["from_req"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trace_links_to_req_fkey"
            columns: ["to_req"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
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
