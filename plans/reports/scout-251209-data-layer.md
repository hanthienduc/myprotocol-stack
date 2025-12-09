# Scout Report: Data Layer & Type System
**Date**: 2025-12-09  
**Project**: MyProtocolStack  
**Scope**: lib/ and types/ directories

---

## Executive Summary
Comprehensive analysis of database schema, Supabase client configuration, middleware, and TypeScript type definitions. MyProtocolStack uses a PostgreSQL database (Supabase) with 4 main tables, Row-Level Security (RLS) policies, and fully typed client/server implementations.

---

## 1. Database Schema (`lib/supabase/schema.sql`)

### Tables Overview

#### **protocols** (Read-only, pre-populated)
- **Purpose**: Library of 30 science-backed health protocols
- **Primary Key**: `id` (UUID)
- **Columns**:
  - `name` (text, required)
  - `description` (text, required)
  - `category` (enum: sleep, focus, energy, fitness)
  - `difficulty` (enum: easy, medium, hard)
  - `duration_minutes` (integer, nullable)
  - `frequency` (enum: daily, weekly)
  - `science_summary` (text, nullable)
  - `steps` (text array)
  - `created_at` (timestamp)
- **RLS**: Public read access to everyone
- **Index**: `idx_protocols_category`

#### **profiles** (User profiles linked to auth)
- **Purpose**: User metadata synced with Supabase Auth
- **Primary Key**: `id` (UUID, foreign key to auth.users)
- **Columns**:
  - `email` (text, required)
  - `name` (text, nullable)
  - `avatar_url` (text, nullable)
  - `subscription_tier` (enum: free, pro)
  - `created_at` (timestamp)
  - `updated_at` (timestamp, auto-updated via trigger)
- **RLS**: Users can only view/edit their own profile
- **Trigger**: Auto-creates profile on new user signup via `handle_new_user()` function

#### **stacks** (User-created protocol combinations)
- **Purpose**: Daily routine builder - users combine protocols into stacks
- **Primary Key**: `id` (UUID)
- **Foreign Key**: `user_id` → profiles(id)
- **Columns**:
  - `name` (text, required)
  - `description` (text, nullable)
  - `protocol_ids` (UUID array) - protocols included in stack
  - `schedule` (enum: daily, weekdays, weekends, custom)
  - `custom_days` (integer array) - 0=Sun, 1=Mon, etc. for custom schedules
  - `is_active` (boolean, default true)
  - `created_at` (timestamp)
  - `updated_at` (timestamp, auto-updated via trigger)
- **RLS**: Full CRUD access only to own stacks
- **Index**: `idx_stacks_user_id`

#### **tracking** (Daily completion records)
- **Purpose**: Track adherence to protocols
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: 
  - `user_id` → profiles(id)
  - `stack_id` → stacks(id)
  - `protocol_id` → protocols(id)
- **Columns**:
  - `date` (date)
  - `completed` (boolean, default false)
  - `completed_at` (timestamp, nullable)
  - `notes` (text, nullable)
  - `created_at` (timestamp)
- **Constraints**: Unique constraint on (user_id, stack_id, protocol_id, date)
- **RLS**: Full CRUD access only to own tracking records
- **Indexes**: 
  - `idx_tracking_user_id`
  - `idx_tracking_date`
  - `idx_tracking_user_date`

### Enums
- `category`: sleep, focus, energy, fitness
- `difficulty`: easy, medium, hard
- `frequency`: daily, weekly
- `schedule`: daily, weekdays, weekends, custom
- `subscription_tier`: free, pro

---

## 2. Type Definitions (`types/database.ts`)

Complete TypeScript generated types for Supabase with CRUD operations:

