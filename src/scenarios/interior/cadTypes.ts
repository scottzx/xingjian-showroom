export type PlanPoint = [number, number];
export interface CadPolygon { id: string; outline: PlanPoint[]; holes?: PlanPoint[][]; height?: number }
export interface CadFloor extends CadPolygon { room?: string; tiled?: boolean; wood?: boolean; cellSize?: number; finishCode?: string }
export interface CadOpening {
  id: string; kind: 'door' | 'window'; a: PlanPoint; b: PlanPoint;
  thickness: number; sill: number; height: number;
  dimensionStatus?: 'dimension' | 'geometry' | 'unresolved'; source?: string; frameWidth?: number;
}
export interface CadFurniture {
  id: string; kind: 'bed' | 'sofa' | 'table' | 'round-table' | 'coffee-table' | 'chair' | 'cabinet' | 'counter' | 'toilet' | 'basin' | 'shower' | 'washing-machine' | 'fridge';
  x: number; z: number; width: number; depth: number; rotation: number;
  height?: number; heightBasis?: string;
}
export type ServiceSystem = 'electric' | 'cold-water' | 'hot-water' | 'drain';
export type SpatialPoint = [number, number, number];
export interface ServiceDevice {
  id: string; system: ServiceSystem; label: string; position: SpatialPoint;
  heightKnown: boolean; heightBasis: string; evidenceKind: string; source: string[]; details: string;
  routingKnown: boolean; planPositionUncertain?: boolean;
}
export interface ServiceRoute {
  id: string; system: ServiceSystem; label: string; points: SpatialPoint[];
  heightKnown: boolean; heightRange: [number, number]; positionKind: string; source: string[]; details: string;
}
export interface CadServices {
  devices: ServiceDevice[]; routes: ServiceRoute[]; basis: 'CAD-design'; siteVerified: false;
  reviewRadius: number; note: string; systemLevels: { label: string; source: string }[];
}
export interface CadDecorations {
  tileLines: PlanPoint[][];
  skirting: { a: PlanPoint; b: PlanPoint; height: number; source: string }[];
  wallTiles: { a: PlanPoint; b: PlanPoint; height: number; room: string; source: string }[];
  ceilings: (CadPolygon & { height: number; materialCode: string; source: string })[];
  boxes: { id: string; size: SpatialPoint; position: SpatialPoint; color: string; source: string }[];
}
export interface DimensionAudit { id: string; label: string; value: number | number[] | null; basis: string; source: string }
export interface CadApartment {
  version: 1;
  units: 'metres';
  wallHeight: number;
  walls: CadPolygon[];
  floors: CadFloor[];
  openings: CadOpening[];
  furniture: CadFurniture[];
  rooms: { name: string; at: PlanPoint }[];
  drawings: { architecture: PlanPoint[][]; electrical: PlanPoint[][]; plumbing: PlanPoint[][] };
  metadata: Record<string, unknown>;
  services?: CadServices;
  decorations?: CadDecorations;
  dimensionAudit?: DimensionAudit[];
}
