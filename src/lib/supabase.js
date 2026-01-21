import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Este log te dirá la verdad en la consola del navegador
console.log("Configuración cargada:", { 
  url: supabaseUrl ? "Detectada ✅" : "No detectada ❌",
  key: supabaseAnonKey ? "Detectada ✅" : "No detectada ❌"
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERROR: Las variables de entorno no se están cargando. Revisa el archivo .env");
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");