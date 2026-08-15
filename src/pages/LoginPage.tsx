import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Compass, LogIn, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps { navigate: (route: string) => void; }

export const LoginPage: React.FC<LoginPageProps> = ({ navigate }) => {
  const { signIn, errorMessage, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const returnToBeta = new URLSearchParams(window.location.search).get('returnTo') === 'beta';
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setLocalError(null); clearError(); setLoading(true);
    try { const result = await signIn(email.trim(), password); if (result.success) navigate(returnToBeta ? '/beta-access' : '/dashboard'); else setLocalError(result.error || 'Identifiants invalides.'); }
    catch (error) { setLocalError(error instanceof Error ? error.message : 'Connexion impossible.'); }
    finally { setLoading(false); }
  };
  return <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950"><section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"><button onClick={() => navigate('/')} className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500 text-white"><Compass className="h-6 w-6" /></button><h1 className="mt-5 text-center text-2xl font-bold">Se connecter</h1><p className="mt-2 text-center text-sm text-slate-500">{returnToBeta ? 'Connecte-toi pour vérifier ton invitation au programme bêta.' : 'Retrouve ton profil et ton classement personnalisé.'}</p>{(localError || errorMessage) && <div className="mt-6 flex gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"><AlertCircle className="h-4 w-4 shrink-0" />{localError || errorMessage}</div>}<form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm font-semibold">Adresse e-mail<div className="relative mt-2"><Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nom@exemple.com" className="w-full rounded-xl border border-slate-300 bg-transparent py-3 pl-10 pr-3 outline-none focus:border-rose-500 dark:border-slate-700" /></div></label><label className="block text-sm font-semibold">Mot de passe<div className="relative mt-2"><Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Ton mot de passe" className="w-full rounded-xl border border-slate-300 bg-transparent py-3 pl-10 pr-3 outline-none focus:border-rose-500 dark:border-slate-700" /></div></label><button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-3 font-bold text-white disabled:opacity-50">{loading ? 'Connexion…' : 'Se connecter'} <LogIn className="h-4 w-4" /></button></form><p className="mt-6 text-center text-sm text-slate-500">Pas encore de compte ? <button onClick={() => navigate(returnToBeta ? '/register?returnTo=beta' : '/register')} className="font-bold text-rose-500">Créer mon profil <ArrowRight className="inline h-4 w-4" /></button></p></section></main>;
};
export default LoginPage;
