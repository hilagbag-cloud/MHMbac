# BacPilot — Collecte officielle Chrome

> **Collecter. Synchroniser. Vérifier.**
>
> Cette extension appartient à **BacPilot — par MHM SOLUTIONS**, créé par **Hilarus GBAGOULE**. Elle lit uniquement les observations accessibles dans une session officielle que son utilisateur a lui-même ouverte sur `apresmonbac.bj`.

## Ce que fait cette version officielle

| Fonction | Comportement |
|---|---|
| Console Windows | Un clic sur l’icône ouvre une fenêtre Chrome BacPilot indépendante. Windows permet de la déplacer, de la réduire, de la redimensionner ou de la fermer. |
| Reprise locale | Chaque étape de collecte est enregistrée dans `chrome.storage.local`. Une fermeture accidentelle de la console, de l’onglet ou le redémarrage du service worker ne supprime pas les observations déjà sauvegardées. |
| Reprise volontaire | Après avoir rouvert la page officielle et rétabli sa session soi-même, l’utilisateur clique sur **Reprendre la collecte**. La lecture continue après le dernier point sauvegardé. |
| Données collectées | Université, école, filière et jauges accessibles, avec horodatage d’observation. Les données sont envoyées telles qu’elles sont observées. |
| Synchronisation progressive | Chaque observation sauvegardée rejoint une file locale, est découpée en lots, puis reçoit un accusé serveur idempotent. Une réponse perdue peut être rejouée sans double écriture. |
| Cadence volontaire | Désactivée par défaut. L’opérateur peut l’activer à partir de 10 minutes ; elle n’agit que si l’onglet officiel est déjà ouvert et la session toujours autorisée. |
| Diagnostic de fraîcheur | La console affiche le dernier point local, la dernière confirmation serveur, le dernier lot confirmé, l’état de session, les lots conservés et la prochaine tentative. |

## Ce que l’extension ne fait jamais

1. Elle ne contourne pas une connexion, un CAPTCHA, un contrôle anti-robot ni l’expiration de session du portail officiel.
2. Elle ne maintient pas artificiellement une session officielle et ne lance pas de collecte lorsque le portail ou Chrome est fermé.
3. Elle ne demande ni série, ni mention, ni objectif, ni mot-clé métier. Elle ne calcule aucun score et ne personnalise pas les observations.
4. Elle ne place ni ne soumet de choix sur le portail officiel.
5. Elle ne contient pas de clé Supabase d’administration, de clé IA, de mot de passe ou de jeton de synchronisation intégré au package.

> BacPilot propose des pistes dans son site web. Le candidat vérifie et valide lui-même toute décision sur le portail officiel.

## Installation dans Chrome sous Windows

1. Téléchargez et décompressez le package officiel dans un dossier qui ne sera pas déplacé.
2. Ouvrez `chrome://extensions` dans Chrome.
3. Activez le **Mode développeur**.
4. Cliquez sur **Charger l’extension non empaquetée**.
5. Sélectionnez le dossier qui contient `manifest.json`.
6. Épinglez l’icône BacPilot dans la barre Chrome.
7. Ouvrez vous-même `https://apresmonbac.bj/Home/choice`, connectez-vous et terminez toute vérification demandée par le portail.
8. Cliquez sur l’icône BacPilot : la **Console officielle** s’ouvre dans une fenêtre Windows indépendante.

## Utilisation normale

| Étape | Action utilisateur |
|---:|---|
| 1 | Ouvrir et authentifier sa session sur le portail officiel. |
| 2 | Ouvrir la console BacPilot via l’icône de l’extension. |
| 3 | Ouvrir **Administration locale**, saisir le jeton, puis cliquer sur **Enregistrer et tester**. |
| 4 | Attendre le badge **Test validé** ; **Nouvelle collecte** et **Reprendre la collecte** restent bloqués tant que le serveur n’a pas confirmé le jeton. |
| 5 | Cliquer sur **Nouvelle collecte**. |
| 6 | Laisser l’onglet officiel ouvert pendant la lecture. La console peut être réduite, déplacée ou fermée : l’état est conservé. |
| 7 | En cas d’interruption, rouvrir le portail officiel, se reconnecter si besoin, puis cliquer sur **Reprendre la collecte**. |
| 8 | Vérifier le panneau **Lots conservés localement** jusqu’à confirmation de synchronisation, puis contrôler l’horodatage **Confirmation serveur** dans le dernier relevé local. |
| 9 | Facultatif : après une première collecte validée, activer **Actualisation automatique volontaire** et choisir une cadence de 10 minutes minimum. L’onglet officiel connecté doit rester ouvert. |

