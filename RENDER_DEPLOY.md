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

## Step 3: Configure the Service (CRITICAL STEP)

### Basic Settings:

- **Name:** `college-connect`
- **Region:** Choose closest to you
- **Branch:** `main`

### ⚠️ Runtime Settings (IMPORTANT):

Render might default to "Node". You **MUST** change this:

- **Runtime:** Select **Docker** 🐳
- **Build Command:** (leave empty)
- **Start Command:** (leave empty)

_If you don't see "Docker" as an option, or it's stuck on Node, it's best to delete the service and create a new one, ensuring you select Docker if asked._

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

## Step 5: Deploy!

1. Click **"Create Web Service"**
2. Render will build using your Dockerfile.
3. This process takes 5-10 minutes.

## Troubleshooting

### "Build failed" with "Cannot find module lightningcss"

- This means you are on **Node Runtime**, not Docker.
- **Fix:** Go to Settings -> Runtime -> Switch to **Docker**.
- If you can't switch, create a new service.

### App crashes with 502

- Check "Deploy Logs" for errors.
- Ensure all environment variables are set.
