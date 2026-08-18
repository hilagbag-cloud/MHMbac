import React from 'react';
import { ArrowRight, Bot, Code2, ExternalLink, Globe2, Lightbulb, PenLine, Sparkles } from 'lucide-react';
import { MHM_PROMOTION_CONFIG } from '../lib/promotion';

interface FounderPageProps {
  navigate: (route: string) => void;
}

const fields = [
  {
    title: 'Sites web et applications',
    description: 'Transformer une idée en une expérience numérique claire, utile et accessible.',
    icon: Code2,
  },
  {
    title: 'IA et automatisation',
    description: 'Explorer des outils capables de simplifier des recherches, des parcours et des décisions concrètes.',
    icon: Bot,
  },
  {
    title: 'Contenu et recherche',
    description: 'Rendre des sujets complexes plus lisibles grâce à des contenus structurés et sourcés.',
    icon: PenLine,
  },
  {
    title: 'Design et communication',
    description: 'Concevoir des identités et des interfaces qui font comprendre une idée avant même de la détailler.',
    icon: Sparkles,
  },
];

export const FounderPage: React.FC<FounderPageProps> = ({ navigate }) => {
  const onInternalLink = (event: React.MouseEvent<HTMLAnchorElement>, route: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <section className="border-b border-slate-800 bg-slate-950 px-4 py-16 text-white sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-300">Créateur de BacPilot</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">Hilarus Gbagoule, entre numérique, IA et projets utiles.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Développeur web et créateur de contenu, Hilarus Gbagoule s’intéresse à l’intelligence artificielle, au numérique et à l’innovation. À travers MHM SOLUTIONS, il conçoit des outils pensés pour transformer une difficulté concrète en solution plus claire et plus accessible.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={MHM_PROMOTION_CONFIG.contact.creatorPortfolio} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-black text-white transition hover:bg-rose-400">
                Voir le portfolio public <ExternalLink className="h-4 w-4" />
              </a>
              <a href={MHM_PROMOTION_CONFIG.contact.creatorLinkedIn} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-5 py-3 text-sm font-bold text-slate-100 transition hover:border-slate-400 hover:bg-white/5">
                Profil professionnel <Globe2 className="h-4 w-4" />
              </a>
            </div>
          </div>
          <aside className="rounded-3xl border border-white/10 bg-white/[0.06] p-7 backdrop-blur-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">La vision derrière BacPilot</p>
            <p className="mt-4 text-xl font-black leading-relaxed text-white">« Aider à mieux comprendre avant de décider. »</p>
            <p className="mt-5 text-sm leading-7 text-slate-300">BacPilot est né de l’idée qu’un choix d’orientation mérite des repères lisibles, des données expliquées et une vérification responsable — jamais une promesse d’admission.</p>
          </aside>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-16 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="rounded-3xl bg-rose-50 p-7 dark:bg-rose-500/10">
            <Lightbulb className="h-7 w-7 text-rose-600 dark:text-rose-300" />
            <h2 className="mt-5 text-2xl font-black tracking-tight">Une démarche de création</h2>
          </div>
          <div className="space-y-5 text-base leading-8 text-slate-600 dark:text-slate-300">
            <p>Le fil conducteur est simple : partir d’un besoin compréhensible, structurer l’information utile et construire une expérience numérique qui laisse toujours la décision finale à la personne concernée.</p>
            <p>Avec BacPilot, cette démarche s’applique à l’orientation post-baccalauréat : rendre les possibilités plus faciles à explorer, les données plus transparentes et les sources officielles plus accessibles à consulter.</p>
            <p>La plateforme reste une initiative indépendante. Elle accompagne la préparation des choix sans se substituer aux autorités, aux règles officielles ni au jugement du candidat.</p>
          </div>
        </section>

        <section>
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-600 dark:text-rose-300">Univers de création</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Des projets numériques, avec une même exigence de clarté.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">Le portfolio public présente des réalisations et des domaines de création. BacPilot y occupe une place particulière : celle d’un outil destiné à faciliter une étape importante du parcours des bacheliers.</p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {fields.map(({ title, description, icon: Icon }) => (
              <article key={title} className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <Icon className="h-6 w-6 text-rose-500" />
                <h3 className="mt-5 text-lg font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-600 dark:text-rose-300">BacPilot</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Un projet pour éclairer l’orientation, pas la décider à la place des candidats.</h2>
            <p className="mt-5 text-sm leading-7 text-slate-600 dark:text-slate-300">Découvre la méthode, les principes de transparence et les contenus pratiques qui encadrent la plateforme.</p>
          </div>
          <div className="flex flex-col justify-center gap-3 lg:items-end">
            <a href="/about" onClick={(event) => onInternalLink(event, '/about')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">À propos de BacPilot <ArrowRight className="h-4 w-4" /></a>
            <a href="/methodologie" onClick={(event) => onInternalLink(event, '/methodologie')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-rose-300 hover:text-rose-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-rose-400 dark:hover:text-rose-300">Lire la méthode BacPilot <ArrowRight className="h-4 w-4" /></a>
          </div>
        </section>

        <section className="rounded-3xl bg-slate-100 p-7 dark:bg-slate-900/60 sm:p-10">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Repères publics</p>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">Cette page réunit uniquement les informations pertinentes à BacPilot et accessibles publiquement : son créateur, sa vision, le portfolio où sont présentés ses projets et le profil professionnel associé. Elle ne prétend pas remplacer ces sources ni exposer des informations personnelles.</p>
          <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Profil BacPilot mis à jour le 18 août 2026.</p>
        </section>
      </main>
    </div>
  );
};

export default FounderPage;
