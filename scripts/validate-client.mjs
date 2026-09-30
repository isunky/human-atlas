import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gzipSync} from 'node:zlib';
import {decodeModelResponse} from '../app/core/model-download.ts';

const sample = new TextEncoder().encode('Human Atlas · 心脏');
const gzip = gzipSync(sample);
const original = globalThis.DecompressionStream;
for (const native of [true, false]) {
  globalThis.DecompressionStream = native ? original : undefined;
  const decoded = await decodeModelResponse(new Response(gzip), sample.byteLength, true);
  assert.deepEqual(new Uint8Array(decoded), sample);
  const alreadyDecoded = await decodeModelResponse(new Response(sample, {headers:{'Content-Encoding':'gzip'}}), sample.byteLength, true);
  assert.deepEqual(new Uint8Array(alreadyDecoded), sample);
}
globalThis.DecompressionStream = original;
await assert.rejects(decodeModelResponse(new Response(sample, {status:404}), sample.byteLength, false));
await assert.rejects(decodeModelResponse(new Response(sample), sample.byteLength + 1, false), /incomplete/);
await assert.rejects(decodeModelResponse(new Response(gzip.subarray(0,12)), sample.byteLength, true));
const root = new URL('../', import.meta.url);
const atlas = JSON.parse(fs.readFileSync(new URL('dist-client/models/atlas.json', root), 'utf8'));
for (const chunk of atlas.chunks) {
  assert.ok(chunk.gzip);
  assert.ok(!fs.existsSync(new URL(`dist-client${chunk.url}`, root)), 'Raw models must not enter the client package');
  const binary = fs.readFileSync(new URL(`dist-client${chunk.gzip}`, root));
  assert.equal(binary.byteLength, chunk.gzipBytes);
  const decoded = await decodeModelResponse(new Response(binary), chunk.bytes, true);
  assert.equal(decoded.byteLength, chunk.bytes);
}
assert.ok(fs.existsSync(new URL('dist-client/ATTRIBUTION.md', root)));
const config = JSON.parse(fs.readFileSync(new URL('src-tauri/tauri.conf.json', root), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(new URL('package.json', root), 'utf8'));
assert.equal(config.version, manifest.version);
assert.equal(config.build.frontendDist, '../dist-client');
assert.deepEqual(config.bundle.targets, ['nsis']);
console.log(`Verified native/fallback gzip decoding, error cases, ${atlas.chunks.length} offline model chunks and Windows bundle configuration.`);
