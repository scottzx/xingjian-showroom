import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Box3 } from 'three';
import { products, clients, industries, getShowcase } from '../src/catalog/catalog.ts';
import { publicAssetUrl } from '../src/utils/publicAssetUrl.ts';
import { createCadApartment } from '../src/scenarios/interior/createCadApartment.ts';
import { createConstructionSite } from '../src/scenarios/construction-site/createConstructionSite.ts';
import { auditConstructionSite } from '../src/scenarios/construction-site/auditConstructionSite.ts';
import { createConstructionCad } from '../src/scenarios/construction-cad/createConstructionCad.ts';
import { auditConstructionCad } from '../src/scenarios/construction-cad/auditConstructionCad.ts';

const asset = path => new URL(`../public/models/${path}`, import.meta.url);
const json = path => JSON.parse(readFileSync(asset(path)));

test('public assets resolve at the domain root, Pages subdirectory and portable base', () => {
  assert.equal(publicAssetUrl('/models/c108/apartment.json', '/'), '/models/c108/apartment.json');
  assert.equal(publicAssetUrl('/models/c108/apartment.json', '/xingjian-showroom/'), '/xingjian-showroom/models/c108/apartment.json');
  assert.equal(publicAssetUrl('/models/c108/apartment.glb', './'), './models/c108/apartment.glb');
  assert.equal(publicAssetUrl('models/construction-site/site.json', '/preview'), '/preview/models/construction-site/site.json');
});

test('all six scenes are reachable through the four industry client catalogs', () => {
  assert.deepEqual(products.map(product => product.id), ['c108', 'living-room', 'sedan', 'film-bucket', 'construction-site', 'ifg-classroom']);
  const displayed = industries.flatMap(industry => clients.find(client => client.id === industry.clientId).productIds);
  assert.equal(displayed.length, 6);
  assert.equal(new Set(displayed).size, 6);
  for (const client of clients) for (const id of client.productIds) assert.equal(getShowcase(client.id, id).product.id, id);
});

test('the release includes all three CAD datasets and four valid binary glTF exports', () => {
  for (const path of ['c108/apartment.json', 'construction-site/site.json', 'construction-cad/ifg-classroom/model.json']) assert.ok(json(path));
  for (const path of ['c108/apartment.glb', 'c108/apartment-services.glb', 'construction-site/site.glb', 'construction-cad/ifg-classroom/building.glb']) {
    const bytes = readFileSync(asset(path));
    assert.equal(bytes.toString('ascii', 0, 4), 'glTF', path);
    assert.equal(bytes.readUInt32LE(4), 2, path);
    assert.equal(bytes.readUInt32LE(8), bytes.length, path);
    const document = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)));
    assert.ok(document.meshes.length > 0, path);
  }
});

test('the bundled C108 data produces finite metre-scale apartment geometry', () => {
  const scene = createCadApartment(json('c108/apartment.json'));
  const bounds = new Box3().setFromObject(scene.root);
  assert.ok([...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite));
  assert.ok(bounds.max.x - bounds.min.x > 8);
  assert.ok(bounds.max.z - bounds.min.z > 14);
});

test('the bundled construction site retains six provisional footprints and unknown heights', () => {
  const data = json('construction-site/site.json');
  const report = auditConstructionSite(createConstructionSite(data).root, data);
  assert.equal(report.facilityCount, 6);
  assert.equal(report.unknownHeightMetadataRetained, true);
});

test('the bundled IFG building retains two levels and its audited opening geometry', () => {
  const data = json('construction-cad/ifg-classroom/model.json');
  const report = auditConstructionCad(createConstructionCad(data).root, data);
  assert.equal(data.levels.length, 2);
  assert.equal(report.status, 'pass', JSON.stringify(report.issues));
  assert.equal(report.openingCutRays, 167);
});
