import config from './config.js';
import {RULES_VERSION} from '../supabase/functions/_shared/gameplay.js';
export class RunClient {
 constructor(url,key,request=fetch){this.url=url;this.key=key;this.request=(...args)=>request(...args);this.events=[];this.jobs=[];this.session=null;this.revision=0;this.failed='';this.inflight=null;this.phase='play';}
 async send(body){const r=await this.request(this.url,{method:'POST',headers:{apikey:this.key,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(12000)});const result=await r.json();if(!r.ok)throw new Error(result.message||'Score server unavailable.');return result;}
 async start(){this.session=await this.send({action:'start',version:RULES_VERSION});return this.session.seed;}
 record(e){if(this.failed)return;this.events.push(e);if(this.events.length+this.jobs.reduce((n,j)=>n+j.events.length,0)>4096)this.failed='Connection lost for too long. Start a new game to save a score.';}
 queue(phase=this.phase,action='checkpoint',name){if(this.failed)throw new Error(this.failed);while(this.events.length>256)this.jobs.push({action:'checkpoint',events:this.events.splice(0,256),phase:this.phase});this.jobs.push({action,events:this.events.splice(0),phase,...(name?{name}:{})});this.phase=phase;}
 drain(){if(this.inflight)return this.inflight;this.inflight=this.process().finally(()=>{this.inflight=null;});return this.inflight;}
 async process(){if(this.failed)throw new Error(this.failed);while(this.jobs.length){const job=this.jobs[0];job.body??={...job,id:this.session.id,token:this.session.token,revision:this.revision};const result=await this.send(job.body);this.revision=result.revision;this.jobs.shift();this.result=result;}return this.result;}
 checkpoint(phase=this.phase){this.queue(phase);return this.drain();}
 async finish(name){await this.drain();if(this.result?.score)return this.result;this.queue('play','finish',name);return this.drain();}
}
let active=null;
export const verifiedOnline=()=>!!(config.url&&config.anonKey&&config.verificationUrl);
export async function startRun(){active=null;if(!verifiedOnline())return crypto.getRandomValues(new Uint32Array(1))[0];const client=new RunClient(config.verificationUrl,config.anonKey);const seed=await client.start();active=client;return seed;}
export const record=e=>active?.record(e);
export const checkpoint=phase=>active?active.checkpoint(phase):Promise.resolve();
export async function finishRun(name){if(!active)throw new Error('Start a new game before saving.');return active.finish(name);}
