# LifeTrack

A personal life dashboard built with React, Express, Prisma, and PostgreSQL.

## Requirements

Node.js 20+ and npm.

## Installation

```bash
npm install
```

## Database setup

```bash
npx prisma migrate deploy
npm run seed
```

## Start

```bash
npm run dev
```

Open http://localhost:5173. The API runs on http://localhost:4000.

## Deploy

### 1. Push the project to GitHub

Push this repository to GitHub. Vercel and Render deploy directly from that repository.

### 2. Create the Render PostgreSQL database

In Render, create a PostgreSQL database in the same region as the API. Copy its **Internal Database URL**; this becomes the API's `DATABASE_URL`.

### 3. Deploy the backend on Render

Create a **Web Service** from the repository with:

- **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy`
- **Start Command:** `npm run server`
- **Environment Variable:** `DATABASE_URL` = the Render PostgreSQL Internal Database URL

After deployment, verify `https://YOUR-API.onrender.com/health` returns `{"status":"ok"}`. Render may sleep a free service; the first request after sleeping can take a little longer.

### 4. Deploy the frontend on Vercel

Import the same repository into Vercel with:

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variable:** `VITE_API_URL` = `https://YOUR-API.onrender.com`

Do not add `/api` to `VITE_API_URL`; the frontend adds that path itself. Redeploy Vercel after adding or changing the variable.

### 5. Test the production app

Open the Vercel URL and create a goal, transaction, and note. Refresh the page and confirm the records remain. If the browser reports a failed network request, check that `VITE_API_URL` exactly matches the Render API URL and that the Render service is running.

## Reset database

For a local PostgreSQL database, run the database setup commands again. Production data should be reset only from the Render PostgreSQL dashboard.
