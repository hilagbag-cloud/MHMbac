# Architecture cible — BacPilot Agent d’orientation

**Produit :** BacPilot — par MHM SOLUTIONS  
**Objectif :** faire évoluer l’onboarding et le tableau de bord en une expérience conversationnelle qui collecte d’abord les informations structurées nécessaires, puis affiche des recommandations justifiées à partir des observations réelles synchronisées dans Supabase.

> Le système ne doit jamais présenter une admission, une bourse ou un débouché comme garanti. Il doit distinguer les données observées, les calculs déterministes et les explications générées.

## 1. Principes produits à conserver

BacPilot doit conserver trois principes non négociables. Le candidat reste maître de la validation de ses choix sur les plateformes officielles. Les recommandations doivent être explicables à partir de données disponibles à la date d’observation. Les appels à un modèle de langage ne doivent intervenir qu’après la collecte des informations minimales et ne doivent pas remplacer les calculs de classement.

| Principe | Conséquence technique |
|---|---|
| Collecter avant de répondre | La conversation enregistre les réponses localement puis dans Supabase avant toute requête IA. |
| Calculer côté serveur | Les scores et les trois recommandations proviennent d’une fonction SQL/Edge déterministe, jamais d’une intuition du modèle. |
| Expliquer sans promettre | L’IA reformule des raisons et signale les limites, mais ne fabrique ni probabilités ni données manquantes. |
| Validation manuelle | La plateforme peut préparer une shortlist, pas soumettre ou valider un choix officiel. |

## 2. Expérience conversationnelle proposée

La route `/onboarding` devient un écran de chat plein format, inspiré d’un assistant moderne. Les messages de BacPilot s’affichent avec un effet machine à écrire accessible, désactivable si le système indique une réduction des animations. Le candidat répond dans un champ texte unique avec suggestions rapides quand une réponse est structurée.

### Séquence sans appel IA

La première séquence est pilotée par des règles locales et ne consomme aucune API IA.

| Étape | Question affichée | Entrée | Donnée persistée |
|---:|---|---|---|
| 1 | « Comment veux-tu que BacPilot t’appelle ? » | Texte | `profiles.display_name` |
| 2 | « Quelle série as-tu obtenue au Bac ? » | Suggestions A/B/C/D/E/Autre ou texte | `profiles.series` |
| 3 | « Quelle mention as-tu obtenue ? » | Suggestions Passable/AB/B/TB ou texte | `profiles.mention` |
| 4 | « Que veux-tu privilégier maintenant ? » | Bourse / Carrière / Équilibre | `user_preferences.primary_goal` |
| 5 | « Quel domaine ou métier t’attire ? » | Texte libre, facultatif pour Bourse | `user_preferences.career_keywords` |
| 6 | « Veux-tu ajouter des matières ou points forts ? » | Texte libre et tags | nouvelle table `user_academic_signals` |
| 7 | « Je prépare ton analyse… » | État de calcul | aucune réponse nouvelle requise |

Après chaque réponse structurée, l’interface montre une confirmation courte. La session est sauvegardée par étape, avec reprise possible si le navigateur est fermé.

### Séquence de raisonnement visible

Après les données minimales, l’interface n’affiche pas une chaîne de pensée du modèle. Elle montre des étapes vérifiables, par exemple :

1. « Lecture de ton profil : Série D, mention Passable, objectif Bourse. »
2. « Recherche des relevés disponibles et récents. »
3. « Comparaison des jauges de bourse et de pression observée. »
4. « Filtrage selon ton domaine d’intérêt. »
5. « Préparation de trois pistes à vérifier. »

Ces messages reflètent des requêtes et calculs réels. Ils ne doivent pas simuler une analyse non réalisée.

## 3. Résultat conversationnel

Le résultat doit toujours donner trois solutions distinctes, accompagnées des données observées et des raisons de classement.

