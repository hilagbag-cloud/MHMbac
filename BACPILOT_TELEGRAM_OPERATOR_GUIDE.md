# Console opérateur Telegram — BacPilot

La console Telegram BacPilot est un canal d’administration réservé à **un seul chat opérateur** défini côté serveur. Elle sert à consulter l’état de la plateforme, rechercher une fiche utilisateur de façon ciblée, suivre les retours bêta et gérer les statuts bêta avec confirmation.

> **Principe de confidentialité :** la console ne retourne jamais de mot de passe, jeton, clé, cookie, capture privée, chemin de stockage privé ou contenu complet d’une conversation d’orientation. Elle n’affiche des informations personnelles que dans le chat opérateur autorisé et enregistre chaque commande côté serveur.

## Accès et sécurité

Le webhook Telegram est vérifié avec un secret serveur. La fonction vérifie en plus que le `chat_id` reçu est strictement identique à celui configuré dans `TELEGRAM_CHAT_ID`. Une commande émise depuis tout autre chat est ignorée.

Les commandes qui modifient un statut bêta ne s’exécutent pas directement. Elles créent une action temporaire avec un code de huit caractères. L’opérateur doit ensuite confirmer explicitement le code avec `/confirm CODE`. Une action non confirmée expire au bout de dix minutes et peut être annulée avec `/cancel CODE`.

## Commandes de lecture

| Commande | Exemple | Résultat |
|---|---|---|
| `/help` | `/help` | Liste les commandes autorisées. |
| `/status` | `/status` | Nombre de filières observées, dernière observation, comptes et bêta-testeurs actifs. |
| `/health` | `/health` | Même contrôle rapide que `/status`, utile pour vérifier la fraîcheur. |
| `/stats` | `/stats` | Statistiques agrégées : utilisateurs, bêta actifs, retours, recommandations et observations. |
| `/test` | `/test` | Vérifie que le webhook et le bot répondent. |
| `/user` | `/user eleve@exemple.bj` | Fiche ciblée d’un utilisateur à partir de son e-mail exact. |
| `/user` | `/user ID_BACPILOT` | Fiche ciblée d’un utilisateur à partir de son identifiant BacPilot exact. |
| `/beta_list` | `/beta_list` | Les dix bêta-testeurs les plus récemment mis à jour. |
| `/beta_list active` | `/beta_list active` | Les dix bêta-testeurs actifs les plus récemment mis à jour. |
| `/feedback` | `/feedback` | Les huit derniers retours bêta, sans capture privée. |
| `/pending` | `/pending` | Les actions d’administration encore confirmables. |

Une fiche `/user` affiche les données administratives nécessaires au suivi : nom, e-mail, ID BacPilot, date de création, série, mention, objectif, domaines, préférences, signaux académiques volontairement renseignés, statut bêta, compteurs d’activité, sessions et retours. Elle ne retourne pas les éléments explicitement exclus ci-dessus.

## Gestion des bêta-testeurs

| Étape | Commande | Effet |
|---:|---|---|
| 1 | `/beta_add eleve@exemple.bj` | Prépare l’activation du compte en bêta-testeur. |
| 1 | `/beta_pause eleve@exemple.bj` | Prépare une suspension temporaire des outils bêta. |
| 1 | `/beta_revoke eleve@exemple.bj` | Prépare la révocation des outils bêta. |
| 2 | `/confirm CODE` | Exécute l’action temporaire correspondante. |
| Option | `/cancel CODE` | Annule l’action en attente. |

Les commandes de gestion acceptent également l’identifiant BacPilot exact au lieu de l’e-mail. La confirmation répond par le statut effectivement écrit côté serveur : `active`, `paused` ou `revoked`.

> Le statut bêta n’est jamais décidé par le navigateur. Il est lu et écrit uniquement dans `public.beta_testers` par une fonction Supabase dotée de droits serveur.

## Notifications d’inscription

Quand le webhook `public.profiles INSERT` est configuré, chaque nouveau profil déclenche une alerte Telegram contenant le nom, l’e-mail, la date de création et le statut **Standard** ou **Bêta actif** déterminé côté serveur. Le journal `operator_notifications` rend l’envoi idempotent afin d’éviter les doublons lors d’une reprise de webhook.

## Exploitation responsable

Les informations sont transmises par Telegram uniquement au chat administrateur configuré. Il appartient à l’opérateur de conserver ce chat privé, de protéger son compte Telegram avec la vérification en deux étapes et de ne pas transférer les fiches utilisateurs à des personnes non autorisées.

Toute valeur d’administration reste exclusivement dans les secrets Supabase : `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET`, `BACPILOT_DB_WEBHOOK_SECRET`, `BACPILOT_TELEGRAM_CONTROL_SECRET` et `TELEGRAM_WEBHOOK_URL`. Aucune de leurs valeurs ne doit être ajoutée à ce document, au code React, aux variables `VITE_*`, à l’extension Chrome ou au dépôt GitHub.
