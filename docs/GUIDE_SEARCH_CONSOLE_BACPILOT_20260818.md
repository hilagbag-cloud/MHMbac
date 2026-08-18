# Guide Google Search Console — BacPilot

## État de la livraison

BacPilot est publié sur `https://bacpilot.site`. Le sitemap public inclut désormais la page bêta publique :

```text
https://bacpilot.site/sitemap.xml
```

Les pages prioritaires exposent une identité cohérente : BacPilot, MHM SOLUTIONS, Hilarus Gbagoule et le portfolio public. La page `https://bacpilot.site/beta` comporte maintenant un contenu public de présentation du programme bêta et un titre distinct.

> Les liens annexes sous un résultat Google sont sélectionnés automatiquement. Ils ne peuvent pas être ajoutés, ordonnés ou demandés séparément dans Search Console. Le site doit seulement présenter une structure claire, des pages utiles et des liens internes descriptifs.[1]

## Étape 1 — Actualiser le sitemap

1. Ouvrez la propriété `https://bacpilot.site/` dans Google Search Console.
2. Dans le menu gauche, ouvrez **Sitemaps**.
3. Dans « Ajouter un sitemap », saisissez `sitemap.xml`.
4. Cliquez sur **Envoyer**.
5. Si ce sitemap est déjà affiché, contrôlez simplement que son état devient **Réussi** et que la date de lecture est récente. Ne créez pas un second sitemap avec une autre URL.

Le sitemap aide Google à découvrir les URLs importantes, mais il ne garantit pas leur exploration ou leur indexation.[2]

## Étape 2 — Tester et demander l’indexation des pages prioritaires

Utilisez la barre **Inspection de l’URL**. Saisissez une URL complète à la fois, cliquez sur **Tester l’URL active**, puis sur **Demander une indexation** si le test indique qu’elle est indexable.

| Priorité | URL à inspecter | Pourquoi |
|---|---|---|
| 1 | `https://bacpilot.site/` | Résultat de marque, titre BacPilot et crédit créateur |
| 2 | `https://bacpilot.site/about` | Présentation de MHM SOLUTIONS et de BacPilot |
| 3 | `https://bacpilot.site/fondateur-hilarus-gbagoule` | Entité publique du créateur, portfolio et profil professionnel |
| 4 | `https://bacpilot.site/beta` | Programme bêta public, désormais dans le sitemap |
| 5 | `https://bacpilot.site/articles` | Hub des contenus de conseil |

Après le test, vérifiez dans **Indexation des pages** : « Exploration autorisée : Oui », « Indexation autorisée : Oui » et l’URL canonique sélectionnée. L’outil d’inspection permet également de voir la page rendue par Google et d’identifier des erreurs immédiates.[3]

## Étape 3 — Contrôler les résultats et attendre

Une demande d’indexation ne produit pas un résultat instantané et ne garantit pas l’affichage. Google indique que l’exploration peut prendre de quelques jours à quelques semaines et que la qualité, l’utilité et la structure du contenu sont aussi évaluées.[4]

Après 7 à 14 jours, revenez dans les rapports **Indexation des pages** et **Performances**. Recherchez les requêtes `BacPilot`, `BacPilot orientation`, `orientation après le bac au Bénin` et `Hilarus Gbagoule`. Pour le résultat de marque, les liens annexes attendus à terme sont notamment : Guide orientation, Méthode, Articles, À propos, Programme bêta et page créateur.

## Ce qu’il ne faut pas faire

N’ajoutez pas l’orthographe « BackPilot » dans les titres, les données structurées ou le sitemap : la marque officielle est **BacPilot** et la variante renforce une confusion avec les résultats d’aviation. Ne soumettez pas la même URL plusieurs fois le même jour : les demandes sont limitées et les répétitions n’accélèrent pas l’exploration.[4]

## Références

[1] [Google Search Central — Liens annexes](https://developers.google.com/search/docs/appearance/sitelinks)

[2] [Google Search Central — Comprendre les sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)

[3] [Google Search Console Help — Outil d’inspection d’URL](https://support.google.com/webmasters/answer/9012289?hl=fr)

[4] [Google Search Central — Demander à Google de réexplorer vos URLs](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)
