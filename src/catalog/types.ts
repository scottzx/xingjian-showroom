export type IndustryId = 'interior' | 'vehicle-wrap' | 'packaging' | 'construction-site';
export type VectorTuple = [number, number, number];

export interface Finish {
  id: string;
  name: string;
  detail: string;
  color: string;
  roughness: number;
  metalness: number;
  pattern?: 'wood' | 'stone' | 'label';
  clearcoat?: number;
}

export interface SurfaceDefinition {
  id: string;
  name: string;
  description: string;
  finishIds: string[];
  defaultFinishId: string;
  /** GLB mesh names, or surfaceId stored in the mesh's glTF extras. */
  nodeNames?: string[];
}

export interface ProductDefinition {
  id: string;
  industry: IndustryId;
  name: string;
  subtitle: string;
  description: string;
  model: { kind: 'procedural'; builder: Exclude<IndustryId, 'construction-site'> } | {
    kind: 'glb'; url: string; scale?: number; rotation?: VectorTuple;
  } | { kind: 'cad'; url: string } | { kind: 'construction-site'; url: string } | { kind: 'construction-cad'; url: string };
  surfaces: SurfaceDefinition[];
  camera: { position: VectorTuple; target: VectorTuple; minDistance: number; maxDistance: number };
  features: { cutaway?: boolean; label?: boolean };
  defaultLabel?: string;
  demo: boolean;
}

export interface ClientDefinition {
  id: string;
  name: string;
  initials: string;
  tagline: string;
  accent: string;
  productIds: string[];
  contact?: { label: string; url: string };
}

export interface ShowcasePlan {
  version: 1;
  clientId: string;
  productId: string;
  finishes: Record<string, string>;
  label: string;
}
