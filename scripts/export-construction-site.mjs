import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshBasicMaterial } from 'three';
import { createConstructionSite } from '../src/scenarios/construction-site/createConstructionSite.ts';
import { auditConstructionSite } from '../src/scenarios/construction-site/auditConstructionSite.ts';
import { products, finishes } from '../src/catalog/catalog.ts';

// No textures or external resources. Only emulate the exporter's Blob reader.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(result => { this.result = result; this.onloadend?.(); }, error => this.onerror?.(error));
  }
};
const directory = new URL('../public/models/construction-site/', import.meta.url);
const output = new URL('../../../artifacts/workflows/construction-site-20261017-01/model/attempt-1/', import.meta.url);
const data = JSON.parse(readFileSync(new URL('site.json', directory)));
const asset = createConstructionSite(data);
const product = products.find(p => p.id === 'construction-site');
for (const definition of product.surfaces) {
  const finish = finishes.find(f => f.id === definition.defaultFinishId);
  for (const mesh of asset.surfaces.get(definition.id)) {
    mesh.material.color.set(finish.color);
    mesh.material.roughness = finish.roughness;
    mesh.material.metalness = finish.metalness;
  }
}
// glTF line primitives use unlit materials. Retain source metadata on the line.
asset.root.traverse(object => {
  if (object.isLine) {
    const old = object.material;
    object.material = new MeshBasicMaterial({ color: old.color }); old.dispose();
  }
});
const before = auditConstructionSite(asset.root, data);
const bytes = Buffer.from(await new GLTFExporter().parseAsync(asset.root, { binary: true, onlyVisible: true }));
const glbPath = new URL('site.glb', directory);
writeFileSync(glbPath, bytes);
// Read from disk and actually rebuild buffer geometry through GLTFLoader.
const disk = readFileSync(glbPath);
const reloaded = await new GLTFLoader().parseAsync(disk.buffer.slice(disk.byteOffset, disk.byteOffset + disk.byteLength), '');
const after = auditConstructionSite(reloaded.scene, data);
const report = {
  status: 'pass', reloadedWith: 'three/GLTFLoader.parseAsync', readBackFromDisk: true,
  externalResources: false, sizeBytes: disk.length, sha256: createHash('sha256').update(disk).digest('hex'),
  before, after,
};
writeFileSync(new URL('glb-reload-checks.json', output), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
