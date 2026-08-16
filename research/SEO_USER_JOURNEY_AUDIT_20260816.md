# Audit de parcours utilisateur SEO — 16 août 2026

## Parcours et recherches testés

- Requête de marque : `BacPilot`, `BacPilot Hilarus GBAGOULE`, `BacPilot orientation Bénin`.
- Requêtes d’intention : `orientation après le bac au Bénin`, `orientation post bac Bénin`, `filières universitaires Bénin`.
- Pages publiques vérifiées : accueil, guide d’orientation, espace partenaire et ancienne URL `/a-propos`.

## Constats vérifiés

1. Les résultats publics de recherche ne font pas encore remonter BacPilot pour les requêtes de marque; la visibilité organique reste à construire. Les résultats sont dominés par le portail officiel et des contenus concurrents ou génériques.
2. L’accueil, le guide et la page partenaire offrent du contenu textuel distinct, avec une explication transparente du rôle de BacPilot et du portail officiel.
3. L’ancienne URL `/a-propos` a été redirigée par Vercel vers `/about`; après chargement applicatif, la page À propos rend bien son contenu complet et ses liens internes.
4. Le sitemap déclare les pages publiques principales. La route `/a-propos` est désormais gérée côté application et dispose d’un canonical vers `/about`.
5. Le statut de données sur l’accueil doit distinguer la fraîcheur de l’observation de l’état du canal Realtime. Le code a été ajusté dans ce sens; l’extracteur textuel peut encore refléter une version antérieure pendant la propagation de cache.

## Priorités organiques restantes

- Faire relire le sitemap dans Google Search Console après déploiement et demander l’indexation de l’accueil, du guide, de la méthode et de la page À propos.
- Obtenir des liens éditoriaux réels et pertinents vers `bacpilot.site` : portfolio du créateur, partenaires éducatifs, associations de bacheliers et contenus explicatifs non sponsorisés.
- Ne pas chercher à générer artificiellement des requêtes, clics, avis ou backlinks. Conserver les formulations « pistes à vérifier » et l’absence de promesse d’admission ou de bourse.
