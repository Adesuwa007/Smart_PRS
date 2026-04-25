# SmartPRS - Technical Knowledge Base 🧠

This document provides an in-depth breakdown of the technology stack, libraries, architecture, and structural components used in the **SmartPRS** (Intelligent Placement Readiness System) platform.

---

## 🏗️ Core Technology Stack

SmartPRS is built using a modern, serverless JavaScript/TypeScript stack designed for rapid iteration, high performance, and scalability.

*   **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
    *   Leverages Server Components, Server Actions, and Client Components where interactivity is needed.
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
    *   Ensures type safety across the full stack (frontend and backend interactions).
*   **UI/Rendering:** [React 18](https://react.dev/)
    *   Handles UI state, component lifecycles, and reactive data binding.
*   **Database & Auth:** [Supabase](https://supabase.com/)
    *   Open-source Firebase alternative powered by PostgreSQL. Handles authentication, row-level security (RLS), and real-time database subscriptions.
*   **Monetization:** [Stripe](https://stripe.com/)
    *   Payment gateway for SaaS subscriptions (Pro and Enterprise tiers).

---

## 📦 NPM Packages & Dependencies

Below is the detailed list of libraries powering specific functionalities within the app.

### UI & Styling
*   **`tailwindcss` (^3.4.1):** Utility-first CSS framework for rapid, custom UI development without writing raw CSS.
*   **`framer-motion` (^12.38.0):** Powerful animation library used for page transitions, the animated PRS gauge, and interactive component feedback.
*   **`lucide-react` (^1.9.0):** Clean, scalable SVG icon library used throughout the dashboard navigation and UI elements.
*   **`clsx` (^2.1.1) & `tailwind-merge` (^3.5.0):** Utility functions to conditionally join class names and resolve Tailwind class conflicts dynamically.
*   **`react-hot-toast` (^2.5.2):** Lightweight, customizable toast notification system for success/error alerts (e.g., "Student Added successfully!").

### Data Visualization
*   **`recharts` (^3.8.1):** Composable charting library built on React components.
    *   *Used for:* The **SkillRadarChart** (student dashboard), **ProgressLineChart** (historical PRS tracking), and **BatchBarChart** (admin analytics).

### Data & Backend Integration
*   **`@supabase/supabase-js` (^2.104.1):** The official Supabase client for interacting with the Postgres database, handling real-time WebSockets, and managing auth.
*   **`@supabase/auth-helpers-nextjs` (^0.15.0):** Specialized helpers to manage Supabase authentication sessions across Next.js Server Components, Client Components, and API routes.
*   **`stripe` (^22.0.2) & `@stripe/stripe-js` (^9.3.1):** Used to create secure checkout sessions and handle webhook events for subscription upgrades.

### Utilities
*   **`html2canvas` (^1.4.1):** Takes "screenshots" of DOM elements. 
    *   *Used for:* The **Share Card** feature, allowing students to download a beautiful PNG of their Placement Readiness Card to post on LinkedIn.

---

## 🧩 Architectural Concepts

### 1. The AI Engine (`lib/ai-engine.ts`)
This is the core logic hub of SmartPRS. It does not rely on heavy external LLM APIs for the base score; instead, it uses a deterministic, transparent algorithm:
*   **PRS Calculation:** Evaluates Aptitude (25%), Coding (35%), Core Subjects (20%), and Soft Skills (20%).
*   **Penalties:** Applies dynamic penalties for low attendance (<75%) and active backlogs.
*   **Smart Coaching:** Generates deterministic, text-based coaching recommendations ("Focus on Data Structures", "Improve communication") based on the lowest scoring module.

### 2. State & Data Synchronization (`lib/students-service.ts`)
Manages the flow of student data:
*   **Server Actions:** Fetches profiles securely using the Supabase Service Role key, bypassing RLS to allow Admins and Faculty to view all students.
*   **Real-time Subscriptions:** Subscribes to Supabase `postgres_changes` so the dashboard updates instantly if another faculty member adds a score.
*   **Mock Fallback:** If the database connection fails, the system seamlessly falls back to local mock data (`lib/mock-data.ts`) to ensure the platform is always demo-able.

### 3. Role-Based Access Control (RBAC)
The application handles three distinct user personas dynamically via the `DashboardLayout.tsx` and `auth-context.tsx`:
*   **Admin/TPO:** Can view all students, track overall batch metrics, and export data.
*   **Faculty:** Can view their assigned students, log scores, and initiate improvement sessions.
*   **Student:** Can only view their own performance, access the AI coach, and download their Share Card.

---

## 📂 Key Directory Structure

*   `/app` - Next.js App Router (Pages, Layouts, API Routes)
    *   `/dashboard/admin` - Admin specific views
    *   `/dashboard/faculty` - Faculty specific views
    *   `/dashboard/student` - Student specific views
*   `/components` - Reusable React components
    *   `/charts` - Recharts implementations
    *   `/dashboard` - Modular UI pieces (Gauges, Panels)
    *   `/layout` - The main responsive sidebar navigation layout
    *   `/modals` - Upgrade modals, Share Card modals
*   `/lib` - Core business logic, database clients, and AI engine
*   `/types` - Global TypeScript interfaces
