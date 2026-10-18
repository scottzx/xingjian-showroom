import * as THREE from 'three';
import { addMesh, cylinder, makeAsset } from '../primitives.ts';

export function createPackaging() {
  const asset = makeAsset();
  cylinder(asset, .93, .75, 1.82, [0, .98, 0], '#e9e2d3', 'bucket');
  cylinder(asset, .965, .95, .11, [0, 1.92, 0], '#667d64', 'lid');
  cylinder(asset, .98, .98, .07, [0, 1.99, 0], '#667d64', 'lid');
  cylinder(asset, .91, .91, .035, [0, 2.04, 0], '#667d64', 'lid');
  cylinder(asset, .77, .77, .07, [0, .07, 0], '#e9e2d3', 'bucket');
  const label = addMesh(asset, new THREE.CylinderGeometry(.908, .799, 1.1, 96, 1, true, .14, Math.PI * 2 - .28), [0, 1.04, 0], '#f6f1e5', 'label');
  label.rotation.y = -1;
  const handle = addMesh(asset, new THREE.TorusGeometry(.91, .026, 12, 80, Math.PI), [0, 1.42, 0], '#a0aaa4');
  handle.rotation.y = -.25;
  (handle.material as THREE.MeshPhysicalMaterial).setValues({ metalness: .85, roughness: .3 });
  for (const x of [-.91, .91]) {
    const mount = cylinder(asset, .09, .09, .055, [x, 1.43, 0], '#e9e2d3', 'bucket');
    mount.rotation.z = Math.PI / 2;
  }
  return asset;
}
