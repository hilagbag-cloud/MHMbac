/**
 * MHM SOLUTIONS — Après Mon Bac (MVP1)
 * Contexte d'authentification unifié (Supabase Auth & Mode Démo Local)
 * Créateur : Hilarus GBAGOULE
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  DEFAULT_DEMO_PREFERENCES,
  DEFAULT_DEMO_PROFILE,
  DEFAULT_DEMO_USER,
  DemoStore,
  isSupabaseConfigured,
  realSupabase,
} from '../lib/supabase';
import {
  BetaTester,
  SignupBrowser,
  SignupDeviceClass,
  SignupEntrypoint,
  SignupIntent,
  UserAcademicSignals,
  UserPreferences,
  UserProfile,
} from '../types/orientation';

export interface SignupRequest {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  signupIntent: SignupIntent;
  signupEntrypoint: SignupEntrypoint;
  signupRoute?: string | null;
  signupDeviceClass?: SignupDeviceClass;
  signupBrowser?: SignupBrowser;
  signupContextConsent?: boolean;
  referralCode?: string | null;
}

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  academicSignals: UserAcademicSignals | null;
  betaTester: BetaTester | null;
  isBetaTester: boolean;
  isLoading: boolean;
  isSupabaseLive: boolean;
  isDemoMode: boolean;
  errorMessage: string | null;
  clearError: () => void;
  signUp: (request: SignupRequest) => Promise<{ success: boolean; requiresEmailConfirmation?: boolean; error?: string }>;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  leaveBetaProgram: () => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<boolean>;
  updateAcademicSignals: (updates: Partial<UserAcademicSignals>) => Promise<boolean>;
  switchDemoPersona: (personaKey: 'dossou_d' | 'amina_c' | 'junior_a' | 'new_empty') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Ce contrôle bloque les adresses manifestement malformées. La possession réelle
// de l’adresse est ensuite établie par le lien de confirmation Supabase.
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [academicSignals, setAcademicSignals] = useState<UserAcademicSignals | null>(null);
  const [betaTester, setBetaTester] = useState<BetaTester | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isSupabaseLive = isSupabaseConfigured;
  const isDemoMode = !isSupabaseLive || (user && user.id?.startsWith('usr-demo-'));
  const isBetaTester = betaTester?.status === 'active';

  const clearError = () => setErrorMessage(null);

  // Lit le profil et le statut bêta depuis la source de vérité serveur.
  // Cette fonction est stable afin que les abonnements Realtime et les reprises réseau
  // utilisent toujours la même logique, sans conserver un ancien état React en fermeture.
  const fetchSupabaseUserData = useCallback(async (userId: string, authUser?: any): Promise<boolean> => {
    if (!realSupabase) return false;
    try {
      const [{ data: profData, error: profErr }, { data: prefData }, { data: academicData }, { data: betaData, error: betaError }] = await Promise.all([
        realSupabase.from('profiles').select('*').eq('id', userId).single(),
        realSupabase.from('user_preferences').select('*').eq('user_id', userId).maybeSingle(),
        realSupabase.from('user_academic_signals').select('*').eq('user_id', userId).maybeSingle(),
        realSupabase.from('beta_testers').select('user_id, status, cohort, joined_at, consent_at, created_at, updated_at').eq('user_id', userId).maybeSingle(),
      ]);

      if (profData) {
        setProfile(profData as UserProfile);
      } else if (profErr?.code === 'PGRST116') {
        // Le profil peut être créé quelques instants après Auth : conserver le chemin de reprise.
        const newProf: UserProfile = {
          id: userId,
          display_name: authUser?.user_metadata?.display_name || 'Nouveau Bachelier',
          email: authUser?.email || undefined,
          signup_intent: authUser?.user_metadata?.signup_intent || 'standard',
          signup_entrypoint: authUser?.user_metadata?.signup_entrypoint || 'direct',
          signup_route: authUser?.user_metadata?.signup_route || null,
          signup_device_class: authUser?.user_metadata?.signup_device_class || 'unknown',
          signup_browser: authUser?.user_metadata?.signup_browser || 'Other',
          signup_context_consent_at: authUser?.user_metadata?.signup_context_consent_at || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const { error: insertError } = await realSupabase.from('profiles').insert(newProf);
        if (!insertError) setProfile(newProf);
      }

      if (prefData) setPreferences(prefData as UserPreferences);
      setAcademicSignals((academicData as UserAcademicSignals | null) || null);

      if (betaError) {
        console.warn('Lecture du statut bêta indisponible:', betaError.message);
        return false;
      }
      setBetaTester((betaData as BetaTester | null) || null);
      return true;
    } catch (err: any) {
      console.warn('Note fetchSupabaseUserData:', err.message);
      return false;
    }
  }, []);

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
            await fetchSupabaseUserData(session.user.id, session.user);
          } else {
            // Aucun utilisateur connecté
            setUser(null);
            setProfile(null);
            setPreferences(null);
            setAcademicSignals(null);
            setBetaTester(null);
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
          await fetchSupabaseUserData(session.user.id, session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setPreferences(null);
          setAcademicSignals(null);
          setBetaTester(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [fetchSupabaseUserData, isSupabaseLive]);

  useEffect(() => {
    if (!isSupabaseLive || !realSupabase || !user?.id) return;

    let retryTimer: number | undefined;
    const refreshBetaStatus = () => {
      void fetchSupabaseUserData(user.id);
    };
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState !== 'hidden') refreshBetaStatus();
    };
    const channel = realSupabase
      .channel(`bacpilot-beta-status-${user.id}`, { config: { broadcast: { self: false } } })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'beta_testers',
        filter: `user_id=eq.${user.id}`,
      }, refreshBetaStatus)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Une validation peut avoir eu lieu juste avant l’abonnement : lire la source de vérité.
          refreshBetaStatus();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          window.clearTimeout(retryTimer);
          retryTimer = window.setTimeout(refreshBetaStatus, 4_000);
        }
      });

    // Pendant l’attente d’une validation, la reprise est volontairement plus rapide ;
    // Realtime reste le mécanisme principal et la lecture est limitée au statut du compte connecté.
    const fallbackPoll = window.setInterval(refreshBetaStatus, betaTester?.status === 'active' ? 60_000 : 10_000);
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.clearTimeout(retryTimer);
      window.clearInterval(fallbackPoll);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      void realSupabase.removeChannel(channel);
    };
  }, [betaTester?.status, fetchSupabaseUserData, isSupabaseLive, user?.id]);

  // Inscription
  const signUp = async (request: SignupRequest) => {
    const {
      displayName,
      email,
      password: pass,
      confirmPassword: confirmPass,
      signupIntent,
      signupEntrypoint,
      signupRoute = null,
      signupDeviceClass = 'unknown',
      signupBrowser = 'Other',
      signupContextConsent = false,
      referralCode = null,
    } = request;
    setErrorMessage(null);

    if (!displayName.trim()) {
      const err = 'Veuillez saisir votre nom ou prénom.';
      setErrorMessage(err);
      return { success: false, error: err };
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_FORMAT.test(normalizedEmail)) {
      const err = 'Veuillez fournir une adresse e-mail valide, par exemple nom@exemple.com.';
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
          email: normalizedEmail,
          password: pass,
          options: {
            data: {
              display_name: displayName,
              signup_intent: signupIntent,
              signup_entrypoint: signupEntrypoint,
              signup_route: signupRoute,
              signup_device_class: signupDeviceClass,
              signup_browser: signupBrowser,
              signup_context_consent_at: signupIntent === 'beta_interest' && signupContextConsent ? new Date().toISOString() : null,
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
          // Le profil est créé côté serveur par déclencheur Auth. Lorsqu’une confirmation
          // est active, Supabase ne retourne pas de session avant le clic sur le lien reçu.
          if (!data.session) return { success: true, requiresEmailConfirmation: true };

          setUser(data.user);
          await fetchSupabaseUserData(data.user.id, data.user);
          if (referralCode?.trim()) {
            const { error: referralError } = await realSupabase.rpc('apply_referral_code', { p_code: referralCode.trim() });
            if (referralError) console.warn('Parrainage non appliqué:', referralError.message);
          }
          return { success: true };
        }
      } else {
        // Inscription en mode simulation locale
        const mockId = `usr-${Date.now()}`;
        const mockUser = {
          id: mockId,
          email: normalizedEmail,
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
      setAcademicSignals(null);
      setBetaTester(null);
    } catch (err) {
      console.error('Erreur déconnexion:', err);
    }
  };

  const leaveBetaProgram = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Connexion requise.' };
    try {
      if (isSupabaseLive && realSupabase) {
        const { data, error } = await realSupabase.rpc('leave_beta_program');
        if (error) throw error;
        const changed = Boolean((data as any)?.changed);
        setBetaTester((current) => current ? { ...current, status: 'revoked', updated_at: new Date().toISOString() } : null);
        return { success: true, error: changed ? undefined : 'Le mode bêta était déjà inactif.' };
      }
      setBetaTester(null);
      return { success: true };
    } catch (err: any) {
      const message = err.message || 'Impossible de quitter le programme bêta.';
      setErrorMessage(message);
      return { success: false, error: message };
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

      if (isSupabaseLive && realSupabase) {
        const payload = {
          id: updated.id,
          display_name: updated.display_name,
          series: updated.series ?? null,
          mention: updated.mention ?? null,
          updated_at: updated.updated_at,
        };
        const { data, error } = await realSupabase
          .from('profiles')
          .upsert(payload, { onConflict: 'id' })
          .select('*')
          .single();
        if (error) throw new Error(`Profil Supabase (${error.code || 'erreur'}): ${error.message}`);
        setProfile((data as UserProfile) || updated);
      } else {
        setProfile(updated);
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
          free_intent: null,
          preferred_universities: [],
          scholarship_priority: 50,
          career_priority: 50,
          competition_priority: 50,
        }),
        ...updates,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (isSupabaseLive && realSupabase) {
        const payload = {
          user_id: updated.user_id,
          primary_goal: updated.primary_goal,
          career_keywords: updated.career_keywords || [],
          free_intent: updated.free_intent || null,
          preferred_universities: updated.preferred_universities || [],
          scholarship_priority: updated.scholarship_priority,
          career_priority: updated.career_priority,
          competition_priority: updated.competition_priority,
          updated_at: updated.updated_at,
        };
        const { data, error } = await realSupabase
          .from('user_preferences')
          .upsert(payload, { onConflict: 'user_id' })
          .select('*')
          .single();
        if (error) throw new Error(`Préférences Supabase (${error.code || 'erreur'}): ${error.message}`);
        setPreferences((data as UserPreferences) || updated);
      } else {
        setPreferences(updated);
        DemoStore.setPreferences(updated);
      }
      return true;
    } catch (err: any) {
      console.error('Erreur updatePreferences:', err);
      setErrorMessage(err.message || 'Impossible de mettre à jour les préférences');
      return false;
    }
  };

  // Mise à jour des notes et signaux académiques personnels
  const updateAcademicSignals = async (updates: Partial<UserAcademicSignals>): Promise<boolean> => {
    try {
      if (!user) return false;
      const updated: UserAcademicSignals = {
        strengths: academicSignals?.strengths || [],
        subjects: academicSignals?.subjects || {},
        notes: academicSignals?.notes || null,
        notes_enabled: academicSignals?.notes_enabled ?? false,
        ranking_subjects: academicSignals?.ranking_subjects || {},
        ranking_average: academicSignals?.ranking_average ?? null,
        calculation_version: academicSignals?.calculation_version || 'mesrs_2026_2027_ranking_v1',
        ...updates,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (isSupabaseLive && realSupabase) {
        const payload = {
          user_id: updated.user_id,
          strengths: updated.strengths || [],
          subjects: updated.subjects || {},
          notes: updated.notes || null,
          notes_enabled: updated.notes_enabled,
          ranking_subjects: updated.ranking_subjects || {},
          ranking_average: updated.ranking_average ?? null,
          calculation_version: updated.calculation_version,
          updated_at: updated.updated_at,
        };
        const { data, error } = await realSupabase
          .from('user_academic_signals')
          .upsert(payload, { onConflict: 'user_id' })
          .select('*')
          .single();
        if (error) throw new Error(`Notes Supabase (${error.code || 'erreur'}): ${error.message}`);
        setAcademicSignals((data as UserAcademicSignals) || updated);
      } else {
        setAcademicSignals(updated);
      }
      return true;
    } catch (err: any) {
      console.error('Erreur updateAcademicSignals:', err);
      setErrorMessage(err.message || 'Impossible d’enregistrer tes notes.');
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
        academicSignals,
        isLoading,
        isSupabaseLive,
        isDemoMode,
        errorMessage,
        clearError,
        signUp,
        signIn,
        signOut,
        leaveBetaProgram,
        updateProfile,
        updatePreferences,
        updateAcademicSignals,
        betaTester,
      isBetaTester,
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
