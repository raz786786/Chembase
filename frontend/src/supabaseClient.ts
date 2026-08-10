import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wlvlnfiklxzyaoqqxfkg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdmxuZmlrbHh6eWFvcXF4ZmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzMzkzMjMsImV4cCI6MjEwMTkxNTMyM30.Jh-j757CCs-mxVUYF4nu8Y4DMxUJQiWvywZsPW123pY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
