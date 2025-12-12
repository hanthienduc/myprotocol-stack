# SMTP/Resend Login 500 Error - Diagnostic Report

**Date**: 2025-12-12
**Issue**: 500 error when logging in after SMTP setup on Supabase
**Environment**: Vercel Production
**Auth Method**: Magic Link (Email OTP)

---

## Executive Summary

**Root Cause**: Missing `NEXT_PUBLIC_APP_URL` environment variable in Vercel deployment

**Impact**: Auth callback route fails when using `window.location.origin` fallback, causing 500 errors during OAuth/Magic Link login flows

**Priority**: HIGH - Blocks all user authentication

**Recommended Fix**: Add `NEXT_PUBLIC_APP_URL` to Vercel environment variables

---

## Technical Analysis

### Issue Discovery

1. **SMTP Configuration**: User configured SMTP on Supabase to connect with Resend account
2. **Login Attempt**: User attempts login via magic link
3. **Callback Failure**: `/callback` route returns 500 error
4. **Impact**: Users cannot authenticate

### Evidence

#### 1. Missing Environment Variable

**Local `.env.local`**: Missing `NEXT_PUBLIC_APP_URL`

```bash
# From apps/web/.env.local
NEXT_PUBLIC_SUPABASE_URL=***
NEXT_PUBLIC_SUPABASE_ANON_KEY=***
SUPABASE_SERVICE_ROLE_KEY=***
RESEND_API_KEY=***
RESEND_FROM_EMAIL=***
# ... other vars ...
# ❌ NEXT_PUBLIC_APP_URL is MISSING
```

**Expected** (from `.env.local.example`):
```env
NEXT_PUBLIC_APP_URL=https://protocolstack.app
```

#### 2. Client-Side Redirect URL Construction

**File**: `apps/web/app/(auth)/login/page.tsx`

```typescript
// Line 22 - Google OAuth
const handleGoogleLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/callback`, // ⚠️ Uses window.location.origin
    },
  });
};

// Line 41 - Magic Link
const handleMagicLink = async (e: React.FormEvent) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/callback`, // ⚠️ Uses window.location.origin
    },
  });
};
```

**Problem**: `window.location.origin` in Vercel preview deployments returns dynamic URLs like:
- `https://myprotocolstack-git-feature-abc123.vercel.app`
- `https://myprotocolstack-xyz789.vercel.app`

These URLs may not be whitelisted in Supabase Auth redirect URLs.

#### 3. Callback Route Implementation

**File**: `apps/web/app/(auth)/callback/route.ts` (fixed in commit `d20a8bf`)

Recent fix handles both OAuth and Magic Link:

```typescript
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  // Handle OAuth callback (Google, etc.)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("OAuth callback error:", error);
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }
  }
  // Handle Magic Link / Email OTP callback
  else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "email" | "magiclink",
      token_hash,
    });
    if (error) {
      console.error("Magic link verification error:", error);
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }
  }
}
```

**Observation**: Callback route properly handles Magic Link flow, but 500 error suggests upstream issue (likely redirect URL mismatch).

#### 4. Supabase Auth Configuration Gap

**Expected Configuration** (from `docs/setup/supabase-auth-email.md`):

```
Site URL: https://yourdomain.com
Redirect URLs:
  - https://myprotocolstack.com/callback (production)
  - https://*.vercel.app/callback (preview deployments)
  - http://localhost:3000/callback (local dev)
```

**Issue**: If `*.vercel.app` wildcard not configured, dynamic preview URLs fail.

#### 5. SMTP Configuration

**File**: `docs/setup/supabase-auth-email.md`

SMTP correctly configured:
- Host: `smtp.resend.com`
- Port: `465` or `587`
- Username: `resend`
- Password: Resend API key (`re_...`)

**Status**: SMTP setup correct, not source of error.

---

## Root Cause Chain

```
1. User configures SMTP on Supabase ✓
2. User attempts login via magic link
3. Login page sends OTP request
   → Uses `window.location.origin` for redirect URL
   → Dynamic Vercel URL (e.g., *.vercel.app)
4. Supabase sends magic link email ✓
5. User clicks magic link
6. Supabase redirects to callback URL
   → URL may not be whitelisted in Supabase Auth
7. Callback route receives request
   → Attempts to verify OTP token
   → Supabase rejects due to URL mismatch
8. Error thrown → 500 status returned
```

---

## Actionable Recommendations

### Immediate Fix (Priority 1)

**1. Add `NEXT_PUBLIC_APP_URL` to Vercel**

```bash
# Vercel Dashboard → Settings → Environment Variables
NEXT_PUBLIC_APP_URL=https://protocolstack.app

# Then redeploy
vercel --prod
```

**2. Update Supabase Redirect URLs**

Supabase Dashboard → Authentication → URL Configuration:

```
Site URL: https://protocolstack.app

Redirect URLs:
  https://protocolstack.app/callback
  https://*.vercel.app/callback
  http://localhost:3000/callback
```

**Impact**: Fixes 500 errors immediately.

### Code Improvements (Priority 2)

