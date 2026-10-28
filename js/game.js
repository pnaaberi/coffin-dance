// Coffin Dance - main game: scene, dancers, rhythm, audio, UI
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import * as lb from './leaderboard.js';
import config from './config.js';
import { nameProblem } from './profanity.js';
// 3D models are loaded from Polyfork's CDN, as their licence asks (free to use in games, but the files
// themselves must not be redistributed, so they are NOT stored in this repo). https://polyfork.dev/licensing
const M='https://polyfork.dev/cdn/';
const DEALER=M+'blackjack-dealer-fc0ab1.glb', COFFIN=M+'coffin-prop-d62082.glb', MOUND=M+'termite-mound-9bc94b.glb',
  DEADTREE=M+'dead-tree-6795fa.glb', TREE=M+'broad-canopy-shade-tree-e7c4a2.glb', ANT=M+'wood-ant-base.glb';

/* ---------- scene ---------- */
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);
const scene=new THREE.Scene();{const c=document.createElement('canvas');c.width=2;c.height=256;const g=c.getContext('2d');const gr=g.createLinearGradient(0,0,0,256);
 gr.addColorStop(0,'#4f9be0');gr.addColorStop(.55,'#a9d3ee');gr.addColorStop(.8,'#f4d9a8');gr.addColorStop(1,'#f0c27f');g.fillStyle=gr;g.fillRect(0,0,2,256);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;scene.background=t;}
scene.fog=new THREE.Fog(0xf0d3a0,14,60);
const cam=new THREE.PerspectiveCamera(34,innerWidth/innerHeight,.1,100);
scene.add(new THREE.HemisphereLight(0xcfe6ff,0xc8955a,1.5));
const sun=new THREE.DirectionalLight(0xffe2b0,2.8);sun.position.set(15,30,20);sun.castShadow=true;
// shadow frustum covers the whole visible savanna so trees, dead trees and mounds cast shadows too
sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-42,right:42,top:42,bottom:-42,near:1,far:110});sun.shadow.bias=-.0004;sun.shadow.normalBias=.03;
sun.target.position.set(0,0,-10);scene.add(sun.target);sun.shadow.camera.updateProjectionMatrix();scene.add(sun);
const fill=new THREE.DirectionalLight(0xffffff,.8);fill.position.set(-4,3,2);scene.add(fill);
/* savanna: rippled sand, dunes, rocks, dry grass */
// terrain height at world (x,z); the plane is rotated so plane-y = -world-z
function hAt(x,z){const y=-z,d=Math.hypot(x,y);
  const h=Math.sin(x*.9+y*.4)*.025+Math.sin(x*.21-y*.33)*.12*Math.min(1,d/6)+Math.max(0,d-12)*.05*Math.sin(x*.08+y*.11+1)**2;
  return h*Math.min(1,Math.max(0,(d-4)/4))}
const sandG=new THREE.PlaneGeometry(140,140,120,120);
{const p=sandG.attributes.position,col=[];for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),d=Math.hypot(x,y);
  p.setZ(i,hAt(x,-y));const k=.92+Math.random()*.08;col.push(.72*k,.47*k,.24*k)}
 sandG.setAttribute('color',new THREE.Float32BufferAttribute(col,3));sandG.computeVertexNormals()}
const ground=new THREE.Mesh(sandG,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}));
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const env=new THREE.Group();scene.add(env);
const fm=(c)=>new THREE.MeshStandardMaterial({color:c,roughness:.9,flatShading:true});
const bark=fm(0x4a3322),leaf=fm(0x5f7a2e),leaf2=fm(0x748a35),rockM=fm(0x9a7454),hillM=fm(0xc48a55);
for(let i=0;i<40;i++){const a=Math.random()*6.28,d=4+Math.random()*25;const r=new THREE.Mesh(new THREE.DodecahedronGeometry(.15+Math.random()*.5,0),rockM);
  let rx=Math.cos(a)*d,rz=Math.sin(a)*d-4;if(Math.hypot(rx,rz)<4.5){i--;continue}r.position.set(rx,hAt(rx,rz)-.06,rz);r.scale.y=.6;r.rotation.set(Math.random(),Math.random(),0);r.castShadow=r.receiveShadow=true;r.userData.rock=1;env.add(r)}
// grass: billboard sprites with hand-drawn dry tufts
function tuftTex(seed){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');let r=seed;const R=()=>(r=(r*9301+49297)%233280)/233280;
  const n=9+Math.floor(R()*8);for(let i=0;i<n;i++){const x=64+(R()-.5)*50,lean=(R()-.5)*70,h=50+R()*70,w=3+R()*4;
    const tone=150+R()*70;g.fillStyle=`rgb(${tone+30|0},${tone*.75|0},${tone*.35|0})`;
    g.beginPath();g.moveTo(x-w,128);g.quadraticCurveTo(x+lean*.3,128-h*.6,x+lean,128-h);g.quadraticCurveTo(x+lean*.3+w*.5,128-h*.55,x+w,128);g.fill()}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
const tuftMats=[11,37,73,101].map(sd=>new THREE.SpriteMaterial({map:tuftTex(sd),alphaTest:.4,fog:true}));
for(let i=0;i<900;i++){let x,z;do{x=(Math.random()-.5)*50;z=(Math.random()-.8)*45}while(Math.hypot(x,z+.2)<3.4);
  const sp=new THREE.Sprite(tuftMats[i%4]);sp.center.set(.5,0);const sc=.35+Math.random()*.45;sp.scale.set(sc*(.8+Math.random()*.6),sc,1);
  sp.position.set(x,hAt(x,z)-.04,z);env.add(sp)}
for(const [x,z,r,h] of [[-30,-50,18,7],[10,-58,24,9],[45,-48,16,6],[-60,-40,20,8]]){const m=new THREE.Mesh(new THREE.SphereGeometry(r,10,6,0,6.28,0,1.2),hillM);m.position.set(x,-r*.75+h*.2,z);m.scale.y=h/r*1.6;env.add(m)}
const sunDisc=new THREE.Mesh(new THREE.CircleGeometry(3,24),new THREE.MeshBasicMaterial({color:0xfff2c8,fog:false}));sunDisc.position.set(-25,14,-60);scene.add(sunDisc);
function fitCam(){renderer.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();sizeLanes()}
addEventListener('resize',fitCam);

/* ---------- restyle the dealer into a pallbearer ---------- */
const lin=(r,g,b)=>new THREE.Color(r,g,b); // vertex colours are linear
const C={skin:lin(.085,.042,.024),lip:lin(.05,.022,.016),beard:lin(.012,.009,.007),glove:lin(.92,.92,.92),
  suit:lin(.014,.014,.016),shirt:lin(.86,.86,.86),pin:lin(.7,.7,.72),shoeW:lin(.9,.9,.9),shoeB:lin(.006,.006,.006)};
const near=(c,i,r,g,b,e=.06)=>Math.abs(c.getX(i)-r)<e&&Math.abs(c.getY(i)-g)<e&&Math.abs(c.getZ(i)-b)<e;
const setC=(c,i,col)=>c.setXYZ(i,col.r,col.g,col.b);
function boneOf(mesh,i){const si=mesh.geometry.attributes.skinIndex,sw=mesh.geometry.attributes.skinWeight;
  const G=['getX','getY','getZ','getW'];let best=0,w=-1;for(let k=0;k<4;k++){const ww=sw[G[k]](i);if(ww>w){w=ww;best=si[G[k]](i)}}
  return mesh.skeleton.bones[best].name}

const HEADV=[],JAWV=[];
function restyle(root){
  root.updateMatrixWorld(true);
  const byName={};root.traverse(o=>{if(o.name)byName[o.name]=o});
  const headBox=new THREE.Box3(),v=new THREE.Vector3();
  root.traverse(m=>{
    if(!m.isSkinnedMesh)return;const c=m.geometry.attributes.color,p=m.geometry.attributes.position,n=m.name;
    m.castShadow=true;
    if(n==='attach-hair-mesh'){m.visible=false;return}
    if(n==='attach-feet-mesh'){m.geometry.computeBoundingBox();const bb=m.geometry.boundingBox;
      const zL=bb.min.z+(bb.max.z-bb.min.z)*.3,zH=bb.min.z+(bb.max.z-bb.min.z)*.62,yS=bb.min.y+(bb.max.y-bb.min.y)*.25;
      for(let i=0;i<c.count;i++){const z=p.getZ(i),y=p.getY(i);setC(c,i,(z>zL&&z<zH&&y>yS)?C.shoeW:C.shoeB)}}
    for(let i=0;i<c.count;i++){const b=boneOf(m,i);
      if(n==='body'){
        if(b==='Head'||b.startsWith('Face_')){v.fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld);headBox.expandByPoint(v);HEADV.push(v.clone());if(b==='Face_Jaw')JAWV.push(v.clone())}
        if(b.includes('Hand'))setC(c,i,C.glove);
        else if(near(c,i,.62,.36,.22,.08))setC(c,i,C.skin);
        else if(near(c,i,.39,.13,.1))setC(c,i,C.lip);
      }else if(n==='attach-top-mesh'){
        if(/Arm|Shoulder/.test(b))setC(c,i,C.suit);
        else if(near(c,i,.9,.86,.78,.05)||near(c,i,.19,.01,.01,.05))setC(c,i,C.shirt);
      }else if(n==='attach-coat-mesh'){
        if(near(c,i,.89,.67,.22,.1))setC(c,i,C.pin);else setC(c,i,C.suit);
      }else if(n==='attach-bottom-mesh')setC(c,i,C.suit);
    }
    c.needsUpdate=true;m.material.vertexColors=true;m.material.roughness=n==='body'?.55:.38;
  });
  // masculine build
  byName.Spine2.scale.set(1.14,1,1.06);byName.LeftHand.scale.setScalar(.74);byName.RightHand.scale.setScalar(.74);byName.Neck.scale.set(1/1.14,1,1/1.06);
  byName.LeftUpLeg.scale.set(1.08,1,1.08);byName.RightUpLeg.scale.set(1.08,1,1.08);
  root.updateMatrixWorld(true);

  // --- accessories on the head ---
  const head=byName.Head,hs=new THREE.Vector3(),hc=new THREE.Vector3();headBox.getSize(hs);headBox.getCenter(hc);
  const std=(col,o={})=>new THREE.MeshStandardMaterial({color:col,roughness:.4,...o});
  const acc=new THREE.Group();
  const r=Math.max(hs.x,hs.z)*.53;
  // garrison/kepi style cap: black crown with white piping band and short peak
  const crown=new THREE.Mesh(new THREE.CylinderGeometry(r*1.02,r*1.06,hs.y*.34,20),std(0x101010,{roughness:.3}));
  crown.position.set(hc.x,headBox.max.y-hs.y*.1,hc.z);crown.scale.z=1.08;acc.add(crown);
  const topRim=new THREE.Mesh(new THREE.TorusGeometry(r*1.02,r*.05,6,24),std(0xffffff));
  topRim.rotation.x=Math.PI/2;topRim.position.set(hc.x,crown.position.y+hs.y*.17,hc.z);topRim.scale.y=1.08;acc.add(topRim);
  const band=new THREE.Mesh(new THREE.CylinderGeometry(r*1.075,r*1.075,hs.y*.07,20,1,true),std(0xffffff,{side:THREE.DoubleSide}));
  band.position.set(hc.x,crown.position.y-hs.y*.08,hc.z);band.scale.z=1.08;acc.add(band);
  const peak=new THREE.Mesh(new THREE.CylinderGeometry(r*.9,r*.9,.012,20,1,false,-Math.PI/2.6,Math.PI/1.3),std(0x0a0a0a,{roughness:.15}));
  peak.position.set(hc.x,crown.position.y-hs.y*.15,hc.z+r*.35);peak.rotation.x=.18;acc.add(peak);
  // ---- sunglasses: fitted to the face plane (not the nose tip), wayfarer-style low-poly frame ----
  const eL=new THREE.Vector3(),eR=new THREE.Vector3();byName.Face_EyeL.getWorldPosition(eL);byName.Face_EyeR.getWorldPosition(eR);
  const eyeY=(eL.y+eR.y)/2,gap=Math.abs(eL.x-eR.x);
  let faceZ=-1e9,sideX=0;for(const q of HEADV)if(Math.abs(q.y-eyeY)<.03){if(Math.abs(q.x-hc.x)>gap*.28)faceZ=Math.max(faceZ,q.z);sideX=Math.max(sideX,Math.abs(q.x-hc.x))}
  if(faceZ<-1e8)faceZ=headBox.max.z;
  const lensM=std(0x10141c),frM=std(0x060606),glint=std(0x5a6a80);
  const lw=Math.min(gap*.8,sideX*.8),lh=lw*.6,fz=faceZ+.007;
  const lensShape=(()=>{const sh=new THREE.Shape(),w=lw/2,h=lh/2;sh.moveTo(-w,h);sh.lineTo(w,h);sh.lineTo(w*.92,-h*.35);sh.lineTo(w*.55,-h);sh.lineTo(-w*.6,-h);sh.lineTo(-w*.95,-h*.3);sh.closePath();return sh})();
  const lensG=new THREE.ExtrudeGeometry(lensShape,{depth:.006,bevelEnabled:false});
  for(const [e,sg] of [[eL,1],[eR,-1]]){const g=new THREE.Group();g.position.set(e.x,eyeY-lh*.05,fz);g.rotation.y=sg*.16; // wrap round the face
    const rim=new THREE.Mesh(new THREE.ExtrudeGeometry(lensShape,{depth:.008,bevelEnabled:false}),frM);rim.scale.set(1.16,1.18,1);rim.position.z=-.002;g.add(rim);
    const lens=new THREE.Mesh(lensG,lensM);lens.position.z=.002;g.add(lens);
    const gl=new THREE.Mesh(new THREE.PlaneGeometry(lw*.18,lh*.5),glint);gl.position.set(-sg*lw*.18,lh*.1,.0085);gl.rotation.z=-.5;g.add(gl); // painted glint, not shine
    const brow=new THREE.Mesh(new THREE.BoxGeometry(lw*1.18,lh*.26,.014),frM);brow.position.set(0,lh*.5,.004);g.add(brow);
    acc.add(g);
    // temple arm: from the lens corner straight back along the side of the head to the ear, flush with the skin
    const zf=faceZ-.004,zb=hc.z-hs.z*.05,armL=Math.max(.03,zf-zb);
    const arm=new THREE.Mesh(new THREE.BoxGeometry(.007,.009,armL),frM);arm.position.set(hc.x+sg*(sideX+.0045),eyeY+lh*.32,(zf+zb)/2);acc.add(arm)}
  const bridge=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.012,gap-lw*.95),.012,.012),frM);bridge.position.set(hc.x,eyeY+lh*.22,fz+.004);acc.add(bridge);
  // ---- short boxed beard + moustache as their own low-poly pieces ----
  const jb=new THREE.Box3();JAWV.forEach(q=>jb.expandByPoint(q));const js=new THREE.Vector3(),jc=new THREE.Vector3();jb.getSize(js);jb.getCenter(jc);
  const hair=std(0x0d0a08);
  if(JAWV.length){
    // goatee on the chin + a thin chinstrap following the jawline
    const chin=new THREE.Mesh(new THREE.BoxGeometry(js.x*.4,js.y*.34,.01),hair);chin.position.set(jc.x,jb.min.y+js.y*.2,jb.max.z-.003);acc.add(chin);
  }
  let mz=-1e9,mouthY=jb.max.y||eyeY-.08;for(const q of HEADV)if(Math.abs(q.x-hc.x)<.02&&Math.abs(q.y-(mouthY+.012))<.02)mz=Math.max(mz,q.z);
  if(mz<-1e8)mz=faceZ;
  const mst=new THREE.Mesh(new THREE.BoxGeometry(gap*.7,.014,.016),hair);mst.position.set(hc.x,mouthY+.014,mz+.004);acc.add(mst);
  // lapel pin / boutonniere
  const chest=new THREE.Vector3();byName.Spine2.getWorldPosition(chest);
  const pinM=new THREE.Mesh(new THREE.SphereGeometry(.014,8,6),std(0xeeeeee,{metalness:.6}));pinM.position.set(chest.x+.1,chest.y+.12,chest.z+.15);
  acc.children.forEach(o=>o.castShadow=true);
  [...acc.children].forEach(o=>head.attach(o));byName.Spine2.attach(pinM);
  return byName;
}

