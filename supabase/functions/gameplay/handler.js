import {createRun,applyEvent,elapsed,RULES_VERSION} from '../_shared/gameplay.js';
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
export function handler({url,key,origin='https://pnaaberi.github.io',request=fetch}) {
 const cors={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'apikey, content-type, authorization, prefer','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
 const reply=(status,value)=>new Response(JSON.stringify(value),{status,headers:{...cors,'Content-Type':'application/json'}});
 const db=async(path,body)=>{
  const res=await request(url+'/rest/v1/'+path,{method:body?'POST':'GET',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(8000)});
  if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e.code==='23514'?'invalid_name':/^(rate_limited|invalid_run|stale_run|invalid_phase|too_fast|incomplete_run)$/.test(e.message)?e.message:'unavailable');}
  const text=await res.text();return text?JSON.parse(text):null;
 };
 return async req=>{
  if(req.method==='OPTIONS')return new Response(null,{headers:cors});
  if(req.method!=='POST')return reply(405,{message:'Method not allowed'});
  try{
   if(!key||!url)throw new Error('unavailable');
   const reader=req.body?.getReader();if(!reader)return reply(400,{message:'Missing body'});
   let size=0;const parts=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>32768){await reader.cancel();return reply(413,{message:'Request too large'});}parts.push(value);}
   const bytes=new Uint8Array(size);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.length;}
   let b;try{b=JSON.parse(new TextDecoder().decode(bytes));}catch{return reply(400,{message:'Invalid JSON'});}
   if(!b||typeof b!=='object'||Array.isArray(b))return reply(400,{message:'Invalid request'});
   const allowed=b.action==='start'?['action','version']:['action','id','token','revision','events','phase',...(b.action==='finish'?['name']:[])];
   if(Object.keys(b).some(k=>!allowed.includes(k)))return reply(400,{message:'Unexpected fields'});
   if(b.action==='start'){
    if(b.version!==RULES_VERSION)return reply(409,{message:'Reload the game to update it.'});
    const seed=crypto.getRandomValues(new Uint32Array(1))[0],id=crypto.randomUUID(),token=crypto.randomUUID()+crypto.randomUUID();
    await db('rpc/start_game_run',{run_id:id,secret_hash:await hash(token),initial_state:createRun(seed)});
    return reply(201,{id,token,seed,revision:0,version:RULES_VERSION});
   }
   if(!['checkpoint','finish'].includes(b.action)||!/^[-a-f0-9]{36}$/.test(b.id)||typeof b.token!=='string'||b.token.length!==72||!Number.isInteger(b.revision)||b.revision<0||!Array.isArray(b.events)||b.events.length>256||!['play','pause'].includes(b.phase))return reply(400,{message:'Invalid checkpoint'});
   if(b.action==='finish'&&(typeof b.name!=='string'||!b.name.trim()||b.name.trim().length>16))return reply(400,{message:'Invalid name'});
   const secret=await hash(b.token),batch=await hash(JSON.stringify(b));
   const rows=await db('game_runs?id=eq.'+b.id+'&select=*');const r=rows?.[0];
   if(!r||r.token_hash!==secret||Date.parse(r.expires_at)<Date.now())throw new Error('invalid_run');
   if(r.revision===b.revision+1&&r.request_hash===batch)return reply(200,r.result);
   if(r.revision!==b.revision||r.phase==='finished')throw new Error('stale_run');
   if(r.state.version!==RULES_VERSION)throw new Error('invalid_run');
   if(r.phase==='pause'&&b.events.length)throw new Error('invalid_phase');
   try{for(const event of b.events)applyEvent(r.state,event);}catch{return reply(400,{message:'Invalid gameplay'});}
   const result=await db('rpc/commit_game_run',{run_id:b.id,secret_hash:secret,expected_revision:b.revision,batch_hash:batch,next_state:r.state,next_phase:b.action==='finish'?'finished':b.phase,played_seconds:elapsed(r.state),player_name:b.action==='finish'?b.name.trim():null});
   return reply(200,result);
  }catch(e){const m=e.message;if(m==='rate_limited')return reply(429,{message:'The board is busy. Try again in a minute.'});if(m==='invalid_name')return reply(400,{message:"That name isn't allowed."});if(['invalid_run','stale_run','invalid_phase','too_fast','incomplete_run'].includes(m))return reply(409,{message:'This run could not be verified. Start a new game.'});return reply(503,{message:"Couldn't reach the score server. Try again."});}
 };
}
