# OJTracker — Implementation Plan

**Project:** OJTracker — OJT Hours Tracking System  
**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma, PostgreSQL  
**Last Updated:** April 13, 2026

---

## 1. Project Overview

OJTracker is a web application that allows OJT (On-the-Job Training) students to log, monitor, and manage their required training hours. The application provides a calendar-based visual interface, real-time time clock functionality, bulk entry management, and intelligent estimation of remaining hours and completion dates.

### 1.1 Target Users

- OJT students tracking their required hours (primary)
- OJT coordinators/supervisors reviewing student progress (secondary)

### 1.2 Core Features

| # | Feature | Description |
|---|---------|-------------|
| F1 | Calendar Visual | Monthly calendar showing logged hours per day with color-coded status |
| F2 | Manual Entry | Add/edit/delete hours for any specific date with time in/out |
| F3 | Bulk Entry | Add default hours across a selected date range, skipping days off |
| F4 | Default Hours | Configurable default hours per day and default time in/out |
| F5 | Default Day Off | Configurable weekly days off (e.g., Saturday, Sunday) |
| F6 | Estimated Hours Left | Real-time calculation of remaining hours to reach the target |
| F7 | Estimated Days Left | Projected working days remaining based on daily default hours |
| F8 | Time Clock | Live clock-in/clock-out that auto-calculates and logs elapsed hours |

---

## 2. Architecture & Tech Stack

### 2.1 Technology Choices

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 14 (App Router) | SSR, API routes, file-based routing, React Server Components |
| Language | TypeScript | Type safety across full stack |
| Styling | Tailwind CSS + shadcn/ui | Rapid UI development, consistent design system |
| Database | PostgreSQL | Reliable relational storage for time entries |
| ORM | Prisma | Type-safe database queries, migrations |
| Auth | NextAuth.js v5 | Session-based auth with Google/credentials providers |
| State | Zustand | Lightweight client state for UI (calendar nav, time clock) |
| Date Handling | date-fns | Lightweight, tree-shakeable date utilities |
| Deployment | Vercel | Native Next.js hosting, edge functions, preview deploys |

### 2.2 Project Structure

```
ojtracker/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout (font, theme, providers)
│   │   ├── page.tsx                   # Landing / redirect to dashboard
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── dashboard/
│   │   │   ├── layout.tsx             # Dashboard shell (sidebar, header)
│   │   │   ├── page.tsx               # Main dashboard (stats + calendar)
│   │   │   ├── entries/page.tsx       # Entry list/table view
│   │   │   ├── timeclock/page.tsx     # Time clock page
│   │   │   └── settings/page.tsx      # User settings
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── entries/
│   │       │   ├── route.ts           # GET (list), POST (create)
│   │       │   ├── [id]/route.ts      # GET, PUT, DELETE single entry
│   │       │   └── bulk/route.ts      # POST bulk create
│   │       ├── timeclock/
│   │       │   ├── route.ts           # GET status, POST clock-in
│   │       │   └── out/route.ts       # POST clock-out
│   │       └── stats/route.ts         # GET computed statistics
│   ├── components/
│   │   ├── ui/                        # shadcn/ui primitives
│   │   ├── calendar/
│   │   │   ├── CalendarGrid.tsx       # Monthly calendar grid
│   │   │   ├── CalendarDay.tsx        # Individual day cell
│   │   │   └── MonthNavigator.tsx     # Month prev/next controls
│   │   ├── entries/
│   │   │   ├── EntryForm.tsx          # Add/edit single entry
│   │   │   ├── BulkEntryForm.tsx      # Bulk add form with preview
│   │   │   └── EntryTable.tsx         # Tabular entry list
│   │   ├── dashboard/
│   │   │   ├── StatsCards.tsx         # Summary stat cards
│   │   │   ├── ProgressBar.tsx        # Visual progress to target
│   │   │   └── RecentEntries.tsx      # Latest logged entries
│   │   ├── timeclock/
│   │   │   ├── ClockDisplay.tsx       # Live clock + elapsed timer
│   │   │   └── ClockControls.tsx      # Clock in/out buttons
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       ├── Header.tsx
│   │       └── MobileNav.tsx
│   ├── lib/
│   │   ├── prisma.ts                  # Prisma client singleton
│   │   ├── auth.ts                    # NextAuth config
│   │   ├── calculations.ts           # Hours/days estimation logic
│   │   ├── validators.ts             # Zod schemas for API input
│   │   └── utils.ts                  # Date helpers, formatters
│   ├── hooks/
│   │   ├── useTimeClock.ts           # Clock in/out state + timer
│   │   ├── useEntries.ts            # CRUD operations via SWR/React Query
│   │   ├── useStats.ts              # Derived statistics
│   │   └── useCalendar.ts           # Month navigation, day selection
│   ├── stores/
│   │   └── uiStore.ts               # Zustand store for UI state
│   └── types/
│       └── index.ts                  # Shared TypeScript types
├── public/
├── tailwind.config.ts
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## 3. Database Schema

### 3.1 Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  passwordHash  String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  settings      UserSettings?
  entries       Entry[]
  clockSessions ClockSession[]
}

model UserSettings {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  targetHours       Int      @default(600)      // Total required OJT hours
  defaultHoursPerDay Float   @default(8)         // Default daily hours
  defaultStartTime  String   @default("08:00")   // HH:mm format
  defaultEndTime    String   @default("17:00")   // HH:mm format
  daysOff           Int[]    @default([0, 6])    // 0=Sun, 6=Sat
  timezone          String   @default("Asia/Manila")

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model Entry {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  date      DateTime @db.Date               // The calendar date
  hours     Int      @default(0)            // Whole hours
  minutes   Int      @default(0)            // Additional minutes (0-59)
  timeIn    String?                          // HH:mm
  timeOut   String?                          // HH:mm
  note      String?
  source    EntrySource @default(MANUAL)     // How entry was created

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, date])                   // One entry per user per day
  @@index([userId, date])
}

model ClockSession {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  clockIn   DateTime                         // Exact clock-in timestamp
  clockOut  DateTime?                        // Null while clocked in
  date      DateTime  @db.Date              // Calendar date for this session
  entryId   String?                          // Linked entry after clock-out

  createdAt DateTime  @default(now())

  @@index([userId, clockOut])                // Find active sessions quickly
}

enum EntrySource {
  MANUAL
  BULK
  TIMECLOCK
}
```

