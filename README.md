# Times10 Time Tracker

A modern time tracking application built with Astro, React, and PostgreSQL. Focus on simple, efficient time entry with flexible duration formats and role-based access control.

## 🔐 Authentication & User Roles

The application now supports a comprehensive authentication system with three user roles and email invitations for team onboarding.

## 🔗 Slack Integration

The application includes full Slack integration for seamless time tracking directly from Slack channels.

### Slack Features

- **Slash Commands**: Use `/track`, `/tasks`, and `/status` commands in any Slack channel
- **OAuth Integration**: Secure workspace installation and user linking
- **Real-time Time Tracking**: Record time without leaving Slack
- **Task Management**: View assigned tasks and track progress
- **Daily Summaries**: Get overview of today's time tracking

### Available Commands

- `/track <task_id> <duration> [notes]` - Record time for a specific task
- `/tasks` - View your assigned tasks with IDs
- `/status` - View today's time tracking summary

### Setup Instructions

See [SLACK_SETUP.md](./SLACK_SETUP.md) for detailed setup instructions.

### Team Invitations

Admins can invite new team members by:
1. Going to the Team Members page (`/admin/users`)
2. Clicking "Invite Team Member"
3. Filling out the invitation form with name, email, role, and pay rate
4. The invitee receives an email with a secure link to set up their account
5. The invitee clicks the link and creates their password
6. Their account is activated and they can log in

**Invitation Features:**
- Secure invitation tokens that expire in 24 hours
- Professional email templates with Times10 branding
- Automatic account activation upon password setup
- Status tracking (invited → active)

### Task Assignment Notifications

When tasks are assigned to users, they automatically receive email notifications with:
- Task name and description
- Project and client information
- Who assigned the task
- Direct link to the dashboard
- Professional email template with Times10 branding

**Notification Features:**
- Automatic email sending when tasks are assigned
- Includes task details and project context
- Direct dashboard links for quick access
- Graceful fallback for missing email configuration
- Console logging for development and testing

### User Roles

1. **Admin** (`admin`)
   - Full system access
   - Manage all users, clients, projects, and tasks
   - Access to admin dashboard at `/admin`
   - Can view all reports and system settings

2. **Manager** (`manager`)
   - Team oversight capabilities
   - View team members and their activities
   - Manage projects and assign tasks
   - Access to manager dashboard at `/manager`

3. **User** (`user`)
   - Basic time tracking functionality
   - View assigned tasks and projects
   - Access to user dashboard at `/dashboard`

### Demo Credentials

For testing purposes, the following demo accounts are available:

- **Admin**: `admin@times10.com` / `admin123`
- **Manager**: `manager@times10.com` / `manager123`
- **User**: `user@times10.com` / `user123`

## 🕐 Time Entry Features

The application supports simple time entry with various duration formats:

- **Hours**: `2h`, `2hr`, `3.5hr`, `2hours`
- **Minutes**: `30m`, `30min`, `90minutes`
- **Seconds**: `3600s`, `5400sec`
- **Time format**: `4:15`, `1:30:45`
- **Decimal hours**: `2.5` (assumes hours)

### Quick Time Entry

Enter time as simply as typing `2h` or `3.5hr` - no need to worry about start and end times. The system focuses on the amount of time spent on each task.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (Neon recommended)
- Environment variables configured

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Times10-Time-Tracker-2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   RESEND_API_KEY=your_resend_api_key_here
   BASE_URL=http://localhost:4321
   VERIFIED_EMAIL=your_verified_email@example.com
   
   # Slack Integration (optional)
   SLACK_CLIENT_ID=your_slack_client_id
   SLACK_CLIENT_SECRET=your_slack_client_secret
   SLACK_SIGNING_SECRET=your_slack_signing_secret
   SITE_URL=https://your-domain.com
   ```
   
   **Email Service Setup:**
   - Sign up for a free account at [Resend](https://resend.com)
   - Get your API key from the dashboard
   - Add it to your `.env` file as `RESEND_API_KEY`
   - The `BASE_URL` should match your application's URL

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Create demo users**
   Visit `/setup` in your browser and click "Create Demo Users" to set up test accounts.

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

8. **Access the application**
   - Visit `http://localhost:4321`
   - Use the demo credentials to log in
   - Each role will be redirected to their appropriate dashboard

9. **Test email notifications** (optional)
   - Visit `/test-task-notifications` to test the email notification system
   - This page allows you to send test task assignment emails
   - Check the console for email delivery status when RESEND_API_KEY is not configured

## 📁 Project Structure

```
/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   ├── db/                # Database schema and queries
│   ├── layouts/           # Astro layouts
│   ├── pages/             # Application pages
│   │   ├── api/           # API endpoints
│   │   │   └── auth/      # Authentication endpoints
│   │   ├── admin/         # Admin dashboard pages
│   │   └── ...            # Other pages
│   ├── scripts/           # Utility scripts
│   ├── styles/            # Global styles
│   └── utils/             # Utility functions
│       ├── auth.ts        # Authentication utilities
│       └── session.ts     # Session management
├── drizzle/               # Database migrations
└── package.json
```

## 🔧 Available Scripts

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run db:generate`     | Generate database migrations                     |
| `npm run db:push`         | Push schema changes to database                  |
| `npm run db:studio`       | Open Drizzle Studio for database management      |
| `npm run create-demo-users` | Create demo users with hashed passwords         |

## 🛣️ Application Routes

### Public Routes
- `/` - Landing page (redirects to login if authenticated)
- `/` - Login page (redirects to appropriate dashboard if authenticated)
- `/setup` - Demo user setup page

### Protected Routes
- `/dashboard` - User dashboard (requires authentication)
- `/manager` - Manager dashboard (requires manager role)
- `/admin` - Admin dashboard (requires admin role)
- `/admin/*` - Admin management pages
- `/test-task-notifications` - Test email notification system (requires authentication)

### API Endpoints
- `/api/auth/login` - User authentication
- `/api/auth/logout` - User logout
- `/api/auth/me` - Get current user session
- `/api/setup-demo-users` - Create demo users
- `/api/test-task-notification` - Test task assignment email notifications

## 🔒 Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **Session Management**: Secure session tokens with expiration
- **Role-Based Access Control**: Route protection based on user roles
- **CSRF Protection**: Built-in protection against cross-site request forgery
- **Secure Cookies**: HttpOnly cookies for session management

## 🎨 User Interface

The application features a modern, responsive design with:

- **Dark theme** for admin dashboard
- **Light theme** for user dashboards
- **Responsive design** that works on all devices
- **Modern UI components** with smooth animations
- **Intuitive navigation** with role-based menus

## 📊 Dashboard Features

### User Dashboard
- Time tracking interface
- Recent time entries
- Assigned tasks
- Weekly statistics
- Quick actions

### Manager Dashboard
- Team overview
- Project status
- Recent team activity
- Team member management
- Performance metrics

### Admin Dashboard
- System overview
- User management
- Client and project management
- Comprehensive reports
- System settings

## 🚀 Deployment

The application is ready for deployment on Vercel with the following considerations:

1. **Environment Variables**: Set `DATABASE_URL` in your deployment environment
2. **Database**: Ensure your PostgreSQL database is accessible from your deployment platform
3. **Build**: The application builds automatically with `npm run build`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 👀 Want to learn more?

- [Astro Documentation](https://docs.astro.build)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
