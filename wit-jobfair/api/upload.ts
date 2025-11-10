// /api/upload.ts
// Node serverless function WITHOUT @vercel/node types.
// Requires deps: "busboy" and "@vercel/blob" in package.json.
import * as BusboyNS from "busboy";
import { put } from "@vercel/blob";

export const config = { api: { bodyParser: false } };

// Handle default or namespace busboy import shapes
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

    bb.on("field", (name: string, val: string) => {
      fields[name] = val;
    });

    bb.on("file", (_name: string, file: any, info: any) => {
      fileName = info?.filename || "cv";
      mime = info?.mimeType || "application/octet-stream";
      const chunks: Buffer[] = [];
      file.on("data", (d: Buffer) => chunks.push(d));
      file.on("end", () => (fileBuf = Buffer.concat(chunks)));
    });

    bb.on("error", reject);
    bb.on("close", () =>
      resolve({
        fields,
        file: fileBuf
          ? { buffer: fileBuf, filename: fileName, mimetype: mime }
          : undefined,
      })
    );

    req.pipe(bb);
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // Accept common env var names Vercel may create when connecting a store
  const BLOB_TOKEN =
    process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.BLOB_READ_WRITE_TOKEN__jobfair_cvs || // <- rename to match your store if needed
    "";

  if (!BLOB_TOKEN) {
    return res
      .status(500)
      .json({ ok: false, error: "Missing Blob Read/Write token env var" });
  }

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
      cvBlobId: putResult.url, // id == url for private blobs
    });
  } catch (e: any) {
    return res
      .status(500)
      .json({ ok: false, error: e?.message || "Upload failed" });
  }
}
