import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
if (supabaseUrl) {
  supabaseUrl = supabaseUrl.trim();
  if (supabaseUrl.startsWith('https//')) {
    supabaseUrl = 'https://' + supabaseUrl.substring(7);
  } else if (supabaseUrl.startsWith('http//')) {
    supabaseUrl = 'http://' + supabaseUrl.substring(6);
  }
}

const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseKey);

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseKey)
  : null;
