# Spécification UI — BacPilot « Preuves & Top 3 »

## Direction visuelle

L’interface de résultat adopte une composition **conversation + preuves + Top 3**. Elle utilise un fond graphite bleuté, des séparateurs fins, un accent ambre réservé à la première piste et des états verts uniquement pour les éléments réellement confirmés. Le résultat doit donner l’impression d’un **reçu de décision**, et non d’un tableau de bord opaque.

Sur ordinateur, la conversation et le reçu de calcul occupent la colonne gauche ; les trois pistes occupent la colonne principale. Sur mobile, l’ordre devient : résumé, pistes, « ce que BacPilot a vérifié », puis question à l’assistant.

## Vocabulaire candidat

| Terme technique à éviter | Formulation BacPilot |
|---|---|
| Agent / modèle | BacPilot |
| Dataset / base de données | Données observées |
| Realtime | Données qui se mettent à jour |
| Score algorithmique | Indicateur BacPilot |
| Reasoning / thinking | Ce que BacPilot a vérifié |
| Confidence | Niveau de fraîcheur des données |
| Fallback | Explication fondée sur les données disponibles |
| RPC / synchronisation | Dernière mise à jour des données |
| Sélection | Retenir comme piste |

## Structure du dashboard

1. **En-tête de confiance** : salutation, série, mention, objectif et lien « Modifier mon parcours ».
2. **Bandeau d’objectif** : « Ce que tu veux privilégier » avec Bourse, Carrière, Équilibre.
3. **Colonne de preuves** : conversation courte, date de dernière mise à jour, étapes réelles terminées et lien « Voir comment les pistes sont comparées ».
4. **Top 3** : « Tes 3 pistes à vérifier », avec Piste 1 mise en avant sans promesse d’admission.
5. **Chaque piste** : université, école, filière, indicateur BacPilot, facteurs observés, fraîcheur, action « Retenir cette piste » et rappel de validation manuelle.
6. **Question libre** : « Poser une question à BacPilot » ; elle sert uniquement à expliquer le résultat calculé.
7. **Données complètes** : section secondaire « Toutes les filières observées » pour explorer sans masquer l’origine temps réel.

## Règles de confiance

- N’afficher une coche que si l’étape correspond à une opération réellement effectuée par l’Edge Function.
- Ne jamais dire « admis », « garanti » ou « sûr ».
- Préférer « à vérifier », « selon les données observées » et « tu gardes le dernier mot ».
- Ne pas exposer le raisonnement interne d’un modèle ou les noms de tables / fonctions. Les facteurs de calcul restant utiles sont présentés en langage naturel.
- Une mise à jour ancienne doit être signalée avec une formulation neutre, jamais cachée.

## Microcopies essentielles

> **Titre du résultat :** Tes 3 pistes à vérifier.
>
> **Reçu :** Ce que BacPilot a vérifié.
>
> **Étapes :** Dernière mise à jour des données ; Filtrage des filières observées ; Comparaison selon ton profil et ton objectif.
>
> **Action :** Retenir cette piste.
>
> **Garde-fou :** BacPilot te propose des pistes. Tu vérifies et tu valides toi-même sur le portail officiel.
