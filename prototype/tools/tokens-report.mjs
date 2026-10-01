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

const DECL = /^(?:\/\*[\s\S]*?\*\/\s*)*(--[A-Za-z0-9-]+)\s*:\s*([\s\S]*?);\s*(?:\/\*\s*([\s\S]*?)\s*\*\/)?\s*$/;
const GROUP = /group:\s*([\s\S]*?)\*\//g;
const NOMIKIT = /@nomikit\s+(\S+)/;

/* Collect every matching selector block in source order. */
function blocksOf(css, selector) {
  const blocks = [];
  let from = 0;
  while (from < css.length) {
    const at = css.indexOf(selector, from);
    if (at < 0) break;
    const open = css.indexOf('{', at + selector.length);
    if (open < 0) break;
    let depth = 0;
    for (let i = open; i < css.length; i += 1) {
      if (css[i] === '{') depth += 1;
      else if (css[i] === '}') {
        depth -= 1;
        if (depth === 0) {
          blocks.push(css.slice(open + 1, i));
          from = i + 1;
          break;
        }
      }
    }
    if (depth !== 0) break;
  }
  return blocks;
}

function blockOf(css, selector) {
  return blocksOf(css, selector)[0] || '';
}

/* Parse declarations by top-level semicolons, not by lines. */
function parseDeclarations(body) {
  const declarations = [];
  let start = 0;
  let parenDepth = 0;
  let quote = '';
  let comment = false;

  const push = (end, nextStart) => {
    const statement = body.slice(start, end).trim();
    const match = DECL.exec(statement);
    if (match) {
      declarations.push({ name: match[1], value: match[2].trim(), comment: match[3] || '' });
    }
    start = nextStart;
  };

  for (let i = 0; i < body.length; i += 1) {
    const current = body[i];
    const next = body[i + 1];

    if (comment) {
      if (current === '*' && next === '/') {
        comment = false;
        i += 1;
      }
      continue;
    }
    if (!quote && current === '/' && next === '*') {
      comment = true;
      i += 1;
      continue;
    }
    if (quote) {
      if (current === '\\') i += 1;
      else if (current === quote) quote = '';
      continue;
    }
    if (current === '"' || current === "'") {
      quote = current;
      continue;
    }
    if (current === '(') parenDepth += 1;
    else if (current === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (current === ';' && parenDepth === 0) {
      let nextStart = i + 1;
      const lineEnd = body.indexOf('\n', nextStart);
      const restOfLine = body.slice(nextStart, lineEnd < 0 ? body.length : lineEnd);
      const inlineComment = /^\s*(\/\*[\s\S]*?\*\/)/.exec(restOfLine);
      if (inlineComment) nextStart += inlineComment[0].length;
      push(nextStart, nextStart);
    }
  }

  return declarations;
}

/* group 注释在源码里可能折行，先摊平再切说明 */
function groupTitle(raw) {
  const flat = raw.replace(/\s+/g, ' ').trim().replace(/\s+\*\//g, '').replace(/\/\*$/, '').trim();
  return flat;
}

export function parse(tokensCss) {
  const rootBody = blockOf(tokensCss, ':root');
  const darkBodies = blocksOf(tokensCss, '[data-theme="dark"]');

  /* Each group comment owns the declarations until the next group comment. */
  const ranges = [];
  GROUP.lastIndex = 0;
  let m;
  while ((m = GROUP.exec(rootBody)) !== null) {
    ranges.push({ title: groupTitle(m[1]), from: m.index + m[0].length });
  }
  ranges.forEach((r, i) => { r.to = i + 1 < ranges.length ? ranges[i + 1].from : rootBody.length; });

  const groups = ranges.map((r) => {
    const tokens = parseDeclarations(rootBody.slice(r.from, r.to)).map((declaration) => {
      const comment = declaration.comment;
      const rawNomikit = comment.match(NOMIKIT)?.[1] || '';
      const nomikit = rawNomikit === '—' ? '' : rawNomikit;
      return {
        name: declaration.name,
        value: declaration.value,
        desc: comment.replace(NOMIKIT, '').replace(/\s+/g, ' ').replace(/[：:]\s*$/, '').trim(),
        nomikit,
        dark: '',
      };
    });
    return { title: r.title, tokens };
  }).filter((g) => g.tokens.length);

  /* Attach every dark override to the matching root token. */
  const stray = [];
  const byName = new Map(groups.flatMap((g) => g.tokens).map((t) => [t.name, t]));
  for (const declaration of darkBodies.flatMap(parseDeclarations)) {
    const target = byName.get(declaration.name);
    if (target) target.dark = declaration.value;
    else stray.push(declaration.name);
  }

  return { groups, stray, total: groups.reduce((n, g) => n + g.tokens.length, 0) };
}

export function sourceDigest(texts) {
  return createHash('sha256').update(texts.join('\n---\n')).digest('hex');
}

export async function report() {
  const manifest = await readManifest();
  const tokensCss = await readFile(join(ROOT, manifest.generated.tokensSource), 'utf8');
  const digest = sourceDigest([tokensCss]);
  const parsed = parse(tokensCss);
  const data = {
    total: parsed.total,
    groups: parsed.groups,
  };
  const json = JSON.stringify(data, null, 2);
  const js = `/* 生成物 · 请勿手改\n   由 tools/tokens-report.mjs 解析 ${manifest.generated.tokensSource} 生成\n`
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
      + ` · sha256 ${digest.slice(0, 16)}`);
    if (parsed.stray.length) console.warn(`! 深色块里有令牌表不存在的名字：${parsed.stray.join(', ')}`);
  }
}
