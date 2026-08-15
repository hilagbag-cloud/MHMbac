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
| Synchronisation | Les observations terminées sont découpées en lots, conservées localement puis réessayées automatiquement tant que Chrome reste ouvert. |
| Diagnostic | La console affiche les lots conservés, les erreurs, l’étape qui a échoué et la prochaine tentative. |

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
| 8 | Vérifier le panneau **Lots conservés localement** jusqu’à confirmation de synchronisation. |

## Configuration de synchronisation réservée à l’opérateur autorisé

L’endpoint BacPilot est prérempli. Le **jeton de collecte** doit être renseigné depuis le panneau *Administration locale* par une personne autorisée, après rotation si une ancienne valeur a été exposée.

- Le jeton est stocké localement dans le profil Chrome courant et n’est jamais affiché par la console.
- Utilisez un jeton d’au moins 16 caractères ASCII : lettres, chiffres, point (`.`), tiret bas (`_`), tilde (`~`) ou tiret (`-`). N’utilisez ni espace, ni accent, ni guillemet typographique ; les en-têtes HTTP ne les acceptent pas de manière fiable.
- Si la console affichait auparavant « Jeton requis » malgré l’enregistrement, rechargez l’extension dans `chrome://extensions` en conservant le même dossier local : la configuration et les lots restent associés à cette extension. Ne désinstallez pas l’extension et n’effacez pas les données locales.
- Ne partagez jamais le dossier utilisateur Chrome, une capture de ce champ ou un export contenant une configuration.
- La version distribuée publiquement ne doit pas utiliser un jeton unique partagé : elle devra évoluer vers un mécanisme d’enrôlement par appareil ou par collecteur avant diffusion large.

## Reprise et limites techniques

Manifest V3 peut arrêter son service worker lorsqu’il est inactif. C’est pourquoi la collecte, les diagnostics et les lots sont persistés dans `chrome.storage.local`, plutôt que conservés dans des variables temporaires. Cette zone est accessible aux contextes de l’extension et n’est pas effacée lorsque l’utilisateur vide l’historique ou le cache Chrome ; elle est toutefois supprimée si l’extension est désinstallée.[1] [2]

Les nouvelles tentatives de synchronisation sont déclenchées régulièrement par Chrome, ainsi qu’après une collecte terminée ou une action manuelle. Une fermeture de Chrome stoppe toute activité ; au prochain démarrage, la console réinstalle sa planification et retrouve l’état local.

## Contrôles avant utilisation réelle

1. Lancez une collecte courte dans une session de test autorisée.
2. Fermez la console pendant la collecte, puis rouvrez-la : la progression doit rester visible.
3. Rechargez l’onglet officiel ou fermez-le accidentellement, rouvrez-le, puis testez **Reprendre la collecte**.
4. Coupez temporairement le réseau après une collecte : un lot doit rester affiché comme conservé localement.
5. Rétablissez le réseau et utilisez **Synchroniser maintenant** ; vérifiez l’accusé de réception dans la console, puis dans Supabase.
6. Confirmez qu’aucun choix n’est modifié ni soumis par l’extension.

## Développement et validation locale

Les tests inclus ne contactent pas le portail officiel. Ils contrôlent le manifeste, la syntaxe, l’absence de logique héritée de scoring/import/maintien de session, et simulent une reprise après redémarrage du service worker.

```bash
node validate_extension.mjs .
node test_persistence.mjs .
```

## Sources

[1]: https://developer.chrome.com/docs/extensions/reference/api/storage "Chrome Extensions — Storage API"
[2]: https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle "Chrome Extensions — Service worker lifecycle"
