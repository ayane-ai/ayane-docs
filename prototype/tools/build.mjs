/* ============================================================
   单文件构建：include 展开
   ------------------------------------------------------------
   - 指令支持 `<!-- include: path -->` 与旧的 `<!-- @include path -->`。
   - 路径以 prototype/ 为根；./ 与 ../ 形式按当前文件目录解析。
   - .css / .js 会分别包进 <style> / <script>，HTML 片段原样插入。
   - 递归展开，深度上限 5；同一文件在当前栈再次出现即判为环。
   - dist 头部记录聚合源码 sha256，check.mjs 用它判断发布物新鲜度。
   ============================================================ */
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_DEPTH = 5;
const DIRECTIVE = /<!--\s*(?:@include\s+|include:\s*)(\S+)\s*-->/g;
const LEFTOVER = /<!--\s*(?:@include\s+|include:\s*)\S+\s*-->/;

export async function readManifest() {
  return JSON.parse(await readFile(join(ROOT, 'tools', 'manifest.json'), 'utf8'));
}

function toRel(raw, fromFile) {
  const base = raw.startsWith('.') ? dirname(join(ROOT, fromFile)) : ROOT;
  const abs = resolve(base, raw);
  if (abs !== ROOT && !abs.startsWith(ROOT + sep)) {
    throw new Error(`include 路径越出 prototype/ 根：${raw}（${fromFile}）`);
  }
  return abs.slice(ROOT.length + 1).split('\\').join('/');
}

function extOf(rel) {
  const i = rel.lastIndexOf('.');
  return i < 0 ? '' : rel.slice(i + 1).toLowerCase();
}

function wrap(rel, ext, text) {
  if (ext === 'css') {
    if (/<\/style/i.test(text)) throw new Error(`${rel} 内含 style 结束标签，无法内联`);
    return `<style data-source="${rel}">\n${text.trim()}\n</style>`;
  }
  if (ext === 'js') {
    if (/<\/script/i.test(text)) throw new Error(`${rel} 内含 </script>，无法内联`);
    return `<script data-source="${rel}">\n${text.trim()}\n</script>`;
  }
  return text.trim();
}

async function expand(rel, depth, stack, state) {
  if (depth > MAX_DEPTH) throw new Error(`include 深度超过 ${MAX_DEPTH}：${rel}`);
  if (stack.includes(rel)) throw new Error(`include 成环：${[...stack, rel].join(' → ')}`);

  const abs = join(ROOT, rel);
  let text;
  try {
    text = await readFile(abs, 'utf8');
  } catch {
    throw new Error(`include 目标不存在：${rel}（引自 ${stack[stack.length - 1] || rel}）`);
  }
  state.order.push({ path: rel, text });

  const nextStack = [...stack, rel];
  let out = '';
  let cursor = 0;
  let match;
  const directives = new RegExp(DIRECTIVE.source, 'g');
  while ((match = directives.exec(text)) !== null) {
    out += text.slice(cursor, match.index);
    const target = toRel(match[1], rel);
    const inner = await expand(target, depth + 1, nextStack, state);
    out += wrap(target, extOf(target), inner);
    cursor = match.index + match[0].length;
  }
  out += text.slice(cursor);
  return out;
}

export function fingerprint(order) {
  return createHash('sha256')
    .update(order.map((s) => `${s.path}\n${s.text}\n`).join(''))
    .digest('hex');
}

export async function build() {
  const manifest = await readManifest();
  const state = { order: [] };
  const body = await expand(manifest.entry, 0, [], state);
  const digest = fingerprint(state.order);
  const head = `<!--\n  生成物 · 请勿手改 · dist 只是 src/ 的快照\n`
    + `  源：${manifest.entry} + ${state.order.length - 1} 个 include\n`
    + `  sha256: ${digest}\n`
    + `  重建：node tools/build.mjs\n-->`;
  const html = body.replace(/<!doctype\s+html\s*>/i, (m) => `${m}\n${head}`);
  if (LEFTOVER.test(html)) {
    throw new Error(`展开后仍留有 include 指令：${html.match(LEFTOVER)[0]}`);
  }
  return { html, digest, manifest, order: state.order };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const wantStdout = process.argv.includes('--stdout');
  const result = await build();
  if (wantStdout) {
    process.stdout.write(result.html);
  } else {
    const out = join(ROOT, result.manifest.out);
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, result.html, 'utf8');
    console.log(`✓ ${result.manifest.out}  ${(Buffer.byteLength(result.html) / 1024).toFixed(1)} KB`
      + `  ·  ${result.order.length} 个源  ·  sha256 ${result.digest.slice(0, 16)}`);
  }
}


