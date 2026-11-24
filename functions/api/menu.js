// GET  /api/menu -> public: per-item overrides { [itemId]: { price?, special?, soldOut?, until? } }
// POST /api/menu -> owner only: replaces the overrides (body: { menu: {...} })
// Same KV namespace (UPDATES_KV) and ADMIN_TOKEN as /api/updates.
//
// The owner's main dashboard (bullheadhotels.co.ke/admin) can save a board for this branch, or for all sites. This site
// asks the main site for the board that applies here and compares timestamps with its own saved board: the NEWEST edit
// wins, wherever it was made. If the main site cannot be reached, this site's own board is used, as before.
import { json, requireRole } from '../_lib/auth.js';

const MAIN = 'https://bullheadhotels.co.ke', BRANCH = 'one';

export async function onRequestGet({ env }) {
  const local = await env.UPDATES_KV.getWithMetadata('menu');
  const cust = await env.UPDATES_KV.get('menu-custom');
  let menu = local.value ? JSON.parse(local.value) : {}, custom = cust ? JSON.parse(cust) : [];
  let ts = (local.metadata && local.metadata.ts) || 0;
  try {
    const r = await fetch(MAIN + '/api/menu?branch=' + BRANCH, { cf: { cacheTtl: 15, cacheEverything: true } });
    if (r.ok) {
      const d = await r.json();
      if (d && d.menu && typeof d.menu === 'object' && (d.ts || 0) > ts) { menu = d.menu; ts = d.ts; if (Array.isArray(d.custom)) custom = d.custom; }   // the main dashboard saved more recently
    }
  } catch (e) { /* main site unreachable: keep this site's own board */ }
  return json({ menu, custom, ts }, { headers: { 'Cache-Control': 'public, max-age=15' } });
}

export async function onRequestPost({ request, env }) {
  const g = await requireRole(request, env, ['owner']);
  if (g.res) return g.res;
  let body; try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, { status: 400 }); }
  const clean = {};
  for (const [id, m] of Object.entries(body.menu || {}).slice(0, 200)) {
    if (!/^[a-z0-9-]{1,40}$/.test(id) || !m || typeof m !== 'object') continue;
    const e = {};
    if (typeof m.price === 'number' && m.price >= 0 && m.price <= 100000) e.price = m.price;
    if (m.special === true) e.special = true;
    if (m.soldOut === true) e.soldOut = true;
    if (e.soldOut && m.until && !isNaN(Date.parse(m.until))) e.until = new Date(m.until).toISOString();
    if (Object.keys(e).length) clean[id] = e;
  }
  await env.UPDATES_KV.put('menu', JSON.stringify(clean), { metadata: { ts: Date.now() } });

  // Owner-added dishes (whole list replaced each save).
  let custom;
  if (Array.isArray(body.custom)) {
    custom = body.custom.slice(0, 60).map((c) => ({
      id: String(c.id || ''), category: String(c.category || '').trim().slice(0, 40), name: String(c.name || '').trim().slice(0, 60),
      price: typeof c.price === 'number' && c.price >= 0 && c.price <= 100000 ? c.price : null, unit: c.unit === 'kg' ? 'kg' : '',
    })).filter((c) => /^[a-z0-9-]{1,40}$/.test(c.id) && c.name && c.category);
    await env.UPDATES_KV.put('menu-custom', JSON.stringify(custom));
  }
  return json({ ok: true, menu: clean, custom });
}
