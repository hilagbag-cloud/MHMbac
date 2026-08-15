# Vérification visuelle — Direction Preuves & Top 3

**Date :** 15 août 2026

## Contrôles réalisés en prévisualisation locale

| Route | Résultat | Observation |
|---|---|---|
| `/dashboard` sans session | Conforme | La route protège correctement le tableau de bord et redirige vers la connexion. Aucune donnée personnelle n’est exposée. |
| `/onboarding` sans session | Conforme | Le message d’accès est lisible sur fond sombre, le bouton ambre est contrasté et le vocabulaire est orienté candidat. |

## Limite de recette

Le tableau de bord Preuves & Top 3 nécessite une session candidat et des données réelles pour être vérifié de bout en bout visuellement. La compilation TypeScript/Vite a réussi. Une recette connectée reste à effectuer avec un compte candidat ; elle doit confirmer les cartes Top 3, le reçu « Ce que BacPilot a vérifié », le développement des facteurs et le champ de question.
