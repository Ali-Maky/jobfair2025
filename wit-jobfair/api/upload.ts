// /api/upload.ts
import * as BusboyNS from "busboy";
import { google } from "googleapis";
import { getGoogleAuth } from "./_google";

export const config = { api: { bodyParser: false } };

function getBusboy() {
  const BB: any = (BusboyNS as any).default ?? (BusboyNS as any);
  return BB;
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

    const auth = getGoogleAuth();
    const drive = google.drive({ version: "v3", auth });

    const name = `${fields.jobId || "unknown"}__${Date.now()}__${file.filename}`;
    const fileMeta = { name, parents: [folderId] };
    const media = { mimeType: file.mimetype, body: Buffer.from(file.buffer) as any };

    // Upload
    const create = await drive.files.create({
      requestBody: fileMeta,
      media,
      fields: "id, webViewLink, webContentLink",
    } as any);

    const id = create.data.id!;
    // Make sure link is accessible to anyone with the link (optional)
    await drive.permissions.create({
      fileId: id,
      requestBody: { role: "reader", type: "anyone" },
    });

    const webViewLink = create.data.webViewLink || `https://drive.google.com/file/d/${id}/view`;
    return res.status(200).json({ ok: true, cvUrl: webViewLink, cvFileId: id });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "Upload failed" });
  }
}
