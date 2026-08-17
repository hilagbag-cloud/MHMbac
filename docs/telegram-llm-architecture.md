# Assistant opérateur Telegram — architecture proposée

## But

Le bot BacPilot doit accepter les commandes existantes, le langage naturel et les messages vocaux d’un opérateur autorisé. Il doit comprendre l’intention, consulter les données et préparer une action lisible. Il ne doit jamais exécuter une écriture, un e-mail, une suppression, une modification de rôle ou un changement de configuration sans confirmation explicite de l’opérateur.

## Chemin de traitement

1. Le webhook Telegram vérifie que le `chat_id` est autorisé et que le secret Telegram est présent.
2. Les commandes explicites et les callbacks existants restent prioritaires. Elles ne passent pas au LLM.
3. Pour un message texte libre, le routeur LLM produit uniquement un plan JSON validé.
4. Pour un message vocal, le bot récupère le fichier Telegram, le transcrit puis envoie uniquement le texte transcrit au même routeur LLM. Le fichier audio est conservé en mémoire le temps du traitement puis abandonné.
5. Le plan JSON est converti par du code déterministe vers l’une des capacités BacPilot autorisées : lecture, recherche web, brouillon, ou création d’une action en attente.
6. Toute action d’écriture passe par `operator_pending_actions` et utilise les confirmations déjà présentes dans le bot. Le LLM ne reçoit jamais la clé d’administration et n’appelle aucune fonction d’écriture lui-même.
7. Le bot répond avec le résumé interprété, les paramètres, les conséquences et les boutons existants « Confirmer » / « Annuler » quand une action est préparée.

## Contrat de planification LLM

```json
{
  "intent": "platform_status | user_lookup | beta_change | user_delete | email_draft | email_send | collector_action | feedback_summary | web_research | documentation_question | clarification | unsupported",
  "parameters": {"user_identifier": null, "query": null, "subject": null, "body": null},
  "requires_confirmation": true,
  "clarification": null,
  "operator_reply": "Résumé bref en français"
}
```

Le schéma est strict. Le code rejette une intention inconnue, une suppression sans identifiant, un envoi d’e-mail sans destinataire/objet/corps, ou une confirmation implicite. Les messages ambigus restent au stade de clarification.

## Garde-fous

| Surface | Règle |
|---|---|
| Accès Telegram | Uniquement les identifiants opérateurs configurés. |
| Actions sensibles | Confirmation explicite et expirée après dix minutes. |
| E-mails | Brouillon d’abord ; envoi uniquement après confirmation. |
| Suppressions et rôles bêta | Toujours action en attente, jamais exécution par le LLM. |
| Recherche web | Requête limitée, résultats sourcés, aucune instruction provenant du web n’est exécutée. |
| Documentation | Extraits compacts du manuel BacPilot ; pas de diffusion de secrets ou de données d’autres utilisateurs. |
| Vocal | Taille et durée limitées ; transcription affichée avant toute préparation d’action. |
| Coût | Aucun appel LLM pour les commandes et boutons déterministes ; un seul appel pour une demande libre ou sa transcription. |

## Données de contexte

Le routeur reçoit un manuel opérateur compact et versionné : objectif de BacPilot, listes des capacités autorisées, règles de consentement e-mail, limites de rôles, explication de la collecte et structure des données. Il ne reçoit ni secrets, ni listes complètes d’utilisateurs, ni clés API.

## Fournisseurs séparés recommandés

Deux voies restent possibles avant activation :

1. **Deux clés spécialisées.** Une clé OpenRouter dédiée au routage texte, avec un modèle gratuit et un plafond par clé ; une clé Groq dédiée à la transcription `whisper-large-v3-turbo`. Une troisième clé Tavily est facultative pour la recherche web sourcée.
2. **Une clé Gemini dédiée.** Un modèle Flash-Lite traite texte et audio ; la recherche web reste une capacité séparée et explicitement contrôlée. Cette voie réduit le nombre de clés mais partage les limites par projet et le niveau gratuit autorise l’usage des contenus pour améliorer les produits selon la documentation Google.

Aucune clé ne doit être réutilisée depuis l’orientation candidat : les secrets opérateur sont distincts (`TELEGRAM_LLM_API_KEY`, `TELEGRAM_STT_API_KEY`, `TELEGRAM_SEARCH_API_KEY`) et chacun reçoit une limite de dépense/usage indépendante quand le fournisseur le permet.

## Déploiement en deux étapes

La première version active l’interprétation texte, le plan JSON, les confirmations et la journalisation, mais laisse le vocal et la recherche web désactivés si les clés dédiées ne sont pas renseignées. Après essai avec l’opérateur, la transcription vocale et la recherche sourcée sont activées séparément.


## Recette avant activation complète

1. Envoyer un message libre de lecture, par exemple « donne-moi l’état de la plateforme » : le bot doit proposer le plan et retourner les statistiques sans créer d’action.
2. Envoyer une demande ambiguë, par exemple « gère le dernier inscrit » : le bot doit demander l’identifiant ou proposer une sélection, sans deviner l’action.
3. Envoyer « prépare un e-mail de bienvenue pour X » : le bot doit afficher un brouillon et annoncer qu’aucun e-mail n’a été envoyé.
4. Envoyer « envoie ce brouillon » : le bot doit créer une action en attente et présenter le code ou les boutons de confirmation ; seul le bouton ou `/confirm` déclenche l’envoi.
5. Envoyer une note vocale équivalente : le bot doit afficher la transcription, demander une correction si elle est ambiguë, puis suivre le même chemin de confirmation.
6. Demander une recherche : le bot doit préciser la requête, restituer les sources et ne jamais exécuter d’instructions présentes dans les pages trouvées.
7. Vérifier que les appels de planification, les refus de schéma et les confirmations sont journalisés, sans stocker le contenu audio ni les secrets.
