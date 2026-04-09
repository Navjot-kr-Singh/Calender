# 📅 Calender — Interactive Personal Planner

A full-stack interactive wall calendar app built with React, Express, and MongoDB. Organize your days with notes, tasks, holiday highlights, and custom events — all beautifully themed with dark/light mode support.

**Live Demo:** [calender-indol-one.vercel.app](https://calender-indol-one.vercel.app)

---

## ✨ Features

- **📆 Interactive Calendar** — Click any date to open its notes and tasks
- **📝 Per-Day Notes** — Write notes and reflections tied to each date
- **✅ Task Tracker** — Add tasks with checkboxes, track daily progress with a percentage bar
- **🗒️ Task Detail Pages** — Click any task to open a full description editor
- **🎉 Holiday Highlights** — Indian public holidays preloaded with color-coded dots
- **📅 Custom Events** — Add personal events with 4 color choices, saved to localStorage
- **🌙 Dark / Light Mode** — Toggle with a sun/moon button, preference saved across sessions
- **🔐 Authentication** — Secure login & signup via Clerk (Google, email/password)
- **☁️ Cloud Sync** — Notes and tasks sync to MongoDB Atlas across all devices
- **🔄 Month Flip Animation** — Smooth 3D page-turn animation when changing months
- **📱 Responsive** — Works on mobile, tablet, and desktop

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 3 |
| Routing | React Router v7 |
| Auth | Clerk (`@clerk/clerk-react`) |
| Backend | Express.js / Vercel Serverless Functions |
| Database | MongoDB Atlas + Mongoose |
| Icons | Lucide React |
| Fonts | Inter (sans), Playfair Display (serif) |
| Deployment | Vercel |

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- Node.js 18+
- A [Clerk](https://dashboard.clerk.com) account
- A [MongoDB Atlas](https://cloud.mongodb.com) cluster

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/calender.git
cd calender
```

### 2. Install dependencies

```bash
# Root (frontend + serverless api deps)
npm install

# Backend (local Express server)
cd server && npm install && cd ..
```

### 3. Set up environment variables

Create `.env.local` in the project root:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxx
VITE_API_URL=http://localhost:4000/api
```

Create `server/.env`:

```env
CLERK_SECRET_KEY=sk_test_xxxxxxxxxx
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/calendar-notes
PORT=4000
```

### 4. Run the app

```bash
npm run dev
```

This starts:
- **Frontend** → `http://localhost:5173`
- **Backend** → `http://localhost:4000`

---

## 📁 Project Structure

```
calender/
├── api/                        # Vercel Serverless Functions
│   ├── lib/
│   │   ├── connectDB.js        # Singleton MongoDB connection
│   │   └── Note.js             # Mongoose model
│   ├── notes/
│   │   └── [key].js            # GET / POST /api/notes/:key
│   └── package.json            # CommonJS override for api/
│
├── server/                     # Local Express server (dev only)
│   ├── models/Note.js
│   ├── routes/noteRoutes.js
│   └── server.js
│
├── src/
│   ├── components/
│   │   ├── Calendar/
│   │   │   ├── CalendarGrid.jsx     # Calendar UI + flip animation
│   │   │   ├── NotesSection.jsx     # Notes + task tracker panel
│   │   │   ├── HeroImage.jsx        # Month hero image
│   │   │   └── WallCalendar.jsx     # Main layout
│   │   ├── AuthPages.jsx            # Login / Signup pages
│   │   └── ThemeToggle.jsx          # Dark/light mode button
│   ├── data/
│   │   └── holidays.js              # Indian public holidays 2026
│   ├── hooks/
│   │   └── useCustomEvents.js       # localStorage event manager
│   └── App.jsx
│
├── vercel.json                 # Vercel routing config
└── package.json
```

---

## 🌍 Deployment (Vercel)

### Environment Variables (add in Vercel Dashboard)

| Key | Value |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_...` from Clerk Dashboard |
| `CLERK_SECRET_KEY` | `sk_live_...` from Clerk Dashboard |
| `MONGO_URI` | MongoDB Atlas connection string |

### Steps

1. Push your code to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Framework preset → **Vite** | Root directory → `./`
4. Add the environment variables above
5. Click **Deploy**
6. Add your Vercel domain in **Clerk Dashboard → Domains**

---

## 🗓️ Holiday Data

Preloaded Indian public holidays for 2026 in `src/data/holidays.js`:

- 🔴 **National holidays** — Republic Day, Independence Day, Gandhi Jayanti
- 🟡 **Public holidays** — Holi, Diwali, Christmas, Eid, Good Friday, and more

---

## 📄 License

MIT © Navjot Kumar Singh
