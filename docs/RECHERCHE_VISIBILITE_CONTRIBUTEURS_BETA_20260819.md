# Recherche — Visibilité des contributeurs bêta BacPilot

## Enseignements officiels Google

Google prévoit le balisage `ProfilePage` pour les plateformes communautaires où une personne ou une organisation affiliée au site partage une perspective de première main. Chaque URL doit être centrée sur un seul profil et comporter une entité principale `Person` ou `Organization`. Les propriétés utiles sont le nom public, une description, les liens externes consentis (`sameAs`), l’image seulement si elle est accessible à l’exploration et le `dateModified`. Le balisage doit représenter ce qui est réellement visible à l’écran ; il n’offre aucune garantie d’affichage enrichi ou de positionnement.

Pour publier une page individuelle, elle doit être accessible sans connexion, ne pas porter de `noindex`, être reliée depuis une navigation ou un annuaire et être ajoutée au sitemap. Google recommande de déployer d’abord quelques pages, de les vérifier avec le Rich Results Test et l’inspection d’URL, puis de suivre le rapport de performance.

Le retrait doit être immédiat côté site : une URL désactivée reste accessible à Google afin que le moteur lise `noindex` ou reçoive un statut HTTP approprié. Ne jamais bloquer une URL retirée dans `robots.txt`, car Google ne pourrait alors pas lire sa directive `noindex`. Les données structurées ne doivent contenir que les informations que le contributeur a explicitement décidé de rendre publiques.

## Garde-fous éditoriaux

La visibilité doit partir d’une valeur réelle pour les futurs bacheliers et la communauté : une expérience de test, un retour utile, un domaine d’intérêt ou une amélioration observée. Il ne faut pas générer à grande échelle des pages quasi identiques à partir d’un score ou de mots-clés. Chaque profil indexé doit contenir un texte réellement choisi ou rédigé par la personne, modéré pour la sécurité et relié à un rôle clair dans la communauté BacPilot.

Le balisage JSON-LD doit décrire exactement le contenu visible de chaque page. Il ne doit jamais contenir de résultat scolaire, d’adresse e-mail, de données d’orientation, d’identifiant interne, de détails privés de retours, ni de statistiques qui ne sont pas affichées. Une photo n’est ajoutée que si elle est explicitement publique et exploitable par les moteurs ; sinon elle est entièrement absente du balisage.

## Sources

1. [Google Search Central — ProfilePage structured data](https://developers.google.com/search/docs/appearance/structured-data/profile-page), consulté le 19 août 2026.
2. [Google Search Central — Robots meta tag and X-Robots-Tag](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag), consulté le 19 août 2026.
3. [Google Search Central — Learn about sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview), consulté le 19 août 2026.
4. [Google Search Central — Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), consulté le 19 août 2026.
5. [Google Search Central — General structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies), consulté le 19 août 2026.
6. [Google Search Central — Spam policies for Google web search](https://developers.google.com/search/docs/essentials/spam-policies), consulté le 19 août 2026.
