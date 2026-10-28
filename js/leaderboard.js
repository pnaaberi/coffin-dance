import {finishRun,verifiedOnline} from './run-client.js';
// High-score board: Supabase when configured in config.js, otherwise this browser's localStorage.
import config from './config.js';
import { isCleanName } from './profanity.js';

const KEY = 'cdr_board2';
const validScore = row => row && typeof row.name === 'string'
  && Number.isSafeInteger(row.score) && row.score > 0
  && Number.isSafeInteger(row.level) && row.level >= 1 && row.level <= 200;
// Validate persisted/API data before any fields reach the HTML score table.
const tidy = rows => (Array.isArray(rows) ? rows : []).filter(validScore).slice(0, 10).map(r => ({
  name: isCleanName(r.name) ? r.name : '***', score: r.score, level: r.level, ...(config.verificationUrl?{verified:r.verified===true}:{}),
}));
const local = {
  get() { try { return tidy(JSON.parse(localStorage.getItem(KEY))); } catch { return []; } },
  set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} },
};

export const online = !!(config.url && config.anonKey);
export const state = { cache: online ? [] : local.get(), status: online ? 'loading' : 'ok' };

// new 'sb_publishable_' keys go only in the apikey header; legacy JWT anon keys also go in Authorization
const headers = () => ({
  apikey: config.anonKey,
  ...(config.anonKey.startsWith('eyJ') ? { Authorization: 'Bearer ' + config.anonKey } : {}),
  'Content-Type': 'application/json',
});
const base = () => config.url.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '') + '/rest/v1/scores';

export async function fetchBoard() {
  if (!online) { state.cache = tidy(local.get()); return state.cache; }
  try {
    const r = await fetch(base() + (config.verificationUrl?'?select=name,score,level,verified&order=verified.desc,score.desc,created_at.asc&limit=10':'?select=name,score,level&order=score.desc,created_at.asc&limit=10'), { headers: headers() });
    if (!r.ok) throw new Error(r.status);
    state.cache = tidy(await r.json());
    state.status = 'ok';
  } catch (e) { console.warn('leaderboard', e); state.status = 'error'; }
  return state.cache;
}

// Returns { ok, reason } and refreshes the board.
export async function submitScore(entry) {
  if (!validScore(entry)) return { ok: false, reason: 'Invalid score or level.' };
  if (!isCleanName(entry.name)) return { ok: false, reason: "That name isn't allowed." };
  entry = { name: entry.name, score: entry.score, level: entry.level };
  if (!online) {
    const b = local.get(); b.push(entry); b.sort((x, y) => y.score - x.score); local.set(b.slice(0, 10));
    await fetchBoard(); return { ok: true };
  }
  if(verifiedOnline()){try{await finishRun(entry.name);await fetchBoard();return {ok:true};}catch(e){return {ok:false,reason:e.message};}}
  try {
    const r = await fetch(config.submissionUrl || base(), { method: 'POST', headers: { ...headers(), Prefer: 'return=minimal' }, body: JSON.stringify(entry) });
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      if (r.status === 410) return {ok:false,reason:'Reload the game before playing to save a verified score.'};
      // database rules (supabase/name_filter.sql, supabase/protection.sql)
      if (body.code === '23514' && /plausible/.test(body.message || '')) return { ok: false, reason: "That score doesn't look right." };
      if (body.code === '23514') return { ok: false, reason: "That name isn't allowed." };
      if (/rate_limited/.test(body.message || '')) return { ok: false, reason: body.hint || 'Too many scores right now, try again in a minute.' };
      throw new Error(r.status + ' ' + (body.message || ''));
    }
  } catch (e) { console.warn('leaderboard', e); state.status = 'error'; return { ok: false, reason: "Couldn't reach the score server." }; }
  await fetchBoard(); return { ok: true };
}
