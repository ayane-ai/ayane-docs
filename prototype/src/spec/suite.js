/* ============================================================
   规范区运行时
   ------------------------------------------------------------
   只做四件事：把令牌表 / 别名表 / 区域旋钮表画出来、深色评审开关、
   画布进出全屏层、示例区的极简交互委托。
   两个原型内部的行为仍归 views/*.script.js 管，本文件不接管。
   ------------------------------------------------------------
   表格数据全部来自 window.AyaneTokens（由 tools/tokens-report.mjs
   从 tokens.css 解析生成），这里不再手写任何令牌清单。
   ============================================================ */
(() => {
  'use strict';

  const UI = window.AyaneUI;
  const TOKENS = window.AyaneTokens || { groups: [], compat: [], total: 0 };
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const byId = (id) => document.getElementById(id);

  const lightMap = new Map();
  TOKENS.groups.forEach((g) => g.tokens.forEach((t) => lightMap.set(t.name, t)));
  const knobGroup = TOKENS.groups.find((g) => /区域旋钮/.test(g.title));

  /* 自定义属性在 getComputedStyle 里不会代入 var()，按令牌表手动展开一层，
     旋钮表才能读到真正落地的值。 */
  function resolveValue(text, depth) {
    if (!text || (depth || 0) > 3) return text || '';
    return text.replace(/var\(\s*(--[A-Za-z0-9-]+)\s*(,[^)]*)?\)/g, (all, name, fallback) => {
      const hit = lightMap.get(name);
      if (hit) return resolveValue(hit.value, (depth || 0) + 1);
      return fallback ? resolveValue(fallback.slice(1), (depth || 0) + 1) : all;
    });
  }

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function sampleOf(token, groupTitle) {
    if (/颜色/.test(groupTitle)) return 'color';
    if (/阴影/.test(groupTitle)) return 'shadow';
    if (/圆角/.test(groupTitle)) return 'radius';
    if (/描边宽度/.test(groupTitle)) return 'stroke';
    if (/间距/.test(groupTitle)) return 'space';
    if (/排版/.test(groupTitle) && token.name.startsWith('--font')) return 'font';
    if (/图标尺寸|头像尺寸|控件高度/.test(groupTitle)) return 'box';
    return '';
  }

  function sampleNode(kind, value, extraCls) {
    const node = el('span', `sample sample--${kind}${extraCls ? ` ${extraCls}` : ''}`);
    node.style.setProperty('--sample-v', value);
    return node;
  }

  /* ------------------------------------------------------------
     01 · 令牌表：每组一张表，样本格画得出形状就不只列数值
     ------------------------------------------------------------ */
  function renderTokens() {
    const host = byId('token-groups');
    if (!host) return;
    const count = byId('token-count');
    if (count) count.textContent = `${TOKENS.total} 个令牌 · ${TOKENS.groups.length} 组`;

    TOKENS.groups.forEach((group) => {
      const box = el('div', 'token-group');
      box.dataset.tokenGroup = group.title;
      const head = el('div', 'token-group-head');
      head.append(el('span', '', group.title), el('span', 'count', group.tokens.length));
      box.append(head);

      const wrap = el('div', 'token-table-wrap');
      const table = el('table', 'data-table token-table');
      const thead = el('thead');
      thead.innerHTML = '<tr><th>令牌</th><th>样本</th><th>值</th><th>说明</th><th>NomiKit 对照</th><th>深色覆写</th></tr>';
      const tbody = el('tbody');

      group.tokens.forEach((token) => {
        const tr = el('tr');
        /* 一级树定位到 .token-group 区块；这枚行级锚点为将来的二级保留 */
        tr.dataset.token = token.name;
        const tdSample = el('td');
        const kind = sampleOf(token, group.title);
        if (kind) {
          const pair = el('span', 'swatch-pair');
          pair.append(sampleNode(kind, token.value));
          if (token.dark) pair.append(sampleNode(kind, token.dark, 'is-dark-end'));
          tdSample.append(pair);
        } else if (/颜色/.test(group.title)) {
          tdSample.append(el('span', 'sample-empty'));
        }
        tr.append(
          el('td', 'cell-name', token.name),
          tdSample,
          el('td', 'cell-value', token.value),
          el('td', 'cell-desc', token.desc),
          el('td', 'cell-nomi', token.nomikit),
          el('td', 'cell-value', token.dark),
        );
        tbody.append(tr);
      });

      table.append(thead, tbody);
      wrap.append(table);
      box.append(wrap);
      host.append(box);
    });
  }

  /* ------------------------------------------------------------
     02 · 过渡别名表：旧名一律 @deprecated，新代码只读令牌源
     ------------------------------------------------------------ */
  function renderCompat() {
    const tbody = byId('compat-body');
    if (!tbody) return;
    TOKENS.compat.forEach((row) => {
      const tr = el('tr');
      tr.append(
        el('td', 'cell-name', row.name),
        el('td', 'cell-value', resolveValue(row.alias)),
        el('td', 'cell-value', row.alias),
        el('td', 'cell-desc', row.region ? `仅 ${row.region} 区域` : '全局'),
      );
      tbody.append(tr);
    });
    const count = byId('compat-count');
    if (count) count.textContent = `${TOKENS.compat.length} 条`;
  }

  /* ------------------------------------------------------------
     03 · 区域旋钮表：默认值取 :root，两区实测值取画布计算样式
     ------------------------------------------------------------ */
  function renderKnobs() {
    const tbody = byId('knob-body');
    if (!tbody || !knobGroup) return;
    const stages = $$('.region-stage');
    const root = getComputedStyle(document.documentElement);

    knobGroup.tokens.forEach((token) => {
      const fallback = root.getPropertyValue(token.name).trim();
      const tr = el('tr');
      const cells = [token.value || fallback];
      stages.forEach((stage) => {
        cells.push(getComputedStyle(stage).getPropertyValue(token.name).trim() || fallback);
      });
      const base = resolveValue(cells[0]);
      tr.append(el('td', 'cell-name', token.name), el('td', 'cell-desc', token.desc));
      cells.forEach((text) => {
        const same = resolveValue(text) === base;
        tr.append(el('td', same ? '' : 'knob-diff', text));
      });
      tbody.append(tr);
    });
  }

  /* ------------------------------------------------------------
     04 · 深色评审开关：只挂在两个文档分区上，画布不受影响
     ------------------------------------------------------------ */
  function setupTheme() {
    const button = byId('theme-toggle');
    if (!button) return;
    /* byId 要的是裸 id：写成 '#sec-tokens' 会静默取空，开关就再也不落到分区上 */
    const scopes = ['sec-tokens', 'sec-components'].map(byId).filter(Boolean);
    button.addEventListener('click', () => {
      const dark = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(dark));
      scopes.forEach((scope) => scope.setAttribute('data-theme', dark ? 'dark' : 'light'));
      const state = byId('theme-state');
      if (state) state.textContent = dark ? '深色' : '浅色';
    });
  }

  /* ------------------------------------------------------------
     05 · 全屏层：移动画布节点，不复制标记，因此断点只有一套
     ------------------------------------------------------------ */
  const OVERLAY_OPEN = '.modal-layer.is-open, .drawer.is-open, .popover.is-open, .sidebar-menu.is-open, .companion-drawer.is-open';

  function setupFullscreen() {
    $$('.region-fullscreen-layer').forEach((layer) => {
      const open = byId(`${layer.id}-open`);
      const close = byId(`${layer.id}-close`);
      const slot = byId(`${layer.id}-slot`);
      if (!open || !close || !slot || !layer.hasAttribute('popover')) return;

      /* 关闭事件统一在这里把画布送回原槽位：按钮、ESC、程序调用都走同一条路 */
      layer.addEventListener('toggle', (event) => {
        if (event.newState !== 'closed') return;
        const current = layer.querySelector('.region-stage');
        if (current) slot.append(current);
        open.setAttribute('aria-expanded', 'false');
        UI.restoreFocus(open, null);
      });

      open.addEventListener('click', () => {
        const current = slot.querySelector('.region-stage');
        if (!current || layer.matches(':popover-open')) return;
        layer.append(current);
        layer.showPopover();
        open.setAttribute('aria-expanded', 'true');
        UI.restoreFocus(close, null);
      });

      close.addEventListener('click', () => {
        if (layer.matches(':popover-open')) layer.hidePopover();
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const layer = $$('.region-fullscreen-layer').find((node) => node.matches(':popover-open'));
      if (!layer) return;
      /* 内层浮层优先：画布里还开着模态或抽屉时，这一次 ESC 归原型处理 */
      if (layer.querySelector(OVERLAY_OPEN)) return;
      layer.hidePopover();
    });
  }

  /* ------------------------------------------------------------
     07 · 示例区交互：靠 data-demo 属性驱动，不给每个示例单写脚本
     ------------------------------------------------------------ */
  const toasters = new WeakMap();

  function stateClass(target) {
    return target.getAttribute('data-demo-state') || 'is-open';
  }

  function setOpen(target, open) {
    const cls = stateClass(target);
    target.classList.toggle(cls, open);
    if (cls === 'is-open') {
      $$(`[aria-controls="${target.id}"]`).forEach((trigger) => trigger.setAttribute('aria-expanded', String(open)));
    }
  }

  function openerOf(target) {
    return $$(`[aria-controls="${target.id}"]`).find((node) => node.matches('button'));
  }

  function setupDemos() {
    /* 示例表单不提交：file:// 下回车会引发整页跳转 */
    document.addEventListener('submit', (event) => {
      if (event.target.closest('.demo-frame')) event.preventDefault();
    });

    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-demo]');
      if (!trigger) return;
      const action = trigger.getAttribute('data-demo');
      const control = trigger.getAttribute('aria-controls');
      const target = control ? byId(control) : action === 'scrim' ? trigger : null;

      if (action === 'scrim') {
        /* 遮罩就是浮层自身：只有直接点在铺满层上才关闭，点到内容不关 */
        if (target && event.target === trigger) setOpen(target, false);
        return;
      }
      if (action === 'toggle' && target) {
        setOpen(target, !target.classList.contains(stateClass(target)));
        return;
      }
      if (action === 'open' && target) {
        setOpen(target, true);
        const scrim = byId(`${target.id}-scrim`);
        if (scrim) setOpen(scrim, true);
        return;
      }
      if (action === 'close' && target) {
        setOpen(target, false);
        const scrim = byId(`${target.id}-scrim`);
        if (scrim) setOpen(scrim, false);
        UI.restoreFocus(openerOf(target), trigger);
        return;
      }
      if (action === 'toast' && target) {
        if (!toasters.has(target)) {
          toasters.set(target, UI.createToast(target, { duration: 2200 }));
        }
        target.classList.toggle('is-error', trigger.getAttribute('data-demo-tone') === 'error');
        toasters.get(target)(trigger.getAttribute('data-demo-message') || target.textContent.trim());
        return;
      }
      if (action === 'switch') {
        const on = trigger.getAttribute('aria-checked') !== 'true';
        trigger.setAttribute('aria-checked', String(on));
        trigger.setAttribute('aria-pressed', String(on));
        return;
      }
      if (action === 'reveal' && target) {
        const shown = trigger.getAttribute('aria-pressed') === 'true';
        trigger.setAttribute('aria-pressed', String(!shown));
        target.type = shown ? 'password' : 'text';
        trigger.setAttribute('aria-label', shown ? '显示口令' : '隐藏口令');
        const use = trigger.querySelector('use');
        if (use) use.setAttribute('href', shown ? '#i-eye' : '#i-eye-off');
        return;
      }
      if (action === 'activate') {
        const group = trigger.closest(trigger.getAttribute('data-demo-group') || '[data-demo-group]')
          || trigger.parentElement;
        $$('[data-demo="activate"]', group).forEach((node) => {
          const active = node === trigger;
          node.classList.toggle('is-active', active);
          if (node.hasAttribute('aria-selected')) node.setAttribute('aria-selected', String(active));
          if (node.hasAttribute('aria-current')) node.setAttribute('aria-current', active ? 'page' : 'false');
        });
      }
    });
  }

  /* ------------------------------------------------------------
     08 · 单源验证入口：改一处令牌，规范区与两张画布同时变
            .review/capture.mjs 用它证明「一次改动全域生效」
     ------------------------------------------------------------ */
  window.AyaneSpec = {
    setToken(name, value) {
      document.documentElement.style.setProperty(name, value);
    },
    clearToken(name) {
      document.documentElement.style.removeProperty(name);
    },
    readToken(name) {
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    },
    layoutOf(region) {
      const stage = document.querySelector(`[data-proto="${region}"]`);
      return stage ? {
        width: Math.round(stage.getBoundingClientRect().width),
        height: Math.round(stage.getBoundingClientRect().height),
        layout: stage.getAttribute('data-layout') || '',
      } : null;
    },
  };

  renderTokens();
  renderCompat();
  renderKnobs();
  setupTheme();
  setupFullscreen();
  setupDemos();
})();
