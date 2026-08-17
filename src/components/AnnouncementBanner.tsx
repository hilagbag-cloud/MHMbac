import { useEffect, useState } from 'react';
import { ArrowRight, Copy, Gift, UsersRound, X } from 'lucide-react';

const DISMISS_KEY = 'bacpilot:announcement:referral-v1:dismissed';

export type AnnouncementBannerProps = {
  navigate: (route: string) => void;
};

/**
 * Bannière éditoriale légère. `imageSrc` peut être remplacée par une image de
 * campagne (stockée dans BacPilot) sans changer la structure ou le parcours.
 */
const announcement = {
  imageSrc: '/branding/bacpilot-mark-512.png',
  eyebrow: 'Programme communauté',
  title: 'Fais connaître BacPilot autour de toi.',
  description: 'Ton lien personnel permet de suivre les inscriptions réellement attribuées à ton partage et de faire évoluer ta reconnaissance BacPilot.',
};

export function AnnouncementBanner({ navigate }: AnnouncementBannerProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(window.localStorage.getItem(DISMISS_KEY) !== '1');
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  return (
    <section aria-label="Annonce BacPilot" className="mx-auto max-w-6xl px-4 pt-8 sm:pt-10">
      <div className="relative overflow-hidden rounded-3xl border border-rose-200/70 bg-gradient-to-br from-white via-rose-50 to-violet-50 p-5 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.55)] dark:border-rose-400/15 dark:from-slate-900 dark:via-[#28162d] dark:to-slate-900 sm:p-7">
        <div className="pointer-events-none absolute -right-10 -top-14 h-48 w-48 rounded-full bg-rose-300/25 blur-3xl dark:bg-rose-400/15" />
        <button type="button" onClick={dismiss} aria-label="Masquer cette annonce" className="absolute right-4 top-4 rounded-full p-2 text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white">
          <X className="h-4 w-4" />
        </button>

        <div className="relative grid items-center gap-6 md:grid-cols-[auto_1fr_auto]">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-rose-200 bg-white/90 p-3 shadow-sm dark:border-rose-400/15 dark:bg-slate-950/70">
            <img src={announcement.imageSrc} alt="Programme de parrainage BacPilot" className="h-full w-full object-contain" />
          </div>

          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-600 dark:text-rose-300">{announcement.eyebrow}</p>
            <h2 className="mt-2 text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">{announcement.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{announcement.description}</p>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1.5"><Copy className="h-3.5 w-3.5 text-rose-500" /> Copie ton lien</span>
              <span className="inline-flex items-center gap-1.5"><UsersRound className="h-3.5 w-3.5 text-rose-500" /> Invite autour de toi</span>
              <span className="inline-flex items-center gap-1.5"><Gift className="h-3.5 w-3.5 text-rose-500" /> Suis ta progression</span>
            </div>
          </div>

          <button type="button" onClick={() => navigate('/parrainage')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition duration-150 hover:bg-slate-800 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 dark:bg-rose-500 dark:hover:bg-rose-400 md:self-center">
            Voir mon lien <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default AnnouncementBanner;
