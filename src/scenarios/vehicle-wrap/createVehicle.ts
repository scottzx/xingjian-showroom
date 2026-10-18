import * as THREE from 'three';
import { addMesh, box, cylinder, makeAsset, roundedBox } from '../primitives.ts';

/** Generic sedan; real vehicle body panels and UVs can later be supplied as GLB. */
export function createVehicle() {
  const asset = makeAsset();
  const profile = new THREE.Shape();
  profile.moveTo(-2.3, .45); profile.lineTo(-2.25, .88); profile.quadraticCurveTo(-1.8, 1.09, -1.05, 1.1);
  profile.lineTo(1.28, 1.1); profile.quadraticCurveTo(1.9, 1.08, 2.22, .88); profile.lineTo(2.32, .45); profile.closePath();
  const bodyGeo = new THREE.ExtrudeGeometry(profile, { depth: 1.78, bevelEnabled: true, bevelSize: .085, bevelThickness: .085, bevelSegments: 4, steps: 1 });
  bodyGeo.translate(0, 0, -.89);
  addMesh(asset, bodyGeo, [0, 0, 0], '#426451', 'body');
  // Cabin glass is one bevelled shell, body-coloured pillars surround it.
  const cabin = new THREE.Shape();
  cabin.moveTo(-1.16, 1.08); cabin.lineTo(-.58, 1.68); cabin.quadraticCurveTo(.1, 1.86, .8, 1.64); cabin.lineTo(1.4, 1.08); cabin.closePath();
  const cabinGeo = new THREE.ExtrudeGeometry(cabin, { depth: 1.48, bevelEnabled: true, bevelSize: .04, bevelThickness: .04, bevelSegments: 3, steps: 1 });
  cabinGeo.translate(0, 0, -.74);
  const glass = addMesh(asset, cabinGeo, [0, 0, 0], '#263d45');
  (glass.material as THREE.MeshPhysicalMaterial).setValues({ roughness: .15, metalness: .5, clearcoat: 1 });
  roundedBox(asset, [1.18, .07, 1.5], [.1, 1.75, 0], '#252c2e', 'roof');
  const hood = roundedBox(asset, [1.13, .07, 1.64], [-1.66, 1.08, 0], '#426451', 'hood');
  hood.rotation.z = .055;
  roundedBox(asset, [.67, .06, 1.65], [1.8, 1.08, 0], '#426451', 'body');
  for (const side of [-1, 1]) {
    for (const x of [-.5, .56]) {
      roundedBox(asset, [1.03, .48, .035], [x, .82, side * .989], '#426451', 'doors');
      roundedBox(asset, [.16, .025, .035], [x + .25, 1, side * 1.02], '#c6cecd');
    }
    box(asset, [.055, .58, .07], [.1, 1.41, side * .78], '#262d2d');
    box(asset, [2.5, .04, .06], [.08, 1.12, side * .8], '#a6b1b1');
    roundedBox(asset, [.19, .1, .2], [-.85, 1.15, side * 1.07], '#426451', 'body');
    box(asset, [3.4, .08, .07], [0, .4, side * .94], '#272d2e');
    for (const x of [-1.43, 1.43]) {
      const tyre = cylinder(asset, .43, .43, .24, [x, .44, side * .93], '#202626');
      tyre.rotation.x = Math.PI / 2;
      (tyre.material as THREE.MeshPhysicalMaterial).roughness = .93;
      const rim = cylinder(asset, .31, .31, .025, [x, .44, side * 1.067], '#344046');
      rim.rotation.x = Math.PI / 2;
      (rim.material as THREE.MeshPhysicalMaterial).metalness = .8;
      for (let j = 0; j < 10; j++) {
        const angle = j * Math.PI / 5;
        const spoke = box(asset, [.035, .28, .03], [x + Math.sin(angle) * .12, .44 + Math.cos(angle) * .12, side * 1.087], '#b1bcbc');
        spoke.rotation.z = -angle;
      }
      const hub = cylinder(asset, .08, .08, .03, [x, .44, side * 1.1], '#4c585c');
      hub.rotation.x = Math.PI / 2;
    }
  }
  roundedBox(asset, [.13, .24, 1.72], [-2.32, .61, 0], '#426451', 'bumpers');
  roundedBox(asset, [.13, .24, 1.72], [2.32, .61, 0], '#426451', 'bumpers');
  box(asset, [.025, .16, 1.08], [-2.41, .6, 0], '#212e30');
  for (const side of [-1, 1]) {
    const lamp = box(asset, [.04, .055, .55], [-2.3, .94, side * .57], '#e7f5f2');
    (lamp.material as THREE.MeshPhysicalMaterial).setValues({ emissive: '#daefef', emissiveIntensity: .5 });
    box(asset, [.045, .055, .62], [2.32, .92, side * .52], '#a94434');
  }
  return asset;
}
