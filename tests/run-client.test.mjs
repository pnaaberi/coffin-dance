import test from 'node:test';
import assert from 'node:assert/strict';
import {RunClient} from '../js/run-client.js';
test('lost checkpoint and final responses retry exactly and finalize once',async()=>{
 let revision=0,fail=false,saves=0;const accepted=new Map(),sent=[];
 const client=new RunClient('test','public',async(url,options)=>{
  const body=JSON.parse(options.body);sent.push(body);
  if(body.action==='start')return Response.json({id:'fixture',token:'fixture',seed:1,revision:0});
  const key=options.body;
  if(accepted.has(key))return Response.json(accepted.get(key));
  assert.equal(body.revision,revision++);const result={ok:true,revision};
  if(body.action==='finish'){saves++;result.score=300;result.level=1;}
  accepted.set(key,result);if(fail){fail=false;throw new Error('response lost');}return Response.json(result);
 });
 await client.start();client.record({kind:'tick',level:1,t:1});fail=true;
 await assert.rejects(client.checkpoint());await client.drain();assert.deepEqual(sent[1],sent[2]);
 fail=true;await assert.rejects(client.finish('Player'));assert.equal((await client.finish('Player')).score,300);assert.equal(saves,1);
 assert.ok(sent.every(b=>!('score'in b)&&!('level'in b)));
});
test('pause/resume stay ordered while transport is failing',async()=>{
 let fail=true;const phases=[];const client=new RunClient('test','public',async(_,o)=>{const b=JSON.parse(o.body);if(b.action==='start')return Response.json({seed:1});if(fail)throw new Error('offline');phases.push(b.phase);return Response.json({revision:phases.length});});
 await client.start();await assert.rejects(client.checkpoint('pause'));fail=false;await client.checkpoint('play');assert.deepEqual(phases,['pause','play']);
});
test('transport is invoked without binding fetch to the RunClient object',async()=>{
 const client=new RunClient('test','public',function(){assert.equal(this,undefined);return Promise.resolve(Response.json({seed:1}));});
 assert.equal(await client.start(),1);
});
