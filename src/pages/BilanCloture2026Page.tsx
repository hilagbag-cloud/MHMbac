import { ArrowRight, CalendarDays, ExternalLink, Facebook, Heart, Instagram, Linkedin, Sparkles, Users } from 'lucide-react';

const gallery = [
  {
    src: '/campaign/bilan-2026/01-bilan-bacpilot-2026.png',
    alt: 'Bilan BacPilot 2026 — clôture de la campagne d’orientation béninoise',
    title: 'Une première campagne au service de l’orientation',
    text: 'BacPilot clôture sa campagne 2026 avec une ambition confirmée : rendre l’orientation post-bac plus lisible, plus transparente et plus humaine.',
  },
  {
    src: '/campaign/bilan-2026/02-mission-orientation.png',
    alt: 'Les trois piliers de BacPilot : intelligence artificielle, données officielles et transparence',
    title: 'Une mission construite sur trois piliers',
    text: 'L’intelligence artificielle conversationnelle, la lecture des données officielles et la transparence sur les observations ont guidé la conception de BacPilot.',
  },
  {
    src: '/campaign/bilan-2026/03-impact-chiffres.png',
    alt: 'Statistiques de la campagne BacPilot 2026 : profils, recommandations IA, sessions et événements bêta',
    title: 'Un impact mesuré, sans extrapolation',
    text: 'Les chiffres présentés correspondent aux activités enregistrées dans la plateforme au moment de la clôture : 36 profils, 148 recommandations IA, 24 sessions et 294 événements bêta.',
  },
  {
    src: '/campaign/bilan-2026/04-engagement-beta.png',
    alt: 'Engagement des bêta-testeurs BacPilot : 10 testeurs actifs et 4 feedbacks structurés',
    title: 'Le bêta-test au cœur de l’amélioration',
    text: 'Dix bêta-testeurs actifs ont testé les parcours, remonté des incohérences et proposé des améliorations. Leurs retours ont nourri les évolutions de la plateforme.',
  },
  {
    src: '/campaign/bilan-2026/05-hommage-contributeurs.png',
    alt: 'Hommage aux contributeurs bêta BacPilot',
    title: 'Merci à celles et ceux qui ont contribué',
    text: 'Une reconnaissance particulière est adressée aux contributeurs dont le profil public a été activé avec leur consentement, ainsi qu’à toute la communauté de test.',
  },
  {
    src: '/campaign/bilan-2026/06-avenir.png',
    alt: 'Les prochaines étapes de BacPilot : évolution IA, communauté et innovation',
    title: 'La clôture ouvre une nouvelle étape',
    text: 'La fin de la campagne ne marque pas la fin du projet. Elle ouvre de nouveaux chantiers pour améliorer l’IA, la communauté et les outils numériques utiles aux étudiants.',
  },
  {
    src: '/campaign/bilan-2026/07-merci.png',
    alt: 'Message final de remerciement BacPilot 2026',
    title: 'Une aventure collective',
    text: 'BacPilot remercie les utilisateurs, les bêta-testeurs et toutes les personnes qui ont contribué à poser les bases d’une orientation plus claire au Bénin.',
  },
];

const socialPosts = [
  { name: 'LinkedIn', href: 'https://lnkd.in/p/ey6YB6b2', icon: Linkedin, tone: 'border-sky-300/30 bg-sky-300/10 text-sky-100', label: 'Lire le bilan sur LinkedIn' },
  { name: 'Facebook', href: 'https://www.facebook.com/share/p/1GKoepuJtH/', icon: Facebook, tone: 'border-blue-300/30 bg-blue-300/10 text-blue-100', label: 'Lire le bilan sur Facebook' },
  { name: 'Instagram', href: 'https://www.instagram.com/p/DccA5U4kXcL/?img_index=6&igsh=MWF4MWFpazh0bW5yNQ==', icon: Instagram, tone: 'border-pink-300/30 bg-pink-300/10 text-pink-100', label: 'Voir le carrousel sur Instagram' },
];