| Niveau | Contenu |
|---|---|
| Recommandation principale | Une filière prioritaire avec score, fraîcheur des données, compatibilité profil et réserve de prudence. |
| Deux alternatives | Deux filières classées, avec le compromis principal : plus de bourses, moindre pression, proximité métier, ou données plus fraîches. |
| Pourquoi | Facteurs déterministes : taux de bourse observé, pression pour la mention choisie, effectif total, correspondance des mots-clés, fraîcheur, et règles du guide si importé. |
| Limites | Date de collecte, données indisponibles, et rappel qu’aucune admission n’est garantie. |

## 4. Architecture de données

### 4.1 Données collectées par l’extension

L’extension ne doit jamais essayer de contourner une authentification, un CAPTCHA, une limitation du portail ou une session expirée. Elle utilise seulement les requêtes déjà disponibles dans une session officielle active et s’arrête en cas d’erreur 401/403, de contrôle robot ou de changement contractuel du portail.

Elle doit transmettre les **observations brutes** et les métadonnées de collecte, pas un classement personnalisé lié au profil du collecteur.

| Famille de données | Exemples | Statut cible |
|---|---|---|
| Catalogue | Université, école, filière, identifiants | Collecter intégralement si le portail les rend à la session autorisée |
| Jauges | Bourses, aides, totaux, distributions par mention, rang/capacité/candidats lorsqu’ils existent | Collecter intégralement, avec valeurs brutes |
| Métadonnées | Horodatage, version extension, source, identifiant de lot, couverture du scan | Obligatoire |
| Taxonomies fournies | Catégories, secteurs, modalités, conditions directement présentes | Collecter seulement si exposées par les réponses autorisées |
| Données personnelles d’autres candidats | Identités, contacts, dossiers, identifiants, notes individuelles | Ne jamais collecter ni synchroniser |

Le plan de scan doit être basé sur la découverte progressive des catégories et des identifiants retournés par le portail. Il faut dédupliquer les identifiants, respecter une cadence basse, utiliser une file locale résiliente et conserver un journal de couverture de scan. L’extension doit continuer à requérir une validation humaine avant tout remplissage ou enregistrement de choix.

### 4.2 Tables Supabase à ajouter

| Table | But | Écriture |
|---|---|---|
| `catalogue_entities` | Normaliser les universités, écoles, filières et catégories collectées | Edge Function collecteur |
| `collection_runs` | Traçabilité d’un scan : début, fin, couverture, erreurs, session active anonymisée, version extension | Edge Function collecteur |
| `programme_snapshots` | Historique de toutes les valeurs observées, même si elles se répètent avec un horodatage différent selon stratégie de rétention | Edge Function collecteur |
| `user_academic_signals` | Matières, intérêts, compétences et informations volontairement données par le candidat | Utilisateur authentifié |
| `orientation_sessions` | État d’une conversation, étape atteinte, réponses structurées et reprise | Utilisateur authentifié |
| `recommendation_runs` | Entrées calculées, trois résultats, règles de version et données consultées | Fonction serveur |
| `guide_chunks` | Extraits du guide officiel avec source, page, date, thèmes et embeddings éventuels | Administrateur après validation du guide |

La table `live_programmes` reste une vue courante rapide pour le site. `gauge_observations` reste un historique de changements dédupliqués. Les nouvelles tables n’exposent jamais de secrets, de jetons d’extension ou de contenu personnel d’autres candidats.

## 5. Moteur de recommandation

Le moteur doit rester déterministe dans sa première version. Il reçoit le profil, les préférences et les observations récentes, puis retourne des données JSON structurées.

Une formule de départ peut combiner :

| Facteur | Bourse | Carrière | Équilibre |
|---|---:|---:|---:|
| Ratio de bourses observé | 45 % | 15 % | 30 % |
| Pression sur la mention du candidat | 35 % | 25 % | 35 % |
| Correspondance domaine/métier | 10 % | 45 % | 20 % |
| Fraîcheur / complétude de la collecte | 10 % | 15 % | 15 % |

La formule doit être versionnée, affichable et remplaçable sans modifier l’extension. Les données insuffisantes doivent réduire la confiance, pas être remplacées par des valeurs supposées.

## 6. Rôle futur de l’IA et du guide officiel

