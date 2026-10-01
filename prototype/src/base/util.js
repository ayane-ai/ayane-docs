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

  function createConversationMessage(message, recent) {
    const row = document.createElement('div');
    row.className = 'message-row' + (message.sender === 'me' ? ' is-sent' : '');
    row.dataset.messageId = message.id;
    const body = document.createElement('div');
    body.className = 'message-body';
    if (!recent) {
      const time = document.createElement('span');
      time.className = 'message-time';
      time.textContent = (message.sender === 'me' ? '你' : '绫音') + ' · ' + message.time;
      body.append(time);
    }
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    const text = document.createElement('p');
    text.className = 'message-text';
    text.textContent = message.text;
    bubble.append(text);
    body.append(bubble);
    if (recent) {
      const expand = document.createElement('button');
      expand.type = 'button';
      expand.className = 'btn btn--ghost message-expand';
      expand.textContent = '展开';
      expand.setAttribute('aria-label', '展开这条消息');
      expand.dataset.expandMessage = message.id;
      expand.hidden = true;
      body.append(expand);
    }
    row.append(body);
    return row;
  }

  function resizeComposerInput(input) {
    input.style.height = 'auto';
    const limit = parseFloat(getComputedStyle(input).maxHeight);
    input.style.height = Math.min(input.scrollHeight, Number.isFinite(limit) ? limit : input.scrollHeight) + 'px';
  }

  // 客户端与组件库使用同一条目数据和构造逻辑；选择回调由宿主限定作用域。
  const companionAgent = Object.freeze({ id: 'ayane', name: '绫音', description: '今天也想听听你的声音', online: true, avatar: 'https://avatars.githubusercontent.com/u/326977819?s=200&v=4' });
  function mountAIChoices(container, onSelect) {
    let button = container.querySelector('[data-agent-id]');
    if (!button) { button = document.createElement('button'); container.append(button); }
    button.type = 'button'; button.className = 'contact-card ai-card'; button.dataset.agentId = companionAgent.id;
    button.innerHTML = '<span class="avatar avatar-sm"><img data-avatar alt="绫音头像"></span><span class="contact-copy"><strong></strong><span></span></span><span class="contact-status"><span class="online-dot" aria-hidden="true"></span>在线</span>';
    button.querySelector('img').src = companionAgent.avatar;
    button.querySelector('strong').textContent = companionAgent.name;
    const description = button.querySelector('.contact-copy > span'); description.textContent = companionAgent.description; description.title = companionAgent.description;
    function select() { button.classList.add('is-active'); button.setAttribute('aria-pressed', 'true'); button.setAttribute('aria-label', '选择'+companionAgent.name+'，当前 AI'); }
    let note=container.querySelector('.ai-list-note');if(!note){note=document.createElement('p');note.className='ai-list-note';container.append(note);}note.textContent='当前仅有'+companionAgent.name;
    select(); button.addEventListener('click', () => { select(); if(onSelect)onSelect(companionAgent.id); });
    return { button, select };
  }
  function mountCompanionNavigation(nav, onSelect) {
    const entries = [{key:'companion',label:'绫音',icon:'messages'},{key:'profile',label:'我的',icon:'user'}];
    for(const entry of entries){
      let button = nav.querySelector('[data-companion-page="'+entry.key+'"]');
      if(!button){button=document.createElement('button');nav.append(button);}
      button.type='button';button.className='btn btn--ghost';button.dataset.companionPage=entry.key;
      button.innerHTML='<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-'+entry.icon+'"></use></svg>'+entry.label;
    }
    function select(key){nav.querySelectorAll('[data-companion-page]').forEach(button=>{if(button.dataset.companionPage===key)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});}
    nav.addEventListener('click', event=>{const button=event.target.closest('[data-companion-page]');if(!button||!nav.contains(button))return;select(button.dataset.companionPage);if(onSelect)onSelect(button.dataset.companionPage);});
    select('companion');return {select};
  }
  function renderConversationPair(recent, records, messages){
    recent.replaceChildren(...messages.slice(-2).map(message=>createConversationMessage(message,true)));
    records.replaceChildren(...messages.map(message=>createConversationMessage(message,false)));
  }
  function measureMessageExpansions(recent){
    if(!recent.offsetWidth)return;
    recent.querySelectorAll('.message-row').forEach(row=>{const text=row.querySelector('.message-text'),expand=row.querySelector('.message-expand');if(expand)expand.hidden=text.scrollHeight<=text.clientHeight+1;});
  }
  function positionConversationRecord(records,messageId){
    records.querySelectorAll('.history-target').forEach(row=>row.classList.remove('history-target'));
    const row=messageId?Array.from(records.querySelectorAll('[data-message-id]')).find(node=>node.dataset.messageId===messageId):null;
    if(row){row.classList.add('history-target');records.scrollTop+=row.getBoundingClientRect().top-records.getBoundingClientRect().top;}
    else records.scrollTop=records.scrollHeight;
  }
  function bindSegmentedTabs(group){
    const buttons=Array.from(group.querySelectorAll('[role="tab"]'));
    function select(button,focus){
      buttons.forEach(node=>{const selected=node===button;node.classList.toggle('is-active',selected);node.setAttribute('aria-selected',String(selected));node.tabIndex=selected?0:-1;const panel=document.getElementById(node.getAttribute('aria-controls'));if(panel&&group.parentElement.contains(panel))panel.hidden=!selected;});
      if(focus)button.focus({preventScroll:true});
    }
    group.addEventListener('click',event=>{const button=event.target.closest('[role="tab"]');if(buttons.includes(button)&&!button.disabled)select(button,false);});
    group.addEventListener('keydown',event=>{const active=buttons.filter(button=>!button.disabled);if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)||!active.includes(event.target))return;event.preventDefault();const index=event.key==='Home'?0:event.key==='End'?active.length-1:(active.indexOf(event.target)+(event.key==='ArrowRight'?1:-1)+active.length)%active.length;select(active[index],true);});
    select(buttons.find(button=>button.getAttribute('aria-selected')==='true')||buttons[0],false);
  }


  let filterSelectSequence = 0;
  const filterSelectScopes = new WeakSet();
  function mountFilterSelects(scope) {
    if (!scope || filterSelectScopes.has(scope)) return;
    filterSelectScopes.add(scope);
    const controls = new WeakMap();
    const menus = new WeakMap();
    let active = null;
    let typeBuffer = '', typedAt = 0;
    const optionEnabled = option => !option.disabled && !option.hidden && !option.closest('optgroup[disabled]');
    function sync(control) {
      const {select, button, label} = control;
      const text = select.selectedOptions[0]?.label || '请选择';
      if(label.textContent !== text) label.textContent = text;
      if(button.title !== text) button.title = text;
      button.disabled = select.disabled;
      button.setAttribute('aria-label', select.getAttribute('aria-label') || select.labels?.[0]?.textContent.trim() || select.name || '筛选');
      if(select.getAttribute('aria-describedby'))button.setAttribute('aria-describedby',select.getAttribute('aria-describedby'));
    }
    function close(restore = false) {
      if (!active) return;
      const previous = active; active = null;
      previous.menu.classList.remove('is-open');
      previous.control.button.setAttribute('aria-expanded','false');
      previous.control.button.removeAttribute('aria-activedescendant');
      if(restore)restoreFocus(previous.control.button,null);
    }
    function position() {
      if(!active)return;
      const {root,menu,control}=active;
      if(!control.select.isConnected || !root.offsetWidth || !control.button.getClientRects().length){close();return;}
      const r=root.getBoundingClientRect(),b=control.button.getBoundingClientRect(),scale=r.width/root.offsetWidth;
      const styles=getComputedStyle(root),gap=parseFloat(styles.getPropertyValue('--spacing-extra-small'))||4,margin=parseFloat(styles.getPropertyValue('--spacing-small'))||8;
      const left=(b.left-r.left)/scale-root.clientLeft,top=(b.top-r.top)/scale-root.clientTop,bottom=(b.bottom-r.top)/scale-root.clientTop;
      const maxWidth=Math.max(0,root.clientWidth-margin*2);
      menu.style.width='max-content';menu.style.maxWidth=maxWidth+'px';menu.style.maxHeight='none';
      const width=Math.min(maxWidth,Math.max(control.button.offsetWidth,menu.offsetWidth));menu.style.width=width+'px';
      const below=root.clientHeight-bottom-gap-margin,above=top-gap-margin;
      const desired=Math.min(menu.scrollHeight+menu.offsetHeight-menu.clientHeight,(parseFloat(styles.getPropertyValue('--tap-target'))||44)*6+margin);
      const upwards=below<desired && above>below,available=Math.max(0,upwards?above:below);
      menu.style.maxHeight=Math.min(desired,available)+'px';
      menu.style.left=Math.max(margin,Math.min(left,root.clientWidth-width-margin))+'px';
      menu.style.top=(upwards?Math.max(margin,top-gap-menu.offsetHeight):bottom+gap)+'px';
      menu.dataset.placement=upwards?'above':'below';
    }
    function setActive(index) {
      if(!active)return;
      const choices=active.choices,choice=choices.find(item=>item.index===index);
      if(!choice || !optionEnabled(choice.option))return;
      active.index=index;
      choices.forEach(item=>item.node.classList.toggle('is-active',item.index===index));
      active.control.button.setAttribute('aria-activedescendant',choice.node.id);
      const menu=active.menu,offset=choice.node.offsetTop;
      if(offset<menu.scrollTop)menu.scrollTop=offset;
      else if(offset+choice.node.offsetHeight>menu.scrollTop+menu.clientHeight)menu.scrollTop=offset+choice.node.offsetHeight-menu.clientHeight;
    }
    function commit(index) {
      if(!active)return;
      const {control}=active,option=control.select.options[index];
      if(!option || !optionEnabled(option))return;
      const changed=control.select.selectedIndex!==index;
      control.select.selectedIndex=index;sync(control);close(true);
      if(changed){control.select.dispatchEvent(new Event('input',{bubbles:true}));control.select.dispatchEvent(new Event('change',{bubbles:true}));}
    }
    function menuFor(root) {
      let menu=menus.get(root);if(menu)return menu;
      menu=document.createElement('div');menu.className='filter-select-menu';menu.id='filter-options-'+(++filterSelectSequence);menu.setAttribute('role','listbox');
      root.append(menu);menus.set(root,menu);
      menu.addEventListener('pointerdown',event=>event.preventDefault());
      menu.addEventListener('click',event=>{const option=event.target.closest('[data-option-index]');if(option&&active?.menu===menu)commit(Number(option.dataset.optionIndex));});
      menu.addEventListener('pointermove',event=>{const option=event.target.closest('[data-option-index]');if(option&&active?.menu===menu)setActive(Number(option.dataset.optionIndex));});
      let size=[root.offsetWidth,root.offsetHeight];new ResizeObserver(()=>{const next=[root.offsetWidth,root.offsetHeight];if(next[0]!==size[0]||next[1]!==size[1]){size=next;if(active?.root===root)close();}}).observe(root);
      return menu;
    }
    function open(control) {
      if(control.select.disabled)return;
      if(active?.control===control){close(true);return;}
      close();sync(control);
      const root=control.select.closest('.region-stage,.demo-frame');if(!root)return;
      const menu=menuFor(root),choices=[];menu.replaceChildren();
      for(const [index,option] of Array.from(control.select.options).entries()){
        if(option.hidden)continue;
        const node=document.createElement('div');node.className='filter-select-option';node.id=menu.id+'-option-'+index;node.dataset.optionIndex=index;
        node.setAttribute('role','option');node.setAttribute('aria-selected',String(option.selected));node.setAttribute('aria-disabled',String(!optionEnabled(option)));
        const text=document.createElement('span');text.textContent=option.label;
        node.append(text);node.insertAdjacentHTML('beforeend','<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-check"></use></svg>');menu.append(node);choices.push({option,index,node});
      }
      menu.setAttribute('aria-label',control.button.getAttribute('aria-label'));
      active={control,root,menu,choices,index:-1};typeBuffer='';typedAt=0;
      menu.classList.add('is-open');control.button.setAttribute('aria-controls',menu.id);control.button.setAttribute('aria-expanded','true');
      control.button.focus({preventScroll:true});position();
      setActive(choices.find(item=>item.option.selected&&optionEnabled(item.option))?.index ?? choices.find(item=>optionEnabled(item.option))?.index);
    }
    function enhance(select) {
      if(controls.has(select)){sync(controls.get(select));return;}
      if(select.multiple || select.size>1 || !select.closest('.region-stage,.demo-frame'))return;
      if(!select.id)select.id='filter-source-'+(++filterSelectSequence);
      const wrapper=document.createElement('span');wrapper.className='filter-select-control';
      const button=document.createElement('button');button.type='button';button.className='filter-select-trigger';button.id=select.id+'-trigger';button.dataset.selectId=select.id;
      button.setAttribute('role','combobox');button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');button.setAttribute('aria-autocomplete','none');
      const label=document.createElement('span');label.className='filter-select-value';button.append(label);button.insertAdjacentHTML('beforeend','<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-chevron-down"></use></svg>');
      select.replaceWith(wrapper);wrapper.append(select,button);select.hidden=true;
      const control={select,button,label,wrapper};controls.set(select,control);sync(control);
      button.addEventListener('click',()=>open(control));
      button.addEventListener('keydown',event=>{
        if(event.isComposing)return;
        const key=event.key;
        if(key==='Escape'&&active?.control===control){event.preventDefault();event.stopPropagation();close(true);return;}
        if(key==='Tab'){if(active?.control===control)close();return;}
        if(['ArrowDown','ArrowUp','Home','End','Enter',' '].includes(key)){
          event.preventDefault();event.stopPropagation();
          if(active?.control!==control){open(control);if(key==='Home'||key==='End'){const enabled=active?.choices.filter(item=>optionEnabled(item.option))||[];setActive(enabled[key==='Home'?0:enabled.length-1]?.index);}return;}
          if(key==='Enter'||key===' '){commit(active.index);return;}
          const enabled=active.choices.filter(item=>optionEnabled(item.option));if(!enabled.length)return;
          const at=enabled.findIndex(item=>item.index===active.index),next=key==='Home'?0:key==='End'?enabled.length-1:(at+(key==='ArrowDown'?1:-1)+enabled.length)%enabled.length;
          setActive(enabled[next].index);return;
        }
        if(key.length===1&&!event.ctrlKey&&!event.altKey&&!event.metaKey){
          event.preventDefault();if(active?.control!==control)open(control);if(!active)return;
          const now=Date.now();typeBuffer=now-typedAt>700?key:typeBuffer+key;typedAt=now;
          const match=active.choices.find(item=>optionEnabled(item.option)&&item.option.label.toLocaleLowerCase().startsWith(typeBuffer.toLocaleLowerCase()));if(match)setActive(match.index);
        }
      });
    }
    function scan(node){if(node.nodeType!==1)return;if(node.matches('select.filter-select'))enhance(node);node.querySelectorAll('select.filter-select').forEach(enhance);}
    scan(scope);
    new MutationObserver(records=>{
      for(const record of records){
        const source=record.target.nodeType===1?record.target.closest('select.filter-select'):record.target.parentElement?.closest('select.filter-select');
        if(source&&controls.has(source)){sync(controls.get(source));if(active?.control.select===source)close();}
        for(const node of record.addedNodes)scan(node);
      }
      if(active&&(!active.control.select.isConnected||active.control.select.disabled||!active.control.button.getClientRects().length))close();
    }).observe(scope,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','selected','label','hidden','aria-label']});
    scope.addEventListener('change',event=>{const control=controls.get(event.target);if(control)sync(control);});
    scope.addEventListener('reset',()=>queueMicrotask(()=>{close();scope.querySelectorAll('select.filter-select').forEach(enhance);}));
    document.addEventListener('pointerdown',event=>{if(active&&!active.menu.contains(event.target)&&!active.control.wrapper.contains(event.target))close();},true);
    document.addEventListener('focusin',event=>{if(active&&!active.menu.contains(event.target)&&!active.control.wrapper.contains(event.target))close();});
    document.addEventListener('scroll',event=>{if(active&&event.target!==active.menu&&!active.menu.contains(event.target))close();},true);
    window.addEventListener('resize',()=>close());
  }

  window.AyaneUI = {
    mountFilterSelects,
    companionAgent, mountAIChoices, mountCompanionNavigation, renderConversationPair, measureMessageExpansions, positionConversationRecord, bindSegmentedTabs,
    createConversationMessage,
    resizeComposerInput,
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
