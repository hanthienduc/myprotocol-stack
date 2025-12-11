# Supabase Auth Email Setup

**Last Updated**: 2025-12-11

Guide for customizing Supabase Auth emails (magic link, password reset, etc.) and connecting with your custom domain.

## Overview

By default, Supabase sends auth emails from their domain. To send branded emails from your domain (e.g., `noreply@myprotocolstack.com`), you need:

1. Email provider with SMTP (Resend recommended)
2. Domain DNS verification
3. Custom SMTP configuration in Supabase
4. Customized email templates

## Prerequisites

- Supabase project created
- Domain registered and DNS access
- Email provider account (Resend, SendGrid, etc.)

## Step 1: Set Up Email Provider (Resend)

Resend is recommended for simplicity and developer experience.

### 1.1 Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up with GitHub or email
3. Complete onboarding

### 1.2 Add Your Domain

1. Dashboard → **Domains** → **Add Domain**
2. Enter your domain: `myprotocolstack.com`
3. Resend provides DNS records to add

### 1.3 Configure DNS Records

Add these records at your domain registrar (Cloudflare, Namecheap, GoDaddy, etc.):

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| TXT | `@` or domain | `v=spf1 include:_spf.resend.com ~all` | SPF - Authorize Resend |
| CNAME | `resend._domainkey` | `resend._domainkey.resend.com` | DKIM - Email signing |
| TXT | `_dmarc` | `v=DMARC1; p=none;` | DMARC - Policy |

**Note**: Exact records shown in Resend dashboard after adding domain.

### 1.4 Verify Domain

- Wait 5-30 minutes for DNS propagation
- Click "Verify" in Resend dashboard
- Status changes to "Verified" ✓

### 1.5 Get API Key

1. Settings → **API Keys** → **Create API Key**
2. Name it: `supabase-auth`
3. Copy the key (starts with `re_`)

## Step 2: Configure Supabase SMTP

### 2.1 Enable Custom SMTP

1. Supabase Dashboard → Your Project
2. **Project Settings** (gear icon) → **Auth**
3. Scroll to **SMTP Settings**
4. Toggle **Enable Custom SMTP**

### 2.2 Enter SMTP Credentials

| Field | Value |
|-------|-------|
| Host | `smtp.resend.com` |
| Port | `465` (SSL) or `587` (TLS) |
| Username | `resend` |
| Password | Your API key (`re_...`) |
| Sender email | `noreply@yourdomain.com` |
| Sender name | `MyProtocolStack` |

### 2.3 Save and Test

1. Click **Save**
2. Use "Send test email" to verify

## Step 3: Configure Auth URLs

Supabase Dashboard → **Authentication** → **URL Configuration**

| Setting | Value |
|---------|-------|
| Site URL | `https://yourdomain.com` |
| Redirect URLs | `https://yourdomain.com/auth/callback` |

**Important**: Add all environments:
- Production: `https://myprotocolstack.com/auth/callback`
- Preview: `https://*.vercel.app/auth/callback`
- Local: `http://localhost:3000/auth/callback`

## Step 4: Customize Email Templates

Supabase Dashboard → **Authentication** → **Email Templates**

### Available Templates

| Template | Trigger |
|----------|---------|
| Confirm signup | New user registration |
| Magic Link | Passwordless login |
| Change Email Address | User changes email |
| Reset Password | Password reset request |
| Invite user | Admin invites user |

### Template Variables

| Variable | Description |
|----------|-------------|
| `{{ .ConfirmationURL }}` | The auth link user clicks |
| `{{ .SiteURL }}` | Your site URL |
| `{{ .Token }}` | Raw token (for custom flows) |
| `{{ .TokenHash }}` | Hashed token |
| `{{ .RedirectTo }}` | Redirect destination |

### Example: Magic Link Template

**Subject:**
```
Sign in to MyProtocolStack
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #10b981; margin: 0;">MyProtocolStack</h1>
  </div>

  <h2 style="color: #1f2937;">Sign in to your account</h2>

  <p>Click the button below to sign in. This link expires in 24 hours.</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="{{ .ConfirmationURL }}"
       style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
      Sign In
    </a>
  </div>

  <p style="color: #6b7280; font-size: 14px;">
    If the button doesn't work, copy and paste this link:<br>
    <a href="{{ .ConfirmationURL }}" style="color: #10b981; word-break: break-all;">{{ .ConfirmationURL }}</a>
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

  <p style="color: #9ca3af; font-size: 12px;">
    If you didn't request this email, you can safely ignore it.
  </p>
</body>
</html>
```

### Example: Password Reset Template

**Subject:**
```
Reset your MyProtocolStack password
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #10b981; margin: 0;">MyProtocolStack</h1>
  </div>

  <h2 style="color: #1f2937;">Reset your password</h2>

  <p>We received a request to reset your password. Click the button below to create a new password.</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="{{ .ConfirmationURL }}"
       style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
      Reset Password
    </a>
  </div>

  <p style="color: #6b7280; font-size: 14px;">
    This link expires in 24 hours. If you didn't request a password reset, ignore this email.
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

  <p style="color: #9ca3af; font-size: 12px;">
    MyProtocolStack - Build your health protocol stack
  </p>
</body>
</html>
```

## Step 5: Environment Variables

Ensure your app has correct URLs configured:

```env
# .env.local / Vercel Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Alternative Email Providers

### SendGrid

```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: SG.xxxxx (your API key)
```

### Mailgun

```
Host: smtp.mailgun.org
Port: 587
Username: postmaster@yourdomain.com
Password: Your Mailgun SMTP password
```

### Postmark

```
Host: smtp.postmarkapp.com
Port: 587
Username: Your Server API Token
Password: Your Server API Token
```

## Troubleshooting

### Emails Not Sending

1. **Check SMTP credentials** - Verify API key is correct
2. **Check domain verification** - Must be verified in email provider
3. **Check spam folder** - New domains may be flagged
4. **Check Supabase logs** - Auth → Logs for errors

### Emails Going to Spam

1. **Verify SPF record** - Use [mxtoolbox.com](https://mxtoolbox.com/spf.aspx)
2. **Verify DKIM record** - Check in email provider dashboard
3. **Add DMARC record** - Helps with deliverability
4. **Warm up domain** - Send low volume initially

### Link Not Working

1. **Check Site URL** - Must match your domain exactly
2. **Check Redirect URLs** - Callback URL must be whitelisted
3. **Check HTTPS** - Links should use HTTPS in production

### Template Variables Not Replaced

- Ensure using correct syntax: `{{ .VariableName }}`
- Variable names are case-sensitive
- Check Supabase docs for available variables

## Testing Checklist

- [ ] Domain verified in email provider
- [ ] SMTP credentials saved in Supabase
- [ ] Test email received (not in spam)
- [ ] Magic link works and redirects correctly
- [ ] Email displays correctly on mobile
- [ ] All redirect URLs whitelisted

## References

- [Supabase Auth Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Resend Documentation](https://resend.com/docs)
- [Email Deliverability Guide](https://resend.com/docs/dashboard/domains/introduction)
