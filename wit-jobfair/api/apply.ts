// /api/apply.ts
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

    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

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
