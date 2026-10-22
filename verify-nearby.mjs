import assert from 'node:assert/strict';
import * as T from 'three';
import {sourceFromGeometry,context,collides,generateNearby} from './dist/engine.js';
const s=sourceFromGeometry(new T.BoxGeometry(10,10,10),'Edited mass');
const mass=(id,x,locked=false)=>({id,sourceId:s.id,name:id,program:'office',position:[x,6,3],rotation:[0,37,0],scale:[1.4,1.2,.8],locked});
const base=[mass('a',0,true),mass('duplicate',2),mass('third',25)];
const snapshot=JSON.stringify(base),site={boundary:[[-100,-100],[100,-100],[100,100],[-100,100]],exclusions:[],setback:0,maxHeight:100};
const rules={allowOverlap:true,trimGround:true};
for(let seed=1;seed<=20;seed++){
 const r=generateNearby(base,[s],site,rules,seed,30);assert.ok(r.ok,r.reason);
 assert.equal(r.instances.length,3);assert.deepEqual(r.instances[0],base[0]);
 assert.deepEqual(r.instances.map(i=>i.id),base.map(i=>i.id));
 assert.ok(collides(context(r.instances[0],[s]),context(r.instances[1],[s])));
 for(let k=1;k<3;k++){const i=r.instances[k],b=base[k];assert.ok(Math.abs(i.position[0]-b.position[0])<=3.01);assert.ok(Math.abs(i.rotation[1]-b.rotation[1])<=6.01);assert.ok(Math.abs(i.scale[0]/i.scale[2]-b.scale[0]/b.scale[2])<1e-8);assert.ok(context(i,[s]).box.min.y>=-.001);}
 assert.deepEqual(generateNearby(base,[s],site,rules,seed,30),r);
}
assert.equal(JSON.stringify(base),snapshot);
assert.equal(generateNearby(base.map(i=>({...i,locked:true})),[s],site,rules,42).ok,false);
console.log('Nearby variations passed: edited scales and rotations, copies, locks, overlaps, bounded movement, deterministic seed, ground and source preservation.');
