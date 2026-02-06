# SendGrid Email Service Setup

This guide will help you set up SendGrid for email functionality in the Lekki Gathering Place application.

## Features Implemented

- ✅ Password reset emails with secure token links
- ✅ Welcome emails for new users
- ✅ Professional HTML email templates
- ✅ Plain text fallback for all emails
- ✅ Graceful fallback if SendGrid is not configured (logs warning instead of crashing)

## Free Tier

SendGrid offers **100 emails per day** completely free - perfect for development and small-scale deployment.

## Setup Instructions

### Step 1: Create a SendGrid Account

1. Go to [https://signup.sendgrid.com/](https://signup.sendgrid.com/)
2. Sign up for a free account
3. Verify your email address

### Step 2: Create an API Key

1. Log in to your SendGrid dashboard
2. Go to **Settings** → **API Keys** or visit [https://app.sendgrid.com/settings/api_keys](https://app.sendgrid.com/settings/api_keys)
3. Click **Create API Key**
4. Give it a name like "Lekki Gathering Place Backend"
5. Select **Full Access** (or at minimum, select **Mail Send** permissions)
6. Click **Create & View**
7. **IMPORTANT:** Copy the API key immediately - you won't be able to see it again!

### Step 3: Verify Sender Identity

SendGrid requires you to verify your sender email address:

1. Go to **Settings** → **Sender Authentication**
2. Choose one of two options:

   **Option A: Single Sender Verification (Quickest)**
   - Click **Verify a Single Sender**
   - Enter your email address (e.g., `noreply@lekkigatheringplace.org` or use a Gmail address for testing)
   - Fill in the form with your details
   - Check your email and click the verification link
   
   **Option B: Domain Authentication (Professional)**
   - Click **Authenticate Your Domain**
   - Follow the DNS configuration steps for your domain
   - This is recommended for production but takes longer to set up

### Step 4: Configure Environment Variables

Update your `.env` file with the SendGrid credentials:

```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.your-actual-api-key-here
SENDGRID_FROM_EMAIL=noreply@lekkigatheringplace.org  # Must match verified sender
SENDGRID_FROM_NAME=Lekki Gathering Place YSA
```

**Important Notes:**
- The `SENDGRID_FROM_EMAIL` must exactly match the email you verified in Step 3
- For testing, you can use your personal Gmail address as the sender
- Never commit your API key to version control

### Step 5: Test Email Functionality

1. Restart your backend server:
   ```bash
   npm run dev
   ```

2. Test the forgot password flow:
   - Go to your frontend
   - Click "Forgot Password"
   - Enter a registered email address
   - Check your inbox for the password reset email

## Email Templates

The following email templates are implemented:

### 1. Password Reset Email
- **Trigger:** User clicks "Forgot Password"
- **Contains:** Secure reset link that expires in 1 hour
- **Template:** Professional design with branded button and fallback link

### 2. Welcome Email (Optional)
- **Trigger:** New user registration
- **Contains:** Welcome message and login link
- **Note:** Currently commented out but available in the service

## Troubleshooting

### Email Not Sending

1. **Check API Key**
   - Ensure `SENDGRID_API_KEY` is set in `.env`
   - Verify the key is valid in SendGrid dashboard

2. **Check Sender Verification**
   - Go to SendGrid → Settings → Sender Authentication
   - Ensure your `SENDGRID_FROM_EMAIL` is verified
   - Status should show "Verified" with a green checkmark

3. **Check Backend Logs**
   - Look for `[EmailService]` logs in your terminal
   - Success: "Email sent successfully to..."
   - Warning: "SendGrid not configured. Email not sent..."
   - Error: "Error sending email: ..."

4. **Check SendGrid Activity**
   - Go to **Activity** in SendGrid dashboard
   - See all sent/delivered/bounced emails
   - Check for error messages

### Common Errors

**Error: "The from email does not match a verified Sender Identity"**
- Solution: Verify your sender email in SendGrid dashboard (Step 3)

**Error: "Forbidden"**
- Solution: Check that your API key has "Mail Send" permissions

**No email received**
- Check spam/junk folder
- Verify the recipient email exists in your database
- Check SendGrid Activity feed for delivery status

## Testing in Development

For development/testing, you can use these approaches:

1. **Use your personal email** as `SENDGRID_FROM_EMAIL`
2. **Test with your own email** as the recipient
3. **Check SendGrid Activity Feed** to see email delivery status

## Production Best Practices

When deploying to production:

1. **Use a Custom Domain**
   - Set up domain authentication in SendGrid
   - Use professional sender like `noreply@yourdomain.com`

2. **Secure Your API Key**
   - Use environment variables (never hardcode)
   - Rotate keys periodically
   - Use different keys for staging/production

3. **Monitor Usage**
   - Track email sending in SendGrid dashboard
   - Set up alerts for unusual activity
   - Consider upgrading if you exceed 100 emails/day

4. **Email Deliverability**
   - Authenticate your domain (SPF, DKIM, DMARC)
   - Monitor bounce rates and spam complaints
   - Keep your sender reputation high

## Cost Considerations

- **Free Tier:** 100 emails/day forever
- **Essentials:** $19.95/month for 50,000 emails
- **Pro:** $89.95/month for 100,000 emails

The free tier should be sufficient for:
- Development and testing
- Small communities (< 100 password resets per day)
- Initial launch phase

## Support

- SendGrid Documentation: [https://docs.sendgrid.com/](https://docs.sendgrid.com/)
- SendGrid Support: [https://support.sendgrid.com/](https://support.sendgrid.com/)
- API Status: [https://status.sendgrid.com/](https://status.sendgrid.com/)

## Code Reference

- Email Service: `src/services/email.service.ts`
- Auth Service (implements forgot password): `src/services/auth.service.ts`
- Configuration: `src/config/index.ts`
- Environment Variables: `.env` and `.env.local`
