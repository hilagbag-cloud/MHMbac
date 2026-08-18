# Audit SEO de marque BacPilot — 18 août 2026

## Requêtes observées

Les requêtes publiques sur **BacPilot**, **BackPilot** et **bacpilot.site Hilarus Gbagoule** confirment que le moteur reconnaît déjà la page À propos dans certains index agrégés, avec l’extrait : « BacPilot, initiative de MHM SOLUTIONS créée par Hilarus GBAGOULE ». En revanche, la recherche Google directe sur `BacPilot` ne renvoie pas encore BacPilot parmi les résultats organiques visibles ; les résultats sont dominés par des pages relatives aux pilotes de British Airways. La variante `BackPilot` n’est pas une orthographe de marque à promouvoir : elle renforcerait une confusion avec les résultats liés à l’aviation.

> La forme de marque à utiliser de façon cohérente est **BacPilot**, sans « k ».

## Pages et signaux publics constatés

Les pages `https://bacpilot.site/about` et `https://bacpilot.site/fondateur-hilarus-gbagoule` citent déjà Hilarus Gbagoule, MHM SOLUTIONS, la plateforme et le portfolio public. Le pied de page utilise une mention de crédit, mais le lien du portfolio ne figure pas directement dans cette mention sur toutes les pages.

La page publique `https://bacpilot.site/beta` est accessible et sert un contenu explicite destiné aux bêta-testeurs. Elle ne figurait pas dans `https://bacpilot.site/sitemap.xml` au moment de l’audit. Elle est donc une URL indexable à ajouter, à condition de conserver un contenu public utile et sans données privées.

## Améliorations retenues

La livraison devra maintenir la forme exacte **BacPilot** et associer clairement, sans répétition artificielle, les entités suivantes : BacPilot, MHM SOLUTIONS, Hilarus Gbagoule, le rôle de créateur/développeur, et le portfolio public `https://hilarusblog.vercel.app/`.

Les éléments retenus sont : enrichissement des titres et descriptions des pages publiques pertinentes, lien HTML explicite vers le portfolio depuis le crédit créateur, complétion du sitemap par la page bêta, et contrôle de cohérence entre les métadonnées `Organization`/`Person` déjà en place et le contenu visible.

## Sources de contrôle

- Recherche Google directe : `https://www.google.com/search?q=BacPilot`.
- Pages publiques BacPilot : `/about`, `/fondateur-hilarus-gbagoule`, `/beta`.
- Sitemap public : `https://bacpilot.site/sitemap.xml`.
- Référence Google sur les sitemaps : `https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview`.


## Recette locale après modification

La route locale `/beta` affiche désormais le titre « Programme bêta BacPilot | Tester l’orientation post-bac au Bénin ». Son contenu public, son crédit « Créé et développé par Hilarus GBAGOULE » et le lien de portfolio sont présents dans le DOM. La page est donc adaptée à l’indexation en tant que page d’information publique ; les zones d’accès authentifié demeurent hors du sitemap.


La vérification locale de l’accueil après hydratation confirme le titre `BacPilot | Orientation après le bac au Bénin`, la description enrichie, la canonique `https://bacpilot.site/`, la directive `index, follow, max-image-preview:large`, ainsi que la présence de Hilarus Gbagoule et du portfolio dans les données structurées.


## Éligibilité aux liens annexes

Le format fourni correspond aux **liens annexes** de Google sous un résultat de marque. Google indique qu’ils sont générés automatiquement à partir de la structure et des liens internes du site ; aucun balisage ne permet de les imposer ou de les commander. La page `/beta` a donc été enrichie avec un contenu public autonome et reliée par l’ancre descriptive `Programme bêta BacPilot` dans le pied de page. Les candidats naturels aux liens annexes de marque sont désormais : Guide orientation, Comment BacPilot fonctionne, Articles et conseils, À propos de MHM SOLUTIONS, Programme bêta BacPilot et Hilarus Gbagoule, créateur de BacPilot.


## Vérification publique après publication

Après propagation Vercel, `https://bacpilot.site/beta` affiche bien le contenu public enrichi et le titre `Programme bêta BacPilot | Tester l’orientation post-bac au Bénin`. Le sitemap servi sans cache inclut `https://bacpilot.site/beta`. Le pied de page public contient l’ancre `Programme bêta BacPilot` ainsi que les autres ancres candidates aux liens annexes. La première récupération textuelle de page reflétait un cache antérieur ; la vérification navigateur publique finale confirme la version publiée.
