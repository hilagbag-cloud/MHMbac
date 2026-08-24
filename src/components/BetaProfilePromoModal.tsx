import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, X } from 'lucide-react';

 type BetaProfilePromoModalProps = {
  navigate: (route: string) => void;
};

const DISMISS_KEY = 'bacpilot_cloture_bilan_dialog_seen_v1';

export function BetaProfilePromoModal({ navigate }: BetaProfilePromoModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const close = () => {
    setIsOpen(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Le dialogue reste utilisable si le stockage local est indisponible.
    }
  };

  useEffect(() => {
    try {
      setIsOpen(window.localStorage.getItem(DISMISS_KEY) !== '1');
    } catch {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/45 px-4 pb-5 pt-20 backdrop-blur-[2px] sm:items-center sm:pb-6" role="dialog" aria-modal="true" aria-labelledby="cloture-dialog-title">
      <section className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/15 bg-slate-950 shadow-[0_25px_80px_-25px_rgba(0,0,0,0.85)]">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-200"><CalendarDays className="h-4 w-4" /></span><div><p className="text-[11px] font-black uppercase tracking-[0.16em] text-rose-200">BacPilot · clôture 2026</p><h2 id="cloture-dialog-title" className="mt-1 text-lg font-black text-white">Découvrez le bilan de la campagne</h2></div></div>
          <button type="button" onClick={close} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300" aria-label="Fermer le message"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-5 py-5"><p className="text-sm leading-6 text-slate-300">La campagne d’orientation se termine aujourd’hui. Retrouvez les chiffres enregistrés, les enseignements du bêta-test, les remerciements à la communauté et les prochaines étapes de BacPilot.</p><div className="mt-5 flex flex-col gap-2 sm:flex-row"><button type="button" onClick={() => { close(); navigate('/bilan-cloture-orientation-2026'); }} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-3 text-sm font-black text-white transition hover:bg-rose-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300">Lire le bilan <ArrowRight className="h-4 w-4" /></button><button type="button" onClick={close} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300">Plus tard</button></div></div>
      </section>
    </div>
  );
}

export default BetaProfilePromoModal;
