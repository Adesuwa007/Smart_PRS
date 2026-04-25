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

## 🌍 Real World Impact & Scalability

**Impact:** SmartPRS democratizes placement preparation. By providing objective, data-driven readiness scores, it eliminates bias and helps students focus exactly where they need improvement. Colleges can proactively identify struggling students before placement season begins, drastically improving overall hiring rates.

**Scalability:** Built on Next.js and Supabase, the architecture is inherently serverless and scales horizontally. It can effortlessly support a single college with 500 students or scale up to support state-wide university networks with hundreds of thousands of users.

---

## 💰 Monetization Strategy

SmartPRS utilizes a **B2B SaaS (Software as a Service) model** targeting educational institutions:

*   **Free Tier:** Basic PRS calculation and limited mock assessments (Perfect for individuals).
*   **Pro Tier (₹18,499/month per college):** Unlimited students, advanced AI Resume Analyzer, Company Targeting, and comprehensive CSV exports for TPOs.
*   **Enterprise Tier:** Custom integrations with university ERP systems, dedicated support, and white-labeling options.

---

## 🔮 Future Scope

*   **Mock Interview Deep-Fakes:** Using generative AI to simulate real recruiters from specific companies (e.g., an "Amazon Hiring Manager" persona).
*   **Alumni Network Integration:** Connecting "At-Risk" students with alumni mentors who successfully placed in their target companies.
*   **Real-time Job Board:** Auto-matching students to live job postings based on their PRS and specific skill breakdown.

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
Create a `.env.local` file in the root directory. 

*Note: The environment variables (like Supabase URLs and Keys) are kept secret for security. To run this project locally with real data, please contact the repository owner for the required `.env.local` values.*

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
