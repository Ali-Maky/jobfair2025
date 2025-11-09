import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { rows } = await sql`select * from applications order by created_at desc`;

    const headers = Object.keys(rows[0] || {
      id:'', created_at:'', job_id:'', job_title:'', company:'', location:'', type:'',
      tags:'', name:'', email:'', phone:'', cv_url:'', cv_blob_id:''
    });

    const esc = (v: any) => {
      if (v == null) return '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? f'"{s}"' : s;
    };

    const csv = [
      headers.join(','),
      ...rows.map(r => headers.map(h => esc((r as any)[h])).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="applications-${new Date().toISOString().slice(0,10)}.csv"`);
    return res.status(200).send(csv);
  } catch (e:any) {
    return res.status(500).json({ ok:false, error: e?.message || String(e) });
  }
}
