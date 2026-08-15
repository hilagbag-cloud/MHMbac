import React from 'react';
import { Database, Eye, Lock, ShieldCheck } from 'lucide-react';
import { MHM_PROMOTION_CONFIG } from '../lib/promotion';

export const PrivacyPage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const openContact = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    navigate('/contact');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 text-slate-900 dark:bg-slate-950 dark:text-white sm:py-16">
      <div className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6 lg:px-8">
        <header className="border-b border-slate-200 pb-6 dark:border-slate-800">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"><ShieldCheck className="h-4 w-4" />Vie privée et sécurité</div>
          <h1 className="mt-4 text-4xl font-black tracking-tight">Politique de confidentialité</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">Cette page explique, dans un langage simple, les informations utilisées par BacPilot pour personnaliser une préparation d’orientation.</p>
        </header>

        <div className="space-y-6 text-sm leading-7 text-slate-600 dark:text-slate-300">
          <section className="rounded-3xl border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-slate-900"><Lock className="h-5 w-5 text-rose-500" /><h2 className="mt-4 text-xl font-black text-slate-900 dark:text-white">Les informations que vous renseignez</h2><p className="mt-3">Lorsque vous créez un profil et préparez vos pistes, BacPilot utilise les informations nécessaires à cette expérience : nom d’affichage, e-mail, série, mention, objectif, domaines d’intérêt et, si vous les ajoutez volontairement, quelques signaux académiques. Les mots de passe ne sont pas stockés dans les tables applicatives BacPilot.</p></section>

          <section className="rounded-3xl border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-slate-900"><Database className="h-5 w-5 text-indigo-500" /><h2 className="mt-4 text-xl font-black text-slate-900 dark:text-white">Pourquoi ces informations sont utilisées</h2><p className="mt-3">Elles servent à enregistrer votre profil, reprendre votre préparation, calculer vos pistes selon votre objectif et vous afficher votre espace personnel. Elles ne permettent jamais de modifier les observations collectées pour les autres utilisateurs.</p></section>

          <section className="rounded-3xl border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-slate-900"><ShieldCheck className="h-5 w-5 text-emerald-500" /><h2 className="mt-4 text-xl font-black text-slate-900 dark:text-white">Accès et protection</h2><p className="mt-3">Les profils et préférences sont protégés par des règles d’accès : un utilisateur connecté accède uniquement à ses propres données. Les observations publiques utilisées pour comparer les filières sont séparées des données de profil.</p></section>

          <section className="rounded-3xl border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-slate-900"><Eye className="h-5 w-5 text-amber-500" /><h2 className="mt-4 text-xl font-black text-slate-900 dark:text-white">Vos choix et vos demandes</h2><p className="mt-3">Vous pouvez demander une correction ou la suppression de vos informations de profil. BacPilot ne vend pas les informations personnelles renseignées par les candidats et ne les utilise pas pour une publicité ciblée indépendante de la plateforme.</p><a href="/contact" onClick={openContact} className="mt-5 inline-flex font-bold text-rose-600 underline underline-offset-4 dark:text-rose-300">Contacter MHM SOLUTIONS pour une demande liée aux données</a></section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
