# Vérification du carrousel d’annonces BacPilot

- Les cinq visuels WebP sont rendus dans le carrousel sur l’accueil local.
- Le premier visuel est visible immédiatement, sans image manquante. La transition vers le second visuel fonctionne par la commande « annonce suivante ».
- Le clic sur l’appel à l’action du deuxième visuel ouvre correctement la route interne `/methodologie`.
- Le carrousel expose des contrôles accessibles : indicateurs par slide, précédent, suivant, pause/reprise et libellés explicites.
- Les actifs WebP totalisent environ 160 Ko pour les cinq visuels, contre environ 18 Mo pour les sources PNG, avec réduction sans recadrage.
Le 18 août à 08:42, la prévisualisation locale a avancé automatiquement de l’annonce 1 à l’annonce 2 après le délai de 6,5 secondes, sans clic ni interaction utilisateur. La transition horizontale est visible et le bouton de pause indique que la lecture automatique est active.
Après publication de la branche GitHub, deux vérifications consécutives de `https://bacpilot.site/` montrent encore la bannière de parrainage historique. Le déploiement public n’était donc pas encore propagé au moment des contrôles ; la version locale validée reste fonctionnelle et automatique.
Après correction de la pause au survol/focus, la prévisualisation locale affiche le contrôle « Mettre le défilement automatique en pause » et passe effectivement du visuel 1 au visuel 2 sans clic. Ce contrôle confirme que le défilement est actif par défaut et ne s’arrête qu’avec le bouton explicite.
Déploiement final confirmé sur `https://bacpilot.site` via `https://mhmbac-mdr11u331-hila2.vercel.app` le 18 août. Après initialisation, l’accueil affiche le carrousel WebP et avance automatiquement du visuel 1 au visuel 2 sans clic ; le contrôle indique que le défilement est actif par défaut.
