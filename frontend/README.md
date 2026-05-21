# YOKO Movie Intelligence Frontend

YOKO is a React single-page application for discovering movies, viewing details, managing favorites and watch history, and receiving personalized recommendations through the Express/MongoDB backend.

This README covers the frontend app in `frontend/`. For full-stack deployment notes, see [`../deployment-guide.md`](../deployment-guide.md).

## Features

- Firebase Authentication for email/password and Google sign-in.
- Dashboard with trending movies, genres, and trailers.
- Movie discovery, search, and detail pages powered by TMDB.
- Favorites, watch history, user profile, and recommendation workflows through the backend API.
- Responsive UI with light/dark theme support.
- Client-side routing with React Router.

## Tech Stack

- React 19
- React Router
- Firebase Web SDK
- Tailwind CSS
- Create React App
- TMDB API

## Prerequisites

- Node.js and npm
- Firebase project with Authentication enabled
- TMDB API key
- Running backend API, either local or deployed

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

On Windows PowerShell, you can use:

```powershell
Copy-Item .env.example .env
```

Fill in `.env`:

```text
REACT_APP_TMDB_API_KEY=your_tmdb_api_key
REACT_APP_API_BASE_URL=http://localhost:5000/api

REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

Start the development server:

```bash
npm start
```

The app runs at:

```text
http://localhost:3000
```

## Environment Variables

Create React App only exposes variables prefixed with `REACT_APP_`.

| Variable | Purpose |
| --- | --- |
| `REACT_APP_API_BASE_URL` | Backend API base URL, for example `http://localhost:5000/api` or a deployed Render API URL. |
| `REACT_APP_TMDB_API_KEY` | TMDB API key used by browser-side TMDB requests. |
| `REACT_APP_FIREBASE_API_KEY` | Firebase web app API key. |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Firebase auth domain. |
| `REACT_APP_FIREBASE_PROJECT_ID` | Firebase project ID. |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket. |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID. |
| `REACT_APP_FIREBASE_APP_ID` | Firebase web app ID. |

Do not put backend-only secrets such as `MONGO_URI`, `GEMINI_API_KEY`, or `FIREBASE_SERVICE_ACCOUNT` in this frontend environment file.

## Available Scripts

Start the local dev server:

```bash
npm start
```

Build for production:

```bash
npm run build
```

Run tests:

```bash
npm test
```

Deploy the static build to GitHub Pages:

```bash
npm run deploy
```

## Deployment

The recommended deployment is:

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

For Vercel, use these project settings:

```text
Root Directory: frontend
Framework Preset: Create React App
Build Command: npm run build
Output Directory: build
Install Command: npm install
```

Set `REACT_APP_API_BASE_URL` in Vercel to your deployed backend API:

```text
REACT_APP_API_BASE_URL=https://your-render-service.onrender.com/api
```

The `vercel.json` file rewrites all frontend routes to `index.html`, so direct visits to routes such as `/login`, `/dashboard`, and `/movies/:movieId` work correctly.

## GitHub Pages

GitHub Pages can host only the static frontend. It cannot run the backend.

If you deploy to GitHub Pages under `/movie-rec-app`, configure:

```text
PUBLIC_URL=/movie-rec-app
REACT_APP_API_BASE_URL=https://your-deployed-backend.example.com/api
```

Then run:

```bash
npm run deploy
```

The `postbuild` script copies `build/index.html` to `build/404.html` so direct route refreshes can still load the React app on GitHub Pages.

## Troubleshooting

If Vercel fails with `Treating warnings as errors because process.env.CI = true`, fix the ESLint warning shown in the build log. Create React App treats warnings as build failures in CI.

If the deployed frontend still calls `localhost:5000`, update `REACT_APP_API_BASE_URL` in Vercel and redeploy. Frontend environment variables are compiled into the build.

If Firebase login fails on the deployed site, add the deployed Vercel domain in Firebase Authentication authorized domains.

If API calls are blocked by CORS, add the frontend URL to the backend `CLIENT_ORIGIN` environment variable and redeploy the backend.
