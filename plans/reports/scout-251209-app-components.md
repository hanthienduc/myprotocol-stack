# Scout Report: MyProtocolStack App & Components Architecture
Date: 2025-12-09 | Scope: `app/` & `components/` directories

## Executive Summary
MyProtocolStack uses Next.js 15 App Router with TypeScript, shadcn/ui components, and Supabase for auth/data. Architecture follows route-based structure with 4 protocol categories (sleep, focus, energy, fitness), user stacks (combinations), and daily tracking. All components are client-side optimized with proper state management and error handling.

---

## PAGE STRUCTURE & ROUTING

### Root Layout (`app/layout.tsx`)
- **Purpose**: Global layout wrapper with metadata
- **Key Features**:
  - Google fonts (Geist Sans/Mono)
  - Sonner toast notification system
  - Global CSS imports
  - SEO metadata with keywords: health protocols, biohacking, sleep optimization, focus, productivity, habit tracking
- **Auth**: No auth check (allows public access)

### Landing Page (`app/page.tsx`)
- **Purpose**: Public-facing hero page with features & CTAs
- **Sections**:
  1. Header with logo, Log In & Get Started buttons
  2. Hero section - value proposition with category icons
  3. How It Works section - 3-step process (Browse → Build → Track)
  4. Protocol Categories section - 4 cards with counts & descriptions
  5. CTA section & footer
- **Styling**: Responsive grid layouts, Tailwind CSS
- **Links**: All direct users to `/login` or `/protocols` routes

---

## AUTH FLOW

### Login Page (`app/(auth)/login/page.tsx`)
- **Type**: Client component ("use client")
- **Auth Methods**:
  1. **Google OAuth** - via `supabase.auth.signInWithOAuth()`
  2. **Magic Link** - via `supabase.auth.signInWithOtp(email)`
- **Form Fields**:
  - Email input (for magic link)
  - Submit button with loading state
- **Messaging**: Success/error messages displayed inline
- **Redirect**: Points to `/callback` route
- **UI Components**: Card, Input, Button, Separator from shadcn/ui
- **State**: `email`, `loading`, `message`

### Auth Callback Route (`app/(auth)/callback/route.ts`)
- **Type**: API route handler
- **Flow**:
  1. Receives `code` param from OAuth provider
  2. Exchanges code for session via `supabase.auth.exchangeCodeForSession(code)`
  3. Redirects to `/today` on success (or custom `next` param)
  4. Redirects to `/login?error=auth_failed` on failure
- **Error Handling**: Graceful redirect with error query param

### Sign Out Button (`components/auth/sign-out-button.tsx`)
- **Type**: Client component
- **Functionality**:
  - Calls `supabase.auth.signOut()`
  - Redirects to `/` (home)
  - Triggers router refresh
- **UI**: Styled as dropdown menu item
- **Hooks**: useRouter

---

## DASHBOARD LAYOUT & PROTECTED ROUTES

### Dashboard Layout (`app/(dashboard)/layout.tsx`)
- **Type**: Server component (async)
- **Protection**: Checks auth via `supabase.auth.getUser()`, redirects unauthenticated users to `/login`
- **Header Features**:
  - MyProtocolStack logo (links to `/today`)
  - Desktop nav: Today | Protocols | My Stacks
  - User avatar dropdown with:
    - Display name & email
    - Settings link
    - Sign Out button
- **Mobile Nav**: Bottom navigation bar (hidden on md screens)
- **Avatar**: Uses initials from user metadata or email first char
- **Styling**: Sticky header with backdrop blur, responsive layout

### Dashboard Routes Protected by Group
All routes under `(dashboard)/` require authentication:
- `/today` - daily tracking view
- `/protocols` - protocol library browse
- `/stacks` - stack management
- `/stacks/new` - create new stack
- `/stacks/[id]` - edit specific stack
- `/settings` - account settings

---

## CORE PAGES

### Protocols Page (`app/(dashboard)/protocols/page.tsx`)
- **Type**: Server component
- **Data Fetching**:
  - Fetches all protocols from Supabase `protocols` table
  - Sorts by category then name
- **Filtering** (via searchParams):
  - Category filter: sleep, focus, energy, fitness
  - Text search on protocol name (case-insensitive)
- **Display**:
  - Grouped by category with category icons & counts
  - Uses ProtocolCard component in 3-column grid
  - Shows "No protocols found" if empty
- **Components**: ProtocolFilters (search/category buttons), ProtocolCard

### Stacks Page (`app/(dashboard)/stacks/page.tsx`)
- **Type**: Server component
- **Data Fetching**:
  - Gets user's stacks from `stacks` table
  - Fetches related protocols by IDs
  - Creates Map lookup for protocol data
