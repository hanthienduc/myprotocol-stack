# Phase 5: Growth Features Implementation Plan

## Metadata
| Field | Value |
|-------|-------|
| Date | 251210 |
| Status | In Progress |
| Goal | Scale to $5K+ MRR through organic growth |
| Est. Effort | 3-4 weeks |
| Priority | P0 |

## Summary
Implement growth features: SEO infrastructure, blog/content system, referral program, social sharing, and public profiles. Native Next.js 16 APIs, self-built referral codes (Base62), MDX blog for MVP simplicity.

## Phase Overview

| Phase | Feature | Status | Priority | File |
|-------|---------|--------|----------|------|
| 01 | SEO Foundation | ✅ Complete | P0 | [phase-01-seo-foundation.md](./phase-01-seo-foundation.md) |
| 02 | Blog/Content | Not Started | P1 | [phase-02-blog-content.md](./phase-02-blog-content.md) |
| 03 | Referral Program | Not Started | P0 | [phase-03-referral-program.md](./phase-03-referral-program.md) |
| 04 | Social Sharing | Not Started | P1 | [phase-04-social-sharing.md](./phase-04-social-sharing.md) |
| 05 | Public Profiles | Not Started | P2 | [phase-05-public-profiles.md](./phase-05-public-profiles.md) |

## Dependencies
- Phase 4 (Analytics) complete
- Vercel deployment configured
- Domain (myprotocolstack.com) active
- Supabase PostgreSQL running

## Prerequisites
- No external SEO packages (use native Next.js 16 Metadata API)
- No SaaS referral tools (self-built Base62 codes)
- MDX for blog (git-tracked, no CMS)

## Success Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Google indexed pages | 100% protocol pages | Search Console |
| Referral signups | 10% of new users | referrals table |
| Social shares/week | 50+ | UTM tracking |
| Organic traffic | +30% MoM | Analytics |

## Technical Decisions
1. **SEO**: Native sitemap.ts/robots.ts, generateMetadata, opengraph-image.tsx
2. **Blog**: MDX with @next/mdx (simpler than DB/CMS for MVP)
3. **Referral**: Base62(user_id) codes, tiered credits, PostgreSQL tracking
4. **Sharing**: Web Share API primary, intent URLs fallback
5. **Profiles**: Optional feature, username-based URLs, RLS for visibility

## Risk Register
| Risk | Impact | Mitigation |
|------|--------|------------|
| SEO indexing delays | Med | Submit sitemap to GSC immediately |
| Referral fraud | Med | IP/email rate limits, manual review |
| MDX complexity | Low | Keep articles simple, no dynamic content |

## Research Reports
- [SEO & OG Report](./research/researcher-seo-og-report.md)
- [Referral & Social Report](./research/researcher-referral-social-report.md)

## Next Steps
1. Implement Phase 01 (SEO Foundation) - highest ROI
2. Phase 03 (Referral) parallel with Phase 02 (Blog)
3. Phase 04 (Sharing) after referral codes exist
4. Phase 05 (Public Profiles) last - optional feature
