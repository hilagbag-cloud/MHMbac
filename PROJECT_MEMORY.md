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
| Dernier commit confirmé | `866f61b` — jeton de synchronisation placé exclusivement dans le corps JSON |
| Projet Vercel canonique | `hila2/mhmbac` |
| Projet Supabase | `mhm-solutions-mvp1` — ref `uxdfrnogiuefoqjpobpf` |
| Date de cette mémoire | 15 août 2026 |

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
```

| Composant | Rôle | Règle de sécurité |
|---|---|---|
| Extension Chrome officielle | Avant toute collecte ou reprise, enregistrer le jeton localement puis lancer automatiquement un prévol serveur. Les scans restent bloqués jusqu’au résultat « Test validé ». Le contrôleur de console vérifie maintenant tous les éléments requis avant d’attacher les boutons, affiche un message lisible si des fichiers de versions différentes sont mélangés et conserve le feedback pendant les actualisations. Chaque action attend l’initialisation de `chrome.storage.local` pour empêcher qu’un enregistrement initial soit écrasé. Le jeton est ajouté uniquement au corps JSON au moment de l’envoi, jamais aux lots locaux ni à un en-tête HTTP. | Ne contourne ni authentification, ni CAPTCHA, ni contrôle d’accès. Pas de profil candidat, score, import ou soumission de choix. La fermeture de la console ne doit jamais supprimer les progrès sauvegardés. |
| `mhmbac-sync` | Prévalider le jeton et l’accès serveur sans écriture, puis normaliser et écrire les observations collectées. | Jeton de synchronisation dédié lu exclusivement depuis `syncToken` dans le corps JSON ; aucun en-tête de jeton n’est accepté. Le prévol ne lit qu’un identifiant de programme et ne crée aucune observation. |
| Supabase | Stocker observations, profils, sessions et résultats. | RLS active ; droits privés limités au propriétaire. |
| `orientation-assistant` | Lire les données autorisées, appeler le score déterministe, sauvegarder seulement les réponses du candidat connecté, expliquer un résultat. | JWT requis ; pas de SQL libre, pas de `service_role`, outils bornés. |
| React / Vercel | Afficher le parcours et les résultats. | Aucune clé IA ou clé d’administration dans `VITE_*`, GitHub ou le navigateur. |

## 4. Décisions non négociables

1. **Aucune donnée fictive en production.** Les pistes, facteurs, scores et fraîcheurs proviennent d’observations réelles disponibles dans Supabase.
2. **Score déterministe.** L’IA ne calcule pas le classement et n’invente ni filière, ni chiffre, ni admission. Elle reformule seulement un résultat déjà calculé.
3. **Agent en lecture.** L’agent lit uniquement les observations/catalogues autorisés. Il écrit exclusivement le profil, les préférences, les signaux volontaires et la session du candidat authentifié.
4. **RLS propriétaire.** Toute écriture et toute lecture privée reposent sur `auth.uid()` ; aucun `user_id` fourni par le client ne doit définir un accès.
5. **Validation humaine.** Aucune auto-soumission sur le portail officiel.
6. **États transparents.** Les messages tels que « Dernière mise à jour des données » ou « Comparaison selon ton profil » correspondent à des opérations réellement réalisées.
7. **IA facultative.** BacPilot reste utilisable sans clé IA : une explication déterministe est toujours disponible.
8. **Secrets hors dépôt.** Les clés ne sont jamais enregistrées dans les fichiers, commits, journaux, slides ou mémoire projet.

## 5. État de l’agent et de l’IA

| Élément | État confirmé | Détail |
|---|---|---|
| Edge Function `orientation-assistant` | Déployée et protégée | `verify_jwt = true` ; un appel sans JWT a été refusé. |
| Moteur Top 3 | Déployé | Classement côté Supabase à partir des observations réelles et de l’objectif candidat. |
| Quota IA | Déployé | Maximum de trois reformulations IA réussies par candidat et par jour ; repli déterministe. |
| Gemini | Intégration prête, **clé non configurée** | Principal pour reformulation courte. |
| Groq | Intégration prête, **clé non configurée** | Secours unique si Gemini échoue. |
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
| 1 | Réactiver la synchronisation des quatre lots conservés par l’extension officielle. | La console affiche un accusé de réception ; `sync_batches` et `collection_runs` reçoivent une trace nouvelle ; les compteurs et horodatages Supabase progressent. |
| 2 | Configurer de nouvelles clés Gemini/Groq dans les secrets Supabase si la reformulation IA est souhaitée. | Test connecté d’une explication IA, puis vérification du quota et du repli. |
| 3 | Réaliser une recette connectée complète du dashboard Preuves & Top 3. | Vérifier les trois pistes réelles, les facteurs, le changement d’objectif et la question libre. |
| 4 | Réaliser une recette réelle de l’extension officielle `extensions/bacpilot-official/`. | Une session autorisée confirme la couverture collectée, la reprise après fermeture, l’accusé `mhmbac-sync` et l’exploitation de `collection_runs` côté backend. |
| 5 | Intégrer ultérieurement le guide officiel avec extraits sourcés. | Aucune recommandation issue du guide sans source affichable. |
| 6 | Évaluer les embeddings seulement après disponibilité d’un corpus officiel propre et consentement sur les données utilisées. | Recherche sémantique sourcée, sans modifier le scoring déterministe. |
| 7 | Lancer l’acquisition organique BacPilot avec le kit Jour 1. | Publication validée explicitement, lien UTM correct et relevé des résultats à +2 h / +24 h. |
| 8 | Publier le message Assomption BacPilot du 15 août 2026. | Post de vœux non commercial, réponse sobre aux interactions, sans CTA produit. |
| 9 | Mettre à jour les liens publics, bios et UTM pour utiliser `https://bacpilot.site`. | Les supports de lancement pointent vers le domaine principal et non vers l’ancienne URL Vercel. |
| 10 | Contrôler l’état d’indexation et les performances organiques dans Google Search Console. | L’accueil est sélectionné par Google comme URL canonique/indexée et les requêtes, impressions et éventuelles erreurs sont suivies. |
| 11 | Configurer le profil Facebook BacPilot existant. | Bio, lien, message Messenger et visuels prêts ; connexion au compte Facebook requise. |
| 12 | Vérifier la réception et l’envoi réels des boîtes `contact@bacpilot.site` et `support@bacpilot.site`, puis activer DKIM/DMARC si LWS les propose. | Un message de test entrant et sortant est confirmé pour chaque boîte ; SPF/DKIM/DMARC sont documentés sans secret. |

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
| 15 août 2026 | Portail `beta.bacpilot.site` validé et déployé | Ajout de la page hôte dédiée, de `/beta-access` sur le domaine principal et des redirections de connexion/inscription avec conservation de l’intention bêta. Une session Supabase est vérifiée côté serveur via `beta_testers`, puis le compte actif est envoyé vers `/beta`; sans statut actif, l’accès est refusé avec message explicite. Le CNAME LWS `beta` est validé par Vercel pour `mhmbac`; `https://beta.bacpilot.site` répond en HTTPS et affiche le portail. Les balises `noindex, nofollow` sont injectées dans le document pour le portail et le contrôle d’accès. | Enrôler un premier compte bêta, puis effectuer la recette autorisée/refusée et l’envoi d’un retour privé. |

## 11. Règle de reprise de session

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
