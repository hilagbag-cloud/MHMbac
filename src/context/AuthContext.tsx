/**
 * MHM SOLUTIONS — Après Mon Bac (MVP1)
 * Contexte d'authentification unifié (Supabase Auth & Mode Démo Local)
 * Créateur : Hilarus GBAGOULE
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  DEFAULT_DEMO_PREFERENCES,
  DEFAULT_DEMO_PROFILE,
  DEFAULT_DEMO_USER,
  DemoStore,
  isSupabaseConfigured,
  realSupabase,
} from '../lib/supabase';
import { UserPreferences, UserProfile } from '../types/orientation';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  isLoading: boolean;
  isSupabaseLive: boolean;
  isDemoMode: boolean;
  errorMessage: string | null;
  clearError: () => void;
  signUp: (displayName: string, email: string, pass: string, confirmPass: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<boolean>;
  switchDemoPersona: (personaKey: 'dossou_d' | 'amina_c' | 'junior_a' | 'new_empty') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isSupabaseLive = isSupabaseConfigured;
  const isDemoMode = !isSupabaseLive || (user && user.id?.startsWith('usr-demo-'));

  const clearError = () => setErrorMessage(null);

  // Initialisation au chargement
  useEffect(() => {
    async function initAuth() {
      setIsLoading(true);
      try {
        if (isSupabaseLive && realSupabase) {
          const { data: { session }, error } = await realSupabase.auth.getSession();
          if (error) throw error;

          if (session?.user) {
            setUser(session.user);
            await fetchSupabaseUserData(session.user.id);
          } else {
            // Aucun utilisateur connecté
            setUser(null);
            setProfile(null);
            setPreferences(null);
          }
        } else {
          // Sans Supabase, aucun utilisateur fictif n’est créé. Le site reste en lecture publique.
          setUser(null);
          setProfile(null);
          setPreferences(null);
        }
      } catch (err: any) {
        console.error('Erreur initialisation Auth:', err);
        setErrorMessage(err.message || 'Erreur de chargement de la session');
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();

    // Écoute des changements de session Supabase si connecté
    if (isSupabaseLive && realSupabase) {
      const { data: { subscription } } = realSupabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchSupabaseUserData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setPreferences(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isSupabaseLive]);

  // Récupère le profil et les préférences depuis Supabase
  const fetchSupabaseUserData = async (userId: string) => {
    if (!realSupabase) return;
    try {
      // 1. Profil
      const { data: profData, error: profErr } = await realSupabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profData) {
        setProfile(profData);
      } else if (profErr && profErr.code === 'PGRST116') {
        // Profil non encore créé
        const newProf: UserProfile = {
          id: userId,
          display_name: user?.user_metadata?.display_name || 'Nouveau Bachelier',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await realSupabase.from('profiles').insert(newProf);
        setProfile(newProf);
      }

      // 2. Préférences
      const { data: prefData } = await realSupabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (prefData) {
        setPreferences(prefData);
      }
    } catch (err: any) {
      console.warn('Note fetchSupabaseUserData:', err.message);
    }
  };

  // Inscription
  const signUp = async (displayName: string, email: string, pass: string, confirmPass: string) => {
    setErrorMessage(null);

    if (!displayName.trim()) {
      const err = 'Veuillez saisir votre nom ou prénom.';
      setErrorMessage(err);
      return { success: false, error: err };
    }
    if (!email.trim() || !email.includes('@')) {
      const err = 'Veuillez fournir une adresse e-mail valide.';
      setErrorMessage(err);
      return { success: false, error: err };
    }
    if (pass.length < 6) {
      const err = 'Le mot de passe doit comporter au moins 6 caractères.';
      setErrorMessage(err);
      return { success: false, error: err };
    }
    if (pass !== confirmPass) {
      const err = 'Les deux mots de passe ne correspondent pas.';
      setErrorMessage(err);
      return { success: false, error: err };
    }

    try {
      if (isSupabaseLive && realSupabase) {
        const { data, error } = await realSupabase.auth.signUp({
          email,
          password: pass,
          options: {
            data: {
              display_name: displayName,
            },
          },
        });

        if (error) {
          if (error.message.includes('already registered')) {
            throw new Error('Cette adresse e-mail est déjà associée à un compte.');
          }
          throw error;
        }

        if (data.user) {
          setUser(data.user);
          const initialProf: UserProfile = {
            id: data.user.id,
            display_name: displayName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          await realSupabase.from('profiles').upsert(initialProf);
          setProfile(initialProf);
          return { success: true };
        }
      } else {
        // Inscription en mode simulation locale
        const mockId = `usr-${Date.now()}`;
        const mockUser = {
          id: mockId,
          email,
          user_metadata: { display_name: displayName },
        };
        const initialProf: UserProfile = {
          id: mockId,
          display_name: displayName,
          series: null,
          mention: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const initialPref: UserPreferences = {
          user_id: mockId,
          primary_goal: 'carriere',
          career_keywords: [],
          preferred_universities: [],
          scholarship_priority: 50,
          career_priority: 50,
          competition_priority: 50,
        };

        DemoStore.setUser(mockUser);
        DemoStore.setProfile(initialProf);
        DemoStore.setPreferences(initialPref);

        setUser(mockUser);
        setProfile(initialProf);
        setPreferences(initialPref);
        return { success: true };
      }
      return { success: true };
    } catch (err: any) {
      const msg = err.message || "Impossible de créer le compte pour l'instant.";
      setErrorMessage(msg);
      return { success: false, error: msg };
    }
  };

  // Connexion
  const signIn = async (email: string, pass: string) => {
    setErrorMessage(null);
    if (!email.trim() || !pass) {
      const err = 'Veuillez saisir votre e-mail et votre mot de passe.';
      setErrorMessage(err);
      return { success: false, error: err };
    }

    try {
      if (isSupabaseLive && realSupabase) {
        const { data, error } = await realSupabase.auth.signInWithPassword({
          email,
          password: pass,
        });
        if (error) {
          throw new Error('Identifiants incorrects ou compte inexistant.');
        }
        setUser(data.user);
        await fetchSupabaseUserData(data.user.id);
        return { success: true };
      } else {
        // En mode démo local
        let currentProf = DemoStore.getProfile();
        let currentPref = DemoStore.getPreferences();

        if (!currentProf) {
          currentProf = {
            ...DEFAULT_DEMO_PROFILE,
            display_name: email.split('@')[0] || 'Bachelier Connecté',
          };
          currentPref = DEFAULT_DEMO_PREFERENCES;
          DemoStore.setProfile(currentProf);
          DemoStore.setPreferences(currentPref);
        }

        const mockUser = {
          id: currentProf.id || 'usr-demo-001',
          email,
          user_metadata: { display_name: currentProf.display_name },
        };
        DemoStore.setUser(mockUser);
        setUser(mockUser);
        setProfile(currentProf);
        setPreferences(currentPref);
        return { success: true };
      }
    } catch (err: any) {
      const msg = err.message || 'Erreur lors de la connexion.';
      setErrorMessage(msg);
      return { success: false, error: msg };
    }
  };

  // Déconnexion
  const signOut = async () => {
    try {
      if (isSupabaseLive && realSupabase) {
        await realSupabase.auth.signOut();
      }
      DemoStore.clear();
      setUser(null);
      setProfile(null);
      setPreferences(null);
    } catch (err) {
      console.error('Erreur déconnexion:', err);
    }
  };

  // Mise à jour du profil
  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    try {
      if (!user) return false;
      const updated: UserProfile = {
        ...(profile || { id: user.id, display_name: user.user_metadata?.display_name || 'Utilisateur' }),
        ...updates,
        updated_at: new Date().toISOString(),
      };

      setProfile(updated);

      if (isSupabaseLive && realSupabase) {
        const { error } = await realSupabase.from('profiles').upsert(updated);
        if (error) throw error;
      } else {
        DemoStore.setProfile(updated);
      }
      return true;
    } catch (err: any) {
      console.error('Erreur updateProfile:', err);
      setErrorMessage(err.message || 'Impossible de mettre à jour le profil');
      return false;
    }
  };

  // Mise à jour des préférences
  const updatePreferences = async (updates: Partial<UserPreferences>): Promise<boolean> => {
    try {
      if (!user) return false;
      const updated: UserPreferences = {
        ...(preferences || {
          user_id: user.id,
          primary_goal: 'carriere',
          career_keywords: [],
          preferred_universities: [],
          scholarship_priority: 50,
          career_priority: 50,
          competition_priority: 50,
        }),
        ...updates,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      setPreferences(updated);

      if (isSupabaseLive && realSupabase) {
        const { error } = await realSupabase.from('user_preferences').upsert(updated);
        if (error) throw error;
      } else {
        DemoStore.setPreferences(updated);
      }
      return true;
    } catch (err: any) {
      console.error('Erreur updatePreferences:', err);
      setErrorMessage(err.message || 'Impossible de mettre à jour les préférences');
      return false;
    }
  };

  // Changement rapide de persona de démonstration pour les tests du MVP1
  const switchDemoPersona = (personaKey: 'dossou_d' | 'amina_c' | 'junior_a' | 'new_empty') => {
    if (personaKey === 'dossou_d') {
      const u = { id: 'usr-demo-001', email: 'stephane.dossou@mhmsolutions.bj', user_metadata: { display_name: 'Stéphane Dossou' } };
      const p: UserProfile = { id: 'usr-demo-001', display_name: 'Stéphane Dossou', series: 'D', mention: 'Bien' };
      const pref: UserPreferences = {
        user_id: 'usr-demo-001',
        primary_goal: 'carriere',
        career_keywords: ['Informatique', 'Génie Logiciel', 'Intelligence Artificielle'],
        preferred_universities: ['Université d’Abomey-Calavi (UAC)'],
        scholarship_priority: 60,
        career_priority: 95,
        competition_priority: 50,
      };
      DemoStore.setUser(u); DemoStore.setProfile(p); DemoStore.setPreferences(pref);
      setUser(u); setProfile(p); setPreferences(pref);
    } else if (personaKey === 'amina_c') {
      const u = { id: 'usr-demo-002', email: 'amina.bio@mhmsolutions.bj', user_metadata: { display_name: 'Amina Bio' } };
      const p: UserProfile = { id: 'usr-demo-002', display_name: 'Amina Bio', series: 'C', mention: 'Très bien' };
      const pref: UserPreferences = {
        user_id: 'usr-demo-002',
        primary_goal: 'bourse',
        career_keywords: ['Santé', 'Médecine', 'Agronomie'],
        preferred_universities: ['Université Nationale d’Agriculture (UNA)', 'Université d’Abomey-Calavi (UAC)'],
        scholarship_priority: 95,
        career_priority: 60,
        competition_priority: 40,
      };
      DemoStore.setUser(u); DemoStore.setProfile(p); DemoStore.setPreferences(pref);
      setUser(u); setProfile(p); setPreferences(pref);
    } else if (personaKey === 'junior_a') {
      const u = { id: 'usr-demo-003', email: 'junior.akoto@mhmsolutions.bj', user_metadata: { display_name: 'Junior Akoto' } };
      const p: UserProfile = { id: 'usr-demo-003', display_name: 'Junior Akoto', series: 'A', mention: 'Assez bien' };
      const pref: UserPreferences = {
        user_id: 'usr-demo-003',
        primary_goal: 'carriere',
        career_keywords: ['Droit', 'Administration Publique', 'Diplomatie'],
        preferred_universities: ['Université d’Abomey-Calavi (UAC)'],
        scholarship_priority: 50,
        career_priority: 85,
        competition_priority: 50,
      };
      DemoStore.setUser(u); DemoStore.setProfile(p); DemoStore.setPreferences(pref);
      setUser(u); setProfile(p); setPreferences(pref);
    } else {
      const u = { id: 'usr-demo-new', email: 'nouveau.bachelier@mhmsolutions.bj', user_metadata: { display_name: 'Nouveau Candidat' } };
      const p: UserProfile = { id: 'usr-demo-new', display_name: 'Nouveau Candidat', series: null, mention: null };
      const pref: UserPreferences = {
        user_id: 'usr-demo-new',
        primary_goal: 'carriere',
        career_keywords: [],
        preferred_universities: [],
        scholarship_priority: 50,
        career_priority: 50,
        competition_priority: 50,
      };
      DemoStore.setUser(u); DemoStore.setProfile(p); DemoStore.setPreferences(pref);
      setUser(u); setProfile(p); setPreferences(pref);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        preferences,
        isLoading,
        isSupabaseLive,
        isDemoMode,
        errorMessage,
        clearError,
        signUp,
        signIn,
        signOut,
        updateProfile,
        updatePreferences,
        switchDemoPersona,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé au sein de AuthProvider');
  }
  return context;
}
