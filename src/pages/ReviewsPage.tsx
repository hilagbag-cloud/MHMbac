import { FormEvent, useEffect, useState } from 'react';
import { LoaderCircle, MessageSquareQuote, ShieldCheck, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { listPublishedReviews, PublicReview, submitReview } from '../lib/community';

function Stars({ value, interactive = false, onChange }: { value: number; interactive?: boolean; onChange?: (value: number) => void }) {
  return <div className="flex gap-1" aria-label={`${value} sur 5`}>
    {[1, 2, 3, 4, 5].map((star) => interactive ? <button key={star} type="button" onClick={() => onChange?.(star)} className="p-0.5" aria-label={`Donner ${star} étoile${star > 1 ? 's' : ''}`}><Star className={`h-6 w-6 ${star <= value ? 'fill-amber-300 text-amber-300' : 'text-slate-600'}`} /></button> : <Star key={star} className={`h-4 w-4 ${star <= value ? 'fill-amber-300 text-amber-300' : 'text-slate-600'}`} />)}
  </div>;
}

export default function ReviewsPage({ navigate }: { navigate: (route: string) => void }) {
  const { user, profile } = useAuth();
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    void listPublishedReviews()
      .then(setReviews)
      .catch(() => setNotice('Les avis publiés sont momentanément indisponibles.'))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user?.id) {
      navigate('/login');
      return;
    }
    setSending(true);
    setNotice('');
    try {
      await submitReview({ userId: user.id, rating, title, body, displayName: profile?.display_name || 'Utilisateur BacPilot' });
      setTitle('');
      setBody('');
      setNotice('Merci. Ton avis est publié immédiatement avec ton accord et ton nom d’affichage.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Avis non envoyé.');
    } finally {
      setSending(false);
    }
  };

  return <main className="min-h-[72vh] bg-slate-950 px-4 py-8 text-slate-100 sm:px-6"><div className="mx-auto max-w-6xl"><header className="grid gap-6 border-b border-slate-800 pb-8 lg:grid-cols-[1.1fr_.9fr]"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Retours de la communauté</p><h1 className="mt-3 text-3xl font-black sm:text-4xl">Les avis de la communauté BacPilot.</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">Après avoir utilisé la plateforme, partage ce qui t’a aidé, ce qui reste confus et ce que nous devons améliorer. Les avis soumis par un compte connecté sont publiés automatiquement avec l’accord de leur auteur.</p></div><aside className="border border-slate-800 bg-[#0c1828] p-5"><ShieldCheck className="h-6 w-6 text-emerald-300" /><p className="mt-3 font-black">Pas de note inventée.</p><p className="mt-2 text-sm leading-6 text-slate-400">BacPilot n’affiche pas de moyenne artificielle et n’ajoute pas d’étoiles dans ses données structurées. Google exclut les étoiles auto-attribuées par une organisation à elle-même.</p></aside></header><section className="mt-8 grid gap-7 lg:grid-cols-[.85fr_1.15fr]"><form onSubmit={submit} className="border border-slate-800 bg-[#0c1828] p-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-300">Après ton premier test</p><h2 className="mt-2 text-2xl font-black">Laisser un avis</h2><p className="mt-2 text-sm leading-6 text-slate-400">Un compte connecté est requis pour limiter les faux avis. Ton nom d’affichage apparaîtra publiquement avec ton avis.</p><div className="mt-5"><label className="text-sm font-bold text-slate-200">Ta note</label><div className="mt-2"><Stars value={rating} interactive onChange={setRating} /></div></div><label className="mt-5 block text-sm font-bold text-slate-200">Titre</label><input required minLength={3} maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex. Une lecture plus claire de mes pistes" className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-sky-300" /><label className="mt-5 block text-sm font-bold text-slate-200">Ton expérience</label><textarea required minLength={10} maxLength={1500} rows={6} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Explique ce que tu as réellement testé et ce qui a été utile ou à améliorer." className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-3 text-sm leading-6 text-white outline-none focus:border-sky-300" /><p className="mt-3 text-xs leading-5 text-slate-500">En envoyant, tu confirmes que cet avis est personnel, basé sur ton expérience de BacPilot et peut être affiché publiquement avec ton nom d’affichage.</p><button disabled={sending} className="mt-5 inline-flex items-center gap-2 bg-amber-300 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-40">{sending && <LoaderCircle className="h-4 w-4 animate-spin" />}Envoyer mon avis</button>{notice && <p role="status" className="mt-4 text-sm leading-6 text-sky-100">{notice}</p>}</form><section><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Avis publiés par la communauté</p><h2 className="mt-2 text-2xl font-black">Ce que les utilisateurs disent</h2></div><MessageSquareQuote className="h-6 w-6 text-amber-300" /></div>{loading ? <p className="mt-6 flex items-center gap-2 text-sm text-slate-400"><LoaderCircle className="h-4 w-4 animate-spin" />Chargement des avis…</p> : reviews.length === 0 ? <div className="mt-6 border border-dashed border-slate-700 p-7 text-sm leading-6 text-slate-400">Les premiers retours soumis par des utilisateurs connectés apparaîtront ici après une expérience réelle de BacPilot.</div> : <div className="mt-6 grid gap-4 md:grid-cols-2">{reviews.map((review) => <article key={review.id} className="border border-slate-800 bg-[#0c1828] p-5"><Stars value={review.rating} /><h3 className="mt-4 font-black text-white">{review.title}</h3><p className="mt-3 text-sm leading-6 text-slate-300">{review.body}</p><p className="mt-4 text-xs font-bold text-slate-500">{review.display_name}{review.published_at ? ` · publié le ${new Date(review.published_at).toLocaleDateString('fr-FR')}` : ''}</p></article>)}</div>}</section></section></div></main>;
}
