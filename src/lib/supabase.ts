import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          name: string | null
          avatar_url: string | null
          role: string
          subscription_tier: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          name?: string | null
          avatar_url?: string | null
          role?: string
          subscription_tier?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          name?: string | null
          avatar_url?: string | null
          role?: string
          subscription_tier?: string
          created_at?: string
          updated_at?: string
        }
      }
      business_cards: {
        Row: {
          id: string
          user_id: string
          title: string | null
          company: string | null
          position: string | null
          phone: string | null
          email: string | null
          website: string | null
          avatar_url: string | null
          bio: string | null
          whatsapp: string | null
          address: string | null
          map_link: string | null
          theme: Json | null
          shape: string
          layout: Json | null
          is_published: boolean
          view_count: number
          slug: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          company?: string | null
          position?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          avatar_url?: string | null
          bio?: string | null
          whatsapp?: string | null
          address?: string | null
          map_link?: string | null
          theme?: Json | null
          shape?: string
          layout?: Json | null
          is_published?: boolean
          view_count?: number
          slug?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          company?: string | null
          position?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          avatar_url?: string | null
          bio?: string | null
          whatsapp?: string | null
          address?: string | null
          map_link?: string | null
          theme?: Json | null
          shape?: string
          layout?: Json | null
          is_published?: boolean
          view_count?: number
          slug?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      social_links: {
        Row: {
          id: string
          card_id: string
          platform: string
          username: string | null
          url: string
          display_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          card_id: string
          platform: string
          username?: string | null
          url: string
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          card_id?: string
          platform?: string
          username?: string | null
          url?: string
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
      }
      card_analytics: {
        Row: {
          id: string
          card_id: string
          visitor_ip: string | null
          user_agent: string | null
          referrer: string | null
          country: string | null
          city: string | null
          device_type: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          card_id: string
          visitor_ip?: string | null
          user_agent?: string | null
          referrer?: string | null
          country?: string | null
          city?: string | null
          device_type?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          card_id?: string
          visitor_ip?: string | null
          user_agent?: string | null
          referrer?: string | null
          country?: string | null
          city?: string | null
          device_type?: string | null
          viewed_at?: string
        }
      }
      card_templates: {
        Row: {
          id: string
          name: string
          description: string | null
          preview_image: string | null
          theme: Json
          layout: Json
          is_premium: boolean
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          preview_image?: string | null
          theme: Json
          layout: Json
          is_premium?: boolean
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          preview_image?: string | null
          theme?: Json
          layout?: Json
          is_premium?: boolean
          is_active?: boolean
          created_at?: string
        }
      }
    }
  }
}