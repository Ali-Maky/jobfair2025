// /api/export.ts
// Export applicants CSV from Supabase + signed Blob links.
// Requires deps: "@supabase/supabase-js" and "@vercel/blob".
import { createClient } from "@supabase/supabase-js";
import { get } from "@vercel/blob";

function csvEscape(v: any) {
  const s = (v ?? "").toString();
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export default async function handler(req: any, res: any) {
  const provided = (req.query && (req.query.key as string)) || "";
  const allowed = process.env.EXPORT_KEY || "ZAIN-ADMIN";
  if (provided !== allowed) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    return res
      .status(500)
      .json({ ok: false, error: "Missing SUPABASE env vars" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    // Try to add a signed download URL for each Blob
    const withSigned = await Promise.all(
      (data || []).map(async (r: any) => {
        let cv_signed_url = "";
        try {
          if (r.cv_blob_id) {
            const info = await get(r.cv_blob_id);
            cv_signed_url = (info as any)?.downloadUrl || "";
          }
        } catch {
          // ignore signing errors
        }
        return { ...r, cv_signed_url };
      })
    );

    const headers = [
      "id",
      "created_at",
      "job_id",
      "job_title",
      "company",
      "location",
      "type",
      "tags",
      "name",
      "email",
      "phone",
      "cv_url",
      "cv_blob_id",
      "cv_signed_url"
    ];

    const lines = [];
    lines.push(headers.join(","));
    for (const r of withSigned) {
      const row = headers.map((h) => csvEscape(r[h])).join(",");
      lines.push(row);
    }
    const csv = lines.join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="applications-export.csv"');
    return res.status(200).send(csv);
  } catch (e: any) {
    return res
      .status(500)
      .json({ ok: false, error: e?.message || "Export failed" });
  }
}
