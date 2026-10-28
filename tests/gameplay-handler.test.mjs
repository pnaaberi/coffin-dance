import test from 'node:test';
import assert from 'node:assert/strict';
import {handler} from '../supabase/functions/gameplay/handler.js';
import {createRun} from '../supabase/functions/_shared/gameplay.js';
const digest=async v=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v))).toString('hex');
const id='00000000-0000-4000-8000-000000000001',token='x'.repeat(72);
let calls=[],row;
const serve=handler({url:'https://db.test',key:'server-test',request:async(url,o)=>{calls.push({url,body:o.body&&JSON.parse(o.body)});return Response.json(url.includes('game_runs?')?[structuredClone(row)]:{ok:true,revision:1});}});
const post=b=>serve(new Request('https://edge.test',{method:'POST',body:JSON.stringify(b)}));
const checkpoint=()=>({action:'checkpoint',id,token,revision:0,events:[],phase:'play'});
async function reset(){calls=[];row={token_hash:await digest(token),state:createRun(42),revision:0,phase:'play',expires_at:new Date(Date.now()+60000).toISOString()};}
test('rejects raw score, wrong token, expired run and malformed input before mutation',async()=>{
 await reset();assert.equal((await post({...checkpoint(),score:999})).status,400);assert.equal(calls.length,0);
 assert.equal((await post({...checkpoint(),token:'y'.repeat(72)})).status,409);
 row.expires_at=new Date(0).toISOString();assert.equal((await post(checkpoint())).status,409);await reset();
 assert.equal((await post({...checkpoint(),events:[{kind:'hit',level:1,t:4,l:9}]})).status,400);assert.ok(calls.every(c=>!c.url.includes('commit_game_run')));
});
test('replays inputs and supplies derived state to private commit RPC',async()=>{
 await reset();const n=row.state.notes[0];const result=await post({...checkpoint(),events:[{kind:'hit',level:1,t:n.t,l:n.l}]});assert.equal(result.status,200);const body=calls.at(-1).body;assert.equal(body.next_state.score,300);assert.equal(body.next_state.level,1);assert.equal(body.played_seconds,n.t+.8);
});
test('paused runs cannot smuggle inputs and identical retries return prior result',async()=>{
 await reset();row.phase='pause';assert.equal((await post({...checkpoint(),events:[{kind:'tick',level:1,t:1}]})).status,409);
 await reset();const b=checkpoint();row.revision=1;row.request_hash=await digest(JSON.stringify(b));row.result={ok:true,revision:1};assert.equal((await post(b)).status,200);assert.equal(calls.length,1);
});
test('body limit and browser CORS preflight',async()=>{
 const huge=await post({padding:'x'.repeat(33000)});assert.equal(huge.status,413);
 const pre=await serve(new Request('https://edge.test',{method:'OPTIONS'}));assert.match(pre.headers.get('Access-Control-Allow-Headers'),/apikey/);
});
