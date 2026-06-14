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
  strava_connected?: boolean
  strava_athlete_id?: number
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

export interface Event {
  id: string
  title: string
  description?: string
  type: 'corrida' | 'carrera' | 'track' | 'social'
  date: string
  location?: string
  distance?: string
  max_capacity?: number
  registration_url?: string
  elite_only: boolean
  status: 'active' | 'cancelled' | 'completed'
  created_at: string
}

export interface Album {
  id: string
  title: string
  event_id?: string
  date?: string
  cover_url?: string
  is_official: boolean
  created_at: string
  photos?: Photo[]
}

export interface Photo {
  id: string
  album_id: string
  url: string
  caption?: string
  uploaded_by?: string
  approved: boolean
  likes: number
  created_at: string
  uploader?: Profile
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

export interface Channel {
  id: string
  name: string
  emoji?: string
  elite_only: boolean
  description?: string
  created_at: string
}

export interface Message {
  id: string
  channel_id: string
  user_id: string
  content: string
  pinned: boolean
  deleted: boolean
  created_at: string
  profile?: Profile
}

export interface Thread {
  id: string
  title: string
  content?: string
  category: 'pregunta' | 'tip' | 'anuncio' | 'social'
  user_id: string
  pinned: boolean
  deleted: boolean
  views: number
  likes: number
  created_at: string
  profile?: Profile
  replies?: Reply[]
}

export interface Reply {
  id: string
  thread_id: string
  user_id: string
  content: string
  deleted: boolean
  created_at: string
  profile?: Profile
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
  progress?: ChallengeProgress
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
