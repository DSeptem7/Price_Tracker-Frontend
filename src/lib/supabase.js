// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// Reemplaza esto temporalmente con tus strings reales (con comillas)
const supabaseUrl = "https://tu-url.supabase.co"; 
const supabaseAnonKey = "tu-llave-anon-larga";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);