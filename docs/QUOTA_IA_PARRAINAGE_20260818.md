# Quota quotidien de l’assistant et déblocage par parrainage

## Règle publiée

BacPilot accorde **trois utilisations d’assistance IA par jour** à chaque compte. Lorsque cette limite est atteinte, l’assistant renvoie maintenant un statut `quota_exhausted` au lieu d’une réponse de secours ambiguë.

Le déblocage repose uniquement sur `public.user_referrals`, la table qui associe un filleul à un seul parrain lors d’une création de profil réelle. Chaque inscription attribuée au lien personnel accorde **une utilisation quotidienne supplémentaire**. Le bonus est plafonné à trois, soit une limite maximale de **six utilisations d’assistance IA par jour**.

| Invitations réellement attribuées | Limite quotidienne | Explications restantes après 3 utilisations |
|---:|---:|---:|
| 0 | 3 | 0 |
| 1 | 4 | 1 |
| 2 | 5 | 2 |
| 3 ou plus | 6 | 3 |

## Comportement candidat

Quand la limite est atteinte, le tableau de bord indique le compteur réellement atteint, la réinitialisation le lendemain, le nombre de bonus déjà obtenus et le nombre d’invitations attribuées. Le champ de question est désactivé et un bouton **« Partager mon lien »** redirige vers `/parrainage`.

Aucun partage seul, clic, code saisi ou auto-parrainage ne produit de bonus : seule une inscription effectivement rattachée dans `user_referrals` augmente la limite. La consommation est calculée côté serveur dans les procédures SQL `get_ai_quota_status()` et `consume_ai_quota()` ; la table de comptage reste inaccessible directement aux candidats.

## Vérifications effectuées

La migration `20260818_referral_ai_quota_unlock.sql` a été appliquée à Supabase. Les scénarios de calcul suivants ont été vérifiés sans créer de compte ni modifier de données de production : deux utilisations sans parrainage laissent une utilisation ; trois utilisations sans parrainage bloquent l’assistant ; trois utilisations avec une inscription attribuée laissent une quatrième utilisation.
