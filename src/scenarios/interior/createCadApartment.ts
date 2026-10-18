import * as THREE from 'three';
import { addMesh, box, cylinder, makeAsset, roundedBox } from '../primitives.ts';
import type { SceneAsset } from '../sceneTypes.ts';
import type { CadApartment, CadFurniture, CadPolygon, PlanPoint } from './cadTypes.ts';
import { createCadServices } from './createCadServices.ts';
import { createCadFinishes } from './createCadFinishes.ts';

function solid(polygon: CadPolygon, height: number) {
  const path = (points: PlanPoint[], target: THREE.Path) => {
    points.forEach(([x, z], i) => { if (!i) target.moveTo(x, -z); else target.lineTo(x, -z); });
    target.closePath(); return target;
  };
  const shape = path(polygon.outline, new THREE.Shape()) as THREE.Shape;
  shape.holes = (polygon.holes ?? []).map(points => path(points, new THREE.Path()));
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, steps: 1 });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

function furnishing(asset: SceneAsset, item: CadFurniture, parent: THREE.Group) {
  const start = asset.root.children.length;
  const [w, d] = [item.width, item.depth];
  const white = '#ece9df', timber = '#997957', metal = '#5b635f';
  const block = (size: [number, number, number], at: [number, number, number], color: string, surface?: string) => roundedBox(asset, size, at, color, surface);
  const legs = (height: number, inset = .12) => {
    for (const x of [-w / 2 + inset, w / 2 - inset]) for (const z of [-d / 2 + inset, d / 2 - inset]) box(asset, [.045, height, .045], [x, height / 2, z], timber, 'cabinet');
  };
  if (item.kind === 'bed') {
    block([w, .28, d], [0, .22, 0], timber, 'cabinet');
    block([w - .06, .22, d - .06], [0, .46, .02], white, 'sofa');
    block([w + .05, .9, .10], [0, .55, -d / 2 + .03], timber, 'cabinet');
    block([w - .08, .08, d * .56], [0, .61, d * .19], '#aeb7a2', 'sofa');
    for (const x of [-w * .24, w * .24]) block([w * .39, .13, .4], [x, .66, -d * .3], '#f7f3e8');
  } else if (item.kind === 'sofa') {
    block([w, .31, d], [0, .34, 0], white, 'sofa');
    block([w, .55, .18], [0, .65, -d / 2 + .09], white, 'sofa');
    const count = Math.max(1, Math.round(w / .7));
    for (let i = 0; i < count; i++) block([w / count - .035, .13, d - .23], [-w / 2 + w / count * (i + .5), .56, .08], white, 'sofa');
    for (const x of [-w / 2 + .08, w / 2 - .08]) block([.16, .45, d], [x, .55, 0], white, 'sofa');
  } else if (item.kind === 'table' || item.kind === 'coffee-table' || item.kind === 'round-table') {
    const height = item.kind === 'coffee-table' ? .4 : .74;
    if (item.kind === 'round-table') {
      cylinder(asset, w / 2, w / 2, .065, [0, height, 0], timber, 'cabinet');
      cylinder(asset, .16, .29, height - .04, [0, height / 2, 0], timber, 'cabinet');
    } else { block([w, .07, d], [0, height, 0], timber, 'cabinet'); legs(height - .04); }
    cylinder(asset, .07, .055, .16, [w * .16, height + .11, 0], white);
  } else if (item.kind === 'chair') {
    block([w, .07, d], [0, .45, 0], '#8b9c88', 'sofa');
    block([w, .4, .08], [0, .68, -d / 2 + .04], timber, 'cabinet'); legs(.42, .06);
  } else if (item.kind === 'toilet') {
    const bowl = addMesh(asset, new THREE.SphereGeometry(.5, 24, 16), [0, .32, d * .1], '#f3f2e9');
    bowl.scale.set(w, .43, d * .8);
    block([w * .85, .65, d * .28], [0, .35, -d * .33], '#f3f2e9');
    const seat = addMesh(asset, new THREE.TorusGeometry(w * .32, .035, 8, 32), [0, .51, d * .12], white);
    seat.rotation.x = -Math.PI / 2; seat.scale.y = d / w * .65;
  } else if (item.kind === 'basin') {
    const h = item.height ?? .85;
    block([w, h - .08, d], [0, (h - .08) / 2, 0], timber, 'cabinet');
    block([w + .03, .08, d + .03], [0, h - .04, 0], white);
    const bowl = addMesh(asset, new THREE.SphereGeometry(.5, 24, 16), [0, h + .025, 0], '#d6dcd9');
    bowl.scale.set(w * .65, .12, d * .67);
    cylinder(asset, .018, .018, .20, [0, h + .12, -d * .34], metal);
    box(asset, [.12, .025, .025], [.04, h + .21, -d * .34], metal);
  } else if (item.kind === 'shower') {
    block([w, .055, d], [0, .04, 0], '#d8dcd3');
    const glass = box(asset, [w, 1.9, .015], [0, 1, d / 2], '#b7d4d2');
    Object.assign(glass.material, { transparent: true, opacity: .17, depthWrite: false });
    cylinder(asset, .018, .018, 1.7, [w * .25, 1.1, -d * .43], metal);
    cylinder(asset, .12, .12, .025, [w * .25, 1.97, -d * .23], metal);
  } else if (item.kind === 'washing-machine') {
    block([w, .85, d], [0, .46, 0], white);
    const drum = cylinder(asset, w * .33, w * .33, .035, [0, .43, d / 2 + .01], '#536562');
    drum.rotation.x = Math.PI / 2;
    block([w * .75, .09, .025], [0, .78, d / 2 + .01], '#d6dad5');
  } else if (item.kind === 'fridge') {
    block([w, 1.78, d], [0, .91, 0], '#d9ded8');
    box(asset, [w - .06, .01, .025], [0, .65, d / 2 + .01], '#7a877d');
    for (const y of [.51, 1.25]) box(asset, [.025, .28, .04], [-w * .32, y, d / 2 + .035], metal);
  } else {
    const height = item.height ?? (item.kind === 'counter' ? .86 : 2.25);
    const bodyHeight = height - (item.kind === 'counter' ? .04 : 0);
    block([w, bodyHeight, d], [0, bodyHeight / 2, 0], timber, 'cabinet');
    const count = Math.max(1, Math.round(w / .5));
    for (let i = 1; i < count; i++) box(asset, [.009, bodyHeight - .07, .012], [-w / 2 + w / count * i, bodyHeight / 2, d / 2 + .005], '#c4b597');
    if (item.kind === 'counter') block([w + .025, .04, d + .025], [0, height - .02, 0], '#d2d5ca');
  }
  const group = new THREE.Group(); group.name = item.id;
  asset.root.children.slice(start).forEach(child => group.add(child));
  group.position.set(item.x, .025, item.z); group.rotation.y = item.rotation;
  parent.add(group);
}

