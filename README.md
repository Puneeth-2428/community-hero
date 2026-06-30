# Community Hero

Community Hero is a modern, civic-tech web application designed to bridge the gap between citizens and local government. It empowers residents to report local issues (like potholes, broken streetlights, or sanitation problems), track their resolution, and engage with their community through a gamified karma and verification system. The platform provides citizens with a comprehensive dashboard and map view to monitor civic health, while giving administrators and department officials a powerful command center to manage and resolve issues efficiently.

## Features
- **Issue Reporting & Geolocation**: Report civic issues with precise Mapbox-powered geolocation.
- **Dark Mode Support**: A fully responsive and accessible UI with Light and Dark mode capabilities.
- **Gamification & Karma**: Earn karma points and unlock badges (e.g., "Watchdog", "Community Verifier") for civic engagement.
- **Push Notifications**: Stay updated on the status of your reported issues with real-time web push notifications.
- **Admin Command Center**: A dedicated dashboard for city officials to track department performance, SLAs, and view a choropleth heatmap of issue density.

## Technology Stack
- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Framer Motion, Lucide Icons, Mapbox GL JS, Recharts.
- **Backend**: Fastify, Zod (for validation).
- **Database**: SQLite (via Prisma ORM).
- **Authentication**: NextAuth.js (Credentials Provider) & JWT.
- **Architecture**: Turborepo Monorepo structure (`@community-hero/web` and `@community-hero/api`).

## Default Test Accounts

You can use the following test accounts to explore the different roles in the application. (Note: You can also register a new Citizen account directly from the login page).

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@communityhero.dev` | `citizen123` | Default user role for reporting and upvoting issues. |
| **Admin** | `admin@communityhero.dev` | `admin123` | City official role with access to the Command Center. |
| **Orchestrator** | `orchestrator@communityhero.dev` | `orch123` | System administrator role for managing departments and platform settings. |

*(If the accounts are not seeded with passwords, you can register a new account on the login page and manually update the `role` column in the SQLite database to `ADMIN` using Prisma Studio).*

## Getting Started

Follow these step-by-step instructions to run the application locally.

### 1. Prerequisites
- Node.js (v18 or higher)
- pnpm (v8 or higher)

### 2. Installation
Clone the repository and install the dependencies from the root directory:
```bash
pnpm install
```

### 3. Environment Variables
Create a `.env` file in the `apps/api` and `apps/web` directories based on their respective `.env.example` files.

For `apps/api/.env`:
```env
DATABASE_URL="file:./dev.db"
PORT=4000
JWT_SECRET="super-secret-jwt-key"
```

For `apps/web/.env`:
```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"
NEXTAUTH_SECRET="super-secret-nextauth-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Database Setup
Initialize the SQLite database and run the seed script to populate default data (departments, badges, and admin user):
```bash
cd apps/api
pnpm prisma db push
pnpm prisma db seed
cd ../..
```

### 5. Running the Application
You can start both the frontend and backend development servers concurrently from the root directory using Turborepo:
```bash
pnpm dev
```
Alternatively, you can run them individually:
- **Backend API**: `pnpm --filter @community-hero/api dev` (Runs on http://localhost:4000)
- **Frontend Web**: `pnpm --filter @community-hero/web dev` (Runs on http://localhost:3000)

### 6. Usage
1. Open your browser and navigate to `http://localhost:3000`.
2. Log in using one of the default test accounts or create a new Citizen account.
3. **Citizen Flow**: Navigate to the Map to drop a pin and report an issue, or check your Dashboard for karma and badges.
4. **Admin Flow**: Log in as an Admin to access the Command Center at `/admin/dashboard` to view analytics and manage civic operations.
