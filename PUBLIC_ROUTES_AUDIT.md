# Audit des routes publiques BacPilot — pré-déploiement

| Route | Vérification locale | Résultat |
|---|---|---|
| `/methodologie` | Navigation, titre dynamique, contenu explicatif, CTA vers la préparation et liens de footer. | Conforme : page visible, route active, titre « Comment fonctionne BacPilot ? \| BacPilot ». |
| `/contact` | Navigation, adresse e-mail `mailto:`, lien vers confidentialité et footer. | Conforme : page visible, action e-mail explicite, aucun formulaire simulé. |

> Tests exécutés sur la version Vite compilée locale à `http://localhost:4173` avant tout déploiement.
| `/about` | Présentation de BacPilot, biographie professionnelle sobre du créateur, lien portfolio externe et CTA Méthode. | Conforme : page visible, lien portfolio public et route `/methodologie` présents. |
| `/privacy` | Informations de confidentialité, page Contact et footer. | Conforme : contenu actualisé, route `/contact` présente, aucune mention MVP obsolète. |
| `/terms` | Cadre d’utilisation, absence de promesse, lien vers la Méthode et footer. | Conforme : page visible et route `/methodologie` présente. |
| `/orientation-bac-benin` | CTA vers la préparation, lien externe officiel et footer. | Conforme : préparation reliée à `/onboarding`, portail officiel relié à `https://apresmonbac.bj/`. |
| CTA Guide → `/onboarding` | Clic réel sur « Préparer mes pistes à vérifier ». | Conforme : page de préparation affichée avec explication d’authentification. |
| CTA Onboarding → `/login` | Clic réel sur « Me connecter pour commencer ». | Conforme : page de connexion affichée. |
| `/partenaires` (prévisualisation locale) | Page partenaire, lien de proposition et liens `mailto:` vers les deux adresses officielles. | Conforme sur le contenu et les actions ; l’URL publique cible reste `https://partenaires.bacpilot.site` et attend son CNAME LWS. |
| `/partenaires` après métadonnées | Titre, contenu, lien de proposition et canaux de contact/support. | Conforme : titre « Devenir partenaire », actions `mailto:` vers `contact@bacpilot.site` et `support@bacpilot.site`, sans formulaire simulé. |
| `https://partenaires.bacpilot.site/` (production) | Sous-domaine HTTPS, rendu de l’espace partenaire, titre et canaux de contact. | Conforme : Vercel vérifie le domaine, HTTPS 200, titre « Devenir partenaire | BacPilot », liens vers `contact@bacpilot.site` et `support@bacpilot.site` visibles. |
| Headers `bacpilot.site` et `partenaires.bacpilot.site` | Logo après correction de ratio. | Conforme : image avec hauteur fixe `h-9`, largeur automatique `w-auto` et `object-contain`, sans écrasement visuel dans les deux navigations. |
