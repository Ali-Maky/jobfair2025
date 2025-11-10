// /api/apply.ts
import { google } from "googleapis";
import { getGoogleAuth } from "./_google";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const {
      jobId, jobTitle, company, location, type, tags,
      name, email, phone, cvUrl, cvFileId
    } = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});

    const sheetId = process.env.GOOGLE_SHEETS_ID || "";
    if (!sheetId) return res.status(500).json({ ok: false, error: "Missing GOOGLE_SHEETS_ID" });

    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });

    // Append at end of first sheet (A:…)
    const values = [[
      new Date().toISOString(),
      jobId || "", jobTitle || "", company || "", location || "", type || "", tags || "",
      name || "", email || "", phone || "",
      cvUrl || "", cvFileId || ""
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "A:Z",
      valueInputOption: "RAW",
      requestBody: { values }
    });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "Append failed" });
  }
}
