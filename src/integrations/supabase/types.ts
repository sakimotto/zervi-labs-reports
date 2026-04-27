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
      calendar_events: {
        Row: {
          all_day: boolean
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          equipment_id: string | null
          id: string
          kind: string
          location: string | null
          owner_team_id: string | null
          owner_user_id: string | null
          sample_id: string | null
          source: string | null
          starts_at: string
          task_id: string | null
          test_request_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          equipment_id?: string | null
          id?: string
          kind?: string
          location?: string | null
          owner_team_id?: string | null
          owner_user_id?: string | null
          sample_id?: string | null
          source?: string | null
          starts_at: string
          task_id?: string | null
          test_request_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          equipment_id?: string | null
          id?: string
          kind?: string
          location?: string | null
          owner_team_id?: string | null
          owner_user_id?: string | null
          sample_id?: string | null
          source?: string | null
          starts_at?: string
          task_id?: string | null
          test_request_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_owner_team_id_fkey"
            columns: ["owner_team_id"]
            isOneToOne: false
            referencedRelation: "lab_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_sample_id_fkey"
            columns: ["sample_id"]
            isOneToOne: false
            referencedRelation: "samples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_test_request_id_fkey"
            columns: ["test_request_id"]
            isOneToOne: false
            referencedRelation: "customer_test_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      calibration_records: {
        Row: {
          accreditation_body: string | null
          calibration_date: string
          certificate_number: string | null
          created_at: string
          document_url: string | null
          equipment_id: string
          id: string
          in_tolerance: boolean | null
          next_due_date: string | null
          notes: string | null
          performed_by: string | null
          status: string
          traceability: string | null
          uncertainty: string | null
        }
        Insert: {
          accreditation_body?: string | null
          calibration_date: string
          certificate_number?: string | null
          created_at?: string
          document_url?: string | null
          equipment_id: string
          id?: string
          in_tolerance?: boolean | null
          next_due_date?: string | null
          notes?: string | null
          performed_by?: string | null
          status?: string
          traceability?: string | null
          uncertainty?: string | null
        }
        Update: {
          accreditation_body?: string | null
          calibration_date?: string
          certificate_number?: string | null
          created_at?: string
          document_url?: string | null
          equipment_id?: string
          id?: string
          in_tolerance?: boolean | null
          next_due_date?: string | null
          notes?: string | null
          performed_by?: string | null
          status?: string
          traceability?: string | null
          uncertainty?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calibration_records_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      conditioning_profiles: {
        Row: {
          created_at: string
          description: string | null
          duration_hours: number | null
          humidity_percent: number | null
          id: string
          is_active: boolean
          name: string
          temperature_c: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          humidity_percent?: number | null
          id?: string
          is_active?: boolean
          name: string
          temperature_c?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          humidity_percent?: number | null
          id?: string
          is_active?: boolean
          name?: string
          temperature_c?: number | null
        }
        Relationships: []
      }
      copilot_action_log: {
        Row: {
          arguments: Json
          conversation_id: string | null
          created_at: string
          duration_ms: number | null
          error: string | null
          id: string
          result_summary: string | null
          status: string
          tool_name: string
          user_id: string
        }
        Insert: {
          arguments?: Json
          conversation_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          result_summary?: string | null
          status?: string
          tool_name: string
          user_id: string
        }
        Update: {
          arguments?: Json
          conversation_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          result_summary?: string | null
          status?: string
          tool_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "copilot_action_log_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "copilot_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      copilot_conversations: {
        Row: {
          archived: boolean
          context_id: string | null
          context_label: string | null
          context_type: string | null
          created_at: string
          id: string
          last_message_at: string
          message_count: number
          mode: string
          pinned: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          context_id?: string | null
          context_label?: string | null
          context_type?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          message_count?: number
          mode?: string
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          context_id?: string | null
          context_label?: string | null
          context_type?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          message_count?: number
          mode?: string
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      copilot_messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          finish_reason: string | null
          id: string
          model: string | null
          role: string
          tokens_in: number | null
          tokens_out: number | null
          tool_call_id: string | null
          tool_calls: Json | null
          tool_name: string | null
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          finish_reason?: string | null
          id?: string
          model?: string | null
          role: string
          tokens_in?: number | null
          tokens_out?: number | null
          tool_call_id?: string | null
          tool_calls?: Json | null
          tool_name?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          finish_reason?: string | null
          id?: string
          model?: string | null
          role?: string
          tokens_in?: number | null
          tokens_out?: number | null
          tool_call_id?: string | null
          tool_calls?: Json | null
          tool_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "copilot_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "copilot_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      copilot_starter_overrides: {
        Row: {
          created_at: string
          id: string
          mode: string
          starters: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mode: string
          starters?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mode?: string
          starters?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_test_requests: {
        Row: {
          actual_cost: number | null
          assigned_to: string | null
          completed_at: string | null
          contact_email: string | null
          contact_person: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          customer_id: string
          description: string | null
          due_date: string | null
          estimated_cost: number | null
          id: string
          materials_description: string | null
          notes: string | null
          po_number: string | null
          priority: string
          reported_at: string | null
          request_number: string
          requested_date: string
          scope: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          customer_id: string
          description?: string | null
          due_date?: string | null
          estimated_cost?: number | null
          id?: string
          materials_description?: string | null
          notes?: string | null
          po_number?: string | null
          priority?: string
          reported_at?: string | null
          request_number: string
          requested_date?: string
          scope?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          customer_id?: string
          description?: string | null
          due_date?: string | null
          estimated_cost?: number | null
          id?: string
          materials_description?: string | null
          notes?: string | null
          po_number?: string | null
          priority?: string
          reported_at?: string | null
          request_number?: string
          requested_date?: string
          scope?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_test_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          account_manager: string | null
          address: string | null
          address_line: string | null
          city: string | null
          contact_person: string | null
          country: string | null
          created_at: string
          credit_limit: number | null
          currency: string | null
          customer_code: string | null
          customer_type: string
          email: string | null
          id: string
          industry: string | null
          is_active: boolean
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          postal_code: string | null
          rating: number | null
          secondary_email: string | null
          state_region: string | null
          status: string
          tax_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          account_manager?: string | null
          address?: string | null
          address_line?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          credit_limit?: number | null
          currency?: string | null
          customer_code?: string | null
          customer_type?: string
          email?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          rating?: number | null
          secondary_email?: string | null
          state_region?: string | null
          status?: string
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          account_manager?: string | null
          address?: string | null
          address_line?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          credit_limit?: number | null
          currency?: string | null
          customer_code?: string | null
          customer_type?: string
          email?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          rating?: number | null
          secondary_email?: string | null
          state_region?: string | null
          status?: string
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      equipment: {
        Row: {
          accessories: string | null
          accreditation_body: string | null
          accuracy: string | null
          asset_tag: string | null
          assigned_operator: string | null
          bench: string | null
          calibration_interval_days: number | null
          calibration_traceability: string | null
          category: string
          condition_rating: number | null
          created_at: string
          currency: string | null
          firmware_version: string | null
          id: string
          is_active: boolean
          last_calibration_date: string | null
          location: string | null
          manufacturer: string | null
          measurement_max: number | null
          measurement_min: number | null
          measurement_unit: string | null
          model: string | null
          name: string
          next_calibration_due: string | null
          notes: string | null
          operating_humidity_max: number | null
          operating_humidity_min: number | null
          operating_temp_max: number | null
          operating_temp_min: number | null
          photo_url: string | null
          power_requirements: string | null
          purchase_cost: number | null
          purchase_date: string | null
          resolution: string | null
          room: string | null
          serial_number: string | null
          software_version: string | null
          status: string
          sub_type: string | null
          updated_at: string
          vendor: string | null
          warranty_until: string | null
        }
        Insert: {
          accessories?: string | null
          accreditation_body?: string | null
          accuracy?: string | null
          asset_tag?: string | null
          assigned_operator?: string | null
          bench?: string | null
          calibration_interval_days?: number | null
          calibration_traceability?: string | null
          category?: string
          condition_rating?: number | null
          created_at?: string
          currency?: string | null
          firmware_version?: string | null
          id?: string
          is_active?: boolean
          last_calibration_date?: string | null
          location?: string | null
          manufacturer?: string | null
          measurement_max?: number | null
          measurement_min?: number | null
          measurement_unit?: string | null
          model?: string | null
          name: string
          next_calibration_due?: string | null
          notes?: string | null
          operating_humidity_max?: number | null
          operating_humidity_min?: number | null
          operating_temp_max?: number | null
          operating_temp_min?: number | null
          photo_url?: string | null
          power_requirements?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          resolution?: string | null
          room?: string | null
          serial_number?: string | null
          software_version?: string | null
          status?: string
          sub_type?: string | null
          updated_at?: string
          vendor?: string | null
          warranty_until?: string | null
        }
        Update: {
          accessories?: string | null
          accreditation_body?: string | null
          accuracy?: string | null
          asset_tag?: string | null
          assigned_operator?: string | null
          bench?: string | null
          calibration_interval_days?: number | null
          calibration_traceability?: string | null
          category?: string
          condition_rating?: number | null
          created_at?: string
          currency?: string | null
          firmware_version?: string | null
          id?: string
          is_active?: boolean
          last_calibration_date?: string | null
          location?: string | null
          manufacturer?: string | null
          measurement_max?: number | null
          measurement_min?: number | null
          measurement_unit?: string | null
          model?: string | null
          name?: string
          next_calibration_due?: string | null
          notes?: string | null
          operating_humidity_max?: number | null
          operating_humidity_min?: number | null
          operating_temp_max?: number | null
          operating_temp_min?: number | null
          photo_url?: string | null
          power_requirements?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          resolution?: string | null
          room?: string | null
          serial_number?: string | null
          software_version?: string | null
          status?: string
          sub_type?: string | null
          updated_at?: string
          vendor?: string | null
          warranty_until?: string | null
        }
        Relationships: []
      }
      equipment_audit: {
        Row: {
          action: string
          changed_by: string | null
          changed_by_name: string | null
          created_at: string
          details: Json | null
          equipment_id: string
          id: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          changed_by_name?: string | null
          created_at?: string
          details?: Json | null
          equipment_id: string
          id?: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          changed_by_name?: string | null
          created_at?: string
          details?: Json | null
          equipment_id?: string
          id?: string
        }
        Relationships: []
      }
      equipment_test_items: {
        Row: {
          equipment_id: string
          id: string
          is_primary: boolean | null
          test_item_id: number
        }
        Insert: {
          equipment_id: string
          id?: string
          is_primary?: boolean | null
          test_item_id: number
        }
        Update: {
          equipment_id?: string
          id?: string
          is_primary?: boolean | null
          test_item_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "equipment_test_items_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_test_items_test_item_id_fkey"
            columns: ["test_item_id"]
            isOneToOne: false
            referencedRelation: "test_items"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_team_members: {
        Row: {
          created_at: string
          id: string
          role_in_team: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_in_team?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role_in_team?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "lab_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_teams: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      maintenance_logs: {
        Row: {
          cost: number | null
          created_at: string
          description: string | null
          downtime_hours: number | null
          equipment_id: string
          id: string
          maintenance_date: string
          maintenance_type: string
          next_service_date: string | null
          parts_replaced: string | null
          performed_by: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string
          description?: string | null
          downtime_hours?: number | null
          equipment_id: string
          id?: string
          maintenance_date: string
          maintenance_type?: string
          next_service_date?: string | null
          parts_replaced?: string | null
          performed_by?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string
          description?: string | null
          downtime_hours?: number | null
          equipment_id?: string
          id?: string
          maintenance_date?: string
          maintenance_type?: string
          next_service_date?: string | null
          parts_replaced?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_logs_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      material_audit: {
        Row: {
          action: string
          changed_by: string | null
          changed_by_name: string | null
          created_at: string
          details: Json | null
          id: string
          material_id: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          changed_by_name?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          material_id: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          changed_by_name?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          material_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_audit_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      material_certifications: {
        Row: {
          certificate_number: string | null
          certification_type: string
          created_at: string
          document_url: string | null
          id: string
          is_active: boolean
          issuer: string | null
          material_id: string
          notes: string | null
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          certificate_number?: string | null
          certification_type: string
          created_at?: string
          document_url?: string | null
          id?: string
          is_active?: boolean
          issuer?: string | null
          material_id: string
          notes?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          certificate_number?: string | null
          certification_type?: string
          created_at?: string
          document_url?: string | null
          id?: string
          is_active?: boolean
          issuer?: string | null
          material_id?: string
          notes?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_certifications_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      material_suppliers: {
        Row: {
          grade: string | null
          id: string
          material_id: string
          notes: string | null
          supplier_id: string
          unit_price: number | null
        }
        Insert: {
          grade?: string | null
          id?: string
          material_id: string
          notes?: string | null
          supplier_id: string
          unit_price?: number | null
        }
        Update: {
          grade?: string | null
          id?: string
          material_id?: string
          notes?: string | null
          supplier_id?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "material_suppliers_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      material_test_programs: {
        Row: {
          created_at: string
          id: string
          material_id: string
          notes: string | null
          priority: number
          program_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          notes?: string | null
          priority?: number
          program_id: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          notes?: string | null
          priority?: number
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_test_programs_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_test_programs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "test_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      material_versions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          change_notes: string | null
          created_at: string
          effective_date: string | null
          id: string
          material_id: string
          prepared_by: string | null
          reviewed_by: string | null
          snapshot: Json | null
          status: string
          superseded_by: string | null
          version_number: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          change_notes?: string | null
          created_at?: string
          effective_date?: string | null
          id?: string
          material_id: string
          prepared_by?: string | null
          reviewed_by?: string | null
          snapshot?: Json | null
          status?: string
          superseded_by?: string | null
          version_number: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          change_notes?: string | null
          created_at?: string
          effective_date?: string | null
          id?: string
          material_id?: string
          prepared_by?: string | null
          reviewed_by?: string | null
          snapshot?: Json | null
          status?: string
          superseded_by?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "material_versions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_versions_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "material_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          abrasion_class: string | null
          antimicrobial: boolean
          approval_status: string
          backing_material: string | null
          batch_lot: string | null
          breathability_rating: string | null
          coating_type: string | null
          coating_weight_gsm: number | null
          color: string | null
          composition: string | null
          country_of_origin: string | null
          created_at: string
          current_version: number
          default_test_program_id: string | null
          finish: string | null
          fire_retardant: boolean
          gsm_tolerance: number | null
          id: string
          image_url: string | null
          is_active: boolean
          lamination: string | null
          layers: number | null
          material_code: string | null
          material_type: string
          name: string
          notes: string | null
          oekotex_class: string | null
          pattern: string | null
          reach_compliant: boolean | null
          recycled_content_percent: number | null
          status: string
          stretch_warp_percent: number | null
          stretch_weft_percent: number | null
          structure: string | null
          sub_type: string | null
          thickness_mm: number | null
          updated_at: string
          uv_stabilized: boolean
          warp_density_per_cm: number | null
          warp_yarn_count: string | null
          water_repellency_rating: string | null
          weave_pattern: string | null
          weft_density_per_cm: number | null
          weft_yarn_count: string | null
          weight_gsm: number | null
          width_cm: number | null
        }
        Insert: {
          abrasion_class?: string | null
          antimicrobial?: boolean
          approval_status?: string
          backing_material?: string | null
          batch_lot?: string | null
          breathability_rating?: string | null
          coating_type?: string | null
          coating_weight_gsm?: number | null
          color?: string | null
          composition?: string | null
          country_of_origin?: string | null
          created_at?: string
          current_version?: number
          default_test_program_id?: string | null
          finish?: string | null
          fire_retardant?: boolean
          gsm_tolerance?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          lamination?: string | null
          layers?: number | null
          material_code?: string | null
          material_type?: string
          name: string
          notes?: string | null
          oekotex_class?: string | null
          pattern?: string | null
          reach_compliant?: boolean | null
          recycled_content_percent?: number | null
          status?: string
          stretch_warp_percent?: number | null
          stretch_weft_percent?: number | null
          structure?: string | null
          sub_type?: string | null
          thickness_mm?: number | null
          updated_at?: string
          uv_stabilized?: boolean
          warp_density_per_cm?: number | null
          warp_yarn_count?: string | null
          water_repellency_rating?: string | null
          weave_pattern?: string | null
          weft_density_per_cm?: number | null
          weft_yarn_count?: string | null
          weight_gsm?: number | null
          width_cm?: number | null
        }
        Update: {
          abrasion_class?: string | null
          antimicrobial?: boolean
          approval_status?: string
          backing_material?: string | null
          batch_lot?: string | null
          breathability_rating?: string | null
          coating_type?: string | null
          coating_weight_gsm?: number | null
          color?: string | null
          composition?: string | null
          country_of_origin?: string | null
          created_at?: string
          current_version?: number
          default_test_program_id?: string | null
          finish?: string | null
          fire_retardant?: boolean
          gsm_tolerance?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          lamination?: string | null
          layers?: number | null
          material_code?: string | null
          material_type?: string
          name?: string
          notes?: string | null
          oekotex_class?: string | null
          pattern?: string | null
          reach_compliant?: boolean | null
          recycled_content_percent?: number | null
          status?: string
          stretch_warp_percent?: number | null
          stretch_weft_percent?: number | null
          structure?: string | null
          sub_type?: string | null
          thickness_mm?: number | null
          updated_at?: string
          uv_stabilized?: boolean
          warp_density_per_cm?: number | null
          warp_yarn_count?: string | null
          water_repellency_rating?: string | null
          weave_pattern?: string | null
          weft_density_per_cm?: number | null
          weft_yarn_count?: string | null
          weight_gsm?: number | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_default_test_program_id_fkey"
            columns: ["default_test_program_id"]
            isOneToOne: false
            referencedRelation: "test_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      method_acceptance: {
        Row: {
          display_order: number
          id: string
          max_value: number | null
          measurement_uncertainty: number | null
          min_value: number | null
          notes: string | null
          property_name: string
          qc_frequency: string | null
          qc_reference_material: string | null
          specification_ref: string | null
          test_item_id: number
          unit: string | null
        }
        Insert: {
          display_order?: number
          id?: string
          max_value?: number | null
          measurement_uncertainty?: number | null
          min_value?: number | null
          notes?: string | null
          property_name: string
          qc_frequency?: string | null
          qc_reference_material?: string | null
          specification_ref?: string | null
          test_item_id: number
          unit?: string | null
        }
        Update: {
          display_order?: number
          id?: string
          max_value?: number | null
          measurement_uncertainty?: number | null
          min_value?: number | null
          notes?: string | null
          property_name?: string
          qc_frequency?: string | null
          qc_reference_material?: string | null
          specification_ref?: string | null
          test_item_id?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "method_acceptance_test_item_id_fkey"
            columns: ["test_item_id"]
            isOneToOne: false
            referencedRelation: "test_items"
            referencedColumns: ["id"]
          },
        ]
      }
      method_audit: {
        Row: {
          action: string
          changed_by: string | null
          changed_by_name: string | null
          created_at: string
          details: Json | null
          id: string
          test_item_id: number
        }
        Insert: {
          action: string
          changed_by?: string | null
          changed_by_name?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          test_item_id: number
        }
        Update: {
          action?: string
          changed_by?: string | null
          changed_by_name?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          test_item_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "method_audit_test_item_id_fkey"
            columns: ["test_item_id"]
            isOneToOne: false
            referencedRelation: "test_items"
            referencedColumns: ["id"]
          },
        ]
      }
      method_calculations: {
        Row: {
          decimals: number
          display_order: number
          formula_text: string | null
          id: string
          notes: string | null
          property_name: string
          result_unit: string | null
          rounding_rule: string
          test_item_id: number
        }
        Insert: {
          decimals?: number
          display_order?: number
          formula_text?: string | null
          id?: string
          notes?: string | null
          property_name: string
          result_unit?: string | null
          rounding_rule?: string
          test_item_id: number
        }
        Update: {
          decimals?: number
          display_order?: number
          formula_text?: string | null
          id?: string
          notes?: string | null
          property_name?: string
          result_unit?: string | null
          rounding_rule?: string
          test_item_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "method_calculations_test_item_id_fkey"
            columns: ["test_item_id"]
            isOneToOne: false
            referencedRelation: "test_items"
            referencedColumns: ["id"]
          },
        ]
      }
      method_conditioning: {
        Row: {
          conditioning_profile_id: string | null
          created_at: string
          description: string | null
          duration_hours: number | null
          humidity_percent: number | null
          humidity_tolerance: number | null
          id: string
          temperature_c: number | null
          temperature_tolerance: number | null
          test_item_id: number
        }
        Insert: {
          conditioning_profile_id?: string | null
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          humidity_percent?: number | null
          humidity_tolerance?: number | null
          id?: string
          temperature_c?: number | null
          temperature_tolerance?: number | null
          test_item_id: number
        }
        Update: {
          conditioning_profile_id?: string | null
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          humidity_percent?: number | null
          humidity_tolerance?: number | null
          id?: string
          temperature_c?: number | null
          temperature_tolerance?: number | null
          test_item_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "method_conditioning_conditioning_profile_id_fkey"
            columns: ["conditioning_profile_id"]
            isOneToOne: false
            referencedRelation: "conditioning_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "method_conditioning_test_item_id_fkey"
            columns: ["test_item_id"]
            isOneToOne: false
            referencedRelation: "test_items"
            referencedColumns: ["id"]
          },
        ]
      }
      method_directions: {
        Row: {
          direction: string
          id: string
          notes: string | null
          specimens_per_direction: number
          test_item_id: number
        }
        Insert: {
          direction: string
          id?: string
          notes?: string | null
          specimens_per_direction?: number
          test_item_id: number
        }
        Update: {
          direction?: string
          id?: string
          notes?: string | null
          specimens_per_direction?: number
          test_item_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "method_directions_test_item_id_fkey"
            columns: ["test_item_id"]
            isOneToOne: false
            referencedRelation: "test_items"
            referencedColumns: ["id"]
          },
        ]
      }
      method_equipment: {
        Row: {
          attachment: string | null
          calibration_required: boolean
          created_at: string
          display_order: number
          equipment_id: string | null
          equipment_type: string | null
          id: string
          is_mandatory: boolean
          model_required: string | null
          notes: string | null
          test_item_id: number
        }
        Insert: {
          attachment?: string | null
          calibration_required?: boolean
          created_at?: string
          display_order?: number
          equipment_id?: string | null
          equipment_type?: string | null
          id?: string
          is_mandatory?: boolean
          model_required?: string | null
          notes?: string | null
          test_item_id: number
        }
        Update: {
          attachment?: string | null
          calibration_required?: boolean
          created_at?: string
          display_order?: number
          equipment_id?: string | null
          equipment_type?: string | null
          id?: string
          is_mandatory?: boolean
          model_required?: string | null
          notes?: string | null
          test_item_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "method_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "method_equipment_test_item_id_fkey"
            columns: ["test_item_id"]
            isOneToOne: false
            referencedRelation: "test_items"
            referencedColumns: ["id"]
          },
        ]
      }
      method_parameters: {
        Row: {
          display_order: number
          id: string
          is_mandatory: boolean
          notes: string | null
          param_name: string
          param_value: string | null
          test_item_id: number
          unit: string | null
        }
        Insert: {
          display_order?: number
          id?: string
          is_mandatory?: boolean
          notes?: string | null
          param_name: string
          param_value?: string | null
          test_item_id: number
          unit?: string | null
        }
        Update: {
          display_order?: number
          id?: string
          is_mandatory?: boolean
          notes?: string | null
          param_name?: string
          param_value?: string | null
          test_item_id?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "method_parameters_test_item_id_fkey"
            columns: ["test_item_id"]
            isOneToOne: false
            referencedRelation: "test_items"
            referencedColumns: ["id"]
          },
        ]
      }
      method_procedure_steps: {
        Row: {
          created_at: string
          expected_duration_minutes: number | null
          id: string
          image_url: string | null
          instruction_text: string
          step_number: number
          test_item_id: number
          warning_text: string | null
        }
        Insert: {
          created_at?: string
          expected_duration_minutes?: number | null
          id?: string
          image_url?: string | null
          instruction_text: string
          step_number: number
          test_item_id: number
          warning_text?: string | null
        }
        Update: {
          created_at?: string
          expected_duration_minutes?: number | null
          id?: string
          image_url?: string | null
          instruction_text?: string
          step_number?: number
          test_item_id?: number
          warning_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "method_procedure_steps_test_item_id_fkey"
            columns: ["test_item_id"]
            isOneToOne: false
            referencedRelation: "test_items"
            referencedColumns: ["id"]
          },
        ]
      }
      method_standards: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_primary: boolean
          notes: string | null
          standard_id: string | null
          standard_text: string | null
          test_item_id: number
          year: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_primary?: boolean
          notes?: string | null
          standard_id?: string | null
          standard_text?: string | null
          test_item_id: number
          year?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_primary?: boolean
          notes?: string | null
          standard_id?: string | null
          standard_text?: string | null
          test_item_id?: number
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "method_standards_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "standards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "method_standards_test_item_id_fkey"
            columns: ["test_item_id"]
            isOneToOne: false
            referencedRelation: "test_items"
            referencedColumns: ["id"]
          },
        ]
      }
      method_versions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          change_notes: string | null
          created_at: string
          effective_date: string | null
          id: string
          prepared_by: string | null
          reviewed_by: string | null
          snapshot: Json | null
          status: string
          superseded_by: string | null
          test_item_id: number
          version_number: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          change_notes?: string | null
          created_at?: string
          effective_date?: string | null
          id?: string
          prepared_by?: string | null
          reviewed_by?: string | null
          snapshot?: Json | null
          status?: string
          superseded_by?: string | null
          test_item_id: number
          version_number: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          change_notes?: string | null
          created_at?: string
          effective_date?: string | null
          id?: string
          prepared_by?: string | null
          reviewed_by?: string | null
          snapshot?: Json | null
          status?: string
          superseded_by?: string | null
          test_item_id?: number
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "method_versions_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "method_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "method_versions_test_item_id_fkey"
            columns: ["test_item_id"]
            isOneToOne: false
            referencedRelation: "test_items"
            referencedColumns: ["id"]
          },
        ]
      }
      oem_specifications: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          oem_brand: string
          region: string | null
          spec_code: string
          title: string | null
          version: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          oem_brand: string
          region?: string | null
          spec_code: string
          title?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          oem_brand?: string
          region?: string | null
          spec_code?: string
          title?: string | null
          version?: string | null
        }
        Relationships: []
      }
      sample_test_items: {
        Row: {
          display_order: number | null
          id: string
          include_in_report: boolean | null
          sample_id: string
          test_item_id: number
        }
        Insert: {
          display_order?: number | null
          id?: string
          include_in_report?: boolean | null
          sample_id: string
          test_item_id: number
        }
        Update: {
          display_order?: number | null
          id?: string
          include_in_report?: boolean | null
          sample_id?: string
          test_item_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "sample_test_items_sample_id_fkey"
            columns: ["sample_id"]
            isOneToOne: false
            referencedRelation: "samples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sample_test_items_test_item_id_fkey"
            columns: ["test_item_id"]
            isOneToOne: false
            referencedRelation: "test_items"
            referencedColumns: ["id"]
          },
        ]
      }
      samples: {
        Row: {
          application: string | null
          base_type: Database["public"]["Enums"]["base_type"] | null
          batch_number: string | null
          color: string | null
          composition: string | null
          created_at: string
          customer_id: string | null
          fabric_type: string | null
          id: string
          material_id: string | null
          oem_brand: string | null
          oem_specification_id: string | null
          overall_judgment: Database["public"]["Enums"]["judgment"] | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          product_name: string
          received_date: string | null
          requested_by: string | null
          sample_id: string
          standard_requirement: string | null
          status: Database["public"]["Enums"]["sample_status"] | null
          supplier_id: string | null
          supplier_name: string | null
          technical_regulation: string | null
          test_conditions: string | null
          test_date: string | null
          test_program_id: string | null
          test_request_id: string | null
          updated_at: string
        }
        Insert: {
          application?: string | null
          base_type?: Database["public"]["Enums"]["base_type"] | null
          batch_number?: string | null
          color?: string | null
          composition?: string | null
          created_at?: string
          customer_id?: string | null
          fabric_type?: string | null
          id?: string
          material_id?: string | null
          oem_brand?: string | null
          oem_specification_id?: string | null
          overall_judgment?: Database["public"]["Enums"]["judgment"] | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          product_name: string
          received_date?: string | null
          requested_by?: string | null
          sample_id: string
          standard_requirement?: string | null
          status?: Database["public"]["Enums"]["sample_status"] | null
          supplier_id?: string | null
          supplier_name?: string | null
          technical_regulation?: string | null
          test_conditions?: string | null
          test_date?: string | null
          test_program_id?: string | null
          test_request_id?: string | null
          updated_at?: string
        }
        Update: {
          application?: string | null
          base_type?: Database["public"]["Enums"]["base_type"] | null
          batch_number?: string | null
          color?: string | null
          composition?: string | null
          created_at?: string
          customer_id?: string | null
          fabric_type?: string | null
          id?: string
          material_id?: string | null
          oem_brand?: string | null
          oem_specification_id?: string | null
          overall_judgment?: Database["public"]["Enums"]["judgment"] | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          product_name?: string
          received_date?: string | null
          requested_by?: string | null
          sample_id?: string
          standard_requirement?: string | null
          status?: Database["public"]["Enums"]["sample_status"] | null
          supplier_id?: string | null
          supplier_name?: string | null
          technical_regulation?: string | null
          test_conditions?: string | null
          test_date?: string | null
          test_program_id?: string | null
          test_request_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "samples_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "samples_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "samples_oem_specification_id_fkey"
            columns: ["oem_specification_id"]
            isOneToOne: false
            referencedRelation: "oem_specifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "samples_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "samples_test_program_id_fkey"
            columns: ["test_program_id"]
            isOneToOne: false
            referencedRelation: "test_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "samples_test_request_id_fkey"
            columns: ["test_request_id"]
            isOneToOne: false
            referencedRelation: "customer_test_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_versions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          change_notes: string | null
          content: string
          created_at: string
          equipment_settings: string | null
          id: string
          prepared_by: string | null
          safety_notes: string | null
          sop_id: string
          version_number: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          change_notes?: string | null
          content?: string
          created_at?: string
          equipment_settings?: string | null
          id?: string
          prepared_by?: string | null
          safety_notes?: string | null
          sop_id: string
          version_number?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          change_notes?: string | null
          content?: string
          created_at?: string
          equipment_settings?: string | null
          id?: string
          prepared_by?: string | null
          safety_notes?: string | null
          sop_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "sop_versions_sop_id_fkey"
            columns: ["sop_id"]
            isOneToOne: false
            referencedRelation: "sops"
            referencedColumns: ["id"]
          },
        ]
      }
      sops: {
        Row: {
          created_at: string
          current_version: number
          id: string
          status: string
          test_item_id: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_version?: number
          id?: string
          status?: string
          test_item_id?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_version?: number
          id?: string
          status?: string
          test_item_id?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sops_test_item_id_fkey"
            columns: ["test_item_id"]
            isOneToOne: false
            referencedRelation: "test_items"
            referencedColumns: ["id"]
          },
        ]
      }
      standard_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          is_primary: boolean
          standard_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          is_primary?: boolean
          standard_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          standard_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "standard_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "standards_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standard_categories_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "standards"
            referencedColumns: ["id"]
          },
        ]
      }
      standard_equipment_requirements: {
        Row: {
          calibration_requirements: string | null
          created_at: string
          display_order: number
          equipment_id: string | null
          equipment_type: string
          id: string
          manufacturer_examples: string | null
          notes: string | null
          required_specifications: string | null
          specimen_size: string | null
          standard_id: string
          test_conditions: string | null
        }
        Insert: {
          calibration_requirements?: string | null
          created_at?: string
          display_order?: number
          equipment_id?: string | null
          equipment_type: string
          id?: string
          manufacturer_examples?: string | null
          notes?: string | null
          required_specifications?: string | null
          specimen_size?: string | null
          standard_id: string
          test_conditions?: string | null
        }
        Update: {
          calibration_requirements?: string | null
          created_at?: string
          display_order?: number
          equipment_id?: string | null
          equipment_type?: string
          id?: string
          manufacturer_examples?: string | null
          notes?: string | null
          required_specifications?: string | null
          specimen_size?: string | null
          standard_id?: string
          test_conditions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "standard_equipment_requirements_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standard_equipment_requirements_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "standards"
            referencedColumns: ["id"]
          },
        ]
      }
      standard_parameters: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          measurement_method: string | null
          measurement_uncertainty: string | null
          notes: string | null
          parameter_name: string
          rating_scale: string | null
          standard_id: string
          typical_range_max: number | null
          typical_range_min: number | null
          unit: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          measurement_method?: string | null
          measurement_uncertainty?: string | null
          notes?: string | null
          parameter_name: string
          rating_scale?: string | null
          standard_id: string
          typical_range_max?: number | null
          typical_range_min?: number | null
          unit?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          measurement_method?: string | null
          measurement_uncertainty?: string | null
          notes?: string | null
          parameter_name?: string
          rating_scale?: string | null
          standard_id?: string
          typical_range_max?: number | null
          typical_range_min?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "standard_parameters_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "standards"
            referencedColumns: ["id"]
          },
        ]
      }
      standard_references: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          relationship_type: string
          source_standard_id: string
          target_standard_id: string | null
          target_text: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          relationship_type: string
          source_standard_id: string
          target_standard_id?: string | null
          target_text?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          relationship_type?: string
          source_standard_id?: string
          target_standard_id?: string | null
          target_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "standard_references_source_standard_id_fkey"
            columns: ["source_standard_id"]
            isOneToOne: false
            referencedRelation: "standards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standard_references_target_standard_id_fkey"
            columns: ["target_standard_id"]
            isOneToOne: false
            referencedRelation: "standards"
            referencedColumns: ["id"]
          },
        ]
      }
      standard_revisions: {
        Row: {
          change_summary: string | null
          created_at: string
          document_url: string | null
          effective_date: string | null
          id: string
          notes: string | null
          revision_label: string
          revision_type: string | null
          revision_year: number | null
          standard_id: string
          withdrawn_date: string | null
        }
        Insert: {
          change_summary?: string | null
          created_at?: string
          document_url?: string | null
          effective_date?: string | null
          id?: string
          notes?: string | null
          revision_label: string
          revision_type?: string | null
          revision_year?: number | null
          standard_id: string
          withdrawn_date?: string | null
        }
        Update: {
          change_summary?: string | null
          created_at?: string
          document_url?: string | null
          effective_date?: string | null
          id?: string
          notes?: string | null
          revision_label?: string
          revision_type?: string | null
          revision_year?: number | null
          standard_id?: string
          withdrawn_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "standard_revisions_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "standards"
            referencedColumns: ["id"]
          },
        ]
      }
      standard_wiki_revisions: {
        Row: {
          content_md: string
          created_at: string
          edit_summary: string | null
          edited_by: string | null
          edited_by_name: string | null
          id: string
          standard_id: string
        }
        Insert: {
          content_md: string
          created_at?: string
          edit_summary?: string | null
          edited_by?: string | null
          edited_by_name?: string | null
          id?: string
          standard_id: string
        }
        Update: {
          content_md?: string
          created_at?: string
          edit_summary?: string | null
          edited_by?: string | null
          edited_by_name?: string | null
          id?: string
          standard_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "standard_wiki_revisions_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "standards"
            referencedColumns: ["id"]
          },
        ]
      }
      standards: {
        Row: {
          code: string
          created_at: string
          document_type: string | null
          document_url: string | null
          first_published_year: number | null
          full_designation: string | null
          id: string
          is_active: boolean
          language: string | null
          last_verified_date: string | null
          latest_revision_year: number | null
          normative_references: string | null
          organization: string
          organization_id: string | null
          revision_suffix: string | null
          scope_description: string | null
          source_attribution: string | null
          status: string
          summary: string | null
          superseded_by_id: string | null
          title: string | null
          updated_at: string
          version: string | null
          wiki_notes_md: string | null
          withdrawal_date: string | null
        }
        Insert: {
          code: string
          created_at?: string
          document_type?: string | null
          document_url?: string | null
          first_published_year?: number | null
          full_designation?: string | null
          id?: string
          is_active?: boolean
          language?: string | null
          last_verified_date?: string | null
          latest_revision_year?: number | null
          normative_references?: string | null
          organization?: string
          organization_id?: string | null
          revision_suffix?: string | null
          scope_description?: string | null
          source_attribution?: string | null
          status?: string
          summary?: string | null
          superseded_by_id?: string | null
          title?: string | null
          updated_at?: string
          version?: string | null
          wiki_notes_md?: string | null
          withdrawal_date?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          document_type?: string | null
          document_url?: string | null
          first_published_year?: number | null
          full_designation?: string | null
          id?: string
          is_active?: boolean
          language?: string | null
          last_verified_date?: string | null
          latest_revision_year?: number | null
          normative_references?: string | null
          organization?: string
          organization_id?: string | null
          revision_suffix?: string | null
          scope_description?: string | null
          source_attribution?: string | null
          status?: string
          summary?: string | null
          superseded_by_id?: string | null
          title?: string | null
          updated_at?: string
          version?: string | null
          wiki_notes_md?: string | null
          withdrawal_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "standards_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "standards_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standards_superseded_by_id_fkey"
            columns: ["superseded_by_id"]
            isOneToOne: false
            referencedRelation: "standards"
            referencedColumns: ["id"]
          },
        ]
      }
      standards_audit: {
        Row: {
          action: string
          changed_by: string | null
          changed_by_name: string | null
          created_at: string
          details: Json | null
          id: string
          standard_id: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          changed_by_name?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          standard_id: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          changed_by_name?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          standard_id?: string
        }
        Relationships: []
      }
      standards_categories: {
        Row: {
          code: string
          created_at: string
          description: string | null
          display_order: number
          ics_code: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          display_order?: number
          ics_code?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          display_order?: number
          ics_code?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "standards_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "standards_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      standards_organizations: {
        Row: {
          abbreviation: string | null
          api_endpoint: string | null
          code: string
          country_origin: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          notes: string | null
          numbering_convention: string | null
          publication_frequency: string | null
          secretariat_history: string | null
          subcommittees: string | null
          subscription_access_details: string | null
          technical_committee: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          abbreviation?: string | null
          api_endpoint?: string | null
          code: string
          country_origin?: string | null
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          notes?: string | null
          numbering_convention?: string | null
          publication_frequency?: string | null
          secretariat_history?: string | null
          subcommittees?: string | null
          subscription_access_details?: string | null
          technical_committee?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          abbreviation?: string | null
          api_endpoint?: string | null
          code?: string
          country_origin?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          numbering_convention?: string | null
          publication_frequency?: string | null
          secretariat_history?: string | null
          subcommittees?: string | null
          subscription_access_details?: string | null
          technical_committee?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      supplier_documents: {
        Row: {
          created_at: string
          document_number: string | null
          document_type: string
          document_url: string | null
          id: string
          issuer: string | null
          notes: string | null
          supplier_id: string
          updated_at: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          document_number?: string | null
          document_type: string
          document_url?: string | null
          id?: string
          issuer?: string | null
          notes?: string | null
          supplier_id: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          document_number?: string | null
          document_type?: string
          document_url?: string | null
          id?: string
          issuer?: string | null
          notes?: string | null
          supplier_id?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_documents_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address_line: string | null
          approval_status: string
          approved_at: string | null
          city: string | null
          contact_person: string | null
          country: string | null
          created_at: string
          currency: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          postal_code: string | null
          rating: number | null
          secondary_email: string | null
          state_region: string | null
          status: string
          supplier_code: string | null
          supplier_type: string
          tax_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address_line?: string | null
          approval_status?: string
          approved_at?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          rating?: number | null
          secondary_email?: string | null
          state_region?: string | null
          status?: string
          supplier_code?: string | null
          supplier_type?: string
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address_line?: string | null
          approval_status?: string
          approved_at?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          rating?: number | null
          secondary_email?: string | null
          state_region?: string | null
          status?: string
          supplier_code?: string | null
          supplier_type?: string
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      task_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          id: string
          mime_type: string | null
          ocr_completed_at: string | null
          ocr_error: string | null
          ocr_language: string
          ocr_status: string
          ocr_text: string | null
          storage_path: string
          task_id: string
          uploaded_by: string | null
          uploaded_by_name: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number
          id?: string
          mime_type?: string | null
          ocr_completed_at?: string | null
          ocr_error?: string | null
          ocr_language?: string
          ocr_status?: string
          ocr_text?: string | null
          storage_path: string
          task_id: string
          uploaded_by?: string | null
          uploaded_by_name?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          id?: string
          mime_type?: string | null
          ocr_completed_at?: string | null
          ocr_error?: string | null
          ocr_language?: string
          ocr_status?: string
          ocr_text?: string | null
          storage_path?: string
          task_id?: string
          uploaded_by?: string | null
          uploaded_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_name: string | null
          author_user_id: string | null
          body: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          author_name?: string | null
          author_user_id?: string | null
          body: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          author_name?: string | null
          author_user_id?: string | null
          body?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          ai_rationale: string | null
          ai_suggested: boolean
          assignee_team_id: string | null
          assignee_user_id: string | null
          calibration_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          equipment_id: string | null
          estimated_hours: number | null
          id: string
          planned_date: string | null
          priority: string
          sample_id: string | null
          sample_test_item_id: string | null
          status: string
          tags: string[] | null
          task_number: string | null
          test_request_id: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          ai_rationale?: string | null
          ai_suggested?: boolean
          assignee_team_id?: string | null
          assignee_user_id?: string | null
          calibration_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          equipment_id?: string | null
          estimated_hours?: number | null
          id?: string
          planned_date?: string | null
          priority?: string
          sample_id?: string | null
          sample_test_item_id?: string | null
          status?: string
          tags?: string[] | null
          task_number?: string | null
          test_request_id?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          ai_rationale?: string | null
          ai_suggested?: boolean
          assignee_team_id?: string | null
          assignee_user_id?: string | null
          calibration_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          equipment_id?: string | null
          estimated_hours?: number | null
          id?: string
          planned_date?: string | null
          priority?: string
          sample_id?: string | null
          sample_test_item_id?: string | null
          status?: string
          tags?: string[] | null
          task_number?: string | null
          test_request_id?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_team_id_fkey"
            columns: ["assignee_team_id"]
            isOneToOne: false
            referencedRelation: "lab_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_sample_id_fkey"
            columns: ["sample_id"]
            isOneToOne: false
            referencedRelation: "samples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_test_request_id_fkey"
            columns: ["test_request_id"]
            isOneToOne: false
            referencedRelation: "customer_test_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_items: {
        Row: {
          aging_condition: string | null
          category: string
          created_at: string
          direction_required: boolean | null
          display_order: number | null
          equipment_required: string | null
          id: number
          is_active: boolean | null
          method_code: string
          multiple_samples: boolean | null
          name: string
          principle: string | null
          sample_count: number | null
          scope: string | null
          standard_id: string | null
          status: string
          summary: string | null
          unit: string | null
          updated_at: string
          version: number
        }
        Insert: {
          aging_condition?: string | null
          category: string
          created_at?: string
          direction_required?: boolean | null
          display_order?: number | null
          equipment_required?: string | null
          id?: number
          is_active?: boolean | null
          method_code: string
          multiple_samples?: boolean | null
          name: string
          principle?: string | null
          sample_count?: number | null
          scope?: string | null
          standard_id?: string | null
          status?: string
          summary?: string | null
          unit?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          aging_condition?: string | null
          category?: string
          created_at?: string
          direction_required?: boolean | null
          display_order?: number | null
          equipment_required?: string | null
          id?: number
          is_active?: boolean | null
          method_code?: string
          multiple_samples?: boolean | null
          name?: string
          principle?: string | null
          sample_count?: number | null
          scope?: string | null
          standard_id?: string | null
          status?: string
          summary?: string | null
          unit?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_items_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "standards"
            referencedColumns: ["id"]
          },
        ]
      }
      test_program_items: {
        Row: {
          conditioning_profile_id: string | null
          display_order: number | null
          id: string
          include_in_report: boolean | null
          notes: string | null
          program_id: string
          test_item_id: number
        }
        Insert: {
          conditioning_profile_id?: string | null
          display_order?: number | null
          id?: string
          include_in_report?: boolean | null
          notes?: string | null
          program_id: string
          test_item_id: number
        }
        Update: {
          conditioning_profile_id?: string | null
          display_order?: number | null
          id?: string
          include_in_report?: boolean | null
          notes?: string | null
          program_id?: string
          test_item_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_program_items_conditioning_profile_id_fkey"
            columns: ["conditioning_profile_id"]
            isOneToOne: false
            referencedRelation: "conditioning_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_program_items_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "test_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_program_items_test_item_id_fkey"
            columns: ["test_item_id"]
            isOneToOne: false
            referencedRelation: "test_items"
            referencedColumns: ["id"]
          },
        ]
      }
      test_programs: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          material_type: string | null
          name: string
          oem_specification_id: string | null
          report_columns: Json | null
          report_footer_notes: string | null
          report_header_notes: string | null
          report_title: string | null
          show_signatures: boolean | null
          signature_roles: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          material_type?: string | null
          name: string
          oem_specification_id?: string | null
          report_columns?: Json | null
          report_footer_notes?: string | null
          report_header_notes?: string | null
          report_title?: string | null
          show_signatures?: boolean | null
          signature_roles?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          material_type?: string | null
          name?: string
          oem_specification_id?: string | null
          report_columns?: Json | null
          report_footer_notes?: string | null
          report_header_notes?: string | null
          report_title?: string | null
          show_signatures?: boolean | null
          signature_roles?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_programs_oem_specification_id_fkey"
            columns: ["oem_specification_id"]
            isOneToOne: false
            referencedRelation: "oem_specifications"
            referencedColumns: ["id"]
          },
        ]
      }
      test_reports: {
        Row: {
          acknowledged_at: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          customer_id: string | null
          document_url: string | null
          id: string
          issued_by: string | null
          issued_date: string | null
          notes: string | null
          overall_judgment: string | null
          recipient_email: string | null
          report_number: string
          sample_id: string | null
          sent_at: string | null
          status: string
          summary: string | null
          test_request_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          customer_id?: string | null
          document_url?: string | null
          id?: string
          issued_by?: string | null
          issued_date?: string | null
          notes?: string | null
          overall_judgment?: string | null
          recipient_email?: string | null
          report_number: string
          sample_id?: string | null
          sent_at?: string | null
          status?: string
          summary?: string | null
          test_request_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          customer_id?: string | null
          document_url?: string | null
          id?: string
          issued_by?: string | null
          issued_date?: string | null
          notes?: string | null
          overall_judgment?: string | null
          recipient_email?: string | null
          report_number?: string
          sample_id?: string | null
          sent_at?: string | null
          status?: string
          summary?: string | null
          test_request_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_reports_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_reports_sample_id_fkey"
            columns: ["sample_id"]
            isOneToOne: false
            referencedRelation: "samples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_reports_test_request_id_fkey"
            columns: ["test_request_id"]
            isOneToOne: false
            referencedRelation: "customer_test_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_request_template_versions: {
        Row: {
          change_kind: string
          change_note: string | null
          changed_at: string
          changed_by: string | null
          changed_by_name: string | null
          description: string | null
          id: string
          is_active: boolean
          label: string
          materials: string
          scope: string
          sort_order: number
          template_id: string
          version_number: number
        }
        Insert: {
          change_kind: string
          change_note?: string | null
          changed_at?: string
          changed_by?: string | null
          changed_by_name?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          label: string
          materials?: string
          scope?: string
          sort_order?: number
          template_id: string
          version_number: number
        }
        Update: {
          change_kind?: string
          change_note?: string | null
          changed_at?: string
          changed_by?: string | null
          changed_by_name?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          label?: string
          materials?: string
          scope?: string
          sort_order?: number
          template_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_request_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "test_request_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      test_request_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          label: string
          materials: string
          scope: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          label: string
          materials?: string
          scope?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          label?: string
          materials?: string
          scope?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      test_requirements: {
        Row: {
          created_at: string
          direction: string | null
          id: number
          is_active: boolean | null
          max_value: number | null
          min_value: number | null
          oem_brand: string | null
          oem_specification_id: string | null
          requirement_text: string | null
          standard_code: string | null
          target_value: number | null
          test_item_id: number | null
        }
        Insert: {
          created_at?: string
          direction?: string | null
          id?: number
          is_active?: boolean | null
          max_value?: number | null
          min_value?: number | null
          oem_brand?: string | null
          oem_specification_id?: string | null
          requirement_text?: string | null
          standard_code?: string | null
          target_value?: number | null
          test_item_id?: number | null
        }
        Update: {
          created_at?: string
          direction?: string | null
          id?: number
          is_active?: boolean | null
          max_value?: number | null
          min_value?: number | null
          oem_brand?: string | null
          oem_specification_id?: string | null
          requirement_text?: string | null
          standard_code?: string | null
          target_value?: number | null
          test_item_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_requirements_oem_specification_id_fkey"
            columns: ["oem_specification_id"]
            isOneToOne: false
            referencedRelation: "oem_specifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_requirements_test_item_id_fkey"
            columns: ["test_item_id"]
            isOneToOne: false
            referencedRelation: "test_items"
            referencedColumns: ["id"]
          },
        ]
      }
      test_results: {
        Row: {
          average_value: number | null
          calibration_record_id: string | null
          comments: string | null
          conditioning_profile_id: string | null
          created_at: string
          direction: string | null
          environment_notes: string | null
          equipment_id: string | null
          equipment_used: string | null
          failure_mode: string | null
          id: number
          judgment: Database["public"]["Enums"]["judgment"] | null
          max_value: number | null
          result_text: string | null
          sample_1: number | null
          sample_2: number | null
          sample_3: number | null
          sample_4: number | null
          sample_5: number | null
          sample_6: number | null
          sample_id: string | null
          sop_version_id: string | null
          test_item_id: number | null
          tested_by: string | null
          tested_date: string | null
          updated_at: string
        }
        Insert: {
          average_value?: number | null
          calibration_record_id?: string | null
          comments?: string | null
          conditioning_profile_id?: string | null
          created_at?: string
          direction?: string | null
          environment_notes?: string | null
          equipment_id?: string | null
          equipment_used?: string | null
          failure_mode?: string | null
          id?: number
          judgment?: Database["public"]["Enums"]["judgment"] | null
          max_value?: number | null
          result_text?: string | null
          sample_1?: number | null
          sample_2?: number | null
          sample_3?: number | null
          sample_4?: number | null
          sample_5?: number | null
          sample_6?: number | null
          sample_id?: string | null
          sop_version_id?: string | null
          test_item_id?: number | null
          tested_by?: string | null
          tested_date?: string | null
          updated_at?: string
        }
        Update: {
          average_value?: number | null
          calibration_record_id?: string | null
          comments?: string | null
          conditioning_profile_id?: string | null
          created_at?: string
          direction?: string | null
          environment_notes?: string | null
          equipment_id?: string | null
          equipment_used?: string | null
          failure_mode?: string | null
          id?: number
          judgment?: Database["public"]["Enums"]["judgment"] | null
          max_value?: number | null
          result_text?: string | null
          sample_1?: number | null
          sample_2?: number | null
          sample_3?: number | null
          sample_4?: number | null
          sample_5?: number | null
          sample_6?: number | null
          sample_id?: string | null
          sop_version_id?: string | null
          test_item_id?: number | null
          tested_by?: string | null
          tested_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_results_calibration_record_id_fkey"
            columns: ["calibration_record_id"]
            isOneToOne: false
            referencedRelation: "calibration_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_conditioning_profile_id_fkey"
            columns: ["conditioning_profile_id"]
            isOneToOne: false
            referencedRelation: "conditioning_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_sample_id_fkey"
            columns: ["sample_id"]
            isOneToOne: false
            referencedRelation: "samples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_sop_version_id_fkey"
            columns: ["sop_version_id"]
            isOneToOne: false
            referencedRelation: "sop_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_test_item_id_fkey"
            columns: ["test_item_id"]
            isOneToOne: false
            referencedRelation: "test_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      current_user_email: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "lab_tech" | "viewer"
      base_type: "Solvent" | "Water-Based"
      judgment: "OK" | "NG" | "Pending"
      priority_level: "Normal" | "Urgent" | "Critical"
      sample_status: "Pending" | "In Progress" | "Completed" | "Approved"
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
      app_role: ["admin", "lab_tech", "viewer"],
      base_type: ["Solvent", "Water-Based"],
      judgment: ["OK", "NG", "Pending"],
      priority_level: ["Normal", "Urgent", "Critical"],
      sample_status: ["Pending", "In Progress", "Completed", "Approved"],
    },
  },
} as const
