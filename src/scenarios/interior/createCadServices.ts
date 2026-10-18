import * as THREE from 'three';
import type { SceneAsset } from '../sceneTypes.ts';
import type { CadServices, ServiceDevice, ServiceRoute, ServiceSystem, SpatialPoint } from './cadTypes.ts';

export const serviceColors: Record<ServiceSystem, string> = { electric: '#db9a27', 'cold-water': '#348cbb', 'hot-water': '#d45d54', drain: '#69738b' };

export function createCadServices(asset: SceneAsset, services: CadServices) {
  const electric = new THREE.Group(), plumbing = new THREE.Group(), risk = new THREE.Group();
  electric.name = '三维电气点位与连接示意'; plumbing.name = '三维冷热水与排水'; risk.name = '待核对带状范围';
  const parent = (system: ServiceSystem) => system === 'electric' ? electric : plumbing;
  const tag = (object: THREE.Object3D, item: ServiceDevice | ServiceRoute) => { object.name = item.id; object.userData.service = item; };
  const tube = (points: SpatialPoint[], system: ServiceSystem, item: ServiceDevice | ServiceRoute) => {
    if (points.length < 2) return;
    const curve = new THREE.CurvePath<THREE.Vector3>();
    for (let i = 1; i < points.length; i++) {
      if (new THREE.Vector3(...points[i]).distanceTo(new THREE.Vector3(...points[i - 1])) < .001) continue;
      curve.add(new THREE.LineCurve3(new THREE.Vector3(...points[i - 1]), new THREE.Vector3(...points[i])));
    }
    if (!curve.curves.length) return;
    const radius = system === 'drain' ? .027 : system === 'electric' ? .012 : .018;
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(4, points.length * 3), radius, 6, false), new THREE.MeshStandardMaterial({ color: serviceColors[system], transparent: true, opacity: .38, depthWrite: false, roughness: .6 }));
    tag(mesh, item); parent(system).add(mesh);
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p)));
    const dashed = new THREE.Line(geometry, new THREE.LineDashedMaterial({ color: serviceColors[system], dashSize: .10, gapSize: .07, depthTest: false, transparent: true, opacity: .9 }));
    dashed.computeLineDistances(); dashed.renderOrder = 7; tag(dashed, item); parent(system).add(dashed);
  };
  const band = (a: SpatialPoint, b: SpatialPoint, low: number, high: number) => {
    const length = Math.hypot(b[0] - a[0], b[2] - a[2]);
    if (length < .02) return;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(length, high - low, services.reviewRadius * 2), new THREE.MeshBasicMaterial({ color: '#d9a146', transparent: true, opacity: .035, depthWrite: false }));
    mesh.position.set((a[0] + b[0]) / 2, (high + low) / 2, (a[2] + b[2]) / 2);
    mesh.rotation.y = -Math.atan2(b[2] - a[2], b[0] - a[0]); mesh.userData.ignorePick = true; risk.add(mesh);
  };
  for (const item of services.routes) {
    tube(item.points, item.system, item);
    for (let i = 1; i < item.points.length; i++) band(item.points[i - 1], item.points[i], ...item.heightRange);
  }
  for (const item of services.devices) {
    const uncertain = item.evidenceKind === 'fixture-mapping';
    const material = new THREE.MeshStandardMaterial({ color: serviceColors[item.system], roughness: .4, metalness: .12, transparent: uncertain, opacity: uncertain ? .55 : 1 });
    const mesh = new THREE.Mesh(item.system === 'electric' ? new THREE.BoxGeometry(.09, .09, .045) : new THREE.SphereGeometry(.045, 12, 8), material);
    mesh.position.set(...item.position); if (item.heightBasis === 'bottom') mesh.position.y += .045;
    tag(mesh, item); parent(item.system).add(mesh);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.065, .008, 6, 20), new THREE.MeshBasicMaterial({ color: uncertain ? '#bd8b36' : serviceColors[item.system] }));
    ring.position.copy(mesh.position); ring.rotation.x = Math.PI / 2; tag(ring, item); parent(item.system).add(ring);
    // A dashed vertical extension explains the height without inventing an as-built riser.
    tube([[item.position[0], .04, item.position[2]], item.position], item.system, item);
    const top = Math.max(2.42, item.position[1] + .15), bottom = -.35;
    const column = new THREE.Mesh(new THREE.CylinderGeometry(services.reviewRadius, services.reviewRadius, top - bottom, 10), new THREE.MeshBasicMaterial({ color: '#d9a146', transparent: true, opacity: .045, depthWrite: false }));
    column.position.set(item.position[0], (top + bottom) / 2, item.position[2]); column.userData.ignorePick = true; risk.add(column);
  }
  for (const group of [electric, plumbing, risk]) { group.position.y = .025; asset.root.add(group); }
  asset.services = services;
  return { electrical: electric, plumbing, risk };
}