**1. Replace `window.location.origin` with env var**

**File**: `apps/web/app/(auth)/login/page.tsx`

```typescript
// Current (brittle)
redirectTo: `${window.location.origin}/callback`

// Recommended (reliable)
redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/callback`
```

**Benefit**: Consistent redirect URLs across all environments.

**2. Add env var validation**

**File**: `apps/web/lib/env.ts` (create)

```typescript
export function validateEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_APP_URL', // ← Add this
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing env vars: ${missing.join(', ')}`);
  }
}
```

Call in `apps/web/app/layout.tsx`:

```typescript
import { validateEnv } from '@/lib/env';

validateEnv(); // Fail fast on startup
```

### Long-term Improvements (Priority 3)

**1. Add error monitoring**

```bash
npm install @sentry/nextjs
```

Capture 500 errors with context:
- User ID
- Auth method (OAuth/Magic Link)
- Redirect URL
- Supabase error details

**2. Add retry logic for callback route**

```typescript
// Retry token verification with exponential backoff
const maxRetries = 3;
for (let i = 0; i < maxRetries; i++) {
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });
  if (!error) break;
  if (i === maxRetries - 1) throw error;
  await new Promise(r => setTimeout(r, 1000 * (i + 1)));
}
```

**3. Add health check endpoint**

**File**: `apps/web/app/api/health/route.ts`

```typescript
export async function GET() {
  const checks = {
    supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    app_url: !!process.env.NEXT_PUBLIC_APP_URL,
    resend: !!process.env.RESEND_API_KEY,
  };

  return Response.json(checks);
}
```

---

## Test Plan

### Manual Testing

1. **Add env var to Vercel**
   ```bash
   # Vercel Dashboard → Settings → Environment Variables
   NEXT_PUBLIC_APP_URL=https://protocolstack.app
   ```

2. **Redeploy**
   ```bash
   git commit --allow-empty -m "trigger redeploy"
   git push
   ```

3. **Test OAuth login**
   - Visit `/login`
   - Click "Continue with Google"
   - Verify redirect to `/today` (or `/onboarding`)

4. **Test Magic Link login**
   - Visit `/login`
   - Enter email
   - Check email inbox
   - Click magic link
   - Verify redirect to `/today`

5. **Verify callback logs**
   - Vercel Dashboard → Deployments → Functions → `/callback`
   - Check for errors
   - Confirm successful redirects

### Automated Testing

```typescript
// __tests__/auth/callback.test.ts
describe('Auth Callback', () => {
  it('handles OAuth callback', async () => {
    const res = await fetch('/callback?code=valid_code');
    expect(res.status).toBe(302); // Redirect
    expect(res.headers.get('location')).toContain('/today');
  });

  it('handles magic link callback', async () => {
    const res = await fetch('/callback?token_hash=valid&type=email');
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toContain('/today');
  });

  it('rejects invalid callback', async () => {
    const res = await fetch('/callback');
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toContain('/login?error=auth_failed');
  });
});
```

---

## Monitoring & Prevention

### Key Metrics

- **Auth Success Rate**: `successful_logins / total_attempts`
- **Callback Error Rate**: `500_errors / total_callbacks`
- **Magic Link Click-Through**: `link_clicks / emails_sent`

### Alerts

```yaml
# Sentry alert rule
- type: error
  condition: status_code == 500 AND path == /callback
  frequency: > 5 in 10 minutes
  action: notify #eng-alerts
```

### Logs to Monitor

1. **Supabase Auth Logs**
   - Supabase Dashboard → Logs → Auth
   - Filter: Failed login attempts

2. **Vercel Function Logs**
   - Vercel Dashboard → Deployments → Functions
   - Filter: `/callback` route

3. **Resend Email Logs**
   - Resend Dashboard → Logs
   - Check: Delivery status, bounce rate

---

## Supporting Evidence Files

1. `/apps/web/.env.local.example` - Expected env vars
2. `/apps/web/app/(auth)/callback/route.ts` - Callback implementation
3. `/apps/web/app/(auth)/login/page.tsx` - Login redirect logic
4. `/docs/setup/supabase-auth-email.md` - SMTP setup guide
5. `/docs/deployment-guide.md` - Vercel env var instructions

---

## Unresolved Questions

1. **Is `*.vercel.app` wildcard configured in Supabase redirect URLs?**
   - Check: Supabase Dashboard → Authentication → URL Configuration
   - If not, add it

2. **Are there any rate limits on Resend causing delays?**
   - Check: Resend Dashboard → Usage
   - Free tier: 100 emails/day

3. **Is Vercel deployment using correct environment (production vs preview)?**
   - Check: Vercel Dashboard → Deployments → Environment
   - Ensure production deployment

4. **Are there any CORS issues blocking callback requests?**
   - Check: Browser DevTools → Network → Response headers
   - Verify `Access-Control-Allow-Origin` present

---

## References

- [Supabase Auth Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Resend Documentation](https://resend.com/docs)
- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

---

**Report Generated**: 2025-12-12
**Debugger**: Claude Code
**Status**: Ready for implementation
