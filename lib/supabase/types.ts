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
      banners: {
        Row: {
          country: Database["public"]["Enums"]["country_code"] | null
          custom_image_path: string | null
          ends_at: string | null
          id: string
          image_id: string | null
          is_active: boolean | null
          placement: string
          sort_order: number | null
          starts_at: string | null
          target_url: string | null
          title: string | null
        }
        Insert: {
          country?: Database["public"]["Enums"]["country_code"] | null
          custom_image_path?: string | null
          ends_at?: string | null
          id?: string
          image_id?: string | null
          is_active?: boolean | null
          placement: string
          sort_order?: number | null
          starts_at?: string | null
          target_url?: string | null
          title?: string | null
        }
        Update: {
          country?: Database["public"]["Enums"]["country_code"] | null
          custom_image_path?: string | null
          ends_at?: string | null
          id?: string
          image_id?: string | null
          is_active?: boolean | null
          placement?: string
          sort_order?: number | null
          starts_at?: string | null
          target_url?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banners_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "product_images"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          id: string
          image_path: string | null
          name_en: string | null
          name_pt: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          id?: string
          image_path?: string | null
          name_en?: string | null
          name_pt: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          id?: string
          image_path?: string | null
          name_en?: string | null
          name_pt?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          attempts: number | null
          channel: Database["public"]["Enums"]["contact_channel"]
          created_at: string | null
          error: string | null
          id: number
          order_id: string | null
          payload: Json
          provider_message_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          template_key: string
        }
        Insert: {
          attempts?: number | null
          channel: Database["public"]["Enums"]["contact_channel"]
          created_at?: string | null
          error?: string | null
          id?: never
          order_id?: string | null
          payload: Json
          provider_message_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          template_key: string
        }
        Update: {
          attempts?: number | null
          channel?: Database["public"]["Enums"]["contact_channel"]
          created_at?: string | null
          error?: string | null
          id?: never
          order_id?: string | null
          payload?: Json
          provider_message_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          template_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string | null
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Update: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          from_status: Database["public"]["Enums"]["order_status"] | null
          id: number
          note: string | null
          order_id: string | null
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: never
          note?: string | null
          order_id?: string | null
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: never
          note?: string | null
          order_id?: string | null
          to_status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancelled_reason: string | null
          country: Database["public"]["Enums"]["country_code"]
          created_at: string | null
          currency: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          fulfillment: Database["public"]["Enums"]["fulfillment_type"]
          id: string
          notes: string | null
          order_number: string
          paid_at: string | null
          payment_instructions: string | null
          payment_method: string | null
          payment_reference: string | null
          pickup_date: string | null
          pickup_point_id: string | null
          preferred_channel: Database["public"]["Enums"]["contact_channel"]
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tracking_token: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cancelled_reason?: string | null
          country: Database["public"]["Enums"]["country_code"]
          created_at?: string | null
          currency: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          fulfillment?: Database["public"]["Enums"]["fulfillment_type"]
          id?: string
          notes?: string | null
          order_number: string
          paid_at?: string | null
          payment_instructions?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          pickup_date?: string | null
          pickup_point_id?: string | null
          preferred_channel?: Database["public"]["Enums"]["contact_channel"]
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tracking_token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cancelled_reason?: string | null
          country?: Database["public"]["Enums"]["country_code"]
          created_at?: string | null
          currency?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          fulfillment?: Database["public"]["Enums"]["fulfillment_type"]
          id?: string
          notes?: string | null
          order_number?: string
          paid_at?: string | null
          payment_instructions?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          pickup_date?: string | null
          pickup_point_id?: string | null
          preferred_channel?: Database["public"]["Enums"]["contact_channel"]
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tracking_token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_pickup_point_id_fkey"
            columns: ["pickup_point_id"]
            isOneToOne: false
            referencedRelation: "pickup_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_points: {
        Row: {
          address: string
          city: string
          country: Database["public"]["Enums"]["country_code"]
          hours: string | null
          id: string
          is_active: boolean | null
          maps_url: string | null
          name: string
        }
        Insert: {
          address: string
          city: string
          country: Database["public"]["Enums"]["country_code"]
          hours?: string | null
          id?: string
          is_active?: boolean | null
          maps_url?: string | null
          name: string
        }
        Update: {
          address?: string
          city?: string
          country?: Database["public"]["Enums"]["country_code"]
          hours?: string | null
          id?: string
          is_active?: boolean | null
          maps_url?: string | null
          name?: string
        }
        Relationships: []
      }
      product_country: {
        Row: {
          compare_at_price: number | null
          country: Database["public"]["Enums"]["country_code"]
          currency: string
          is_visible: boolean | null
          price: number
          product_id: string
          stock: number
        }
        Insert: {
          compare_at_price?: number | null
          country: Database["public"]["Enums"]["country_code"]
          currency: string
          is_visible?: boolean | null
          price: number
          product_id: string
          stock?: number
        }
        Update: {
          compare_at_price?: number | null
          country?: Database["public"]["Enums"]["country_code"]
          currency?: string
          is_visible?: boolean | null
          price?: number
          product_id?: string
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_country_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          id: string
          is_advertisable: boolean | null
          is_primary: boolean | null
          product_id: string | null
          sort_order: number | null
          storage_path_banner: string | null
          storage_path_card: string
          storage_path_detail: string
          storage_path_thumb: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          is_advertisable?: boolean | null
          is_primary?: boolean | null
          product_id?: string | null
          sort_order?: number | null
          storage_path_banner?: string | null
          storage_path_card: string
          storage_path_detail: string
          storage_path_thumb: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          is_advertisable?: boolean | null
          is_primary?: boolean | null
          product_id?: string | null
          sort_order?: number | null
          storage_path_banner?: string | null
          storage_path_card?: string
          storage_path_detail?: string
          storage_path_thumb?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category_id: string | null
          created_at: string | null
          description_en: string | null
          description_pt: string | null
          id: string
          is_active: boolean | null
          name: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          category_id?: string | null
          created_at?: string | null
          description_en?: string | null
          description_pt?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          category_id?: string | null
          created_at?: string | null
          description_en?: string | null
          description_pt?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          default_country: Database["public"]["Enums"]["country_code"] | null
          full_name: string | null
          id: string
          phone: string | null
          role: string
        }
        Insert: {
          created_at?: string | null
          default_country?: Database["public"]["Enums"]["country_code"] | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string
        }
        Update: {
          created_at?: string | null
          default_country?: Database["public"]["Enums"]["country_code"] | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          admin_reply: string | null
          body: string | null
          created_at: string | null
          customer_name: string
          id: string
          is_approved: boolean | null
          order_id: string | null
          product_id: string | null
          rating: number
        }
        Insert: {
          admin_reply?: string | null
          body?: string | null
          created_at?: string | null
          customer_name: string
          id?: string
          is_approved?: boolean | null
          order_id?: string | null
          product_id?: string | null
          rating: number
        }
        Update: {
          admin_reply?: string | null
          body?: string | null
          created_at?: string | null
          customer_name?: string
          id?: string
          is_approved?: boolean | null
          order_id?: string | null
          product_id?: string | null
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          key: string
          value: Json | null
        }
        Insert: {
          key: string
          value?: Json | null
        }
        Update: {
          key?: string
          value?: Json | null
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string | null
          notify_back_in_stock: boolean | null
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          notify_back_in_stock?: boolean | null
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          notify_back_in_stock?: boolean | null
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_order: {
        Args: {
          p_country: Database["public"]["Enums"]["country_code"]
          p_customer_email: string
          p_customer_name: string
          p_customer_phone: string
          p_items: Json
          p_notes: string
          p_pickup_point_id: string
          p_preferred_channel: Database["public"]["Enums"]["contact_channel"]
        }
        Returns: {
          order_id: string
          order_number: string
          tracking_token: string
        }[]
      }
      get_order_by_token: {
        Args: { p_tracking_token: string }
        Returns: {
          cancelled_reason: string | null
          country: Database["public"]["Enums"]["country_code"]
          created_at: string | null
          currency: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          fulfillment: Database["public"]["Enums"]["fulfillment_type"]
          id: string
          notes: string | null
          order_number: string
          paid_at: string | null
          payment_instructions: string | null
          payment_method: string | null
          payment_reference: string | null
          pickup_date: string | null
          pickup_point_id: string | null
          preferred_channel: Database["public"]["Enums"]["contact_channel"]
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tracking_token: string | null
          updated_at: string | null
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      contact_channel: "whatsapp" | "email"
      country_code: "AO" | "PT"
      fulfillment_type: "pickup"
      notification_status: "queued" | "sent" | "delivered" | "failed"
      order_status:
        | "pending_review"
        | "verified"
        | "awaiting_payment"
        | "paid"
        | "preparing"
        | "ready_for_pickup"
        | "completed"
        | "cancelled"
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
    Enums: {
      contact_channel: ["whatsapp", "email"],
      country_code: ["AO", "PT"],
      fulfillment_type: ["pickup"],
      notification_status: ["queued", "sent", "delivered", "failed"],
      order_status: [
        "pending_review",
        "verified",
        "awaiting_payment",
        "paid",
        "preparing",
        "ready_for_pickup",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
