import { useEffect, useMemo } from 'react';
import { ArrowRight, Gift, ShieldCheck } from 'lucide-react';

export default function ReferralLandingPage({ code, navigate }: { code: string; navigate: (route: string) => void }) {
  const normalized = useMemo(() => code.replace(/[^A-Za-z0-9]/g, '').slice(0, 32), [code]);

  useEffect(() => {
    if (normalized) window.localStorage.setItem('bacpilot_referral_code', normalized);
  }, [normalized]);

  return <main className="min-h-[72vh] bg-slate-950 px-4 py-12 text-slate-100"><section className="mx-auto max-w-3xl border border-slate-800 bg-[#0c1828] p-7 sm:p-10"><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Invitation BacPilot</p><Gift className="mt-5 h-9 w-9 text-amber-300" /><h1 className="mt-4 text-3xl font-black sm:text-4xl">Prépare tes pistes d’orientation avec plus de repères.</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">Une personne t’a partagé BacPilot. En créant ton profil, tu pourras préciser ta série, tes objectifs et comparer des filières à partir des données disponibles et du guide officiel numérisé.</p><div className="mt-6 border-l-2 border-sky-300 bg-sky-300/[0.06] px-4 py-3 text-sm leading-6 text-sky-100"><ShieldCheck className="mr-1 inline h-4 w-4" />Le lien permet de reconnaître le partage une seule fois après une inscription réelle. Il ne donne accès à aucune donnée personnelle et ne modifie pas tes choix officiels.</div><button onClick={() => navigate(`/register?ref=${encodeURIComponent(normalized)}`)} disabled={!normalized} className="mt-7 inline-flex items-center gap-2 bg-amber-300 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-40">Créer mon profil BacPilot <ArrowRight className="h-4 w-4" /></button></section></main>;
}