/* ---------- load ---------- */
const loader=new GLTFLoader();
const load=u=>new Promise((res,rej)=>loader.load(u,res,undefined,rej));
const _fv=new THREE.Vector3();
function lowFoot(r){let m=1e9;for(const n of ['LeftFoot','RightFoot','LeftToeBase','RightToeBase']){r.bones[n].getWorldPosition(_fv);m=Math.min(m,_fv.y)}return m}
// keep the lowest foot planted on the sand (no sinking, no floating)
function plant(r){r.root.position.y=r.baseY;r.root.updateMatrixWorld(true);r.root.position.y+=r.footRest-(lowFoot(r)-r.baseY);r.root.updateMatrixWorld(true)}
/* CCD IK: bend Arm + ForeArm so the hand reaches a world-space target */
const _a=new THREE.Vector3(),_b=new THREE.Vector3(),_c=new THREE.Vector3(),_qa=new THREE.Quaternion(),_qp=new THREE.Quaternion(),_qw=new THREE.Quaternion();
function ik(r,side,target,iters=6){const hand=r.bones[side+'Hand'],chain=[r.bones[side+'ForeArm'],r.bones[side+'Arm']];
  for(let it=0;it<iters;it++)for(const bn of chain){
    hand.getWorldPosition(_a);bn.getWorldPosition(_b);
    const v1=_a.sub(_b).normalize(),v2=_c.copy(target).sub(_b).normalize();
    _qa.setFromUnitVectors(v1,v2);bn.getWorldQuaternion(_qw);bn.parent.getWorldQuaternion(_qp);
    bn.quaternion.copy(_qp.invert().multiply(_qa.multiply(_qw)));bn.updateMatrixWorld(true)}}
const crew=[];let coffin,coffinBase=1.5,lead;
const [dealer,cof,moundG,deadG,treeG,antG]=await Promise.all([load(DEALER),load(COFFIN),load(MOUND),load(DEADTREE),load(TREE),load(ANT)]).catch(e=>{document.getElementById('load').innerHTML='Couldn\'t load the 3D models.<br><small style="font-weight:400">Check your connection and reload the page.</small>';throw e});
/* ---------- savanna props from the supplied models ---------- */
const mixers=[];
function prop(g,x,z,s,sink=0){const o=SkeletonUtils.clone(g.scene);o.position.set(x,hAt(x,z)-sink*s,z);o.scale.setScalar(s);o.rotation.y=Math.random()*6.28;
  o.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true}});env.add(o);return o}
for(const [x,z,s] of [[-8,-11,1.0],[11,-16,1.2],[-18,-24,1.35],[21,-30,1.4],[-3,-28,1.1],[-12,5,.9],[26,-9,1.1],[6,-38,1.5]]){
  const o=prop(treeG,x,z,s,.04);if(treeG.animations.length){const mx=new THREE.AnimationMixer(o);const a=mx.clipAction(treeG.animations[0]);a.play();a.time=Math.random()*a.getClip().duration;a.timeScale=.6+Math.random()*.5;mixers.push(mx)}}
for(const [x,z,s] of [[7,-6,.8],[-14,-8,.95],[15,2,.75],[-22,-14,1.1]])prop(deadG,x,z,s,.03);
const MOUNDS=[[-5.5,-3.5,1.0],[5.2,-9,1.3],[-9,-15,1.6],[13,-6,.9],[-15,1,1.1],[2,-17,1.4]];
const moundObjs=MOUNDS.map(([x,z,s])=>prop(moundG,x,z,s,.05));
{const keep=[...MOUNDS.map(([x,z,s])=>[x,z,1.3*s]),[-8,-11,1],[11,-16,1],[-18,-24,1],[21,-30,1],[-3,-28,1],[-12,5,1],[26,-9,1],[6,-38,1],[7,-6,1],[-14,-8,1],[15,2,1],[-22,-14,1]];
  for(const r of [...env.children])if(r.userData.rock&&keep.some(([x,z,d])=>Math.hypot(r.position.x-x,r.position.z-z)<d+.6))env.remove(r)}
// ---- ants live in the mounds: they crawl out of the side holes, forage on the sand, and crawl back into a hole ----
antG.scene.traverse(m=>{if(!m.isSkinnedMesh)return;const c=m.geometry.attributes.color;if(!c)return;
  const head=lin(.42,.17,.05),body=lin(.86,.74,.52),leg=lin(.72,.55,.32),mand=lin(.25,.09,.03);
  for(let i=0;i<c.count;i++){const b=boneOf(m,i);setC(c,i,/Mandible/.test(b)?mand:/Head|Antenna/.test(b)?head:/Leg/.test(b)?leg:body)}
  c.needsUpdate=true;(Array.isArray(m.material)?m.material:[m.material]).forEach(mm=>{mm.vertexColors=true;mm.color?.set(0xffffff);mm.roughness=1;mm.metalness=0})});
