# Railway Deployment Guide

## Quick Setup Steps

### 1. Sign Up for Railway

- Go to https://railway.app
- Sign up with GitHub
- Get $5 free credit (500 hours)

### 2. Create New Project

- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose `college-connect-v2`

### 3. Configure Environment Variables

Add these in Railway dashboard:

```
NGROK_AUTH_TOKEN=your_ngrok_token_here
MONGODB_URI=your_mongodb_connection_string
# ... copy all other vars from .env.local
```

### 4. Deploy!

- Railway auto-detects Dockerfile
- Builds with Chrome included
- Deploys automatically

### 5. Access Your App

- Railway gives you a URL like: `https://college-connect-production.up.railway.app`
- Remote browser will work!

## Cost

- Free: 500 hours/month (~$5 credit)
- After: ~$5-10/month
- Includes: Full Puppeteer + automatic deploys

## Next Steps

1. Sign up: https://railway.app
2. Connect GitHub
3. Add environment variables
4. Watch it deploy! 🚀
