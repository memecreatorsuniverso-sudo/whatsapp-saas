# Deploy WhatsApp SaaS to Railway

## Step-by-Step Deployment Guide

### Prerequisites

- Domain/GitHub account
- Railway account (free at railway.app)
- Node.js project ready (whatsapp-saas with server.js)

### Method 1: Railway CLI

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Create new project
railway init

# 4. Link to your project
cd whatsapp-saas
railway link

# 5. Deploy
railway up

# 6. View logs
railway logs

# 7. Get URL
railway open
```

### Method 2: Railway Dashboard

1. Go to https://railway.app
2. Click **"New Project"**
3. Choose **"Deploy from GitHub"**
4. Select your `whatsapp-saas` repository
5. Railway auto-detects Node.js
6. Click **"Deploy"**
7. Set environment variables:
   ```
   PORT=3000
   NODE_ENV=production
   ```
8. Your API is live at `https://your-project.railway.app`

### Method 3: Connect GitHub (Recommended)

1. Push code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/whatsapp-saas.git
   git push -u origin main
   ```

2. On Railway:
   - New Project → Deploy from GitHub
   - Select your repo
   - Auto-deploys on every push

### Verify Deployment

```bash
# Check health
curl https://your-project.railway.app/health

# Should return:
# {"status":"ok","uptime":123.45}
```

### View API in Action

Once deployed, visit:
```
https://your-project.railway.app/api/qr/testuser
```

This generates a QR code JSON response.

### Environment Variables on Railway

Add via Dashboard:
1. Go to your project settings
2. **"Variables"** section
3. Add:
   - `PORT` = `3000`
   - `NODE_ENV` = `production`
   - `API_KEY` = (optional, for security)

### Persistence

WhatsApp auth sessions stored in `./auth/{userId}/` are preserved across deploys on Railway.

### Cost

Railway free tier:
- 500 hours/month
- Perfect for testing
- Paid plans start at $5/month

### Troubleshooting

**Deploy failed?**
```bash
railway logs  # See error details
railway shell  # Access container
npm install  # Ensure deps
```

**App crashes?**
- Check logs: `railway logs`
- Ensure `server.js` exists
- Verify `node server.js` works locally

**Need more resources?**
- Upgrade Railway plan
- Or deploy to Heroku: `git push heroku main`

### Next: Production Setup

1. Add custom domain
2. Enable auto-deploys
3. Set up error monitoring
4. Add rate limiting
5. Implement authentication

---

Your WhatsApp SaaS is now live! 🎉
