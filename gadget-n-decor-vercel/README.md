# Gadget N Decor — Vercel Deploy Guide

## Project Structure

```
gadget-n-decor/
├── index.html
├── product.html
├── checkout.html
├── css/style.css
├── js/script.js          ← API URL injected at build time
├── images/
├── build.js              ← Build script (injects env vars)
├── vercel.json           ← Vercel configuration
├── package.json
├── .env.example          ← Safe template (commit this)
├── .env.local            ← Your real secrets (DO NOT commit)
└── .gitignore
```

---

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/gadget-n-decor.git
git push -u origin main
```

### 2. Add Environment Variable on Vercel

1. Go to [vercel.com](https://vercel.com) → Import your repo
2. In **Project Settings → Environment Variables**, add:

   | Name | Value |
   |------|-------|
   | `VITE_SHEET_URL` | `https://script.google.com/macros/s/AKfycb.../exec` |

3. Set it for **Production**, **Preview**, and **Development**

### 3. Deploy

Vercel will automatically run `node build.js` which injects the API URL into `js/script.js` before serving the site.

---

## Local Development

```bash
# Copy the example env file and fill in the real URL
cp .env.example .env.local
# Edit .env.local with your actual SHEET_URL

# Run the build locally to inject the env var
node -e "require('dotenv').config({path:'.env.local'})" -e "require('./build.js')"

# Then open index.html in a browser (or use Live Server)
```

---

## Security Notes

- `.env.local` is in `.gitignore` — it will **never** be pushed to GitHub
- `.env.example` is safe to commit — it contains no real secrets
- The API URL is embedded at **build time** (server-side), not exposed in source control
