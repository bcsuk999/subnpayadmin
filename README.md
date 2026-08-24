# SunPay Admin Panel

Admin dashboard for managing SunPay users and operations. Built with Vue 3 and Vite.

## Tech Stack

- **Framework:** Vue 3.5
- **Router:** Vue Router 4.5
- **Build Tool:** Vite 6.3
- **Styling:** CSS with design tokens

## Project Structure

```
admin/
├── src/
│   ├── main.js              # App bootstrap
│   ├── App.vue              # Root component
│   ├── router/index.js      # Route definitions
│   ├── auth/index.js        # Token management (localStorage, 10-day TTL)
│   ├── api/client.js        # API client (login, user status updates)
│   ├── views/
│   │   ├── LoginView.vue           # Admin login page
│   │   └── HomePlaceholderView.vue # Dashboard placeholder
│   ├── components/
│   │   └── ThemeToggle.vue   # Light/dark theme toggle
│   └── styles/
│       ├── base.css          # Base styles
│       └── tokens.css        # Design tokens
├── index.html
├── vite.config.js
└── package.json
```

## Getting Started

### Prerequisites

- Node.js >= 20
- Backend API running (see `../backend/README.md`)

### Install & Run

```bash
cd admin
npm install
npm run dev
```

The dev server starts on `http://localhost:5173` and proxies `/api/*` requests to the backend at `https://subnpaybackend.onrender.com`.

### Build for Production

```bash
npm run build
```

Output is written to `dist/`.

## API Proxy

In development, Vite proxies API requests:

| Source | Target |
|---|---|
| `http://localhost:5173/api/*` | `https://subnpaybackend.onrender.com/api/*` |

## Authentication

Admins log in via `POST /api/admin/login` with `{ mobile, password }`. The JWT token is stored in `localStorage` with a 10-day expiry. Protected routes redirect to `/login` if no valid token exists.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
