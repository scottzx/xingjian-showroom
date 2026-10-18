import type { CadServices, ServiceSystem, SpatialPoint } from './cadTypes.ts';

export interface MountAssessment {
  status: 'near-design-service' | 'unverified';
  point: SpatialPoint;
  candidates: { id: string; label: string; system: ServiceSystem; distance: number; uncertainHeight: boolean }[];
  message: string;
}
export type InspectionResult = { kind: 'service'; id: string; label: string; system: ServiceSystem; source: string[]; details: string; heightLabel: string }
  | { kind: 'mount'; assessment: MountAssessment }
  | { kind: 'instruction'; message: string };

export function distanceToSegment(p: SpatialPoint, a: SpatialPoint, b: SpatialPoint, planOnly = false) {
  const dimensions = planOnly ? [0, 2] : [0, 1, 2];
  let numerator = 0, denominator = 0;
  for (const i of dimensions) { numerator += (p[i] - a[i]) * (b[i] - a[i]); denominator += (b[i] - a[i]) ** 2; }
  const t = denominator ? Math.max(0, Math.min(1, numerator / denominator)) : 0;
  return Math.sqrt(dimensions.reduce((sum, i) => sum + (p[i] - a[i] - t * (b[i] - a[i])) ** 2, 0));
}

/** Absence of a modelled service never certifies a drilling position. */
export function assessMountPoint(services: CadServices | undefined, point: SpatialPoint): MountAssessment {
  if (!point.every(Number.isFinite)) throw new Error('核对位置坐标无效');
  const radius = services?.reviewRadius ?? .15;
  const candidates: MountAssessment['candidates'] = [];
  for (const device of services?.devices ?? []) {
    // No as-built conduit depth/route is supplied: do not clear a location by changing its height.
    const uncertainHeight = !device.routingKnown || !!device.planPositionUncertain;
    const distance = distanceToSegment(point, device.position, device.position, uncertainHeight);
    if (distance <= radius) candidates.push({ id: device.id, label: device.label, system: device.system, distance, uncertainHeight });
  }
  for (const route of services?.routes ?? []) {
    let distance = Infinity;
    for (let i = 1; i < route.points.length; i++) distance = Math.min(distance, distanceToSegment(point, route.points[i - 1], route.points[i], !route.heightKnown));
    if (distance <= radius) candidates.push({ id: route.id, label: route.label, system: route.system, distance, uncertainHeight: !route.heightKnown });
  }
  candidates.sort((a, b) => a.distance - b.distance);
  return {
    status: candidates.length ? 'near-design-service' : 'unverified', point, candidates: candidates.slice(0, 8),
    message: candidates.length
      ? '邻近 CAD 点位或示意路径。先避开并核对现场暗管；图中未标明的管段高度、埋深仍有不确定性。'
      : '此点未邻近已建模项，但 CAD 未覆盖的暗线、钢筋及施工变化仍未排除。不能据此认定可钻孔。',
  };
}
