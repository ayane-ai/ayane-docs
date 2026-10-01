/* 组件清单唯一数据源；来源、用途与展示位置供组件库和静态检查共用。 */
window.AyaneComponentInventory = {
  "baseline": {
    "name": "绫音设计规范与交互原型.html",
    "sha256": "dabdcc47b36b0305491b7a26ec523ba3b8ab51e32c2d14b6f7c0dda27dac8206",
    "sourceFingerprint": "a8b1eba483bdfa0280fbe7f336c083b8aea1120ee4967bd3160c674b9c786a48"
  },
  "components": [
    {
      "id": "icons",
      "name": "SVG 图标及状态",
      "selectors": [
        "svg.icon",
        "#i-eye",
        "#i-mic"
      ],
      "demo": "demo-client-icons",
      "source": "src/components/icon.css",
      "uses": "客户端、管理后台与组件库",
      "purpose": "通用组件"
    },
    {
      "id": "avatar",
      "name": "头像及尺寸变体",
      "selectors": [
        ".avatar",
        ".avatar-sm",
        ".avatar-lg",
        ".avatar-xl"
      ],
      "demo": "demo-client-avatars",
      "source": "src/components/avatar.css",
      "uses": "客户端、管理后台与组件库",
      "purpose": "通用组件"
    },
    {
      "id": "presence",
      "name": "在线指示与头像角标",
      "selectors": [
        ".online-dot",
        ".user-avatar::after",
        ".user-card-avatar.is-online"
      ],
      "demo": "demo-client-identity",
      "source": "src/components/tag.css",
      "uses": "客户端与组件库",
      "purpose": "客户端组件"
    },
    {
      "id": "badge",
      "name": "计数徽标",
      "selectors": [
        ".nav-badge",
        ".tab-count"
      ],
      "demo": "demo-client-buttons",
      "source": "src/components/nav.css",
      "uses": "通知按钮、导航与页签",
      "purpose": "通用组件"
    },
    {
      "id": "profile-tags",
      "name": "资料标签",
      "selectors": [
        ".profile-tags"
      ],
      "demo": "demo-client-profile",
      "source": "src/components/tag.css",
      "uses": "客户端与组件库",
      "purpose": "客户端组件"
    },
    {
      "id": "buttons",
      "name": "普通、主次及图标按钮",
      "selectors": [
        ".action-button",
        ".icon-button",
        ".profile-actions button",
        ".user-card-actions button"
      ],
      "demo": "demo-client-buttons",
      "source": "src/components/button.css",
      "uses": "客户端、管理后台与组件库",
      "purpose": "通用组件"
    },
    {
      "id": "login-card",
      "name": "登录壳、卡片与品牌",
      "selectors": [
        ".login-shell",
        ".login-card",
        ".login-avatar",
        ".login-subtitle"
      ],
      "demo": "demo-client-login",
      "source": "src/components/client.css",
      "uses": "客户端与组件库",
      "purpose": "客户端组件"
    },
    {
      "id": "login-fields",
      "name": "账号、密码字段与标签",
      "selectors": [
        ".login-field",
        ".login-input",
        ".login-input-wrap"
      ],
      "demo": "demo-client-login",
      "source": "src/components/field.css",
      "uses": "客户端与组件库",
      "purpose": "客户端组件"
    },
    {
      "id": "password-toggle",
      "name": "密码显隐",
      "selectors": [
        ".login-password-toggle"
      ],
      "demo": "demo-client-login",
      "source": "src/components/button.css",
      "uses": "客户端与组件库",
      "purpose": "客户端组件"
    },
    {
      "id": "login-feedback",
      "name": "登录提交、加载与错误",
      "selectors": [
        ".login-submit",
        ".login-error"
      ],
      "demo": "demo-client-login",
      "source": "src/components/button.css",
      "uses": "客户端与组件库",
      "purpose": "客户端组件"
    },
    {
      "id": "field-states",
      "name": "字段普通、错误、禁用与多行",
      "selectors": [
        ".login-input",
        ".login-error",
        "#message-input"
      ],
      "demo": "demo-client-fields",
      "source": "src/components/field.css",
      "uses": "客户端、管理后台与组件库",
      "purpose": "通用组件"
    },
    {
      "id": "account-strip",
      "name": "账号条",
      "selectors": [
        ".user-block",
        ".user-copy",
        ".sidebar-top"
      ],
      "demo": "demo-client-identity",
      "source": "src/components/client.css",
      "uses": "桌面账号区与组件库",
      "purpose": "客户端组件"
    },
    {
      "id": "more-menu",
      "name": "更多菜单、菜单项和分隔线",
      "selectors": [
        ".sidebar-menu",
        ".sidebar-menu-item",
        ".sidebar-menu-divider"
      ],
      "demo": "demo-client-identity",
      "source": "src/components/client.css",
      "uses": "客户端与组件库",
      "purpose": "客户端组件"
    },
    {
      "id": "segmented-tabs",
      "name": "通用圆角双段页签",
      "selectors": [
        ".tabs.tabs--segmented",
        ".tab[aria-selected]"
      ],
      "demo": "demo-segmented-tabs",
      "source": "src/components/nav.css",
      "uses": "内容分组切换，不绑定客户端页面",
      "purpose": "通用组件"
    },
    {
      "id": "ai-list",
      "name": "常驻 AI 选择列表",
      "selectors": [
        ".ai-choice-panel",
        ".contact-card.ai-card",
        "[data-agent-id]"
      ],
      "demo": "demo-client-list-desktop",
      "source": "src/components/client.css",
      "uses": "客户端桌面侧栏及桌面列表示例",
      "purpose": "客户端组件"
    },
    {
      "id": "ai-drawer",
      "name": "手机 AI 抽屉",
      "selectors": [
        ".ai-choice-drawer",
        ".ai-drawer-head",
        ".client-ai-scrim"
      ],
      "demo": "demo-client-list-phone",
      "source": "src/components/client.css",
      "uses": "客户端手机菜单与抽屉示例",
      "purpose": "客户端组件"
    },
    {
      "id": "ai-note",
      "name": "AI 列表说明",
      "selectors": [
        ".ai-list-note"
      ],
      "demo": "demo-client-list-phone",
      "source": "src/components/client.css",
      "uses": "常驻列表与手机抽屉",
      "purpose": "客户端组件"
    },
    {
      "id": "bottom-nav",
      "name": "绫音／我的底部导航",
      "selectors": [
        ".client-bottom-nav",
        "[data-companion-page]"
      ],
      "demo": "demo-client-bottom-nav",
      "source": "src/components/nav.css",
      "uses": "客户端手机布局与导航示例",
      "purpose": "客户端组件"
    },
    {
      "id": "message",
      "name": "最近对话气泡",
      "selectors": [
        ".recent-messages",
        ".message-row",
        ".message-bubble",
        ".message-expand"
      ],
      "demo": "demo-client-messages",
      "source": "src/components/client.css",
      "uses": "客户端形象页与最近对话示例",
      "purpose": "客户端组件"
    },
    {
      "id": "conversation-feedback",
      "name": "等待回复与模拟播报反馈",
      "selectors": [
        ".conversation-meta",
        ".conversation-thinking"
      ],
      "demo": "demo-client-messages",
      "source": "src/components/client.css",
      "uses": "客户端对话反馈与局部状态演示",
      "purpose": "客户端组件"
    },
    {
      "id": "composer",
      "name": "消息输入与发送组合",
      "selectors": [
        ".composer",
        ".composer-box",
        ".send-button"
      ],
      "demo": "demo-client-composer",
      "source": "src/components/field.css",
      "uses": "客户端与消息输入示例",
      "purpose": "客户端组件"
    },
    {
      "id": "textarea",
      "name": "自动增高输入框",
      "selectors": [
        "#message-input"
      ],
      "demo": "demo-client-composer",
      "source": "src/components/field.css",
      "uses": "客户端与组件库",
      "purpose": "客户端组件"
    },
    {
      "id": "my-card",
      "name": "手机我的账号卡及操作",
      "selectors": [
        ".mobile-user-card",
        ".mobile-user-hint",
        ".mobile-user-actions"
      ],
      "demo": "demo-client-identity",
      "source": "src/components/client.css",
      "uses": "客户端与组件库",
      "purpose": "客户端组件"
    },
    {
      "id": "ai-profile",
      "name": "AI 资料模态及动作",
      "selectors": [
        ".profile-modal",
        ".profile-actions"
      ],
      "demo": "demo-client-profile",
      "source": "src/components/client.css",
      "uses": "客户端与组件库",
      "purpose": "客户端组件"
    },
    {
      "id": "user-profile",
      "name": "我的资料、字段行及动作",
      "selectors": [
        ".user-card",
        ".user-card-identity",
        ".user-card-table",
        ".user-card-row",
        ".user-card-actions"
      ],
      "demo": "demo-client-user",
      "source": "src/components/client.css",
      "uses": "客户端与组件库",
      "purpose": "客户端组件"
    },
    {
      "id": "about",
      "name": "关于、版本、更新与许可",
      "selectors": [
        ".about-card",
        ".about-name",
        ".about-version",
        ".about-tagline",
        ".about-divider",
        ".about-links",
        ".about-actions"
      ],
      "demo": "demo-client-about",
      "source": "src/components/client.css",
      "uses": "客户端与组件库",
      "purpose": "客户端组件"
    },
    {
      "id": "modal",
      "name": "模态容器与遮罩",
      "selectors": [
        ".modal-layer"
      ],
      "demo": "demo-client-profile",
      "source": "src/components/overlay.css",
      "uses": "客户端、管理后台与组件库",
      "purpose": "通用组件"
    },
    {
      "id": "toast",
      "name": "Toast 提示",
      "selectors": [
        ".toast"
      ],
      "demo": "demo-client-identity",
      "source": "src/components/overlay.css",
      "uses": "客户端、管理后台与组件库",
      "purpose": "通用组件"
    },
    {
      "id": "conversation-records",
      "name": "完整对话记录",
      "selectors": [
        ".client-history-layer",
        ".client-history-sheet",
        ".messages",
        ".history-target"
      ],
      "demo": "demo-client-messages",
      "source": "src/components/client.css",
      "purpose": "客户端组件",
      "uses": "当前 AI 的底部记录浮层，与最近气泡共用消息数据"
    }
  ],
  "excludedExamples": [
    "demo-client-sidebar",
    "demo-client-legacy-mode",
    "demo-client-figure-desktop",
    "demo-client-figure-phone",
    "demo-client-composer-legacy"
  ],
  "scope": "当前组件定义、示例与使用位置。"
};
