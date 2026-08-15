import React from 'react';
import { ExternalLink, Mail, MessageCircleQuestion, ShieldCheck } from 'lucide-react';
import { MHM_PROMOTION_CONFIG } from '../lib/promotion';

export const ContactPage: React.FC = () => {
  const email = MHM_PROMOTION_CONFIG.contact.officialEmail;
  const subject = encodeURIComponent('Question à propos de BacPilot');

  return (
    <div className="min-h-screen bg-slate-50 py-12 text-slate-900 dark:bg-slate-950 dark:text-white sm:py-16">
      <div className="mx-auto max-w-4xl space-y-10 px-4 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-300">Contact</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Une question sur BacPilot ?</h1>
          <p className="mt-5 text-base leading-relaxed text-slate-600 dark:text-slate-300">Pour une question sur la plateforme, un retour d’expérience ou une proposition de partenariat, écrivez directement à l’équipe MHM SOLUTIONS.</p>
        </section>

        <section className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-3xl bg-slate-950 p-8 text-white sm:p-10">
            <Mail className="h-7 w-7 text-rose-300" />
            <h2 className="mt-5 text-2xl font-black">Écrire à BacPilot</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">Votre client de messagerie s’ouvrira avec un objet déjà préparé. N’envoyez jamais un mot de passe ou une information sensible par e-mail.</p>
            <a href={`mailto:${email}?subject=${subject}`} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white">{email} <ExternalLink className="h-4 w-4" /></a>
          </article>
          <aside className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
            <MessageCircleQuestion className="h-7 w-7 text-indigo-600 dark:text-indigo-300" />
            <h2 className="mt-5 text-xl font-black">Avant de nous écrire</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">Si votre question concerne une admission, une bourse ou une validation, consultez d’abord les règles de l’organisme concerné. BacPilot aide à comparer et à préparer ; il ne décide pas à la place des autorités.</p>
          </aside>
        </section>

        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-7 text-emerald-950 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
          <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><div><h2 className="font-black">Respect de votre vie privée</h2><p className="mt-2 text-sm leading-6">Un message de contact est traité comme une demande d’échange. Pour connaître la gestion des informations renseignées dans votre profil BacPilot, consultez la politique de confidentialité.</p><a href="/privacy" className="mt-4 inline-flex text-sm font-bold underline underline-offset-4">Voir la politique de confidentialité</a></div></div>
        </section>
      </div>
    </div>
  );
};

export default ContactPage;
