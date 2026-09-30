# prototype 目录约定

本文件只约束 `prototype/` 及其子目录，不覆盖仓库根的 `.agents/rules/AGENTS.md`。与用户当次明确要求冲突时，以用户要求为准。

## 1. 定位
本目录是设计产物，不是生产代码。目标是「看得出效果、点得动流程」：允许硬编码演示数据，不允许出现请求层、状态管理或应用构建配置。演示数据必须像真的，同一屏内的时间与数字要自洽，禁止 lorem ipsum、占位文字和装饰性假统计。

## 2. 唯一入口与页面模型
面向人阅读的 HTML 只有 `src/design-system.html` 一个（构建产物是 `dist/绫音设计规范与交互原型.html`）。它不是长文档，而是一个工作台：**左侧菜单切换「设计令牌 / 组件库 / 客户端原型 / 管理后台原型」四个页面，同一栏下方用层级树导航当前页的子结构，右侧是可平移可缩放的画布**。四个分区仍各自保留 `#sec-*` id 与 `.canvas-page` 类，非当前页用 `hidden` 收起。

- `src/base/`：`tokens.css`（唯一取值源）、`tokens.compat.css`（`@deprecated` 别名）、`base.css`（重置与工具类）、`util.js`（共享运行时）、`icons.svg.html`（图标精灵唯一源）。
- `src/components/`：九份组件源，两份原型共用 —— `icon button field avatar tag card table nav overlay`。
- `src/region.css`：画布、容器查询容器与全屏层；`--viewport-h` 的区域与全屏档在这里。
- `src/views/`：`client.*` / `admin.*`（`markup.html` + `css` + `script.js`），只放该区域的增量；`*.root-tokens.json` 是当前无人引用的快照残留（`src/` 与 `tools/` 里都搜不到引用），清理或接回前不要当数据源用。
- `src/spec/`：规范区样式、`suite.js`（令牌表 / 旋钮表 / 全屏 / 示例委托）、`shell.css` + `shell.js`（外壳：左侧菜单、层级树、画布平移缩放）、`demos/*.html`（组件示例片段）、`tokens.data.js`（生成物）。
- 组件库页是**一张固定宽（`--size-demo-board` 1420）的大卡片 `.demo-board`**，卡片外观复用 `.card` 的同一套令牌；卡内先分 4 类（`.demo-cat`，标题 `h3` + `.demo-cat-note` 副标题），类内一行一组件：
  `.demo-card` = `.demo-meta`（`.demo-no` 编号 + `h4` 组件名 + `.spec-note`）+ `.demo-vars`（变体画布横向铺开、放不下才换行）。
  固定宽是「横向不塌」的前提：卡片比窗口宽时靠画布平移与 `fit` 看，页面宽度策略类是 `shell.css` 的 `canvas-page--board`，**禁止给它加视口 `@media`**（打印那一处除外）。
  画布 `.demo-frame` 是容器查询容器、内在尺寸被归零，只能显式取档宽（`--size-demo-tile` / `--tile-wide` / `--size-modal-width` / 撑满行）；
  编号只写在 markup 的 `.demo-no`（唯一来源，树不在 JS 里重排），分类序号由树生成；**新增画布必须以 `.demo-label` 为首个子元素**，否则横向并排后无法分辨是哪个变体。
  4 个分类的 `<section class="demo-cat">` 与标题是**入口文件手写**的（`demos/*.html` 只提供类内的示例片段），新增组件要同时接这两处。
- `tools/`：`build.mjs`、`check.mjs`、`tokens-report.mjs`、`manifest.json`。
- `dist/`：构建快照，**只读**；改样式永远改 `src/`。

## 3. 令牌（一处改，全域变）
- `tokens.css` 是全项目唯一允许出现颜色字面量的文件；`base/components/views/spec` 一律引用令牌，禁止写 `#hex`、裸 `rgba()`。
- 命名与刻度结构对齐 NomiKit 九级（`tiny → extraSmall → small → medium → large → extraLarge → huge → massive → colossal`）；**取值以原型实测视觉为权威**，为凑刻度而改动已验证的观感是不允许的，这类值保留为「组件档」并写明原因。
- 新增令牌必须先说明为什么既有令牌不够；行内注释写「说明 + `@nomikit SymbolName`」，`tools/tokens-report.mjs` 会把它解析成对照列。
- 旧令牌名（`--bg/--ink/--fs-*` 等）只在 `tokens.compat.css` 里有指向，新代码不得引用；悬空即门禁失败。
- 区域差异只允许改「区域旋钮」组里的自定义属性值（写在 `views/<region>.css` 的「00 · 区域旋钮」块），禁止在视图里复制整条组件规则，也禁止为差异新增修饰类。

