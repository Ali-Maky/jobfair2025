// /api/upload.ts
import * as BusboyNS from "busboy";
import { google } from "googleapis";

export const config = { api: { bodyParser: false } };

function getBusboy() {
  const BB: any = (BusboyNS as any).default ?? (BusboyNS as any);
  return BB;
}

function getAuth() {
  const b64 = process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64 || "";
  if (!b64) throw new Error("Missing GOOGLE_CLOUD_CREDENTIALS_BASE64");
  const json = Buffer.from(b64, "base64").toString("utf8");
  const creds = JSON.parse(json);
  return new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });
}

function parseMultipart(req: any): Promise<{
  fields: Record<string, string>;
  file?: { buffer: Buffer; filename: string; mimetype: string };
}> {
  return new Promise((resolve, reject) => {
    const Busboy = getBusboy();
    const bb = Busboy({ headers: req.headers as any });

    const fields: Record<string, string> = {};
    let fileBuf: Buffer | undefined;
    let fileName = "";
    let mime = "";

    bb.on("field", (name: string, val: string) => { fields[name] = val; });
    bb.on("file", (_: string, file: any, info: any) => {
      fileName = info?.filename || "cv";
      mime = info?.mimeType || "application/octet-stream";
      const chunks: Buffer[] = [];
      file.on("data", (d: Buffer) => chunks.push(d));
      file.on("end", () => (fileBuf = Buffer.concat(chunks)));
    });
    bb.on("error", reject);
    bb.on("close", () => resolve({
      fields,
      file: fileBuf ? { buffer: fileBuf, filename: fileName, mimetype: mime } : undefined
    }));

    req.pipe(bb);
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { fields, file } = await parseMultipart(req);
    if (!file) return res.status(400).json({ ok: false, error: "No file uploaded" });

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || "";
    if (!folderId) return res.status(500).json({ ok: false, error: "Missing GOOGLE_DRIVE_FOLDER_ID" });

    const auth = getAuth();
    const drive = google.drive({ version: "v3", auth });

    const safeName = file.filename.replace(/[^\w.\-]+/g, "_");
    const name = (fields.jobId || "unknown") + "__" + Date.now() + "__" + safeName;

    const create = await drive.files.create({
      requestBody: { name, parents: [folderId] },
      media: { mimeType: file.mimetype, body: Buffer.from(file.buffer) as any },
      fields: "id, webViewLink",
    } as any);

    const id = create.data.id!;
    await drive.permissions.create({
      fileId: id,
      requestBody: { role: "reader", type: "anyone" },
    });

    const webViewLink = create.data.webViewLink || ("https://drive.google.com/file/d/" + id + "/view");

    return res.status(200).json({ ok: true, cvUrl: webViewLink, cvFileId: id });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "Upload failed" });
  }
}
