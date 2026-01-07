# CodeArena

CodeArena is a web-based competitive programming and coding-practice platform that provides an interactive code editor, problem sets, timed contests, and progress tracking. This README explains the project's purpose, how to run it locally, deployment hints, and how to contribute.

## Table of contents

- [Demo](#demo)
- [Features](#features)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment variables](#environment-variables)
  - [Running locally](#running-locally)
- [Code Execution / Judge](#code-execution--judge)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)
- [Contact](#contact)

## Demo

Live demo: https://codearena-of33.onrender.com

## Features

- Problem catalog with categories, tags, and difficulty levels
- Real-time web code editor with syntax highlighting and multi-language support
- Submit & judge solutions against sample and hidden testcases
- Timed contests with leaderboards and participant rankings
- User accounts, profiles, and progress history
- Admin panel to create/edit problems, contests, and testcases
- Notifications, achievements, and simple analytics

## Architecture & Tech Stack

Replace or adjust these items to match your actual implementation.

- Frontend: React / Next.js, TypeScript, Tailwind CSS or Chakra UI
- Backend: Node.js + Express or NestJS, TypeScript
- API: REST or GraphQL
- Database: PostgreSQL (recommended) or MongoDB
- Auth: JWT (or OAuth with providers)
- Code runner / sandbox: Docker-in-Docker sandbox or external judge service
- CI/CD: GitHub Actions
- Hosting: Vercel / Netlify (frontend), Render / Heroku / DigitalOcean (backend), AWS/GCP for judge or worker pools

## Getting Started

These instructions will help you set up a development copy.

### Prerequisites

- Node.js (16+ recommended)
- npm or yarn
- Docker (if running the judge locally)
- PostgreSQL (or MongoDB) instance
- Git

### Installation

1. Clone the repository

```bash
git clone https://github.com/krupakargurije/CodeArena.git
cd CodeArena
```

2. Install dependencies

Assuming a monorepo with `frontend/` and `backend/` directories. Adjust for your repo layout.

```bash
# Frontend
cd frontend
npm install

# New terminal: Backend
cd ../backend
npm install
```

3. Create environment files

Create `.env` files for frontend/backend as needed. Example backend `.env`:

```
DATABASE_URL=postgres://user:password@localhost:5432/codearena
JWT_SECRET=your_jwt_secret
PORT=4000
NODE_ENV=development
CODE_RUNNER_URL=http://localhost:5000   # if you run a local judge
```

Example frontend `.env` (if needed):

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

4. Database setup / migrations

Run migrations or ORM setup (adjust to your stack):

```bash
# Example for TypeORM / Prisma
# Prisma
npx prisma migrate dev --name init
# or TypeORM
npm run migrate
```

### Running locally

Start backend and frontend in separate terminals:

```bash
# Backend
cd backend
npm run dev

# Frontend
cd ../frontend
npm run dev
```

Open http://localhost:3000 (or the configured frontend port) in your browser.

## Code Execution / Judge

A secure sandbox is required to safely compile and run arbitrary submissions.

Options:
- Use a Docker-based sandbox service (recommended for control and security).
- Integrate a 3rd-party judge service / API.
- Run the judge as a separate worker service communicating over REST / RPC / message queue.

If you have a `judge/` folder with Dockerfile, build and run:

```bash
cd judge
docker build -t codearena-judge .
docker run --rm -p 5000:5000 codearena-judge
```

Configure the backend to point to the judge runner via `CODE_RUNNER_URL`.

## Testing

Add and run unit/integration tests for both frontend and backend.

```bash
# example
cd backend
npm test

cd ../frontend
npm test
```

Use test containers or dedicated test DBs to isolate CI runs.

## Deployment

High-level steps:
- Build and deploy frontend (Vercel, Netlify, S3 + CloudFront)
- Deploy backend (Render, Heroku, DigitalOcean App Platform, AWS ECS)
- Use managed DB (Supabase, AWS RDS, Atlas)
- Deploy judge workers on isolated infrastructure (ECS, k8s, or dedicated VMs) with strict resource and seccomp profiles
- Configure environment variables, secrets, and CORS settings
- Add monitoring and error reporting (Sentry, Prometheus, Grafana)

CI/CD recommendation: Use GitHub Actions to run tests, build artifacts, and deploy to your hosting provider.

## Contributing

Contributions are welcome! Please follow:

1. Fork the repo
2. Create a branch: git checkout -b feat/short-description
3. Commit changes with clear messages: git commit -m "feat: short description"
4. Push and open a pull request

Please include tests for new features and follow the project's coding style. Optionally add an issue first to discuss larger changes.

Suggested commit conventions: Conventional Commits (feat, fix, chore, docs, style, refactor, test).

## Roadmap

Planned improvements:
- Add more programming languages and improved runner resource limits
- Richer analytics and suggestions for users
- Team features and private contests
- Plagiarism detection / similarity analysis
- Mobile-friendly UI / PWA support

## License

This project is available under the MIT License. See LICENSE for details.

## Contact

Maintained by krupakargurije — open an issue or reach out via GitHub.

## Acknowledgements

Thanks to the open-source community and all contributors who help improve CodeArena.
