(() => {
  'use strict';
  const UI = window.AyaneUI;
  const stage = document.querySelector('[data-proto="client"]');
  if (!stage) return;
  const byId = (id) => stage.querySelector('[id="' + id + '"]');
  const AYANE_AVATAR_DATA = UI.companionAgent.avatar;
  UI.mountAIChoices(stage.querySelector('[data-ai-choices]'), () => setPage('companion'));
  const USER_AVATAR_DATA = 'https://avatars.githubusercontent.com/u/44569870?s=200&v=4';
  const DEMO_ACCOUNT = { account: 'ayane', password: 'ayane' };
  const refs = {
    stage, layout: stage.querySelector('.client-layout'),
    loginShell: byId('login-shell'), appFrame: byId('app-frame'),
    loginForm: byId('login-form'), loginAccount: byId('login-account'),
    loginPassword: byId('login-password'), loginPasswordToggle: byId('login-password-toggle'),
    loginSubmit: byId('login-submit'), loginError: byId('login-error'),
    sidebar: byId('sidebar'), sidebarToggle: byId('sidebar-toggle'),
    sidebarClose: byId('ai-selector-close'), sidebarBackdrop: byId('sidebar-backdrop'),
    sidebarMenu: byId('sidebar-menu'), sidebarMenuButton: byId('sidebar-menu-button'),
    sidebarMenuWrap: byId('sidebar-menu-wrap'), ai: byId('ai-ayane'),
    companion: byId('companion-page'), profileView: byId('mobile-profile-panel'),
    mobileNav: byId('mobile-nav'), companionTab: byId('mobile-companion'), profileTab: byId('mobile-profile'),
    modeToggle: byId('client-mode-toggle'), modeNote: byId('avatar-mode-note'),
    voiceInput: byId('client-voice-input'), voiceOutput: byId('client-voice-output'), vision: byId('client-vision'),
    mediaStatus: byId('client-media-status'), preview: byId('vision-preview'),
    previewCollapse: byId('vision-collapse'), previewRestore: byId('vision-restore'),
    recent: byId('recent-messages'), messages: byId('messages'), messageForm: byId('message-form'),
    messageInput: byId('message-input'), typingIndicator: byId('typing-indicator'), playback: byId('client-playback-status'),
    historyLayer: byId('client-history-layer'), historyOpen: byId('client-history-open'), historyClose: byId('client-history-close'),
    permissionLayer: byId('client-permission-layer'), permissionTitle: byId('client-permission-title'),
    permissionDescription: byId('client-permission-description'), permissionAllow: byId('client-permission-allow'), permissionDeny: byId('client-permission-deny'),
    profileModal: byId('profile-modal'), profileClose: byId('profile-close'),
    userCardModal: byId('user-card-modal'), aboutModal: byId('about-modal'), aboutClose: byId('about-close'), toast: byId('toast')
  };
  for (const [name, node] of Object.entries(refs)) {
    if (!node) throw new Error('客户端挂载点缺失：' + name);
  }
  const state = {
    authRoute: 'login', loginSubmitting: false, layout: 'desktop', mobilePage: 'companion', avatarMode: '2d',
    media: { voiceInput: false, voiceOutput: false, vision: false },
    permissions: { microphone: 'unknown', camera: 'unknown' },
    previewCollapsed: false, sidebarOpen: false, pendingPermission: null, playing: false,
    messages: [
      { id: 'm1', sender: 'ayane', text: '早上好。今天想从哪里开始？', time: '10:42' },
      { id: 'm2', sender: 'me', text: '我想先看看客户端界面怎么设计。', time: '10:43' },
      { id: 'm3', sender: 'ayane', text: '好呀。你可以切换形象，也可以分别开启语音输入、语音输出和视觉的交互演示。', time: '10:43' }
    ]
  };
  const companionNavigation = UI.mountCompanionNavigation(refs.mobileNav, (page) => setPage(page));
  let nextMessageId = 3;
  const replyTimers = new Set();
  let playbackTimer = 0;
  let measurementFrame = 0;
  const modalStack = [];
  const modalReturn = new WeakMap();
  const showToast = UI.createToast(refs.toast, { duration: 2200 });
  const permissionKey = { voiceInput: 'microphone', vision: 'camera' };
  const mediaLabels = { voiceInput: '语音输入', voiceOutput: '语音输出', vision: '视觉' };

  function getLayout() {
    // 容器查询量的是内容盒；只用不受缩放影响的 offsetWidth，再扣除区域边框。
    const style = getComputedStyle(refs.stage);
    const width = refs.stage.offsetWidth - parseFloat(style.borderLeftWidth) - parseFloat(style.borderRightWidth);
    if (width < 768) return 'phone';
    if (width < 1200) return 'tablet';
    if (width < 1600) return 'desktop';
    return 'wide';
  }
  const getTime = () => UI.formatClock(Date.now());
  function hydrateAvatars(root = stage) {
    root.querySelectorAll('[data-avatar]').forEach((image) => {
      // 舞台仍使用同一张绫音图片，只请求更适合大尺寸预览的分辨率；登录头像保持原样。
      image.src = image.closest('.avatar-stage') ? AYANE_AVATAR_DATA.replace('s=200', 's=1024') : AYANE_AVATAR_DATA;
    });
    root.querySelectorAll('[data-user-avatar]').forEach((image) => { image.src = USER_AVATAR_DATA; });
  }
  function visibleFallback() {
    if (state.authRoute !== 'app') return refs.loginAccount;
    if (state.layout !== 'phone') return byId('user-block');
    return state.mobilePage === 'profile' ? byId('mobile-user-block') : refs.messageInput;
  }
  function openModal(modal, focusTarget) {
    if (modal.classList.contains('is-open')) return;
    modalReturn.set(modal, document.activeElement);
    modalStack.push(modal);
    modal.classList.add('is-open');
    const target = focusTarget || modal.querySelector(UI.FOCUSABLE) || modal.querySelector('[role="dialog"]');
    if (target) target.focus({ preventScroll: true });
    if (modal === refs.historyLayer) refs.historyOpen.setAttribute('aria-expanded', 'true');
  }
  function closeModal(modal, restore = true) {
    if (!modal.classList.contains('is-open')) return;
    if (modal === refs.permissionLayer && state.pendingPermission) {
      state.permissions[permissionKey[state.pendingPermission]] = 'denied';
      state.pendingPermission = null;
    }
    modal.classList.remove('is-open');
    const index = modalStack.indexOf(modal);
    if (index >= 0) modalStack.splice(index, 1);
    if (modal === refs.historyLayer) refs.historyOpen.setAttribute('aria-expanded', 'false');
    if (restore) UI.restoreFocus(modalReturn.get(modal), visibleFallback());
    modalReturn.delete(modal);
  }
  function closeSidebar(restore = true) {
    const wasOpen = state.sidebarOpen;
    state.sidebarOpen = false;
    renderNavigation();
    if (restore && wasOpen) UI.restoreFocus(refs.sidebarToggle, visibleFallback());
  }
  function openSidebar() {
    if (state.authRoute !== 'app' || state.layout !== 'phone') return;
    closeSidebarMenu(false);
    state.sidebarOpen = true;
    renderNavigation();
    refs.sidebarClose.focus({ preventScroll: true });
  }
  function closeSidebarMenu(restore = false) {
    const wasOpen = refs.sidebarMenu.classList.contains('is-open');
    refs.sidebarMenu.classList.remove('is-open');
    refs.sidebarMenuButton.setAttribute('aria-expanded', 'false');
    if (restore && wasOpen) UI.restoreFocus(refs.sidebarMenuButton, visibleFallback());
  }
  function toggleSidebarMenu() {
    const open = !refs.sidebarMenu.classList.contains('is-open');
    refs.sidebarMenu.classList.toggle('is-open', open);
    refs.sidebarMenuButton.setAttribute('aria-expanded', String(open));
    if (open) refs.sidebarMenu.querySelector('button').focus({ preventScroll: true });
  }
  function renderNavigation() {
    const phone = state.layout === 'phone';
    const myPage = phone && state.mobilePage === 'profile';
    refs.companion.hidden = myPage;
    refs.profileView.hidden = !myPage;
    refs.mobileNav.hidden = !phone;
    companionNavigation.select(myPage ? 'profile' : 'companion');
    refs.sidebar.classList.toggle('is-open', phone && state.sidebarOpen);
    refs.sidebarBackdrop.classList.toggle('is-visible', phone && state.sidebarOpen);
    refs.sidebarToggle.setAttribute('aria-expanded', String(phone && state.sidebarOpen));
    if (phone && state.sidebarOpen) {
      refs.sidebar.setAttribute('role', 'dialog');
      refs.sidebar.setAttribute('aria-modal', 'true');
      refs.sidebar.setAttribute('aria-labelledby', 'ai-selector-title');
    } else {
      refs.sidebar.removeAttribute('role');
      refs.sidebar.removeAttribute('aria-modal');
      refs.sidebar.removeAttribute('aria-labelledby');
    }
    refs.sidebar.setAttribute('aria-hidden', String(phone && !state.sidebarOpen));
  }
  function setPage(page, focus = true) {
    if (state.authRoute !== 'app') return;
    state.mobilePage = page;
    closeSidebar(false);
    closeSidebarMenu(false);
    renderNavigation();
    scheduleMessageMeasure();
    if (focus) UI.restoreFocus(page === 'profile' ? byId('mobile-user-block') : refs.messageInput, visibleFallback());
  }
  function updateLayout() {
    if (!refs.stage.offsetWidth) return;
    const previous = state.layout;
    state.layout = getLayout();
    stage.dataset.layout = state.layout;
    if (state.layout !== 'phone' && state.sidebarOpen) {
      const drawerHadFocus = refs.sidebar.contains(document.activeElement);
      state.sidebarOpen = false;
      renderNavigation();
      if (drawerHadFocus) refs.ai.focus({ preventScroll: true });
    }
    if (previous !== state.layout) closeSidebarMenu(false);
    renderNavigation();
    scheduleMessageMeasure();
    updateKeyboard();
  }

      function setLoginError(message) {
        refs.loginError.textContent = message;
        refs.loginError.hidden = !message;
      }

      function setLoginSubmitting(submitting) {
        state.loginSubmitting = submitting;
        refs.loginSubmit.disabled = submitting;
        refs.loginSubmit.textContent = submitting ? '登录中…' : '登录';
      }

      function fillDemoCredentials() {
        refs.loginAccount.value = DEMO_ACCOUNT.account;
        refs.loginPassword.value = DEMO_ACCOUNT.password;
        setLoginError('');
      }

      function handleLoginSubmit(event) {
        event.preventDefault();
        if (state.loginSubmitting) return;
        const account = refs.loginAccount.value.trim();
        const password = refs.loginPassword.value;
        if (!account || !password) {
          setLoginError(!account ? '请输入账号' : '请输入密码');
          if (!account) refs.loginAccount.focus(); else refs.loginPassword.focus();
          return;
        }
        if (account !== DEMO_ACCOUNT.account || password !== DEMO_ACCOUNT.password) {
          setLoginError('演示版只接受预置账号：' + DEMO_ACCOUNT.account);
          refs.loginPassword.focus();
          return;
        }
        setLoginError('');
        setLoginSubmitting(true);
        window.setTimeout(completeLogin, 520);
      }


  function completeLogin() {
    state.authRoute = 'app';
    state.mobilePage = 'companion';
    setLoginSubmitting(false);
    refs.loginShell.hidden = true;
    refs.appFrame.hidden = false;
    updateLayout();
    showToast('欢迎回来');
    if (state.layout !== 'phone') refs.messageInput.focus({ preventScroll: true });
  }
  function logout() {
    for (const timer of replyTimers) window.clearTimeout(timer);
    replyTimers.clear();
    window.clearTimeout(playbackTimer);
    state.playing = false;
    state.pendingPermission = null;
    state.media = { voiceInput: false, voiceOutput: false, vision: false };
    state.permissions = { microphone: 'unknown', camera: 'unknown' };
    state.previewCollapsed = false;
    for (const modal of [...modalStack].reverse()) closeModal(modal, false);
    closeSidebar(false);
    closeSidebarMenu(false);
    state.authRoute = 'login';
    refs.loginShell.hidden = false;
    refs.appFrame.hidden = true;
    refs.layout.classList.remove('is-keyboard-visible');
    stage.style.setProperty('--client-keyboard-inset', '0px');
    renderMedia();
    renderPending();
    refs.loginAccount.focus({ preventScroll: true });
    showToast('已退出登录');
  }
  function renderAvatarMode() {
    const mode = state.avatarMode;
    const is3d = mode === '3d';
    refs.modeToggle.setAttribute('aria-pressed', String(is3d));
    refs.modeToggle.querySelector('use').setAttribute('href', is3d ? '#i-cube' : '#i-frame');
    refs.modeToggle.title = '当前：' + mode.toUpperCase() + ' 图片模式（演示）；点击切换至 ' + (is3d ? '2D' : '3D');
    refs.companion.dataset.avatarMode = mode;
    refs.modeNote.textContent = mode.toUpperCase() + ' 图片预览 · 非实时模型';
  }
  function setAvatarMode(mode) {
    if (state.authRoute !== 'app') return;
    state.avatarMode = mode;
    renderAvatarMode();
  }
  function renderMedia() {
    const icons = { voiceInput: ['mic-off', 'mic'], voiceOutput: ['volume-off', 'volume'], vision: ['camera-off', 'camera'] };
    for (const key of Object.keys(state.media)) {
      const button = refs[key];
      const enabled = state.media[key];
      button.setAttribute('aria-checked', String(enabled));
      button.title = mediaLabels[key] + (enabled ? '：已开启（演示）；点击关闭' : '：已关闭（演示）；点击开启');
      button.querySelector('use').setAttribute('href', '#i-' + icons[key][enabled ? 1 : 0]);
    }
    const enabled = Object.keys(state.media).filter((key) => state.media[key]);
    refs.mediaStatus.textContent = enabled.length ? '演示 · 声音与画面接收方：绫音 · ' + enabled.map((key) => mediaLabels[key]).join('、') + '已开启' : '语音与视觉均关闭';
    refs.preview.hidden = !state.media.vision || state.previewCollapsed;
    refs.previewRestore.hidden = !state.media.vision || !state.previewCollapsed;
    refs.playback.hidden = !state.playing;
  }
  function setMedia(key, enabled) {
    state.media[key] = enabled;
    if (key === 'vision') state.previewCollapsed = false;
    if (key === 'voiceOutput' && !enabled) {
      window.clearTimeout(playbackTimer);
      state.playing = false;
    }
    renderMedia();
    showToast(mediaLabels[key] + (enabled ? '已开启（演示）' : '已关闭'));
  }
  function toggleMedia(key) {
    if (state.authRoute !== 'app') return;
    if (state.media[key]) { setMedia(key, false); return; }
    const permission = permissionKey[key];
    if (!permission || state.permissions[permission] === 'granted') { setMedia(key, true); return; }
    state.pendingPermission = key;
    refs.permissionTitle.textContent = mediaLabels[key] + '权限演示';
    refs.permissionDescription.textContent = '允许或拒绝只改变本页的演示状态，不会调用' + (key === 'vision' ? '摄像头，也不会上传画面。' : '麦克风，也不会录音或上传声音。');
    openModal(refs.permissionLayer, refs.permissionDeny);
  }
  function settlePermission(allowed) {
    const key = state.pendingPermission;
    if (!key) return;
    state.pendingPermission = null;
    state.permissions[permissionKey[key]] = allowed ? 'granted' : 'denied';
    closeModal(refs.permissionLayer);
    if (allowed) setMedia(key, true);
    else { renderMedia(); showToast('已拒绝演示授权，' + mediaLabels[key] + '保持关闭'); }
  }
  function simulatePlayback() {
    if (!state.media.voiceOutput) return;
    window.clearTimeout(playbackTimer);
    state.playing = true;
    renderMedia();
    playbackTimer = window.setTimeout(() => { state.playing = false; renderMedia(); }, 1600);
  }
  function scheduleMessageMeasure() {
    window.cancelAnimationFrame(measurementFrame);
    measurementFrame = window.requestAnimationFrame(() => {
      if (!stage.offsetWidth || refs.companion.hidden) return;
      UI.measureMessageExpansions(refs.recent);
    });
  }
  function renderConversation() {
    const wasAtBottom = refs.messages.scrollHeight - refs.messages.scrollTop - refs.messages.clientHeight < 24;
    UI.renderConversationPair(refs.recent, refs.messages, state.messages);
    if (refs.historyLayer.classList.contains('is-open') && wasAtBottom) refs.messages.scrollTop = refs.messages.scrollHeight;
    scheduleMessageMeasure();
  }
  function openHistory(messageId) {
    if (state.authRoute !== 'app') return;
    refs.messages.querySelectorAll('.history-target').forEach((row) => row.classList.remove('history-target'));
    openModal(refs.historyLayer, refs.historyClose);
    window.requestAnimationFrame(() => UI.positionConversationRecord(refs.messages, messageId));
  }
  function chooseReply(text) {
    const normalized = text.toLowerCase();
    if (normalized.includes('3d') || text.includes('形象')) return '可以在上方切换 2D 和 3D 的图片预览；这里演示界面与状态，还没有接入实时模型。';
    if (text.includes('声音') || text.includes('语音')) return '语音输入和语音输出可以分别开关。这一页仅做交互演示，不会录音或播放声音。';
    if (text.includes('视觉') || text.includes('看到')) return '视觉可以独立开关。收起小窗不等于关闭视觉；当前显示的是演示图片，不会打开摄像头。';
    if (text.includes('你好') || text.includes('早上好') || text.includes('晚上好')) return '你好呀。今天见到你，我很开心。';
    if (text.includes('原型') || text.includes('界面') || text.includes('客户端')) return '我们先把形象、对话和独立开关放在同一个界面里。换个窗口大小，刚才的状态也会保留。';
    return '嗯，我在这里。你愿意继续说说吗？';
  }
  function renderPending() { refs.typingIndicator.hidden = replyTimers.size === 0; }
  function resizeInput() {
    UI.resizeComposerInput(refs.messageInput);
  }
  function sendMessage(text) {
    if (state.authRoute !== 'app') return;
    const clean = text.trim();
    if (!clean) return;
    state.messages.push({ id: 'm' + (++nextMessageId), sender: 'me', text: clean, time: getTime() });
    refs.messageInput.value = '';
    resizeInput();
    renderConversation();
    const timer = window.setTimeout(() => {
      replyTimers.delete(timer);
      if (state.authRoute !== 'app') return;
      state.messages.push({ id: 'm' + (++nextMessageId), sender: 'ayane', text: chooseReply(clean), time: getTime() });
      renderConversation();
      renderPending();
      simulatePlayback();
    }, 720);
    replyTimers.add(timer);
    renderPending();
  }

  // 只针对真实可视区域收缩做键盘适配；focus 或桌面窄窗口本身不等于软键盘。
  let viewportBaseline = 0;
  let viewportWidth = 0;
  function updateKeyboard() {
    const viewport = window.visualViewport;
    const eligible = viewport && window.matchMedia('(pointer: coarse)').matches && state.layout === 'phone' && state.authRoute === 'app' && !refs.companion.hidden && viewport.scale === 1;
    if (!eligible) {
      refs.layout.classList.remove('is-keyboard-visible');
      stage.style.setProperty('--client-keyboard-inset', '0px');
      return;
    }
    if (Math.abs(viewport.width - viewportWidth) > 1) { viewportWidth = viewport.width; viewportBaseline = viewport.height; }
    const focused = document.activeElement === refs.messageInput;
    if (!focused || viewport.height > viewportBaseline) viewportBaseline = Math.max(viewportBaseline, viewport.height);
    const open = focused && viewportBaseline - viewport.height > 120;
    const inset = open ? Math.max(0, stage.getBoundingClientRect().bottom - (viewport.offsetTop + viewport.height)) : 0;
    refs.layout.classList.toggle('is-keyboard-visible', open);
    stage.style.setProperty('--client-keyboard-inset', inset + 'px');
  }

  refs.loginForm.addEventListener('submit', handleLoginSubmit);
  refs.loginAccount.addEventListener('input', () => setLoginError(''));
  refs.loginPassword.addEventListener('input', () => setLoginError(''));
  refs.loginPasswordToggle.addEventListener('click', () => {
    const show = refs.loginPassword.type === 'password';
    refs.loginPassword.type = show ? 'text' : 'password';
    refs.loginPasswordToggle.setAttribute('aria-label', show ? '隐藏密码' : '显示密码');
    refs.loginPasswordToggle.setAttribute('aria-pressed', String(show));
    refs.loginPasswordToggle.querySelector('use').setAttribute('href', show ? '#i-eye-off' : '#i-eye');
  });
  refs.sidebarToggle.addEventListener('click', openSidebar);
  refs.sidebarClose.addEventListener('click', () => closeSidebar());
  refs.sidebarBackdrop.addEventListener('click', () => closeSidebar());
  refs.sidebarMenuButton.addEventListener('click', toggleSidebarMenu);
  refs.sidebarMenu.addEventListener('click', (event) => { if (event.target.closest('.sidebar-menu-item')) closeSidebarMenu(false); });
  refs.modeToggle.addEventListener('click', () => setAvatarMode(state.avatarMode === '2d' ? '3d' : '2d'));
  Object.keys(state.media).forEach((key) => refs[key].addEventListener('click', () => toggleMedia(key)));
  refs.permissionAllow.addEventListener('click', () => settlePermission(true));
  refs.permissionDeny.addEventListener('click', () => settlePermission(false));
  refs.previewCollapse.addEventListener('click', () => { state.previewCollapsed = true; renderMedia(); refs.previewRestore.focus({ preventScroll: true }); });
  refs.previewRestore.addEventListener('click', () => { state.previewCollapsed = false; renderMedia(); refs.previewCollapse.focus({ preventScroll: true }); });
  refs.historyOpen.addEventListener('click', () => openHistory());
  refs.historyClose.addEventListener('click', () => closeModal(refs.historyLayer));
  refs.recent.addEventListener('click', (event) => { const button = event.target.closest('[data-expand-message]'); if (button) openHistory(button.dataset.expandMessage); });
  refs.messageForm.addEventListener('submit', (event) => { event.preventDefault(); sendMessage(refs.messageInput.value); });
  refs.messageInput.addEventListener('input', resizeInput);
  refs.messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); sendMessage(refs.messageInput.value); }
  });
  refs.messageInput.addEventListener('focus', updateKeyboard);
  refs.messageInput.addEventListener('blur', updateKeyboard);

  const openProfile = () => openModal(refs.profileModal, refs.profileClose);
  const openUserCard = () => openModal(refs.userCardModal);
  const openAbout = () => openModal(refs.aboutModal, refs.aboutClose);
  byId('chat-person').addEventListener('click', openProfile);
  byId('sidebar-profile').addEventListener('click', openProfile);
  byId('sidebar-about').addEventListener('click', openAbout);
  byId('sidebar-settings').addEventListener('click', () => showToast('更多设置会在后续版本开放'));
  byId('user-block').addEventListener('click', openUserCard);
  byId('mobile-user-block').addEventListener('click', openUserCard);
  byId('mobile-user-about').addEventListener('click', openAbout);
  byId('mobile-user-settings').addEventListener('click', () => showToast('更多设置会在后续版本开放'));
  refs.profileClose.addEventListener('click', () => closeModal(refs.profileModal));
  refs.aboutClose.addEventListener('click', () => closeModal(refs.aboutModal));
  byId('profile-chat').addEventListener('click', () => { closeModal(refs.profileModal, false); setPage('companion'); });
  byId('profile-3d').addEventListener('click', () => { closeModal(refs.profileModal, false); setPage('companion'); setAvatarMode('3d'); });
  byId('user-card-edit').addEventListener('click', () => { closeModal(refs.userCardModal); showToast('编辑资料会在账号体系接入后开放。'); });
  byId('user-card-signout').addEventListener('click', logout);
  byId('about-update').addEventListener('click', () => showToast('已是最新版本 1.0.0'));
  byId('about-license').addEventListener('click', () => showToast('开源许可页面会在后续版本补充'));

  stage.addEventListener('click', (event) => {
    const modal = event.target.closest('.modal-layer');
    if (modal && event.target === modal) closeModal(modal);
    if (!refs.sidebarMenuWrap.contains(event.target)) closeSidebarMenu(false);
  });
  stage.addEventListener('keydown', (event) => {
    const modal = modalStack[modalStack.length - 1];
    if (event.key === 'Escape') {
      if (modal) closeModal(modal);
      else if (state.sidebarOpen) closeSidebar();
      else if (refs.sidebarMenu.classList.contains('is-open')) closeSidebarMenu(true);
      else return;
      event.preventDefault();
      event.stopPropagation();
    } else if (event.key === 'Tab') {
      if (modal) UI.trapFocus(modal, event);
      else if (state.sidebarOpen) UI.trapFocus(refs.sidebar, event);
    }
  });
  new ResizeObserver(updateLayout).observe(stage);
  new ResizeObserver(scheduleMessageMeasure).observe(refs.recent);
  if (window.visualViewport) {
    viewportBaseline = window.visualViewport.height;
    viewportWidth = window.visualViewport.width;
    window.visualViewport.addEventListener('resize', updateKeyboard);
    window.visualViewport.addEventListener('scroll', updateKeyboard);
  }
  fillDemoCredentials();
  hydrateAvatars();
  renderAvatarMode();
  renderConversation();
  renderMedia();
  updateLayout();
})();
