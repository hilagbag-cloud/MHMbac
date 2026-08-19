# Automatisation SEO des profils de contributeurs bêta

**État : déployé et vérifié en production le 19 août 2026.**

## Objet

BacPilot publie des profils publics de contributeurs bêta uniquement lorsque leur auteur l’a demandé et que leur fiche apporte un contenu utile. L’objectif est de rendre la découverte organique **automatique** : aucune optimisation manuelle ne doit être nécessaire lorsqu’un contributeur complète son profil et conserve ses consentements.

Cette automatisation ne transforme pas une participation bêta en certification, note scolaire, promesse d’admission ou garantie de visibilité. Elle expose seulement une fiche volontaire et descriptive, sous le contrôle continu de son auteur.

## Règle d’éligibilité automatique

| Condition | Règle appliquée côté serveur | Effet si absente ou invalide |
|---|---|---|
| Statut | `publication_status = 'published_profile'` | La fiche est exclue de l’indexation. |
| Consentement de profil | `profile_consent_at` renseigné | La fiche est exclue de l’indexation. |
| Consentement moteurs | `search_indexing_consent_at` renseigné | La fiche est exclue du sitemap et reçoit `noindex`. |
| Bio | Entre **140 et 420 caractères** après nettoyage | L’éditeur signale que la fiche doit être enrichie. |
| Centres d’intérêt | Entre **1 et 3** domaines non vides | La fiche est exclue du sitemap. |
| Retrait | `publication_status = 'withdrawn'` | La route répond `410 Gone`, avec `noindex, nofollow`. |

La fonction SQL `is_beta_contributor_profile_seo_ready()` porte ces critères. Elle est utilisée par le sitemap dynamique et renvoie également `seo_eligible` à l’API publique. Une recette sans écriture a confirmé que les cas « bio de 139 caractères » et « aucun domaine » sont refusés, tandis qu’une bio de 140 caractères avec deux domaines est acceptée.

## Expérience du contributeur

L’espace bêta affiche désormais un indicateur de préparation SEO avant l’enregistrement. Il indique de manière lisible les éléments encore nécessaires : bio suffisamment détaillée, un à trois domaines, consentement de publication et consentement d’indexation. Des suggestions de domaines sont proposées pour aider à produire des formulations courtes et utiles ; les valeurs saisies restent la décision du contributeur.

Les libellés publics sont normalisés sans altérer les données privées enregistrées. Par exemple, `INTELIGENCE ARTIFICIELLE` est présenté comme **Intelligence artificielle**. Cette normalisation protège la lisibilité de la fiche, du sitemap et des résultats de recherche, tout en évitant une correction intrusive des données originales.

## Rendu et découverte par les moteurs

| Surface | Implémentation publiée | Signal de découverte |
|---|---|---|
| Fiche individuelle | Route Vercel `/contributeurs-beta/:slug`, HTML rendu côté serveur | Canonical, titre et description personnalisés, `ProfilePage` JSON-LD, `Person`, fil d’Ariane et `worksFor`. |
| Annuaire | Route Vercel `/contributeurs-beta`, HTML rendu côté serveur | Liens `<a href="/contributeurs-beta/:slug">` crawlables vers les profils qualifiés. |
| Sitemap spécialisé | `/sitemap-contributeurs-beta.xml` | Liste uniquement les profils répondant à la règle d’éligibilité. |
| Robots | `/robots.txt` | Déclare le sitemap général et le sitemap spécialisé. |
| Retrait | Même route de fiche | `410 Gone`, `noindex, nofollow` et disparition de l’annuaire/sitemap. |

La fonction Edge `public-beta-contributor-profile` est active en version **6**. Elle sert les données structurées, le résumé qualitatif de contribution et la normalisation des domaines à l’annuaire, à la fiche JSON et au sitemap. La fonction Vercel `api/contributor-profile.js` reste responsable du HTML de la fiche afin de garantir le type `text/html; charset=utf-8` et de contourner le rendu `text/plain` précédemment observé à la passerelle Edge.

## Vérifications de production

| Vérification | Résultat observé |
|---|---|
| `https://bacpilot.site/contributeurs-beta/hilarus-gbagoule` | HTTP 200, `text/html; charset=utf-8`, `index, follow, max-image-preview:large`, cache désactivé. |
| Données structurées de la fiche pilote | `ProfilePage`, `Person`, identifiant stable, alias de slug et `worksFor` présents. |
| Annuaire serveur | Lien HTML crawlable vers `/contributeurs-beta/hilarus-gbagoule` présent. |
| Sitemap spécialisé | Contient uniquement la fiche pilote qualifiée et sa date de mise à jour. |
| Données de la fiche pilote | `seo_eligible = true`, domaines affichés : « Data science » et « Intelligence artificielle ». |

## Procédure opérateur dans Google Search Console

L’indexation finale et l’apparence dans Google restent décidées par Google. Après chaque première publication de profil qualifié, aucune opération manuelle n’est nécessaire pour générer les métadonnées ou le sitemap. Pour lancer le pilote de découverte, l’opérateur doit toutefois effectuer une fois les actions suivantes dans la propriété Search Console de `bacpilot.site` :

1. Ajouter ou actualiser le sitemap `https://bacpilot.site/sitemap-contributeurs-beta.xml`.
2. Inspecter `https://bacpilot.site/contributeurs-beta` puis demander son indexation afin de faire découvrir l’annuaire.
3. Inspecter `https://bacpilot.site/contributeurs-beta/hilarus-gbagoule`, exécuter le test d’URL en direct et demander l’indexation si l’outil ne la détecte pas encore.
4. Contrôler les données structurées avec le [test de résultats enrichis de Google](https://search.google.com/test/rich-results?url=https://bacpilot.site/contributeurs-beta/hilarus-gbagoule).
5. Attendre l’exploration, puis surveiller la couverture et les impressions. Ne pas soumettre une URL retirée et ne jamais promettre une position de recherche ou un résultat enrichi.

## Évolution continue

Lorsqu’un nouveau contributeur remplit les conditions et confirme ses deux consentements, son profil est automatiquement inclus dans l’annuaire et le sitemap. Lorsqu’il retire l’un de ses consentements ou sa publication, les signaux de retrait s’appliquent sans intervention de l’opérateur. Les seules décisions humaines conservées sont celles de l’auteur : contenu déclaré, consentements et maintien ou retrait de la fiche.
