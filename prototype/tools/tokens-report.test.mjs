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
    ['--spacing-tiny', '2px'], ['--spacing-extra-small', '4px'],
    ['--spacing-small', '8px'], ['--spacing-medium', '12px'],
    ['--spacing-large', '16px'], ['--spacing-extra-large', '20px'],
    ['--spacing-huge', '24px'], ['--spacing-massive', '32px'],
    ['--spacing-colossal', '48px'],
  ],
  '圆角（九级）': [
    ['--radius-tiny', '2px'], ['--radius-extra-small', '4px'],
    ['--radius-small', '8px'], ['--radius-medium', '12px'],
    ['--radius-large', '16px'], ['--radius-extra-large', '20px'],
    ['--radius-huge', '24px'], ['--radius-massive', '32px'],
    ['--radius-colossal', '48px'], ['--radius-pill', '999px'],
  ],
  '图标尺寸（九级）': [
    ['--size-icon-tiny', '14px'], ['--size-icon-extra-small', '16px'],
    ['--size-icon-small', '18px'], ['--size-icon-medium', '20px'],
    ['--size-icon-large', '24px'], ['--size-icon-extra-large', '32px'],
    ['--size-icon-huge', '40px'], ['--size-icon-massive', '48px'],
    ['--size-icon-colossal', '56px'],
  ],
  '头像尺寸（九级）': [
    ['--size-avatar-tiny', '18px'], ['--size-avatar-extra-small', '24px'],
    ['--size-avatar-small', '32px'], ['--size-avatar-medium', '40px'],
    ['--size-avatar-large', '48px'], ['--size-avatar-extra-large', '56px'],
    ['--size-avatar-huge', '64px'], ['--size-avatar-massive', '72px'],
    ['--size-avatar-colossal', '96px'],
  ],
};

assert.equal(liveParsed.total, 162, '内容驱动控件高度重构后的正式令牌总数应为 162');
assert.equal(liveParsed.groups.length, 21, '公共颜色收敛后的分组数应为 21');
const tokenByName = new Map(liveParsed.groups.flatMap((group) => group.tokens.map((token) => [token.name, token])));
assert.equal(
  tokenByName.get('--background-user-card-action')?.value,
  'linear-gradient(135deg, var(--color-primary), #efa791ff)',
  '公共主操作渐变应使用旧版亮端',
);
assert.equal(
  tokenByName.get('--background-user-card-action-hover')?.value,
  'linear-gradient(135deg, #dd8f77ff, #e79c85ff)',
  '公共主操作 hover 渐变应使用旧版端点',
);
for (const [title, expected] of Object.entries(preservedScale)) {
  const group = liveParsed.groups.find((item) => item.title === title);
  assert.ok(group, '必须保留分组：' + title);
  assert.deepEqual(
    group.tokens.map((token) => [token.name, token.value]),
    expected.map(([name, value]) => [name, value]),
  );
}

const typography = liveParsed.groups.find((group) => group.title === '排版（字号与行高）');
assert.ok(typography, '必须保留排版分组');
assert.deepEqual(
  typography.tokens.filter((token) => token.name.startsWith('--type-')).map((token) => [token.name, token.value]),
  [
    ['--type-display-large', '57px / 64px'],
    ['--type-display-medium', '45px / 52px'],
    ['--type-display-small', '36px / 44px'],
    ['--type-headline-large', '32px / 40px'],
    ['--type-headline-medium', '28px / 36px'],
    ['--type-headline-small', '24px / 32px'],
    ['--type-title-large', '22px / 28px'],
    ['--type-title-medium', '16px / 24px'],
    ['--type-title-small', '14px / 20px'],
    ['--type-body-large', '16px / 24px'],
    ['--type-body-medium', '14px / 20px'],
    ['--type-body-small', '12px / 16px'],
    ['--type-label-large', '14px / 20px'],
    ['--type-label-medium', '12px / 16px'],
    ['--type-label-small', '10px / 16px'],
  ],
  'Type.kt 的 15 个排版槽位必须按固定顺序和值生成',
);
assert.deepEqual(
  typography.tokens.filter((token) => token.name.startsWith('--weight-')).map((token) => [token.name, token.value]),
  [
    ['--weight-regular', '400'],
    ['--weight-medium', '600'],
    ['--weight-bold', '700'],
    ['--weight-heavy', '800'],
  ],
  '字重辅助令牌的值必须保持不变',
);
assert.equal(
  /--font-(?:caption|badge|label-small|body-small|body-medium|body-large|title-medium|title-large|headline-large|display-large|stat-large)\s*:|--line-height-(?:tight|normal|loose)\s*:/.test(liveCss),
  false,
  '旧字号与通用行高令牌必须删除',
);

const heightGroup = liveParsed.groups.find((group) => group.title === '控件高度');
assert.ok(heightGroup, '必须保留控件高度分组');
const preservedHeights = [
  ['--height-appbar', '56px'],
  ['--height-badge', '18px'],
  ['--height-badge-inline', '16px'],
  ['--height-row', '40px'],
  ['--height-field', '48px'],
  ['--height-mobile-nav', '62px'],
  ['--tap-target', '44px'],
];
for (const [name, value] of preservedHeights) {
  assert.equal(heightGroup.tokens.find((token) => token.name === name)?.value, value, name + ' 的值必须保持不变');
}
const removedHeights = /--height-(?:control|tab|chip|control-sm|control-xs|head)\b/;
assert.equal(removedHeights.test(liveCss), false, '重复的视觉控件高度令牌必须删除');

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
for (const file of sourceFiles) {
  const source = await readFile(file, 'utf8');
  assert.equal(removedHeights.test(source), false, path.relative(liveRoot, file) + ' 仍引用已删除的视觉控件高度令牌');
}

console.log('✓ tokens-report parser and token governance regression tests passed');