```typescript
// JSON flexible type
type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

// Row types (SELECT)
Protocol = { id, name, description, category, difficulty, duration_minutes, frequency, science_summary, steps[], created_at }
Stack = { id, user_id, name, description, protocol_ids[], schedule, custom_days[], is_active, created_at, updated_at }
Tracking = { id, user_id, stack_id, protocol_id, date, completed, completed_at, notes, created_at }
Profile = { id, email, name, avatar_url, subscription_tier, created_at, updated_at }

// Insert types (POST - all required fields optional except foreign keys)
ProtocolInsert = Protocol with id/timestamps optional
StackInsert = Stack with id/timestamps optional
TrackingInsert = Tracking with id/timestamps optional
ProfileInsert = Profile with id required, timestamps optional

// Update types (PATCH - all fields optional)
ProtocolUpdate = all fields optional
StackUpdate = all fields optional
TrackingUpdate = all fields optional
ProfileUpdate = all fields optional

// Enum exports
ProtocolCategory = 'sleep' | 'focus' | 'energy' | 'fitness'
ProtocolDifficulty = 'easy' | 'medium' | 'hard'
```

---

## 3. Supabase Client Configuration

### Browser Client (`lib/supabase/client.ts`)
- **Function**: `createClient()`
- **Purpose**: Provides browser/client-side Supabase instance
- **Implementation**: Uses `@supabase/ssr` createBrowserClient
- **Auth**: Uses anonymous key from environment variables
- **Environment Variables**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Usage**: Client-side operations (React components, browser-only)

### Server Client (`lib/supabase/server.ts`)
- **Function**: `createClient()` (async)
- **Purpose**: Provides server-side Supabase instance with session persistence
- **Implementation**: Uses `@supabase/ssr` createServerClient with cookie storage
- **Cookie Handling**:
  - `getAll()`: Retrieves all cookies from request
  - `setAll()`: Sets cookies in response (with error handling for Server Components)
- **Usage**: Server actions, API routes, middleware
- **Key Difference**: Manages session cookies automatically for authenticated requests

---

## 4. Middleware Implementation (`lib/supabase/middleware.ts` & `middleware.ts`)

### Main Middleware Function
**File**: `lib/supabase/middleware.ts` → `updateSession(request: NextRequest)`

#### Authentication Flow
1. **Create Server Client**: Initializes Supabase client with request cookies
2. **Refresh Session**: Calls `supabase.auth.getUser()` to validate/refresh session
3. **Route Protection**: Checks if route is protected and redirects unauthenticated users
4. **Auth Redirect**: Redirects authenticated users away from login/callback routes

#### Protected Routes
```
/protocols
/stacks
/today
/settings
```

#### Route Handlers
- **Login Route** (`/login`): Accessible to anyone; authenticated users redirected to `/today`
- **Callback Route** (`/callback`): Auth callback endpoint (login redirect)
- **Protected Routes**: Redirect to `/login` if unauthenticated
- **Other Routes**: Accessible to everyone

#### Response Management
- Updates cookies in NextResponse for session persistence
- Handles Server Component cookie errors gracefully

### Next.js Middleware Config (`middleware.ts`)
- **Matcher**: Matches all routes except static assets and images
- **Pattern**: `/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)`

---

## 5. Seed Data (`lib/supabase/seed.sql`)

30 science-backed protocols pre-populated across 4 categories:

### Sleep Protocols (8)
1. Morning Sunlight Exposure - Easy, 20 min daily
2. Caffeine Cutoff - Medium, daily
3. Blue Light Blocking - Easy, daily
4. Temperature Optimization - Easy, daily
5. Consistent Sleep Schedule - Hard, daily
6. Magnesium Before Bed - Easy, daily
7. Screen-Free Wind Down - Medium, 60 min daily
8. Evening Walk - Easy, 15 min daily

### Focus Protocols (7)
1. 90-Minute Deep Work Blocks - Medium, 90 min daily
2. Strategic Caffeine Timing - Medium, daily
3. Cold Exposure for Alertness - Hard, 5 min daily
4. Movement Breaks - Easy, 10 min daily
5. Ultradian Rhythm Work - Medium, daily
6. Environment Optimization - Easy, weekly
7. Phone-Free Focus Blocks - Medium, daily

