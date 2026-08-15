# Vérification portail bêta — 15 août 2026

| Élément | État constaté |
|---|---|
| `https://bacpilot.site/beta-access` | Page déployée et accessible. Sans session, elle redirige vers le formulaire de connexion avec le texte « Connecte-toi pour vérifier ton invitation au programme bêta ». |
| Projet Vercel | `beta.bacpilot.site` est associé au projet `mhmbac`. |
| DNS Vercel | Non validé au moment du contrôle. Vercel demande : `CNAME beta d996c3f5db3d48c4.vercel-dns-017.com.` |
| LWS via navigateur | La session du panneau LWS a expiré ; aucun changement DNS n’a été effectué depuis le navigateur. |

La recette restante consiste à ajouter le CNAME LWS, valider le domaine Vercel, ouvrir `https://beta.bacpilot.site`, puis tester avec un compte actif dans `public.beta_testers`.

## Recette post-déploiement

- `https://beta.bacpilot.site` répond en HTTPS 200 et affiche le portail de test.
- Le bouton « Vérifier mon accès bêta » redirige vers `https://bacpilot.site/beta-access`.
- La destination redirige sans session vers `https://bacpilot.site/login?returnTo=beta` et affiche explicitement le parcours de connexion bêta.
- La page de connexion rend `robots: noindex, nofollow` et la canonique `https://bacpilot.site/login`.

Le portail bêta rend le titre `Programme bêta BacPilot`, la directive `robots: noindex, nofollow` et la canonique `https://beta.bacpilot.site/` après chargement complet.