- **Display**:
  - Grid of stack cards (3 per row on lg screens)
  - Each card shows: name, active/inactive badge, description, protocol count, schedule label
  - Shows protocol badges (first 3 + "+X more")
  - Empty state with CTA to create first stack
- **Actions**: Click card to edit stack (`/stacks/[id]`)
- **Create Button**: Links to `/stacks/new`

### New Stack Page (`app/(dashboard)/stacks/new/page.tsx`)
- **Type**: Server component (lightweight wrapper)
- **Purpose**: Create new stack form
- **Data**: Fetches all protocols ordered by category & name
- **Child Component**: StackBuilder (handles form & submission)

### Edit Stack Page (`app/(dashboard)/stacks/[id]/page.tsx`)
- **Type**: Server component with dynamic route
- **Auth Check**: Verifies stack ownership (user_id match)
- **Error Handling**: Returns 404 if stack not found or not owned
- **Data Fetching**:
  - Gets specific stack by ID & user_id
  - Fetches all protocols
- **Child Components**: StackBuilder (edit mode) + DeleteStackButton
- **DeleteStackButton**: Shown in header with red destructive styling

### Today Page (`app/(dashboard)/today/page.tsx`)
- **Type**: Server component
- **Purpose**: Daily tracking dashboard
- **Data Fetching**:
  - Gets active stacks for user
  - Fetches today's tracking records (by date)
  - Fetches protocols for all stacks
  - Generates ISO date string for today
- **Empty State**: Shows CTA to browse protocols or create first stack
- **Child Component**: TodayView (handles tracking UI & logic)
- **Display**: Shows formatted date (e.g., "Monday, December 9, 2025")

### Settings Page (`app/(dashboard)/settings/page.tsx`)
- **Type**: Server component
- **Data**: 
  - Gets user from auth
  - Fetches profile from `profiles` table
- **Sections**:
  1. **Profile Card** - name, email, account creation date (read-only display)
  2. **Subscription Card** - shows current plan (Free or Pro), displays Pro upgrade CTA with $9.99/month pricing (marked "Coming soon")
  3. **Data Card** - placeholder for export/delete functionality ("Coming soon")
- **No Edit Functionality**: Currently displays information only

---

## COMPONENT LIBRARY

### Protocol Card (`components/protocols/protocol-card.tsx`)
- **Type**: Client component
- **Purpose**: Displays protocol details in card & modal
- **Props**:
  - `protocol: Protocol` (required)
  - `onAddToStack?: (protocol: Protocol) => void` (optional callback)
  - `showAddButton?: boolean` (default: false)
- **States**: `open` (dialog open/close)
- **Features**:
  - Card trigger opens dialog modal
  - Dialog shows full protocol details
  - Category & difficulty color-coded badges
  - Displays: steps (ordered list), science summary, duration, frequency
  - Optional "Add to Stack" button
- **Colors**:
  - Sleep: indigo, Focus: amber, Energy: yellow, Fitness: green
  - Easy: green, Medium: yellow, Hard: red
  - Dark mode support included
- **Styling**: Hover effects, line clamping on descriptions

### Protocol Filters (`components/protocols/protocol-filters.tsx`)
- **Type**: Client component
- **Purpose**: Category & search filtering on protocols page
- **State Management**:
  - Uses `useSearchParams()` for URL-based state
  - Updates URL on filter changes
- **Features**:
  1. **Category buttons** - 5 options (All, Sleep, Focus, Energy, Fitness) with icons
  2. **Search input** - real-time text search
- **Logic**: 
  - Active button highlighted with "default" variant
  - Category "all" removes `category` param from URL
  - Search param updates on input change
- **Router Integration**: Uses `router.push()` to update URL

### Stack Builder (`components/stacks/stack-builder.tsx`)
- **Type**: Client component
- **Purpose**: Create & edit stacks with protocol selection
- **Props**:
  - `protocols: Protocol[]` (all available protocols)
  - `initialStack?: Stack` (optional, for edit mode)
- **State Variables**:
  - `name`, `description` - stack metadata
  - `selectedProtocols: Set<string>` - protocol IDs
  - `schedule` - daily, weekdays, or weekends
  - `isActive` - toggle for "Today" view inclusion
  - `isPending` - transition state during submission
- **Form Sections**:
  1. **Stack Details Card**
     - Name input (required)
     - Description input (optional)
     - Schedule selector (3 button options)
     - Active checkbox
  2. **Protocol Selection Card**
     - Tabs for each category
     - Checkboxes with names, descriptions, difficulty, duration
     - Selected count badge
     - Clickable rows toggle selection
  3. **Summary Card** (shown when protocols selected)
     - Badges showing selected protocols
     - Click badge to deselect
  4. **Submit Buttons**
     - Cancel (goes back)
     - Submit (Create/Update based on mode)
