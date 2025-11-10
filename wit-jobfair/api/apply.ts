import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "@vercel/postgres";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const b = req.body && typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { jobId, jobTitle, company, location, type, tags, name, email, phone, cvUrl, cvBlobId } = b;

    await sql`
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        job_id TEXT,
        job_title TEXT,
        company TEXT,
        location TEXT,
        type TEXT,
        tags TEXT,
        name TEXT,
        email TEXT,
        phone TEXT,
        cv_url TEXT,
        cv_blob_id TEXT
      );
    `;

    await sql`
      INSERT INTO applications
      (job_id, job_title, company, location, type, tags, name, email, phone, cv_url, cv_blob_id)
      VALUES (${jobId}, ${jobTitle}, ${company}, ${location}, ${type}, ${tags},
              ${name}, ${email}, ${phone}, ${cvUrl}, ${cvBlobId});
    `;

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e?.message || "DB insert failed" });
  }
}
