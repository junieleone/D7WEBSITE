import * as T from 'three';

// Bake a horizontal half-space cut into real triangles. Coordinates are world
// coordinates here; callers return the result to the instance's local frame.
const EPS = 1e-6;
const pointKey = p => `${Math.round(p.x / EPS)},${Math.round(p.z / EPS)}`;
export function clipAboveGround(geometry, transform) {
  const mesh = geometry.clone().applyMatrix4(transform);
  mesh.computeBoundingBox();
  if (mesh.boundingBox.min.y >= -EPS) return {status: 'unchanged'};
  if (mesh.boundingBox.max.y <= EPS) return {status: 'removed'};
  const positions = [], groundEdges = new Map(), p = mesh.attributes.position, index = mesh.index;
  const pushTriangle = (a, b, c) => {
    if (b.clone().sub(a).cross(c.clone().sub(a)).lengthSq() < 1e-16) return;
    positions.push(...a.toArray(), ...b.toArray(), ...c.toArray());
  };
  for (let k = 0; k < (index?.count || p.count); k += 3) {
    const triangle = [0, 1, 2].map(j => {
      const v = new T.Vector3().fromBufferAttribute(p, index ? index.getX(k + j) : k + j);
      if (Math.abs(v.y) < EPS) v.y = 0;
      return v;
    });
    const clipped = [];
    for (let j = 0; j < 3; j++) {
      const a = triangle[j], b = triangle[(j + 1) % 3];
      if (a.y >= 0) clipped.push(a);
      if ((a.y < 0 && b.y > 0) || (a.y > 0 && b.y < 0)) {
        const hit = a.clone().lerp(b, a.y / (a.y - b.y)); hit.y = 0; clipped.push(hit);
      }
    }
    if (clipped.length < 3) continue;
    for (let j = 1; j + 1 < clipped.length; j++) pushTriangle(clipped[0], clipped[j], clipped[j + 1]);
    for (let j = 0; j < clipped.length; j++) {
      const a = clipped[j], b = clipped[(j + 1) % clipped.length];
      if (a.y !== 0 || b.y !== 0 || a.distanceToSquared(b) < EPS * EPS) continue;
      const ka = pointKey(a), kb = pointKey(b), id = [ka, kb].sort().join('|');
      const edge = groundEdges.get(id);
      groundEdges.set(id, {a, b, ka, kb, count: (edge?.count || 0) + 1});
    }
  }
  // Boundary edges of retained faces form cut contours, including holes and
  // disconnected islands. Existing coplanar faces cancel their shared edges.
  const edges = [...groundEdges.values()].filter(e => e.count === 1);
  const neighbors = new Map(), coords = new Map();
  for (const e of edges) {
    coords.set(e.ka, e.a); coords.set(e.kb, e.b);
    for (const [a,b] of [[e.ka,e.kb],[e.kb,e.ka]]) {
      if (!neighbors.has(a)) neighbors.set(a, []);
      neighbors.get(a).push(b);
    }
  }
  const seen = new Set(), loops = [];
  let capped = [...neighbors.values()].every(n => n.length === 2);
  if (capped) for (const start of neighbors.keys()) {
    if (seen.has(start)) continue;
    let prev = null, current = start, loop = [];
    do {
      if (seen.has(current)) { capped = false; break; }
      seen.add(current); loop.push(coords.get(current));
      const next = neighbors.get(current).find(n => n !== prev);
      prev = current; current = next;
    } while (current !== start && current);
    if (current !== start || loop.length < 3) { capped = false; break; }
    loops.push(loop);
  }
  if (capped) {
    const inside = (p, loop) => {
      let result = false;
      for (let i = 0, j = loop.length - 1; i < loop.length; j = i++) {
        const a = loop[i], b = loop[j];
        if ((a.z > p.z) !== (b.z > p.z) && p.x < (b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x) result = !result;
      }
      return result;
    };
    const depth = loops.map(loop => loops.filter(other => other !== loop && inside(loop[0], other)).length);
    for (let n = 0; n < loops.length; n++) {
      if (depth[n] % 2) continue;
      const outer = loops[n], holes = loops.filter((loop,j) => depth[j] === depth[n]+1 && inside(loop[0],outer));
      const vertices = [outer, ...holes].flat();
      const faces = T.ShapeUtils.triangulateShape(outer.map(v => new T.Vector2(v.x,v.z)),holes.map(h => h.map(v => new T.Vector2(v.x,v.z))));
      for (const face of faces) {
        // Earcut may drop collinear contour vertices. Restore them on cap
        // edges so the cap shares the exact side-mesh edges (no T junctions).
        const tri = face.map(k => vertices[k]), ring = [];
        for (let j = 0; j < 3; j++) {
          const a = tri[j], b = tri[(j+1)%3], ab = b.clone().sub(a), length2 = ab.lengthSq();
          const mid = vertices.map(v => ({v,t:v.clone().sub(a).dot(ab)/length2})).filter(({v,t}) => t>EPS && t<1-EPS && v.distanceToSquared(a.clone().addScaledVector(ab,t))<EPS*EPS).sort((a,b)=>a.t-b.t);
          ring.push(a,...mid.map(x=>x.v));
        }
        const center = tri[0].clone().add(tri[1]).add(tri[2]).multiplyScalar(1/3);
        for (let j=0;j<ring.length;j++) {
          const a=ring[j], b=ring[(j+1)%ring.length];
          if(a.clone().sub(center).cross(b.clone().sub(center)).y > 0) pushTriangle(center,b,a);
          else pushTriangle(center,a,b);
        }
      }
    }
  }
  const result = new T.BufferGeometry();
  result.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  result.applyMatrix4(transform.clone().invert());
  result.computeVertexNormals(); result.computeBoundingBox(); result.computeBoundingSphere();
  return {status:'trimmed',geometry:result,capped};
}