const ants=[],walk=antG.animations.find(a=>/walk/i.test(a.name))||antG.animations[0];
const HOLES=[[.45,.118,.05],[-.032,.136,.435],[-.319,.973,.429],[-.337,1.377,.438],[.445,1.225,-.145]]; // hole centres measured from the mound mesh
function holeWorld(m,h){m.updateMatrixWorld(true);const v=new THREE.Vector3(...h),out=new THREE.Vector3(h[0],0,h[2]).normalize();
  v.addScaledVector(out,.03);const w=v.clone().applyMatrix4(m.matrixWorld),wo=out.transformDirection(m.matrixWorld);return {p:w,n:wo}}
// ants stick to the mound surface: climb paths are sampled by ray-casting onto the mound mesh, so they never walk on air
const rc=new THREE.Raycaster(),_ro=new THREE.Vector3(),_rd=new THREE.Vector3();
function surfaceAt(m,out,y){_ro.set(m.position.x+out.x*4,y,m.position.z+out.z*4);_rd.set(-out.x,0,-out.z);rc.set(_ro,_rd);rc.far=8;
  const hit=rc.intersectObject(m,true)[0];if(!hit)return null;const n=hit.face?hit.face.normal.clone().transformDirection(hit.object.matrixWorld):out;
  return {p:hit.point.clone().addScaledVector(n,.006),g:false}}
function climb(m,h){ // from the hole mouth down the wall to the sand at the foot of the mound
  const out=new THREE.Vector3(h.n.x,0,h.n.z).normalize(),pts=[{p:h.p.clone().addScaledVector(h.n,-.05),g:false,inside:true},{p:h.p.clone(),g:false}];
  for(let y=h.p.y-.04;y>hAt(h.p.x,h.p.z)+.015;y-=.04){const q=surfaceAt(m,out,y);if(q)pts.push(q)}
  const last=pts[pts.length-1].p,foot=last.clone().addScaledVector(out,.12);foot.y=hAt(foot.x,foot.z)+.004;pts.push({p:foot,g:true});return pts}
function antTrip(a){const m=moundObjs[a.mi],s=m.scale.x,H=()=>holeWorld(m,HOLES[Math.floor(Math.random()*HOLES.length)]);
  const up=climb(m,H()),down=climb(m,H()).reverse();
  const ang=Math.random()*6.28,rad=(1.2+Math.random()*1.4)*s,gp=(x,z)=>({p:new THREE.Vector3(x,hAt(x,z)+.004,z),g:true});
  const f=gp(m.position.x+Math.cos(ang)*rad,m.position.z+Math.sin(ang)*rad),g=gp(f.p.x+(Math.random()-.5)*.8,f.p.z+(Math.random()-.5)*.8);
  a.path=[...up,f,g,...down];a.seg=0;a.u=0;a.wait=0}
function addAnt(mi){const o=SkeletonUtils.clone(antG.scene);o.traverse(q=>{if(q.isMesh)q.castShadow=true});env.add(o);
  const mx=new THREE.AnimationMixer(o);const act=mx.clipAction(walk);act.play();act.time=Math.random();mixers.push(mx);
  const a={o,mi,act,spd:.16+Math.random()*.08,path:null,seg:0,u:0,wait:Math.random()*4};ants.push(a);o.visible=false}
moundObjs.forEach((m,mi)=>{for(let k=0;k<6;k++)addAnt(mi)});
const _ad=new THREE.Vector3(),_ap=new THREE.Vector3();
function stepAnts(dt){for(const a of ants){
  if(a.wait>0){a.wait-=dt;a.o.visible=false;if(a.wait<=0)antTrip(a);continue}
  if(!a.path){antTrip(a);continue}
  const A=a.path[a.seg].p,B=a.path[a.seg+1].p,L=A.distanceTo(B)||1e-3;a.u+=a.spd*dt/L;
  while(a.u>=1&&a.seg<a.path.length-2){a.u-=1;a.seg++}
  if(a.seg>=a.path.length-2&&a.u>=1){a.o.visible=false;a.wait=1+Math.random()*4;a.path=null;continue} // gone back inside
  const P=a.path[a.seg],Q=a.path[a.seg+1];_ap.lerpVectors(P.p,Q.p,Math.min(1,a.u));
  if(P.g&&Q.g)_ap.y=hAt(_ap.x,_ap.z)+.004; // on the sand: follow the dunes between waypoints
  const inside=P.inside?1-a.u:(Q.inside?a.u:0); // shrink into / grow out of the hole
  a.o.visible=true;a.o.scale.setScalar(.11*(1-inside*.85));a.o.position.copy(_ap);
  _ad.subVectors(Q.p,P.p).normalize();if(_ad.lengthSq()>0)a.o.lookAt(_ap.x+_ad.x,_ap.y+_ad.y,_ap.z+_ad.z);
  a.act.timeScale=a.spd*14}}
function stepEnv(dt){for(const m of mixers)m.update(dt);
  stepAnts(dt)}
restyle(dealer.scene);
const HANDIDX=[];dealer.scene.traverse(m=>{if(m.name==='body'&&m.isSkinnedMesh){const c=m.geometry.attributes.position.count;for(let i=0;i<c;i++)if(boneOf(m,i)==='RightHand')HANDIDX.push(i)}});
const SLOTS=[[-.5,-.55],[.5,-.55],[-.5,.3],[.5,.3]];
for(const [i,[x,z]] of SLOTS.entries()){const b=SkeletonUtils.clone(dealer.scene);b.position.set(x,0,z);b.scale.setScalar(1.03);scene.add(b);crew.push(rig(b,x<0?1:-1,i))}
{const b=SkeletonUtils.clone(dealer.scene);b.position.set(0,0,1.15);b.scale.setScalar(1.03);scene.add(b);lead=rig(b,0,4)}
coffin=cof.scene;coffin.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
{const bb=new THREE.Box3().setFromObject(coffin),s=new THREE.Vector3();bb.getSize(s);
 const long=Math.max(s.x,s.z);const k=1.8/long;coffin.scale.setScalar(k);if(s.x>s.z)coffin.rotation.y=Math.PI/2;
 const bb2=new THREE.Box3().setFromObject(coffin),c=new THREE.Vector3();bb2.getCenter(c);
 const pivot=new THREE.Group();coffin.position.sub(new THREE.Vector3(c.x,bb2.min.y,c.z));pivot.add(coffin);coffin=pivot;}
// coffin rests on the shoulders of the four carriers
{const sh=new THREE.Vector3();crew[0].bones.LeftShoulder.getWorldPosition(sh);coffinBase=sh.y+.11;}
coffin.position.set(0,coffinBase,-.18);scene.add(coffin);
const CB=new THREE.Box3().setFromObject(coffin.children[0]),CS=new THREE.Vector3();CB.getSize(CS); // size in pivot space (pivot at origin-ish)
const HALF=new THREE.Vector3(CS.x/2,CS.y/2,CS.z/2); // half extents; pivot sits at bottom centre
const COFFIN_Z=-.18;
// stand each carrier just outside the coffin so it rests on his inner shoulder, head beside it
crew.forEach(r=>{const sx=Math.sign(r.root.position.x);r.root.position.x=r.bx=sx*(HALF.x+.13);r.root.updateMatrixWorld(true)});
{const sh=new THREE.Vector3();crew[0].bones[crew[0].side>0?'RightShoulder':'LeftShoulder'].getWorldPosition(sh);coffinBase=sh.y+.045;coffin.position.y=coffinBase}
console.log('coffin half',HALF.x.toFixed(3),HALF.y.toFixed(3),HALF.z.toFixed(3),'base',coffinBase.toFixed(3));
// clay look: everything fully matte, no metal, no specular sheen
scene.traverse(o=>{const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];
  ms.forEach(m=>{if(m.isMeshStandardMaterial){m.roughness=1;m.metalness=0;m.envMapIntensity=0;m.needsUpdate=true}})});
document.getElementById('load').remove();
cam.position.set(2.7,2.0,5.4);cam.lookAt(.75,1.0,0);

function rig(root,side,i){const b={};root.traverse(o=>{if(o.isBone)b[o.name]=o});
  const rest={};for(const k in b)rest[k]=b[k].quaternion.clone();
  root.updateMatrixWorld(true);const footRest=lowFoot({bones:b})-root.position.y;
  let body_=null;root.traverse(o=>{if(o.name==='body'&&o.isSkinnedMesh)body_=o});
  let gloveLocal=new THREE.Vector3(-.08,0,0);if(body_&&HANDIDX.length){root.updateMatrixWorld(true);const C=new THREE.Vector3(),v=new THREE.Vector3();
    for(const j of HANDIDX){v.fromBufferAttribute(body_.geometry.attributes.position,j).applyMatrix4(body_.matrixWorld);C.add(v)}C.divideScalar(HANDIDX.length);gloveLocal=b.RightHand.worldToLocal(C)}
  return {root,bones:b,rest,side,i,body:body_,gloveLocal,footRest,baseY:root.position.y,k:new THREE.Vector3(),kv:new THREE.Vector3(),bx:root.position.x,bz:root.position.z}}


/* bone helper: rest pose then extra local euler */
const _q=new THREE.Quaternion(),_e=new THREE.Euler();
function rot(r,name,x=0,y=0,z=0){const bn=r.bones[name];if(!bn)return;bn.quaternion.copy(r.rest[name]).multiply(_q.setFromEuler(_e.set(x,y,z)))}

