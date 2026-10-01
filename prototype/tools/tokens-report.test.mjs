import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from './tokens-report.mjs';

const tokensCss = `
:root {
  /* group: 测试颜色 */
  --gradient: linear-gradient(135deg, #fff, transparent),
    rgba(255, 255, 255, 0.8); /* 多行值 @nomikit — */
  --mapped: #123456; /* 已映射 @nomikit AppColorScheme.primary */
}
[data-theme="dark"] {
  --gradient: #111111;
}
[data-theme="dark"] {
  --mapped: #222222;
}
[data-theme="dark"] {
  --gradient: #333333;
  --missing: #444444;
}
`;
const parsed = parse(tokensCss);
const tokens = parsed.groups.flatMap((group) => group.tokens);
const gradient = tokens.find((token) => token.name === '--gradient');
const mapped = tokens.find((token) => token.name === '--mapped');

assert.ok(gradient, '多行令牌必须被解析');
assert.equal(
  gradient.value.replace(/\s+/g, ' '),
  'linear-gradient(135deg, #fff, transparent), rgba(255, 255, 255, 0.8)',
);
assert.equal(gradient.desc, '多行值');
assert.equal(gradient.nomikit, '');
assert.equal(gradient.dark, '#333333', '后出现的深色块应覆盖前值');
assert.equal(mapped.dark, '#222222', '所有深色块都应被收集');
assert.equal(mapped.nomikit, 'AppColorScheme.primary');
assert.deepEqual(parsed.stray, ['--missing']);
assert.equal('compat' in parsed, false, '解析结果不再包含过渡别名数据');

const liveRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const liveCss = await readFile(path.join(liveRoot, 'src/base/tokens.css'), 'utf8');
const liveParsed = parse(liveCss);
const preservedScale = {
  '间距（九级）': [
    ['--spacing-tiny', '2px', 13], ['--spacing-extra-small', '4px', 68],
    ['--spacing-small', '8px', 85], ['--spacing-medium', '12px', 77],
    ['--spacing-large', '16px', 50], ['--spacing-extra-large', '20px', 12],
    ['--spacing-huge', '24px', 29], ['--spacing-massive', '32px', 10],
    ['--spacing-colossal', '48px', 5],
  ],
  '圆角（九级）': [
    ['--radius-tiny', '2px', 3], ['--radius-extra-small', '4px', 7],
    ['--radius-small', '8px', 8], ['--radius-medium', '12px', 35],
    ['--radius-large', '16px', 12], ['--radius-extra-large', '20px', 2],
    ['--radius-huge', '24px', 20], ['--radius-massive', '32px', 2],
    ['--radius-colossal', '48px', 1], ['--radius-pill', '999px', 20],
  ],
  '图标尺寸（九级）': [
    ['--size-icon-tiny', '14px', 12], ['--size-icon-extra-small', '16px', 10],
    ['--size-icon-small', '18px', 2], ['--size-icon-medium', '20px', 1],
    ['--size-icon-large', '24px', 0], ['--size-icon-extra-large', '32px', 5],
    ['--size-icon-huge', '40px', 11], ['--size-icon-massive', '48px', 2],
    ['--size-icon-colossal', '56px', 2],
  ],
  '头像尺寸（九级）': [
    ['--size-avatar-tiny', '18px', 0], ['--size-avatar-extra-small', '24px', 0],
    ['--size-avatar-small', '32px', 2], ['--size-avatar-medium', '40px', 9],
    ['--size-avatar-large', '48px', 4], ['--size-avatar-extra-large', '56px', 0],
    ['--size-avatar-huge', '64px', 1], ['--size-avatar-massive', '72px', 2],
    ['--size-avatar-colossal', '96px', 10],
  ],
};

assert.equal(liveParsed.total, 167, '公共颜色收敛后的正式令牌总数应为 167');
assert.equal(liveParsed.groups.length, 21, '公共颜色收敛后的分组数应为 21');
for (const [title, expected] of Object.entries(preservedScale)) {
  const group = liveParsed.groups.find((item) => item.title === title);
  assert.ok(group, '必须保留分组：' + title);
  assert.deepEqual(
    group.tokens.map((token) => [token.name, token.value]),
    expected.map(([name, value]) => [name, value]),
  );
}

const forbiddenNames = /--color-(?:admin|prototype)-|--(?:color-(?:surface-hairline|outline-error|primary-hover|error-strong|warning-light|error-light|tab|skeleton|avatar-wash|nav-active|track|focus-ring-error|toast-error-bg|login-card-bg)|shadow-admin)-/;
assert.equal(forbiddenNames.test(liveCss), false, '专用颜色与原型阴影令牌必须全部删除');
assert.equal(/颜色 · (?:组件专用|原型视图专用)|阴影 · 原型视图专用/.test(liveCss), false, '专用颜色/阴影分组必须全部删除');

const sourceFiles = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (/\.(css|js|html)$/.test(entry.name) && !file.endsWith(path.join('src', 'spec', 'tokens.data.js'))) sourceFiles.push(file);
  }
}
await walk(path.join(liveRoot, 'src'));
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
for (const expected of Object.values(preservedScale)) {
  for (const [name, , expectedRefs] of expected) {
    const ref = new RegExp('var\\(' + escapeRegExp(name) + '(?=[),\\s])', 'g');
    let actualRefs = 0;
    for (const file of sourceFiles) {
      const rel = path.relative(liveRoot, file).replaceAll('\\', '/');
      if (rel === 'src/base/tokens.css') continue;
      actualRefs += [...(await readFile(file, 'utf8')).matchAll(ref)].length;
    }
    assert.equal(actualRefs, expectedRefs, name + ' 的消费者数量发生变化');
  }
}

console.log('✓ tokens-report parser and token governance regression tests passed');
