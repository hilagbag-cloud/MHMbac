# Recherche éditoriale — Articles & conseils BacPilot

## Sources officielles consultées

1. Gouvernement du Bénin — campagne nationale d’orientation 2025 : https://www.gouv.bj/article/3201/choix-filiere-bacheliers-2025-campagne-nationale-orientation-lancee-parakou/
2. MESRS — Guide d’information universitaire 2025-2026 : https://enseignementsuperieur.gouv.bj/actualite/show/ACT-kPEa9EFx-E3A054D
3. MESRS — Guide d’information et de sensibilisation des nouveaux bacheliers 2026-2027 : https://enseignementsuperieur.gouv.bj/actualite/show/ACT-Z5JpZRp8-B29C1C2
4. Après mon bac — plateforme officielle : https://apresmonbac.bj/

## Principes vérifiés à utiliser dans les contenus

Les sources gouvernementales décrivent une campagne d’orientation visant à informer les nouveaux bacheliers sur les filières, les débouchés, les opportunités et les démarches d’inscription. Le MESRS publie des guides d’information et de sensibilisation actualisés par année académique, ainsi que des informations de calendrier.

Les contenus BacPilot doivent donc :

- expliquer comment préparer et comparer un choix, sans remplacer les décisions officielles ;
- renvoyer vers le guide et le portail officiel pour toute date, condition, liste de filières ou procédure qui évolue ;
- éviter de figer dans un article les dates d’ouverture ou règles d’une campagne qui peuvent changer ;
- déclarer clairement que BacPilot ne garantit ni admission ni bourse ;
- privilégier des sujets durables : analyser une filière, lire un guide, comparer les compromis, préparer des questions pour une famille, utiliser le portail officiel avec prudence.

## Vérification locale de l’index Articles

La prévisualisation locale de `/articles` affiche correctement le titre, l’introduction de méthode éditoriale, les trois cartes d’articles, les appels à l’action vers BacPilot et le portail officiel, ainsi que les liens Articles présents dans la navigation principale et le pied de page. Les métadonnées visibles dans le document sont : « Articles et conseils d’orientation post-bac au Bénin | BacPilot ».

## Vérifications complémentaires

La page d’article locale `/articles/preparer-ses-choix-apres-le-bac-benin` affiche un titre SEO spécifique, la date de publication, les sections structurées, le bloc de vérification source et les liens de lecture associés. La page locale `/avis` utilise une prévisualisation sans variables Supabase disponibles : elle ne permet donc pas de vérifier le chargement réseau réel, même si la fonction publique de base a été vérifiée directement et retourne un avis visible après migration.

La production consultée avant le nouveau déploiement correspond encore à l’ancienne version : elle ne contient pas le lien Articles et charge la vue historique. Une vérification sera nécessaire après publication de la nouvelle version.

## Vérification de production après déploiement

La publication Vercel a été réalisée sur le projet `mhmbac` et associée au domaine `https://bacpilot.site`. Après un court délai d’initialisation du client, `/articles` est accessible en production avec le titre « Articles et conseils d’orientation post-bac au Bénin | BacPilot », les trois articles, le maillage de navigation et les appels à l’action. L’URL de production Vercel de cette livraison est `https://mhmbac-l9rnptah4-hila2.vercel.app`.
