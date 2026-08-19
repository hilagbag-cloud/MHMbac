# Architecture de visibilité des contributeurs bêta BacPilot

**Statut : proposition à valider — aucune publication individuelle, aucun e-mail et aucune donnée de profil ne sont créés par ce document.**

## 1. Finalité réaliste

L’objectif n’est pas de promettre à chaque contributeur une position dans Google ni un panneau de connaissance. L’objectif utile est de permettre à une personne qui le souhaite d’avoir une **page BacPilot personnelle, stable et vérifiable**, susceptible d’apparaître progressivement pour des requêtes de nom, de pseudo choisi et d’association à BacPilot. Cette page doit décrire une contribution réelle à l’amélioration de l’orientation post-bac, sans exposer le dossier académique, l’e-mail, les retours privés ni un identifiant technique.

> Une page ne devient indexable que si le bêta-testeur active explicitement la publication de son profil **et** l’indexation par les moteurs. L’opérateur peut modérer un abus manifeste, mais ne peut ni activer ni enrichir un profil à la place de son auteur.

Google prévoit le type `ProfilePage` pour les pages centrées sur une personne affiliée à une communauté. Le balisage doit correspondre à une entité unique, être cohérent avec le contenu visible et ne garantit jamais un affichage enrichi ou une position donnée. [1] [2]

| Objectif | Ce que BacPilot fournit | Ce qui reste hors de contrôle |
|---|---|---|
| Visibilité de nom | URL stable, titre explicite, biographie volontaire et liens consentis | La vitesse d’exploration, l’indexation et la position Google |
| Crédibilité | Contexte clair : contribution à la communauté BacPilot, niveau de contribution expliqué | Une validation académique, professionnelle ou institutionnelle |
| Respect de la vie privée | Opt-in séparé, révocation immédiate, données publiques minimales | Les copies déjà prises par des tiers ou des moteurs avant retrait |
| Découverte de BacPilot | Annuaire, maillage interne, sitemap et profils de qualité | Un trafic automatique ou des liens externes artificiels |

## 2. État actuel et lacune à combler

BacPilot dispose déjà d’un annuaire public à l’URL `/contributeurs-beta`, d’un profil séparé des données candidates et de trois consentements : profil public, photo publique et indexation. Les photos restent dans un bucket privé et l’endpoint public ne retourne que des profils dont les consentements requis existent.

Cette base est saine pour l’annuaire. Elle ne suffit pas encore à créer une présence individuelle durable : il n’existe pas de **slug public stable**, de route dédiée par personne, de cycle de vie de publication ni de sitemap dynamique pour ces pages. L’architecture proposée ajoute ces éléments sans modifier la séparation actuelle entre le profil de reconnaissance et les données personnelles du candidat.

## 3. Architecture cible recommandée

### 3.1 Principe : profil « publié » distinct du simple profil renseigné

La publication doit être une décision d’état explicite, et non une conséquence d’un score, d’une inscription bêta ou de la saisie d’un nom. Le champ actuel `visibility_level` demeure utile à l’affichage, mais il faut ajouter un état de diffusion dédié.

| État | Visibilité sur BacPilot | Moteurs de recherche | Route publique |
|---|---|---|---|
| `draft` | Seulement le propriétaire connecté | Non | Aucune |
| `private` | Seulement le propriétaire connecté | Non | Aucune |
| `published_name` | Annuaire public avec nom et niveau | Oui, annuaire seulement | Pas de page individuelle |
| `published_profile` | Annuaire et fiche individuelle | Oui, si consentement SEO actif | `/contributeurs-beta/{slug}` |
| `withdrawn` | Invisible dans l’annuaire | Retrait demandé | La route retourne `410 Gone` avec `X-Robots-Tag: noindex` |

La version recommandée conserve une règle stricte : **aucun nom ni photo ne figure dans une page publique sans consentement à l’indexation**. Une reconnaissance non indexée peut rester dans l’espace connecté de la personne, mais elle ne doit pas être ajoutée à l’annuaire public ; sinon son nom pourrait malgré tout apparaître dans un extrait de recherche.

