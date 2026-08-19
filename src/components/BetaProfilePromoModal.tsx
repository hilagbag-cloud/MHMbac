import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, FlaskConical, X } from 'lucide-react';

type BetaProfilePromoModalProps = {
  navigate: (route: string) => void;
};

type PromoSlide = {
  src: string;
  alt: string;
  label: string;
};

const DISMISS_KEY = 'bacpilot_beta_profile_promo_dismissed';

const slides: PromoSlide[] = [
  {
    src: '/campaign/bacpilot-promo-profil-01.webp',
    alt: 'Bannière BacPilot : ton engagement prend de la valeur',
    label: 'Découvre la nouvelle reconnaissance BacPilot',
  },
  {
    src: '/campaign/bacpilot-promo-profil-02.webp',
    alt: 'Bannière BacPilot présentant les premiers profils contributeurs',
    label: 'Découvre les profils qui font avancer BacPilot',
  },
  {
    src: '/campaign/bacpilot-promo-profil-03.webp',
    alt: 'Bannière BacPilot : prêt à faire partie des pionniers',
    label: 'Rejoins le programme bêta BacPilot',
  },
];

export function BetaProfilePromoModal({ navigate }: BetaProfilePromoModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const close = () => {
    setIsOpen(false);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // L’affichage reste fonctionnel même si le stockage est indisponible.
    }
  };

  useEffect(() => {
    try {
      setIsOpen(window.sessionStorage.getItem(DISMISS_KEY) !== '1');
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

  const isLastSlide = activeIndex === slides.length - 1;
  const slide = slides[activeIndex];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/85 px-3 py-4 backdrop-blur-sm sm:px-6" role="dialog" aria-modal="true" aria-label="Découvrir le programme bêta BacPilot">
      <section className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-slate-950 shadow-[0_34px_100px_-28px_rgba(0,0,0,0.9)]">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-slate-950 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-200"><FlaskConical className="h-4 w-4" /></span>
            <div className="min-w-0">
              <p className="truncate text-xs font-black uppercase tracking-[0.15em] text-rose-200">Programme bêta BacPilot</p>
              <p className="truncate text-xs text-slate-400">{slide.label}</p>
            </div>
          </div>
          <button type="button" onClick={close} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-300 transition duration-150 hover:bg-white/10 hover:text-white active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300" aria-label="Fermer cette présentation">
            <X className="h-4 w-4" /><span className="hidden sm:inline">Fermer</span>
          </button>
        </div>

        <div className="bg-[#060b18] px-2 pt-2 sm:px-4 sm:pt-4">
          <img src={slide.src} alt={slide.alt} width={1440} height={810} fetchPriority={activeIndex === 0 ? 'high' : 'auto'} className="aspect-video w-full rounded-2xl object-contain" />
        </div>

        <div className="flex flex-col gap-3 bg-slate-950 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2" aria-label={`Étape ${activeIndex + 1} sur ${slides.length}`}>
            {slides.map((item, index) => (
              <span key={item.src} className={`h-2 rounded-full transition-all duration-200 ${index === activeIndex ? 'w-8 bg-rose-400' : 'w-2 bg-white/25'}`} aria-hidden="true" />
            ))}
            <span className="ml-2 text-xs font-semibold text-slate-400">{activeIndex + 1} / {slides.length}</span>
          </div>

          {isLastSlide ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button type="button" onClick={() => { close(); navigate('/beta-access'); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-black text-white transition duration-150 hover:border-rose-300/70 hover:bg-white/10 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300">
                <CheckCircle2 className="h-4 w-4 text-rose-300" /> Vérifier mon éligibilité
              </button>
              <a href="https://beta.bacpilot.site" onClick={close} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-black text-white transition duration-150 hover:bg-rose-400 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300">
                Rejoindre le bêta test <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          ) : (
            <button type="button" onClick={() => setActiveIndex((index) => index + 1)} className="inline-flex min-h-11 items-center justify-center gap-2 self-stretch rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-black text-white transition duration-150 hover:bg-rose-400 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300 sm:self-auto">
              Continuer <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

export default BetaProfilePromoModal;
