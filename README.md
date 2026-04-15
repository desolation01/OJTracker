# OJTracker

OJTracker is a Next.js 14 + Prisma application for tracking OJT hours with:

- calendar-based daily logging
- manual entry CRUD
- bulk entry creation with day-off skipping
- real-time clock in / clock out session tracking
- progress stats and completion estimation

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy environment file:

```bash
cp .env.example .env.local
```

3. Add your Supabase project credentials in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

4. Create database schema:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

5. Start the app:

```bash
npm run dev
```

6. Open `http://localhost:3000`

## Main Routes

- `/login` - sign in
- `/register` - account creation
- `/dashboard` - calendar + stats + manual entry
- `/dashboard/entries` - table + bulk entry
- `/dashboard/timeclock` - live clock in/out
- `/dashboard/settings` - target/default/day-off configuration

## Local PWA Mode (No Auth, Offline Storage)

Enable local-only PWA mode for iOS/Android testing:

```bash
NEXT_PUBLIC_PWA_LOCAL_MODE=true
```

Behavior in this mode:
- login/register are bypassed and redirected to `/dashboard`
- all data is stored in browser `localStorage` (entries, settings, active clock session)
- app registers `public/sw.js` and ships a web manifest + app icons for installability

When this flag is `false`, the app keeps the normal Supabase + database flow.