### 3.2 Modèle de données minimal

La table `beta_contributor_profiles` peut être enrichie, sans dupliquer les retours ou les données d’orientation.

| Champ proposé | Rôle | Règle de protection |
|---|---|---|
| `public_slug` | Identifiant lisible, unique et immuable, par exemple `amina-adamou` ou `amina-bacpilot` | Généré à partir d’un choix public, jamais depuis l’e-mail ou l’UUID ; réservé tant que le profil existe |
| `publication_status` | `draft`, `published_name`, `published_profile`, `withdrawn` | Seul le propriétaire bêta actif peut le modifier ; le serveur recoupe les consentements |
| `published_at` | Date de première publication volontaire | Publiée seulement si le profil est indexable |
| `public_updated_at` | Dernière modification éditoriale significative | Ne change pas lors d’un simple recalcul d’indice |
| `consent_version` | Version de l’information de consentement acceptée | Permet de redemander une validation si les règles changent |
| `withdrawn_at` | Horodatage du retrait | Non affiché publiquement ; utilisé pour le suivi de suppression |
| `profile_intro` | Texte volontaire de 180 à 420 caractères sur la contribution | Contrôle de longueur, filtrage des liens et modération anti-abus |

L’indice de contribution reste calculé à la demande à partir des activités réellement enregistrées. La fiche publique peut afficher un **niveau** (« Explorateur engagé », par exemple) et une explication qualitative, mais il est préférable de ne pas pousser le nombre `/100` dans le titre, la description, l’URL ou les données structurées. Ainsi, le chiffre n’est pas confondu avec une note scolaire et n’alimente pas des pages trop similaires.

### 3.3 Chaîne de diffusion technique

```text
Bêta-testeur authentifié
  → brouillon de profil
  → coche « publier » + « indexer » (+ photo si souhaitée)
  → validation serveur des consentements et du statut bêta
  → profil public minimal, slug et état published_profile
  → route canonique /contributeurs-beta/{slug}
  → HTML pré-rendu + métadonnées + ProfilePage JSON-LD
  → annuaire + sitemap des profils + liens internes
  → Google Search Console : inspection et suivi

Retrait par le bêta-testeur
  → état withdrawn immédiat
  → suppression de l’annuaire et du sitemap
  → réponse 410 + X-Robots-Tag: noindex
  → option de demande de retrait accéléré dans Search Console si nécessaire
```

La route individuelle doit être **pré-rendue côté serveur**, et non reposer uniquement sur la mise à jour du `<head>` après le chargement React. BacPilot est aujourd’hui une application Vite statique ; la solution la plus cohérente consiste à ajouter une Edge Function Supabase dédiée, par exemple `public-beta-contributor-profile`, puis une réécriture Vercel pour `/contributeurs-beta/:slug`. Cette fonction utilise les droits serveur déjà confinés dans Supabase, vérifie l’état et les consentements, puis répond avec un HTML sémantique complet, la canonique, l’Open Graph et le JSON-LD. Elle évite d’ajouter une clé de service dans le navigateur ou dans un bundle statique.

Le navigateur humain peut ensuite charger la même interface React si nécessaire, mais le document HTTP initial doit déjà contenir le titre, le H1, la biographie volontaire et les balises. Google recommande de vérifier quelques pages avec le Rich Results Test et l’outil d’inspection d’URL avant d’étendre le dispositif. [1]

### 3.4 Images : ne pas rendre le bucket public

Les URL signées actuelles sont adaptées à l’annuaire, mais elles expirent et ne sont pas une bonne référence d’image SEO. Pour une photo explicitement publiée, créer une route stable de diffusion, par exemple `/contributeurs-beta/{slug}/photo`, servie par une fonction qui :

1. vérifie le statut `published_profile`, les trois consentements et la correspondance exacte de la photo ;
2. diffuse uniquement l’image correspondante depuis le bucket privé ;
3. renvoie `404` ou `410` dès le retrait ;
4. ne révèle jamais le chemin de stockage ni l’UUID du compte.

