# JIBLI DZ — version React (Vite + Firebase)

App France ⇄ Algérie pour mettre en relation voyageurs et expéditeurs de colis.
Front-end **React** (compilé par **Vite**), back-end **Firebase** (Firestore + Auth e-mail + App Check).

## Mise en ligne sur GitHub Pages (build automatique)

Tu n'as **pas besoin d'installer Node** : une GitHub Action compile et déploie toute seule.

### 1. Déposer les fichiers dans le dépôt `jibli-dz`
Mets **tout le contenu de ce dossier** à la racine du dépôt, en gardant la structure :

```
jibli-dz/
├── index.html
├── package.json
├── vite.config.js
├── .gitignore
├── .github/workflows/deploy.yml
├── public/manifest.json
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── firebase.js
    └── styles.css
```

> Important : ne committe PAS `node_modules` ni `dist` (le `.gitignore` s'en charge).
> Le dossier `.github` (avec le workflow) doit bien être présent — c'est lui qui compile.

### 2. Régler GitHub Pages sur « GitHub Actions »
Dépôt → **Settings → Pages** → section **Build and deployment** →
**Source : GitHub Actions** (et NON « Deploy from a branch »).

### 3. Lancer le déploiement
Fais un commit (ou onglet **Actions** → lance « Deploy JIBLI DZ to GitHub Pages »).
La 1re fois prend 1–2 min. Ensuite, ton site est sur :
`https://rcmamara-dotcom.github.io/jibli-dz/`

### 4. En cas d'erreur
Onglet **Actions** → clique sur le run en rouge → ouvre l'étape `npm run build`.
Le message d'erreur y est affiché ; copie-le pour diagnostic.

## Réglages importants

- **base** dans `vite.config.js` = `/jibli-dz/` (doit correspondre au nom du dépôt).
- **Firebase** : ta config est déjà dans `src/firebase.js`.
- **App Check** : colle ta clé reCAPTCHA v3 dans `src/firebase.js` (variable `RECAPTCHA_SITE_KEY`) quand tu veux l'activer.
- **Domaine autorisé** pour la connexion : `rcmamara-dotcom.github.io` dans Firebase → Authentication → Settings → Authorized domains.

## Développer en local (optionnel, si tu installes Node un jour)

```bash
npm install
npm run dev      # serveur de développement
npm run build    # compile dans dist/
```
