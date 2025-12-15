# 🚀 Quick Render Deployment Guide

## Step 1: Prepare Your Repository

1. Commit all changes to Git:
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

## Step 2: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Authorize Render to access your repositories

## Step 3: Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `lekki-gathering-place-backend`
3. Configure:
   - **Name:** `lekki-backend` (or your choice)
   - **Region:** Choose closest to you (e.g., Frankfurt for Europe)
   - **Branch:** `main`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build && npm run prisma:generate`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

## Step 4: Add Environment Variables

Click "Advanced" → Add these variables (see RENDER_ENV_VARS.md for details):

**Required:**
```
NODE_ENV=production
DATABASE_URL=<your-supabase-connection-pooling-url>
DIRECT_URL=<your-supabase-direct-connection-url>
JWT_SECRET=<generate-64-char-random-string>
JWT_REFRESH_SECRET=<generate-64-char-random-string>
CORS_ORIGIN=https://your-frontend.vercel.app
BACKEND_URL=https://your-app-name.onrender.com
FRONTEND_URL=https://your-frontend.vercel.app
```

## Step 5: Deploy

1. Click **"Create Web Service"**
2. Wait 5-10 minutes for first deployment
3. Watch the logs for any errors

## Step 6: Run Database Migrations

After first deployment, in Render dashboard:

1. Go to "Shell" tab
2. Run:
```bash
npm run prisma:migrate deploy
```

## Step 7: Seed Database (Optional)

If you want test data:
```bash
npm run prisma:seed
```

## Step 8: Test Your API

Visit these URLs (replace with your actual domain):
- API: `https://your-app-name.onrender.com/api/v1/health`
- Docs: `https://your-app-name.onrender.com/api-docs`

## Step 9: Set Up Keep-Alive

Choose one:

### Option A: UptimeRobot (Recommended)
1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Add monitor: `https://your-app-name.onrender.com/api/v1/keep-alive`
3. Set interval: 5 minutes

### Option B: Built-in Self-Ping
Already configured! Just ensure `BACKEND_URL` is set correctly in environment variables.

---

## Common Issues & Solutions

### Issue 1: Build Fails
**Error:** `Command failed with exit code 1`
**Solution:** Check build logs. Usually missing dependencies or TypeScript errors.

### Issue 2: Database Connection Error
**Error:** `Can't reach database server`
**Solution:** 
- Verify DATABASE_URL is correct
- Check Supabase firewall allows connections
- Ensure password is URL-encoded (`@` becomes `%40`)

### Issue 3: Server Crashes on Start
**Error:** `Application failed to respond`
**Solution:**
- Check environment variables are set
- Verify PORT is set to 5000
- Check server logs for specific error

### Issue 4: CORS Errors
**Error:** `blocked by CORS policy`
**Solution:**
- Add your frontend URL to CORS_ORIGIN
- Ensure no trailing slash
- Check frontend is using correct backend URL

---

## Post-Deployment Checklist

- [ ] API health endpoint returns 200
- [ ] Swagger docs are accessible
- [ ] Can login with test credentials
- [ ] Database migrations applied
- [ ] Keep-alive service configured
- [ ] Environment variables secured
- [ ] Frontend can connect to backend
- [ ] CORS configured correctly

---

## Free Tier Limits

- ✅ 750 hours/month (enough for 24/7)
- ✅ 512 MB RAM
- ✅ Shared CPU
- ⚠️ Sleeps after 15 min inactivity (solved with keep-alive)
- ⚠️ Cold start ~30 seconds

---

## Monitoring Your App

**Render Dashboard:**
- Logs: Real-time application logs
- Metrics: CPU, Memory usage
- Events: Deployments, restarts

**External Monitoring:**
- UptimeRobot: Uptime percentage, response times
- Render Status: Service health

---

## Scaling Later (When Needed)

**When to upgrade:**
- Consistent high traffic
- Response times > 1 second
- Memory usage > 80%
- Need zero downtime

**Upgrade to:**
- Starter: $7/month (no sleep, 512 MB)
- Standard: $25/month (4 GB RAM)
- Pro: $85/month (8 GB RAM, priority support)

---

## Need Help?

- Render Docs: [render.com/docs](https://render.com/docs)
- Community: [render.com/community](https://render.com/community)
- Backend logs: Check Render dashboard → Logs tab

🎉 **Your backend is now live in production!**
