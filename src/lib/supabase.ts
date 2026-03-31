import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a mock client if env vars are missing (for development/preview)
const createSupabaseClient = (): SupabaseClient => {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase environment variables not set. Some features may not work.');
    // Return a client with empty URL - will fail gracefully on API calls
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }
  return createClient(supabaseUrl, supabaseKey);
};

export const supabase = createSupabaseClient();
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

// Type definitions for Supabase tables
export interface Database {
  public: {
    Tables: {
      tests: {
        Row: {
          id: string;
          name: string;
          slug: string;
          secret_code: string;
          time_limit: number;
          created_at: string;
          updated_at: string;
          is_active: boolean;
          admin_id: string;
          shuffle_questions: boolean;
          shuffle_options: boolean;
        };
        Insert: Omit<Database['public']['Tables']['tests']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tests']['Update']>;
      };
      questions: {
        Row: {
          id: string;
          test_id: string;
          question: string;
          options: string[];
          correct_answer: number;
          explanation: string;
          created_at: string;
          display_order: number;
        };
        Insert: Omit<Database['public']['Tables']['questions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['questions']['Update']>;
      };
      attempts: {
        Row: {
          id: string;
          test_id: string;
          telegram_username: string;
          answers: (number | null)[];
          score: number;
          total_questions: number;
          started_at: string;
          submitted_at: string;
          warnings: number;
          auto_submitted: boolean;
          created_at: string;
          device_fingerprint: string;
          ip_address: string;
          user_agent: string;
        };
        Insert: Omit<Database['public']['Tables']['attempts']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['attempts']['Update']>;
      };
      cheat_violations: {
        Row: {
          id: string;
          attempt_id: string;
          violation_type: string;
          violation_details: string;
          created_at: string;
          timestamp: string;
        };
        Insert: Omit<Database['public']['Tables']['cheat_violations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['cheat_violations']['Update']>;
      };
      admin_users: {
        Row: {
          id: string;
          username: string;
          password_hash: string;
          created_at: string;
          updated_at: string;
          is_active: boolean;
        };
        Insert: Omit<Database['public']['Tables']['admin_users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['admin_users']['Update']>;
      };
    };
  };
}
