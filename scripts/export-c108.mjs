import { readFileSync, writeFileSync } from 'node:fs';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { MeshBasicMaterial } from 'three';
import { createCadApartment } from '../src/scenarios/interior/createCadApartment.ts';
import { products, finishes } from '../src/catalog/catalog.ts';

// The Three.js exporter uses the browser FileReader API for its final binary blob.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(result => { this.result = result; this.onloadend?.(); });
  }
};

const directory = new URL('../public/models/c108/', import.meta.url);
const data = JSON.parse(readFileSync(new URL('apartment.json', directory)));
const asset = createCadApartment(data);
// glTF line primitives use an unlit material; preserve grout colour and opacity.
asset.root.traverse(object => {
  if (object.isLine && object.material.isLineBasicMaterial) {
    const original = object.material;
    object.material = new MeshBasicMaterial({ color: original.color, transparent: original.transparent, opacity: original.opacity });
    original.dispose();
  }
});
for (const [name, group] of Object.entries(asset.layers)) group.visible = name === 'furniture' || name === 'finishes';
const product = products.find(p => p.id === 'c108');
for (const definition of product.surfaces) {
  const finish = finishes.find(f => f.id === definition.defaultFinishId);
  for (const mesh of asset.surfaces.get(definition.id) ?? []) {
    mesh.material.color.set(finish.color);
    mesh.material.roughness = finish.roughness;
    mesh.material.metalness = finish.metalness;
  }
}
asset.root.updateMatrixWorld(true);
const bytes = await new GLTFExporter().parseAsync(asset.root, { binary: true, onlyVisible: true });
const buffer = Buffer.from(bytes);
if (buffer.readUInt32LE(0) !== 0x46546c67 || buffer.readUInt32LE(4) !== 2 || buffer.readUInt32LE(8) !== buffer.length) throw new Error('Invalid GLB output');
const document = JSON.parse(buffer.subarray(20, 20 + buffer.readUInt32LE(12)).toString('utf8').trim());
if (!document.meshes?.length || !document.scenes?.length) throw new Error('GLB is missing its model');
writeFileSync(new URL('apartment.glb', directory), buffer);
console.log(`C108 GLB exported: ${buffer.length} bytes, ${document.meshes.length} meshes, metre coordinates.`);

for (const name of ['electrical', 'plumbing']) asset.layers[name].visible = true;
// glTF has no dashed-line material: tubes retain uncertainty metadata and translucency.
for (const name of ['electrical', 'plumbing']) asset.layers[name].traverse(object => { if (object.isLine) object.visible = false; });
const serviceBytes = Buffer.from(await new GLTFExporter().parseAsync(asset.root, { binary: true, onlyVisible: true }));
if (serviceBytes.readUInt32LE(0) !== 0x46546c67 || serviceBytes.readUInt32LE(8) !== serviceBytes.length) throw new Error('Invalid service GLB output');
writeFileSync(new URL('apartment-services.glb', directory), serviceBytes);
console.log(`C108 services GLB exported: ${serviceBytes.length} bytes. Design-only metadata retained.`);