## 4. 组件唯一源
- 同一组件在两区的表现差异，只有两种合法写法：改旋钮值，或显隐机制本身。需要写第三种时，先回去改令牌。
- 浮层显隐统一：模态 / 抽屉 / 气泡用 `.is-open`，遮罩与 toast 用 `.is-visible`。不允许 `[hidden]` 与 class 两套机制并存 —— 混用时模态会永远停在 `opacity: 0`。
- 语义色一律成对给出（`--color-x` + `--color-x-soft`）；深色评审视图需要覆写的组件色不能漏，漏一个组件就会在深色档落回 unset。
- 触控热区 ≥44×44：保持视觉尺寸不变，用 `::after` 负 inset 扩展命中区。
- 每个可点元素必须有 hover / active / disabled 态，状态用 `aria-pressed` / `aria-expanded` / `aria-current` / `aria-selected` 表达并与视觉同步。

## 5. 区域隔离（不用 iframe）
- 画布是 `.region-stage`，同时是容器查询容器（`container-name: region`）与定位包含块，因此区域内**禁止** `position: fixed`，浮层一律 `absolute`。
- 宽度断点只写 `@container region (…)`，禁止 `@media (max-width)`；`tools/manifest.json` 登记每个区域允许的阈值，CSS 档位必须与 JS 布局函数的档位同源。
- 文档区（`src/spec/spec.css`）自己的排版档位登记在 `manifest.docBreakpoints`，与两区阈值分开；门禁 07 两边都查——未登记即失败，登记了但 CSS 里没用到也失败。目前为 `[]`：组件页卡片固定宽后容器宽度恒定，排版不再需要档位查询。
- 档位一律量画布宽度且只用 `offsetWidth`（`src/views/*.script.js` 的 `getLayout()` / `computeLayout()`），并用 `ResizeObserver` 驱动，禁止读 `window.innerWidth/innerHeight` —— 画布嵌在文档流里时两者与画布不等，且 rect 会随缩放变化、`offsetWidth` 不会。
- 画布页被 `hidden` 收起时宽度为 0，布局函数必须直接返回，否则跨 phone 边界会重置移动端路由与列表页签。
- 画布缩放只用 `transform: scale()`，**禁止 CSS `zoom`**：实测祖先 `zoom:.5` 时画布自认 1578px 宽，容器查询当场跳档，直接违反「嵌入与全屏每档一致」；`check.mjs` 有对应硬门禁。代价是高倍率下文字不如 `zoom` 锐利，属已知取舍。
- 平移只在画布背景 / 按住 Space / 中键启动，4px 阈值；滚轮遇到真实滚动容器（`.table-scroll`、`.messages`、`.drawer-body` 等）不拦截，`Ctrl/⌘` 恒为缩放。Space 只在焦点不在按钮、链接、标签页等可激活元素上时才当平移键。
- 全屏 `[popover]` 层必须是 body 直属、在缩放子树之外，否则 `position: fixed` 的包含块会被画布 transform 改掉；进出全屏时视图复位。
- 层级树**当前只做一级**：令牌页取 `window.AyaneTokens.groups`、组件页取 `.demo-cat` 分类、原型页取画布直接子级；右侧计数是该节点自身的规模（令牌数 / 类内画布数 / 内层标注数），不产生第二层。原型 markup 里内层的 `data-layer="…"` 标注全部保留 —— 一级渲染不读它们，它们是将来二级的唯一命名来源；新增重要子结构照常补标注，不让树去猜类名。
- 外壳 chrome（左栏 / 画布 / HUD）在 `src/spec/shell.css`，它与 `region.css` 是仅有的两个允许视口宽度 `@media` 的文件；外壳高度用 `height: 100%` 链式撑满，不用 `vh`。
- 区域内高度只取 `var(--viewport-h)`，禁止 `vh/dvh/cqh/cqw`；只有 `region.css` 与 `tokens.css` 可以出现视口单位。
- 全屏用 `[popover]` 层**移动**同一张画布节点，不复制标记，所以嵌入档与全屏档共用一套断点；`popover="manual"` + 区域守卫的 ESC：内层浮层优先消费按键，同页各区域互不抢 ESC 与 hash 路由。
- 文档分区的锚点（`#sec-*`）不是后台路由，后台的 `hashchange` 必须忽略非 `#/` 开头的 hash。

