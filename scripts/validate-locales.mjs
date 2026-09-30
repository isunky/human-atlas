import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {displayName, text, searchText, readLocale, UI_ZH, LANGUAGE_STORAGE_KEY} from '../client/i18n/index.ts';

const atlas = JSON.parse(fs.readFileSync(new URL('../public/models/atlas.json', import.meta.url), 'utf8'));
const terms = JSON.parse(fs.readFileSync(new URL('../client/i18n/terms.zh-CN.json', import.meta.url), 'utf8'));
const names = new Set([...atlas.parts, ...atlas.concepts].map(part => part.name));
assert.equal(Object.keys(terms).length, names.size);
const ordinals = {first:'第一',second:'第二',third:'第三',fourth:'第四',fifth:'第五',sixth:'第六',seventh:'第七',eighth:'第八',ninth:'第九',tenth:'第十',eleventh:'第十一',twelfth:'第十二'};
for (const english of names) {
  const chinese = terms[english];
  assert.ok(chinese?.trim(), `Missing term: ${english}`);
  assert.match(chinese, /[\u3400-\u9fff]/, `Not translated: ${english}`);
  assert.doesNotMatch(chinese, /[a-z]/i, `Untranslated token: ${english}`);
  for (const [word, translation] of Object.entries({left:'左',right:'右',...ordinals})) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(english)) assert.ok(chinese.includes(translation), `Qualifier lost: ${english}`);
  }
  assert.equal(displayName(english, 'en'), english);
}
assert.equal(displayName('Heart', 'zh-CN'), '心脏');
assert.equal(displayName('Left femur', 'zh-CN'), '左股骨');
assert.equal(displayName('Right femur', 'zh-CN'), '右股骨');
assert.ok(searchText('Heart', 'FMA7088').includes('心脏'));
assert.ok(searchText('Heart', 'FMA7088').includes('fma7088'));
assert.equal(readLocale({getItem:key => key === LANGUAGE_STORAGE_KEY ? 'en' : null}), 'en');
assert.equal(readLocale({getItem:() => 'invalid'}), 'zh-CN');
assert.equal(readLocale({getItem:() => {throw new Error('Storage disabled');}}), 'zh-CN');
for (const [english, chinese] of Object.entries(UI_ZH)) {
  assert.ok(chinese.trim());
  assert.deepEqual([...english.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort(), [...chinese.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort());
}
assert.equal(text('Show only {name}', 'zh-CN', {name:'心脏'}), '仅显示心脏');
for (const name of ['app/page.tsx','app/scene.tsx']) {
  const source = ts.createSourceFile(name, fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const visit = node => {
    if (ts.isCallExpression(node) && ['t','text'].includes(node.expression.getText(source)) && ts.isStringLiteral(node.arguments[0])) {
      assert.ok(UI_ZH[node.arguments[0].text], `Missing UI string: ${node.arguments[0].text}`);
    }
    if (ts.isJsxText(node) && /[a-z]/i.test(node.text)) {
      assert.ok(['Human Atlas','BodyParts3D','English','3D'].includes(node.text.trim()), `Untranslated JSX text: ${node.text.trim()}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}
console.log(`Verified ${names.size} Chinese draft terms, preserved qualifiers, ${Object.keys(UI_ZH).length} UI strings, bilingual search and language storage.`);