/** Model geometry comes from extracted CAD coordinates, with elevation assumptions in metadata. */
export function createCadApartment(data: CadApartment): SceneAsset {
  if (data.version !== 1 || data.units !== 'metres' || !data.walls.length || !data.floors.length) throw new Error('户型数据不完整，请重新提取 CAD。');
  const asset = makeAsset();
  asset.root.name = 'C108-CAD-apartment'; asset.root.userData = { ...data.metadata, units: 'metres' };
  const upperWalls = new THREE.Group(); upperWalls.name = '墙体剖切上部'; asset.root.add(upperWalls);
  asset.cutawayObjects = [upperWalls];
  for (const wall of data.walls) {
    const lower = addMesh(asset, solid(wall, .95), [0, .025, 0], '#eee7d9', 'walls');
    lower.name = `${wall.id}-lower`;
    const upper = addMesh(asset, solid(wall, (wall.height ?? data.wallHeight) - .95), [0, .975, 0], '#eee7d9', 'walls');
    upper.name = `${wall.id}-upper`; upperWalls.add(upper);
  }
  const floorMeshes: THREE.Mesh[] = [];
  for (const floor of data.floors) {
    const mesh = addMesh(asset, solid(floor, floor.tiled || floor.wood ? .012 : .1), [0, floor.tiled || floor.wood ? .026 : -.075, 0], floor.wood ? '#c4a47a' : '#c4c8c3', floor.wood ? 'wood-floor' : floor.tiled ? undefined : 'floor');
    mesh.name = floor.id; mesh.userData.textureRepeat = floor.wood ? [1, 1] : [1.66, 1.66]; mesh.userData.materialCode = floor.finishCode;
    floorMeshes.push(mesh);
  }
  for (const opening of data.openings) {
    const [ax, az] = opening.a, [bx, bz] = opening.b;
    const length = Math.hypot(bx - ax, bz - az);
    const group = new THREE.Group(); group.name = opening.id;
    const start = asset.root.children.length;
    const width = Math.max(.04, length);
    const at: [number, number, number] = [0, 0, 0];
    if (opening.kind === 'window') {
      box(asset, [width, opening.sill, opening.thickness], [0, opening.sill / 2, 0], '#eee7d9', 'walls');
      const pane = box(asset, [width - .06, opening.height, .025], [0, opening.sill + opening.height / 2, 0], '#9fbfc0');
      Object.assign(pane.material, { transparent: true, opacity: opening.dimensionStatus === 'unresolved' ? .10 : .26, depthWrite: false, roughness: .15 });
      pane.userData.dimensionStatus = opening.dimensionStatus;
      const frameHeight = opening.sill + opening.height / 2;
      for (const x of [-width / 2 + .025, 0, width / 2 - .025]) box(asset, [.04, opening.height + .06, .08], [x, frameHeight, 0], '#52605a');
      for (const y of [opening.sill, opening.sill + opening.height]) box(asset, [width, .04, .10], [0, y, 0], '#52605a');
    } else {
      // Preserve the measured opening; a short threshold shows its location without closing it.
      box(asset, [width, .022, opening.thickness], [0, .03, 0], '#b4aa92');
      for (const x of [-width / 2 + .02, width / 2 - .02]) box(asset, [.04, opening.height, opening.thickness + .015], [x, opening.height / 2, 0], '#9c876a', 'cabinet');
      if (opening.id.includes('推拉')) {
        for (const x of [-width / 4, width / 4]) {
          const leaf = box(asset, [width / 2 - .04, opening.height - .08, .025], [x, opening.height / 2, 0], '#abc9c4');
          Object.assign(leaf.material, { transparent: true, opacity: .17, depthWrite: false });
          box(asset, [.025, .28, .055], [x > 0 ? .035 : -.035, .95, .03], '#79867d');
        }
      } else if (!opening.id.includes('开口')) {
        const pivot = new THREE.Group(); pivot.position.x = -width / 2 + .03; pivot.rotation.y = -.85;
        const leaf = box(asset, [width - .06, opening.height - .04, .035], [(width - .06) / 2, opening.height / 2, 0], '#a68b6c', 'cabinet');
        const handle = box(asset, [.12, .025, .045], [width * .75, 1, .03], '#667167');
        pivot.add(leaf, handle); asset.root.add(pivot);
        pivot.userData.detailBasis = '门高及净宽按图；开启角度为展示设定';
      }
    }
    const head = opening.sill + opening.height;
    if (data.wallHeight > head) {
      const lintel = box(asset, [width, data.wallHeight - head, opening.thickness], [0, head + (data.wallHeight - head) / 2, 0], '#eee7d9', 'walls');
      const lintelGroup = new THREE.Group(); lintelGroup.add(lintel); lintelGroup.position.set((ax + bx) / 2, .025, (az + bz) / 2); lintelGroup.rotation.y = -Math.atan2(bz - az, bx - ax); upperWalls.add(lintelGroup);
    }
    // Include only opening components still attached directly to the root.
    asset.root.children.slice(start).forEach(child => { if (child !== upperWalls) group.add(child); });
    group.position.set((ax + bx) / 2, at[1] + .025, (az + bz) / 2);
    group.rotation.y = -Math.atan2(bz - az, bx - ax);
    asset.root.add(group);
  }
  const furniture = new THREE.Group(); furniture.name = '家具布置'; asset.root.add(furniture);
  data.furniture.forEach(item => furnishing(asset, item, furniture));
  const labels = new THREE.Group(); labels.name = '房间名称'; asset.root.add(labels);
  if (typeof document !== 'undefined') for (const room of data.rooms) {
    const canvas = document.createElement('canvas'); canvas.width = 384; canvas.height = 112;
    const context = canvas.getContext('2d');
    if (!context) continue;
    context.fillStyle = '#ffffffdf'; context.beginPath(); context.roundRect(3, 8, 378, 96, 24); context.fill();
    context.fillStyle = '#4a6656'; context.font = '500 64px "PingFang SC", sans-serif'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(room.name, 192, 56, 354);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
    sprite.scale.set(1.65, .48125, 1); sprite.position.set(room.at[0], 1.05, room.at[1]); sprite.renderOrder = 5; labels.add(sprite);
  }
  const lines = (paths: PlanPoint[][], color: string, elevation: number) => {
    const group = new THREE.Group();
    const positions: number[] = [];
    for (const path of paths) for (let i = 1; i < path.length; i++) positions.push(path[i - 1][0], elevation, path[i - 1][1], path[i][0], elevation, path[i][1]);
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const line = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: .85, depthTest: false }));
    line.renderOrder = 4; group.add(line); asset.root.add(group); return group;
  };
  asset.layers = { furniture, labels, drawing: lines(data.drawings.architecture, '#536b60', .06), ...createCadFinishes(asset, data, solid) };
  asset.xrayMeshes = [...(asset.surfaces.get('walls') ?? []), ...floorMeshes];
  if (data.services) Object.assign(asset.layers, createCadServices(asset, data.services));
  return asset;
}
