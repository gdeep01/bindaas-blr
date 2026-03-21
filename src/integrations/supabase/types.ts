export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_predictions: {
        Row: {
          alternate_routes: Json
          avg_congestion_at_prediction: number | null
          avoid_areas: string[]
          best_time_is_future: boolean | null
          best_time_window_end: string | null
          best_time_window_start: string | null
          city_summary: string | null
          day_of_prediction: number | null
          hour_of_prediction: number | null
          id: string
          next_1h_congestion: number | null
          next_2h_congestion: number | null
          next_3h_congestion: number | null
          predicted_at: string
          raw_gemini_response: string | null
          weather_at_prediction: string | null
        }
        Insert: {
          alternate_routes?: Json
          avg_congestion_at_prediction?: number | null
          avoid_areas?: string[]
          best_time_is_future?: boolean | null
          best_time_window_end?: string | null
          best_time_window_start?: string | null
          city_summary?: string | null
          day_of_prediction?: number | null
          hour_of_prediction?: number | null
          id?: string
          next_1h_congestion?: number | null
          next_2h_congestion?: number | null
          next_3h_congestion?: number | null
          predicted_at?: string
          raw_gemini_response?: string | null
          weather_at_prediction?: string | null
        }
        Update: {
          alternate_routes?: Json
          avg_congestion_at_prediction?: number | null
          avoid_areas?: string[]
          best_time_is_future?: boolean | null
          best_time_window_end?: string | null
          best_time_window_start?: string | null
          city_summary?: string | null
          day_of_prediction?: number | null
          hour_of_prediction?: number | null
          id?: string
          next_1h_congestion?: number | null
          next_2h_congestion?: number | null
          next_3h_congestion?: number | null
          predicted_at?: string
          raw_gemini_response?: string | null
          weather_at_prediction?: string | null
        }
        Relationships: []
      }
      data_refresh_heartbeat: {
        Row: {
          avg_city_congestion: number | null
          id: number
          last_refreshed_at: string
          traffic_locations_updated: number
          weather_condition: string | null
          weather_temp: number | null
        }
        Insert: {
          avg_city_congestion?: number | null
          id?: number
          last_refreshed_at?: string
          traffic_locations_updated?: number
          weather_condition?: string | null
          weather_temp?: number | null
        }
        Update: {
          avg_city_congestion?: number | null
          id?: number
          last_refreshed_at?: string
          traffic_locations_updated?: number
          weather_condition?: string | null
          weather_temp?: number | null
        }
        Relationships: []
      }
      disaster_alerts: {
        Row: {
          alert_type: string | null
          description: string | null
          expires_at: string
          fetched_at: string
          id: string
          location_name: string | null
          raw_data: Json | null
          severity: string | null
        }
        Insert: {
          alert_type?: string | null
          description?: string | null
          expires_at: string
          fetched_at?: string
          id?: string
          location_name?: string | null
          raw_data?: Json | null
          severity?: string | null
        }
        Update: {
          alert_type?: string | null
          description?: string | null
          expires_at?: string
          fetched_at?: string
          id?: string
          location_name?: string | null
          raw_data?: Json | null
          severity?: string | null
        }
        Relationships: []
      }
      digest_subscribers: {
        Row: {
          areas_of_interest: string[]
          email: string
          id: string
          is_active: boolean
          name: string | null
          subscribed_at: string
          unsubscribe_token: string
        }
        Insert: {
          areas_of_interest?: string[]
          email: string
          id?: string
          is_active?: boolean
          name?: string | null
          subscribed_at?: string
          unsubscribe_token?: string
        }
        Update: {
          areas_of_interest?: string[]
          email?: string
          id?: string
          is_active?: boolean
          name?: string | null
          subscribed_at?: string
          unsubscribe_token?: string
        }
        Relationships: []
      }
      garbage_reports: {
        Row: {
          description: string | null
          id: string
          image_urls: string[]
          latitude: number
          location_name: string
          longitude: number
          moderation_status: string
          report_type: string
          reported_at: string
          reporter_ip_hash: string | null
          reporter_name: string | null
          resolved_at: string | null
          severity: string
          upvotes: number
          user_id: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          image_urls?: string[]
          latitude: number
          location_name: string
          longitude: number
          moderation_status?: string
          report_type?: string
          reported_at?: string
          reporter_ip_hash?: string | null
          reporter_name?: string | null
          resolved_at?: string | null
          severity?: string
          upvotes?: number
          user_id?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          image_urls?: string[]
          latitude?: number
          location_name?: string
          longitude?: number
          moderation_status?: string
          report_type?: string
          reported_at?: string
          reporter_ip_hash?: string | null
          reporter_name?: string | null
          resolved_at?: string | null
          severity?: string
          upvotes?: number
          user_id?: string | null
        }
        Relationships: []
      }
      garbage_report_votes: {
        Row: {
          created_at: string
          id: string
          report_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          report_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          report_id?: string
          user_id?: string
        }
        Relationships: []
      }
      locality_metrics: {
        Row: {
          commercial_score: number | null
          connectivity_score: number | null
          entertainment_count: number
          entertainment_score: number
          fire_score: number
          fire_stations_count: number
          growth_score: number | null
          healthcare_count: number
          healthcare_score: number
          id: string | null
          industrial_count: number
          industrial_score: number
          infrastructure_score: number | null
          last_updated: string
          lat: number
          lng: number
          locality_name: string
          overall_mood_score: number
          parks_count: number
          parks_score: number
          schools_count: number
          schools_score: number
        }
        Insert: {
          commercial_score?: number | null
          connectivity_score?: number | null
          entertainment_count: number
          entertainment_score: number
          fire_score: number
          fire_stations_count: number
          growth_score?: number | null
          healthcare_count: number
          healthcare_score: number
          id?: string | null
          industrial_count: number
          industrial_score: number
          infrastructure_score?: number | null
          last_updated?: string
          lat: number
          lng: number
          locality_name: string
          overall_mood_score: number
          parks_count: number
          parks_score: number
          schools_count: number
          schools_score: number
        }
        Update: {
          commercial_score?: number | null
          connectivity_score?: number | null
          entertainment_count?: number
          entertainment_score?: number
          fire_score?: number
          fire_stations_count?: number
          growth_score?: number | null
          healthcare_count?: number
          healthcare_score?: number
          id?: string | null
          industrial_count?: number
          industrial_score?: number
          infrastructure_score?: number | null
          last_updated?: string
          lat?: number
          lng?: number
          locality_name?: string
          overall_mood_score?: number
          parks_count?: number
          parks_score?: number
          schools_count?: number
          schools_score?: number
        }
        Relationships: []
      }
      locality_score_history: {
        Row: {
          created_at: string
          data_source: string
          entertainment_score: number | null
          growth_score: number | null
          healthcare_score: number | null
          id: string
          locality_name: string
          overall_mood_score: number
          parks_score: number | null
          schools_score: number | null
          snapshot_date: string
        }
        Insert: {
          created_at?: string
          data_source?: string
          entertainment_score?: number | null
          growth_score?: number | null
          healthcare_score?: number | null
          id?: string
          locality_name: string
          overall_mood_score: number
          parks_score?: number | null
          schools_score?: number | null
          snapshot_date?: string
        }
        Update: {
          created_at?: string
          data_source?: string
          entertainment_score?: number | null
          growth_score?: number | null
          healthcare_score?: number | null
          id?: string
          locality_name?: string
          overall_mood_score?: number
          parks_score?: number | null
          schools_score?: number | null
          snapshot_date?: string
        }
        Relationships: []
      }
      route_reliability: {
        Row: {
          avg_duration_mins: number
          created_at: string
          day_of_week: number
          departure_hour: number
          from_location: string
          id: string
          last_updated: string
          min_duration_mins: number
          p90_duration_mins: number
          route_hash: string
          sample_count: number
          to_location: string
          weather_condition: string
        }
        Insert: {
          avg_duration_mins?: number
          created_at?: string
          day_of_week: number
          departure_hour: number
          from_location: string
          id?: string
          last_updated?: string
          min_duration_mins?: number
          p90_duration_mins?: number
          route_hash: string
          sample_count?: number
          to_location: string
          weather_condition?: string
        }
        Update: {
          avg_duration_mins?: number
          created_at?: string
          day_of_week?: number
          departure_hour?: number
          from_location?: string
          id?: string
          last_updated?: string
          min_duration_mins?: number
          p90_duration_mins?: number
          route_hash?: string
          sample_count?: number
          to_location?: string
          weather_condition?: string
        }
        Relationships: []
      }
      traffic_history: {
        Row: {
          congestion_level: number
          current_speed: number | null
          data_source: string | null
          day_of_week: number | null
          departure_hour: number | null
          free_flow_speed: number | null
          id: string
          is_peak_hour: boolean | null
          is_weekend: boolean | null
          latitude: number
          location_name: string
          longitude: number
          recorded_at: string
          recorded_week: string | null
          weather_condition: string | null
          weather_temp: number | null
        }
        Insert: {
          congestion_level: number
          current_speed?: number | null
          data_source?: string | null
          day_of_week?: number | null
          departure_hour?: number | null
          free_flow_speed?: number | null
          id?: string
          is_peak_hour?: boolean | null
          is_weekend?: boolean | null
          latitude: number
          location_name: string
          longitude: number
          recorded_at?: string
          recorded_week?: string | null
          weather_condition?: string | null
          weather_temp?: number | null
        }
        Update: {
          congestion_level?: number
          current_speed?: number | null
          data_source?: string | null
          day_of_week?: number | null
          departure_hour?: number | null
          free_flow_speed?: number | null
          id?: string
          is_peak_hour?: boolean | null
          is_weekend?: boolean | null
          latitude?: number
          location_name?: string
          longitude?: number
          recorded_at?: string
          recorded_week?: string | null
          weather_condition?: string | null
          weather_temp?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
