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
      accounts_receivable: {
        Row: {
          amount: number
          client_id: string | null
          client_name: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_received: boolean
          payment_method: string | null
          received_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          client_id?: string | null
          client_name: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_received?: boolean
          payment_method?: string | null
          received_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          client_name?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_received?: boolean
          payment_method?: string | null
          received_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          cancel_token: string | null
          check_in_at: string | null
          check_out_at: string | null
          client_id: string | null
          created_at: string
          employee_commission: number | null
          employee_id: string | null
          id: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          price: number | null
          scheduled_date: string
          scheduled_time: string
          service_id: string | null
          source: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          cancel_token?: string | null
          check_in_at?: string | null
          check_out_at?: string | null
          client_id?: string | null
          created_at?: string
          employee_commission?: number | null
          employee_id?: string | null
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          price?: number | null
          scheduled_date: string
          scheduled_time: string
          service_id?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          cancel_token?: string | null
          check_in_at?: string | null
          check_out_at?: string | null
          client_id?: string | null
          created_at?: string
          employee_commission?: number | null
          employee_id?: string | null
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          price?: number | null
          scheduled_date?: string
          scheduled_time?: string
          service_id?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          source: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          source?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          source?: string | null
          user_id?: string
        }
        Relationships: []
      }
      business_settings: {
        Row: {
          address: string | null
          allow_client_cancellation: boolean | null
          allow_online_booking: boolean | null
          business_name: string | null
          cancellation_limit_hours: number | null
          city: string | null
          created_at: string
          currency: string | null
          default_appointment_duration: number | null
          document: string | null
          email: string | null
          evolution_instance_name: string | null
          id: string
          instagram: string | null
          logo_url: string | null
          max_advance_days: number | null
          max_simultaneous_vehicles: number | null
          min_advance_hours: number | null
          note_footer_message: string | null
          phone: string | null
          primary_color: string | null
          public_booking_enabled: boolean | null
          public_booking_slug: string | null
          reminder_hours_before: number | null
          send_reminders: boolean | null
          service_interval_minutes: number | null
          show_employee_commission: boolean
          show_service_values_to_employees: boolean
          state: string | null
          timezone: string | null
          updated_at: string
          user_id: string
          website: string | null
          whatsapp: string | null
          whatsapp_auto_register_enabled: boolean
          whatsapp_followup_days: number
          whatsapp_followup_enabled: boolean
          whatsapp_followup_message: string
          whatsapp_reminder_message: string
          store_enabled: boolean
          store_show_services: boolean
          store_show_products: boolean
          store_whatsapp: string | null
          store_whatsapp_message: string | null
          working_hours: Json | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          allow_client_cancellation?: boolean | null
          allow_online_booking?: boolean | null
          business_name?: string | null
          cancellation_limit_hours?: number | null
          city?: string | null
          created_at?: string
          currency?: string | null
          default_appointment_duration?: number | null
          document?: string | null
          email?: string | null
          evolution_instance_name?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          max_advance_days?: number | null
          max_simultaneous_vehicles?: number | null
          min_advance_hours?: number | null
          note_footer_message?: string | null
          phone?: string | null
          primary_color?: string | null
          public_booking_enabled?: boolean | null
          public_booking_slug?: string | null
          reminder_hours_before?: number | null
          send_reminders?: boolean | null
          service_interval_minutes?: number | null
          show_employee_commission?: boolean
          show_service_values_to_employees?: boolean
          state?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
          whatsapp?: string | null
          whatsapp_auto_register_enabled?: boolean
          whatsapp_followup_days?: number
          whatsapp_followup_enabled?: boolean
          whatsapp_followup_message?: string
          whatsapp_reminder_message?: string
          store_enabled?: boolean
          store_show_services?: boolean
          store_show_products?: boolean
          store_whatsapp?: string | null
          store_whatsapp_message?: string | null
          working_hours?: Json | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          allow_client_cancellation?: boolean | null
          allow_online_booking?: boolean | null
          business_name?: string | null
          cancellation_limit_hours?: number | null
          city?: string | null
          created_at?: string
          currency?: string | null
          default_appointment_duration?: number | null
          document?: string | null
          email?: string | null
          evolution_instance_name?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          max_advance_days?: number | null
          max_simultaneous_vehicles?: number | null
          min_advance_hours?: number | null
          note_footer_message?: string | null
          phone?: string | null
          primary_color?: string | null
          public_booking_enabled?: boolean | null
          public_booking_slug?: string | null
          reminder_hours_before?: number | null
          send_reminders?: boolean | null
          service_interval_minutes?: number | null
          show_employee_commission?: boolean
          show_service_values_to_employees?: boolean
          state?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
          whatsapp?: string | null
          whatsapp_auto_register_enabled?: boolean
          whatsapp_followup_days?: number
          whatsapp_followup_enabled?: boolean
          whatsapp_followup_message?: string
          working_hours?: Json | null
          zip_code?: string | null
        }
        Relationships: []
      }
      cash_drawer: {
        Row: {
          created_at: string
          drawer_date: string
          id: string
          notes: string | null
          opening_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          drawer_date: string
          id?: string
          notes?: string | null
          opening_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          drawer_date?: string
          id?: string
          notes?: string | null
          opening_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_packages: {
        Row: {
          client_id: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          package_name: string
          price_paid: number
          purchased_at: string | null
          service_id: string | null
          total_credits: number
          updated_at: string
          used_credits: number
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          package_name: string
          price_paid: number
          purchased_at?: string | null
          service_id?: string | null
          total_credits: number
          updated_at?: string
          used_credits?: number
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          package_name?: string
          price_paid?: number
          purchased_at?: string | null
          service_id?: string | null
          total_credits?: number
          updated_at?: string
          used_credits?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_packages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_packages_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      client_followups: {
        Row: {
          appointment_id: string | null
          client_id: string
          created_at: string
          due_date: string
          id: string
          sent_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          client_id: string
          created_at?: string
          due_date: string
          id?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          client_id?: string
          created_at?: string
          due_date?: string
          id?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_followups_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_followups_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_categories: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      employee_accounts: {
        Row: {
          access_code: string
          created_at: string
          employee_id: string | null
          id: string
          is_active: boolean
          last_login_at: string | null
          owner_user_id: string
          role: Database["public"]["Enums"]["business_role"]
          updated_at: string
        }
        Insert: {
          access_code: string
          created_at?: string
          employee_id?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          owner_user_id: string
          role?: Database["public"]["Enums"]["business_role"]
          updated_at?: string
        }
        Update: {
          access_code?: string
          created_at?: string
          employee_id?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          owner_user_id?: string
          role?: Database["public"]["Enums"]["business_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_accounts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_advances: {
        Row: {
          advance_date: string
          amount: number
          created_at: string
          employee_id: string
          id: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          advance_date?: string
          amount: number
          created_at?: string
          employee_id: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          advance_date?: string
          amount?: number
          created_at?: string
          employee_id?: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_advances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_earnings: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          earning_date: string
          employee_id: string
          id: string
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          earning_date?: string
          employee_id: string
          id?: string
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          earning_date?: string
          employee_id?: string
          id?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_earnings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_payments: {
        Row: {
          amount: number
          created_at: string
          employee_id: string
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          employee_id: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          employee_id?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_payments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          commission_rate: number | null
          created_at: string
          fixed_salary: number | null
          hire_date: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string
          fixed_salary?: number | null
          hire_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_rate?: number | null
          created_at?: string
          fixed_salary?: number | null
          hire_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fixed_expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          description: string | null
          due_day: number
          id: string
          is_active: boolean
          name: string
          reminder_days_before: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          description?: string | null
          due_day: number
          id?: string
          is_active?: boolean
          name: string
          reminder_days_before?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string | null
          due_day?: number
          id?: string
          is_active?: boolean
          name?: string
          reminder_days_before?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      package_usage: {
        Row: {
          appointment_id: string | null
          id: string
          notes: string | null
          package_id: string
          used_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          id?: string
          notes?: string | null
          package_id: string
          used_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          id?: string
          notes?: string | null
          package_id?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_usage_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_usage_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "client_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_name: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          email?: string | null
          id: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          business_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          description: string
          employee_id: string | null
          id: string
          notes: string | null
          payment_method: string | null
          transaction_date: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          description: string
          employee_id?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          transaction_date?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string
          employee_id?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          transaction_date?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          brand: string
          client_id: string
          color: string | null
          created_at: string
          id: string
          model: string
          plate: string | null
          updated_at: string
          user_id: string
          year: number | null
        }
        Insert: {
          brand: string
          client_id: string
          color?: string | null
          created_at?: string
          id?: string
          model: string
          plate: string | null
          updated_at?: string
          user_id: string
          year?: number | null
        }
        Update: {
          brand?: string
          client_id?: string
          color?: string | null
          created_at?: string
          id?: string
          model?: string
          plate?: string | null
          updated_at?: string
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      business_settings_public: {
        Row: {
          allow_client_cancellation: boolean | null
          business_name: string | null
          cancellation_limit_hours: number | null
          default_appointment_duration: number | null
          logo_url: string | null
          max_advance_days: number | null
          max_simultaneous_vehicles: number | null
          min_advance_hours: number | null
          primary_color: string | null
          public_booking_enabled: boolean | null
          public_booking_slug: string | null
          service_interval_minutes: number | null
          user_id: string | null
          working_hours: Json | null
        }
        Insert: {
          allow_client_cancellation?: boolean | null
          business_name?: string | null
          cancellation_limit_hours?: number | null
          default_appointment_duration?: number | null
          logo_url?: string | null
          max_advance_days?: number | null
          max_simultaneous_vehicles?: number | null
          min_advance_hours?: number | null
          primary_color?: string | null
          public_booking_enabled?: boolean | null
          public_booking_slug?: string | null
          service_interval_minutes?: number | null
          user_id?: string | null
          working_hours?: Json | null
        }
        Update: {
          allow_client_cancellation?: boolean | null
          business_name?: string | null
          cancellation_limit_hours?: number | null
          default_appointment_duration?: number | null
          logo_url?: string | null
          max_advance_days?: number | null
          max_simultaneous_vehicles?: number | null
          min_advance_hours?: number | null
          primary_color?: string | null
          public_booking_enabled?: boolean | null
          public_booking_slug?: string | null
          service_interval_minutes?: number | null
          user_id?: string | null
          working_hours?: Json | null
        }
        Relationships: []
      }
    }
    Functions: {
      cancel_appointment_by_token: {
        Args: { p_cancel_token: string }
        Returns: Json
      }
      find_vehicle_by_plate: {
        Args: { p_plate: string; p_user_id: string }
        Returns: string
      }
      generate_access_code: { Args: never; Returns: string }
      generate_cancel_token: { Args: never; Returns: string }
      generate_slug: { Args: { input_text: string }; Returns: string }
      get_appointment_by_token: {
        Args: { p_cancel_token: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_access_code: {
        Args: { code: string }
        Returns: {
          employee_account_id: string
          employee_id: string
          employee_name: string
          owner_user_id: string
          role: Database["public"]["Enums"]["business_role"]
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      appointment_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      business_role: "proprietario" | "funcionario"
      payment_method: "cash" | "pix" | "credit_card" | "debit_card"
      subscription_plan: "free" | "basic" | "pro"
      subscription_status: "active" | "canceled" | "expired" | "trial"
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
      app_role: ["admin", "user"],
      appointment_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      business_role: ["proprietario", "funcionario"],
      payment_method: ["cash", "pix", "credit_card", "debit_card"],
      subscription_plan: ["free", "basic", "pro"],
      subscription_status: ["active", "canceled", "expired", "trial"],
    },
  },
} as const
