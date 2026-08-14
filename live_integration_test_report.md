# Rapport de test live MHMbac

## Date du contrôle

Contrôle effectué le 14 août 2026 dans la session navigateur connectée.

## Résultats

| Élément | Résultat | Observation |
|---|---|---|
| Session officielle apresmonbac.bj | Réussi | Page `/Home/choice` accessible, utilisateur connecté, série D visible et jauges affichées sur les choix. |
| Extension Chrome | Non vérifiée par clic direct | La connexion de contrôle du navigateur s’est interrompue au moment d’ouvrir les pages internes Chrome. Un scan réel depuis la popup reste à lancer. |
| Migration Supabase live | Réussi | Les tables live et colonnes de score existent ; aucune ligne live n’était présente lors de la dernière vérification. |
| Site public MHMbac | Accessible | `https://mhmbac.vercel.app` répond correctement et affiche l’interface publique. |
| Source des cartes visibles | Non live | Le code `src/pages/HomePage.tsx` importe `DEMO_PROGRAMMES` et appelle `rankProgrammes`; aucune requête `live_programmes` ni souscription `supabase.channel` n’est présente dans le frontend actuel. |
| Affichage Realtime | Non raccordé | Les textes « temps réel » et les dates affichées sont présentés, mais le frontend actuel ne consomme pas encore les tables live. |

## Conclusion

Le site est en ligne et visuellement prêt, mais le circuit complet n’est pas encore opérationnel. La page publique affiche encore le classement de démonstration `DEMO_PROGRAMMES`, pas les relevés envoyés par l’extension. Le raccordement final doit ajouter une couche de lecture Supabase sur `live_programmes`, une souscription Realtime, un état de fraîcheur et la séparation explicite entre données observées et données de démonstration.

La prochaine collecte réelle devra suivre : extension sur la page officielle → `POST mhmbac-sync` → écriture `live_programmes` → lecture du site public. Tant que cette collecte n’a pas été réalisée et que le frontend n’a pas été modifié, il est incorrect d’affirmer que les statistiques du site sont en temps réel.
