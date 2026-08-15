# Décision d’architecture — BacPilot comme assistant IA d’orientation

**Produit :** BacPilot — par MHM SOLUTIONS  
**Créateur :** Hilarus GBAGOULE  
**Objet :** lancer un assistant conversationnel qui s’appuie sur les observations réellement collectées, tout en protégeant la base Supabase et les données des candidats.

## Décision

BacPilot sera construit comme un **assistant d’orientation assisté par IA**, et non comme un modèle disposant d’un accès libre à la base. Le système de décision reste déterministe : il lit les observations synchronisées, contrôle leur date de mise à jour, filtre les filières compatibles, calcule les scores, puis propose un **Top 3 justifié**. L’IA sert à dialoguer, reformuler les résultats et expliquer les limites ; elle ne calcule pas les scores de manière opaque et ne crée pas de données.

> L’agent ne peut pas modifier les données d’orientation collectées. Il peut uniquement enregistrer les réponses, préférences et états de conversation appartenant au candidat authentifié qui l’utilise.

## Architecture fonctionnelle retenue

```text
Extension collectrice
    │ observations brutes et métadonnées de couverture
    ▼
Edge Function de synchronisation isolée
    │ écriture contrôlée
    ▼
Supabase : catalogue, jauges, alertes, fraîcheur
    │ lecture strictement filtrée
    ▼
Edge Function `orientation-assistant`
    ├─ vérifie le JWT du candidat
    ├─ appelle le moteur de scoring déterministe
    ├─ lit les résultats, la fraîcheur et les détails autorisés
    ├─ met à jour uniquement le profil/session du candidat connecté
    └─ appelle facultativement une API IA de reformulation
    ▼
Interface chat BacPilot
    └─ typewriter, questions successives, états réels de calcul, Top 3
```

Cette séparation protège à la fois le produit et l’utilisateur. L’extension est le seul composant qui alimente les observations. L’agent lit ces observations via des fonctions limitées, sans clé d’administration. Le candidat ne valide jamais automatiquement un choix : BacPilot suggère et explique ; la décision et la saisie finale restent manuelles sur le portail officiel.

## Matrice de permissions

| Domaine | Extension | Agent | Candidat connecté |
|---|---:|---:|---:|
| `live_programmes`, jauges, historiques | Écriture par synchronisation contrôlée | Lecture filtrée uniquement | Lecture publique ou agrégée uniquement |
| Fraîcheur et couverture des scans | Écriture par synchronisation contrôlée | Lecture uniquement | Lecture uniquement |
| Profil et préférences personnelles | Non | Lecture et écriture de **son seul propriétaire** | Lecture et écriture de **sa seule ligne** |
| Session conversationnelle | Non | Lecture et écriture de **son seul propriétaire** | Lecture et écriture de **ses seules sessions** |
| Profil ou session d’un autre candidat | Non | Non | Non |
| Requête SQL libre / clé `service_role` | Non | Non | Non |

L’identité utilisateur doit toujours être dérivée du JWT Supabase validé par l’Edge Function. Le client ne doit jamais fournir un `user_id` qui pilote une lecture ou une écriture. Les politiques RLS doivent imposer `auth.uid() = user_id` pour les sessions et informations personnelles.

## Outils autorisés à l’agent

L’agent reçoit des outils fermés, avec entrées validées. Il ne reçoit jamais un accès SQL ou REST général à Supabase.

| Outil | But | Type |
|---|---|---|
| `get_data_freshness()` | Lire date de dernière collecte, nombre de filières et couverture | Lecture |
| `get_top_recommendations()` | Retourner les trois résultats déterministes et leurs facteurs | Lecture |
| `get_programme_details(programme_id)` | Expliquer un résultat avec ses observations autorisées | Lecture |
| `get_guide_excerpts(query)` | Rechercher plus tard des passages sourcés du guide officiel | Lecture |
| `save_profile_answer(patch)` | Enregistrer une réponse de profil validée | Écriture limitée au propriétaire |
| `save_preferences(patch)` | Enregistrer objectif, domaines et signaux volontaires | Écriture limitée au propriétaire |
| `save_session_event(event)` | Conserver l’étape et les messages du candidat | Écriture limitée au propriétaire |

Les états visibles, par exemple « vérification de la dernière synchronisation » ou « comparaison de filières compatibles », doivent correspondre à des opérations réellement exécutées. BacPilot ne doit pas afficher une chaîne de raisonnement interne simulée.

## Politique de recommandation

Chaque recommandation doit contenir quatre éléments vérifiables : le programme, le score calculé, les facteurs qui l’influencent et l’horodatage de l’observation. Le texte de réponse doit rappeler lorsque les données sont anciennes ou incomplètes.

| Étape | Exécutant | Résultat |
|---|---|---|
| Lecture du profil et de l’objectif | BacPilot, via RLS | Paramètres du candidat connecté |
| Vérification de la fraîcheur | Fonction déterministe | Date, âge, statut « frais / à surveiller / ancien » |
| Scoring et classement | RPC Supabase déterministe | Top 3 et facteurs mesurables |
| Première réponse | Gabarit local déterministe | Explication utilisable sans API IA |
| Approfondissement volontaire | API IA | Reformulation fidèle du JSON calculé |

