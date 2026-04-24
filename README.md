# SmartPRS — Intelligent Placement Readiness System

> **SYMBIOT Hackathon 2026 · Campus Innovation Track**  
> Team DebugLeaf | PSID: SYM1014 | Vidyavardhaka College of Engineering, Mysuru

---

## What is SmartPRS?

SmartPRS is an AI-powered, real-time placement tracking and prediction platform for engineering colleges. It addresses a critical problem: **only 56.35% of Indian engineering graduates are employable**.

SmartPRS gives every college an intelligent placement cell that:
- 📊 Tracks student readiness across 5 dimensions (Aptitude, Coding, Core, Soft Skills, Attendance)
- 🧠 Calculates AI-powered Placement Readiness Scores (PRS) in real-time
- 🤖 Coaches every student personally via **SmartCoach AI**
- 🏢 Predicts company tier eligibility (FAANG → Internships)
- 📈 Generates batch analytics for TPOs and faculty

---

## 🚀 Live Demo Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Student | `student@demo.com` | `Demo@1234` | Student dashboard, SmartCoach AI, Share Card |
| Faculty | `faculty@demo.com` | `Demo@1234` | Class analytics, score entry |
| Admin/TPO | `admin@demo.com` | `Demo@1234` | Full batch analytics, all features |

---

## ⚡ Local Setup (5 Steps)

### Prerequisites
- Node.js 18+
- npm
- A Supabase account (free tier works)

### Step 1: Clone & Install
```bash
git clone https://github.com/your-repo/smartprs.git
cd smartprs
npm install
```

### Step 2: Configure Environment
```bash
cp .env.local.example .env.local
```
Edit `.env.local` with your values (Supabase is pre-configured for demo):

```env
NEXT_PUBLIC_SUPABASE_URL=https://eczsljqofaygeojdxfag.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
STRIPE_SECRET_KEY=sk_test_...         # Optional for payments demo
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Run Development Server
```bash
npm run dev
```
Open **http://localhost:3000**

### Step 4: Seed Demo Data (Optional)
The app runs entirely on built-in mock data — no seeding needed for demo.  
All 15 students, 3 demo accounts, and analytics are pre-loaded.

### Step 5: Login & Explore
Go to `/login` → click any demo account → explore dashboards.

---

## 🗄️ Supabase Setup

The Supabase project is **already configured** and connected. For your own Supabase instance:

1. Create a new project at [supabase.com](https://supabase.com)
2. Run this SQL in the SQL editor:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table profiles (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  role text check (role in ('student', 'faculty', 'admin')) default 'student',
  college_id uuid,
  plan text check (plan in ('free', 'pro', 'enterprise')) default 'free',
  department text,
  created_at timestamptz default now()
);

-- Student scores table
create table student_scores (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references profiles(id),
  aptitude int check (aptitude between 0 and 100),
  coding int check (coding between 0 and 100),
  core_subjects int check (core_subjects between 0 and 100),
  soft_skills int check (soft_skills between 0 and 100),
  attendance int check (attendance between 0 and 100),
  mock_tests_completed int default 0,
  backlogs int default 0,
  updated_at timestamptz default now()
);

-- Enable Realtime
alter publication supabase_realtime add table student_scores;
```

3. Update `.env.local` with your project's URL and anon key.

---

## 💳 Stripe Test Mode Setup

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Create account
2. Get test keys from **Developers → API Keys**
3. Add to `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
4. For webhooks (local testing):
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

---

## 🌐 Vercel Deployment

```bash
npx vercel --prod
```

That's it. One command deploys the entire app (Next.js API routes + frontend).

Set environment variables in Vercel Dashboard → Project → Settings → Environment Variables.

---

## 💰 Monetization

SmartPRS uses a **freemium SaaS model**:

| Feature | Free | Pro (₹8,499/mo) |
|---------|------|-----------------|
| Students | 50 | Unlimited |
| PRS Dashboard | ✓ | ✓ |
| AI Predictions | ✗ | ✓ |
| CSV Export | ✗ | ✓ |
| Company Filtering | ✗ | ✓ |
| AI Resume Analyzer | ✗ | ✓ |
| Batch Analytics | ✗ | ✓ |

Revenue model: B2B subscription to colleges (not students). Target: 500+ engineering colleges in India.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     SmartPRS MVP                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────┐  │
│  │  Next.js 14  │    │  AI Engine   │    │  Supabase │  │
│  │  App Router  │◄──►│  (TypeScript)│◄──►│ (Postgres)│  │
│  │  + API Routes│    │  PRS Formula │    │ + Realtime│  │
│  └─────────────┘    └──────────────┘    └───────────┘  │
│         │                                      │        │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────┐  │
│  │  Tailwind   │    │   Recharts   │    │  Stripe   │  │
│  │  Dark Theme │    │  Radar/Bar   │    │  Payments │  │
│  └─────────────┘    └──────────────┘    └───────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘

PRS Formula:
  PRS = (Aptitude×0.25 + Coding×0.35 + Core×0.20 + Soft×0.20)
         × attendance_multiplier × backlog_penalty

  attendance_multiplier = attendance ≥ 75 ? 1.0 : 0.85
  backlog_penalty = 0 backlogs → 1.0 | 1 → 0.92 | 2+ → 0.80
```

---

## 📁 Project Structure

```
smartprs/
├── app/
│   ├── page.tsx                    ← Landing page
│   ├── login/page.tsx              ← Auth (demo)
│   ├── signup/page.tsx             ← Registration
│   ├── pricing/page.tsx            ← Pricing + Stripe
│   ├── dashboard/
│   │   ├── student/page.tsx        ← Student dashboard
│   │   ├── faculty/page.tsx        ← Faculty overview
│   │   └── admin/page.tsx          ← Admin analytics
│   └── api/
│       ├── scores/route.ts         ← Score CRUD API
│       └── stripe/                 ← Checkout + webhook
├── components/
│   ├── charts/                     ← Recharts components
│   ├── dashboard/                  ← PRSGauge, SmartCoach AI
│   └── modals/                     ← Upgrade, ShareCard
├── lib/
│   ├── ai-engine.ts                ← PRS + coaching logic
│   ├── mock-data.ts                ← 15 demo students
│   └── supabase.ts                 ← DB client
└── types/index.ts                  ← TypeScript types
```

---

## 🎯 Hackathon Demo Flow

1. `https://smartprs.vercel.app/login`
2. Login as **student@demo.com**
3. View PRS gauge + radar chart + recommendations
4. Open **SmartCoach AI** (bottom-right 🤖) → ask "Give me a 7-day plan"
5. Click **Share Card** → download your readiness card
6. Switch to **admin@demo.com**
7. View batch analytics + company eligibility
8. Click **Export CSV** → upgrade modal appears
9. Settings → **Upgrade to Pro** → Stripe checkout opens

---

Built with ❤️ by Team DebugLeaf for SYMBIOT Hackathon 2026
