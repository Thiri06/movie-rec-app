# YOKO Movie Recommendation Frontend

This frontend is a Create React App single-page app that uses:

- React and React Router for the UI and page navigation.
- Firebase Authentication for email/password and Google sign-in.
- TMDB browser API requests from the dashboard.
- Tailwind CSS utility classes for styling.

The Express/MongoDB backend in `../backend` is separate. GitHub Pages can host this frontend only because Pages is static hosting; deploy the backend separately if you add API endpoints that the frontend must call.

## GitHub Pages Deployment

The app is configured for the repository URL:

```text
https://thiri06.github.io/movie-rec-app/
```

Deploy from this `frontend` folder:

```bash
npm install
npm run deploy
```

Before deploying, set `REACT_APP_API_BASE_URL` in `frontend/.env` to your deployed backend URL, for example:

```text
REACT_APP_API_BASE_URL=https://your-backend-domain.com/api
```

Do not deploy with `REACT_APP_API_BASE_URL=http://localhost:5000/api`; visitors' browsers would try to call their own computer instead of your backend. The backend also needs `CLIENT_ORIGIN=https://thiri06.github.io` so GitHub Pages is allowed by CORS.

Then in GitHub, open the repository settings:

1. Go to `Settings` -> `Pages`.
2. Set `Build and deployment` to `Deploy from a branch`.
3. Select the `gh-pages` branch and `/ (root)` folder.
4. Save, then wait a minute or two for Pages to publish.

If you see GitHub's `404 File not found` page at `/movie-rec-app/`, Pages is not serving the built frontend. The common causes are that the `gh-pages` branch has not been deployed yet, Pages is pointed at `main` instead of `gh-pages`, or the built files are inside `frontend/build` on `main` instead of at the Pages publishing root.

The `homepage`, router basename, and `404.html` copy step are required because this repo is hosted under `/movie-rec-app/` rather than at the domain root. The copied `404.html` lets direct visits like `/movie-rec-app/login` load the React app instead of showing GitHub's 404 page.

## Local Development

Create `frontend/.env` from `.env.example`, then add your Firebase and TMDB values. CRA only exposes environment variables prefixed with `REACT_APP_`.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