L’agent ne doit jamais déclarer qu’une admission ou une bourse est garantie. Il doit utiliser des formulations telles que « piste à surveiller », « meilleur compromis observé » ou « probabilité relative selon les observations disponibles ».

## Stratégie d’API IA recommandée

La gratuité est une ressource limitée et révisable ; elle ne doit donc jamais conditionner le fonctionnement essentiel. Le **mode déterministe** constitue la base durable du produit. Une API IA est ajoutée seulement pour l’explication personnalisée.

| Ordre | Fournisseur | Usage retenu | Motif |
|---:|---|---|---|
| 1 | **Gemini API via Google AI Studio** | Reformulation principale, sur demande | Le palier gratuit existe pour certains modèles, dont des Flash/Lite ; les quotas varient selon modèle et projet.[1] [2] |
| 2 | **GroqCloud** | Secours unique si Gemini est indisponible ou limité | Offre gratuite documentée, avec plafonds par organisation et par modèle.[3] |
| 3 | **OpenRouter modèles `:free`** | Environnement de test ou secours non critique | Limité à 20 RPM et 50 RPD sans achat, donc inadapté comme fondation principale.[4] |
| 4 | **Cloudflare Workers AI** | Alternative future si l’endpoint migre chez Cloudflare | 10 000 Neurons/jour sont inclus dans l’offre gratuite ; la consommation dépend du modèle.[5] |

La recommandation concrète est d’utiliser **Gemini Free comme fournisseur principal**, **Groq Free comme fallback unique**, puis le mode déterministe si aucun appel ne peut aboutir. OpenRouter n’est pas retenu pour la production initiale. Cloudflare Workers AI reste une option à évaluer plus tard, notamment si BacPilot souhaite héberger le routeur et les embeddings dans le même environnement.

Le palier gratuit Gemini peut utiliser les contenus soumis pour améliorer les produits Google ; il ne faut donc pas y transmettre d’informations personnelles inutiles, de jetons, de mots de passe, ni l’historique complet du candidat.[1] Le prompt ne doit contenir que les faits indispensables : série, mention, objectif, préférences explicitement consenties, Top 3 calculé et extraits officiels éventuels.

## Politique de quotas et de repli

Le lancement applique un budget indépendant des limites des fournisseurs : **trois explications IA réussies par candidat et par jour**, une requête à la fois par session et une sortie courte. Un plafond global journalier est également défini côté serveur. Avant tout appel, une fonction transactionnelle vérifie et consomme le quota du candidat.

Si Gemini répond par un délai, une erreur serveur ou un code de limite, BacPilot essaie Groq une seule fois. S’il échoue aussi, l’interface affiche immédiatement l’explication déterministe. Cette politique évite les boucles, les coûts imprévus et toute tentative de contourner les limites par rotation de comptes ou de clés.

## Sécurité des clés et des données

Les clés Gemini et Groq restent uniquement dans les secrets de l’Edge Function. Elles ne doivent jamais figurer dans le code React, les variables `VITE_*`, le dépôt GitHub, l’extension Chrome ou les journaux. La clé `SUPABASE_SERVICE_ROLE_KEY` est réservée à l’ingestion administrative ; elle est explicitement interdite dans `orientation-assistant`.

Les journaux de l’agent enregistrent uniquement les informations opérationnelles utiles : fournisseur, modèle, statut, latence, nombre de tentatives et compteur de quota. Les données conversationnelles doivent rester dans des sessions protégées par RLS, avec une politique de conservation définie avant l’ouverture au public.

## Ordre de réalisation

| Priorité | Livraison | Dépendance IA |
|---:|---|---|
| 1 | Migration `orientation_sessions` et RLS propriétaire | Aucune |
| 2 | Migration de quota `ai_usage_daily` et RPC atomique | Aucune |
| 3 | RPC `get_top_recommendations` fondée sur les observations réelles | Aucune |
| 4 | Interface chat/typewriter et sauvegarde pas-à-pas | Aucune |
| 5 | Edge Function `orientation-assistant` avec outils limités | Aucune pour le premier niveau |
| 6 | Gemini Free, timeout et sorties structurées | Oui, mais facultative |
| 7 | Fallback Groq et surveillance des quotas | Oui |
| 8 | Guide officiel, extraits sourcés puis recherche sémantique | À traiter après validation de la source |
| 9 | Refactor de l’extension vers la collecte brute exhaustive autorisée | Indépendant de l’IA |

La prochaine décision utile est donc d’approuver cette configuration : **scoring déterministe + assistant conversationnel + Gemini Free principal + Groq Free secours**, avec un quota serveur. Dès cette approbation, l’implémentation peut commencer par la migration, la fonction de classement et le chat ; aucune clé d’API n’est nécessaire avant l’étape de reformulation.

## Références

[1]: https://ai.google.dev/gemini-api/docs/pricing — *Gemini Developer API pricing*.
[2]: https://ai.google.dev/gemini-api/docs/rate-limits — *Gemini API rate limits*.
[3]: https://console.groq.com/docs/rate-limits — *Groq rate limits*.
[4]: https://openrouter.ai/docs/api_reference/limits — *OpenRouter API credit and rate limits*.
[5]: https://developers.cloudflare.com/workers-ai/platform/pricing/ — *Cloudflare Workers AI pricing*.
