# Incident — rendu des fiches contributeurs

## Symptôme

La route publique d’une fiche contributeur affichait le document HTML comme texte brut, avec des caractères UTF-8 illisibles.

## Cause

Le HTML était fourni par une fonction externe. La passerelle de cette fonction transformait les réponses GET HTML en `text/plain` avec une politique de sandbox, même si les en-têtes déclarés par la fonction indiquaient `text/html`.

## Correction

Le rendu HTML est maintenant généré par une fonction Vercel locale. La fonction Supabase ne fournit plus au rendu que le JSON minimal des champs déjà consentis. Les réponses de fiche et de JSON sont désormais `no-store` : la nouvelle version évite la conservation d’un document obsolète et reflète immédiatement un retrait ou une mise à jour de consentement.

## Vérification

La réponse de production de `https://bacpilot.site/contributeurs-beta/hilarus-gbagoule` renvoie `Content-Type: text/html; charset=utf-8` et `Cache-Control: no-store, max-age=0, must-revalidate`. Une demande fraîche est interprétée correctement comme une page HTML avec accents UTF-8 et contenu structuré.

La fiche publiée de Hilarus GBAGOULE a été contrôlée à son URL officielle sans paramètre : elle se rend désormais comme une page normale, avec titre, contenu français lisible, photo et lien portfolio. Une URL inexistante rend également une page 404 HTML lisible, avec un lien de retour vers l’annuaire.
