export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type TagStatus =
  | "created" | "written" | "shipped" | "embedded"
  | "activated" | "unowned" | "claim_pending"
  | "owned" | "transfer_pending" | "flagged" | "suspended";

export type CompanyStatus = "pending" | "approved" | "rejected" | "suspended";
export type Industry = "fashion" | "arts" | "collectibles" | "restaurants" | "hotels";
export type ClaimStatus = "pending" | "approved" | "rejected" | "expired";
export type TransferStatus =
  | "otp_pending" | "otp_verified" | "awaiting_acceptance"
  | "completed" | "expired" | "cancelled";
export type AcquisitionType = "origin" | "transfer";

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          email: string;
          industry: Industry;
          status: CompanyStatus;
          logo_url: string | null;
          brand_primary_color: string;
          brand_secondary_color: string;
          brand_accent_color: string;
          brand_font: string;
          brand_story: string | null;
          custom_header_text: string | null;
          social_links: Json;
          created_at: string;
          approved_at: string | null;
          approved_by: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["companies"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["companies"]["Row"]>;
      };
      tags: {
        Row: {
          id: string;
          token: string;
          short_id: string;
          company_id: string;
          industry: Industry;
          batch_id: string | null;
          status: TagStatus;
          hmac_signature: string;
          created_at: string;
          activated_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["tags"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["tags"]["Row"]>;
      };
      tag_batches: {
        Row: {
          id: string;
          company_id: string;
          industry: Industry;
          batch_size: number;
          status: "pending" | "generated" | "written" | "shipped";
          notes: string | null;
          created_by: string | null;
          created_at: string;
          shipped_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["tag_batches"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["tag_batches"]["Row"]>;
      };
      products: {
        Row: {
          id: string;
          tag_id: string;
          company_id: string;
          name: string;
          industry_fields: Json;
          photos: string[];
          ai_persona_config: Json;
          retail_price: number | null;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["products"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
      };
      ownership_records: {
        Row: {
          id: string;
          tag_id: string;
          owner_name: string;
          owner_email: string;
          backup_email: string | null;
          acquisition_type: AcquisitionType;
          acquired_from_id: string | null;
          acquired_at: string;
          sale_price: number | null;
          currency: string;
          is_current: boolean;
          ended_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["ownership_records"]["Row"], "id" | "acquired_at">;
        Update: Partial<Database["public"]["Tables"]["ownership_records"]["Row"]>;
      };
      ownership_claims: {
        Row: {
          id: string;
          tag_id: string;
          claimant_name: string;
          claimant_email: string;
          claim_ip: string | null;
          claim_location: string | null;
          status: ClaimStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          rejection_reason: string | null;
          created_at: string;
          expires_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["ownership_claims"]["Row"], "id" | "created_at" | "expires_at">;
        Update: Partial<Database["public"]["Tables"]["ownership_claims"]["Row"]>;
      };
      transfer_requests: {
        Row: {
          id: string;
          tag_id: string;
          from_owner_id: string;
          to_name: string;
          to_email: string;
          sale_price: number | null;
          status: TransferStatus;
          acceptance_token: string | null;
          created_at: string;
          expires_at: string;
          completed_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["transfer_requests"]["Row"], "id" | "created_at" | "expires_at">;
        Update: Partial<Database["public"]["Tables"]["transfer_requests"]["Row"]>;
      };
      otp_codes: {
        Row: {
          id: string;
          email: string;
          code_hash: string;
          purpose: string;
          attempts: number;
          is_used: boolean;
          created_at: string;
          expires_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["otp_codes"]["Row"], "id" | "created_at" | "expires_at">;
        Update: Partial<Database["public"]["Tables"]["otp_codes"]["Row"]>;
      };
      scan_logs: {
        Row: {
          id: string;
          tag_id: string;
          ip_address: string | null;
          user_agent: string | null;
          geo_location: Json | null;
          session_id: string | null;
          scan_result: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["scan_logs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["scan_logs"]["Row"]>;
      };
      audit_log: {
        Row: {
          id: string;
          table_name: string;
          record_id: string;
          action: string;
          field_changed: string | null;
          old_value: Json | null;
          new_value: Json | null;
          changed_by: string | null;
          changed_by_role: string | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["audit_log"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["audit_log"]["Row"]>;
      };
      industry_waitlist: {
        Row: {
          id: string;
          company_id: string | null;
          industry: "restaurants" | "hotels";
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["industry_waitlist"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["industry_waitlist"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
