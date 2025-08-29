# Bedtime Blog

A full-stack blog platform featuring user authentication, post creation, categories, media support, and a modern responsive UI.  
This project uses a React frontend, a Node.js/Express backend, and a cloud-hosted **PostgreSQL** database (with CA certificate support for secure connections).  
**Package manager:** [pnpm](https://pnpm.io/)  
**Frontend build tool:** [Vite](https://vitejs.dev/)  
**Backend:** Express, Passport.js (Google OAuth), Multer, JWT

---

## Project Structure

```
blog/
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

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [pnpm](https://pnpm.io/) (install with `npm i -g pnpm`)
- Cloud PostgreSQL database (credentials and CA certificate required)
- Google OAuth credentials (for social login)
- CA certificate file for secure DB connection (see deployment notes)

---

## Installation

1. **Clone the public repository:**
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
  DB_CA_CERT_PATH=<path-to-ca-cert>
  JWT_SECRET=<your-jwt-secret>
  GOOGLE_CLIENT_ID=<your-google-client-id>
  GOOGLE_CLIENT_SECRET=<your-google-client-secret>
  ```
- Place your CA certificate file in a secure location and reference it in your `.env`.
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

## Static Pages & Editor Automation

- **Terms of Service** and **Privacy Policy** pages are managed via the admin/editor panel.
- Content is automatically converted between plain text and Lexical JSON for correct formatting on public pages and seamless editing.
- No manual database edits required; all changes are automated and reflected instantly.
- The backend ensures public pages are always published and formatted, and the frontend renders headings, lists, and paragraphs from both Lexical JSON and plain text.

---

## Compliance & Security Features

- Google Analytics, Akismet, and OAuth integrations for privacy and compliance.
- CA certificate support for secure PostgreSQL connections.
- Sensitive files (certificates, deployment docs) are excluded from version control.

---

## Deployment Notes

- **Kubernetes** is used for container orchestration and scaling.
- **Caddy** reverse proxy routes API requests and serves static content securely.
- All environment variables and CA certificates must be set on your production server.
- Automated CI/CD pipeline (Jenkins) builds, tests, and deploys all changes.

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

## Docker Image Versioning (CI/CD Note)

> **Note:**
> Docker images built in CI/CD are tagged with a unique version for each build, not just `latest`. Common strategies include:
> - Jenkins build number: `backend:${BUILD_NUMBER}`
> - Git commit SHA: `backend:${GIT_COMMIT}`
> - Branch name + build number: `backend:${BRANCH_NAME}-${BUILD_NUMBER}`
> - Combination for traceability: `backend:${BRANCH_NAME}-${BUILD_NUMBER}-${GIT_COMMIT}`
>
> This ensures every image is uniquely identifiable and traceable to a specific build or commit. See the Jenkinsfile for implementation details.

---

*For further improvements and suggestions, see [`docs/Improvements.md`](docs/Improvements.md).*