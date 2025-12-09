# Phase 5: Notification System

## Context Links

- [Main Plan](./plan.md)
- [Research: Onboarding & Notifications](./research/researcher-251209-onboarding-notifications.md)
- [Code Standards](/docs/code-standards.md)

---

## Overview

| Field | Value |
|-------|-------|
| Priority | P2 |
| Status | Pending |
| Description | Email reminders via Resend, Web Push notifications, configurable reminder times, streak alerts |
| Est. Effort | 4-5 days |

---

## Key Insights from Research

- Resend: dashboard monitoring, retry logic, analytics included
- Web Push API: no vendor lock-in, open standard, free
- Supabase pg_cron + pg_net for scheduled jobs
- Service Worker required for push notifications
- iOS Safari 17.2+ supports push (limited)
- VAPID keys for push authentication

---

## Requirements

### Functional
- Email daily reminders (configurable time)
- Email weekly summary
- Web push for daily reminders
- "Streak at risk" alert (when in grace period)
- Notification preferences in settings
- Unsubscribe via email link

### Non-Functional
- Email delivery <30 seconds
- Push notification delivery <5 seconds
- Respect user preferences
- Handle bounce/complaint (Resend webhooks)

---

## Architecture

```
supabase/
  ├── functions/
  │   ├── send-daily-reminders/       # Edge function
  │   ├── send-weekly-summary/        # Edge function
  │   └── send-push/                  # Edge function
  └── migrations/                     # Database tables

apps/web/
  ├── lib/email/templates/            # React Email templates
  ├── lib/push/                       # Push subscription management
  ├── public/sw.js                    # Service Worker
  ├── components/settings/
  │   └── notification-settings.tsx   # Notification preferences UI
  └── actions/
      ├── push-subscriptions.ts
      └── notification-preferences.ts

packages/database/
  └── src/types.ts                    # Add notification types
```

---

## Related Code Files

| File | Purpose |
|------|---------|
| `apps/web/app/(dashboard)/settings/page.tsx` | Notification preferences UI |
| `apps/web/middleware.ts` | Service worker registration |
| `packages/database/src/types.ts` | Add notification types |

---

## Dependencies

```json
{
  "resend": "^3.2.0",
  "react-email": "^2.1.0",
  "@react-email/components": "^0.0.15",
  "web-push": "^3.6.7"
}
```

---

## Database Changes

```sql
-- Notification preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  email_daily_reminder BOOLEAN DEFAULT TRUE,
  email_weekly_summary BOOLEAN DEFAULT TRUE,
  email_streak_alerts BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT FALSE,
  push_daily_reminder BOOLEAN DEFAULT FALSE,
  push_streak_alerts BOOLEAN DEFAULT TRUE,
  reminder_time TIME DEFAULT '09:00',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Web Push subscriptions
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);
CREATE INDEX idx_push_subs_user ON push_subscriptions(user_id);

-- RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own prefs"
  ON notification_preferences FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own push subs"
  ON push_subscriptions FOR ALL USING (auth.uid() = user_id);
```

---

## Implementation Steps

### 1. Database Setup
1. Create migration for notification_preferences table (`supabase/migrations/`)
2. Create migration for push_subscriptions table (`supabase/migrations/`)
3. Update `packages/database/src/types.ts` with new types

### 2. Email Templates (React Email)
4. Install: `pnpm add resend react-email @react-email/components --filter=web`
5. Create `apps/web/lib/email/templates/daily-reminder.tsx`:
   - Subject: "Time for your protocols!"
   - Body: today's protocols list, streak count
   - CTA: "Mark Complete" link to /today
6. Create `apps/web/lib/email/templates/weekly-summary.tsx`:
   - Subject: "Your Weekly Protocol Summary"
   - Body: adherence %, best day, streak status
7. Create `apps/web/lib/email/templates/streak-at-risk.tsx`:
   - Subject: "Don't lose your streak!"
   - Body: current streak, protocols to complete

### 3. Supabase Edge Functions - Email
8. Create `/supabase/functions/send-daily-reminders/index.ts`:
   - Query users with email_daily_reminder=true
   - Filter by reminder_time (within 5 min window)
   - Fetch today's incomplete protocols
   - Send via Resend
9. Create `/supabase/functions/send-weekly-summary/index.ts`:
   - Query users with email_weekly_summary=true
   - Fetch last 7 days analytics
   - Send summary email
10. Add RESEND_API_KEY to Edge Function secrets

