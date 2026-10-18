import { Box3, Mesh, Vector3 } from 'three';
import type { BufferAttribute, InterleavedBufferAttribute, Object3D } from 'three';
import type { ConstructionSite } from './types.ts';

/** Numerical audit of the actual scene, also run after GLTFLoader parses the GLB. */
export function auditConstructionSite(scene: Object3D, data: ConstructionSite) {
  const check = (value: boolean, message: string) => { if (!value) throw new Error(message); };
  const near = (a: number, b: number) => Math.abs(a - b) < 1e-4;
  scene.updateMatrixWorld(true);
  let metadata: Record<string, unknown> | undefined;
  const facilities = new Map<string, Mesh>();
  let meshCount = 0, lineCount = 0, vertexCount = 0;
  scene.traverse(object => {
    if (object.userData.id === 'construction-site') metadata = object.userData;
    if ('isLine' in object && object.isLine) lineCount++;
    if (!(object instanceof Mesh)) return;
    meshCount++;
    for (const attribute of Object.values(object.geometry.attributes) as (BufferAttribute | InterleavedBufferAttribute)[]) {
      check(Array.from(attribute.array).every(Number.isFinite), `Non-finite geometry: ${object.name}`);
    }
    vertexCount += object.geometry.getAttribute('position').count;
    if (object.userData.surfaceId) {
      check(!facilities.has(object.userData.surfaceId), 'Duplicate facility mesh');
      facilities.set(object.userData.surfaceId, object);
    }
  });
  check(!!metadata, 'Missing root metadata');
  check(metadata!.units === 'm' && metadata!.upAxis === 'Y', 'Wrong units/up axis');
  check(JSON.stringify(metadata!.transform) === JSON.stringify(data.transform), 'Lost reversible transform');
  check(JSON.stringify(metadata!.source) === JSON.stringify(data.source), 'Lost source/version metadata');
  check(metadata!.actualHeight === null && metadata!.heightKnown === false, 'Unknown height overwritten');
  check(meshCount === 7 && lineCount === 1 && facilities.size === 6, 'Expected six footprints, one display plane, one boundary line');
  const reports = data.facilities.map(facility => {
    const mesh = facilities.get(facility.id);
    check(!!mesh, `Missing ${facility.id}`);
    const box = new Box3().setFromObject(mesh!);
    const size = box.getSize(new Vector3());
    const xs = facility.worldPoints.map(p => p[0]), zs = facility.worldPoints.map(p => p[2]);
    check(near(size.x, facility.adoptedDimensionsMeters.width) && near(size.z, facility.adoptedDimensionsMeters.depth), `Footprint scale mismatch ${facility.id}`);
    check(near(box.min.x, Math.min(...xs)) && near(box.max.x, Math.max(...xs)) && near(box.min.z, Math.min(...zs)) && near(box.max.z, Math.max(...zs)), `Footprint position mismatch ${facility.id}`);
    check(near(box.min.y, 0) && near(box.max.y, facility.displayHeight), `Display height mismatch ${facility.id}`);
    check(mesh!.userData.actualHeight === null && mesh!.userData.heightKnown === false && mesh!.userData.heightBasis === 'illustration', `Lost unknowns ${facility.id}`);
    check(JSON.stringify(mesh!.userData.source) === JSON.stringify(facility.source), `Lost source handles ${facility.id}`);
    check(JSON.stringify(mesh!.userData.cadPoints) === JSON.stringify(facility.cadPoints), `Lost raw coordinates ${facility.id}`);
    for (let i = 0; i < facility.cadPoints.length; i++) {
      const cad = facility.cadPoints[i], world = facility.worldPoints[i];
      check(near((world[0] + 40) / data.transform.metersPerCadUnit + 10, cad[0]) && near((40 - world[2]) / data.transform.metersPerCadUnit + 10, cad[1]), `Inverse transform mismatch ${facility.id}`);
    }
    return { id: facility.id, sourceHandle: facility.source.footprintHandle, bounds: { min: box.min.toArray(), max: box.max.toArray() }, actualHeight: null, heightKnown: false, displayHeight: size.y };
  });
  const bounds = new Box3().setFromObject(scene);
  check(near(bounds.min.x, -40) && near(bounds.max.x, 40) && near(bounds.min.z, -40) && near(bounds.max.z, 40), 'Site boundary scale/origin mismatch');
  return { status: 'pass', scope: 'scene/data consistency; metric dimensions remain provisional', meshCount, lineCount, facilityCount: facilities.size, vertexCount, finiteCoordinates: true, units: 'm', upAxis: 'Y', sourceHash: data.source.sha256, bounds: { min: bounds.min.toArray(), max: bounds.max.toArray() }, facilities: reports, unknownHeightMetadataRetained: true, reversibleTransformRetained: true };
}
