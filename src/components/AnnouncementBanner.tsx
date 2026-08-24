import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, Pause, Play } from 'lucide-react';

export type AnnouncementBannerProps = {
  navigate: (route: string) => void;
};

type CampaignSlide = {
  src: string;
  alt: string;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  destination: string;
};

const slides: CampaignSlide[] = [
  {
    src: '/campaign/bilan-2026/01-bilan-bacpilot-2026.png',
    alt: 'Bilan BacPilot 2026 et clôture de la campagne d’orientation au Bénin',
    eyebrow: 'Événement du 24 août 2026',
    title: 'Bilan de clôture BacPilot 2026',
    description: 'Découvrez les chiffres de la campagne, l’engagement des bêta-testeurs et la vision qui accompagne la suite du projet.',
    cta: 'Lire le bilan',
    destination: '/bilan-cloture-orientation-2026',
  },
  {
    src: '/campaign/bacpilot-carrousel-01-decouvrir.webp',
    alt: 'Visuel de lancement BacPilot présentant la plateforme d’orientation post-bac',
    eyebrow: 'À découvrir',
    title: 'BacPilot, ton repère après le Bac',
    description: 'Explore les possibilités d’orientation à partir des informations officielles et de ton profil.',
    cta: 'Comprendre l’orientation',
    destination: '/orientation-bac-benin',
  },
  {
    src: '/campaign/bacpilot-carrousel-02-donnees.webp',
    alt: 'Visuel BacPilot présentant les données observées sur les filières',
    eyebrow: 'Données observées',
    title: 'Des repères issus des données disponibles',
    description: 'BacPilot affiche clairement la fraîcheur des observations et explique comment elles sont utilisées.',
    cta: 'Voir la méthode',
    destination: '/methodologie',
  },
  {
    src: '/campaign/bacpilot-carrousel-03-communaute.webp',
    alt: 'Visuel BacPilot consacré à sa communauté de candidats et bêta-testeurs',
    eyebrow: 'Communauté',
    title: 'Une plateforme construite avec ses utilisateurs',
    description: 'Découvre les retours de la communauté et partage ton expérience de BacPilot.',
    cta: 'Lire les avis',
    destination: '/avis',
  },
  {
    src: '/campaign/bacpilot-carrousel-04-fonctionnement.webp',
    alt: 'Visuel BacPilot expliquant le parcours d’orientation sur la plateforme',
    eyebrow: 'Comment ça marche',
    title: 'Clarifier tes choix, étape par étape',
    description: 'Prépare ton projet, consulte les pistes proposées et vérifie toujours les conditions officielles.',
    cta: 'Préparer mes choix',
    destination: '/orientation-bac-benin',
  },
  {
    src: '/campaign/bacpilot-carrousel-05-parrainage.webp',
    alt: 'Visuel BacPilot présentant le programme de parrainage communautaire',
    eyebrow: 'Programme communauté',
    title: 'Partage BacPilot autour de toi',
    description: 'Utilise ton lien de parrainage pour suivre les inscriptions réellement attribuées à ton partage.',
    cta: 'Découvrir le parrainage',
    destination: '/parrainage',
  },
];

const AUTO_ADVANCE_MS = 6500;

export function AnnouncementBanner({ navigate }: AnnouncementBannerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const goTo = (index: number) => setActiveIndex((index + slides.length) % slides.length);
  const goNext = () => setActiveIndex((current) => (current + 1) % slides.length);
  const goPrevious = () => setActiveIndex((current) => (current - 1 + slides.length) % slides.length);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener?.('change', updatePreference);
    return () => mediaQuery.removeEventListener?.('change', updatePreference);
  }, []);

  useEffect(() => {
    if (isPaused || prefersReducedMotion) return undefined;
    const timer = window.setInterval(goNext, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [isPaused, prefersReducedMotion]);

  return (
    <section
      aria-label="Actualités BacPilot"
      aria-roledescription="carrousel"
      className="mx-auto max-w-6xl px-4 pt-8 sm:pt-10"
    >
      <div className="overflow-hidden rounded-[2rem] border border-violet-100 bg-slate-950 shadow-[0_18px_55px_-30px_rgba(15,23,42,0.8)] dark:border-violet-300/15">
        <div className="flex transition-transform duration-500 ease-out motion-reduce:transition-none" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
          {slides.map((slide, index) => (
            <article key={slide.src} aria-hidden={index !== activeIndex} className="min-w-full">
              <div className="grid min-h-[390px] md:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.15fr)] md:min-h-[430px]">
                <button
                  type="button"
                  tabIndex={index === activeIndex ? 0 : -1}
                  onClick={() => navigate(slide.destination)}
                  className="group relative flex min-h-[300px] items-center justify-center overflow-hidden bg-[#171126] px-5 py-6 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-rose-300 sm:px-7"
                  aria-label={`${slide.cta} — ${slide.title}`}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_15%,rgba(236,72,153,0.26),transparent_42%),radial-gradient(circle_at_70%_85%,rgba(139,92,246,0.32),transparent_45%)]" />
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    width={612}
                    height={816}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                    className="relative h-[300px] w-auto max-w-full rounded-[1.25rem] object-contain shadow-[0_22px_50px_-25px_rgba(0,0,0,0.8)] transition duration-200 group-hover:scale-[1.015] motion-reduce:transition-none sm:h-[340px] md:h-[382px]"
                  />
                </button>

                <div className="flex flex-col justify-center px-6 py-7 text-white sm:px-8 md:px-10">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-300">{slide.eyebrow}</p>
                  <h2 className="mt-3 max-w-xl text-2xl font-black tracking-tight sm:text-3xl">{slide.title}</h2>
                  <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">{slide.description}</p>
                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      tabIndex={index === activeIndex ? 0 : -1}
                      onClick={() => navigate(slide.destination)}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-3 text-sm font-black text-white transition duration-150 hover:bg-rose-400 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300"
                    >
                      {slide.cta} <ExternalLink className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-semibold text-slate-400">{index + 1} / {slides.length}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-slate-950 px-5 py-3 sm:px-7">
          <div className="flex items-center gap-1.5" aria-label="Choisir une annonce">
            {slides.map((slide, index) => (
              <button
                key={slide.src}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Afficher l’annonce ${index + 1} : ${slide.title}`}
                aria-current={index === activeIndex ? 'true' : undefined}
                className={`h-2.5 rounded-full transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300 ${index === activeIndex ? 'w-7 bg-rose-400' : 'w-2.5 bg-white/30 hover:bg-white/55'}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button type="button" onClick={goPrevious} aria-label="Annonce précédente" className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setIsPaused((paused) => !paused)} aria-label={isPaused ? 'Reprendre le défilement automatique' : 'Mettre le défilement automatique en pause'} className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300">
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
            <button type="button" onClick={goNext} aria-label="Annonce suivante" className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300">
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AnnouncementBanner;