let POSE_OVERRIDE=null;
let FLIM=0,PULSE=0; // FLIM: 0 = tight & in sync, 1 = limp noodles. PULSE: hit pop
function dance(r,beat,isLead){
  const F=Math.min(FLIM,.7)*.32,w=performance.now()/1000,i=r.i,n=(k)=>Math.sin(w*(3.1+k*.7)+i*1.9+k)*F; // wobbly noise
  const ph=beat*Math.PI+F*(i*.9-1.8)+n(1)*.6, // dancers drift out of phase when flimsy
        s=Math.sin(ph),bounce=Math.abs(Math.cos(ph)),A=1-F*.45,pop=PULSE;
  r.root.position.y=-.04+bounce*.045*A+pop*.05-F*.07;
  for(const [L,sg] of [['Left',1],['Right',-1]]){const k=Math.max(0,sg*s)*A;
    rot(r,L+'UpLeg',-k*.55-.08-F*.35-pop*.15*Math.max(0,sg*s),n(2)*.25,n(3)*.15);
    rot(r,L+'Leg',k*.95+.12+F*.6+n(4)*.3,0,0);rot(r,L+'Foot',-k*.3+F*.2,0,0)}
  rot(r,'Hips',n(5)*.15,s*.14*A,n(6)*.12);
  rot(r,'Spine',.04+F*.35+n(7)*.15,0,-s*.05+n(8)*.25);rot(r,'Spine1',F*.2,-s*.08,s*.04+n(9)*.2);
  rot(r,'Neck',F*.4,0,n(10)*.4);
  rot(r,'Head',.02+F*.45-pop*.25,-s*.18*A+n(11)*.5,s*.06+n(12)*.6);
  const flop=(k)=>n(k)*1.1;
  if(isLead){
    // front man leads the crew: the hand on the stepping side swings out and rolls, the other tucks at the waist
    for(const [L,sg] of [['Left',1],['Right',-1]]){const act=Math.max(0,sg*s)*A; // 0..1, this side's turn
      rot(r,L+'Arm',(.25+.55*act)+flop(13+sg),sg*(.1+.35*act)+flop(15)*.5,-sg*(1.15-.45*act+F*.4)+pop*sg*.3);
      rot(r,L+'ForeArm',flop(16)*.5,-sg*(1.75-.6*act)*A,0);rot(r,L+'Hand',flop(17),sg*act*.6,sg*(.2+.6*act*Math.sin(ph*2))+flop(18))}
  }else{
    const inner=r.side>0?'Left':'Right',outer=r.side>0?'Right':'Left',si=inner==='Left'?1:-1,so=-si; // side>0 = stands left of coffin, so coffin is on his LEFT
    rot(r,inner+'Arm',flop(19)*.25,0,si*(-.15+F*.25));rot(r,inner+'ForeArm',0,si*-1.9*(1-F*.3),0);
    rot(r,inner+'Shoulder',0,0,si*-.25);
    rot(r,outer+'Arm',(.4+.25*Math.sin(ph*2+i))*A+flop(20)-pop*.25,flop(21)*.6,-so*(1.15-.15*Math.sin(ph*2))); // hangs at the side, swinging forward
    rot(r,outer+'ForeArm',flop(22)*.6,-so*(1.55+.3*Math.cos(ph*2))*A,0); // elbow bent, hand in front of the waist
    rot(r,outer+'Hand',flop(23),0,so*.5*Math.sin(ph*2)+flop(24));
  }
  const k=r.palm||0;if(k>0){rot(r,'Head',.18*k,.12*k*(r.i%2?1:-1),0);rot(r,'Spine',.08*k,0,0);}
}
let SHOCK=0;
// analytic two-bone IK with a pole direction, so the elbow bends where a real elbow would
const _S=new THREE.Vector3(),_E=new THREE.Vector3(),_H=new THREE.Vector3(),_dir=new THREE.Vector3(),_pp=new THREE.Vector3(),_q1=new THREE.Quaternion(),_q2=new THREE.Quaternion(),_q3=new THREE.Quaternion();
function aim(bone,child,to){bone.updateMatrixWorld(true);bone.getWorldPosition(_S);child.getWorldPosition(_H);
  const v1=_H.clone().sub(_S).normalize(),v2=to.clone().sub(_S).normalize();_q1.setFromUnitVectors(v1,v2);
  bone.getWorldQuaternion(_q2);bone.parent.getWorldQuaternion(_q3);bone.quaternion.copy(_q3.invert().multiply(_q1.multiply(_q2)));bone.updateMatrixWorld(true)}
function twoBone(r,side,T,pole){const up=r.bones[side+'Arm'],fo=r.bones[side+'ForeArm'],ha=r.bones[side+'Hand'];
  up.updateMatrixWorld(true);const S=up.getWorldPosition(new THREE.Vector3()),Ep=fo.getWorldPosition(new THREE.Vector3()),Hp=ha.getWorldPosition(new THREE.Vector3());
  const a=S.distanceTo(Ep),b=Ep.distanceTo(Hp);let d=Math.min(S.distanceTo(T),a+b-1e-4);d=Math.max(d,Math.abs(a-b)+1e-4);
  _dir.subVectors(T,S).normalize();const cosA=(a*a+d*d-b*b)/(2*a*d),sinA=Math.sqrt(Math.max(0,1-cosA*cosA));
  _pp.copy(pole).addScaledVector(_dir,-pole.dot(_dir)).normalize();
  _E.copy(S).addScaledVector(_dir,a*cosA).addScaledVector(_pp,a*sinA);
  aim(up,fo,_E.clone());aim(fo,ha,S.clone().addScaledVector(_dir,d))}
// (fresh vectors above: aim() reuses _S internally)
const _hp=new THREE.Vector3(),_hf=new THREE.Vector3(),_hh=new THREE.Vector3();
function facepalm(d,now){if(!d.palmAt||!body.on){d.palm=Math.max(0,(d.palm||0)-.05);return}
  const k=Math.min(1,Math.max(0,(now-d.palmAt)/220));d.palm=k;if(k<=0)return;
  if(k>=1&&!d.slapped){d.slapped=true;slapSound(Math.max(-1,Math.min(1,d.root.position.x/1.5)));SHAKE=Math.min(.3,SHAKE+.04)}
  d.bones.Head.getWorldPosition(_hp);d.bones.RightHand.getWorldPosition(_hh);
  // palm flat over the eyes and nose. Everything is taken from the head's own frame, so it follows the bowed head.
  const hq=d.bones.Head.getWorldQuaternion(new THREE.Quaternion());
  const U=new THREE.Vector3(0,1,0).applyQuaternion(hq),Fw=new THREE.Vector3(0,0,1).applyQuaternion(hq);
  const eL=d.bones.Face_EyeL.getWorldPosition(new THREE.Vector3()),eR=d.bones.Face_EyeR.getWorldPosition(new THREE.Vector3());
  const T=eL.add(eR).multiplyScalar(.5).addScaledVector(U,-.1).addScaledVector(Fw,.07); // glove centre (skinned glove sits ~7 cm above the measured offset): just in front of eyes/nose
  // hand orientation: fingers (local -X) up along the face, palm (local -Y) facing the face
  const X=U.clone().negate(),Y=Fw.clone(),Z=new THREE.Vector3().crossVectors(X,Y).normalize();Y.crossVectors(Z,X).normalize();
  const qw=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X,Y,Z));
  // exact wrist position = target minus the glove's rigid offset from the wrist
  const hb=d.bones.RightHand,ws=hb.getWorldScale(new THREE.Vector3());
  const right=new THREE.Vector3(-1,0,0).applyQuaternion(hq);T.addScaledVector(right,.04); // centre the palm over the nose
  const wrist=T.clone().sub(d.gloveLocal.clone().multiply(ws).applyQuaternion(qw));
  // elbow drops down and slightly out to his right, forearm angled up to the face
  twoBone(d,'Right',_hh.lerp(wrist,k),new THREE.Vector3(0,-1,0).addScaledVector(right,.6).addScaledVector(Fw,.05));
  {const pq=hb.parent.getWorldQuaternion(new THREE.Quaternion()).invert();hb.quaternion.slerp(pq.multiply(qw),k);hb.updateMatrixWorld(true)}
  // the other arm drops and hangs by his side
  d.bones.Hips.getWorldPosition(_hp);d.bones.LeftHand.getWorldPosition(_hh);_hf.set(_hp.x+.24,_hp.y-.3,_hp.z+.05);twoBone(d,'Left',_hh.lerp(_hf,k),new THREE.Vector3(.2,0,-1))}

/* ---------- audio: original upbeat track, 126 BPM ---------- */
let ac,startAt=0,BPM=126,customBuf=null,songLen=0,offset=0;
const spb=()=>60/BPM;
function tone(t,f,d,type,v,dest){const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;
 g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g).connect(dest);o.start(t);o.stop(t+d+.02)}
function kick(t){const o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(40,t+.12);
 g.gain.setValueAtTime(.9,t);g.gain.exponentialRampToValueAtTime(.001,t+.25);o.connect(g).connect(master);o.start(t);o.stop(t+.3)}
let noiseB;function hat(t,v){const s=ac.createBufferSource();s.buffer=noiseB;const f=ac.createBiquadFilter();f.type='highpass';f.frequency.value=7000;
 const g=ac.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.05);s.connect(f).connect(g).connect(master);s.start(t);s.stop(t+.06)}
const N=n=>440*2**((n-69)/12);
const prog=[[65,68,72],[61,65,68],[68,72,75],[63,67,70]];
const lead8=[77,75,77,80,77,75,72,75, 73,72,73,77,73,72,68,72, 75,77,80,84,80,77,75,77, 75,74,75,79,75,72,70,72];
let BARS=32;
function scheduleSong(out){
  songLen=BARS*4*spb();const s=spb(),lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2200;lp.connect(out);
  for(let bar=0;bar<BARS;bar++){const ch=prog[Math.floor(bar/2)%4],sec=Math.floor(bar/8);
    for(let b=0;b<4;b++){const t=startAt+(bar*4+b)*s;
      if(sec>0)kick(t);hat(t+s/2,.1);if(sec>1)hat(t,.04);
      tone(t+s/2,N(ch[0]-24),s*.45,'square',.1,lp);
      if(sec>0)ch.forEach(n=>tone(t,N(n),s*.9,'sawtooth',.03,lp));
      if(sec>=2&&sec!=4)for(let e=0;e<2;e++)tone(t+e*s/2,N(lead8[(bar%4)*8+b*2+e]),s*.45,'square',.06,lp);
    }}}

/* ---------- run state ---------- */
const store={get(k,d){try{return JSON.parse(localStorage.getItem('cdr_'+k))??d}catch{return d}},set(k,v){try{localStorage.setItem('cdr_'+k,JSON.stringify(v))}catch{}}};
let run,mode='play';
function newRun(){run={level:1,up:{shoulders:0,ears:0,hype:0,spare:0}}}
// endless: each level is one song, a bit faster and denser than the last
const dayCfg=d=>({bpm:Math.min(118+d*5,170),bars:24+Math.min(d,6)*2,dbl:Math.min(.08+d*.07,.6),trip:d>=4?Math.min((d-3)*.05,.25):0});

/* ---------- chart ---------- */
let notes=[],cfg;
let phrases=[];
// PaRappa-style call & response: the lead bearer shows a 1-bar pattern, then you repeat it on the next bar
function buildChart(){notes=[];phrases=[];const total=BARS*4;let rnd=7+run.level*13;const r=()=>(rnd=(rnd*9301+49297)%233280)/233280;
  for(let start=8;start+4<=total-2;start+=4){
    const k=Math.min(7,2+Math.round(cfg.dbl*6)+(cfg.trip>0?1:0)+(start>total/2?1:0));
    const slots=new Set([0]);let guard=0;while(slots.size<k&&guard++<50)slots.add(Math.floor(r()*8));
    let last=-1;const pat=[...slots].sort((x,y)=>x-y).map(sl=>{let l=Math.floor(r()*4);if(l===last&&r()<.6)l=(l+1)%4;last=l;return {off:sl/2,l}});
    for(const p of pat){p.note={t:offset+(start+p.off)*spb(),l:p.l,hit:false};notes.push(p.note)}
    phrases.push({start,pat})}
  notes.sort((x,y)=>x.t-y.t)}
