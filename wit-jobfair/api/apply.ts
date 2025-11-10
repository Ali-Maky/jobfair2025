// /api/apply.ts (at repo root)
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Always handle non-POST safely
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // Validate env vars first (otherwise supabase-js may throw)
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    return res.status(500).json({
      ok: false,
      error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE env var",
    });
  }

  // Create client only after we’ve validated env vars
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const payload = {
      job_id: body.jobId ?? null,
      job_title: body.jobTitle ?? null,
      company: body.company ?? null,
      location: body.location ?? null,
      type: body.type ?? null,
      tags: body.tags ?? null,
      name: body.name ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      cv_url: body.cvUrl ?? null,
      cv_blob_id: body.cvBlobId ?? null,
    };

    const { error } = await supabase.from("applications").insert(payload);
    if (error) {
      // Return Supabase error back to UI
      return res.status(500).json({ ok: false, error: error.message });
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "DB insert failed" });
  }
}
