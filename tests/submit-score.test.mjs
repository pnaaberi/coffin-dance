import test from 'node:test';
import assert from 'node:assert/strict';
let handler;
globalThis.Deno = { env: { get: key => ({SUPABASE_URL:'https://backend.example.test',SUPABASE_SERVICE_ROLE_KEY:'server-test-only'})[key] }, serve: fn => { handler=fn; } };
await import('../supabase/functions/submit-score/index.ts');
const request = body => new Request('https://function.example.test', { method:'POST', body:JSON.stringify(body) });
test('rejects invalid and oversized submissions before database calls', async () => {
  globalThis.fetch = () => { throw new Error('Must not reach database'); };
  assert.equal((await handler(request({name:'Runner',score:-1,level:1}))).status,400);
  assert.equal((await handler(request({name:'x'.repeat(1100),score:300,level:1}))).status,413);
  assert.equal((await handler(new Request('https://function.example.test'))).status,405);
});
test('passes only permitted fields and keeps privileged credentials server-side', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url,'https://backend.example.test/rest/v1/rpc/submit_guarded_score');
    assert.deepEqual(JSON.parse(options.body),{player_name:'Runner',player_score:300,player_level:1});
    return new Response(null,{status:204});
  };
  const response=await handler(request({name:'Runner',score:300,level:1,created_at:'fake'}));
  assert.equal(response.status,201);
  assert.deepEqual(await response.json(),{ok:true});
});
test('surfaces database throttle and conceals internal failures', async () => {
  globalThis.fetch=async()=>Response.json({code:'P0001'},{status:400});
  assert.equal((await handler(request({name:'Runner',score:300,level:1}))).status,429);
  globalThis.fetch=async()=>Response.json({message:'private database details'},{status:500});
  const response=await handler(request({name:'Runner',score:300,level:1}));
  assert.equal(response.status,503);
  assert.equal((await response.text()).includes('private database details'),false);
});
test('browser preflight permits the headers used by the score client', async () => {
  const response=await handler(new Request('https://function.example.test',{method:'OPTIONS'}));
  const allowed=response.headers.get('Access-Control-Allow-Headers').toLowerCase().split(',').map(x=>x.trim());
  for(const header of ['apikey','content-type','authorization','prefer']) assert.ok(allowed.includes(header),header);
});
