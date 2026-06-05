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
      audit_log: {
        Row: {
          action: string
          changed_by: string | null
          changed_by_role: string | null
          created_at: string | null
          field_changed: string | null
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          changed_by_role?: string | null
          created_at?: string | null
          field_changed?: string | null
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          changed_by_role?: string | null
          created_at?: string | null
          field_changed?: string | null
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          cert_number: string
          cert_type: string
          id: string
          issued_at: string | null
          issued_to_email: string
          issued_to_name: string
          ownership_record_id: string | null
          tag_id: string
          template: string
        }
        Insert: {
          cert_number: string
          cert_type: string
          id?: string
          issued_at?: string | null
          issued_to_email: string
          issued_to_name: string
          ownership_record_id?: string | null
          tag_id: string
          template?: string
        }
        Update: {
          cert_number?: string
          cert_type?: string
          id?: string
          issued_at?: string | null
          issued_to_email?: string
          issued_to_name?: string
          ownership_record_id?: string | null
          tag_id?: string
          template?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_ownership_record_id_fkey"
            columns: ["ownership_record_id"]
            isOneToOne: false
            referencedRelation: "ownership_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          ai_enabled: boolean
          ai_persona_name: string | null
          ai_persona_prompt: string | null
          ai_persona_voice_id: string | null
          approved_at: string | null
          approved_by: string | null
          brand_accent_color: string | null
          brand_font: string | null
          brand_primary_color: string | null
          brand_secondary_color: string | null
          brand_story: string | null
          brand_template: string | null
          brand_text_color: string | null
          cert_template: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          custom_header_text: string | null
          elevenlabs_api_key: string | null
          email: string
          id: string
          industry: string
          logo_url: string | null
          name: string
          signature_url: string | null
          social_links: Json | null
          status: string
        }
        Insert: {
          ai_enabled?: boolean
          ai_persona_name?: string | null
          ai_persona_prompt?: string | null
          ai_persona_voice_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          brand_accent_color?: string | null
          brand_font?: string | null
          brand_primary_color?: string | null
          brand_secondary_color?: string | null
          brand_story?: string | null
          brand_template?: string | null
          brand_text_color?: string | null
          cert_template?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          custom_header_text?: string | null
          elevenlabs_api_key?: string | null
          email: string
          id?: string
          industry: string
          logo_url?: string | null
          name: string
          signature_url?: string | null
          social_links?: Json | null
          status?: string
        }
        Update: {
          ai_enabled?: boolean
          ai_persona_name?: string | null
          ai_persona_prompt?: string | null
          ai_persona_voice_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          brand_accent_color?: string | null
          brand_font?: string | null
          brand_primary_color?: string | null
          brand_secondary_color?: string | null
          brand_story?: string | null
          brand_template?: string | null
          brand_text_color?: string | null
          cert_template?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          custom_header_text?: string | null
          elevenlabs_api_key?: string | null
          email?: string
          id?: string
          industry?: string
          logo_url?: string | null
          name?: string
          signature_url?: string | null
          social_links?: Json | null
          status?: string
        }
        Relationships: []
      }
      brand_inquiries: {
        Row: {
          id: string
          name: string
          email: string
          company: string
          phone: string | null
          status: 'new' | 'contacted' | 'converted' | 'declined'
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          company: string
          phone?: string | null
          status?: 'new' | 'contacted' | 'converted' | 'declined'
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          company?: string
          phone?: string | null
          status?: 'new' | 'contacted' | 'converted' | 'declined'
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      industry_waitlist: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          industry: string
          notes: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          industry: string
          notes?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          industry?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "industry_waitlist_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_codes: {
        Row: {
          attempts: number | null
          code_hash: string
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          is_used: boolean | null
          purpose: string
        }
        Insert: {
          attempts?: number | null
          code_hash: string
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          purpose: string
        }
        Update: {
          attempts?: number | null
          code_hash?: string
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          purpose?: string
        }
        Relationships: []
      }
      ownership_claims: {
        Row: {
          claim_ip: string | null
          claim_location: string | null
          claimant_email: string
          claimant_name: string
          created_at: string | null
          expires_at: string | null
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tag_id: string
        }
        Insert: {
          claim_ip?: string | null
          claim_location?: string | null
          claimant_email: string
          claimant_name: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tag_id: string
        }
        Update: {
          claim_ip?: string | null
          claim_location?: string | null
          claimant_email?: string
          claimant_name?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ownership_claims_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      ownership_records: {
        Row: {
          acquired_at: string | null
          acquired_from_id: string | null
          acquisition_type: string
          backup_email: string | null
          currency: string | null
          ended_at: string | null
          id: string
          is_current: boolean | null
          owner_email: string
          owner_name: string
          sale_price: number | null
          tag_id: string
        }
        Insert: {
          acquired_at?: string | null
          acquired_from_id?: string | null
          acquisition_type: string
          backup_email?: string | null
          currency?: string | null
          ended_at?: string | null
          id?: string
          is_current?: boolean | null
          owner_email: string
          owner_name: string
          sale_price?: number | null
          tag_id: string
        }
        Update: {
          acquired_at?: string | null
          acquired_from_id?: string | null
          acquisition_type?: string
          backup_email?: string | null
          currency?: string | null
          ended_at?: string | null
          id?: string
          is_current?: boolean | null
          owner_email?: string
          owner_name?: string
          sale_price?: number | null
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ownership_records_acquired_from_id_fkey"
            columns: ["acquired_from_id"]
            isOneToOne: false
            referencedRelation: "ownership_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ownership_records_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          ai_persona_config: Json | null
          company_id: string
          created_at: string | null
          currency: string | null
          id: string
          industry_fields: Json
          name: string
          photos: string[] | null
          retail_price: number | null
          updated_at: string | null
        }
        Insert: {
          ai_persona_config?: Json | null
          company_id: string
          created_at?: string | null
          currency?: string | null
          id?: string
          industry_fields?: Json
          name: string
          photos?: string[] | null
          retail_price?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_persona_config?: Json | null
          company_id?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          industry_fields?: Json
          name?: string
          photos?: string[] | null
          retail_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_logs: {
        Row: {
          created_at: string | null
          geo_location: Json | null
          id: string
          ip_address: string | null
          scan_result: string
          session_id: string | null
          tag_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          geo_location?: Json | null
          id?: string
          ip_address?: string | null
          scan_result: string
          session_id?: string | null
          tag_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          geo_location?: Json | null
          id?: string
          ip_address?: string | null
          scan_result?: string
          session_id?: string | null
          tag_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_logs_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      tag_batches: {
        Row: {
          batch_name: string | null
          batch_size: number
          batch_type: string
          cards_quantity: number
          company_id: string
          created_at: string | null
          created_by: string | null
          id: string
          industry: string
          notes: string | null
          shipped_at: string | null
          status: string
        }
        Insert: {
          batch_name?: string | null
          batch_size: number
          batch_type?: string
          cards_quantity?: number
          company_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          industry: string
          notes?: string | null
          shipped_at?: string | null
          status?: string
        }
        Update: {
          batch_name?: string | null
          batch_size?: number
          batch_type?: string
          cards_quantity?: number
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          industry?: string
          notes?: string | null
          shipped_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tag_batches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          activated_at: string | null
          batch_id: string | null
          company_id: string
          created_at: string | null
          hmac_signature: string
          id: string
          industry: string
          live_at: string | null
          medium: string
          product_id: string | null
          shipped_at: string | null
          short_id: string
          status: string
          token: string
          url: string
        }
        Insert: {
          activated_at?: string | null
          batch_id?: string | null
          company_id: string
          created_at?: string | null
          hmac_signature: string
          id?: string
          industry: string
          live_at?: string | null
          medium?: string
          product_id?: string | null
          shipped_at?: string | null
          short_id: string
          status?: string
          token: string
          url: string
        }
        Update: {
          activated_at?: string | null
          batch_id?: string | null
          company_id?: string
          created_at?: string | null
          hmac_signature?: string
          id?: string
          industry?: string
          live_at?: string | null
          medium?: string
          product_id?: string | null
          shipped_at?: string | null
          short_id?: string
          status?: string
          token?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_requests: {
        Row: {
          acceptance_token: string | null
          completed_at: string | null
          created_at: string | null
          currency: string | null
          expires_at: string | null
          from_owner_id: string
          id: string
          sale_price: number | null
          status: string
          tag_id: string
          to_email: string
          to_name: string
        }
        Insert: {
          acceptance_token?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          expires_at?: string | null
          from_owner_id: string
          id?: string
          sale_price?: number | null
          status?: string
          tag_id: string
          to_email: string
          to_name: string
        }
        Update: {
          acceptance_token?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          expires_at?: string | null
          from_owner_id?: string
          id?: string
          sale_price?: number | null
          status?: string
          tag_id?: string
          to_email?: string
          to_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_requests_from_owner_id_fkey"
            columns: ["from_owner_id"]
            isOneToOne: false
            referencedRelation: "ownership_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_requests_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          id: string
          key: string
          name: string
          description: string | null
          enabled: boolean
          rollout_percentage: number
          environments: string[]
          metadata: Json
          created_at: string
          updated_at: string
          created_by: string | null
          last_updated_by: string | null
        }
        Insert: {
          id?: string
          key: string
          name: string
          description?: string | null
          enabled?: boolean
          rollout_percentage?: number
          environments?: string[]
          metadata?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
          last_updated_by?: string | null
        }
        Update: {
          id?: string
          key?: string
          name?: string
          description?: string | null
          enabled?: boolean
          rollout_percentage?: number
          environments?: string[]
          metadata?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
          last_updated_by?: string | null
        }
        Relationships: []
      }
      feature_flag_overrides: {
        Row: {
          id: string
          flag_id: string
          entity_type: string
          entity_id: string
          enabled: boolean
          reason: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          flag_id: string
          entity_type: string
          entity_id: string
          enabled: boolean
          reason?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          flag_id?: string
          entity_type?: string
          entity_id?: string
          enabled?: boolean
          reason?: string | null
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flag_overrides_flag_id_fkey"
            columns: ["flag_id"]
            isOneToOne: false
            referencedRelation: "feature_flags"
            referencedColumns: ["id"]
          }
        ]
      }
      feature_flag_audit: {
        Row: {
          id: string
          flag_id: string | null
          flag_key: string
          action: string
          old_value: Json | null
          new_value: Json | null
          performed_by: string | null
          performed_by_email: string | null
          performed_at: string
          ip_address: string | null
        }
        Insert: {
          id?: string
          flag_id?: string | null
          flag_key: string
          action: string
          old_value?: Json | null
          new_value?: Json | null
          performed_by?: string | null
          performed_by_email?: string | null
          performed_at?: string
          ip_address?: string | null
        }
        Update: {
          id?: string
          flag_id?: string | null
          flag_key?: string
          action?: string
          old_value?: Json | null
          new_value?: Json | null
          performed_by?: string | null
          performed_by_email?: string | null
          performed_at?: string
          ip_address?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      confirm_claim: {
        Args: { p_claim_id: string; p_reviewed_by?: string | null }
        Returns: { ownership_record_id: string; tag_id: string }[]
      }
      complete_transfer: {
        Args: { p_transfer_id: string }
        Returns: { new_owner_id: string; old_owner_id: string }[]
      }
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

// ── App-level convenience types ───────────────────────────────────────────────
export type CompanyStatus = "pending" | "approved" | "rejected" | "suspended";
export type TagStatus =
  | "created"
  | "shipped"
  | "live"
  | "owned"
  | "transferred"
  | "flagged"
  | "suspended";
export type TagMedium = "tag" | "card";
export type BatchType = "tags" | "cards" | "mixed";
export type ClaimStatus = "pending" | "approved" | "rejected" | "expired";
export type Industry = "fashion" | "arts" | "collectibles" | "restaurants" | "hotels";
