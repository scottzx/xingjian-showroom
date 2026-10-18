import * as THREE from 'three';
import type { SceneAsset } from './sceneTypes.ts';

export function makeAsset(): SceneAsset {
  return { root: new THREE.Group(), surfaces: new Map() };
}

export function addMesh(asset: SceneAsset, geometry: THREE.BufferGeometry, position: [number, number, number], color: string, surfaceId?: string): THREE.Mesh {
  const material = new THREE.MeshPhysicalMaterial({ color, roughness: .65, metalness: 0 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (surfaceId) {
    mesh.userData.surfaceId = surfaceId;
    const list = asset.surfaces.get(surfaceId) ?? [];
    list.push(mesh);
    asset.surfaces.set(surfaceId, list);
  }
  asset.root.add(mesh);
  return mesh;
}

export function box(asset: SceneAsset, size: [number, number, number], position: [number, number, number], color: string, surfaceId?: string) {
  return addMesh(asset, new THREE.BoxGeometry(...size), position, color, surfaceId);
}

export function cylinder(asset: SceneAsset, top: number, bottom: number, height: number, position: [number, number, number], color: string, surfaceId?: string) {
  return addMesh(asset, new THREE.CylinderGeometry(top, bottom, height, 64), position, color, surfaceId);
}

export function roundedBox(asset: SceneAsset, size: [number, number, number], position: [number, number, number], color: string, surfaceId?: string) {
  // A bevelled extrusion provides soft edges without a geometry dependency.
  const [width, height, depth] = size;
  const radius = Math.min(.08, width / 8, height / 8, depth / 8);
  const x = -width / 2 + radius, y = -height / 2 + radius;
  const w = width - 2 * radius, h = height - 2 * radius;
  const shape = new THREE.Shape();
  shape.moveTo(x, y); shape.lineTo(x + w, y); shape.lineTo(x + w, y + h); shape.lineTo(x, y + h); shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: depth - radius * 2, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: radius, bevelThickness: radius });
  geometry.translate(0, 0, -depth / 2 + radius);
  return addMesh(asset, geometry, position, color, surfaceId);
}
