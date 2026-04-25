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
      calibration_records: {
        Row: {
          calibration_date: string
          certificate_number: string | null
          created_at: string
          equipment_id: string
          id: string
          next_due_date: string | null
          notes: string | null
          performed_by: string | null
          status: string
        }
        Insert: {
          calibration_date: string
          certificate_number?: string | null
          created_at?: string
          equipment_id: string
          id?: string
          next_due_date?: string | null
          notes?: string | null
          performed_by?: string | null
          status?: string
        }
        Update: {
          calibration_date?: string
          certificate_number?: string | null
          created_at?: string
          equipment_id?: string
          id?: string
          next_due_date?: string | null
          notes?: string | null
          performed_by?: string | null
          status?: string
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
      customers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          customer_type: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          customer_type?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          customer_type?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          assigned_operator: string | null
          category: string
          created_at: string
          id: string
          is_active: boolean
          location: string | null
          manufacturer: string | null
          model: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          serial_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_operator?: string | null
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_operator?: string | null
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          status?: string
          updated_at?: string
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
          updated_at: string
        }
        Insert: {
          application?: string | null
          base_type?: Database["public"]["Enums"]["base_type"] | null
          batch_number?: string | null
          color?: string | null
          composition?: string | null
          created_at?: string
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
          updated_at?: string
        }
        Update: {
          application?: string | null
          base_type?: Database["public"]["Enums"]["base_type"] | null
          batch_number?: string | null
          color?: string | null
          composition?: string | null
          created_at?: string
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
          updated_at?: string
        }
        Relationships: [
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
      standards: {
        Row: {
          code: string
          created_at: string
          document_url: string | null
          id: string
          is_active: boolean
          organization: string
          title: string | null
          version: string | null
        }
        Insert: {
          code: string
          created_at?: string
          document_url?: string | null
          id?: string
          is_active?: boolean
          organization?: string
          title?: string | null
          version?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          document_url?: string | null
          id?: string
          is_active?: boolean
          organization?: string
          title?: string | null
          version?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
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
