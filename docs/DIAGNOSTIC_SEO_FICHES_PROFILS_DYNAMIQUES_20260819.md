# Diagnostic SEO des fiches publiques dynamiques BacPilot

**Date :** 19 août 2026  
**Décision de mise en œuvre :** en attente de validation opérateur

## Conclusion exécutive

La fondation actuelle est **correcte et éligible à l’exploration Google**. Une fiche telle que `https://bacpilot.site/contributeurs-beta/hilarus-gbagoule` est désormais rendue comme un document HTML UTF-8 côté serveur, avec un statut `200`, une canonique stable, une balise robots autorisant l’indexation, une image crawlable, un sitemap dynamique et un balisage JSON-LD `ProfilePage` relié à une entité `Person`.

> Le HTML est le bon format. Google peut lire un document HTML rendu côté serveur sans dépendre de l’exécution du JavaScript. Le système peut donc générer automatiquement la structure SEO de chaque fiche, sans intervention manuelle profil par profil.

Cela ne permet toutefois pas de **garantir** une position ou un extrait enrichi : Google décide de l’exploration, de l’indexation et de l’affichage. Le rôle de BacPilot est de produire des URL stables, crawlables, utiles et fidèles au consentement de leurs auteurs.[1]

## État technique vérifié

| Signal | État actuel | Verdict |
|---|---|---|
| URL individuelle stable | `/contributeurs-beta/{slug}` | Conforme |
| Rendu serveur | HTML `text/html; charset=utf-8` via fonction Vercel | Conforme |
| Titre dynamique | Nom public + rôle de contributeur BacPilot | Conforme |
| Canonique | URL absolue de chaque profil | Conforme |
| Meta description | Générée dynamiquement à partir du nom et du rôle | Conforme, améliorable |
| `ProfilePage` + `Person` | `mainEntity`, nom, bio, dates, photo si consentie, `sameAs` | Conforme aux champs fondamentaux |
| Photo publique | URL stable, JPEG crawlable, associée au profil | Conforme si autorisée |
| Sitemap dynamique | Ne contient que les fiches publiées et consenties | Conforme |
| `robots.txt` | Déclare le sitemap principal et le sitemap des contributeurs | Conforme |
| Retrait | URL retirée hors sitemap ; réponse 410 / noindex prévue | Bon garde-fou |
| Liens internes | Carte de l’annuaire vers la fiche via une ancre HTML rendue par l’application | Acceptable, à renforcer |

La documentation Google confirme que `ProfilePage` s’applique à une page centrée sur une personne affiliée au site et que `mainEntity` de type `Person` est requis. Les champs déjà présents — nom, description, photo optionnelle, `sameAs`, dates de création et de modification — sont cohérents avec ce modèle.[1]

## Réponse directe aux questions

| Question | Réponse |
|---|---|
| Le HTML est-il la bonne structure ? | **Oui.** Le rendu HTML serveur est préférable pour cette fiche : il est directement accessible aux robots et aux visiteurs. |
| Faut-il faire du SEO manuellement pour chaque candidat ? | **Non.** Le modèle doit générer automatiquement URL, titre, description, canonique, JSON-LD, image, sitemap et liens de retour à partir des champs publics validés. |
| Un candidat apparaîtra-t-il forcément sur Google ? | **Non, aucune plateforme ne peut le promettre.** La fiche sera éligible à la découverte et à l’indexation ; Google décide ensuite du crawl, de l’indexation et de l’affichage.[1] [2] |
| Faut-il un texte ? | **Oui.** Une bio publique, personnelle et réellement utile est indispensable pour éviter une fiche trop mince ou identique aux autres. |
| Peut-on générer automatiquement ce texte par IA pour tous ? | **À éviter.** Une production massive de textes génériques orientés classement est contraire à l’approche « people-first ». Un assistant de rédaction facultatif est possible, mais le membre doit relire, modifier et confirmer son texte.[3] |

## Architecture automatique recommandée

Lorsqu’un bêta-testeur active une fiche complète et coche séparément la publication puis l’indexation, BacPilot doit exécuter ce processus sans travail manuel :

```text
Profil privé
  → Fiche complète demandée
  → Validation de qualité du contenu
  → Consentement publication + consentement indexation
  → URL /contributeurs-beta/{slug}
  → HTML serveur + meta + JSON-LD + image publique optionnelle
  → Lien depuis l’annuaire + sitemap dynamique
  → Découverte automatique par les moteurs
```

Le retrait inverse immédiatement ce flux : la fiche quitte l’annuaire et le sitemap, devient `noindex` et retourne `410 Gone`. Aucun profil ne doit entrer dans le sitemap uniquement parce qu’il possède un compte ou une photo.

