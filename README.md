# Times10 Time Tracker (Trackr)

A full-stack time tracking and project management application built for agencies and teams. Tracks billable hours, manages tasks across clients and projects, and provides analytics dashboards—all with role-based access control, collaborative features, and third-party integrations.

**🚀 Try it now!** Test login: `user@example.com` / `user` (see [Quick Test & Demo](#quick-test--demo) below)

**Live demo:** [trackr.times10.net](https://trackr.times10.net)

---

## Tech Stack

### Frontend
- **Astro 5** – Multi-page app with SSR, Islands architecture, and static page generation
- **React 18** – Interactive components (charts, rich text editors, forms)
- **TypeScript** – Strict mode, end-to-end type safety
- **Tailwind CSS** – Utility-first styling, responsive layouts
- **Chart.js** – Time-series charts, team performance dashboards
- **TipTap / Lexical** – Rich text editors with mentions, links, code blocks

### Backend & API
- **Astro API Routes** – Serverless endpoints (file-based routing)
- **Node.js** – Server-side logic, middleware, validation

### Database & ORM
- **PostgreSQL** – Primary data store (Neon serverless)
- **Drizzle ORM** – Type-safe schema, migrations, queries
- **Neon** – Serverless Postgres with connection pooling

### Auth & Security
- **Session-based auth** – HTTP-only cookies, 7-day expiry
- **bcrypt** – Password hashing
- **Role-based access** – Admin, user roles with middleware guards
- **Parameterized queries** – SQL injection prevention

### Integrations & Services
- **Resend** – Transactional email (invitations, password reset, task assignments)
- **Slack** – OAuth, slash commands (`/track`, `/tasks`), user linking
- **Bunny CDN** – File uploads, media storage for task attachments
- **Vercel** – Hosting, serverless functions, edge config

### DevOps & Tooling
- **Drizzle Kit** – Migrations, schema push, studio
- **ESLint / Astro Check** – Linting and type checking
- **Conventional commits** – Structured changelog and deployments

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
│  Astro Pages (SSR)  │  React Islands  │  Tailwind UI             │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Astro API Routes (Vercel)                    │
│  /api/auth/*  │  /api/time-entries/*  │  /api/slack/*  │  etc.  │
│  Session middleware  │  requireRole()  │  getSessionUser()       │
└─────────────────────────────────────────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│  Neon PostgreSQL  │   │  Resend (Email)   │   │  Slack API        │
│  Drizzle ORM      │   │  Bunny CDN        │   │  OAuth + Commands │
└───────────────────┘   └───────────────────┘   └───────────────────┘
```

### Project Structure

```
src/
├── components/       # React components (charts, editors, timers)
├── db/               # Drizzle schema, queries, relations
├── layouts/          # Astro layouts (admin, dashboard)
├── lib/api/          # API client, contracts, schemas
├── pages/
│   ├── api/          # API routes (auth, time-entries, slack, etc.)
│   ├── admin/        # Admin dashboards, reports, settings
│   └── dashboard/    # User-facing dashboards, collaborations
├── services/         # notificationService, timeEntryService, timezoneService
├── utils/            # auth, session, email, timezone, validation
└── styles/           # Global CSS
```

### Data Model Highlights

- **Clients** → **Projects** → **Tasks** (hierarchical)
- **Time entries** → linked to projects and users (timer + manual duration)
- **Teams** → **Team members** (many-to-many)
- **Task discussions**, **task files**, **task links** – collaborative content
- **Sessions**, **invitation tokens**, **password reset tokens** – auth flows

### API Design

- REST-style endpoints under `/api/`
- Consistent JSON responses: `{ success, data?, error?, message? }`
- Context-based auth: `getSessionUser(context)`, `requireRole(context, role)`
- Parameterized SQL and input validation throughout

---

## Problems Solved

### 1. Accurate Time Tracking
- **Timer-based** and **manual duration** entries
- Timezone-safe date handling (avoid `toISOString()`-related bugs)
- `createdAt` used for manual entries; `startTime`/`endTime` for timer entries
- Unified time entry API for reporting and exports

### 2. Project & Cost Visibility
- Dashboards by **client**, **project**, and **team member**
- Filters: All Time, Today, This Week, This Month, This Quarter
- Cost calculation: hours × user pay rate per entry, summed per project
- Export and reporting APIs for external tools

### 3. Collaboration & Communication
- **Teams** per project with leads and members
- **Insights** (discussions) on tasks with threaded replies
- **Task files** and **links** stored on Bunny CDN
- Email notifications for task/subtask assignments and collaboration invites

### 4. Integrations Without Context Switching
- **Slack**: `/track`, `/tasks`, OAuth user linking
- Time logged from Slack without leaving the app

### 5. Auth & Access Control
- Session-based auth with HTTP-only cookies
- Role-based access (admin vs user)
- Invitation flow with token-based setup
- Password reset via Resend

### 6. Database Reliability
- Drizzle migrations with audit scripts
- Local/production database sync workflows
- Backup and restore procedures

---

## Key Features

| Feature | Description |
|---------|-------------|
| Time tracking | Timer start/stop and manual duration entry |
| Projects & clients | Hierarchical client → project → task structure |
| Teams | Team creation, member management, role assignment |
| Collaborative tasks | Insights (discussions), files, links, notes |
| Dashboards | Team performance, project analysis, client overview |
| Reports | Daily/weekly stats, time-series, task totals |
| Slack integration | Slash commands, OAuth, user linking |
| Email notifications | Invitations, assignments, password reset |
| File uploads | Media attachments via Bunny CDN |
| Rich text | TipTap/Lexical editors with mentions and formatting |
| **Test Login** | **user@example.com / user** - Try it now! |

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (or Neon account)

### Installation

```bash
git clone https://github.com/juuujuuu9/times10-time-trackrr.git
cd times10-time-trackrr
npm install
```

### Environment Variables
Create `.env` or `.env.local`:

```env
DATABASE_URL=postgresql://...
RESEND_API_KEY=re_...
PUBLIC_SITE_URL=https://your-domain.com
# Optional: Slack, Bunny CDN
```

### Development
```bash
npm run dev
```

### Quick Test & Demo

**Test Login Credentials:**
- **Email**: `user@example.com`
- **Password**: `user`

**To set up test data**, call the setup endpoint:
```bash
curl -X POST http://localhost:4321/api/setup-test-user
```

This creates:
- A test user with regular team member access
- A test team and collaboration
- 3 sample tasks assigned to the test user
- All necessary project/client relationships

**Demo Features to Test:**
- Login and authentication
- Time tracking on assigned tasks
- Team collaboration features (discussions, files, notes)
- Dashboard views and reports
- Task assignment and management

The test user has regular team member permissions - perfect for demonstrating how the app works for non-admin users.

**📖 Comprehensive Testing Guide**: See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for detailed testing workflows, API examples, and feature walkthroughs.

### Build & Deploy
```bash
npm run build
# Deploy to Vercel (recommended)
```

---

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:generate` | Generate migrations |
| `npm run db:push` | Push schema to DB |
| `npm run db:sync` | Sync local ↔ production |
| `npm run db:deploy` | Full production deployment workflow |

---

## License

Proprietary – Times10
