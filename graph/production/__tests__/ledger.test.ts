import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { digest, hashFile, KlingLedger, type KlingAuthorization, type KlingBudget, type KlingOperation } from '../lib/firefly/ledger';

type Reservation = Parameters<KlingLedger['reserve']>[1];
type LedgerExport = { schema: string; authorizations: KlingAuthorization[]; operations: KlingOperation[] };
const directory = () => fs.mkdtempSync(path.join(os.tmpdir(), 'hsl-ledger-test-'));
function budget(ids: string[], limit = ids.length, planHash = digest('fixture plan')): KlingBudget {
  return { kind: 'KLING_BUDGET', model: 'Kling 2.5 Turbo', planHash, scopeHash: digest([planHash, ids]),
    videoBeats: ids.length, totalTakes: ids.length, reusableTakes: ids.length - limit, requiredGenerations: limit, operationIds: ids };
}
function operation(root: string, id: string, b: KlingBudget): Reservation {
  return { id, planHash: b.planHash, recipeHash: digest(['fixture recipe', id]), inputHash: digest(['fixture bytes', id]), outputPath: path.join(root, id + '.mp4') };
}

test('reservation and authorization survive close/reopen; duplicate reserve does not consume the limit', () => {
  const root = directory(), b = budget(['one', 'two'], 1), input = operation(root, 'one', b);
  let ledger = new KlingLedger(root);
  const authorization = ledger.authorize(b, 'cli-limit');
  const first = ledger.reserve(authorization, input);
  assert.equal(first.created, true);
  assert.equal(first.operation.phase, 'reserved');
  ledger.close();
  ledger = new KlingLedger(root);
  try {
    assert.deepEqual(ledger.authorization(b.scopeHash), authorization);
    assert.deepEqual(ledger.authorize(b, 'interactive'), authorization);
    assert.deepEqual(ledger.reserve(authorization, input), { operation: first.operation, created: false });
    assert.equal(ledger.count(), 1);
    assert.throws(() => ledger.reserve(authorization, operation(root, 'two', b)), /MAX_GENERATIONS_EXCEEDED/);
    assert.equal(ledger.operation('two'), undefined);
    assert.equal(ledger.count(), 1);
  } finally { ledger.close(); }
});

test('process death after committed reservation and before checkpoint leaves a durable reserved operation', () => {
  const root = directory(), b = budget(['interrupted']), input = operation(root, 'interrupted', b);
  const child = spawnSync(process.execPath, ['-r', require.resolve('ts-node/register/transpile-only'), '-e', `
    const data = JSON.parse(process.env.HSL_LEDGER_TEST_FIXTURE);
    const {KlingLedger} = require(data.modulePath);
    const ledger = new KlingLedger(data.root);
    const auth = ledger.authorize(data.budget, 'cli-limit');
    if (!ledger.reserve(auth, data.operation).created) process.exit(74);
    // Simulate loss before graph checkpoint/ledger.close(), without any provider call.
    process.exit(73);
  `], { encoding: 'utf8', windowsHide: true, timeout: 20000,
    env: { ...process.env, HSL_LEDGER_TEST_FIXTURE: JSON.stringify({ root, budget: b, operation: input, modulePath: require.resolve('../lib/firefly/ledger') }) } });
  assert.equal(child.error, undefined);
  assert.equal(child.status, 73, child.stderr);
  const ledger = new KlingLedger(root);
  try {
    const authorization = ledger.authorization(b.scopeHash)!;
    assert.ok(authorization);
    assert.equal(ledger.count(), 1);
    assert.equal(ledger.operation(input.id)?.phase, 'reserved');
    assert.equal(ledger.reserve(authorization, input).created, false);
    assert.equal(ledger.count(), 1);
  } finally { ledger.close(); }
});

