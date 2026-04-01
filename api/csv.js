// api/csv.js — Vercel Edge Function
// Receives a JSON array of employee objects, returns a downloadable CSV.
// Called client-side after Dify responds with list data.

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors() });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body;
  try { body = await req.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const { rows, filename } = body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return json({ error: 'rows must be a non-empty array' }, 400);
  }

  // Build CSV
  const csv = buildCSV(rows);

  const safeFilename = (filename || 'hr-data').replace(/[^a-z0-9_\-]/gi, '_') + '.csv';

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safeFilename}"`,
      ...cors(),
    },
  });
}

function buildCSV(rows) {
  // Collect all unique keys across all rows (some rows may have different fields)
  const keys = [];
  const seen  = new Set();
  for (const row of rows) {
    for (const k of Object.keys(row)) {
      if (!seen.has(k)) { seen.add(k); keys.push(k); }
    }
  }

  // Human-readable header labels
  const labels = {
    employee_id:          'Employee ID',
    full_name:            'Nama Lengkap',
    department:           'Department',
    outlet:               'Outlet',
    job_position:         'Jabatan',
    job_level:            'Level',
    employment_status:    'Status Kepegawaian',
    employee_data_status: 'Status Data',
    join_date:            'Tanggal Bergabung',
    end_employment_date:  'Akhir Kontrak',
    resign_date:          'Tanggal Resign',
    branch:               'Branch',
    // summary fields
    total:                'Total',
    resign_count:         'Jumlah Resign',
    turnover_pct:         'Turnover (%)',
    total_employees:      'Total Karyawan',
    days_since_join:      'Hari Sejak Bergabung',
    rank:                 'Rank',
  };

  const header = keys.map(k => csvCell(labels[k] || toTitleCase(k))).join(',');
  const dataRows = rows.map(row =>
    keys.map(k => csvCell(row[k] ?? '')).join(',')
  );

  return '\uFEFF' + [header, ...dataRows].join('\r\n'); // BOM for Excel UTF-8
}

function csvCell(val) {
  const s = String(val ?? '');
  // Wrap in quotes if contains comma, quote, or newline
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function toTitleCase(str) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function cors() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors() },
  });
}