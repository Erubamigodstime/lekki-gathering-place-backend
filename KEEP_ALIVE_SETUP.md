# Keep-Alive Setup for Render Free Tier

To prevent your Render free tier backend from sleeping after 15 minutes of inactivity, use these free monitoring services to ping your API regularly.

## Option 1: UptimeRobot (Recommended - Easiest)

**Setup:**
1. Go to [UptimeRobot](https://uptimerobot.com/) and create a free account
2. Click "Add New Monitor"
3. Configure:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Lekki Backend Keep-Alive
   - **URL:** `https://your-app-name.onrender.com/api/v1/keep-alive`
   - **Monitoring Interval:** 5 minutes (free tier)
4. Click "Create Monitor"

**Features:**
- ✅ Free forever
- ✅ 50 monitors on free plan
- ✅ 5-minute intervals
- ✅ Email alerts if server goes down
- ✅ Simple dashboard

---

## Option 2: Cron-Job.org

**Setup:**
1. Go to [Cron-Job.org](https://cron-job.org/) and create account
2. Create new cron job:
   - **Title:** Keep Backend Alive
   - **URL:** `https://your-app-name.onrender.com/api/v1/keep-alive`
   - **Schedule:** Every 14 minutes (*/14 * * * *)
3. Save

**Features:**
- ✅ Free tier available
- ✅ Custom intervals (down to 1 minute on paid)
- ✅ Execution history
- ✅ Email notifications

---

## Option 3: GitHub Actions (Automated & Free)

**Setup:**
Create `.github/workflows/keep-alive.yml` in your backend repo:

```yaml
name: Keep Render Alive

on:
  schedule:
    # Runs every 14 minutes
    - cron: '*/14 * * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  keep-alive:
    runs-on: ubuntu-latest
    steps:
      - name: Ping server
        run: |
          curl -f https://your-app-name.onrender.com/api/v1/keep-alive || exit 1
      - name: Check health
        run: |
          curl -f https://your-app-name.onrender.com/api/v1/health || exit 1
```

**Features:**
- ✅ Completely free (GitHub Actions)
- ✅ Runs from GitHub's servers
- ✅ Custom intervals
- ✅ Version controlled
- ✅ No third-party service needed

---

## Option 4: Self-Ping (Built-in - Already Configured)

The backend includes a built-in self-ping utility that will automatically start in production. Just set these environment variables on Render:

```env
NODE_ENV=production
BACKEND_URL=https://your-app-name.onrender.com
```

**Features:**
- ✅ Built into your app
- ✅ Pings every 14 minutes automatically
- ✅ No external service needed
- ⚠️ Only works when server is awake (needs initial external ping)

---

## Recommended Setup (Best Reliability)

**Use a combination:**

1. **UptimeRobot** (Primary - every 5 minutes)
   - Keeps server alive
   - Monitors uptime
   - Sends alerts

2. **Built-in Self-Ping** (Secondary - every 14 minutes)
   - Backup when UptimeRobot misses
   - No external dependency once running

This dual approach ensures 99.9% uptime on the free tier!

---

## Testing Your Setup

After deploying to Render, test the endpoints:

```bash
# Test health endpoint
curl https://your-app-name.onrender.com/api/v1/health

# Test keep-alive endpoint
curl https://your-app-name.onrender.com/api/v1/keep-alive
```

Both should return JSON responses with status 200.

---

## Important Notes

1. **Render Free Tier Limitations:**
   - Sleeps after 15 minutes of inactivity
   - Takes ~30 seconds to wake up
   - 750 hours/month (31.25 days - enough for 24/7)

2. **Ping Frequency:**
   - Don't ping more than every 5 minutes (wastes resources)
   - 14 minutes is ideal (buffer before 15-minute timeout)

3. **Wake-Up Time:**
   - First request after sleep takes 20-30 seconds
   - Subsequent requests are instant
   - Users might experience initial delay

4. **Alternatives if Keep-Alive Doesn't Work:**
   - Upgrade to Render paid plan ($7/month - no sleep)
   - Use Railway (similar pricing, no sleep)
   - Use Fly.io (free tier doesn't sleep)

---

## Monitoring Dashboard

After setup, you'll see:
- Server uptime percentage
- Response times
- Downtime alerts
- Request history

This helps you monitor your backend health 24/7 for free! 🚀