test('scope, plan, identity and allowed-operation mismatches fail without spending a reservation', () => {
  const root = directory(), ledger = new KlingLedger(root), b = budget(['one']), input = operation(root, 'one', b);
  try {
    const authorization = ledger.authorize(b, 'interactive');
    for (const changed of [{ ...authorization, scopeHash: 'unknown-scope' }, { ...authorization, id: 'unknown-authorization' }]) {
      assert.throws(() => ledger.reserve(changed, input), /KLING_AUTHORIZATION_SCOPE_MISMATCH/);
    }
    assert.throws(() => ledger.reserve(authorization, { ...input, planHash: digest('other plan') }), /KLING_AUTHORIZATION_SCOPE_MISMATCH/);
    assert.throws(() => ledger.reserve({ ...authorization, operationIds: ['foreign'], limit: 1000 }, { ...input, id: 'foreign' }), /KLING_AUTHORIZATION_SCOPE_MISMATCH/);
    assert.equal(ledger.count(), 0);
    assert.equal(ledger.reserve(authorization, input).created, true);
    assert.equal(ledger.count(), 1);
  } finally { ledger.close(); }
});

test('an operation ID from another plan cannot borrow its reservation through a second authorization', () => {
  const root = directory(), ledger = new KlingLedger(root), originalBudget = budget(['shared']);
  try {
    const original = operation(root, 'shared', originalBudget);
    const first = ledger.reserve(ledger.authorize(originalBudget, 'cli-limit'), original);
    const changedBudget = budget(['shared'], 1, digest('changed plan'));
    const changedAuthorization = ledger.authorize(changedBudget, 'cli-limit');
    assert.throws(() => ledger.reserve(changedAuthorization, { ...original, planHash: changedBudget.planHash }), /KLING_AUTHORIZATION_SCOPE_MISMATCH/);
    const samePlanOtherScope = budget(['shared', 'other']);
    assert.throws(() => ledger.reserve(ledger.authorize(samePlanOtherScope, 'cli-limit'), original), /KLING_AUTHORIZATION_SCOPE_MISMATCH/);
    assert.deepEqual(ledger.operation('shared'), first.operation);
    assert.equal(ledger.count(), 1);
  } finally { ledger.close(); }
});

test('same filename and byte length with changed image contents invalidates reservation input', () => {
  const root = directory(), ledger = new KlingLedger(root), b = budget(['image-change']);
  const file = path.join(root, 'approved-frame.png');
  try {
    // Byte fixtures exercise hashing only; these are not generated media assets.
    fs.writeFileSync(file, 'fixture image A');
    const originalHash = hashFile(file), originalSize = fs.statSync(file).size;
    const input = { ...operation(root, 'image-change', b), inputHash: originalHash };
    const authorization = ledger.authorize(b, 'cli-limit');
    const reserved = ledger.reserve(authorization, input).operation;
    fs.writeFileSync(file, 'fixture image B');
    const changedHash = hashFile(file);
    assert.equal(fs.statSync(file).size, originalSize);
    assert.notEqual(changedHash, originalHash);
    assert.throws(() => ledger.reserve(authorization, { ...input, inputHash: changedHash }), /KLING_OPERATION_INPUT_CHANGED/);
    assert.throws(() => ledger.reserve(authorization, { ...input, recipeHash: digest('changed prompt') }), /KLING_OPERATION_INPUT_CHANGED/);
    assert.throws(() => ledger.reserve(authorization, { ...input, outputPath: path.join(root, 'another-output.mp4') }), /KLING_OPERATION_INPUT_CHANGED/);
    assert.deepEqual(ledger.operation(input.id), reserved);
    assert.equal(ledger.count(), 1);
  } finally { ledger.close(); }
});

