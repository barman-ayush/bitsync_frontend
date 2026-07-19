# BitSync Frontend

BitSync is a web-based code repository and cloud workspace platform built with Next.js, React, and TypeScript. It provides browser-based file management, git workspace operations, pull request reviews, and real-time collaboration.

## Features

- **Cloud Workspaces**: Browse repository files, view code diffs, upload files/folders, and resolve upload conflicts.
- **Version Control Operations**: Stage changes, compose commits, check workspace status, and view commit history.
- **Pull Requests & Reviews**: Create draft and formal PRs, view unified/split diffs, leave line comments, assign reviewers, and resolve merge conflicts.
- **User Management**: Authentication flows (login, signup, email verification), member invitations, and in-app notifications.
- **Theme Support**: Dark and light mode themes via `next-themes`.

## Tech Stack

- **Framework**: Next.js (App Router)
- **UI Library**: React 19, TypeScript
- **Styling**: Tailwind CSS v4, PostCSS, Lucide Icons
- **Components**: Radix UI primitives, Vaul, Embla Carousel, Cmdk
- **Form & Validation**: React Hook Form, Zod
- **Toasts & Notifications**: Sonner

## Project Structure

```text
bitsync_frontend/
├── app/                        # Next.js App Router routes & layouts
│   ├── (protected_routes)/     # Authenticated application pages (bitsync, repositories, create)
│   ├── auth/                   # Auth routes (login, signup, verify-email)
│   └── layout.tsx              # Root application layout
├── components/                 # Reusable UI components & features
│   ├── ui/                     # Radix UI primitives & design elements
│   └── ...                     # Workspace, PR, dialog & layout components
├── contexts/                   # Global React contexts (e.g. UserContext)
├── hooks/                      # Custom hooks for API integration
├── lib/                        # Utility functions & helpers
├── types/                      # TypeScript interface definitions
├── .env.example                # Environment variables template
└── package.json                # Project dependencies & scripts
```

## Environment Variables

Copy `.env.example` to `.env` before running the app:

```bash
cp .env.example .env
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:8000` | Base URL of the BitSync backend API server |

## Local Development

### Prerequisites

- Node.js 18.17+ or 20+
- npm, yarn, or pnpm
- BitSync Backend API running locally or remotely

### Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/barman-ayush/bitsync_frontend.git
   cd bitsync_frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

   The app will run at `http://localhost:3000`.

## Scripts

- `npm run dev` – Starts the development server
- `npm run build` – Builds the application for production
- `npm run start` – Starts the production server
- `npm run lint` – Runs ESLint check

## Backend Integration

API requests send credentials (`credentials: "include"`) for cookie-based session authentication. Ensure your backend CORS configuration allows requests from `http://localhost:3000` with credentials enabled.
