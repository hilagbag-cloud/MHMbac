# Configuration sécurisée des clés API — Agent BacPilot

L’agent BacPilot est déjà utilisable sans clé IA : l’onboarding conversationnel, la lecture des données réelles, la fraîcheur des observations, le calcul déterministe du Top 3 et les messages de base fonctionnent sans fournisseur externe.

Les clés API ne sont nécessaires que pour le bouton **« Besoin d’une explication plus précise ? »**. Elles doivent être stockées dans les secrets de l’Edge Function Supabase, jamais dans Vercel, le code React, un fichier `.env` commité, GitHub ou l’extension Chrome.

> **URL de configuration :** [Supabase — Edge Functions > Secrets](https://supabase.com/dashboard/project/uxdfrnogiuefoqjpobpf/functions/secrets)

## Variables à créer

| Variable Supabase | Requise ? | Valeur à renseigner | Rôle |
|---|---:|---|---|
| `GEMINI_API_KEY` | Non | Clé API créée dans Google AI Studio | Fournisseur principal pour reformuler une explication courte. |
| `GEMINI_MODEL` | Non | `gemini-2.5-flash-lite` | Modèle principal ; cette valeur est déjà définie par défaut dans le code. |
| `GROQ_API_KEY` | Non | Clé API créée dans GroqCloud | Secours unique si Gemini ne répond pas. |
| `GROQ_MODEL` | Non | `llama-3.1-8b-instant` | Modèle de secours ; valeur déjà définie par défaut. |

La saisie des clés est volontaire : une variable vide ne doit pas être créée. Si aucune clé n’est configurée, l’assistant répond en mode **déterministe**, sans échec pour le candidat et sans consommation de tokens.

## Procédure

1. Ouvrir le lien **Edge Functions > Secrets** ci-dessus et vérifier que le projet affiché est `mhm-solutions-mvp1`.
2. Cliquer sur **Add new secret**.
3. Créer `GEMINI_API_KEY` puis coller la clé provenant du compte Google AI Studio. Ne pas copier cette clé dans un message, un dépôt ou Vercel.
4. Facultativement, créer `GROQ_API_KEY` avec une clé GroqCloud afin d’activer le secours.
5. Laisser `GEMINI_MODEL` et `GROQ_MODEL` absents tant qu’un autre modèle n’est pas souhaité ; BacPilot applique ses valeurs par défaut.
6. Ne jamais ajouter `SUPABASE_SERVICE_ROLE_KEY` à l’assistant. Cette fonction n’utilise pas cette clé et doit conserver l’identité du candidat afin que les politiques RLS s’appliquent.

Les secrets sont lus par la fonction `orientation-assistant` via des variables d’environnement. Ils ne sont pas transmis au navigateur. La fonction exige un JWT Supabase valide, lit le profil et les observations avec le périmètre du candidat connecté, et limite les explications IA à **trois appels réussis par candidat et par jour**.

## Comportement de repli

| Situation | Réponse BacPilot |
|---|---|
| Aucune clé API configurée | Explication déterministe courte à partir du Top 3 et des jauges observées. |
| Gemini répond correctement | Reformulation concise et encourageante, fondée sur le JSON de score. |
| Gemini est indisponible ou limité | Une tentative avec Groq, seulement si `GROQ_API_KEY` est configurée. |
| Gemini et Groq indisponibles, ou quota candidat atteint | Retour immédiat au message déterministe ; aucune boucle ni rotation de clé. |

Les API gratuites ou freemium ont des quotas variables. Le quota interne BacPilot reste donc plus strict que celui du fournisseur et l’application ne dépend jamais d’une clé pour calculer les recommandations.

## Vérification après ajout d’une clé

Après avoir ajouté une clé, connecte-toi à BacPilot, ouvre ton dashboard et pose une question courte dans « Besoin d’une explication plus précise ? ». La réponse doit rester brève, polie et fondée sur les cartes Top 3. Si aucune clé n’est active, le même bouton doit fournir l’explication déterministe sans afficher d’erreur de configuration.

## Références

[1]: https://supabase.com/docs/guides/functions/secrets — *Supabase Edge Functions: Managing Secrets*.
[2]: https://supabase.com/docs/guides/functions/auth-legacy-jwt — *Supabase Edge Functions: Auth with JWT and RLS*.
[3]: https://ai.google.dev/gemini-api/docs/pricing — *Gemini Developer API pricing*.
[4]: https://console.groq.com/docs/rate-limits — *Groq rate limits*.
