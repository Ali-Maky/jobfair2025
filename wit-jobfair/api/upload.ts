import type { VercelRequest, VercelResponse } from "@vercel/node";
import Busboy from "busboy";
import { put } from "@vercel/blob";

export const config = { api: { bodyParser: false } };

function parseMultipart(req: VercelRequest): Promise<{ fields: Record<string,string>; file?: { buffer: Buffer; filename: string; mimetype: string } }> {
  return new Promise((resolve, reject) => {
    const bb = Busboy({ headers: req.headers as any });
    const fields: Record<string, string> = {};
    let fileBuf: Buffer | undefined;
    let fileName = "";
    let mime = "";

    bb.on("field", (name, val) => { fields[name] = val; });
    bb.on("file", (_name, file, info) => {
      fileName = info.filename || "cv";
      mime = (info as any).mimeType || "application/octet-stream";
      const chunks: Buffer[] = [];
      file.on("data", (d: Buffer) => chunks.push(d));
      file.on("end", () => (fileBuf = Buffer.concat(chunks)));
    });
    bb.on("error", reject);
    bb.on("close", () => resolve({ fields, file: fileBuf ? { buffer: fileBuf, filename: fileName, mimetype: mime } : undefined }));
    (req as any).pipe(bb);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const { fields, file } = await parseMultipart(req);
    if (!file) return res.status(400).json({ ok: false, error: "No file uploaded" });

    const jobId = fields.jobId || "unknown";
    const safeName = file.filename.replace(/[^\w.\-]+/g, "_");
    const key = `cvs/${jobId}/${Date.now()}-${safeName}`;

    const putResult = await put(key, file.buffer, {
      access: "private",
      contentType: file.mimetype,
      addRandomSuffix: false,
    });

    return res.status(200).json({
      ok: true,
      cvUrl: putResult.url,
      cvBlobId: putResult.url
    });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e?.message || "Upload failed" });
  }
}
