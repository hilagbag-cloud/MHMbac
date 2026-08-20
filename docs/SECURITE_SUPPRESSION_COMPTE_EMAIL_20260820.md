# BacPilot — sécurité des comptes, notification de suppression et e-mail

**Date de livraison :** 20 août 2026  
**Statut :** déployé en production, avec une activation Auth à effectuer dans le tableau de bord Supabase.

## Objectif

Cette livraison introduit un parcours opérateur qui évite toute suppression silencieuse et limite les risques liés aux adresses non exploitables. Un compte dont l’adresse est disponible et confirmée peut recevoir un e-mail motivé avant une suppression définitive. Lorsqu’aucun e-mail fiable ne peut être utilisé, l’opérateur ne supprime pas immédiatement le compte : BacPilot restreint son accès et affiche un avis privé à ce seul titulaire à sa prochaine connexion.

> Une suppression définitive ne permet pas à son ancien titulaire de lire un message dans l’application. Le statut **« accès temporairement restreint »** est donc le mécanisme volontairement distinct permettant l’affichage sur son téléphone.

## Parcours dans Telegram

| Étape | Action opérateur | Effet réel |
|---|---|---|
| 1 | Ouvrir une fiche utilisateur ou utiliser le bouton **« Vérifier / supprimer »** d’une nouvelle inscription | Aucun changement de compte, aucun e-mail. |
| 2 | Choisir un motif prédéfini ou **« Motif personnalisé »** | Le bot prépare un brouillon lisible avec le motif. |
| 3A | L’adresse est syntaxiquement valide, correspond à Auth et est confirmée | Le bot propose l’e-mail de suppression puis demande **« Confirmer SUPPRIMER »**. |
| 3B | L’adresse est absente, malformée, différente d’Auth ou non confirmée | Le bot prépare une **restriction avec avis privé** ; aucun e-mail ni effacement n’est préparé. |
| 4 | Confirmer explicitement | En 3A, l’e-mail est d’abord accepté par Resend et journalisé, puis le compte est supprimé. En 3B, l’accès est restreint et seul le titulaire voit l’avis à sa prochaine connexion. |
| 5 | Annuler, ou ne rien faire | L’action expire au bout de 10 minutes ; aucun effet. |

Les motifs disponibles sont : **informations non vérifiables**, **compte en double**, **non-respect des règles**, **demande du titulaire**, et un texte personnalisé factuel de 10 à 600 caractères.

## Garanties appliquées

Les adresses saisies à l’inscription sont normalisées en minuscules et doivent respecter un format e-mail minimal avant qu’une création de compte soit demandée. Le profil est créé côté serveur à partir de l’identité Auth, afin que le profil existe également lorsqu’une confirmation d’adresse retarde l’ouverture de session. L’adresse enregistrée dans le profil ne peut plus être remplacée depuis l’écran utilisateur.

Chaque suppression utilise un brouillon confirmé, un e-mail au rendu BacPilot sans bouton de retour vers un accès supprimé, une clé d’idempotence côté Resend et un journal conservé après effacement du profil. Le compte n’est pas supprimé si Resend refuse l’e-mail ou si son journal ne peut pas être enregistré. Un résultat « accepté par Resend » signifie que le fournisseur a accepté la demande d’envoi ; l’opérateur peut ensuite utiliser **« État e-mails »** pour contrôler les événements de remise.

| Élément | Protection |
|---|---|
| Suppression directe | Impossible depuis le bouton : un motif et une confirmation explicite sont requis. |
| E-mail non exploitable | Aucune suppression automatique ; avis privé et restriction temporaire. |
| Envoi repris après incident | Clé d’idempotence par action préparée pour éviter le doublon. |
| Trace après suppression | Journal d’e-mail et audit conservés, avec la référence de la demande. |
| Modification de l’adresse de profil | Refusée côté base ; l’identité Auth reste la source de vérité. |

## Action opérateur obligatoire : exiger la confirmation d’adresse

L’audit agrégé du 20 août 2026 montre que **35 comptes sur 36** étaient marqués confirmés dans la minute suivant leur création. Ce schéma indique que la confirmation Auth n’est pas encore réellement exigée. Il faut activer ce réglage dans Supabase pour empêcher l’ouverture d’une session avant la possession réelle de l’adresse.

Dans le tableau de bord Supabase du projet `uxdfrnogiuefoqjpobpf`, ouvrir **Authentication**, puis **Providers**, sélectionner **Email** et activer **« Confirm email »**. Vérifier ensuite que l’URL du site est `https://bacpilot.site` et que les redirections autorisées incluent `https://bacpilot.site/**`. Après enregistrement, effectuer une inscription avec une vraie adresse contrôlée : l’application doit afficher l’écran **« Confirme ton adresse e-mail »** avant toute connexion.

Cette action de configuration est volontairement laissée à l’opérateur, car elle modifie la politique d’accès Auth de toute la plateforme. Aucun compte existant n’a été suspendu, modifié ou supprimé pendant la livraison.

## Contrôles réalisés

La migration `20260820_bacpilot_account_notice_and_email_integrity.sql` est appliquée. Elle ajoute le statut `suspended_notice`, les champs d’avis privé, le déclencheur de création de profil depuis Auth, la conservation des journaux utiles après suppression et les nouveaux états d’action Telegram.

La compilation Vite est réussie. Les fonctions `bacpilot-telegram` sont actives en version **49** et `notify-new-user` en version **24**. L’interface d’inscription est en production sur [bacpilot.site/register](https://bacpilot.site/register). Les contrôles non destructifs confirment qu’un e-mail correctement formé est accepté, qu’une chaîne manifestement malformée est rejetée, et qu’aucun compte existant n’a été placé en restriction pendant le déploiement.

## Références

[1] [Supabase — Password-based Auth](https://supabase.com/docs/guides/auth/password-based-auth)  
[2] [Resend — Idempotency Keys](https://resend.com/docs/dashboard/emails/idempotency-keys)  
[3] [Resend — Send Email API](https://resend.com/docs/api-reference/emails/send-email)
