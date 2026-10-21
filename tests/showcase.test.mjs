import test from 'node:test';
import assert from 'node:assert/strict';
import { clients, finishes, getShowcase, products, validateCatalog } from '../src/catalog/catalog.ts';
import { decodePlan, defaultPlan, encodePlan, planStorageKey, readSavedPlan, sanitizePlan, savePlan } from '../src/features/sharing/plan.ts';
import { createInterior } from '../src/scenarios/interior/createInterior.ts';
import { createVehicle } from '../src/scenarios/vehicle-wrap/createVehicle.ts';
import { createPackaging } from '../src/scenarios/packaging/createPackaging.ts';

test('all configured clients, products and defaults reference valid catalog entries', () => {
  assert.doesNotThrow(validateCatalog);
  assert.deepEqual(new Set(products.map(product => product.industry)), new Set(['interior', 'vehicle-wrap', 'packaging', 'construction-site']));
  for (const client of clients) for (const id of client.productIds) assert.ok(getShowcase(client.id, id));
});

test('public route lookup enforces the client product allowlist', () => {
  assert.equal(getShowcase('interior-demo', 'sedan'), undefined);
  assert.equal(getShowcase('unknown', 'sedan'), undefined);
  assert.equal(getShowcase('wrap-demo', 'unknown'), undefined);
});

test('each procedural demonstration actually exposes its configured selectable meshes', () => {
  const builders = { interior: createInterior, 'vehicle-wrap': createVehicle, packaging: createPackaging };
  for (const product of products.filter(product => product.model.kind === 'procedural')) {
    const asset = builders[product.industry]();
    for (const surface of product.surfaces) {
      assert.ok(asset.surfaces.get(surface.id)?.length, `${product.id}/${surface.id} has no meshes`);
      for (const mesh of asset.surfaces.get(surface.id)) assert.equal(mesh.userData.surfaceId, surface.id);
    }
    assert.deepEqual([...asset.surfaces.keys()].sort(), product.surfaces.map(item => item.id).sort());
    asset.root.traverse(mesh => { if (mesh.isMesh) { mesh.geometry.dispose(); mesh.material.dispose(); } });
  }
});

test('a Unicode packaging plan survives URL serialization with its exact finishes', () => {
  const product = products.find(item => item.id === 'film-bucket');
  const plan = defaultPlan('packaging-demo', product);
  plan.label = '好生活 🌿'; plan.finishes.bucket = 'plastic-blue';
  assert.deepEqual(decodePlan(encodePlan(plan), 'packaging-demo', product), plan);
});

test('foreign customer/product plans are rejected and forged finish IDs are discarded', () => {
  const product = products[0];
  const plan = defaultPlan('interior-demo', product);
  assert.equal(sanitizePlan({ ...plan, clientId: 'wrap-demo' }, 'interior-demo', product), null);
  assert.equal(sanitizePlan({ ...plan, productId: 'sedan' }, 'interior-demo', product), null);
  const cleaned = sanitizePlan({ ...plan, finishes: { floor: 'film-black', walls: 'sage', malicious: 'unknown' } }, 'interior-demo', product);
  assert.equal(cleaned.finishes.floor, product.surfaces.find(surface => surface.id === 'floor').defaultFinishId); assert.equal(cleaned.finishes.walls, 'sage');
  assert.equal(Object.hasOwn(cleaned.finishes, 'malicious'), false);
  assert.ok(finishes.some(item => item.id === cleaned.finishes.floor));
});

test('malformed, oversized and unsupported-version share payloads fail safely', () => {
  const product = products[0];
  for (const value of [null, '%invalid', 'a'.repeat(8193), btoa('{"version":2}')]) assert.equal(decodePlan(value, 'interior-demo', product), null);
});

test('saving is scoped to client and product; storage failures do not crash the viewer', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map();
  try {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) } });
    const plan = defaultPlan('interior-demo', products[0]);
    assert.equal(savePlan(plan), true);
    assert.deepEqual(readSavedPlan('interior-demo', products[0]), plan);
    assert.equal(readSavedPlan('another-client', products[0]), null);
    values.set(planStorageKey('interior-demo', products[0].id), 'broken JSON');
    assert.equal(readSavedPlan('interior-demo', products[0]), null);
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } } });
    assert.equal(savePlan(plan), false); assert.equal(readSavedPlan('interior-demo', products[0]), null);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous); else delete globalThis.localStorage;
  }
});
