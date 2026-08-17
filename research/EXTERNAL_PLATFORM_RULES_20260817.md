# Références externes — Telegram, e-mail et avis Google

## Telegram Bot API

La documentation officielle définit les boutons inline comme des `InlineKeyboardButton` qui livrent un objet `callback_query` au bot ; l’indicateur de progression côté client doit être acquitté avec `answerCallbackQuery`. Lorsqu’un webhook est configuré avec `allowed_updates`, les types non listés ne sont pas livrés. Pour BacPilot, `setWebhook` doit conserver au minimum `message` et `callback_query`.

Sources :

- [Telegram Bot API — CallbackQuery](https://core.telegram.org/bots/api#callbackquery)
- [Telegram Bot API — answerCallbackQuery](https://core.telegram.org/bots/api#answercallbackquery)
- [Telegram Bot API — setWebhook](https://core.telegram.org/bots/api#setwebhook)
- [Telegram Bot API — InlineKeyboardButton](https://core.telegram.org/bots/api#inlinekeyboardbutton)

## Délivrabilité des notifications BacPilot

Gmail recommande SPF, DKIM et DMARC, des expéditeurs identifiables et la séparation des catégories de messages. Les liens doivent être lisibles, le contenu ne doit pas masquer de texte et les notifications transactionnelles ne doivent pas mélanger d’offre promotionnelle. Resend recommande un sous-domaine, un DMARC, des liens cohérents avec le domaine émetteur et l’absence de tracking sur les notifications transactionnelles.

Sources :

- [Gmail — Email sender guidelines](https://support.google.com/mail/answer/81126?hl=en)
- [Resend — Top 10 email deliverability tips](https://resend.com/blog/top-10-email-deliverability-tips)
- [Resend — Open and Click Tracking](https://resend.com/docs/dashboard/domains/tracking)

## Avis et référencement Google

Google impose que les avis balisés correspondent à un contenu réellement visible, à des expériences authentiques et à des auteurs identifiables. Les avis auto‑attribués à une organisation sur son propre site ne sont pas éligibles aux étoiles de résultat enrichi. La page d’avis BacPilot doit donc présenter des retours vérifiés sans injecter de `AggregateRating` ou de schéma d’étoiles pour BacPilot lui-même.

Sources :

- [Google Search Central — Review snippet structured data](https://developers.google.com/search/docs/appearance/structured-data/review-snippet)
- [Google Search Central — Making Review Rich Results more helpful](https://developers.google.com/search/blog/2019/09/making-review-rich-results-more-helpful)