## Améliorations recommandées avant une ouverture large

### 1. Une vraie règle de qualité avant indexation — prioritaire

La règle actuelle de bio minimale doit évoluer vers un contrôle de valeur réelle. Je recommande de conserver la possibilité de publier une fiche « nom seulement », mais de réserver l’indexation individuelle aux profils comportant :

| Élément | Règle proposée | Pourquoi |
|---|---|---|
| Bio publique | 140 à 500 caractères, deux phrases naturelles minimum | Rend la fiche spécifique et utile |
| Rôle / domaine | 1 à 3 centres d’intérêt sélectionnés dans une taxonomie corrigée | Évite les fautes et les étiquettes incohérentes |
| Preuve d’activité | Une phrase automatique factuelle issue d’événements vérifiés, sans nombre promotionnel | Distingue le rôle réel du membre |
| Liens externes | Facultatifs, mais contrôlés et choisis par l’auteur | Renforce l’identité publique sans forcer la divulgation |
| Image | Strictement facultative et consentie | Améliore la reconnaissance sans bloquer l’éligibilité |

Exemple de texte d’aide non automatique :

> « En quelques phrases, explique ce que tu aimes tester, ce que tu souhaites améliorer et ce que cette expérience t’apporte. Évite de copier une présentation générique. »

### 2. Une fiche plus riche, mais sans inventer de contenu — prioritaire

Le modèle peut générer automatiquement les éléments techniques, tandis que le contenu reste personnel :

* `title` : **{Nom public} — contributeur bêta BacPilot** ;
* description : synthèse limitée de la bio, du rôle choisi et de BacPilot ;
* JSON-LD : ajouter `alternateName` avec le slug public, un identifiant public non sensible dérivé du slug et l’organisation MHM SOLUTIONS ;
* page visible : afficher une courte section « Contribution à BacPilot » qui décrit qualitativement les domaines testés, seulement à partir d’événements réels ;
* données structurées : n’inclure une photo que si elle est effectivement accessible au public.

Aucune note d’orientation, aucune promesse d’admission, aucune métrique artificielle ou aucun texte inventé ne doit être ajouté pour « remplir » la page.

### 3. Renforcer la découverte interne — recommandé

Le sitemap est déjà correct, mais Google recommande aussi des liens crawlables depuis les pages importantes.[2] [4] Je recommande que l’annuaire rende les liens de fiches dans un HTML accessible même avant l’hydratation JavaScript, ou qu’une version serveur légère de l’annuaire publie au moins les ancres des fiches consenties. Cela rend la découverte plus robuste sans changer le design.

### 4. Prévoir l’exploitation Search Console au niveau du site — recommandé

Une seule action est nécessaire côté opérateur : soumettre et conserver `https://bacpilot.site/sitemap-contributeurs-beta.xml` dans Search Console. Ensuite, chaque nouveau profil conforme est découvert via ce sitemap. Il n’est pas nécessaire de demander manuellement l’indexation de chaque fiche, sauf pour le premier pilote et en cas de diagnostic.[1] [2]

## Plan de validation proposé

| Étape | Action | Résultat attendu |
|---|---|---|
| A | Ajouter les règles de qualité et la taxonomie de domaines | Seuls les profils utiles passent à l’indexation |
| B | Enrichir automatiquement le modèle SEO sans toucher au contenu personnel | Balises cohérentes pour chaque nouveau profil |
| C | Rendre l’annuaire crawlable sans JavaScript | Liens HTML vers chaque fiche publiée |
| D | Tester 3 à 6 volontaires avec le test de résultats enrichis et l’inspection d’URL | Aucune erreur de balisage ni de rendu |
| E | Soumettre le sitemap dynamique dans Search Console | Découverte automatique des futures fiches |
| F | Mesurer impressions, clics et requêtes sur 30 à 60 jours | Ajustements fondés sur des données réelles |

## Décision demandée

Je recommande de valider le package suivant : **règle de qualité avant indexation + enrichissement SEO automatique du modèle + annuaire crawlable côté serveur + pilote Search Console sur 3 à 6 volontaires**.

Cette décision conserve la visibilité comme une récompense volontaire et utile. Elle évite au contraire une production de profils minces ou artificiels qui pourrait affaiblir la crédibilité de BacPilot.

## Références

[1] [Google Search Central — ProfilePage structured data](https://developers.google.com/search/docs/appearance/structured-data/profile-page)

[2] [Google Search Central — Learn about sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)

[3] [Google Search Central — Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)

[4] [Google Search Central — Link best practices for Google](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
