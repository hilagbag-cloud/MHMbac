import type { MouseEvent } from 'react';
import { ArrowRight, BookOpenCheck, Clock3, ExternalLink, GraduationCap } from 'lucide-react';
import { BACPILOT_ARTICLES, articlePath } from '../lib/articles';

export default function ArticlesPage({ navigate }: { navigate: (route: string) => void }) {
  const onInternalLink = (event: MouseEvent<HTMLAnchorElement>, route: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    navigate(route);
  };

  return (
    <main className="min-h-[72vh] bg-slate-950 px-4 py-9 text-slate-100 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="grid gap-7 border-b border-slate-800 pb-9 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-300">Articles & conseils</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">Comprendre son orientation, sans se perdre dans les rumeurs.</h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">BacPilot publie des repères pratiques pour comparer des pistes, préparer ses choix et retrouver les bonnes sources. Les démarches, dates et conditions qui évoluent doivent toujours être vérifiées auprès des canaux officiels.</p>
          </div>
          <aside className="border border-slate-800 bg-slate-900/70 p-5">
            <BookOpenCheck className="h-6 w-6 text-amber-300" />
            <p className="mt-3 font-black">Notre méthode éditoriale</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">Nous expliquons les questions durables ; pour les règles de campagne, nous citons et relions les sources officielles au lieu de recopier des informations qui peuvent changer.</p>
          </aside>
        </header>

        <section className="mt-9 grid gap-5 md:grid-cols-3" aria-label="Articles d’orientation">
          {BACPILOT_ARTICLES.map((article, index) => (
            <article key={article.slug} className={`group flex min-h-80 flex-col border border-slate-800 p-6 ${index === 0 ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/30 md:col-span-2' : 'bg-slate-900/55'}`}>
              <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.15em] text-rose-200">
                <span>{article.category}</span>
                <span className="flex items-center gap-1 normal-case tracking-normal text-slate-400"><Clock3 className="h-3.5 w-3.5" />{article.readingTime}</span>
              </div>
              <h2 className={`mt-5 font-black tracking-tight text-white ${index === 0 ? 'max-w-2xl text-2xl sm:text-3xl' : 'text-xl'}`}>{article.title}</h2>
              <p className="mt-4 text-sm leading-6 text-slate-300">{article.description}</p>
              <div className="mt-auto pt-7">
                <a href={articlePath(article)} onClick={(event) => onInternalLink(event, articlePath(article))} className="inline-flex items-center gap-2 text-sm font-bold text-amber-200 transition-colors hover:text-amber-100">Lire l’article <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></a>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-9 grid gap-5 border-t border-slate-800 pt-9 lg:grid-cols-[1fr_1fr]">
          <div className="border border-slate-800 bg-slate-900/40 p-6">
            <GraduationCap className="h-6 w-6 text-sky-300" />
            <h2 className="mt-3 text-xl font-black">Préparer ses pistes avec BacPilot</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">Crée ton profil, précise ce qui compte pour toi et compare des pistes à vérifier avant toute démarche officielle.</p>
            <button onClick={() => navigate('/onboarding')} className="mt-5 bg-rose-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-rose-400">Préparer mon orientation</button>
          </div>
          <div className="border border-slate-800 bg-slate-900/40 p-6">
            <ExternalLink className="h-6 w-6 text-emerald-300" />
            <h2 className="mt-3 text-xl font-black">Vérifier sur le portail officiel</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">Les dates, critères et confirmations administratives relèvent de la campagne en cours. Consulte le portail officiel avant de valider tes choix.</p>
            <a href="https://apresmonbac.bj/" target="_blank" rel="noreferrer" className="mt-5 inline-flex bg-slate-100 px-4 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-white">Ouvrir Après mon bac</a>
          </div>
        </section>
      </div>
    </main>
  );
}
