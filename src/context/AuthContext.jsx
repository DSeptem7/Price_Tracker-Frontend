import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase'; // Asegúrate que esta ruta coincida con tu archivo creado

const AuthContext = createContext();

// === MODO DESARROLLADOR ===
// true = Eres Premium automáticamente sin loguearte (para trabajar rápido)
// false = Sistema real (requiere Login con Google)
const DEV_MODE = false; 

const MOCK_USER = {
  id: 'dev-admin-123',
  email: 'admin@dev.com',
  user_metadata: {
    avatar_url: 'https://ui-avatars.com/api/?name=Admin+Dev&background=0D8ABC&color=fff',
    full_name: 'Desarrollador (Modo Test)'
  },
  role: 'premium' // Simula que eres premium
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Si estamos en modo desarrollo, cargamos el usuario falso y salimos
    if (DEV_MODE) {
      setUser(MOCK_USER);
      setLoading(false);
      return;
    }

    // 2. Lógica Real de Supabase
    // Verificar sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuchar cambios (login/logout en tiempo real)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Función para iniciar sesión con Google
  const loginWithGoogle = async () => {
    console.log("🚀 El botón ha sido presionado"); // Chivato para ver en consola
    const email = window.prompt("Introduce tu correo para entrar:");
    
    if (!email) return;
  
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
  
      if (error) throw error;
      alert("¡Enlace enviado! Revisa tu bandeja de entrada.");
    } catch (error) {
      console.error("Error completo:", error);
      alert("Error: " + error.message);
    }
  };
  // Función para cerrar sesión
  const signOut = async () => {
    if (DEV_MODE) {
        alert("Estás en modo desarrollador. Para cerrar sesión cambia DEV_MODE a false.");
        return;
    }
    await supabase.auth.signOut();
  };

  const value = {
    user,
    loginWithGoogle, // Asegúrate de que se llame así
    logout,          // Y que aquí diga logout o signOut, según uses en Navbar
    isAdmin,
    loading,
    isDevMode: DEV_MODE
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el usuario en cualquier componente
export const useAuth = () => {
  return useContext(AuthContext);
};