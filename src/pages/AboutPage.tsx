import React from 'react';
import { ArrowRight, BadgeCheck, Compass, ExternalLink, Lightbulb, ShieldCheck, UserRound } from 'lucide-react';
import { MHM_PROMOTION_CONFIG } from '../lib/promotion';

interface AboutPageProps {
  navigate: (route: string) => void;
}

const principles = [
  {
    title: 'Rendre l’information lisible',
    description: 'BacPilot transforme des observations disponibles en pistes de comparaison plus simples à lire avant de faire un choix.',
    icon: Compass,
  },
  {
    title: 'Conserver la décision au candidat',
    description: 'La plateforme ne choisit ni ne valide à la place de l’élève. Elle aide à préparer une décision qui reste personnelle.',
    icon: UserRound,
  },
  {
    title: 'Privilégier la transparence',
    description: 'Les résultats sont présentés comme des pistes à vérifier ; aucune admission ni bourse n’est promise.',
    icon: ShieldCheck,
  },
];

export const AboutPage: React.FC<AboutPageProps> = ({ navigate }) => {
  const go = (event: React.MouseEvent<HTMLAnchorElement>, route: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 text-slate-900 dark:bg-slate-950 dark:text-white sm:py-16">
      <div className="mx-auto max-w-5xl space-y-16 px-4 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-300">À propos de BacPilot</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Une orientation plus claire, sans promesse illusoire.</h1>
          <p className="mt-6 text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
            BacPilot est une initiative de <strong>MHM SOLUTIONS</strong> conçue pour aider les nouveaux bacheliers béninois à comparer des pistes d’orientation avec méthode. La plateforme organise les observations disponibles et les met en regard du profil et des priorités volontairement renseignés par chaque candidat.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {principles.map(({ title, description, icon: Icon }) => (
            <article key={title} className="rounded-3xl border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-300"><Icon className="h-5 w-5" /></div>
              <h2 className="mt-5 text-lg font-bold">{title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{description}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-8 rounded-3xl bg-slate-950 p-7 text-white sm:p-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300 text-slate-950"><Lightbulb className="h-6 w-6" /></div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-amber-200">L’origine du projet</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Faire d’un obstacle vécu une solution utile.</h2>
          </div>
          <div className="space-y-4 text-sm leading-7 text-slate-300">
            <p>Face à la multitude de filières, à l’évolution des classements et au choix parfois difficile entre sécurité financière et projet de carrière, BacPilot propose de replacer la comparaison et la vérification au centre de la préparation.</p>
            <p>La plateforme ne remplace pas les autorités d’orientation. Elle prépare le candidat à consulter les bonnes informations, à poser les bonnes questions et à valider lui-même sa démarche sur le portail officiel compétent.</p>
          </div>
        </section>

        <section className="grid gap-8 border-y border-slate-200 py-14 dark:border-slate-800 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-300">Le créateur</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Hilarus GBAGOULE</h2>
            <p className="mt-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Hilarus Gbagoule est un développeur web et créateur de contenu qui présente publiquement son intérêt pour l’intelligence artificielle, le numérique et l’innovation. À travers MHM SOLUTIONS, il conçoit BacPilot comme un outil concret pour rendre l’orientation post-baccalauréat plus accessible et plus compréhensible.
            </p>
            <a href={MHM_PROMOTION_CONFIG.contact.creatorPortfolio} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-rose-600 underline underline-offset-4 dark:text-rose-300">
              Consulter le portfolio public de Hilarus Gbagoule <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          <aside className="rounded-3xl border border-amber-200 bg-amber-50 p-7 text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
            <BadgeCheck className="h-6 w-6 text-amber-700 dark:text-amber-300" />
            <h3 className="mt-4 text-lg font-black">Un engagement de clarté</h3>
            <p className="mt-3 text-sm leading-relaxed">Chaque recommandation est une aide à la préparation. Les règles officielles, les conditions d’admission et la validation finale restent les références pour toute démarche.</p>
          </aside>
        </section>

        <section className="flex flex-col items-start justify-between gap-5 rounded-3xl border border-rose-200 bg-rose-50 p-7 dark:border-rose-500/20 dark:bg-rose-500/10 sm:flex-row sm:items-center">
          <div><h2 className="text-xl font-black">Comprendre concrètement le fonctionnement</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Découvrez comment BacPilot prépare des pistes avant toute validation officielle.</p></div>
          <a href="/methodologie" onClick={(event) => go(event, '/methodologie')} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white">Voir la méthode <ArrowRight className="h-4 w-4" /></a>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
