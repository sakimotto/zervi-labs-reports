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
      materials: {
        Row: {
          color: string | null
          composition: string | null
          created_at: string
          default_test_program_id: string | null
          finish: string | null
          id: string
          is_active: boolean
          material_type: string
          name: string
          notes: string | null
          updated_at: string
          weight_gsm: number | null
          width_cm: number | null
        }
        Insert: {
          color?: string | null
          composition?: string | null
          created_at?: string
          default_test_program_id?: string | null
          finish?: string | null
          id?: string
          is_active?: boolean
          material_type?: string
          name: string
          notes?: string | null
          updated_at?: string
          weight_gsm?: number | null
          width_cm?: number | null
        }
        Update: {
          color?: string | null
          composition?: string | null
          created_at?: string
          default_test_program_id?: string | null
          finish?: string | null
          id?: string
          is_active?: boolean
          material_type?: string
          name?: string
          notes?: string | null
          updated_at?: string
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
          overall_judgment: Database["public"]["Enums"]["judgment"] | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          product_name: string
          received_date: string | null
          requested_by: string | null
          sample_id: string
          standard_requirement: string | null
          status: Database["public"]["Enums"]["sample_status"] | null
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
          overall_judgment?: Database["public"]["Enums"]["judgment"] | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          product_name: string
          received_date?: string | null
          requested_by?: string | null
          sample_id: string
          standard_requirement?: string | null
          status?: Database["public"]["Enums"]["sample_status"] | null
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
          overall_judgment?: Database["public"]["Enums"]["judgment"] | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          product_name?: string
          received_date?: string | null
          requested_by?: string | null
          sample_id?: string
          standard_requirement?: string | null
          status?: Database["public"]["Enums"]["sample_status"] | null
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
          multiple_samples: boolean | null
          name: string
          sample_count: number | null
          testing_standard: string | null
          unit: string | null
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
          multiple_samples?: boolean | null
          name: string
          sample_count?: number | null
          testing_standard?: string | null
          unit?: string | null
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
          multiple_samples?: boolean | null
          name?: string
          sample_count?: number | null
          testing_standard?: string | null
          unit?: string | null
        }
        Relationships: []
      }
      test_program_items: {
        Row: {
          display_order: number | null
          id: string
          include_in_report: boolean | null
          notes: string | null
          program_id: string
          test_item_id: number
        }
        Insert: {
          display_order?: number | null
          id?: string
          include_in_report?: boolean | null
          notes?: string | null
          program_id: string
          test_item_id: number
        }
        Update: {
          display_order?: number | null
          id?: string
          include_in_report?: boolean | null
          notes?: string | null
          program_id?: string
          test_item_id?: number
        }
        Relationships: [
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
          report_columns?: Json | null
          report_footer_notes?: string | null
          report_header_notes?: string | null
          report_title?: string | null
          show_signatures?: boolean | null
          signature_roles?: Json | null
          updated_at?: string | null
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
          requirement_text?: string | null
          standard_code?: string | null
          target_value?: number | null
          test_item_id?: number | null
        }
        Relationships: [
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
          comments: string | null
          created_at: string
          direction: string | null
          equipment_used: string | null
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
          test_item_id: number | null
          tested_by: string | null
          tested_date: string | null
          updated_at: string
        }
        Insert: {
          average_value?: number | null
          comments?: string | null
          created_at?: string
          direction?: string | null
          equipment_used?: string | null
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
          test_item_id?: number | null
          tested_by?: string | null
          tested_date?: string | null
          updated_at?: string
        }
        Update: {
          average_value?: number | null
          comments?: string | null
          created_at?: string
          direction?: string | null
          equipment_used?: string | null
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
          test_item_id?: number | null
          tested_by?: string | null
          tested_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_results_sample_id_fkey"
            columns: ["sample_id"]
            isOneToOne: false
            referencedRelation: "samples"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
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
      base_type: ["Solvent", "Water-Based"],
      judgment: ["OK", "NG", "Pending"],
      priority_level: ["Normal", "Urgent", "Critical"],
      sample_status: ["Pending", "In Progress", "Completed", "Approved"],
    },
  },
} as const