- **Validation**:
  - Requires stack name
  - Requires at least 1 protocol selected
  - User must be logged in
- **Database Logic**:
  - INSERT for new stack
  - UPDATE for existing stack (if initialStack provided)
  - Error & success toast notifications
- **Post-Submit**: Redirects to `/stacks` & refreshes router

### Delete Stack Button (`components/stacks/delete-stack-button.tsx`)
- **Type**: Client component
- **Purpose**: Safe stack deletion with confirmation dialog
- **Props**:
  - `stackId: string`
  - `stackName: string`
- **States**: `open`, `isPending`
- **Features**:
  - Destructive button (red) triggers confirmation dialog
  - Dialog shows stack name in warning message
  - Notes: "All tracking data for this stack will also be deleted"
  - Cancel & Delete buttons in footer
  - Delete disabled during submission
- **Database Logic**: `supabase.from("stacks").delete().eq("id", stackId)`
- **Post-Delete**: Shows success toast, closes dialog, redirects to `/stacks`, refreshes

### Today View (`components/tracking/today-view.tsx`)
- **Type**: Client component
- **Purpose**: Daily protocol tracking interface
- **Props**:
  - `stacks: Stack[]`
  - `protocols: Protocol[]`
  - `trackingRecords: Tracking[]`
  - `userId: string`
  - `date: string` (ISO format)
- **State**: `localTracking: Record<string, boolean>` - local completion status
- **Features**:
  1. **Overall Progress Card**
     - Shows X of Y protocols completed
     - Progress bar with percentage
  2. **Stack Cards** (one per active stack)
     - Stack name & completion count badge
     - Stack description (if provided)
     - List of protocols with checkboxes
     - Protocol item styling changes on completion (strikethrough, muted)
  3. **Protocol Items**
     - Category icon
     - Protocol name
     - Description
     - Duration (if available)
     - Checkbox for completion toggle
- **Database Sync**:
  - On checkbox toggle: upserts tracking record
  - Uses conflict strategy: `user_id,stack_id,protocol_id,date`
  - Sets `completed` boolean & `completed_at` timestamp
  - Handles errors by reverting local state
  - Triggers router refresh on success
- **Loading**: `isPending` disables checkboxes during submission
- **Data Mapping**: Creates protocol Map for efficient lookup

### Sign Out Button (already covered above)
Location: `/components/auth/sign-out-button.tsx`

---

## SHADCN/UI COMPONENTS USED
All imported from `/components/ui/`:
- `Button` - primary, outline, ghost, destructive, sm/lg sizes
- `Card`, `CardHeader`, `CardContent`, `CardTitle`, `CardDescription` - layout
- `Input` - text, email inputs
- `Checkbox` - toggle selections
- `Badge` - category/difficulty/status labels
- `Dialog`, `DialogContent`, `DialogDescription`, `DialogHeader`, `DialogTitle`, `DialogTrigger`, `DialogFooter` - modals
- `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger` - tabbed interfaces
- `Separator` - visual dividers
- `Avatar`, `AvatarFallback`, `AvatarImage` - user profile images
- `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`, `DropdownMenuTrigger` - user menu
- `Progress` - progress bars
- `Sonner` (Toaster) - toast notifications

---

## PATTERNS & CONVENTIONS

### State Management
- Server components handle data fetching & auth checks
- Client components use React hooks: `useState`, `useTransition`
- URL-based state for filters (searchParams)
- Local optimistic updates with database sync

### Auth Pattern
- Async server components check `supabase.auth.getUser()`
- Client auth via `createClient()` from Supabase
- Redirect to `/login` on auth failure
- OAuth + Magic Link dual auth methods

### Data Flow
- Server components fetch Supabase data
- Pass data as props to client components
- Client components handle interactions (clicks, form submission)
- Mutations use Supabase client & toast notifications
- Router.refresh() syncs state after mutations

### Naming
- Kebab-case filenames: `protocol-card.tsx`, `delete-stack-button.tsx`
- PascalCase component exports: `ProtocolCard`, `DeleteStackButton`
- Meaningful names describe purpose clearly

### Error Handling
- Try-catch for database operations
- Toast notifications for user feedback
- Graceful fallbacks (empty states, 404s)
- Console errors logged for debugging

### Styling
- Tailwind CSS for all styling
- shadcn/ui for consistent components
- CSS variables for theming (dark mode support)
- Responsive layouts (sm:, md:, lg: breakpoints)
- Color constants for categories & difficulty levels

