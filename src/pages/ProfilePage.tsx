/**
 * MHM SOLUTIONS — Après Mon Bac (MVP1)
 * Page de gestion du profil bachelier et des pondérations de priorités
 * Créateur : Hilarus GBAGOULE
 */

import React, { useState } from 'react';
import {
  User,
  GraduationCap,
  Award,
  Target,
  Percent,
  Flame,
  Briefcase,
  Save,
  CheckCircle2,
  Sliders,
  LogOut,
  Building,
  Sparkles,
  FlaskConical,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BacMention, BacSeries, PrimaryGoal } from '../types/orientation';
import { TransparencyBadge } from '../components/TransparencyBadge';

interface ProfilePageProps {
  navigate: (route: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ navigate }) => {
  const { user, profile, preferences, isBetaTester, leaveBetaProgram, updateProfile, updatePreferences, signOut } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.display_name || 'Bachelier');
  const [series, setSeries] = useState<BacSeries>((profile?.series as BacSeries) || 'D');
  const [mention, setMention] = useState<BacMention>((profile?.mention as BacMention) || 'Bien');
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>(preferences?.primary_goal || 'carriere');
  
  // Curseurs de priorité (0 à 100)
  const [scholarshipPriority, setScholarshipPriority] = useState<number>(preferences?.scholarship_priority ?? 60);
  const [careerPriority, setCareerPriority] = useState<number>(preferences?.career_priority ?? 80);
  const [competitionPriority, setCompetitionPriority] = useState<number>(preferences?.competition_priority ?? 50);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLeavingBeta, setIsLeavingBeta] = useState(false);
  const [betaStatusMessage, setBetaStatusMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateProfile({
        display_name: displayName,
        series,
        mention,
      });

      await updatePreferences({
        primary_goal: primaryGoal,
        scholarship_priority: scholarshipPriority,
        career_priority: careerPriority,
        competition_priority: competitionPriority,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Erreur sauvegarde profil:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLeaveBeta = async () => {
    setBetaStatusMessage(null);
    if (!window.confirm('Quitter le programme bêta ? Tes retours déjà envoyés restent conservés, mais les outils bêta seront désactivés sur ce compte.')) return;
    setIsLeavingBeta(true);
    const result = await leaveBetaProgram();
    if (result.success) {
      setBetaStatusMessage('Le mode bêta est désormais désactivé sur ce compte.');
      navigate('/dashboard');
    } else {
      setBetaStatusMessage(result.error || 'La sortie du programme bêta a échoué.');
    }
    setIsLeavingBeta(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-8 sm:py-12 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* En-tête de la page */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-md">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
                Mon Profil & Préférences
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Gérez vos informations académiques et affinez les curseurs de l'algorithme MHM.
              </p>
            </div>

            {isBetaTester && <button type="button" onClick={() => navigate('/beta')} className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-left text-sm font-bold text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300"><FlaskConical className="h-4 w-4" /> Compte bêta actif</button>}
          </div>

          <button
            onClick={async () => {
              await signOut();
              navigate('/');
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Se déconnecter</span>
          </button>
        </div>

        {/* Message de succès */}
        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>Profil et préférences sauvegardés avec succès dans la base de données !</span>
          </div>
        )}

        {isBetaTester && <section className="flex flex-col justify-between gap-4 rounded-3xl border border-rose-200 bg-rose-50 p-6 dark:border-rose-900/50 dark:bg-rose-950/20 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2 text-sm font-black text-rose-700 dark:text-rose-200"><FlaskConical className="h-4 w-4" /> Programme bêta actif</div><p className="mt-1 max-w-2xl text-xs leading-5 text-rose-700/80 dark:text-rose-100/75">Tu peux quitter volontairement la bêta à tout moment. Cette action désactive les outils de test sur ce compte ; elle n’efface pas tes retours déjà envoyés.</p></div><button type="button" onClick={handleLeaveBeta} disabled={isLeavingBeta} className="shrink-0 rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-800 dark:bg-slate-950 dark:text-rose-200 dark:hover:bg-rose-950">{isLeavingBeta ? 'Désactivation…' : 'Quitter le programme bêta'}</button></section>}
        {betaStatusMessage && <div role="status" className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">{betaStatusMessage}</div>}

        {/* Formulaire Principal */}
        <form onSubmit={handleSave} className="space-y-8">
          
          {/* Section 1: Informations Personnelles & Scolaires */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-rose-500" />
              <span>Cursus & Identité</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Nom d’affichage
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Série du BAC
                </label>
                <select
                  value={series}
                  onChange={(e) => setSeries(e.target.value as BacSeries)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="D">Série D (Scientifique polyvalente)</option>
                  <option value="C">Série C (Mathématiques & Physique)</option>
                  {series === 'A' && <option value="A">Série A — à préciser (ancien profil)</option>}
                  <option value="A1">Série A1 (Lettres & Langues)</option>
                  <option value="A2">Série A2 (Lettres & Sciences humaines)</option>
                  <option value="B">Série B (Économie & Gestion)</option>
                  <option value="E">Série E (Mathématiques & Technique)</option>
                  <option value="Autre">Autre Série / Équivalence</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Mention Obtenue
                </label>
                <select
                  value={mention}
                  onChange={(e) => setMention(e.target.value as BacMention)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="Passable">Passable</option>
                  <option value="Assez bien">Assez bien</option>
                  <option value="Bien">Bien</option>
                  <option value="Très bien">Très bien</option>
                </select>
              </div>

            </div>
          </div>

          {/* Section 2: Objectif Stratégique */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-500" />
              <span>Objectif Principal d’Orientation</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  primaryGoal === 'bourse'
                    ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="primary_goal"
                  value="bourse"
                  checked={primaryGoal === 'bourse'}
                  onChange={() => setPrimaryGoal('bourse')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    Maximiser mes chances de bourse
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Privilégie les filières où le rapport bourses/demandes est statistiquement favorable.
                  </p>
                </div>
              </label>

              <label
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  primaryGoal === 'carriere'
                    ? 'bg-rose-500/10 border-rose-500 ring-2 ring-rose-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="primary_goal"
                  value="carriere"
                  checked={primaryGoal === 'carriere'}
                  onChange={() => setPrimaryGoal('carriere')}
                  className="mt-1 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    Construire mon parcours carrière
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Privilégie l'adéquation exacte avec vos compétences visées et métiers de prédilection.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Section 3: Curseurs de Priorités Algorithmiques */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-500" />
                <span>Pondérations Avancées de l’Algorithme MHM</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Ajustez le niveau d’importance relative accordé à chaque critère dans le score global.
              </p>
            </div>

            <div className="space-y-5">
              
              {/* Curseur Bourse */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-slate-700 dark:text-slate-300">Importance Bourse & Allocation :</span>
                  <span className="text-emerald-500 font-mono font-bold">{scholarshipPriority}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={scholarshipPriority}
                  onChange={(e) => setScholarshipPriority(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Curseur Carrière */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-slate-700 dark:text-slate-300">Importance Adéquation Métier :</span>
                  <span className="text-rose-500 font-mono font-bold">{careerPriority}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={careerPriority}
                  onChange={(e) => setCareerPriority(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              {/* Curseur Concurrence */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-slate-700 dark:text-slate-300">Tolérance à la Concurrence / Sélectivité :</span>
                  <span className="text-indigo-500 font-mono font-bold">{competitionPriority}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={competitionPriority}
                  onChange={(e) => setCompetitionPriority(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

            </div>
          </div>

          {/* Bouton de Sauvegarde */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 rounded-2xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              Retour au tableau de bord
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-3.5 rounded-2xl text-sm font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-xl shadow-rose-950/40 flex items-center gap-2 hover:scale-105 disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Enregistrement...' : 'Enregistrer mes modifications'}</span>
            </button>
          </div>

        </form>

        <TransparencyBadge variant="card" />

      </div>
    </div>
  );
};
