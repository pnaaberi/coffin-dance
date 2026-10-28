// Public entry point; only this server holds the service-role credential.
const origin = Deno.env.get('GAME_ORIGIN') || 'https://pnaaberi.github.io';
const cors = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'apikey, content-type, authorization, prefer', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin' };
const reply = (status: number, value: unknown) => new Response(JSON.stringify(value), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (request.method !== 'POST') return reply(405, { message: 'Method not allowed' });
  try {
    // Bound bytes while streaming; Content-Length alone is attacker-controlled.
    const reader = request.body?.getReader();
    if (!reader) return reply(400, { message: 'Missing body' });
    let size = 0; const parts: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 1024) { await reader.cancel(); return reply(413, { message: 'Request too large' }); }
      parts.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const part of parts) { bytes.set(part, offset); offset += part.length; }
    let entry;
    try { entry = JSON.parse(new TextDecoder().decode(bytes)); } catch { return reply(400, { message: 'Invalid JSON' }); }
    if (!entry || typeof entry.name !== 'string' || !entry.name.trim() || entry.name.length > 16 || !Number.isSafeInteger(entry.score) || entry.score < 1 || !Number.isInteger(entry.level) || entry.level < 1 || entry.level > 200)
      return reply(400, { message: 'Invalid score' });
    const url = Deno.env.get('SUPABASE_URL'); const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return reply(503, { message: 'Score service unavailable' });
    const response = await fetch(url + '/rest/v1/rpc/submit_guarded_score', {
      method: 'POST', headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_name: entry.name.trim(), player_score: entry.score, player_level: entry.level }),
      signal: AbortSignal.timeout(8000),
    });
    if (response.ok) return reply(201, { ok: true });
    const error = await response.json().catch(() => ({}));
    if (error.code === 'P0001') return reply(429, { message: 'rate_limited', hint: 'The board is busy. Try again in a minute.' });
    if (error.code === '23514') return reply(400, { code: '23514', message: 'Score or name rejected' });
    return reply(503, { message: 'Score service unavailable' });
  } catch { return reply(503, { message: 'Score service unavailable' }); }
});
