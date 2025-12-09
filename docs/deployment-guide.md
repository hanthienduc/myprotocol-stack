# Deployment Guide

**Last Updated**: 2025-12-09
**Version**: 0.1.0
**Project**: MyProtocolStack

## Overview

Production deployment guide for MyProtocolStack using Vercel (hosting) and Supabase (database). Zero-downtime deployments with automatic previews.

## Prerequisites

- Vercel account (free tier works)
- Supabase project (free tier works until ~5K MAU)
- GitHub repository (connected to Vercel)
- Domain name (optional for MVP)

## Environment Setup

### Supabase Configuration

1. **Create Project**
   - Go to supabase.com → New Project
   - Choose region closest to users
   - Save connection string (for migrations)

2. **Database Schema**
   ```bash
   # In Supabase SQL Editor, run:
   # 1. lib/supabase/schema.sql (create tables)
   # 2. lib/supabase/seed.sql (30 protocols)
   ```

3. **Enable RLS**
   - Auth → Policies for each table
   - Profiles, Stacks, Tracking: User isolation
   - Protocols: Public read

4. **Auth Providers**
   - Auth → Providers → Google
   - Add OAuth credentials from Google Cloud Console
   - Redirect URL: `https://{YOUR_DOMAIN}/auth/callback`

5. **Credentials**
   - Copy from Settings → API
   - `NEXT_PUBLIC_SUPABASE_URL` (public)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public)
   - `SUPABASE_SERVICE_ROLE_KEY` (private, server-only)

### Vercel Configuration

1. **Connect GitHub Repository**
   - vercel.com → New Project → Import Git Repo
   - Select your MyProtocolStack repo
   - Vercel auto-detects Next.js

2. **Environment Variables**
   - Add all Supabase credentials
   - Add `NEXT_PUBLIC_APP_URL` (production domain)
   - Keep SERVICE_ROLE_KEY private (server env only)

3. **Deployment Settings**
   - Framework: Next.js
   - Build Command: `pnpm build` (auto-detected)
   - Output Directory: `.next` (auto-detected)
   - Install Command: `pnpm install` (auto-detected)

