/* ============================================================
   交付门禁：一条命令判定这套原型是否可以发布
   ------------------------------------------------------------
   用法：node tools/check.mjs [--strict]
   退出码 0 表示全部硬门禁通过；1 表示存在必须修的问题。
   只读源码与 dist，不写任何文件。--strict 打印每条门禁的全量问题。
   ------------------------------------------------------------
   门禁清单：
     01 dist 新鲜度        02 令牌表数据新鲜度   03 单入口结构
     04 无残留 include      05 id 全局唯一        06 令牌不悬空
     07 断点一致            08 颜色只有令牌源     09 视口单位禁令
     10 定位禁令            11 图标零 emoji       12 语法与引用完整
   ============================================================ */
import { readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { ROOT, readManifest, build } from './build.mjs';
import { report as tokensReport } from './tokens-report.mjs';

const strict = process.argv.includes('--strict');

/* 策略白名单：只有这些文件可以碰相应机制，其余一律引用令牌或走容器查询 */
/* region.css 是画布 chrome，spec/shell.css 是外壳 chrome（左栏 / 画布 / HUD）：
   两者都不在任何区域容器里，容器查询在它们那里无从解算。 */
const MEDIA_WIDTH_ALLOW = ['src/region.css', 'src/spec/shell.css'];
const VIEWPORT_UNIT_ALLOW = ['src/region.css', 'src/base/tokens.css'];
const FIXED_ALLOW = ['src/region.css'];
const COLOR_LITERAL_ALLOW = ['src/base/tokens.css', 'src/base/icons.svg.html'];

const EMOJI_RANGES = [
  [0x1F000, 0x1FAFF], /* emoji 主体：🎙 🔇 */
  [0x25A0, 0x25FF],   /* 几何图形：◉ ◍ ▶ */
  [0x2600, 0x27BF],   /* 杂项符号与装饰符：☺ ♥ ♡ ✕ ✳ */
  [0x2B00, 0x2BFF],   /* 箭头与星号 */
  [0xFF0B, 0xFF0B],   /* 全角 ＋ */
];
const EMOJI_ONE_OFF = new Set(['⋯']);

const ctx = { files: new Map(), css: [], js: [], html: [], distText: '', manifest: null };

/* CSS 注释按分词器规则剥：开注释后遇到最近的闭注释即结束，注释体里再出现
   开注释只是普通文本。用非贪婪的「开注释…任意…闭注释」正则会把 views 通配写法
   里的开注释误认成嵌套，从而把「提前闭合导致整条规则被浏览器吞掉」的破损文件
   判成正常。 */
function stripComments(text) {
  let out = '';
  let cursor = 0;
  while (cursor < text.length) {
    const open = text.indexOf('/*', cursor);
    if (open < 0) { out += text.slice(cursor); break; }
    out += text.slice(cursor, open);
    const close = text.indexOf('*/', open + 2);
    if (close < 0) return out;
    cursor = close + 2;
  }
  return out;
}

function lineHits(where, text, re, fn) {
  text.split('\n').forEach((line, i) => {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(line)) !== null) fn(m, `${where}:${i + 1}`);
  });
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...(await walk(rel)));
    else if (/\.(css|js|html|json)$/.test(entry.name)) out.push(rel);
  }
  return out;
}

async function load() {
  ctx.manifest = await readManifest();
  for (const rel of [...(await walk('src')), ctx.manifest.entry]) {
    ctx.files.set(rel, await readFile(join(ROOT, rel), 'utf8'));
  }
  const keys = [...ctx.files.keys()];
  ctx.css = keys.filter((f) => f.endsWith('.css'));
  ctx.js = keys.filter((f) => f.endsWith('.js'));
  ctx.html = keys.filter((f) => f.endsWith('.html') && !f.endsWith('.json'));
}

const gates = [];
const gate = (name, fn) => gates.push({ name, fn });
const fail = function (msg) { this.problems.push(msg); };
const note = function (msg) { if (msg) this.notes.push(msg); };

