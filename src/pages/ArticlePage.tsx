import type { MouseEvent } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, ExternalLink, FileCheck2 } from 'lucide-react';
import { BacPilotArticle, BACPILOT_ARTICLES, articlePath } from '../lib/articles';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00Z`));
}

export default function ArticlePage({ article, navigate }: { article: BacPilotArticle; navigate: (route: string) => void }) {
  const related = BACPILOT_ARTICLES.filter((item) => item.slug !== article.slug).slice(0, 2);
  const onInternalLink = (event: MouseEvent<HTMLAnchorElement>, route: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    navigate(route);
  };

  return (
    <main className="min-h-[72vh] bg-slate-950 px-4 py-9 text-slate-100 sm:px-6 sm:py-12">
      <article className="mx-auto max-w-4xl">
        <a href="/articles" onClick={(event) => onInternalLink(event, '/articles')} className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-white"><ArrowLeft className="h-4 w-4" />Articles & conseils</a>
        <header className="mt-7 border-b border-slate-800 pb-9">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-300">{article.category}</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">{article.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">{article.description}</p>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-400"><span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />Publié le {formatDate(article.publishedAt)}</span><span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4" />{article.readingTime}</span></div>
        </header>

        <aside className="mt-7 border-l-2 border-amber-300 bg-amber-300/10 p-5 text-sm leading-7 text-amber-50"><strong>À retenir :</strong> {article.takeaway}</aside>

        <div className="mt-9 space-y-10">
          {article.sections.map((section) => <section key={section.heading}>
            <h2 className="text-2xl font-black tracking-tight text-white">{section.heading}</h2>
            <div className="mt-4 space-y-4 text-base leading-8 text-slate-300">
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
            {section.points && <ul className="mt-5 space-y-3 border-l border-slate-700 pl-5 text-sm leading-7 text-slate-300">{section.points.map((point) => <li key={point}>{point}</li>)}</ul>}
          </section>)}
        </div>

        <section className="mt-11 border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-start gap-3"><FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" /><div><h2 className="font-black text-white">Source et vérification</h2><p className="mt-2 text-sm leading-6 text-slate-400">Cet article s’appuie notamment sur : {article.sourceLabel}. Les informations de campagne peuvent changer ; vérifie toujours la source officielle avant de réaliser une démarche.</p><a href={article.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-200 transition-colors hover:text-emerald-100">Consulter la source <ExternalLink className="h-4 w-4" /></a></div></div>
        </section>

        <section className="mt-9 border-t border-slate-800 pt-9">
          <h2 className="text-xl font-black">Poursuivre la lecture</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">{related.map((item) => <a key={item.slug} href={articlePath(item)} onClick={(event) => onInternalLink(event, articlePath(item))} className="group border border-slate-800 bg-slate-900/45 p-5 transition-colors hover:border-slate-600"><p className="text-xs font-bold uppercase tracking-[0.15em] text-rose-200">{item.category}</p><h3 className="mt-3 font-black text-white">{item.title}</h3><span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-amber-200">Lire <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span></a>)}</div>
        </section>
      </article>
    </main>
  );
}
