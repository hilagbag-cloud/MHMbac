import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  Laptop,
  Lock,
  Mail,
  ShieldCheck,
  User,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  SignupBrowser,
  SignupDeviceClass,
  SignupEntrypoint,
} from '../types/orientation';

interface RegisterPageProps {
  navigate: (route: string) => void;
}

function detectDeviceClass(): SignupDeviceClass {
  const agent = navigator.userAgent;
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(agent)) return 'tablet';
  if (/Mobi|Android|iPhone|iPod/i.test(agent)) return 'mobile';
  if (agent) return 'desktop';
  return 'unknown';
}

function detectBrowser(): SignupBrowser {
  const agent = navigator.userAgent;
  if (/Edg\//i.test(agent)) return 'Edge';
  if (/Firefox\//i.test(agent)) return 'Firefox';
  if (/Chrome\//i.test(agent) || /CriOS\//i.test(agent)) return 'Chrome';
  if (/Safari\//i.test(agent)) return 'Safari';
  return 'Other';
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ navigate }) => {
  const { signUp, errorMessage, clearError } = useAuth();
  const searchParams = new URLSearchParams(window.location.search);
  const returnToBeta = searchParams.get('returnTo') === 'beta';
  const referralCode = (searchParams.get('ref') || window.localStorage.getItem('bacpilot_referral_code') || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 32);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [wantsBeta, setWantsBeta] = useState(returnToBeta);
  const [signupContextConsent, setSignupContextConsent] = useState(returnToBeta);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [confirmationPending, setConfirmationPending] = useState(false);

  const resolveEntrypoint = (): SignupEntrypoint => {
    const hostname = window.location.hostname.toLowerCase();
    if (returnToBeta || hostname.startsWith('beta.')) return 'beta_portal';
    if (hostname.startsWith('partenaires.')) return 'partner_portal';
    return hostname.endsWith('bacpilot.site') || hostname.includes('vercel.app') ? 'direct' : 'other';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    clearError();

    if (password.length < 6) {
      setLocalError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    if (wantsBeta && !signupContextConsent) {
      setLocalError('Pour demander la bêta, confirme le partage du contexte technique minimal décrit ci-dessous.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signUp({
        displayName,
        email,
        password,
        confirmPassword,
        signupIntent: wantsBeta ? 'beta_interest' : 'standard',
        signupEntrypoint: resolveEntrypoint(),
        signupRoute: window.location.pathname.slice(0, 160),
        signupDeviceClass: detectDeviceClass(),
        signupBrowser: detectBrowser(),
        signupContextConsent,
        referralCode: referralCode || null,
      });
      if (res.success) {
        if (res.requiresEmailConfirmation) {
          setConfirmationPending(true);
          return;
        }
        navigate(wantsBeta || returnToBeta ? '/beta-access' : '/onboarding');
      } else {
        setLocalError(res.error || 'Erreur lors de l’inscription.');
      }
    } catch (err: any) {
      setLocalError(err.message || 'Erreur inattendue.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex h-14 w-14 items-center justify-center transition-transform hover:scale-105"
            aria-label="Retour à l’accueil"
          >
            <img src="/branding/bacpilot-mark-512.png" alt="" className="h-12 w-auto object-contain" />
          </button>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Créer mon compte</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            {returnToBeta ? 'Demande ton accès bêta ; l’équipe BacPilot le validera côté serveur.' : 'Prépare ton parcours d’orientation post-BAC avec BacPilot, par MHM SOLUTIONS.'}
          </p>
          {referralCode && <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">Invitation BacPilot reconnue : le parrainage sera vérifié à la création de ton compte.</p>}
        </div>

        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          {(localError || errorMessage) && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-600 dark:text-rose-400 sm:text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{localError || errorMessage}</span>
            </div>
          )}

          {confirmationPending ? (
            <section className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100" role="status">
              <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" /><div><h2 className="font-bold">Confirme ton adresse e-mail</h2><p className="mt-1 leading-6">Un lien de confirmation a été envoyé à <strong>{email.trim().toLowerCase()}</strong>. Ouvre-le avant de te connecter à BacPilot : cette étape protège ton compte et permet de recevoir les informations importantes.</p></div></div>
              <button type="button" onClick={() => navigate('/login')} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-800">J’ai confirmé mon e-mail</button>
              <button type="button" onClick={() => setConfirmationPending(false)} className="block text-xs font-semibold underline underline-offset-4">Corriger mon adresse</button>
            </section>
          ) : <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Nom complet ou prénom</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Ex. Stéphane Dossou"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Adresse e-mail</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  autoComplete="email"
                  inputMode="email"
                  pattern="[^\\s@]+@[^\\s@]+\\.[^\\s@]+"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ton.email@exemple.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mot de passe <span className="normal-case tracking-normal">(min. 6 caractères)</span></label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Confirmer le mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>
            </div>

            <fieldset className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-800/60">
              <legend className="px-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Comment veux-tu commencer ?</legend>
              <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${!wantsBeta ? 'border-rose-300 bg-white dark:border-rose-700 dark:bg-slate-900' : 'border-transparent'}`}>
                <input type="radio" name="signup-intent" checked={!wantsBeta} onChange={() => setWantsBeta(false)} className="mt-1 accent-rose-500" />
                <span><strong className="block text-sm text-slate-900 dark:text-white">Utiliser BacPilot</strong><span className="mt-0.5 block text-xs leading-5 text-slate-500 dark:text-slate-400">Je souhaite travailler directement sur ma préparation d’orientation.</span></span>
              </label>
              <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${wantsBeta ? 'border-rose-300 bg-white dark:border-rose-700 dark:bg-slate-900' : 'border-transparent'}`}>
                <input type="radio" name="signup-intent" checked={wantsBeta} onChange={() => setWantsBeta(true)} className="mt-1 accent-rose-500" />
                <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                <span><strong className="block text-sm text-slate-900 dark:text-white">Demander à devenir bêta-testeur</strong><span className="mt-0.5 block text-xs leading-5 text-slate-500 dark:text-slate-400">Je souhaite tester, signaler des problèmes et aider BacPilot à s’améliorer. Cette demande n’active pas automatiquement l’accès bêta.</span></span>
              </label>
            </fieldset>

            {wantsBeta && (
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-3.5 text-xs leading-5 text-slate-600 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-slate-300">
                <input type="checkbox" checked={signupContextConsent} onChange={(event) => setSignupContextConsent(event.target.checked)} className="mt-0.5 accent-rose-500" />
                <span><ShieldCheck className="mr-1 inline-block h-3.5 w-3.5 text-indigo-500" />J’accepte que BacPilot transmette à l’équipe, uniquement pour traiter ma demande bêta, mon point d’entrée, la catégorie de mon appareil et mon navigateur. <strong>Ni adresse IP, ni mot de passe, ni cookie, ni jeton, ni contenu de session</strong> ne sont collectés ou envoyés sur Telegram.</span>
              </label>
            )}

            <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-rose-950/40 transition-all hover:scale-[1.02] hover:bg-rose-600 disabled:opacity-50">
              {wantsBeta ? <FlaskConical className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              <span>{isLoading ? 'Création en cours…' : wantsBeta ? 'Envoyer ma demande bêta' : 'Créer mon compte & continuer'}</span>
            </button>
          </form>}

          <p className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">Déjà inscrit ? <button onClick={() => navigate(returnToBeta ? '/login?returnTo=beta' : '/login')} className="font-bold text-rose-500 underline hover:text-rose-600">Se connecter ici</button></p>
          <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400"><Laptop className="h-3.5 w-3.5" />Le contexte technique est collecté uniquement après consentement à une demande bêta.</p>
        </div>
      </div>
    </div>
  );
};
