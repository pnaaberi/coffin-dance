// Retired raw-score route. Keep deployed so cached clients receive a clear error.
const origin = Deno.env.get('GAME_ORIGIN') || 'https://pnaaberi.github.io';
const cors = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'apikey, content-type, authorization, prefer', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin' };
Deno.serve((request: Request) => request.method === 'OPTIONS'
  ? new Response(null, { headers: cors })
  : new Response(JSON.stringify({ message: 'Reload the game before playing to save a verified score.' }), {
    status: 410, headers: { ...cors, 'Content-Type': 'application/json' },
  }));
