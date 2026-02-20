# FocusQuest 🎯

A student motivation app that turns focus sessions into prize draw entries. Students earn entries by completing Pomodoro focus sessions, maintaining streaks, and finishing daily quests. Parents get a separate dashboard to monitor progress and give encouragement boosts.

## Stack

- **Next.js 15** (App Router, React 19)
- **Firebase** (Auth + Firestore)
- **Tailwind CSS**
- **TypeScript**

## Project Structure

```
src/
├── app/
│   ├── auth/           Student login + signup
│   ├── dashboard/      Student home
│   ├── timer/          Focus timer (25 or 50 min)
│   ├── quests/         Daily quest selection
│   ├── entries/        Prize entry balance + history
│   ├── link-parent/    Student enters parent invite code
│   └── parent/         Parent portal (separate auth)
│       ├── login/
│       ├── signup/
│       ├── dashboard/
│       ├── child/[childId]/
│       ├── add-child/
│       └── settings/
├── lib/
│   ├── firebase.ts          Firebase init
│   ├── db.ts                Student Firestore operations
│   ├── auth-context.tsx     Student auth
│   ├── parent-db.ts         Parent Firestore operations
│   └── parent-auth-context.tsx
└── types/
    ├── index.ts     Student types
    └── parent.ts    Parent types
```

## Setup

### 1. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Email/Password + Google
4. Enable **Firestore Database** (start in test mode, then deploy rules)

### 2. Get your Firebase config

Firebase Console → Project Settings → Your apps → Web app → Config

### 3. Set environment variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### 4. Install and run

```bash
npm install
npm run dev
```

App runs at `http://localhost:3000`

### 5. Deploy Firestore rules and indexes

```bash
npm install -g firebase-tools
firebase login
firebase init  # select Firestore, link to your project
firebase deploy --only firestore:rules,firestore:indexes
```

### 6. Seed default quests

Run this once in your browser console after signing in as a student, or via Firebase Admin SDK:

```js
// In Firebase Console → Firestore → Add documents manually under /quests
// or run the seed function from src/lib/db.ts DEFAULT_QUESTS array
```

## Deploy to Vercel

1. Push to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Add the 6 `NEXT_PUBLIC_FIREBASE_*` environment variables in Vercel dashboard
4. Deploy ✓

## URLs

| Path | Description |
|------|-------------|
| `/` | Redirects to `/dashboard` |
| `/auth/login` | Student login |
| `/auth/signup` | Student signup |
| `/dashboard` | Student home |
| `/timer?duration=25` | 25-min focus timer |
| `/timer?duration=50` | 50-min focus timer |
| `/quests` | Daily quest picker |
| `/entries` | Prize entry balance |
| `/link-parent` | Student links to parent |
| `/parent/login` | Parent login |
| `/parent/signup` | Parent signup |
| `/parent/dashboard` | Parent home — children overview |
| `/parent/child/[id]` | Individual child detail + boost |
| `/parent/add-child` | Generate invite code |
| `/parent/settings` | Plan + notification settings |

## Entry earning rules

| Action | Entries |
|--------|---------|
| 25-min focus session | +1 |
| 50-min focus session | +2 |
| 7-day streak bonus | +3 |
| Parent effort boost | +1 to +3 |
| Welcome bonus | +5 |

Max 4 sessions/day · Max 2 parent boosts/week/child · Max 32 entries/week from sessions
