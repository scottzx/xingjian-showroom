export type Point2 = [number, number];
export interface CadPolygon { outline: Point2[]; holes: Point2[][] }
export interface CadElement extends CadPolygon {
  id: string; levelId: string; kind: 'wall' | 'floor-display' | 'room' | 'stair'; y0: number; y1: number;
  sourceRefs: string[]; basis: string; unknown: string[]; [key: string]: unknown;
}
export interface CadOpening {
  id: string; levelId: string; tag: string; status: string; height: number; sill: number; width: number;
  footprint: CadPolygon | null; axis?: Point2[]; depth?: number; sourceRefs: string[];
  sourceLeafIds: string[]; sillY?: number; headY?: number; [key: string]: unknown;
}
export interface CadLevel {
  id: string; name: string; ff: number; clearHeight: number; adoption: string; conflicts: string[];
  cadToLocal: { origin: Point2; registrationTranslation: Point2; formula: string };
  voids: { id: string; polygon: Point2[]; [key: string]: unknown }[];
  planarUnknown: { id: string; points: Point2[]; closed: boolean; reason: string }[];
  constructionBand: Record<string, unknown>;
}
export interface ConstructionCadModel {
  schemaVersion: number; id: string; revision: string; units: string; upAxis: string;
  source: { name: string; sha256: string; inputSha256: string; url: string; siteVerified: boolean; [key: string]: unknown };
  coordinateSystem: unknown; levels: CadLevel[]; elements: CadElement[]; openings: CadOpening[];
  sourceIndex: Record<string, Record<string, unknown>>; issues: string[];
  coverageSummary: Record<string, number>; displaySettings: Record<string, unknown>;
}
export function cadToWorld(point: Point2, elevation: number, level: CadLevel): [number, number, number] {
  return [point[0] + level.cadToLocal.registrationTranslation[0] - level.cadToLocal.origin[0], elevation,
    -(point[1] + level.cadToLocal.registrationTranslation[1] - level.cadToLocal.origin[1])];
}
export function worldToCad(point: [number, number, number], level: CadLevel): Point2 {
  return [point[0] + level.cadToLocal.origin[0] - level.cadToLocal.registrationTranslation[0],
    -point[2] + level.cadToLocal.origin[1] - level.cadToLocal.registrationTranslation[1]];
}