Si la personne n’autorise pas sa photo, aucune image par défaut ne doit être déclarée dans le schéma. Google recommande de n’ajouter une image de profil que si elle représente la page et peut être explorée ; une image factice n’apporte pas de valeur. [1] [2]

### 3.5 Métadonnées et données structurées par profil

Chaque page individuelle publiée reçoit un titre et une description spécifiques, sans bourrage de mots-clés :

> **Titre :** `Prénom Nom — contributeur bêta BacPilot | Communauté orientation au Bénin`
>
> **Description :** `Prénom Nom contribue volontairement aux tests et retours d’amélioration de BacPilot, initiative d’orientation post-bac au Bénin.`

Le JSON-LD contient `ProfilePage` comme objet principal et `Person` comme `mainEntity`. Les propriétés autorisées sont le nom public, la courte présentation, les domaines d’intérêt visibles, les liens `sameAs` vers un portfolio ou LinkedIn choisis, les dates éditoriales et, seulement si consentie, l’image. Un `BreadcrumbList` relie l’accueil, l’annuaire et le profil. Il ne faut pas marquer le nombre de retours, le contenu des signalements, des badges inventés, un avis, l’âge, une filière, une mention, une adresse ou un e-mail.

> Le balisage doit décrire le contenu effectivement visible et ne peut pas cacher une donnée dans JSON-LD pour tenter d’obtenir plus de visibilité. Google indique qu’un balisage incomplet, trompeur ou portant sur du contenu invisible peut être ignoré ou faire l’objet de mesures manuelles. [2]

### 3.6 Découverte, canonical et retrait

Le maillage se compose de l’annuaire général, d’une carte par profil publiée, des pages « À propos du programme bêta » et, lorsque la personne le choisit, d’un lien depuis son portfolio ou LinkedIn vers la fiche BacPilot. BacPilot n’achète pas de liens, n’impose pas de lien sortant et ne crée pas de pages satellites : cette pratique serait contraire à la logique de contenu utile et peut ressembler à du spam de liens. [4] [6]

Le sitemap actuel conserve l’annuaire. Un second sitemap dynamique, `/sitemap-contributeurs-beta.xml`, ne contient que les routes `published_profile` ayant l’accord SEO actif. Il est référencé dans `robots.txt` ou un sitemap-index et soumis dans Search Console. Un sitemap aide à la découverte mais ne garantit ni l’exploration ni l’indexation. [3]

Au retrait, le profil est retiré de l’annuaire et du sitemap immédiatement. La route ne doit **pas** être interdite via `robots.txt`, car Google ne pourrait pas lire la directive `noindex`. Elle répond `410 Gone` et `X-Robots-Tag: noindex`. Cette combinaison favorise la disparition après le prochain passage du robot ; en cas d’urgence, l’opérateur accompagne la personne dans la demande de retrait Google. [3]

## 4. Plan de déploiement progressif

| Phase | Durée indicative | Livrables | Critère de passage |
|---|---:|---|---|
| 0. Consentement et charte | 2 à 3 jours | Texte clair, consentement séparé, règle spécifique pour un participant mineur, politique de retrait | Validation opérateur et compréhension testée auprès de deux bêta-testeurs |
| 1. Fondations techniques | 3 à 5 jours | Slug, états de publication, route pré-rendue, contrôle photo, 410 de retrait, sitemap dédié | Aucun accès anonyme aux données privées ; tests de publication et retrait réussis |
| 2. Gabarit éditorial | 1 à 2 jours | Formulaire de biographie guidée, aperçu avant publication, garde-fous contre le texte générique | Une page reste utile sans score et sans photo |
| 3. Pilote volontaire | 2 semaines | Trois à six profils réellement consentis, de qualité et relus par leurs auteurs | Tests Rich Results, inspection d’URL, aucun consentement ambigu |
| 4. Mesure et amélioration | 30 à 60 jours | Tableau agrégé Search Console, revue des requêtes et des erreurs | Décider d’élargir seulement si les pages sont explorées et utiles |
| 5. Diffusion communautaire | Continue | Kit personnel de partage et proposition de lien portfolio/LinkedIn facultatif | Aucun achat de liens, aucun post social publié sans accord de son auteur |

