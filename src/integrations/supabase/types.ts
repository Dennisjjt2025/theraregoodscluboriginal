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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      drop_images: {
        Row: {
          alt_text: string | null
          created_at: string
          drop_id: string
          id: string
          image_url: string
          sort_order: number
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          drop_id: string
          id?: string
          image_url: string
          sort_order?: number
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          drop_id?: string
          id?: string
          image_url?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "drop_images_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops"
            referencedColumns: ["id"]
          },
        ]
      }
      drop_interests: {
        Row: {
          created_at: string | null
          drop_id: string
          email: string
          id: string
          member_id: string | null
          notified_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          drop_id: string
          email: string
          id?: string
          member_id?: string | null
          notified_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          drop_id?: string
          email?: string
          id?: string
          member_id?: string | null
          notified_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drop_interests_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drop_interests_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      drop_participation: {
        Row: {
          created_at: string | null
          drop_id: string
          id: string
          member_id: string
          purchased: boolean | null
          quantity: number | null
          shopify_order_id: string | null
        }
        Insert: {
          created_at?: string | null
          drop_id: string
          id?: string
          member_id: string
          purchased?: boolean | null
          quantity?: number | null
          shopify_order_id?: string | null
        }
        Update: {
          created_at?: string | null
          drop_id?: string
          id?: string
          member_id?: string
          purchased?: boolean | null
          quantity?: number | null
          shopify_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drop_participation_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drop_participation_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      drops: {
        Row: {
          created_at: string | null
          description_en: string | null
          description_nl: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_draft: boolean | null
          is_public: boolean | null
          origin: string | null
          price: number
          quantity_available: number
          quantity_sold: number | null
          shopify_product_id: string | null
          starts_at: string
          story_en: string | null
          story_nl: string | null
          tasting_notes_en: string | null
          tasting_notes_nl: string | null
          title_en: string
          title_nl: string
          updated_at: string | null
          video_url: string | null
          vintage: string | null
        }
        Insert: {
          created_at?: string | null
          description_en?: string | null
          description_nl?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_draft?: boolean | null
          is_public?: boolean | null
          origin?: string | null
          price: number
          quantity_available: number
          quantity_sold?: number | null
          shopify_product_id?: string | null
          starts_at: string
          story_en?: string | null
          story_nl?: string | null
          tasting_notes_en?: string | null
          tasting_notes_nl?: string | null
          title_en: string
          title_nl: string
          updated_at?: string | null
          video_url?: string | null
          vintage?: string | null
        }
        Update: {
          created_at?: string | null
          description_en?: string | null
          description_nl?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_draft?: boolean | null
          is_public?: boolean | null
          origin?: string | null
          price?: number
          quantity_available?: number
          quantity_sold?: number | null
          shopify_product_id?: string | null
          starts_at?: string
          story_en?: string | null
          story_nl?: string | null
          tasting_notes_en?: string | null
          tasting_notes_nl?: string | null
          title_en?: string
          title_nl?: string
          updated_at?: string | null
          video_url?: string | null
          vintage?: string | null
        }
        Relationships: []
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string | null
          id: string
          member_id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          member_id: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          member_id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invite_codes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_codes_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          created_at: string | null
          id: string
          invited_by: string | null
          invites_remaining: number | null
          notes: string | null
          status: Database["public"]["Enums"]["member_status"]
          strike_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          invites_remaining?: number | null
          notes?: string | null
          status?: Database["public"]["Enums"]["member_status"]
          strike_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          invites_remaining?: number | null
          notes?: string | null
          status?: Database["public"]["Enums"]["member_status"]
          strike_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      preference_categories: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          key: string
          label_en: string
          label_nl: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          label_en: string
          label_nl: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          label_en?: string
          label_nl?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          email_verified: boolean | null
          first_name: string | null
          house_number: string | null
          id: string
          last_name: string | null
          phone: string | null
          postal_code: string | null
          preferences: string[] | null
          street_address: string | null
          updated_at: string | null
          verification_token: string | null
          verification_token_expires_at: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          email_verified?: boolean | null
          first_name?: string | null
          house_number?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          postal_code?: string | null
          preferences?: string[] | null
          street_address?: string | null
          updated_at?: string | null
          verification_token?: string | null
          verification_token_expires_at?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          email_verified?: boolean | null
          first_name?: string | null
          house_number?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          postal_code?: string | null
          preferences?: string[] | null
          street_address?: string | null
          updated_at?: string | null
          verification_token?: string | null
          verification_token_expires_at?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value_en: string | null
          value_nl: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value_en?: string | null
          value_nl?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value_en?: string | null
          value_nl?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_drop_participation_report: {
        Args: { drop_id_param: string }
        Returns: {
          email: string
          member_id: string
          notes: string
          purchased: boolean
          status: string
          strike_count: number
          user_id: string
        }[]
      }
      get_member_emails: {
        Args: never
        Returns: {
          email: string
          email_verified: boolean
          member_id: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_member: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "member"
      member_status: "active" | "suspended" | "pending"
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
      app_role: ["admin", "member"],
      member_status: ["active", "suspended", "pending"],
    },
  },
} as const
