import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

const DEV_MODE = false; 

const MOCK_USER = {
  id: 'dev-admin-123',
  email: 'admin@dev.com',
  user_metadata: {
    avatar_url: 'https://ui-avatars.com/api/?name=Admin+Dev&background=0D8ABC&color=fff',
    full_name: 'Desarrollador (Modo Test)'
  },
  role: 'premium'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // Estado para la suscripción real
  const [loading, setLoading] = useState(true);

  // Función para obtener el nivel de suscripción desde la tabla 'profiles'
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error("Error al obtener perfil de la DB:", err.message);
    }
  };

  useEffect(() => {
    if (DEV_MODE) {
      setUser(MOCK_USER);
      setProfile({ subscription_tier: 'admin' });
      setLoading(false);
      return;
    }

    // 1. Verificar sesión actual al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) fetchProfile(currentUser.id);
      setLoading(false);
    });

    // 2. Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (event === 'SIGNED_IN' && currentUser) {
        fetchProfile(currentUser.id);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const email = window.prompt("Introduce tu correo para entrar:");
    if (!email) return;
  
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      alert("¡Enlace enviado! Revisa tu bandeja de entrada.");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const signOut = async () => {
    if (DEV_MODE) {
        alert("Modo Dev: Cambia DEV_MODE a false para salir.");
        return;
    }
    await supabase.auth.signOut();
  };

  const value = {
    user,
    profile,
    // Ahora isAdmin es más seguro: verifica el correo Y que en la DB diga 'admin'
    isAdmin: user?.email === 'airdropsdedan@gmail.com' || profile?.subscription_tier === 'admin',
    tier: profile?.subscription_tier || 'free', // 'free', 'standard', 'professional', 'admin'
    loginWithGoogle,
    logout: signOut,
    loading,
    isDevMode: DEV_MODE
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);