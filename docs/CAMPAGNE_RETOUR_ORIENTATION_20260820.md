# BacPilot — campagne de retour orientation

**Date de livraison :** 20 août 2026  
**Statut :** fonction de brouillon et de confirmation déployée ; aucun e-mail n’a été envoyé.

## Finalité

La campagne rappelle aux utilisateurs que la période de choix de filière approche de sa clôture, sans annoncer de date non vérifiée. Elle invite à revenir sur BacPilot pour reprendre le profil, comparer les pistes et consulter les informations disponibles. Le message rappelle explicitement que les résultats sont indicatifs et que la décision finale doit être vérifiée sur les plateformes officielles.

## Audience préparée

L’audience est filtrée au moment de la préparation puis **revalidée** juste avant l’envoi. Un destinataire doit avoir un compte `active`, une adresse syntaxiquement exploitable, une adresse identique dans son identité Auth et une adresse Auth confirmée.

| Mesure observée au 20 août 2026 | Nombre |
|---|---:|
| Profils actifs | 36 |
| Profils actifs avec adresse au format valide | 31 |
| Profils actifs avec adresse Auth confirmée | 31 |
| Comptes restreints | 0 |

Les adresses individuelles ne sont jamais affichées dans l’aperçu de campagne. Une personne devenue inactive ou non éligible entre l’aperçu et la confirmation est automatiquement exclue.

## Texte préparé

**Objet :** `La période de choix avance : BacPilot reste à vos côtés`

> La période de choix de filière approche de sa clôture. Si vous n’avez pas encore finalisé votre réflexion, BacPilot reste à vos côtés pour vous aider à avancer avec méthode.
>
> Vous pouvez revenir sur votre espace pour reprendre votre profil, comparer les pistes disponibles, relire les informations utiles et préciser ce qui compte le plus pour votre projet après le bac.
>
> BacPilot vous accompagne pour mieux comprendre les établissements, localités, filières, conditions et informations collectées. Les résultats restent indicatifs : votre décision finale doit toujours être vérifiée sur les plateformes et sources officielles.
>
> Prenez quelques minutes pour revoir vos choix et construire une orientation qui correspond réellement à votre parcours et à vos objectifs.
>
> **BacPilot — Compare. Décide. Avance.**

L’e-mail présente le bouton **« Reprendre mon orientation »**, qui mène vers `https://bacpilot.site/onboarding`.

## Utilisation opérateur

Dans Telegram, ouvrir le menu puis choisir **« Campagne de retour »**, ou envoyer :

```text
/orientation_return_draft
```

Le bot montre le texte complet, le nombre de destinataires éligibles et l’expiration du brouillon. À ce stade, aucun e-mail n’est envoyé. L’opérateur peut choisir **« Confirmer »** ou **« Annuler »**. La confirmation ouvre le traitement de l’audience figée, puis chaque destinataire est revalidé avant l’envoi via Resend.

| Étape | Effet |
|---|---|
| Préparation | Crée un brouillon de dix minutes ; aucun e-mail. |
| Confirmation explicite | Lance le traitement de l’audience préparée. |
| Revalidation | Exclut les comptes inactifs ou dont l’adresse n’est plus Auth-confirmée. |
| Livraison | Chaque demande est journalisée ; les tentatives partent avec une clé d’idempotence par destinataire. |
| Suivi | La réponse du bot indique les demandes acceptées par Resend et les échecs ; `/mailstatus` permet le contrôle ciblé. |

La fonction `bacpilot-telegram` est active en **version 51**. La migration `20260820_bacpilot_orientation_return_campaign.sql` autorise exclusivement le stockage de l’action de campagne en attente de confirmation. Aucun envoi, aucune donnée utilisateur et aucun statut de compte n’ont été modifiés lors de cette livraison.
