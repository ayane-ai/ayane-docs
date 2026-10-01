/* 生成物 · 请勿手改
   由 tools/tokens-report.mjs 解析 src/base/tokens.css 生成
   source-sha256: 7e265a37b43d03d1612e1fcbbf5f8b93d71ea1ee8f8078e79b1f9344665613ba
*/
window.AyaneTokens = {
  "total": 256,
  "groups": [
    {
      "title": "字体族",
      "tokens": [
        {
          "name": "--font-family-sans",
          "value": "Inter, \"SF Pro Display\", \"PingFang SC\", \"Microsoft YaHei\", system-ui, -apple-system, sans-serif",
          "desc": "界面字体栈",
          "nomikit": "Typography.fontFamily",
          "dark": ""
        },
        {
          "name": "--font-family-mono",
          "value": "ui-monospace, \"SFMono-Regular\", \"Cascadia Mono\", Consolas, \"Liberation Mono\", monospace",
          "desc": "等宽字体栈",
          "nomikit": "Typography.fontFamilyMono",
          "dark": ""
        }
      ]
    },
    {
      "title": "颜色 · 品牌",
      "tokens": [
        {
          "name": "--color-primary",
          "value": "#e3a08bff",
          "desc": "主色：暖橙粉",
          "nomikit": "AppColorScheme.primary",
          "dark": "#e8a992ff"
        },
        {
          "name": "--color-on-primary",
          "value": "#ffffffff",
          "desc": "主色上的文字",
          "nomikit": "AppColorScheme.onPrimary",
          "dark": "#3a2318ff"
        },
        {
          "name": "--color-primary-strong",
          "value": "#bf7665ff",
          "desc": "主色强调：按下与链接 的深色端",
          "nomikit": "AppColorScheme.primaryContainer",
          "dark": "#f0bda7ff"
        },
        {
          "name": "--color-primary-soft",
          "value": "#fff0e9ff",
          "desc": "主色浅底：选中态背景",
          "nomikit": "AppColorScheme.primaryContainer",
          "dark": "#43302aff"
        },
        {
          "name": "--color-primary-container",
          "value": "#e6a18dff",
          "desc": "主色容器：渐变与装饰端",
          "nomikit": "AppColorScheme.secondaryContainer",
          "dark": "#6b4a3dff"
        },
        {
          "name": "--color-on-primary-container",
          "value": "#4a4038ff",
          "desc": "主色容器上的文字",
          "nomikit": "",
          "dark": "#f6e6dcff"
        }
      ]
    },
    {
      "title": "颜色 · 中性面",
      "tokens": [
        {
          "name": "--color-bg",
          "value": "#fbf7efff",
          "desc": "页面底色",
          "nomikit": "AppColorScheme.background",
          "dark": "#1d1714ff"
        },
        {
          "name": "--color-bg-deep",
          "value": "#f3e9dfff",
          "desc": "页面底色深端：渐变收尾",
          "nomikit": "AppColorScheme.backgroundVariant",
          "dark": "#241d19ff"
        },
        {
          "name": "--color-surface",
          "value": "#ffffffb3",
          "desc": "面板：半透明白",
          "nomikit": "AppColorScheme.surface",
          "dark": "var(--color-surface-strong)"
        },
        {
          "name": "--color-surface-strong",
          "value": "#fffffff2",
          "desc": "面板：纯白最高层",
          "nomikit": "AppColorScheme.surfaceLower",
          "dark": "#2e2621ff"
        },
        {
          "name": "--color-surface-soft",
          "value": "#fff9f2ff",
          "desc": "面板：暖白浅层",
          "nomikit": "AppColorScheme.surfaceLow",
          "dark": "#26201cff"
        },
        {
          "name": "--color-surface-solid",
          "value": "#fffdf9f0",
          "desc": "面板：不透明，sticky 头与弹层底栏用",
          "nomikit": "AppColorScheme.surface",
          "dark": "var(--color-surface-strong)"
        },
        {
          "name": "--color-surface-high",
          "value": "#f7efe6ff",
          "desc": "面板：抬高层，hover 底色",
          "nomikit": "AppColorScheme.surfaceHigh",
          "dark": "#382f29ff"
        }
      ]
    },
    {
      "title": "颜色 · 文字",
      "tokens": [
        {
          "name": "--color-on-surface",
          "value": "#4a4038ff",
          "desc": "正文",
          "nomikit": "AppColorScheme.onSurface",
          "dark": "#ece0d6ff"
        },
        {
          "name": "--color-on-surface-soft",
          "value": "#74675dff",
          "desc": "次级文字",
          "nomikit": "AppColorScheme.onSurfaceVariant",
          "dark": "#c3b3a7ff"
        },
        {
          "name": "--color-text-hint",
          "value": "#a29488ff",
          "desc": "占位与提示 的浅端",
          "nomikit": "AppColorScheme.onSurfaceVariant",
          "dark": "#93837aff"
        },
        {
          "name": "--color-text-placeholder",
          "value": "#b7a79bff",
          "desc": "输入框占位符",
          "nomikit": "",
          "dark": "#82726aff"
        },
        {
          "name": "--color-on-dark",
          "value": "#ffffffff",
          "desc": "深色浮层上的文字",
          "nomikit": "AppColorScheme.inverseOnSurface",
          "dark": "#241d19ff"
        }
      ]
    },
    {
      "title": "颜色 · 描边与分隔",
      "tokens": [
        {
          "name": "--color-outline",
          "value": "#e3a08b3d",
          "desc": "常规描边",
          "nomikit": "AppColorScheme.outlineVariant",
          "dark": "#3d332cff"
        },
        {
          "name": "--color-outline-strong",
          "value": "#e3a08b7a",
          "desc": "强调描边与分隔线",
          "nomikit": "AppColorScheme.outline",
          "dark": "var(--color-outline)"
        }
      ]
    },
    {
      "title": "颜色 · 语义",
      "tokens": [
        {
          "name": "--color-success",
          "value": "#65c59bff",
          "desc": "成功",
          "nomikit": "AppColorScheme.tertiary",
          "dark": "#79bb92ff"
        },
        {
          "name": "--color-success-soft",
          "value": "#e6f2e9ff",
          "desc": "成功浅底",
          "nomikit": "",
          "dark": "#2c3d33ff"
        },
        {
          "name": "--color-warning",
          "value": "#b98a3cff",
          "desc": "告警 的暖色替代",
          "nomikit": "AppColorScheme.error",
          "dark": "#dcb268ff"
        },
        {
          "name": "--color-warning-soft",
          "value": "#fff4ddff",
          "desc": "告警浅底",
          "nomikit": "",
          "dark": "#40351fff"
        },
        {
          "name": "--color-info",
          "value": "#5f86a8ff",
          "desc": "信息",
          "nomikit": "AppColorScheme.secondary",
          "dark": "#86aed2ff"
        },
        {
          "name": "--color-info-soft",
          "value": "#e8f0f7ff",
          "desc": "信息浅底",
          "nomikit": "",
          "dark": "#293844ff"
        },
        {
          "name": "--color-error",
          "value": "#cf6d72ff",
          "desc": "危险",
          "nomikit": "AppColorScheme.error",
          "dark": "#e38b90ff"
        },
        {
          "name": "--color-error-soft",
          "value": "#fdecedff",
          "desc": "危险浅底",
          "nomikit": "",
          "dark": "#442a2cff"
        },
        {
          "name": "--color-neutral-soft",
          "value": "#f0eae2ff",
          "desc": "中性状态浅底：已归档与暂缓",
          "nomikit": "",
          "dark": "#38302aff"
        },
        {
          "name": "--color-accent-mint",
          "value": "#dceee0ff",
          "desc": "装饰：薄荷气泡",
          "nomikit": "",
          "dark": "#2f4438ff"
        },
        {
          "name": "--color-accent-yellow",
          "value": "#fff2cfff",
          "desc": "装饰：奶黄气泡",
          "nomikit": "",
          "dark": "#463a22ff"
        }
      ]
    },
    {
      "title": "颜色 · 特殊表面",
      "tokens": [
        {
          "name": "--color-table-head",
          "value": "#fdf6eeff",
          "desc": "表头底色，必须不透明",
          "nomikit": "AppColorScheme.surfaceContainer",
          "dark": "#332a24ff"
        },
        {
          "name": "--color-row-hover",
          "value": "#e6a18d12",
          "desc": "行 hover 底色",
          "nomikit": "",
          "dark": "#e8a99214"
        },
        {
          "name": "--color-scrim",
          "value": "#4a403852",
          "desc": "遮罩",
          "nomikit": "AppColorScheme.scrim",
          "dark": "#08050494"
        },
        {
          "name": "--color-scrim-soft",
          "value": "#4a403836",
          "desc": "模态遮罩：比抽屉遮罩浅一档，两原型实测 0.20/0.22 合档",
          "nomikit": "",
          "dark": "#08050480"
        },
        {
          "name": "--color-toast-bg",
          "value": "#4a4038f0",
          "desc": "toast 深底",
          "nomikit": "AppColorScheme.inverseSurface",
          "dark": "#f0e4d9f5"
        },
        {
          "name": "--color-focus-ring",
          "value": "#e3a08b4d",
          "desc": "focus-visible 描边",
          "nomikit": "",
          "dark": "#e8a99257"
        },
        {
          "name": "--color-focus-ring-soft",
          "value": "#e6a18d33",
          "desc": "输入控件聚焦环，比通用环浅一档",
          "nomikit": "",
          "dark": "#e8a99238"
        }
      ]
    },
    {
      "title": "颜色 · 组件专用（从组件样式里收上来的字面色，组件层不得再写死）",
      "tokens": [
        {
          "name": "--color-surface-hairline",
          "value": "#fffffff0",
          "desc": "半透明面板上的 1px 描边",
          "nomikit": "",
          "dark": "var(--color-outline)"
        },
        {
          "name": "--color-surface-hairline-strong",
          "value": "#fffdf9e6",
          "desc": "弹层描边",
          "nomikit": "",
          "dark": "var(--color-outline)"
        },
        {
          "name": "--color-surface-inset",
          "value": "#fffdf9eb",
          "desc": "内嵌芯片与浅轨道底色",
          "nomikit": "",
          "dark": "var(--color-surface-strong)"
        },
        {
          "name": "--color-outline-hover",
          "value": "#e3a08bb8",
          "desc": "控件 hover 描边",
          "nomikit": "",
          "dark": "var(--color-outline)"
        },
        {
          "name": "--color-outline-error",
          "value": "#cf6d7266",
          "desc": "危险控件描边",
          "nomikit": "",
          "dark": "#e38b9073"
        },
        {
          "name": "--color-outline-error-soft",
          "value": "#cf6d7259",
          "desc": "告警卡片描边",
          "nomikit": "",
          "dark": "#e38b9061"
        },
        {
          "name": "--color-outline-hover-soft",
          "value": "#e6a18d29",
          "desc": "卡片 hover 描边",
          "nomikit": "",
          "dark": "var(--color-outline)"
        },
        {
          "name": "--color-error-wash",
          "value": "#fff6f6ff",
          "desc": "告警卡片渐变亮端",
          "nomikit": "",
          "dark": "#3a2628ff"
        },
        {
          "name": "--color-outline-error-strong",
          "value": "#cf6d72b3",
          "desc": "危险控件 hover 描边",
          "nomikit": "",
          "dark": "#e38b90b8"
        },
        {
          "name": "--color-outline-error-hair",
          "value": "#cf6d7242",
          "desc": "危险弹层头部分隔线",
          "nomikit": "",
          "dark": "#e38b9047"
        },
        {
          "name": "--color-primary-light",
          "value": "#efb59eff",
          "desc": "主色渐变亮端：同步客户端品牌亮端",
          "nomikit": "",
          "dark": "#f0bda7ff"
        },
        {
          "name": "--color-primary-hover-a",
          "value": "#dd8f77ff",
          "desc": "主色按钮 hover 渐变起",
          "nomikit": "",
          "dark": "#efb39aff"
        },
        {
          "name": "--color-primary-hover-b",
          "value": "#e79c85ff",
          "desc": "主色按钮 hover 渐变止",
          "nomikit": "",
          "dark": "#f6c6b1ff"
        },
        {
          "name": "--color-primary-deep",
          "value": "#e6a18d38",
          "desc": "主色按钮 loading 环",
          "nomikit": "",
          "dark": "var(--color-on-surface-soft)"
        },
        {
          "name": "--color-error-strong",
          "value": "#a4484eff",
          "desc": "危险按钮文字",
          "nomikit": "",
          "dark": "#f0a9adff"
        },
        {
          "name": "--color-error-strong-deep",
          "value": "#8f3b41ff",
          "desc": "危险按钮 hover 文字",
          "nomikit": "",
          "dark": "#f6c1c4ff"
        },
        {
          "name": "--color-error-softer",
          "value": "#fbdfe1ff",
          "desc": "危险按钮 hover 底色",
          "nomikit": "",
          "dark": "#5b3237ff"
        },
        {
          "name": "--color-warning-light-a",
          "value": "#d8ab5cff",
          "desc": "告警进度条渐变起",
          "nomikit": "",
          "dark": "#e0b877ff"
        },
        {
          "name": "--color-warning-light-b",
          "value": "#e6c079ff",
          "desc": "告警进度条渐变止",
          "nomikit": "",
          "dark": "#eccc8fff"
        },
        {
          "name": "--color-error-light-a",
          "value": "#cf6d72ff",
          "desc": "危险进度条渐变起",
          "nomikit": "",
          "dark": "#e38b90ff"
        },
        {
          "name": "--color-error-light-b",
          "value": "#e08b8fff",
          "desc": "危险进度条渐变止",
          "nomikit": "",
          "dark": "#eda3a7ff"
        },
        {
          "name": "--color-tab-track",
          "value": "#f7efe4c7",
          "desc": "分段控件轨道",
          "nomikit": "",
          "dark": "var(--color-surface-strong)"
        },
        {
          "name": "--color-tab-count",
          "value": "#decfc299",
          "desc": "分段计数徽标底",
          "nomikit": "",
          "dark": "#54473d99"
        },
        {
          "name": "--color-skeleton-base",
          "value": "#eee2d68c",
          "desc": "骨架屏暗端",
          "nomikit": "",
          "dark": "#3d332cb3"
        },
        {
          "name": "--color-skeleton-shine",
          "value": "#f8f0e8d9",
          "desc": "骨架屏亮端",
          "nomikit": "",
          "dark": "#56483ed9"
        },
        {
          "name": "--color-on-dark-hairline",
          "value": "#ffffff80",
          "desc": "深色浮层上的描边与 loading 环",
          "nomikit": "",
          "dark": "#241d1952"
        },
        {
          "name": "--color-primary-wash",
          "value": "#ffe7d8ff",
          "desc": "头像与图标底渐变亮端",
          "nomikit": "",
          "dark": "#4a332bff"
        },
        {
          "name": "--color-avatar-wash-a",
          "value": "#ffe3d6ff",
          "desc": "头像渐变起",
          "nomikit": "",
          "dark": "#4d362dff"
        },
        {
          "name": "--color-avatar-wash-b",
          "value": "#e6f0e5ff",
          "desc": "头像渐变止",
          "nomikit": "",
          "dark": "#33443aff"
        },
        {
          "name": "--color-nav-active-a",
          "value": "#e3a08b38",
          "desc": "导航选中渐变起",
          "nomikit": "",
          "dark": "#e8a99233"
        },
        {
          "name": "--color-nav-active-b",
          "value": "#f0ab941a",
          "desc": "导航选中渐变止",
          "nomikit": "",
          "dark": "#f0bda714"
        },
        {
          "name": "--color-nav-active-ring",
          "value": "#e6a18d3d",
          "desc": "导航选中描边",
          "nomikit": "",
          "dark": "var(--color-on-surface-soft)"
        },
        {
          "name": "--color-neutral-wash",
          "value": "#f0eae2b8",
          "desc": "禁用项 hover 底",
          "nomikit": "",
          "dark": "#382f29b8"
        },
        {
          "name": "--color-status-live",
          "value": "#5f9e7766",
          "desc": "实时状态点脉冲",
          "nomikit": "",
          "dark": "#79bb9273"
        },
        {
          "name": "--color-row-flash",
          "value": "#e6a18d4d",
          "desc": "新行高亮起始底色",
          "nomikit": "",
          "dark": "#e8a99238"
        },
        {
          "name": "--color-outline-strong-wash",
          "value": "#decfc2bf",
          "desc": "开关关闭态轨道",
          "nomikit": "",
          "dark": "#54473dcc"
        },
        {
          "name": "--color-track",
          "value": "#decfc280",
          "desc": "进度条轨道",
          "nomikit": "",
          "dark": "#54473d99"
        },
        {
          "name": "--color-focus-ring-error",
          "value": "#cf6d7224",
          "desc": "错误控件聚焦环",
          "nomikit": "",
          "dark": "#e38b902e"
        },
        {
          "name": "--color-toast-error-bg",
          "value": "#b04c52f5",
          "desc": "错误 toast 底",
          "nomikit": "",
          "dark": "#d67c82f5"
        },
        {
          "name": "--color-login-card-bg",
          "value": "#fffcf7ed",
          "desc": "登录卡底：两原型 0.94/0.90 合档",
          "nomikit": "",
          "dark": "#2e2621eb"
        },
        {
          "name": "--background-contact-card",
          "value": "linear-gradient(135deg, #fff0e5ff, #fff9f1ff)",
          "desc": "共享组件背景：从客户端卡片背景提升，保留原型渐变。",
          "nomikit": "",
          "dark": "var(--color-surface)"
        },
        {
          "name": "--background-user-card",
          "value": "radial-gradient(circle at 12% 0%, #ffe8d880, #00000000 42%),\n  #fffffff7",
          "desc": "共享组件背景：从客户端用户卡片背景提升，保留原型渐变。",
          "nomikit": "",
          "dark": "var(--color-surface)"
        },
        {
          "name": "--background-user-card-action",
          "value": "linear-gradient(135deg, var(--color-primary), #eba48dff)",
          "desc": "共享组件背景：从客户端动作背景提升，保留原型渐变。",
          "nomikit": "",
          "dark": "var(--color-surface)"
        },
        {
          "name": "--background-user-card-action-hover",
          "value": "linear-gradient(135deg, var(--color-primary-hover-a), #e09a83ff)",
          "desc": "共享组件背景：从客户端动作 hover 背景提升，保留原型渐变。",
          "nomikit": "",
          "dark": "var(--color-surface)"
        },
        {
          "name": "--background-ai-panel",
          "value": "linear-gradient(180deg, #ffffffd1, #fff8efd1), radial-gradient(circle at 20% 8%, #ffe2d273, #00000000 35%)",
          "desc": "共享组件背景：由 --background-ai-panel 提升，保留原型渐变。",
          "nomikit": "",
          "dark": "var(--color-surface)"
        }
      ]
    },
    {
      "title": "颜色 · 原型视图专用",
      "tokens": [
        {
          "name": "--color-prototype-bg-glow-a",
          "value": "#e6a18d38",
          "desc": "客户端与后台背景光晕起始层，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-prototype-bg-glow-b",
          "value": "#e6a18d29",
          "desc": "客户端与后台背景光晕次级层，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-prototype-bg-mid",
          "value": "#fffaf5ff",
          "desc": "客户端与后台背景渐变中间色，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-prototype-orb-light",
          "value": "#ffffffb3",
          "desc": "原型背景浅色装饰球，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-prototype-orb-warm",
          "value": "#f8dcceb3",
          "desc": "原型背景暖色装饰球，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-focus-ring",
          "value": "#e6a18d57",
          "desc": "后台原型焦点环，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-live-ring-clear",
          "value": "#5f9e7700",
          "desc": "后台实时状态脉冲透明端，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-live-ring",
          "value": "#5f9e7729",
          "desc": "后台实时状态脉冲，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-connecting-ring",
          "value": "#b98a3c29",
          "desc": "后台连接中状态脉冲，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-console-background",
          "value": "#fffcf8eb",
          "desc": "后台实时流面板底色，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-error-text",
          "value": "#9d4a50ff",
          "desc": "后台错误日志与危险提示文字，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-error-text-strong",
          "value": "#96464cff",
          "desc": "后台错误日志强调文字，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-info-border",
          "value": "#5f86a847",
          "desc": "后台信息提示描边，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-info-text",
          "value": "#4a6d8cff",
          "desc": "后台信息提示文字，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-warning-border",
          "value": "#b98a3c4d",
          "desc": "后台告警提示描边，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-warning-text",
          "value": "#8a6528ff",
          "desc": "后台告警提示文字，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-danger-border",
          "value": "#cf6d7252",
          "desc": "后台危险提示描边，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-chip-hover",
          "value": "#bf76652e",
          "desc": "后台标签 hover 底色，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-code-background",
          "value": "#fffcf7e6",
          "desc": "后台代码块底色，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-card-background",
          "value": "#fffdf9e6",
          "desc": "后台卡片浅表面，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-topbar-background",
          "value": "#fffcf7e0",
          "desc": "后台顶栏底色，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-role-pill-background",
          "value": "#ffffffdb",
          "desc": "后台角色标签底色，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-role-pill-hover-border",
          "value": "#e3a08b99",
          "desc": "后台角色标签 hover 描边，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-sidenav-background",
          "value": "#fffcf7b8",
          "desc": "后台侧栏底色，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-page-head-border",
          "value": "#eee2d6bf",
          "desc": "后台页面头部分隔线，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-card-background-muted",
          "value": "#fffdf9db",
          "desc": "后台次级卡片底色，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-secret-mask-background",
          "value": "#f7efe499",
          "desc": "后台密钥遮罩底色，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-hit-preview-background",
          "value": "#f7efe46b",
          "desc": "后台命中预览底色，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-connection-warning-border",
          "value": "#b98a3c57",
          "desc": "后台连接告警描边，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-connection-warning-text",
          "value": "#7d5c22ff",
          "desc": "后台连接告警文字，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-connection-danger-border",
          "value": "#cf6d7257",
          "desc": "后台连接异常描边，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-connection-danger-text",
          "value": "#96474bff",
          "desc": "后台连接异常文字，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-trace-chip-background",
          "value": "#f7efe4cc",
          "desc": "后台追踪标签底色，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-error-detail-background",
          "value": "#fdf6eeb8",
          "desc": "后台错误详情行底色，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-signed-box-background",
          "value": "#f7efe480",
          "desc": "后台签名信息块底色，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-admin-signed-url-background",
          "value": "#ffffffdb",
          "desc": "后台签名 URL 底色，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--color-print-border",
          "value": "#ccccccff",
          "desc": "打印态卡片边框，原型视图专用。",
          "nomikit": "",
          "dark": ""
        }
      ]
    },
    {
      "title": "阴影 · 原型视图专用",
      "tokens": [
        {
          "name": "--shadow-admin-brand-mark",
          "value": "0 6px 16px #e6a18d47",
          "desc": "后台品牌标记阴影，原型视图专用。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--shadow-admin-sidenav-open",
          "value": "18px 0 50px #704f3b33",
          "desc": "后台展开侧栏阴影，原型视图专用。",
          "nomikit": "",
          "dark": ""
        }
      ]
    },
    {
      "title": "阴影",
      "tokens": [
        {
          "name": "--shadow-low",
          "value": "0 10px 24px #704f3b12",
          "desc": "卡片与列表",
          "nomikit": "Shadows.low",
          "dark": "0 12px 32px #0000005c"
        },
        {
          "name": "--shadow-high",
          "value": "0 7px 17px #704f3b0f",
          "desc": "浮层与主窗口",
          "nomikit": "Shadows.high",
          "dark": "var(--shadow-low)"
        },
        {
          "name": "--shadow-primary-low",
          "value": "0 10px 20px #e6a18d38",
          "desc": "主按钮",
          "nomikit": "",
          "dark": "var(--shadow-low)"
        },
        {
          "name": "--shadow-primary-high",
          "value": "0 12px 26px #e6a18d5c",
          "desc": "主按钮 hover",
          "nomikit": "",
          "dark": "var(--shadow-low)"
        },
        {
          "name": "--shadow-card-hover",
          "value": "0 10px 24px #e6a18d1a",
          "desc": "统计卡 hover",
          "nomikit": "",
          "dark": "var(--shadow-low)"
        },
        {
          "name": "--shadow-inset-hair",
          "value": "0 0 0 4px #e3a08b21",
          "desc": "分段控件选中项",
          "nomikit": "",
          "dark": "var(--shadow-low)"
        },
        {
          "name": "--shadow-avatar-inset",
          "value": "0 12px 26px #704f3b21",
          "desc": "头像",
          "nomikit": "",
          "dark": "var(--shadow-low)"
        },
        {
          "name": "--shadow-knob",
          "value": "0 0 0 3px #65c59b26",
          "desc": "开关滑块",
          "nomikit": "",
          "dark": "var(--shadow-low)"
        },
        {
          "name": "--shadow-drawer",
          "value": "-20px 0 60px #704f3b29",
          "desc": "右侧抽屉，方向性阴影",
          "nomikit": "",
          "dark": "-20px 0 60px #00000080"
        }
      ]
    },
    {
      "title": "间距（九级）",
      "tokens": [
        {
          "name": "--spacing-tiny",
          "value": "2px",
          "desc": "极紧凑元素间隔",
          "nomikit": "Spacings.tiny",
          "dark": ""
        },
        {
          "name": "--spacing-extra-small",
          "value": "4px",
          "desc": "紧凑间隔",
          "nomikit": "Spacings.extraSmall",
          "dark": ""
        },
        {
          "name": "--spacing-small",
          "value": "8px",
          "desc": "控件内边距",
          "nomikit": "Spacings.small",
          "dark": ""
        },
        {
          "name": "--spacing-medium",
          "value": "12px",
          "desc": "列表项与卡片内容间隔",
          "nomikit": "Spacings.medium",
          "dark": ""
        },
        {
          "name": "--spacing-large",
          "value": "16px",
          "desc": "基础间距",
          "nomikit": "Spacings.large",
          "dark": ""
        },
        {
          "name": "--spacing-extra-large",
          "value": "20px",
          "desc": "区块分隔",
          "nomikit": "Spacings.extraLarge",
          "dark": ""
        },
        {
          "name": "--spacing-huge",
          "value": "24px",
          "desc": "面板内边距",
          "nomikit": "Spacings.huge",
          "dark": ""
        },
        {
          "name": "--spacing-massive",
          "value": "32px",
          "desc": "页面级留白",
          "nomikit": "Spacings.massive",
          "dark": ""
        },
        {
          "name": "--spacing-colossal",
          "value": "48px",
          "desc": "全屏布局与安全留白",
          "nomikit": "Spacings.colossal",
          "dark": ""
        }
      ]
    },
    {
      "title": "圆角（九级）",
      "tokens": [
        {
          "name": "--radius-tiny",
          "value": "2px",
          "desc": "",
          "nomikit": "Shapes.tiny",
          "dark": ""
        },
        {
          "name": "--radius-extra-small",
          "value": "4px",
          "desc": "",
          "nomikit": "Shapes.extraSmall",
          "dark": ""
        },
        {
          "name": "--radius-small",
          "value": "8px",
          "desc": "",
          "nomikit": "Shapes.small",
          "dark": ""
        },
        {
          "name": "--radius-medium",
          "value": "12px",
          "desc": "",
          "nomikit": "Shapes.medium",
          "dark": ""
        },
        {
          "name": "--radius-large",
          "value": "16px",
          "desc": "",
          "nomikit": "Shapes.large",
          "dark": ""
        },
        {
          "name": "--radius-extra-large",
          "value": "20px",
          "desc": "",
          "nomikit": "Shapes.extraLarge",
          "dark": ""
        },
        {
          "name": "--radius-huge",
          "value": "24px",
          "desc": "",
          "nomikit": "Shapes.huge",
          "dark": ""
        },
        {
          "name": "--radius-massive",
          "value": "32px",
          "desc": "",
          "nomikit": "Shapes.massive",
          "dark": ""
        },
        {
          "name": "--radius-colossal",
          "value": "48px",
          "desc": "",
          "nomikit": "Shapes.colossal",
          "dark": ""
        },
        {
          "name": "--radius-pill",
          "value": "999px",
          "desc": "胶囊：完全圆角，非九级刻度",
          "nomikit": "",
          "dark": ""
        }
      ]
    },
    {
      "title": "图标尺寸（九级）",
      "tokens": [
        {
          "name": "--size-icon-tiny",
          "value": "14px",
          "desc": "",
          "nomikit": "Sizes.icon.tiny",
          "dark": ""
        },
        {
          "name": "--size-icon-extra-small",
          "value": "16px",
          "desc": "",
          "nomikit": "Sizes.icon.extraSmall",
          "dark": ""
        },
        {
          "name": "--size-icon-small",
          "value": "18px",
          "desc": "",
          "nomikit": "Sizes.icon.small",
          "dark": ""
        },
        {
          "name": "--size-icon-medium",
          "value": "20px",
          "desc": "",
          "nomikit": "Sizes.icon.medium",
          "dark": ""
        },
        {
          "name": "--size-icon-large",
          "value": "24px",
          "desc": "",
          "nomikit": "Sizes.icon.large",
          "dark": ""
        },
        {
          "name": "--size-icon-extra-large",
          "value": "32px",
          "desc": "",
          "nomikit": "Sizes.icon.extraLarge",
          "dark": ""
        },
        {
          "name": "--size-icon-huge",
          "value": "40px",
          "desc": "",
          "nomikit": "Sizes.icon.huge",
          "dark": ""
        },
        {
          "name": "--size-icon-massive",
          "value": "48px",
          "desc": "",
          "nomikit": "Sizes.icon.massive",
          "dark": ""
        },
        {
          "name": "--size-icon-colossal",
          "value": "56px",
          "desc": "",
          "nomikit": "Sizes.icon.colossal",
          "dark": ""
        }
      ]
    },
    {
      "title": "头像尺寸（九级）",
      "tokens": [
        {
          "name": "--size-avatar-tiny",
          "value": "18px",
          "desc": "",
          "nomikit": "Sizes.avatar.tiny",
          "dark": ""
        },
        {
          "name": "--size-avatar-extra-small",
          "value": "24px",
          "desc": "",
          "nomikit": "Sizes.avatar.extraSmall",
          "dark": ""
        },
        {
          "name": "--size-avatar-small",
          "value": "32px",
          "desc": "",
          "nomikit": "Sizes.avatar.small",
          "dark": ""
        },
        {
          "name": "--size-avatar-medium",
          "value": "40px",
          "desc": "",
          "nomikit": "Sizes.avatar.medium",
          "dark": ""
        },
        {
          "name": "--size-avatar-large",
          "value": "48px",
          "desc": "",
          "nomikit": "Sizes.avatar.large",
          "dark": ""
        },
        {
          "name": "--size-avatar-extra-large",
          "value": "56px",
          "desc": "",
          "nomikit": "Sizes.avatar.extraLarge",
          "dark": ""
        },
        {
          "name": "--size-avatar-huge",
          "value": "64px",
          "desc": "",
          "nomikit": "Sizes.avatar.huge",
          "dark": ""
        },
        {
          "name": "--size-avatar-massive",
          "value": "72px",
          "desc": "",
          "nomikit": "Sizes.avatar.massive",
          "dark": ""
        },
        {
          "name": "--size-avatar-colossal",
          "value": "96px",
          "desc": "",
          "nomikit": "Sizes.avatar.colossal",
          "dark": ""
        }
      ]
    },
    {
      "title": "描边宽度",
      "tokens": [
        {
          "name": "--stroke-thin",
          "value": "1px",
          "desc": "",
          "nomikit": "Strokes.thin",
          "dark": ""
        },
        {
          "name": "--stroke-medium",
          "value": "2px",
          "desc": "",
          "nomikit": "Strokes.medium",
          "dark": ""
        },
        {
          "name": "--stroke-thick",
          "value": "3px",
          "desc": "",
          "nomikit": "Strokes.thick",
          "dark": ""
        }
      ]
    },
    {
      "title": "控件高度",
      "tokens": [
        {
          "name": "--height-appbar",
          "value": "56px",
          "desc": "顶栏",
          "nomikit": "Heights.appBar",
          "dark": ""
        },
        {
          "name": "--height-bottombar",
          "value": "56px",
          "desc": "底部导航",
          "nomikit": "Heights.bottomBar",
          "dark": ""
        },
        {
          "name": "--height-tab",
          "value": "48px",
          "desc": "标签与主按钮",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--height-chip",
          "value": "32px",
          "desc": "标签芯片",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--height-badge",
          "value": "18px",
          "desc": "计数徽标",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--height-badge-inline",
          "value": "16px",
          "desc": "贴在图标按钮上的小号徽标",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--height-row",
          "value": "40px",
          "desc": "表格行",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--height-control",
          "value": "44px",
          "desc": "输入控件最小可点高度",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--height-control-sm",
          "value": "42px",
          "desc": "通用标准操作按钮；触控热区另保底 44px。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--height-control-xs",
          "value": "30px",
          "desc": "后台小按钮",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--height-field",
          "value": "48px",
          "desc": "通用登录字段；不改变校验行为。",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--height-head",
          "value": "46px",
          "desc": "卡片头",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--height-mobile-nav",
          "value": "62px",
          "desc": "客户端移动端底部导航视觉高度",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--tap-target",
          "value": "44px",
          "desc": "触控热区下限",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--size-switch-knob",
          "value": "17px",
          "desc": "开关滑块",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--size-spinner",
          "value": "15px",
          "desc": "按钮内 loading 环",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--size-switch-width",
          "value": "40px",
          "desc": "开关轨道",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--size-switch-height",
          "value": "23px",
          "desc": "开关轨道高度",
          "nomikit": "",
          "dark": ""
        }
      ]
    },
    {
      "title": "排版（字号与行高）",
      "tokens": [
        {
          "name": "--font-caption",
          "value": "11px",
          "desc": "辅助说明",
          "nomikit": "Typography.caption",
          "dark": ""
        },
        {
          "name": "--font-badge",
          "value": "10px",
          "desc": "徽标数字，比 caption 再小一档的组件档",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--font-label-small",
          "value": "12px",
          "desc": "标签与次要元信息",
          "nomikit": "Typography.labelSmall",
          "dark": ""
        },
        {
          "name": "--font-body-small",
          "value": "13px",
          "desc": "后台正文",
          "nomikit": "Typography.bodySmall",
          "dark": ""
        },
        {
          "name": "--font-body-medium",
          "value": "14px",
          "desc": "正文与二级标题",
          "nomikit": "Typography.bodyMedium",
          "dark": ""
        },
        {
          "name": "--font-body-large",
          "value": "15px",
          "desc": "聊天正文",
          "nomikit": "Typography.bodyLarge",
          "dark": ""
        },
        {
          "name": "--font-title-medium",
          "value": "16px",
          "desc": "区块标题",
          "nomikit": "Typography.titleMedium",
          "dark": ""
        },
        {
          "name": "--font-title-large",
          "value": "17px",
          "desc": "页面标题",
          "nomikit": "Typography.titleLarge",
          "dark": ""
        },
        {
          "name": "--font-headline-large",
          "value": "20px",
          "desc": "大标题",
          "nomikit": "Typography.headlineLarge",
          "dark": ""
        },
        {
          "name": "--font-display-large",
          "value": "24px",
          "desc": "展示标题",
          "nomikit": "Typography.displayLarge",
          "dark": ""
        },
        {
          "name": "--font-stat-large",
          "value": "22px",
          "desc": "统计数字，介于 headline 与 display 之间的组件档",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--line-height-tight",
          "value": "1.35",
          "desc": "",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--line-height-normal",
          "value": "1.5",
          "desc": "",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--line-height-loose",
          "value": "1.65",
          "desc": "",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--weight-regular",
          "value": "400",
          "desc": "",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--weight-medium",
          "value": "600",
          "desc": "",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--weight-bold",
          "value": "700",
          "desc": "",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--weight-heavy",
          "value": "800",
          "desc": "",
          "nomikit": "",
          "dark": ""
        }
      ]
    },
    {
      "title": "安全区与视口",
      "tokens": [
        {
          "name": "--safe-inset-top",
          "value": "env(safe-area-inset-top, 0px)",
          "desc": "原始顶部安全区",
          "nomikit": "Insets.safeTop",
          "dark": ""
        },
        {
          "name": "--safe-inset-bottom",
          "value": "env(safe-area-inset-bottom, 0px)",
          "desc": "原始底部安全区",
          "nomikit": "Insets.safeBottom",
          "dark": ""
        },
        {
          "name": "--safe-top",
          "value": "max(12px, var(--safe-inset-top))",
          "desc": "统一后的顶部安全留白",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--safe-bottom",
          "value": "max(16px, var(--safe-inset-bottom))",
          "desc": "统一后的底部安全留白，两原型实测唯一漂移点",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--viewport-h",
          "value": "100dvh",
          "desc": "视口高度令牌；区域与全屏层会覆写，禁止用 100cqh 替代",
          "nomikit": "",
          "dark": ""
        }
      ]
    },
    {
      "title": "层级",
      "tokens": [
        {
          "name": "--z-index-nav",
          "value": "20",
          "desc": "",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--z-index-topbar",
          "value": "30",
          "desc": "",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--z-index-scrim",
          "value": "50",
          "desc": "",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--z-index-drawer",
          "value": "60",
          "desc": "",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--z-index-modal",
          "value": "70",
          "desc": "",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--z-index-popover",
          "value": "80",
          "desc": "",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--z-index-toast",
          "value": "90",
          "desc": "",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--z-index-region-head",
          "value": "10",
          "desc": "",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--z-index-suite-nav",
          "value": "100",
          "desc": "",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--z-index-canvas-hud",
          "value": "20",
          "desc": "",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--z-index-tree-scrim",
          "value": "39",
          "desc": "",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--z-index-tree-drawer",
          "value": "40",
          "desc": "",
          "nomikit": "",
          "dark": ""
        }
      ]
    },
    {
      "title": "时长与曲线",
      "tokens": [
        {
          "name": "--duration-fast",
          "value": "160ms",
          "desc": "",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--duration-base",
          "value": "240ms",
          "desc": "",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--duration-slow",
          "value": "420ms",
          "desc": "",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--easing-standard",
          "value": "cubic-bezier(0.22, 0.8, 0.3, 1)",
          "desc": "",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--easing-exit",
          "value": "cubic-bezier(0.4, 0, 1, 1)",
          "desc": "",
          "nomikit": "",
          "dark": ""
        }
      ]
    },
    {
      "title": "布局常量",
      "tokens": [
        {
          "name": "--size-nav-width",
          "value": "248px",
          "desc": "后台侧栏展开宽度",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--size-nav-rail-width",
          "value": "64px",
          "desc": "后台侧栏图标轨宽度",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--size-doc-max",
          "value": "1180px",
          "desc": "规范区正文最大行宽",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--size-region-max",
          "value": "1600px",
          "desc": "原型区最大宽度",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--size-demo-tile",
          "value": "320px",
          "desc": "默认档：单排芯片、按钮、图标这类",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--size-demo-tile-wide",
          "value": "464px",
          "desc": "宽档：双列字段、卡中卡、侧栏导航",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--size-demo-board",
          "value": "1420px",
          "desc": "",
          "nomikit": "",
          "dark": ""
        }
      ]
    },
    {
      "title": "浮层尺寸（弹层宽度不跟九级刻度，按内容实测宽度定档）",
      "tokens": [
        {
          "name": "--size-login-card-width",
          "value": "424px",
          "desc": "登录卡：客户端 430 / 后台 424 合档",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--size-modal-width",
          "value": "520px",
          "desc": "表单模态",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--size-modal-width-lg",
          "value": "780px",
          "desc": "宽模态：详情与对比类表单",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--size-modal-width-sm",
          "value": "424px",
          "desc": "窄模态：单步确认",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--size-drawer-width",
          "value": "560px",
          "desc": "右侧抽屉",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--size-drawer-width-lg",
          "value": "780px",
          "desc": "宽抽屉",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--size-popover-min-width",
          "value": "216px",
          "desc": "气泡菜单下限",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--size-popover-max-width",
          "value": "330px",
          "desc": "气泡菜单上限",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--size-toast-max-width",
          "value": "470px",
          "desc": "toast 宽度上限，后台档；客户端在区域里收窄",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--size-toast-max-width-sm",
          "value": "360px",
          "desc": "toast 宽度上限的紧凑档（移动端与客户端）",
          "nomikit": "",
          "dark": ""
        }
      ]
    },
    {
      "title": "区域旋钮（同一组件在两区的落位差异，只允许改这些值， 不得在 views 里复制整条规则）。默认值 = 后台形态。",
      "tokens": [
        {
          "name": "--overlay-inset-top",
          "value": "0px",
          "desc": "弹层、抽屉与 toast 距容器顶的额外偏移；后台覆写为顶栏高",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--overlay-place-items",
          "value": "start center",
          "desc": "模态对齐：后台顶部起排可滚动，客户端覆写为居中",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--toast-inset-start",
          "value": "calc(var(--overlay-inset-top) + var(--spacing-medium))",
          "desc": "toast 上沿（后台档）",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--toast-inset-end",
          "value": "auto",
          "desc": "与 --toast-inset-start 二选一，客户端换用这一头",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--toast-shift",
          "value": "calc(-1 * var(--spacing-medium))",
          "desc": "未显时的滑入方向，客户端取正值从下往上",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--toast-max-width",
          "value": "min(92cqi, var(--size-toast-max-width))",
          "desc": "",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--field-height",
          "value": "var(--height-field)",
          "desc": "输入控件高度：客户端登录表单覆写为 48px 档",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--login-card-align",
          "value": "left",
          "desc": "登录卡文字基准：客户端是居中的头像式卡片，后台是左对齐表单",
          "nomikit": "",
          "dark": ""
        }
      ]
    }
  ]
};
