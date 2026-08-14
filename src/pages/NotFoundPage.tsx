import React from 'react';

interface NotFoundPageProps { navigate: (route: string) => void; }

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ navigate }) => (
  <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-16 text-slate-900 dark:bg-slate-950 dark:text-white">
    <section className="w-full max-w-xl text-center">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-rose-500">Erreur 404</p>
      <h1 className="mt-4 text-4xl font-black">Cette page n’existe pas</h1>
      <p className="mx-auto mt-4 max-w-md text-slate-500 dark:text-slate-400">Le lien est peut-être ancien ou incomplet. Le parcours d’orientation reste accessible depuis l’accueil.</p>
      <button onClick={() => navigate('/')} className="mt-8 rounded-xl bg-rose-500 px-6 py-3 text-sm font-bold text-white">Retour à l’accueil</button>
    </section>
  </main>
);

export default NotFoundPage;
