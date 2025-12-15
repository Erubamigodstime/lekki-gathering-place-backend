# Environment Variables for Render Deployment

Copy these environment variables to your Render service dashboard.

## Required Variables (Must Set)

```bash
# Application
NODE_ENV=production
PORT=5000
API_VERSION=v1

# Database (Your Supabase PostgreSQL URL)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[SUPABASE-HOST]:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[PASSWORD]@[SUPABASE-HOST]:5432/postgres

# JWT (Generate secure secrets!)
JWT_SECRET=your-super-long-random-secret-at-least-64-characters-long
JWT_REFRESH_SECRET=your-super-long-refresh-secret-at-least-64-characters-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS (Your frontend URL on Vercel)
CORS_ORIGIN=https://your-frontend.vercel.app

# App URLs (Your Render backend URL)
BACKEND_URL=https://your-app-name.onrender.com
FRONTEND_URL=https://your-frontend.vercel.app
```

## Optional Variables

```bash
# Redis (Leave empty if not using - already disabled in code)
# REDIS_HOST=
# REDIS_PORT=
# REDIS_PASSWORD=

# Email (Only if you want email functionality)
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM=noreply@yourdomain.com

# Cloudinary (Only if you want file uploads to cloud)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Google OAuth (Only if implementing Google login)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-app-name.onrender.com/api/v1/auth/google/callback
```

## How to Get These Values

### 1. Supabase Database URLs
- Go to your Supabase project dashboard
- Navigate to: Settings → Database
- Copy **Connection Pooling** URL (for DATABASE_URL)
- Copy **Direct Connection** URL (for DIRECT_URL)
- Replace `[YOUR-PASSWORD]` with: `Lakowe%402025` (URL-encoded)

### 2. JWT Secrets (Generate Random Strings)
Run these commands in terminal:

```bash
# For JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# For JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. CORS Origin
- Your frontend Vercel URL (e.g., `https://lekki-gathering.vercel.app`)
- Don't include trailing slash

### 4. Backend URL
- Will be: `https://your-chosen-name.onrender.com`
- Choose name when creating Render service

---

## Setting Environment Variables on Render

1. Go to your Render dashboard
2. Select your service
3. Click "Environment" tab
4. Click "Add Environment Variable"
5. Paste each variable name and value
6. Click "Save Changes"

**Important:** Render will automatically redeploy when you save environment variables!

---

## Verification

After deployment, test these endpoints:

```bash
# Health check
curl https://your-app-name.onrender.com/api/v1/health

# Keep-alive endpoint
curl https://your-app-name.onrender.com/api/v1/keep-alive

# API docs
https://your-app-name.onrender.com/api-docs
```

All should return 200 OK status! 🚀
