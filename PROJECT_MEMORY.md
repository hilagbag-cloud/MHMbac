# Mémoire projet — MHMbac / BacPilot

> **Document canonique de continuité.** Lire ce fichier avant toute évolution du produit. Le mettre à jour dans le même changement que le code, la base ou le déploiement concerné.

| Champ | Valeur actuelle |
|---|---|
| Produit | **BacPilot — par MHM SOLUTIONS** |
| Créateur | **Hilarus GBAGOULE** |
| Signature | **Compare. Décide. Avance.** |
| Finalité | Aider les nouveaux bacheliers béninois à explorer des filières à partir de données d’observation réellement collectées. |
| Production | [https://bacpilot.site](https://bacpilot.site) — HTTPS actif via Vercel. URL de repli : [https://mhmbac.vercel.app](https://mhmbac.vercel.app). |
| Dépôt canonique | [github.com/hilagbag-cloud/MHMbac](https://github.com/hilagbag-cloud/MHMbac) — public, branche `main` |
| Dernier commit confirmé | `ddaafa6` ; correction webhook callbacks en cours de versionnement |
| Projet Vercel canonique | `hila2/mhmbac` |
| Projet Supabase | `mhm-solutions-mvp1` — ref `uxdfrnogiuefoqjpobpf` |
| Date de cette mémoire | 16 août 2026 |

## 1. État produit confirmé

BacPilot est une plateforme d’orientation conversationnelle. Elle utilise les observations synchronisées dans Supabase pour afficher un classement et proposer un **Top 3 de pistes à vérifier** selon le profil du candidat : série, mention, objectif bourse/carrière/équilibre, domaines visés et signaux académiques volontaires.

L’interface publique est disponible. L’onboarding est une conversation pas-à-pas avec effet typewriter et réponses rapides. Le dashboard utilise la direction UI validée **« Preuves & Top 3 »** : les résultats occupent la surface principale, un reçu intitulé **« Ce que BacPilot a vérifié »** décrit des étapes réellement exécutées, les facteurs peuvent être développés et l’élève peut poser une question d’explication.

> BacPilot suggère. Le candidat vérifie et valide lui-même ses choix sur le portail officiel. Le produit ne soumet jamais de choix et ne promet jamais une admission ni une bourse.

## 2. Sources de vérité

| Domaine | Source de vérité | À ne pas confondre avec |
|---|---|---|
| Code web et documentation | Dépôt `hilagbag-cloud/MHMbac`, branche `main` | `/home/ubuntu/MHMbac/`, qui contient une ancienne version animée non retenue. |
| Clone de travail à déployer | `/tmp/bacpilot-stable/` | Tout autre clone local. |
| Production web | `https://bacpilot.site` via Vercel `hila2/mhmbac` ; DNS Vercel validés le 15 août 2026. URL de repli : `https://mhmbac.vercel.app`. | `mhmbac-live-prod.vercel.app`, ancienne cible protégée SSO. |
| Observations réelles | Tables Supabase `live_programmes`, `gauge_observations`, `gauge_alerts` | Toute donnée de démonstration ou donnée inventée. |
| Données privées candidat | Tables Supabase `profiles`, `user_preferences`, `orientation_sessions`, `user_academic_signals` | Observations publiques ou données d’un autre candidat. |
| Agent IA | Edge Function Supabase `orientation-assistant` | Un appel direct depuis React à Gemini ou Groq. |
| Ingestion extension | Edge Function `mhmbac-sync` et source `extensions/bacpilot-official/` | Une écriture libre côté navigateur ou l’ancienne extension `/home/ubuntu/apresmonbac_extension/`. |

## 3. Architecture active

```text
Extension Chrome autorisée
    → synchronisation contrôlée
    → Supabase : observations, historique, alertes
    → RPC déterministe : fraîcheur + classement Top 3
    → Edge Function orientation-assistant (JWT obligatoire)
    → Interface BacPilot : conversation, reçu de calcul, Top 3

Nouvelle inscription de profil
    → webhook base de données authentifié
    → Edge Function notify-new-user
    → alerte privée Telegram de l’opérateur

Commande Telegram de l’opérateur
    → webhook Telegram authentifié + chat autorisé
    → Edge Function bacpilot-telegram
    → lecture ciblée, gestion bêta confirmée et audit serveur
```

| Composant | Rôle | Règle de sécurité |
|---|---|---|
| Extension Chrome officielle | Avant toute collecte ou reprise, enregistrer le jeton localement puis lancer automatiquement un prévol serveur. Les scans restent bloqués jusqu’au résultat « Test validé ». Le contrôleur de console vérifie maintenant tous les éléments requis avant d’attacher les boutons, affiche un message lisible si des fichiers de versions différentes sont mélangés et conserve le feedback pendant les actualisations. Chaque action attend l’initialisation de `chrome.storage.local` pour empêcher qu’un enregistrement initial soit écrasé. Le jeton est ajouté uniquement au corps JSON au moment de l’envoi, jamais aux lots locaux ni à un en-tête HTTP. | Ne contourne ni authentification, ni CAPTCHA, ni contrôle d’accès. Pas de profil candidat, score, import ou soumission de choix. La fermeture de la console ne doit jamais supprimer les progrès sauvegardés. |
| `mhmbac-sync` | Prévalider le jeton et l’accès serveur sans écriture, puis normaliser et écrire les observations collectées. | Jeton de synchronisation dédié lu exclusivement depuis `syncToken` dans le corps JSON ; aucun en-tête de jeton n’est accepté. Le prévol ne lit qu’un identifiant de programme et ne crée aucune observation. |
| Supabase | Stocker observations, profils, sessions et résultats. | RLS active ; droits privés limités au propriétaire. |
| `orientation-assistant` | Lire les données autorisées, appeler le score déterministe, sauvegarder seulement les réponses du candidat connecté, expliquer un résultat. | JWT requis ; pas de SQL libre, pas de `service_role`, outils bornés. |
| React / Vercel | Afficher le parcours et les résultats. | Aucune clé IA ou clé d’administration dans `VITE_*`, GitHub ou le navigateur. |
| `notify-new-user` | Reçoit exclusivement un évènement d’insertion de profil autorisé et transmet une alerte d’inscription via Telegram. Un trigger `bacpilot_notify_new_profile` sur `public.profiles` utilise `pg_net` après l’écriture. | Vérifie un secret de webhook conservé dans Vault, utilise la clé secrète moderne Edge Function avec repli legacy, détermine le statut bêta côté serveur et journalise l’envoi de façon idempotente ; aucun secret ne figure dans le code, la migration ou la mémoire. |
| `bacpilot-telegram` | Console opérateur Telegram : états agrégés, fiche utilisateur ciblée, retours bêta et préparation/confirmation des statuts bêta. `/user` et les commandes bêta demandent désormais l’e-mail ou l’identifiant lors d’un second message si l’argument n’est pas donné. | Webhook Telegram protégé par secret et liste blanche d’un seul chat ; les sessions de saisie expirent après dix minutes. L’accès de gestion utilise `SUPABASE_SECRET_KEYS` si disponible, puis le repli legacy ; aucune commande ne fournit mots de passe, jetons, conversations, captures privées ou secrets. Les changements de statut exigent un code de confirmation temporaire et sont audités. |
| `bacpilot-telegram-control` | Configure une fois le webhook Telegram et le menu de commandes. | Accès protégé par secret dédié ; ne doit être invoquée que depuis une session administrateur autorisée. |

## 4. Décisions non négociables

1. **Aucune donnée fictive en production.** Les pistes, facteurs, scores et fraîcheurs proviennent d’observations réelles disponibles dans Supabase.
2. **Score déterministe.** L’IA ne calcule pas le classement et n’invente ni filière, ni chiffre, ni admission. Elle reformule seulement un résultat déjà calculé.
3. **Agent en lecture.** L’agent lit uniquement les observations/catalogues autorisés. Il écrit exclusivement le profil, les préférences, les signaux volontaires et la session du candidat authentifié.
4. **RLS propriétaire.** Toute écriture et toute lecture privée reposent sur `auth.uid()` ; aucun `user_id` fourni par le client ne doit définir un accès.
5. **Validation humaine.** Aucune auto-soumission sur le portail officiel.
6. **États transparents.** Les messages tels que « Dernière mise à jour des données » ou « Comparaison selon ton profil » correspondent à des opérations réellement réalisées.
7. **IA facultative.** BacPilot reste utilisable sans clé IA : une explication déterministe est toujours disponible.
8. **Secrets hors dépôt.** Les clés ne sont jamais enregistrées dans les fichiers, commits, journaux, slides ou mémoire projet.
9. **Administration Telegram bornée.** Le bot est réservé au chat opérateur configuré, délivre uniquement des données administratives ciblées, ne retourne jamais de secret ou de capture privée, et exige une confirmation serveur temporaire pour chaque changement de statut bêta.

## 5. État de l’agent et de l’IA

| Élément | État confirmé | Détail |
|---|---|---|
| Edge Function `orientation-assistant` | Déployée et protégée | `verify_jwt = true` ; un appel sans JWT a été refusé. |
| Moteur Top 3 | Déployé | Classement côté Supabase à partir des observations réelles et de l’objectif candidat. |
| Quota IA | Déployé | Maximum de trois reformulations IA réussies par candidat et par jour ; repli déterministe. |
| Gemini | **Configuré et validé** | Secret Supabase présent ; `gemini-3.1-flash-lite` est le modèle principal de reformulation courte. |
| Groq | Intégration prête, **clé non configurée** | Secours unique si Gemini échoue ; à créer après connexion à GroqCloud. |
| Clés fournies précédemment dans une conversation | À considérer comme exposées | Ne pas utiliser. Générer et configurer de nouvelles clés, puis révoquer les anciennes. |

Pour la procédure de secrets, consulter `CONFIGURATION_SECRETS_AGENT_BACPILOT.md`. Les secrets attendus sont `GEMINI_API_KEY` et `GROQ_API_KEY`, uniquement dans **Supabase Edge Functions → Secrets**. L’absence de clé n’est pas un incident : elle active le repli déterministe.

## 6. État UI et vocabulaire produit

| Zone | État | Vocabulaire à conserver |
|---|---|---|
| Onboarding | Implémenté | « On va préparer tes trois pistes à vérifier », « Une question à la fois ». |
| Dashboard | Implémenté, direction C | « Tes 3 pistes à vérifier », « Ce que BacPilot a vérifié », « Pourquoi cette piste ressort ». |
| Fraîcheur | Implémentée | « Dernière mise à jour des données », « Données récentes / à surveiller / plus anciennes ». |
| Action candidat | Implémentée localement | « Retenir cette piste », jamais « choisir définitivement » ou « soumettre ». |
| Question libre | Implémentée | « Poser une question à BacPilot ». |
| Avertissement | Obligatoire | « BacPilot te propose des pistes. Tu vérifies et tu valides toi-même sur le portail officiel. » |

Documents UI : `SPEC_UI_PREUVES_TOP3.md`, `DIRECTIONS_UI_AGENT_BACPILOT.md`, `VERIFICATION_UI_PREUVES_TOP3.md`.

## 7. Base et données

| Famille | Objets principaux | Usage |
|---|---|---|
| Observations | `live_programmes`, `gauge_observations`, `gauge_alerts` | Lecture de l’état actuel et historique des filières. |
| Candidat | `profiles`, `user_preferences` | Série, mention, objectif et domaines. |
| Agent | `orientation_sessions`, `user_academic_signals`, `recommendation_runs`, `ai_usage_daily` | Conversation, signaux volontaires, résultats et quota. |
| Collecte | `collection_runs` | Couverture et métadonnées des scans ; à exploiter/compléter dans l’évolution extension. |
| Opérateur Telegram | `operator_notifications`, `operator_command_audit`, `operator_pending_actions` | Journal privé des alertes d’inscription, traçabilité des commandes et confirmations temporaires. RLS activée et droits navigateur révoqués ; accès réservé aux fonctions `service_role`. |
| Synchronisation extension — incident au 15 août 2026 | Export local validé : 159 observations uniques, sans erreur de collecte, réparties en 4 lots conservés (40/40/40/39). Aucune écriture associée n’est encore présente dans `sync_batches` ni `collection_runs`. | Le contrat actif place désormais `syncToken` dans le corps JSON : enregistrer le jeton, attendre « Test validé » si le package officiel est utilisé, puis synchroniser les lots existants et contrôler l’accusé serveur. |
| Fonctions | `get_data_freshness`, `get_top_recommendations` et fonctions de quota | Fonctions bornées : base du Top 3 et de l’explication. |

## 8. Déploiement et vérification

1. Travailler exclusivement depuis `/tmp/bacpilot-stable/`.
2. Lancer la compilation : `npm run build`.
3. Vérifier les changements : `git diff --check` et `git status`.
4. Versionner le code **et la mise à jour de cette mémoire** dans le même commit.
5. Publier : `git push origin main`.
6. Déployer : `npx vercel --prod --yes`.
7. Vérifier `https://bacpilot.site`, les routes modifiées, `robots.txt` et `sitemap.xml`. Tester une session candidat pour toute évolution privée.
8. Inscrire le résultat, le commit et le déploiement dans la section « Journal de continuité » ci-dessous.

## 9. Prochaines priorités confirmées

| Priorité | Action | Critère de fin |
|---:|---|---|
| 1 | Réaliser la recette réelle de la console Telegram et d’une alerte d’inscription. | La version 8 ajoute les privilèges minimaux du rôle serveur, un délai de 6 secondes par opération de base, un délai d’envoi de 8 secondes et un acquittement HTTP 200 sur erreur pour stopper les retries Telegram ; valider maintenant `/status`, `/stats`, `/user`, une confirmation bêta et une alerte unique lors de la prochaine vraie inscription. |
| 2 | Réactiver la synchronisation des quatre lots conservés par l’extension officielle. | La console affiche un accusé de réception ; `sync_batches` et `collection_runs` reçoivent une trace nouvelle ; les compteurs et horodatages Supabase progressent. |
| 3 | Réaliser une recette connectée de l’explication Gemini puis ajouter Groq comme secours après connexion à GroqCloud. | La reformulation Gemini consomme le quota attendu pour un vrai utilisateur ; le repli déterministe est confirmé et Groq est ajouté sans exposer de clé. |
| 4 | Réaliser une recette connectée complète du dashboard Preuves & Top 3. | Vérifier les trois pistes réelles, les facteurs, le changement d’objectif et la question libre. |
| 5 | Réaliser une recette réelle de l’extension officielle `extensions/bacpilot-official/`. | Une session autorisée confirme la couverture collectée, la reprise après fermeture, l’accusé `mhmbac-sync` et l’exploitation de `collection_runs` côté backend. |
| 6 | Intégrer ultérieurement le guide officiel avec extraits sourcés. | Aucune recommandation issue du guide sans source affichable. |
| 7 | Évaluer les embeddings seulement après disponibilité d’un corpus officiel propre et consentement sur les données utilisées. | Recherche sémantique sourcée, sans modifier le scoring déterministe. |
| 8 | Lancer l’acquisition organique BacPilot avec le kit Jour 1. | Publication validée explicitement, lien UTM correct et relevé des résultats à +2 h / +24 h. |
| 9 | Publier le message Assomption BacPilot du 15 août 2026. | Post de vœux non commercial, réponse sobre aux interactions, sans CTA produit. |
| 10 | Mettre à jour les liens publics, bios et UTM pour utiliser `https://bacpilot.site`. | Les supports de lancement pointent vers le domaine principal et non vers l’ancienne URL Vercel. |
| 11 | Contrôler l’état d’indexation et les performances organiques dans Google Search Console. | L’accueil est sélectionné par Google comme URL canonique/indexée et les requêtes, impressions et éventuelles erreurs sont suivies. |
| 12 | Configurer le profil Facebook BacPilot existant. | Bio, lien, message Messenger et visuels prêts ; connexion au compte Facebook requise. |
| 13 | Vérifier la réception et l’envoi réels des boîtes `contact@bacpilot.site` et `support@bacpilot.site`, puis activer DKIM/DMARC si LWS les propose. | Un message de test entrant et sortant est confirmé pour chaque boîte ; SPF/DKIM/DMARC sont documentés sans secret. |

## 10. Journal de continuité

| Date | Commit / état | Changement confirmé | Suite |
|---|---|---|---|
| 15 août 2026 | `2aecb70` | Agent conversationnel, scoring déterministe, RLS, quota et Edge Function publiés. | Configurer les clés IA uniquement dans Supabase si nécessaire. |
| 15 août 2026 | `789c904` | Intégration Gemini/Groq alignée sur les documentations ; repli déterministe conservé. | Ne jamais ajouter de clé dans le dépôt. |
| 15 août 2026 | `32f659b` | UI validée « Preuves & Top 3 » : dashboard et onboarding mis à jour. | Recette connectée avec données réelles. |
| 15 août 2026 | En cours | Mémoire projet canonique créée. | Lire et mettre à jour ce fichier à chaque changement. |
| 15 août 2026 | Kit prêt, non publié | Première campagne organique BacPilot préparée : Reel, voix-off, légende, Stories, UTM, tableau de suivi et couverture 4:5 adaptée au cadrage Instagram. | Obtenir l’accord explicite avant toute publication sur un réseau social. |
| 15 août 2026 | Kit prêt, non publié | Post Assomption BacPilot créé après vérification du ton local : visuel 4:5, légende courte et signature discrète. | Publier séparément du Reel, sans lien ni CTA commercial. |
| 15 août 2026 | Recherche terminée, achat non effectué | Comparaison de domaines : `bacpilot.com` chez Spaceship recommandé pour le coût, la lisibilité et le renouvellement prévisible ; `.xyz` est le coût minimal sur deux ans. | Attendre le choix et l’accord explicite avant tout achat. |
| 15 août 2026 | Kit prêt, profil non configuré | Informations, photo de profil et bannière Facebook préparées pour le profil professionnel BacPilot existant. | Connexion au compte Facebook requise avant configuration. |
| 15 août 2026 | Domaine actif | `bacpilot.site` et `www.bacpilot.site` associés au projet Vercel `hila2/mhmbac`. Les DNS sont validés ; un certificat Vercel couvre les deux variantes et chacune répond en HTTPS 200 avec HSTS. | Remplacer les liens de bios, contenus marketing et UTM par `https://bacpilot.site`. |
| 15 août 2026 | SEO déployé et soumis | Sitemap, `robots.txt`, canoniques, métadonnées sociales, JSON-LD, guide public et redirections vers `https://bacpilot.site` déployés. Lighthouse relève 100/100 pour les audits SEO ; Google Search Console confirme que l’accueil est accessible, indexable et demandé à l’indexation. Le sitemap est accepté et ses cinq URL publiques sont découvertes. | Attendre la décision d’indexation de Google puis surveiller couverture, canonique sélectionnée, requêtes et impressions dans Search Console. |
| 15 août 2026 | Performance et canonique déployées | Pages secondaires chargées à la demande ; bundle JavaScript initial réduit d’environ 12 % et logos publics ramenés de 3,5 Mo à des variantes de 12–94 Ko, avec transparence conservée. Mesure Lighthouse mobile : performance 83/100, SEO 100/100, accessibilité 95/100, FCP 2,4 s et LCP 2,8 s. `www` et `mhmbac.vercel.app`, y compris à la racine, redirigent en 308 vers `https://bacpilot.site`. | Surveiller les données terrain Core Web Vitals et l’indexation dans Search Console. |
| 15 août 2026 | `0426632` déployé | Pages publiques À propos, Méthode, Contact, Confidentialité et Conditions complétées ; navigation/footer reliés à des destinations réelles et audités. Le portail `https://partenaires.bacpilot.site` est vérifié par Vercel et répond en HTTPS 200 avec titre, liens et canaux BacPilot cohérents. Les DNS publics exposent le MX LWS et SPF correspondant pour `bacpilot.site`. | Effectuer un test de réception/envoi des deux boîtes et activer DKIM/DMARC si proposé par LWS. |
| 15 août 2026 | `91e9e3d` déployé | Logos des headers principal et partenaire corrigés : hauteur de navigation fixe, largeur automatique et `object-contain` afin de préserver le ratio source. Compilation TypeScript, build Vite et vérification visuelle HTTPS des deux headers validés. | Surveiller le rendu sur les appareils des utilisateurs lors des prochaines visites. |
| 15 août 2026 | `23e0f41` publié | Extension Chrome officielle créée dans `extensions/bacpilot-official/` : console Chrome Windows indépendante, collecte brute sans scoring/import/maintien de session, checkpoints `chrome.storage.local`, file de synchronisation réessayée et diagnostics persistants. Tests statiques et simulation de redémarrage du service worker réussis, sans secret dans le package. L’archive de livraison à utiliser est désormais plate : `bacpilot_extension_officielle_chrome_ready.zip`, avec `manifest.json` directement à la racine après extraction. | Charger le package dans Chrome et effectuer une recette avec session officielle autorisée, jeton local configuré et accusé serveur réel. |
| 15 août 2026 | Diagnostic d’intégration, correctif local en attente de recette | L’export local confirme une collecte complète de 159 observations entre 17:49 et 17:51 UTC, répartie dans quatre lots conservés. Supabase n’a reçu aucun de ces lots : `live_programmes` et `gauge_observations` restent à leur dernière écriture de 01:25 UTC, tandis que `sync_batches` et `collection_runs` sont vides. L’endpoint public répond correctement et refuse un jeton volontairement invalide en `401`, ce qui confirme le contrat d’authentification sans révéler le secret. Le service worker refuse désormais localement les jetons non ASCII avant `fetch`; les tests statiques et de persistance passent et le package plat a été reconstruit. | Recharger le package corrigé, saisir un jeton ASCII identique côté Supabase et extension, puis cliquer sur « Synchroniser maintenant » et contrôler l’accusé serveur. |
| 15 août 2026 | Correctif de persistance locale, en attente de recette | Le service worker attend désormais son initialisation avant chaque action et n’écrase plus une configuration soumise au démarrage. La console indique explicitement « Jeton requis », « Jeton à corriger » ou « Configurée localement ». Les tests statiques et de reprise, y compris l’enregistrement immédiat, passent. Archive plate `1.0.1` reconstruite avec le manifeste à la racine. | Recharger le même dossier d’extension, enregistrer un jeton ASCII, puis vérifier la synchronisation effective des quatre lots dans Supabase. |
| 15 août 2026 | Prévalidation obligatoire déployée, recette utilisateur restante | `mhmbac-sync` version 9 accepte désormais un prévol authentifié qui confirme le jeton et l’accès serveur sans écriture. L’extension 1.0.2 lance ce test après l’enregistrement et avant chaque scan ou reprise ; les boutons restent bloqués jusqu’au succès. Tests statiques, persistance, blocage sans jeton et prévol simulé réussis. | Recharger l’archive 1.0.2 dans le même dossier, obtenir « Test validé », puis déclencher la reprise des quatre lots et confirmer leur arrivée dans Supabase. |
| 15 août 2026 | Correctif console 1.0.3, recette utilisateur restante | Le contrôleur de console a été reconstruit avec vérification des éléments DOM, liaison défensive des boutons, feedback persistant et message explicite en cas de package mélangé. Une recette simulée confirme l’attachement des boutons, le rendu de « Test validé » et les retours de sauvegarde/test. | Remplacer tous les fichiers du même dossier d’extension, recharger Chrome, puis confirmer que la console affiche son feedback et que les boutons répondent avant toute synchronisation. |
| 15 août 2026 | Compatibilité de jeton encodé déployée | `mhmbac-sync` version 10 accepte `x-mhm-sync-token-b64`, décodé strictement en Base64 URL, tout en gardant l’ancien en-tête pour compatibilité. Un package v1.0.1, dérivé uniquement de l’archive fournie, encode désormais le jeton UTF-8 avant de l’envoyer. Tests d’encodage et CORS réussis avec authentification invalide correctement refusée. | Remplacé par le contrat JSON exclusif déployé en version 11. |
| 15 août 2026 | Jeton dans le corps JSON déployé | `mhmbac-sync` version 11 authentifie exclusivement `syncToken` dans le JSON et n’autorise plus les en-têtes de jeton. L’extension officielle 1.0.4 et le package ciblé 1.0.2 ajoutent le jeton seulement à la requête envoyée, pas aux lots stockés. Tests Unicode, persistance, prévol, interface et CORS simplifié réussis. | Recharger le package ciblé dans le même dossier, puis synchroniser les quatre lots existants sans effacer les données locales. |
| 15 août 2026 | `ac1511d` — dispositif bêta implémenté, migration Supabase appliquée | Ajout de `beta_testers` (enrôlement serveur), `beta_feedback` (bug/confusion/idée/appréciation, zone, priorité, attendu/réel, capture privée), `beta_test_events` (activité personnelle) et bucket privé `beta-feedback`, avec RLS propriétaire et statut actif requis pour les insertions. L’interface ajoute `/beta`, badge de compte, lien de navigation, raccourci dashboard « Signaler sur cette zone », statistiques personnelles et historique. Build Vite validé. | Enrôler les comptes bêta via le serveur, puis tester un signalement connecté et vérifier la capture privée. |
| 15 août 2026 | Portail `beta.bacpilot.site` validé et déployé | Ajout de la page hôte dédiée, de `/beta-access` sur le domaine principal et des redirections de connexion/inscription avec conservation de l’intention bêta. Une session Supabase est vérifiée côté serveur via `beta_testers`, puis le compte actif est envoyé vers `/beta`; sans statut actif, l’accès aux outils bêta est refusé avec message explicite tout en laissant BacPilot accessible. Le CNAME LWS `beta` est validé par Vercel pour `mhmbac`; `https://beta.bacpilot.site` répond en HTTPS et affiche le portail. Les balises `noindex, nofollow` sont injectées dans le document pour le portail et le contrôle d’accès. | Enrôler un premier compte bêta, puis effectuer la recette autorisée/refusée et l’envoi d’un retour privé. |
| 15 août 2026 | `f31850e` déployé | Le portail bêta propose explicitement « Créer mon compte » vers l’inscription principale avec l’intention `returnTo=beta`, ainsi que « J’ai déjà un compte ». Toute personne peut donc créer un compte BacPilot ; seules les fonctions de bêta-test exigent une validation serveur dans `beta_testers`. Compilation Vite, contrôle de diff et déploiement Vercel ont réussi. | Vérifier le parcours d’inscription publié, puis configurer le canal de notification privé de l’opérateur. |
| 15 août 2026 | `4ff7e02` déployé et vérifié | Diagnostic d’un crash sur `/register` et `/register?returnTo=beta` : l’import différé attendait un export par défaut alors que `RegisterPage` est un export nommé. `App.tsx` charge désormais explicitement `module.RegisterPage`. La compilation Vite, le contrôle de diff, la publication Vercel et le rendu public des deux variantes de l’inscription sont validés. Le bouton de création du portail bêta ouvre bien `/register?returnTo=beta`. | Choisir puis configurer le canal de notification privé de l’opérateur. |
| 16 août 2026 | `f88f452` publié ; fonctions Supabase actives | Les fonctions `notify-new-user`, `bacpilot-telegram` et `bacpilot-telegram-control` sont déployées. Les migrations créent les journaux privés d’alerte, d’audit et de confirmation avec RLS et droits navigateur révoqués. La console Telegram offre des commandes de lecture ciblée de profils, de statistiques, de retours bêta et de gestion bêta avec confirmation temporaire. | Configurer puis vérifier les secrets, le webhook Telegram et le trigger de profils. |
| 16 août 2026 | `cd98cc8` — configuration Telegram achevée | Les six secrets Telegram sont enregistrés dans Supabase ; le webhook Telegram pointe vers `bacpilot-telegram`, son test serveur répond en HTTP 200, et le menu de commandes est configuré. Le secret du webhook de profils est stocké dans Vault ; `pg_net` est activé et le trigger asynchrone `bacpilot_notify_new_profile` est attaché à `public.profiles`. Un incident de tableau Supabase causé par une extension navigateur a été contourné sans modifier le code public. | Tester `/help`, `/status`, `/user` et une gestion bêta depuis le chat opérateur ; confirmer une alerte unique avec la prochaine inscription réelle. |
| 16 août 2026 | `f517db9` — correctif Telegram v7 | Les commandes Telegram échouaient car elles s’appuyaient sur la clé `service_role` legacy alors que le projet fournit les clés Edge modernes. `bacpilot-telegram` et `notify-new-user` utilisent désormais `SUPABASE_SECRET_KEYS` avec repli legacy. Le bot conserve une session privée de dix minutes lorsqu’une commande `/user` ou bêta est envoyée sans argument, puis demande et traite l’e-mail ou l’ID au message suivant. La table `operator_input_sessions` est RLS, sans accès navigateur. | Vérifier les réponses en chat sur la version 7, puis préparer de nouvelles clés Gemini/Groq. |
| 16 août 2026 | État v8 à versionner — diagnostic et anti-boucle | Les journaux ont confirmé `42501 permission denied for table profiles` : le rôle `service_role` n’avait aucun SELECT explicite sur plusieurs tables créées par les migrations RLS. Une migration accorde uniquement au rôle serveur les SELECT nécessaires sur les tables de lecture et les droits CRUD sur les tables opérateur ; aucun droit navigateur n’est ajouté. La fonction limite les opérations DB à 6 s, les envois Telegram à 8 s et acquitte HTTP 200 même après une erreur authentifiée afin que Telegram cesse de renvoyer la même mise à jour. Version Edge active : 8. | Tester une nouvelle commande Telegram après les droits, puis préparer les clés Gemini/Groq. |
| 16 août 2026 | Gemini activé, déploiement Edge validé | Une nouvelle clé Gemini est créée et enregistrée uniquement dans le secret Supabase `GEMINI_API_KEY`. Les modèles 2.5 sont refusés pour cette clé ; le test API officiel de `gemini-3.1-flash-lite` répond HTTP 200. `orientation-assistant` a été déployée avec ce modèle par défaut. L’endpoint continue de refuser sans JWT (HTTP 401). | Réaliser une recette connectée avec un compte réel autorisé, sans créer de donnée fictive, puis configurer Groq comme repli. |

## 11. Mise à jour du 16 août 2026 — stabilité Telegram v8

Les journaux ont confirmé l’erreur racine `42501 permission denied for table profiles` : le rôle `service_role` n’avait pas de privilège `SELECT` explicite sur les tables RLS de données utilisateur. La migration `20260816_bacpilot_telegram_service_role_grants.sql` accorde désormais au seul rôle serveur les droits minimaux requis pour les lectures de la console et le CRUD de ses tables privées ; aucun droit supplémentaire n’est accordé à `anon` ou `authenticated`.

La fonction `bacpilot-telegram` est active en version 8. Chaque opération de base est limitée à 6 secondes, chaque appel Telegram à 8 secondes, et toute mise à jour Telegram authentifiée qui échoue est acquittée en HTTP 200 afin d’éviter les répétitions infinies. Le build Vite et la transpilation Edge ont réussi avant le déploiement. Le webhook et le menu Telegram ont été reconfigurés après rotation des secrets `TELEGRAM_WEBHOOK_SECRET` et `BACPILOT_TELEGRAM_CONTROL_SECRET` depuis le navigateur local Supabase.

Tests serveur réalisés après configuration : `/status` a répondu `{\"ok\":true,\"command\":\"/status\"}`, `/user` sans argument a répondu `{\"ok\":true,\"command\":\"/user\"}` et `/stats` a répondu `{\"ok\":true,\"command\":\"/stats\"}`. Les messages correspondants ont été envoyés au chat opérateur. Les fichiers temporaires contenant des secrets ont été supprimés. Le commit GitHub est `0d4bb73`.

## 12. Mise à jour du 16 août 2026 — Gemini actif pour l’assistant

La clé Gemini de production est présente exclusivement dans les secrets Edge Functions de Supabase sous `GEMINI_API_KEY`. Le modèle `gemini-3.1-flash-lite` a été testé avec succès par l’API officielle puis déployé comme valeur par défaut de `orientation-assistant`. Les modèles `gemini-2.5-flash-lite` et `gemini-2.5-flash` ne doivent plus être utilisés par cette nouvelle clé, car ils renvoient HTTP 404.

Le test public de l’endpoint confirme que le JWT reste obligatoire. Ne pas créer de compte ni de profil de démonstration en production pour tester l’agent : utiliser une session utilisateur réelle autorisée. Groq reste non configuré et sera ajouté ultérieurement comme solution de secours après une connexion réussie à GroqCloud.

## 13. Règle de reprise de session

Au début de toute nouvelle session ou intervention :

1. Lire `PROJECT_MEMORY.md` puis `MEMORY_UPDATE_PROTOCOL.md`.
2. Vérifier `git log -3 --oneline`, `git status --short` et l’URL de production avant toute modification.
3. Lire uniquement les documents et composants nécessaires à la demande actuelle.
4. Ne jamais demander, reproduire ou enregistrer une clé, un mot de passe, un jeton ou une donnée personnelle dans la mémoire.
5. À la fin, compléter le journal, le statut et les prochaines actions avant le commit.

## Documents de référence complémentaires

- `ARCHITECTURE_AGENT_BACPILOT_READONLY.md` — permissions et limites de l’agent.
- `ARCHITECTURE_BACPILOT_AGENT_IA.md` — architecture longue et évolution future.
- `AGENT_BACPILOT_IMPLEMENTATION_SPEC.md` — contrat technique de l’endpoint assistant.
- `CONFIGURATION_SECRETS_AGENT_BACPILOT.md` — procédure de secrets et rotation.
- `BACPILOT_TELEGRAM_OPERATOR_GUIDE.md` — commandes de la console Telegram, confirmations et limites de confidentialité.
- `PRODUCTION_VERIFICATION_AGENT.md` — contrôles publics et sécurité réalisés.
- `SPEC_UI_PREUVES_TOP3.md` — décision UX/UI et microcopies.
- `MARKETING_JOUR1_LANCEMENT_BACPILOT.md` — kit de lancement organique du Jour 1.
- `POST_ASSOMPTION_BACPILOT_2026.md` — kit de publication de vœux du 15 août 2026.
- `RECOMMANDATION_DOMAINE_BACPILOT_2026.md` — comparaison de prix et recommandation d’achat de domaine.
- `PROFIL_FACEBOOK_BACPILOT.md` — kit de configuration du profil Facebook BacPilot existant.
- `PUBLIC_ROUTES_AUDIT.md` — vérification pré-déploiement des routes et CTA publics.
- `research/EMAIL_DOMAIN_BACPILOT_2026-08-15.md` — configuration de messagerie de domaine sans valeurs sensibles.

---

**Responsable de la mise à jour :** toute personne ou tout agent qui modifie BacPilot. Une livraison sans mise à jour de cette mémoire est incomplète.

## 17. Mise à jour du 16 août 2026 — callbacks Telegram et suivi d’e-mail

Les traces de production ont confirmé qu’un callback Telegram atteignait bien la fonction, était traité et déclenchait les opérations prévues. Le retour d’interface restait toutefois imperceptible parce que l’acquittement Telegram ne contenait aucun texte : chaque clic inline reçoit maintenant immédiatement une notification « Action reçue », puis le message de résultat du bot. Le décodage de `callback_data` isole désormais explicitement l’action avant le premier séparateur, ce qui conserve toute la valeur de l’argument.

La migration `20260817_bacpilot_email_delivery_tracking.sql` est appliquée. Elle ajoute `provider_last_event` et `provider_checked_at` aux journaux welcome, bêta et opérateur, et accorde au seul rôle serveur les droits manquants sur `operator_email_deliveries`. La fonction `bacpilot-telegram` est active en version 34. La commande privée `/mailstatus <e-mail|ID>` lit les trois journaux du destinataire et consulte l’API Resend par référence fournisseur afin de présenter le dernier événement disponible, par exemple accepté, livré, retardé, rebondi ou ouvert. La fiche utilisateur inclut aussi le bouton inline « État e-mails ».

Le mot « envoyé » n’est plus présenté comme une preuve de réception : BacPilot distingue explicitement l’acceptation de l’API Resend de la remise confirmée au serveur destinataire. Les envois welcome préparés depuis le bot sont à présent inscrits dans le journal welcome et dans le journal opérateur. La fonction de notification automatique d’une nouvelle inscription conserve son journal welcome indépendant. La recette humaine restante consiste à cliquer sur un bouton du menu, ouvrir une fiche, appuyer sur « État e-mails », puis renvoyer un welcome à un compte réel autorisé et vérifier le dernier événement Resend.

> Aucun identifiant de destinataire, aucune clé API et aucun jeton ne sont inscrits dans cette mémoire.

## 19. Mise à jour du 17 août 2026 — cause racine des boutons inline

La cause racine des boutons inactifs est confirmée dans `supabase/functions/bacpilot-telegram-control/index.ts` : lors de `setWebhook`, le champ `allowed_updates` était limité à `['message']`. Telegram n’envoyait donc pas les `callback_query` au webhook, alors que le handler `bacpilot-telegram` savait déjà les traiter. Les commandes tapées fonctionnaient normalement, ce qui correspond exactement au symptôme observé.

Le configurateur a été corrigé pour enregistrer `allowed_updates: ['message', 'callback_query']` et la compilation est validée. La fonction de contrôle est déployée, mais l’état externe du webhook doit encore être réenregistré par une invocation authentifiée de l’action `configure`; cette invocation nécessite le secret de contrôle conservé côté Supabase et non disponible dans le clone local. Tant que cette action n’a pas été exécutée, les anciens boutons restent muets, même si le code corrigé est déjà en production.


## 14. Mise à jour du 16 août 2026 — demande bêta contextualisée et diagnostic opérateur
La table `public.profiles` contient désormais, grâce à la migration `20260816_bacpilot_signup_context.sql`, les champs rétrocompatibles suivants : `signup_intent` (`standard` ou `beta_interest`), `signup_entrypoint`, `signup_route`, `signup_device_class`, `signup_browser` et `signup_context_consent_at`. Les anciennes inscriptions conservent les valeurs sûres par défaut `standard` et `direct`. Ces champs ne confèrent jamais le statut bêta ; seul `beta_testers` est modifié par la console opérateur après confirmation.

Le formulaire `/register` demande explicitement à chaque candidat s’il veut utiliser BacPilot normalement ou demander à devenir bêta-testeur. Une demande bêta requiert un consentement séparé au contexte technique minimal : point d’entrée, catégorie d’appareil et famille de navigateur. Aucune adresse IP, mot de passe, cookie, jeton, identifiant de session brut, contenu privé ou user-agent brut n’est enregistré ni transmis à Telegram. Le profil initial est désormais créé dès l’inscription avec l’e-mail, le nom et l’intention, ce qui évite que le webhook `notify-new-user` alerte sur une fiche incomplète.

La fonction `notify-new-user` est active en version 7. La notification Telegram présente : intention, nom, e-mail, ID BacPilot, date, point d’entrée, contexte technique seulement si consenti, statut bêta actuel et, pour une demande bêta, la commande préparée `/beta_add <ID>`. La console `bacpilot-telegram` est active en version 11 ; `/user` réaffiche les mêmes informations pour contrôler le compte avant l’activation. Les deux webhooks restent à authentification personnalisée (`verify_jwt=false`) et refusent une requête non signée en HTTP 401.

Validation réalisée : migration Supabase appliquée et six colonnes vérifiées, compilation Vite réussie, `git diff --check` réussi, versions Edge actives, tests de gardes HTTP 401 réussis. Les 12 profils existants ne sont pas modifiés ; le diagnostic agrégé antérieur indiquait 5 profils sans e-mail et 5 sans série. La recette finale consiste à créer volontairement un prochain compte réel, choisir « Demander à devenir bêta-testeur », vérifier le message Telegram puis utiliser `/beta_add <ID>` et `/confirm CODE`.

À faire après ce commit : pousser le frontend vers `origin/main` pour le déploiement Vercel, puis effectuer la recette réelle sans créer de données fictives. Groq reste à configurer séparément.

## 15. Mise à jour du 16 août 2026 — confirmation bêta simplifiée, temps réel et logo
La console `bacpilot-telegram` est active en version 12. La confirmation d’une action bêta ne demande plus de recopier un code Telegram : après `/beta_add`, `/beta_pause` ou `/beta_revoke`, l’opérateur envoie `/confirm`, puis répond simplement `OUI` ou `NON`. Une session temporaire lie cette réponse à l’action précise, expire au plus tard avec l’action et conserve le verrouillage atomique et le journal d’audit. L’ancien format `/confirm CODE` reste une compatibilité de secours, mais n’est plus affiché dans les messages ni dans le guide opérateur.

La migration `20260816_bacpilot_beta_realtime_and_confirm.sql` ajoute `pending_action_id` aux sessions conversationnelles, étend leurs contraintes, publie `public.beta_testers` dans `supabase_realtime`, et crée la fonction `leave_beta_program()`. Cette fonction ne peut être exécutée que par un utilisateur authentifié ; elle révoque uniquement le statut de son propre compte et ne supprime pas les retours bêta. Le frontend s’abonne désormais aux changements `beta_testers` du compte connecté et lance un repli de synchronisation toutes les 30 secondes. Après activation par Telegram, l’espace bêta doit donc apparaître sans reconnexion ni rechargement manuel. Dans `/profile`, un bêta-testeur actif peut quitter volontairement le programme après confirmation ; les outils bêta disparaissent alors immédiatement.

Les conteneurs roses appliqués autour du logo ont été retirés du header principal, de l’espace partenaire, du footer et de l’inscription. Les composants servent maintenant `public/branding/bacpilot-mark-512.png` avec `object-contain`, largeur automatique et hauteur fixe. Les PNG inspectés possèdent déjà une transparence autour du monogramme ; le fond coloré problématique provenait du CSS de conteneur, et non du fichier image.

Validations avant déploiement : build Vite et `git diff --check` réussis, migration appliquée, fonction `leave_beta_program()` présente et exécutable par `authenticated`, publication Realtime confirmée pour `beta_testers`, et fonction Telegram v12 active. Reste à faire après déploiement : recette utilisateur réelle en trois messages Telegram (`/beta_add`, `/confirm`, `OUI`) et vérification visuelle sur un compte activé, sans créer de donnée fictive.

### Correctif immédiat associé — route Profil
Pendant la vérification de la version précédente, `/profile` déclenchait une erreur React minifiée #306. La cause racine était un chargement différé incompatible : `ProfilePage` est exportée comme composant nommé, mais `App.tsx` l’importait avec `lazy(() => import('./pages/ProfilePage'))`, qui attend un export par défaut. Le routeur utilise désormais `then((module) => ({ default: module.ProfilePage }))`, comme les routes `RegisterPage` et `BetaPage`. Le diagnostic temporaire de production utilisé pour identifier l’erreur a été retiré avant la version finale. La recette doit vérifier `/profile` connecté après chaque déploiement.

## 16. Mise à jour du 16 août 2026 — statut bêta lu par le navigateur et suppression opérateur
La cause racine du statut `active` invisible a été confirmée sur le compte réel `melx779@gmail.com` : la politique RLS `auth.uid() = user_id` de `public.beta_testers` était correcte, mais le rôle `authenticated` n’avait pas le privilège SQL `SELECT`. La migration `20260816_bacpilot_beta_client_read_grant.sql` accorde ce droit minimal ; RLS continue d’empêcher toute lecture d’une ligne appartenant à un autre utilisateur. Après application, le compte réel actif a quitté automatiquement `/beta-access` pour l’espace `BÊTA-TESTEUR ACTIF` et ses outils de retours.

`AuthContext` renforce désormais la cohérence de l’accès : lecture de la source de vérité dès la souscription Realtime, sur chaque évènement PostgreSQL, au retour de l’onglet et par repli toutes les 10 secondes pour une demande en attente, puis toutes les 60 secondes pour un compte actif. `BetaAccessPage` redirige vers `/beta` lorsque ce statut devient `active`. Une erreur temporaire `useContext is not defined`, introduite pendant le refactor d’import React, a été identifiée avec un diagnostic protégé, corrigée et retirée avant la version finale ; la compilation et la route bêta connectée sont validées.

La console `bacpilot-telegram` est active en version 13 et possède la commande `/user_delete [e-mail|ID]`. Elle prépare une action qui expire après dix minutes, exige `/confirm`, puis le mot exact `SUPPRIMER`. Ni `OUI`, ni `NON`, ni `/cancel`, ni l’ancien format `/confirm CODE` ne peuvent déclencher une suppression. Une validation retire Auth et les données liées par cascade, puis le profil applicatif ; le journal d’audit conserve uniquement l’existence de l’action sans identifiant du compte supprimé. La migration `20260816_bacpilot_telegram_user_delete.sql` ajoute l’action autorisée et le privilège serveur minimal. Utiliser `/beta_pause` ou `/beta_revoke` pour retirer seulement les outils bêta.

## 17. Mise à jour du 16 août 2026 — Guide MESRS 2026–2027 numérisé
Le PDF fourni *Guide d’information et de sensibilisation des nouveaux bacheliers 2026-2027 (Licence)* a été numérisé une fois dans Supabase : 937 fiches de formation conservant l’établissement, les quotas, le mode d’entrée, les séries recommandées, les matières et les débouchés lorsqu’ils sont explicitement présents, ainsi que la page PDF et un extrait source. La source `mesrs_guide_2026_2027` stocke l’empreinte SHA-256 `6619ab17b5f973fdc77c8732186493bce48bf7b2c7acc2fa179363e8aa4ec157` et l’édition est traçable. Les formations homonymes de même page sont préservées comme lignes distinctes ; aucune fusion silencieuse n’est autorisée.

Les tables `guide_sources` et `guide_programmes` sont protégées par RLS et ne sont pas lisibles directement par le navigateur. Les fonctions `search_guide_programmes` et `lookup_guide_programmes` sont les seules voies de consultation pour `authenticated` ; elles sont bornées et en lecture seule. L’assistant `orientation-assistant` est actif en version 12 : après le Top 3 déterministe issu des observations réelles, il consulte seulement les fiches de guide des trois formations et retourne les débouchés ou conditions avec l’étiquette `Guide MESRS 2026-2027, p. X`. Le PDF complet n’est jamais transmis à Gemini ni à Groq. Les correspondances textuelles non exactes sont signalées à vérifier et ne doivent pas afficher de débouchés comme une certitude.

Le tableau de bord affiche ces repères uniquement dans « Voir pourquoi cette piste ressort » : mode d’entrée, séries, quotas documentés, débouchés et page source pour une correspondance exacte. Le classement BacPilot reste fondé sur les observations fraîches de la collecte ; le guide enrichit la compréhension mais ne promet pas admission ni bourse. La procédure de prochaine édition est documentée dans `GUIDE_MESRS_2026_2027_DIGITALISATION.md`.

## 18. Mise à jour du 16 août 2026 — notes officielles et interface agentique
La page officielle de l’Office du Baccalauréat (`officedubacbenin.bj/spip.php?article11`) publie les coefficients des épreuves. Le guide MESRS 2026–2027 précise que le classement post-bac utilise trois matières principales avec les coefficients de la série et fournit la formule `M = (m1*x + m2*y + m3*z) / (x+y+z)`, avec les exemples Médecine Bac D `SVT*5 + Math*4 + SPCT*4 / 13` et Bac C `SVT*2 + Math*6 + SPCT*5 / 13`. BacPilot distingue donc la moyenne de classement de la moyenne générale du diplôme ; la mention reste déclarée par le candidat tant qu’une grille de déduction complète n’est pas confirmée.

La migration `20260816_bacpilot_academic_notes.sql` ajoute à `user_academic_signals` `notes_enabled`, `ranking_subjects`, `ranking_average` et `calculation_version`. RLS reste actif et l’Edge Function `orientation-assistant` vérifie les notes entre 0 et 20 puis recalcule côté serveur avec la version `mesrs_2026_2027_ranking_v1`. Les séries A, B, C, D et E ont chacune une configuration de trois matières principales ; une série `Autre` ne produit pas de moyenne supposée.

Le parcours `/onboarding` propose désormais la saisie facultative des trois notes après l’objectif et le domaine. L’interface affiche la moyenne de classement calculée et rappelle qu’elle ne garantit ni admission ni bourse. L’avatar de l’agent utilise `public/branding/bacpilot-mark-512.png` avec un sticker central animé par deux yeux ; le texte conserve l’effet machine à écrire et les explications IA restent limitées à l’action `explain`, après les calculs déterministes et la consultation ciblée du guide. Le frontend et l’Edge Function ont été publiés ; la page onboarding de production rend sans crash avec l’avatar et l’étape de notes visibles.

Documentation : `BACPILOT_ACADEMIC_NOTES_AND_AGENT_UI.md`, avec les sources Office du Baccalauréat et le guide officiel.

## 19. Mise à jour du 16 août 2026 — audit public BacPlus et grille structurée des notes
Un audit limité aux pages publiques et à la documentation API ouverte de `bacplus.bj` a confirmé une pratique pertinente : la moyenne pondérée doit varier par `filière × série`, car chaque filière retient trois matières et coefficients propres. Ce point est cohérent avec le Guide MESRS 2026–2027, mais aucune donnée, code ou score BacPlus ne doit être copié. La réponse est à construire avec une future matrice BacPilot sourcée depuis le guide officiel : filière, série, trois matières, coefficients, page source et statut de vérification.

Le parcours `/onboarding` accepte désormais une grille de notes structurée pour les séries A, B, C, D et E : trois matières clairement marquées « Classement » et matières complémentaires conservées dans le profil. La moyenne affichée reste explicitement un repère de classement de série tant que la matrice officielle par filière n’est pas disponible. Les notes doivent être entre 0 et 20, sont stockées par utilisateur et recalculées par l’Edge Function. Les épreuves facultatives restent désactivées faute de règle institutionnelle suffisamment vérifiée. La publication de production et le contrôle TypeScript sont validés.

Documentation : `BACPILOT_COMPETITIVE_UX_AUDIT.md`. Sources : page publique et OpenAPI BacPlus, Office du Baccalauréat et Guide MESRS.

## 20. Mise à jour du 16 août 2026 — matrice officielle de classement par filière

La migration `20260816_bacpilot_programme_ranking_matrix.sql` crée `public.programme_ranking_rules`, une matrice normalisée par `fiche MESRS × série`, ainsi que la fonction bornée de lecture `lookup_programme_ranking_rules(p_record_ids, p_series)`. La table est protégée par RLS : aucun accès direct n’est accordé au navigateur et la consultation ne retourne que les règles demandées pour une série donnée. La source chargée contient **77 règles** explicites, couvrant **38 fiches** de formation ; la couverture est principalement disponible pour les séries C et D. Quatre lignes de source ambiguës ou incomplètes ont été exclues au lieu d’être devinées.

L’Edge Function `orientation-assistant` est active en **version 14**, avec JWT obligatoire. Pour chaque piste dont le rattachement à une fiche est exact, elle récupère uniquement la règle correspondante à la série de l’élève, applique la formule pondérée à partir des notes privées déjà sauvegardées, et renvoie les trois matières, coefficients, moyenne arrondie à deux décimales et page PDF. S’il manque une note, aucune moyenne n’est produite : l’interface demande explicitement la ou les matières à compléter. Les correspondances de recherche approximative n’obtiennent jamais de moyenne de filière.

Le dashboard affiche ces éléments seulement dans « Voir pourquoi cette piste ressort », sous l’intitulé « Moyenne de classement de cette filière ». Cette moyenne est distincte de l’indicateur BacPilot `/100`, qui reste fondé sur les observations réelles de pression et de quotas. L’affichage rappelle implicitement la nécessité de vérifier le résultat sur le portail officiel ; BacPilot ne garantit ni admission ni bourse.

La matrice est construite par le script déterministe `/tmp/bacpilot-guide-2026/build_programme_ranking_matrix.py`, avec ses résultats documentés dans `programme_ranking_rules_v1.json`, `programme_ranking_rules_summary.json` et `bacpilot-matrix-source-findings.md`. Toute extension future doit conserver cette traçabilité et prioriser les séries A, B et E, encore peu couvertes.

| Vérification | Résultat |
|---|---:|
| Règles chargées dans Supabase | 77 |
| Fiches MESRS couvertes | 38 |
| Edge Function | `orientation-assistant` v14, JWT actif |
| Contrôles locaux | `deno check`, build Vite et TypeScript réussis |


### Publication de production — matrice par filière

Le commit canonique `afa8f0b` (*feat: add per-programme ranking matrix with official guide sources*) est poussé sur `origin/main`. L’interface correspondante est publiée par Vercel et associée à `https://bacpilot.site`; l’URL d’inspection de ce déploiement est `https://vercel.com/hila2/mhmbac/CEFQDvi8nsDpe5LYUzSkcUT77evB`. La page publique et le dashboard authentifié répondent après publication.

La recette complète de l’affichage de moyenne nécessite une session réelle dont la série est C ou D et dont les notes requises sont déjà enregistrées. Le compte actuellement ouvert dans le navigateur ne possède pas de série, donc aucune recommandation ne peut être calculée et aucun profil de démonstration ne doit être créé. Dès qu’un compte réel compatible est disponible, lancer « Mettre à jour mes pistes », ouvrir « Voir pourquoi cette piste ressort » sur une correspondance exacte, puis vérifier la présence de la moyenne `/20`, des trois matières avec coefficients et de la page MESRS.


## 21. Mise à jour du 16 août 2026 — extension A1, A2, B et E de la matrice

La grille officielle de l’Office du Baccalauréat distingue **A1** et **A2** : le Français, la Philosophie et l’Histoire-Géographie n’ont pas les mêmes coefficients. BacPilot ne doit donc plus calculer une moyenne de filière avec la valeur générique `A`. Le type applicatif, le parcours conversationnel, le profil, l’assistant et le schéma de référence reconnaissent désormais `A1` et `A2`. Les profils historiques enregistrés sous `A` restent lisibles mais doivent préciser A1 ou A2 avant d’obtenir une moyenne de classement ; aucun coefficient A1 n’est appliqué par défaut à un profil A historique.

La migration `20260816_bacpilot_a1_a2_series_support.sql` étend la contrainte de `programme_ranking_rules` aux séries `A1` et `A2`. Elle ajoute `get_top_recommendations_for_profile()`, qui maintient le Top 3 issu des observations réelles pour A1/A2 en le relayant vers la compatibilité historique `A` ; cette adaptation ne fabrique aucune observation et ne modifie pas le score `/100`.

Après audit du corpus MESRS et de la grille officielle, 40 règles explicites ont été générées dans `programme_ranking_rules_remaining_v2.json`. Deux règles existaient déjà et sont mises à jour idempotemment ; la matrice active contient donc maintenant **115 règles** : A1 **11**, A2 **12**, B **13**, C **38**, D **37**, E **4**. Les 21 fiches candidates restantes sont volontairement différées, car elles comportent une matière technique non couverte, une alternative non isolable par série, une formulation ambiguë ou une fiche incomplète. Elles ne doivent pas être chargées sans nouvelle source précise.

Le générateur d’extension `build_remaining_series_rules.py` applique une liste blanche de correspondances filière × série × trois matières, conserve l’extrait et la page de chaque fiche, valide les coefficients de l’Office du Baccalauréat et échoue si une matière n’est pas disponible dans la grille officielle. L’audit et la liste des cas différés sont documentés dans `remaining_series_audit.md` et `programme_ranking_rules_remaining_v2.json` hors dépôt, avec la source officielle : `https://www.officedubacbenin.bj/spip.php?article11`.


### Publication de production — extension A1/A2

Le commit `d754528` (*feat: extend ranking matrix to A1 A2 B and E*) est poussé sur `origin/main`. L’Edge Function `orientation-assistant` est active en **version 15**, avec JWT obligatoire. L’interface est déployée et associée à `https://bacpilot.site`; l’inspection Vercel est disponible à `https://vercel.com/hila2/mhmbac/9HnmtNAq54NZPU9gPdBXrRZTthxd`.

Recette sans écriture réalisée dans le navigateur : `/onboarding` expose distinctement « Série A1 (Lettres & Langues) », « Série A2 (Lettres & Sciences humaines) », B, C, D et E. Le relais SQL accepte `A1` et retourne une piste issue des observations existantes ; une règle A2 contrôlée retourne Français coefficient 4, Langue vivante 1 coefficient 3 et Philosophie coefficient 3 avec la page MESRS 24. La recette de moyenne complète reste réservée à un compte réel avec la série et les trois notes concernés, sans création de profil fictif.



## 12. Mise à jour du 16 août 2026 — diagnostic et correction Resend

Le composeur Telegram d’emails fonctionne jusqu’à l’appel fournisseur et journalise désormais les erreurs Resend détaillées. Le premier `HTTP 403` était lié à l’utilisation de `send.bacpilot.site` comme domaine expéditeur alors que la session Resend connectée à `hilagbag@gmail.com` ne contient qu’un domaine vérifié : `bacpilot.site`.

La fonction `bacpilot-telegram` ajoute maintenant un en-tête `User-Agent` explicite, conserve le message JSON Resend borné dans le journal et utilise automatiquement `BacPilot <contact@bacpilot.site>` si `BETA_EMAIL_FROM` pointe encore vers `@send.bacpilot.site`. Le template HTML conserve le logo, les informations BacPilot/MHM SOLUTIONS et la version texte de secours. La table `operator_email_deliveries` journalise chaque tentative personnalisée.

La migration `20260816_bacpilot_email_send_pending_action.sql` autorise `email_send` dans le circuit d’actions confirmées. Deno, build Vite et TypeScript passent ; la fonction est republiée. Le prochain essai contrôlé doit vérifier l’envoi avec le domaine racine vérifié et retourner une référence Resend si l’API accepte la clé.

Sources de diagnostic conservées dans `/tmp/bacpilot-guide-2026/resend_403_diagnostic.md` et `/tmp/bacpilot-guide-2026/resend_domain_verification_finding.md`.


## 13. Mise à jour du 16 août 2026 — retours bêta, alertes événementielles et SEO

L’erreur client `permission denied for table beta_feedback` provenait de privilèges SQL absents pour le rôle `authenticated`, malgré les politiques RLS déjà correctement limitées au propriétaire actif. La migration `20260816_bacpilot_feedback_notifications.sql` accorde uniquement `SELECT, INSERT` aux tables `beta_feedback` et `beta_test_events`, ainsi que `SELECT` sur `beta_testers`. Les vérifications serveur confirment que ces droits sont actifs ; les règles RLS continuent à empêcher l’accès aux retours d’autrui.

Chaque nouveau retour bêta déclenche désormais, de manière asynchrone et non bloquante, la fonction `notify-beta-feedback`. Elle journalise la livraison dans `operator_feedback_deliveries`, alerte le chat Telegram autorisé avec les détails pertinents et envoie un email HTML à l’opérateur lorsque `OPERATOR_NOTIFICATION_EMAIL` est présent. Le secret de destinataire est configuré dans Supabase ; sa valeur ne doit jamais être enregistrée dans le dépôt ou la mémoire.

`notify-new-user` affiche désormais l’action bêta immédiatement exploitable : `/beta_add <ID>`, puis `/confirm` et choix `1` ou `2`, ainsi que la commande de fiche utilisateur. L’email de bienvenue est toujours envoyé seulement après confirmation serveur du statut bêta.

L’audit SEO de production a confirmé que `bacpilot.site` sert un robots.txt et un sitemap valides, mais que le sous-domaine partenaires renvoyait auparavant vers le sitemap du domaine principal. Les fichiers de découverte sont maintenant séparés : domaine principal indexable, `partenaires.bacpilot.site` avec son propre robots/sitemap, et `beta.bacpilot.site` exclu par robots et X-Robots-Tag. Les données structurées de l’accueil ont été enrichies seulement avec les contacts publics et le périmètre réel de BacPilot. Le SEO facilite crawl et compréhension ; il ne garantit pas un classement sur une requête générique.


## 14. Mise à jour du 16 août 2026 — extension officielle v1.1.0, reçus et fraîcheur

La migration `20260816_bacpilot_sync_receipts.sql` est appliquée au projet Supabase `uxdfrnogiuefoqjpobpf`. Elle ajoute la table privée `public.sync_batch_receipts` avec RLS activée et sans droit `anon` ou `authenticated`, ainsi qu’une contrainte unique sur `gauge_alerts.event_hash`. L’Edge Function `mhmbac-sync` est active en version **20** avec `verify_jwt=false`, ce qui est requis parce qu’elle utilise un jeton de synchronisation spécifique, lu uniquement dans le corps JSON. Une requête de prévol sans jeton valide est refusée en HTTP 401 ; aucun relevé de démonstration n’a été ajouté.

La source d’extension `extensions/bacpilot-official/` est préparée en version **1.1.0**. À chaque checkpoint, les observations déjà lues sont conservées localement, découpées en lots et envoyées progressivement. Le serveur mémorise le résultat par `batchId` et `payload_hash` : une réémission identique renvoie le reçu existant, tandis qu’un même identifiant avec un contenu divergent renvoie HTTP 409. Les alertes de variation sont dédupliquées par empreinte d’événement. Le délai de lecture est adaptatif entre 700 ms et 8 s, et un HTTP 401/403 arrête la collecte avec un message demandant à l’utilisateur de se reconnecter lui-même au portail officiel.

L’actualisation périodique de la console est désactivée par défaut. Lorsqu’elle est activée volontairement, elle accepte un minimum de 10 minutes, attend un onglet officiel préexistant, exige un prévol de synchronisation déjà validé et refuse de remplacer une collecte inachevée. Elle ne crée pas d’onglet, ne se connecte pas, ne maintient pas une session expirée et ne contourne aucun CAPTCHA. La console expose le dernier checkpoint local, la dernière confirmation serveur, le dernier lot confirmé, l’état de session, la file persistante et l’état de cette cadence.

Contrôles réalisés : `node --check` réussi pour le service worker, le collecteur et la console ; `deno check` réussi pour `mhmbac-sync` ; présence de `sync_batch_receipts` et de `gauge_alerts.event_hash` vérifiée dans le schéma de production ; fonction version 20 active. Restent à finaliser : générer l’archive plate avec checksum, pousser le commit, puis réaliser une recette de collecte avec un compte officiel réel autorisé, sans créer de données fictives.

| Date | Commit / état | Changement confirmé | Suite |
|---|---|---|---|
| 16 août 2026 | v1.1.0 locale, migration appliquée et fonction v20 active | File locale incrémentale, reçus idempotents, alertes sans doublon, cadence volontaire et indicateurs de fraîcheur. | Construire le ZIP, charger l’extension, valider le prévol et faire la recette réelle de reprise. |


## 15. Mise à jour du 16 août 2026 — correctif prévol 401 et console v1.1.1

La recette de la v1.1.0 a révélé deux problèmes distincts. D’une part, `mhmbac-sync` lisait uniquement `MHM_SYNC_TOKEN`, alors que certaines installations historiques avaient été configurées avec le nom `MHMBAC_SYNC_API_KEY`. La fonction accepte désormais le nom canonique `MHM_SYNC_TOKEN` et le nom historique `MHMBAC_SYNC_API_KEY`, sans modifier le contrat : la valeur complète est toujours envoyée uniquement dans `syncToken` du corps JSON. La fonction est active en **version 22**, avec `verify_jwt=false` et authentification applicative par jeton.

D’autre part, après un premier HTTP 401, la console recevait l’état `tokenState=ready` mais `verificationStatus=invalid` et désactivait à tort le bouton de prévol. Le bouton **Tester le jeton** reste désormais cliquable tant qu’un jeton non vide est enregistré ; l’opérateur peut donc corriger la valeur et relancer le prévol sans recharger ni désinstaller l’extension. Les boutons de collecte restent correctement bloqués tant que le prévol n’est pas validé.

La version corrective de l’extension est **1.1.1**. Les tests de manifeste, persistance, reprise simulée, interface, validation du prévol, syntaxe JavaScript et `deno check` sont réussis. L’archive plate `bacpilot_extension_officielle_v1.1.1.zip` et son checksum SHA-256 sont générés. La recette avec une valeur secrète réelle reste à effectuer par l’opérateur : vérifier le nom `MHM_SYNC_TOKEN` dans Supabase, coller la même valeur dans la console, obtenir « Test validé », puis lancer une collecte réelle autorisée.


## 16. Mise à niveau du 16 août 2026 — enrôlement collector v1.2.0

Le secret global `MHM_SYNC_TOKEN` était bien présent dans Supabase, mais son affichage masqué rendait le diagnostic du HTTP 401 fragile pour une extension distribuée. La stratégie de production est désormais l’enrôlement individuel par appareil. La migration `20260816_bacpilot_collector_enrollment.sql` a créé `collector_activation_codes`, `collector_devices` et le rattachement `sync_batch_receipts.collector_id`. Les deux tables sont protégées par RLS et réservées à `service_role`; aucun accès `anon` ou `authenticated` n’est accordé.

Depuis Telegram, `/collector_issue [libellé]` crée un code d’activation hashé, à usage unique, expirant après quinze minutes. L’extension l’envoie à `mhmbac-sync` avec l’action `enroll`; le serveur consomme le code, crée un collecteur, ne conserve que l’empreinte SHA-256 de son token et remet le token une seule fois à l’extension. `/collector_list` affiche les identifiants et états des appareils sans révéler leurs tokens. `/collector_revoke <ID>` crée une action confirmable en 1/2; l’exécution met le collecteur à l’état `revoked` et bloque immédiatement ses synchronisations. La contrainte opérateur a été étendue par `20260816_bacpilot_collector_operator_actions.sql`.

`mhmbac-sync` accepte maintenant en priorité `collectorId` + `collectorToken`, renvoie des codes explicites (`ACTIVATION_INVALID`, `ACTIVATION_CONSUMED`, `ACTIVATION_EXPIRED`, `COLLECTOR_NOT_FOUND`, `COLLECTOR_REVOKED`, `COLLECTOR_TOKEN_INVALID`) et rattache les reçus au collecteur. Le mode legacy avec `MHM_SYNC_TOKEN` ou `MHMBAC_SYNC_API_KEY` reste temporairement accepté pour migration, mais ne doit plus être distribué dans une nouvelle installation. Les fonctions sont déployées après contrôle Deno.

L’extension officielle passe en **v1.2.0**. La console présente le champ **Code d’activation à usage unique** et le bouton **Enrôler cet appareil**; le service worker persiste l’identifiant et le token du collecteur, envoie les credentials dans le corps JSON et conserve la file de reprise. Les validations `validate_extension.mjs`, `test_persistence.mjs`, `test_console_ui.mjs`, les contrôles de syntaxe et `deno check` sont réussis. La recette d’activation réelle nécessite encore l’exécution par l’opérateur de `/collector_issue`, la saisie du code dans la nouvelle extension puis la vérification « Collecteur validé ».


## Correctif du 16 août 2026 — reçus de synchronisation

Lors d’une collecte réelle avec collecteur validé, les lots restaient locaux avec `Lecture du reçu de lot impossible` et HTTP 500. Les logs Supabase ont confirmé que le problème était un 403 PostgREST interne : `service_role` contournait RLS mais ne possédait pas le privilège SQL `SELECT` sur `public.sync_batch_receipts`. La migration `20260816_bacpilot_sync_receipts_service_role_grant.sql` applique `GRANT SELECT, INSERT, UPDATE` à `service_role` uniquement. Vérification SQL : `service_role` peut SELECT/INSERT et `anon` ne peut toujours pas SELECT. Aucun lot local n’a été supprimé; une reprise par le bouton « Synchroniser maintenant » doit être exécutée sur l’extension pour confirmer l’accusé réel.


## Correctifs du 16 août 2026 — fraîcheur continue et SEO

L’audit de fraîcheur a montré qu’après un incident réseau, des checkpoints successifs d’une même collecte pouvaient être remis dans la file dès que leur ancien lot était confirmé, car la déduplication ne regardait que les lots encore en attente. Les reçus récents portaient ainsi le même `collection_id` et le même `observed_at` : ils représentaient des reprises, pas de nouvelles observations. `service-worker.js` maintient désormais `confirmedObservationKeys` pour la collecte en cours : un item confirmé est exclu des prochains checkpoints, y compris après retrait de son lot de la file. Les IDs de queue sont également uniques, afin que des sous-lots d’un même cycle ne se remplacent jamais. Le test de persistance vérifie désormais ce scénario.

L’actualisation automatique volontaire reste bornée à 10 minutes minimum et exige un onglet officiel ouvert avec une session autorisée. Elle ne peut pas contourner une reconnexion ou un CAPTCHA. La page d’accueil distingue maintenant les données « récentes », un « relevé à actualiser » et des « données anciennes » ; une connexion Realtime ne signifie plus à elle seule que les statistiques sont fraîches.

Audit SEO public : la route historique `/a-propos` répondait 404 malgré une navigation correcte vers `/about`. Elle est maintenant rendue côté client, canonique vers `/about` et redirigée en HTTP 301 par Vercel. La recherche de marque ne présentait pas encore BacPilot dans les résultats publics, ce qui est cohérent avec une indexation récente ; les pages publiques, le sitemap, les canonical et les contenus d’orientation restent les leviers organiques prévus. Ne pas générer de faux backlinks ni simuler de recherches automatisées.


## Renforcement collecte continue — extension v1.2.2

Après validation de l’enrôlement et de la reprise, le contrôle de fraîcheur a confirmé que les derniers reçus pouvaient correspondre à des reprises d’un même cycle plutôt qu’à de nouvelles observations. En plus de la déduplication des checkpoints v1.2.1, la v1.2.2 déclenche désormais un premier cycle dès l’activation de l’actualisation volontaire et exécute un prévol du collecteur avant chaque cycle planifié. La console enregistre `lastAutoRefreshAttemptAt` et un statut explicite de report ou de lancement. La cadence reste volontaire, avec un minimum de 10 minutes, un onglet officiel existant et une session autorisée : aucun maintien de session, aucune reconnexion ni résolution de CAPTCHA n’est implémenté.


## 2026-08-16 — Console Telegram inline et welcome obligatoire

Le bot Telegram évolue vers une console à boutons inline tout en conservant les commandes texte. Le menu principal propose maintenant statistiques, utilisateurs, bêta-testeurs, retours, état, templates, actions en attente et aide. Les fiches utilisateurs proposent Voir la fiche, Envoyer welcome, Ajouter bêta et Supprimer. Les actions sensibles utilisent les confirmations serveur existantes via les boutons Confirmer/Annuler.

La table privée `welcome_email_deliveries` journalise le welcome automatique par utilisateur avec statut, tentatives, identifiant fournisseur et erreur éventuelle. `notify-new-user` tente l’envoi automatique à chaque nouvelle inscription ayant un e-mail valide, déduplique les envois déjà réussis et publie dans Telegram les boutons Renvoyer welcome, Voir la fiche, Valider bêta si demandé et Supprimer. Les utilisateurs sans adresse e-mail restent signalés avec un statut explicite afin qu’un contact puisse être complété ; aucun envoi ne peut être effectué sans adresse valide.

## 18. Mise à jour du 16 août 2026 — welcome transactionnel et délivrabilité

Les functions `notify-new-user` (version 16) et `bacpilot-telegram` (version 35) sont déployées avec un modèle welcome explicitement transactionnel. Le message porte désormais le sujet « Votre compte BacPilot est prêt », contient une confirmation concise de création de compte, un seul lien visible vers `https://bacpilot.site`, une version texte complète et une adresse de réponse `contact@bacpilot.site`. Le modèle retire du welcome automatique et de son renvoi Telegram le visuel de campagne, l’image distante, le bouton promotionnel, les promesses de bourse et le texte d’exploration commerciale. Les e-mails personnalisés et le modèle bêta ne sont pas modifiés par ce changement.

Contrôles publics réalisés : le sous-domaine Return-Path `send.bacpilot.site` expose un SPF Amazon SES et un MX de feedback, tandis que le domaine principal expose une politique DMARC `p=quarantine`. La vérification du détail DKIM et des options de tracking doit rester contrôlée dans le tableau Resend et dans les en-têtes d’un test réel. Les recommandations opérationnelles sont de maintenir le tracking ouvertures/clics désactivé pour les notifications transactionnelles, d’utiliser un volume progressif et d’inspecter `spf=pass`, `dkim=pass` et `dmarc=pass` dans un message Gmail de test.

> Gmail choisit librement ses catégories. BacPilot réduit les signaux évitables mais ne promet pas un placement systématique dans l’onglet Principal.


## Mise à jour du 17 août 2026 — résultats détaillés et communauté BacPilot

La migration `20260817_bacpilot_candidate_community.sql` est appliquée. Elle ajoute une préparation privée de un à trois choix dans `candidate_choice_preparations`, un parrainage à attribution unique (`profiles.referral_code`, `user_referrals` et fonctions propriétaires), des avis (`bacpilot_reviews`) et des intentions de soutien (`support_intents`) avec RLS. Les avis publics et les soutiens mis à l’honneur ne sont visibles qu’après modération ou confirmation par l’équipe via le rôle serveur ; aucune donnée fictive, note artificielle ou reconnaissance non consentie n’est créée.

Le dashboard présente désormais, pour chaque piste, l’université, l’établissement, les effectifs observés, les quotas et la page du Guide MESRS lorsque le rattachement est exact. La localité est affichée uniquement si elle est renseignée dans le guide ; sinon le candidat voit explicitement « Localité à confirmer sur le portail officiel ». Le lien officiel renvoie vers `https://apresmonbac.bj/Home/choice`. Les candidats peuvent ordonner et enregistrer jusqu’à trois pistes, puis copier la liste et ouvrir le portail officiel. BacPilot ne remplit ni ne soumet jamais ce portail à la place du candidat.

La migration `20260817_bacpilot_guide_location_lookup.sql` est appliquée et la fonction `orientation-assistant` est active en version 23. Le nouveau RPC `lookup_guide_programmes_enriched` ajoute la localité lorsque cette donnée est numérisée. Son déploiement requiert désormais le fichier `import_map.json` explicite afin d’éviter une ancienne métadonnée Supabase pointant vers un chemin absolu inexistant.

Les pages publiques `/avis` et `/soutenir`, l’espace connecté `/parrainage` et les liens courts `/r/<code>` sont implémentés côté web. Le parrainage utilise des paliers de reconnaissance non monétaires (sans montant, promesse ni gain financier inventé) ; un lien ne peut être appliqué qu’une fois et l’auto-parrainage est bloqué côté serveur. La page `/avis` ne publie que les retours soumis par un utilisateur connecté, avec consentement et modération. Elle ne contient volontairement aucun `AggregateRating` ou schéma d’étoiles pour BacPilot : Google considère les avis d’une organisation sur elle-même comme auto-attribués et inéligibles aux étoiles enrichies.

La page `/soutenir` ne collecte pas de paiement. Elle enregistre une intention de soutien d’un utilisateur connecté, indique qu’un échange e-mail suivra et rappelle de ne jamais partager de mot de passe, code OTP ou information bancaire dans un message. Toute méthode de dépôt, transaction ou valorisation publique doit être décidée et confirmée séparément avec le donateur. La chaîne WhatsApp officielle est reliée à `https://whatsapp.com/channel/0029VbDpHRNAYlUQHSqika2n`.

Références externes conservées dans `research/EXTERNAL_PLATFORM_RULES_20260817.md` : Telegram Bot API, recommandations Gmail/Resend et règles Google sur les avis.

À vérifier avant publication web : compilation frontend, lecture connectée des RPC communautaires avec un compte réel autorisé, rendu mobile des nouvelles pages et ajout dans le sitemap des routes publiques `/avis` et `/soutenir`.


## Mise à jour du 17 août 2026 — incident critique de recommandations identiques

La cause racine a été confirmée dans `20260815_recommendation_score_v2.sql` et `20260816_bacpilot_a1_a2_series_support.sql` : `get_top_recommendations_for_profile()` ramenait A1/A2 à A et ne transmettaient que l’objectif, la mention et les mots-clés. Dans `get_top_recommendations()`, la série n’entrait pas dans le score, tandis que les notes, les forces, la moyenne calculée et les règles du Guide MESRS étaient ignorées. Les utilisateurs sans mots-clés métier convergeaient donc vers les mêmes lignes globales de `live_programmes`.

La migration `20260817_bacpilot_personalized_recommendations_v1.sql` est appliquée. Elle crée `get_personalized_recommendations()` sans supprimer l’ancien RPC. Le nouveau score combine, selon l’objectif, le signal bourse, la compatibilité de série, les matières du guide, la moyenne académique, la pression observée, la mention, les mots-clés carrière et les forces déclarées. Il expose dans `factors` les signaux utilisés et ajoute des réserves lorsque la série, la moyenne ou une fiche guide exacte manquent. Les règles A1/A2 ne sont plus fusionnées dans cet appel.

`orientation-assistant` version 24 est active et appelle le nouveau RPC avec la série exacte, l’objectif, les mots-clés, les forces, `subjects`, `ranking_average` et les notes uniquement lorsque `notes_enabled` est vrai. Gemini ne calcule pas le classement : il reçoit les résultats SQL validés, le profil autorisé et les extraits des pages du guide pour reformuler et citer, avec repli déterministe.

Recette lecture seule sur les observations existantes : `C + bourse + mathématiques` produit notamment Sociologie rurale et Vulgarisation Agricole (76), Horticulture et Aménagement des espaces Verts (75) et Gestion et Production Végétale et Semencière (75). `C + carrière + informatique` produit Génie rural et Maîtrise de l’Eau (73), Internet et Multimédia (73) et Mathématiques Informatiques (72). `D + carrière + santé` produit Diététique des aliments et Nutrition (70), Génétique Biotechnologies et Applications (69) et Biotechnologie Médicale (69). `D + bourse` produit un autre Top 3 avec Génétique Biotechnologies et Applications (79), Sociologie rurale et Vulgarisation Agricole (79) et Hydrologie quantitative et Gestion intégrée des Ressources (76). Aucune donnée n’a été insérée pendant cette recette.

Limite importante : ces appels de recette utilisent des paramètres de comparaison et non des comptes candidats créés artificiellement. La recette finale doit utiliser au moins deux comptes réels autorisés, avec leurs profils, préférences et signaux académiques effectivement enregistrés, puis contrôler l’explication et le Top 3 affichés.
