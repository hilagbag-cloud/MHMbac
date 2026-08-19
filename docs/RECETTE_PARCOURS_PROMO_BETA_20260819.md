# Recette du parcours promotionnel bêta

L’aperçu local montre la première étape du parcours dans une fenêtre horizontale, correctement centrée au-dessus de l’accueil. L’image WebP conserve une bonne lisibilité après compression et le bouton **Continuer** est visible avec le bouton **Fermer**.

Le passage à la deuxième image a été testé. La progression passe de `1 / 3` à `2 / 3`, le contenu de l’exemple public de l’annuaire est visible dans le visuel et le bouton **Continuer** reste disponible. Le parcours ne s’appuie sur aucune donnée privée et les images sont servies depuis `/campaign/`.

L’étape finale a été testée : elle présente distinctement **Vérifier mon éligibilité** et **Rejoindre le bêta test**. Le second bouton pointe bien vers `https://beta.bacpilot.site`, destiné aux nouveaux visiteurs. La fermeture a aussi été testée depuis cette étape : la fenêtre disparaît immédiatement et l’accueil reste utilisable.