test('uncertain submission stays spent across resume; validation is durable and cannot regress', () => {
  const root = directory(), b = budget(['one', 'two'], 1), input = operation(root, 'one', b);
  let ledger = new KlingLedger(root);
  const authorization = ledger.authorize(b, 'cli-limit');
  ledger.reserve(authorization, input);
  ledger.update(input.id, { phase: 'submitted' });
  const uncertain = ledger.update(input.id, { phase: 'uncertain', error: 'Provider response lost before checkpoint' });
  ledger.close();
  ledger = new KlingLedger(root);
  try {
    assert.deepEqual(ledger.operation(input.id), uncertain);
    assert.equal(ledger.reserve(authorization, input).created, false);
    assert.equal(ledger.reserve(authorization, input).operation.phase, 'uncertain');
    assert.throws(() => ledger.reserve(authorization, operation(root, 'two', b)), /MAX_GENERATIONS_EXCEEDED/);
    const validated = ledger.update(input.id, { phase: 'validated', outputHash: digest('verified fixture video'), duration: 5 });
    assert.equal(validated.authorizationId, authorization.id);
    for (const phase of ['reserved', 'submitted', 'uncertain'] as const) {
      assert.throws(() => ledger.update(input.id, { phase }), /KLING_OPERATION_REGRESSION/);
    }
    assert.deepEqual(ledger.operation(input.id), validated);
    assert.throws(() => ledger.update('missing', { phase: 'validated' }), /KLING_OPERATION_MISSING/);
    assert.equal(ledger.count(), 1);
  } finally { ledger.close(); }
});

test('two connections see one reservation and enforce the persisted limit against forged caller limits', () => {
  const root = directory(), first = new KlingLedger(root), second = new KlingLedger(root), b = budget(['one', 'two', 'three'], 2);
  try {
    const authorization = first.authorize(b, 'cli-limit');
    assert.deepEqual(second.authorize(b, 'interactive'), authorization);
    assert.equal(first.reserve(authorization, operation(root, 'one', b)).created, true);
    assert.equal(second.reserve(authorization, operation(root, 'one', b)).created, false);
    assert.equal(second.reserve(authorization, operation(root, 'two', b)).created, true);
    assert.throws(() => first.reserve({ ...authorization, limit: 1000 }, operation(root, 'three', b)), /MAX_GENERATIONS_EXCEEDED/);
    assert.equal(first.count(), 2);
    assert.equal(second.count(), 2);
    const exported = second.export() as LedgerExport;
    assert.equal(exported.authorizations.length, 1);
    assert.equal(exported.operations.length, 2);
    assert.ok(exported.operations.every(op => op.authorizationId === authorization.id));
  } finally { first.close(); second.close(); }
});

test('137 operations plus retries and reopen cycles consume exactly 137 reservations, never 138', () => {
  const root = directory(), count = 137, ids = Array.from({ length: count + 1 }, (_, i) => `operation-${String(i).padStart(3, '0')}`);
  const b = budget(ids, count);
  let ledger = new KlingLedger(root);
  const authorization = ledger.authorize(b, 'cli-limit');
  try {
    for (let i = 0; i < count; i++) {
      const input = operation(root, ids[i], b);
      assert.equal(ledger.reserve(authorization, input).created, true);
      for (let retry = 0; retry < 3; retry++) assert.equal(ledger.reserve(authorization, input).created, false);
      ledger.update(input.id, { phase: i % 2 ? 'uncertain' : 'submitted' });
      if (i % 17 === 0) { ledger.close(); ledger = new KlingLedger(root); }
      assert.equal(ledger.count(), i + 1);
    }
    assert.throws(() => ledger.reserve(authorization, operation(root, ids[count], b)), /MAX_GENERATIONS_EXCEEDED/);
    const exported = ledger.export() as LedgerExport;
    assert.equal(exported.schema, 'hsl.kling-ledger.v1');
    assert.equal(exported.authorizations.length, 1);
    assert.equal(exported.operations.length, count);
    assert.equal(new Set(exported.operations.map(op => op.id)).size, count);
    assert.ok(exported.operations.every(op => op.authorizationId === authorization.id));
    assert.equal(ledger.count(), count);
    assert.equal(ledger.operation(ids[count]), undefined);
  } finally { ledger.close(); }
});
