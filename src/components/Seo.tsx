import { useEffect } from 'react';
import { articlePath, getArticleBySlug } from '../lib/articles';

const SITE_URL = 'https://bacpilot.site';

type JsonLd = Record<string, unknown>;

type SeoConfig = {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  schema?: JsonLd;
  canonicalUrl?: string;
};

const guideFaqSchema: JsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'BacPilot est-il le portail officiel d’orientation au Bénin ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Non. BacPilot est une initiative indépendante de MHM SOLUTIONS. Il aide à lire et comparer des observations ; le candidat vérifie et valide lui-même toute démarche sur le portail officiel compétent.',
      },
    },
    {
      '@type': 'Question',
      name: 'BacPilot garantit-il une admission ou une bourse ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Non. BacPilot ne promet ni admission, ni inscription, ni bourse. Les propositions sont des pistes à vérifier à partir des observations disponibles et du profil renseigné par le candidat.',
      },
    },
    {
      '@type': 'Question',
      name: 'Comment utiliser BacPilot pour préparer son orientation après le bac ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Le candidat peut consulter les observations disponibles, préciser sa série, sa mention, son objectif et ses domaines, puis comparer les pistes calculées. Il garde le dernier mot et confirme ses choix sur le portail officiel.',
      },
    },
  ],
};

function articleSchema(article: NonNullable<ReturnType<typeof getArticleBySlug>>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: `${SITE_URL}${articlePath(article)}`,
    author: { '@type': 'Organization', name: 'BacPilot' },
    publisher: { '@type': 'Organization', name: 'MHM SOLUTIONS' },
    citation: article.sourceUrl,
  };
}

const founderPerson: JsonLd = {
  '@id': `${SITE_URL}/fondateur-hilarus-gbagoule#person`,
  '@type': 'Person',
  name: 'Hilarus Gbagoule',
  jobTitle: 'Développeur web et créateur de contenu',
  description: 'Créateur de BacPilot et fondateur de MHM SOLUTIONS, intéressé par l’intelligence artificielle, le numérique et l’innovation.',
  url: `${SITE_URL}/fondateur-hilarus-gbagoule`,
  worksFor: {
    '@type': 'Organization',
    name: 'MHM SOLUTIONS',
    url: SITE_URL,
  },
  sameAs: [
    'https://hilarusblog.vercel.app/',
    'https://www.linkedin.com/in/hilarus-gbagoule-6a926b426/',
  ],
  knowsAbout: ['Développement web', 'Création de contenu', 'Intelligence artificielle', 'Innovation numérique'],
};

const founderProfileSchema: JsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  dateModified: '2026-08-18T00:00:00+01:00',
  mainEntity: founderPerson,
};

const contributorDirectorySchema: JsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Contributeurs bêta BacPilot',
  description: 'Une page de reconnaissance des bêta-testeurs BacPilot ayant choisi de présenter publiquement leur contribution.',
  url: `${SITE_URL}/contributeurs-beta`,
  isPartOf: { '@id': `${SITE_URL}/#organization` },
};

const aboutOrganizationSchema: JsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@id': `${SITE_URL}/#organization`,
      '@type': 'Organization',
      name: 'MHM SOLUTIONS',
      alternateName: 'BacPilot',
      url: SITE_URL,
      logo: `${SITE_URL}/branding/bacpilot-mark-512.png`,
      email: 'contact@bacpilot.site',
      description: 'MHM SOLUTIONS conçoit BacPilot, initiative indépendante créée et développée par Hilarus Gbagoule pour aider les bacheliers à comparer des pistes d’orientation à vérifier.',
      founder: { '@id': `${SITE_URL}/fondateur-hilarus-gbagoule#person` },
    },
    founderPerson,
  ],
};

