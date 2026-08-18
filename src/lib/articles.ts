export type ArticleSection = {
  heading: string;
  paragraphs: string[];
  points?: string[];
};

export type BacPilotArticle = {
  slug: string;
  category: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  readingTime: string;
  sourceLabel: string;
  sourceUrl: string;
  sections: ArticleSection[];
  takeaway: string;
};

export const BACPILOT_ARTICLES: BacPilotArticle[] = [
  {
    slug: 'preparer-ses-choix-apres-le-bac-benin',
    category: 'Préparer son orientation',
    title: 'Comment préparer ses choix après le bac au Bénin sans décider dans la précipitation',
    description: 'Une méthode simple pour préparer ses pistes d’orientation, comparer ce qui compte réellement et vérifier chaque démarche sur la plateforme officielle.',
    publishedAt: '2026-08-17',
    updatedAt: '2026-08-17',
    readingTime: '6 min de lecture',
    sourceLabel: 'Campagne nationale d’orientation — Gouvernement du Bénin',
    sourceUrl: 'https://www.gouv.bj/article/3201/choix-filiere-bacheliers-2025-campagne-nationale-orientation-lancee-parakou/',
    takeaway: 'Un bon choix ne part pas d’un seul nom de filière : il relie ton profil, le contenu de la formation, le lieu, les débouchés et la démarche officielle à vérifier.',
    sections: [
      {
        heading: 'Commencer par séparer trois décisions',
        paragraphs: [
          'Après le bac, on mélange souvent trois questions différentes : ce que l’on aime apprendre, le parcours qui peut réellement correspondre à son profil et la procédure officielle à suivre. Les traiter séparément évite de choisir une filière seulement parce que son nom paraît connu ou parce qu’un proche l’a conseillée.',
          'La campagne nationale d’orientation rappelle que les nouveaux bacheliers doivent disposer d’informations sur les filières, les débouchés, les opportunités et la procédure d’inscription. BacPilot peut servir à préparer la comparaison ; la validation finale doit toujours se faire sur les sources compétentes.',
        ],
        points: [
          'Ton profil : série, matières que tu maîtrises, préférences de travail et contraintes de localisation.',
          'La piste : établissement, filière, contenu réel de la formation, localité et débouchés à explorer.',
          'La démarche : dates, conditions, pièces et choix à confirmer sur le portail officiel de la campagne en cours.',
        ],
      },
      {
        heading: 'Construire une courte liste avant de classer',
        paragraphs: [
          'Ne cherche pas immédiatement « la meilleure filière ». Prépare d’abord trois à cinq pistes raisonnables. Pour chacune, écris ce qui t’attire, ce qui te fait hésiter et ce que tu dois encore vérifier. Une liste courte te permet d’avoir une option principale, une option alternative cohérente et une piste différente mais réaliste.',
          'La pression observée autour d’une filière peut aider à comprendre le contexte, mais elle ne suffit pas à décider. Elle ne dit ni si tu apprécieras les cours, ni si la localité te convient, ni quelles possibilités professionnelles tu souhaites réellement développer.',
        ],
      },
      {
        heading: 'Préparer une discussion utile avec ta famille',
        paragraphs: [
          'Une discussion familiale devient plus simple lorsque chaque piste est présentée avec les mêmes éléments : établissement, ville, contenu de formation, contraintes pratiques, perspectives à rechercher et raison personnelle du choix. Cela évite le débat basé uniquement sur la réputation ou sur une rumeur.',
          'Tu peux demander à ta famille de t’aider à identifier les informations manquantes. Le but n’est pas qu’une autre personne choisisse à ta place, mais de sécuriser la préparation de la décision.',
        ],
      },
      {
        heading: 'Toujours vérifier avant de valider',
        paragraphs: [
          'Les calendriers, conditions et listes de filières peuvent évoluer d’une campagne à l’autre. Avant de confirmer un choix, consulte le guide et le portail officiel de la campagne en cours. BacPilot ne remplace pas cette étape et ne garantit ni admission, ni inscription, ni bourse.',
        ],
      },
    ],
  },
  {
    slug: 'comparer-filiere-etablissement-debouches',
    category: 'Comparer ses pistes',
    title: 'Filière, établissement, localité et débouchés : comparer une piste d’orientation avec méthode',
    description: 'Les questions concrètes à poser avant de retenir une filière : formation, établissement, localisation, débouchés, contraintes et vérifications officielles.',
    publishedAt: '2026-08-17',
    updatedAt: '2026-08-17',
    readingTime: '7 min de lecture',
    sourceLabel: 'Guide d’information universitaire 2025-2026 — MESRS',
    sourceUrl: 'https://enseignementsuperieur.gouv.bj/actualite/show/ACT-kPEa9EFx-E3A054D',
    takeaway: 'Comparer une piste consiste à comprendre ce que tu vas apprendre, où tu vas l’apprendre, ce que cela implique au quotidien et quelles voies professionnelles tu veux explorer ensuite.',
    sections: [
      {
        heading: 'La filière : de quoi parle-t-on vraiment ?',
        paragraphs: [
          'Le nom d’une filière ne suffit pas. Avant de l’ajouter à tes choix, cherche les matières dominantes, les compétences qui seront travaillées, les exercices attendus et la manière dont la formation se déroule. Deux parcours aux intitulés proches peuvent demander des aptitudes et proposer des expériences très différentes.',
          'Pose-toi une question simple : est-ce que je me projette dans les activités d’apprentissage associées à cette filière, et pas seulement dans son nom ou dans un métier imaginé ?',
        ],
      },
      {
        heading: 'L’établissement et la localité font partie du choix',
        paragraphs: [
          'Une orientation est aussi une organisation de vie. L’établissement, la ville, les transports, le logement éventuel, le coût quotidien et la présence de proches peuvent modifier fortement ton expérience. Il est donc utile de les noter à côté de chaque piste plutôt que de les découvrir après la décision.',
          'Le guide d’information publié par le ministère est une source à consulter pour identifier les établissements et les informations de campagne. Vérifie toujours les éléments qui concernent l’année en cours directement auprès des sources officielles.',
        ],
      },
      {
        heading: 'Les débouchés sont des pistes à explorer, pas un contrat',
        paragraphs: [
          'Parler de débouchés signifie identifier des environnements de travail, des métiers possibles, des compétences transférables et parfois des études complémentaires. Cela ne signifie pas qu’une formation fournit automatiquement un emploi. Une bonne comparaison décrit les opportunités sans les transformer en promesse.',
          'Pour chaque piste, fais une colonne « après la formation » : quels métiers veux-tu comprendre, quelles compétences faut-il développer et quelles étapes peuvent être nécessaires après le diplôme ?',
        ],
        points: [
          'Cherche des exemples de tâches réelles, pas seulement des intitulés de métier.',
          'Demande si des études complémentaires sont souvent nécessaires pour l’objectif envisagé.',
          'Distingue ce qui est documenté par une source de ce qui est un témoignage personnel.',
        ],
      },
      {
        heading: 'Utiliser une grille identique pour toutes les pistes',
        paragraphs: [
          'Pour comparer honnêtement, utilise la même grille : filière, établissement, localité, matières ou critères utiles, activités d’apprentissage, débouchés à explorer, contraintes pratiques et action officielle à vérifier. BacPilot présente ces éléments afin de rendre la discussion plus lisible, mais le candidat garde le dernier mot.',
        ],
      },
    ],
  },
  {
    slug: 'guide-et-portail-officiel-orientation-benin',
    category: 'Démarches officielles',
    title: 'Guide d’orientation et portail officiel : où vérifier les informations avant de confirmer ses choix ?',
    description: 'Pourquoi les dates, règles et critères doivent être vérifiés chaque année sur le guide et le portail officiels, même après une première comparaison sur BacPilot.',
    publishedAt: '2026-08-17',
    updatedAt: '2026-08-17',
    readingTime: '5 min de lecture',
    sourceLabel: 'Guide d’information et de sensibilisation 2026-2027 — MESRS',
    sourceUrl: 'https://enseignementsuperieur.gouv.bj/actualite/show/ACT-Z5JpZRp8-B29C1C2',
    takeaway: 'BacPilot aide à préparer et comprendre ; le guide ministériel et le portail officiel servent à vérifier les informations de campagne avant toute confirmation.',
    sections: [
      {
        heading: 'Pourquoi une information peut changer',
        paragraphs: [
          'Les campagnes d’orientation sont organisées par année académique. Les calendriers, documents, modalités et informations relatives aux filières peuvent être actualisés. C’est pourquoi un conseil lu sur les réseaux sociaux, une ancienne capture d’écran ou un calendrier conservé d’une année précédente ne doivent jamais être considérés comme une preuve suffisante.',
          'Le ministère publie des guides d’information et de sensibilisation ainsi que des communications de campagne. Ces publications sont les références à consulter lorsqu’une information peut évoluer.',
        ],
      },
      {
        heading: 'Ce que BacPilot peut faire pour toi',
        paragraphs: [
          'BacPilot rassemble une lecture plus claire de tes pistes : il t’aide à expliquer ton profil, à comparer des programmes disponibles, à organiser trois choix et à identifier ce que tu dois vérifier. Son rôle est d’accompagner ta réflexion, pas de se substituer au service officiel.',
          'Quand une donnée date d’une collecte, BacPilot doit aussi indiquer sa fraîcheur. Si une information est ancienne ou incomplète, la bonne réaction est de la vérifier et non de la présenter comme certaine.',
        ],
      },
      {
        heading: 'La vérification finale en quatre gestes',
        paragraphs: [
          'Avant toute confirmation, ouvre le guide correspondant à la campagne en cours et le portail officiel. Relis ensuite les informations associées à chacune de tes pistes. Garde une trace de ce que tu as vérifié et demande de l’aide à une source officielle ou à un conseiller compétent lorsqu’un point reste ambigu.',
        ],
        points: [
          'Vérifier le guide et la communication de l’année académique en cours.',
          'Vérifier le portail officiel avant toute démarche ou tout envoi.',
          'Relire les informations de chaque établissement et filière retenus.',
          'Ne pas confondre une piste d’orientation avec une confirmation administrative.',
        ],
      },
    ],
  },
];

export function getArticleBySlug(slug: string) {
  return BACPILOT_ARTICLES.find((article) => article.slug === slug) ?? null;
}

export function articlePath(article: Pick<BacPilotArticle, 'slug'>) {
  return `/articles/${article.slug}`;
}
