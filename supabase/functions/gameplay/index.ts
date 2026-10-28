import {handler} from './handler.js';
Deno.serve(handler({url:Deno.env.get('SUPABASE_URL'),key:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),origin:Deno.env.get('GAME_ORIGIN')||'https://pnaaberi.github.io'}));
