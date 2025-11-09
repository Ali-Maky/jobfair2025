import type { VercelRequest, VercelResponse } from '@vercel/node';
import Busboy from 'busboy';
import { put } from '@vercel/blob';

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Method not allowed' });

  try {
    const bb = Busboy({ headers: req.headers });
    let jobId = '';
    let result: { url: string; pathname: string } | null = null;
    let pending: Promise<void> | null = null;

    bb.on('field', (name, val) => {
      if (name === 'jobId') jobId = String(val || '');
    });

    bb.on('file', (name, file, info) => {
      const { filename, mimeType } = info || { filename: 'file', mimeType: 'application/octet-stream' };
      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const key = `cv/job-${jobId || 'unknown'}/${Date.now()}-${safeName}`;

      pending = (async () => {
        const { url, pathname } = await put(key, file, {
          access: 'public',
          contentType: mimeType,
        });
        result = { url, pathname };
      })();
    });

    bb.on('finish', async () => {
      try {
        if (pending) await pending;
        if (!result) return res.status(400).json({ ok:false, error:'No file uploaded' });
        return res.status(200).json({ ok:true, cvUrl: result.url, cvBlobId: result.pathname });
      } catch (e:any) {
        return res.status(500).json({ ok:false, error: e?.message || String(e) });
      }
    });

    req.pipe(bb);
  } catch (e:any) {
    return res.status(500).json({ ok:false, error: e?.message || String(e) });
  }
}
