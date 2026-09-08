import assert from 'node:assert/strict';
import path from 'node:path';
import {selectMatrixStorage} from './storageMode';

assert.deepEqual(selectMatrixStorage({}), {
  mode: 'off',
  reason: 'HSL_DRIVE_FOLDER_ID não configurado'
});

assert.equal(selectMatrixStorage({HSL_DRIVE_FOLDER_ID:'folder'}).mode, 'off');
assert.equal(selectMatrixStorage({
  HSL_DRIVE_FOLDER_ID:'folder',
  HSL_GOOGLE_CLIENT_SECRET_FILE:'relative-secret.json'
}).mode, 'off');

assert.deepEqual(selectMatrixStorage({
  HSL_DRIVE_FOLDER_ID:'folder',
  HSL_GOOGLE_CLIENT_SECRET_FILE:path.resolve('secret.json')
}), {mode:'drive'});

console.log('MATRIX_STORAGE_MODE_TEST_OK');
