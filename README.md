# 日本語 Révisions — Guide de déploiement

## Déploiement sur Vercel (gratuit, 5 minutes)

### Étape 1 — Créer un compte GitHub
Si tu n'en as pas : https://github.com/signup

### Étape 2 — Créer un nouveau dépôt
1. Va sur https://github.com/new
2. Nom du dépôt : `jp-tracker` (ou ce que tu veux)
3. Laisse-le **Public**
4. Clique **Create repository**

### Étape 3 — Uploader les fichiers
Dans ton nouveau dépôt, clique **"uploading an existing file"** et dépose :
- `package.json`
- `vite.config.js`
- `index.html`
- le dossier `src/` (avec `main.jsx` et `App.jsx`)
- le dossier `public/` (avec `manifest.json`, `icon-192.png`, `icon-512.png`)

Clique **Commit changes**.

### Étape 4 — Déployer sur Vercel
1. Va sur https://vercel.com et connecte-toi avec GitHub
2. Clique **"Add New Project"**
3. Sélectionne ton dépôt `jp-tracker`
4. Vercel détecte Vite automatiquement — clique **Deploy**
5. Après ~1 minute, tu obtiens une URL du type : `jp-tracker-xxx.vercel.app`

Tu peux personnaliser l'URL dans les settings Vercel (ex: `japonais-emma.vercel.app`).

---

## Installer comme app sur iPhone / iPad

1. Ouvre l'URL dans **Safari** (pas Chrome !)
2. Appuie sur le bouton **Partager** ↑
3. Sélectionne **"Sur l'écran d'accueil"**
4. Nom : `日本語` ou `Révisions JP`
5. **Ajouter** ✓

L'app s'ouvre alors en plein écran, sans barre Safari, comme une vraie appli native !

---

## Développement local (optionnel)

```bash
npm install
npm run dev
```

Ouvre http://localhost:5173
