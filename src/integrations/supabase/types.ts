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
      bom_changes: {
        Row: {
          bom_id: string
          bom_item_id: string | null
          change_type: string
          created_at: string
          field_changed: string | null
          id: string
          impact_summary: string | null
          new_value: string | null
          old_value: string | null
          project_id: string
          user_id: string
        }
        Insert: {
          bom_id: string
          bom_item_id?: string | null
          change_type: string
          created_at?: string
          field_changed?: string | null
          id?: string
          impact_summary?: string | null
          new_value?: string | null
          old_value?: string | null
          project_id: string
          user_id: string
        }
        Update: {
          bom_id?: string
          bom_item_id?: string | null
          change_type?: string
          created_at?: string
          field_changed?: string | null
          id?: string
          impact_summary?: string | null
          new_value?: string | null
          old_value?: string | null
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bom_changes_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "boms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_changes_bom_item_id_fkey"
            columns: ["bom_item_id"]
            isOneToOne: false
            referencedRelation: "bom_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_changes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      bom_items: {
        Row: {
          bom_id: string
          created_at: string
          description: string | null
          id: string
          lead_time_days: number | null
          manufacturer: string | null
          notes: string | null
          part_number: string
          quantity: number
          spec_requirement: string | null
          status: string
          supplier: string | null
          unit: string
          unit_cost: number | null
          user_id: string
        }
        Insert: {
          bom_id: string
          created_at?: string
          description?: string | null
          id?: string
          lead_time_days?: number | null
          manufacturer?: string | null
          notes?: string | null
          part_number: string
          quantity?: number
          spec_requirement?: string | null
          status?: string
          supplier?: string | null
          unit?: string
          unit_cost?: number | null
          user_id: string
        }
        Update: {
          bom_id?: string
          created_at?: string
          description?: string | null
          id?: string
          lead_time_days?: number | null
          manufacturer?: string | null
          notes?: string | null
          part_number?: string
          quantity?: number
          spec_requirement?: string | null
          status?: string
          supplier?: string | null
          unit?: string
          unit_cost?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bom_items_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "boms"
            referencedColumns: ["id"]
          },
        ]
      }
      boms: {
        Row: {
          created_at: string
          id: string
          name: string
          project_id: string | null
          status: string
          updated_at: string
          user_id: string
          version: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          project_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
          version?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          project_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          version?: string
        }
        Relationships: []
      }
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
          project_id: string
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
          project_id: string
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
          project_id?: string
          size_bytes?: number | null
          status?: string
          summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      gate_reviews: {
        Row: {
          checklist: Json
          created_at: string
          gate_type: string
          id: string
          name: string
          project_id: string
          status: string
          user_id: string
        }
        Insert: {
          checklist?: Json
          created_at?: string
          gate_type: string
          id?: string
          name: string
          project_id: string
          status?: string
          user_id: string
        }
        Update: {
          checklist?: Json
          created_at?: string
          gate_type?: string
          id?: string
          name?: string
          project_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gate_reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      lead_time_entries: {
        Row: {
          actual_lead_days: number | null
          bom_item_id: string | null
          created_at: string
          id: string
          needed_by: string | null
          npi_gate: string | null
          part_number: string | null
          project_id: string
          quoted_lead_days: number | null
          status: string
          supplier_id: string
          user_id: string
        }
        Insert: {
          actual_lead_days?: number | null
          bom_item_id?: string | null
          created_at?: string
          id?: string
          needed_by?: string | null
          npi_gate?: string | null
          part_number?: string | null
          project_id: string
          quoted_lead_days?: number | null
          status?: string
          supplier_id: string
          user_id: string
        }
        Update: {
          actual_lead_days?: number | null
          bom_item_id?: string | null
          created_at?: string
          id?: string
          needed_by?: string | null
          npi_gate?: string | null
          part_number?: string | null
          project_id?: string
          quoted_lead_days?: number | null
          status?: string
          supplier_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_time_entries_bom_item_id_fkey"
            columns: ["bom_item_id"]
            isOneToOne: false
            referencedRelation: "bom_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_time_entries_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      pr_items: {
        Row: {
          bom_item_id: string | null
          created_at: string
          description: string | null
          id: string
          needed_by: string | null
          part_number: string
          pr_id: string
          quantity: number
          status: string
          supplier_id: string | null
          total_cost: number | null
          unit_cost: number | null
          user_id: string
        }
        Insert: {
          bom_item_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          needed_by?: string | null
          part_number: string
          pr_id: string
          quantity: number
          status?: string
          supplier_id?: string | null
          total_cost?: number | null
          unit_cost?: number | null
          user_id: string
        }
        Update: {
          bom_item_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          needed_by?: string | null
          part_number?: string
          pr_id?: string
          quantity?: number
          status?: string
          supplier_id?: string | null
          total_cost?: number | null
          unit_cost?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pr_items_bom_item_id_fkey"
            columns: ["bom_item_id"]
            isOneToOne: false
            referencedRelation: "bom_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pr_items_pr_id_fkey"
            columns: ["pr_id"]
            isOneToOne: false
            referencedRelation: "purchase_requisitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pr_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
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
      purchase_orders: {
        Row: {
          confirmation_received_at: string | null
          created_at: string
          delivery_date: string | null
          id: string
          notes: string | null
          npi_gate: string | null
          po_number: string | null
          pr_id: string | null
          project_id: string
          rfq_id: string | null
          status: string
          supplier_id: string
          total_amount: number | null
          user_id: string
        }
        Insert: {
          confirmation_received_at?: string | null
          created_at?: string
          delivery_date?: string | null
          id?: string
          notes?: string | null
          npi_gate?: string | null
          po_number?: string | null
          pr_id?: string | null
          project_id: string
          rfq_id?: string | null
          status?: string
          supplier_id: string
          total_amount?: number | null
          user_id: string
        }
        Update: {
          confirmation_received_at?: string | null
          created_at?: string
          delivery_date?: string | null
          id?: string
          notes?: string | null
          npi_gate?: string | null
          po_number?: string | null
          pr_id?: string | null
          project_id?: string
          rfq_id?: string | null
          status?: string
          supplier_id?: string
          total_amount?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_pr_id_fkey"
            columns: ["pr_id"]
            isOneToOne: false
            referencedRelation: "purchase_requisitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_requisitions: {
        Row: {
          bom_id: string | null
          created_at: string
          id: string
          needed_by: string | null
          npi_gate: string | null
          pr_number: string | null
          project_id: string | null
          status: string
          title: string
          total_estimated_cost: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bom_id?: string | null
          created_at?: string
          id?: string
          needed_by?: string | null
          npi_gate?: string | null
          pr_number?: string | null
          project_id?: string | null
          status?: string
          title: string
          total_estimated_cost?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bom_id?: string | null
          created_at?: string
          id?: string
          needed_by?: string | null
          npi_gate?: string | null
          pr_number?: string | null
          project_id?: string | null
          status?: string
          title?: string
          total_estimated_cost?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requisitions_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "boms"
            referencedColumns: ["id"]
          },
        ]
      }
      requirements: {
        Row: {
          created_at: string
          description: string | null
          gate_stage: string | null
          id: string
          owner: string | null
          project_id: string
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
          project_id: string
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
          project_id?: string
          ref_id?: string
          status?: string
          subsystem?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "requirements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      rfqs: {
        Row: {
          body: string | null
          created_at: string
          id: string
          pr_id: string | null
          project_id: string
          quoted_lead_days: number | null
          quoted_price: number | null
          response_received_at: string | null
          rfq_number: string | null
          sent_at: string | null
          status: string
          subject: string | null
          supplier_id: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          pr_id?: string | null
          project_id: string
          quoted_lead_days?: number | null
          quoted_price?: number | null
          response_received_at?: string | null
          rfq_number?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          supplier_id: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          pr_id?: string | null
          project_id?: string
          quoted_lead_days?: number | null
          quoted_price?: number | null
          response_received_at?: string | null
          rfq_number?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          supplier_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfqs_pr_id_fkey"
            columns: ["pr_id"]
            isOneToOne: false
            referencedRelation: "purchase_requisitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfqs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfqs_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_qualifications: {
        Row: {
          created_at: string
          document_name: string
          document_type: string | null
          extracted_specs: Json
          file_url: string | null
          id: string
          notes: string | null
          project_id: string
          qualification_status: string
          supplier_id: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          document_name: string
          document_type?: string | null
          extracted_specs?: Json
          file_url?: string | null
          id?: string
          notes?: string | null
          project_id: string
          qualification_status?: string
          supplier_id: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          document_name?: string
          document_type?: string | null
          extracted_specs?: Json
          file_url?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          qualification_status?: string
          supplier_id?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_qualifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_qualifications_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          category: string | null
          contact_email: string | null
          country: string | null
          created_at: string
          id: string
          name: string
          primary_contact: string | null
          project_id: string
          risk_score: number
          status: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          category?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name: string
          primary_contact?: string | null
          project_id: string
          risk_score?: number
          status?: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          category?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name?: string
          primary_contact?: string | null
          project_id?: string
          risk_score?: number
          status?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_risks: {
        Row: {
          description: string | null
          flagged_at: string
          id: string
          project_id: string
          resolved_at: string | null
          risk_type: string
          severity: string
          source: string | null
          status: string
          supplier_id: string
          user_id: string
        }
        Insert: {
          description?: string | null
          flagged_at?: string
          id?: string
          project_id: string
          resolved_at?: string | null
          risk_type: string
          severity?: string
          source?: string | null
          status?: string
          supplier_id: string
          user_id: string
        }
        Update: {
          description?: string | null
          flagged_at?: string
          id?: string
          project_id?: string
          resolved_at?: string | null
          risk_type?: string
          severity?: string
          source?: string | null
          status?: string
          supplier_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supply_risks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_risks_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      trace_links: {
        Row: {
          created_at: string
          from_req: string
          id: string
          link_type: string
          project_id: string
          to_req: string
          user_id: string
        }
        Insert: {
          created_at?: string
          from_req: string
          id?: string
          link_type?: string
          project_id: string
          to_req: string
          user_id: string
        }
        Update: {
          created_at?: string
          from_req?: string
          id?: string
          link_type?: string
          project_id?: string
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
            foreignKeyName: "trace_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
