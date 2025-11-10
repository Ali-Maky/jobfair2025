// /api/export.ts
import { google } from "googleapis";
import { getGoogleAuth } from "./_google";

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

  try {
    const sheetId = process.env.GOOGLE_SHEETS_ID || "";
    if (!sheetId) return res.status(500).json({ ok: false, error: "Missing GOOGLE_SHEETS_ID" });

    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });

    // Read entire first sheet
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "A:Z"
    });

    const rows = (resp.data.values || []) as string[][];
    if (!rows.length) return res.status(200).send("timestamp,jobId,jobTitle,company,location,type,tags,name,email,phone,cvUrl,cvFileId");

    const csv = rows.map(r => r.map(csvEscape).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="applications-export.csv"');
    return res.status(200).send(csv);
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "Export failed" });
  }
}