/* ---------------------------------------------------------------- 01 */
gate('01 dist 新鲜度', async function () {
  let built;
  try {
    built = await build();
  } catch (e) {
    return fail.call(this, e.message);
  }
  ctx.distText = built.html;
  let dist = null;
  try {
    dist = await readFile(join(ROOT, ctx.manifest.out), 'utf8');
  } catch { /* 尚未构建 */ }
  if (dist === null) return fail.call(this, `${ctx.manifest.out} 不存在，先跑 node tools/build.mjs`);
  const m = /sha256:\s*([0-9a-f]{64})/.exec(dist);
  if (!m) return fail.call(this, `${ctx.manifest.out} 头部缺 sha256 指纹`);
  if (m[1] !== built.digest) {
    return fail.call(this, `dist 落后于源码（dist ${m[1].slice(0, 12)} ≠ 现算 ${built.digest.slice(0, 12)}），重跑 node tools/build.mjs`);
  }
  if (dist !== built.html) return fail.call(this, 'dist 内容与 build() 结果逐字不一致');
  return note.call(this, `${built.order.length} 个源 · ${(Buffer.byteLength(built.html) / 1024).toFixed(0)} KB`);
});

/* ---------------------------------------------------------------- 02 */
gate('02 令牌表数据新鲜度', async function () {
  const { js, digest, parsed } = await tokensReport();
  const target = ctx.manifest.generated.tokensData;
  const current = ctx.files.get(target);
  if (current === undefined) return fail.call(this, `${target} 尚未生成`);
  if (!current.includes(`source-sha256: ${digest}`)) {
    return fail.call(this, `${target} 的源码指纹落后，重跑 node tools/tokens-report.mjs`);
  }
  if (current !== js) return fail.call(this, `${target} 内容与解析结果不一致，重跑 node tools/tokens-report.mjs`);
  return note.call(this, `${parsed.total} 个令牌 / ${parsed.groups.length} 组 / ${parsed.compat.length} 条别名`);
});

/* ---------------------------------------------------------------- 03 */
gate('03 单入口结构', async function () {
  const entry = ctx.files.get(ctx.manifest.entry) || '';
  const dist = ctx.distText;
  if (!dist) return fail.call(this, '01 未产出 dist，本门禁无法判定');

  for (const [label, text] of [['入口', entry], ['产物', dist]]) {
    if ((text.match(/<!doctype\s+html/gi) || []).length !== 1) fail.call(this, `${label} 的 <!doctype html> 不唯一`);
    if (!/<meta\s+charset=/i.test(text)) fail.call(this, `${label} 缺 <meta charset>`);
    if (!/<meta\s+name="viewport"/i.test(text)) fail.call(this, `${label} 缺 viewport meta`);
    if (/<iframe/i.test(text)) fail.call(this, `${label} 含 <iframe>，区域隔离走容器查询，不用 iframe`);
  }
  for (const section of ctx.manifest.sections) {
    if (!new RegExp(`id="${section.id}"`).test(dist)) fail.call(this, `产物缺少分区 #${section.id}（${section.title}）`);
  }
  for (const region of ctx.manifest.regions) {
    let own = 0;
    for (const rel of ctx.html) {
      if (rel === ctx.manifest.entry) continue;
      own += (ctx.files.get(rel).match(new RegExp(`data-proto="${region.id}"`, 'g')) || []).length;
    }
    if (own !== 1) fail.call(this, `data-proto="${region.id}" 在 HTML 片段里共 ${own} 处，画布必须只有一份`);
    if (!new RegExp(`id="${region.fullscreen}"[^>]*popover="manual"`).test(entry)) {
      fail.call(this, `入口缺少全屏层 #${region.fullscreen}（popover="manual"）`);
    }
  }
  const stages = ctx.html.reduce((n, rel) => n + (ctx.files.get(rel).match(/class="region-stage"/g) || []).length, 0);
  if (stages !== ctx.manifest.regions.length) {
    fail.call(this, `region-stage 共 ${stages} 个，应为 ${ctx.manifest.regions.length} 个（全屏层不复制标记）`);
  }
  for (const page of ctx.manifest.pages) {
    if (!new RegExp(`data-page="${page.id}"`).test(entry)) {
      fail.call(this, `入口缺少页面菜单项 data-page="${page.id}"`);
    }
    if (!new RegExp(`class="[^"]*canvas-page[^"]*"[^>]*id="${page.section}"`).test(entry)) {
      fail.call(this, `#${page.section} 必须同时是画布页（class 含 canvas-page）`);
    }
  }
  for (const key of Object.keys(ctx.manifest.shell)) {
    const id = ctx.manifest.shell[key];
    if (id && !new RegExp(`id="${id}"`).test(entry)) fail.call(this, `外壳缺少挂载点 #${id}（${key}）`);
  }
  return note.call(this, `${ctx.manifest.sections.length} 个分区 · ${stages} 张画布`);
});

