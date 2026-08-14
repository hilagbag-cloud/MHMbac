/**
 * MHM SOLUTIONS — Après Mon Bac (MVP1)
 * Client Supabase avec gestion intelligente du mode Démo / LocalStorage fallback
 * Créateur : Hilarus GBAGOULE
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserPreferences, UserProfile } from '../types/orientation';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    supabaseAnonKey.length > 20
);

// Initialisation réelle si clés disponibles
export const realSupabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ============================================================================
// GESTIONNAIRE D'ÉTAT LOCAL POUR LE MODE DÉMONSTRATION SANS CONFIGURATION
// ============================================================================

const STORAGE_KEYS = {
  USER: 'mhm_demo_user',
  PROFILE: 'mhm_demo_profile',
  PREFERENCES: 'mhm_demo_preferences',
  SHORTLIST: 'mhm_demo_shortlist',
};

// Données de profil de démonstration par défaut
export const DEFAULT_DEMO_USER = {
  id: 'usr-demo-001',
  email: 'bachelier.demo@mhmsolutions.bj',
  user_metadata: {
    display_name: 'Stéphane Dossou',
  },
};

export const DEFAULT_DEMO_PROFILE: UserProfile = {
  id: 'usr-demo-001',
  display_name: 'Stéphane Dossou',
  series: 'D',
  mention: 'Bien',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const DEFAULT_DEMO_PREFERENCES: UserPreferences = {
  id: 'pref-demo-001',
  user_id: 'usr-demo-001',
  primary_goal: 'carriere',
  career_keywords: ['Informatique', 'Génie Logiciel', 'Intelligence Artificielle'],
  preferred_universities: ['Université d’Abomey-Calavi (UAC)'],
  scholarship_priority: 60,
  career_priority: 90,
  competition_priority: 50,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export class DemoStore {
  static getUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static setUser(user: any) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }

  static getProfile(): UserProfile | null {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static setProfile(profile: UserProfile | null) {
    if (profile) {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } else {
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
    }
  }

  static getPreferences(): UserPreferences | null {
    const raw = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static setPreferences(pref: UserPreferences | null) {
    if (pref) {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(pref));
    } else {
      localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
    }
  }

  static resetToDemo() {
    this.setUser(DEFAULT_DEMO_USER);
    this.setProfile(DEFAULT_DEMO_PROFILE);
    this.setPreferences(DEFAULT_DEMO_PREFERENCES);
  }

  static clear() {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
    localStorage.removeItem(STORAGE_KEYS.SHORTLIST);
  }
}
