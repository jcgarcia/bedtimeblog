# Bedtime Blog

**IMPORTANT:**
This repository is a monorepo. All application code (frontend and backend) is located here. No secrets or sensitive configuration should ever be committed to this repository.

## Repository Structure & Security Policy

- This repository is public. All code, documentation, and configuration here must be safe for public view.
- All secrets (API keys, DB credentials, etc.) and any files containing secrets (such as `.env` files) **must be included in `.gitignore` and never pushed**.
- All code in this repository is public and must not contain sensitive data.

## Branches & Environments

| Branch | Purpose | Build/Deploy Target |
|--------|---------|--------------------|
| `dev`  | Local development, feature integration | Local machine |
| `uat`  | User Acceptance Testing (QA) | Vercel (test environment) |
| `k8s`  | Production | Cloud (OCI, via Jenkins/Kubernetes) |
| `main` | Safety, documentation, default branch | Not used for builds |

**Builds and deployments are always run from the appropriate environment branch (`dev`, `uat`, or `k8s`).**
The `main` branch is not used for builds or deployments, but is kept up to date for documentation and as a safe reference for repository visitors.

## CI/CD & Secrets Management

- **Jenkins CI/CD** automates all production builds and deployments from the `k8s` branch.
- All secrets (API keys, DB credentials, etc.) are managed as Jenkins credentials and never stored in the repository.
- UAT builds are deployed to Vercel from the `uat` branch.
- Local development uses the `dev` branch and local environment variables.

---

# Bedtime Blog

A full-stack blog platform featuring user authentication, post creation, categories, media support, and a modern responsive UI.
This project uses a React frontend, a Node.js/Express backend, and a cloud-hosted PostgreSQL database (with CA certificate support for secure connections).
**Package manager:** [pnpm](https://pnpm.io/)
**Frontend build tool:** [Vite](https://vitejs.dev/)
**Backend:** Express, Passport.js (Google OAuth), Multer, JWT

## Monorepo Structure

```
.
├── api/            # Backend (Node.js/Express)
│   ├── controllers/
│   ├── routes/
│   ├── db.js
│   ├── index.js
│   └── package.json
├── client/         # Frontend (React)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── media/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── package.json    # Root scripts (monorepo)
├── pnpm-workspace.yaml
└── README.md
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [pnpm](https://pnpm.io/) (install with `npm i -g pnpm`)
- Cloud PostgreSQL database (credentials and CA certificate required)
- Google OAuth credentials (for social login)

## Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/jcgarcia/bedtimeblog.git
   cd bedtimeblog
   ```

2. **Install dependencies for all workspaces:**
   ```sh
   pnpm install
   ```

---

## Configuration

### 1. Backend (`api/`)

- Copy or create a `.env` file in `api/` with your environment variables:
  ```
  DB_HOST=<your-db-host>
  DB_USER=<your-db-user>
  DB_PASSWORD=<your-db-password>
  DB_NAME=<your-db-name>
  JWT_SECRET=<your-jwt-secret>
  GOOGLE_CLIENT_ID=<your-google-client-id>
  GOOGLE_CLIENT_SECRET=<your-google-client-secret>
  ```
- Update `api/db.js` and `api/index.js` if you need to adjust connection details.

### 2. Frontend (`client/`)

- If your backend API is not running on the default URL, update the API base URL in `client/src/main.jsx`:
  ```js
  const API_BASE_URL = "https://your-backend-url/";
  ```

---

## Running the Project (Development)

From the root directory, run:

```sh
pnpm dev
```

- This will concurrently start:
  - The backend API (with hot reload via nodemon)
  - The frontend React app (via Vite)

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:8800](http://localhost:8800)

---

## Building for Production

1. **Build the frontend:**
   ```sh
   cd client
   pnpm build
   ```

2. **Deploy the backend (`api/`) and serve the frontend build as needed.**

---

## Deployment Notes

- **Environment variables:** Set all required variables on your production server.
- **Database:** Ensure your cloud MySQL database is accessible from your backend.
- **Media uploads:** By default, uploads are stored in `client/public/upload`. For production, consider using a cloud storage service.
- **OAuth:** Set correct callback URLs in your Google developer console.

---

## Features

- User registration & login (including Google OAuth)
- Create, edit, and delete blog posts
- Categories and tags
- Responsive design
- Video and image support
- Admin login route

---

## Troubleshooting

- **Ports in use:** Make sure ports 5173 (frontend) and 8800 (backend) are available.
- **Database errors:** Check your `.env` and cloud DB access.
- **OAuth issues:** Verify Google credentials and callback URLs.

---

## License

MIT

---

## Credits

- React, Vite, Express, Passport.js, Multer, MySQL, FontAwesome, and more.

---

*For further improvements and suggestions, see [`docs/Improvements.md`](docs/Improvements.md).*