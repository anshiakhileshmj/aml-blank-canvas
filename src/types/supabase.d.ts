declare module '@/integrations/supabase/types' {
  export interface Database {
    public: {
      Tables: {
        api_keys: {
          Row: {
            id: string;
            user_id: string;
            partner_id: string;
            name: string;
            key_hash: string;
            key_preview: string;
            environment: string;
            is_active: boolean;
            usage_count: number;
            last_used_at: string | null;
            created_at: string;
            updated_at: string;
          };
          Insert: {
            id?: string;
            user_id: string;
            partner_id: string;
            name: string;
            key_hash: string;
            key_preview: string;
            environment?: string;
            is_active?: boolean;
            usage_count?: number;
            last_used_at?: string | null;
            created_at?: string;
            updated_at?: string;
          };
          Update: {
            id?: string;
            user_id?: string;
            partner_id?: string;
            name?: string;
            key_hash?: string;
            key_preview?: string;
            environment?: string;
            is_active?: boolean;
            usage_count?: number;
            last_used_at?: string | null;
            created_at?: string;
            updated_at?: string;
          };
        };
        profiles: {
          Row: {
            id: string;
            user_id: string;
            partner_id: string;
            full_name: string | null;
            email: string | null;
            created_at: string;
            updated_at: string;
          };
          Insert: {
            id?: string;
            user_id: string;
            partner_id: string;
            full_name?: string | null;
            email?: string | null;
            created_at?: string;
            updated_at?: string;
          };
          Update: {
            id?: string;
            user_id?: string;
            partner_id?: string;
            full_name?: string | null;
            email?: string | null;
            created_at?: string;
            updated_at?: string;
          };
        };
        api_usage_logs: {
          Row: {
            id: string;
            api_key_id: string;
            partner_id: string;
            endpoint: string;
            method: string;
            response_time_ms: number | null;
            status_code: number;
            created_at: string;
          };
          Insert: {
            id?: string;
            api_key_id: string;
            partner_id: string;
            endpoint: string;
            method?: string;
            response_time_ms?: number | null;
            status_code: number;
            created_at?: string;
          };
          Update: {
            id?: string;
            api_key_id?: string;
            partner_id?: string;
            endpoint?: string;
            method?: string;
            response_time_ms?: number | null;
            status_code?: number;
            created_at?: string;
          };
        };
      };
      Views: {};
      Functions: {};
      Enums: {};
      CompositeTypes: {};
    };
  };
}