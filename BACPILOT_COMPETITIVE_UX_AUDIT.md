# Audit comparatif public — BacPlus et adaptations BacPilot

Cet audit examine uniquement les pages publiques, la documentation API ouverte et les réponses GET anonymes de BacPlus. Il ne réutilise ni code, ni score propriétaire, ni données de profil, ni matrice de coefficients provenant de BacPlus.

## Constat public

| Élément observé | Principe utile | Adaptation BacPilot |
|---|---|---|
| Parcours par étapes | Une question claire à la fois réduit la charge cognitive | Onboarding conversationnel avec progression et réponses rapides |
| Notes structurées par matière | Une grille évite les erreurs de format | Champs individuels 0–20, par série, avec coefficients visibles |
| Distinction notes définitives / estimées | La confiance du résultat doit refléter la situation du candidat | À ajouter dans une prochaine itération avec indication de fiabilité |
| Trois plans | La présentation de scénarios facilite la décision | À adapter en « Ambition », « Sécurité » et « Équilibre », avec données BacPilot et sources affichées |
| Simulation « Et si ? » | Une simulation doit être personnelle et explicable | À construire sur les notes stockées de l’utilisateur et une matrice officielle vérifiée |
| Détail filière × série | La moyenne de classement varie selon la filière | BacPilot doit construire sa propre matrice sourcée à partir du guide MESRS, sans importer celle d’un concurrent |

## Point calculatoire essentiel

La documentation publique de BacPlus annonce une moyenne pondérée par filière, et ses réponses publiques de filières affichent trois matières et coefficients dépendant de la filière et de la série. Ce fonctionnement est cohérent avec le Guide MESRS 2026–2027 : le classement repose sur les trois matières fondamentales retenues pour la formation, avec les coefficients de la série.

BacPilot ne présente donc plus sa moyenne générale par série comme une moyenne exacte de filière. Le calcul présent est un **repère de classement de série**, calculé de façon transparente. La précision par filière doit être activée seulement après l’ingestion d’une matrice officielle vérifiée, qui comportera : filière, série, trois matières, coefficients, source et page.

## Améliorations intégrées

BacPilot propose désormais une grille de notes structurée pour les séries A, B, C, D et E. Les trois matières de classement sont identifiées et les matières complémentaires sont conservées dans le profil utilisateur sans inventer de moyenne générale. Les notes doivent être comprises entre 0 et 20 ; la moyenne de classement est recalculée côté Edge Function avant l’enregistrement.

Les épreuves facultatives ne sont pas encore incluses au calcul. Leur règle précise doit être validée sur une source institutionnelle avant activation. Cette décision est volontaire : une bonification mal implémentée serait plus dommageable qu’une fonctionnalité différée.

## Sources

1. [Office du Baccalauréat du Bénin — épreuves et coefficients](https://www.officedubacbenin.bj/spip.php?article11)
2. [Guide MESRS 2026–2027](https://guide.apresmonbac.bj/docs/guide-information-2026-2027.pdf)
3. [BacPlus — page publique](https://bacplus.bj/)
4. [BacPlus — documentation API publique](https://api.bacplus.bj/docs)