## 5. Contenu qui donne une vraie valeur à chaque profil

Le profil ne doit pas être une carte automatique « nom + score ». Pour être réellement utile, le formulaire peut proposer quatre rubriques volontaires : une phrase de présentation, un domaine d’intérêt, une amélioration ou un apprentissage issu de la bêta, et un lien vers une présence que la personne possède. Chaque élément doit être modifiable, supprimable et prévisualisé avant publication.

| Rubrique | Exemple acceptable | À exclure |
|---|---|---|
| Contribution | « J’ai testé le parcours de comparaison des filières et signalé les points confus. » | Le contenu brut du bug, une capture ou une conversation privée |
| Intérêt | « Innovation numérique et orientation des jeunes » | Notes, résultats de bac, établissement fréquenté sans besoin clair |
| Lien | Portfolio personnel ou profil LinkedIn exact | URL raccourcie non vérifiable, lien d’affiliation ou contenu hors sujet |
| Photo | Portrait volontaire et récent | Photo d’un tiers, photo par défaut présentée comme celle de la personne |

Le texte peut recevoir une aide à la rédaction, mais BacPilot doit la présenter comme une suggestion à modifier ; il ne faut pas produire automatiquement des centaines de biographies quasi identiques. Google privilégie un contenu original et utile aux personnes, et interdit les volumes de pages générées principalement pour manipuler le classement. [4] [6]

## 6. Mesure responsable

Le tableau opérateur suit des mesures agrégées, sans publier ni exposer les requêtes personnelles d’un contributeur : profils publiés, profils retirés, URL découvertes, URL indexées, erreurs de balisage, impressions et clics à l’échelle de la collection. Chaque profil reçoit un statut simple dans son espace : « privé », « publié — en attente d’exploration », « détecté » ou « problème technique », jamais une promesse de rang.

| Signal | Source | Interprétation saine |
|---|---|---|
| URL valide | Test de résultat enrichi + inspection d’URL | Le moteur peut lire la page et son schéma |
| Découverte | Sitemap et inspection | Google connaît l’URL, sans promesse d’indexation |
| Indexation | Search Console | La page peut commencer à ressortir pour des requêtes pertinentes |
| Impressions / clics | Rapport de performance | Mesure de visibilité, pas note de valeur personnelle |
| Retrait traité | Route 410, disparition du sitemap et contrôle d’URL | Vérification que le droit de retrait a bien été appliqué sur le site |

## 7. Décisions à valider avant le développement

1. **Périmètre de publication :** la page individuelle est-elle réservée à `published_profile`, tandis que `published_name` reste limité à l’annuaire ? C’est la recommandation.
2. **Slug :** laisser la personne proposer son slug, avec contrôle d’unicité et aperçu, plutôt que le générer depuis son identité civile.
3. **Mineurs :** ajouter une étape de confirmation adaptée à l’âge avant l’activation du nom, de la photo ou d’un lien externe ; l’opérateur devra faire valider le texte final de politique si nécessaire.
4. **Photo :** la route proxy stable est recommandée ; sans ce développement, ne pas promettre l’apparition de la photo dans les résultats de recherche.
5. **Pilotage :** commencer par trois à six volontaires ayant une biographie véritablement personnelle, puis étendre après la revue Search Console, plutôt que d’ouvrir une production massive de pages.

## Références

[1] [Google Search Central — ProfilePage structured data](https://developers.google.com/search/docs/appearance/structured-data/profile-page)

[2] [Google Search Central — General structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)

[3] [Google Search Central — Robots meta tag, X-Robots-Tag and sitemaps](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) ; [Learn about sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)

[4] [Google Search Central — Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)

[5] [Google Search Console — Rich Results Test](https://search.google.com/test/rich-results)

[6] [Google Search Central — Spam policies for Google web search](https://developers.google.com/search/docs/essentials/spam-policies)
