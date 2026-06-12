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
      plans: {
        Row: {
          id: string
          name: string
          monthly_price: number
          included_chips: number
          tag_limit: number | null
          card_limit: number | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          monthly_price?: number
          included_chips?: number
          tag_limit?: number | null
          card_limit?: number | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          monthly_price?: number
          included_chips?: number
          tag_limit?: number | null
          card_limit?: number | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          company_id: string
          plan_id: string
          status: "trialing" | "active" | "past_due" | "suspended" | "cancelled"
          billing_interval: "monthly" | "quarterly" | "annually"
          custom_monthly_price: number | null
          tag_limit_override: number | null
          card_limit_override: number | null
          tags_ordered_total: number
          cards_ordered_total: number
          trial_starts_at: string | null
          trial_ends_at: string | null
          current_period_start: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          plan_id: string
          status?: "trialing" | "active" | "past_due" | "suspended" | "cancelled"
          billing_interval?: "monthly" | "quarterly" | "annually"
          custom_monthly_price?: number | null
          tag_limit_override?: number | null
          card_limit_override?: number | null
          tags_ordered_total?: number
          cards_ordered_total?: number
          trial_starts_at?: string | null
          trial_ends_at?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          plan_id?: string
          status?: "trialing" | "active" | "past_due" | "suspended" | "cancelled"
          billing_interval?: "monthly" | "quarterly" | "annually"
          custom_monthly_price?: number | null
          tag_limit_override?: number | null
          card_limit_override?: number | null
          tags_ordered_total?: number
          cards_ordered_total?: number
          trial_starts_at?: string | null
          trial_ends_at?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      discounts: {
        Row: {
          id: string
          company_id: string
          type: "subscription" | "batch"
          percentage: number
          duration: number
          used: number
          is_active: boolean
          note: string | null
          created_by: string | null
          starts_at: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          type: "subscription" | "batch"
          percentage: number
          duration: number
          used?: number
          is_active?: boolean
          note?: string | null
          created_by?: string | null
          starts_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          type?: "subscription" | "batch"
          percentage?: number
          duration?: number
          used?: number
          is_active?: boolean
          note?: string | null
          created_by?: string | null
          starts_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_pricing: {
        Row: {
          id: string
          company_id: string
          tag_tiers: Json
          card_tiers: Json
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          tag_tiers?: Json
          card_tiers?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          tag_tiers?: Json
          card_tiers?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_pricing_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          id: string
          company_id: string
          type: "subscription" | "batch"
          status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
          subtotal: number
          discount_amount: number
          amount: number
          discount_id: string | null
          discount_percentage: number | null
          due_date: string
          paid_at: string | null
          paystack_payment_link: string | null
          paystack_reference: string | null
          batch_id: string | null
          subscription_id: string | null
          period_start: string | null
          period_end: string | null
          reminder_3_sent_at: string | null
          reminder_7_sent_at: string | null
          reminder_14_sent_at: string | null
          suspended_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          type: "subscription" | "batch"
          status?: "draft" | "sent" | "paid" | "overdue" | "cancelled"
          subtotal: number
          discount_amount?: number
          amount: number
          discount_id?: string | null
          discount_percentage?: number | null
          due_date: string
          paid_at?: string | null
          paystack_payment_link?: string | null
          paystack_reference?: string | null
          batch_id?: string | null
          subscription_id?: string | null
          period_start?: string | null
          period_end?: string | null
          reminder_3_sent_at?: string | null
          reminder_7_sent_at?: string | null
          reminder_14_sent_at?: string | null
          suspended_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          type?: "subscription" | "batch"
          status?: "draft" | "sent" | "paid" | "overdue" | "cancelled"
          subtotal?: number
          discount_amount?: number
          amount?: number
          discount_id?: string | null
          discount_percentage?: number | null
          due_date?: string
          paid_at?: string | null
          paystack_payment_link?: string | null
          paystack_reference?: string | null
          batch_id?: string | null
          subscription_id?: string | null
          period_start?: string | null
          period_end?: string | null
          reminder_3_sent_at?: string | null
          reminder_7_sent_at?: string | null
          reminder_14_sent_at?: string | null
          suspended_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "tag_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          quantity: number
          unit_price: number
          total: number
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          description: string
          quantity?: number
          unit_price: number
          total: number
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          description?: string
          quantity?: number
          unit_price?: number
          total?: number
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          id: string
          invoice_id: string
          paystack_reference: string
          amount: number
          paid_at: string
          paystack_payload: Json | null
        }
        Insert: {
          id?: string
          invoice_id: string
          paystack_reference: string
          amount: number
          paid_at?: string
          paystack_payload?: Json | null
        }
        Update: {
          id?: string
          invoice_id?: string
          paystack_reference?: string
          amount?: number
          paid_at?: string
          paystack_payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
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
      tag_replacements: {
        Row: {
          created_at: string
          id: string
          initiated_by: string
          medium: string
          new_tag_id: string
          old_tag_id: string
          owner_notified: boolean
          product_id: string
          reason: string
        }
        Insert: {
          created_at?: string
          id?: string
          initiated_by: string
          medium: string
          new_tag_id: string
          old_tag_id: string
          owner_notified?: boolean
          product_id: string
          reason: string
        }
        Update: {
          created_at?: string
          id?: string
          initiated_by?: string
          medium?: string
          new_tag_id?: string
          old_tag_id?: string
          owner_notified?: boolean
          product_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "tag_replacements_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_replacements_new_tag_id_fkey"
            columns: ["new_tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_replacements_old_tag_id_fkey"
            columns: ["old_tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_replacements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
          from_country: string | null
          from_owner_id: string
          id: string
          sale_price: number | null
          status: string
          tag_id: string
          to_country: string | null
          to_email: string
          to_name: string
        }
        Insert: {
          acceptance_token?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          expires_at?: string | null
          from_country?: string | null
          from_owner_id: string
          id?: string
          sale_price?: number | null
          status?: string
          tag_id: string
          to_country?: string | null
          to_email: string
          to_name: string
        }
        Update: {
          acceptance_token?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          expires_at?: string | null
          from_country?: string | null
          from_owner_id?: string
          id?: string
          sale_price?: number | null
          status?: string
          tag_id?: string
          to_country?: string | null
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
      replace_chip: {
        Args: {
          p_product_id: string
          p_old_tag_id: string
          p_new_tag_id: string
          p_medium: string
          p_reason: string
          p_initiated_by: string
        }
        Returns: { replacement_id: string; new_status: string }[]
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
  | "suspended"
  | "decommissioned";
export type TagMedium = "tag" | "card";
export type BatchType = "tags" | "cards" | "mixed";
export type ClaimStatus = "pending" | "approved" | "rejected" | "expired";
export type ReplacementReason =
  | "not_scanning"
  | "physically_damaged"
  | "missing_or_lost";
export type Industry = "fashion" | "arts" | "collectibles" | "restaurants" | "hotels";

// ── Billing ───────────────────────────────────────────────────────────────────
export type Plan = Database["public"]["Tables"]["plans"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type Discount = Database["public"]["Tables"]["discounts"]["Row"];
export type BrandPricing = Database["public"]["Tables"]["brand_pricing"]["Row"];
export type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
export type InvoiceLineItem = Database["public"]["Tables"]["invoice_line_items"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type SubscriptionStatus = Subscription["status"];
export type BillingInterval = Subscription["billing_interval"];
export type DiscountType = Discount["type"];
export type InvoiceType = Invoice["type"];
export type InvoiceStatus = Invoice["status"];
export interface VolumeTier {
  min: number;
  max: number | null;
  price_per_unit: number; // kobo
}
