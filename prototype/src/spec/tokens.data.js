/* 生成物 · 请勿手改
   由 tools/tokens-report.mjs 解析 src/base/tokens.css 与 src/base/tokens.compat.css 生成
   source-sha256: f7293d925ab7e1d607f2ed4fe295b10d364fce97314b2290b8af5b8c29a87f51
*/
window.AyaneTokens = {
  "total": 230,
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
          "value": "#e3a08b",
          "desc": "主色：暖橙粉",
          "nomikit": "AppColorScheme.primary",
          "dark": "#e8a992"
        },
        {
          "name": "--color-on-primary",
          "value": "#ffffff",
          "desc": "主色上的文字",
          "nomikit": "AppColorScheme.onPrimary",
          "dark": "#3a2318"
        },
        {
          "name": "--color-primary-strong",
          "value": "#bf7665",
          "desc": "主色强调：按下与链接 的深色端",
          "nomikit": "AppColorScheme.primaryContainer",
          "dark": "#f0bda7"
        },
        {
          "name": "--color-primary-soft",
          "value": "#fff0e9",
          "desc": "主色浅底：选中态背景",
          "nomikit": "AppColorScheme.primaryContainer",
          "dark": "#43302a"
        },
        {
          "name": "--color-primary-container",
          "value": "#e6a18d",
          "desc": "主色容器：渐变与装饰端",
          "nomikit": "AppColorScheme.secondaryContainer",
          "dark": "#6b4a3d"
        },
        {
          "name": "--color-on-primary-container",
          "value": "#4a4038",
          "desc": "主色容器上的文字",
          "nomikit": "",
          "dark": "#f6e6dc"
        }
      ]
    },
    {
      "title": "颜色 · 中性面",
      "tokens": [
        {
          "name": "--color-bg",
          "value": "#fbf7ef",
          "desc": "页面底色",
          "nomikit": "AppColorScheme.background",
          "dark": "#1d1714"
        },
        {
          "name": "--color-bg-deep",
          "value": "#f3e9df",
          "desc": "页面底色深端：渐变收尾",
          "nomikit": "AppColorScheme.backgroundVariant",
          "dark": "#241d19"
        },
        {
          "name": "--color-surface",
          "value": "rgba(255, 255, 255, 0.88)",
          "desc": "面板：半透明白",
          "nomikit": "AppColorScheme.surface",
          "dark": "rgba(43, 35, 30, 0.9)"
        },
        {
          "name": "--color-surface-strong",
          "value": "#ffffff",
          "desc": "面板：纯白最高层",
          "nomikit": "AppColorScheme.surfaceLower",
          "dark": "#2e2621"
        },
        {
          "name": "--color-surface-soft",
          "value": "#fff9f2",
          "desc": "面板：暖白浅层",
          "nomikit": "AppColorScheme.surfaceLow",
          "dark": "#26201c"
        },
        {
          "name": "--color-surface-solid",
          "value": "#fffcf8",
          "desc": "面板：不透明，sticky 头与弹层底栏用",
          "nomikit": "AppColorScheme.surface",
          "dark": "#2a231f"
        },
        {
          "name": "--color-surface-high",
          "value": "#f7efe6",
          "desc": "面板：抬高层，hover 底色",
          "nomikit": "AppColorScheme.surfaceHigh",
          "dark": "#382f29"
        }
      ]
    },
    {
      "title": "颜色 · 文字",
      "tokens": [
        {
          "name": "--color-on-surface",
          "value": "#4a4038",
          "desc": "正文",
          "nomikit": "AppColorScheme.onSurface",
          "dark": "#ece0d6"
        },
        {
          "name": "--color-on-surface-soft",
          "value": "#74675d",
          "desc": "次级文字",
          "nomikit": "AppColorScheme.onSurfaceVariant",
          "dark": "#c3b3a7"
        },
        {
          "name": "--color-text-hint",
          "value": "#a29488",
          "desc": "占位与提示 的浅端",
          "nomikit": "AppColorScheme.onSurfaceVariant",
          "dark": "#93837a"
        },
        {
          "name": "--color-text-placeholder",
          "value": "#b7a79b",
          "desc": "输入框占位符",
          "nomikit": "",
          "dark": "#82726a"
        },
        {
          "name": "--color-on-dark",
          "value": "#ffffff",
          "desc": "深色浮层上的文字",
          "nomikit": "AppColorScheme.inverseOnSurface",
          "dark": "#241d19"
        }
      ]
    },
    {
      "title": "颜色 · 描边与分隔",
      "tokens": [
        {
          "name": "--color-outline",
          "value": "#eee2d6",
          "desc": "常规描边",
          "nomikit": "AppColorScheme.outlineVariant",
          "dark": "#3d332c"
        },
        {
          "name": "--color-outline-strong",
          "value": "#decfc2",
          "desc": "强调描边与分隔线",
          "nomikit": "AppColorScheme.outline",
          "dark": "#54473d"
        }
      ]
    },
    {
      "title": "颜色 · 语义",
      "tokens": [
        {
          "name": "--color-success",
          "value": "#5f9e77",
          "desc": "成功",
          "nomikit": "AppColorScheme.tertiary",
          "dark": "#79bb92"
        },
        {
          "name": "--color-success-soft",
          "value": "#e6f2e9",
          "desc": "成功浅底",
          "nomikit": "",
          "dark": "#2c3d33"
        },
        {
          "name": "--color-warning",
          "value": "#b98a3c",
          "desc": "告警 的暖色替代",
          "nomikit": "AppColorScheme.error",
          "dark": "#dcb268"
        },
        {
          "name": "--color-warning-soft",
          "value": "#fff4dd",
          "desc": "告警浅底",
          "nomikit": "",
          "dark": "#40351f"
        },
        {
          "name": "--color-info",
          "value": "#5f86a8",
          "desc": "信息",
          "nomikit": "AppColorScheme.secondary",
          "dark": "#86aed2"
        },
        {
          "name": "--color-info-soft",
          "value": "#e8f0f7",
          "desc": "信息浅底",
          "nomikit": "",
          "dark": "#293844"
        },
        {
          "name": "--color-error",
          "value": "#cf6d72",
          "desc": "危险",
          "nomikit": "AppColorScheme.error",
          "dark": "#e38b90"
        },
        {
          "name": "--color-error-soft",
          "value": "#fdeced",
          "desc": "危险浅底",
          "nomikit": "",
          "dark": "#442a2c"
        },
        {
          "name": "--color-neutral-soft",
          "value": "#f0eae2",
          "desc": "中性状态浅底：已归档与暂缓",
          "nomikit": "",
          "dark": "#38302a"
        },
        {
          "name": "--color-accent-mint",
          "value": "#dceee0",
          "desc": "装饰：薄荷气泡",
          "nomikit": "",
          "dark": "#2f4438"
        },
        {
          "name": "--color-accent-yellow",
          "value": "#fff2cf",
          "desc": "装饰：奶黄气泡",
          "nomikit": "",
          "dark": "#463a22"
        }
      ]
    },
    {
      "title": "颜色 · 特殊表面",
      "tokens": [
        {
          "name": "--color-table-head",
          "value": "#fdf6ee",
          "desc": "表头底色，必须不透明",
          "nomikit": "AppColorScheme.surfaceContainer",
          "dark": "#332a24"
        },
        {
          "name": "--color-row-hover",
          "value": "rgba(230, 161, 141, 0.07)",
          "desc": "行 hover 底色",
          "nomikit": "",
          "dark": "rgba(232, 169, 146, 0.08)"
        },
        {
          "name": "--color-scrim",
          "value": "rgba(74, 64, 56, 0.32)",
          "desc": "遮罩",
          "nomikit": "AppColorScheme.scrim",
          "dark": "rgba(8, 5, 4, 0.58)"
        },
        {
          "name": "--color-scrim-soft",
          "value": "rgba(74, 64, 56, 0.21)",
          "desc": "模态遮罩：比抽屉遮罩浅一档，两原型实测 0.20/0.22 合档",
          "nomikit": "",
          "dark": "rgba(8, 5, 4, 0.5)"
        },
        {
          "name": "--color-toast-bg",
          "value": "rgba(74, 64, 56, 0.94)",
          "desc": "toast 深底",
          "nomikit": "AppColorScheme.inverseSurface",
          "dark": "rgba(240, 228, 217, 0.96)"
        },
        {
          "name": "--color-focus-ring",
          "value": "rgba(227, 160, 139, 0.3)",
          "desc": "focus-visible 描边",
          "nomikit": "",
          "dark": "rgba(232, 169, 146, 0.34)"
        },
        {
          "name": "--color-focus-ring-soft",
          "value": "rgba(230, 161, 141, 0.2)",
          "desc": "输入控件聚焦环，比通用环浅一档",
          "nomikit": "",
          "dark": "rgba(232, 169, 146, 0.22)"
        }
      ]
    },
    {
      "title": "颜色 · 组件专用（从组件样式里收上来的字面色，组件层不得再写死）",
      "tokens": [
        {
          "name": "--color-surface-hairline",
          "value": "rgba(255, 255, 255, 0.92)",
          "desc": "半透明面板上的 1px 描边",
          "nomikit": "",
          "dark": "rgba(236, 224, 214, 0.14)"
        },
        {
          "name": "--color-surface-hairline-strong",
          "value": "rgba(255, 255, 255, 0.96)",
          "desc": "弹层描边",
          "nomikit": "",
          "dark": "rgba(236, 224, 214, 0.2)"
        },
        {
          "name": "--color-surface-inset",
          "value": "rgba(255, 255, 255, 0.74)",
          "desc": "内嵌芯片与浅轨道底色",
          "nomikit": "",
          "dark": "rgba(255, 255, 255, 0.06)"
        },
        {
          "name": "--color-outline-hover",
          "value": "rgba(227, 160, 139, 0.55)",
          "desc": "控件 hover 描边",
          "nomikit": "",
          "dark": "rgba(232, 169, 146, 0.55)"
        },
        {
          "name": "--color-outline-error",
          "value": "rgba(207, 109, 114, 0.4)",
          "desc": "危险控件描边",
          "nomikit": "",
          "dark": "rgba(227, 139, 144, 0.45)"
        },
        {
          "name": "--color-outline-error-soft",
          "value": "rgba(207, 109, 114, 0.35)",
          "desc": "告警卡片描边",
          "nomikit": "",
          "dark": "rgba(227, 139, 144, 0.38)"
        },
        {
          "name": "--color-outline-hover-soft",
          "value": "rgba(227, 160, 139, 0.45)",
          "desc": "卡片 hover 描边",
          "nomikit": "",
          "dark": "rgba(232, 169, 146, 0.42)"
        },
        {
          "name": "--color-error-wash",
          "value": "#fff6f6",
          "desc": "告警卡片渐变亮端",
          "nomikit": "",
          "dark": "#3a2628"
        },
        {
          "name": "--color-outline-error-strong",
          "value": "rgba(207, 109, 114, 0.7)",
          "desc": "危险控件 hover 描边",
          "nomikit": "",
          "dark": "rgba(227, 139, 144, 0.72)"
        },
        {
          "name": "--color-outline-error-hair",
          "value": "rgba(207, 109, 114, 0.26)",
          "desc": "危险弹层头部分隔线",
          "nomikit": "",
          "dark": "rgba(227, 139, 144, 0.28)"
        },
        {
          "name": "--color-primary-light",
          "value": "#efa791",
          "desc": "主色渐变亮端",
          "nomikit": "",
          "dark": "#f0bda7"
        },
        {
          "name": "--color-primary-hover-a",
          "value": "#dd8f77",
          "desc": "主色按钮 hover 渐变起",
          "nomikit": "",
          "dark": "#efb39a"
        },
        {
          "name": "--color-primary-hover-b",
          "value": "#e79c85",
          "desc": "主色按钮 hover 渐变止",
          "nomikit": "",
          "dark": "#f6c6b1"
        },
        {
          "name": "--color-primary-deep",
          "value": "rgba(191, 118, 101, 0.3)",
          "desc": "主色按钮 loading 环",
          "nomikit": "",
          "dark": "rgba(240, 189, 167, 0.32)"
        },
        {
          "name": "--color-error-strong",
          "value": "#a4484e",
          "desc": "危险按钮文字",
          "nomikit": "",
          "dark": "#f0a9ad"
        },
        {
          "name": "--color-error-strong-deep",
          "value": "#8f3b41",
          "desc": "危险按钮 hover 文字",
          "nomikit": "",
          "dark": "#f6c1c4"
        },
        {
          "name": "--color-error-softer",
          "value": "#fbdfe1",
          "desc": "危险按钮 hover 底色",
          "nomikit": "",
          "dark": "#5b3237"
        },
        {
          "name": "--color-warning-light-a",
          "value": "#d8ab5c",
          "desc": "告警进度条渐变起",
          "nomikit": "",
          "dark": "#e0b877"
        },
        {
          "name": "--color-warning-light-b",
          "value": "#e6c079",
          "desc": "告警进度条渐变止",
          "nomikit": "",
          "dark": "#eccc8f"
        },
        {
          "name": "--color-error-light-a",
          "value": "#cf6d72",
          "desc": "危险进度条渐变起",
          "nomikit": "",
          "dark": "#e38b90"
        },
        {
          "name": "--color-error-light-b",
          "value": "#e08b8f",
          "desc": "危险进度条渐变止",
          "nomikit": "",
          "dark": "#eda3a7"
        },
        {
          "name": "--color-tab-track",
          "value": "rgba(247, 239, 228, 0.85)",
          "desc": "分段控件轨道",
          "nomikit": "",
          "dark": "rgba(56, 47, 41, 0.9)"
        },
        {
          "name": "--color-tab-count",
          "value": "rgba(222, 207, 194, 0.6)",
          "desc": "分段计数徽标底",
          "nomikit": "",
          "dark": "rgba(84, 71, 61, 0.6)"
        },
        {
          "name": "--color-skeleton-base",
          "value": "rgba(238, 226, 214, 0.55)",
          "desc": "骨架屏暗端",
          "nomikit": "",
          "dark": "rgba(61, 51, 44, 0.7)"
        },
        {
          "name": "--color-skeleton-shine",
          "value": "rgba(248, 240, 232, 0.85)",
          "desc": "骨架屏亮端",
          "nomikit": "",
          "dark": "rgba(86, 72, 62, 0.85)"
        },
        {
          "name": "--color-on-dark-hairline",
          "value": "rgba(255, 255, 255, 0.5)",
          "desc": "深色浮层上的描边与 loading 环",
          "nomikit": "",
          "dark": "rgba(36, 29, 25, 0.32)"
        },
        {
          "name": "--color-primary-wash",
          "value": "#ffe7d8",
          "desc": "头像与图标底渐变亮端",
          "nomikit": "",
          "dark": "#4a332b"
        },
        {
          "name": "--color-avatar-wash-a",
          "value": "#ffe3d6",
          "desc": "头像渐变起",
          "nomikit": "",
          "dark": "#4d362d"
        },
        {
          "name": "--color-avatar-wash-b",
          "value": "#e6f0e5",
          "desc": "头像渐变止",
          "nomikit": "",
          "dark": "#33443a"
        },
        {
          "name": "--color-nav-active-a",
          "value": "rgba(227, 160, 139, 0.22)",
          "desc": "导航选中渐变起",
          "nomikit": "",
          "dark": "rgba(232, 169, 146, 0.2)"
        },
        {
          "name": "--color-nav-active-b",
          "value": "rgba(240, 171, 148, 0.1)",
          "desc": "导航选中渐变止",
          "nomikit": "",
          "dark": "rgba(240, 189, 167, 0.08)"
        },
        {
          "name": "--color-nav-active-ring",
          "value": "rgba(227, 160, 139, 0.36)",
          "desc": "导航选中描边",
          "nomikit": "",
          "dark": "rgba(232, 169, 146, 0.36)"
        },
        {
          "name": "--color-neutral-wash",
          "value": "rgba(240, 234, 226, 0.72)",
          "desc": "禁用项 hover 底",
          "nomikit": "",
          "dark": "rgba(56, 47, 41, 0.72)"
        },
        {
          "name": "--color-status-live",
          "value": "rgba(95, 158, 119, 0.4)",
          "desc": "实时状态点脉冲",
          "nomikit": "",
          "dark": "rgba(121, 187, 146, 0.45)"
        },
        {
          "name": "--color-row-flash",
          "value": "rgba(230, 161, 141, 0.3)",
          "desc": "新行高亮起始底色",
          "nomikit": "",
          "dark": "rgba(232, 169, 146, 0.22)"
        },
        {
          "name": "--color-outline-strong-wash",
          "value": "rgba(222, 207, 194, 0.75)",
          "desc": "开关关闭态轨道",
          "nomikit": "",
          "dark": "rgba(84, 71, 61, 0.8)"
        },
        {
          "name": "--color-track",
          "value": "rgba(222, 207, 194, 0.5)",
          "desc": "进度条轨道",
          "nomikit": "",
          "dark": "rgba(84, 71, 61, 0.6)"
        },
        {
          "name": "--color-focus-ring-error",
          "value": "rgba(207, 109, 114, 0.14)",
          "desc": "错误控件聚焦环",
          "nomikit": "",
          "dark": "rgba(227, 139, 144, 0.18)"
        },
        {
          "name": "--color-toast-error-bg",
          "value": "rgba(176, 76, 82, 0.96)",
          "desc": "错误 toast 底",
          "nomikit": "",
          "dark": "rgba(214, 124, 130, 0.96)"
        },
        {
          "name": "--color-login-card-bg",
          "value": "rgba(255, 252, 247, 0.93)",
          "desc": "登录卡底：两原型 0.94/0.90 合档",
          "nomikit": "",
          "dark": "rgba(46, 38, 33, 0.92)"
        }
      ]
    },
    {
      "title": "阴影",
      "tokens": [
        {
          "name": "--shadow-low",
          "value": "0 12px 32px rgba(112, 79, 59, 0.09)",
          "desc": "卡片与列表",
          "nomikit": "Shadows.low",
          "dark": "0 12px 32px rgba(0, 0, 0, 0.36)"
        },
        {
          "name": "--shadow-high",
          "value": "0 28px 80px rgba(112, 79, 59, 0.14)",
          "desc": "浮层与主窗口",
          "nomikit": "Shadows.high",
          "dark": "0 28px 80px rgba(0, 0, 0, 0.5)"
        },
        {
          "name": "--shadow-primary-low",
          "value": "0 8px 18px rgba(230, 161, 141, 0.22)",
          "desc": "主按钮",
          "nomikit": "",
          "dark": "0 8px 18px rgba(0, 0, 0, 0.4)"
        },
        {
          "name": "--shadow-primary-high",
          "value": "0 10px 22px rgba(230, 161, 141, 0.3)",
          "desc": "主按钮 hover",
          "nomikit": "",
          "dark": "0 10px 22px rgba(0, 0, 0, 0.46)"
        },
        {
          "name": "--shadow-card-hover",
          "value": "0 14px 30px rgba(112, 79, 59, 0.11)",
          "desc": "统计卡 hover",
          "nomikit": "",
          "dark": "0 14px 30px rgba(0, 0, 0, 0.4)"
        },
        {
          "name": "--shadow-inset-hair",
          "value": "0 4px 12px rgba(112, 79, 59, 0.08)",
          "desc": "分段控件选中项",
          "nomikit": "",
          "dark": "0 4px 12px rgba(0, 0, 0, 0.35)"
        },
        {
          "name": "--shadow-avatar-inset",
          "value": "inset 0 0 0 1px rgba(255, 255, 255, 0.78), 0 6px 15px rgba(112, 79, 59, 0.12)",
          "desc": "头像",
          "nomikit": "",
          "dark": "inset 0 0 0 1px rgba(236, 224, 214, 0.14), 0 6px 15px rgba(0, 0, 0, 0.4)"
        },
        {
          "name": "--shadow-knob",
          "value": "0 2px 5px rgba(112, 79, 59, 0.22)",
          "desc": "开关滑块",
          "nomikit": "",
          "dark": "0 2px 5px rgba(0, 0, 0, 0.5)"
        },
        {
          "name": "--shadow-drawer",
          "value": "-20px 0 60px rgba(112, 79, 59, 0.16)",
          "desc": "右侧抽屉，方向性阴影",
          "nomikit": "",
          "dark": "-20px 0 60px rgba(0, 0, 0, 0.5)"
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
      "title": "间距 · 组件档（控件横向内边距不与九级重合，保留实测值）",
      "tokens": [
        {
          "name": "--spacing-control-x",
          "value": "14px",
          "desc": "按钮与输入控件的标准横向内边距",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--spacing-control-x-sm",
          "value": "10px",
          "desc": "小按钮与输入控件的紧凑横向内边距",
          "nomikit": "",
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
      "title": "圆角 · 组件档（与九级刻度并列，不为凑刻度改掉已验证视觉）",
      "tokens": [
        {
          "name": "--radius-app-window",
          "value": "28px",
          "desc": "客户端主窗口",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--radius-panel",
          "value": "20px",
          "desc": "面板与抽屉，等于 --radius-extra-large",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--radius-control",
          "value": "14px",
          "desc": "输入控件",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--radius-card",
          "value": "16px",
          "desc": "后台卡片，等于 --radius-large",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--radius-field",
          "value": "12px",
          "desc": "后台表单控件，等于 --radius-medium",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--radius-control-sm",
          "value": "10px",
          "desc": "图标按钮、小按钮与分页键",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--radius-tab",
          "value": "12px",
          "desc": "分段控件轨道，等于 --radius-medium",
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
      "title": "头像 · 组件档（客户端档位，与九级无整数倍关系）",
      "tokens": [
        {
          "name": "--size-avatar-xs",
          "value": "34px",
          "desc": "客户端 --avatar-xs",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--size-avatar-sm",
          "value": "44px",
          "desc": "客户端 --avatar-sm",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--size-avatar-default",
          "value": "42px",
          "desc": "客户端头像基准",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--size-avatar-lg",
          "value": "118px",
          "desc": "客户端 --avatar-lg",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--size-avatar-xl",
          "value": "166px",
          "desc": "客户端 --avatar-xl",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--radius-avatar-xs",
          "value": "11px",
          "desc": "与 --size-avatar-xs 成比例的圆角档",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--radius-avatar-sm",
          "value": "15px",
          "desc": "与 --size-avatar-default/-sm 成比例的圆角档",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--radius-avatar-lg",
          "value": "38px",
          "desc": "",
          "nomikit": "",
          "dark": ""
        },
        {
          "name": "--radius-avatar-xl",
          "value": "52px",
          "desc": "",
          "nomikit": "",
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
          "value": "36px",
          "desc": "后台标准按钮",
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
          "value": "38px",
          "desc": "后台输入框",
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
          "value": "calc(-1 * var(--spacing-control-x))",
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
  ],
  "compat": [
    {
      "name": "--bg",
      "alias": "var(--color-bg)",
      "region": ""
    },
    {
      "name": "--bg-deep",
      "alias": "var(--color-bg-deep)",
      "region": ""
    },
    {
      "name": "--surface",
      "alias": "var(--color-surface)",
      "region": ""
    },
    {
      "name": "--surface-strong",
      "alias": "var(--color-surface-strong)",
      "region": ""
    },
    {
      "name": "--surface-soft",
      "alias": "var(--color-surface-soft)",
      "region": ""
    },
    {
      "name": "--surface-solid",
      "alias": "var(--color-surface-solid)",
      "region": ""
    },
    {
      "name": "--ink",
      "alias": "var(--color-on-surface)",
      "region": ""
    },
    {
      "name": "--ink-soft",
      "alias": "var(--color-on-surface-soft)",
      "region": ""
    },
    {
      "name": "--muted",
      "alias": "var(--color-text-hint)",
      "region": ""
    },
    {
      "name": "--line",
      "alias": "var(--color-outline)",
      "region": ""
    },
    {
      "name": "--line-strong",
      "alias": "var(--color-outline-strong)",
      "region": ""
    },
    {
      "name": "--primary",
      "alias": "var(--color-primary)",
      "region": ""
    },
    {
      "name": "--primary-dark",
      "alias": "var(--color-primary-strong)",
      "region": ""
    },
    {
      "name": "--primary-soft",
      "alias": "var(--color-primary-soft)",
      "region": ""
    },
    {
      "name": "--pink",
      "alias": "var(--color-primary-container)",
      "region": ""
    },
    {
      "name": "--pink-soft",
      "alias": "var(--color-primary-soft)",
      "region": ""
    },
    {
      "name": "--mint",
      "alias": "var(--color-accent-mint)",
      "region": ""
    },
    {
      "name": "--yellow",
      "alias": "var(--color-accent-yellow)",
      "region": ""
    },
    {
      "name": "--danger",
      "alias": "var(--color-error)",
      "region": ""
    },
    {
      "name": "--danger-soft",
      "alias": "var(--color-error-soft)",
      "region": ""
    },
    {
      "name": "--ok",
      "alias": "var(--color-success)",
      "region": ""
    },
    {
      "name": "--ok-soft",
      "alias": "var(--color-success-soft)",
      "region": ""
    },
    {
      "name": "--warn",
      "alias": "var(--color-warning)",
      "region": ""
    },
    {
      "name": "--warn-soft",
      "alias": "var(--color-warning-soft)",
      "region": ""
    },
    {
      "name": "--info",
      "alias": "var(--color-info)",
      "region": ""
    },
    {
      "name": "--info-soft",
      "alias": "var(--color-info-soft)",
      "region": ""
    },
    {
      "name": "--defer-soft",
      "alias": "var(--color-neutral-soft)",
      "region": ""
    },
    {
      "name": "--table-head-bg",
      "alias": "var(--color-table-head)",
      "region": ""
    },
    {
      "name": "--row-hover",
      "alias": "var(--color-row-hover)",
      "region": ""
    },
    {
      "name": "--shadow",
      "alias": "var(--shadow-high)",
      "region": ""
    },
    {
      "name": "--soft-shadow",
      "alias": "var(--shadow-low)",
      "region": ""
    },
    {
      "name": "--radius-xl",
      "alias": "var(--radius-app-window)",
      "region": ""
    },
    {
      "name": "--radius-lg",
      "alias": "var(--radius-panel)",
      "region": ""
    },
    {
      "name": "--radius-md",
      "alias": "var(--radius-control)",
      "region": ""
    },
    {
      "name": "--radius-ctl",
      "alias": "var(--radius-field)",
      "region": ""
    },
    {
      "name": "--topbar-h",
      "alias": "var(--height-appbar)",
      "region": ""
    },
    {
      "name": "--row-h",
      "alias": "var(--height-row)",
      "region": ""
    },
    {
      "name": "--nav-w",
      "alias": "var(--size-nav-width)",
      "region": ""
    },
    {
      "name": "--nav-w-rail",
      "alias": "var(--size-nav-rail-width)",
      "region": ""
    },
    {
      "name": "--gap",
      "alias": "var(--spacing-medium)",
      "region": ""
    },
    {
      "name": "--mobile-nav-space",
      "alias": "calc(var(--height-mobile-nav) + var(--safe-bottom))",
      "region": ""
    },
    {
      "name": "--mono",
      "alias": "var(--font-family-mono)",
      "region": ""
    },
    {
      "name": "--fs-h1",
      "alias": "var(--font-title-large)",
      "region": ""
    },
    {
      "name": "--fs-h2",
      "alias": "var(--font-body-medium)",
      "region": ""
    },
    {
      "name": "--fs-body",
      "alias": "var(--font-body-small)",
      "region": ""
    },
    {
      "name": "--fs-sm",
      "alias": "var(--font-label-small)",
      "region": ""
    },
    {
      "name": "--fs-xs",
      "alias": "var(--font-caption)",
      "region": ""
    },
    {
      "name": "--z-nav",
      "alias": "var(--z-index-nav)",
      "region": ""
    },
    {
      "name": "--z-topbar",
      "alias": "var(--z-index-topbar)",
      "region": ""
    },
    {
      "name": "--z-scrim",
      "alias": "var(--z-index-scrim)",
      "region": ""
    },
    {
      "name": "--z-drawer",
      "alias": "var(--z-index-drawer)",
      "region": ""
    },
    {
      "name": "--z-modal",
      "alias": "var(--z-index-modal)",
      "region": ""
    },
    {
      "name": "--z-toast",
      "alias": "var(--z-index-toast)",
      "region": ""
    },
    {
      "name": "--safe-top",
      "alias": "var(--safe-inset-top)",
      "region": "client"
    },
    {
      "name": "--safe-bottom",
      "alias": "max(var(--spacing-large), var(--safe-inset-bottom))",
      "region": "client"
    },
    {
      "name": "--safe-top",
      "alias": "var(--safe-inset-top)",
      "region": "admin"
    },
    {
      "name": "--safe-bottom",
      "alias": "var(--safe-inset-bottom)",
      "region": "admin"
    }
  ]
};
