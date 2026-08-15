import React from 'react';
import { AlertTriangle, CheckCircle2, FileText, Shield } from 'lucide-react';

export const TermsPage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const openMethod = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    navigate('/methodologie');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 text-slate-900 dark:bg-slate-950 dark:text-white sm:py-16">
      <div className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6 lg:px-8">
        <header className="border-b border-slate-200 pb-6 dark:border-slate-800">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-300"><FileText className="h-4 w-4" />Cadre d’utilisation</div>
          <h1 className="mt-4 text-4xl font-black tracking-tight">Conditions d’utilisation</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">Conditions applicables à BacPilot, initiative indépendante de MHM SOLUTIONS.</p>
        </header>

        <div className="space-y-6 text-sm leading-7 text-slate-600 dark:text-slate-300">
          <section className="rounded-3xl border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-slate-900"><Shield className="h-5 w-5 text-rose-500" /><h2 className="mt-4 text-xl font-black text-slate-900 dark:text-white">1. Rôle de BacPilot</h2><p className="mt-3">BacPilot est un outil d’aide à la préparation de l’orientation post-baccalauréat. Il aide les candidats à comparer des pistes à partir des observations disponibles et des informations qu’ils renseignent volontairement.</p></section>

          <section className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-7 text-amber-950 dark:text-amber-100"><AlertTriangle className="h-5 w-5 text-amber-700 dark:text-amber-300" /><h2 className="mt-4 text-xl font-black">2. Aucune garantie d’admission ou de bourse</h2><p className="mt-3">BacPilot ne garantit ni admission, ni inscription définitive, ni bourse, ni secours d’études. Les décisions relèvent des autorités, commissions et établissements compétents. Toute validation doit être faite par le candidat sur le canal officiel concerné.</p></section>

          <section className="rounded-3xl border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-slate-900"><CheckCircle2 className="h-5 w-5 text-indigo-500" /><h2 className="mt-4 text-xl font-black text-slate-900 dark:text-white">3. Nature des observations</h2><p className="mt-3">Les indicateurs affichés décrivent un état observé à un instant donné. Ils peuvent évoluer pendant une campagne et ne remplacent ni les règles officielles, ni les informations publiées par les organismes compétents. BacPilot ne présente pas de donnée inventée comme une information réelle.</p><a href="/methodologie" onClick={openMethod} className="mt-5 inline-flex font-bold text-rose-600 underline underline-offset-4 dark:text-rose-300">Comprendre la méthode BacPilot</a></section>

          <section className="rounded-3xl border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-slate-900"><CheckCircle2 className="h-5 w-5 text-emerald-500" /><h2 className="mt-4 text-xl font-black text-slate-900 dark:text-white">4. Utilisation responsable</h2><p className="mt-3">Le candidat reste responsable des informations qu’il renseigne, des choix qu’il prépare et des démarches qu’il effectue. L’accès à BacPilot ne donne aucun droit d’accès, de modification ou de soumission sur un portail institutionnel tiers.</p></section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