/* ---------------------------------------------------------------- 04 */
gate('04 无残留 include', async function () {
  if (ctx.distText && /<!--\s*@include/.test(ctx.distText)) fail.call(this, '产物里仍有 include 指令');
  for (const rel of ctx.css) {
    if (/@(import|use|include)\b/.test(ctx.files.get(rel))) fail.call(this, `${rel} 含 @import/@use/@include，会破坏单文件产物`);
  }
});

/* ---------------------------------------------------------------- 05 */
gate('05 id 全局唯一', async function () {
  const seen = new Map();
  const re = /\bid="([^"'{}]+)"/g;
  for (const rel of [...ctx.html, ...ctx.js]) {
    lineHits(rel, ctx.files.get(rel), re, (m, where) => {
      if (!seen.has(m[1])) seen.set(m[1], []);
      seen.get(m[1]).push(where);
    });
  }
  for (const [id, list] of seen) {
    if (list.length > 1) fail.call(this, `id="${id}" 重复：${list.join(' , ')}`);
  }
  return note.call(this, `${seen.size} 个静态 id`);
});

/* ---------------------------------------------------------------- 06 */
gate('06 令牌不悬空', async function () {
  const declared = new Set();
  for (const rel of ctx.css) {
    lineHits(rel, ctx.files.get(rel), /^\s*(--[A-Za-z0-9-]+)\s*:/g, (m) => declared.add(m[1]));
  }
  const used = new Map();
  const scan = (rel) => lineHits(rel, stripComments(ctx.files.get(rel)), /var\(\s*(--[A-Za-z0-9-]+)/g, (m, where) => {
    if (declared.has(m[1])) return;
    if (!used.has(m[1])) used.set(m[1], where);
  });
  [...ctx.css, ...ctx.js].forEach(scan);
  for (const [name, where] of used) fail.call(this, `var(${name}) 无声明（首个出现 ${where}）`);
  return note.call(this, `${declared.size} 个已声明令牌`);
});

/* ---------------------------------------------------------------- 07 */
function containerBreakpoints(text) {
  const out = new Set();
  const block = /@container([^{}]*)\{/g;
  let m;
  while ((m = block.exec(text)) !== null) {
    for (const width of m[1].matchAll(/(?:max|min)-width:\s*([\d.]+)px/g)) {
      out.add(Math.round(Number(width[1]) * 100) / 100);
    }
  }
  return out;
}

function layoutThresholds(js, fnName) {
  const at = js.indexOf(`function ${fnName}`);
  if (at < 0) return null;
  const open = js.indexOf('{', at);
  let depth = 0;
  let end = open;
  for (let i = open; i < js.length; i += 1) {
    if (js[i] === '{') depth += 1;
    else if (js[i] === '}' && (depth -= 1) === 0) { end = i; break; }
  }
  const nums = new Set();
  const re = /\b(?:w|width|stageWidth|canvasWidth)\s*[<>]=?\s*(\d{3,4})\b/g;
  let m;
  while ((m = re.exec(js.slice(open, end))) !== null) nums.add(Number(m[1]));
  return nums;
}

gate('07 断点一致', async function () {
  const regions = ctx.manifest.regions;
  /* 文档区（spec.css / shell.css）的排版档位单独登记，不与两区档位混用 */
  const docBreakpoints = ctx.manifest.docBreakpoints || [];
  const regionViews = new Set(regions.map((r) => r.view));
  const docFound = new Set(ctx.css
    .filter((rel) => !regionViews.has(rel))
    .flatMap((rel) => [...containerBreakpoints(ctx.files.get(rel))]));
  const union = new Set([...regions.flatMap((r) => r.cssBreakpoints), ...docBreakpoints]);
  const shared = new Set(ctx.css
    .filter((rel) => rel.startsWith('src/base') || rel.startsWith('src/components'))
    .flatMap((rel) => [...containerBreakpoints(ctx.files.get(rel))]));

  for (const declared of docBreakpoints) {
    if (!docFound.has(declared)) fail.call(this, `manifest.docBreakpoints 登记了 ${declared}px，但文档区 CSS 里没有对应容器查询`);
  }

  for (const rel of ctx.css) {
    const text = ctx.files.get(rel);
    if (!MEDIA_WIDTH_ALLOW.includes(rel)) {
      lineHits(rel, text, /@media\s*\(\s*(?:max|min)-width/g, (m, where) => {
        fail.call(this, `${where} 用视口宽度查询，跨断点必须走 @container region`);
      });
    }
    for (const n of containerBreakpoints(text)) {
      if (!union.has(n)) fail.call(this, `${rel} 出现未登记断点 ${n}px，先加进 tools/manifest.json`);
    }
  }

  for (const region of regions) {
    const found = containerBreakpoints(ctx.files.get(region.view) || '');
    const allowed = new Set([...region.cssBreakpoints, ...shared]);
    for (const declared of region.cssBreakpoints) {
      if (!found.has(declared)) fail.call(this, `${region.id} 登记了 ${declared}px，但 ${region.view} 里没有对应容器查询`);
    }
    for (const n of found) {
      if (!allowed.has(n)) fail.call(this, `${region.view} 用了 ${n}px，不在 ${region.id} 的断点表 [${region.cssBreakpoints}] 里`);
    }
    for (const t of region.jsThresholds) {
      if (!found.has(t - 1) && !found.has(t)) {
        fail.call(this, `${region.id} 的 JS 档位 ${t}px 在 ${region.view} 里找不到 ${t - 1}px 或 ${t}px 容器查询`);
      }
    }
    const js = ctx.files.get(region.jsFile);
    if (js === undefined) return fail.call(this, `缺少 ${region.jsFile}`);
    const nums = layoutThresholds(js, region.layoutFn);
    if (!nums) return fail.call(this, `${region.jsFile} 里找不到 ${region.layoutFn}()`);
    const missing = region.jsThresholds.filter((t) => !nums.has(t));
    const extra = [...nums].filter((n) => !region.jsThresholds.includes(n)).sort((a, b) => a - b);
    if (missing.length || extra.length) {
      fail.call(this, `${region.layoutFn}() 档位与 manifest 不符：缺 [${missing}] 多 [${extra}]`);
    }
  }
  return note.call(this, `${regions.map((r) => `${r.id} ${r.cssBreakpoints.join('/')}`).join(' · ')}${docBreakpoints.length ? ` · 文档区 ${docBreakpoints.join('/')}` : ''}`);
});

/* ---------------------------------------------------------------- 08 */
gate('08 颜色只有令牌源', async function () {
  const re = /#[0-9a-fA-F]{3,8}\b(?![0-9a-fA-F])|\brgba?\(|\bhsla?\(|(?<=:\s)(?:white|black|red|blue|green|gray|grey|yellow|orange|pink|purple)(?=\s*[;:}])/g;
  /* JS 与 HTML 里只抓「真的在赋值颜色」的位置：文案中的 #7741 这类编号必须放过 */
  const jsRe = /(?:setProperty\(\s*['"][^'"]*['"]\s*,\s*['"]|style="[^"]*|color:\s*)(#[0-9a-fA-F]{3,8}\b|rgba?\(|hsl?\()/g;
  /* tokens.data.js 是令牌源的镜像，字面值来自 tokens.css，不算第二处定义 */
  const skip = new Set([...COLOR_LITERAL_ALLOW, ctx.manifest.generated.tokensData]);
  /* 视图是原型自己的增量：这里的残留按债务计数汇报，共享层与规范区一律硬失败。
     不给它们批量造 --color-proto-<hash> 之类的哑令牌，那是把门禁变成摆设。 */
  let debt = 0;
  for (const rel of ctx.css) {
    if (skip.has(rel)) continue;
    /* data-uri 里的颜色是 URL 编码，无法引用令牌，已在 field.css 注释标注例外 */
    const text = stripComments(ctx.files.get(rel)).replace(/url\(\s*["']?[^)]*["']?\s*\)/g, '');
    const n = (text.match(re) || []).length;
    if (!n) continue;
    if (rel.startsWith('src/views/')) debt += n;
    else fail.call(this, `${rel} 含 ${n} 处颜色字面量，改用 tokens.css 里的语义令牌`);
  }
  for (const rel of [...ctx.js, ...ctx.html]) {
    if (skip.has(rel)) continue;
    const n = (stripComments(ctx.files.get(rel)).match(jsRe) || []).length;
    if (n) fail.call(this, `${rel} 有 ${n} 处直接写颜色，改用 var(--color-…)`);
  }
  if (debt) note.call(this, `视图残留 ${debt} 处字面色（债务，逐值归名后再收进硬门禁）`);
  else note.call(this, '零字面色值');
});

/* ---------------------------------------------------------------- 09 */
gate('09 视口单位禁令', async function () {
  for (const rel of ctx.css) {
    lineHits(rel, stripComments(ctx.files.get(rel)),
      /\b\d*\.?\d+(cqh|cqw|cqb|cqmin|cqmax|dvh|svh|lvh|vh|dvw|svw|lvw|vw|vmin|vmax)\b/g, (m, where) => {
        if (m[1].startsWith('cq')) fail.call(this, `${where} 用了 ${m[1]}，容器高度/宽度单位会双重解算，只允许 cqi`);
        else if (!VIEWPORT_UNIT_ALLOW.includes(rel)) fail.call(this, `${where} 用了 ${m[1]}，视图内高度一律走 var(--viewport-h)`);
      });
  }
});

/* ---------------------------------------------------------------- 10 */
gate('10 定位禁令', async function () {
  for (const rel of ctx.css) {
    if (FIXED_ALLOW.includes(rel)) continue;
    lineHits(rel, stripComments(ctx.files.get(rel)), /position\s*:\s*fixed/g, (m, where) => {
      fail.call(this, `${where} 用 position: fixed，区域已是包含块，弹层必须用 absolute`);
    });
  }
});

/* ---------------------------------------------------------------- 11 */
gate('11 图标零 emoji', async function () {
  const isGlyph = (ch) => (EMOJI_ONE_OFF.has(ch)
    ? true
    : EMOJI_RANGES.some(([lo, hi]) => {
      const cp = ch.codePointAt(0);
      return cp >= lo && cp <= hi;
    }));
  const hits = new Map();
  for (const rel of [...ctx.html, ...ctx.css, ...ctx.js]) {
    ctx.files.get(rel).split('\n').forEach((line, i) => {
      const chars = [...line].filter(isGlyph);
      if (chars.length) hits.set(`${rel}:${i + 1}`, [...new Set(chars)].join(' '));
    });
  }
  for (const [where, chars] of hits) fail.call(this, `${where} 用了图形字符「${chars}」，改用 <use href="#i-…">`);
  return note.call(this, hits.size ? '' : '零 emoji');
});

/* ---------------------------------------------------------------- 12 */
gate('12 语法与引用完整', async function () {
  for (const rel of ctx.css) {
    const body = stripComments(ctx.files.get(rel));
    const stray = body.match(/\/\*|\*\//g);
    if (stray) fail.call(this, `${rel} 剥完注释仍残留 ${stray.length} 个注释标记，说明有注释被提前闭合，整条规则会被浏览器吞掉`);
    const open = (body.match(/{/g) || []).length;
    const close = (body.match(/}/g) || []).length;
    if (open !== close) fail.call(this, `${rel} 花括号不配平：{ ${open} 对 } ${close}`);
  }
  for (const rel of ctx.js) {
    try {
      execFileSync(process.execPath, ['--check', join(ROOT, rel)], { stdio: 'pipe' });
    } catch (e) {
      fail.call(this, `${rel} 语法错误：${String(e.stderr || e.message).split('\n').slice(0, 3).join(' / ')}`);
    }
  }
  for (const rel of ctx.html) {
    const body = stripComments(ctx.files.get(rel));
    for (const tag of ['div', 'section', 'aside', 'main', 'form', 'table', 'button']) {
      const o = (body.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length;
      const c = (body.match(new RegExp(`</${tag}>`, 'g')) || []).length;
      if (o !== c) fail.call(this, `${rel} 的 <${tag}> 开 ${o} 收 ${c}`);
    }
  }

  /* id 可解析：静态 id 集合里还要收下 JS 动态赋名的写法 */
  const ids = new Set();
  for (const rel of [...ctx.html, ...ctx.js]) {
    const text = ctx.files.get(rel);
    lineHits(rel, text, /\bid="([^"'{}]+)"/g, (m) => ids.add(m[1]));
    lineHits(rel, text, /\.id\s*=\s*['"]([\w-]+)['"]/g, (m) => ids.add(m[1]));
    lineHits(rel, text, /setAttribute\(\s*['"]id['"]\s*,\s*['"]([\w-]+)['"]/g, (m) => ids.add(m[1]));
  }
  const want = new Map();
  for (const rel of [...ctx.js, ...ctx.html]) {
    lineHits(rel, ctx.files.get(rel), /getElementById\(\s*['"]([\w-]+)['"]\s*\)/g, (m, where) => {
      if (!ids.has(m[1]) && !want.has(m[1])) want.set(m[1], where);
    });
    /* 改过 id 却漏改字符串比较，是合并单页时最容易留下的一类哑火：
       委托永远不命中，页面不报错，只是点没反应。这里一并抓出来。 */
    lineHits(rel, ctx.files.get(rel),
      /\.(?:id)\s*[!=]==?\s*['"]([\w-]+)['"]|(?:(?:closest|matches)\(\s*['"]#([\w-]+)['"])/g, (m, where) => {
      const hit = m[1] || m[2];
      if (hit && !ids.has(hit) && !want.has(hit)) want.set(hit, where);
    });
  }
  for (const [id, where] of want) fail.call(this, `${where} 取的 #${id} 在源码里不存在`);
  return note.call(this, want.size ? '' : `${ids.size} 个 id 可解析`);
});

/* ---------------------------------------------------------------- 13 */
gate('13 画布缩放只用 transform', async function () {
  /* CSS zoom 会重解布局：实测祖先 zoom:.5 时画布自认 1578px 宽，
     容器查询当场跳档，直接违反「嵌入与全屏每档一致」。缩放一律走 transform。 */
  const re = /(^|[^-\w])zoom\s*:/g;
  for (const rel of [...ctx.css, ...ctx.html]) {
    lineHits(rel, stripComments(ctx.files.get(rel)), re, (m, where) => {
      fail.call(this, `${where} 用了 CSS zoom，画布缩放必须用 transform（zoom 会让容器查询跳档）`);
    });
  }
});

/* ---------------------------------------------------------------- 执行 */
await load();
let failed = 0;
for (const g of gates) {
  const rec = { name: g.name, problems: [], notes: [] };
  await g.fn.call(rec);
  if (rec.problems.length) {
    failed += 1;
    console.log(`✗ ${g.name}（${rec.problems.length}）`);
    rec.problems.slice(0, strict ? Infinity : 8).forEach((p) => console.log(`    ${p}`));
    if (!strict && rec.problems.length > 8) console.log(`    … 另有 ${rec.problems.length - 8} 条，--strict 全量打印`);
  } else {
    console.log(`✓ ${g.name}${rec.notes.length ? `  ${rec.notes.join(' · ')}` : ''}`);
  }
}
console.log(failed ? `\n✗ ${failed}/${gates.length} 条门禁未通过` : `\n✓ ${gates.length} 条门禁全部通过`);
process.exitCode = failed ? 1 : 0;
