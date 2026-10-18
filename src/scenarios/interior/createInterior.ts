import * as THREE from 'three';
import { addMesh, box, cylinder, makeAsset, roundedBox } from '../primitives.ts';

/** Illustrative living room, not a reconstruction of the user's DWG drawings. */
export function createInterior() {
  const asset = makeAsset();
  const floor = box(asset, [7, .16, 5.2], [0, 0, 0], '#c4a47a', 'floor');
  floor.userData.textureRepeat = [6, 4];
  const walls = new THREE.Group();
  asset.root.add(walls);
  const addWall = (size: [number, number, number], position: [number, number, number]) => {
    const mesh = box(asset, size, position, '#eee7d9', 'walls');
    walls.add(mesh);
  };
  addWall([7, 2.8, .14], [0, 1.48, -2.6]);
  addWall([.14, 2.8, 5.2], [-3.5, 1.48, 0]);
  asset.cutawayObjects = [walls];
  // Window and curtains, mounted on the back wall.
  const wallDecorationStart = asset.root.children.length;
  box(asset, [2.2, 1.65, .06], [1.6, 1.75, -2.5], '#acc7c8');
  box(asset, [2.38, .07, .14], [1.6, .9, -2.43], '#e2dbce');
  for (const x of [.48, 1.6, 2.72]) box(asset, [.045, 1.7, .1], [x, 1.75, -2.43], '#f2eee4');
  box(asset, [2.3, .045, .1], [1.6, 1.75, -2.43], '#f2eee4');
  for (let i = 0; i < 6; i++) cylinder(asset, .055, .055, 2.2, [.1 + i * .085, 1.5, -2.35], '#d7d2c5');
  asset.root.children.slice(wallDecorationStart).forEach(object => walls.add(object));
  // Sectional sofa with separate upholstery meshes.
  roundedBox(asset, [2.9, .4, 1.05], [-.9, .47, -1.65], '#8b9c88', 'sofa');
  roundedBox(asset, [2.9, .65, .24], [-.9, .98, -2.06], '#8b9c88', 'sofa');
  for (const x of [-2.27, .48]) roundedBox(asset, [.22, .66, 1.08], [x, .74, -1.65], '#8b9c88', 'sofa');
  for (const x of [-1.77, -.9, -.03]) roundedBox(asset, [.82, .16, .81], [x, .75, -1.57], '#8b9c88', 'sofa');
  roundedBox(asset, [.95, .4, 1.05], [.1, .47, -.65], '#8b9c88', 'sofa');
  roundedBox(asset, [.85, .16, 1], [.1, .75, -.65], '#8b9c88', 'sofa');
  // Rug, low table, books, storage and a plant establish scale.
  roundedBox(asset, [3.6, .025, 2.5], [-.65, .1, .25], '#e3dfd2');
  cylinder(asset, .66, .66, .12, [-.9, .59, .3], '#735640', 'cabinet');
  cylinder(asset, .3, .4, .45, [-.9, .31, .3], '#735640', 'cabinet');
  box(asset, [.32, .035, .23], [-1.05, .67, .3], '#c4a183');
  box(asset, [.29, .025, .21], [-1.02, .7, .3], '#e6e0d2');
  cylinder(asset, .11, .08, .18, [-.65, .74, .23], '#ece6d9');
  roundedBox(asset, [.5, .6, 2.5], [2.92, .42, -.5], '#71513b', 'cabinet');
  for (let i = 0; i < 4; i++) box(asset, [.02, .48, .025], [3.18, .46, -1.42 + i * .6], '#cbbca2');
  box(asset, [.07, 1.15, 1.9], [2.92, 1.34, -.5], '#232d2e');
  box(asset, [.15, .04, .5], [2.92, .75, -.5], '#313b38');
  cylinder(asset, .24, .18, .48, [-2.8, .33, 1.85], '#b89c7e');
  cylinder(asset, .035, .04, 1.3, [-2.8, 1.08, 1.85], '#6a7256');
  for (let i = 0; i < 9; i++) {
    const angle = i * 2.4;
    const leaf = addMesh(asset, new THREE.SphereGeometry(.24, 16, 12), [-2.8 + Math.cos(angle) * .26, 1 + i * .09, 1.85 + Math.sin(angle) * .26], '#65795a');
    leaf.scale.set(1, .34, 1.9); leaf.rotation.z = angle;
  }
  walls.add(box(asset, [.09, .9, .66], [-3.36, 1.83, -.1], '#ad967c'));
  walls.add(box(asset, [.1, .76, .53], [-3.29, 1.83, -.1], '#e7dfce'));
  cylinder(asset, .1, .17, .3, [2.93, .87, .52], '#d3bc9f');
  return asset;
}
