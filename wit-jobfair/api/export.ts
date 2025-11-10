// /api/export.ts
import { google } from "googleapis";

function getAuth() {
  const b64 = process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64 || "";
  if (!b64) throw new Error("Missing GOOGLE_CLOUD_CREDENTIALS_BASE64");
  const json = Buffer.from(b64, "base64").toString("utf8");
  const creds = JSON.parse(json);
  return new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

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

    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "A:Z"
    });

    const rows = (resp.data.values || []) as string[][];
    if (!rows.length) {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="applications-export.csv"');
      return res.status(200).send("timestamp,jobId,jobTitle,company,location,type,tags,name,email,phone,cvUrl,cvFileId");
    }

    const csvLines: string[] = [];
    for (const r of rows) {
      csvLines.push(r.map(csvEscape).join(","));
    }
    const csv = csvLines.join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="applications-export.csv"');
    return res.status(200).send(csv);
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "Export failed" });
  }
}
