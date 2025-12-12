# Deploy to Render - Step by Step Guide

## Step 1: Sign Up for Render

1. Go to: **https://render.com**
2. Click **"Get Started"**
3. Sign up with **GitHub**
4. Authorize Render to access your repositories

## Step 2: Create a New Web Service

1. From Render Dashboard, click **"New +"** button
2. Select **"Web Service"**
3. Connect your repository:
   - Find and select: `ankit3890/college-connect-v2`
   - Click **"Connect"**

## Step 3: Configure the Service

### Basic Settings:

- **Name:** `college-connect` (or whatever you prefer)
- **Region:** Choose closest to you (e.g., Singapore)
- **Branch:** `main`
- **Root Directory:** (leave blank)

### Build Settings:

- **Runtime:** Render will auto-detect **Docker** ✅
- **Build Command:** (leave empty - uses Dockerfile)
- **Start Command:** (leave empty - uses Dockerfile CMD)

## Step 4: Add Environment Variables

Click **"Environment"** tab and add these variables:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CHAT_ENCRYPTION_KEY=your_encryption_key
NGROK_AUTH_TOKEN=your_ngrok_token
PORT=3000
```

**Important:** After deployment, add:

```
NEXT_PUBLIC_API_URL=https://your-app-name.onrender.com
```

## Step 5: Choose Plan

- **Free Tier:** Available but has cold starts (app sleeps after 15 min)
- **Starter ($7/mo):** No cold starts, always running

## Step 6: Deploy!

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repo
   - Build using your Dockerfile
   - Install Chrome, Python, dependencies
   - Start your app
3. Watch the logs for progress

## Step 7: Get Your URL

Once deployed, you'll get a URL like:

```
https://college-connect-xyz.onrender.com
```

## Troubleshooting

### If build fails:

- Check the logs for specific errors
- Ensure all environment variables are set
- Verify Dockerfile is correct

### If app crashes:

- Check Deploy Logs for runtime errors
- Verify MongoDB URI is correct and allows external connections
- Check MongoDB Network Access allows Render IPs (0.0.0.0/0)

### Free Tier Limitations:

- App sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- Upgrade to Starter ($7/mo) to avoid this

## Success Criteria

✅ Build completes without errors
✅ App starts and shows "Ready in Xms"
✅ Can access your URL without 502 errors
✅ Puppeteer/Chrome works for attendance feature

---

**Your Dockerfile is already configured perfectly for Render!** 🚀
