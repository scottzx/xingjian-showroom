import * as THREE from 'three';
import { addMesh, box, cylinder } from '../primitives.ts';
import type { SceneAsset } from '../sceneTypes.ts';
import type { CadApartment, CadPolygon, PlanPoint } from './cadTypes.ts';

export function createCadFinishes(asset: SceneAsset, data: CadApartment, solid: (polygon: CadPolygon, height: number) => THREE.BufferGeometry) {
  const finishes = new THREE.Group(), ceiling = new THREE.Group();
  const upperTiles = new THREE.Group(); upperTiles.name = '墙砖剖切上部';
  asset.cutawayObjects?.push(upperTiles);
  finishes.name = '按材料表还原的饰面与细节'; ceiling.name = '装修吊顶净高';
  const start = asset.root.children.length;
  const span = (a: PlanPoint, b: PlanPoint, height: number, depth: number, color: string, surface?: string, base = .025) => {
    const mesh = box(asset, [Math.hypot(b[0] - a[0], b[1] - a[1]), height, depth], [(a[0] + b[0]) / 2, height / 2 + base, (a[1] + b[1]) / 2], color, surface);
    mesh.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]); return mesh;
  };
  for (const panel of data.decorations?.wallTiles ?? []) {
    const length = Math.hypot(panel.b[0] - panel.a[0], panel.b[1] - panel.a[1]);
    for (const [base, height] of [[0, .95], [.95, panel.height - .95]]) {
      const mesh = span(panel.a, panel.b, height, .012, '#dedfd6', undefined, base + .025); mesh.userData.materialCode = 'CT-02';
      const local = new THREE.Group(); local.position.copy(mesh.position); local.rotation.copy(mesh.rotation);
      const positions: number[] = [];
      for (let h = .3; h < panel.height; h += .3) if (h > base && h < base + height) positions.push(-length / 2, h - base - height / 2, .008, length / 2, h - base - height / 2, .008);
      for (let x = -length / 2 + .6; x < length / 2; x += .6) positions.push(x, -height / 2, .008, x, height / 2, .008);
      local.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)), new THREE.LineBasicMaterial({ color: '#b9c3b7' })));
      asset.root.add(local);
      if (base > 0) upperTiles.add(mesh, local);
    }
  }
  for (const p of data.decorations?.skirting ?? []) span(p.a, p.b, p.height, .018, '#bcb9a5');
  const positions: number[] = [];
  for (const line of data.decorations?.tileLines ?? []) for (let i = 1; i < line.length; i++) positions.push(line[i - 1][0], .043, line[i - 1][1], line[i][0], .043, line[i][1]);
  asset.root.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)), new THREE.LineBasicMaterial({ color: '#aeb7a8', transparent: true, opacity: .55 })));
  for (const item of data.decorations?.boxes ?? []) {
    const mesh = box(asset, item.size, [item.position[0], item.position[1] + .025, item.position[2]], item.color);
    mesh.name = item.id; mesh.userData.cadSource = item.source;
  }
  for (const window of data.openings.filter(o => o.kind === 'window')) {
    const dx = window.b[0] - window.a[0], dz = window.b[1] - window.a[1], length = Math.hypot(dx, dz);
    if (length < 1) continue;
    for (const end of [window.a, window.b]) for (let i = 0; i < 5; i++) {
      const sign = end === window.a ? 1 : -1;
      const x = end[0] + sign * dx / length * (.04 + i * .045), z = end[1] + sign * dz / length * (.04 + i * .045);
      cylinder(asset, .025, .025, 2.23, [x, 1.2, z], '#e5dece');
    }
  }
  asset.root.children.slice(start).forEach(child => finishes.add(child)); finishes.add(upperTiles); asset.root.add(finishes);
  for (const p of data.decorations?.ceilings ?? []) {
    const mesh = addMesh(asset, solid(p, .025), [0, p.height + .025, 0], '#e9e7dc');
    mesh.userData.cadSource = p.source; mesh.userData.materialCode = p.materialCode; ceiling.add(mesh);
  }
  asset.root.add(ceiling);
  return { finishes, ceiling };
}