### 3.2 Key Constraints

- One entry per user per date (enforced by unique composite index).
- Clock sessions reference the calendar date they belong to, allowing the clock-out to happen on a different calendar day if someone works past midnight.
- The `source` enum tracks how each entry was created for auditing and potential undo operations.

---

## 4. API Design

All API routes live under `/api/` and return JSON. Authentication is enforced via NextAuth middleware.

### 4.1 Entry Endpoints

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|-------------|
| GET | `/api/entries?month=2026-04` | List entries for a month | — |
| POST | `/api/entries` | Create single entry | `{ date, hours, minutes, timeIn, timeOut, note }` |
| PUT | `/api/entries/[id]` | Update an entry | `{ hours?, minutes?, timeIn?, timeOut?, note? }` |
| DELETE | `/api/entries/[id]` | Delete an entry | — |
| POST | `/api/entries/bulk` | Bulk create entries | `{ startDate, endDate }` |

### 4.2 Time Clock Endpoints

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|-------------|
| GET | `/api/timeclock` | Get active session (if any) | — |
| POST | `/api/timeclock` | Clock in | `{}` |
| POST | `/api/timeclock/out` | Clock out (creates/updates entry) | `{}` |

### 4.3 Stats Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Returns computed stats object |

**Stats Response Shape:**

```json
{
  "totalMinutes": 28800,
  "totalHours": 480.0,
  "targetHours": 600,
  "remainingMinutes": 7200,
  "remainingHours": 120.0,
  "percentComplete": 80.0,
  "estimatedDaysLeft": 15,
  "estimatedCompletionDate": "2026-05-02",
  "entryCount": 60,
  "currentStreak": 5
}
```

### 4.4 Validation (Zod Schemas)

```typescript
// src/lib/validators.ts
import { z } from "zod";

export const createEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hours: z.number().int().min(0).max(24),
  minutes: z.number().int().min(0).max(59),
  timeIn: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  timeOut: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  note: z.string().max(500).optional(),
});

export const bulkEntrySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const updateSettingsSchema = z.object({
  targetHours: z.number().int().min(1).max(5000).optional(),
  defaultHoursPerDay: z.number().min(0.5).max(24).optional(),
  defaultStartTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  defaultEndTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  daysOff: z.array(z.number().int().min(0).max(6)).optional(),
});
```

---

