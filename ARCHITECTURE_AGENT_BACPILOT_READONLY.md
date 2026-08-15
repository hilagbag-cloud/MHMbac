# Architecture de référence — Agent BacPilot en lecture contrôlée

**But :** faire de BacPilot un assistant d’orientation qui interroge les données réelles de Supabase, en vérifie la fraîcheur, calcule des recommandations et répond au candidat. L’agent ne doit pas devenir un compte administrateur de la base.

> **Règle d’or :** l’agent ne lit que les données d’orientation autorisées et ne peut écrire que les informations appartenant au candidat authentifié qui lui parle. Il n’écrit jamais dans les tables de collecte, de jauges, de catalogue ou d’autres profils.

## 1. Séparation obligatoire des rôles

| Acteur | Accès | Actions autorisées | Actions interdites |
|---|---|---|---|
| Extension collectrice | Session officielle active du portail + jeton de synchronisation dédié | Lire les catégories et jauges accessibles ; envoyer des lots bruts idempotents à l’Edge Function | Contourner connexion, CAPTCHA ou restrictions ; envoyer des données personnelles de tiers ; calculer selon le profil du collecteur |
| Edge Function `mhmbac-sync` | `service_role` isolé | Valider les lots ; écrire catalogue, observations, historiques et alertes | Exposer la clé serveur ou accepter des requêtes sans jeton |
| Candidat connecté | `authenticated` | Lire les observations publiques ; lire/écrire son profil, ses préférences, ses sessions et ses signaux volontaires | Lire ou modifier le profil d’un autre candidat ; écrire dans les données de collecte |
| Agent BacPilot | Utilise l’identité du candidat et des fonctions serveur bornées | Lire données publiques, fraîcheur et résultats calculés ; demander l’écriture du seul profil courant via une fonction dédiée | Requête SQL libre, `service_role`, accès aux tables privées, écriture dans les jauges ou recommandations d’autres utilisateurs |

## 2. Architecture de requête

```text
Navigateur du candidat
  └─ UI conversationnelle / typewriter
      └─ endpoint serveur `orientation-assistant`
          ├─ validation identité utilisateur (JWT Supabase)
          ├─ outils de lecture strictement définis
          │   ├─ getDataFreshness()
          │   ├─ getProfileForCurrentUser()
          │   ├─ getCurrentProgrammeObservations(filters)
          │   ├─ getTopRecommendations(profile, objective)
          │   └─ searchOfficialGuide(query) [plus tard]
          ├─ outils d’écriture strictement définis
          │   ├─ updateOwnProfile(patch)
          │   ├─ updateOwnPreferences(patch)
          │   └─ appendOwnConversationMessage(message)
          ├─ moteur déterministe de classement
          ├─ budget, quotas et journal de sécurité
          └─ API IA optionnelle pour reformuler une réponse fondée sur le résultat
```

Le navigateur n’appelle jamais l’API IA directement. La clé du fournisseur est stockée côté serveur. L’agent reçoit un **contexte minimal** : profil volontairement fourni, données agrégées ou top résultats calculés, horodatage de collecte et extraits du guide. Il ne reçoit ni clé Supabase, ni données d’autres comptes, ni la totalité de la base.

## 3. Outils à exposer à l’agent

L’agent ne reçoit pas une capacité générale de requête SQL. Il reçoit des fonctions limitées et validées.

| Outil | Entrée validée | Sortie | Écriture |
|---|---|---|---|
| `get_data_freshness` | aucune | dernière observation, nombre de filières, statut Realtime | Non |
| `get_top_recommendations` | objectif, domaine facultatif, série, mention | Top 3, facteurs, fraîcheur, confiance | Non |
| `get_programme_details` | `programme_id` présent dans le résultat | jauges observées et historique autorisé | Non |
| `search_guide` | requête limitée et source validée | extraits, pages, références | Non |
| `save_profile_answer` | champ autorisé et valeur validée | profil courant mis à jour | Oui, seulement `auth.uid()` |
| `save_preference_answer` | objectif, mots-clés ou matières autorisés | préférences courantes mises à jour | Oui, seulement `auth.uid()` |
| `save_conversation_state` | étape, message utilisateur, réponse agent | session associée au candidat | Oui, seulement `auth.uid()` |

La fonction de recommandation retourne un JSON strict : trois résultats, score, facteurs, fraîcheur, confiance, limites et identifiants sources. L’IA ne doit que transformer ce JSON en français compréhensible et poser la prochaine question utile.

## 4. Autorisations Supabase

La lecture publique de `live_programmes` et des alertes peut rester limitée aux colonnes nécessaires. Les historiques plus détaillés ne doivent être accessibles que par une RPC/Edge Function qui limite les résultats par filière et par période.

| Table | Lecteur candidat | Écriture candidat | Accès agent |
|---|---:|---:|---|
| `live_programmes` | Oui, lecture limitée | Non | Lecture via fonction bornée |
| `gauge_observations` | Non directement ou lecture agrégée | Non | Lecture filtrée via fonction bornée |
| `gauge_alerts` | Oui, lecture limitée | Non | Lecture via fonction bornée |
| `profiles` | Seulement sa ligne | Seulement sa ligne | Lecture/écriture de l’utilisateur courant |
| `user_preferences` | Seulement sa ligne | Seulement sa ligne | Lecture/écriture de l’utilisateur courant |
| `orientation_sessions` | Seulement ses lignes | Seulement ses lignes | Lecture/écriture de l’utilisateur courant |
| `collection_runs` | Résumé public éventuel | Non | Lecture d’un résumé de fraîcheur |
| `guide_chunks` | Lecture d’extraits validés | Non | Lecture via recherche bornée |