### Energy Protocols (8)
1. 16:8 Intermittent Fasting - Medium, daily
2. Protein-First Breakfast - Easy, daily
3. Blood Sugar Stability - Medium, daily
4. Hydration Protocol - Easy, daily
5. Seed Oil Elimination - Hard, daily
6. Afternoon Sunlight - Easy, 15 min daily
7. Power Nap Protocol - Easy, 20 min daily
8. Evening Meal Timing - Medium, daily

### Fitness Protocols (7)
1. Zone 2 Cardio - Medium, 45 min weekly
2. Resistance Training - Medium, 45 min weekly
3. Daily Walking - Easy, daily (7k-10k steps)
4. Deliberate Cold/Heat Exposure - Hard, 20 min weekly
5. Daily Mobility Routine - Easy, 15 min daily
6. Active Recovery - Easy, 30 min weekly
7. Progressive Overload Tracking - Medium, weekly

---

## 6. Utility Functions (`lib/utils.ts`)

### `cn()` - Class Name Utility
```typescript
export function cn(...inputs: ClassValue[]): string
```
- **Purpose**: Merge Tailwind CSS classes without conflicts
- **Dependencies**: `clsx` (conditional classes) + `tailwind-merge` (deduplication)
- **Usage**: Safely combine dynamic and static Tailwind classes
- **Example**: `cn("px-2", someCondition && "text-red-500")` → merges without duplicates

---

## 7. Authentication & Session Flow

### User Signup Flow
1. User signs up via Supabase Auth (Google OAuth or Magic Link)
2. `handle_new_user()` trigger fires automatically
3. New profile created in profiles table with metadata from auth.users
4. Profile linked via UUID (auth.users.id = profiles.id)
5. Default: Free tier subscription

### Session Persistence
1. Middleware refreshes session on every request
2. Cookies stored in browser (managed by Supabase SSR client)
3. Server components can access session via server client
4. Protected routes validate authentication before serving

---

## 8. Row-Level Security (RLS) Policies

### Protocols
- **SELECT**: Public - all users can read

### Profiles
- **SELECT**: `auth.uid() = id` - users see only their profile
- **UPDATE**: `auth.uid() = id` - users edit only their profile

### Stacks
- **SELECT**: `auth.uid() = user_id` - users see only their stacks
- **INSERT**: `auth.uid() = user_id` - users create only their stacks
- **UPDATE**: `auth.uid() = user_id` - users edit only their stacks
- **DELETE**: `auth.uid() = user_id` - users delete only their stacks

### Tracking
- **SELECT**: `auth.uid() = user_id` - users see only their tracking
- **INSERT**: `auth.uid() = user_id` - users create only their tracking
- **UPDATE**: `auth.uid() = user_id` - users edit only their tracking
- **DELETE**: `auth.uid() = user_id` - users delete only their tracking

---

## File Structure Summary

```
lib/
├── utils.ts                    # Tailwind class merging utility
└── supabase/
    ├── client.ts              # Browser Supabase client factory
    ├── server.ts              # Server Supabase client factory (async)
    ├── middleware.ts          # Session refresh & route protection
    ├── schema.sql             # Database schema & RLS setup
    └── seed.sql               # 30 protocols + sample data

types/
└── database.ts                # Full TypeScript definitions

root/
└── middleware.ts              # Next.js middleware entrypoint
```

---

## Key Architectural Insights

1. **Separation of Concerns**: Browser client vs server client clearly separated
2. **Type Safety**: Full TypeScript coverage with Insert/Update/Row types
3. **Security**: RLS policies enforce user data isolation at database level
4. **Scalability**: UUID primary keys enable distributed architecture
5. **Automation**: Triggers handle profile creation and timestamp updates
6. **Session Management**: Middleware refreshes on every request for consistency
7. **Array Columns**: Using PostgreSQL arrays for protocol_ids and custom_days

---

## Environment Requirements

```env
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key from Supabase dashboard]
```

**Note**: Use public variables (NEXT_PUBLIC_*) for browser client

---

## Unresolved Questions

None - all files comprehensively documented with clear implementations and no ambiguities.
