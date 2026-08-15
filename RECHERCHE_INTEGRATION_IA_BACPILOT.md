# Vérification documentaire — Intégration IA BacPilot

**Date :** 15 août 2026

## Décision d’intégration

BacPilot doit conserver Supabase comme **moteur de décision** : l’Edge Function calcule d’abord les trois recommandations à partir des observations réelles, puis transmet au modèle uniquement un contexte compact, déjà autorisé et borné. L’IA ne reçoit aucun accès SQL, aucune clé Supabase d’administration, aucune possibilité de modifier les observations, et aucune instruction permettant de sélectionner ou valider une filière à la place du candidat.

Le modèle Gemini est retenu comme fournisseur principal et Groq comme secours. Les deux appels restent côté Edge Function ; ni la clé Gemini ni la clé Groq ne doivent apparaître dans le bundle React, Vercel public, l’extension Chrome ou le dépôt Git.

| Sujet | Gemini | Groq | Décision BacPilot |
|---|---|---|---|
| Secret | Variable `GEMINI_API_KEY` recommandée ; ne jamais exposer une clé côté client. | Variable `GROQ_API_KEY` recommandée ; ne jamais exposer la clé côté client. | Secrets dans Supabase Edge Functions uniquement. |
| Endpoint | `POST /v1beta/models/{model}:generateContent` reste pris en charge ; Google recommande maintenant aussi l’Interactions API. | `POST https://api.groq.com/openai/v1/chat/completions` avec `Authorization: Bearer`. | Le contrat Gemini actuel reste compatible ; prévoir une migration progressive vers Interactions API. |
| Réponse | Texte de la première réponse candidate avec métadonnées d’usage. | `choices[0].message.content`. | Valider, tronquer et ne jamais afficher de raisonnement interne. |
| Sécurité | Nouvelles clés auth recommandées ; clés standard non restreintes refusées et migration attendue avant septembre 2026. | Clés par environnement, rotation et révocation en cas de compromission. | Créer de nouvelles clés dédiées production, restreindre Gemini à l’API Gemini et révoquer les clés partagées dans la conversation. |
| Erreurs / quotas | Les limites dépendent du projet et du modèle. | Documentation recommande limite applicative et backoff pour `429`/`5xx`. | Maximum BacPilot : trois reformulations réussies par candidat et par jour, un essai Gemini puis un essai Groq, sans boucle. |

## Ajustements techniques recommandés

La fonction doit rester protégée par un JWT Supabase et utiliser un client en contexte utilisateur pour que les politiques RLS s’appliquent aux lectures et écritures personnelles. Supabase recommande `verify_jwt = true` pour les appels provenant d’un utilisateur authentifié [3].

Le prompt transmis à l’IA doit contenir seulement : la question de l’utilisateur, le profil volontaire minimal, l’horodatage/la fraîcheur, les trois résultats calculés et leurs facteurs. Les données de l’ensemble des candidats, les journaux de collecte, la clé API, les instructions internes et les sorties de raisonnement ne doivent jamais y figurer. Une température basse et une limite de sortie courte sont adaptées à une reformulation factuelle.

Le modèle ne doit disposer d’**aucun outil** de lecture ou d’écriture. Les états « analyse en cours » visibles dans l’interface doivent correspondre aux étapes serveur réelles : vérification de fraîcheur, lecture bornée, calcul déterministe et reformulation éventuelle.

## Procédure d’activation sûre

1. Générer deux nouvelles clés dédiées à BacPilot Production : une Gemini et une Groq. Révoquer les clés précédemment partagées dans une conversation.
2. Dans Supabase **Edge Functions → Secrets**, créer `GEMINI_API_KEY` et `GROQ_API_KEY`. Les valeurs de modèles peuvent rester définies dans le code ou être ajoutées comme `GEMINI_MODEL` et `GROQ_MODEL`.
3. Ne jamais utiliser `SUPABASE_SERVICE_ROLE_KEY` dans l’assistant. La fonction doit continuer à vérifier le JWT et à travailler avec les politiques RLS du candidat.
4. Tester une explication avec un compte candidat ; vérifier que le résultat passe en mode `ai_rephrased`, que le quota diminue d’une unité et que la liste Top 3 reste identique au résultat déterministe.
5. En cas de `429`, `5xx`, timeout ou absence de clé : présenter l’explication déterministe existante, sans refaire d’essais en boucle.

## Références

[1]: https://ai.google.dev/gemini-api/docs/api-key — *Google AI for Developers, Using Gemini API keys*.
[2]: https://ai.google.dev/api/generate-content — *Google AI for Developers, Generating content*.
[3]: https://supabase.com/docs/guides/functions/secrets — *Supabase, Environment Variables and Edge Function Secrets*.
[4]: https://supabase.com/docs/guides/functions/auth — *Supabase, Securing Edge Functions*.
[5]: https://console.groq.com/docs/quickstart — *GroqDocs, Quickstart*.
[6]: https://console.groq.com/docs/api-reference — *GroqDocs, API Reference*.
[7]: https://console.groq.com/docs/production-readiness/security-onboarding — *GroqDocs, Security Onboarding*.
