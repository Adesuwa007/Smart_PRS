<div align="center">
  <img src="https://smart-prs.vercel.app/favicon.ico" alt="SmartPRS Logo" width="80" height="80">
  <h1 align="center">SmartPRS 🎓</h1>
  <p align="center"><strong>Intelligent Placement Readiness System</strong></p>
  <p align="center">
    <a href="https://smart-prs.vercel.app/"><strong>🔥 Live Demo (smart-prs.vercel.app)</strong></a>
  </p>
</div>

---

## 🚀 What is SmartPRS?

**SmartPRS** is a next-generation SaaS platform designed to bridge the gap between engineering students and their dream jobs. By analyzing everything from coding skills and aptitude to soft skills and attendance, SmartPRS calculates a **Placement Readiness Score (PRS)**. 

It provides real-time AI coaching, predictive analytics, and an intuitive dashboard for students, faculty, and college administrators to track and improve placement outcomes.

---

## ✨ Key Features

### 👨‍🎓 For Students
*   **The PRS Score:** Instantly know exactly how ready you are for placements (0-100 score).
*   **AI Smart Coach:** Chat with an AI that knows your weaknesses and gives personalized study plans.
*   **Soft Skills Analyzer:** Practice interviews using your camera/microphone and get instant feedback on your speech and confidence.
*   **Shareable Readiness Cards:** Export a beautiful, verified "Placement Card" to share on LinkedIn.

### 👨‍🏫 For Faculty
*   **Student Roster:** See your entire class at a glance with color-coded risk levels.
*   **Score Logging:** Easily update student scores after internal assessments.
*   **Targeted Interventions:** Identify students who are "At Risk" (<50 PRS) and schedule improvement sessions.

### 📊 For Admins & TPOs (Training & Placement Officers)
*   **Batch Analytics:** High-level metrics showing how many students are "Placement Ready".
*   **Company Targeting:** Filter students who meet specific company criteria (e.g., "Show me students eligible for Amazon").
*   **CSV Export:** Export batch data for reporting (Pro Feature).

---

## 🛠️ Tech Stack

*   **Frontend:** [Next.js 14](https://nextjs.org/) (App Router), React, TypeScript
*   **Styling:** Tailwind CSS, Recharts (for data visualization)
*   **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL, Realtime Subscriptions, Row Level Security)
*   **Authentication:** Supabase Auth
*   **Payments:** [Stripe](https://stripe.com/) (for SaaS monetization)
*   **Deployment:** [Vercel](https://vercel.com)

---

## 🧠 The AI Engine: How PRS Works

The Placement Readiness Score (PRS) is a weighted algorithm that mimics how top tech companies evaluate candidates:

```
PRS = (Aptitude × 0.25) + (Coding × 0.35) + (Core Subjects × 0.20) + (Soft Skills × 0.20)
```
*Modifiers applied:*
*   **Attendance Penalty:** If attendance < 75%, score is reduced by 15%.
*   **Backlog Penalty:** 1 backlog = -8%, 2+ backlogs = -20%.

---

## 💻 Local Setup & Development

Want to run SmartPRS locally? It takes less than 2 minutes.

### 1. Clone & Install
```bash
git clone https://github.com/Adesuwa007/Smart_PRS.git
cd smartprs-app
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Run the App
```bash
npm run dev
```
Open **http://localhost:3000** in your browser.

---

## 🔐 Demo Accounts
You can test the live app without signing up by using the built-in demo accounts:
*   **Student:** student@demo.com (Password: demo123)
*   **Faculty:** faculty@demo.com (Password: demo123)
*   **Admin:** admin@demo.com (Password: demo123)

---

<div align="center">
  <p>Built with ❤️ for the future of engineering placements.</p>
</div>