L’agent ne doit pas posséder la clé `service_role`. Une Edge Function peut vérifier le JWT de l’utilisateur puis créer un client Supabase avec le jeton utilisateur, ou interroger des RPC `SECURITY DEFINER` dont les paramètres sont strictement validés.

## 5. Stratégie API IA sans dépendance coûteuse

Aucun fournisseur n’offre une garantie de gratuité illimitée à l’échelle d’un produit public. L’architecture doit donc rester fonctionnelle sans IA, puis activer la reformulation IA selon un quota contrôlé.

| Fournisseur | Offre observable | Intérêt pour BacPilot | Limite à gérer |
|---|---|---|---|
| **Google Gemini API / AI Studio** | Plusieurs modèles Flash/Lite sont affichés gratuits au palier Free ; les limites dépendent du projet, du modèle et du palier. Le contenu du palier gratuit peut être utilisé pour améliorer les produits Google.[1] [2] | Bon candidat principal pour une réponse en français et un futur travail sur guide/document. | Ne pas envoyer de données sensibles ; appliquer un quota BacPilot plus bas que le quota fournisseur. |
| **GroqCloud** | Plan gratuit avec limites par modèle et par organisation ; par exemple, les modèles listés affichent souvent 30 RPM et de 1 000 à 14 400 RPD selon le modèle.[3] | Très rapide pour une conversation courte, bon fournisseur de secours. | Les limites changent selon l’organisation et ne doivent pas être traitées comme un SLA. |
| **OpenRouter, modèles `:free`** | 20 RPM et 50 RPD sans achat ; 1 000 RPD après 10 USD de crédits achetés, selon la documentation.[4] | Utile comme fallback de développement ou de test multi-modèle. | Faible quota gratuit ; ne pas compter dessus comme fournisseur principal. |
| **Cloudflare Workers AI** | Allocation gratuite de 10 000 Neurons/jour, puis facturation à l’usage ; certains modèles nécessitent un plan payant.[5] | Option intéressante si BacPilot migre un jour son endpoint agent chez Cloudflare et souhaite également des embeddings. | Nécessite un compte Cloudflare et une intégration distincte ; la consommation dépend des modèles. |

### Recommandation de lancement

Le lancement doit utiliser un **moteur déterministe sans API IA** pour toutes les étapes de collecte, les scores, le top 3, les messages de progression et les états de réflexion visibles. Ensuite, l’API Gemini gratuite peut être utilisée comme une couche de reformulation facultative, en excluant les informations inutiles ou sensibles du prompt.

La politique recommandée est la suivante :

1. **Zéro appel IA** pendant la collecte de profil et le calcul.
2. **Un appel maximum par recommandation finale**, seulement si le candidat clique sur « Demander une explication personnalisée ».
3. **Quota BacPilot** initial : 3 explications IA par utilisateur et par jour, avec compteur Supabase.
4. **Limite globale** : plafond quotidien configuré côté serveur ; au-delà, retour au mode explicatif déterministe.
5. **Fallback** : si Gemini échoue ou atteint son quota, tenter Groq une fois ; sinon afficher une explication structurée sans IA.
6. **Aucune rotation de comptes ou de clés** pour contourner les limites d’un fournisseur. Les clés restent côté serveur et les quotas sont respectés.

## 6. Message de réponse de l’agent

L’agent peut répondre ainsi, à partir du JSON calculé :

> « J’ai consulté les dernières observations disponibles, datant d’il y a 12 minutes. Pour ton profil Série D, mention Passable et objectif Bourse, voici trois pistes à vérifier. La première ressort parce que son ratio de bourses observé est plus favorable et que la pression liée à ta mention est plus faible que dans les autres options. Ce résultat reste indicatif : la validation finale se fait sur le portail officiel. »

Cette réponse est acceptable seulement si chaque affirmation correspond à une valeur réellement retournée par les outils de lecture.

## 7. Embeddings et guide officiel

Les embeddings ne sont pas nécessaires au lancement. Quand le guide officiel aura été acquis de manière autorisée, il faut d’abord stocker les extraits avec source, page, date, thèmes et filières concernées. Une recherche textuelle et par mots-clés suffit pour le premier niveau.

Si une recherche sémantique devient nécessaire, les embeddings sont calculés uniquement sur le guide public validé, jamais sur les données brutes d’autres candidats. Les résultats doivent présenter la page ou section source à l’utilisateur.

## 8. Plan d’implémentation sûr

1. Créer la page conversationnelle et les messages typewriter locaux.
2. Ajouter `orientation_sessions` avec RLS `auth.uid()`.
3. Créer une fonction `get_top_recommendations` à entrées validées, sans SQL libre.
4. Créer une Edge Function `orientation-assistant` qui vérifie le JWT, appelle les outils lecture/écriture autorisés et applique les quotas.
5. Ajouter la sortie déterministe du top 3 au dashboard conversationnel.
6. Ajouter le fournisseur Gemini côté serveur, avec timeout, budget, logs de quota et fallback Groq.
7. Adapter l’extension pour n’envoyer que des observations brutes, couverture de scan et métadonnées, sans mention/objectif du collecteur.
8. Ajouter le guide officiel et les citations avant toute fonction d’embeddings.

## Références

[1]: https://ai.google.dev/gemini-api/docs/pricing — *Gemini Developer API pricing*.
[2]: https://ai.google.dev/gemini-api/docs/rate-limits — *Gemini API rate limits*.
[3]: https://console.groq.com/docs/rate-limits — *Groq rate limits*.
[4]: https://openrouter.ai/docs/api_reference/limits — *OpenRouter API credit and rate limits*.
[5]: https://developers.cloudflare.com/workers-ai/platform/pricing/ — *Cloudflare Workers AI pricing*.