### Form Validation
- Client-side validation in handlers
- Required field checks
- Error messages via toast notifications
- Disabled states during submission (isPending)

---

## DATABASE SCHEMA (TYPES)

### Protocol
- id, name, description, category (sleep|focus|energy|fitness)
- difficulty (easy|medium|hard), duration_minutes, frequency (daily|weekly)
- science_summary, steps (array), created_at

### Stack
- id, user_id, name, description, protocol_ids (array)
- schedule (daily|weekdays|weekends|custom), custom_days (array), is_active
- created_at, updated_at

### Tracking
- id, user_id, stack_id, protocol_id, date
- completed (boolean), completed_at (timestamp), notes, created_at

### Profile
- id, email, name, avatar_url
- subscription_tier (free|pro), created_at, updated_at

---

## KEY IMPLEMENTATION DETAILS

### Protocol Categories
- **Sleep** (🌙): 8 protocols - circadian rhythm, temperature, caffeine, etc.
- **Focus** (🎯): 7 protocols - 90-min blocks, cold exposure, phone-free, etc.
- **Energy** (⚡): 8 protocols - fasting, hydration, meal timing, etc.
- **Fitness** (💪): 7 protocols - Zone 2 cardio, resistance, mobility, etc.

### Stack Schedules
- `daily` - Every day
- `weekdays` - Mon-Fri
- `weekends` - Sat-Sun
- `custom` - Custom days (not yet implemented in UI)

### Subscription Tiers
- **Free**: 3 stacks, basic tracking (currently enforced)
- **Pro**: Unlimited stacks, analytics, AI recommendations ($9.99/mo, coming soon)

### User Metadata
- Sourced from OAuth provider (Google)
- Fields: name, avatar_url
- Used for profile display & avatar initials

---

## UNRESOLVED QUESTIONS & NOTES

1. **Stack Limits**: Free tier 3-stack limit not enforced in current StackBuilder code
2. **Custom Schedule**: UI doesn't support custom_days selection (marked for future)
3. **Data Export/Delete**: Settings page indicates "Coming soon" but no implementation
4. **AI Recommendations**: Pro feature mentioned in settings but no code present
5. **Analytics**: Pro feature mentioned but no dashboard/implementation
6. **Profile Editing**: Settings page is read-only, no edit functionality
7. **Protocol Search**: Works on name only, not description/science_summary
8. **Batch Operations**: No bulk delete/export for stacks or tracking data
9. **Conflict Resolution**: Tracking upsert uses specific conflict strategy - no soft deletes implemented

---

## FILE LISTING

### App Routes
- `/Users/td-han-local/arthur/myprotocolstack/app/layout.tsx`
- `/Users/td-han-local/arthur/myprotocolstack/app/page.tsx`
- `/Users/td-han-local/arthur/myprotocolstack/app/(auth)/login/page.tsx`
- `/Users/td-han-local/arthur/myprotocolstack/app/(auth)/callback/route.ts`
- `/Users/td-han-local/arthur/myprotocolstack/app/(dashboard)/layout.tsx`
- `/Users/td-han-local/arthur/myprotocolstack/app/(dashboard)/protocols/page.tsx`
- `/Users/td-han-local/arthur/myprotocolstack/app/(dashboard)/stacks/page.tsx`
- `/Users/td-han-local/arthur/myprotocolstack/app/(dashboard)/stacks/new/page.tsx`
- `/Users/td-han-local/arthur/myprotocolstack/app/(dashboard)/stacks/[id]/page.tsx`
- `/Users/td-han-local/arthur/myprotocolstack/app/(dashboard)/today/page.tsx`
- `/Users/td-han-local/arthur/myprotocolstack/app/(dashboard)/settings/page.tsx`

### Components
- `/Users/td-han-local/arthur/myprotocolstack/components/auth/sign-out-button.tsx`
- `/Users/td-han-local/arthur/myprotocolstack/components/protocols/protocol-card.tsx`
- `/Users/td-han-local/arthur/myprotocolstack/components/protocols/protocol-filters.tsx`
- `/Users/td-han-local/arthur/myprotocolstack/components/stacks/stack-builder.tsx`
- `/Users/td-han-local/arthur/myprotocolstack/components/stacks/delete-stack-button.tsx`
- `/Users/td-han-local/arthur/myprotocolstack/components/tracking/today-view.tsx`

### UI Components (shadcn/ui)
- 13 base components in `/components/ui/`

### Types
- `/Users/td-han-local/arthur/myprotocolstack/types/database.ts`

---

End of Scout Report
