# Préparation des e-mails de domaine BacPilot

## Objectif

Créer et exploiter les adresses `contact@bacpilot.site` et `support@bacpilot.site`, tout en gardant le site `bacpilot.site` servi par Vercel.

## Constat confirmé

Vercel ne fournit pas d’hébergement de boîtes e-mail. La messagerie doit être fournie par un prestataire distinct et sa configuration requiert des enregistrements DNS de messagerie, notamment MX et généralement TXT/SPF/DKIM/DMARC.

LWS propose des boîtes e-mail professionnelles ainsi que des alias/redirections. La documentation commerciale indique qu’une adresse peut être créée depuis le LWS Panel en choisissant son nom et un mot de passe ; elle mentionne aussi la disponibilité d’adresses incluses avec certains services de domaine/hébergement et des formules Mail Pro séparées.

## Décision technique proposée

1. Vérifier dans le LWS Panel si le domaine `bacpilot.site` bénéficie déjà d’une ou plusieurs boîtes standard incluses.
2. Créer une boîte principale `contact@bacpilot.site`.
3. Créer `support@bacpilot.site` comme seconde boîte si disponible, ou comme alias/redirection vers `contact@bacpilot.site` pour démarrer.
4. Laisser les enregistrements Vercel A/CNAME du site intacts ; ajouter seulement les MX et TXT exacts fournis par le service LWS Mail choisi.
5. Activer et tester SPF, DKIM et DMARC avant d’afficher les adresses publiquement comme canaux actifs.

## Sources

- https://www.lws.fr/adresses-emails-professionnelles.php
- https://vercel.com/kb/guide/why-has-email-stopped-working

> Aucun enregistrement MX ne doit être deviné : il faut appliquer au caractère près les valeurs affichées dans le LWS Panel pour le service e-mail effectivement sélectionné.
