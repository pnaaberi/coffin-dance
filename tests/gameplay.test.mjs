import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, applyEvent, advance, chartFor, elapsed } from '../supabase/functions/_shared/gameplay.js';
test('seed reproduces a chart and changes patterns between runs',()=>{
 assert.deepEqual(chartFor(123,1).notes,chartFor(123,1).notes);
 assert.notDeepEqual(chartFor(123,1).notes,chartFor(456,1).notes);
});
test('perfect inputs compute combo score and survival',()=>{
 const s=createRun(123);
 const first=s.notes.slice(0,12).map(n=>({...n}));
 for(const n of first) applyEvent(s,{kind:'hit',level:1,t:n.t,l:n.l});
 assert.equal(s.hits,12);assert.equal(s.combo,12);assert.equal(s.score,4500);assert.equal(s.balance,100);
});
test('misses end a run and later hits are rejected',()=>{
 const s=createRun(123);advance(s,20);assert.equal(s.dead,true);assert.equal(s.balance,0);
 assert.throws(()=>applyEvent(s,{kind:'hit',level:1,t:21,l:0}));
});
test('rejects backward time, invalid lanes, skipped levels and invented fields',()=>{
 for(const event of [{kind:'hit',level:1,t:1,l:4},{kind:'tick',level:2,t:1},{kind:'tick',level:1,t:1,score:999}]) assert.throws(()=>applyEvent(createRun(1),event));
 const s=createRun(1);applyEvent(s,{kind:'tick',level:1,t:1});assert.throws(()=>applyEvent(s,{kind:'tick',level:1,t:0}));
 assert.throws(()=>applyEvent(createRun(1),{kind:'next',level:1,t:1}));
});
test('level transition preserves score, combo and cumulative clock',()=>{
 const s=createRun(123);for(const n of [...s.notes])applyEvent(s,{kind:'hit',level:1,t:n.t,l:n.l});
 const score=s.score;const end=s.duration+.51;applyEvent(s,{kind:'next',level:1,t:end});
 assert.equal(s.level,2);assert.equal(s.score,score);assert.equal(s.dead,false);assert.equal(s.t,-.2);
 assert.ok(Math.abs(elapsed(s)-(end+.8))<1e-9);
});
test('JSON checkpoint resume has identical scoring to uninterrupted replay',()=>{
 let a=createRun(99),b=createRun(99);const inputs=a.notes.slice(0,15).map(n=>({kind:'hit',level:1,t:n.t,l:n.l}));
 for(const e of inputs){applyEvent(a,e);applyEvent(b,e);b=JSON.parse(JSON.stringify(b));}
 assert.equal(a.score,b.score);assert.equal(a.combo,b.combo);
});
