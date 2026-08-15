# Configuration sécurisée des clés API — Agent BacPilot

BacPilot fonctionne déjà sans fournisseur externe : le chat, la lecture de la fraîcheur des observations, le classement Top 3 et les explications factuelles sont calculés côté Supabase. Les clés IA activent seulement la **reformulation conversationnelle** demandée depuis le dashboard.

> Les clés ne doivent apparaître ni dans React, ni dans Vercel, ni dans GitHub, ni dans l’extension Chrome. Elles sont lues uniquement par l’Edge Function Supabase `orientation-assistant` avec `Deno.env.get(...)`.[1]

## Variables de production

| Secret Supabase | Valeur recommandée | Utilisation dans BacPilot |
|---|---|---|
| `GEMINI_API_KEY` | Nouvelle clé **auth** créée dans Google AI Studio, dédiée à BacPilot Production | Fournisseur principal de reformulation. |
| `GEMINI_MODEL` | `gemini-2.5-flash-lite` | Modèle stable, rapide et économique. Cette valeur est déjà le défaut du code. [2] |
| `GROQ_API_KEY` | Nouvelle clé dédiée à BacPilot Production dans GroqCloud | Secours unique si Gemini échoue. |
| `GROQ_MODEL` | `llama-3.1-8b-instant` | Modèle de secours actuel défini par défaut dans le code. |

Ne créez aucune variable vide. Si `GEMINI_API_KEY` et `GROQ_API_KEY` sont absentes, BacPilot retourne une explication déterministe sans échec ni appel externe.

## Méthode 1 — Dashboard Supabase

1. Ouvrir [Edge Functions → Secrets du projet BacPilot](https://supabase.com/dashboard/project/uxdfrnogiuefoqjpobpf/functions/secrets).
2. Vérifier que le projet est bien **mhm-solutions-mvp1**.
3. Cliquer sur **Add new secret** puis créer `GEMINI_API_KEY` et coller la nouvelle clé Gemini.
4. Créer ensuite `GROQ_API_KEY` pour activer le secours.
5. Enregistrer. Supabase rend les secrets immédiatement disponibles dans les Edge Functions : aucun redéploiement n’est requis pour cette seule opération.[1]

## Méthode 2 — CLI Supabase avec jeton personnel

Cette méthode permet un réglage direct sans navigateur, mais exige un **Personal Access Token** du propriétaire Supabase dans la variable locale `SUPABASE_ACCESS_TOKEN`. Le jeton n’est pas une clé du projet et ne doit jamais être intégré à BacPilot.

```bash
# Fichier local, jamais ajouté au dépôt
cat > .env.secrets.local <<'EOF'
GEMINI_API_KEY=nouvelle_cle_gemini
GROQ_API_KEY=nouvelle_cle_groq
EOF

# Avec un Personal Access Token stocké dans l’environnement local
SUPABASE_ACCESS_TOKEN=... supabase secrets set \
  --project-ref uxdfrnogiuefoqjpobpf \
  --env-file .env.secrets.local

rm .env.secrets.local
```

Le guide Supabase confirme que `supabase secrets set --env-file` pousse les secrets vers le projet et les rend visibles dans le dashboard.[1]

## Architecture appliquée

| Couche | Responsabilité | Autorisation |
|---|---|---|
| React | Affiche le chat et les états de calcul ; appelle une Edge Function avec le JWT de session. | Aucune clé IA. |
| Edge Function `orientation-assistant` | Vérifie le JWT, lit les données RLS du candidat, calcule le Top 3, appelle Gemini puis Groq au besoin. | Lecture des données publiées ; écriture limitée aux propres données du candidat. |
| Gemini | Reformule les trois résultats déjà calculés. | Reçoit un contexte compact et validé ; aucun outil, aucune base Supabase. |
| Groq | Secours une seule fois si Gemini ne répond pas. | Même contexte borné, aucun outil. |

La fonction reste déployée avec `verify_jwt = true`. Les opérations liées au candidat utilisent un client Supabase associé au jeton de l’utilisateur, de sorte que les politiques RLS continuent de s’appliquer.[3]

## Format d’appel vérifié

Gemini accepte un appel serveur `POST /v1beta/models/{model}:generateContent` avec la clé dans l’en-tête `x-goog-api-key`. Le code BacPilot utilise ce format et définit `store: false` pour ne pas demander de conservation de l’interaction côté fournisseur. Google recommande l’Interactions API pour les fonctions les plus récentes ; `generateContent` reste documenté et adapté au petit appel de reformulation actuellement utilisé.[2] [4]

Groq utilise `POST https://api.groq.com/openai/v1/chat/completions` avec l’en-tête `Authorization: Bearer`. BacPilot utilise une température basse, une sortie limitée et une seule tentative de secours ; il n’active ni recherche web, ni outils, ni exécution de fonctions.[5] [6]

## Limites et comportement de secours

| Situation | Comportement BacPilot |
|---|---|
| Gemini répond | La réponse est affichée en mode `ai_rephrased`. |
| Gemini échoue, est limité ou dépasse le délai | Une unique tentative Groq est effectuée si `GROQ_API_KEY` existe. |
| Groq échoue ou aucune clé n’est disponible | Explication déterministe à partir des mêmes facteurs Top 3. |
| Trois reformulations réussies déjà consommées aujourd’hui | Le quota Supabase bloque le nouvel appel ; réponse déterministe immédiate. |

Aucun résultat IA ne peut modifier le score, ajouter une filière, sélectionner un choix officiel ou promettre une admission / une bourse.

## Rotation à faire maintenant

Les clés précédemment envoyées dans une conversation doivent être considérées comme exposées. Générer des remplaçantes, les ajouter avec l’une des deux méthodes ci-dessus, tester le dashboard, puis révoquer les anciennes dans Google AI Studio et GroqCloud. Google et Groq recommandent explicitement la rotation et la révocation en cas de suspicion d’exposition.[4] [7]

## Test après activation

Après avoir ajouté les nouvelles clés, se connecter à BacPilot puis ouvrir le dashboard. Dans **« Besoin d’une explication plus précise ? »**, poser une question telle que : *« Pourquoi la première piste est-elle mieux classée ? »*. Une réponse concise doit apparaître, sans changer les trois cartes et sans dépasser le quota de trois reformulations par jour.

## Références

[1]: https://supabase.com/docs/guides/functions/secrets — *Supabase, Environment Variables and Edge Function Secrets*.
[2]: https://ai.google.dev/api/generate-content — *Google AI for Developers, Generating content*.
[3]: https://supabase.com/docs/guides/functions/auth — *Supabase, Securing Edge Functions*.
[4]: https://ai.google.dev/gemini-api/docs/api-key — *Google AI for Developers, Using Gemini API keys*.
[5]: https://console.groq.com/docs/quickstart — *GroqDocs, Quickstart*.
[6]: https://console.groq.com/docs/api-reference — *GroqDocs, API Reference*.
[7]: https://console.groq.com/docs/production-readiness/security-onboarding — *GroqDocs, Security Onboarding*.
