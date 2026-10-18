import test from 'node:test';
import assert from 'node:assert/strict';
import { assessMountPoint, distanceToSegment } from '../src/scenarios/interior/mountAssessment.ts';
const data = { services: { siteVerified: false, devices: [], routes: [] } };

test('unknown route height cannot be cleared by moving a mounting point vertically', () => {
  const services = { ...data.services, devices: [], routes: [{ id: 'unknown', label: '未知标高管段', system: 'cold-water', points: [[0, 0, 0], [2, 0, 0]], heightKnown: false, heightRange: [-.35, 2.42] }] };
  for (const height of [.2, 1.2, 2.4]) {
    const result = assessMountPoint(services, [1, height, .1]);
    assert.equal(result.status, 'near-design-service'); assert.equal(result.candidates[0].uncertainHeight, true);
    assert.ok(Math.abs(result.candidates[0].distance - .1) < .0001);
  }
});

test('missing or distant modelled services never produce a safe drilling result', () => {
  for (const services of [undefined, { ...data.services, devices: [], routes: [] }, data.services]) {
    const result = assessMountPoint(services, [50, 1, 50]);
    assert.equal(result.status, 'unverified'); assert.match(result.message, /不能据此认定可钻孔/);
  }
  assert.throws(() => assessMountPoint(data.services, [NaN, 1, 0]), /坐标无效/);
});

test('segment distance checks endpoints and degenerate segments correctly', () => {
  assert.equal(distanceToSegment([3, 0, 0], [0, 0, 0], [2, 0, 0]), 1);
  assert.equal(distanceToSegment([0, 5, 0], [0, 0, 0], [0, 0, 0], true), 0);
  assert.equal(distanceToSegment([0, 5, 0], [0, 0, 0], [0, 0, 0]), 5);
});
