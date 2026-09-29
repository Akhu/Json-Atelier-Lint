# Contribuer à JSON Atelier

Merci de garder les changements petits et faciles à vérifier. JSON Atelier est volontairement simple : un éditeur local, sans compte et sans service distant.

## Avant de commencer

- Vérifie qu'une issue similaire n'existe pas déjà.
- Ouvre une issue avant une modification importante de l'interface ou de l'architecture.
- Ne joins jamais de JSON contenant des données personnelles, médicales ou professionnelles sensibles.

## Développement local

```bash
npm ci
npm run electron:dev
```

Avant une pull request :

```bash
npm run check
```

Pour une modification visuelle, teste aussi l'application Electron empaquetée avec `npm run electron:pack`. Une capture avant/après aide à relire la pull request.

## Pull requests

- Décris le problème observable et la solution retenue.
- Ajoute ou adapte les tests quand la logique change.
- Garde les données dans l'application locale. Toute requête réseau doit être expliquée et discutée avant implémentation.
- N'inclus ni build `dist/`, ni DMG, ni credentials Apple.

En contribuant, tu acceptes que ton code soit distribué sous la licence MIT du projet.
