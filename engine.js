import * as T from 'three';
import {MeshBVH} from 'three-mesh-bvh';
import {clipAboveGround} from './ground-cut.js';

export const PROGRAMS = [
 {id:'wet',name:'Water research',short:'Wet lab',color:'#42a6a1',target:1800,privacy:'Restricted',daylight:'Controlled',floor:5},
 {id:'data',name:'Earth-data analysis',short:'Data lab',color:'#709bc6',target:2600,privacy:'Restricted',daylight:'Balanced',floor:4},
 {id:'office',name:'Future workplace',short:'Workplace',color:'#cfab77',target:3200,privacy:'Staff',daylight:'High',floor:4},
 {id:'ops',name:'Science operations',short:'Operations',color:'#a296c8',target:1000,privacy:'Restricted',daylight:'Controlled',floor:4},
 {id:'collab',name:'Collaboration & review',short:'Collaboration',color:'#cc8f7c',target:1200,privacy:'Staff',daylight:'High',floor:4},
 {id:'public',name:'Exhibition & commons',short:'Public / commons',color:'#8eae83',target:1200,privacy:'Public',daylight:'High',floor:4},
 {id:'service',name:'IT, storage & services',short:'Services',color:'#89989e',target:700,privacy:'Restricted',daylight:'Low',floor:4},
];
export const clone = o=>JSON.parse(JSON.stringify(o));
export const uid=()=>typeof crypto.randomUUID==='function'?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('');
const EPS=.025, DEG=Math.PI/180;
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
export function rng(seed){let a=Number(seed)>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export function matrix(i){return new T.Matrix4().compose(V(...i.position),new T.Quaternion().setFromEuler(new T.Euler(...i.rotation.map(v=>v*DEG),'YXZ')),V(...i.scale));}
function triangles(g,fn){const p=g.attributes.position,idx=g.index;for(let k=0;k<(idx?idx.count:p.count);k+=3){const a=V().fromBufferAttribute(p,idx?idx.getX(k):k),b=V().fromBufferAttribute(p,idx?idx.getX(k+1):k+1),c=V().fromBufferAttribute(p,idx?idx.getX(k+2):k+2);if(fn(a,b,c,k/3)===true)return true;}return false;}
const key=v=>`${Math.round(v.x*1e5)},${Math.round(v.y*1e5)},${Math.round(v.z*1e5)}`;
export function sourceFromGeometry(geometry,name,program='office',count=1){
 let g=new T.BufferGeometry().copy(geometry);g.deleteAttribute('uv');g.deleteAttribute('color');g.deleteAttribute('tangent');g.clearGroups();
 if(!g.attributes.position||g.attributes.position.count<3)throw Error('No mesh triangles found.');
 if((g.index?.count||g.attributes.position.count)/3>50000)throw Error('Please reduce each mass to fewer than 50,000 triangles before importing.');
 const edges=new Map();let volume=0,center=V(),degenerate=0,nonfinite=false;
 triangles(g,(a,b,c)=>{if(![...a.toArray(),...b.toArray(),...c.toArray()].every(Number.isFinite))nonfinite=true;const n=b.clone().sub(a).cross(c.clone().sub(a));if(n.lengthSq()<1e-12)degenerate++;const v=a.dot(b.clone().cross(c))/6;volume+=v;center.add(a.clone().add(b).add(c).multiplyScalar(v/4));for(const [u,vv]of [[a,b],[b,c],[c,a]]){const p=key(u),q=key(vv),k=p<q?p+'|'+q:q+'|'+p;edges.set(k,(edges.get(k)||0)+1);}});
 if(nonfinite)throw Error('This mesh contains invalid coordinates. Repair it in your modeling software.');
 const closed=[...edges.values()].every(v=>v===2)&&Math.abs(volume)>1e-6&&!degenerate;
 g.computeBoundingBox();const pivot=closed?center.divideScalar(volume):g.boundingBox.getCenter(V());g.translate(-pivot.x,-pivot.y,-pivot.z);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
 const s={id:uid(),name,program,count,geometry:g,closed,degenerate,pivotType:closed?'Volume centroid':'Bounding-box center',originalPivot:pivot.toArray(),pivot:[0,0,0],ports:[],selfIntersection:'Not certified'};
 s.bvh=new MeshBVH(g,{maxLeafTris:8,verbose:false});s.ports=defaultPorts(s);return s;
}
function portAtNormal(s,normal,label){let patches=[],area=0,centroid=V(),max=-Infinity;const n=V(...normal);
 triangles(s.geometry,(a,b,c)=>{const cross=b.clone().sub(a).cross(c.clone().sub(a)),ar=cross.length()/2;if(ar<1e-8||cross.clone().normalize().dot(n)<.999)return;const d=a.dot(n);if(d>max+.001){max=d;patches=[];area=0;centroid.set(0,0,0);}if(Math.abs(d-max)<.001){patches.push([a.toArray(),b.toArray(),c.toArray()]);centroid.add(a.clone().add(b).add(c).multiplyScalar(ar/3));area+=ar;}});
 const box=s.geometry.boundingBox,sz=box.getSize(V());
 if(area>1e-5){centroid.divideScalar(area);return{id:label,label,kind:'face',position:centroid.toArray(),normal,area,triangles:patches};}
 const p=box.getCenter(V());for(let j=0;j<3;j++)if(normal[j])p.setComponent(j,normal[j]>0?box.max.getComponent(j):box.min.getComponent(j));
 return{id:label,label,kind:'anchor',position:p.toArray(),normal,area:0,triangles:[]};
}
export function defaultPorts(s){const ports=[['East',[1,0,0]],['West',[-1,0,0]],['Top',[0,1,0]],['Base',[0,-1,0]],['South',[0,0,1]],['North',[0,0,-1]]].map(([l,n])=>portAtNormal(s,n,l));return ports;}
export function pickedPort(s,faceIndex,kind='face',hitPoint=null){
 let selected;triangles(s.geometry,(a,b,c,j)=>{if(j===faceIndex){selected=[a,b,c];return true;}});if(!selected)return null;
 const [a,b,c]=selected,normal=b.clone().sub(a).cross(c.clone().sub(a)).normalize();

 const d=normal.dot(a),patches=[];let area=0,center=V();triangles(s.geometry,(u,v,w)=>{const nn=v.clone().sub(u).cross(w.clone().sub(u)),ar=nn.length()/2;if(nn.normalize().dot(normal)>.999&&Math.abs(normal.dot(u)-d)<.001){patches.push([u.toArray(),v.toArray(),w.toArray()]);area+=ar;center.add(u.clone().add(v).add(w).multiplyScalar(ar/3));}});
 if(kind==='edge'){const edges=new Map(),key=v=>v.map(n=>Math.round(n*1e5)).join(',');for(const tri of patches)for(let k=0;k<3;k++){const u=tri[k],v=tri[(k+1)%3],id=[key(u),key(v)].sort().join('|');const old=edges.get(id);edges.set(id,{ends:[V(...u),V(...v)],count:(old?.count||0)+1});}const point=hitPoint||a;const candidates=[...edges.values()].filter(e=>e.count===1).sort((u,v)=>new T.Line3(...u.ends).closestPointToPoint(point,true,V()).distanceToSquared(point)-new T.Line3(...v.ends).closestPointToPoint(point,true,V()).distanceToSquared(point));if(!candidates.length)return null;const pair=candidates[0].ends;return{id:uid(),label:'Picked edge',kind:'edge',position:pair[0].clone().add(pair[1]).multiplyScalar(.5).toArray(),normal:normal.toArray(),endpoints:pair.map(v=>v.toArray()),area:0};}
 return{id:uid(),label:'Picked face',kind:'face',position:center.divideScalar(area||1).toArray(),normal:normal.toArray(),area,triangles:patches};
}
export function demoSources(){
 const l=new T.Shape();l.moveTo(-16,-14);l.lineTo(16,-14);l.lineTo(16,-2);l.lineTo(-2,-2);l.lineTo(-2,14);l.lineTo(-16,14);l.closePath();const lg=new T.ExtrudeGeometry(l,{depth:8,bevelEnabled:false});lg.rotateX(-Math.PI/2);
 return[
 sourceFromGeometry(new T.BoxGeometry(28,10,26),'Water research bar','wet',1),
 sourceFromGeometry(new T.BoxGeometry(26,12,34),'Data analysis wing','data',2),
 sourceFromGeometry(new T.BoxGeometry(24,12,38),'Adaptable workplace','office',2),
 sourceFromGeometry(new T.CylinderGeometry(13,13,12,40),'Operations rotunda','ops',1),
 sourceFromGeometry(lg,'Collaboration courtyard','collab',1),
 sourceFromGeometry(new T.BoxGeometry(28,8,24),'Public research forum','public',1),
 sourceFromGeometry(new T.BoxGeometry(16,8,20),'IT & support','service',1),
 ];
}
export function serializeSource(s){const j=new T.BufferGeometry().copy(s.geometry).toJSON();return{id:s.id,name:s.name,program:s.program,count:s.count,pivot:s.pivot,originalPivot:s.originalPivot,pivotType:s.pivotType,closed:s.closed,degenerate:s.degenerate,selfIntersection:s.selfIntersection,ports:s.ports,geometry:j};}
export function restoreSource(s){const g=new T.BufferGeometryLoader().parse(s.geometry);g.computeBoundingBox();g.computeBoundingSphere();return{...s,geometry:g,bvh:new MeshBVH(g,{verbose:false})};}
const cutCache = new WeakMap();
export function instanceSource(i,sources){
 const base=sources.find(s=>s.id===i.sourceId);if(!base)throw Error('Missing source geometry');
 if(!i.groundCut)return base;
 let derived=cutCache.get(i.groundCut);
 if(!derived){const geometry=new T.BufferGeometryLoader().parse(i.groundCut.geometry);geometry.computeBoundingBox();geometry.computeBoundingSphere();derived={...base,geometry,bvh:new MeshBVH(geometry,{verbose:false}),closed:i.groundCut.closed,ports:i.groundCut.ports,pivot:i.groundCut.pivot||base.pivot,pivotType:'Original pivot · ground cut'};cutCache.set(i.groundCut,derived);}
 return derived;
}
export function context(i,sources){const s=instanceSource(i,sources),m=matrix(i),box=new T.Box3(),p=s.geometry.attributes.position;for(let j=0;j<p.count;j++)box.expandByPoint(V().fromBufferAttribute(p,j).applyMatrix4(m));return{i,s,m,inv:m.clone().invert(),box};}
export function trimInstancesAtGround(instances,sources){
 const kept=[],trimmed=[],removed=[],uncapped=[];
 for(const original of instances){const i=clone(original),s=instanceSource(i,sources),result=clipAboveGround(s.geometry,matrix(i));
  if(result.status==='removed'){removed.push(i.name);continue;}
  if(result.status==='trimmed'){const derived={...s,geometry:result.geometry};derived.ports=defaultPorts(derived);i.groundCut={geometry:result.geometry.toJSON(),closed:s.closed&&result.capped,ports:derived.ports,pivot:clone(s.pivot),plane:0};trimmed.push(i.name);if(!result.capped)uncapped.push(i.name);}
  kept.push(i);
 }
 return{instances:kept,trimmed,removed,uncapped};
}

export function worldPort(c,p){return{...p,position:V(...p.position).applyMatrix4(c.m),normal:V(...p.normal).applyNormalMatrix(new T.Matrix3().getNormalMatrix(c.m)).normalize()};}
export function pointInside(point,c,tolerance=EPS){const q=point.clone().applyMatrix4(c.inv),near=c.s.bvh.closestPointToPoint(q,{},0,tolerance/Math.max(...c.i.scale));if(near&&near.distance<=tolerance/Math.max(...c.i.scale))return false;const ray=new T.Ray(q,V(.893,.321,.317).normalize());const hits=c.s.bvh.raycast(ray,T.DoubleSide).filter(h=>h.distance>1e-6).sort((a,b)=>a.distance-b.distance);let n=0,last=-1;for(const h of hits)if(h.distance-last>1e-5){n++;last=h.distance;}return n%2===1;}
export function collides(a,b,tol=EPS){
 const overlap=a.box.clone().intersect(b.box);if(overlap.isEmpty())return false;const size=overlap.getSize(V());if(Math.min(size.x,size.y,size.z)<tol)return false;
 const m=a.inv.clone().multiply(b.m),planeA=new T.Plane(),planeB=new T.Plane();
 const crosses=a.s.bvh.bvhcast(b.s.bvh,m,{intersectsTriangles:(ta,tb)=>{
  if(!ta.intersectsTriangle(tb))return false;ta.getPlane(planeA);tb.getPlane(planeB);
  const da=[planeB.distanceToPoint(ta.a),planeB.distanceToPoint(ta.b),planeB.distanceToPoint(ta.c)],db=[planeA.distanceToPoint(tb.a),planeA.distanceToPoint(tb.b),planeA.distanceToPoint(tb.c)];
  return Math.min(...da)<-tol&&Math.max(...da)>tol&&Math.min(...db)<-tol&&Math.max(...db)>tol;
 }});if(crosses)return true;
 if(!a.s.closed||!b.s.closed)return false;
 // A strict interior sample catches containment; surface contact is excluded.
 for(const [one,two]of [[a,b],[b,a]]){
  if(pointInside(V().applyMatrix4(one.m),one)&&pointInside(V().applyMatrix4(one.m),two))return true;
  const p=one.s.geometry.attributes.position,step=Math.max(1,Math.floor(p.count/30));for(let k=0;k<p.count;k+=step)if(pointInside(V().fromBufferAttribute(p,k).applyMatrix4(one.m),two))return true;
  let tested=0,inside=false;triangles(one.s.geometry,(u,v,w)=>{if(tested++>18)return true;const center=u.clone().add(v).add(w).multiplyScalar(1/3).applyMatrix4(one.m),normal=v.clone().sub(u).cross(w.clone().sub(u)).normalize().transformDirection(one.m);for(const sign of [-1,1]){const q=center.clone().addScaledVector(normal,sign*tol*2.5);if(pointInside(q,one)&&pointInside(q,two)){inside=true;return true;}}});if(inside)return true;
 }
 return false;
}
export function inPolygon(x,z,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(((a[1]>z)!==(b[1]>z))&&(x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0]))inside=!inside;}return inside;}
export function polygonArea(p){return Math.abs(p.reduce((sum,a,i)=>{const b=p[(i+1)%p.length];return sum+a[0]*b[1]-b[0]*a[1];},0))/2;}
function distanceEdge(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);}
export function withinSite(c,site){const p=c.s.geometry.attributes.position;for(let i=0;i<p.count;i++){const v=V().fromBufferAttribute(p,i).applyMatrix4(c.m);if(!inPolygon(v.x,v.z,site.boundary)&&!site.boundary.some((a,j)=>distanceEdge(v.x,v.z,a,site.boundary[(j+1)%site.boundary.length])<EPS))return false;if(site.setback>0&&site.boundary.some((a,j)=>distanceEdge(v.x,v.z,a,site.boundary[(j+1)%site.boundary.length])<site.setback-EPS))return false;for(const zone of site.exclusions||[])if(inPolygon(v.x,v.z,zone))return false;}return true;}
function cross2(a,b,c){return(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);}
export function hull(points){const p=[...new Map(points.map(a=>[a.join(','),a])).values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);if(p.length<3)return p;const lower=[],upper=[];for(const v of p){while(lower.length>=2&&cross2(lower.at(-2),lower.at(-1),v)<=0)lower.pop();lower.push(v);}for(const v of p.slice().reverse()){while(upper.length>=2&&cross2(upper.at(-2),upper.at(-1),v)<=0)upper.pop();upper.push(v);}return lower.slice(0,-1).concat(upper.slice(0,-1));}
function clipConvex(subject,clip){let out=subject;const signed=clip.reduce((s,a,i)=>{const b=clip[(i+1)%clip.length];return s+a[0]*b[1]-b[0]*a[1];},0);if(signed<0)clip=clip.slice().reverse();for(let j=0;j<clip.length;j++){const input=out;out=[];if(!input.length)break;const a=clip[j],b=clip[(j+1)%clip.length];let s=input.at(-1);for(const e of input){const de=cross2(a,b,e),ds=cross2(a,b,s);if(de>=-1e-8){if(ds<0){const t=ds/(ds-de);out.push([s[0]+t*(e[0]-s[0]),s[1]+t*(e[1]-s[1])]);}out.push(e);}else if(ds>=0){const t=ds/(ds-de);out.push([s[0]+t*(e[0]-s[0]),s[1]+t*(e[1]-s[1])]);}s=e;}}return out;}
export function contactArea(a,pa,b,pb){const aa=worldPort(a,pa),bb=worldPort(b,pb);if(aa.normal.dot(bb.normal)>-.995||Math.abs(bb.position.clone().sub(aa.position).dot(aa.normal))>.06)return 0;const u=Math.abs(aa.normal.y)>.9?V(1,0,0):V(0,1,0).cross(aa.normal).normalize(),v=aa.normal.clone().cross(u);const project=(q,c)=>{const p=V(...q).applyMatrix4(c.m);return[p.dot(u),p.dot(v)];};let area=0;for(const ta of pa.triangles||[])for(const tb of pb.triangles||[])area+=polygonArea(clipConvex(ta.map(p=>project(p,a)),tb.map(p=>project(p,b))));return area;}
export function edgeContact(a,pa,b,pb){if(pa.kind!=='edge'||pb.kind!=='edge')return 0;const [a1,a2]=pa.endpoints.map(v=>V(...v).applyMatrix4(a.m)),[b1,b2]=pb.endpoints.map(v=>V(...v).applyMatrix4(b.m));const u=a2.clone().sub(a1).normalize(),v=b2.clone().sub(b1).normalize();if(Math.abs(u.dot(v))<.999)return 0;if(b1.clone().sub(a1).cross(u).length()>.06)return 0;const lo=Math.min(b1.clone().sub(a1).dot(u),b2.clone().sub(a1).dot(u)),hi=Math.max(b1.clone().sub(a1).dot(u),b2.clone().sub(a1).dot(u));return Math.max(0,Math.min(a1.distanceTo(a2),hi)-Math.max(0,lo));}
export function snapTo(sourceInst,sourcePort,targetInst,targetPort,sources,gap=0,hinge=0){
 const i=clone(sourceInst),a=context(i,sources),b=context(targetInst,sources),pa=a.s.ports.find(p=>p.id===sourcePort),pb=b.s.ports.find(p=>p.id===targetPort);if(!pa||!pb)throw Error('Choose two valid connection anchors.');
 const wa=worldPort(a,pa),wb=worldPort(b,pb),q=new T.Quaternion().setFromUnitVectors(wa.normal,wb.normal.clone().negate()),rotation=new T.Quaternion().setFromEuler(new T.Euler(...i.rotation.map(x=>x*DEG),'YXZ'));rotation.premultiply(q);
 if(pa.kind==='edge'&&pb.kind==='edge'){const ae=pa.endpoints.map(v=>V(...v).applyMatrix4(a.m)),be=pb.endpoints.map(v=>V(...v).applyMatrix4(b.m)),u=ae[1].sub(ae[0]).normalize().applyQuaternion(q),v=be[1].sub(be[0]).normalize(),axis=wb.normal.clone().negate();if(u.dot(v)<0)v.negate();const angle=Math.atan2(axis.dot(u.clone().cross(v)),u.dot(v));rotation.premultiply(new T.Quaternion().setFromAxisAngle(axis,angle));}
 if(hinge&&pa.kind==='edge'){const ep=pa.endpoints.map(v=>V(...v)),axis=ep[1].sub(ep[0]).normalize().applyQuaternion(rotation);rotation.premultiply(new T.Quaternion().setFromAxisAngle(axis,hinge*DEG));}
 const e=new T.Euler().setFromQuaternion(rotation,'YXZ');i.rotation=[e.x/DEG,e.y/DEG,e.z/DEG];i.position=[0,0,0];const offset=V(...pa.position).applyMatrix4(matrix(i));i.position=wb.position.clone().addScaledVector(wb.normal,gap).sub(offset).toArray();return i;
}
export function sectionLoops(c,height){const links=new Map(),coords=new Map();const pointkey=p=>`${Math.round(p[0]*1e4)},${Math.round(p[1]*1e4)}`;
 triangles(c.s.geometry,(aa,bb,cc)=>{const pts=[aa,bb,cc].map(v=>v.applyMatrix4(c.m)),hits=[];for(let j=0;j<3;j++){const a=pts[j],b=pts[(j+1)%3],da=a.y-height,db=b.y-height;if((da>=0&&db<0)||(db>=0&&da<0)){const t=da/(da-db);hits.push([a.x+t*(b.x-a.x),a.z+t*(b.z-a.z)]);}}if(hits.length===2){const [a,b]=hits.map(pointkey);if(a===b)return;coords.set(a,hits[0]);coords.set(b,hits[1]);if(!links.has(a))links.set(a,[]);if(!links.has(b))links.set(b,[]);links.get(a).push(b);links.get(b).push(a);}});
 const seen=new Set(),loops=[];for(const start of links.keys()){if(seen.has(start))continue;let curr=start,prev=null,loop=[];for(let k=0;k<links.size+1;k++){loop.push(coords.get(curr));seen.add(curr);const next=(links.get(curr)||[]).find(n=>n!==prev);if(!next)break;if(next===start){if(loop.length>2)loops.push(loop);break;}prev=curr;curr=next;if(seen.has(curr))break;}}
 return loops;
}
export function sectionArea(c,height){const loops=sectionLoops(c,height);let area=0;for(const p of loops){const point=p[0],depth=loops.filter(q=>q!==p&&inPolygon(point[0],point[1],q)).length;area+=polygonArea(p)*(depth%2?-1:1);}return Math.max(0,area);}
function bridgeBetween(a,b,rules,all,sources){
 const best=[];for(const pa of a.s.ports.filter(p=>Math.abs(p.normal[1])<.1&&p.kind!=='edge'))for(const pb of b.s.ports.filter(p=>Math.abs(p.normal[1])<.1&&p.kind!=='edge')){const wa=worldPort(a,pa),wb=worldPort(b,pb),delta=wb.position.clone().sub(wa.position),horizontal=delta.clone().setY(0),len=horizontal.length();if(len<.2||len>rules.bridgeReach||wa.normal.dot(wb.normal)>-.9||horizontal.clone().normalize().dot(wa.normal)<.94)continue;const baseA=a.box.min.y,baseB=b.box.min.y;if(Math.abs(baseA-baseB)>.15)continue;const mid=wa.position.clone().add(wb.position).multiplyScalar(.5);mid.y=baseA+rules.corridorHeight/2;const bridge={a:a.i.id,b:b.i.id,position:mid.toArray(),length:len,width:rules.corridorWidth,height:rules.corridorHeight,angle:Math.atan2(horizontal.x,horizontal.z)/DEG,type:'bridge',from:[wa.position.x,baseA+.1,wa.position.z],to:[wb.position.x,baseB+.1,wb.position.z]};best.push(bridge);}
 best.sort((a,b)=>a.length-b.length);for(const bridge of best){const g=new T.BoxGeometry(bridge.width,bridge.height,Math.max(.01,bridge.length-.1)),s=sourceFromGeometry(g,'Connector','service'),i={id:'bridge',sourceId:s.id,position:bridge.position,rotation:[0,bridge.angle,0],scale:[1,1,1]},c=context(i,[s]);if(!all.some(o=>o!==a&&o!==b&&collides(c,o))){return bridge;}}
 return null;
}
export function analyze(instances,sources,site,rules,programs,deep=true){
 const cs=instances.map(i=>context(i,sources)),warnings=[],contacts=[],bridges=[],adj=Object.fromEntries(instances.map(i=>[i.id,new Set()]));let collisions=0;
 for(const c of cs){if(!withinSite(c,site))warnings.push({type:'error',code:'boundary',ids:[c.i.id],text:`${c.s.name} crosses the buildable boundary or an exclusion.`});if(site.maxHeight&&c.box.max.y>site.maxHeight+.01)warnings.push({type:'error',code:'height',ids:[c.i.id],text:`${c.s.name} exceeds the ${site.maxHeight} m height limit.`});if(c.box.min.y<-.05)warnings.push({type:'error',code:'ground',ids:[c.i.id],text:`${c.s.name} extends below ground. Generate alternatives to cut it at ground level.`});if(!c.s.closed)warnings.push({type:'warning',code:'mesh',ids:[c.i.id],text:`${c.s.name} is not a closed solid; collision and area checks are uncertain.`});}
 for(let j=0;j<cs.length;j++)for(let k=j+1;k<cs.length;k++){
  const a=cs[j],b=cs[k];if(collides(a,b)){collisions++;warnings.push({type:rules.allowOverlap?'warning':'error',code:'collision',ids:[a.i.id,b.i.id],text:rules.allowOverlap?`${a.i.name||a.s.name} overlaps ${b.i.name||b.s.name} as allowed. Shared floor area is counted in both masses.`:`${a.s.name} intersects ${b.s.name}. Enable mass overlaps to keep this intersection.`});}
  let connected=false;for(const pa of a.s.ports)for(const pb of b.s.ports){
   if(pa.kind==='face'&&pb.kind==='face'){const area=contactArea(a,pa,b,pb);if(area>=rules.minContact){const normal=worldPort(a,pa).normal;const vertical=Math.abs(normal.y)>.8;contacts.push({a:a.i.id,b:b.i.id,type:vertical?'stack':'face',area,position:worldPort(a,pa).position.toArray()});if(!vertical&&Math.abs(a.box.min.y-b.box.min.y)<.15){adj[a.i.id].add(b.i.id);adj[b.i.id].add(a.i.id);connected=true;}}}
   if(pa.kind==='edge'&&pb.kind==='edge'){const length=edgeContact(a,pa,b,pb);if(length>=rules.minEdge){contacts.push({a:a.i.id,b:b.i.id,type:'edge',length,position:worldPort(a,pa).position.toArray()});warnings.push({type:'warning',code:'edge',ids:[a.i.id,b.i.id],text:'Edge contact needs a separate circulation and support solution.'});}}
  }
  if(!connected&&rules.autoBridges){const bridge=bridgeBetween(a,b,rules,cs,sources);if(bridge){const coords=[bridge.from,bridge.to];if(coords.every(p=>inPolygon(p[0],p[2],site.boundary))){bridges.push(bridge);adj[a.i.id].add(b.i.id);adj[b.i.id].add(a.i.id);}}}
 }
 // Stack relationships are geometric support only. Cores need an explicit reservation.
 for(const c of cs)if(c.box.min.y>.15){const supporting=contacts.filter(p=>p.type==='stack'&&(p.a===c.i.id||p.b===c.i.id)).some(p=>{const other=cs.find(o=>o.i.id===(p.a===c.i.id?p.b:p.a));return other.box.max.y<=c.box.min.y+.1;});if(!supporting)warnings.push({type:'warning',code:'support',ids:[c.i.id],text:`${c.s.name} is elevated without a detected bearing face.`});else warnings.push({type:'warning',code:'vertical',ids:[c.i.id],text:`${c.s.name} needs a reserved stair/elevator connection.`});}
 const entrance=site.entrance||[-site.width/2,0],ground=cs.filter(c=>c.box.min.y<.15);let root=ground.filter(c=>c.i.program==='public')[0]||ground.sort((a,b)=>Math.hypot(a.i.position[0]-entrance[0],a.i.position[2]-entrance[1])-Math.hypot(b.i.position[0]-entrance[0],b.i.position[2]-entrance[1]))[0];
 const visited=new Set(root?[root.i.id]:[]),queue=root?[root.i.id]:[];while(queue.length){const id=queue.shift();for(const other of adj[id])if(!visited.has(other)){visited.add(other);queue.push(other);}}
 for(const c of cs)if(!visited.has(c.i.id))warnings.push({type:rules.requireConnected?'error':'warning',code:'circulation',ids:[c.i.id],text:`${c.s.name} has no conceptual route to the entrance mass.`});
 let gfa=0,levels=0;const areas=Object.fromEntries(programs.map(p=>[p.id,0]));if(deep)for(const c of cs){if(!c.s.closed)continue;const fh=programs.find(p=>p.id===c.i.program)?.floor||4;let n=0;for(let y=c.box.min.y+.025;y<c.box.max.y-.05;y+=fh){const a=sectionArea(c,y);gfa+=a;areas[c.i.program]=(areas[c.i.program]||0)+a;n++;}levels=Math.max(levels,n);}
 const bridgeArea=bridges.reduce((s,b)=>s+b.width*b.length,0);gfa+=bridgeArea;
 let footprint=0;if(deep&&cs.length){const box=new T.Box3();cs.forEach(c=>box.union(c.box));const step=Math.max(2,Math.sqrt((box.max.x-box.min.x)*(box.max.z-box.min.z)/18000));for(let x=box.min.x+step/2;x<box.max.x;x+=step)for(let z=box.min.z+step/2;z<box.max.z;z+=step){if(cs.some(c=>{if(x<c.box.min.x||x>c.box.max.x||z<c.box.min.z||z>c.box.max.z)return false;const ray=new T.Ray(V(x,c.box.max.y+1,z),V(0,-1,0)).applyMatrix4(c.inv);return!!c.s.bvh.raycastFirst(ray,T.DoubleSide);})){footprint+=step*step;}}}
 const siteArea=polygonArea(site.boundary),open=Math.max(0,1-footprint/siteArea),connectivity=instances.length?visited.size/instances.length:0;
 const target=programs.reduce((s,p)=>s+p.target,0),programFit=target?Math.max(0,1-programs.reduce((s,p)=>s+Math.abs((areas[p.id]||0)-p.target),0)/target):0;
 // Views: sample a ray toward the east-facing bay from each module's east surface.
 let viewCount=0;for(const c of cs){const start=V(c.box.max.x+.05,c.box.getCenter(V()).y,c.box.getCenter(V()).z);if(!cs.some(o=>o!==c&&!!o.s.bvh.raycastFirst(new T.Ray(start,V(1,0,0)).applyMatrix4(o.inv),T.DoubleSide)))viewCount++;}
 const views=cs.length?viewCount/cs.length:0,w=rules.weights||{program:35,circulation:30,open:15,views:20},total=Object.values(w).reduce((s,n)=>s+n,0)||1;
 const score=100*(programFit*w.program+connectivity*w.circulation+open*w.open+views*w.views)/total;
 return{warnings,contacts,bridges,root:root?.i.id,metrics:{gfa,footprint,siteArea,height:Math.max(0,...cs.map(c=>c.box.max.y)),levels,open,connectivity,programFit,views,bridgeArea,areas,score,collisions,hardPass:!warnings.some(w=>w.type==='error'),areaReliable:cs.every(c=>c.s.closed)&&collisions===0}};
}
export function makeInstances(sources){let n=0;return sources.flatMap(s=>Array.from({length:Math.min(12,s.count)},(_,k)=>({id:`m${n++}`,sourceId:s.id,program:s.program,name:`${s.name} ${k+1}`,position:[0,0,0],rotation:[0,0,0],scale:[1,1,1],locked:false}))).slice(0,36);}
export const FAMILIES=['Research spine','Courtyard','Connected pavilions','Terraced cluster','Compact stack'];
function targetFor(index,n,family,site){const w=site.width,d=site.depth,rows=Math.ceil(n/2);switch(family){case'Courtyard':{const angle=index/n*Math.PI*2;return[Math.cos(angle)*w*.27,Math.sin(angle)*d*.32];}case'Connected pavilions':return[(index%2?1:-1)*w*.22,(Math.floor(index/2)-(rows-1)/2)*d/(rows+1)];case'Compact stack':return[(index%2?1:-1)*w*.17,(Math.floor(index/2)%3-1)*d*.19];case'Terraced cluster':return[(index%2?1:-1)*w*.2,(Math.floor(index/2)-(rows-1)/2)*d/(rows+1)];default:return[(index%2?1:-1)*w*.2,(Math.floor(index/2)-(rows-1)/2)*d/(rows+1)];}}
function grounded(i,sources){const c=context(i,sources);i.position[1]-=c.box.min.y;return i;}
function hardPlacement(i,placed,sources,site,rules){const c=context(i,sources);return withinSite(c,site)&&(!site.maxHeight||c.box.max.y<=site.maxHeight+.01)&&c.box.min.y>=-.05&&(rules.allowOverlap||!placed.some(p=>collides(c,context(p,sources))));}
export function generateCandidate(sources,site,rules,seed,family,locks=[],templates=[]){
 const random=rng(seed),pool=makeInstances(sources).map(i=>{const template=templates.find(t=>t.id===i.id&&t.sourceId===i.sourceId);return template?.groundCut?{...i,groundCut:clone(template.groundCut)}:i;}),placed=rules.trimGround?trimInstancesAtGround(locks,sources).instances:clone(locks),lockIds=new Set(locks.map(i=>i.id));let failure='';
 for(let index=0;index<pool.length;index++){
  if(lockIds.has(pool[index].id))continue;const base=pool[index],s=instanceSource(base,sources),target=targetFor(index,pool.length,family,site),options=[];
  const count=placed.length?40:15;
  for(let trial=0;trial<count;trial++){
   let i=clone(base);const step=Math.max(1,rules.angleStep),angles=Math.floor((rules.maxAngle-rules.minAngle)/step)+1;i.rotation[1]=rules.minAngle+Math.floor(random()*angles)*step;const scale=rules.minScale+random()*(rules.maxScale-rules.minScale);i.scale=[scale,scale,scale];
   const slide=(random()-.5)*rules.slide;i.position=[target[0]+slide,0,target[1]+(random()-.5)*rules.slide];grounded(i,sources);
   if(placed.length&&trial<30){const neighbor=placed[Math.floor(random()*placed.length)],other=instanceSource(neighbor,sources);const stack=(family==='Compact stack'||family==='Terraced cluster')&&index>3&&trial%4===0;const availableA=s.ports.filter(p=>stack?p.normal[1]<-.9:Math.abs(p.normal[1])<.1),availableB=other.ports.filter(p=>stack?p.normal[1]>.9:Math.abs(p.normal[1])<.1);if(availableA.length&&availableB.length){const pa=availableA[Math.floor(random()*availableA.length)],pb=availableB[Math.floor(random()*availableB.length)];i=snapTo(i,pa.id,neighbor,pb.id,sources,stack?0:rules.gap);const yaw=((i.rotation[1]%360)+360)%360;let permitted=false;for(let angle=rules.minAngle;angle<=rules.maxAngle+.01;angle+=step){const delta=((yaw-angle+540)%360)-180;if(Math.abs(delta)<.1){permitted=true;break;}}if(!permitted)continue;if(!rules.allowTilt&&(Math.abs(i.rotation[0])>.01||Math.abs(i.rotation[2])>.01))continue;if(!stack)grounded(i,sources);}}
   if(!hardPlacement(i,placed,sources,site,rules))continue;
   const distance=Math.hypot(i.position[0]-target[0],i.position[2]-target[1]);options.push({i,value:distance+(family==='Compact stack'?-i.position[1]*.5:0)});
  }
  if(!options.length){failure=`No feasible placement for ${s.name}. Try fewer copies, smaller scale, or wider angle limits.`;return{ok:false,reason:failure};}
  options.sort((a,b)=>a.value-b.value);placed.push(options[Math.min(options.length-1,Math.floor(random()*Math.min(3,options.length)))].i);
 }
 return{ok:true,instances:rules.trimGround?trimInstancesAtGround(placed,sources).instances:placed};
}
export function arrangementHash(instances){return instances.map(i=>[i.sourceId,...i.position.map(n=>Math.round(n/2)),...i.rotation.map(n=>Math.round(n/5)),...i.scale.map(n=>Math.round(n*20))].join(':')).join('|');}

