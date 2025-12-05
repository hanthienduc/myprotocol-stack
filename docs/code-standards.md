# Code Standards

**Last Updated**: 2025-12-05
**Version**: 0.1.0
**Project**: MyProtocolStack

## Overview

Coding standards for MyProtocolStack. Keep it simple - this is a solo dev micro-SaaS.

## Principles

### YAGNI (You Aren't Gonna Need It)
- Build only what's needed NOW
- No premature optimization
- No "just in case" features

### KISS (Keep It Simple)
- Prefer simple over clever
- Readable > compact
- Boring technology choices

### Ship Fast
- MVP first, polish later
- Good enough > perfect
- Iterate based on real feedback

## Tech Stack

```
Next.js 14       - App Router, Server Components
TypeScript       - Strict mode
Tailwind CSS     - Utility-first styling
shadcn/ui        - Component library
Supabase         - Database + Auth
Stripe           - Payments
```

## File Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Public auth pages
│   │   ├── login/
│   │   └── signup/
│   ├── (app)/               # Protected app pages
│   │   ├── dashboard/
│   │   ├── protocols/
│   │   ├── stacks/
│   │   ├── today/
│   │   └── settings/
│   ├── api/
│   │   └── webhooks/
│   ├── layout.tsx
│   └── page.tsx             # Landing page
├── components/
│   ├── ui/                  # shadcn/ui (don't modify)
│   ├── protocols/
│   │   ├── protocol-card.tsx
│   │   └── protocol-list.tsx
│   ├── stacks/
│   │   ├── stack-card.tsx
│   │   └── stack-builder.tsx
│   ├── tracking/
│   │   ├── today-view.tsx
│   │   └── tracking-item.tsx
│   └── layout/
│       ├── header.tsx
│       ├── sidebar.tsx
│       └── mobile-nav.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # Browser client
│   │   ├── server.ts        # Server client
│   │   └── middleware.ts    # Auth middleware
│   ├── stripe/
│   │   └── client.ts
│   └── utils.ts             # cn() helper, etc.
├── types/
│   ├── database.ts          # Supabase generated types
│   └── index.ts             # App-specific types
├── hooks/
│   ├── use-user.ts
│   └── use-subscription.ts
└── actions/                 # Server Actions
    ├── stacks.ts
    ├── tracking.ts
    └── subscription.ts
```

## Naming Conventions

### Files
- **kebab-case** for all files: `protocol-card.tsx`
- **Descriptive names**: `stack-builder.tsx` not `builder.tsx`

### Components
- **PascalCase**: `ProtocolCard`
- **Props interface**: `ProtocolCardProps`

### Functions
- **camelCase**: `createStack`, `markComplete`
- **Action prefix** for server actions: `createStack`, `updateStack`

### Types
- **PascalCase**: `Protocol`, `Stack`, `TrackingRecord`
- **Suffix for collections**: `Protocols`, `Stacks`

## Component Patterns

### Server Component (Default)
```tsx
// app/(app)/protocols/page.tsx
import { createClient } from '@/lib/supabase/server';
import { ProtocolList } from '@/components/protocols/protocol-list';

export default async function ProtocolsPage() {
  const supabase = await createClient();
  const { data: protocols } = await supabase
    .from('protocols')
    .select('*')
    .order('sort_order');

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Protocols</h1>
      <ProtocolList protocols={protocols ?? []} />
    </div>
  );
}
```

### Client Component
```tsx
// components/tracking/tracking-item.tsx
'use client';

import { useState } from 'react';
import { markComplete } from '@/actions/tracking';

interface TrackingItemProps {
  protocol: Protocol;
  isCompleted: boolean;
}

export function TrackingItem({ protocol, isCompleted }: TrackingItemProps) {
  const [completed, setCompleted] = useState(isCompleted);

  const handleToggle = async () => {
    setCompleted(!completed); // Optimistic
    await markComplete(protocol.id, new Date().toISOString());
  };

  return (
    <button onClick={handleToggle}>
      {/* ... */}
    </button>
  );
}
```

### Server Action
```tsx
// actions/tracking.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function markComplete(protocolId: string, date: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  await supabase.from('tracking').upsert({
    user_id: user.id,
    protocol_id: protocolId,
    completed_date: date,
  });

  revalidatePath('/today');
}
```

## Supabase Patterns

### Server Client
```tsx
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}
```

### Browser Client
```tsx
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

## TypeScript

### Types from Database
```tsx
// types/database.ts (generated by Supabase CLI)
export type Database = {
  public: {
    Tables: {
      protocols: {
        Row: { /* ... */ };
        Insert: { /* ... */ };
        Update: { /* ... */ };
      };
      // ...
    };
  };
};

// Convenience types
export type Protocol = Database['public']['Tables']['protocols']['Row'];
export type Stack = Database['public']['Tables']['stacks']['Row'];
```

### Props Types
```tsx
interface ProtocolCardProps {
  protocol: Protocol;
  onSelect?: (id: string) => void;
}
```

## Styling

### Tailwind Only
```tsx
// Good
<div className="flex items-center gap-4 p-4 rounded-lg border">

// Bad - no CSS modules or styled-components
```

### shadcn/ui Components
```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

<Button variant="outline" size="sm">
  Add to Stack
</Button>
```

### cn() Helper
```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  'p-4 rounded-lg',
  isActive && 'bg-primary text-white',
  className
)}>
```

## Error Handling

### Server Actions
```tsx
export async function createStack(data: CreateStackInput) {
  try {
    const supabase = await createClient();
    const { data: stack, error } = await supabase
      .from('stacks')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/stacks');
    return { success: true, data: stack };
  } catch (error) {
    console.error('Failed to create stack:', error);
    return { success: false, error: 'Failed to create stack' };
  }
}
```

### Client-Side
```tsx
const handleSubmit = async () => {
  setLoading(true);
  const result = await createStack(formData);

  if (result.success) {
    toast.success('Stack created!');
    router.push('/stacks');
  } else {
    toast.error(result.error);
  }
  setLoading(false);
};
```

## Git Standards

### Commit Messages
```
feat: add protocol tracking
fix: streak calculation bug
docs: update readme
refactor: simplify stack builder
```

### Branch Names
```
feature/protocol-tracking
fix/streak-bug
```

## What NOT to Do

### Don't Over-Engineer
```tsx
// Bad - unnecessary abstraction
const useProtocolRepository = () => {
  const adapter = useAdapter();
  return new ProtocolRepository(adapter);
};

// Good - direct and simple
const { data: protocols } = await supabase.from('protocols').select('*');
```

### Don't Premature Optimize
```tsx
// Bad - caching before you need it
const protocols = await redis.get('protocols') ?? await fetchAndCache();

// Good for MVP - just fetch
const protocols = await supabase.from('protocols').select('*');
```

### Don't Add Unused Features
```tsx
// Bad - features no one asked for
export function ProtocolCard({
  protocol,
  onShare,      // Not in MVP
  onExport,     // Not in MVP
  analytics,    // Not in MVP
}) { }

// Good - only what's needed
export function ProtocolCard({ protocol, onSelect }) { }
```

## Checklist Before Commit

- [ ] No TypeScript errors
- [ ] No console.logs (use proper logging if needed)
- [ ] No hardcoded secrets
- [ ] Component has proper types
- [ ] Server actions handle errors

## References

- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
