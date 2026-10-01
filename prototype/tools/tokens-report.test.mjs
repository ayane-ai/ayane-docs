import assert from 'node:assert/strict';
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

console.log('✓ tokens-report parser regression tests passed');
