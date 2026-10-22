import assert from 'node:assert/strict';
import {demoSources,makeInstances,generateOrganization,FAMILIES,designDistance,context} from './dist/engine.js';
const sources=demoSources(),base=makeInstances(sources);const site={width:100,depth:250,boundary:[[-50,-125],[50,-125],[50,125],[-50,125]],exclusions:[],setback:3,maxHeight:42};
base.forEach((i,k)=>{i.position=[(k%2?1:-1)*18,6,(k-4)*20];i.rotation=[0,17,0];i.scale=[.85,.9,.8];i.position[1]-=context(i,sources).box.min.y;});
const original=JSON.stringify(base),results=[];
for(const family of FAMILIES){const r=generateOrganization(base,sources,site,{allowOverlap:true,trimGround:true},42,family,65);assert.ok(r.ok,r.reason);assert.deepEqual(r.instances.map(i=>i.id),base.map(i=>i.id));assert.ok(designDistance(base,r.instances)>5);results.push(r.instances);console.log(family,designDistance(base,r.instances).toFixed(1));}
for(let i=0;i<results.length;i++)for(let j=i+1;j<results.length;j++)assert.ok(designDistance(results[i],results[j])>5,'Families are distinct');
base[0].locked=true;const r=generateOrganization(base,sources,site,{allowOverlap:true,trimGround:true},123,'Courtyard',65);assert.ok(r.ok);assert.deepEqual(r.instances[0],base[0]);base[0].locked=false;assert.equal(JSON.stringify(base),original);console.log('Organizations pass: all families distinct, source untouched, placed copies and locks preserved.');
