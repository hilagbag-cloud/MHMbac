# Base de connaissances du Guide MESRS 2026–2027

Le document officiel *Guide d’information et de sensibilisation des nouveaux bacheliers 2026-2027 (Licence)* est désormais une source de connaissance structurée de BacPilot. Cette fonctionnalité enrichit la comparaison des filières avec les conditions et débouchés indiqués par le guide ; elle ne remplace jamais les observations de concurrence collectées en direct, le classement officiel ou la décision finale du candidat.

| Élément | Valeur initiale |
|---|---|
| Source | Guide MESRS 2026–2027 fourni au projet |
| Émetteur indiqué | Direction Générale de l’Enseignement Supérieur, Direction de l’Orientation et du Suivi de l’Enseignement Supérieur |
| Empreinte du fichier traité | `6619ab17b5f973fdc77c8732186493bce48bf7b2c7acc2fa179363e8aa4ec157` |
| Pages du document | 116 |
| Fiches de formation chargées | 937 |
| Source de preuve affichée | `Guide MESRS 2026-2027, p. X` |

## Principe de fonctionnement

La numérisation est une **ingestion unique par édition**. Une extraction structurée transforme les tableaux du guide en fiches contenant, lorsque la page le précise, l’établissement, la formation, les quotas de bourse ou d’aide/FPP, le mode d’entrée, les séries recommandées, les matières et les débouchés. Chaque fiche conserve le numéro de page PDF, un extrait source, son niveau de complétude et son statut de vérification.

Lorsqu’un candidat demande ses trois pistes, BacPilot conserve le calcul déterministe basé sur les données observées. L’assistant interroge ensuite seulement les trois noms de formation via `lookup_guide_programmes` ; une recherche textuelle bornée peut servir de repli, mais elle est explicitement signalée comme une correspondance à vérifier. Le PDF entier n’est donc jamais envoyé à Gemini ou Groq. Si une reformulation IA est demandée, seuls les faits retenus et les références de pages sont transmis.

> Une référence du guide décrit une formation et ses informations d’orientation. Elle ne constitue pas une promesse d’admission, de bourse, de débouché professionnel, ni un substitut à la validation sur [apresmonbac.bj](https://apresmonbac.bj).

## Objets Supabase

| Objet | Rôle | Accès application |
|---|---|---|
| `guide_sources` | Traçabilité de l’édition, de l’empreinte et de l’attribution | Pas de lecture directe côté navigateur |
| `guide_programmes` | Fiches numérisées avec page et champs structurés | Pas de lecture directe côté navigateur |
| `search_guide_programmes` | Recherche textuelle courte et limitée à 20 résultats | Exécution accordée à `authenticated` |
| `lookup_guide_programmes` | Correspondance exacte pour les recommandations en cours | Exécution accordée à `authenticated` |

Les tables sont protégées par RLS et les rôles navigateur n’obtiennent pas de droit `SELECT` direct. Les deux fonctions de consultation sont en lecture seule, ne prennent aucun identifiant candidat et renvoient seulement les attributs nécessaires à l’affichage orientatif.

## Affichage produit

Dans « **Voir pourquoi cette piste ressort** », BacPilot sépare toujours deux sources : les données de concurrence observées par la collecte et les repères du guide. Pour une correspondance exacte, l’interface affiche le mode d’entrée, les séries recommandées, les quotas documentés s’ils existent, les débouchés listés et la page du guide. Pour une correspondance textuelle non certaine, elle n’affiche pas les débouchés et demande une vérification humaine.

## Mise à jour d’une prochaine édition

Une nouvelle édition ne doit jamais écraser silencieusement celle de 2026–2027. Créer une nouvelle ligne dans `guide_sources` avec une nouvelle empreinte, importer les fiches sous un nouveau `source_id`, vérifier un échantillon de pages, puis basculer `active` après validation. Les recommandations futures consulteront uniquement l’édition active. Conserver les anciennes éditions permet un audit de ce qui a été présenté à un candidat.

## Contrôles réalisés

La recherche `Santé publique` pour la série `D` a retourné des fiches complètes, avec établissement, quotas, mode d’entrée, séries recommandées, débouchés et pages sources. Le rôle `authenticated` peut exécuter les fonctions de recherche mais ne peut pas lire directement `guide_programmes`. L’Edge Function `orientation-assistant` est active en version 12 et ne récupère que les fiches pertinentes des trois recommandations.
