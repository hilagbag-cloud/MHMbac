import React from 'react';
import { ArrowRight, BarChart3, CheckCircle2, ClipboardCheck, DatabaseZap, ShieldCheck } from 'lucide-react';

interface MethodologyPageProps {
  navigate: (route: string) => void;
}

const steps = [
  { number: '01', title: 'Vous précisez votre contexte', description: 'Série, mention, objectif prioritaire et domaines envisagés permettent de cadrer les pistes qui vous seront présentées.', icon: ClipboardCheck },
  { number: '02', title: 'BacPilot lit les observations disponibles', description: 'Les relevés synchronisés renseignent les filières observées et leur date de mise à jour. Ils peuvent évoluer à tout moment.', icon: DatabaseZap },
  { number: '03', title: 'Les pistes sont comparées', description: 'Un calcul déterministe met en regard votre objectif — bourse, carrière ou équilibre — et les informations disponibles.', icon: BarChart3 },
  { number: '04', title: 'Vous vérifiez et vous décidez', description: 'Les trois pistes restent des pistes. Vous contrôlez les règles officielles puis validez vous-même votre démarche sur le portail compétent.', icon: CheckCircle2 },
];

export const MethodologyPage: React.FC<MethodologyPageProps> = ({ navigate }) => {
  const go = (event: React.MouseEvent<HTMLAnchorElement>, route: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 text-slate-900 dark:bg-slate-950 dark:text-white sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-300">Méthode BacPilot</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Comparer, décider, avancer — avec méthode.</h1>
          <p className="mt-6 text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">BacPilot ne remplace pas une décision d’orientation. Il organise les informations utiles pour que chaque candidat puisse préparer ses choix avec davantage de clarté.</p>
        </section>

        <section className="mt-14 grid gap-5 md:grid-cols-2">
          {steps.map(({ number, title, description, icon: Icon }) => (
            <article key={number} className="relative rounded-3xl border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-slate-900">
              <span className="absolute right-6 top-5 text-4xl font-black text-slate-100 dark:text-slate-800">{number}</span>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"><Icon className="h-5 w-5" /></div>
              <h2 className="mt-6 text-xl font-black">{title}</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">{description}</p>
            </article>
          ))}
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl bg-slate-950 p-8 text-white"><ShieldCheck className="h-7 w-7 text-emerald-300" /><h2 className="mt-5 text-2xl font-black">Ce que BacPilot fait</h2><p className="mt-4 text-sm leading-7 text-slate-300">Il aide à comparer des pistes selon les informations observées, votre série, votre mention et la priorité que vous indiquez. Il rend visible la date de mise à jour et rappelle les limites des données.</p></article>
          <article className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100"><ShieldCheck className="h-7 w-7 text-amber-700 dark:text-amber-300" /><h2 className="mt-5 text-2xl font-black">Ce que BacPilot ne fait pas</h2><p className="mt-4 text-sm leading-7">Il ne garantit jamais une bourse, une admission ou une inscription. Il ne soumet aucun choix à votre place et ne remplace pas les règles officielles ni le portail de validation.</p></article>
        </section>

        <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-slate-900 sm:p-10">
          <h2 className="text-2xl font-black">Pourquoi la date des observations compte</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">Les inscriptions et les indicateurs peuvent changer pendant une campagne. Une piste qui semble pertinente aujourd’hui doit donc être relue avant toute décision. BacPilot affiche ce contexte pour favoriser une préparation prudente, plutôt qu’une certitude artificielle.</p>
          <a href="/onboarding" onClick={(event) => go(event, '/onboarding')} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white">Préparer mes pistes <ArrowRight className="h-4 w-4" /></a>
        </section>
      </div>
    </div>
  );
};

export default MethodologyPage;