L’IA n’est appelée qu’après la production du JSON du moteur déterministe. Elle reçoit uniquement : le profil volontairement fourni, les trois recommandations calculées, les facteurs de score, des extraits pertinents du guide officiel validé, et des limites de fraîcheur.

Son rôle est de :

- expliquer les trois propositions dans un langage simple ;
- comparer les compromis ;
- poser une question complémentaire utile si une information manque ;
- proposer des mots-clés de métier ou des matières à préciser ;
- rappeler la validation manuelle et les limites.

Elle ne doit pas :

- inventer une règle du guide ;
- déterminer seule le score d’admission ;
- proposer une filière sans données ou sans citer la base de comparaison ;
- exposer des données privées issues du portail.

### Deux options de fonctionnement

| Option | Fonctionnement | Coût | Avantage | Limite |
|---|---|---:|---|---|
| **A — Conversation guidée + moteur déterministe** | Le chat, le typewriter, les questions et les explications sont des templates pilotés par les données Supabase. | Gratuit hors hébergement et base existants. | Lancement immédiat, réponses auditables, pas de clé IA. | Reformulation moins naturelle. |
| **B — Mode hybride activé à la demande** | Option A par défaut, puis un appel IA serveur uniquement après accord du candidat ou pour une synthèse finale. | Variable par analyse ; peut être limité par quota. | Explications plus naturelles et meilleures questions libres. | Pas réellement gratuit à grande échelle. |

La recommandation de lancement est **Option A**. Elle permet déjà l’effet assistant, la saisie conversationnelle, le typewriter, le raisonnement visible, les trois résultats et les calculs pertinents. L’Option B est ajoutée plus tard derrière un bouton clair tel que « Obtenir une explication approfondie », un quota journalier et un modèle économique explicite.

## 7. Guide officiel et embeddings

Quand le guide officiel sera obtenu légalement, il doit être importé avec sa date, son URL/source, son texte extrait et ses pages. La première version peut fonctionner sans embeddings : recherche textuelle par mots-clés, tags de filière et citations de pages.

Les embeddings ne doivent être ajoutés que lorsqu’il existe un besoin réel de recherche sémantique. Une approche gratuite de départ consiste à pré-calculer localement des représentations lexicales ou à stocker des mots-clés normalisés. Pour une solution d’embeddings hébergée, il faudra choisir un fournisseur, définir un quota et accepter que ce ne soit pas entièrement gratuit à grande échelle.

## 8. Ordre de mise en œuvre

1. Créer le composant de conversation/typewriter sans IA et remplacer l’onboarding actuel.
2. Sauvegarder les réponses par étape dans le profil, les préférences et une session de conversation.
3. Ajouter une fonction de recommandation déterministe qui retourne un JSON avec top 3, facteurs, confiance et fraîcheur.
4. Transformer le dashboard en restitution conversationnelle des résultats, avec accès au classement complet.
5. Refactoriser l’extension : retirer tout critère personnel du collecteur, ajouter découverte de couverture, données brutes, journal de lot et gestion d’erreurs de session.
6. Ajouter les migrations Supabase pour catalogue, sessions, signaux et recommandations.
7. Importer le guide officiel validé, puis ajouter une recherche citée et, seulement si nécessaire, des embeddings.
8. Ajouter l’option IA hybride avec budget, quotas et garde-fous.

## 9. Critères d’acceptation de la première version

La première version conversationnelle est considérée prête quand un candidat peut reprendre une session, renseigner son profil en texte ou avec suggestions, recevoir des messages qui s’écrivent progressivement, voir des états de calcul réels, obtenir trois recommandations provenant uniquement d’observations synchronisées et comprendre pourquoi elles sont proposées. Aucun appel IA externe n’est requis pour ce socle.

La nouvelle extension est considérée prête quand elle inventorie uniquement les entités et jauges accessibles à une session officielle autorisée, envoie des lots idempotents avec métadonnées de couverture, ne dépend d’aucun profil de collecteur et s’arrête proprement dès que la session ou les règles du portail ne permettent plus la lecture.
