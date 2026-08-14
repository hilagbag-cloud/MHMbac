-- ============================================================================
-- MHM SOLUTIONS — Après Mon Bac (MVP1)
-- Base de données Supabase PostgreSQL & Politiques RLS
-- Créateur du projet : Hilarus GBAGOULE
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE DES PROFILS UTILISATEURS (Liée à auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    series TEXT CHECK (series IN ('A', 'B', 'C', 'D', 'E', 'Autre') OR series IS NULL),
    mention TEXT CHECK (mention IN ('Passable', 'Assez bien', 'Bien', 'Très bien') OR mention IS NULL),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABLE DES PRÉFÉRENCES UTILISATEUR
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    primary_goal TEXT NOT NULL CHECK (primary_goal IN ('bourse', 'carriere')),
    career_keywords TEXT[] DEFAULT '{}'::TEXT[],
    preferred_universities TEXT[] DEFAULT '{}'::TEXT[],
    scholarship_priority INTEGER DEFAULT 50 CHECK (scholarship_priority BETWEEN 0 AND 100),
    career_priority INTEGER DEFAULT 50 CHECK (career_priority BETWEEN 0 AND 100),
    competition_priority INTEGER DEFAULT 50 CHECK (competition_priority BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABLE DES PROGRAMMES DE DÉMONSTRATION (MVP1)
CREATE TABLE IF NOT EXISTS public.demo_programmes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university TEXT NOT NULL,
    school TEXT NOT NULL,
    programme TEXT NOT NULL,
    domain TEXT NOT NULL,
    is_demo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABLES PRÉPARATOIRES POUR LES PHASES FUTURES (Extension Chrome, n8n, Alertes)
-- Note: Non connectées activement dans le MVP1, mais prêtes pour les migrations futures.
CREATE TABLE IF NOT EXISTS public.future_gauge_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    programme_id UUID REFERENCES public.demo_programmes(id) ON DELETE SET NULL,
    observation_source TEXT NOT NULL, -- ex: 'chrome_extension', 'n8n_crawler'
    scholarship_ratio NUMERIC(5,2),
    competition_index NUMERIC(5,2),
    recorded_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.future_user_shortlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    programme_id UUID NOT NULL REFERENCES public.demo_programmes(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, programme_id)
);

-- ============================================================================
-- SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.future_gauge_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.future_user_shortlists ENABLE ROW LEVEL SECURITY;

-- 1. Politiques pour 'profiles'
-- Chaque utilisateur peut lire UNIQUEMENT son propre profil
CREATE POLICY "profiles_select_own"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Chaque utilisateur peut insérer UNIQUEMENT son propre profil
CREATE POLICY "profiles_insert_own"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Chaque utilisateur peut mettre à jour UNIQUEMENT son propre profil
CREATE POLICY "profiles_update_own"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 2. Politiques pour 'user_preferences'
-- Chaque utilisateur peut lire UNIQUEMENT ses propres préférences
CREATE POLICY "user_preferences_select_own"
    ON public.user_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

-- Chaque utilisateur peut insérer UNIQUEMENT ses propres préférences
CREATE POLICY "user_preferences_insert_own"
    ON public.user_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Chaque utilisateur peut modifier UNIQUEMENT ses propres préférences
CREATE POLICY "user_preferences_update_own"
    ON public.user_preferences
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. Politiques pour 'demo_programmes'
-- Tous les utilisateurs (authentifiés ou anonymes) peuvent lire les programmes de démonstration
CREATE POLICY "demo_programmes_read_public"
    ON public.demo_programmes
    FOR SELECT
    USING (true);

-- Aucune écriture publique n'est autorisée (gestion réservée à l'administrateur / service role)

-- 4. Politiques pour 'future_user_shortlists'
CREATE POLICY "user_shortlists_all_own"
    ON public.future_user_shortlists
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TRIGGER AUTOMATIQUE DE MISE À JOUR DU TIMESTAMP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_preferences_updated
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- JEU DE DONNÉES DE DÉMONSTRATION INITIAL (MVP1)
-- ============================================================================

INSERT INTO public.demo_programmes (university, school, programme, domain, is_demo)
VALUES
    ('Université d''Abomey-Calavi (UAC)', 'IFRI (Institut de Formation et de Recherche en Informatique)', 'Génie Logiciel & Systèmes d''Information', 'Informatique & Numérique', true),
    ('Université d''Abomey-Calavi (UAC)', 'EPAC (École Polytechnique d''Abomey-Calavi)', 'Génie Civil & Bâtiment', 'Génie Civil & BTP', true),
    ('Université d''Abomey-Calavi (UAC)', 'FSS (Faculté des Sciences de la Santé)', 'Médecine Générale & Sciences Biomédicales', 'Santé & Médecine', true),
    ('Université Nationale d''Agriculture (UNA)', 'EAC (École d''Agrobusiness et de Commercialisation)', 'Agrobusiness & Économie Rurale', 'Agriculture & Agroalimentaire', true),
    ('Université Nationale d''Agriculture (UNA)', 'ESA (École des Sciences Agronomiques)', 'Production Végétale & Protection des Cultures', 'Agriculture & Environnement', true),
    ('Université Nationale des Sciences (UNSTIM)', 'ENS-Natitingou', 'Sciences Physiques & Enseignement', 'Enseignement & Éducation', true),
    ('Université de Parakou (UP)', 'IUT (Institut Universitaire de Technologie)', 'Gestion des Banques & Finances d''Entreprise', 'Finance & Gestion', true),
    ('Université de Parakou (UP)', 'FA (Faculté d''Agronomie)', 'Foresterie & Gestion des Ressources Naturelles', 'Environnement & Forêts', true),
    ('Université d''Abomey-Calavi (UAC)', 'FASEG', 'Sciences Économiques et Gestion Commerciale', 'Commerce & Gestion', true),
    ('Université d''Abomey-Calavi (UAC)', 'FADESP', 'Droit et Administration Publique', 'Administration & Droit', true)
ON CONFLICT DO NOTHING;