const configs: Record<string, SeoConfig> = {
  '/': {
    title: 'BacPilot | Orientation après le bac au Bénin',
    description:
      'BacPilot, créé et développé par Hilarus Gbagoule via MHM SOLUTIONS, aide les nouveaux bacheliers béninois à comparer des pistes d’orientation à vérifier.',
    path: '/',
  },
  '/articles': {
    title: 'Articles et conseils d’orientation post-bac au Bénin | BacPilot',
    description: 'Des conseils pratiques pour préparer ses choix après le bac au Bénin, comparer des filières et vérifier les démarches auprès des sources officielles.',
    path: '/articles',
  },
  '/orientation-bac-benin': {
    title: 'Orientation après le bac au Bénin : guide pratique | BacPilot',
    description:
      'Comprendre comment comparer ses pistes d’orientation après le bac au Bénin, lire des observations avec prudence et vérifier ses choix sur le portail officiel.',
    path: '/orientation-bac-benin',
    schema: guideFaqSchema,
  },
  '/partenaires': {
    title: 'Devenir partenaire | BacPilot',
    description:
      'Découvrez comment collaborer avec BacPilot pour rendre l’orientation post-baccalauréat plus accessible et vérifiable au Bénin.',
    path: '/partenaires',
    noindex: true,
  },
  '/methodologie': {
    title: 'Comment fonctionne BacPilot ? | BacPilot',
    description:
      'Découvrez comment BacPilot utilise les observations disponibles et les critères du candidat pour comparer des pistes d’orientation à vérifier.',
    path: '/methodologie',
  },
  '/contact': {
    title: 'Contacter BacPilot | MHM SOLUTIONS',
    description:
      'Contactez l’équipe BacPilot pour une question sur la plateforme, un retour d’expérience ou une proposition de partenariat.',
    path: '/contact',
  },
  '/about': {
    title: 'À propos de BacPilot et MHM SOLUTIONS | BacPilot',
    description:
      'Découvrez BacPilot, initiative de MHM SOLUTIONS créée par Hilarus GBAGOULE pour rendre l’orientation post-baccalauréat plus lisible au Bénin.',
    path: '/about',
    schema: aboutOrganizationSchema,
  },
  '/fondateur-hilarus-gbagoule': {
    title: 'Hilarus Gbagoule | Créateur de BacPilot et MHM SOLUTIONS',
    description:
      'Découvrez Hilarus Gbagoule, créateur et développeur de BacPilot, fondateur de MHM SOLUTIONS : sa vision, son parcours de création numérique et son portfolio public.',
    path: '/fondateur-hilarus-gbagoule',
    schema: founderProfileSchema,
  },
  '/beta': {
    title: 'Programme bêta BacPilot | Tester l’orientation post-bac au Bénin',
    description:
      'Rejoignez le programme bêta de BacPilot, initiative de MHM SOLUTIONS créée par Hilarus Gbagoule, pour tester les outils d’orientation et transmettre vos retours.',
    path: '/beta',
  },
  '/contributeurs-beta': {
    title: 'Contributeurs bêta BacPilot | Communauté et reconnaissance',
    description:
      'Découvrez les contributeurs bêta BacPilot qui ont choisi de présenter publiquement leur participation à l’amélioration de l’orientation post-bac.',
    path: '/contributeurs-beta',
    schema: contributorDirectorySchema,
  },
  '/a-propos': {
    title: 'À propos de BacPilot et MHM SOLUTIONS | BacPilot',
    description:
      'Découvrez BacPilot, initiative de MHM SOLUTIONS créée par Hilarus GBAGOULE pour rendre l’orientation post-baccalauréat plus lisible au Bénin.',
    path: '/a-propos',
    canonicalUrl: 'https://bacpilot.site/about',
  },
  '/avis': {
    title: 'Avis utilisateurs BacPilot | Orientation après le bac au Bénin',
    description:
      'Découvrez les retours d’expérience vérifiés de la communauté BacPilot et partagez votre avis après avoir utilisé la plateforme.',
    path: '/avis',
  },
  '/soutenir': {
    title: 'Soutenir BacPilot | MHM SOLUTIONS',
    description:
      'Soutenez volontairement l’initiative BacPilot et découvrez comment votre contribution aide à rendre l’orientation post-baccalauréat plus accessible.',
    path: '/soutenir',
  },
  '/parrainage': {
    title: 'Mon parrainage | BacPilot',
    description: 'Gérez votre lien de parrainage BacPilot.',
    path: '/parrainage',
    noindex: true,
  },
  '/invitation': {
    title: 'Invitation BacPilot',
    description: 'Créez votre profil BacPilot pour préparer vos pistes d’orientation.',
    path: '/',
    noindex: true,
  },
  '/privacy': {
    title: 'Politique de confidentialité | BacPilot',
    description:
      'Consultez la politique de confidentialité de BacPilot et les principes de protection appliqués aux informations de profil des candidats.',
    path: '/privacy',
  },
  '/terms': {
    title: 'Conditions d’utilisation | BacPilot',
    description:
      'Consultez les conditions d’utilisation de BacPilot, outil indépendant d’aide à l’orientation post-baccalauréat au Bénin.',
    path: '/terms',
  },
  '/login': {
    title: 'Connexion | BacPilot',
    description: 'Accédez à votre espace BacPilot.',
    path: '/login',
    noindex: true,
  },
  '/register': {
    title: 'Créer mon profil | BacPilot',
    description: 'Créez votre profil BacPilot pour préparer vos pistes d’orientation.',
    path: '/register',
    noindex: true,
  },
  '/onboarding': {
    title: 'Préparer mon orientation | BacPilot',
    description: 'Répondez à quelques questions pour préparer vos pistes à vérifier.',
    path: '/onboarding',
    noindex: true,
  },
  '/dashboard': {
    title: 'Tableau de bord | BacPilot',
    description: 'Consultez votre tableau de bord BacPilot.',
    path: '/dashboard',
    noindex: true,
  },
  '/profile': {
    title: 'Mon profil | BacPilot',
    description: 'Gérez les informations de votre profil BacPilot.',
    path: '/profile',
    noindex: true,
  },
  '/beta-access': {
    title: 'Vérification bêta | BacPilot',
    description: 'Vérifiez votre accès au programme bêta BacPilot.',
    path: '/beta-access',
    noindex: true,
  },
};

function setMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
}

export function Seo({ route, partnerPortal = false, betaPortal = false }: { route: string; partnerPortal?: boolean; betaPortal?: boolean }) {
  const betaConfig: SeoConfig = {
    title: 'Programme bêta BacPilot',
    description: 'Portail d’accès au programme bêta BacPilot.',
    path: '/',
    canonicalUrl: 'https://beta.bacpilot.site/',
    noindex: true,
  };
  const partnerConfig: SeoConfig = {
    title: 'Devenir partenaire | BacPilot',
    description: 'Découvrez comment collaborer avec BacPilot pour rendre l’orientation post-baccalauréat plus accessible et vérifiable au Bénin.',
    path: '/',
    canonicalUrl: 'https://partenaires.bacpilot.site/',
  };
  const article = route.startsWith('/articles/') ? getArticleBySlug(route.slice('/articles/'.length)) : null;
  const articleConfig: SeoConfig | null = article ? {
    title: `${article.title} | BacPilot`,
    description: article.description,
    path: articlePath(article),
    schema: articleSchema(article),
  } : null;
  const config: SeoConfig =
    betaPortal ? betaConfig : partnerPortal ? partnerConfig : articleConfig ?? configs[route] ?? {
      title: 'Page introuvable | BacPilot',
      description: 'Cette page BacPilot est introuvable.',
      path: route,
      noindex: true,
    };

  useEffect(() => {
    const canonicalUrl = config.canonicalUrl ?? `${SITE_URL}${config.path}`;
    document.title = config.title;

    setMeta('meta[name="description"]', { name: 'description', content: config.description });
    setMeta('meta[name="robots"]', {
      name: 'robots',
      content: config.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    });
    setMeta('meta[property="og:title"]', { property: 'og:title', content: config.title });
    setMeta('meta[property="og:description"]', { property: 'og:description', content: config.description });
    setMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: config.title });
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: config.description });

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    const existingSchema = document.getElementById('bacpilot-page-schema');
    if (existingSchema) existingSchema.remove();
    if (config.schema) {
      const schemaScript = document.createElement('script');
      schemaScript.id = 'bacpilot-page-schema';
      schemaScript.type = 'application/ld+json';
      schemaScript.text = JSON.stringify(config.schema);
      document.head.appendChild(schemaScript);
    }
  }, [config]);

  return null;
}

export default Seo;
