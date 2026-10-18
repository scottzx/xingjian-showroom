import type { Group, Mesh } from 'three';
import type { CadServices } from './interior/cadTypes.ts';

export type SceneLayer = 'drawing' | 'electrical' | 'plumbing' | 'furniture' | 'labels' | 'ceiling' | 'finishes' | 'risk';
export type LayerVisibility = Partial<Record<SceneLayer, boolean>>;

export interface SceneAsset {
  root: Group;
  surfaces: Map<string, Mesh[]>;
  cutawayObjects?: Group[];
  levelGroups?: Record<string, Group>;
  layers?: Partial<Record<SceneLayer, Group>>;
  services?: CadServices;
  xrayMeshes?: Mesh[];
}
