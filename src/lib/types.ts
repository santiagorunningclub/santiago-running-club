export type UserLevel = 'bronce' | 'plata' | 'oro' | 'elite'
export type UserPlan = 'pace' | 'elite'
export type PlanStatus = 'pending' | 'active' | 'cancelled' | 'suspended'
export type AdminRole = 'superadmin' | 'admin' | 'moderator'

export interface Profile {
  id: string
  full_name: string
  email: string
  phone?: string
  cedula?: string
  birthdate?: string
  gender?: string
  sector?: string
  emergency_contact?: string
  level: UserLevel
  plan: UserPlan
  plan_status: PlanStatus
  pace_avg?: string
  weekly_km: number
  total_km: number
  points: number
  shirt_size?: string
  instagram?: string
  strava_id?: string
  garmin_id?: string
  distance_preference?: string
  runner_level?: string
  bio?: string
  avatar_url?: string
  doc_front_url?: string
  doc_back_url?: string
  show_in_directory: boolean
  created_at: string
}

export interface Sponsor {
  id: string
  name: string
  description?: string
  category?: string
  logo_url?: string
  website_url?: string
  instagram?: string
  whatsapp?: string
  discount_code?: string
  discount_desc?: string
  featured: boolean
  active: boolean
  sort_order: number
  created_at: string
}

export interface Activity {
  id: string
  user_id: string
  source: 'strava' | 'garmin' | 'manual'
  external_id?: string
  type: string
  distance_km: number
  duration_minutes: number
  pace_avg?: string
  heart_rate_avg?: number
  cadence_avg?: number
  elevation_m?: number
  calories?: number
  valid: boolean
  validation_notes?: string
  recorded_at: string
  created_at: string
}

export interface Challenge {
  id: string
  title: string
  description?: string
  type: string
  goal_value: number
  goal_unit: string
  reward_points: number
  reward_desc?: string
  elite_only: boolean
  month: number
  year: number
  active: boolean
  created_at: string
  progress?: ChallengeProgress | ChallengeProgress[]
}

export interface ChallengeProgress {
  id: string
  challenge_id: string
  user_id: string
  current_value: number
  completed: boolean
  completed_at?: string
  created_at: string
}

export interface AdminRoleRecord {
  id: string
  user_id: string
  role: AdminRole
  can_manage_members: boolean
  can_manage_payments: boolean
  can_moderate_content: boolean
  can_manage_events: boolean
  can_manage_sponsors: boolean
  can_view_stats: boolean
  can_create_admins: boolean
  created_at: string
  profile?: Profile
}