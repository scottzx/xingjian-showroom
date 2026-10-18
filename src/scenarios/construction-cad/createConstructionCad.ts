import { BoxGeometry, BufferGeometry, DoubleSide, ExtrudeGeometry, Group, Line, LineSegments, LineBasicMaterial, Mesh, MeshStandardMaterial, Path, Shape, Vector3 } from 'three';
import type { SceneAsset } from '../sceneTypes.ts';
import type { CadElement, CadPolygon, ConstructionCadModel } from './types.ts';
const cache = new Map<string, Promise<ConstructionCadModel>>();
export function loadConstructionCadData(url: string): Promise<ConstructionCadModel> {
  let promise = cache.get(url);
  if (!promise) {
    promise = fetch(url).then(response => { if (!response.ok) throw new Error('IFG 建筑数据加载失败'); return response.json() as Promise<ConstructionCadModel>; });
    cache.set(url, promise); void promise.catch(() => cache.delete(url));
  }
  return promise;
}
function shapeOf(p: CadPolygon) {
  const s = new Shape(); p.outline.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); s.closePath();
  for (const ring of p.holes) { const h = new Path(); ring.forEach(([x, y], i) => i ? h.lineTo(x, y) : h.moveTo(x, y)); h.closePath(); s.holes.push(h); }
  return s;
}
export function createConstructionCad(data: ConstructionCadModel): SceneAsset {
  if (data.id !== 'ifg-classroom' || data.units !== 'metres' || data.levels.length !== 2) throw new Error('Invalid IFG CAD model');
  const root = new Group(); root.name = 'IFG_BLC1_R00_complete_two_storeys';
  root.userData = { modelId: data.id, revision: data.revision, units: data.units, upAxis: 'Y', source: data.source, coordinateSystem: data.coordinateSystem, levels: data.levels.map(({ planarUnknown: _plan, ...l }) => l), issues: data.issues, displaySettings: data.displaySettings, exportProfile: 'complete-independent-scene', sourceIndex: data.sourceIndex };
  const surfaces = new Map<string, Mesh[]>(); const levelGroups: Record<string, Group> = {}; const cutawayObjects: Group[] = [];
  const upperGroups: Record<string, Group> = {};
  for (const level of data.levels) {
    const group = new Group(); group.name = `level-${level.id}`; group.userData = { levelId: level.id, ff: level.ff, clearHeight: level.clearHeight, sourceRefs: level.id === 'ground' ? ['2CF3'] : ['2D38', '2D54', '17E01'], adoption: level.adoption, conflicts: level.conflicts, constructionBand: level.constructionBand };
    root.add(group); levelGroups[level.id] = group;
    const high = new Group(); high.name = `${level.id}-cutaway-above-0.95m`; group.add(high); upperGroups[level.id] = high; cutawayObjects.push(high);
  }
  const add = (element: CadElement, y0: number, y1: number, high: boolean, suffix: string) => {
    if (y1 - y0 < 1e-6) return;
    const geometry = new ExtrudeGeometry(shapeOf(element), { depth: y1 - y0, bevelEnabled: false, steps: 1 }); geometry.rotateX(-Math.PI / 2); geometry.translate(0, y0, 0);
    // Float32 positions can collapse sub-grid edges during extrusion/transform.
    // Drop only numerically degenerate triangles; keep source rings and all other faces.
    const position = geometry.attributes.position; const kept: number[] = [];
    const va = new Vector3(), vb = new Vector3(), vc = new Vector3(); let removed = 0;
    for (let i = 0; i < position.count; i += 3) {
      va.fromBufferAttribute(position, i); vb.fromBufferAttribute(position, i + 1); vc.fromBufferAttribute(position, i + 2);
      if (vb.sub(va).cross(vc.sub(va)).lengthSq() <= 1e-20) removed++;
      else kept.push(i, i + 1, i + 2);
    }
    if (removed) { geometry.setIndex(kept); geometry.clearGroups(); }
    const wall = element.kind === 'wall'; const surfaceId = `${element.levelId}-${wall ? 'walls' : 'floor'}`;
    const material = new MeshStandardMaterial({ color: wall ? '#eee7d9' : element.kind === 'stair' ? '#9faeb2' : element.levelId === 'upper' ? '#b7c6cc' : '#c9c5bb', roughness: .88, side: DoubleSide });
    const mesh = new Mesh(geometry, material); mesh.name = `${element.id}${suffix}`;
    mesh.userData = { ...element, elementId: element.id, surfaceId, meshYRange: [y0, y1], source: data.source.sha256, geometryCleanup: { removedDegenerateTriangles: removed, squaredCrossTolerance: 1e-20, sourceRingsPreserved: true } }; mesh.castShadow = wall; mesh.receiveShadow = true;
    (high ? upperGroups[element.levelId] : levelGroups[element.levelId]).add(mesh);
    surfaces.set(surfaceId, [...(surfaces.get(surfaceId) ?? []), mesh]);
  };
  for (const e of data.elements) {
    const ff = data.levels.find(l => l.id === e.levelId)!.ff;
    if (e.kind === 'wall') { add(e, e.y0, Math.min(e.y1, ff + .95), false, '-low'); add(e, Math.max(e.y0, ff + .95), e.y1, true, '-high'); }
    else add(e, e.y0, e.y1, false, '');
  }
  for (const o of data.openings) {
    const level = data.levels.find(l => l.id === o.levelId)!;
    if (o.status === 'cut-3d' && o.axis && o.tag.startsWith('J')) {
      const [a, b] = o.axis; const width = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const glass = new Mesh(new BoxGeometry(width, o.height, .014), new MeshStandardMaterial({ color: '#8fb3c1', transparent: true, opacity: .3, roughness: .25, metalness: .15 }));
      glass.position.set((a[0] + b[0]) / 2, level.ff + o.sill + o.height / 2, -(a[1] + b[1]) / 2); glass.rotation.y = Math.atan2(b[1] - a[1], b[0] - a[0]);
      glass.name = o.id; glass.userData = { ...o, elementId: o.id, kind: 'opening-glazing', basis: 'source opening height/footprint; 14mm glass is display-setting', unknown: ['Frame profile and glass thickness unknown'] }; upperGroups[o.levelId].add(glass);
    }
    // Retain the actual door/window source plan, including unresolved axes, at its own FF.
    const vertices: Vector3[] = [];
    for (const id of o.sourceLeafIds) {
      const record = data.sourceIndex[id]; const pts = record?.localPoints as [number, number][] | undefined;
      if (!pts?.length) continue;
      const pairs = pts.slice(1).map((p, i) => [pts[i], p]); if (record.closed) pairs.push([pts[pts.length - 1], pts[0]]);
      for (const pair of pairs) for (const [x, y] of pair) vertices.push(new Vector3(x, level.ff + .018, -y));
    }
    if (vertices.length) {
      const line = new LineSegments(new BufferGeometry().setFromPoints(vertices), new LineBasicMaterial({ color: o.status === 'plan-only' ? '#b35e3f' : '#326879' }));
      line.name = `plan-${o.id}`; line.userData = { ...o, elementId: o.id, kind: 'opening-plan', unknown: o.status === 'plan-only' ? ['axis unresolved; no 3D solid/cut'] : [] }; levelGroups[o.levelId].add(line);
    }
  }
  for (const l of data.levels) for (const p of l.planarUnknown) {
    const pts = p.closed ? [...p.points, p.points[0]] : p.points;
    const line = new Line(new BufferGeometry().setFromPoints(pts.map(([x, y]) => new Vector3(x, l.ff + .02, -y))), new LineBasicMaterial({ color: '#929ba0' }));
    line.name = `plan-unknown-${l.id}-${p.id}`; line.userData = { elementId: p.id, levelId: l.id, kind: 'plan-only', sourceRefs: [p.id], unknown: [p.reason] }; levelGroups[l.id].add(line);
  }
  root.updateMatrixWorld(true);
  return { root, surfaces, levelGroups, cutawayObjects };
}
