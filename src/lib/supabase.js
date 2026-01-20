import { createClient } from '@supabase/supabase-js';

// Estas variables las tomaremos de tu archivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("URL de Supabase:", supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);