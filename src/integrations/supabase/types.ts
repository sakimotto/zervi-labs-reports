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
          updated_at?: string
        }
        Relationships: []
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