function phraseAt(b){for(const p of phrases)if(b>=p.start-.5&&b<p.start+4-.5)return p;return null}
const CALLF=[67,71,74,79].map(n=>440*2**((n-69)/12));
function scheduleCalls(out){for(const p of phrases)for(const q of p.pat){const t=startAt+(p.start+q.off)*spb();
  const o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.value=CALLF[q.l];
  g.gain.setValueAtTime(.22,t);g.gain.exponentialRampToValueAtTime(.001,t+.22);o.connect(g).connect(out);o.start(t);o.stop(t+.25)}}

/* ---------- lanes / input ---------- */
const lc=document.getElementById('lanes'),cx=lc.getContext('2d');let LW,LH,HY;
function sizeLanes(){lc.width=lc.clientWidth*devicePixelRatio;lc.height=lc.clientHeight*devicePixelRatio;LW=lc.width;LH=lc.height;HY=LH-130*devicePixelRatio}sizeLanes();
const ROT=[Math.PI,Math.PI/2,-Math.PI/2,0],COL=['#ff4fa3','#3ec7ff','#ffd23e','#ff7a2f'];const press=[0,0,0,0];
function arrow(x,y,l,a,sz,ghost){cx.save();cx.translate(x,y);cx.rotate(ROT[l]);cx.globalAlpha=a;cx.beginPath();
 cx.moveTo(sz,0);cx.lineTo(0,-sz);cx.lineTo(0,-sz*.45);cx.lineTo(-sz,-sz*.45);cx.lineTo(-sz,sz*.45);cx.lineTo(0,sz*.45);cx.lineTo(0,sz);cx.closePath();
 cx.fillStyle=ghost?'rgba(255,255,255,.25)':COL[l];cx.fill();cx.lineWidth=4*devicePixelRatio;cx.strokeStyle=ghost?'#fff':'#000';cx.stroke();cx.restore()}
let score=0,combo=0,maxCombo=0,miss=0,hits=0,perf=0,playing=false,judgeT=0,dropT=-1,src,balance=100,catchT=-9,master;
const judge=document.getElementById('judge');
function show(txt,c){judge.textContent=txt;judge.style.color=c;judgeT=performance.now()}
// AudioContext.currentTime only advances in audio-buffer-sized steps (often 20-40 ms), which made the arrows stutter.
// Use the high-resolution performance clock, locked to the audio clock, so motion is smooth at the display's full refresh rate.
let clkOff=null,clkFrame=-1,clkVal=0;
function audioNow(){if(paused)return pauseClock;const p=performance.now()/1000;let est;
  if(ac.getOutputTimestamp){const ts=ac.getOutputTimestamp();est=ts.contextTime+(p-ts.performanceTime/1000);if(!ts.performanceTime)est=ac.currentTime}else est=ac.currentTime;
  const target=est-p;if(clkOff===null||Math.abs(target-clkOff)>.08)clkOff=target;else clkOff+=(target-clkOff)*.03;return p+clkOff}
const TOUCH=matchMedia('(pointer:coarse)').matches||'ontouchstart' in window;
if(TOUCH)document.body.classList.add('touch');
const IOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
/* ---------- volume, mute, pause ---------- */
let outBus=null,paused=false,pauseClock=0;
let volume=(()=>{try{const v=parseFloat(localStorage.getItem('cdr_vol'));return isNaN(v)?.8:v}catch{return .8}})();
let muted=(()=>{try{return localStorage.getItem('cdr_mute')==='1'}catch{return false}})();
function ensureAudio(){ac??=new AudioContext();if(!outBus){outBus=ac.createGain();outBus.connect(ac.destination)}applyVol()}
function applyVol(){if(outBus)outBus.gain.setTargetAtTime(muted?0:volume*volume,ac.currentTime,.02);
  try{localStorage.setItem('cdr_vol',volume);localStorage.setItem('cdr_mute',muted?'1':'0')}catch{}
  const b=document.getElementById('snd');if(b){b.innerHTML=muted||volume===0?ICON_OFF:ICON_ON;b.setAttribute('aria-label',muted?'Unmute':'Mute');b.title=(muted?'Unmute':'Mute')+' (M)'}
  document.querySelectorAll('.vol').forEach(r=>{r.value=Math.round(volume*100)})}
const ICON_ON='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>';
const ICON_OFF='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M3 9v6h4l5 4V5L7 9H3zm13.6 3 2.7-2.7-1.4-1.4-2.7 2.7-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4z"/></svg>';
function toggleMute(){muted=!muted;if(!muted&&volume===0)volume=.6;applyVol()}
const volRow=()=>`<div class="volrow"><label>Volume <input class="vol" type="range" min="0" max="100" value="${Math.round(volume*100)}" aria-label="Volume"></label></div>`;
function wireVol(){card.querySelectorAll('.vol').forEach(r=>r.oninput=()=>{volume=r.value/100;muted=volume===0;applyVol()})}
function pauseGame(){if(!playing||paused)return;pauseClock=audioNow();paused=true;try{ac.suspend()}catch{}
  screen(`<h1>Paused</h1><p>Level ${run.level} · Score ${score}</p>${volRow()}<button data-a="resume">▶ Resume</button><button data-a="quitrun">Quit</button><p style="font-size:13px;opacity:.7">Esc / P to resume</p>`,'pause');wireVol()}
function resumeGame(){if(!paused)return;menu.style.display='none';document.body.classList.remove('menuopen');ac.resume().then(()=>{clkOff=null;paused=false})}
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseGame()});
addEventListener('blur',()=>pauseGame());
const songTime=()=>{const f=renderer.info.render.frame;if(f!==clkFrame){clkFrame=f;clkVal=audioNow()-startAt}return clkVal};
const win=()=>.16*(1+.15*run.up.ears),mult=()=>1+Math.floor(combo/(10-2*run.up.hype));
function damage(){combo=0;miss++;SHAKE=Math.min(.12,SHAKE+.05);FLIM=Math.min(1,FLIM+.25);balance-=12*(1-.2*run.up.shoulders);if(balance<=0)fall()}
function fall(){balance=0;dropT=songTime();playing=false;dropCoffin();
  // each dancer facepalms in turn once the coffin has hit the sand; hold on the scene ~5 s before the score screen
  ALL().forEach((d,i)=>{d.palmAt=performance.now()+900+i*170+Math.random()*80;d.slapped=false});
  setTimeout(()=>fail(),6200)}
function slapSound(pan){if(!ac)return;const t=ac.currentTime,n=ac.createBufferSource(),len=.12;const buf=ac.createBuffer(1,ac.sampleRate*len,ac.sampleRate),dd=buf.getChannelData(0);
  for(let i=0;i<dd.length;i++){const e=Math.exp(-i/(ac.sampleRate*.012));dd[i]=(Math.random()*2-1)*e}
  n.buffer=buf;const bp=ac.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1600+Math.random()*500;bp.Q.value=.9;
  const lo=ac.createOscillator(),lg=ac.createGain();lo.frequency.setValueAtTime(180,t);lo.frequency.exponentialRampToValueAtTime(60,t+.06);lg.gain.setValueAtTime(.35,t);lg.gain.exponentialRampToValueAtTime(.001,t+.08);
  const g=ac.createGain();g.gain.value=.9;const p=ac.createStereoPanner();p.pan.value=pan;
  n.connect(bp).connect(g).connect(p).connect(outBus);lo.connect(lg).connect(p);n.start(t);lo.start(t);lo.stop(t+.1)}
function hitLane(l){if(!playing||paused)return;press[l]=performance.now();const t=audioNow()-startAt,w=win();
  {const b=t/spb();if(!phraseAt(b)&&!phraseAt(b+.5))return} // only judge during your bar
  let best=null,bd=1;for(const n of notes){if(n.t-t>w)break;if(n.hit||n.l!==l)continue;const d=Math.abs(n.t-t);if(d<bd){bd=d;best=n}}
  if(best&&bd<w){best.hit=true;best.ok=true;best.ht=performance.now();combo++;hits++;maxCombo=Math.max(maxCombo,combo);
    const [p,txt,c,heal]=bd<w*.32?[300,'PERFECT','#f3cf6a',3]:bd<w*.62?[150,'GREAT','#f4f1ea',2]:[50,'OK','#c9a27a',.5];
    if(heal===3)perf++;hitSound(best,heal>=3?3:heal>=2?2:1);FLIM=Math.max(0,FLIM-.18);PULSE=1;score+=p*mult();balance=Math.min(100,balance+heal);show(txt,c)}
  else{damage();missSound();show('WRONG','#ff4040')}}
// hit sounds: a marimba-like pluck on a tone of the current chord, snapped to the beat grid so it plays in time with the track
function hitSound(n,grade){if(!ac||!master)return;const beat=(n.t-offset)/spb(),bar=Math.floor(beat/4),ch=prog[Math.floor(bar/2)%4];
  const midi=[ch[0],ch[1],ch[2],ch[0]+12][n.l]+12,f=440*2**((midi-69)/12);
  const t=Math.max(ac.currentTime+.005,startAt+n.t);const v=grade===3?.2:grade===2?.16:.11;
  const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3200;lp.connect(master);
  for(const [type,mul,g0,dec] of [['triangle',1,v,.35],['sine',2,v*.45,.18],['square',4,v*.08,.05]]){const o=ac.createOscillator(),g=ac.createGain();
    o.type=type;o.frequency.value=f*mul;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(g0,t+.004);g.gain.exponentialRampToValueAtTime(.0008,t+dec);
    o.connect(g).connect(lp);o.start(t);o.stop(t+dec+.02)}
  if(grade===3){const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=f*3;g.gain.setValueAtTime(.05,t+.03);g.gain.exponentialRampToValueAtTime(.0008,t+.25);o.connect(g).connect(lp);o.start(t+.03);o.stop(t+.3)}}
function missSound(){if(!ac||!master)return;const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain(),lp=ac.createBiquadFilter();
  lp.type='lowpass';lp.frequency.value=500;o.type='sawtooth';o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(70,t+.15);
  g.gain.setValueAtTime(.09,t);g.gain.exponentialRampToValueAtTime(.001,t+.18);o.connect(lp).connect(g).connect(master);o.start(t);o.stop(t+.2)}
