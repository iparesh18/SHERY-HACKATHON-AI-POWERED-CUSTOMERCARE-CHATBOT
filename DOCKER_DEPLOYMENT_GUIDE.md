# Docker & Deployment Guide

## ✅ What Was Created

1. **backend/Dockerfile** - Multi-stage build for backend (production-ready)
2. **frontend/Dockerfile** - Build and serve frontend
3. **docker-compose.yml** - Local Docker development (optional)
4. **backend/.dockerignore** - Excludes unnecessary files
5. **frontend/.dockerignore** - Excludes unnecessary files

---

## 🚀 Deployment to Render

### Backend → Render

**Step 1: Create Render Account**
- Go to [render.com](https://render.com)
- Sign up with GitHub

**Step 2: Create Web Service**
- Dashboard → New → Web Service
- Connect your GitHub repo
- Select your SHERY-HACKATHON repo

**Step 3: Configure Service**
- Name: `ai-support-backend`
- Environment: `Docker`
- Build Command: (leave empty - Render auto-detects Dockerfile)
- Start Command: (leave empty)
- Instance Type: `Free`

**Step 4: Set Environment Variables**
Click "Environment" tab, add these (copy values from your local `.env` file):

```
PORT=5000
MONGO_URI=YOUR_MONGO_CONNECTION_STRING
JWT_SECRET=YOUR_JWT_SECRET
JWT_REFRESH_SECRET=YOUR_JWT_REFRESH_SECRET
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GROQ_API_KEY=YOUR_GROQ_API_KEY
PINECONE_API_KEY=YOUR_PINECONE_API_KEY
PINECONE_INDEX_NAME=chatbot
PINECONE_NAMESPACE=support-bot
PINECONE_HOST=YOUR_PINECONE_HOST
REDIS_HOST=YOUR_REDIS_HOST
REDIS_PORT=18058
REDIS_PASSWORD=YOUR_REDIS_PASSWORD
COOKIE_SECURE=false
NODE_ENV=production
USE_GROQ_ONLY=false
```

**⚠️ IMPORTANT:** Copy the actual values from your local `.env` file, not these placeholders!

**Step 5: Deploy**
- Click "Create Web Service"
- Render auto-builds Docker image
- Deploys automatically ✅

**Get Backend URL:** Render will show URL like `https://ai-support-backend.onrender.com`

---

### Frontend → Render Static Site

**Step 1: Create Render Account**
- Go to [render.com](https://render.com)
- Sign up with GitHub

**Step 2: Import Project**
- Dashboard → New → Static Site
- Connect your GitHub repo
- Select your SHERY-HACKATHON repo

**Step 3: Configure**
- Framework: `Vite`
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

**Step 4: Environment Variables**
Add one variable:
```
VITE_API_URL=https://ai-support-backend.onrender.com/api
```
(Replace with your actual Render backend URL)

**Step 5: Deploy**
- Click Deploy
- Render builds automatically ✅

**Get Frontend URL:** Render shows URL like `https://your-app-name.onrender.com`

---

## ⚠️ IMPORTANT: Will `npm run dev` Still Work?

### YES! ✅ Absolutely!

**Your local development is UNCHANGED:**

```bash
# Backend (Local)
cd backend
npm run dev              # Still uses nodemon ✅

# Frontend (Local, another terminal)
cd frontend
npm run dev             # Still uses Vite dev server ✅
```

**Why?**
- Docker files are ONLY for Render deployment
- They don't affect your local `npm run dev`
- Local development ignores Docker completely

---

## 📊 Summary: What Happens Where

| Action | Local Dev | Render |
|---|---|---|
| `npm run dev` | ✅ Works normally | N/A |
| Docker build | ❌ Not used | ✅ Auto-builds |
| Code changes | Local file | Git push → Auto-rebuild |
| Env changes | .env file | Render Dashboard |

---

## 🔄 Update Workflow After Deployment

**Scenario: You change backend code**

```
1. Edit backend/src/controllers/chat.controller.js
2. Test locally: npm run dev (works!)
3. Push to GitHub: git push
4. Render: Auto-detects push → Rebuilds Docker → Deploys (2-3 min)
5. Live app updates ✅
GitHub: No conflict!
```

**Scenario: You need to update API key**

```
1. Go to Render Dashboard → Environment
2. Change GEMINI_API_KEY value
3. Save
4. App updates instantly ✅
GitHub: No changes needed!
```

---

## 🎯 Quick Checklist

- [x] Dockerfile created for backend
- [x] Dockerfile created for frontend
- [x] .dockerignore files created
- [ ] Push to GitHub
- [ ] Create Render account & set up backend
- [ ] Create Vercel account & set up frontend
- [ ] Get URLs and test
- [ ] Continue using `npm run dev` locally ✅

---

## ❓ FAQ

**Q: Will Docker break my `npm run dev`?**
A: No! Docker is only for deployment. Local dev is unchanged.

**Q: What if I change .env?**
A: Update variables on Render Dashboard, not in GitHub.

**Q: How often will apps update?**
A: Within 2-3 minutes of pushing to GitHub (automatic).

**Q: Can I still run PM2 locally?**
A: Yes! Use `npm run start:pm2` alongside Docker deployment.

**Q: What if Render free tier goes down?**
A: Save to another free option (Railway.app, Heroku, etc.)

---

## 🚀 You're Ready!

Your app is now ready for production deployment with zero conflicts with local development. Start with the Render setup first, then Vercel.

Need help with any step? Ask! 💪
