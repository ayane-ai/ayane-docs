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
  const TOKENS = window.AyaneTokens || { groups: [], total: 0 };
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
    const navCount = byId('token-nav-count');
    if (navCount) navCount.textContent = String(TOKENS.total);
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
          el('td', 'cell-nomi', token.nomikit || '—'),
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
  const OVERLAY_OPEN = '.modal-layer.is-open, .drawer.is-open, .popover.is-open, .sidebar-menu.is-open, .ai-selector.is-open, .filter-select-menu.is-open';

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
  const demoOrigins = new WeakMap();
  const demoLayers = [];
  let demoMessageId = 0;
  const demoConversations = new WeakMap();
  const demoFrameOf = node => node && node.closest('.demo-frame');
  const demoTarget = (frame,id) => id ? frame.querySelector('[id="'+id+'"]') : null;
  function stateClass(target) { return target.getAttribute('data-demo-state') || 'is-open'; }
  function openerOf(target) { const frame=demoFrameOf(target);return frame && Array.from(frame.querySelectorAll('[aria-controls]')).find(node=>node.matches('button')&&node.getAttribute('aria-controls')===target.id); }
  function setOpen(target, open, trigger) {
    const frame=demoFrameOf(target); if(!frame)return;
    const cls=stateClass(target); target.classList.toggle(cls,open);
    frame.querySelectorAll('[aria-controls]').forEach(node=>{if(node.getAttribute('aria-controls')===target.id&&node.matches('button'))node.setAttribute('aria-expanded',String(open));});
    const scrim=demoTarget(frame,target.id+'-scrim');if(scrim)scrim.classList.toggle(stateClass(scrim),open);
    const oldIndex=demoLayers.indexOf(target);if(oldIndex>=0)demoLayers.splice(oldIndex,1);
    if(open){
      if(trigger)demoOrigins.set(target,trigger);demoLayers.push(target);
      const dialog=target.matches('[role="dialog"]')?target:target.querySelector('[role="dialog"]');
      if(dialog)requestAnimationFrame(()=>{if(target.classList.contains(cls))UI.focusableWithin(dialog)[0]?.focus({preventScroll:true});});
      else if(target.matches('[role="menu"]'))target.querySelector('button')?.focus({preventScroll:true});
    }else UI.restoreFocus(demoOrigins.get(target)||openerOf(target),trigger);
  }
  function demoToast(frame,message) {
    const target=frame.querySelector('.toast');if(!target)return;
    if(!toasters.has(target))toasters.set(target,UI.createToast(target,{duration:2200}));
    toasters.get(target)(message);
  }
  function renderComponentInventory() {
    const data=window.AyaneComponentInventory; if(!data)return;
    const body=byId('component-inventory-body');
    if(body)body.innerHTML=data.components.map(item=>'<tr><td>'+UI.escapeHtml(item.name)+'</td><td><code>'+UI.escapeHtml(item.selectors.join(' / '))+'</code></td><td>'+ UI.escapeHtml(item.purpose)+'</td><td><code>'+UI.escapeHtml(item.source)+'</code><br>'+UI.escapeHtml(item.uses)+'</td><td><button class="btn btn--sm" type="button" data-demo-locate="'+item.demo+'">定位示例</button></td></tr>').join('');
    let extraId=0;
    for(const frame of document.querySelectorAll('.demo-frame')){
      if(!frame.id)frame.id='demo-extra-'+(++extraId);
            const items=data.components.filter(item=>item.demo===frame.id);
      const detail=document.createElement('details');detail.className='demo-source';
      const summary=document.createElement('summary');summary.textContent=items.length?'组件来源与变体（'+items.length+'项）':'组件来源与用途';detail.append(summary);
      if(!items.length){
        const family=frame.closest('.demo-card')?.querySelector('h4')?.textContent||'基础组件';
        const note=document.createElement('p');note.textContent=family+'：复用共享组件定义。此处展示通用变体，具体使用位置见组件清单。';detail.append(note);frame.append(detail);continue;
      }
      const list=document.createElement('ul');
      for(const item of items){const li=document.createElement('li');li.textContent=item.purpose+' · '+item.name+'：'+item.selectors.join('、')+' → '+item.source+'；'+item.uses;list.append(li);}
      detail.append(list);frame.append(detail);
    }
    const count=byId('component-nav-count');if(count)count.textContent=document.querySelectorAll('.demo-card').length;
  }
  function setupDemos() {
    for(const list of document.querySelectorAll('[data-demo-ai-choices]')){
      const frame=demoFrameOf(list),drawer=list.closest('.ai-choice-drawer');
      UI.mountAIChoices(list,()=>{if(drawer)setOpen(drawer,false);});
    }
    for(const nav of document.querySelectorAll('[data-demo-bottom-nav]'))UI.mountCompanionNavigation(nav);
    for(const tabs of document.querySelectorAll('[data-demo-tabs]'))UI.bindSegmentedTabs(tabs);
    for(const frame of document.querySelectorAll('[data-demo-conversation]')){
      const messages=[
        {id:'sample-m1',sender:'ayane',text:'早上好，今天想从哪里开始？',time:'10:40'},
        {id:'sample-m2',sender:'me',text:'想先把今天的事情慢慢说完。',time:'10:41'},
        {id:'sample-m3',sender:'ayane',text:'我在这里听。你可以从最想分享的那件事开始，不用急着把每一个细节都想清楚。',time:'10:42'},
        {id:'sample-m4',sender:'me',text:'今天有点累。',time:'10:43'},
        {id:'sample-m5',sender:'ayane',text:'辛苦了，我陪你慢慢说。我们可以先停下来，给自己一点缓冲的时间。等你准备好了，再一起整理今天发生的事情：让你开心的、让你担心的，还有那些一时说不清楚的感受。你不用一次把所有话说完，我会留在这里，听你按照自己的节奏分享。',time:'10:43'}
      ];
      const recent=frame.querySelector('[data-demo-recent]'),records=frame.querySelector('[data-demo-records]'),layer=frame.querySelector('.client-history-layer');
      UI.renderConversationPair(recent,records,messages);demoConversations.set(frame,{messages,recent,records,layer});
      const measure=()=>requestAnimationFrame(()=>UI.measureMessageExpansions(recent));new ResizeObserver(measure).observe(recent);measure();
      recent.querySelectorAll('[data-expand-message]').forEach(button=>{button.setAttribute('aria-controls',layer.id);button.setAttribute('aria-expanded','false');});
    }
    document.addEventListener('submit',event=>{
      const frame=demoFrameOf(event.target);if(!frame)return;event.preventDefault();
      const form=event.target;
      if(form.dataset.demoForm==='login'){
        if(form.dataset.pending==='true')return;
        const account=form.querySelector('[data-demo-account]'),password=form.querySelector('[data-demo-password]'),error=form.querySelector('[data-demo-error]'),button=form.querySelector('[type="submit"]');
        error.hidden=true;form.dataset.pending='true';button.disabled=true;button.textContent='登录中…';
        setTimeout(()=>{form.dataset.pending='false';button.disabled=false;button.textContent='登录';
          if(account.value.trim()==='ayane'&&password.value==='ayane')demoToast(frame,'登录演示成功，实际客户端登录状态未改变');
          else {error.hidden=false;error.textContent='账号或密码不正确，请使用 ayane / ayane';}
        },700);
      }else if(form.dataset.demoForm==='message'){
        const input=form.querySelector('[data-demo-input]'),text=input.value.trim(),list=frame.querySelector('[data-demo-message-list]');if(!text)return;
        list.append(UI.createConversationMessage({id:'demo-m'+(++demoMessageId),sender:'me',text,time:UI.formatClock(Date.now())},false));input.value='';UI.resizeComposerInput(input);
        list.scrollTop=list.scrollHeight;
        setTimeout(()=>{list.append(UI.createConversationMessage({id:'demo-m'+(++demoMessageId),sender:'ayane',text:'我在听。这里的回复只属于当前组件示例。',time:UI.formatClock(Date.now())},false));list.scrollTop=list.scrollHeight;},500);
      }
    });
    document.addEventListener('input',event=>{if(demoFrameOf(event.target)&&event.target.matches('[data-demo-input]'))UI.resizeComposerInput(event.target);});
    document.addEventListener('keydown',event=>{
      const frame=demoFrameOf(event.target);if(!frame)return;
      if(event.target.matches('[data-demo-input]')&&event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();event.target.form.requestSubmit();return;}
      const top=[...demoLayers].reverse().find(node=>demoFrameOf(node)===frame&&node.classList.contains(stateClass(node)));if(!top)return;
      if(top.matches('[role="menu"]')&&['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
        const items=Array.from(top.querySelectorAll('button:not(:disabled)'));if(!items.length)return;
        event.preventDefault();const current=items.indexOf(document.activeElement);
        const index=event.key==='Home'?0:event.key==='End'?items.length-1:(current+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;
        items[index].focus({preventScroll:true});return;
      }
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setOpen(top,false);}
      else if(event.key==='Tab'){const modal=top.matches('[aria-modal="true"]')?top:top.querySelector('[aria-modal="true"]');if(modal)UI.trapFocus(modal,event);}
    });
    document.addEventListener('click',event=>{
      const expand=event.target.closest('[data-expand-message]');
      if(expand){const frame=demoFrameOf(expand),conversation=demoConversations.get(frame);if(conversation){setOpen(conversation.layer,true,expand);requestAnimationFrame(()=>UI.positionConversationRecord(conversation.records,expand.dataset.expandMessage));}return;}
      const locate=event.target.closest('[data-demo-locate]');if(locate){window.AyaneSpec.locate('component:'+locate.dataset.demoLocate);return;}
      const trigger=event.target.closest('[data-demo]');if(!trigger)return;
      const frame=demoFrameOf(trigger);if(!frame)return;
      const action=trigger.dataset.demo,control=trigger.getAttribute('aria-controls');
      const target=control?demoTarget(frame,control):action==='scrim'?trigger:null;
      if(action==='press'){trigger.setAttribute('aria-pressed',String(trigger.getAttribute('aria-pressed')!=='true'));return;}
      if(action==='history'){const conversation=demoConversations.get(frame);if(conversation){setOpen(conversation.layer,true,trigger);requestAnimationFrame(()=>UI.positionConversationRecord(conversation.records));}return;}
      if(action==='feedback'){const enabled=trigger.getAttribute('aria-pressed')!=='true';trigger.setAttribute('aria-pressed',String(enabled));const slot=frame.querySelector(trigger.dataset.feedback==='thinking'?'[data-demo-thinking]':'[data-demo-playback]');if(slot)slot.hidden=!enabled;return;}
      if(action==='scrim'){if(target&&event.target===trigger)setOpen(target,false);return;}
      if(action==='toggle'&&target){setOpen(target,!target.classList.contains(stateClass(target)),trigger);return;}
      if(action==='open'&&target){setOpen(target,true,trigger);return;}
      if(action==='close'&&target){setOpen(target,false,trigger);return;}
      if(action==='toast'&&target){if(!toasters.has(target))toasters.set(target,UI.createToast(target,{duration:2200}));target.classList.toggle('is-error',trigger.dataset.demoTone==='error');toasters.get(target)(trigger.dataset.demoMessage||trigger.textContent.trim());const menu=trigger.closest('[role=menu]');if(menu)setOpen(menu,false);return;}
      if(action==='switch'||action==='media'){
        const on=trigger.getAttribute('aria-checked')!=='true';trigger.setAttribute('aria-checked',String(on));
        if(trigger.dataset.icons){const names=trigger.dataset.icons.split(' ');trigger.querySelector('use').setAttribute('href','#i-'+names[on?1:0]);trigger.title=(trigger.getAttribute('aria-label')||'功能')+(on?'已开启':'已关闭');}
        return;
      }
      if(action==='avatar-mode'){
        const on=trigger.getAttribute('aria-pressed')!=='true';trigger.setAttribute('aria-pressed',String(on));trigger.querySelector('use').setAttribute('href',on?'#i-cube':'#i-frame');trigger.title='当前 '+(on?'3D':'2D')+'；点击切换至 '+(on?'2D':'3D');frame.querySelector('[data-demo-mode-note]').textContent=(on?'3D':'2D')+' 图片预览 · 非实时模型';return;
      }
      if(action==='reveal'&&target){const shown=trigger.getAttribute('aria-pressed')==='true';trigger.setAttribute('aria-pressed',String(!shown));target.type=shown?'password':'text';const noun=(trigger.getAttribute('aria-label')||'显示密码').replace(/^(显示|隐藏)/,'');trigger.setAttribute('aria-label',(shown?'显示':'隐藏')+noun);trigger.querySelector('use')?.setAttribute('href',shown?'#i-eye':'#i-eye-off');return;}
      if(action==='activate'){
        const group=trigger.closest(trigger.dataset.demoGroup||'[data-demo-group]')||trigger.parentElement;
        group.querySelectorAll('[data-demo="activate"]').forEach(node=>{const active=node===trigger;node.classList.toggle('is-active',active);if(node.hasAttribute('aria-selected'))node.setAttribute('aria-selected',String(active));if(node.hasAttribute('aria-current'))node.setAttribute('aria-current',active?'page':'false');const panel=demoTarget(frame,node.getAttribute('aria-controls'));if(panel?.hasAttribute('data-demo-panel'))panel.hidden=!active;});return;
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
  renderKnobs();
  setupTheme();
  setupFullscreen();
  renderComponentInventory();
  setupDemos();
  UI.mountFilterSelects(byId('sec-components'));
})();
