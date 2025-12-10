# Referral Programs & Social Sharing Research Report
**Date:** 251210 | **Project:** MyProtocolStack Phase 5 Growth

## Executive Summary
Referral programs drive 16% higher lifetime value & 18% lower churn. Implementation combines unique code generation, tiered rewards, and seamless social sharing. Web Share API eliminates third-party script overhead while maintaining fallbacks for unsupported browsers.

---

## 1. Referral Code Generation Strategies

### Unique Code Approaches
- **Randomized Alphanumeric Codes:** 6-8 char codes (e.g., `PRO2K5XJ`) - easy to share verbally
- **Base62 Encoding:** Converts user ID to short string (efficient, deterministic)
- **UUID-based:** Full uniqueness guarantee, longer codes
- **Custom Vanity Codes:** User-friendly slugs for power users

### Implementation for MyProtocolStack
Use Base62 encoding of user ID for automatic generation + optional vanity code support:
```
referral_codes table:
- id: uuid
- user_id: uuid (FK users)
- code: varchar(8) UNIQUE  -- Base62(user_id)
- vanity_code: varchar(50) NULLABLE
- created_at: timestamp
- expires_at: timestamp NULLABLE (optional expiration)
- is_active: boolean DEFAULT true
```

---

## 2. Referral Tracking Database Schema

### Core Tables
```sql
-- Referral relationships
CREATE TABLE referrals (
  id uuid PRIMARY KEY,
  referrer_id uuid NOT NULL REFERENCES users(id),
  referred_user_id uuid REFERENCES users(id),
  referral_code_used varchar(8),
  status ENUM('pending', 'confirmed', 'rewarded') DEFAULT 'pending',
  referred_at timestamp DEFAULT now(),
  confirmed_at timestamp,

  -- Tracking fields
  utm_source varchar(100),
  utm_medium varchar(100),
  utm_campaign varchar(100),
  user_agent text,
  referrer_ip inet
);

-- Rewards tracking
CREATE TABLE referral_rewards (
  id uuid PRIMARY KEY,
  referral_id uuid NOT NULL REFERENCES referrals(id),
  user_id uuid NOT NULL REFERENCES users(id),
  reward_type ENUM('credits', 'discount', 'feature_unlock', 'free_month'),
  amount_credits integer,
  discount_percentage integer,
  status ENUM('pending', 'issued', 'claimed') DEFAULT 'pending',
  issued_at timestamp,
  expires_at timestamp
);

-- User stats (denormalized for performance)
CREATE TABLE referral_stats (
  user_id uuid PRIMARY KEY REFERENCES users(id),
  total_referrals integer DEFAULT 0,
  confirmed_referrals integer DEFAULT 0,
  total_credits_earned integer DEFAULT 0,
  tier integer DEFAULT 1,
  updated_at timestamp
);
```

### Key Design Decisions
- Separation of referrals & rewards enables flexible bonus structures
- Denormalized stats table for fast dashboard queries
- UTM tracking for multi-channel source attribution
- IP/user-agent for fraud detection

---

## 3. Reward Systems Implementation

### Tiered Structure (Recommended for MyProtocolStack)
```
Tier 1: 1+ referrals = 500 credits ($5)
Tier 2: 5+ referrals = 2,000 credits ($20) + 1-month free
Tier 3: 10+ referrals = 5,000 credits ($50) + 3-month free
Tier 4: 25+ referrals = 15,000 credits ($150) + 1 year free + badge
```

### Double-Sided Incentives (Best Practice)
- Referrer: Stack of credits (product-native value)
- Referred: 500 bonus credits on first completed week
- Win-win drives both participation and activation

### Implementation Pattern
Stripe-like approach: Auto-grant credits on confirmation, expire if unused after 6 months. Prevents accounting complexity while encouraging redemption.

---

## 4. Social Sharing Implementation

### Web Share API with Fallbacks
```typescript
// Native share (mobile/modern browsers)
if (navigator.share) {
  await navigator.share({
    title: "MyProtocolStack",
    text: `Join me building health protocols! Use code: ${referralCode}`,
    url: `${appUrl}?ref=${referralCode}`
  });
} else {
  // Fallback: Pre-constructed share links
  const links = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    linkedin: `https://linkedin.com/sharing/share-offsite/?url=${url}`
  };
}
```

### Key Benefits
- No third-party SDKs = faster page loads
- Native OS share sheet = higher completion rates
- Analytics: Track via referrer parameter (not native shares)

### Limitations
- Native sharing hides destination (can't track where shared)
- Mitigation: Use UTM params on referral URLs for aggregate tracking

---

## 5. Public Profile Pattern for User-Generated Content

### Schema for Shareable Profiles
```sql
CREATE TABLE public_profiles (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES users(id),
  username varchar(50) UNIQUE NOT NULL,
  display_name varchar(100),
  bio text,
  avatar_url text,
  featured_stacks uuid[] -- Array of public stack IDs
  is_public boolean DEFAULT false,
  profile_url varchar(200) GENERATED ALWAYS AS (
    '/profile/' || username
  ),
  created_at timestamp,
  updated_at timestamp
);

CREATE TABLE public_stacks (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  title varchar(200) NOT NULL,
  description text,
  protocols uuid[] ARRAY,
  is_public boolean DEFAULT false,
  view_count integer DEFAULT 0,
  created_at timestamp
);
```

### Implementation for MyProtocolStack
1. Optional public profiles with username
2. Share buttons on protocol detail pages pointing to public profile
3. SEO-friendly URLs enable organic discovery
4. View counts incentivize quality stack curation

---

## Recommended Approach & Trade-offs

| Approach | Pros | Cons | Recommendation |
|----------|------|------|---|
| **Self-built (Base62 codes)** | Full control, low cost | Requires maintenance, fraud detection setup | YES for MVP |
| **Third-party (GrowSurf)** | Complete platform, built-in analytics | $199+/mo, vendor lock-in | For scaled phase |
| **Web Share API** | No SDKs, fast, native UX | Limited analytics, no iOS share count | YES primary |
| **Custom buttons (fallback)** | Full tracking data | SDKs slow page, users abandon | As fallback only |
| **Public profiles** | Drives organic sharing, SEO | Requires moderation, privacy concerns | YES optional |

---

## Implementation Roadmap for Phase 5

1. **Week 1:** Referral table schema + Base62 code generation utility
2. **Week 2:** Referral code display in settings + Web Share API integration
3. **Week 3:** Tiered rewards calculation + credits grant on confirmation
4. **Week 4:** Referral dashboard (stats, code sharing, earnings) + public profiles (optional)
5. **Week 5:** Test fraud patterns, optimize copy/UX, launch beta

---

## Sources
- [13 Best SaaS Referral Program Strategies & Optimisations (2025)](https://www.dansiepen.io/growth-checklists/saas-referral-program-strategies-optimisations)
- [Web Share API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API)
- [How to Build a SaaS Referral Program](https://viral-loops.com/referral-marketing/saas-programs)
- [How to Structure Rewards for B2C vs B2B SaaS](https://viral-loops.com/blog/saas-referral-program-2/)
- [CSS-Tricks: How to Use Web Share API](https://css-tricks.com/how-to-use-the-web-share-api/)

---

## Unresolved Questions
- Fraud detection thresholds (max referrals per email/IP)?
- Referral code expiration policy (permanent vs 1-year)?
- Tax implications of free month rewards (treat as revenue)?
