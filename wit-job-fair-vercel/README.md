
# Woman In Tech 2025 - Job Fair (Vercel-ready)

## Local dev
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Deploy to Vercel
- Ensure **Build Command** = `npm run build`
- Ensure **Output Directory** = `dist`
- `vercel.json` is included to prevent SPA 404s

Or via CLI:
```bash
npx vercel deploy --prod
```

## Admin
- Click **Organizer sign in** and use passcode `ZAIN-ADMIN` (override at runtime with `window.ADMIN_PASSCODE = "YOUR-CODE"`).
