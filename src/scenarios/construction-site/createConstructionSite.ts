import { BoxGeometry, BufferGeometry, Group, LineBasicMaterial, LineLoop, Mesh, MeshStandardMaterial, PlaneGeometry, Vector3 } from 'three';
import type { SceneAsset } from '../sceneTypes.ts';
import type { ConstructionSite } from './types.ts';

/** Footprints come from DXF; all vertical geometry is explicitly illustrative. */
export function createConstructionSite(data: ConstructionSite): SceneAsset {
  if (data.id !== 'construction-site' || data.facilities.length !== 6) throw new Error('施工样例数据不完整。');
  const root = new Group();
  root.name = '施工场地教学样例_比例暂定_高度示意';
  root.userData = { ...data, teachingSample: true, units: 'm', upAxis: 'Y', actualHeight: null, heightKnown: false, heightBasis: 'illustration' };
  const surfaces = new Map<string, Mesh[]>();
  const board = new Mesh(new PlaneGeometry(...data.site.adoptedDimensionsMeters), new MeshStandardMaterial({ color: '#e1e7eb', roughness: 1 }));
  board.rotation.x = -Math.PI / 2; board.position.y = -.02; board.receiveShadow = true;
  board.name = '边界41_平面展示底板_非实测地形';
  board.userData = { sourceHandle: data.site.sourceHandle, sourceHash: data.source.sha256, cadPoints: data.site.cadPoints, worldPoints: data.site.worldPoints, basis: 'illustration', actualElevation: null, terrainKnown: false, ignorePick: true };
  root.add(board);
  const boundary = new LineLoop(new BufferGeometry().setFromPoints(data.site.worldPoints.slice(0, -1).map(p => new Vector3(p[0], .015, p[2]))), new LineBasicMaterial({ color: '#36546d' }));
  boundary.name = 'CAD边界_handle41'; boundary.userData = { sourceHandle: '41', sourceHash: data.source.sha256, basis: 'geometry' }; root.add(boundary);
  for (const facility of data.facilities) {
    if (facility.heightKnown !== false || facility.actualHeight !== null || facility.heightBasis !== 'illustration') throw new Error('实际高度必须保持未知。');
    const points = facility.worldPoints;
    if (points.length !== 5 || points.some(p => p.some(v => !Number.isFinite(v)))) throw new Error('设施坐标无效。');
    const xs = points.map(p => p[0]), zs = points.map(p => p[2]);
    const width = Math.max(...xs) - Math.min(...xs), depth = Math.max(...zs) - Math.min(...zs);
    if (Math.abs(width - facility.adoptedDimensionsMeters.width) > 1e-8 || Math.abs(depth - facility.adoptedDimensionsMeters.depth) > 1e-8 || !(facility.displayHeight > 0)) throw new Error('设施尺寸与坐标不一致。');
    const mesh = new Mesh(new BoxGeometry(width, facility.displayHeight, depth), new MeshStandardMaterial({ color: facility.displayColor, roughness: .85 }));
    mesh.position.set((Math.max(...xs) + Math.min(...xs)) / 2, facility.displayHeight / 2, (Math.max(...zs) + Math.min(...zs)) / 2);
    mesh.name = `${facility.id}_${facility.nameOriginal}_handle${facility.source.footprintHandle}_illustration`;
    mesh.userData = { ...facility, surfaceId: facility.id, teachingSample: true, materialBasis: 'illustration' };
    mesh.castShadow = true; mesh.receiveShadow = true;
    root.add(mesh); surfaces.set(facility.id, [mesh]);
  }
  return { root, surfaces };
}
