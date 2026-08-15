import { useEffect } from 'react';

const SITE_URL = 'https://bacpilot.site';

type JsonLd = Record<string, unknown>;

type SeoConfig = {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  schema?: JsonLd;
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

const configs: Record<string, SeoConfig> = {
  '/': {
    title: 'Orientation après le bac au Bénin | BacPilot',
    description:
      'BacPilot aide les nouveaux bacheliers béninois à comparer des filières selon leur série, leur mention et leur objectif, à partir d’observations disponibles à vérifier.',
    path: '/',
  },
  '/orientation-bac-benin': {
    title: 'Orientation après le bac au Bénin : guide pratique | BacPilot',
    description:
      'Comprendre comment comparer ses pistes d’orientation après le bac au Bénin, lire des observations avec prudence et vérifier ses choix sur le portail officiel.',
    path: '/orientation-bac-benin',
    schema: guideFaqSchema,
  },
  '/about': {
    title: 'À propos de BacPilot et MHM SOLUTIONS | BacPilot',
    description:
      'Découvrez BacPilot, initiative de MHM SOLUTIONS créée par Hilarus GBAGOULE pour rendre l’orientation post-baccalauréat plus lisible au Bénin.',
    path: '/about',
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
};

function setMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
}

export function Seo({ route }: { route: string }) {
  const config: SeoConfig =
    configs[route] ?? {
      title: 'Page introuvable | BacPilot',
      description: 'Cette page BacPilot est introuvable.',
      path: route,
      noindex: true,
    };

  useEffect(() => {
    const canonicalUrl = `${SITE_URL}${config.path}`;
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
