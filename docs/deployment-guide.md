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

## References

- [Vercel Deployment Documentation](https://vercel.com/docs)
- [Supabase Deployment Guide](https://supabase.com/docs/guides/getting-started/architecture)
- [Next.js Production Checklist](https://nextjs.org/docs/going-to-production)
- [Supabase Security](https://supabase.com/docs/guides/auth#security)
