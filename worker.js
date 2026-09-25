export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    try {
      if (url.pathname === '/api/health') {
        return Response.json({ ok: true, service: 'cinderburn-api', country: 'IN' }, { headers: cors });
      }

      if (url.pathname === '/api/jobs' && request.method === 'GET') {
        const q = (url.searchParams.get('q') || '').trim().toLowerCase();
        const location = url.searchParams.get('location') || '';
        const category = url.searchParams.get('category') || '';
        const limit = Math.min(Number(url.searchParams.get('limit') || 25), 100);

        let sql = `SELECT j.id, j.title, j.description, j.location, j.work_type, j.salary_min, j.salary_max,
                          c.name AS company_name
                   FROM jobs j JOIN companies c ON c.id = j.company_id
                   WHERE j.country_code = 'IN' AND j.status = 'open'`;
        const binds = [];
        if (q) { sql += ` AND (LOWER(j.title) LIKE ? OR LOWER(j.description) LIKE ? OR LOWER(c.name) LIKE ?)`; const like=`%${q}%`; binds.push(like,like,like); }
        if (location) { sql += ` AND j.location = ?`; binds.push(location); }
        if (category) { sql += ` AND j.category = ?`; binds.push(category); }
        sql += ` ORDER BY j.created_at DESC LIMIT ?`;
        binds.push(limit);

        const result = await env.DB.prepare(sql).bind(...binds).all();
        return Response.json({ results: result.results || [] }, { headers: cors });
      }

      if (url.pathname === '/api/jobs' && request.method === 'POST') {
        const body = await request.json();
        if (!body.title || !body.company_id) return Response.json({ error:'title and company_id are required' }, { status:400, headers:cors });
        const id = crypto.randomUUID();
        await env.DB.prepare(`INSERT INTO jobs (id, company_id, title, description, country_code, location, work_type, category, salary_min, salary_max, status, created_at)
                              VALUES (?, ?, ?, ?, 'IN', ?, ?, ?, ?, ?, 'open', datetime('now'))`)
          .bind(id, body.company_id, body.title, body.description || '', body.location || '', body.work_type || 'Remote', body.category || 'Technology', body.salary_min || null, body.salary_max || null).run();
        return Response.json({ id }, { status:201, headers:cors });
      }

      return Response.json({ error:'Not found' }, { status:404, headers:cors });
    } catch (error) {
      return Response.json({ error:'Server error', detail:error?.message || 'unknown' }, { status:500, headers:cors });
    }
  }
};