// Nearby design exploration starts from every placed instance, including copies,
// edited scales, arbitrary rotations, program assignments and baked ground cuts.
export function generateNearby(baseline,sources,site,rules,seed,strength=30){
 const random=rng(seed),amount=Math.max(1,Math.min(100,strength))/100;
 if(!baseline.length)return{ok:false,reason:'Place masses before generating variations.'};
 if(baseline.every(i=>i.locked))return{ok:false,reason:'All masses are locked. Unlock a mass to create variations.'};
 const baseContexts=baseline.map(i=>context(i,sources)),overlaps=[];
 if(rules.allowOverlap)for(let a=0;a<baseline.length;a++)for(let b=a+1;b<baseline.length;b++)if(collides(baseContexts[a],baseContexts[b]))overlaps.push([a,b]);
 for(let attempt=0;attempt<24;attempt++){
  const trial=baseline.map((base,index)=>{
   const i=clone(base);if(i.locked)return i;
   const jitter=range=>(random()*2-1)*range;
   i.position[0]+=jitter(10*amount);i.position[2]+=jitter(10*amount);
   i.rotation[1]+=jitter(20*amount);
   const scale=1+jitter(.2*amount);i.scale=i.scale.map(v=>v*scale);
   // Keep masses already on the ground seated there; preserve edited elevations.
   const before=baseContexts[index];
   if(Math.abs(before.box.min.y)<.05)i.position[1]-=context(i,sources).box.min.y;
   else i.position[1]+=jitter(2*amount);
   return i;
  });
  const final=rules.trimGround?trimInstancesAtGround(trial,sources).instances:trial;
  if(final.length!==baseline.length)continue;
  const cs=final.map(i=>context(i,sources));
  if(cs.some(c=>!withinSite(c,site)||(site.maxHeight&&c.box.max.y>site.maxHeight+.01)||c.box.min.y<-.05))continue;
  if(overlaps.some(([a,b])=>!collides(cs[a],cs[b])))continue;
  if(!rules.allowOverlap&&cs.some((a,j)=>cs.some((b,k)=>k>j&&collides(a,b))))continue;
  return{ok:true,instances:final};
 }
 return{ok:false,reason:'The current arrangement is too constrained at this variation amount. Try a smaller variation or adjust boundary conflicts.'};
}

