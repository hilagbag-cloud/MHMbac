# Recherche — enrôlement d’un collecteur BacPilot par appareil

Date : 16 août 2026.

## Constat documenté

Chrome indique que `chrome.storage.local` persiste les données propres à l’extension et est accessible aux différents contextes de l’extension. Chrome précise aussi que la zone locale est supprimée lors de la désinstallation et qu’elle ne doit pas être considérée comme un coffre-fort pour une donnée secrète de très haute valeur. La nouvelle stratégie ne doit donc pas distribuer un secret Supabase privilégié dans l’archive ; elle doit stocker uniquement un identifiant ou un jeton de collecteur limité, révocable côté serveur.

Supabase documente que les clés secrètes donnent des privilèges élevés et ne doivent jamais être incluses dans un navigateur, un package ou une application distribuée. Une extension Chrome étant un composant public et inspectable, le secret global `MHM_SYNC_TOKEN` ne doit pas rester le mécanisme de production à long terme.

Supabase documente deux familles utiles ici : les appels d’un utilisateur avec JWT, et les appels service-to-service avec clé secrète dans `apikey`. L’extension ne doit pas recevoir une clé Supabase secrète ; elle doit appeler une Edge Function publique au niveau plateforme (`verify_jwt=false`) qui vérifie elle-même un credential de collecteur borné, hashé côté serveur, avec statut actif, expiration et révocation.

## Modèle retenu

Un opérateur crée depuis Telegram un **code d’activation à usage unique**, court mais à entropie suffisante, avec expiration courte. L’extension transmet ce code une seule fois à une action `enroll`. Le serveur ne conserve jamais le code en clair : il conserve son empreinte SHA-256 et son statut consommé/non consommé. Après validation, le serveur génère un `collector_id` public et un `collector_token` aléatoire. Il ne conserve que l’empreinte du token, son dernier usage et son statut actif. L’extension conserve le token de collecteur dans `chrome.storage.local` pour permettre la reprise ; ce token n’est pas une clé Supabase et n’a accès qu’à l’ingestion bornée.

Chaque requête de prévol ou de synchronisation contient `collectorId` et `collectorToken` dans le JSON. Le serveur recherche l’empreinte, vérifie que le collecteur est actif, applique une limite de taille et retourne des erreurs distinctes : `ENROLLMENT_REQUIRED`, `ACTIVATION_EXPIRED`, `COLLECTOR_REVOKED`, `COLLECTOR_TOKEN_INVALID` ou `COLLECTOR_SCOPE_INVALID`. Les journaux conservent seulement `collector_id`, le statut, l’horodatage et l’empreinte de lot ; jamais le token ou le code.

La révocation d’un appareil désactive uniquement son `collector_id`. Une rotation crée un nouveau token pour le même appareil et invalide l’ancien. Le secret global actuel reste actif temporairement comme filet de migration, mais la console v1.2 doit privilégier l’enrôlement et afficher une alerte si elle utilise encore le mode legacy.

## Sources

1. Chrome Developers, `chrome.storage` : https://developer.chrome.com/docs/extensions/reference/api/storage
2. Supabase, sécurisation des Edge Functions : https://supabase.com/docs/guides/functions/auth
3. Supabase, secrets des Edge Functions : https://supabase.com/docs/guides/functions/secrets
4. Supabase, types de clés et interdiction des clés secrètes dans les packages publics : https://supabase.com/docs/guides/getting-started/api-keys
