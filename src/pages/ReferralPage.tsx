import { useEffect, useMemo, useState } from 'react';
import { Copy, Gift, LoaderCircle, Share2, UsersRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMyReferralSummary, ReferralSummary } from '../lib/community';

export default function ReferralPage({ navigate }: { navigate: (route: string) => void }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    void getMyReferralSummary()
      .then(setSummary)
      .catch((error) => setNotice(error instanceof Error ? error.message : 'Parrainage indisponible.'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const shareUrl = useMemo(() => summary?.referral_code ? `https://bacpilot.site/r/${summary.referral_code}` : '', [summary?.referral_code]);
  const shareText = useMemo(() => shareUrl ? `Découvre BacPilot pour préparer tes choix d’orientation après le bac : ${shareUrl}` : '', [shareUrl]);

  if (!user) {
    return <main className="min-h-[68vh] bg-slate-950 px-5 py-16 text-slate-100"><section className="mx-auto max-w-2xl border border-slate-800 bg-[#0c1828] p-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Communauté BacPilot</p><h1 className="mt-3 text-3xl font-black">Parraine un futur bachelier.</h1><p className="mt-4 leading-7 text-slate-300">Connecte-toi pour obtenir ton lien personnel et suivre les inscriptions réellement attribuées à ton partage.</p><button onClick={() => navigate('/login')} className="mt-6 bg-amber-300 px-5 py-3 font-black text-slate-950">Me connecter</button></section></main>;
  }

  const progressTarget = summary?.next_milestone || 10;
  const progress = summary ? Math.min(100, Math.round((summary.invited_count / progressTarget) * 100)) : 0;

  const copy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setNotice('Ton lien de parrainage a été copié.');
    } catch {
      setNotice('Copie indisponible sur cet appareil. Sélectionne le lien affiché pour le partager.');
    }
  };

  return <main className="min-h-[72vh] bg-slate-950 px-4 py-8 text-slate-100 sm:px-6"><div className="mx-auto max-w-5xl"><header className="border-b border-slate-800 pb-7"><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Communauté BacPilot</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Partage BacPilot autour de toi.</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Ton lien permet de suivre les personnes qui créent réellement leur profil après ton partage. Les paliers sont des reconnaissances BacPilot, jamais une promesse financière.</p></header>{loading ? <div className="flex min-h-56 items-center gap-3 text-slate-400"><LoaderCircle className="h-5 w-5 animate-spin" />Chargement de ton espace…</div> : <section className="mt-7 grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><div className="border border-slate-800 bg-[#0c1828] p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-slate-300">Ton lien court</p><p className="mt-2 break-all text-lg font-black text-white">{shareUrl || 'Lien indisponible'}</p></div><Share2 className="h-6 w-6 text-amber-300" /></div><div className="mt-6 flex flex-wrap gap-3"><button onClick={() => void copy()} disabled={!shareUrl} className="inline-flex items-center gap-2 bg-amber-300 px-4 py-2.5 text-sm font-black text-slate-950 disabled:opacity-40"><Copy className="h-4 w-4" />Copier le lien</button><a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border border-slate-600 px-4 py-2.5 text-sm font-bold text-slate-100">Partager sur WhatsApp</a></div>{notice && <p role="status" className="mt-4 text-sm text-sky-200">{notice}</p>}</div><aside className="border border-slate-800 bg-[#0c1828] p-6"><p className="text-sm font-bold text-slate-300">Ta progression</p><div className="mt-4 flex items-end justify-between"><p className="text-4xl font-black text-amber-300">{summary?.invited_count || 0}</p><UsersRound className="h-7 w-7 text-sky-300" /></div><p className="mt-1 text-sm text-slate-400">invité{(summary?.invited_count || 0) > 1 ? 's' : ''} inscrit{(summary?.invited_count || 0) > 1 ? 's' : ''}</p><div className="mt-5 h-2 overflow-hidden bg-slate-800"><div className="h-full bg-amber-300" style={{ width: `${progress}%` }} /></div><p className="mt-3 text-sm leading-6 text-slate-300"><Gift className="mr-1 inline h-4 w-4 text-amber-300" />Statut : <strong>{summary?.reward_label || 'Premier partage'}</strong>{summary?.next_milestone ? ` · prochain palier : ${summary.next_milestone}` : ' · tous les paliers sont atteints'}.</p></aside></section>}<section className="mt-7 border border-slate-800 bg-slate-900/60 p-6"><h2 className="text-xl font-black">Règles de confiance</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Un seul parrain peut être associé à un compte, l’auto-parrainage est bloqué et le compteur évolue uniquement après une création de profil réelle. BacPilot peut modifier les formes de reconnaissance annoncées sur la plateforme, sans créer de gain financier automatique.</p></section></div></main>;
}
