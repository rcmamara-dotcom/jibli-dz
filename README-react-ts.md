# JIBLI DZ — React + TypeScript (Create React App)

App France ⇄ Algérie (voyageurs ⇄ colis). Front **React + TypeScript** (Create React App),
back-end **Firebase** (Firestore + Auth e-mail + App Check).

## Lancer en local

```bash
npm install      # une seule fois (télécharge React, Firebase, react-scripts…)
npm start        # démarre le serveur de dev sur http://localhost:3000
```

`npm start` ouvre l'app sur `http://localhost:3000`. À chaque sauvegarde, la page se recharge.

## Structure

```
jibli-dz/
├── package.json
├── tsconfig.json
├── .gitignore
├── .github/workflows/deploy.yml   # build + déploiement auto
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── index.tsx        # point d'entrée
│   ├── App.tsx          # toute l'interface (composants)
│   ├── firebase.ts      # config Firebase + App Check
│   ├── types.ts         # types TypeScript (Trip, Parcel…)
│   └── styles.css
└── firestore.rules      # règles de sécurité (à coller dans la console Firebase)
```

## Mettre en ligne (GitHub Pages, build automatique)

1. Dépose le projet dans le dépôt (branche `main` ou `develop`).
2. **Settings → Pages → Source : GitHub Actions**.
3. À chaque push, l'action compile (`npm run build` → dossier `build/`) et déploie.
   Site : `https://rcmamara-dotcom.github.io/jibli-dz/`

> `homepage` dans `package.json` = `/jibli-dz` (doit correspondre au nom du dépôt).

## Réglages Firebase

- Config déjà dans `src/firebase.ts`.
- **App Check** : colle ta clé reCAPTCHA v3 dans `src/firebase.ts` (`RECAPTCHA_SITE_KEY`) pour l'activer.
- **Connexion** : autorise le domaine `rcmamara-dotcom.github.io` dans
  Firebase → Authentication → Settings → Authorized domains. `localhost` y est déjà.
