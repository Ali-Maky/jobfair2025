# Woman In Tech 2025 – Job Fair (Vercel + Vite + React + Tailwind)

Admin can add/remove/import/export vacancies. Participants can search, view, and apply.
Applications store CVs in **Vercel Blob** and rows in **Vercel Postgres**. Admin can export CSV with signed CV links.

## Quick Start
```bash
npm i
npm run dev
# build
npm run build
npm run preview
```

## Vercel Environment
Set these in Project → Settings → Environment Variables:
- `POSTGRES_URL` (or `POSTGRES_URL_NON_POOLING`) – from Vercel Postgres
- `BLOB_READ_WRITE_TOKEN` – from Vercel Blob (Read/Write token)
- `EXPORT_KEY` – optional; used by /api/export?key=... (defaults also allow ZAIN-ADMIN)

## Vercel Project Settings
- Framework Preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- Root Directory: (blank) unless repo in subfolder

## Admin Login (demo)
- Passcode: `ZAIN-ADMIN` (front-end only; replace with proper auth in production)

## API routes
- `POST /api/upload` – multipart file field `file`, form field `jobId`
- `POST /api/apply` – JSON body with job + applicant + `cvUrl`/`cvBlobId`
- `GET  /api/export?key=ZAIN-ADMIN` – CSV export with signed CV URL

## Tailwind
Already configured. Global styles at `src/index.css`.