const KEYS={ArrowLeft:0,ArrowDown:1,ArrowUp:2,ArrowRight:3};
addEventListener('keydown',e=>{if(e.key in KEYS){e.preventDefault();if(!e.repeat)hitLane(KEYS[e.key])}
  if((e.key==='Escape'||e.key==='p'||e.key==='P')&&playing){e.preventDefault();paused?resumeGame():pauseGame()}
  if((e.key==='m'||e.key==='M')&&e.target.tagName!=='INPUT')toggleMute()});
document.querySelectorAll('#touch button').forEach(d=>d.addEventListener('pointerdown',e=>{e.preventDefault();hitLane(+d.dataset.l);d.classList.add('dn');setTimeout(()=>d.classList.remove('dn'),90)}));

/* ---------- screens ---------- */
const menu=document.getElementById('menu'),card=menu.querySelector('.card');
const esc=t=>String(t).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const ONLINE=lb.online,board=()=>lb.state.cache,fetchBoard=lb.fetchBoard,submitScore=lb.submitScore;
fetchBoard().then(()=>{if(card.dataset.screen==='title'||card.dataset.screen==='scores')ACT[card.dataset.screen]()});
function screen(html,name=''){document.body.classList.add('menuopen');card.dataset.screen=name;card.innerHTML=html;menu.style.display='flex';card.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>ACT[b.dataset.a](b.dataset.v))}
function title(){const b=board();screen(`<h1>⚰️ Coffin Dance</h1>
  <p>${TOUCH?'Tap the matching <b>arrow button</b>':'Hit <b>← ↓ ↑ →</b>'} as the buttons reach the brass handle to keep the coffin balanced. Every song gets faster. Drop the coffin and it's over.</p>
  ${b.length?`<p style="font-size:14px">Best: <b>${b[0].score}</b> by ${esc(b[0].name)}</p>`:''}
  ${IOS?'<p style="font-size:13px;opacity:.8">🔈 No sound? Turn off silent mode.</p>':''}
  <button data-a="play">▶ Play</button><button data-a="scores"><svg class="tro" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M7 3h10v2h3v3a4 4 0 0 1-4 4h-.3A5 5 0 0 1 13 14.9V17h3v2H8v-2h3v-2.1A5 5 0 0 1 8.3 12H8a4 4 0 0 1-4-4V5h3V3zm0 4H6v1a2 2 0 0 0 1 1.7V7zm10 0v2.7A2 2 0 0 0 18 8V7h-1zM7 20h10v2H7z"/></svg>High scores</button>${volRow()}`,'title');wireVol()}
const privacyNote=()=>(ONLINE?'Your name and score are shown publicly to all players.':'Scores are saved in this browser only.')+(ONLINE&&config.contact?` To remove an entry: ${esc(config.contact)}`:'');
function boardHtml(hl){const b=board();if(lb.state.status==='loading')return '<p style="opacity:.7">Loading scores…</p>';
  if(lb.state.status==='error'&&!b.length)return '<p style="opacity:.7">Couldn\'t reach the score server.</p>';
  if(!b.length)return '<p style="opacity:.7">No scores yet. Be the first!</p>';
  return '<table style="width:100%;border-collapse:collapse;font-size:14px;text-align:left">'+
  '<tr style="opacity:.7"><th>#</th><th>Name</th><th>Level</th><th style="text-align:right">Score</th></tr>'+
  b.map((e,i)=>`<tr style="${i===hl?'color:#f3cf6a;font-weight:800':''}"><td>${i+1}</td><td>${esc(e.name)}</td><td>${e.level}</td><td style="text-align:right">${e.score}</td></tr>`).join('')+'</table>'}
function scores(hl=-1,fresh=false){if(!fresh&&ONLINE){fetchBoard().then(()=>{if(card.dataset.screen==='scores')scores(hl,true)})}
  screen(`<h1><svg class="tro" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M7 3h10v2h3v3a4 4 0 0 1-4 4h-.3A5 5 0 0 1 13 14.9V17h3v2H8v-2h3v-2.1A5 5 0 0 1 8.3 12H8a4 4 0 0 1-4-4V5h3V3zm0 4H6v1a2 2 0 0 0 1 1.7V7zm10 0v2.7A2 2 0 0 0 18 8V7h-1zM7 20h10v2H7z"/></svg>High scores</h1>${boardHtml(hl)}<br><button data-a="play">▶ Play</button><button data-a="title">Menu</button><p style="font-size:12px;opacity:.6;margin-bottom:0">${privacyNote()}</p>`,'scores')}
function endRun(){const b=board(),qualifies=score>0&&(b.length<10||score>b[b.length-1].score);
  screen(`<h1>💥 Coffin dropped</h1>
  <p>Score <b>${score}</b> · Level ${run.level} · Max combo ${maxCombo}</p>
  ${qualifies?`<p><b>New high score!</b><br><input id="nm" maxlength="16" placeholder="Name" value="${esc(store.get('name',''))}" style="padding:8px;border-radius:8px;border:0;font-size:16px;width:60%"> <button id="sv">Save</button><br><span id="nmerr" style="color:#ff8a7a;font-size:13px;min-height:1em;display:inline-block"></span><br><span style="font-size:12px;opacity:.65">${privacyNote()}</span></p>`:''}
  <button data-a="play">▶ Play again</button><button data-a="scores"><svg class="tro" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M7 3h10v2h3v3a4 4 0 0 1-4 4h-.3A5 5 0 0 1 13 14.9V17h3v2H8v-2h3v-2.1A5 5 0 0 1 8.3 12H8a4 4 0 0 1-4-4V5h3V3zm0 4H6v1a2 2 0 0 0 1 1.7V7zm10 0v2.7A2 2 0 0 0 18 8V7h-1zM7 20h10v2H7z"/></svg>High scores</button>`);
  const sv=card.querySelector('#sv');if(sv){const nm=card.querySelector('#nm');nm.focus();
    const er=card.querySelector('#nmerr');
    // live check while typing; Save stays disabled until the name passes the filter
    const check=()=>{const p=nameProblem(nm.value);er.textContent=nm.value.trim()?p:'';sv.disabled=!!p;sv.style.opacity=p?.45:1;return !p};
    nm.oninput=check;check();
    let busy=false;const save=async()=>{if(busy||!check())return;busy=true;sv.textContent='Saving…';const name=nm.value.trim().slice(0,16);
      const e={name,score,level:run.level};const res=await submitScore(e);
      if(!res.ok){busy=false;sv.textContent='Save';er.textContent=res.reason;return}
      store.set('name',name);const top=board();
      scores(top.findIndex(x=>x.name===e.name&&x.score===e.score&&x.level===e.level),true)};
    sv.onclick=save;nm.onkeydown=ev=>{ev.stopPropagation();if(ev.key==='Enter')save()}}}
function fail(){endRun()}
function quit(){playing=false;try{src?.stop()}catch{}try{master?.disconnect()}catch{}title()}
function nextLevel(){run.level++;cfg=dayCfg(run.level);show('LEVEL '+run.level,'#f3cf6a');start(true)}
function quitRun(){paused=false;playing=false;try{ac.resume()}catch{}try{master?.disconnect()}catch{}title()}
const ACT={resume:resumeGame,quitrun:quitRun,scores:()=>scores(),title,play(){mode='play';newRun();cfg=dayCfg(1);start()}};

function start(cont){ensureAudio();ac.resume();paused=false;
  noiseB=ac.createBuffer(1,ac.sampleRate*.1,ac.sampleRate);noiseB.getChannelData(0).forEach((_,i,a)=>a[i]=Math.random()*2-1);
  BPM=cfg.bpm;offset=0;BARS=cfg.bars;try{master?.disconnect()}catch{}
  startAt=ac.currentTime+(cont?.2:.8);FLIM=0;body.on=false;ALL().forEach(d=>{d.k.set(0,0,0);d.kv.set(0,0,0);d.palm=0;d.slapped=false});if(!cont){score=combo=maxCombo=0;balance=100}miss=hits=perf=0;dropT=-1;catchT=-9;coffin.rotation.set(0,0,0);coffin.position.set(0,coffinBase,COFFIN_Z);
  master=ac.createGain();master.connect(outBus);
  if(customBuf){src=ac.createBufferSource();src.buffer=customBuf;src.connect(master);src.start(startAt);songLen=customBuf.duration}
  else scheduleSong(master);
  buildChart();
  menu.style.display='none';document.body.classList.remove('menuopen');playing=true}

/* ---------- loop ---------- */
const clock=new THREE.Clock(),FALL=1.6;
const bar=document.createElement('div');bar.style.cssText='position:fixed;left:16px;top:52px;width:min(260px,40vw);height:14px;border-radius:3px;background:#6b3a1f;border:3px solid #2a160c;box-shadow:0 3px 0 rgba(40,20,8,.45);overflow:hidden;z-index:2;display:none';
const fillEl=document.createElement('div');fillEl.style.cssText='height:100%;width:100%;transition:width .15s';bar.appendChild(fillEl);document.body.appendChild(bar);
const lbl=document.createElement('div');lbl.style.cssText='position:fixed;left:16px;top:70px;font-size:12px;font-weight:800;text-shadow:0 1px 0 #000;z-index:2;display:none';document.body.appendChild(lbl);
window.__setT=t=>POSE_OVERRIDE=t;
renderer.setAnimationLoop(()=>{try{frame()}catch(e){if(!window.__err){window.__err=1;console.error('LOOP',e.stack)}}});
/* ---------- rigid-body coffin (box, gravity, corner contacts, bounce, friction) ---------- */
const body={on:false,v:new THREE.Vector3(),w:new THREE.Vector3(),m:60};
const _ib=new THREE.Vector3(),_R=new THREE.Matrix3(),_Ri=new THREE.Matrix3(),_t=new THREE.Vector3(),_n=new THREE.Vector3(0,1,0),_r=new THREE.Vector3(),_vc=new THREE.Vector3(),_rn=new THREE.Vector3(),_dq=new THREE.Quaternion();
let CORNERS=[],SAMPLES=[],dropAt=0;const ALL=()=>[...crew,lead];
function dropCoffin(){body.on=true;
  // which side gives out: more misses come from the "weaker" side; pick randomly with a lurch
  const side=Math.random()<.5?-1:1;
  body.v.set(side*.6,.6,(Math.random()-.5)*.6);body.w.set((Math.random()-.5)*1.5,(Math.random()-.5)*.8,-side*2.4);
  const {x,y,z}=HALF;CORNERS=[];for(const a of[-1,1])for(const b of[0,2])for(const c of[-1,1])CORNERS.push(new THREE.Vector3(a*x,b*y,c*z));
  SAMPLES=[];for(const a of[-1,0,1])for(const b of[0,1,2])for(const c of[-1,-.5,0,.5,1])if(a||b!==1||Math.abs(c)===1)SAMPLES.push(new THREE.Vector3(a*x,b*y,c*z));
  dropAt=performance.now();
  // the carriers on the failing side buckle and stagger out of the way
  crew.forEach(r=>{const sx=Math.sign(r.root.position.x);r.kv.set(sx*(sx===side?1.4:.5),0,(Math.random()-.5)*.4)});
  // centre of mass is the box centre (pivot is at the bottom): treat pivot+half.y
  const m=body.m;_ib.set(1/(m*(4*y*y+4*z*z)/12),1/(m*(4*x*x+4*z*z)/12),1/(m*(4*x*x+4*y*y)/12));SHAKE=.25}
