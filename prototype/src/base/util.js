/* ============================================================
   共享运行时：两个原型都从这里取实现，禁止在视图里各写一份。
   以 IIFE 挂载到 window.AyaneUI，视图脚本本身也是 IIFE，
   因此不存在跨区域的顶层声明冲突。
   ============================================================ */
(() => {
  'use strict';

  const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), '
    + 'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"']/g, (c) => ESC_MAP[c]);
  }

  const pad2 = (n) => (n < 10 ? '0' + n : '' + n);

  function formatClock(ts) {
    const d = new Date(ts);
    return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  function formatClockSec(ts) {
    const d = new Date(ts);
    return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  }

  function formatDateTime(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())
      + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  /* 焦点陷阱：只在本区域内找可聚焦节点 */
  function focusableWithin(container) {
    return Array.from(container.querySelectorAll(FOCUSABLE))
      .filter((node) => node.getClientRects().length > 0);
  }

  function trapFocus(container, event) {
    const nodes = focusableWithin(container);
    if (!nodes.length) { event.preventDefault(); return; }
    const active = document.activeElement;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey) {
      if (active === first || !container.contains(active)) { event.preventDefault(); last.focus(); }
    } else if (active === last || !container.contains(active)) {
      event.preventDefault(); first.focus();
    }
  }

  /* 关闭浮层后把焦点还给触发元素；触发元素已消失时退回 fallback */
  function restoreFocus(el, fallback) {
    const target = el && el.isConnected && typeof el.focus === 'function' && el.getClientRects().length
      ? el
      : fallback;
    if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
  }

  /* 每个区域有自己的 toast 实例，互不抢计时器。
     带 .toast-text 的容器只改写文字节点，图标与语义色留在外层。 */
  function createToast(element, options) {
    const duration = (options && options.duration) || 2200;
    const slot = element.querySelector('.toast-text') || element;
    let timer = 0;
    return function showToast(message) {
      slot.textContent = message;
      element.classList.add('is-visible');
      window.clearTimeout(timer);
      timer = window.setTimeout(() => element.classList.remove('is-visible'), duration);
    };
  }

  window.AyaneUI = {
    FOCUSABLE,
    escapeHtml,
    pad2,
    formatClock,
    formatClockSec,
    formatDateTime,
    focusableWithin,
    trapFocus,
    restoreFocus,
    createToast,
  };
})();
