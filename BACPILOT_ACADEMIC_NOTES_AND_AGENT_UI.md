# Notes académiques et interface agentique

## Règle appliquée

BacPilot utilise la **moyenne de classement** décrite dans le Guide MESRS 2026–2027, et non une moyenne générale improvisée. Le guide publie la formule `M = (m1*x + m2*y + m3*z) / (x+y+z)` et donne, pour Médecine, les exemples suivants : Bac D `SVT*5 + Math*4 + SPCT*4 / 13` et Bac C `SVT*2 + Math*6 + SPCT*5 / 13`.

Le calculateur demande trois notes principales, valides entre 0 et 20. Les configurations actuellement supportées sont :

| Série | Trois matières utilisées par le calculateur BacPilot |
|---|---|
| A | Français (5), Philosophie (4), Histoire-Géographie (3) |
| B | Français (4), Économie (4), Histoire-Géographie (4) |
| C | Mathématiques (6), Sciences Physiques (5), SVT (2) |
| D | SVT (5), Mathématiques (4), Sciences Physiques (4) |
| E | Mathématiques (5), Sciences Physiques (4), Construction mécanique (3) |

La grille des épreuves et coefficients provient de la page officielle de l’Office du Baccalauréat du Bénin. La mention reste actuellement saisie par le candidat, car la moyenne de classement seule ne suffit pas à déduire la mention officielle du diplôme.

## Parcours utilisateur

Le chat pose d’abord les questions de profil. Après l’objectif et le domaine, il propose une étape facultative : saisir les trois notes principales ou passer. La moyenne calculée est affichée avec le libellé « moyenne de classement », la version de calcul et un rappel indiquant qu’elle ne garantit ni admission ni bourse.

L’avatar utilise l’actif PNG transparent BacPilot. La scène centrale ajoute un sticker animé sobre avec deux yeux qui bougent légèrement ; l’animation respecte la préférence utilisateur `prefers-reduced-motion` pour le texte et reste décorative.

## Économie de tokens

Les réponses de profil et la validation des notes sont déterministes. L’IA n’est appelée que pour l’action `explain`, après calcul des recommandations, et reçoit uniquement les faits validés, la moyenne de classement et les extraits pertinents du guide. Gemini est essayé en premier, Groq en repli si configuré ; un mécanisme de quota limite les explications. Le PDF complet n’est jamais envoyé au modèle.

## Sécurité et persistance

La table `user_academic_signals` conserve les notes dans `subjects` et `ranking_subjects`, l’activation facultative, `ranking_average` et `calculation_version`. RLS conserve la séparation par utilisateur. L’Edge Function revérifie les scores entre 0 et 20 et recalcule la moyenne côté serveur avant l’écriture.

## Sources

1. [Office du Baccalauréat du Bénin — Différentes séries et filières](https://officedubacbenin.bj/spip.php?article10)
2. [Office du Baccalauréat du Bénin — Liste des épreuves et coefficients](https://www.officedubacbenin.bj/spip.php?article11)
3. [Guide MESRS 2026–2027](https://guide.apresmonbac.bj/docs/guide-information-2026-2027.pdf)
