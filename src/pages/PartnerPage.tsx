import React from 'react';
import { ArrowRight, Building2, Handshake, HeartHandshake, Mail, ShieldCheck, UsersRound } from 'lucide-react';

interface PartnerPageProps {
  partnerPortal?: boolean;
}

const contactEmail = 'contact@bacpilot.site';
const supportEmail = 'support@bacpilot.site';

const partnershipPaths = [
  {
    title: 'Établissements et universités',
    description: 'Partager des informations d’orientation vérifiables et aider les candidats à mieux comprendre les parcours proposés.',
    icon: Building2,
  },
  {
    title: 'Associations et communautés',
    description: 'Relayer une information claire auprès des bacheliers et faire remonter les besoins observés sur le terrain.',
    icon: UsersRound,
  },
  {
    title: 'Entreprises et acteurs de l’innovation',
    description: 'Contribuer à une orientation plus lisible en partageant expertise, accompagnement ou opportunités utiles.',
    icon: HeartHandshake,
  },
];

export const PartnerPage: React.FC<PartnerPageProps> = ({ partnerPortal = false }) => {
  const contactSubject = encodeURIComponent('Proposition de partenariat — BacPilot');

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/95 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <a href="https://bacpilot.site" className="flex items-center gap-3" aria-label="Retour vers BacPilot">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-rose-500"><img src="/branding/bacpilot-mark-256.webp" alt="Logo BacPilot" className="h-9 w-9 object-contain" /></span>
            <span><strong className="block text-lg tracking-tight">Bac<span className="text-rose-400">Pilot</span></strong><small className="text-xs text-slate-400">Espace partenaire</small></span>
          </a>
          <a href="https://bacpilot.site" className="text-sm font-semibold text-slate-300 underline underline-offset-4 hover:text-white">Découvrir BacPilot</a>
        </div>
      </header>

      <main>
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(244,63,94,0.18),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.22),transparent_32%)] px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-300">{partnerPortal ? 'Espace partenaire BacPilot' : 'Partenariats BacPilot'}</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">Construisons une orientation plus accessible pour les bacheliers.</h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">BacPilot souhaite travailler avec des structures qui partagent une même exigence : une information utile, compréhensible et toujours vérifiable avant toute décision d’orientation.</p>
            <a href={`mailto:${contactEmail}?subject=${contactSubject}`} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-rose-500 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-rose-400 active:scale-[0.98]">Proposer un partenariat <ArrowRight className="h-4 w-4" /></a>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">Collaborer avec BacPilot</p><h2 className="mt-3 text-3xl font-black tracking-tight">Trois manières de contribuer utilement</h2></div>
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {partnershipPaths.map(({ title, description, icon: Icon }) => (
              <article key={title} className="rounded-3xl border border-white/10 bg-slate-900 p-7"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-400/10 text-indigo-200"><Icon className="h-5 w-5" /></div><h3 className="mt-6 text-lg font-black">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-300">{description}</p></article>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-slate-900/60 px-4 py-14 sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div><Handshake className="h-7 w-7 text-amber-300" /><h2 className="mt-5 text-3xl font-black tracking-tight">Un échange simple, sans promesse artificielle.</h2><p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">Décrivez votre structure, votre domaine d’action et la contribution envisagée. BacPilot étudie les échanges qui renforcent l’accès à une orientation fiable, sans automatiser ni influencer la décision finale des candidats.</p></div>
            <div className="rounded-3xl border border-white/10 bg-slate-950 p-7"><Mail className="h-6 w-6 text-rose-300" /><h3 className="mt-5 text-lg font-black">Canaux officiels BacPilot</h3><p className="mt-3 text-sm leading-6 text-slate-300">Pour les propositions de partenariat, utilisez l’adresse dédiée. Pour une question technique sur la plateforme, utilisez le canal support.</p><div className="mt-6 space-y-3"><a href={`mailto:${contactEmail}?subject=${contactSubject}`} className="block rounded-xl bg-white/5 px-4 py-3 text-sm font-bold text-rose-200 hover:bg-white/10">{contactEmail}</a><a href={`mailto:${supportEmail}?subject=${encodeURIComponent('Support — BacPilot')}`} className="block rounded-xl bg-white/5 px-4 py-3 text-sm font-bold text-sky-200 hover:bg-white/10">{supportEmail}</a></div></div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6"><div className="flex gap-3 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6 text-emerald-50"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" /><p className="text-sm leading-7">Un partenariat avec BacPilot ne donne accès ni aux données personnelles des candidats, ni au contrôle de leurs recommandations. Toute collaboration respecte la confidentialité des profils et l’indépendance de la décision du candidat.</p></div></section>
      </main>

      <footer className="border-t border-white/10 px-4 py-8 text-center text-xs text-slate-500 sm:px-6">© {new Date().getFullYear()} BacPilot — par MHM SOLUTIONS. Compare. Décide. Avance.</footer>
    </div>
  );
};

export default PartnerPage;
