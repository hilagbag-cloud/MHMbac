# Fournisseurs IA gratuits ou freemium pour BacPilot

## Décision

BacPilot doit utiliser une chaîne de secours contrôlée, et non une rotation agressive de clés. Chaque fournisseur est appelé au maximum une fois par requête utilisateur. La bascule ne s’effectue qu’en cas d’absence de clé, d’erreur réseau, de quota (`429`) ou d’erreur fournisseur. Le classement d’orientation reste calculé par Supabase ; les modèles IA reformulent uniquement les faits validés.

## Fournisseurs retenus

| Priorité | Fournisseur | Statut | Utilisation prévue |
|---|---|---|---|
| 1 | Google Gemini API | Gratuit sous limites de projet ; les limites exactes dépendent du modèle et du projet | Reformulation principale et lecture du contexte guide |
| 2 | Groq | Plan Free documenté ; limites par organisation et par modèle | Repli rapide, court et peu coûteux en tokens |
| 3 | OpenRouter | Routeur avec modèles `:free`, disponibilité variable selon le catalogue | Repli optionnel, uniquement avec modèle explicitement configuré |
| 4 | Cerebras | Free Trial limité dans le temps et conditionné à un moyen de paiement vérifié ; pas un quota permanent gratuit | Repli optionnel seulement si le propriétaire accepte cette condition |

## Fournisseurs non retenus comme gratuits permanents

Together AI indique qu’il n’offre actuellement pas d’essai gratuit et exige un achat minimum de 5 dollars. Fireworks AI propose 1 dollar de crédit de démarrage, mais fonctionne ensuite au paiement par token. Ces services peuvent être ajoutés plus tard comme freemium payant avec un plafond strict, mais ils ne doivent pas être présentés comme des APIs gratuites permanentes.

## Limites et confidentialité

Google indique que les limites Gemini sont appliquées au niveau du projet et sont mesurées notamment en RPM, TPM et RPD. L’offre gratuite peut utiliser les données pour améliorer les produits selon les conditions du fournisseur. Les prompts BacPilot doivent donc être minimisés et ne jamais contenir d’informations personnelles inutiles.

Groq publie des limites Free par modèle et organisation. Le code doit respecter `retry-after` et les en-têtes `x-ratelimit-*`, sans boucler lorsqu’une limite est atteinte.

OpenRouter et les modèles gratuits peuvent changer de disponibilité ou de qualité. Le fournisseur ne doit donc jamais recevoir le classement brut comme source d’autorité ; il ne peut expliquer que les faits SQL validés.

Cerebras n’est pas un quota gratuit permanent : sa documentation précise que le Free Trial est limité et nécessite une méthode de paiement vérifiée. Il est donc désactivé par défaut.

## Références

1. [Google Gemini — Rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
2. [Google Gemini — Pricing](https://ai.google.dev/gemini-api/docs/pricing)
3. [Groq — Rate limits](https://console.groq.com/docs/rate-limits)
4. [OpenRouter — Free models](https://openrouter.ai/openrouter/free)
5. [Cerebras — Rate limits](https://inference-docs.cerebras.ai/support/rate-limits)
6. [Cerebras — Pricing](https://www.cerebras.ai/pricing)
7. [Together AI — Credits](https://docs.together.ai/docs/billing-credits)
8. [Fireworks AI — Pricing](https://fireworks.ai/pricing)