## 5. Feature Specifications

### 5.1 Calendar Visual (F1)

**Behavior:**
- Displays a monthly grid (7 columns × 5–6 rows).
- Each day cell shows: the date number, total logged hours (if any), and a color indicator.
- Color coding: no entry (neutral), has entry (accent), day off (dimmed), today (highlighted border).
- Clicking a day opens the entry form for that date.
- Month navigation via left/right arrows in the header.
- Current month loads by default; the calendar fetches entries for the visible month via `GET /api/entries?month=YYYY-MM`.

**Component Breakdown:**
- `MonthNavigator` — prev/next buttons, month/year label
- `CalendarGrid` — renders the 7-column grid with day headers
- `CalendarDay` — single cell, receives entry data, handles click

**Data Flow:**
1. `useCalendar` hook manages `currentMonth` state.
2. `useEntries(currentMonth)` fetches entries for visible month via SWR.
3. `CalendarGrid` maps dates to `CalendarDay` cells, injecting entry data.

### 5.2 Manual Entry (F2)

**Behavior:**
- Triggered by clicking a calendar day or the "Add Entry" button.
- Renders a form with: hours (number input), minutes (number input), time in (time picker), time out (time picker), note (text input).
- Fields pre-populate with user defaults from settings.
- If an entry already exists for the date, the form loads existing values and shows "Update" and "Delete" buttons.
- On save, calls `POST /api/entries` (create) or `PUT /api/entries/[id]` (update).
- After mutation, the calendar and stats automatically re-fetch.

**Validation:**
- Hours: 0–24, integer.
- Minutes: 0–59, integer.
- Combined hours + minutes must be > 0.
- Time in must be before time out (client-side warning, not blocking).

### 5.3 Bulk Entry (F3)

**Behavior:**
- User selects a start date and end date via date pickers.
- A preview panel shows: number of working days in range, total hours to be added.
- Working days are calculated by excluding the user's configured days off.
- Existing entries within the range are preserved (not overwritten).
- On submit, calls `POST /api/entries/bulk` which creates entries for each working day using default settings.
- Entries created via bulk are tagged with `source: BULK`.

**Server Logic (Pseudocode):**

```
1. Parse startDate, endDate from request body.
2. Validate endDate >= startDate.
3. Fetch user settings (defaultHoursPerDay, daysOff, defaultStartTime, defaultEndTime).
4. Fetch existing entries in range for this user.
5. For each date in range:
   a. Skip if day of week is in daysOff.
   b. Skip if entry already exists.
   c. Create Entry { date, hours, minutes: 0, timeIn, timeOut, source: BULK }.
6. Return created entries count.
```

### 5.4 Default Hours & Day Off (F4, F5)

**Behavior:**
- Configured in the Settings page.
- Target hours: total OJT requirement (e.g., 600 hours).
- Default hours/day: used when creating manual or bulk entries (pre-fills form).
- Default start/end time: pre-fills time in/out fields.
- Days off: togglable buttons for each day of the week. Selected days are excluded from bulk entries and estimation calculations.
- Settings are persisted to the `UserSettings` table.

### 5.5 Estimated Hours Left & Days Left (F6, F7)

**Calculation Logic (src/lib/calculations.ts):**

```typescript
interface Stats {
  totalMinutes: number;
  remainingMinutes: number;
  remainingHours: number;
  estimatedDaysLeft: number;
  estimatedCompletionDate: Date | null;
  percentComplete: number;
}

function calculateStats(
  entries: Entry[],
  settings: UserSettings
): Stats {
  // 1. Sum total minutes from all entries
  const totalMinutes = entries.reduce(
    (sum, e) => sum + e.hours * 60 + e.minutes, 0
  );

  // 2. Calculate remaining
  const targetMinutes = settings.targetHours * 60;
  const remainingMinutes = Math.max(0, targetMinutes - totalMinutes);

  // 3. Estimate days left
  const dailyMinutes = settings.defaultHoursPerDay * 60;
  const estimatedDaysLeft = dailyMinutes > 0
    ? Math.ceil(remainingMinutes / dailyMinutes)
    : 0;

  // 4. Project completion date (skip days off)
  let completionDate: Date | null = null;
  if (estimatedDaysLeft > 0) {
    let count = 0;
    const d = new Date();
    while (count < estimatedDaysLeft) {
      d.setDate(d.getDate() + 1);
      if (!settings.daysOff.includes(d.getDay())) count++;
    }
    completionDate = d;
  }

  return {
    totalMinutes,
    remainingMinutes,
    remainingHours: remainingMinutes / 60,
    estimatedDaysLeft,
    estimatedCompletionDate: completionDate,
    percentComplete: targetMinutes > 0
      ? Math.min(100, (totalMinutes / targetMinutes) * 100)
      : 0,
  };
}
```

