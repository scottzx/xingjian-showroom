export type Point3 = [number, number, number];

export interface SiteFacility {
  id: string;
  nameZh: string;
  nameOriginal: string;
  nameEn: string;
  source: { file: string; layout: string; layer: string; footprintHandle: string; nameTextHandle: string; areaTextHandle: string; sourceHash: string };
  cadPoints: Point3[];
  localMetersPoints: [number, number][];
  worldPoints: Point3[];
  adoptedDimensionsMeters: { width: number; depth: number; area: number };
  sourceAreaText: string;
  scaleStatus: string;
  dimensionVerified: false;
  actualHeight: null;
  heightKnown: false;
  heightBasis: 'illustration';
  actualHeightBasis: 'unresolved';
  displayHeight: number;
  representation: 'flat-zone' | 'generic-mass';
  displayHeightNote: string;
  displayColor: string;
  unknowns: string[];
}

export interface ConstructionSite {
  schemaVersion: 1;
  id: 'construction-site';
  version: string;
  title: string;
  scope: string;
  source: { file: string; sha256: string; url: string; repositoryCommit: string; INSUNITS: number; titleScale: string; license: string; [key: string]: unknown };
  transform: { originCad: Point3; metersPerCadUnit: number; displayCenterOffsetMeters: Point3; status: string; independentDimensionControls: number; [key: string]: unknown };
  site: { sourceHandle: string; cadPoints: Point3[]; localMetersPoints: [number, number][]; worldPoints: Point3[]; adoptedDimensionsMeters: [number, number] };
  facilities: SiteFacility[];
  warnings: string[];
  unknowns: { id: string; field: string; status: string; restriction: string }[];
  [key: string]: unknown;
}