4. **Custom Domain (Optional)**
   - Vercel Dashboard → Settings → Domains
   - Add domain, follow DNS instructions
   - SSL auto-provisioned (Let's Encrypt)

## Deployment Workflow

### Development
```bash
git checkout -b feature/new-feature
# Make changes
pnpm dev       # Test locally
pnpm build     # Verify build
git push origin feature/new-feature
```

### Preview (Automatic)
- Vercel creates preview URL for each PR
- Test at: `{project}-git-feature-{random}.vercel.app`
- Environment variables automatically included

### Production
```bash
# Merge PR to main
git checkout main
git pull
# Vercel auto-deploys to myprotocolstack.vercel.app

# Optional: Custom domain points here
```

## Pre-Deployment Checklist

### Code
- [ ] No TypeScript errors: `pnpm tsc --noEmit`
- [ ] ESLint passes: `pnpm lint`
- [ ] Build succeeds: `pnpm build`
- [ ] No console.logs in production code
- [ ] No hardcoded secrets in code

### Database
- [ ] RLS policies enabled on all tables
- [ ] Indexes created on hot columns
  - `tracking(user_id, completed_date)`
  - `stacks(user_id)`
  - `protocols(category)`
- [ ] Backups configured (Supabase free tier auto-backups daily)

### Environment
- [ ] All env vars set in Vercel
- [ ] `NEXT_PUBLIC_APP_URL` matches domain
- [ ] Supabase credentials correct
- [ ] Auth redirect URLs configured

### Security
- [ ] HTTPS enforced (auto by Vercel/Supabase)
- [ ] CORS properly configured
- [ ] No sensitive data in public code
- [ ] Server actions validate all inputs

## Monitoring

### Vercel Analytics
- Vercel Dashboard → Analytics
- Monitor Core Web Vitals
- Check for deployment errors

### Supabase Monitoring
- Supabase Dashboard → Logs
- Monitor for failed queries
- Check Auth logs for failed logins

### Error Tracking (Optional)
- Add Sentry for detailed error reports
- PostHog for user behavior analytics

## Rollback Procedure

### Quick Rollback (< 5 minutes)
```bash
# Vercel Dashboard → Deployments
# Click previous successful deployment
# Click "Promote to Production"
```

### Database Rollback (Supabase)
- Supabase auto-backups daily
- Contact support for point-in-time recovery
- Keep manual backup before major changes

## Scaling Considerations

### Free Tier Limits
- Vercel: 100GB bandwidth/month
- Supabase: 500MB database, 25 concurrent connections
- Good for: ~5,000 MAU

### When to Upgrade

| Metric | Tier | Plan |
|--------|------|------|
| > 5K MAU | Database | Supabase Pro ($25/mo) |
| > 10K MAU | Hosting | Vercel Pro ($20/mo) |
| > 50K MAU | Infrastructure | Dedicated (custom) |

### Upgrade Path
1. Upgrade Supabase first (database is bottleneck)
2. Monitor Vercel bandwidth usage
3. Consider CDN for static assets (Vercel includes)
4. Plan for paid Auth provider if scaling socially

## Common Issues

### "503 Service Unavailable"
- **Cause**: Supabase connection pool exhausted
- **Fix**: Upgrade Supabase tier or optimize queries

### "CORS Error from Supabase"
- **Cause**: Auth URL mismatch
- **Fix**: Check Supabase Auth → URL Configuration
- Ensure `NEXT_PUBLIC_SUPABASE_URL` matches

### "Environment Variable Not Found"
- **Cause**: Variable not set in Vercel
- **Fix**: Vercel Dashboard → Settings → Environment Variables
- Rebuild after adding (automatic on deploy)

### Slow Protocol Load
- **Cause**: Missing database index on category
- **Fix**: Add index: `CREATE INDEX idx_protocols_category ON protocols(category);`

## Maintenance Tasks

### Weekly
- Monitor error logs
- Check database backups ran
- Review analytics for anomalies

### Monthly
- Review Vercel usage (bandwidth)
- Check database growth
- Test disaster recovery

### Quarterly
- Performance optimization
- Security audit
- Dependency updates

## Notification System Setup

The notification system requires additional configuration for email sending and scheduled jobs.

### Email Notifications (Resend)

1. **Create Resend Account**
   - Sign up at resend.com
   - Verify your sending domain
   - Copy API key

2. **Environment Variables**
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxx
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

3. **Domain Verification**
   - Add DNS records provided by Resend
   - Wait for verification (usually < 1 hour)

### Push Notifications (Web Push)

1. **Generate VAPID Keys**
   ```bash
   npx web-push generate-vapid-keys
   ```

2. **Environment Variables**
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=BLxxxxxxxxx
   VAPID_PRIVATE_KEY=xxxxxxxxx
   ```

### Scheduled Jobs (Supabase Edge Functions + pg_cron)

Edge Functions handle scheduled notification jobs. Requires Supabase CLI.

1. **Install Supabase CLI**
   ```bash
   brew install supabase/tap/supabase  # macOS
   # or
   npm install -g supabase
   ```

2. **Initialize Edge Functions**
   ```bash
   supabase init
   supabase functions new send-daily-reminders
   supabase functions new send-weekly-summary
   supabase functions new send-streak-alerts
   ```

3. **Deploy Edge Functions**
   ```bash
   supabase functions deploy send-daily-reminders
   supabase functions deploy send-weekly-summary
   supabase functions deploy send-streak-alerts
   ```

4. **Schedule with pg_cron**
   ```sql
   -- Enable pg_cron extension (run in Supabase SQL editor)
   CREATE EXTENSION IF NOT EXISTS pg_cron;

   -- Daily reminders at user's preferred time (run every minute, filter in function)
   SELECT cron.schedule(
     'send-daily-reminders',
     '* * * * *',
     $$ SELECT net.http_post(
       url:='https://<project-ref>.supabase.co/functions/v1/send-daily-reminders',
       headers:='{"Authorization": "Bearer <service-role-key>"}'::jsonb
     ) $$
   );

   -- Weekly summary every Sunday at 9 AM UTC
   SELECT cron.schedule(
     'send-weekly-summary',
     '0 9 * * 0',
     $$ SELECT net.http_post(
       url:='https://<project-ref>.supabase.co/functions/v1/send-weekly-summary',
       headers:='{"Authorization": "Bearer <service-role-key>"}'::jsonb
     ) $$
   );

   -- Streak alerts at 6 PM UTC daily
   SELECT cron.schedule(
     'send-streak-alerts',
     '0 18 * * *',
     $$ SELECT net.http_post(
       url:='https://<project-ref>.supabase.co/functions/v1/send-streak-alerts',
       headers:='{"Authorization": "Bearer <service-role-key>"}'::jsonb
     ) $$
   );
   ```

5. **Edge Function Secrets**
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
   supabase secrets set VAPID_PRIVATE_KEY=xxxxxxxxx
   ```

### Testing Notifications

- **Email Preview**: Use react-email dev server
  ```bash
  pnpm email:dev  # Visit localhost:3000 to preview templates
  ```
- **Push Test**: Use browser dev tools → Application → Service Workers
- **Edge Function Test**: `supabase functions serve` for local testing

## References

- [Vercel Deployment Documentation](https://vercel.com/docs)
- [Supabase Deployment Guide](https://supabase.com/docs/guides/getting-started/architecture)
- [Next.js Production Checklist](https://nextjs.org/docs/going-to-production)
- [Supabase Security](https://supabase.com/docs/guides/auth#security)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Resend Documentation](https://resend.com/docs)
- [Web Push Protocol](https://web.dev/push-notifications-overview/)
