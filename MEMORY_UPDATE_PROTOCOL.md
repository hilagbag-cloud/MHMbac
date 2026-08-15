# Protocole de mise à jour de la mémoire — MHMbac / BacPilot

Ce protocole transforme `PROJECT_MEMORY.md` en source de continuité réelle. Il s’applique à chaque changement de code, migration Supabase, Edge Function, extension, décision produit, clé/configuration, déploiement ou incident.

## Principe

> La mémoire de BacPilot vit dans le dépôt, pas seulement dans une conversation. Elle doit être relue au début, corrigée pendant le travail et versionnée à la fin.

Cette approche ne prétend pas remplacer les sauvegardes de Supabase, Vercel ou GitHub. Elle garantit en revanche que le contexte fonctionnel et les décisions ne sont pas perdus lors d’un changement d’agent ou de session.

## Routine de début de session

| Étape | Action obligatoire | Pourquoi |
|---:|---|---|
| 1 | Lire `PROJECT_MEMORY.md`. | Comprendre l’état confirmé, les règles et les priorités. |
| 2 | Lire `MEMORY_UPDATE_PROTOCOL.md`. | Appliquer les garde-fous de continuité. |
| 3 | Exécuter `git log -3 --oneline` et `git status --short`. | Identifier la dernière version et éviter d’écraser un travail non publié. |
| 4 | Vérifier l’URL de production si le changement touche le produit public. | Distinguer l’état en ligne de l’état local. |
| 5 | Lire seulement les sources directement liées à la demande. | Préserver l’attention sans oublier les décisions essentielles. |

## Événements qui imposent une mise à jour

| Événement | Sections à actualiser dans `PROJECT_MEMORY.md` |
|---|---|
| Nouvelle fonctionnalité web | État produit, état UI, journal, prochaines priorités. |
| Migration ou modification RLS | Architecture active, base et données, décisions non négociables, journal. |
| Déploiement / rollback | Déploiement et vérification, journal, dernier commit confirmé. |
| Modification Edge Function | Architecture active, état agent/IA, sécurité, journal. |
| Ajout, rotation ou révocation de clé | État agent/IA, sans jamais écrire la valeur de la clé. |
| Évolution extension | Architecture active, source de vérité, prochaines priorités, journal. |
| Bug important ou incident | État produit, risques / blocages, journal, prochaine action corrective. |
| Décision UX / vocabulaire | État UI, documents de référence, journal. |

## Format minimal d’une entrée de journal

Ajouter une ligne dans la section **« Journal de continuité »** avec :

| Date | Commit / état | Changement confirmé | Suite |
|---|---|---|---|
| AAAA-MM-JJ | `abcdef0` ou état non commit | Fait vérifiable, sans jargon ni secret. | La prochaine action concrète ou le test restant. |

Une entrée doit décrire **ce qui a réellement été fait**, et non une intention. Exemple acceptable : « `orientation-assistant` déployée avec JWT obligatoire ; appel anonyme refusé. » Exemple interdit : « Sécuriser l’agent. »

## Contrôle avant commit

Avant de livrer une évolution, vérifier les cinq questions suivantes.

1. **La mémoire reflète-t-elle le code et la production réellement testés ?**
2. **Le journal indique-t-il le commit ou l’état à venir, ainsi que le test restant ?**
3. **Les prochaines priorités sont-elles encore utiles, dans le bon ordre ?**
4. **Aucun secret, mot de passe, jeton, adresse personnelle ou donnée sensible n’a-t-il été ajouté ?**
5. **Le commit contient-il `PROJECT_MEMORY.md` si le changement est matériel ?**

Si l’une des réponses est non, la livraison est incomplète.

## Politique de confidentialité de la mémoire

| À inclure | À exclure absolument |
|---|---|
| Identifiants publics de projet, URLs publiques, noms de tables, architecture, états de déploiement, numéros de commit, décisions produit, limites fonctionnelles. | Clés API, mots de passe, JWT, jetons de synchronisation, valeurs `.env`, cookies, données de profil d’un candidat, e-mails privés non destinés au public, contenus conversationnels personnels. |

Pour un secret, la mémoire doit seulement indiquer son **statut**, par exemple : « clé Gemini absente », « nouvelle clé configurée dans Supabase », ou « clé exposée à révoquer ». Elle ne doit jamais indiquer sa valeur, même partiellement.

## Structure de dossier recommandée

```text
MHMbac/
├── PROJECT_MEMORY.md                 # état canonique vivant
├── MEMORY_UPDATE_PROTOCOL.md         # mode d’emploi obligatoire
├── ARCHITECTURE_*.md                 # décisions longues et schémas
├── CONFIGURATION_SECRETS_*.md        # procédures sans valeurs de secret
├── PRODUCTION_VERIFICATION_*.md      # preuves de recette
└── src/ / supabase/                  # code et migrations réels
```

## Règle de fin de session

Avant de terminer une session de travail :

1. Mettre à jour `PROJECT_MEMORY.md`.
2. Relire le diff de la mémoire avec `git diff -- PROJECT_MEMORY.md MEMORY_UPDATE_PROTOCOL.md`.
3. Ajouter ces fichiers au commit avec le code lié.
4. Pousser le commit si le code est publié.
5. Noter ce qui reste à tester, plutôt que de le présenter comme terminé.

## Limite honnête

Un agent conversationnel ne doit pas prétendre se souvenir de façon parfaite entre des environnements séparés. La garantie pratique provient du fait que la mémoire est **écrite, versionnée, relue et reliée au code**. C’est la règle de fonctionnement retenue pour BacPilot.
