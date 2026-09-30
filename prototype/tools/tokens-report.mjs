/* ============================================================
   令牌报告生成器
   ------------------------------------------------------------
   从 tokens.css 的 `/* group: X *\/` 与行内 `/* 说明 @nomikit Symbol *\/`
   注释里抽出结构化数据，写成 src/spec/tokens.data.js，供规范区渲染令牌表。
   唯一数据源仍是 tokens.css；本脚本只做解析，不做二次定义。
   ------------------------------------------------------------
   用法：node tools/tokens-report.mjs         生成/更新 data.js
         node tools/tokens-report.mjs --check 只校验，不写文件（门禁用）
   ============================================================ */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { ROOT, readManifest } from './build.mjs';

const DECL = /^(--[A-Za-z0-9-]+)\s*:\s*(.*?);?\s*(?:\/\*\s*(.*?)\s*\*\/)?\s*$/;
const GROUP = /group:\s*([\s\S]*?)\*\//g;
const NOMIKIT = /@nomikit\s+(\S+)/;

/* 取某个选择器花括号里的正文 */
function blockOf(css, selector) {
  const at = css.indexOf(selector);
  if (at < 0) return '';
  const open = css.indexOf('{', at);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    else if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  return '';
}

/* group 注释在源码里可能折行，先摊平再切说明 */
function groupTitle(raw) {
  const flat = raw.replace(/\s+/g, ' ').trim().replace(/\s+\*\//g, '').replace(/\/\*$/, '').trim();
  return flat;
}

export function parse(tokensCss, compatCss) {
  const rootBody = blockOf(tokensCss, ':root');
  const darkBody = blockOf(tokensCss, '[data-theme="dark"]');

  /* 每个 group 注释到下一个 group 注释之间的行，归属该组 */
  const ranges = [];
  GROUP.lastIndex = 0;
  let m;
  while ((m = GROUP.exec(rootBody)) !== null) {
    ranges.push({ title: groupTitle(m[1]), from: m.index + m[0].length });
  }
  ranges.forEach((r, i) => { r.to = i + 1 < ranges.length ? ranges[i + 1].from : rootBody.length; });

  const groups = ranges.map((r) => {
    const tokens = [];
    for (const line of rootBody.slice(r.from, r.to).split('\n')) {
      const d = DECL.exec(line.trim());
      if (!d) continue;
      const comment = d[3] || '';
      const nomikit = comment.match(NOMIKIT);
      tokens.push({
        name: d[1],
        value: d[2].trim(),
        desc: comment.replace(NOMIKIT, '').replace(/\s+/g, ' ').replace(/[：:]\s*$/, '').trim(),
        nomikit: nomikit ? nomikit[1] : '',
        dark: '',
      });
    }
    return { title: r.title, tokens };
  }).filter((g) => g.tokens.length);

  /* 深色覆写挂回同名令牌，找不到就是令牌表写漏了 */
  const stray = [];
  const byName = new Map(groups.flatMap((g) => g.tokens).map((t) => [t.name, t]));
  for (const line of darkBody.split('\n')) {
    const d = DECL.exec(line.trim());
    if (!d || !d[1]) continue;
    const target = byName.get(d[1]);
    if (target) target.dark = d[2].trim();
    else stray.push(d[1]);
  }

  const declOf = (body) => body.split('\n')
    .map((line) => DECL.exec(line.trim()))
    .filter((d) => d && d[1]);

  /* :root 里是全局别名；区域块里的同名覆写单独标注，避免两张表混成一张 */
  const compat = declOf(blockOf(compatCss, ':root'))
    .map((d) => ({ name: d[1], alias: d[2].trim(), region: '' }));
  for (const region of ['[data-proto="client"]', '[data-proto="admin"]']) {
    const label = /data-proto="([^"]+)"/.exec(region)[1];
    for (const d of declOf(blockOf(compatCss, region))) {
      compat.push({ name: d[1], alias: d[2].trim(), region: label });
    }
  }

  return { groups, compat, stray, total: groups.reduce((n, g) => n + g.tokens.length, 0) };
}

export function sourceDigest(texts) {
  return createHash('sha256').update(texts.join('\n---\n')).digest('hex');
}

export async function report() {
  const manifest = await readManifest();
  const tokensCss = await readFile(join(ROOT, manifest.generated.tokensSource), 'utf8');
  const compatCss = await readFile(join(ROOT, manifest.generated.compatSource), 'utf8');
  const digest = sourceDigest([tokensCss, compatCss]);
  const parsed = parse(tokensCss, compatCss);
  const data = {
    total: parsed.total,
    groups: parsed.groups,
    compat: parsed.compat,
  };
  const json = JSON.stringify(data, null, 2);
  const js = `/* 生成物 · 请勿手改\n   由 tools/tokens-report.mjs 解析 ${manifest.generated.tokensSource}`
    + ` 与 ${manifest.generated.compatSource} 生成\n`
    + `   source-sha256: ${digest}\n*/\nwindow.AyaneTokens = ${json};\n`;
  return { js, digest, parsed, target: manifest.generated.tokensData };
}

if (process.argv[1] && process.argv[1].endsWith('tokens-report.mjs')) {
  const { js, digest, parsed, target } = await report();
  const out = join(ROOT, target);
  if (process.argv.includes('--check')) {
    let current = '';
    try { current = await readFile(out, 'utf8'); } catch { /* 尚未生成 */ }
    if (current !== js) {
      console.error(`✗ ${target} 与令牌源不一致，请运行 node tools/tokens-report.mjs`);
      process.exit(1);
    }
    console.log(`✓ ${target} 与令牌源一致（${parsed.total} 个令牌）`);
  } else {
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, js, 'utf8');
    console.log(`✓ ${target}  ${parsed.total} 个令牌 · ${parsed.groups.length} 组`
      + ` · ${parsed.compat.length} 条别名 · sha256 ${digest.slice(0, 16)}`);
    if (parsed.stray.length) console.warn(`! 深色块里有令牌表不存在的名字：${parsed.stray.join(', ')}`);
  }
}
