# Vérification de production — BacPilot

**Date de contrôle :** 15 août 2026

La page publique `https://mhmbac.vercel.app` répond avec le titre **« BacPilot — par MHM SOLUTIONS »**. Le bouton principal affiche désormais **« Parler à BacPilot »**. Les trois étapes publiques décrivent une conversation guidée, l’analyse des observations et le maintien de la validation manuelle par le candidat.

Le flux public affiche des observations disponibles avec un indicateur de fraîcheur et une connexion temps réel. Le bloc futur indique que l’assistant explique déjà les scores issus des observations synchronisées et que le guide officiel sera intégré ultérieurement avec sources. Le pied de page ne décrit plus les données comme des démonstrations : il rappelle qu’elles sont indicatives, synchronisées et sans garantie d’admission ou de bourse.

La vérification de l’Edge Function `orientation-assistant` sans en-tête `Authorization` a reçu la réponse `UNAUTHORIZED_NO_AUTH_HEADER`, confirmant que l’accès anonyme est refusé avant traitement.

Le bouton public « Parler à BacPilot » mène à `/onboarding`. Sans session active, cette page affiche explicitement que la connexion est requise et précise que les réponses sont stockées uniquement dans l’espace personnel, sans modification des observations collectées.
