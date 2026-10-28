import test from 'node:test';
import assert from 'node:assert/strict';

const saved = new Map();
globalThis.localStorage = {
  getItem: key => saved.get(key) ?? null,
  setItem: (key, value) => saved.set(key, value),
};
const board = await import('../js/leaderboard.js');
const key = 'cdr_board2';

test('local scores save and sort without a configured backend', async () => {
  saved.clear();
  assert.equal(board.online, false);
  assert.deepEqual(await board.submitScore({ name: 'Player', score: 300, level: 1 }), { ok: true });
  await board.submitScore({ name: 'Runner', score: 600, level: 2 });
  assert.deepEqual((await board.fetchBoard()).map(row => row.score), [600, 300]);
});

test('malformed local storage is treated as an empty board', async () => {
  for (const value of ['broken JSON', '{}', '42', '"text"', 'null']) {
    saved.set(key, value);
    assert.deepEqual(await board.fetchBoard(), []);
  }
});

test('stored HTML and invalid score fields never reach rendering', async () => {
  saved.set(key, JSON.stringify([
    { name: 'Player', score: '<img src=x onerror=alert(1)>', level: 1 },
    { name: 'Player', score: 100, level: '<svg onload=alert(1)>' },
    null,
    { name: '<script>alert(1)</script>', score: 100, level: 1 },
    { name: 'Runner', score: 200, level: 1, unwanted: 'discard me' },
  ]));
  assert.deepEqual(await board.fetchBoard(), [
    { name: '***', score: 100, level: 1 },
    { name: 'Runner', score: 200, level: 1 },
  ]);
});

test('invalid submissions are rejected without storing them', async () => {
  saved.clear();
  for (const entry of [null, {}, { name: null, score: 100, level: 1 },
    { name: '', score: 100, level: 1 }, { name: 'Player', score: -1, level: 1 },
    { name: 'Player', score: '100', level: 1 }, { name: 'Player', score: 1.5, level: 1 },
    { name: 'Player', score: Infinity, level: 1 }, { name: 'Player', score: 100, level: 201 }]) {
    assert.equal((await board.submitScore(entry)).ok, false);
  }
  assert.deepEqual(await board.fetchBoard(), []);
});