export function BilanCloture2026Page({ navigate }: { navigate: (route: string) => void }) {
  return (
    <main className="bg-slate-950 text-slate-100">
      <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_12%_10%,rgba(236,72,153,0.28),transparent_32%),radial-gradient(circle_at_88%_20%,rgba(139,92,246,0.28),transparent_34%),#0f172a] px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-4xl">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-rose-300"><CalendarDays className="h-4 w-4" />Événement du 24 août 2026</p>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-6xl">Bilan BacPilot 2026 : une campagne d’orientation construite avec sa communauté</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">La clôture officielle de la campagne d’orientation est l’occasion de revenir sur une première expérience dédiée aux bacheliers béninois, à l’intelligence artificielle et à une lecture plus transparente des choix post-bac.</p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold"><button type="button" onClick={() => document.getElementById('carrousel-bilan')?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-white transition hover:bg-rose-400 active:scale-[0.97]">Voir le bilan visuel <ArrowRight className="h-4 w-4" /></button><button type="button" onClick={() => navigate('/fondateur-hilarus-gbagoule')} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-slate-200 transition hover:bg-white/10">Découvrir le créateur <ExternalLink className="h-4 w-4" /></button></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-300">Une initiative indépendante</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Aider à mieux comprendre avant de choisir</h2>
            <div className="mt-6 space-y-5 text-base leading-8 text-slate-300"><p>BacPilot a été créé pour accompagner les nouveaux bacheliers dans un moment important : la comparaison des filières, des établissements, des localités, des débouchés et des conditions à vérifier sur les plateformes officielles.</p><p>La plateforme ne remplace pas les services officiels et ne promet ni admission, ni inscription, ni bourse. Elle aide à préparer les questions, à organiser les informations disponibles et à rendre les choix plus compréhensibles.</p><p>Le projet est porté par <strong className="text-white">Hilarus Gbagoule</strong>, créateur et développeur de BacPilot et fondateur de MHM SOLUTIONS. Sa vision est d’utiliser le numérique et l’intelligence artificielle pour concevoir des outils utiles, accessibles et ancrés dans les besoins réels des utilisateurs.</p></div>
          </div>
          <aside className="border border-white/10 bg-white/[0.04] p-7"><div className="flex items-center gap-3 text-rose-300"><Sparkles className="h-5 w-5" /><p className="text-xs font-black uppercase tracking-[0.18em]">Ce que cette phase a permis</p></div><ul className="mt-6 space-y-4 text-sm leading-7 text-slate-300"><li className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-rose-400" />Tester une expérience d’orientation conversationnelle et personnalisée.</li><li className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-violet-400" />Présenter les observations de collecte avec leur fraîcheur et leurs limites.</li><li className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-sky-400" />Améliorer la plateforme grâce aux retours structurés de la communauté bêta.</li></ul></aside>
        </div>
      </section>

      <section className="border-y border-white/10 bg-slate-900/60 px-4 py-14 sm:px-6 sm:py-20"><div className="mx-auto max-w-6xl"><div className="flex items-end justify-between gap-5"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">Les chiffres de la campagne</p><h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Un bilan fondé sur les activités enregistrées</h2></div><span className="hidden items-center gap-2 text-xs font-bold text-slate-400 sm:flex"><Users className="h-4 w-4" />Données au 24 août 2026</span></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="border-t-2 border-rose-400 bg-white/[0.04] p-6"><p className="text-4xl font-black text-white">36</p><p className="mt-2 text-sm font-bold text-slate-400">profils créés</p></div><div className="border-t-2 border-violet-400 bg-white/[0.04] p-6"><p className="text-4xl font-black text-white">148</p><p className="mt-2 text-sm font-bold text-slate-400">recommandations IA</p></div><div className="border-t-2 border-sky-400 bg-white/[0.04] p-6"><p className="text-4xl font-black text-white">24</p><p className="mt-2 text-sm font-bold text-slate-400">sessions d’orientation</p></div><div className="border-t-2 border-amber-400 bg-white/[0.04] p-6"><p className="text-4xl font-black text-white">294</p><p className="mt-2 text-sm font-bold text-slate-400">événements bêta</p></div></div><p className="mt-5 max-w-3xl text-xs leading-6 text-slate-500">Ces indicateurs décrivent les activités enregistrées dans BacPilot. Ils ne constituent pas une mesure de satisfaction exhaustive et ne doivent pas être interprétés comme une garantie de résultat.</p></div></section>

      <section id="carrousel-bilan" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-14 sm:px-6 sm:py-20"><div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[0.2em] text-rose-300">Le bilan en images</p><h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Sept moments pour comprendre l’aventure</h2><p className="mt-4 text-base leading-7 text-slate-400">Chaque visuel est accompagné d’une description pour rendre le récit accessible, partageable et compréhensible même sans consulter la présentation complète.</p></div><div className="mt-10 grid gap-8 md:grid-cols-2">{gallery.map((item, index) => <figure key={item.src} className="overflow-hidden border border-white/10 bg-white/[0.035]"><div className="aspect-video bg-slate-900"><img src={item.src} alt={item.alt} width={2000} height={1125} loading={index === 0 ? 'eager' : 'lazy'} className="h-full w-full object-contain" /></div><figcaption className="border-t border-white/10 px-5 py-5"><p className="text-xs font-black uppercase tracking-[0.16em] text-rose-300">Étape {index + 1}</p><h3 className="mt-2 text-xl font-black text-white">{item.title}</h3><p className="mt-2 text-sm leading-7 text-slate-400">{item.text}</p></figcaption></figure>)}</div></section>

      <section className="border-t border-white/10 bg-[linear-gradient(110deg,rgba(236,72,153,0.15),rgba(139,92,246,0.18))] px-4 py-14 sm:px-6 sm:py-20"><div className="mx-auto max-w-4xl text-center"><Heart className="mx-auto h-8 w-8 text-rose-300" /><h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">Merci aux bêta-testeurs</h2><p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-200">Cette première version a progressé grâce aux personnes qui ont accepté de tester, de questionner et de signaler. D’autres projets numériques arriveront et auront besoin de cette même énergie pour devenir plus utiles.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><button type="button" onClick={() => navigate('/contributeurs-beta')} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100">Voir la communauté bêta <ArrowRight className="h-4 w-4" /></button><button type="button" onClick={() => navigate('/beta')} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/30 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10">Participer aux prochains tests</button></div></div></section>

      <section className="border-t border-white/10 bg-slate-900/70 px-4 py-14 sm:px-6 sm:py-20"><div className="mx-auto max-w-5xl text-center"><p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">Le bilan sur les réseaux</p><h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Lire, partager et faire connaître l’initiative</h2><p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-400">Retrouvez la publication complète sur les canaux officiels de BacPilot. Chaque bouton ouvre directement le post correspondant dans un nouvel onglet.</p><div className="mt-8 grid gap-4 md:grid-cols-3">{socialPosts.map(({ name, href, icon: Icon, tone, label }) => <a key={name} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={`group flex min-h-20 items-center gap-4 rounded-2xl border px-5 py-4 text-left transition hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300 ${tone}`}><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950/50"><Icon className="h-5 w-5" aria-hidden="true" /></span><span><strong className="block text-sm font-black text-white">{name}</strong><span className="mt-1 block text-xs font-semibold opacity-80">{label}</span></span><ExternalLink className="ml-auto h-4 w-4 shrink-0 opacity-70 transition group-hover:opacity-100" /></a>)}</div></div></section>
    </main>
  );
}

export default BilanCloture2026Page;
