# Vérification locale — dialogue de clôture

L’accueil local affiche bien une boîte de dialogue compacte « BacPilot · clôture 2026 » avec le texte d’invitation à découvrir le bilan.

Le dialogue contient deux actions : « Lire le bilan », qui ferme le dialogue puis navigue vers `/bilan-cloture-orientation-2026`, et « Plus tard », qui ferme le dialogue.

La fermeture écrit la clé `bacpilot_cloture_bilan_dialog_seen_v1` dans `localStorage`, afin de ne pas réafficher le dialogue lors des visites suivantes sur le même navigateur. La touche Échap permet également la fermeture.

L’ancienne présentation en plusieurs slides promotionnelles bêta n’est plus rendue par ce composant.
