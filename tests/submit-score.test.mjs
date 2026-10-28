import test from 'node:test';
import assert from 'node:assert/strict';
let serve;
globalThis.Deno={env:{get:()=>undefined},serve:fn=>{serve=fn;}};
await import('../supabase/functions/submit-score/index.ts');
test('legacy raw scores cannot bypass replay and cached clients receive reload instruction',async()=>{
 const result=await serve(new Request('https://edge.test',{method:'POST',body:JSON.stringify({name:'Player',score:300,level:1})}));
 assert.equal(result.status,410);assert.match((await result.json()).message,/Reload/);
});
test('retired endpoint still handles browser preflight',async()=>{
 const result=await serve(new Request('https://edge.test',{method:'OPTIONS'}));assert.equal(result.status,200);assert.match(result.headers.get('Access-Control-Allow-Headers'),/prefer/);
});
