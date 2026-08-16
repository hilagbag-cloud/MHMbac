# Audit de fiabilité — extension BacPilot officielle

Date : 16 août 2026. Périmètre : extension Chrome Manifest V3 qui lit uniquement une session déjà authentifiée et active sur `apresmonbac.bj`, puis synchronise des observations vers l’Edge Function `mhmbac-sync`.

## Constat principal

Le paquet chargé identifié dans `/home/ubuntu/upload/bacpilot_extension_officielle_chrome_ready(1).zip` est en version `1.0.0` et n’est pas aligné avec la source actuelle `extensions/bacpilot-official` du dépôt BacPilot.

| Élément | Paquet chargé v1.0.0 | Source actuelle du dépôt | Conséquence |
|---|---|---|---|
| Jeton de synchronisation | En-tête `x-mhm-sync-token` | Corps JSON `syncToken` | Le paquet ancien peut produire l’erreur de caractères non ISO-8859-1 ; il doit être remplacé. |
| Test avant collecte | Absent | Pré-vol obligatoire | La source actuelle réduit les scans voués à échouer. |
| État du test | Non persisté | Persisté dans `chrome.storage.local` | La console peut bloquer une collecte non validée. |
| Réinjection content script | Oui | Oui | Protège le cas « Receiving end does not exist ». |
| Reprise de lots | File locale et alarmes | File locale, alarmes et contrôle de configuration | La reprise est meilleure mais demeure à renforcer. |

## Garde-fous déjà confirmés dans la source actuelle

- Manifest V3, `chrome.storage.local` réservé aux contextes de confiance et alarme recréée au démarrage.
- Aucun contournement de connexion, CAPTCHA ou expiration de session. Une session valide est requise sur le portail source.
- Jeton transmis uniquement dans le corps JSON, jamais dans un en-tête HTTP.
- Validation préalable de l’Edge Function avant le lancement d’une collecte.
- Envoi par lots de 40 observations, retries courts, timeout réseau, diagnostics locaux et conservation des lots non confirmés.

## Faiblesses à traiter dans la version suivante

1. Les lots ne sont mis en file qu’à la fin d’une collecte complète : une fermeture pendant un parcours long laisse les observations déjà lues seulement dans l’état local, sans synchronisation progressive.
2. Le serveur n’enregistre pas de reçu durable par `batchId`, alors que ce champ est présenté comme une garantie d’idempotence. Les upserts réduisent le risque, mais un journal de reçus est nécessaire pour une reprise observable et définitive.
3. La collecte est manuelle ; il n’existe pas de cadence contrôlée de réactualisation lorsque l’onglet officiel et la session sont disponibles.
4. La cadence de lecture est fixe ; elle doit devenir adaptative selon les réponses réseau et les erreurs temporaires (429/5xx), sans multiplier les requêtes.
5. Les diagnostics ne distinguent pas encore complètement la fraîcheur de la source, la fraîcheur serveur, les échecs de session et les lots qui n’ont jamais obtenu d’accusé.
6. Un paquet installé doit toujours être construit depuis la source validée ; le ZIP v1.0.0 ne doit plus être utilisé.

## Limites assumées

La collecte ne peut pas être continue lorsque Chrome est fermé, l’ordinateur éteint ou la session officielle absente. Les alarmes ne réveillent pas un appareil endormi ; elles permettent seulement de reprendre après son réveil. Les données ne sont lues que dans le cadre d’une session que l’utilisateur a ouverte et autorisée.

## Implémentation v1.1.0 — 16 août 2026

La source `extensions/bacpilot-official/` intègre désormais la cible de fiabilité : chaque checkpoint de collecte est d’abord conservé dans `chrome.storage.local`, puis ajouté à la file locale pour une synchronisation progressive. Un lot confirmé est retiré de la file et met à jour les horodatages `lastServerConfirmedAt`, l’identifiant de collecte et le dernier `batchId` confirmé. La fermeture de la console ou l’endormissement du service worker ne supprime donc pas les lots non acquittés.

Côté serveur, la migration `20260816_bacpilot_sync_receipts.sql` est appliquée. La table privée `sync_batch_receipts` mémorise l’empreinte de chaque `batchId` accepté ; une réémission identique reçoit le même résultat avec l’indicateur `replayed`, tandis qu’un `batchId` réutilisé avec un contenu différent est refusé en HTTP 409. Les alertes de variation comportent aussi une empreinte `event_hash` unique afin d’éviter un doublon si une réponse réseau est perdue après l’écriture.

La collecte adapte maintenant son délai de lecture entre 700 ms et 8 s : les succès diminuent prudemment l’attente, tandis qu’une erreur réseau, HTTP 429 ou 5xx l’augmente. Les erreurs 401/403 interrompent immédiatement le scan avec le statut « session source à reconnecter » ; elles ne déclenchent ni contournement de connexion ni tentative de maintien artificiel de session.

L’actualisation périodique est **désactivée par défaut**. Si l’opérateur l’active dans la console (minimum 10 minutes), elle ne recherche que l’onglet officiel déjà ouvert et démarre une collecte seulement si le prévol serveur est toujours validé et qu’aucune collecte inachevée n’exige une décision manuelle. Elle ne crée jamais d’onglet, ne se connecte pas et ne résout pas un CAPTCHA.

La console affiche désormais le dernier point local, la dernière confirmation serveur, le dernier lot confirmé, l’état de session et l’état de la cadence volontaire. Les diagnostics conservent 60 événements au lieu de 40.

## Recette restante avant exploitation continue

Les contrôles statiques des trois scripts extension et de l’Edge Function ont réussi ; la fonction `mhmbac-sync` est active en version 20 et une requête sans jeton est refusée en HTTP 401. Il reste une recette **avec le compte officiel réel autorisé** après installation du package v1.1.0 : prévol du jeton, lecture d’un lot réel, réception d’un accusé, fermeture/réouverture de Chrome pendant un scan, puis reprise et vérification de la fraîcheur affichée. Aucun profil ou relevé fictif ne doit être créé pour ce test.

Le paquet `bacpilot_extension_officielle_v1.1.0.zip` doit être généré depuis cette source, accompagné d’un checksum, après le dernier contrôle de build.
