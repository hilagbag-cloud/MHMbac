# Directions UI pour l’agent BacPilot

## Conclusion de recherche

L’interface BacPilot ne doit pas imiter un chatbot généraliste. Elle doit rendre une décision d’orientation **compréhensible, vérifiable et contrôlée**. Les références étudiées convergent vers quatre principes utiles : une conversation courte et progressive, des états de travail correspondant à des actions réelles, une divulgation progressive de la méthode et une validation humaine explicite.[1] [2] [3]

> Pour BacPilot, le meilleur signal de confiance n’est pas une longue « réflexion » affichée ; c’est une preuve simple : date de l’observation, règles appliquées, limites connues et rappel que l’élève valide lui-même sur le portail officiel.

| Principe à garder | Traduction BacPilot |
|---|---|
| Conversation sobre | Une question précise, une réponse courte, un champ de réponse stable. |
| Transparence utile | « Vérification de la dernière synchronisation », « Lecture des observations disponibles », « Calcul du Top 3 » : uniquement des étapes réellement exécutées. |
| Preuve et incertitude | Fraîcheur, facteurs du score, niveau de confiance et bouton « Voir les facteurs ». |
| Contrôle candidat | Aucun choix automatique ; rappel de validation manuelle et profil modifiable. |
| Divulgation progressive | L’élève voit d’abord le Top 3 ; le détail de la méthode n’apparaît qu’à sa demande. |

## Direction A — Cockpit conversation

![Direction A — Cockpit conversation](design-directions/direction-a-cockpit-conversation.png)

Cette direction est un poste de pilotage sombre, orienté conversation. Le fil central conserve l’attention sur l’agent, tandis qu’un panneau latéral présente la fraîcheur des données et une preuve discrète de ce qui a été consulté. Elle s’inspire de la sobriété de ChatGPT et de la transparence opérationnelle de Perplexity.

| Atouts | Vigilances |
|---|---|
| Très crédible pour un produit « agent », bon équilibre entre chat, profil et données. | Peut sembler dense sur téléphone ; la barre latérale doit devenir un tiroir mobile. |
| Convient au dialogue libre après le Top 3. | À alléger en masquant les éléments non essentiels au premier usage. |

## Direction B — Parcours guidé chaleureux

![Direction B — Parcours guidé chaleureux](design-directions/direction-b-guidee-chaleureuse.png)

Cette direction privilégie l’onboarding : une seule question à la fois, des réponses rapides visibles et une colonne « Pourquoi je demande cela ». Elle fait du premier contact une conversation pédagogique, calme et rassurante.

| Atouts | Vigilances |
|---|---|
| La plus accessible pour un nouveau bachelier ; idéale pour obtenir un profil complet sans fatigue. | Moins puissante pour consulter longuement les données ou poser des questions libres. |
| Le bénéfice de chaque question est explicite et renforce la confiance. | Nécessite une page de résultat distincte et plus dense ensuite. |

## Direction C — Preuves et Top 3

![Direction C — Preuves et Top 3](design-directions/direction-c-preuves-top3.png)

Cette direction place le résultat au premier plan : les trois pistes occupent l’espace principal et le fil de conversation sert à demander des précisions. Le panneau « Ce que BacPilot a vérifié » constitue le reçu de décision.

| Atouts | Vigilances |
|---|---|
| La plus fidèle à la promesse « données réelles, pas de promesse » ; excellente après personnalisation. | Peut impressionner au premier contact si elle remplace entièrement un onboarding chaleureux. |
| Le meilleur format pour comparer, expliquer et préparer la validation manuelle. | Doit utiliser les vrais noms et facteurs remontés par Supabase, jamais du contenu fictif. |

## Recommandation

Je recommande un **hybride B → C** : Direction B pour le parcours de questions, puis Direction C pour la restitution et les explications. La Direction A peut ensuite servir de surface « conversation continue » lorsque l’élève revient sur BacPilot.

Cette progression donne trois bénéfices : l’entrée reste simple, le Top 3 devient immédiatement vérifiable, et le chat conserve sa place sans cacher la méthode.

## Références

[1]: https://aiuxplayground.com/patterns/ — *AI/UX Playground, AI UX Patterns*.
[2]: https://www.smashingmagazine.com/2026/05/practical-interface-patterns-ai-transparency/ — *Smashing Magazine, Practical Interface Patterns For AI Transparency*.
[3]: https://www.perplexity.ai/hub/use-cases/designing-ai-agent-interaction-patterns — *Perplexity Hub, Design AI agent interaction patterns*.