function invI(v){ // world inverse inertia applied to v
  _R.setFromMatrix4(coffin.matrixWorld.clone().extractRotation(coffin.matrixWorld));_Ri.copy(_R).transpose();
  return v.applyMatrix3(_Ri).multiply(_ib).applyMatrix3(_R)}
function stepBody(dt){const sub=6,h=dt/sub,com=new THREE.Vector3();
  for(let k=0;k<sub;k++){body.v.y-=9.81*h;
    coffin.position.addScaledVector(body.v,h);
    const wl=body.w.length();if(wl>1e-6){_dq.setFromAxisAngle(_t.copy(body.w).divideScalar(wl),wl*h);
      // rotate about centre of mass, not the bottom pivot
      com.set(0,HALF.y,0).applyQuaternion(coffin.quaternion).add(coffin.position);
      coffin.quaternion.premultiply(_dq);const nc=_t.set(0,HALF.y,0).applyQuaternion(coffin.quaternion);coffin.position.copy(com).sub(nc)}
    coffin.updateMatrixWorld(true);com.set(0,HALF.y,0).applyQuaternion(coffin.quaternion).add(coffin.position);
    let deepest=0;
    for(const c of CORNERS){const p=_t.copy(c).applyMatrix4(coffin.matrixWorld);if(p.y>=0)continue;deepest=Math.min(deepest,p.y);
      _r.copy(p).sub(com);_vc.copy(body.w).cross(_r).add(body.v);const vn=_vc.y;
      if(vn<0){const e=Math.abs(vn)>1.2?.25:0; // dead wood: low bounce
        _rn.copy(_r).cross(_n);invI(_rn);const denom=1/body.m+_rn.cross(_r).dot(_n);const j=-(1+e)*vn/denom/ (CORNERS.length/2);
        body.v.addScaledVector(_n,j/body.m);body.w.add(invI(_r.clone().cross(_n.clone().multiplyScalar(j))));
        // friction on the sand
        const vt=new THREE.Vector3(_vc.x,0,_vc.z),vtl=vt.length();if(vtl>1e-4){const jt=Math.min(.7*j,vtl/denom/(CORNERS.length/2));
          const imp=vt.multiplyScalar(-jt/vtl);body.v.addScaledVector(imp,1/body.m);body.w.add(invI(_r.clone().cross(imp)))}}}
    if(deepest<0)coffin.position.y-=deepest; // push out of the sand
    if(performance.now()-dropAt>120)collideDancers(com);
    if(deepest<0){body.v.x*=.995;body.v.z*=.995;body.w.multiplyScalar(.985)}}
  coffin.updateMatrixWorld(true)}

// dancers are vertical capsules: the coffin bumps off shoulders/heads and shoves people aside
const _cn=new THREE.Vector3(),_cp2=new THREE.Vector3();
function contact(p,n,e,mu,com,share){_r.copy(p).sub(com);_vc.copy(body.w).cross(_r).add(body.v);const vn=_vc.dot(n);if(vn>=0)return 0;
  _rn.copy(_r).cross(n);invI(_rn);const denom=1/body.m+_rn.cross(_r).dot(n);const j=-(1+e)*vn/denom/share;
  body.v.addScaledVector(n,j/body.m);body.w.add(invI(_r.clone().cross(n.clone().multiplyScalar(j))));
  const vt=_vc.clone().addScaledVector(n,-vn),vtl=vt.length();
  if(vtl>1e-4){const jt=Math.min(mu*j,vtl/denom/share);const imp=vt.multiplyScalar(-jt/vtl);body.v.addScaledVector(imp,1/body.m);body.w.add(invI(_r.clone().cross(imp)))}
  return -vn}
function collideDancers(com){const R=.21,H=1.8;
  for(const d of ALL()){const dx0=d.root.position.x,dz0=d.root.position.z;let hits=[];
    for(const c of SAMPLES){const p=_cp2.copy(c).applyMatrix4(coffin.matrixWorld);if(p.y>H||p.y<0)continue;
      const dx=p.x-dx0,dz=p.z-dz0,dist=Math.hypot(dx,dz);if(dist>=R)continue;
      const radial=R-dist,top=H-p.y;
      if(top<radial&&top<.12)hits.push([p.clone(),new THREE.Vector3(0,1,0),top]);
      else hits.push([p.clone(),new THREE.Vector3(dx/(dist||1),0,dz/(dist||1)),radial])}
    if(!hits.length)continue;let maxPen=0,avgN=new THREE.Vector3();
    for(const [p,n,pen] of hits){const sp=contact(p,n,.15,.4,com,hits.length);maxPen=Math.max(maxPen,pen);avgN.addScaledVector(n,pen);
      if(n.y===0)d.kv.addScaledVector(n,-Math.min(1.5,sp*.35)/hits.length)} // the person is shoved the other way
    avgN.normalize();coffin.position.addScaledVector(avgN,maxPen*.8);coffin.updateMatrixWorld(true);
    if(maxPen>.02){FLIM=Math.min(1,FLIM+.02);SHAKE=Math.min(.3,SHAKE+.01)}}}
function stepKnock(dt){for(const d of ALL()){d.k.addScaledVector(d.kv,dt);d.kv.multiplyScalar(Math.exp(-3.5*dt));
  if(d.k.length()>.9)d.k.setLength(.9);d.root.position.x=d.bx+d.k.x;d.root.position.z=d.bz+d.k.z}}
/* ---------- camera: slow orbit, combo push-in, miss shake, drop follow ---------- */
let SHAKE=0;const camT=new THREE.Vector3(.1,1.05,0),_cp=new THREE.Vector3(),_ct=new THREE.Vector3(),_rt=new THREE.Vector3();
function moveCam(dt,beat){const w=performance.now()/1000;
  let ang=.45+.85*Math.sin(w*.1),rad=7.4-Math.min(combo,60)/60*1.2,hgt=1.4+.15*Math.sin(w*.13);
  _ct.set(0,playing?.7:1.05,-.1);
  if(body.on){_ct.copy(coffin.position).add(_t.set(0,.6,0));ang=.55;rad=5.4;hgt=3.4}
  if(!playing&&!body.on&&menu.style.display!=='none'){ang=.3+1.1*Math.sin(w*.08);rad=6.2;hgt=2.2+.3*Math.sin(w*.05)}
  if(cam.aspect<1.25){const k=Math.min(2.3,1.3/cam.aspect);rad*=k;hgt+= (k-1)*.6;if(TOUCH&&playing)_ct.y+=.55}
  _cp.set(_ct.x+Math.sin(ang)*rad,hgt,_ct.z+Math.cos(ang)*rad);
  const kk=1-Math.exp(-dt*(body.on?3:1.6));cam.position.lerp(_cp,kk);camT.lerp(_ct,kk);
  SHAKE=Math.max(0,SHAKE-dt*.4);const sh=SHAKE*(.5+.5*Math.abs(Math.cos(beat*Math.PI)));
  cam.position.x+=(Math.random()-.5)*sh;cam.position.y+=(Math.random()-.5)*sh;
  // keep the crew left of the arrow lanes when playing
  _rt.subVectors(camT,cam.position).normalize().cross(cam.up).normalize();
  const off=0;cam.lookAt(_t.copy(camT).addScaledVector(_rt,off));}
/* ---------- PaRappa-style rhythm bar ---------- */
/* ---------- rhythm bar in the game's look: faceted coffin-lid plank, gold studs, suit-black buttons ---------- */
function rr(x,y,w,h,r){cx.beginPath();cx.moveTo(x+r,y);cx.arcTo(x+w,y,x+w,y+h,r);cx.arcTo(x+w,y+h,x,y+h,r);cx.arcTo(x,y+h,x,y,r);cx.arcTo(x,y,x+w,y,r);cx.closePath()}
function oct(x,y,R){cx.beginPath();for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;cx.lineTo(x+Math.cos(a)*R,y+Math.sin(a)*R)}cx.closePath()}
const WOOD={lit:'#a3633a',mid:'#8a4f2c',dark:'#6b3a1f',line:'#2a160c'},GOLD='#d9a632',GOLD2='#f3cf6a';
function arrowPath(l,s){cx.save();cx.rotate(ROT[l]);cx.beginPath();cx.moveTo(s,0);cx.lineTo(s*.05,-s*.95);cx.lineTo(s*.05,-s*.4);cx.lineTo(-s*.9,-s*.4);cx.lineTo(-s*.9,s*.4);cx.lineTo(s*.05,s*.4);cx.lineTo(s*.05,s*.95);cx.closePath();cx.restore()}
function button(x,y,R,l,state,glow,ghost){const d=devicePixelRatio;cx.save();cx.translate(x,y);
  if(glow>0){cx.globalAlpha=glow;cx.fillStyle=GOLD2;oct(0,0,R*1.42);cx.fill();cx.globalAlpha=1}
  const ga=cx.globalAlpha;cx.globalAlpha=ga*(ghost?.55:1);
  oct(0,R*.12,R);cx.fillStyle=WOOD.line;cx.fill(); // drop shadow facet
  oct(0,0,R);cx.fillStyle=state==='miss'?'#4a4a4a':'#151515';cx.fill();cx.lineWidth=4*d;cx.strokeStyle=state==='miss'?'#777':GOLD;cx.stroke();
  // upper facet highlight, low-poly style
  cx.beginPath();for(let i=4;i<8;i++){const a=Math.PI/8+i*Math.PI/4;cx.lineTo(Math.cos(a)*R*.82,Math.sin(a)*R*.82)}cx.closePath();cx.fillStyle='rgba(255,255,255,.07)';cx.fill();
  arrowPath(l,R*.52);cx.fillStyle=state==='miss'?'#999':'#f4f1ea';cx.fill();cx.lineWidth=2*d;cx.strokeStyle='#000';cx.stroke();
  cx.restore();
  if(state==='miss'){cx.strokeStyle='#b8322a';cx.lineWidth=5*d;cx.lineCap='round';cx.beginPath();cx.moveTo(x-R*.55,y-R*.55);cx.lineTo(x+R*.55,y+R*.55);cx.moveTo(x+R*.55,y-R*.55);cx.lineTo(x-R*.55,y+R*.55);cx.stroke();cx.lineCap='butt'}}
