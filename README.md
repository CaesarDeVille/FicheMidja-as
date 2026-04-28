# Fiche Midja'as

Version nettoyée et modularisée du projet.

## Structure

```text
index.html
css/
  style.css
js/
  app.js
  firebase-campagne.js
assets/
  favicon.png
README.md
```

## Lancer en local

Double-cliquer sur `index.html` suffit souvent.

Si certaines fonctions bloquent, lancer un petit serveur local :

```bash
python -m http.server 8000
```

Puis ouvrir :

```text
http://localhost:8000
```

## Notes de correction

- CSS séparé dans `css/style.css`.
- JavaScript principal séparé dans `js/app.js`.
- JavaScript Firebase/campagne séparé dans `js/firebase-campagne.js`.
- Favicon déplacé dans `assets/favicon.png`.
- Le titre de page est uniformisé : `Fiche Midja'as`.
- Les effets restent en italique dans l'inventaire/objets/magies.
- Les effets de l'infobulle clic droit sont affichés en texte normal.
- Les champs du cartouche peuvent s'élargir davantage.
