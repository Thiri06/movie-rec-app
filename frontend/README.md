# YOKO Movie Intelligence

YOKO is a full-stack movie discovery and recommendation web application. It helps signed-in users explore the TMDB movie catalogue, save favourites, build a watch history, set viewing preferences, and receive explainable recommendations that improve from their activity.

The user interface lives in this `frontend/` directory. Its companion Express API is in [`../backend`](../backend), and both are required for the complete personalised experience.

> This product uses TMDB and the TMDB APIs, but is not endorsed, certified, or otherwise approved by TMDB.

## What users can do

- Sign in with email/password or Google through Firebase Authentication.
- Browse a dashboard with popular trailers, weekly trends, and personalised recommendations.
- Discover and search movies by genre, year, rating, language, and sort order.
- Open movie pages with cast, trailers, similar titles, recommendations, watch-provider availability, and a spoiler-free AI “Why Watch” insight when Gemini is configured.
- Add or remove favourites and mark a film as watched.
- Automatically build watch history from movie-detail views.
- Manage taste preferences: favourite and avoided genres, preferred languages, minimum rating, birth date, and maturity setting.
- Use light or dark mode; the selected theme is stored locally.
- See why a recommendation was made, such as shared genres, actors, directors, or similar users’ activity.

## How personalisation works

YOKO combines content-based and collaborative filtering into a hybrid recommendation score.

1. It records favourites, detail views, watched titles, and selected interaction sources.
2. It weights stronger and newer signals more highly: favourites, explicitly watched movies, history, and simple views.
3. It builds a taste profile from genres, cast, and directors, then gathers high-quality TMDB candidates in the user’s strongest genres.
4. It compares users’ weighted movie/genre/people vectors with cosine similarity and adds candidates from users with similar taste.
5. It scores candidates using content fit (35%), people fit (25%), collaborative signal (30%), and TMDB quality/popularity (10%). Already favourited or viewed movies are excluded.

Recommendations are stored in MongoDB and refreshed on demand. A new account needs a few favourites, detail views, or watched titles before meaningful recommendations can be generated.

## Architecture

```text
React single-page app
  ├─ Firebase Authentication → Firebase ID token
  ├─ TMDB API → discovery, dashboard catalogue requests
  └─ Express API → Firebase token verification
                     ├─ MongoDB → users, movies, activity, cached TMDB data, recommendations
                     ├─ TMDB API → movie enrichment and recommendation candidates
                     └─ Gemini API → optional spoiler-free “Why Watch” insight
```

The frontend makes some catalogue requests directly to TMDB for responsive discovery/dashboard views. The backend owns authenticated data, recommendation generation, TMDB caching, and optional Gemini calls.

## Technology

| Area | Main tools |
| --- | --- |
| Frontend | React 19, React Router 7, Create React App, Tailwind CSS |
| Authentication | Firebase Web SDK and Firebase Admin SDK |
| Backend | Node.js, Express 5, Mongoose |
| Database | MongoDB / MongoDB Atlas |
| Movie data | TMDB API |
| AI insight | Google Gemini API (optional) |
| Deployment | Vercel (frontend) and Render (backend) |

## Project layout

```text
movie-rec-app/
├── frontend/                 # React UI (this directory)
│   ├── src/pages/            # Landing, login, dashboard, discover, movie, profile pages
│   ├── src/components/       # Shared navigation, movie cards, TMDB credit footer
│   └── src/utils/            # API client, TMDB helpers, content-safety helpers
├── backend/
│   ├── src/controllers/      # HTTP request handlers
│   ├── src/routes/           # REST API routes
│   ├── src/models/           # MongoDB schemas
│   ├── src/services/         # TMDB, Gemini, movie normalisation, recommendations
│   └── src/middleware/       # Firebase auth and error handling
├── diagrams/                 # Project diagrams
└── deployment-guide.md       # Production deployment walkthrough
```

## Prerequisites

- Node.js 18 or newer (Node 20+ recommended)
- npm
- A MongoDB database (local MongoDB or MongoDB Atlas)
- A Firebase project with Email/Password and Google sign-in enabled
- A TMDB API key
- Optional: a Gemini API key for AI movie insights

## Run locally

Open two terminals from the repository root.

### 1. Configure the backend

```powershell
cd backend
npm install
New-Item -ItemType File -Path .env
```

Add the following to `backend/.env`:

```dotenv
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:3000
MONGO_URI=mongodb://127.0.0.1:27017/yoko
TMDB_API_KEY=your_tmdb_api_key

# Optional: enables spoiler-free AI insights on movie pages
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# Use either this complete JSON value...
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# ...or these three Firebase Admin values instead.
# FIREBASE_PROJECT_ID=your_project_id
# FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your_project.iam.gserviceaccount.com
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Start it:

```powershell
npm run dev
```

The health check is available at `http://localhost:5000/api/health`.

### 2. Configure and run the frontend

In the second terminal:

```powershell
cd frontend
npm install
New-Item -ItemType File -Path .env
```

Add the following to `frontend/.env`:

```dotenv
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_TMDB_API_KEY=your_tmdb_api_key
REACT_APP_FIREBASE_API_KEY=your_firebase_web_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
```

Then run:

```powershell
npm start
```

Open `http://localhost:3000`.

Firebase web configuration and the browser-facing TMDB key are bundled into the frontend. Never place server-only values such as `MONGO_URI`, `GEMINI_API_KEY`, or Firebase Admin credentials in `frontend/.env`.

## API overview

All routes below are prefixed with `/api`. Routes marked **authenticated** require `Authorization: Bearer <Firebase ID token>`.

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Service health check |
| `POST /users/sync` **authenticated** | Create/update the signed-in user profile |
| `GET /users/me` **authenticated** | Read profile and preferences |
| `PATCH /users/preferences` **authenticated** | Save taste and maturity preferences |
| `GET /movies/search` | Search TMDB movies |
| `GET /movies/discover` | Discover movies with filters |
| `GET /movies/trending` | Get TMDB weekly trending movies |
| `GET /movies/:tmdbId` | Get enriched details, providers, cached movie, and optional AI insight |
| `POST /interactions` **authenticated** | Record a movie interaction |
| `GET, POST, DELETE /favorites` **authenticated** | List, add, and remove favourites |
| `GET /history` **authenticated** | List watch history |
| `POST /history/mark-watched` **authenticated** | Mark a movie as watched |
| `GET /recommendations` **authenticated** | Read recommendations; add `?refresh=true` to regenerate |

## Scripts

Run these inside the relevant directory.

| Directory | Command | Purpose |
| --- | --- | --- |
| `frontend` | `npm start` | Start the React development server |
| `frontend` | `npm run build` | Create a production build in `build/` |
| `frontend` | `npm test` | Run frontend tests |
| `backend` | `npm start` | Start the API |
| `backend` | `npm run dev` | Start the API with Nodemon |

## Deployment

The included deployment configuration uses Vercel for the React frontend, Render for the Express API, and MongoDB Atlas for the database.

- Vercel: set the project root to `frontend`, build with `npm run build`, and publish `build`.
- Render: set the project root to `backend`, build with `npm install`, and start with `npm start`.
- Set `REACT_APP_API_BASE_URL` in Vercel to the deployed Render URL plus `/api`.
- Set `CLIENT_ORIGIN` in Render to the deployed Vercel URL, and add that domain to Firebase Authentication’s authorised domains.

See [the deployment guide](../deployment-guide.md) for the complete order and environment-variable checklist. The supplied `vercel.json` supports refreshing client-side routes directly.

## Data and privacy notes

- User identity is handled by Firebase; the backend stores a Firebase UID, profile details, preferences, and movie activity in MongoDB.
- TMDB responses are cached by the backend for 30 minutes, with stale cached data used as a fallback when TMDB is temporarily unavailable.
- AI insights are generated only when `GEMINI_API_KEY` is configured and are cached by movie/version in MongoDB.
- Content safety is based on the profile’s date of birth and maturity selection. Discovery also excludes TMDB adult titles; rating-certificate filtering is applied in the UI where certification data is available.

## Troubleshooting

- **Login works but API requests return 401:** configure Firebase Admin credentials in the backend and ensure the frontend and backend use the same Firebase project.
- **CORS error:** set `CLIENT_ORIGIN` to the exact frontend URL (or comma-separated allowed URLs) and restart the backend.
- **`TMDB_API_KEY is not configured`:** add the TMDB key to `backend/.env`; add `REACT_APP_TMDB_API_KEY` too because parts of the UI query TMDB directly.
- **No recommendations yet:** view movie details, add favourites, or mark movies watched, then refresh recommendations.
- **AI insight unavailable:** this is expected without `GEMINI_API_KEY`; movie data and recommendations continue to work.
- **Production route refresh gives 404:** deploy the frontend with the supplied `vercel.json`, which rewrites routes to the React entry point.