function capIcon(x,y,R){const d=devicePixelRatio;cx.fillStyle='#111';cx.fillRect(x-R*.62,y-R*.42,R*1.24,R*.62);cx.fillStyle='#f4f1ea';cx.fillRect(x-R*.64,y+R*.02,R*1.28,R*.13);
  cx.fillStyle='#0a0a0a';cx.beginPath();cx.moveTo(x-R*.5,y+R*.2);cx.lineTo(x+R*.5,y+R*.2);cx.lineTo(x+R*.75,y+R*.38);cx.lineTo(x-R*.2,y+R*.38);cx.closePath();cx.fill()}
function gloveIcon(x,y,R){cx.fillStyle='#f4f1ea';cx.strokeStyle='#111';cx.lineWidth=2*devicePixelRatio;
  for(let f=0;f<4;f++){rr(x-R*.5+f*R*.27,y-R*.62+(f===0||f===3?R*.12:0),R*.22,R*.62,R*.1);cx.fill();cx.stroke()}
  rr(x-R*.55,y-R*.12,R*1.1,R*.62,R*.18);cx.fill();cx.stroke();rr(x+R*.42,y-R*.1,R*.3,R*.22,R*.1);cx.fill();cx.stroke()}
function plank(x0,y0,x1,bh){const d=devicePixelRatio,sh=x0+(x1-x0)*.16,t=bh*.12;
  const path=(o)=>{cx.beginPath();cx.moveTo(x0+o,y0+bh*.3);cx.lineTo(sh,y0+o);cx.lineTo(x1-bh*.25-o,y0+bh*.08+o);cx.lineTo(x1-o,y0+bh*.35);cx.lineTo(x1-o,y0+bh*.65);
    cx.lineTo(x1-bh*.25-o,y0+bh*.92-o);cx.lineTo(sh,y0+bh-o);cx.lineTo(x0+o,y0+bh*.7);cx.closePath()};
  cx.save();cx.translate(0,bh*.08);path(0);cx.fillStyle='rgba(40,20,8,.45)';cx.fill();cx.restore(); // shadow on the sand
  path(0);cx.fillStyle=WOOD.dark;cx.fill();cx.lineWidth=5*d;cx.strokeStyle=WOOD.line;cx.stroke();
  path(t);cx.fillStyle=WOOD.mid;cx.fill();
  cx.save();path(t);cx.clip();cx.fillStyle=WOOD.lit;cx.fillRect(x0,y0,x1-x0,bh*.45);cx.restore(); // top facet catches the sun
  path(t);cx.lineWidth=2*d;cx.strokeStyle='rgba(42,22,12,.6)';cx.stroke();}
// scrolling lid: notes slide right-to-left into a fixed brass handle, so every note is visible ~4 beats ahead
const LOOK=3,BEHIND=.7;
function drawBar(b,now){const d=devicePixelRatio,pad=10*d,y0=LH*.08,bh=LH*.84,cy=y0+bh/2,R=bh*.31;
  const L=pad+R*1.3,Rt=LW-pad-R,hx=L+(Rt-L)*BEHIND/(LOOK+BEHIND),X=t=>hx+(t-b)/(LOOK+BEHIND)*(Rt-L);
  // hit line: a brass coffin handle standing in the sand, with a faint target ring
  cx.save();cx.globalAlpha=.55;oct(hx,cy,R*1.08);cx.lineWidth=3*d;cx.strokeStyle=GOLD2;cx.setLineDash([6*d,5*d]);cx.stroke();cx.setLineDash([]);cx.restore();
  cx.fillStyle='rgba(40,20,8,.35)';rr(hx-4*d,y0+6*d,10*d,bh,5*d);cx.fill();
  cx.fillStyle=WOOD.line;rr(hx-5*d,y0-2*d,10*d,bh+4*d,5*d);cx.fill();
  cx.fillStyle=GOLD;rr(hx-3.5*d,y0-.5*d,7*d,bh+1*d,3.5*d);cx.fill();cx.fillStyle=GOLD2;cx.fillRect(hx-1.5*d,y0+2*d,2*d,bh-4*d);
  for(const yy of[y0-2*d,y0+bh+2*d]){cx.fillStyle=GOLD;cx.strokeStyle=WOOD.line;cx.lineWidth=2.5*d;rr(hx-10*d,yy-5*d,20*d,10*d,3*d);cx.fill();cx.stroke()}
  for(const ph of phrases){if(ph.start+4<b-BEHIND-1||ph.start>b+LOOK+1)continue;
    for(const q of ph.pat){const tr=ph.start+q.off,n=q.note;if(tr<b-BEHIND-.5||tr>b+LOOK+.5)continue;
      let st='',glow=0,sc=1;if(n.ok){const k=Math.max(0,1-(now-n.ht)/260);sc=1+k*.35;glow=k;if(k===0)continue}else if(n.miss)st='miss';
      const x=X(tr),fade=Math.min(1,(Rt+R-x)/(R*2.5)); // fade in at the right edge
      cx.save();cx.globalAlpha=Math.max(0,fade);cx.fillStyle='rgba(40,20,8,.35)';cx.beginPath();cx.ellipse(x,cy+R*1.02,R*.85,R*.2,0,0,7);cx.fill();cx.restore(); // shadow on the sand
      cx.save();cx.globalAlpha=Math.max(0,fade);button(x,cy,R*sc,q.l,st,glow,false);cx.restore()}}}
let lastF=performance.now();
// adaptive resolution: if frames take longer than ~60 fps allows, render the 3D scene at a lower pixel ratio
let ftAvg=16.7,prNow=Math.min(devicePixelRatio,2),prCheck=0;
function adapt(dtms){ftAvg+=(dtms-ftAvg)*.05;if(++prCheck<90)return;prCheck=0;
  if(ftAvg>18.5&&prNow>.75){prNow=Math.max(.75,prNow-.25);renderer.setPixelRatio(prNow);renderer.setSize(innerWidth,innerHeight)}
  else if(ftAvg<13&&prNow<Math.min(devicePixelRatio,2)){prNow=Math.min(Math.min(devicePixelRatio,2),prNow+.25);renderer.setPixelRatio(prNow);renderer.setSize(innerWidth,innerHeight)}}
let wasPlaying=null;
function frame(){if(wasPlaying!==playing){wasPlaying=playing;document.body.classList.toggle('playing',playing)}const now=performance.now(),fdt=Math.min(.1,(now-lastF)/1000);adapt(now-lastF);lastF=now;stepEnv(fdt);
  FLIM=Math.max(0,FLIM-fdt*(playing?.12:.6));PULSE=Math.max(0,PULSE-fdt*5);
  const t=POSE_OVERRIDE??(body.on?dropT:(ac&&playing?songTime()-offset:clock.getElapsedTime()));const beat=t/spb(); // dance freezes once the coffin falls
  stepKnock(fdt);
  crew.forEach(r=>{dance(r,beat,false);plant(r)});dance(lead,beat,true);plant(lead);
  const wob=(1-balance/100);
  if(!body.on){const c=ac?songTime()-catchT:9,dip=c<.6?Math.sin(c/.6*Math.PI)*.3:0;
    // the coffin rides the carriers' average shoulder bounce
    let sy=0;crew.forEach(r=>{r.bones.Spine2.getWorldPosition(_fv);sy+=_fv.y});sy/=crew.length;if(!coffin.userData.sy0)coffin.userData.sy0=sy;
    coffin.position.set(0,coffinBase+(sy-coffin.userData.sy0)-dip,COFFIN_Z);
    coffin.rotation.set(Math.sin(beat*Math.PI*.5)*wob*.08,0,Math.sin(beat*Math.PI)*(.02+wob*.14));
    coffin.updateMatrixWorld(true);
    // inner hand of each carrier grips the coffin's underside right next to him
    crew.forEach(r=>{if(body.on)return;const inner=r.side>0?'Left':'Right';const sx=r.root.position.x<0?-1:1;
      _c.set(sx*(HALF.x-.03),-.03,r.root.position.z-COFFIN_Z+.2);/* palm under the coffin's bottom edge, taking the weight */coffin.localToWorld(_c);const tgt=_c.clone();ik(r,inner,tgt)})}
  else stepBody(fdt);
  if(body.on)ALL().forEach(d=>facepalm(d,now));
  moveCam(fdt,beat);
  renderer.render(scene,cam);
  cx.clearRect(0,0,LW,LH);const lw=LW/4,sz=lw*.32;
  const show_=playing;bar.style.display=lbl.style.display=show_?'block':'none';lc.style.visibility=show_?'visible':'hidden';
  if(!show_||paused)document.getElementById('hint').style.opacity=0;
  if(show_&&!paused){const st=songTime();
    for(const n of notes){if(n.hit)continue;if(n.t-st<-win()){n.hit=true;n.miss=true;damage();show('MISS','#ff4040');if(!playing)break}else break}
    drawBar(st/spb(),now);
    // first-play hint: show what to press for the first few notes of a run
    {const hintEl=document.getElementById('hint'),nb=st/spb(),nx=notes.find(n=>!n.hit&&n.t>st-.1);
     const on=run.level===1&&hits<4&&nb<26&&nx&&(nx.t-st)<2.2;
     if(on){const ar='←↓↑→'[nx.l];hintEl.innerHTML=TOUCH?`Tap <b>${ar}</b> when the button reaches the gold handle`:`Press <b>${ar}</b> when the button reaches the gold handle`}
     hintEl.style.opacity=on?1:0}
    fillEl.style.width=balance+'%';fillEl.style.background=balance>60?'#d9a632':balance>30?'#e08a2e':'#b8322a';
    lbl.textContent=`COFFIN BALANCE · Level ${run.level} · x${mult()}`;
    if(playing&&st>songLen+.5){playing=false;try{master.disconnect()}catch{}nextLevel()}}
  document.getElementById('score').textContent=playing?score:'';
  document.getElementById('combo').textContent=playing&&combo>2?combo+' combo':'';
  judge.style.opacity=Math.max(0,1-(now-judgeT)/500);
}
title();
document.getElementById('pz').onclick=e=>{e.currentTarget.blur();paused?resumeGame():pauseGame()};
document.getElementById('snd').onclick=e=>{e.currentTarget.blur();ensureAudio();toggleMute()};applyVol();