## Configuration de synchronisation réservée à l’opérateur autorisé

L’endpoint BacPilot est prérempli. Le parcours recommandé v1.2.0 est l’**enrôlement par appareil** : depuis Telegram, l’opérateur exécute `/collector_issue`, puis saisit le code reçu dans **Code d’activation à usage unique** et clique sur **Enrôler cet appareil**.

- Le code est à usage unique et expire après 15 minutes. Il n’est jamais stocké en clair dans Supabase.
- Après activation, le serveur remet un identifiant et un token propres à cet appareil. Seule l’empreinte du token est conservée côté serveur ; l’extension le conserve localement pour permettre la reprise.
- Le bouton **Enrôler cet appareil** doit afficher « appareil enrôlé et prévol validé » avant toute collecte.
- L’opérateur peut vérifier l’appareil avec `/collector_list`, puis le désactiver avec `/collector_revoke <ID>` suivi d’une confirmation 1/2.
- Le champ legacy `MHM_SYNC_TOKEN` reste temporairement disponible uniquement pour migration. Il ne doit pas être distribué dans une nouvelle installation.
- Ne partagez jamais le dossier utilisateur Chrome, le token de collecteur, une capture de configuration ou un export contenant une configuration.

## Reprise et limites techniques

Manifest V3 peut arrêter son service worker lorsqu’il est inactif. C’est pourquoi la collecte, les diagnostics et les lots sont persistés dans `chrome.storage.local`, plutôt que conservés dans des variables temporaires. Cette zone est accessible aux contextes de l’extension et n’est pas effacée lorsque l’utilisateur vide l’historique ou le cache Chrome ; elle est toutefois supprimée si l’extension est désinstallée.[1] [2]

Les nouvelles tentatives de synchronisation sont déclenchées régulièrement par Chrome, ainsi qu’après un checkpoint, une collecte terminée ou une action manuelle. Une fermeture de Chrome stoppe toute activité ; au prochain démarrage, la console réinstalle sa planification et retrouve l’état local. La cadence de collecte automatique reste explicitement désactivée tant qu’elle n’est pas activée dans la console ; elle ne peut ni ouvrir le portail, ni reconnecter l’utilisateur, ni résoudre un contrôle anti-robot.

## Contrôles avant utilisation réelle

1. Lancez une collecte courte dans une session de test autorisée.
2. Fermez la console pendant la collecte, puis rouvrez-la : la progression doit rester visible.
3. Rechargez l’onglet officiel ou fermez-le accidentellement, rouvrez-le, puis testez **Reprendre la collecte**.
4. Coupez temporairement le réseau après une collecte : un lot doit rester affiché comme conservé localement.
5. Rétablissez le réseau et utilisez **Synchroniser maintenant** ; vérifiez l’accusé de réception, la date **Confirmation serveur** et le dernier lot confirmé dans la console, puis dans Supabase.
6. Activez temporairement la cadence volontaire avec un intervalle de 10 minutes ou plus, en laissant l’onglet officiel connecté ouvert ; vérifiez qu’elle ne démarre rien si l’onglet est fermé ou la session expirée.
7. Confirmez qu’aucun choix n’est modifié ni soumis par l’extension.

## Développement et validation locale

Les tests inclus ne contactent pas le portail officiel. Ils contrôlent le manifeste, la syntaxe, l’absence de logique héritée de scoring/import/maintien de session, et simulent une reprise après redémarrage du service worker.

```bash
node validate_extension.mjs .
node test_persistence.mjs .
node test_console_ui.mjs .
```

## Sources

[1]: https://developer.chrome.com/docs/extensions/reference/api/storage "Chrome Extensions — Storage API"
[2]: https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle "Chrome Extensions — Service worker lifecycle"
