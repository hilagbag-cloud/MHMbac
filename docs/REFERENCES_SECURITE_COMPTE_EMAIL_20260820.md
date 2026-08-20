# Références externes — sécurité e-mail et suppression de compte

## Supabase Auth

La documentation Supabase sur l’authentification par e-mail indique que, pour les projets hébergés, la confirmation de l’adresse peut être exigée à l’inscription et que le parcours JavaScript `signUp()` peut utiliser une URL de redirection de confirmation autorisée. Cette confirmation vérifie la possession de l’adresse ; elle complète, sans la remplacer, la validation locale de format.

- Source : [Supabase — Password-based Auth](https://supabase.com/docs/guides/auth/password-based-auth)
- Consulté le : 20 août 2026

## Resend

La documentation Resend confirme que l’en-tête HTTP `Idempotency-Key` sur `POST /emails` évite l’envoi de doublons lors d’une reprise ou d’une tentative répétée. Les clés restent reconnues pendant 24 heures et doivent identifier une demande précise.

- Source : [Resend — Idempotency Keys](https://resend.com/docs/dashboard/emails/idempotency-keys)
- Source : [Resend — Send Email API](https://resend.com/docs/api-reference/emails/send-email)
- Consulté le : 20 août 2026

## Application à BacPilot

Le parcours de suppression préparera une demande avec motif, message privé et aperçu, puis demandera une confirmation explicite de l’opérateur. Lorsqu’un e-mail est disponible et exploitable, l’envoi utilisera une clé d’idempotence dérivée de l’action préparée. En cas d’adresse absente ou invalide, le compte est suspendu et reçoit un avis privé dans l’application tant qu’il peut encore se connecter ; la suppression définitive reste une opération distincte et confirmée.
