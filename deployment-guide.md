# Deployment Guide

Best free setup for this app:

- Frontend: Vercel, using the `frontend` folder.
- Backend: Render Web Service, using the `backend` folder.
- Database: MongoDB Atlas free cluster.

GitHub Pages can only host the static frontend. It cannot run the Express backend.

## Deployment Order

1. Create MongoDB Atlas database and copy `MONGO_URI`.
2. Deploy the backend on Render.
3. Deploy the frontend on Vercel.
4. Copy the Vercel frontend URL back into Render as `CLIENT_ORIGIN`.
5. Add the Vercel frontend URL to Firebase Authentication authorized domains.

## Manual Step 1: MongoDB Atlas

Create a free Atlas cluster, database user, and network access rule.

For a student/demo deployment, the Atlas IP access rule can be:

```text
0.0.0.0/0
```

Copy the connection string and replace the username, password, and database name:

```text
mongodb+srv://<username>:<password>@<cluster-host>/<database-name>?retryWrites=true&w=majority
```

You will paste this into Render as `MONGO_URI`.

## Manual Step 2: Render Backend

Create a new Render Web Service from:

```text
https://github.com/Thiri06/movie-rec-app
```

Use these settings:

```text
Root Directory: backend
Build Command: npm install
Start Command: npm start
Plan: Free
```

Add these Render environment variables:

```text
NODE_ENV=production
CLIENT_ORIGIN=https://temporary-placeholder.vercel.app
MONGO_URI=your_mongodb_atlas_connection_string
TMDB_API_KEY=your_tmdb_api_key
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
FIREBASE_SERVICE_ACCOUNT=your_firebase_admin_sdk_json
```

Use the temporary `CLIENT_ORIGIN` first if you do not have the Vercel URL yet.

After Render deploys, test:

```text
https://your-render-service.onrender.com/api/health
```

It should return JSON with `status: "ok"`.

## Manual Step 3: Vercel Frontend

Import this GitHub repository into Vercel:

```text
https://github.com/Thiri06/movie-rec-app
```

Use these settings:

```text
Root Directory: frontend
Framework Preset: Create React App
Build Command: npm run build
Output Directory: build
Install Command: npm install
```

Add these Vercel environment variables:

```text
REACT_APP_API_BASE_URL=https://your-render-service.onrender.com/api
REACT_APP_TMDB_API_KEY=your_tmdb_api_key
REACT_APP_FIREBASE_API_KEY=your_firebase_web_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

The `frontend/vercel.json` file makes direct routes like `/login` load the React app instead of showing a 404.

## Manual Step 4: Update Render CORS

After Vercel deploys, copy the production frontend URL and update Render:

```text
CLIENT_ORIGIN=https://your-project-name.vercel.app
```

Then restart or redeploy the Render service.

If you also keep GitHub Pages, allow both origins:

```text
CLIENT_ORIGIN=https://your-project-name.vercel.app,https://thiri06.github.io
```

## Manual Step 5: Firebase

In Firebase Authentication settings, add:

```text
your-project-name.vercel.app
```

If you keep GitHub Pages too, also keep:

```text
thiri06.github.io
```

## Final Test Checklist

Test these URLs:

```text
Backend health:
https://your-render-service.onrender.com/api/health

Frontend:
https://your-project-name.vercel.app
```

Then check login, movie search/details, favorites, history, recommendations, and direct refresh on routes like `/login`.

Do not put backend secrets such as `MONGO_URI`, `GEMINI_API_KEY`, or `FIREBASE_SERVICE_ACCOUNT` in Vercel frontend variables.
