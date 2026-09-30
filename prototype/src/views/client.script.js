(() => {
      'use strict';

      const AYANE_AVATAR_DATA = "https://avatars.githubusercontent.com/u/326977819?s=200&v=4";

      const state = {
        authRoute: 'login',
        loginSubmitting: false,
        mode: 'chat',
        layout: 'desktop',
        mobileRoute: 'list',
        listTab: 'messages',
        companionOpen: false,
        companionMinimized: false,
        figureOpen: true,
        companionDrawer: 'half',
        callActive: false,
        micEnabled: true,
        sidebarOpen: false,
        isTyping: false,
        pendingReplies: 0,
        messages: [
          { sender: 'ayane', text: '早上好。今天想从哪里开始？', time: '10:42' },
          { sender: 'me', text: '我想先看看客户端界面怎么设计。', time: '10:43' },
          { sender: 'ayane', text: '好呀。那我们先从聊天窗口开始，不急着做复杂功能。', time: '10:43' }
        ]
      };

      const USER_AVATAR_DATA = "https://avatars.githubusercontent.com/u/44569870?s=200&v=4";

      const refs = {
        /* 画布自身：区域是包含块，companion-active、布局测量与 ESC 归属都以它为准，
           不再看 document.body / window，否则嵌入文档流时档位会按整页宽度算错。 */
        stage: document.querySelector('[data-proto="client"]'),
        loginShell: document.getElementById('login-shell'),
        appFrame: document.getElementById('app-frame'),
        loginForm: document.getElementById('login-form'),
        loginAccount: document.getElementById('login-account'),
        loginPassword: document.getElementById('login-password'),
        loginPasswordToggle: document.getElementById('login-password-toggle'),
        loginSubmit: document.getElementById('login-submit'),
        loginError: document.getElementById('login-error'),
        sidebar: document.getElementById('sidebar'),
        sidebarBackdrop: document.getElementById('sidebar-backdrop'),
        sidebarToggle: document.getElementById('sidebar-toggle'),
        mobileListView: document.getElementById('mobile-list-view'),
        mobileTopbar: document.querySelector('.mobile-topbar'),
        mobileNav: document.querySelector('.mobile-nav'),
        appFrameEl: document.querySelector('.app-frame'),
        mobileMessagePanel: document.getElementById('mobile-message-panel'),
        mobileContactPanel: document.getElementById('mobile-contact-panel'),
        mobileMessageCard: document.getElementById('mobile-message-card'),
        mobileContactCard: document.getElementById('mobile-contact-card'),
        mobileListPreview: document.getElementById('mobile-list-preview'),
        mobileListTime: document.getElementById('mobile-list-time'),
        desktopMessageCard: document.getElementById('desktop-message-card'),
        desktopMessagePreview: document.getElementById('desktop-message-preview'),
        desktopMessageTime: document.getElementById('desktop-message-time'),
        chatPanel: document.querySelector('.chat-panel'),
        modePicker: document.getElementById('mode-picker'),
        modeButton: document.getElementById('mode-button'),
        modeMenu: document.getElementById('mode-menu'),
        modeLabel: document.getElementById('mode-label'),
        sidebarMenuWrap: document.getElementById('sidebar-menu-wrap'),
        sidebarMenuButton: document.getElementById('sidebar-menu-button'),
        sidebarMenu: document.getElementById('sidebar-menu'),
        mobileTopbarMenuWrap: document.getElementById('mobile-topbar-menu-wrap'),
        mobileTopbarMenuButton: document.getElementById('mobile-topbar-menu-button'),
        mobileTopbarMenu: document.getElementById('mobile-topbar-menu'),
        userBlock: document.getElementById('user-block'),
        messages: document.getElementById('messages'),
        messageForm: document.getElementById('message-form'),
        messageInput: document.getElementById('message-input'),
        typingIndicator: document.getElementById('typing-indicator'),
        composerStatus: document.getElementById('composer-status'),
        micButton: document.getElementById('mic-button'),
        callButton: document.getElementById('call-button'),
        callBanner: document.getElementById('call-banner'),
        endCallButton: document.getElementById('end-call-button'),
        companion: document.getElementById('companion-window'),
        companionHandle: document.getElementById('companion-drag-handle'),
        companionGrab: document.getElementById('companion-grab'),
        companionBubble: document.getElementById('companion-bubble'),
        chatFigure: document.getElementById('chat-figure'),
        figureToggle: document.getElementById('figure-toggle'),
        companionMinimize: document.getElementById('companion-minimize'),
        companionClose: document.getElementById('companion-close'),
        companionOpenChat: document.getElementById('companion-open-chat'),
        companionHide: document.getElementById('companion-hide'),
        profileModal: document.getElementById('profile-modal'),
        profileClose: document.getElementById('profile-close'),
        profileChat: document.getElementById('profile-chat'),
        profile3d: document.getElementById('profile-3d'),
        userCardModal: document.getElementById('user-card-modal'),
        aboutModal: document.getElementById('about-modal'),
        aboutClose: document.getElementById('about-close'),
        toast: document.getElementById('toast')
      };

      const modeLabels = { chat: '聊天', '2d': '2D 形象', '3d': '3D 形象' };
      // 写死的演示账号：登录页会自动填入，直接点「登录」即可
      const DEMO_ACCOUNT = { account: 'ayane', password: 'ayane' };
      let dragState = null;

      /* 档位只看画布宽度：用 offsetWidth 而不是 getBoundingClientRect，
         前者不受画布缩放（transform: scale）影响，缩放时不会误跳档。 */
      function getLayout() {
        const width = refs.stage.offsetWidth;
        if (width < 768) return 'phone';
        if (width < 1200) return 'tablet';
        if (width < 1600) return 'desktop';
        return 'wide';
      }

      function getTime() {
        return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(new Date());
      }

      const escapeHtml = AyaneUI.escapeHtml;

      function scrollMessages() {
        window.requestAnimationFrame(() => {
          refs.messages.scrollTop = refs.messages.scrollHeight;
        });
      }

      function hydrateAvatars(root = document) {
        root.querySelectorAll('[data-avatar]').forEach((image) => {
          image.src = AYANE_AVATAR_DATA;
        });
        root.querySelectorAll('[data-user-avatar]').forEach((image) => {
          image.src = USER_AVATAR_DATA;
        });
      }

      function renderMessage(message) {
        const row = document.createElement('div');
        const isSent = message.sender === 'me';
        row.className = 'message-row' + (isSent ? ' is-sent' : '');
        const avatar = isSent
          ? '<span class="message-avatar"><img data-user-avatar alt="我的头像"></span>'
          : '<span class="message-avatar"><img data-avatar alt="绫音头像"></span>';
        row.innerHTML = (isSent ? '' : avatar) +
          '<div class="message-body">' +
          '<div class="message-time">' + escapeHtml(message.time) + '</div>' +
          '<div class="message-bubble">' + escapeHtml(message.text) + '</div>' +
          '</div>' +
          (isSent ? avatar : '');
        refs.messages.appendChild(row);
        hydrateAvatars(row);
        updateConversationPreview();
      }

      function renderMessages() {
        refs.messages.innerHTML = '<div class="day-divider"><span>今天</span></div><div class="welcome-card"><strong>绫音在这里。</strong><br>不用急着想好要说什么，想到哪里就从哪里开始。</div>';
        state.messages.forEach(renderMessage);
        scrollMessages();
      }

      function getLatestMessage() {
        return state.messages[state.messages.length - 1] || null;
      }

      function getMessagePreview(message) {
        if (!message) return '还没有消息';
        const text = message.text.replace(/\s+/g, ' ').trim();
        return message.sender === 'me' ? '你：' + text : text;
      }

      function updateListTabSelection(tab) {
        document.querySelectorAll('.sidebar-tab').forEach((button) => {
          const selected = button.dataset.tab === tab;
          button.classList.toggle('is-active', selected);
          button.setAttribute('aria-selected', String(selected));
        });
        const mobileActiveTab = state.mobileRoute === 'chat'
          ? 'mobile-messages'
          : (tab === 'profile' ? 'mobile-profile' : (tab === 'contacts' ? 'mobile-contacts' : 'mobile-messages'));
        document.querySelectorAll('.mobile-nav button').forEach((button) => {
          button.classList.toggle('is-active', button.id === mobileActiveTab);
        });
      }

      function updateConversationPreview() {
        const latest = getLatestMessage();
        const preview = getMessagePreview(latest);
        const time = latest?.time || '现在';
        refs.mobileListPreview.textContent = preview;
        refs.mobileListTime.textContent = time;
        refs.desktopMessagePreview.textContent = preview;
        refs.desktopMessageTime.textContent = time;
        /* 列表预览必然被省略号截断：把整句挂到 title 上，截断才有 recourse（与后台模块卡同一做法） */
        refs.mobileListPreview.setAttribute('title', preview);
        refs.desktopMessagePreview.setAttribute('title', preview);
      }

      function renderListTab(tab) {
        state.listTab = tab === 'contacts' ? 'contacts' : (tab === 'profile' ? 'profile' : 'messages');
        document.querySelectorAll('[data-list-panel]').forEach((panel) => {
          panel.hidden = panel.dataset.listPanel !== state.listTab;
        });
        // 顶部账号栏只在「消息」「联系人」显示，「我的」页有独立的账号卡片
        refs.mobileTopbar.hidden = state.listTab === 'profile';
        if (refs.mobileTopbar.hidden) closeMobileTopbarMenu();
        updateListTabSelection(state.listTab);
        updateConversationPreview();
      }

      function renderMobileRoute() {
        const isPhone = state.layout === 'phone';
        const showList = isPhone && state.mobileRoute === 'list';
        refs.mobileListView.hidden = !showList;
        refs.chatPanel.classList.toggle('is-mobile-hidden', showList);
        // 导航栏只在消息列表展示，聊天页不展示也不占高度
        refs.mobileNav.hidden = !showList;
        refs.appFrameEl.classList.toggle('mobile-nav-space', showList);
        refs.sidebar.classList.remove('is-open');
        refs.sidebarBackdrop.classList.remove('is-visible');
        refs.sidebarToggle.setAttribute('aria-label', showList ? '打开消息列表' : '返回消息列表');
        refs.sidebarToggle.setAttribute('aria-expanded', 'false');
        renderListTab(state.listTab);
        if (showList) { closeModeMenu(); closeSidebarMenu(); closeMobileTopbarMenu(); }
      }

      function goMobileList(tab = state.listTab) {
        if (state.layout !== 'phone') return;
        state.mobileRoute = 'list';
        state.listTab = tab === 'contacts' ? 'contacts' : (tab === 'profile' ? 'profile' : 'messages');
        renderMobileRoute();
      }

      function goMobileChat() {
        if (state.layout !== 'phone') return;
        state.mobileRoute = 'chat';
        renderMobileRoute();
        window.setTimeout(() => refs.messages.focus(), 0);
      }

      function updateLayout() {
        /* 页面被切走时画布宽度为 0，此时不能改档位：跨 phone 边界会重置移动路由 */
        if (!refs.stage.offsetWidth) return;
        const previousLayout = state.layout;
        const nextLayout = getLayout();
        state.layout = nextLayout;
        if (previousLayout !== 'phone' && nextLayout === 'phone') {
          state.mobileRoute = 'list';
          state.listTab = 'messages';
        } else if (previousLayout === 'phone' && nextLayout !== 'phone') {
          state.mobileRoute = 'chat';
          state.listTab = 'messages';
        }
        if (nextLayout !== 'phone') {
          refs.companion.style.removeProperty('left');
          refs.companion.style.removeProperty('top');
          refs.companion.style.removeProperty('right');
        }
        state.companionDrawer = 'half';
        applyDrawerState();
        if (previousLayout === 'phone' && nextLayout !== 'phone' && state.companionOpen) {
          refs.companion.classList.remove('is-minimized');
          state.companionMinimized = false;
        }
        renderMobileRoute();
      }

      function updateModeUi() {
        refs.modeLabel.textContent = modeLabels[state.mode] || '聊天';
        refs.modeButton.setAttribute('aria-label', '当前方式：' + refs.modeLabel.textContent + '，打开菜单切换');
        refs.modeMenu.querySelectorAll('[data-mode]').forEach((option) => {
          const selected = option.dataset.mode === state.mode;
          const check = option.querySelector('.mode-check');
          if (check) check.hidden = !selected;
          option.setAttribute('aria-current', selected ? 'true' : 'false');
        });
        refs.composerStatus.textContent = state.callActive ? '通话中' : (state.mode === '3d' ? '3D 形象陪伴中' : '聊天中');
      }

      function openModeMenu() {
        refs.modeMenu.hidden = false;
        refs.modeButton.setAttribute('aria-expanded', 'true');
      }

      function closeModeMenu() {
        refs.modeMenu.hidden = true;
        refs.modeButton.setAttribute('aria-expanded', 'false');
      }

      const showToast = AyaneUI.createToast(refs.toast, { duration: 2200 });

      function setLoginError(message) {
        refs.loginError.textContent = message;
        refs.loginError.hidden = !message;
      }

      function setLoginSubmitting(submitting) {
        state.loginSubmitting = submitting;
        refs.loginSubmit.disabled = submitting;
        refs.loginSubmit.textContent = submitting ? '登录中…' : '登录';
      }

      function completeLogin() {
        state.authRoute = 'app';
        setLoginSubmitting(false);
        refs.loginShell.hidden = true;
        refs.appFrame.hidden = false;
        renderMobileRoute();
        showToast('欢迎回来');
        if (state.layout !== 'phone') refs.messages.focus();
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

      function openSidebar() {
        state.sidebarOpen = true;
        refs.sidebar.classList.add('is-open');
        refs.sidebarBackdrop.classList.add('is-visible');
        refs.sidebarToggle.setAttribute('aria-expanded', 'true');
      }

      function closeSidebar() {
        state.sidebarOpen = false;
        refs.sidebar.classList.remove('is-open');
        refs.sidebarBackdrop.classList.remove('is-visible');
        refs.sidebarToggle.setAttribute('aria-expanded', 'false');
      }

      /* 弹层显隐与共享组件层用同一条机制：.is-open。这里原先用 [hidden]，
         与 overlay.css 的淡入淡出是两套，混用时模态会永远停在 opacity 0。 */
      const modalReturn = new WeakMap();

      function openModal(modal, focusTarget) {
        if (modal.classList.contains('is-open')) return;
        modalReturn.set(modal, document.activeElement);
        modal.classList.add('is-open');
        const focusTo = focusTarget || modal.querySelector(AyaneUI.FOCUSABLE);
        if (focusTo) window.setTimeout(() => focusTo.focus(), 0);
      }

      function closeModal(modal) {
        if (!modal.classList.contains('is-open')) return;
        modal.classList.remove('is-open');
        AyaneUI.restoreFocus(modalReturn.get(modal), null);
        modalReturn.delete(modal);
      }

      function openModalOf() {
        return [refs.profileModal, refs.userCardModal, refs.aboutModal]
          .find((modal) => modal.classList.contains('is-open'));
      }

      function openProfile() { openModal(refs.profileModal, refs.profileClose); }
      function closeProfile() { closeModal(refs.profileModal); }
      function openUserCard() { openModal(refs.userCardModal); }
      function closeUserCard() { closeModal(refs.userCardModal); }
      function openAbout() { openModal(refs.aboutModal, refs.aboutClose); }
      function closeAbout() { closeModal(refs.aboutModal); }

      function openSidebarMenu() {
        refs.sidebarMenu.hidden = false;
        refs.sidebarMenuButton.setAttribute('aria-expanded', 'true');
      }

      function closeSidebarMenu() {
        refs.sidebarMenu.hidden = true;
        refs.sidebarMenuButton.setAttribute('aria-expanded', 'false');
      }

      function openMobileTopbarMenu() {
        refs.mobileTopbarMenu.hidden = false;
        refs.mobileTopbarMenuButton.setAttribute('aria-expanded', 'true');
      }

      function closeMobileTopbarMenu() {
        refs.mobileTopbarMenu.hidden = true;
        refs.mobileTopbarMenuButton.setAttribute('aria-expanded', 'false');
      }

      function applyFigure() {
        refs.chatFigure.classList.toggle('is-collapsed', !state.figureOpen);
        refs.figureToggle.setAttribute('aria-pressed', String(state.figureOpen));
        refs.figureToggle.setAttribute('aria-label', state.figureOpen ? '收起 2D 形象' : '展开 2D 形象');
      }

      function toggleFigure() {
        state.figureOpen = !state.figureOpen;
        applyFigure();
        showToast(state.figureOpen ? '2D 形象已展开' : '2D 形象已收起');
      }

      function applyDrawerState() {
        const peek = state.layout === 'phone' && state.companionDrawer === 'peek';
        const expanded = state.layout === 'phone' && state.companionDrawer === 'expanded';
        refs.companion.classList.toggle('is-peek', peek);
        refs.companion.classList.toggle('is-expanded', expanded);
        refs.companionGrab.setAttribute('aria-label', peek ? '向上展开形象' : '收起形象');
      }

      function openCompanion() {
        state.companionOpen = true;
        state.companionMinimized = false;
        refs.companion.hidden = false;
        refs.companion.classList.remove('is-minimized');
        refs.companion.classList.remove('is-dragging');
        refs.companion.style.removeProperty('transform');
        refs.companion.style.removeProperty('height');
        state.companionDrawer = 'half';
        applyDrawerState();
        refs.stage.classList.add('companion-active');
        if (state.layout === 'phone') {
          refs.companion.style.removeProperty('left');
          refs.companion.style.removeProperty('top');
          refs.companion.style.removeProperty('right');
        }
        window.setTimeout(() => {
          if (state.layout === 'phone') refs.companionClose.focus();
        }, 0);
      }

      function closeCompanion(switchToChat) {
        state.companionOpen = false;
        state.companionMinimized = false;
        refs.companion.hidden = true;
        refs.companion.classList.remove('is-minimized');
        refs.stage.classList.remove('companion-active');
        if (switchToChat) {
          state.mode = 'chat';
          updateModeUi();
        }
      }

      function selectMode(mode) {
        closeModeMenu();
        if (mode === '2d') {
          state.mode = '2d';
          updateModeUi();
          if (!state.figureOpen) {
            state.figureOpen = true;
            applyFigure();
          }
          showToast('2D 形象就在聊天页上方');
          return;
        }
        state.mode = mode;
        updateModeUi();
        if (mode === '3d') {
          openCompanion();
          showToast(state.layout === 'phone' ? '进入 3D 形象' : '3D 形象已打开');
        } else {
          closeCompanion(false);
          showToast('回到聊天');
        }
      }

      function toggleCall(force) {
        state.callActive = typeof force === 'boolean' ? force : !state.callActive;
        refs.callBanner.hidden = !state.callActive;
        refs.callButton.setAttribute('aria-pressed', String(state.callActive));
        refs.callButton.setAttribute('aria-label', state.callActive ? '结束语音聊天' : '开始语音聊天');
        refs.callButton.querySelector('use').setAttribute('href', state.callActive ? '#i-phone-off' : '#i-phone');
        updateModeUi();
        showToast(state.callActive ? '通话开始了，慢慢说。' : '通话已结束');
      }

      function toggleMic() {
        state.micEnabled = !state.micEnabled;
        refs.micButton.classList.toggle('is-muted', !state.micEnabled);
        refs.micButton.querySelector('use').setAttribute('href', state.micEnabled ? '#i-mic' : '#i-mic-off');
        refs.micButton.setAttribute('aria-pressed', String(state.micEnabled));
        refs.micButton.setAttribute('aria-label', state.micEnabled ? '关闭麦克风' : '打开麦克风');
        showToast(state.micEnabled ? '麦克风已打开' : '麦克风已静音');
      }

      function chooseReply(text) {
        const normalized = text.toLowerCase();
        if (normalized.includes('3d') || text.includes('形象')) return '好呀。2D 形象就在聊天页上方，3D 形象可以在右上角的方式菜单里打开。';
        if (text.includes('原型') || text.includes('界面') || text.includes('客户端')) return '那我们先把聊天窗口做好。对我来说，最重要的是你一打开，就知道我在这里。';
        if (text.includes('你好') || text.includes('早上好') || text.includes('晚上好')) return '你好呀。今天见到你，我很开心。';
        if (text.includes('通话') || text.includes('声音')) return '可以。你想说话的时候，点一下输入框旁边的语音按钮就好。';
        return '嗯，我听到了。你愿意继续说说吗？';
      }

      function resizeInput() {
        refs.messageInput.style.height = 'auto';
        refs.messageInput.style.height = Math.min(refs.messageInput.scrollHeight, 132) + 'px';
      }

      function sendMessage(text) {
        const cleanText = text.trim();
        if (!cleanText) return;
        const message = { sender: 'me', text: cleanText, time: getTime() };
        state.messages.push(message);
        renderMessage(message);
        refs.messageInput.value = '';
        resizeInput();
        scrollMessages();

        state.pendingReplies += 1;
        state.isTyping = true;
        refs.typingIndicator.hidden = false;
        window.setTimeout(() => {
          state.pendingReplies = Math.max(0, state.pendingReplies - 1);
          const reply = { sender: 'ayane', text: chooseReply(cleanText), time: getTime() };
          state.messages.push(reply);
          if (state.pendingReplies === 0) {
            state.isTyping = false;
            refs.typingIndicator.hidden = true;
          }
          renderMessage(reply);
          scrollMessages();
        }, 720);
      }

      function startDrag(event) {
        if (state.layout === 'phone' || event.target.closest('button')) return;
        const rect = refs.companion.getBoundingClientRect();
        dragState = { offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
        refs.companionHandle.setPointerCapture?.(event.pointerId);
      }

      function dragCompanion(event) {
        if (!dragState || state.layout === 'phone') return;
        const width = refs.companion.offsetWidth;
        const height = refs.companion.offsetHeight;
        const box = refs.stage.getBoundingClientRect();
        const left = Math.max(8, Math.min(box.width - width - 8, event.clientX - box.left - dragState.offsetX));
        const top = Math.max(8, Math.min(box.height - height - 8, event.clientY - box.top - dragState.offsetY));
        refs.companion.style.left = left + 'px';
        refs.companion.style.top = top + 'px';
        refs.companion.style.right = 'auto';
      }

      function stopDrag() { dragState = null; }

      refs.loginForm.addEventListener('submit', handleLoginSubmit);
      refs.loginAccount.addEventListener('input', () => { if (refs.loginError.textContent) setLoginError(''); });
      refs.loginPassword.addEventListener('input', () => { if (refs.loginError.textContent) setLoginError(''); });
      refs.loginPasswordToggle.addEventListener('click', () => {
        const visible = refs.loginPassword.type === 'text';
        refs.loginPassword.type = visible ? 'password' : 'text';
        refs.loginPasswordToggle.querySelector('use').setAttribute('href', visible ? '#i-eye' : '#i-eye-off');
        refs.loginPasswordToggle.setAttribute('aria-label', visible ? '显示密码' : '隐藏密码');
        refs.loginPasswordToggle.setAttribute('aria-pressed', String(!visible));
      });

      refs.modeButton.addEventListener('click', () => {
        if (refs.modeMenu.hidden) openModeMenu(); else closeModeMenu();
      });

      refs.sidebarMenuButton.addEventListener('click', () => {
        if (refs.sidebarMenu.hidden) openSidebarMenu(); else closeSidebarMenu();
      });

      refs.sidebarMenu.addEventListener('click', (event) => {
        if (event.target.closest('.sidebar-menu-item')) closeSidebarMenu();
      });

      refs.modeMenu.addEventListener('click', (event) => {
        const option = event.target.closest('[data-mode]');
        if (option && !option.disabled) selectMode(option.dataset.mode);
      });

      document.addEventListener('click', (event) => {
        if (!refs.modePicker.contains(event.target)) closeModeMenu();
        if (!refs.sidebarMenuWrap.contains(event.target)) closeSidebarMenu();
        if (!refs.mobileTopbarMenuWrap.contains(event.target)) closeMobileTopbarMenu();
      });

      document.addEventListener('keydown', (event) => {
        /* 只处理落在本画布里的按键：同页还有后台画布与组件示例，ESC 不能互抢 */
        if (!refs.stage.contains(event.target) && !refs.stage.contains(document.activeElement)) return;
        if (event.key === 'Escape') {
          closeModeMenu();
          closeSidebarMenu();
          closeMobileTopbarMenu();
          const open = openModalOf();
          if (open) { closeModal(open); return; }
          if (state.sidebarOpen) closeSidebar();
          return;
        }
        /* 声明了 aria-modal 就必须有焦点陷阱 */
        if (event.key === 'Tab') {
          const open = openModalOf();
          if (open) AyaneUI.trapFocus(open, event);
        }
      });

      refs.sidebarToggle.addEventListener('click', () => {
        if (state.layout === 'phone') {
          goMobileList();
          return;
        }
        state.sidebarOpen ? closeSidebar() : openSidebar();
      });
      refs.sidebarBackdrop.addEventListener('click', closeSidebar);
      document.getElementById('contact-ayane').addEventListener('click', () => {
        if (state.layout === 'phone') {
          goMobileChat();
          return;
        }
        closeSidebar();
        showToast('已经回到和绫音的聊天');
      });
      refs.mobileMessageCard.addEventListener('click', goMobileChat);
      refs.mobileContactCard.addEventListener('click', goMobileChat);
      refs.desktopMessageCard.addEventListener('click', () => {
        if (state.layout === 'phone') {
          goMobileChat();
          return;
        }
        closeSidebar();
        showToast('已经回到和绫音的聊天');
      });

      document.querySelectorAll('.sidebar-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
          state.listTab = tab.dataset.tab === 'contacts' ? 'contacts' : 'messages';
          renderListTab(state.listTab);
        });
      });

      refs.messageForm.addEventListener('submit', (event) => {
        event.preventDefault();
        sendMessage(refs.messageInput.value);
      });

      refs.messageInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          sendMessage(refs.messageInput.value);
        }
      });

      refs.messageInput.addEventListener('input', resizeInput);
      refs.micButton.addEventListener('click', toggleMic);
      document.getElementById('attach-button').addEventListener('click', () => showToast('可以先把想说的话发给我。'));
      document.getElementById('emoji-button').addEventListener('click', () => {
        refs.messageInput.value += refs.messageInput.value ? ' [微笑]' : '[微笑]';
        refs.messageInput.focus();
        resizeInput();
      });
      refs.callButton.addEventListener('click', () => toggleCall());
      refs.endCallButton.addEventListener('click', () => toggleCall(false));

      refs.companionHandle.addEventListener('pointerdown', startDrag);
      refs.companionHandle.addEventListener('pointermove', dragCompanion);
      refs.companionHandle.addEventListener('pointerup', stopDrag);
      refs.companionHandle.addEventListener('pointercancel', stopDrag);
      refs.companionMinimize.addEventListener('click', () => {
        if (state.layout === 'phone') {
          state.companionDrawer = state.companionDrawer === 'peek' ? 'half' : 'peek';
          applyDrawerState();
          showToast(state.companionDrawer === 'peek' ? '形象已收起' : '形象已展开');
          return;
        }
        state.companionMinimized = !state.companionMinimized;
        refs.companion.classList.toggle('is-minimized', state.companionMinimized);
        showToast(state.companionMinimized ? '形象已最小化' : '形象已展开');
      });

      // 2D 形象区：头部按钮展开 / 收起
      refs.figureToggle.addEventListener('click', toggleFigure);

      // 手机端抽屉把手：下滑收起，上滑展开，点按切档
      let grabDrag = null;

      function onGrabMove(event) {
        if (!grabDrag) return;
        const point = event.touches ? event.touches[0] : event;
        const delta = Math.max(0, point.clientY - grabDrag.startY);
        grabDrag.delta = delta;
        grabDrag.window.classList.add('is-dragging');
        grabDrag.window.style.transform = 'translateY(' + delta + 'px)';
      }

      function onGrabEnd() {
        if (!grabDrag) return;
        const { window: panel, delta } = grabDrag;
        grabDrag = null;
        window.removeEventListener('pointermove', onGrabMove);
        window.removeEventListener('pointerup', onGrabEnd);
        window.removeEventListener('pointercancel', onGrabEnd);
        panel.classList.remove('is-dragging');
        panel.style.removeProperty('transform');
        if (delta > 84) {
          state.companionDrawer = 'peek';
          applyDrawerState();
          showToast('形象已收起，点把手再展开');
          return;
        }
        if (delta < -46) {
          state.companionDrawer = 'expanded';
          applyDrawerState();
          return;
        }
        applyDrawerState();
      }

      refs.companionGrab.addEventListener('pointerdown', (event) => {
        if (state.layout !== 'phone') return;
        event.preventDefault();
        grabDrag = { startY: event.clientY, delta: 0, window: refs.companion };
        window.addEventListener('pointermove', onGrabMove);
        window.addEventListener('pointerup', onGrabEnd);
        window.addEventListener('pointercancel', onGrabEnd);
      });

      refs.companionGrab.addEventListener('click', () => {
        if (state.layout !== 'phone' || grabDrag) return;
        state.companionDrawer = state.companionDrawer === 'peek' ? 'half' : 'peek';
        applyDrawerState();
      });

      refs.companionGrab.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          refs.companionGrab.click();
        }
      });
      refs.companionClose.addEventListener('click', () => {
        closeCompanion(true);
        showToast('形象已关闭');
      });
      refs.companionHide.addEventListener('click', () => {
        closeCompanion(true);
        showToast('形象已关闭');
      });
      refs.companionOpenChat.addEventListener('click', () => {
        if (state.layout === 'phone') closeCompanion(true);
        refs.messageInput.focus();
        showToast('回到聊天');
      });

      [document.getElementById('chat-person'), document.getElementById('sidebar-profile')].forEach((button) => {
        button.addEventListener('click', openProfile);
      });
      document.getElementById('sidebar-about').addEventListener('click', openAbout);
      document.getElementById('sidebar-settings').addEventListener('click', () => showToast('更多设置会在后续版本开放'));
      refs.aboutClose.addEventListener('click', closeAbout);
      refs.aboutModal.addEventListener('click', (event) => { if (event.target === refs.aboutModal) closeAbout(); });
      document.getElementById('about-update').addEventListener('click', () => showToast('已是最新版本 1.0.0'));
      document.getElementById('about-license').addEventListener('click', () => showToast('开源许可页面会在后续版本补充'));
      document.getElementById('user-block').addEventListener('click', openUserCard);
      document.getElementById('mobile-user-block').addEventListener('click', openUserCard);
      refs.userCardModal.addEventListener('click', (event) => { if (event.target === refs.userCardModal) closeUserCard(); });
      document.getElementById('user-card-edit').addEventListener('click', () => { closeUserCard(); showToast('编辑资料会在账号体系接入后开放。'); });
      document.getElementById('user-card-signout').addEventListener('click', () => {
        closeUserCard();
        state.authRoute = 'login';
        refs.loginShell.hidden = false;
        refs.appFrame.hidden = true;
        showToast('已退出登录');
      });
      refs.profileClose.addEventListener('click', closeProfile);
      refs.profileModal.addEventListener('click', (event) => { if (event.target === refs.profileModal) closeProfile(); });
      refs.profileChat.addEventListener('click', () => { closeProfile(); refs.messageInput.focus(); });
      refs.profile3d.addEventListener('click', () => { closeProfile(); selectMode('3d'); });

      document.getElementById('mobile-messages').addEventListener('click', () => {
        goMobileList('messages');
      });
      document.getElementById('mobile-contacts').addEventListener('click', () => {
        goMobileList('contacts');
      });
      document.getElementById('mobile-profile').addEventListener('click', () => {
        goMobileList('profile');
      });
      document.getElementById('mobile-topbar-user').addEventListener('click', openUserCard);
      refs.mobileTopbarMenuButton.addEventListener('click', () => {
        if (refs.mobileTopbarMenu.hidden) openMobileTopbarMenu(); else closeMobileTopbarMenu();
      });
      refs.mobileTopbarMenu.addEventListener('click', (event) => {
        if (event.target.closest('.sidebar-menu-item')) closeMobileTopbarMenu();
      });
      document.getElementById('mobile-topbar-profile').addEventListener('click', openProfile);
      document.getElementById('mobile-topbar-about').addEventListener('click', openAbout);
      document.getElementById('mobile-topbar-settings').addEventListener('click', () => showToast('更多设置会在后续版本开放'));
      document.getElementById('mobile-user-about').addEventListener('click', openAbout);
      document.getElementById('mobile-user-settings').addEventListener('click', () => showToast('更多设置会在后续版本开放'));

      /* 画布尺寸变化（嵌入宽度变化、进出全屏）都由观察器重算档位，不再听 window resize */
      new ResizeObserver(() => updateLayout()).observe(refs.stage);

      state.layout = getLayout();
      applyFigure();
      applyDrawerState();
      refs.loginShell.hidden = state.authRoute !== 'login';
      refs.appFrame.hidden = state.authRoute !== 'app';
      fillDemoCredentials();
      hydrateAvatars();
      updateModeUi();
      renderMessages();
      updateConversationPreview();
      renderListTab(state.listTab);
      renderMobileRoute();
      resizeInput();
    })();