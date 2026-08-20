# BacPilot — campagne de retour orientation personnalisable

**Date de livraison :** 20 août 2026  
**Statut :** fonctionnalité de personnalisation déployée ; aucun brouillon et aucun e-mail n’ont été créés.

## Finalité

La campagne de retour rappelle que la période de choix de filière approche de sa clôture. Elle invite les utilisateurs à revenir sur BacPilot pour reprendre leur profil, comparer les pistes et consulter les informations disponibles. L’opérateur définit lui-même le compte à rebours, le sujet et le texte final dans Telegram ; aucune date n’est fixée dans le code.

Le modèle proposé rappelle que les résultats sont indicatifs et que la décision finale doit toujours être vérifiée sur les plateformes officielles. Le modèle HTML ajoute le bouton **« Reprendre mon orientation »** vers `https://bacpilot.site/onboarding`.

## Audience protégée

L’audience est filtrée lors de la préparation et revalidée juste avant l’envoi. Un destinataire doit avoir un compte `active`, une adresse au format acceptable, une adresse identique dans le profil et dans Auth, ainsi qu’une adresse Auth confirmée.

| Mesure observée au 20 août 2026 | Nombre |
|---|---:|
| Profils actifs | 36 |
| Profils actifs avec adresse au format valide | 31 |
| Profils actifs avec adresse Auth confirmée | 31 |
| Comptes restreints | 0 |

Les adresses individuelles ne sont pas exposées dans le brouillon. Un compte qui cesse d’être actif ou confirmé entre l’aperçu et la confirmation est exclu automatiquement.

## Parcours dans Telegram

Ouvrir le menu puis choisir **« Campagne de retour »**, ou envoyer :

```text
/orientation_return_draft
```

Le bot ouvre trois étapes :

| Étape | Saisie opérateur | Exemple |
|---|---|---|
| 1/3 | Nombre de jours avant clôture | `4` |
| 2/3 | Sujet, ou `OK` pour garder le sujet proposé | `Plus que 4 jours avant la clôture des choix : BacPilot reste à vos côtés` |
| 3/3 | Texte complet, ou `OK` pour garder le modèle proposé | Texte libre sur plusieurs lignes |

Pour l’exemple de quatre jours, le modèle de sujet contient : **« Plus que 4 jours avant la clôture des choix : BacPilot reste à vos côtés »**. L’opérateur peut changer la formulation avant le brouillon final.

Après la troisième étape, le bot affiche l’aperçu complet : compte à rebours, sujet, contenu, audience admissible et expiration du brouillon. Ce n’est qu’à ce moment qu’il affiche les boutons **Confirmer** et **Annuler**.

| Action | Effet |
|---|---|
| Étapes 1 à 3 | Aucun brouillon d’envoi et aucun e-mail. |
| Aperçu final | Crée un brouillon valable dix minutes ; aucun e-mail. |
| Confirmation explicite | Démarre le traitement de l’audience figée. |
| Revalidation | Exclut les comptes inactifs ou non confirmés. |
| Livraison | Les tentatives sont journalisées, avec une clé d’idempotence par destinataire. |
| Contrôle ciblé | `/mailstatus` permet de vérifier l’état d’un destinataire. |

La fonction `bacpilot-telegram` est active en **version 52**. La migration `20260820_bacpilot_orientation_return_composer.sql` autorise les états de composition et la commande correspondante. Aucune action de campagne ni livraison n’a été créée pendant ce déploiement.
