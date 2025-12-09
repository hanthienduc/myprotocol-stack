# Research: Onboarding Quiz & Notification Systems
**MyProtocolStack** | 2025-12-09 | Next.js 15 + Supabase + React 19

---

## 1. MULTI-STEP ONBOARDING QUIZ

### Recommended Approach: React Hook Form + Context + shadcn/ui

**Why React Hook Form (not Formik):**
- **Bundle size**: 12.12 KB gzipped vs Formik's 44.34 KB (73% smaller)
- **Zero dependencies** vs Formik's 9 dependencies
- **Performance**: Uncontrolled components reduce re-renders by ~40% in large forms
- **Maintenance**: Active development vs Formik (unmaintained for 1+ year)

**Architecture Pattern:**
```typescript
// 1. Wizard Context for cross-step state
interface WizardState {
  step: number;
  answers: Record<string, any>;
  isComplete: boolean;
}

// 2. Each step as separate form with validation
// Using zod (pairs well with react-hook-form)
const healthPreferencesSchema = z.object({
  primaryGoal: z.enum(['sleep', 'focus', 'energy', 'fitness']),
  experience: z.enum(['beginner', 'intermediate', 'advanced']),
  timeAvailable: z.number().min(15).max(240),
});

// 3. Progressive disclosure: show next step after validation
// Store answers in Supabase user_metadata during/after quiz
```

**Validation Strategy:**
- Client: Zod + react-hook-form for UX feedback
- Server: Zod schema validation in API route before saving
- Supabase: Store quiz results in `user_metadata.onboarding_profile`

**Implementation Stack:**
- `react-hook-form@7.x` - Form state
- `zod@3.x` - Schema validation
- `@hookform/resolvers` - Zod integration
- `react-hot-toast` or `sonner` (already in stack) - Step feedback

### Database Schema
```sql
-- Add to auth.users via user_metadata
{
  "onboarding_completed": boolean,
  "onboarding_profile": {
    "primary_goal": "sleep|focus|energy|fitness",
    "experience_level": "beginner|intermediate|advanced",
    "time_available_minutes": 30,
    "interests": ["protocol_id1", "protocol_id2"]
  }
}
```

### UI Pattern: Progressive Disclosure
- Step 1: Health goal selection (with icons/descriptions)
- Step 2: Experience level (conditional: show relevant protocols)
- Step 3: Time commitment (drives protocol recommendations)
- Step 4: Select 2-3 starter protocols (preview cards)
- Step 5: Review & confirm (create first "stack")

---

## 2. NOTIFICATION SYSTEMS

### Layer 1: Email Notifications (Resend)

**Setup for Supabase Edge Functions:**
```typescript
// supabase/functions/send-notification/index.ts
import { Resend } from 'https://cdn.jsdelivr.net/npm/resend@latest/+esm';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

// Trigger via: Edge Function, Database trigger, or API endpoint
// Common triggers:
// - User completes first stack (onboarding)
// - Daily adherence reminders
// - Weekly progress summary
// - Milestone achievements
```

**Config in Supabase:**
- Install Resend via NPM in functions
- Add `RESEND_API_KEY` to Edge Function secrets
- Use `react-email` for component-based email templates
- Store notification preferences in user table

**Trade-off:** Resend (recommended) vs SMTP relay
- Resend: Dashboard monitoring, retry logic, analytics included
- SMTP: Cheaper but requires manual ops/monitoring

### Layer 2: Web Push Notifications

**Technology Stack:**
- Service Worker registration in middleware
- VAPID keys for authentication
- Subscription stored in Supabase
- `web-push` library for server-side delivery

**Implementation:**
```typescript
// 1. Generate VAPID keys (one-time)
// npm install web-push
// npx web-push generate-vapid-keys

// 2. Service Worker (public/sw.js)
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, data);
});

// 3. Next.js middleware registers SW
// app/middleware.ts
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// 4. Subscribe endpoint
// POST /api/notifications/subscribe
// Save PushSubscription to Supabase
```

**Browser Support:**
- Chrome, Edge, Firefox, Safari (17.2+), Android
- Not iOS (PWA mode not fully supported for push)

### Layer 3: Scheduled Notifications (Supabase Cron)

