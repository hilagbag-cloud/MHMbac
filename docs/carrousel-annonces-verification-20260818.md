# Vérification du carrousel d’annonces BacPilot

- Les cinq visuels WebP sont rendus dans le carrousel sur l’accueil local.
- Le premier visuel est visible immédiatement, sans image manquante. La transition vers le second visuel fonctionne par la commande « annonce suivante ».
- Le clic sur l’appel à l’action du deuxième visuel ouvre correctement la route interne `/methodologie`.
- Le carrousel expose des contrôles accessibles : indicateurs par slide, précédent, suivant, pause/reprise et libellés explicites.
- Les actifs WebP totalisent environ 160 Ko pour les cinq visuels, contre environ 18 Mo pour les sources PNG, avec réduction sans recadrage.
Le 18 août à 08:42, la prévisualisation locale a avancé automatiquement de l’annonce 1 à l’annonce 2 après le délai de 6,5 secondes, sans clic ni interaction utilisateur. La transition horizontale est visible et le bouton de pause indique que la lecture automatique est active.
