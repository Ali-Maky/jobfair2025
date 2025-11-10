import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "@vercel/postgres";
import { get } from "@vercel/blob";

function csvEscape(v: any) {
  const s = (v ?? "").toString();
  return /[",\n]/.test(s) ? \""+s.replace(/"/g, '""')+\" : s;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.query.key !== process.env.EXPORT_KEY && req.query.key !== "ZAIN-ADMIN") {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    await sql\`CREATE TABLE IF NOT EXISTS applications (id SERIAL PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      job_id TEXT, job_title TEXT, company TEXT, location TEXT, type TEXT, tags TEXT,
      name TEXT, email TEXT, phone TEXT, cv_url TEXT, cv_blob_id TEXT);\`;

    const { rows } = await sql\`SELECT * FROM applications ORDER BY created_at DESC;\`;

    const withSigned: any[] = [];
    for (const r of rows) {
      let signed = "";
      try {
        if (r.cv_blob_id) {
          const info = await get(r.cv_blob_id);
          signed = (info as any)?.downloadUrl || "";
        }
      } catch {}
      withSigned.push({ ...r, cv_signed_url: signed });
    }

    const headers = ["id","created_at","job_id","job_title","company","location","type","tags","name","email","phone","cv_url","cv_blob_id","cv_signed_url"];
    const csv = [ headers.join(","), ...withSigned.map(r => headers.map(h => csvEscape((r as any)[h])).join(",")) ].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=\"applications-export.csv\"");
    return res.status(200).send(csv);
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e?.message || "Export failed" });
  }
}
