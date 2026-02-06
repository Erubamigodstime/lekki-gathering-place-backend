# Email Service - Quick Start Guide

## ✅ What's Done

The email service has been successfully integrated into your application:

- **Package Installed:** @sendgrid/mail v8.1.6
- **Email Service Created:** `src/services/email.service.ts`
- **Auth Service Updated:** Password reset now sends emails
- **Configuration Added:** SendGrid settings in `src/config/index.ts`
- **Environment Variables:** `.env` and `.env.local` updated with SendGrid placeholders

## 🚀 Next Steps (5 Minutes Setup)

### 1. Get Your SendGrid API Key

1. Go to https://signup.sendgrid.com/ (if you don't have an account)
2. Once logged in, go to https://app.sendgrid.com/settings/api_keys
3. Click "Create API Key"
4. Name it "Lekki Gathering Place"
5. Select "Full Access"
6. Copy the API key (you only see it once!)

### 2. Verify Your Sender Email

1. Go to https://app.sendgrid.com/settings/sender_auth
2. Click "Verify a Single Sender"
3. Use one of these options:
   - Your personal email (e.g., `erubamigodstime43@gmail.com`) - **Easiest for testing**
   - A professional email (e.g., `noreply@lekkigatheringplace.org`) - **For production**
4. Check your email and click the verification link

### 3. Update Your .env File

Open `.env` and update these lines:

```env
SENDGRID_API_KEY=SG.your-actual-api-key-here
SENDGRID_FROM_EMAIL=erubamigodstime43@gmail.com  # Use the email you verified
SENDGRID_FROM_NAME=Lekki Gathering Place YSA
```

### 4. Restart Backend

```bash
# Stop the current server (Ctrl+C in terminal)
npm run dev
```

### 5. Test It!

1. Go to your frontend: http://localhost:8080
2. Click "Forgot Password"
3. Enter a registered email (yours)
4. Check your inbox - you should receive a professional password reset email!

## 📧 Email Features

### Password Reset Email
- ✅ Professional HTML template
- ✅ Secure token link that expires in 1 hour
- ✅ Plain text fallback
- ✅ Mobile-friendly design

### Graceful Fallback
If SendGrid is not configured:
- ✅ Won't crash the app
- ✅ Logs a warning instead
- ✅ Returns success message to user (for security)

## 🔍 Testing & Troubleshooting

### Check if it's working:
1. Look for this in terminal: `[EmailService] Email sent successfully to ...`
2. If you see: `[EmailService] SendGrid not configured` - check your API key
3. Check SendGrid dashboard: https://app.sendgrid.com/email_activity

### Common Issues:

**"The from email does not match a verified Sender Identity"**
- Solution: Go to SendGrid and verify your sender email

**"Forbidden" error**
- Solution: Make sure your API key has "Mail Send" permissions

**No email received**
- Check spam folder
- Check SendGrid Activity feed for delivery status
- Verify the email exists in your database

## 📊 Free Tier Limits

- **100 emails per day** - Completely free forever
- Perfect for development and small deployments
- No credit card required

## 📝 Files Changed

1. **Created:**
   - `src/services/email.service.ts` - Main email service
   - `SENDGRID_SETUP.md` - Detailed setup guide

2. **Modified:**
   - `src/services/auth.service.ts` - Added email sending to forgotPassword
   - `src/config/index.ts` - Added SendGrid configuration
   - `.env` - Added SendGrid environment variables
   - `.env.local` - Added SendGrid environment variables

3. **Installed:**
   - `@sendgrid/mail@8.1.6` - SendGrid email package

## 🎯 What You Can Do Now

After setup, users can:
1. Click "Forgot Password" on login page
2. Enter their email
3. Receive a professional password reset email
4. Click the link in the email
5. Reset their password securely

## 📚 Additional Documentation

For more detailed information, see:
- `SENDGRID_SETUP.md` - Complete setup guide with troubleshooting
- SendGrid Docs: https://docs.sendgrid.com/

## 💡 Pro Tips

- Use your personal Gmail for testing initially
- Set up a custom domain email for production
- Monitor your SendGrid dashboard to track email delivery
- The free tier (100/day) should be enough for initial deployment

---

**Ready to test?** Just add your SendGrid API key to `.env`, restart the backend, and try the forgot password flow! 🚀
