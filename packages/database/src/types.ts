export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Onboarding profile stored in profiles.onboarding_profile JSONB
export type OnboardingProfile = {
  goals: ("sleep" | "focus" | "energy" | "fitness")[];
  experience: "beginner" | "intermediate" | "advanced";
  time_minutes: number;
  completed_at: string;
};

export type Database = {
  public: {
    Tables: {
      protocols: {
        Row: {
          id: string;
          name: string;
          description: string;
          category: "sleep" | "focus" | "energy" | "fitness";
          difficulty: "easy" | "medium" | "hard";
          duration_minutes: number | null;
          frequency: "daily" | "weekly";
          science_summary: string | null;
          steps: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          category: "sleep" | "focus" | "energy" | "fitness";
          difficulty?: "easy" | "medium" | "hard";
          duration_minutes?: number | null;
          frequency?: "daily" | "weekly";
          science_summary?: string | null;
          steps?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          category?: "sleep" | "focus" | "energy" | "fitness";
          difficulty?: "easy" | "medium" | "hard";
          duration_minutes?: number | null;
          frequency?: "daily" | "weekly";
          science_summary?: string | null;
          steps?: string[];
          created_at?: string;
        };
      };
      stacks: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          protocol_ids: string[];
          schedule: "daily" | "weekdays" | "weekends" | "custom";
          custom_days: number[] | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          protocol_ids?: string[];
          schedule?: "daily" | "weekdays" | "weekends" | "custom";
          custom_days?: number[] | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          protocol_ids?: string[];
          schedule?: "daily" | "weekdays" | "weekends" | "custom";
          custom_days?: number[] | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      tracking: {
        Row: {
          id: string;
          user_id: string;
          stack_id: string;
          protocol_id: string;
          date: string;
          completed: boolean;
          completed_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stack_id: string;
          protocol_id: string;
          date: string;
          completed?: boolean;
          completed_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stack_id?: string;
          protocol_id?: string;
          date?: string;
          completed?: boolean;
          completed_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          subscription_tier: "free" | "pro";
          onboarding_completed: boolean;
          onboarding_profile: OnboardingProfile | null;
          favorite_protocol_ids: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: "free" | "pro";
          onboarding_completed?: boolean;
          onboarding_profile?: OnboardingProfile | null;
          favorite_protocol_ids?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: "free" | "pro";
          onboarding_completed?: boolean;
          onboarding_profile?: OnboardingProfile | null;
          favorite_protocol_ids?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: object;
    Functions: object;
    Enums: {
      category: "sleep" | "focus" | "energy" | "fitness";
      difficulty: "easy" | "medium" | "hard";
      frequency: "daily" | "weekly";
      schedule: "daily" | "weekdays" | "weekends" | "custom";
      subscription_tier: "free" | "pro";
    };
  };
};

// Helper types
export type Protocol = Database["public"]["Tables"]["protocols"]["Row"];
export type Stack = Database["public"]["Tables"]["stacks"]["Row"];
export type Tracking = Database["public"]["Tables"]["tracking"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type ProtocolCategory = Database["public"]["Enums"]["category"];
export type ProtocolDifficulty = Database["public"]["Enums"]["difficulty"];
export type ExperienceLevel = OnboardingProfile["experience"];

// Badge types
export type BadgeType = "streak_7" | "streak_30" | "streak_100";

// Streak-related types
export type UserStreak = {
  id: string;
  user_id: string;
  stack_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  grace_period_used: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type UserBadge = {
  id: string;
  user_id: string;
  badge_type: BadgeType;
  stack_id: string | null;
  unlocked_at: string;
};
