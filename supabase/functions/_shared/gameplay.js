// Versioned deterministic rules used by both the renderer and server replay.
export const RULES_VERSION = 1;
export const WINDOW = .16;
export const dayCfg = level => ({bpm:Math.min(118+level*5,170),bars:24+Math.min(level,6)*2,dbl:Math.min(.08+level*.07,.6),trip:level>=4?Math.min((level-3)*.05,.25):0});
export function chartFor(seed,level) {
  const cfg=dayCfg(level),spb=60/cfg.bpm,total=cfg.bars*4,notes=[],phrases=[];
  let rnd=((seed>>>0)+7+level*13)%233280;
  const random=()=> (rnd=(rnd*9301+49297)%233280)/233280;
  for(let start=8;start+4<=total-2;start+=4){
    const k=Math.min(7,2+Math.round(cfg.dbl*6)+(cfg.trip>0?1:0)+(start>total/2?1:0));
    const slots=new Set([0]);let guard=0;while(slots.size<k&&guard++<50)slots.add(Math.floor(random()*8));
    let last=-1;const pat=[...slots].sort((a,b)=>a-b).map(slot=>{let l=Math.floor(random()*4);if(l===last&&random()<.6)l=(l+1)%4;last=l;return {off:slot/2,l};});
    for(const p of pat){p.note={t:(start+p.off)*spb,l:p.l,hit:false};notes.push(p.note);}
    phrases.push({start,pat});
  }
  notes.sort((a,b)=>a.t-b.t);return {notes,phrases,duration:total*spb};
}
export function createRun(seed){
  if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw new Error('Invalid seed');
  return {version:RULES_VERSION,seed,level:1,score:0,combo:0,maxCombo:0,balance:100,hits:0,miss:0,perf:0,dead:false,t:-.8,base:.8,...chartFor(seed,1)};
}
export const elapsed=s=>Math.max(0,s.base+s.t);
function damage(s){s.combo=0;s.miss++;s.balance=Math.max(0,s.balance-12);if(!s.balance)s.dead=true;}
export function advance(s,t){
  if(!Number.isFinite(t)||t<s.t||t>s.duration+2)throw new Error('Invalid time');
  if(s.dead){if(t!==s.t)throw new Error('Run already ended');return;}
  s.t=t;
  for(const n of s.notes){if(n.hit)continue;if(n.t-t>=-WINDOW)break;n.hit=true;n.miss=true;damage(s);if(s.dead)break;}
}
export function applyEvent(s,event){
  if(!event||typeof event!=='object'||!['hit','tick','next'].includes(event.kind))throw new Error('Invalid event');
  const keys=event.kind==='hit'?['kind','level','t','l']:['kind','level','t'];
  if(Object.keys(event).some(k=>!keys.includes(k))||event.level!==s.level)throw new Error('Invalid event fields or level');
  if(event.kind==='hit'&&(!Number.isInteger(event.l)||event.l<0||event.l>3))throw new Error('Invalid lane');
  if(s.dead)throw new Error('Run already ended');
  advance(s,event.t);
  if(event.kind==='tick')return null;
  if(s.dead)throw new Error('Input after death');
  if(event.kind==='next'){
    if(s.t<s.duration+.5||s.level>=200)throw new Error('Invalid progression');
    s.base+=s.t+.2;s.level++;s.t=-.2;s.hits=s.miss=s.perf=0;
    Object.assign(s,chartFor(s.seed,s.level));return null;
  }
  const beat=event.t/(60/dayCfg(s.level).bpm);
  const active=b=>s.phrases.some(p=>b>=p.start-.5&&b<p.start+3.5);
  if(!active(beat)&&!active(beat+.5))return null;
  let best=null,distance=1;
  for(const n of s.notes){if(n.t-event.t>WINDOW)break;if(n.hit||n.l!==event.l)continue;const d=Math.abs(n.t-event.t);if(d<distance){distance=d;best=n;}}
  if(!best||distance>=WINDOW){damage(s);return {grade:0};}
  best.hit=best.ok=true;s.combo++;s.hits++;s.maxCombo=Math.max(s.maxCombo,s.combo);
  const grade=distance<WINDOW*.32?3:distance<WINDOW*.62?2:1;
  const points=grade===3?300:grade===2?150:50,heal=grade===3?3:grade===2?2:.5;
  if(grade===3)s.perf++;
  s.score+=points*(1+Math.floor(s.combo/10));s.balance=Math.min(100,s.balance+heal);
  return {grade,note:best};
}
