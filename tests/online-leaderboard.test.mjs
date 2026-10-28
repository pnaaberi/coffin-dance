import test from 'node:test';
import assert from 'node:assert/strict';
import config from '../js/config.js';

config.url = 'https://scores.example.test';
config.submissionUrl = config.url + '/functions/v1/submit-score';
config.anonKey = 'sb_publishable_test_fixture';
const board = await import('../js/leaderboard.js');
let calls = [];
let postResponse = () => new Response(null, { status: 201 });
globalThis.fetch = async (url, options = {}) => {
  calls.push({ url, ...options });
  if (options.method === 'POST') return postResponse();
  return Response.json([{ name: 'Runner', score: 300, level: 1 }]);
};

test('configured board reads shared scores using the publishable header', async () => {
  calls = [];
  assert.equal(board.online, true);
  assert.deepEqual(await board.fetchBoard(), [{ name: 'Runner', score: 300, level: 1 }]);
  assert.equal(board.state.status, 'ok');
  assert.equal(calls[0].headers.apikey, config.anonKey);
  assert.equal(calls[0].headers.Authorization, undefined);
  assert.match(calls[0].url, /\/rest\/v1\/scores\?select=name,score,level/);
});

test('online save sends permitted fields and refreshes the board', async () => {
  calls = [];
  const result = await board.submitScore({ name: 'Runner', score: 300, level: 1, client_hash: 'not allowed' });
  assert.deepEqual(result, { ok: true });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, config.submissionUrl);
  assert.deepEqual(JSON.parse(calls[0].body), { name: 'Runner', score: 300, level: 1 });
  assert.equal(calls[0].headers.Prefer, 'return=minimal');
  assert.equal(calls[1].method, undefined);
});

test('database rejection is shown as a failed save', async () => {
  postResponse = () => Response.json({ code: '23514', message: 'scores_score_plausible' }, { status: 400 });
  assert.deepEqual(await board.submitScore({ name: 'Runner', score: 300, level: 1 }), {
    ok: false, reason: "That score doesn't look right.",
  });
  postResponse = () => Response.json({ message: 'rate_limited', hint: 'Wait a minute.' }, { status: 400 });
  assert.deepEqual(await board.submitScore({ name: 'Runner', score: 300, level: 1 }), {
    ok: false, reason: 'Wait a minute.',
  });
});
