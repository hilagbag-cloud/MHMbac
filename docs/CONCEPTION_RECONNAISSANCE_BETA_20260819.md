# Conception — Reconnaissance des bêta-testeurs BacPilot

## Décision de confidentialité

Les profils contributeurs sont séparés des profils candidats. Ils ne contiennent jamais l’e-mail, les données académiques, les préférences d’orientation, les détails des retours bêta, les données de session ni les identifiants techniques.

Chaque profil est privé par défaut. Le bêta-testeur choisit explicitement s’il souhaite publier son nom, une courte présentation, ses domaines d’intérêt, une photo, son portfolio ou son LinkedIn. Le retrait du consentement doit immédiatement ramener le profil à un état non public.

## Indicateur de contribution automatique

L’indicateur de contribution est distinct de tout classement ou conseil d’orientation. Il se calcule uniquement sur les activités réellement enregistrées : cinq actions de test uniques au maximum, trois retours soumis au maximum, trois retours pris en compte et trois retours résolus. Le calcul est plafonné à 100 et reste décomposé afin que le testeur comprenne l’origine de sa progression.

| Source réelle | Plafond | Valeur par élément |
|---|---:|---:|
| Actions de test uniques | 5 | 5 points |
| Retours soumis | 3 | 10 points |
| Retours pris en compte | 3 | 10 points |
| Retours résolus | 3 | 5 points |

Les niveaux affichés sont : Découvreur bêta, Explorateur engagé, Contributeur actif et Pionnier bêta. Ils n’emportent aucun droit académique, financier ou décisionnel.

## Photos volontaires

Les photos utilisent un bucket Supabase séparé, privé, limité à 3 Mo et aux formats JPEG, PNG et WebP. Le téléversement, la lecture, la modification et la suppression sont limités au répertoire `user_id/` du compte bêta actif. La page publique ne doit utiliser une URL signée que si le profil est public et que le consentement photo est enregistré.

> La documentation Supabase confirme que Storage applique les politiques RLS sur `storage.objects` et qu’un bucket public ne dispense pas de règles d’écriture. BacPilot conserve donc le bucket privé et ne rend pas une liste d’objets accessible publiquement. [1]

## Références

[1] [Supabase — Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control)

## Recette locale — incident de chargement

Le 19 août 2026, la première recette locale de `/contributeurs-beta` a déclenché l’erreur React `TypeError: Cannot convert object to primitive value` au moment du chargement paresseux de la page. Le problème survient avant le rendu du contenu public ; la route, le titre SEO et le pied de page sont néanmoins présents. La correction doit viser l’export dynamique de `BetaContributorsPage` ou son chargement avant toute publication.

## Recette locale — annuaire public sécurisé

Après correction de l’export de page et remplacement de l’appel RPC direct par l’endpoint Edge `public-beta-contributors`, la route locale `/contributeurs-beta` rend correctement le titre, les principes de consentement, l’état vide et les appels à l’action. La console navigateur ne contient plus d’erreur applicative ou réseau. L’état vide est attendu tant qu’aucun bêta-testeur actif n’a volontairement publié un profil indexable.