### 4. Scheduling (pg_cron)
11. Enable pg_cron and pg_net extensions in Supabase dashboard
12. Create scheduled jobs:
```sql
-- Daily reminders (every hour, edge function filters by time)
SELECT cron.schedule(
  'send-daily-reminders',
  '0 * * * *',
  $$ SELECT net.http_post(...) $$
);

-- Weekly summary (Sunday 9 AM UTC)
SELECT cron.schedule(
  'send-weekly-summary',
  '0 9 * * 0',
  $$ SELECT net.http_post(...) $$
);

-- Streak at risk (daily at 8 PM UTC)
SELECT cron.schedule(
  'send-streak-alerts',
  '0 20 * * *',
  $$ SELECT net.http_post(...) $$
);
```

### 5. Web Push Setup
13. Generate VAPID keys: `npx web-push generate-vapid-keys`
14. Add VAPID keys to environment variables
15. Create `apps/web/public/sw.js` (Service Worker):
```javascript
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: { url: data.url }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
```

### 6. Push Subscription Management
16. Create `apps/web/lib/push/subscribe.ts`:
   - Request notification permission
   - Subscribe to push manager
   - Save subscription to push_subscriptions table
17. Create `apps/web/actions/push-subscriptions.ts`:
   - `subscribeToPush(subscription)`
   - `unsubscribeFromPush()`

### 7. Service Worker Registration
18. Update `apps/web/app/layout.tsx` or create `apps/web/lib/push/register-sw.ts`:
   - Register SW on app load
   - Handle permission states

### 8. Supabase Edge Function - Push
19. Create `/supabase/functions/send-push/index.ts`:
   - Accept userId, title, body, url
   - Query push_subscriptions for user
   - Send via web-push library
20. Add VAPID keys to Edge Function secrets

### 9. Settings UI
21. Create `apps/web/components/settings/notification-settings.tsx`:
   - Toggle for email daily reminder
   - Toggle for email weekly summary
   - Toggle for streak alerts
   - Time picker for reminder time
   - Push notification enable/disable
   - Save button
22. Create `apps/web/actions/notification-preferences.ts`:
   - `updateNotificationPreferences(data)`
23. Update `apps/web/app/(dashboard)/settings/page.tsx`:
   - Add NotificationSettings section

### 10. Integration
24. Update streak calculation to trigger alert:
   - When user enters grace period
   - Call send-push edge function
25. Add unsubscribe endpoint for email links

### 11. Polish
26. Add notification permission prompt UX
27. Add success toast on settings save
28. Handle push permission denied state
29. Add email preview in settings (optional)

---

## Todo List

- [ ] Create DB migration for notification_preferences
- [ ] Create DB migration for push_subscriptions
- [ ] Update types/database.ts
- [ ] Install email dependencies
- [ ] Create daily-reminder email template
- [ ] Create weekly-summary email template
- [ ] Create streak-at-risk email template
- [ ] Create send-daily-reminders edge function
- [ ] Create send-weekly-summary edge function
- [ ] Setup pg_cron scheduled jobs
- [ ] Generate VAPID keys
- [ ] Create public/sw.js
- [ ] Create lib/push/subscribe.ts
- [ ] Create actions/push-subscriptions.ts
- [ ] Create send-push edge function
- [ ] Create notification-settings.tsx
- [ ] Create actions/notification-preferences.ts
- [ ] Update settings page with notifications section
- [ ] Add unsubscribe endpoint
- [ ] Test email delivery
- [ ] Test push notifications
- [ ] Test scheduled jobs

---

## Success Criteria

- [ ] Daily reminder emails sent at configured time
- [ ] Weekly summary emails sent on Sundays
- [ ] Streak-at-risk alerts trigger correctly
- [ ] Push notifications work in Chrome/Firefox/Safari
- [ ] Users can enable/disable each notification type
- [ ] Unsubscribe link works in emails

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Email deliverability | Low | Medium | Resend handles reputation |
| Push not supported | Medium | Low | Fallback to email |
| iOS push limitations | Medium | Medium | Document, email fallback |
| pg_cron reliability | Low | High | Monitor, add retry logic |
| Timezone calculation | Medium | Medium | Test extensively |

---

## Security Considerations

- VAPID keys stored as secrets
- Resend API key in Edge Function secrets only
- RLS on all notification tables
- Validate email ownership
- Rate limit push sends (10/hour/user)
- Unsubscribe tokens for email

---

## Next Steps

After completion:
1. Add notification analytics (open/click rates)
2. A/B test notification copy
3. Add SMS notifications (Twilio)
4. In-app notification center

---

## Unresolved Questions

1. Email frequency cap? (max 1 daily reminder, 1 weekly summary)
2. Push notification sound preference?
3. Email reply handling? (no-reply vs support)
4. Bounce/complaint webhook handling priority?
5. iOS PWA push limitations - worth documenting for users?
