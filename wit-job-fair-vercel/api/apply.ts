import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Method not allowed' });

  try {
    const {
      jobId, jobTitle, company, location, type, tags,
      name, email, phone,
      cvUrl, cvBlobId
    } = (req.body || {}) as Record<string, any>;

    const missing = ['jobId','jobTitle','name','email'].filter(k => !((req.body || {}) as any)[k]);
    if (missing.length) return res.status(400).json({ ok:false, error:'Missing fields', missing });
    const esc = (v: any) => {
  if (v == null) return '';
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
};

    await sql`
      insert into applications
      (job_id, job_title, company, location, type, tags, name, email, phone, cv_url, cv_blob_id)
      values
      (${jobId}, ${jobTitle}, ${company}, ${location}, ${type}, ${tags},
       ${name}, ${email}, ${phone}, ${cvUrl}, ${cvBlobId})
    `;

    return res.status(200).json({ ok:true });
  } catch (e:any) {
    return res.status(500).json({ ok:false, error: e?.message || String(e) });
  }
}
