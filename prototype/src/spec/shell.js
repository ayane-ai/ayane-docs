/* ============================================================
   外壳运行时：左侧菜单 + 层级树 + 画布（平移 / 缩放）
   ------------------------------------------------------------
   职责边界：本文件只管「看」，不管「原型内部怎么动」。
   两个原型自己的交互仍归 views/*.script.js，深色评审与令牌表仍归 suite.js。
   ------------------------------------------------------------
   缩放只用 transform，绝不用 CSS zoom：zoom 会重解布局，实测祖先
   zoom:.5 时画布自认 1578px 宽，容器查询当场跳档（见 shell.css 头注）。
   因此档位读取一律走 offsetWidth，缩放和平移都不会改变它。
   ============================================================ */
(() => {
  'use strict';

  const canvas = document.getElementById('canvas');
  const layer = document.getElementById('canvas-layer');
  const tree = document.getElementById('suite-tree');
  const layersBox = document.getElementById('tree-layers');
  const shell = document.getElementById('suite-shell');
  const viewLabel = document.getElementById('suite-view-label');
  const pctEl = document.getElementById('zoom-pct');
  if (!canvas || !layer || !tree || !layersBox || !shell) return;

  const MIN_K = 0.2;
  const MAX_K = 4;
  const FIT_PAD = 44;
  const PAGES = Array.from(tree.querySelectorAll('[data-page]'));
  const view = { x: 0, y: 0, k: 1 };
  let active = null;

  const clampK = (k) => Math.min(MAX_K, Math.max(MIN_K, k));
  const pageOf = (id) => document.getElementById(`sec-${id}`);

  /* ------------------------------------------------------------
     视图变换
     ------------------------------------------------------------ */
  function applyView() {
    layer.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.k})`;
    if (pctEl) pctEl.textContent = `${Math.round(view.k * 100)}%`;
  }

  function resetView() {
    view.k = 1;
    view.x = 0;
    view.y = 0;
    applyView();
  }

  /** 以画布内某点为锚缩放：先算倍率，再把锚点拉回原位 */
  function zoomAt(cx, cy, factor) {
    const next = clampK(view.k * factor);
    const f = next / view.k;
    view.x = cx - (cx - view.x) * f;
    view.y = cy - (cy - view.y) * f;
    view.k = next;
    applyView();
  }

  function zoomCenter(factor) {
    zoomAt(canvas.clientWidth / 2, canvas.clientHeight / 2, factor);
  }

  /** 适应窗口：按宽度贴合当前页并顶部对齐（长文档纵向靠平移看） */
  function fitToWindow() {
    const page = active && pageOf(active);
    if (!page) return resetView();
    const available = canvas.clientWidth - FIT_PAD * 2;
    const natural = page.offsetWidth || available;
    view.k = clampK(Math.min(1, available / natural));
    view.x = (canvas.clientWidth - natural * view.k) / 2;
    view.y = FIT_PAD / 2;
    applyView();
    return true;
  }

  /* ------------------------------------------------------------
     页面切换
     ------------------------------------------------------------ */
  function setPage(id) {
    const page = pageOf(id);
    if (!page) return;
    active = id;
    PAGES.forEach((item) => {
      const on = item.getAttribute('data-page') === id;
      item.setAttribute('aria-selected', String(on));
      item.tabIndex = on ? 0 : -1;
    });
    layer.querySelectorAll('.canvas-page').forEach((section) => {
      section.hidden = section !== page;
    });
    if (viewLabel) {
      const item = PAGES.find((node) => node.getAttribute('data-page') === id);
      const name = item.querySelector('.nm') || item;
      viewLabel.textContent = `${item.getAttribute('data-no')} · ${name.textContent.trim()}`;
    }
    resetView();
    renderTree();
    if (window.location.hash !== `#sec-${id}`) {
      history.replaceState(null, '', `#sec-${id}`);
    }
  }

  tree.addEventListener('click', (event) => {
    const item = event.target.closest('[data-page]');
    if (item) {
      setPage(item.getAttribute('data-page'));
      closeTreeDrawer();
    }
  });

  /* ------------------------------------------------------------
     层级树：当前只做一级，右侧计数表示该节点自身的规模
     ------------------------------------------------------------ */
  function nodeButton(label, count, target) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tree-node';
    btn.dataset.target = target;
    const nm = document.createElement('span');
    nm.className = 'nm';
    nm.textContent = label;
    btn.append(nm);
    if (count) {
      const cnt = document.createElement('span');
      cnt.className = 'cnt';
      cnt.textContent = String(count);
      btn.append(cnt);
    }
    return btn;
  }

  /** 令牌页：一级 = 令牌分组，定位到 .token-group 区块 */
  function tokensTree() {
    const data = window.AyaneTokens || { groups: [] };
    return data.groups.map((group, index) => nodeButton(
      group.title.split('（')[0],
      group.tokens.length,
      `group:${index}`,
    ));
  }

  /** 组件页：一级 = 大卡片内的分类。标题取 .demo-cat-head（剔除其中的副标题节点），
      计数为该分类内示例画布之和；序号只在这里生成，markup 不重复写 */
  function componentsTree() {
    const page = pageOf('components');
    return Array.from(page.querySelectorAll('.demo-cat')).map((cat, index) => {
      const head = cat.querySelector('.demo-cat-head');
      const note = head ? head.querySelector('.demo-cat-note') : null;
      const title = head
        ? Array.from(head.childNodes).filter((n) => n !== note).map((n) => n.textContent).join('').trim()
        : '';
      return nodeButton(`${String(index + 1).padStart(2, '0')} ${title || '分类'}`,
        cat.querySelectorAll('.demo-frame').length,
        `cat:${index}`);
    });
  }

  /** 原型页：一级 = 画布直接子级；内层 data-layer 只参与计数，
      标注按两级预留，将来开二级时是唯一的命名来源。 */
  function prototypeTree(region) {
    const stage = document.querySelector(`[data-proto="${region}"]`);
    if (!stage) return [];
    return Array.from(stage.children).map((child, index) => nodeButton(
      `${String(index + 1).padStart(2, '0')} ${child.getAttribute('data-layer')
        || `${child.tagName.toLowerCase()}·${index + 1}`}`,
      child.querySelectorAll('[data-layer]').length,
      `layer:${region}:${index}`,
    ));
  }

  function renderTree() {
    if (!active) return;
    layersBox.textContent = '';
    const head = document.createElement('p');
    head.className = 'tree-head';
    head.append(Object.assign(document.createElement('b'), { textContent: '层级' }));
    const hint = document.createElement('span');
    hint.textContent = active === 'tokens' || active === 'components' ? '点击定位' : 'data-layer 标注';
    head.append(hint);
    layersBox.append(head);

    const nodes = active === 'tokens' ? tokensTree()
      : active === 'components' ? componentsTree()
        : prototypeTree(active);

    if (!nodes.length) {
      const empty = document.createElement('p');
      empty.className = 'tree-empty';
      empty.textContent = '这一页还没有可导航的子结构。';
      layersBox.append(empty);
      return;
    }
    nodes.forEach((node) => layersBox.append(node));
  }

  /* ------------------------------------------------------------
     定位：把目标平移到画布中央并描边
     ------------------------------------------------------------ */
  function findTarget(spec) {
    const page = active && pageOf(active);
    if (!page) return null;
    const [kind, a, b] = spec.split(':');
    if (kind === 'group') return page.querySelectorAll('.token-group')[Number(a)] || null;
    if (kind === 'cat') return page.querySelectorAll('.demo-cat')[Number(a)] || null;
    if (kind === 'component') { const node=document.getElementById(a); return node && page.contains(node) ? node : null; }
    if (kind !== 'layer') return null;
    const stage = document.querySelector(`[data-proto="${a}"]`);
    if (!stage) return null;
    return stage.children[Number(b)] || null;
  }

  let located = null;
  function locate(spec) {
    const target = findTarget(spec);
    if (!target) return;
    const cr = canvas.getBoundingClientRect();
    const tr = target.getBoundingClientRect();
    view.x += (cr.left + cr.width / 2) - (tr.left + tr.width / 2);
    view.y += (cr.top + cr.height / 2) - (tr.top + tr.height / 2);
    applyView();
    if (located) located.classList.remove('is-located');
    located = target;
    target.classList.add('is-located');
    window.setTimeout(() => {
      target.classList.remove('is-located');
      if (located === target) located = null;
    }, 1200);
  }

  layersBox.addEventListener('click', (event) => {
    const node = event.target.closest('.tree-node');
    if (!node) return;
    layersBox.querySelectorAll('.tree-node[aria-current="true"]')
      .forEach((other) => other.removeAttribute('aria-current'));
    node.setAttribute('aria-current', 'true');
    locate(node.dataset.target);
  });

  /* ------------------------------------------------------------
     画布输入：滚轮、拖拽、双击、快捷键
     ------------------------------------------------------------ */
  const SCROLLABLE = /auto|scroll|overlay/;

  function insideScroller(node) {
    for (let el = node; el && el !== layer; el = el.parentElement) {
      const s = getComputedStyle(el);
      const y = SCROLLABLE.test(s.overflowY) && el.scrollHeight > el.clientHeight + 1;
      const x = SCROLLABLE.test(s.overflowX) && el.scrollWidth > el.clientWidth + 1;
      if (y || x) return true;
    }
    return false;
  }

  function onBackground(node) {
    return node === canvas || node === layer || node.classList.contains('canvas-page')
      || node.classList.contains('spec-region');
  }

  canvas.addEventListener('wheel', (event) => {
    const rect = canvas.getBoundingClientRect();
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      zoomAt(event.clientX - rect.left, event.clientY - rect.top, Math.exp(-event.deltaY * 0.0022));
      return;
    }
    if (insideScroller(event.target)) return;   /* 交给原生滚动，不拦 */
    if (onBackground(event.target)) {
      event.preventDefault();
      view.x -= event.deltaX;
      view.y -= event.deltaY;
      applyView();
    }
  }, { passive: false });

  let spaceHeld = false;
  let drag = null;

  canvas.addEventListener('pointerdown', (event) => {
    const pan = onBackground(event.target) || spaceHeld || event.button === 1;
    if (!pan) return;
    drag = { id: event.pointerId, sx: event.clientX, sy: event.clientY, ox: view.x, oy: view.y };
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('is-grabbing');
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    view.x = drag.ox + (event.clientX - drag.sx);
    view.y = drag.oy + (event.clientY - drag.sy);
    applyView();
  });

  function endDrag(event) {
    if (!drag || (event && event.pointerId !== drag.id)) return;
    try { canvas.releasePointerCapture(drag.id); } catch { /* 已释放 */ }
    drag = null;
    canvas.classList.remove('is-grabbing');
  }

  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('dblclick', (event) => {
    if (onBackground(event.target)) fitToWindow();
  });

  /* Space 只在该页背景或画布自身有焦点时才当平移键，
     否则会把「空格按下当前按钮」一起触发。 */
  function spaceIsSafe(event) {
    const t = event.target;
    if (!t || t.closest) {
      if (t.closest('input, textarea, select, button, a, [role="tab"], [role="menuitem"], [role="switch"], [contenteditable="true"]')) return false;
    }
    return t === document.body || t === canvas || t === layer;
  }

  document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && spaceIsSafe(event)) {
      spaceHeld = true;
      event.preventDefault();
      return;
    }
    const t = event.target;
    if (t && t.closest && t.closest('input, textarea, select')) return;
    if (event.key === '+' || event.key === '=') { zoomCenter(1.2); event.preventDefault(); }
    else if (event.key === '-' || event.key === '_') { zoomCenter(1 / 1.2); event.preventDefault(); }
    else if (event.key === '0') { resetView(); event.preventDefault(); }
    else if (event.key === '1') { view.k = 1; applyView(); event.preventDefault(); }
    else if (event.key === 'f' || event.key === 'F') { fitToWindow(); event.preventDefault(); }
  });

  document.addEventListener('keyup', (event) => {
    if (event.code === 'Space') spaceHeld = false;
  });

  /* ------------------------------------------------------------
     HUD 与窄屏抽屉
     ------------------------------------------------------------ */
  const hud = document.getElementById('canvas-hud');
  if (hud) {
    hud.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-zoom]');
      if (!btn) return;
      const kind = btn.getAttribute('data-zoom');
      if (kind === 'in') zoomCenter(1.2);
      else if (kind === 'out') zoomCenter(1 / 1.2);
      else if (kind === 'fit') fitToWindow();
      else resetView();
    });
  }

  const treeToggle = document.getElementById('tree-toggle');
  function closeTreeDrawer() { shell.classList.remove('is-tree-open'); }

  if (treeToggle) {
    treeToggle.addEventListener('click', () => {
      const open = !shell.classList.contains('is-tree-open');
      shell.classList.toggle('is-tree-open', open);
      treeToggle.setAttribute('aria-expanded', String(open));
    });
  }

  shell.addEventListener('click', (event) => {
    if (event.target === shell || event.target.classList.contains('canvas')) closeTreeDrawer();
  });

  /* 画布尺寸变化（切页、窗口变化、抽屉开合）后重新贴合 */
  if ('ResizeObserver' in window) {
    let lastW = 0;
    new ResizeObserver(() => {
      const w = canvas.clientWidth;
      if (w === lastW) return;
      lastW = w;
      fitToWindow();
    }).observe(canvas);
  }

  window.AyaneSpec = Object.assign(window.AyaneSpec || {}, {
    setView: resetView,
    fit: fitToWindow,
    showPage: setPage,
    locate,
    viewOf: () => ({ ...view }),
  });

  const initial = (window.location.hash || '').replace('#sec-', '');
  setPage(PAGES.some((p) => p.getAttribute('data-page') === initial) ? initial : 'tokens');
})();
