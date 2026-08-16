# Références SEO Google — audit BacPilot

Sources officielles consultées le 16 août 2026 :

1. https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
2. https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
3. https://developers.google.com/search/docs/appearance/structured-data/organization
4. https://developers.google.com/search/docs/fundamentals/seo-starter-guide

## Principes appliqués

- Un sitemap doit lister uniquement les URL canoniques, absolues, indexables et réellement souhaitées dans les résultats. Il est un signal de découverte, pas une garantie d’indexation ou de classement.
- Les sous-domaines doivent être traités comme des sites distincts pour les sitemaps référencés par leurs propres `robots.txt`, sauf soumission croisée dans Search Console avec propriété vérifiée.
- Les pages accessibles uniquement après connexion, les routes bêta et les pages privées doivent rester absentes du sitemap et conservées en `noindex`.
- Les données structurées `Organization` peuvent aider Google à comprendre et désambiguïser BacPilot ; elles doivent décrire les informations réellement disponibles et figurer sur l’accueil ou une page institutionnelle.
- Les titres, méta-descriptions, textes visibles, liens internes descriptifs et contenus utiles sont prioritaires. Les répétitions artificielles de mots-clés et la promesse de classement ne sont pas des stratégies valides.
- Google indique que les changements SEO peuvent demander des jours à plusieurs semaines ou mois avant d’être reflétés dans les résultats. Aucun réglage ne peut garantir qu’une requête générique telle que « Back » affichera BacPilot.

## Vérification de production et décision multi-sous-domaines

La recette HTTP du 16 août 2026 a confirmé que Vercel sert les fichiers présents dans `public/` avant les réécritures conditionnées par l’hôte : le domaine principal servait le nouveau sitemap, mais `partenaires.bacpilot.site/robots.txt` et `/sitemap.xml` continuaient à servir les fichiers racine. La stratégie est donc ajustée pour que le sitemap racine, référencé par le robots.txt commun, inclue l’URL canonique publique du portail partenaires. Google documente la soumission croisée de sitemaps sous condition de vérifier les propriétés des sites concernés. `beta.bacpilot.site` ne doit pas être inclus : le sous-domaine est conservé avec `X-Robots-Tag: noindex, nofollow`.
