import { FormEvent, useEffect, useState } from 'react';
import { CircleDollarSign, ExternalLink, Heart, HeartHandshake, LoaderCircle, MessageCircleMore } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BACPILOT_WHATSAPP_CHANNEL_URL, createSupportIntent, FeaturedSupporter, listFeaturedSupporters } from '../lib/community';

const suggestedAmounts = [500, 1000, 2500, 5000];

export default function SupportPage({ navigate }: { navigate: (route: string) => void }) {
  const { user, profile } = useAuth();
  const [amount, setAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [recognitionConsent, setRecognitionConsent] = useState(false);
  const [supporters, setSupporters] = useState<FeaturedSupporter[]>([]);
  const [loadingSupporters, setLoadingSupporters] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    void listFeaturedSupporters()
      .then(setSupporters)
      .catch(() => setNotice('Les reconnaissances sont momentanément indisponibles.'))
      .finally(() => setLoadingSupporters(false));
  }, []);

  const selectedAmount = customAmount.trim() ? Number(customAmount) : amount;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user?.id || !profile?.email) {
      navigate('/login');
      return;
    }
    if (!Number.isFinite(selectedAmount) || selectedAmount < 100) {
      setNotice('Indique un montant à partir de 100 FCFA.');
      return;
    }
    setSending(true);
    setNotice('');
    try {
      await createSupportIntent({
        userId: user.id,
        name: profile.display_name || 'Soutien BacPilot',
        email: profile.email,
        amountXof: selectedAmount,
        message,
        recognitionConsent,
      });
      setNotice('Merci. Ton intention de soutien est enregistrée. L’équipe BacPilot te contactera par e-mail pour convenir d’un moyen de dépôt ; aucun paiement n’a été prélevé sur ce site.');
      setMessage('');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Demande de soutien non enregistrée.');
    } finally {
      setSending(false);
    }
  };

  return <main className="min-h-[72vh] bg-slate-950 px-4 py-8 text-slate-100 sm:px-6"><div className="mx-auto max-w-6xl"><header className="grid gap-6 border-b border-slate-800 pb-8 lg:grid-cols-[1.1fr_.9fr]"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-200">Soutenir l’initiative</p><h1 className="mt-3 text-3xl font-black sm:text-4xl">Aider BacPilot à rester utile et accessible.</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">Un soutien volontaire contribue au développement et à la maintenance de l’initiative BacPilot par MHM SOLUTIONS. La demande ci-dessous ne déclenche aucun paiement automatisé : elle ouvre seulement un échange avec l’équipe.</p></div><aside className="border border-rose-300/30 bg-rose-400/[0.06] p-6"><HeartHandshake className="h-7 w-7 text-rose-200" /><p className="mt-3 text-lg font-black">Transparence d’abord.</p><p className="mt-2 text-sm leading-6 text-slate-300">Choisis un montant, puis l’équipe te contacte avant toute suite. Ne partage jamais un mot de passe, un code OTP ou une information bancaire dans un message.</p></aside></header><section className="mt-8 grid gap-7 lg:grid-cols-[.9fr_1.1fr]"><form onSubmit={submit} className="border border-slate-800 bg-[#0c1828] p-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-300">Intention de soutien</p><h2 className="mt-2 text-2xl font-black">Choisir un montant</h2><div className="mt-5 grid grid-cols-2 gap-3">{suggestedAmounts.map((value) => <button type="button" key={value} onClick={() => { setAmount(value); setCustomAmount(''); }} className={`border px-4 py-3 text-sm font-black transition ${!customAmount && amount === value ? 'border-amber-300 bg-amber-300 text-slate-950' : 'border-slate-700 text-slate-200 hover:border-amber-300'}`}>{value.toLocaleString('fr-FR')} FCFA</button>)}</div><label className="mt-5 block text-sm font-bold text-slate-200">Autre montant (FCFA)</label><input inputMode="numeric" min="100" value={customAmount} onChange={(event) => setCustomAmount(event.target.value.replace(/[^0-9]/g, ''))} placeholder="Ex. 7500" className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-amber-300" /><label className="mt-5 block text-sm font-bold text-slate-200">Un mot pour l’équipe <span className="font-normal text-slate-500">(facultatif)</span></label><textarea maxLength={1000} rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Pourquoi souhaites-tu soutenir BacPilot ?" className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-3 text-sm leading-6 text-white outline-none focus:border-amber-300" /><label className="mt-5 flex items-start gap-3 text-sm leading-6 text-slate-300"><input type="checkbox" checked={recognitionConsent} onChange={(event) => setRecognitionConsent(event.target.checked)} className="mt-1 h-4 w-4" />J’autorise BacPilot à me proposer, après confirmation de mon soutien, une mise en avant publique avec mon nom et une photo que je fournirai volontairement.</label><button disabled={sending} className="mt-6 inline-flex items-center gap-2 bg-rose-300 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-40">{sending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CircleDollarSign className="h-4 w-4" />}Demander à soutenir</button>{notice && <p role="status" className="mt-4 text-sm leading-6 text-rose-100">{notice}</p>}</form><section><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Remerciements</p><h2 className="mt-2 text-2xl font-black">Les soutiens mis à l’honneur</h2></div><Heart className="h-6 w-6 text-rose-200" /></div>{loadingSupporters ? <p className="mt-6 flex items-center gap-2 text-sm text-slate-400"><LoaderCircle className="h-4 w-4 animate-spin" />Chargement…</p> : supporters.length === 0 ? <div className="mt-6 border border-dashed border-slate-700 p-7 text-sm leading-6 text-slate-400">Les personnes qui choisissent d’être mises à l’honneur apparaîtront ici uniquement après confirmation de leur soutien et consentement explicite.</div> : <div className="mt-6 grid gap-4 sm:grid-cols-2">{supporters.map((supporter) => <article key={supporter.id} className="border border-slate-800 bg-[#0c1828] p-5"><div className="flex items-center gap-3">{supporter.photo_url ? <img src={supporter.photo_url} alt="" className="h-12 w-12 rounded-full object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-300 font-black text-slate-950">{supporter.full_name.slice(0, 1)}</div>}<div><p className="font-black">{supporter.full_name}</p><p className="text-xs text-slate-500">Soutien BacPilot</p></div></div>{supporter.note && <p className="mt-4 text-sm leading-6 text-slate-300">{supporter.note}</p>}</article>)}</div>}<a href={BACPILOT_WHATSAPP_CHANNEL_URL} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 border border-emerald-300/40 px-4 py-3 text-sm font-bold text-emerald-100 transition hover:bg-emerald-300/10"><MessageCircleMore className="h-4 w-4" />Suivre la chaîne BacPilot sur WhatsApp <ExternalLink className="h-4 w-4" /></a></section></section></div></main>;
}
