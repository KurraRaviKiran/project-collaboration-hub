import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  skills: string[];
  interested_fields: string[];
  bio: string;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  category: string;
  required_skills: string[];
  team_size: number;
  progress: number;
  status: string;
  created_at: string;
  updated_at: string;
  owner?: Profile;
  members?: ProjectMember[];
  member_count?: number;
};

export type JoinRequest = {
  id: string;
  project_id: string;
  user_id: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  created_at: string;
  updated_at: string;
  user?: Profile;
  project?: Project;
};

export type ProjectMember = {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user?: Profile;
};