## 6. 交互与运行时
- 共享实现只在 `src/base/util.js`：`escapeHtml`、`createToast`、`trapFocus`、`restoreFocus`、`formatClock`。视图脚本各自包在 IIFE 里，不得有顶层共享声明。
- 声明 `aria-modal="true"` 必须有焦点陷阱；弹层关闭后焦点回到触发元素；ESC 关闭、点遮罩关闭。
- 动画只动 `transform` 与 `opacity`，元素定位不得依赖 `transform`；`prefers-reduced-motion` 下降级。
- 图标只用精灵 `<svg class="icon"><use href="#i-…"></use></svg>`，禁止 emoji 与几何字符（`🎙  ＋ ☺ ➤  ⋯` 这类）——跨平台字形不一致，无法做视觉回归基线。例外只有菜单省略号 `⋯`（`tools/check.mjs` 的 `EMOJI_ONE_OFF` 白名单），它是文字符号而非 emoji。改过 id 必须同步改字符串比较与选择器，委托静默失效不报错但功能已死。

## 7. 工作流与交付
改完必须按顺序跑，验证结论只能来自实际检查：

```
node tools/tokens-report.mjs   # 改了 tokens.css 后重生成令牌表数据
node tools/build.mjs           # 展开 @include → dist/绫音设计规范与交互原型.html（头部带 sha256 指纹）
node tools/check.mjs           # 全部子命令与条数以 check.mjs 头部清单为准，退出码必须为 0
pwsh .review/run.ps1 -Region both -Mode both   # 两区 × 嵌入/全屏，截图 + 几何审计
```

1. 静态检查（门禁，必过）：CSS 花括号配平且注释未被提前闭合、JS `node --check`、id 全局唯一、`getElementById` 与 `.id ===` 比较的目标存在、令牌无悬空、断点与 manifest 一致、颜色只在令牌源、视口单位与 `position: fixed` 禁令、图标零 emoji、页面菜单与层级根一一对应、画布禁 CSS `zoom`、产物新鲜度。
2. 渲染验证（硬要求）：`audit-<region>[-full].json` 里 `consoleErrors` 与 `exceptions` 必须为 0；`summary-*.txt` 末尾给出横向溢出 / 越界 / 裁切 / 粗指针热区 / 遮挡计数，与基线对比只允许更少。走查脚本会先激活目标页并把画布复位到 100%，截图始终是 1:1 像素。
3. 汇报时写清验证范围与盲区：headless 下 `env(safe-area-inset-*)` 恒为 0、无软键盘、无真机 DPR>1、外链头像在离线时会失败，这些只能标为未验证，不得写成已通过。

## 8. 其他黑名单与命名
- 紫色渐变；均匀深蓝底 `#0D1117` + 通用霓虹 glow（有作者意图的暗色光影不禁）。
- 圆角卡片 + 左侧彩色 border 条；手画 SVG 人像/场景；用色块或渐变冒充真实图片（头像需真实图片）。
- Inter/Roboto/Arial 之外的系统字体不得作 display 字体；文案引号用「」，不用 ""。
- 依赖网络的外链（当前仅头像素材）必须在入口文件头注释标明；离线打开时由渐变底兜住。
- 图片默认放 `prototype/assets/`，文件名小写英文；本目录内引用用相对路径，禁止 `file://` 与绝对路径。为控制单文件体积允许改用外链（如头像取自 GitHub），条件是入口文件头按上一条声明来源与离线降级，且不得引入构建期或运行期请求。
- 深色主题目前只服务规范区的评审开关（`data-theme` 挂在文档分区上），两个原型本次不接入深色。
- 大改版另存新文件并保留旧文件；两份历史单文件原型（客户端原型 / 管理后台原型）已完整并入 `src/views/`，现移出仓库、归档于仓库外的 prototypes-archive，不再随仓库分发，也不再作为编辑对象。`走查报告.md` 仍按原文件名为历史基线存档。
