import { Box3, Mesh, Object3D, Raycaster, Vector3 } from 'three';
import type { ConstructionCadModel } from './types.ts';
export function auditConstructionCad(root: Object3D, data: ConstructionCadModel) {
  root.updateMatrixWorld(true);
  const meshes: Mesh[] = []; const walls: Mesh[] = []; const floor: Mesh[] = []; const ids = new Set<string>();
  const levels = new Set<string>(); let sourceObjects = 0; let invalidCoordinates = 0; let triangles = 0;
  root.traverse(o => {
    if (o.userData.sourceRefs?.length) sourceObjects++;
    if (o.name === 'level-ground' || o.name === 'level-upper') levels.add(o.userData.levelId);
    if (o.userData.elementId) ids.add(o.userData.elementId);
    if (o instanceof Mesh) { meshes.push(o); if (o.userData.kind === 'wall') walls.push(o); if (['floor-display', 'room'].includes(o.userData.kind)) floor.push(o); triangles += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3; }
    if ('geometry' in o) {
      const position = (o as Mesh).geometry.attributes.position;
      for (const value of position.array) if (!Number.isFinite(value)) invalidCoordinates++;
    }
  });
  const bounds = new Box3().setFromObject(root); const size = bounds.getSize(new Vector3());
  const issues: string[] = [];
  if (!levels.has('ground') || !levels.has('upper')) issues.push('missing floor groups');
  if (invalidCoordinates) issues.push('non-finite coordinates');
  if (!(size.x > 65 && size.x < 68 && size.z > 21 && size.z < 24 && Math.abs(bounds.max.y - 6.61) < 1e-4)) issues.push('incorrect building scale/bounds');
  const missing = data.elements.filter(e => !ids.has(e.id)); if (missing.length) issues.push(`missing ${missing.length} source elements`);
  const blockedOpenings: string[] = []; const ray = new Raycaster();
  // A pair of opposite entry/exit surfaces and positive signed mesh volume exclude a
  // ray-hittable plane substituted for the omitted source-supported 0.30 m body.
  const signedVolume = (mesh: Mesh) => {
    const p = mesh.geometry.attributes.position, ix = mesh.geometry.index;
    const a = new Vector3(), b = new Vector3(), c = new Vector3(); let volume = 0;
    for (let i = 0; i < (ix?.count ?? p.count); i += 3) {
      a.fromBufferAttribute(p, ix ? ix.getX(i) : i);
      b.fromBufferAttribute(p, ix ? ix.getX(i + 1) : i + 1);
      c.fromBufferAttribute(p, ix ? ix.getX(i + 2) : i + 2);
      volume += a.dot(b.clone().cross(c)) / 6;
    }
    return Math.abs(volume * mesh.matrixWorld.determinant());
  };
  const partitionChecks: { levelId: string; cadY: number; height: number; leftX: number | null; rightX: number | null; measuredDepthM: number | null; hitVolumeM3: number; pass: boolean }[] = [];
  const volumes = new Map<Mesh, number>();
  for (const level of data.levels) for (const cadY of [14, 16, 18]) for (const offset of [.5, 1.5, 2.5]) {
    const list = walls.filter(w => w.userData.levelId === level.id), height = level.ff + offset;
    ray.set(new Vector3(24.9, height, -cadY), new Vector3(1, 0, 0)); ray.near = 0; ray.far = 1;
    const left = ray.intersectObjects(list, false)[0];
    ray.set(new Vector3(25.9, height, -cadY), new Vector3(-1, 0, 0));
    const right = ray.intersectObjects(list, false)[0];
    const depth = left && right ? right.point.x - left.point.x : null;
    const hitMeshes = new Set([left?.object, right?.object].filter((o): o is Mesh => o instanceof Mesh));
    let volume = 0; for (const mesh of hitMeshes) { if (!volumes.has(mesh)) volumes.set(mesh, signedVolume(mesh)); volume += volumes.get(mesh)!; }
    const pass = Boolean(left && right && Math.abs(left.point.x - 25.23) < 1e-5 && Math.abs(right.point.x - 25.53) < 1e-5 && depth !== null && Math.abs(depth - .30) < 1e-5 && volume > .001);
    partitionChecks.push({ levelId: level.id, cadY, height, leftX: left?.point.x ?? null, rightX: right?.point.x ?? null, measuredDepthM: depth, hitVolumeM3: volume, pass });
    if (!pass) issues.push(`missing/incorrect 0.30 m partition ${level.id} Y${cadY} H${height}`);
  }
  let repairedRoomDegenerateTriangles = 0, allDegenerateTriangles = 0;
  for (const mesh of meshes) {
    const p = mesh.geometry.attributes.position, ix = mesh.geometry.index;
    const a = new Vector3(), b = new Vector3(), c = new Vector3();
    for (let i = 0; i < (ix?.count ?? p.count); i += 3) {
      a.fromBufferAttribute(p, ix ? ix.getX(i) : i); b.fromBufferAttribute(p, ix ? ix.getX(i + 1) : i + 1); c.fromBufferAttribute(p, ix ? ix.getX(i + 2) : i + 2);
      if (b.sub(a).cross(c.sub(a)).lengthSq() <= 1e-20) { allDegenerateTriangles++; if (mesh.userData.elementId === 'upper-room-6-0') repairedRoomDegenerateTriangles++; }
    }
  }
  if (allDegenerateTriangles) issues.push(`degenerate mesh triangles: ${allDegenerateTriangles}`);
  if (repairedRoomDegenerateTriangles) issues.push(`degenerate repaired room triangles: ${repairedRoomDegenerateTriangles}`);
  for (const op of data.openings.filter(o => o.status === 'cut-3d')) {
    if (!op.axis) { issues.push(`no opening axis ${op.id}`); continue; }
    const [a, b] = op.axis; const dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy); const normal = new Vector3(-dy / length, 0, -dx / length);
    const mid = new Vector3((a[0] + b[0]) / 2, (op.sillY! + op.headY!) / 2, -(a[1] + b[1]) / 2);
    const distance = (op.depth ?? .15) / 2 + .005;
    ray.set(mid.clone().addScaledVector(normal, -distance), normal); ray.near = 0; ray.far = 2 * distance;
    const hits = ray.intersectObjects(walls.filter(w => w.userData.levelId === op.levelId), false);
    if (hits.length) blockedOpenings.push(op.id);
  }
  if (blockedOpenings.length) issues.push(`blocked openings: ${blockedOpenings.join(',')}`);
  const voidChecks: { id: string; clear: boolean }[] = [];
  for (const level of data.levels) for (const v of level.voids) {
    const x = v.polygon.reduce((s,p) => s + p[0], 0) / v.polygon.length, y = v.polygon.reduce((s,p) => s + p[1], 0) / v.polygon.length;
    ray.set(new Vector3(x, level.ff + .5, -y), new Vector3(0, -1, 0)); ray.far = .6;
    const clear = !ray.intersectObjects(floor.filter(m => m.userData.levelId === level.id), false).length;
    voidChecks.push({ id: `${level.id}-${v.id}`, clear }); if (!clear) issues.push(`filled void ${v.id}`);
  }
  // At sill/head bands, actual wall solids must exist around at least one representative window per floor.
  const sillAndHead: { levelId: string; below: boolean; above: boolean }[] = [];
  for (const level of data.levels) {
    const op = data.openings.find(o => o.levelId === level.id && o.tag === 'J200' && o.status === 'cut-3d')!;
    const [a,b] = op.axis!; const dx = b[0]-a[0],dy = b[1]-a[1],len = Math.hypot(dx,dy); const n = new Vector3(-dy/len,0,-dx/len); const mid = new Vector3((a[0]+b[0])/2,0,-(a[1]+b[1])/2);
    const hit = (h: number) => { mid.y = h; ray.set(mid.clone().addScaledVector(n,-.2),n);ray.far=.4;return ray.intersectObjects(walls.filter(w=>w.userData.levelId===level.id),false).length>0; };
    const record = { levelId:level.id, below:hit(op.sillY!-.2), above:hit(op.headY!+.2) };sillAndHead.push(record);if(!record.below||!record.above)issues.push(`missing sill/lintel ${level.id}`);
  }
  if (!root.children.some(o => o.userData?.source?.sha256 === data.source.sha256) && root.userData.source?.sha256 !== data.source.sha256) issues.push('root source extras missing');
  return { status: issues.length ? 'fail' : 'pass', issues, meshCount: meshes.length, triangles, wallMeshCount: walls.length, sourceObjects, elementIds: ids.size, levels: [...levels], bounds: { min: bounds.min.toArray(), max: bounds.max.toArray(), size: size.toArray() }, openingCutRays: data.openings.filter(o=>o.status==='cut-3d').length, blockedOpenings, voidChecks, sillAndHead, invalidCoordinates, partitionChecks, repairedRoomDegenerateTriangles, allDegenerateTriangles };
}