### 5.6 Time Clock (F8)

**Behavior:**
- Displays a live digital clock (updates every second).
- "Clock In" button: records the current timestamp, starts an elapsed timer.
- While clocked in: shows elapsed time (HH:MM:SS), "Clock Out" button replaces "Clock In".
- "Clock Out" button: calculates elapsed time, creates/updates the entry for that day, ends the session.
- If an entry already exists for the day, clock-out adds to the existing hours (doesn't replace).
- Active clock session persists across page navigations (stored in DB).
- A visual indicator in the header/sidebar shows when a clock session is active.

**State Machine:**

```
IDLE ──[Clock In]──▶ CLOCKED_IN ──[Clock Out]──▶ IDLE
                         │
                    (elapsed timer runs)
                    (session persisted in DB)
```

**Clock-Out Server Logic:**

```
1. Find active ClockSession for user (clockOut is null).
2. Set clockOut = now().
3. Calculate elapsed = clockOut - clockIn (in minutes).
4. Find or create Entry for session.date.
5. Add elapsed hours/minutes to entry.
6. Set entry timeIn (if not set) and timeOut.
7. Link session.entryId to entry.
8. Return updated entry.
```

---

## 6. Development Phases

### Phase 1 — Foundation (Days 1–3)

**Goal:** Project scaffolding, database, authentication.

| Task | Details | Est. |
|------|---------|------|
| 1.1 | Initialize Next.js 14 project with TypeScript, Tailwind, ESLint | 2h |
| 1.2 | Install dependencies: prisma, next-auth, zod, date-fns, zustand, swr, shadcn/ui | 1h |
| 1.3 | Set up Prisma schema, run initial migration | 2h |
| 1.4 | Configure NextAuth with credentials provider (email/password) | 3h |
| 1.5 | Build auth pages (login, register) with form validation | 3h |
| 1.6 | Create dashboard layout shell (sidebar, header, mobile nav) | 3h |
| 1.7 | Set up Zustand store, SWR configuration | 1h |
| **Subtotal** | | **15h** |

**Deliverable:** A user can register, log in, and see an empty dashboard layout.

### Phase 2 — Core Data & Entries (Days 4–6)

**Goal:** Entry CRUD, API routes, settings.

| Task | Details | Est. |
|------|---------|------|
| 2.1 | Build `POST /api/entries` with Zod validation | 2h |
| 2.2 | Build `GET /api/entries?month=` with date filtering | 2h |
| 2.3 | Build `PUT /api/entries/[id]` and `DELETE /api/entries/[id]` | 2h |
| 2.4 | Build `EntryForm` component (add/edit mode) | 3h |
| 2.5 | Build settings API route and `SettingsForm` component | 3h |
| 2.6 | Create `useEntries` hook with SWR for data fetching and mutation | 2h |
| 2.7 | Write Zod validation schemas and error handling middleware | 1h |
| **Subtotal** | | **15h** |

**Deliverable:** A user can configure settings and create/edit/delete individual entries.

### Phase 3 — Calendar & Stats (Days 7–9)

**Goal:** Calendar visual, stats dashboard.

| Task | Details | Est. |
|------|---------|------|
| 3.1 | Build `CalendarGrid` and `CalendarDay` components | 4h |
| 3.2 | Build `MonthNavigator` with prev/next and keyboard shortcuts | 1h |
| 3.3 | Integrate calendar with entry data (color coding, hours display) | 2h |
| 3.4 | Click-to-edit: open `EntryForm` when a day is clicked | 1h |
| 3.5 | Implement `calculateStats` function | 2h |
| 3.6 | Build `StatsCards` component (4 stat cards with animations) | 2h |
| 3.7 | Build `ProgressBar` component | 1h |
| 3.8 | Build `GET /api/stats` route | 1h |
| 3.9 | Build `RecentEntries` list component | 1h |
| **Subtotal** | | **15h** |

**Deliverable:** Full dashboard with interactive calendar, stats cards, progress bar, and recent entries.

### Phase 4 — Bulk Entry & Time Clock (Days 10–12)

**Goal:** Bulk operations, live time clock.

| Task | Details | Est. |
|------|---------|------|
| 4.1 | Build `POST /api/entries/bulk` with day-off skipping logic | 3h |
| 4.2 | Build `BulkEntryForm` with date range pickers and preview | 3h |
| 4.3 | Build `ClockSession` API routes (GET status, POST in, POST out) | 3h |
| 4.4 | Build `ClockDisplay` component with live timer (useEffect interval) | 2h |
| 4.5 | Build `ClockControls` with clock-in/out buttons and session state | 2h |
| 4.6 | Add active clock indicator to sidebar/header | 1h |
| 4.7 | Handle edge cases: clock out past midnight, browser refresh during session | 2h |
| **Subtotal** | | **16h** |

**Deliverable:** Users can bulk-add entries and use the live time clock.

### Phase 5 — Polish & Deploy (Days 13–15)

**Goal:** Responsive design, error handling, testing, deployment.

| Task | Details | Est. |
|------|---------|------|
| 5.1 | Mobile-responsive layout (calendar, forms, time clock) | 3h |
| 5.2 | Loading states, skeleton screens, optimistic updates | 2h |
| 5.3 | Toast notifications for success/error feedback | 1h |
| 5.4 | Empty states and onboarding flow (first-time user) | 2h |
| 5.5 | Keyboard shortcuts (arrow keys for calendar nav, Ctrl+S to save) | 1h |
| 5.6 | Error boundaries and global error handling | 1h |
| 5.7 | Write unit tests for `calculateStats` and API validators | 2h |
| 5.8 | Write integration tests for critical API routes | 2h |
| 5.9 | Set up Vercel project, environment variables, deploy | 1h |
| 5.10 | Performance audit (Lighthouse), fix issues | 1h |
| **Subtotal** | | **16h** |

**Deliverable:** Production-ready application deployed to Vercel.

---

## 7. Timeline Summary

| Phase | Description | Duration | Cumulative |
|-------|-------------|----------|-----------|
| Phase 1 | Foundation | Days 1–3 | 15h |
| Phase 2 | Core Data & Entries | Days 4–6 | 30h |
| Phase 3 | Calendar & Stats | Days 7–9 | 45h |
| Phase 4 | Bulk Entry & Time Clock | Days 10–12 | 61h |
| Phase 5 | Polish & Deploy | Days 13–15 | 77h |
| **Total** | | **~15 working days** | **~77 hours** |

---

## 8. Environment & Configuration

### 8.1 Environment Variables

```env
# .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/ojtracker"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

### 8.2 Key Dependencies (package.json)

```json
{
  "dependencies": {
    "next": "^14.2",
    "react": "^18.3",
    "typescript": "^5.4",
    "@prisma/client": "^5.14",
    "next-auth": "^5.0.0-beta",
    "zod": "^3.23",
    "date-fns": "^3.6",
    "zustand": "^4.5",
    "swr": "^2.2",
    "@radix-ui/react-dialog": "latest",
    "@radix-ui/react-popover": "latest",
    "tailwindcss": "^3.4",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "lucide-react": "latest",
    "bcryptjs": "^2.4",
    "sonner": "^1.4"
  },
  "devDependencies": {
    "prisma": "^5.14",
    "vitest": "^1.6",
    "@testing-library/react": "^15",
    "eslint": "^8",
    "prettier": "^3"
  }
}
```

---

## 9. Data Flow Diagrams

### 9.1 Manual Entry Flow

```
User clicks calendar day
  → EntryForm opens (pre-filled with defaults or existing data)
  → User edits fields, clicks Save
  → Client validates via Zod schema
  → POST/PUT /api/entries
  → Server validates, upserts Entry in DB
  → Returns updated entry
  → SWR revalidates entries for current month
  → Calendar re-renders with updated cell
  → Stats re-compute automatically
```

### 9.2 Bulk Entry Flow

```
User navigates to Bulk Add page
  → Selects start date and end date
  → Preview calculates: working days in range × default hours
  → User clicks "Add Entries"
  → POST /api/entries/bulk { startDate, endDate }
  → Server iterates each date in range:
      Skip if dayOfWeek in user.daysOff
      Skip if entry already exists for that date
      Create Entry with defaults
  → Returns { created: N, skipped: M }
  → Client shows success toast, redirects to calendar
  → Calendar re-fetches, shows new entries
```

### 9.3 Time Clock Flow

```
User opens Time Clock page
  → GET /api/timeclock → check for active session
  → If no active session:
      Show current time, "Clock In" button
  → User clicks "Clock In":
      POST /api/timeclock → creates ClockSession { clockIn: now() }
      Timer starts counting from 00:00:00
  → While clocked in:
      Elapsed timer updates every second (client-side)
      "Clock Out" button is visible
  → User clicks "Clock Out":
      POST /api/timeclock/out
      Server: elapsed = now - clockIn
      Server: find or create Entry for session.date
      Server: add elapsed to entry hours/minutes
      Server: set clockOut on session
      Returns updated entry
  → Timer stops, shows summary of logged hours
  → Calendar and stats re-fetch
```

---

## 10. UI/UX Design Specifications

### 10.1 Design System

| Element | Specification |
|---------|--------------|
| Font (Display) | JetBrains Mono or similar monospace |
| Font (Body) | Inter or system sans-serif |
| Primary Color | Orange (#F0883E) — progress, active states |
| Success Color | Green (#3FB950) — completed entries |
| Background | Dark (#0D1117) — reduces eye strain for daily use |
| Surface | Elevated dark (#161B22) — cards, panels |
| Border Radius | 8px (small), 12px (cards), 99px (pills) |
| Spacing Scale | 4px base unit (4, 8, 12, 16, 20, 24, 32) |

### 10.2 Responsive Breakpoints

| Breakpoint | Layout |
|-----------|--------|
| < 640px (mobile) | Single column, bottom nav, compact calendar (numbers only) |
| 640–1024px (tablet) | Two columns, collapsible sidebar |
| > 1024px (desktop) | Full sidebar, 3-column stats, spacious calendar |

### 10.3 Key Interactions

- Calendar day hover: slight scale-up, border glow.
- Entry save: optimistic update with rollback on error.
- Clock in/out: button pulse animation, haptic feedback on mobile.
- Progress bar: animated fill on page load with easing.
- Month navigation: slide transition left/right.

---

## 11. Testing Strategy

| Type | Tool | Coverage Target |
|------|------|----------------|
| Unit | Vitest | `calculateStats`, date utilities, Zod schemas |
| Component | Testing Library + Vitest | Calendar rendering, form validation, stats display |
| Integration | Vitest + Prisma test DB | API routes (CRUD, bulk, clock) |
| E2E | Playwright | Critical paths: login → add entry → verify stats |

### 11.1 Critical Test Cases

1. Stats calculate correctly with mixed entries (varying hours/minutes).
2. Bulk entry skips days off and preserves existing entries.
3. Clock-out correctly adds to existing entry (not replaces).
4. Calendar correctly displays entries across month boundaries.
5. Midnight edge case: clock session spanning two calendar days.
6. Concurrent clock sessions are prevented (one active per user).
7. Settings changes immediately reflect in stat estimations.

---

## 12. Future Enhancements (Post-MVP)

| Priority | Feature | Description |
|----------|---------|-------------|
| High | Export to PDF/CSV | Generate printable DTR (Daily Time Record) reports |
| High | Supervisor Dashboard | Coordinators view all students' progress |
| Medium | Notifications | Email/push reminders to log hours |
| Medium | Weekly/Monthly Reports | Aggregated views with charts |
| Medium | Multi-session per Day | Multiple clock-in/out sessions in one day |
| Low | Dark/Light Theme Toggle | User preference for color scheme |
| Low | PWA Support | Installable app, offline entry queuing |
| Low | QR Code Clock-In | Scan a location QR to verify on-site attendance |

---

## 13. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Timezone confusion | Entries logged on wrong date | Store all dates as UTC in DB; convert to user's configured timezone on display |
| Clock session left open | Inflated hours | Auto-timeout after 12 hours; nightly cron to flag abandoned sessions |
| Bulk entry mistakes | Mass incorrect data | Preview step with count before committing; "Undo bulk" feature that deletes all BULK-source entries in a range |
| Data loss | Lost hours records | Daily DB backups; Vercel Postgres with point-in-time recovery |
| Mobile usability | Calendar too small on phones | Compact mode with list view fallback; swipe gestures for month nav |

---

*This document serves as the complete blueprint for building OJTracker. Each phase is designed to produce a working increment, allowing for review and course-correction at every stage.*
