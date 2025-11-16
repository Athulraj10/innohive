# Frontend (Mini Competition Dashboard)

## Tech Stack

- React + TypeScript
- Vite (dev/build)
- Tailwind CSS
- Axios

## Prerequisites

- Node.js 18+
- npm 9+

## Environment Variables

Create `.env` in `frontend/` (or use `.env.local`):

```env
VITE_API_URL=http://localhost:4000/api
```

If not set, the app defaults to `http://localhost:4000/api`.

## Install & Run

```bash
cd frontend
npm install
npm run dev         # starts Vite dev server
# Open the URL printed by Vite (usually http://localhost:5173)
```

## Build & Preview

```bash
npm run build       # outputs to dist/
npm run preview     # serves the production build locally
```

## Auth & Storage

- JWT token is stored in `localStorage` key `mc_jwt`
- User snapshot is stored in `localStorage` key `mc_user`
- Joined competitions cache stored in `localStorage` key `joined_competitions`

Auth context loads a cached user (if present) and calls `/auth/me` to refresh. The UI considers you authenticated if a token is present (so nav renders promptly) and replaces the cached user with the server response when ready.

## Project Structure (key files)

- `src/contexts/AuthContext.tsx`: global auth state, login/logout/checkAuth
- `src/api/api.ts`: Axios instance + interceptors
- `src/api/auth.ts`: login, register, getMe
- `src/api/competitions.ts`: competitions API
- `src/components/Header.tsx`: top navigation (exposure, balance, logout)
- `src/components/ProtectedRoute.tsx`: route guard
- `src/pages/*`: views (Dashboard, CompetitionDetail, Login/Register, Transactions)
- `src/constants/storage.ts`: `USER_STORAGE_KEY`, `TOKEN_STORAGE_KEY`
- `src/utils/joinedCompetitions.ts`: local cache helpers

## Routing

- `/` → redirects to `/dashboard`
- `/dashboard` → competitions list and charts
- `/competitions/:id` → competition details and join
- `/transactions` → user transactions
- `/login`, `/register` → auth pages

Protected routes use `ProtectedRoute` and `useAuth()`.

## UI Notes

- Tailwind config in `tailwind.config.js`
- Global styles in `src/index.css`

## Troubleshooting

- Header shows Login/Register despite token:
  - Ensure `VITE_API_URL` points to a reachable backend
  - Check browser console/network for `/auth/me` response
- Exposure shows 0:
  - Ensure `/auth/me` returns `exposure` and the frontend receives it (CORS/URL)
  - Try logging out and back in (refreshes snapshot)

## Mermaid Diagrams

### Frontend Architecture

```mermaid
flowchart LR
  subgraph UI[React UI]
    H[Header] --> R[Routes]
    R --> D[Dashboard]
    R --> C[CompetitionDetail]
    R --> T[Transactions]
    R --> L[Login/Register]
  end

  A[AuthContext] --> H
  A --> R

  LS[(localStorage)]
  A <--> LS

  API[(Axios api.ts)]
  A -->|/auth/*| API
  D -->|/competitions| API
  C -->|/competitions/:id| API
  T -->|/transactions| API
```

### Auth Flow

```mermaid
sequenceDiagram
  participant UI as React UI
  participant AC as AuthContext
  participant API as Backend API
  participant LS as localStorage

  UI->>AC: useAuth()
  AC->>LS: read mc_jwt, mc_user
  alt token present
    AC->>API: GET /auth/me (Bearer)
    API-->>AC: user {walletBalance, exposure, ...}
    AC->>LS: set mc_user
    AC-->>UI: user available, isAuthenticated=true
  else no token
    AC-->>UI: user=null, isAuthenticated=false
  end

  UI->>AC: login(email, password)
  AC->>API: POST /auth/login
  API-->>AC: { token, user }
  AC->>LS: set mc_jwt, set mc_user
  AC-->>UI: isAuthenticated=true
```

### Join Competition Flow

```mermaid
sequenceDiagram
  participant UI as CompetitionDetail
  participant API as Backend API
  participant AC as AuthContext
  participant LS as localStorage

  UI->>API: POST /competitions/:id/join (Bearer)
  API-->>UI: { participationId }
  UI->>LS: add id to joined_competitions
  UI->>AC: checkAuth()
  AC->>API: GET /auth/me
  API-->>AC: updated user (exposure increased)
  AC->>LS: set mc_user
  AC-->>UI: updated exposure/balance in Header
```


