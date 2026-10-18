import { Group, Mesh } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { ProductDefinition } from '../catalog/types.ts';
import type { SceneAsset } from './sceneTypes.ts';
import { createInterior } from './interior/createInterior.ts';
import { createVehicle } from './vehicle-wrap/createVehicle.ts';
import { createPackaging } from './packaging/createPackaging.ts';
import { createCadApartment } from './interior/createCadApartment.ts';
import type { CadApartment } from './interior/cadTypes.ts';
import { createConstructionSite } from './construction-site/createConstructionSite.ts';
import type { ConstructionSite } from './construction-site/types.ts';

import { createConstructionCad, loadConstructionCadData } from './construction-cad/createConstructionCad.ts';

const builders = { interior: createInterior, 'vehicle-wrap': createVehicle, packaging: createPackaging };

export async function loadSceneAsset(product: ProductDefinition): Promise<SceneAsset> {
  if (product.model.kind === 'construction-cad') return createConstructionCad(await loadConstructionCadData(product.model.url));
  if (product.model.kind === 'procedural') return builders[product.model.builder]();
  if (product.model.kind === 'construction-site') {
    const response = await fetch(product.model.url);
    if (!response.ok) throw new Error('施工场地样例数据加载失败，请重试。');
    return createConstructionSite(await response.json() as ConstructionSite);
  }
  if (product.model.kind === 'cad') {
    const response = await fetch(product.model.url);
    if (!response.ok) throw new Error('户型数据加载失败，请检查文件后重试。');
    return createCadApartment(await response.json() as CadApartment);
  }
  const gltf = await new GLTFLoader().loadAsync(product.model.url);
  const root = new Group();
  root.add(gltf.scene);
  root.scale.setScalar(product.model.scale ?? 1);
  if (product.model.rotation) root.rotation.set(...product.model.rotation);
  const surfaces = new Map<string, Mesh[]>();
  root.traverse(object => {
    if (!(object instanceof Mesh)) return;
    object.castShadow = true; object.receiveShadow = true;
    const surface = product.surfaces.find(item => item.id === object.userData.surfaceId || item.nodeNames?.includes(object.name));
    if (surface) {
      object.userData.surfaceId = surface.id;
      surfaces.set(surface.id, [...(surfaces.get(surface.id) ?? []), object]);
    }
  });
  return { root, surfaces };
}