// Reorganize the user's placed geometry, never rebuild it from source copy counts.
export function generateOrganization(baseline,sources,site,rules,seed,family,strength=65){
 if(!baseline.length||baseline.every(i=>i.locked))return{ok:false,reason:'Place an unlocked mass to explore organizations.'};
 const random=rng(seed),amount=Math.max(.05,Math.min(1,strength/100));
 const contexts=baseline.map(i=>context(i,sources));
 const bounds=new T.Box3();contexts.forEach(c=>bounds.union(c.box));
 const center=bounds.getCenter(new T.Vector3());
 // Order by current location so neighboring masses tend to remain neighbors.
 const order=baseline.map((_,i)=>i).sort((a,b)=>family==='Courtyard'?Math.atan2(baseline[a].position[2]-center.z,baseline[a].position[0]-center.x)-Math.atan2(baseline[b].position[2]-center.z,baseline[b].position[0]-center.x):baseline[a].position[2]-baseline[b].position[2]);
 const n=baseline.length,w=site.width,d=site.depth;
 for(let attempt=0;attempt<40;attempt++){
  const spread=.85+random()*.25,phase=(random()-.5)*.45,blend=.45+amount*.5;
  const trial=baseline.map((base,index)=>{
   const i=clone(base);if(i.locked)return i;
   const rank=order.indexOf(index),t=n===1?0:rank/(n-1)-.5;
   let x=0,z=0,yaw=0,lift=0;
   if(family==='Courtyard'){const a=rank/n*Math.PI*2+phase;x=Math.cos(a)*w*.29;z=Math.sin(a)*d*.30;yaw=-a/DEG+90;}
   else if(family==='Research spine'){x=(rank%2?1:-1)*w*.13;z=t*d*.72;yaw=rank%2?0:180;}
   else if(family==='Connected pavilions'){x=(rank%2?1:-1)*w*.27;z=t*d*.65;yaw=rank%2?25:-25;}
   else if(family==='Terraced cluster'){x=t*w*.5;z=t*d*.53;yaw=25;lift=Math.floor(rank/3)*Math.min(5,site.maxHeight/5||5)*amount;}
   else {x=(rank%3-1)*w*.18;z=(Math.floor(rank/3)-(Math.ceil(n/3)-1)/2)*Math.min(23,d*.12);yaw=rank%2?90:0;lift=Math.floor(rank/3)*3*amount;}
   const jitter=range=>(random()*2-1)*range;
   i.position[0]=base.position[0]*(1-blend)+(x*spread+jitter(4*amount))*blend;
   i.position[2]=base.position[2]*(1-blend)+(z*spread+jitter(7*amount))*blend;
   const turn=((yaw-base.rotation[1]+540)%360)-180;
   i.rotation[1]+=turn*(.35+amount*.4)+jitter(18*amount);
   const scale=1+jitter(.22*amount);i.scale=i.scale.map(v=>v*scale);
   i.position[1]-=context(i,sources).box.min.y;
   i.position[1]+=Math.max(0,contexts[index].box.min.y)*(1-blend)+lift;
   // Keep whole transformed bounds inside the rectangular site envelope first.
   const c=context(i,sources),margin=site.setback||0;
   i.position[0]+=Math.max(0,-w/2+margin-c.box.min.x)-Math.max(0,c.box.max.x-(w/2-margin));
   i.position[2]+=Math.max(0,-d/2+margin-c.box.min.z)-Math.max(0,c.box.max.z-(d/2-margin));
   return i;
  });
  const final=rules.trimGround?trimInstancesAtGround(trial,sources).instances:trial;
  if(final.length!==baseline.length)continue;
  const cs=final.map(i=>context(i,sources));
  if(cs.some(c=>!withinSite(c,site)||(site.maxHeight&&c.box.max.y>site.maxHeight+.01)||c.box.min.y<-.05))continue;
  if(!rules.allowOverlap&&cs.some((a,j)=>cs.some((b,k)=>k>j&&collides(a,b))))continue;
  return{ok:true,instances:final};
 }
 return{ok:false,reason:family+' could not fit your current masses within the active constraints. Try a smaller variation, fewer locks, or allow overlaps.'};
}

export function designDistance(a,b){
 if(a.length!==b.length)return Infinity;
 const byId=new Map(b.map(i=>[i.id,i]));let total=0,count=0;
 for(const i of a){const j=byId.get(i.id);if(!j)return Infinity;if(i.locked)continue;
 total+=Math.hypot(i.position[0]-j.position[0],i.position[1]-j.position[1],i.position[2]-j.position[2])+Math.abs(((i.rotation[1]-j.rotation[1]+540)%360)-180)*.08+Math.abs(i.scale[0]/j.scale[0]-1)*10;count++;}
 return count?total/count:0;
}
