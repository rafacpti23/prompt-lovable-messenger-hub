export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      campaigns: {
        Row: {
          contact_ids: string[]
          created_at: string
          id: string
          instance_id: string
          message: string
          name: string
          pause_between_messages: number | null
          scheduled_for: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_ids: string[]
          created_at?: string
          id?: string
          instance_id: string
          message: string
          name: string
          pause_between_messages?: number | null
          scheduled_for?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_ids?: string[]
          created_at?: string
          id?: string
          instance_id?: string
          message?: string
          name?: string
          pause_between_messages?: number | null
          scheduled_for?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
        ]
      }
      chatwhatsapp: {
        Row: {
          active: boolean | null
          contact_name: string | null
          contact_phone: string
          "Cpf/cnpj": number | null
          created_at: string | null
          data_agendamento: string | null
          data_nascimento: string | null
          id: string
          id_agendamento: string | null
          id_pagamento_asaas: string | null
          id_transação: string | null
          last_message_timestamp: string | null
          lead_qualification: string | null
          pagamento_confirmado: boolean | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          contact_name?: string | null
          contact_phone: string
          "Cpf/cnpj"?: number | null
          created_at?: string | null
          data_agendamento?: string | null
          data_nascimento?: string | null
          id?: string
          id_agendamento?: string | null
          id_pagamento_asaas?: string | null
          id_transação?: string | null
          last_message_timestamp?: string | null
          lead_qualification?: string | null
          pagamento_confirmado?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          contact_name?: string | null
          contact_phone?: string
          "Cpf/cnpj"?: number | null
          created_at?: string | null
          data_agendamento?: string | null
          data_nascimento?: string | null
          id?: string
          id_agendamento?: string | null
          id_pagamento_asaas?: string | null
          id_transação?: string | null
          last_message_timestamp?: string | null
          lead_qualification?: string | null
          pagamento_confirmado?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          arrival_time: string | null
          created_at: string | null
          departure_time: string | null
          destination_location: string
          driver_id: string | null
          final_km: number | null
          id: string
          initial_km: number | null
          load_end_time: string | null
          load_start_time: string | null
          notes: string | null
          origin_location: string
          receipt_image_url: string | null
          status: Database["public"]["Enums"]["delivery_status"] | null
          unload_end_time: string | null
          unload_start_time: string | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          arrival_time?: string | null
          created_at?: string | null
          departure_time?: string | null
          destination_location: string
          driver_id?: string | null
          final_km?: number | null
          id?: string
          initial_km?: number | null
          load_end_time?: string | null
          load_start_time?: string | null
          notes?: string | null
          origin_location: string
          receipt_image_url?: string | null
          status?: Database["public"]["Enums"]["delivery_status"] | null
          unload_end_time?: string | null
          unload_start_time?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          arrival_time?: string | null
          created_at?: string | null
          departure_time?: string | null
          destination_location?: string
          driver_id?: string | null
          final_km?: number | null
          id?: string
          initial_km?: number | null
          load_end_time?: string | null
          load_start_time?: string | null
          notes?: string | null
          origin_location?: string
          receipt_image_url?: string | null
          status?: Database["public"]["Enums"]["delivery_status"] | null
          unload_end_time?: string | null
          unload_start_time?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          cpf: string
          created_at: string | null
          current_latitude: number | null
          current_longitude: number | null
          id: string
          location_updated_at: string | null
          name: string
          phone: string
          status: Database["public"]["Enums"]["driver_status"] | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          cpf: string
          created_at?: string | null
          current_latitude?: number | null
          current_longitude?: number | null
          id?: string
          location_updated_at?: string | null
          name: string
          phone: string
          status?: Database["public"]["Enums"]["driver_status"] | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          cpf?: string
          created_at?: string | null
          current_latitude?: number | null
          current_longitude?: number | null
          id?: string
          location_updated_at?: string | null
          name?: string
          phone?: string
          status?: Database["public"]["Enums"]["driver_status"] | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      instances: {
        Row: {
          created_at: string
          id: string
          instance_name: string
          integration: string
          phone_number: string | null
          qr_code: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instance_name: string
          integration?: string
          phone_number?: string | null
          qr_code?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instance_name?: string
          integration?: string
          phone_number?: string | null
          qr_code?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      localizacoes: {
        Row: {
          frete_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          timestamp: string | null
        }
        Insert: {
          frete_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          timestamp?: string | null
        }
        Update: {
          frete_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          timestamp?: string | null
        }
        Relationships: []
      }
      messages_log: {
        Row: {
          campaign_id: string | null
          contact_id: string | null
          id: string
          message: string
          phone: string
          response: Json | null
          scheduled_for: string | null
          sent_at: string
          status: string
        }
        Insert: {
          campaign_id?: string | null
          contact_id?: string | null
          id?: string
          message: string
          phone: string
          response?: Json | null
          scheduled_for?: string | null
          sent_at?: string
          status: string
        }
        Update: {
          campaign_id?: string | null
          contact_id?: string | null
          id?: string
          message?: string
          phone?: string
          response?: Json | null
          scheduled_for?: string | null
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_log_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      motoristas: {
        Row: {
          cpf: string
          created_at: string | null
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          cpf: string
          created_at?: string | null
          id?: string
          nome: string
          telefone?: string | null
        }
        Update: {
          cpf?: string
          created_at?: string | null
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prompts: {
        Row: {
          conteudo: string | null
          id: number
          name: string | null
          resposta_padrao: string | null
          tipo: string | null
          tool_destino: string | null
        }
        Insert: {
          conteudo?: string | null
          id?: number
          name?: string | null
          resposta_padrao?: string | null
          tipo?: string | null
          tool_destino?: string | null
        }
        Update: {
          conteudo?: string | null
          id?: number
          name?: string | null
          resposta_padrao?: string | null
          tipo?: string | null
          tool_destino?: string | null
        }
        Relationships: []
      }
      scheduled_messages: {
        Row: {
          campaign_id: string
          contact_id: string
          created_at: string
          id: string
          message: string
          phone: string
          scheduled_for: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          campaign_id: string
          contact_id: string
          created_at?: string
          id?: string
          message: string
          phone: string
          scheduled_for: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          campaign_id?: string
          contact_id?: string
          created_at?: string
          id?: string
          message?: string
          phone?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      tob_fretes: {
        Row: {
          created_at: string | null
          data_hora_desembarque_prevista: string | null
          data_hora_desembarque_realizada: string | null
          data_hora_embarque_prevista: string | null
          data_hora_embarque_realizada: string | null
          destino_descricao: string
          destino_latitude: number | null
          destino_longitude: number | null
          id: string
          motorista_id: string | null
          numero_frete: string
          observacoes: string | null
          origem_descricao: string
          origem_latitude: number | null
          origem_longitude: number | null
          status: string
          updated_at: string | null
          url_foto_nf: string | null
          valor_frete: number
          veiculo_id: string | null
        }
        Insert: {
          created_at?: string | null
          data_hora_desembarque_prevista?: string | null
          data_hora_desembarque_realizada?: string | null
          data_hora_embarque_prevista?: string | null
          data_hora_embarque_realizada?: string | null
          destino_descricao: string
          destino_latitude?: number | null
          destino_longitude?: number | null
          id?: string
          motorista_id?: string | null
          numero_frete: string
          observacoes?: string | null
          origem_descricao: string
          origem_latitude?: number | null
          origem_longitude?: number | null
          status?: string
          updated_at?: string | null
          url_foto_nf?: string | null
          valor_frete: number
          veiculo_id?: string | null
        }
        Update: {
          created_at?: string | null
          data_hora_desembarque_prevista?: string | null
          data_hora_desembarque_realizada?: string | null
          data_hora_embarque_prevista?: string | null
          data_hora_embarque_realizada?: string | null
          destino_descricao?: string
          destino_latitude?: number | null
          destino_longitude?: number | null
          id?: string
          motorista_id?: string | null
          numero_frete?: string
          observacoes?: string | null
          origem_descricao?: string
          origem_latitude?: number | null
          origem_longitude?: number | null
          status?: string
          updated_at?: string | null
          url_foto_nf?: string | null
          valor_frete?: number
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tob_fretes_motorista_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "tob_motoristas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tob_fretes_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "tob_veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      tob_localizacoes_frete: {
        Row: {
          frete_id: string
          id: string
          latitude: number
          longitude: number
          origem_dados: string | null
          timestamp_captura: string
        }
        Insert: {
          frete_id: string
          id?: string
          latitude: number
          longitude: number
          origem_dados?: string | null
          timestamp_captura?: string
        }
        Update: {
          frete_id?: string
          id?: string
          latitude?: number
          longitude?: number
          origem_dados?: string | null
          timestamp_captura?: string
        }
        Relationships: [
          {
            foreignKeyName: "tob_localizacoes_frete_frete_id_fkey"
            columns: ["frete_id"]
            isOneToOne: false
            referencedRelation: "tob_fretes"
            referencedColumns: ["id"]
          },
        ]
      }
      tob_motoristas: {
        Row: {
          cpf: string
          created_at: string | null
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          cpf: string
          created_at?: string | null
          id?: string
          nome: string
          telefone?: string | null
        }
        Update: {
          cpf?: string
          created_at?: string | null
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: []
      }
      tob_veiculos: {
        Row: {
          created_at: string | null
          id: string
          motorista_id: string | null
          placa_cavalo: string
          placa_reboque1: string | null
          placa_reboque2: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          motorista_id?: string | null
          placa_cavalo: string
          placa_reboque1?: string | null
          placa_reboque2?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          motorista_id?: string | null
          placa_cavalo?: string
          placa_reboque1?: string | null
          placa_reboque2?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tob_veiculos_motorista_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "tob_motoristas"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          capacity: number | null
          created_at: string | null
          driver_id: string | null
          id: string
          model: string | null
          trailer_plate: string | null
          truck_plate: string
          updated_at: string | null
          year: number | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          driver_id?: string | null
          id?: string
          model?: string | null
          trailer_plate?: string | null
          truck_plate: string
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          driver_id?: string | null
          id?: string
          model?: string | null
          trailer_plate?: string | null
          truck_plate?: string
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      veiculos: {
        Row: {
          created_at: string | null
          id: string
          modelo: string | null
          motorista_id: string | null
          placa: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          modelo?: string | null
          motorista_id?: string | null
          placa: string
        }
        Update: {
          created_at?: string | null
          id?: string
          modelo?: string | null
          motorista_id?: string | null
          placa?: string
        }
        Relationships: [
          {
            foreignKeyName: "veiculos_motorista_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "motoristas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      delivery_status:
        | "scheduled"
        | "loading"
        | "in_transit"
        | "unloading"
        | "completed"
        | "cancelled"
      driver_status:
        | "available"
        | "loading"
        | "in_transit"
        | "unloading"
        | "off_duty"
      user_role: "admin" | "operator" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      delivery_status: [
        "scheduled",
        "loading",
        "in_transit",
        "unloading",
        "completed",
        "cancelled",
      ],
      driver_status: [
        "available",
        "loading",
        "in_transit",
        "unloading",
        "off_duty",
      ],
      user_role: ["admin", "operator", "viewer"],
    },
  },
} as const