**Setup:**
1. Enable `pg_cron` extension in Supabase dashboard
2. Enable `pg_net` extension (required for HTTP calls)
3. Create scheduled job that calls Edge Function

```sql
-- Example: Daily 9 AM reminder for incomplete protocols
SELECT cron.schedule(
  'send-daily-reminders',
  '0 9 * * *', -- 9 AM UTC
  $$
    SELECT net.http_post(
      url:='https://YOUR_PROJECT.supabase.co/functions/v1/send-daily-reminders',
      headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}',
      body:='{}'
    ) as request_id;
  $$
);
```

**Notification Triggers (Priority Order):**
1. **Onboarding completion** → Email + Web Push
2. **Daily 9 AM reminder** → Web Push (if subscribed)
3. **Weekly summary** → Email (Resend)
4. **Milestone (7-day streak)** → Email + In-app toast
5. **Protocol archived** → In-app toast only

---

## 3. TRADE-OFFS & DECISIONS

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| **Form Library** | React Hook Form | 73% smaller, 40% fewer re-renders, active maintenance |
| **Email Service** | Resend | No self-hosting ops, dashboard analytics, retry logic |
| **Push Notifications** | Web Push API | No vendor lock-in, open standard, free |
| **Scheduling** | Supabase pg_cron | No external dependencies, leverages existing DB |
| **Validation** | Zod (client + server) | Type-safe, runtime validation, parse before save |

---

## 4. RECOMMENDED PACKAGES

```json
{
  "react-hook-form": "^7.51.0",
  "zod": "^3.22.0",
  "@hookform/resolvers": "^3.3.4",
  "resend": "^3.2.0",
  "react-email": "^2.1.0",
  "web-push": "^3.6.7",
  "zustand": "^4.4.0"  // Alternative to Context for quiz state
}
```

---

## 5. IMPLEMENTATION PRIORITIES

1. **Phase 1** (Week 1): React Hook Form + Zod quiz builder + Supabase user_metadata storage
2. **Phase 2** (Week 2): Email notifications via Resend Edge Function + react-email templates
3. **Phase 3** (Week 3): Web Push subscription + Daily reminder cron job
4. **Phase 4** (Week 4): Analytics + A/B testing (which notification type drives better engagement?)

---

## 6. UNRESOLVED QUESTIONS

1. **Email frequency limits**: Should we throttle reminder emails (e.g., max 1/day)? Consider user preference table.
2. **iOS notifications**: Given Safari PWA push limitations, should we explore email-only for iOS users? Track UA for OS detection.
3. **Notification deduplication**: How to prevent duplicate push notifications if user has multiple devices? Dedupe via user_id + notification_type + timestamp.
4. **Preference management**: Should onboarding quiz include notification preference questions, or add to settings page post-launch?
5. **Testing push locally**: Service workers require HTTPS; recommend ngrok or Vercel preview deployments for testing.

---

## SOURCES

- [Next.js Multi-Step Form Guide - Medium](https://medium.com/@wdswy/how-to-build-a-multi-step-form-using-nextjs-typescript-react-context-and-shadcn-ui-ef1b7dcceec3)
- [React Hook Form vs Formik - Refine](https://refine.dev/blog/react-hook-form-vs-formik/)
- [React Hook Form vs Formik - 2025 Comparison](https://www.digitalogy.co/blog/react-hook-form-vs-formik/)
- [React Hook Form Comparison - LogRocket](https://blog.logrocket.com/react-hook-form-vs-formik-comparison/)
- [Resend Email Integration - Supabase Docs](https://supabase.com/docs/guides/functions/examples/send-emails)
- [Custom Auth Emails with Resend - Supabase](https://supabase.com/docs/guides/functions/examples/auth-send-email-hook-react-email-resend)
- [Service Workers in Next.js - LogRocket](https://blog.logrocket.com/implementing-service-workers-next-js/)
- [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [Web Push in Next.js - Designly](https://blog.designly.biz/push-notifications-in-next-js-with-web-push-a-provider-free-solution)
- [Supabase Scheduled Functions](https://supabase.com/docs/guides/functions/schedule-functions)
- [Supabase Cron Setup Guide - StackOverflowTips](https://www.stackoverflowtips.com/2025/08/step-by-step-setup-supabase-cron-edge.html)
- [Supabase Push Notifications](https://supabase.com/docs/guides/functions/examples/push-notifications)
