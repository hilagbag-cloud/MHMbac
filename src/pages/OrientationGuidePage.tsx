import React from 'react';
import { ArrowRight, CheckCircle2, ExternalLink, ShieldCheck } from 'lucide-react';

const faqs = [
  {
    question: 'BacPilot est-il le portail officiel d’orientation au Bénin ?',
    answer:
      'Non. BacPilot est une initiative indépendante de MHM SOLUTIONS. Il aide à lire et comparer des observations ; le candidat vérifie et valide lui-même toute démarche sur le portail officiel compétent.',
  },
  {
    question: 'BacPilot garantit-il une admission ou une bourse ?',
    answer:
      'Non. BacPilot ne promet ni admission, ni inscription, ni bourse. Les pistes proposées doivent toujours être vérifiées avant toute décision.',
  },
  {
    question: 'Comment BacPilot prépare-t-il des pistes d’orientation ?',
    answer:
      'Le candidat peut préciser sa série, sa mention, son objectif et ses domaines. BacPilot compare ensuite les observations disponibles pour faire ressortir des pistes à vérifier.',
  },
];

export const OrientationGuidePage: React.FC = () => {
  return (
    <main className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <section className="border-b border-slate-800 bg-slate-950 px-4 py-16 text-white sm:py-24">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-300">Guide pratique BacPilot</p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">Préparer son orientation après le bac au Bénin</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg">
            L’orientation post-baccalauréat demande de comparer des filières, de comprendre ses priorités et de suivre l’évolution des informations disponibles. BacPilot propose une méthode simple pour avancer avec prudence, sans remplacer le portail officiel ni promettre un résultat.
          </p>
          <a href="/onboarding" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-rose-500 px-6 py-3 font-bold text-white">
            Préparer mes pistes à vérifier <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:py-18">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">La bonne démarche</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">Une décision éclairée se prépare, puis se vérifie.</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Une filière peut correspondre à un projet, tout en restant très demandée ou soumise à des critères qui évoluent. Il faut donc distinguer une piste intéressante d’une admission assurée.
            </p>
          </div>
          <ol className="space-y-4">
            <li className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-700 dark:bg-rose-500/20 dark:text-rose-200">1</span>
              <div><h3 className="font-bold">Clarifier ses critères</h3><p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">Identifier sa série, sa mention, les domaines envisagés et l’objectif prioritaire : bourse, carrière ou équilibre entre les deux.</p></div>
            </li>
            <li className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-700 dark:bg-rose-500/20 dark:text-rose-200">2</span>
              <div><h3 className="font-bold">Comparer des observations, pas des promesses</h3><p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">Lire la fraîcheur des relevés, les effectifs observés et les éléments de comparaison disponibles avant de retenir une piste.</p></div>
            </li>
            <li className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-700 dark:bg-rose-500/20 dark:text-rose-200">3</span>
              <div><h3 className="font-bold">Vérifier et décider sur le canal officiel</h3><p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">Une fois vos pistes préparées, consultez les règles et réalisez toute validation sur le portail officiel concerné.</p></div>
            </li>
          </ol>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-4 py-14 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-emerald-600" />
            <div>
              <h2 className="text-2xl font-bold">Le rôle précis de BacPilot</h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">BacPilot centralise des observations reçues pendant la campagne d’orientation et les met en regard du profil volontairement renseigné par le candidat. Les résultats sont présentés comme des pistes à vérifier : ils ne valent ni admission, ni inscription, ni attribution de bourse.</p>
            </div>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {['Renseigner son profil avec précision', 'Lire la date de mise à jour des observations', 'Confirmer chaque choix sur le portail officiel'].map((item) => (
              <div key={item} className="flex gap-2 text-sm font-medium text-slate-700 dark:text-slate-200"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">Questions fréquentes</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight">Ce qu’il faut savoir avant de commencer</h2>
        <div className="mt-8 space-y-4">
          {faqs.map((faq) => <article key={faq.question} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><h3 className="text-lg font-bold">{faq.question}</h3><p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{faq.answer}</p></article>)}
        </div>
        <div className="mt-10 rounded-2xl border border-indigo-200 bg-indigo-50 p-6 text-sm text-indigo-950 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-100">
          <p className="font-bold">Pour la validation finale</p>
          <p className="mt-2 leading-relaxed">Consultez les informations et effectuez vos démarches auprès du portail officiel d’orientation des nouveaux bacheliers.</p>
          <a href="https://apresmonbac.bj/" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 font-semibold underline underline-offset-4">Accéder au portail officiel <ExternalLink className="h-4 w-4" /></a>
        </div>
      </section>
    </main>
  );
};

export default OrientationGuidePage;
