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
        PostgrestVersion: "12.2.3 (519615d)"
    }
    public: {
        Tables: {
            alerts: {
                Row: {
                    ci_event_id: string | null
                    id: string
                    request_id: string | null
                    title: string | null
                    type: string | null
                    user_id: string | null
                    viewed: boolean | null
                }
                Insert: {
                    ci_event_id?: string | null
                    id?: string
                    request_id?: string | null
                    title?: string | null
                    type?: string | null
                    user_id?: string | null
                    viewed?: boolean | null
                }
                Update: {
                    ci_event_id?: string | null
                    id?: string
                    request_id?: string | null
                    title?: string | null
                    type?: string | null
                    user_id?: string | null
                    viewed?: boolean | null
                }
                Relationships: [
                    {
                        foreignKeyName: "alerts_ci_event_id_fkey"
                        columns: ["ci_event_id"]
                        isOneToOne: false
                        referencedRelation: "ci_events"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "alerts_request_id_fkey"
                        columns: ["request_id"]
                        isOneToOne: false
                        referencedRelation: "requests"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "alerts_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            ci_events: {
                Row: {
                    address: Json
                    cancelled: boolean | null
                    cancelled_text: string | null
                    created_at: string
                    description: string
                    district: string
                    end_date: string | null
                    hide: boolean
                    id: string
                    is_multi_day: boolean | null
                    is_notified: boolean | null
                    links: Json[]
                    lng_titles: Json | null
                    multi_day_teachers: Json[] | null
                    organisations: Json[]
                    owners: Json[]
                    price: Json[]
                    recurring_ref_key: string | null
                    segments: Json[]
                    short_id: string | null
                    source_template_id: string | null
                    start_date: string | null
                    title: string
                    type: string
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    address: Json
                    cancelled?: boolean | null
                    cancelled_text?: string | null
                    created_at?: string
                    description?: string
                    district?: string
                    end_date?: string | null
                    hide: boolean
                    id?: string
                    is_multi_day?: boolean | null
                    is_notified?: boolean | null
                    links: Json[]
                    lng_titles?: Json | null
                    multi_day_teachers?: Json[] | null
                    organisations?: Json[]
                    owners: Json[]
                    price: Json[]
                    recurring_ref_key?: string | null
                    segments: Json[]
                    short_id?: string | null
                    source_template_id?: string | null
                    start_date?: string | null
                    title?: string
                    type?: string
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    address?: Json
                    cancelled?: boolean | null
                    cancelled_text?: string | null
                    created_at?: string
                    description?: string
                    district?: string
                    end_date?: string | null
                    hide?: boolean
                    id?: string
                    is_multi_day?: boolean | null
                    is_notified?: boolean | null
                    links?: Json[]
                    lng_titles?: Json | null
                    multi_day_teachers?: Json[] | null
                    organisations?: Json[]
                    owners?: Json[]
                    price?: Json[]
                    recurring_ref_key?: string | null
                    segments?: Json[]
                    short_id?: string | null
                    source_template_id?: string | null
                    start_date?: string | null
                    title?: string
                    type?: string
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "ci_events_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "ci-events_source_template_id_fkey"
                        columns: ["source_template_id"]
                        isOneToOne: false
                        referencedRelation: "templates"
                        referencedColumns: ["id"]
                    },
                ]
            }
            ci_events_users_junction: {
                Row: {
                    ci_event_id: string
                    created_at: string
                    id: string
                    user_id: string
                }
                Insert: {
                    ci_event_id: string
                    created_at?: string
                    id?: string
                    user_id: string
                }
                Update: {
                    ci_event_id?: string
                    created_at?: string
                    id?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "ci_events_users_junction_ci_event_id_fkey"
                        columns: ["ci_event_id"]
                        isOneToOne: false
                        referencedRelation: "ci_events"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "ci_events_users_junction_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "public_bio"
                        referencedColumns: ["user_id"]
                    },
                ]
            }
            config: {
                Row: {
                    created_at: string
                    data: string | null
                    flag: boolean
                    id: number
                    title: string | null
                    update_by: string | null
                }
                Insert: {
                    created_at?: string
                    data?: string | null
                    flag?: boolean
                    id?: number
                    title?: string | null
                    update_by?: string | null
                }
                Update: {
                    created_at?: string
                    data?: string | null
                    flag?: boolean
                    id?: number
                    title?: string | null
                    update_by?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "config_update_by_fkey"
                        columns: ["update_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            notifications: {
                Row: {
                    ci_event_id: string | null
                    created_at: string
                    id: string
                    remind_in_hours: string | null
                    sent: boolean
                    type: string | null
                    user_id: string | null
                }
                Insert: {
                    ci_event_id?: string | null
                    created_at?: string
                    id?: string
                    remind_in_hours?: string | null
                    sent?: boolean
                    type?: string | null
                    user_id?: string | null
                }
                Update: {
                    ci_event_id?: string | null
                    created_at?: string
                    id?: string
                    remind_in_hours?: string | null
                    sent?: boolean
                    type?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "notifications_ci_event_id_fkey"
                        columns: ["ci_event_id"]
                        isOneToOne: false
                        referencedRelation: "ci_events"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "notifications_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            public_bio: {
                Row: {
                    about: string | null
                    allow_tagging: boolean | null
                    bio_name: string
                    created_at: string
                    id: string
                    img: string | null
                    lang_names: Json | null
                    page_title: string | null
                    page_title_2: string | null
                    page_url: string | null
                    page_url_2: string | null
                    show_profile: boolean | null
                    user_id: string
                    user_type: string | null
                }
                Insert: {
                    about?: string | null
                    allow_tagging?: boolean | null
                    bio_name?: string
                    created_at?: string
                    id?: string
                    img?: string | null
                    lang_names?: Json | null
                    page_title?: string | null
                    page_title_2?: string | null
                    page_url?: string | null
                    page_url_2?: string | null
                    show_profile?: boolean | null
                    user_id: string
                    user_type?: string | null
                }
                Update: {
                    about?: string | null
                    allow_tagging?: boolean | null
                    bio_name?: string
                    created_at?: string
                    id?: string
                    img?: string | null
                    lang_names?: Json | null
                    page_title?: string | null
                    page_title_2?: string | null
                    page_url?: string | null
                    page_url_2?: string | null
                    show_profile?: boolean | null
                    user_id?: string
                    user_type?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "public_bio_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            requests: {
                Row: {
                    admins_notified: boolean | null
                    closed: boolean | null
                    created_at: string
                    email: string | null
                    id: string
                    message: string | null
                    name: string | null
                    number: number
                    phone: string | null
                    responses: Json[]
                    sent: boolean | null
                    status: string | null
                    to_send: boolean | null
                    type: string | null
                    user_id: string | null
                    viewed: boolean | null
                    viewed_by: Json[] | null
                    viewed_response: boolean | null
                }
                Insert: {
                    admins_notified?: boolean | null
                    closed?: boolean | null
                    created_at?: string
                    email?: string | null
                    id?: string
                    message?: string | null
                    name?: string | null
                    number?: number
                    phone?: string | null
                    responses: Json[]
                    sent?: boolean | null
                    status?: string | null
                    to_send?: boolean | null
                    type?: string | null
                    user_id?: string | null
                    viewed?: boolean | null
                    viewed_by?: Json[] | null
                    viewed_response?: boolean | null
                }
                Update: {
                    admins_notified?: boolean | null
                    closed?: boolean | null
                    created_at?: string
                    email?: string | null
                    id?: string
                    message?: string | null
                    name?: string | null
                    number?: number
                    phone?: string | null
                    responses?: Json[]
                    sent?: boolean | null
                    status?: string | null
                    to_send?: boolean | null
                    type?: string | null
                    user_id?: string | null
                    viewed?: boolean | null
                    viewed_by?: Json[] | null
                    viewed_response?: boolean | null
                }
                Relationships: [
                    {
                        foreignKeyName: "requests_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            roles: {
                Row: {
                    id: number
                    role: string | null
                }
                Insert: {
                    id?: number
                    role?: string | null
                }
                Update: {
                    id?: number
                    role?: string | null
                }
                Relationships: []
            }
            templates: {
                Row: {
                    address: Json | null
                    created_at: string
                    description: string | null
                    district: string | null
                    id: string
                    is_multi_day: boolean | null
                    links: Json[] | null
                    multi_day_teachers: Json[] | null
                    name: string | null
                    organisations: Json[]
                    owners: Json[] | null
                    price: Json[] | null
                    segments: Json[] | null
                    title: string | null
                    type: string | null
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    address?: Json | null
                    created_at?: string
                    description?: string | null
                    district?: string | null
                    id?: string
                    is_multi_day?: boolean | null
                    links?: Json[] | null
                    multi_day_teachers?: Json[] | null
                    name?: string | null
                    organisations?: Json[]
                    owners?: Json[] | null
                    price?: Json[] | null
                    segments?: Json[] | null
                    title?: string | null
                    type?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    address?: Json | null
                    created_at?: string
                    description?: string | null
                    district?: string | null
                    id?: string
                    is_multi_day?: boolean | null
                    links?: Json[] | null
                    multi_day_teachers?: Json[] | null
                    name?: string | null
                    organisations?: Json[]
                    owners?: Json[] | null
                    price?: Json[] | null
                    segments?: Json[] | null
                    title?: string | null
                    type?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "templates_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            user_roles: {
                Row: {
                    created_at: string
                    id: string
                    role_id: number | null
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    role_id?: number | null
                    user_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    role_id?: number | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_roles_role_id_fkey"
                        columns: ["role_id"]
                        isOneToOne: false
                        referencedRelation: "roles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "user_roles_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            users: {
                Row: {
                    created_at: string
                    email: string
                    fcm_token: string | null
                    id: string
                    is_internal: boolean | null
                    last_signin: string | null
                    phone: string
                    provider: string | null
                    push_notification_tokens: Json[]
                    pwa_install_id: string | null
                    receive_notifications: boolean
                    receive_weekly_schedule: boolean | null
                    subscribed_for_updates_at: string | null
                    subscriptions: Json | null
                    updated_at: string | null
                    user_name: string
                    user_type: string
                    version: string | null
                    weekly_schedule: Json | null
                }
                Insert: {
                    created_at?: string
                    email?: string
                    fcm_token?: string | null
                    id?: string
                    is_internal?: boolean | null
                    last_signin?: string | null
                    phone: string
                    provider?: string | null
                    push_notification_tokens?: Json[]
                    pwa_install_id?: string | null
                    receive_notifications?: boolean
                    receive_weekly_schedule?: boolean | null
                    subscribed_for_updates_at?: string | null
                    subscriptions?: Json | null
                    updated_at?: string | null
                    user_name: string
                    user_type: string
                    version?: string | null
                    weekly_schedule?: Json | null
                }
                Update: {
                    created_at?: string
                    email?: string
                    fcm_token?: string | null
                    id?: string
                    is_internal?: boolean | null
                    last_signin?: string | null
                    phone?: string
                    provider?: string | null
                    push_notification_tokens?: Json[]
                    pwa_install_id?: string | null
                    receive_notifications?: boolean
                    receive_weekly_schedule?: boolean | null
                    subscribed_for_updates_at?: string | null
                    subscriptions?: Json | null
                    updated_at?: string | null
                    user_name?: string
                    user_type?: string
                    version?: string | null
                    weekly_schedule?: Json | null
                }
                Relationships: []
            }
            wa_messages: {
                Row: {
                    blob: Json | null
                    Body: string | null
                    created_at: string
                    id: string
                    MessageType: string | null
                    processing_time_ms: string | null
                    ProfileName: string | null
                    user_id: string | null
                    WaId: string | null
                }
                Insert: {
                    blob?: Json | null
                    Body?: string | null
                    created_at?: string
                    id?: string
                    MessageType?: string | null
                    processing_time_ms?: string | null
                    ProfileName?: string | null
                    user_id?: string | null
                    WaId?: string | null
                }
                Update: {
                    blob?: Json | null
                    Body?: string | null
                    created_at?: string
                    id?: string
                    MessageType?: string | null
                    processing_time_ms?: string | null
                    ProfileName?: string | null
                    user_id?: string | null
                    WaId?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "wa-messages_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "wa_users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            wa_twilio_logs: {
                Row: {
                    created_at: string
                    from: string | null
                    id: string
                    result: Json | null
                    to: string | null
                    trigger: string | null
                    wa_messages_id: string | null
                    wa_users_id: string | null
                }
                Insert: {
                    created_at?: string
                    from?: string | null
                    id?: string
                    result?: Json | null
                    to?: string | null
                    trigger?: string | null
                    wa_messages_id?: string | null
                    wa_users_id?: string | null
                }
                Update: {
                    created_at?: string
                    from?: string | null
                    id?: string
                    result?: Json | null
                    to?: string | null
                    trigger?: string | null
                    wa_messages_id?: string | null
                    wa_users_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "wa_twilio_logs_wa_messages_id_fkey"
                        columns: ["wa_messages_id"]
                        isOneToOne: false
                        referencedRelation: "wa_messages"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "wa_twilio_logs_wa_users_id_fkey"
                        columns: ["wa_users_id"]
                        isOneToOne: false
                        referencedRelation: "wa_users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            wa_users: {
                Row: {
                    created_at: string
                    filter: string[] | null
                    id: string
                    is_blocked: boolean | null
                    is_subscribed: boolean | null
                    message_count: number | null
                    name: string | null
                    phone: string
                    received_block_notice: boolean | null
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string
                    filter?: string[] | null
                    id?: string
                    is_blocked?: boolean | null
                    is_subscribed?: boolean | null
                    message_count?: number | null
                    name?: string | null
                    phone: string
                    received_block_notice?: boolean | null
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string
                    filter?: string[] | null
                    id?: string
                    is_blocked?: boolean | null
                    is_subscribed?: boolean | null
                    message_count?: number | null
                    name?: string | null
                    phone?: string
                    received_block_notice?: boolean | null
                    updated_at?: string | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            check_user_is_admin: { Args: { user_id: string }; Returns: boolean }
            has_admin_role: { Args: never; Returns: boolean }
            has_creator_role: { Args: never; Returns: boolean }
            has_profile_role: { Args: never; Returns: boolean }
            insert_user_role: {
                Args: { p_role_id: number; p_user_id_param: string }
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
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
        | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends (DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
        ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
              DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
        : never) = never,
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
    TableName extends (DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
        : never) = never,
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
    TableName extends (DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
        : never) = never,
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
    EnumName extends (DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
        : never) = never,
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
    CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
        ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
        : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
      ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
      : never

export const Constants = {
    public: {
        Enums: {},
    },
} as const
