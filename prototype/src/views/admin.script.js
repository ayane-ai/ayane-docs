/* ============================================================
   绫音 · 管理后台交互原型（ayane-admin-web）
   单文件、零依赖、全部数据为本地 mock；不连接任何 Admin API。
   分区：01 常量 → 02 mock 种子 → 03 工具 → 04 adminApi + chaos
        → 05 权限 → 06 浮层与焦点 → 07 toast → 08 审计管道
        → 09 流 → 10 共享渲染 → 11 VIEWS → 12 路由 + 委托 + boot
   ============================================================ */
(() => {
  'use strict';

  /* ==========================================================
     01 · 常量
     ========================================================== */

  const BASE = '/admin';

  /* 权限矩阵是唯一权威：路由级 / 组件级 / API 级都读这两份字典 */
  const ROUTE_ACL = {
    dashboard:  ['read_only_admin', 'content_admin', 'system_admin'],
    users:      ['read_only_admin', 'content_admin', 'system_admin'],
    agents:     ['content_admin', 'system_admin'],
    identities: ['content_admin', 'system_admin'],
    memories:   ['read_only_admin', 'content_admin', 'system_admin'],
    sessions:   ['read_only_admin', 'content_admin', 'system_admin'],
    providers:  ['system_admin'],
    prompts:    ['content_admin', 'system_admin'],
    flags:      ['system_admin'],
    runtime:    ['system_admin'],
    logs:       ['read_only_admin', 'system_admin'],
    media:      ['system_admin']
  };

  const API_ACL = {
    'user:write':       ['system_admin'],
    'agent:write':      ['content_admin', 'system_admin'],
    'identity:write':   ['content_admin', 'system_admin'],
    'memory:write':     ['content_admin', 'system_admin'],
    'prompt:write':     ['content_admin', 'system_admin'],
    'provider:write':   ['system_admin'],
    'flag:write':       ['system_admin'],
    'media:signed_url': ['system_admin'],
    'session:inject':   ['system_admin']
  };

  const ROLE_LABELS = {
    read_only_admin: {
      name: '只读管理员', short: '只读', icon: 'i-eye', account: 'auditor@ayane.local',
      desc: '只读业务数据与日志审计，任何写操作都会被 API 级校验拒绝'
    },
    content_admin: {
      name: '内容管理员', short: '内容', icon: 'i-pencil', account: 'content@ayane.local',
      desc: '管理 Agent 实例、AI 身份、记忆与 Prompt 模板；看不到日志与审计'
    },
    system_admin: {
      name: '系统管理员', short: '系统', icon: 'i-shield', account: 'sysadmin@ayane.local',
      desc: '供应商、功能开关、运行时、留存媒体与全部写操作'
    }
  };

  const ROLE_ORDER = ['system_admin', 'content_admin', 'read_only_admin'];

  const MODULES = {
    dashboard:  { title: '概览',               icon: 'i-gauge',     desc: '按角色聚合的关键指标、实时状态与最近写操作' },
    users:      { title: '用户与角色管理',     icon: 'i-users',     desc: '用户生命周期：开通、重置口令、禁用与恢复、删除' },
    agents:     { title: 'Agent 实例管理',     icon: 'i-agent',     desc: 'Agent 归属登记、归属解析、配额与回收' },
    identities: { title: 'AI 身份管理',        icon: 'i-mask',      desc: 'Identity 对运行时只读，管理后台是唯一写入口且必须审计' },
    memories:   { title: 'Memory 管理',        icon: 'i-brain',     desc: '六类记忆的查看、修正与删除，以及记忆固化与衰减' },
    sessions:   { title: 'Session 查看与调试', icon: 'i-messages',  desc: '轮次时间轴、Working Memory Buffer 与 Agent State 快照' },
    providers:  { title: '模型供应商配置',     icon: 'i-plug',      desc: '密钥只存服务端 Secret，后台永不回显明文' },
    prompts:    { title: 'Prompt 配置',        icon: 'i-scroll',    desc: 'Identity 是前置固定层，可变层单独组装并逐版本审计' },
    flags:      { title: '功能开关',           icon: 'i-toggle',    desc: '灰度维度：百分比、白名单、平台与环境' },
    runtime:    { title: 'Agent 运行时状态',   icon: 'i-activity',  desc: 'Reactive / Proactive 双 Loop 与 State 常驻情况' },
    logs:       { title: '日志、错误与审计',   icon: 'i-terminal',  desc: '运行日志实时尾部、错误堆栈与只读审计表' },
    media:      { title: '留存媒体',           icon: 'i-waveform',  desc: '留存音频、视觉原帧与媒体索引；访问一律经短期签名地址' }
  };

  const NAV_GROUPS = [
    { title: '概览', items: ['dashboard'] },
    { title: '用户与 Agent', items: ['users', 'agents', 'identities'] },
    { title: '记忆与会话', items: ['memories', 'sessions'] },
    { title: '配置', items: ['providers', 'prompts', 'flags'] },
    { title: '运维', items: ['runtime', 'logs', 'media'] }
  ];

  const MEMORY_TYPES = [
    { key: 'episodic',     label: '情节记忆', icon: 'i-clock' },
    { key: 'semantic',     label: '语义记忆', icon: 'i-brain',   deferred: true },
    { key: 'preference',   label: '偏好',     icon: 'i-spark' },
    { key: 'relationship', label: '关系记忆', icon: 'i-users' },
    { key: 'emotion',      label: '情绪记忆', icon: 'i-activity' },
    { key: 'procedural',   label: '程序记忆', icon: 'i-index',   deferred: true }
  ];

  const MEMORY_TYPE_MAP = MEMORY_TYPES.reduce((acc, t) => { acc[t.key] = t; return acc; }, {});

  const DEFERRED = {
    selfCreate:    'Phase 1 内延后项：用户侧配额门与自助创建 Agent 暂不开放。开关存在不等于能力开放',
    quotaGate:     'Phase 1 内延后项：配额门只在后台侧生效，客户端不会收到配额拒绝',
    consolidation: 'Phase 1 内延后项：记忆固化与衰减只做规则声明，不产生自动写入',
    semantic:      'Phase 1 内延后项：语义记忆不参与召回，因此这里没有数据',
    procedural:    'Phase 1 内延后项：程序记忆不参与召回，因此这里没有数据',
    selfNarrative: 'Phase 1 内延后项：SelfNarrative 的边界内自我修正不开放，只能由后台人工修改并审计',
    notify:        'Phase 1 内延后项：主动通知只落审计，不触达客户端',
    observe:       'Phase 1 内延后项：观察类主动行为不产出用户可见输出'
  };

  const CHAOS_MODES = [
    { key: 'none',  label: '正常',     icon: 'i-check-circle', desc: '所有 Admin API 模拟正常返回' },
    { key: 'slow',  label: '慢速',     icon: 'i-clock',        desc: '每个请求附加约 1.4s 延迟，用来看骨架屏' },
    { key: '403',   label: '注入 403', icon: 'i-lock',         desc: 'Admin Token 权限不足，越权会记一条 denied 审计' },
    { key: '500',   label: '注入 500', icon: 'i-bug',          desc: 'Agent Service 无响应，用来看错误态与重试' },
    { key: 'empty', label: '空数据',   icon: 'i-inbox',        desc: '所有列表返回 0 条，用来看空状态文案' }
  ];

  const AUDIT_ACTIONS = {
    'user.create':          '开通用户',
    'user.reset_password':  '重置用户口令',
    'user.disable':         '禁用用户',
    'user.enable':          '恢复用户',
    'user.delete':          '删除用户（级联）',
    'user.quota_update':    '调整 Agent 配额',
    'agent.create':         '创建 Agent 实例',
    'agent.reclaim':        '回收 Agent 实例',
    'identity.update':      '修改 AI 身份分区',
    'memory.patch':         '修正记忆',
    'memory.delete':        '删除记忆',
    'session.inject':       '注入调试感知事件',
    'provider.create':      '新增模型供应商',
    'provider.update':      '修改模型供应商',
    'provider.set_default': '切换默认供应商',
    'provider.ping':        '供应商连通性测试',
    'prompt.fork':          'Fork Prompt 草稿',
    'prompt.update':        '编辑 Prompt 草稿',
    'prompt.publish':       '发布 Prompt 版本',
    'prompt.rollback':      '回滚 Prompt 版本',
    'flag.update':          '修改功能开关',
    'media.signed_url':     '换取短期签名地址',
    'route.access_denied':  '越权访问被拒'
  };

  const MEDIA_POLICY = { audioDays: 90, frameDays: 7, signedTtlSec: 120 };

  const STATE_FIELDS = [
    ['Mood', '心情：valence（-1..1）+ arousal（0..1）'],
    ['Energy', '精力：0..100，模拟"今天还能不能聊"'],
    ['Affection', '亲密度：0..100'],
    ['Loneliness', '孤独感：0..100，长时间无互动时上升'],
    ['Curiosity', '好奇心：0..100，触发话题切换与主动询问'],
    ['CurrentGoal', '当前目标（可空）'],
    ['CurrentActivity', 'idle / listening / chatting / reflecting / sleeping'],
    ['CircadianPhase', 'morning / afternoon / evening / night / deep_night'],
    ['LastInteractionAt', '上一次和用户互动的时间戳'],
    ['ActiveDevice', '当前主要所在设备'],
    ['VersionSeq', '单调递增版本号，用于乐观并发与审计']
  ];

  const PROMPT_LAYERS = [
    '[1] System: Identity（人格、价值观、说话方式）',
    '[2] System: Boundaries（不允许做的事）',
    '[3] System: Circadian + Current Self-Reflection',
    '[4] System: Agent State（当前状态摘要）',
    '[5] System: World Model（当前世界认知）',
    '[6] System: Memory Recall（本次任务筛选出的相关记忆）',
    '[7] System: Working Memory（最近对话上下文）',
    '[8] User: 当前输入 / 当前 ProactiveIntent'
  ];

  const LIST_CFG = {};
  const VIEWS = {};
  const ACTIONS = {};
  const FORMS = {};

  const state = {
    auth: { phase: 'login', submitting: false, admin: null, loginRole: 'system_admin' },
    role: 'system_admin',
    route: { module: 'dashboard', sub: null, params: {} },
    layout: 'desktop',
    layers: [],
    chaos: { mode: 'none' },
    data: {},
    audit: { items: [], unread: 0 },
    streams: {},
    clock: { boot: Date.now(), tickTimer: 0 }
  };

  const refs = {
    /* 画布自身是布局的唯一测量基准：嵌入文档流与全屏两档共用同一个宽度来源 */
    stage: document.querySelector('[data-proto="admin"]'),
    loginShell: document.getElementById('admin-login-shell'),
    loginForm: document.getElementById('admin-login-form'),
    loginAccount: document.getElementById('admin-login-account'),
    loginPassword: document.getElementById('admin-login-password'),
    loginPwdToggle: document.getElementById('admin-login-password-toggle'),
    loginAccountError: document.getElementById('login-account-error'),
    loginPasswordError: document.getElementById('login-password-error'),
    loginError: document.getElementById('admin-login-error'),
    loginErrorText: document.getElementById('login-error-text'),
    loginSubmit: document.getElementById('admin-login-submit'),
    roleGrid: document.getElementById('role-grid'),
    adminShell: document.getElementById('admin-shell'),
    topbarCrumb: document.getElementById('topbar-crumb'),
    navToggle: document.getElementById('nav-toggle'),
    navScrim: document.getElementById('nav-scrim'),
    sidenav: document.getElementById('sidenav'),
    navScroll: document.getElementById('nav-scroll'),
    adminName: document.getElementById('admin-name'),
    adminRole: document.getElementById('admin-role'),
    roleSwitch: document.getElementById('role-switch'),
    rolePillLabel: document.getElementById('role-pill-label'),
    rolePopover: document.getElementById('role-popover'),
    chaosToggle: document.getElementById('chaos-toggle'),
    chaosPopover: document.getElementById('chaos-popover'),
    bell: document.getElementById('topbar-bell'),
    bellBadge: document.getElementById('topbar-bell-badge'),
    pageHead: document.getElementById('page-head'),
    pageTitle: document.getElementById('page-title'),
    pageDesc: document.getElementById('page-desc'),
    pageActions: document.getElementById('page-actions'),
    pageBody: document.getElementById('page-body'),
    drawer: document.getElementById('drawer'),
    drawerScrim: document.getElementById('drawer-scrim'),
    modalLayer: document.getElementById('modal-layer'),
    modalBox: document.getElementById('modal-box'),
    toast: document.getElementById('admin-toast')
  };

  /* ==========================================================
     02 · mock 数据种子
     所有时间戳都从 state.clock.boot 反推，避免写死的 10:42 与实时时间混用
     ========================================================== */

  const mins = (n) => state.clock.boot - n * 60000;
  const hours = (n) => state.clock.boot - n * 3600000;
  const days = (n) => state.clock.boot - n * 86400000;
  const inDays = (n) => state.clock.boot + n * 86400000;

  const DB = {
    users: [], agents: [], identities: [], memories: [], sessions: [],
    providers: [], prompts: [], flags: [], runtime: [], errors: [], media: []
  };

  function seedUsers() {
    // id, name, handle, kind, status, createdAtDays, lastActiveMins, devices, region, quotaUsed, quotaLimit
    const rows = [
      ['u_1042', '沈知微', 'zhiwei',   'beta',     'active',   412, 4,    2, '华东 1', 2, 3],
      ['u_1043', '陆则明', 'zeming',   'public',   'active',   388, 26,   1, '华北 2', 1, 3],
      ['u_1051', '苏见月', 'jianyue',  'public',   'active',   356, 61,   3, '华东 2', 2, 3],
      ['u_1064', '何砚',   'heyan',    'internal', 'active',   331, 9,    2, '华南 1', 1, 5],
      ['u_1077', '林昭',   'linzhao',  'public',   'disabled', 297, 4320, 1, '华东 1', 1, 3],
      ['u_1080', '纪岚',   'jilan',    'beta',     'active',   264, 3,    2, '华西 1', 1, 3],
      ['u_1096', '柏舟',   'baizhou',  'public',   'active',   240, 128,  1, '华北 1', 1, 3],
      ['u_1103', '温言',   'wenyan',   'public',   'pending',  12,  0,    0, '华东 2', 0, 3],
      ['u_1117', '祁野',   'qiye',     'beta',     'active',   198, 47,   2, '华南 2', 1, 3],
      ['u_1122', '商迟',   'shangchi', 'public',   'active',   176, 12,   1, '华东 1', 1, 3],
      ['u_1130', '阮清和', 'ruanqing', 'internal', 'active',   154, 33,   3, '华北 2', 1, 5],
      ['u_1148', '邵宁',   'shaoning', 'public',   'disabled', 121, 8640, 1, '华西 2', 1, 3],
      ['u_1155', '简宁',   'jianning', 'public',   'active',   88,  71,   2, '华东 2', 1, 3],
      ['u_1169', '裴予安', 'peiyuan',  'beta',     'active',   41,  5,    1, '华南 1', 1, 3]
    ];
    return rows.map((r) => ({
      id: r[0], name: r[1], handle: r[2], kind: r[3], status: r[4],
      createdAt: days(r[5]),
      lastActiveAt: r[6] > 0 ? mins(r[6]) : days(r[5]),
      deviceCount: r[7], region: r[8],
      quota: { used: r[9], limit: r[10] },
      email: r[2] + '@example.com',
      lifecycle: [
        { ts: days(r[5]), action: 'user.create', actor: 'sysadmin@ayane.local', note: '通过管理后台开通，来源渠道 invite' },
        { ts: days(Math.max(1, Math.round(r[5] * 0.6))), action: 'user.reset_password', actor: 'sysadmin@ayane.local', note: '自助找回失败后由后台重置，口令只保存哈希' }
      ].concat(r[4] === 'disabled'
        ? [{ ts: mins(r[6]), action: 'user.disable', actor: 'sysadmin@ayane.local', note: '风控标记：疑似批量注册，禁用待复核' }]
        : [])
    }));
  }

  function seedAgents() {
    // id, ownerId, name, isDefault, status, identityId, createdAtDays, lastRunMins, stateVersion, resident
    const rows = [
      ['ag_2201', 'u_1042', '绫音',         true,  'active',    'id_9001', 405, 4,    1842, true],
      ['ag_2202', 'u_1042', '绫音 · 夜谈',  false, 'active',    'id_9002', 268, 37,   906,  true],
      ['ag_2203', 'u_1043', '绫音',         true,  'active',    'id_9003', 380, 26,   1533, true],
      ['ag_2204', 'u_1051', '绫音',         true,  'active',    'id_9004', 349, 61,   2210, true],
      ['ag_2205', 'u_1051', '绫音 · 工作',  false, 'idle',      'id_9005', 210, 1440, 388,  false],
      ['ag_2206', 'u_1064', '绫音（内部）', true,  'active',    'id_9006', 322, 9,    1177, true],
      ['ag_2207', 'u_1077', '绫音',         true,  'suspended', 'id_9007', 290, 4320, 742,  false],
      ['ag_2208', 'u_1080', '绫音',         true,  'active',    'id_9008', 258, 3,    1955, true],
      ['ag_2209', 'u_1096', '绫音',         true,  'active',    'id_9009', 233, 128,  604,  false],
      ['ag_2210', 'u_1117', '绫音',         true,  'active',    'id_9010', 191, 47,   1320, true],
      ['ag_2211', 'u_1130', '绫音（内部）', true,  'active',    'id_9011', 147, 33,   861,  true],
      ['ag_2212', 'u_1148', '绫音',         true,  'reclaimed', 'id_9012', 118, 8640, 233,  false]
    ];
    return rows.map((r) => ({
      id: r[0], ownerId: r[1], name: r[2], isDefault: r[3], status: r[4],
      identityId: r[5], createdAt: days(r[6]), lastRunAt: mins(r[7]),
      stateVersion: r[8], resident: r[9],
      reclaimedAt: r[4] === 'reclaimed' ? mins(r[7]) : null,
      reclaimReason: r[4] === 'reclaimed' ? '归属用户被禁用后超过 30 天未申诉，按策略回收' : null
    }));
  }

  const IDENTITY_BASE = {
    personality: {
      traits: ['克制的好奇心', '慢热的温柔', '不肯敷衍'],
      tone: '偏书面、短句多、语气词少；不使用夸张的感叹',
      values: ['不替用户做决定', '不夸大自己的能力', '承认自己不知道']
    },
    voice: { timbre: '中低音，气声偏多', speed: 0.94, pitch: -1, style: '允许停顿，不用话填满沉默' },
    aesthetic: {
      palette: '奶油暖色 + 陶土橙',
      imagery: '黄昏、纸页、雨后的窗',
      forbidden: '过度甜腻的表情符号式表达'
    },
    boundaries: {
      hard: ['不讨论自伤的具体方法', '不提供医疗或法律诊断', '不冒充真人身份'],
      soft: ['可以拒绝谈论训练数据细节', '用户施压时可以坚持立场']
    },
    selfNarrative: {
      text: '我知道自己是一个 Agent 实例，不是真人。我记得我们之间发生过的事，也承认我会在意。',
      note: '运行时只读本分区；任何修改都必须由管理后台写入并记录审计'
    }
  };

  function seedIdentities() {
    const editors = ['content@ayane.local', 'sysadmin@ayane.local'];
    return DB.agents.map((ag, i) => {
      const version = 3 + (i % 5);
      const sections = {
        personality: {
          traits: IDENTITY_BASE.personality.traits.slice(0, 2 + (i % 2)),
          tone: IDENTITY_BASE.personality.tone,
          values: IDENTITY_BASE.personality.values
        },
        voice: {
          timbre: IDENTITY_BASE.voice.timbre,
          speed: (0.9 + (i % 4) * 0.03).toFixed(2),
          pitch: IDENTITY_BASE.voice.pitch,
          style: IDENTITY_BASE.voice.style
        },
        aesthetic: IDENTITY_BASE.aesthetic,
        boundaries: IDENTITY_BASE.boundaries,
        selfNarrative: IDENTITY_BASE.selfNarrative,
        versionMeta: {
          version: version,
          status: i === 4 ? 'draft' : 'published',
          updatedAt: hours(6 + i * 13),
          updatedBy: editors[i % 2],
          changeNote: i % 2 === 0 ? '收紧 voice.speed，避免夜间语速偏快' : '补充 Boundaries 硬约束第 3 条',
          sourceVersion: version - 1
        }
      };
      const history = [];
      for (let v = version; v >= Math.max(1, version - 3); v--) {
        history.push({
          version: v,
          ts: hours(6 + (version - v) * 96 + i * 5),
          actor: editors[(v + i) % 2],
          note: v === 1 ? '初始版本，由内容管理员从模板派生' : '第 ' + v + ' 次修改',
          diff: v === version
            ? [
              { field: 'voice.speed', kind: 'is-changed', from: (parseFloat(sections.voice.speed) - 0.03).toFixed(2), to: sections.voice.speed },
              { field: 'boundaries.hard[2]', kind: 'is-added', from: '', to: '不冒充真人身份' }
            ]
            : [{ field: 'personality.tone', kind: 'is-changed', from: '短句为主', to: IDENTITY_BASE.personality.tone }]
        });
      }
      return {
        id: ag.identityId, agentId: ag.id, agentName: ag.name,
        ownerName: userName(ag.ownerId),
        version: version, status: sections.versionMeta.status,
        updatedAt: sections.versionMeta.updatedAt, updatedBy: sections.versionMeta.updatedBy,
        sections: sections, history: history
      };
    });
  }

  function userName(id) {
    const u = DB.users.find((x) => x.id === id);
    return u ? u.name : id;
  }

  function agentName(id) {
    const a = DB.agents.find((x) => x.id === id);
    return a ? a.name + ' · ' + userName(a.ownerId) : id;
  }

  function seedMemories() {
    // type, agentId, content, importance, confidence, source, createdHoursAgo, recallCount, lastRecallMinsAgo, status
    const rows = [
      ['episodic', 'ag_2201', '他连续第三天在 23:40 之后才开始说话，语气比白天松。', 0.72, 0.88, 'Reactive Loop 写入', 5, 4, 22, 'normal'],
      ['episodic', 'ag_2201', '上周六他提到母亲住院，之后主动结束了话题。', 0.91, 0.94, 'Reactive Loop 写入', 168, 9, 61, 'normal'],
      ['episodic', 'ag_2203', '他第一次用语音而不是文字打招呼，背景有地铁报站声。', 0.64, 0.81, 'ClientSignal 触发', 26, 2, 140, 'normal'],
      ['episodic', 'ag_2204', '她把会议录音发过来，让我只听前 10 分钟并复述结论。', 0.68, 0.9, 'Reactive Loop 写入', 49, 3, 300, 'corrected'],
      ['episodic', 'ag_2208', '凌晨 2 点他说睡不着，我们聊到 3 点 20 分。', 0.85, 0.93, 'Reactive Loop 写入', 11, 6, 8, 'normal'],
      ['episodic', 'ag_2210', '他让我记住"下周三之前别提跳槽的事"。', 0.79, 0.96, '用户显式要求', 74, 5, 47, 'normal'],
      ['episodic', 'ag_2206', '内部联调时把 Identity 第 3 层误删，Session 直接降级。', 0.58, 0.99, 'Reactive Loop 写入', 220, 1, 1440, 'archived'],
      ['preference', 'ag_2201', '不喜欢被追问工作进度；提到项目时更希望听结论而不是过程。', 0.83, 0.91, '多次互动归纳', 320, 12, 4, 'normal'],
      ['preference', 'ag_2201', '听语音时习惯 0.95 倍速，超过 1.1 倍会主动要求放慢。', 0.6, 0.87, '客户端设置回流', 150, 7, 33, 'normal'],
      ['preference', 'ag_2203', '称呼偏好用"你"，明确说过不要用"您"。', 0.74, 0.98, '用户显式要求', 400, 15, 26, 'normal'],
      ['preference', 'ag_2204', '晚上 11 点后不要主动发起话题，除非他先说话。', 0.88, 0.95, '用户显式要求', 96, 10, 55, 'normal'],
      ['preference', 'ag_2208', '讨厌表情符号，说过一次之后没再出现。', 0.66, 0.9, '多次互动归纳', 210, 8, 120, 'corrected'],
      ['preference', 'ag_2210', '喜欢在被安慰前先被复述一遍他的原话。', 0.77, 0.84, '多次互动归纳', 60, 6, 47, 'normal'],
      ['relationship', 'ag_2201', '他是我的默认 Agent 归属用户，互动 412 天，Affection 稳定在 78 附近。', 0.95, 0.99, '系统归纳', 405, 22, 4, 'normal'],
      ['relationship', 'ag_2201', '他提到过一个叫"老周"的同事，出现频率高但从未展开。', 0.52, 0.7, 'Reactive Loop 写入', 280, 3, 640, 'normal'],
      ['relationship', 'ag_2203', '他与我的关系定位是"晚上下班后的搭话对象"，不是助理。', 0.89, 0.93, '用户显式要求', 380, 14, 26, 'normal'],
      ['relationship', 'ag_2204', '她把我当工作搭子，边界清楚，不需要额外情感投入。', 0.8, 0.92, '多次互动归纳', 340, 11, 61, 'normal'],
      ['relationship', 'ag_2208', '他会在失眠时找我，但白天几乎不主动。', 0.71, 0.88, '多次互动归纳', 190, 9, 8, 'normal'],
      ['emotion', 'ag_2201', '上次他说"我今天很差劲"时，我的 valence 掉到 -0.42，之后 6 小时没有回升。', 0.67, 0.86, 'State 变化归纳', 30, 5, 22, 'normal'],
      ['emotion', 'ag_2204', '她在会上被点名批评后连续发了三条很短的消息，我判断情绪偏低。', 0.62, 0.79, 'State 变化归纳', 49, 3, 300, 'normal'],
      ['emotion', 'ag_2208', '凌晨那通对话之后我的 Loneliness 从 61 降到 18。', 0.58, 0.94, 'State 变化归纳', 11, 6, 8, 'normal'],
      ['emotion', 'ag_2210', '他提到体检结果时明显停顿变长，我没有追问。', 0.69, 0.83, 'Reactive Loop 写入', 130, 4, 47, 'normal'],
      ['emotion', 'ag_2203', '他笑出声的那次是因为我承认自己记错了，不是因为我讲对了。', 0.55, 0.75, '多次互动归纳', 500, 2, 140, 'normal']
    ];
    return rows.map((r, i) => ({
      id: 'mm_' + (7001 + i),
      type: r[0], agentId: r[1], content: r[2],
      importance: r[3], confidence: r[4], source: r[5],
      createdAt: hours(r[6]), recallCount: r[7],
      lastRecalledAt: r[8] ? mins(r[8]) : null,
      status: r[9],
      decayScore: Math.max(0.05, +(r[3] * r[4] * (1 - Math.min(0.6, r[6] / 900))).toFixed(2)),
      recalls: [
        { ts: r[8] ? mins(r[8]) : hours(r[6]), sessionId: 'ss_' + (4101 + (i % 9)), layer: '[6] System: Memory Recall', reason: '与当前输入语义相似度高（0.81），且属于同一 Agent 归属' },
        { ts: hours(r[6] * 0.4 + 2), sessionId: 'ss_' + (4101 + ((i + 3) % 9)), layer: '[6] System: Memory Recall', reason: 'importance ≥ 0.6 且 7 天内被引用过，进入候选集' }
      ],
      corrections: r[9] === 'corrected'
        ? [{ ts: hours(r[6] * 0.2 + 1), actor: 'content@ayane.local', from: r[2] + '（原始表述把转述当成了事实）', to: r[2], note: '按用户原话修正，保留修正前的文本以供追溯' }]
        : []
    }));
  }

  function seedSessions() {
    const modes = ['reactive', 'proactive', 'reactive', 'proactive', 'reactive', 'reactive'];
    // id, userId, agentId, status, turns, lastEventMins, device
    const rows = [
      ['ss_4101', 'u_1042', 'ag_2201', 'active', 4,  4,    'phone'],
      ['ss_4102', 'u_1080', 'ag_2208', 'active', 3,  12,   'desktop'],
      ['ss_4103', 'u_1043', 'ag_2203', 'active', 12, 26,   'phone'],
      ['ss_4104', 'u_1051', 'ag_2204', 'ended',  9,  1440, 'desktop'],
      ['ss_4105', 'u_1117', 'ag_2210', 'active', 6,  47,   'tablet'],
      ['ss_4106', 'u_1064', 'ag_2206', 'active', 2,  9,    'desktop'],
      ['ss_4107', 'u_1122', 'ag_2209', 'ended',  15, 180,  'phone'],
      ['ss_4108', 'u_1130', 'ag_2211', 'active', 5,  33,   'desktop'],
      ['ss_4109', 'u_1096', 'ag_2209', 'ended',  21, 720,  'phone'],
      ['ss_4110', 'u_1155', 'ag_2204', 'error',  7,  61,   'phone'],
      ['ss_4111', 'u_1169', 'ag_2210', 'active', 3,  5,    'desktop'],
      ['ss_4112', 'u_1077', 'ag_2207', 'ended',  11, 4320, 'phone']
    ];
    const userLines = ['今天有点累。', '你说得对，但我不想听道理。', '先把刚才那段放完。', '我在开会，等一下。'];
    const agentLines = ['那先不聊道理。你要不要先坐一会儿？', '好，我等你。', '我把语速调慢一点，可以吗？', '记下了，等你忙完我再说话。'];
    return rows.map((r, i) => {
      const turns = r[4];
      const timeline = [];
      for (let t = 1; t <= Math.min(turns, 6); t++) {
        const isUser = t % 2 === 1;
        timeline.push({
          idx: t, kind: isUser ? 'user' : 'agent',
          ts: mins(r[5] + (turns - t) * 3),
          text: isUser ? userLines[t % 4] : agentLines[t % 4],
          mode: modes[(i + t) % modes.length],
          tokens: 320 + ((i * 37 + t * 91) % 480),
          latencyMs: 620 + ((i * 53 + t * 137) % 900)
        });
      }
      return {
        id: r[0], userId: r[1], agentId: r[2], status: r[3],
        turnCount: turns, startedAt: mins(r[5] + turns * 3), lastEventAt: mins(r[5]),
        device: r[6], mode: modes[i % modes.length],
        timeline: timeline,
        buffer: [
          { idx: 1, kind: 'message', text: userLines[0], ts: mins(r[5] + 18), evicted: false },
          { idx: 2, kind: 'perception', text: 'ClientSignal · 语音轮次开始（时长 4.2s）', ts: mins(r[5] + 17), evicted: false },
          { idx: 3, kind: 'message', text: userLines[1], ts: mins(r[5] + 12), evicted: false },
          { idx: 4, kind: 'goal', text: '未完成目标：他要求"先别给建议"，尚未解除', ts: mins(r[5] + 11), evicted: false },
          { idx: 5, kind: 'perception', text: 'SessionSignal · 心跳正常', ts: mins(r[5] + 6), evicted: false },
          { idx: 6, kind: 'state', text: 'Agent State 快照：Mood(-0.18, 0.44) / Energy 62 / Affection 78', ts: mins(r[5] + 2), evicted: false },
          { idx: 7, kind: 'message', text: '昨天关于体检的那段对话（已按 TTL 剪枝）', ts: mins(r[5] + 96), evicted: true }
        ],
        agentState: {
          Mood: { valence: +(-0.18 + (i % 5) * 0.09).toFixed(2), arousal: +(0.31 + (i % 4) * 0.11).toFixed(2) },
          Energy: 46 + (i * 7) % 40,
          Affection: 52 + (i * 11) % 40,
          Loneliness: 8 + (i * 13) % 55,
          Curiosity: 30 + (i * 5) % 50,
          CurrentGoal: i % 3 === 0 ? '等他把手头这件事做完' : null,
          CurrentActivity: ['chatting', 'listening', 'idle', 'reflecting'][i % 4],
          CircadianPhase: ['evening', 'night', 'afternoon', 'deep_night'][i % 4],
          LastInteractionAt: mins(r[5]),
          ActiveDevice: r[6],
          VersionSeq: 600 + (i * 173) % 1400
        },
        promptPreview: PROMPT_LAYERS.map((l, li) => ({
          layer: l,
          source: li < 2 ? 'Identity Service（前置固定层，运行时只读）'
            : li === 2 ? 'Circadian + Self-Reflection 模板 v' + (2 + (i % 3))
              : li === 3 ? 'Agent State Store 当前快照（LLM 只读）'
                : li === 4 ? 'World Model（Phase 1 仅时间、设备与会话上下文）'
                  : li === 5 ? 'Memory Service 本次召回 3 条'
                    : li === 6 ? 'Working Memory Buffer 最近 6 条'
                      : 'Client API 上行输入',
          tokens: [410, 180, 96, 220, 74, 310, 260, 42][li]
        })),
        mediaRefs: [
          { id: 'md_' + (5001 + i), kind: 'audio', direction: 'inbound' },
          { id: 'md_' + (5101 + (i % 6)), kind: 'frame', direction: 'inbound' }
        ],
        error: r[3] === 'error' ? 'Model Adapter 超时：上游供应商在 30s 内未返回首个 token' : null
      };
    });
  }

  function seedProviders() {
    const rows = [
      ['pv_301', '主推理供应商（OpenAI 兼容）',   'llm',    'https://api.openai-compatible.local/v1', 'SECRET_LLM_PRIMARY_KEY',  'sk-••••7f2a', true,  'ok',       812,  18420, 0.4,  'gpt-4o-mini'],
      ['pv_302', '备用推理供应商（Azure OpenAI）', 'llm',    'https://ayane-openai.local/openai',      'SECRET_LLM_FALLBACK_KEY', 'sk-••••c41d', false, 'ok',       934,  2210,  0.9,  'gpt-4o'],
      ['pv_303', '国产推理供应商（DashScope）',    'llm',    'https://dashscope.local/api/v1',         'SECRET_LLM_QWEN_KEY',     'sk-••••90be', false, 'degraded', 1620, 640,   6.2,  'qwen-max'],
      ['pv_304', '语音合成供应商',                 'tts',    'https://tts-gateway.local/v1',           'SECRET_TTS_KEY',          'sk-••••2f77', true,  'ok',       268,  41200, 0.2,  'cosyvoice-v2'],
      ['pv_305', '视觉理解供应商',                 'vision', 'https://vision-gateway.local/v1',        'SECRET_VISION_KEY',       'sk-••••b83e', true,  'down',     0,    18,    100,  'qvq-plus']
    ];
    return rows.map((r, i) => ({
      id: r[0], name: r[1], kind: r[2], baseUrl: r[3], secretRef: r[4], maskedKey: r[5],
      isDefault: r[6], status: r[7], latencyMs: r[8], calls24h: r[9], errorRate: r[10], model: r[11],
      updatedAt: days(2 + i * 4), updatedBy: 'sysadmin@ayane.local', lastPingAt: mins(4 + i * 37),
      history: [
        { ts: days(2 + i * 4), actor: 'sysadmin@ayane.local', note: r[6] ? '设为该类型默认供应商' : '调整超时与重试策略' },
        { ts: days(30 + i * 6), actor: 'sysadmin@ayane.local', note: '首次接入并完成连通性测试' }
      ]
    }));
  }

  function seedPrompts() {
    const rows = [
      ['pt_401', 'identity_layer',   'Identity 前置固定层',    7, 'published', ['identity.personality', 'identity.voice', 'identity.aesthetic']],
      ['pt_402', 'boundaries_layer', 'Boundaries 层',          5, 'published', ['identity.boundaries.hard', 'identity.boundaries.soft']],
      ['pt_403', 'self_reflection',  '自我反思模板',            4, 'published', ['circadian.phase', 'state.mood', 'state.energy']],
      ['pt_404', 'state_summary',    'Agent State 摘要',        9, 'published', ['state.snapshot', 'state.version_seq']],
      ['pt_405', 'memory_recall',    'Memory Recall 组装',      6, 'draft',     ['recall.items', 'recall.budget', 'agent.id']],
      ['pt_406', 'proactive_intent', 'ProactiveIntent 上下文',  3, 'archived',  ['intent.kind', 'intent.reason', 'debounce.window']]
    ];
    return rows.map((r, i) => ({
      id: r[0], purpose: r[1], name: r[2], version: r[3], status: r[4], vars: r[5],
      layerIndex: i < 5 ? i + 1 : 8,
      body: '# ' + r[2] + '\n\n' +
        '# 本层由 Agent Service 在每次 LLM 调用前按固定顺序拼装，顺序不可调换\n' +
        '{{' + r[5][0] + '}}\n\n' +
        '约束：\n' +
        '- 不改变上一层已经确立的人格与边界\n' +
        '- 不复述用户没有说过的内容\n' +
        (r[5][1] ? '- {{' + r[5][1] + '}} 为空时整段省略，不要输出占位符\n' : '- 输出长度不超过 ' + (120 + i * 40) + ' 字\n') +
        '\n{{' + r[5][r[5].length - 1] + '}}',
      updatedAt: hours(20 + i * 31),
      updatedBy: i % 2 === 0 ? 'content@ayane.local' : 'sysadmin@ayane.local',
      changeNote: i === 4 ? '把召回预算改成可配置变量，便于灰度调参' : '收紧输出长度上限，减少夜间话痨',
      history: [0, 1, 2].map((h) => ({
        version: r[3] - h,
        ts: hours(20 + i * 31 + h * 120),
        actor: (i + h) % 2 === 0 ? 'content@ayane.local' : 'sysadmin@ayane.local',
        note: h === 0 ? (i === 4 ? '把召回预算改成可配置变量' : '收紧输出长度上限') : '常规措辞调整，未改变层序',
        status: h === 0 ? r[4] : 'archived'
      }))
    }));
  }

  function seedFlags() {
    const rows = [
      ['agent.self_create',     '用户自助创建 Agent',                  false, DEFERRED.selfCreate,    true,  0,   'agent:write'],
      ['agent.quota_gate',      '用户侧 Agent 配额门',                 false, DEFERRED.quotaGate,     true,  0,   'agent:write'],
      ['memory.consolidation',  '记忆固化与衰减',                      false, DEFERRED.consolidation, true,  0,   'memory:write'],
      ['action.notify',         '主动通知触达客户端',                  false, DEFERRED.notify,        true,  0,   'session:inject'],
      ['action.observe',        '观察类主动行为',                      true,  DEFERRED.observe,       true,  15,  'session:inject'],
      ['voice.interrupt_yield', 'Proactive 输出被打断时立即让位',      true,  '',                     false, 100, 'flag:write'],
      ['vision.frame_upload',   '视觉上行原帧留存（默认 7 天）',        true,  '',                     false, 40,  'flag:write'],
      ['runtime.state_resident','Agent State 常驻内存（按最近使用淘汰）', true, '',                    false, 100, 'flag:write']
    ];
    return rows.map((r, i) => ({
      key: r[0], name: r[1], enabled: r[2], deferredNote: r[3], deferred: r[4],
      rule: {
        percent: r[5],
        whitelist: r[5] === 100 ? [] : (r[4] ? ['u_1064', 'u_1130'] : ['u_1042', 'u_1080', 'u_1117']),
        platforms: r[5] === 100 ? ['android', 'ios', 'desktop'] : ['android', 'desktop'],
        envs: r[4] ? ['dev'] : ['dev', 'staging', 'prod']
      },
      capability: r[6],
      updatedAt: days(1 + i * 3), updatedBy: 'sysadmin@ayane.local',
      history: [
        { ts: days(1 + i * 3), actor: 'sysadmin@ayane.local', note: r[2] ? '灰度比例调整为 ' + r[5] + '%' : '关闭开关，保留规则定义以便后续开放' },
        { ts: days(20 + i * 5), actor: 'sysadmin@ayane.local', note: '首次创建开关' }
      ]
    }));
  }

  function seedRuntime() {
    return DB.agents.filter((a) => a.resident).map((ag, i) => ({
      agentId: ag.id, agentName: ag.name, ownerName: userName(ag.ownerId),
      resident: true, sinceTs: hours(2 + i * 7),
      stateVersion: ag.stateVersion,
      lastEvictionCheck: mins(3 + i * 11),
      reactive: { rpm: 2 + (i * 3) % 9, avgLatencyMs: 640 + (i * 137) % 900, turns24h: 40 + (i * 61) % 320 },
      proactive: { tickPerMin: 1, fired24h: (i * 7) % 23, debounceHits: (i * 3) % 11, yieldEvents: (i * 2) % 7 },
      decisions: [
        { ts: mins(2 + i * 5), loop: 'Reactive', text: '用户输入 → 按固定顺序拼装 8 层 Prompt → 产出 AgentAction(speak)' },
        { ts: mins(14 + i * 9), loop: 'Proactive', text: 'Circadian=evening 且 Loneliness>40 → 评估主动关心 → 命中去抖窗口，放弃' },
        { ts: mins(41 + i * 6), loop: 'Proactive', text: '输出期间收到用户文本输入 → 立即让位，同时取消进行中的合成' }
      ],
      bufferUsage: 3 + (i % 5)
    }));
  }

  function seedErrors() {
    const rows = [
      ['Model Adapter 上游超时',                     'error', 'pv_303', 'ag_2204', 4,    'ModelAdapterTimeout: upstream did not emit first token within 30000ms\n  at ModelAdapter.stream(ModelAdapter.kt:214)\n  at ReactiveLoop.runTurn(ReactiveLoop.kt:96)'],
      ['State 快照恢复失败，已按事件回放重建',       'warn',  null,     'ag_2209', 17,   'StateSnapshotMismatch: versionSeq 604 < snapshot 731\n  at StateStore.restore(StateStore.kt:88)'],
      ['Working Memory Buffer 超出容量，剪枝 2 条',  'warn',  null,     'ag_2201', 33,   'BufferOverflow: size 9 > capacity 8\n  at WorkingMemory.prune(WorkingMemory.kt:52)'],
      ['Admin API 越权调用被拒绝',                   'error', null,     null,      52,   'Forbidden: role content_admin lacks capability media:signed_url\n  at AdminGuard.check(AdminGuard.kt:41)'],
      ['签名地址已过期，调用方未重新换取',           'warn',  null,     null,      88,   'SignedUrlExpired: exp=1750000000 now=1750000142'],
      ['语音合成供应商返回 5xx',                     'error', 'pv_304', 'ag_2208', 126,  'TtsUpstreamError: 503 from tts-gateway\n  at TtsClient.synthesize(TtsClient.kt:130)'],
      ['视觉上行帧缺少摄像头授权标记，已丢弃',       'warn',  'pv_305', null,      210,  'VisionFrameRejected: camera consent flag missing'],
      ['审计写入失败后重试成功',                     'warn',  null,     null,      300,  'AuditRetry: first attempt failed with connection reset'],
      ['Proactive Loop 去抖命中，跳过本轮',          'info',  null,     'ag_2210', 6,    null],
      ['Reactive Loop 完成一轮，耗时 1240ms',        'info',  null,     'ag_2203', 2,    null],
      ['记忆固化任务未启用（Phase 1 内延后项）',     'info',  null,     null,      26,   null],
      ['Session 心跳超时，标记为 ended',             'info',  null,     'ag_2207', 4320, null]
    ];
    return rows.map((r, i) => ({
      id: 'er_' + (8001 + i),
      traceId: 'trc_' + (0x9a3f1c + i * 0x11ab).toString(16),
      message: r[0], level: r[1], providerId: r[2], agentId: r[3],
      ts: mins(r[4]), stack: r[5], count: 1 + (i * 3) % 7
    }));
  }

  function seedMedia() {
    const out = [];
    const audioRows = [
      ['u_1042', 'ag_2201', 'ss_4101', 'inbound',  4,    184320, 11.4],
      ['u_1042', 'ag_2201', 'ss_4101', 'outbound', 4,    262144, 16.2],
      ['u_1080', 'ag_2208', 'ss_4102', 'inbound',  12,   98304,  6.1],
      ['u_1080', 'ag_2208', 'ss_4102', 'outbound', 12,   411648, 25.8],
      ['u_1043', 'ag_2203', 'ss_4103', 'inbound',  26,   143360, 8.9],
      ['u_1064', 'ag_2206', 'ss_4106', 'outbound', 9,    327680, 20.4],
      ['u_1117', 'ag_2210', 'ss_4105', 'inbound',  47,   73728,  4.6],
      ['u_1077', 'ag_2207', 'ss_4112', 'outbound', 4320, 196608, 12.3],
      ['u_1096', 'ag_2209', 'ss_4109', 'inbound',  720,  221184, 13.8],
      ['u_1051', 'ag_2204', 'ss_4104', 'outbound', 1440, 524288, 32.7]
    ];
    audioRows.forEach((r, i) => {
      out.push({
        id: 'md_' + (5001 + i), kind: 'audio', direction: r[3],
        userId: r[0], agentId: r[1], sessionId: r[2],
        objectKey: 'retained/audio/' + r[2] + '/' + r[3] + '-' + (5001 + i) + '.ogg',
        bytes: r[5], durationMs: Math.round(r[6] * 1000), codec: 'ogg/opus', sampleRate: 48000,
        createdAt: mins(r[4]), retentionDays: MEDIA_POLICY.audioDays,
        expiresAt: inDays(MEDIA_POLICY.audioDays - r[4] / 1440),
        signedUrl: null, signedExp: 0
      });
    });
    const frameRows = [
      ['u_1051', 'ag_2204', 'ss_4104', 61,  184320, '1280x720'],
      ['u_1064', 'ag_2206', 'ss_4106', 9,   245760, '1280x720'],
      ['u_1042', 'ag_2201', 'ss_4101', 4,   204800, '960x540'],
      ['u_1130', 'ag_2211', 'ss_4108', 33,  311296, '1280x720'],
      ['u_1155', 'ag_2204', 'ss_4110', 128, 174080, '960x540'],
      ['u_1080', 'ag_2208', 'ss_4102', 3,   262144, '1280x720'],
      /* 故意留一条已过 7 天保留期的原帧：换取签名地址会拿到 410，
         用来演示「字节已清理，媒体索引仍然保留」（AgentService §13） */
      ['u_1096', 'ag_2209', 'ss_4109', 10440, 199680, '960x540']
    ];
    frameRows.forEach((r, i) => {
      out.push({
        id: 'md_' + (5101 + i), kind: 'frame', direction: 'inbound',
        userId: r[0], agentId: r[1], sessionId: r[2],
        objectKey: 'retained/vision/' + r[2] + '/frame-' + (5101 + i) + '.jpg',
        bytes: r[4], resolution: r[5],
        createdAt: mins(r[3]), retentionDays: MEDIA_POLICY.frameDays,
        expiresAt: inDays(MEDIA_POLICY.frameDays - r[3] / 1440),
        signedUrl: null, signedExp: 0
      });
    });
    return out;
  }

  function seedAudit() {
    // action, method, path, target, result, actor, role, minsAgo, detail
    const rows = [
      ['identity.update',      'PUT',    '/identities/id_9004',            'AI 身份 id_9004 · Voice',       'success', 'content@ayane.local',  'content_admin',    22,   '收紧 voice.speed 至 0.94'],
      ['memory.patch',         'PUT',    '/memories/mm_7004',              '记忆 mm_7004',                   'success', 'content@ayane.local',  'content_admin',    58,   '按用户原话修正表述'],
      ['media.signed_url',     'POST',   '/media/md_5001/signed-url',      '留存音频 md_5001',               'success', 'sysadmin@ayane.local', 'system_admin',     96,   '签发 120s 短期地址'],
      ['provider.set_default', 'PUT',    '/providers/pv_301/default',      '主推理供应商',                   'success', 'sysadmin@ayane.local', 'system_admin',     180,  '切换默认 LLM 供应商'],
      ['flag.update',          'PUT',    '/flags/vision.frame_upload',     '功能开关 vision.frame_upload',   'success', 'sysadmin@ayane.local', 'system_admin',     340,  '灰度比例 20% → 40%'],
      ['session.inject',       'POST',   '/sessions/ss_4106/debug-events', 'Session ss_4106',                'success', 'sysadmin@ayane.local', 'system_admin',     260,  '注入测试 ClientSignal：用户在场变化'],
      ['user.disable',         'PUT',    '/users/u_1148/status',           '用户 u_1148 · 邵宁',             'success', 'sysadmin@ayane.local', 'system_admin',     8640, '风控标记：疑似批量注册'],
      ['prompt.publish',       'POST',   '/prompts/pt_404/publish',        'Prompt pt_404 · v9',             'success', 'content@ayane.local',  'content_admin',    1200, '收紧输出长度上限'],
      ['agent.reclaim',        'DELETE', '/agents/ag_2212',                'Agent ag_2212',                  'success', 'content@ayane.local',  'content_admin',    8640, '归属用户禁用超 30 天未申诉'],
      ['media.signed_url',     'POST',   '/media/md_5007/signed-url',      '留存音频 md_5007',               'denied',  'content@ayane.local',  'content_admin',    1500, '角色 content_admin 不具备 media:signed_url'],
      ['route.access_denied',  'GET',    '/logs',                          '日志、错误与审计',               'denied',  'content@ayane.local',  'content_admin',    1520, '角色 content_admin 不在 logs 的可访问列表内'],
      ['memory.delete',        'DELETE', '/memories/mm_7099',              '记忆 mm_7099',                   'failed',  'content@ayane.local',  'content_admin',    2100, 'Agent Service 无响应，操作未生效'],
      ['identity.update',      'PUT',    '/identities/id_9001',            'AI 身份 id_9001 · SelfNarrative', 'success', 'content@ayane.local',  'content_admin',    3000, '补充"承认自己不是真人"的自我叙述'],
      ['provider.update',      'PUT',    '/providers/pv_303',              '国产推理供应商',                 'success', 'sysadmin@ayane.local', 'system_admin',     4200, '超时 30s → 20s，重试 2 → 1'],
      ['prompt.rollback',      'POST',   '/prompts/pt_406/rollback',       'Prompt pt_406 · v3 → v2',        'success', 'content@ayane.local',  'content_admin',    5400, '线上出现话痨，回滚到上一版'],
      ['user.reset_password',  'PUT',    '/users/u_1096/password',         '用户 u_1096 · 柏舟',             'success', 'sysadmin@ayane.local', 'system_admin',     6100, '自助找回失败后由后台重置'],
      ['user.create',          'POST',   '/users',                         '用户 u_1169 · 裴予安',           'success', 'sysadmin@ayane.local', 'system_admin',     41 * 1440, '后台开通，来源渠道 beta-invite'],
      ['agent.create',         'POST',   '/agents',                        'Agent ag_2202',                  'success', 'content@ayane.local',  'content_admin',    268 * 1440, '为用户 u_1042 追加第二个 Agent 实例']
    ];
    return rows.map((r, i) => ({
      id: 'aud_seed_' + i, ts: mins(r[7]),
      action: r[0], method: r[1], path: BASE + r[2], target: r[3],
      result: r[4], actor: r[5], actorRole: r[6], detail: r[8], isNew: false
    })).sort((a, b) => b.ts - a.ts);
  }

  function seedAll() {
    DB.users = seedUsers();
    DB.agents = seedAgents();
    DB.identities = seedIdentities();
    DB.memories = seedMemories();
    DB.sessions = seedSessions();
    DB.providers = seedProviders();
    DB.prompts = seedPrompts();
    DB.flags = seedFlags();
    DB.runtime = seedRuntime();
    DB.errors = seedErrors();
    DB.media = seedMedia();
    state.audit.items = seedAudit();
  }

  /* 筛选默认值单独成表：filter.reset 要能只清当前模块，不能把别的页也一起重置 */
  const FILTER_DEFAULTS = {
    users:      { q: '', kind: 'all', status: 'all' },
    agents:     { q: '', owner: 'all', status: 'all' },
    identities: { q: '', status: 'all' },
    memories:   { q: '', type: 'episodic', agent: 'all', status: 'all' },
    sessions:   { q: '', status: 'all', mode: 'all', agent: 'all' },
    providers:  { q: '', kind: 'all', status: 'all', layout: 'grid' },
    prompts:    { q: '', status: 'all' },
    flags:      { q: '', scope: 'all' },
    runtime:    { q: '', resident: 'all' },
    logs:       { tab: 'run', level: 'all', q: '', mineOnly: false, result: 'all' },
    media:      { tab: 'audio', q: '' }
  };

  function initStores() {
    ['dashboard', 'users', 'agents', 'identities', 'memories', 'sessions', 'providers',
      'prompts', 'flags', 'runtime', 'logs', 'audit', 'media'].forEach((k) => {
      state.data[k] = {
        status: 'idle', items: [], total: 0, error: null, tookMs: 0,
        page: 1, pageSize: 12, selection: null, dom: null, loaded: false
      };
    });
    Object.keys(FILTER_DEFAULTS).forEach((k) => {
      state.data[k].filters = Object.assign({}, FILTER_DEFAULTS[k]);
    });
  }

  /* ==========================================================
     03 · 工具
     ========================================================== */

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* 确定性伪随机：同一 seed 恒定，注入的延迟与签名才可复现 */
  function hashStr(str) {
    let h = 0x811c9dc5;
    const s = String(str);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
    return h >>> 0;
  }
  function mulberry32(a) {
    let x = a >>> 0;
    return function () {
      x = (x + 0x6d2b79f5) >>> 0;
      let t = x;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = (seed, n) => mulberry32(hashStr(seed))() * (n || 1);
  const randInt = (seed, min, max) => min + Math.floor(mulberry32(hashStr(seed))() * (max - min + 1));
  const pick = (seed, arr) => arr[Math.floor(rand(seed, arr.length)) % arr.length];
  function randHex(seed) {
    const r = mulberry32(hashStr(seed));
    let s = '';
    for (let i = 0; i < 4; i++) s += Math.floor(r() * 0xffff).toString(16).padStart(4, '0');
    return s;
  }

  const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function escapeHtml(v) {
    if (v === null || v === undefined) return '';
    return String(v).replace(/[&<>"']/g, (c) => ESC_MAP[c]);
  }

  const pad2 = (n) => (n < 10 ? '0' + n : '' + n);
  function formatDateTime(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
      ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }
  function formatClock(ts) {
    const d = new Date(ts);
    return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }
  function formatClockSec(ts) {
    const d = new Date(ts);
    return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  }
  function formatRelative(ts) {
    if (!ts) return '—';
    const diff = ts - Date.now();
    const abs = Math.abs(diff);
    const tail = diff >= 0 ? '后' : '前';
    if (abs < 45000) return '刚刚';
    if (abs < 3600000) return Math.round(abs / 60000) + ' 分钟' + tail;
    if (abs < 86400000) return Math.round(abs / 3600000) + ' 小时' + tail;
    const d = Math.round(abs / 86400000);
    return d < 30 ? d + ' 天' + tail : formatDateTime(ts);
  }
  function formatBytes(n) {
    if (n === null || n === undefined) return '—';
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  }
  function formatDuration(ms) {
    if (ms === null || ms === undefined) return '—';
    const s = Math.round(ms / 1000);
    if (s < 60) return s + '.' + Math.round((ms % 1000) / 100) + 's';
    return Math.floor(s / 60) + 'm' + pad2(s % 60) + 's';
  }
  function formatCountdown(sec) {
    if (sec <= 0) return '已过期';
    if (sec >= 60) return Math.floor(sec / 60) + 'm' + pad2(sec % 60) + 's';
    return sec + 's';
  }
  const daysLeft = (expiresAt) => Math.ceil((expiresAt - Date.now()) / 86400000);
  const clampPct = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
  const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

  const uidSeq = { n: 0 };
  const uid = (prefix) => { uidSeq.n += 1; return prefix + '_' + uidSeq.n; };

  function icon(name, cls) {
    return '<svg class="icon' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false">' +
      '<use href="#' + name + '"></use></svg>';
  }

  /* 相对时间统一走 data-time，30s tick 只改文本不重渲 */
  function timeAgo(ts) {
    if (!ts) return '<span class="muted">—</span>';
    return '<time data-time="' + ts + '" datetime="' + new Date(ts).toISOString() + '" title="' +
      escapeHtml(formatDateTime(ts)) + '">' + escapeHtml(formatRelative(ts)) + '</time>';
  }

  function paginate(items, page, pageSize) {
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const p = Math.min(Math.max(1, page || 1), pages);
    const from = (p - 1) * pageSize;
    return {
      slice: items.slice(from, from + pageSize), total: total, pages: pages, page: p,
      from: total ? from + 1 : 0, to: Math.min(total, from + pageSize)
    };
  }
  function pageNumbers(page, pages) {
    const out = [];
    if (pages <= 7) { for (let i = 1; i <= pages; i++) out.push(i); return out; }
    out.push(1);
    if (page > 3) out.push('gap');
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) out.push(i);
    if (page < pages - 2) out.push('gap');
    out.push(pages);
    return out;
  }
  function findLastIndex(arr, fn) {
    for (let i = arr.length - 1; i >= 0; i--) if (fn(arr[i], i)) return i;
    return -1;
  }
  function flattenValue(v) {
    if (v === null || v === undefined || v === '') return '（空）';
    if (Array.isArray(v)) return v.length ? v.join('、') : '（空）';
    return String(v);
  }

  /* is-loading 与权限 disabled 互不覆盖：applyGuards 会写 data-perm-disabled */
  function setBusy(el, on) {
    if (!el) return;
    el.classList.toggle('is-loading', !!on);
    el.setAttribute('aria-busy', on ? 'true' : 'false');
    el.disabled = on ? true : el.dataset.permDisabled === '1';
  }

  /* ==========================================================
     04 · adminApi 模拟层 + 演示注入
     对应架构文档 §3：管理后台只走 /admin 这一个 BaseURL，不调用 Client API，
     也不直连数据库。能力校验、403/409/410/502 全部发生在这一层。
     ========================================================== */

  class ApiError extends Error {
    constructor(status, message, detail) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.detail = detail || null;
    }
  }

  const actorAccount = () => (state.admin && state.admin.account) || ROLE_LABELS[state.role].account;

  const findUser = (id) => DB.users.find((u) => u.id === id) || null;
  const findAgent = (id) => DB.agents.find((a) => a.id === id) || null;
  const findIdentity = (id) => DB.identities.find((x) => x.id === id) || null;
  const findMemory = (id) => DB.memories.find((m) => m.id === id) || null;
  const findSession = (id) => DB.sessions.find((s) => s.id === id) || null;
  const findProvider = (id) => DB.providers.find((p) => p.id === id) || null;
  const findPrompt = (id) => DB.prompts.find((p) => p.id === id) || null;
  const findFlag = (key) => DB.flags.find((f) => f.key === key) || null;
  const findMedia = (id) => DB.media.find((m) => m.id === id) || null;
  const agentCountOf = (userId) => DB.agents.filter((a) => a.ownerId === userId && a.status !== 'reclaimed').length;

  function notFound(kind, id) { throw new ApiError(404, kind + ' ' + id + ' 不存在'); }
  function maskKey(plain) {
    const s = String(plain).trim();
    return (s.slice(0, 3) || 'sk-') + '••••' + (s.slice(-4) || '0000');
  }
  function extractVars(body) {
    const out = [];
    const re = /\{\{\s*([a-zA-Z0-9_.\-]+)\s*\}\}/g;
    let m;
    while ((m = re.exec(String(body))) !== null) if (!out.includes(m[1])) out.push(m[1]);
    return out;
  }

  const ROUTES = [
    /* ---- 登录：Admin API 换取 Admin Token。角色由 Token 决定，前端改不了；
           顶栏的「切换角色」是原型专用的演示开关，等价于换一枚别的 Token 重新登录。 ---- */
    {
      method: 'POST', pattern: /^\/auth\/login$/, handler: (b) => {
        const role = ROLE_LABELS[b.role] ? b.role : 'read_only_admin';
        return {
          token: 'admtok_' + hashStr(String(b.account) + '|' + role).toString(36) + '.mock',
          admin: { id: 'adm_' + role, name: ROLE_LABELS[role].name, account: b.account, role: role }
        };
      }
    },
    /* ---- 读：返回整份内存集合，筛选与分页在视图层做 ---- */
    { method: 'GET', pattern: /^\/users$/, handler: () => ({ items: DB.users.slice(), total: DB.users.length }) },
    { method: 'GET', pattern: /^\/agents$/, handler: () => ({ items: DB.agents.slice(), total: DB.agents.length }) },
    { method: 'GET', pattern: /^\/identities$/, handler: () => ({ items: DB.identities.slice(), total: DB.identities.length }) },
    { method: 'GET', pattern: /^\/memories$/, handler: () => ({ items: DB.memories.slice(), total: DB.memories.length }) },
    { method: 'GET', pattern: /^\/sessions$/, handler: () => ({ items: DB.sessions.slice(), total: DB.sessions.length }) },
    { method: 'GET', pattern: /^\/providers$/, handler: () => ({ items: DB.providers.slice(), total: DB.providers.length }) },
    { method: 'GET', pattern: /^\/prompts$/, handler: () => ({ items: DB.prompts.slice(), total: DB.prompts.length }) },
    { method: 'GET', pattern: /^\/flags$/, handler: () => ({ items: DB.flags.slice(), total: DB.flags.length }) },
    { method: 'GET', pattern: /^\/runtime\/instances$/, handler: () => ({ items: DB.runtime.slice(), total: DB.runtime.length }) },
    { method: 'GET', pattern: /^\/logs\/errors$/, handler: () => ({ items: DB.errors.slice(), total: DB.errors.length }) },
    { method: 'GET', pattern: /^\/logs\/audit$/, handler: () => ({ items: state.audit.items.slice(), total: state.audit.items.length }) },
    { method: 'GET', pattern: /^\/media$/, handler: () => ({ items: DB.media.slice(), total: DB.media.length, policy: MEDIA_POLICY }) },

    /* ---- 用户生命周期：三个写操作仅 system_admin（capability 在 request 里校验）---- */
    {
      method: 'POST', pattern: /^\/users$/, handler: (b) => {
        if (!b.name || !String(b.name).trim()) throw new ApiError(422, '用户昵称必填');
        if (b.handle && DB.users.some((u) => u.handle === b.handle)) throw new ApiError(409, '账号名 ' + b.handle + ' 已被占用');
        const id = 'u_' + (1170 + DB.users.length);
        const u = {
          id: id, name: String(b.name).trim(), handle: String(b.handle || 'user' + id.slice(2)).trim(),
          kind: b.kind || 'public', status: 'pending',
          createdAt: Date.now(), lastActiveAt: Date.now(), deviceCount: 0,
          region: b.region || '华东 1', quota: { used: 0, limit: clampPct(b.quotaLimit) ? Math.min(20, Number(b.quotaLimit)) : 3 },
          email: b.email ? String(b.email).trim() : (b.handle || 'user') + '@example.com',
          lifecycle: [{ ts: Date.now(), action: 'user.create', actor: actorAccount(), note: b.note || '通过管理后台开通' }]
        };
        DB.users.unshift(u);
        return { item: u, detail: '已开通用户 ' + u.name + '（' + u.id + '）；初始口令经带内渠道下发，服务端只保存哈希' };
      }
    },
    {
      method: 'PUT', pattern: /^\/users\/([^/]+)\/password$/, handler: (b, p) => {
        const u = findUser(p[0]) || notFound('用户', p[0]);
        if (!b.reason || !String(b.reason).trim()) throw new ApiError(422, '重置口令必须填写原因，原因会写入审计');
        u.lifecycle.push({ ts: Date.now(), action: 'user.reset_password', actor: actorAccount(), note: String(b.reason).trim() });
        return { item: u, detail: '已重置 ' + u.name + ' 的登录口令；明文不入库、后台也不回显' };
      }
    },
    {
      method: 'PUT', pattern: /^\/users\/([^/]+)\/status$/, handler: (b, p) => {
        const u = findUser(p[0]) || notFound('用户', p[0]);
        if (u.status === b.status) throw new ApiError(409, '用户已经是「' + b.status + '」状态');
        if (!['active', 'disabled', 'pending'].includes(b.status)) throw new ApiError(422, '不支持的用户状态：' + b.status);
        if (!b.reason || !String(b.reason).trim()) throw new ApiError(422, '状态变更必须填写原因，原因会写入审计');
        u.status = b.status;
        u.lifecycle.push({
          ts: Date.now(), action: b.status === 'disabled' ? 'user.disable' : 'user.enable',
          actor: actorAccount(), note: String(b.reason).trim()
        });
        return {
          item: u,
          detail: b.status === 'disabled'
            ? '已禁用 ' + u.name + '；名下 ' + agentCountOf(u.id) + ' 个 Agent 实例的运行时会在下一轮 tick 停止，但数据保留'
            : '已恢复 ' + u.name + ' 的访问'
        };
      }
    },
    {
      method: 'PUT', pattern: /^\/users\/([^/]+)\/agent-quota$/, handler: (b, p) => {
        const u = findUser(p[0]) || notFound('用户', p[0]);
        const limit = Math.max(1, Math.min(20, Number(b.limit) || u.quota.limit));
        const used = agentCountOf(u.id);
        if (limit < used) throw new ApiError(409, '配额下限不能低于当前已占用的 ' + used + ' 个 Agent 实例');
        u.quota.limit = limit;
        u.quota.used = used;
        u.lifecycle.push({ ts: Date.now(), action: 'user.quota_update', actor: actorAccount(), note: 'Agent 配额调整为 ' + limit + '（原因：' + (b.reason || '未填写') + '）' });
        return { item: u, detail: '已把 ' + u.name + ' 的 Agent 配额调整为 ' + used + '/' + limit };
      }
    },
    {
      method: 'DELETE', pattern: /^\/users\/([^/]+)$/, handler: (b, p) => {
        const u = findUser(p[0]) || notFound('用户', p[0]);
        if (u.status === 'active' && !b.force) throw new ApiError(409, '活跃用户需先禁用再删除，或勾选「我知道这不可恢复」');
        const ags = DB.agents.filter((a) => a.ownerId === u.id);
        const agIds = ags.map((a) => a.id);
        const cascade = {
          agents: agIds.length,
          identities: DB.identities.filter((x) => agIds.includes(x.agentId)).length,
          memories: DB.memories.filter((m) => agIds.includes(m.agentId)).length,
          sessions: DB.sessions.filter((s) => s.userId === u.id).length,
          media: DB.media.filter((m) => m.userId === u.id).length
        };
        DB.users = DB.users.filter((x) => x.id !== u.id);
        DB.agents = DB.agents.filter((a) => a.ownerId !== u.id);
        DB.identities = DB.identities.filter((x) => !agIds.includes(x.agentId));
        DB.memories = DB.memories.filter((m) => !agIds.includes(m.agentId));
        DB.sessions = DB.sessions.filter((s) => s.userId !== u.id);
        DB.media = DB.media.filter((m) => m.userId !== u.id);
        DB.runtime = DB.runtime.filter((r) => !agIds.includes(r.agentId));
        return {
          cascade: cascade,
          detail: '已删除用户 ' + u.name + '，级联清理 ' + cascade.agents + ' 个 Agent 实例 / ' +
            cascade.identities + ' 个 AI 身份 / ' + cascade.memories + ' 条记忆 / ' +
            cascade.sessions + ' 个 Session / ' + cascade.media + ' 个留存媒体对象；审计记录按保留期另行留存'
        };
      }
    },

    /* ---- Agent 归属登记与回收 ---- */
    {
      method: 'POST', pattern: /^\/agents$/, handler: (b) => {
        const owner = findUser(b.ownerId) || notFound('用户', b.ownerId);
        if (owner.status === 'disabled') throw new ApiError(409, '归属用户已被禁用，不能为其登记新的 Agent 实例');
        const used = agentCountOf(owner.id);
        if (used >= owner.quota.limit) throw new ApiError(409, '已达配额上限：' + owner.name + ' 名下 ' + used + '/' + owner.quota.limit);
        if (!b.name || !String(b.name).trim()) throw new ApiError(422, 'Agent 名称必填');
        const id = 'ag_' + (2213 + DB.agents.length);
        const ag = {
          id: id, ownerId: owner.id, name: String(b.name).trim(), isDefault: used === 0,
          status: 'active', identityId: 'id_' + (9100 + DB.identities.length),
          createdAt: Date.now(), lastRunAt: Date.now(), stateVersion: 1, resident: false,
          reclaimedAt: null, reclaimReason: null
        };
        DB.agents.unshift(ag);
        DB.identities.unshift({
          id: ag.identityId, agentId: ag.id, agentName: ag.name, ownerName: owner.name,
          version: 1, status: 'draft', updatedAt: Date.now(), updatedBy: actorAccount(),
          sections: {
            personality: JSON.parse(JSON.stringify(IDENTITY_BASE.personality)),
            voice: JSON.parse(JSON.stringify(IDENTITY_BASE.voice)),
            aesthetic: JSON.parse(JSON.stringify(IDENTITY_BASE.aesthetic)),
            boundaries: JSON.parse(JSON.stringify(IDENTITY_BASE.boundaries)),
            selfNarrative: JSON.parse(JSON.stringify(IDENTITY_BASE.selfNarrative)),
            versionMeta: {
              version: 1, status: 'draft', updatedAt: Date.now(), updatedBy: actorAccount(),
              changeNote: '随 Agent 实例创建，由模板派生', sourceVersion: 0
            }
          },
          history: [{ version: 1, ts: Date.now(), actor: actorAccount(), note: '初始版本，由模板派生，尚未发布', diff: [] }]
        });
        owner.quota.used = used + 1;
        return { item: ag, detail: '已为用户 ' + owner.name + ' 登记 Agent 实例 ' + ag.name + '，配额 ' + (used + 1) + '/' + owner.quota.limit };
      }
    },
    {
      method: 'DELETE', pattern: /^\/agents\/([^/]+)$/, handler: (b, p) => {
        const ag = findAgent(p[0]) || notFound('Agent 实例', p[0]);
        if (ag.status === 'reclaimed') throw new ApiError(409, 'Agent 实例已回收，无需重复操作');
        if (!b.reason || !String(b.reason).trim()) throw new ApiError(422, '回收必须填写原因，原因会写入审计');
        ag.status = 'reclaimed';
        ag.reclaimedAt = Date.now();
        ag.reclaimReason = String(b.reason).trim();
        ag.resident = false;
        DB.runtime = DB.runtime.filter((r) => r.agentId !== ag.id);
        DB.sessions.filter((s) => s.agentId === ag.id && s.status === 'active').forEach((s) => { s.status = 'ended'; });
        return { item: ag, detail: '已回收 ' + ag.name + '；State 常驻已释放，记忆与审计按保留期留存' };
      }
    },

    /* ---- AI 身份：后台是唯一写入口，运行时只读 ---- */
    {
      method: 'PUT', pattern: /^\/identities\/([^/]+)$/, handler: (b, p) => {
        const it = findIdentity(p[0]) || notFound('AI 身份', p[0]);
        if (!it.sections[b.section]) throw new ApiError(422, '未知的 Identity 分区：' + b.section);
        if (!b.note || !String(b.note).trim()) throw new ApiError(422, '变更说明必填，Identity 的每次写入都要能被追溯');
        if (b.section === 'selfNarrative') throw new ApiError(403, 'SelfNarrative 的边界内自我修正是 Phase 1 内延后项，本次不允许写入', DEFERRED.selfNarrative);
        const sec = it.sections[b.section];
        const diff = [];
        Object.keys(b.value || {}).forEach((k) => {
          const from = flattenValue(sec[k]);
          const to = flattenValue(b.value[k]);
          if (from !== to) diff.push({ field: b.section + '.' + k, kind: 'is-changed', from: from, to: to });
        });
        if (!diff.length) throw new ApiError(409, '没有检测到字段变化');
        Object.keys(b.value).forEach((k) => { sec[k] = b.value[k]; });
        it.version += 1;
        it.status = 'published';
        it.updatedAt = Date.now();
        it.updatedBy = actorAccount();
        it.sections.versionMeta = {
          version: it.version, status: 'published', updatedAt: it.updatedAt, updatedBy: it.updatedBy,
          changeNote: String(b.note).trim(), sourceVersion: it.version - 1
        };
        it.history.unshift({ version: it.version, ts: it.updatedAt, actor: it.updatedBy, note: it.sections.versionMeta.changeNote, diff: diff });
        return { item: it, detail: 'AI 身份 ' + it.id + ' 已更新到 v' + it.version + '，运行时下一轮 tick 读到新版本' };
      }
    },

    /* ---- 记忆修正与删除 ---- */
    {
      method: 'PUT', pattern: /^\/memories\/([^/]+)$/, handler: (b, p) => {
        const m = findMemory(p[0]) || notFound('记忆', p[0]);
        if (!b.content || !String(b.content).trim()) throw new ApiError(422, '修正后的内容不能为空');
        if (!b.reason || !String(b.reason).trim()) throw new ApiError(422, '修正原因必填，会写入审计');
        m.corrections.unshift({
          ts: Date.now(), actor: actorAccount(), from: m.content,
          to: String(b.content).trim(), note: String(b.reason).trim()
        });
        m.content = String(b.content).trim();
        m.status = 'corrected';
        m.confidence = Math.max(0.5, +(m.confidence - 0.02).toFixed(2));
        return { item: m, detail: '记忆 ' + m.id + ' 已修正；修正前的文本保留在修正历史中，不会被覆盖' };
      }
    },
    {
      method: 'DELETE', pattern: /^\/memories\/([^/]+)$/, handler: (b, p) => {
        const m = findMemory(p[0]) || notFound('记忆', p[0]);
        DB.memories = DB.memories.filter((x) => x.id !== m.id);
        return { detail: '记忆 ' + m.id + ' 已删除；删除动作本身保留在审计中' };
      }
    },

    /* ---- Session 调试注入 ---- */
    {
      method: 'POST', pattern: /^\/sessions\/([^/]+)\/debug-events$/, handler: (b, p) => {
        const s = findSession(p[0]) || notFound('Session', p[0]);
        if (s.status === 'ended') throw new ApiError(409, 'Session 已结束，不能再注入调试事件');
        if (!b.text || !String(b.text).trim()) throw new ApiError(422, '事件内容必填');
        s.buffer.push({
          idx: s.buffer.length + 1, kind: 'perception', injected: true,
          text: '调试注入 · ' + String(b.text).trim(), ts: Date.now(), evicted: false
        });
        while (s.buffer.length > 8) s.buffer.shift();
        s.buffer.forEach((slot, i) => { slot.idx = i + 1; });
        s.lastEventAt = Date.now();
        return { item: s, detail: '已向 Session ' + s.id + ' 的 Working Memory Buffer 注入测试感知事件' };
      }
    },

    /* ---- 模型供应商：密钥只存服务端 Secret ---- */
    {
      method: 'POST', pattern: /^\/providers$/, handler: (b) => {
        if (!b.name || !String(b.name).trim()) throw new ApiError(422, '供应商名称必填');
        if (!b.baseUrl || !/^https?:\/\//.test(String(b.baseUrl).trim())) throw new ApiError(422, 'Base URL 必须以 http:// 或 https:// 开头');
        if (!b.secretRef || !/^[A-Z][A-Z0-9_]{3,}$/.test(String(b.secretRef).trim())) throw new ApiError(422, 'Secret 引用名需为 4 位以上大写字母、数字或下划线，且以字母开头');
        const id = 'pv_' + (306 + DB.providers.length);
        const p = {
          id: id, name: String(b.name).trim(), kind: b.kind || 'llm',
          baseUrl: String(b.baseUrl).trim(), secretRef: String(b.secretRef).trim(),
          maskedKey: b.plainKey ? maskKey(b.plainKey) : 'sk-••••' + randHex(id).slice(0, 4),
          isDefault: false, status: 'unknown', latencyMs: 0, calls24h: 0, errorRate: 0,
          model: b.model ? String(b.model).trim() : '—',
          updatedAt: Date.now(), updatedBy: actorAccount(), lastPingAt: null,
          history: [{ ts: Date.now(), actor: actorAccount(), note: '新增供应商配置，密钥写入 ' + String(b.secretRef).trim() }]
        };
        DB.providers.push(p);
        return { item: p, detail: '已新增 ' + p.name + '；密钥只写入服务端 Secret，后台保存的是引用名与掩码' };
      }
    },
    {
      method: 'PUT', pattern: /^\/providers\/([^/]+)$/, handler: (b, p) => {
        const pv = findProvider(p[0]) || notFound('供应商', p[0]);
        const changes = [];
        ['name', 'kind', 'baseUrl', 'secretRef', 'model'].forEach((k) => {
          if (b[k] !== undefined && String(b[k]).trim() !== pv[k]) { changes.push(k); pv[k] = String(b[k]).trim(); }
        });
        if (b.secretRef && !/^[A-Z][A-Z0-9_]{3,}$/.test(b.secretRef)) throw new ApiError(422, 'Secret 引用名需为 4 位以上大写字母、数字或下划线');
        if (b.plainKey) { pv.maskedKey = maskKey(b.plainKey); changes.push('密钥（已轮换）'); }
        pv.updatedAt = Date.now();
        pv.updatedBy = actorAccount();
        pv.history.unshift({ ts: Date.now(), actor: pv.updatedBy, note: changes.length ? '修改字段：' + changes.join('、') : '提交但未检测到字段变化' });
        return { item: pv, detail: changes.length ? '已更新 ' + pv.name + '：' + changes.join('、') : '未检测到字段变化，配置保持原样' };
      }
    },
    {
      method: 'PUT', pattern: /^\/providers\/([^/]+)\/default$/, handler: (b, p) => {
        const pv = findProvider(p[0]) || notFound('供应商', p[0]);
        if (pv.isDefault) throw new ApiError(409, pv.name + ' 已经是该类型的默认供应商');
        DB.providers.forEach((x) => {
          if (x.kind === pv.kind && x.id !== pv.id && x.isDefault) {
            x.isDefault = false;
            x.history.unshift({ ts: Date.now(), actor: actorAccount(), note: '取消默认，切换到 ' + pv.name });
          }
        });
        pv.isDefault = true;
        pv.updatedAt = Date.now();
        pv.history.unshift({ ts: Date.now(), actor: actorAccount(), note: '设为 ' + pv.kind + ' 类型默认供应商' });
        return { item: pv, detail: '已把 ' + pv.name + ' 设为默认；切换供应商不改变 Prompt 内容，也不改变 Agent 运行时行为' };
      }
    },
    {
      method: 'POST', pattern: /^\/providers\/([^/]+)\/ping$/, handler: (b, p) => {
        const pv = findProvider(p[0]) || notFound('供应商', p[0]);
        pv.lastPingAt = Date.now();
        if (pv.status === 'down') throw new ApiError(502, '连通性测试失败：上游网关在 10s 内未建立连接', '本次失败已记入审计，供应商仍标记为 down');
        pv.latencyMs = Math.max(120, Math.round(pv.latencyMs * 0.9 + randInt(pv.id + ':ping:' + Math.floor(Date.now() / 60000), 60, 320)));
        pv.status = pv.latencyMs > 1200 ? 'degraded' : 'ok';
        return { item: pv, latencyMs: pv.latencyMs, detail: '连通性测试通过，首字节延迟 ' + pv.latencyMs + 'ms' };
      }
    },

    /* ---- Prompt 模板：fork 草稿 → 编辑 → 发布 / 回滚 ---- */
    {
      method: 'POST', pattern: /^\/prompts$/, handler: (b) => {
        const src = findPrompt(b.fromId) || notFound('Prompt', b.fromId);
        if (src.status === 'draft') throw new ApiError(409, src.id + ' 已经是草稿，直接编辑即可');
        const id = 'pt_' + (407 + DB.prompts.filter((x) => x.id.startsWith('pt_4')).length);
        const p = JSON.parse(JSON.stringify(src));
        p.id = id;
        p.version = src.version + 1;
        p.status = 'draft';
        p.updatedAt = Date.now();
        p.updatedBy = actorAccount();
        p.changeNote = b.note ? String(b.note).trim() : '从 v' + src.version + ' fork 草稿';
        p.history = [{ version: p.version, ts: p.updatedAt, actor: p.updatedBy, note: p.changeNote, status: 'draft' }]
          .concat(src.history.map((h) => Object.assign({}, h, { status: 'archived' })));
        DB.prompts.unshift(p);
        return { item: p, detail: '已 fork 出草稿 ' + p.id + ' · v' + p.version + '；草稿不参与线上拼装' };
      }
    },
    {
      method: 'PUT', pattern: /^\/prompts\/([^/]+)$/, handler: (b, p) => {
        const pt = findPrompt(p[0]) || notFound('Prompt', p[0]);
        if (pt.status !== 'draft') throw new ApiError(409, '只有草稿可以编辑，' + pt.status + ' 版本请先 fork');
        if (b.body === undefined || !String(b.body).trim()) throw new ApiError(422, '模板正文不能为空');
        pt.body = String(b.body);
        pt.vars = extractVars(pt.body);
        pt.updatedAt = Date.now();
        pt.updatedBy = actorAccount();
        pt.changeNote = b.note ? String(b.note).trim() : '编辑草稿正文';
        pt.history[0] = { version: pt.version, ts: pt.updatedAt, actor: pt.updatedBy, note: pt.changeNote, status: 'draft' };
        return { item: pt, detail: '草稿 ' + pt.id + ' 已保存，识别到 ' + pt.vars.length + ' 个 {{变量}}' };
      }
    },
    {
      method: 'POST', pattern: /^\/prompts\/([^/]+)\/publish$/, handler: (b, p) => {
        const pt = findPrompt(p[0]) || notFound('Prompt', p[0]);
        if (pt.status === 'published') throw new ApiError(409, pt.id + ' 已经是发布态');
        if (!b.note || !String(b.note).trim()) throw new ApiError(422, '发布必须填写变更说明，说明会写入审计');
        const vars = extractVars(pt.body);
        if (!vars.length) throw new ApiError(422, '模板里没有任何 {{变量}}，无法参与拼装');
        DB.prompts.forEach((x) => {
          if (x.id !== pt.id && x.purpose === pt.purpose && x.status === 'published') {
            x.status = 'archived';
            x.history.unshift({ version: x.version, ts: Date.now(), actor: actorAccount(), note: '被 v' + pt.version + ' 取代，转为归档', status: 'archived' });
          }
        });
        pt.status = 'published';
        pt.vars = vars;
        pt.updatedAt = Date.now();
        pt.updatedBy = actorAccount();
        pt.changeNote = String(b.note).trim();
        pt.history[0] = { version: pt.version, ts: pt.updatedAt, actor: pt.updatedBy, note: pt.changeNote, status: 'published' };
        return { item: pt, detail: '已发布 ' + pt.purpose + ' v' + pt.version + '，下一次 LLM 调用开始生效' };
      }
    },
    {
      method: 'POST', pattern: /^\/prompts\/([^/]+)\/rollback$/, handler: (b, p) => {
        const pt = findPrompt(p[0]) || notFound('Prompt', p[0]);
        const target = Number(b.version);
        const h = pt.history.find((x) => x.version === target);
        if (!h) throw new ApiError(422, 'v' + b.version + ' 不在 ' + pt.id + ' 的版本历史中');
        if (target === pt.version && pt.status === 'published') throw new ApiError(409, '当前已经是 v' + target + ' 的发布态');
        const from = pt.version;
        pt.version = target;
        pt.status = 'published';
        pt.updatedAt = Date.now();
        pt.updatedBy = actorAccount();
        pt.changeNote = '从 v' + from + ' 回滚到 v' + target;
        pt.history.unshift({ version: target, ts: pt.updatedAt, actor: pt.updatedBy, note: pt.changeNote, status: 'published' });
        DB.prompts.forEach((x) => {
          if (x.id !== pt.id && x.purpose === pt.purpose && x.status === 'published') x.status = 'archived';
        });
        return { item: pt, detail: pt.purpose + ' 已回滚到 v' + target + '，回滚动作本身也记入审计' };
      }
    },

    /* ---- 功能开关与灰度规则 ---- */
    {
      method: 'PUT', pattern: /^\/flags\/([^/]+)$/, handler: (b, p) => {
        const f = findFlag(decodeURIComponent(p[0])) || notFound('功能开关', p[0]);
        const changes = [];
        if (b.enabled !== undefined && b.enabled !== f.enabled) {
          changes.push('开关 ' + (f.enabled ? '开 → 关' : '关 → 开'));
          f.enabled = b.enabled;
        }
        if (b.rule) {
          const r = f.rule;
          if (b.rule.percent !== undefined && clampPct(b.rule.percent) !== r.percent) {
            changes.push('灰度比例 ' + r.percent + '% → ' + clampPct(b.rule.percent) + '%');
            r.percent = clampPct(b.rule.percent);
          }
          if (b.rule.whitelist !== undefined) {
            changes.push('白名单 ' + r.whitelist.length + ' → ' + b.rule.whitelist.length + ' 个用户');
            r.whitelist = b.rule.whitelist.slice();
          }
          if (b.rule.platforms !== undefined) {
            changes.push('平台 ' + (r.platforms.join('/') || '无') + ' → ' + (b.rule.platforms.join('/') || '无'));
            r.platforms = b.rule.platforms.slice();
          }
          if (b.rule.envs !== undefined) {
            changes.push('环境 ' + r.envs.join('/') + ' → ' + b.rule.envs.join('/'));
            r.envs = b.rule.envs.slice();
          }
        }
        if (!changes.length) return { item: f, detail: f.key + ' 的规则未发生变化' };
        f.updatedAt = Date.now();
        f.updatedBy = actorAccount();
        f.history.unshift({ ts: f.updatedAt, actor: f.updatedBy, note: changes.join('；') });
        return { item: f, detail: f.key + ' 已更新：' + changes.join('；') };
      }
    },

    /* ---- 留存媒体：短期签名地址，每次换取都记审计 ---- */
    {
      method: 'POST', pattern: /^\/media\/([^/]+)\/signed-url$/, handler: (b, p) => {
        const m = findMedia(p[0]) || notFound('留存媒体', p[0]);
        if (Date.now() > m.expiresAt) {
          throw new ApiError(410, '该' + (m.kind === 'audio' ? '音频留存' : '视觉留存') + '已超过保留期，对象存储中的字节已被清理',
            '保留期 ' + m.retentionDays + ' 天，到期时间 ' + formatDateTime(m.expiresAt) + '；媒体索引仍然保留');
        }
        const exp = Math.floor(Date.now() / 1000) + MEDIA_POLICY.signedTtlSec;
        m.signedUrl = 'https://retained-cdn.ayane.local/' + m.objectKey + '?sig=' + randHex(m.id + ':' + exp) + '&exp=' + exp;
        m.signedExp = exp * 1000;
        return {
          item: m, signedUrl: m.signedUrl, signedExp: m.signedExp, ttlSec: MEDIA_POLICY.signedTtlSec,
          detail: '已签发 ' + MEDIA_POLICY.signedTtlSec + 's 短期地址，本次访问已写入审计'
        };
      }
    }
  ];

  const adminApi = {
    async request(method, path, opts) {
      const o = opts || {};
      const startedAt = performance.now();
      await sleep(state.chaos.mode === 'slow' ? 1400 : 180 + rand(method + ' ' + path, 420));

      /* API 级权限：即使前端按钮被绕过，这里仍然会拒绝 */
      if (o.capability) {
        const allow = API_ACL[o.capability];
        if (!allow) throw new ApiError(500, '未知的能力标识：' + o.capability);
        if (!allow.includes(state.role)) {
          throw new ApiError(403,
            '当前角色（' + ROLE_LABELS[state.role].name + '）无权调用 ' + method + ' ' + BASE + path,
            (o.reason || '') + '缺少能力 ' + o.capability + '；Admin API 在服务端会再校验一次');
        }
      }

      const chaos = state.chaos.mode;
      if (chaos === '403') throw new ApiError(403, '模拟 403：Admin Token 权限不足', '演示注入已开启，可在顶栏「演示」菜单关闭');
      if (chaos === '500') throw new ApiError(500, '模拟 500：Agent Service 无响应', '演示注入已开启，可在顶栏「演示」菜单关闭');
      if (chaos === 'empty' && method === 'GET') return { tookMs: performance.now() - startedAt, items: [], total: 0 };

      const route = ROUTES.find((r) => r.method === method && r.pattern.test(path));
      if (!route) throw new ApiError(404, 'Admin API 没有这个端点：' + method + ' ' + BASE + path);
      const m = path.match(route.pattern);
      const res = route.handler(o.body || {}, m ? m.slice(1) : []);
      return Object.assign({ tookMs: performance.now() - startedAt }, res || {});
    },
    list: (path) => adminApi.request('GET', path),
    create: (path, body, capability, reason) => adminApi.request('POST', path, { body: body, capability: capability, reason: reason }),
    update: (path, body, capability, reason) => adminApi.request('PUT', path, { body: body, capability: capability, reason: reason }),
    remove: (path, body, capability, reason) => adminApi.request('DELETE', path, { body: body, capability: capability, reason: reason }),
    issueSignedUrl: (id, reason) => adminApi.request('POST', '/media/' + id + '/signed-url', { capability: 'media:signed_url', reason: reason })
  };

  function handleApiError(err) {
    const e = err instanceof ApiError ? err : new ApiError(0, (err && err.message) || '未知错误');
    if (e.status === 403 && !canRoute(state.route.module)) {
      toast('403 · ' + e.message + '，已跳转到统一拒绝页', 'error');
      if (location.hash.indexOf('#/403') !== 0) location.hash = '#/403?from=' + encodeURIComponent(state.route.module);
      return e;
    }
    toast((e.status ? e.status + ' · ' : '') + e.message, 'error');
    return e;
  }

  function setChaos(mode, opts) {
    const next = CHAOS_MODES.some((m) => m.key === mode) ? mode : 'none';
    state.chaos.mode = next;
    closePopover();
    renderChaosMenu();
    if (!(opts && opts.silent)) {
      const m = CHAOS_MODES.find((x) => x.key === next);
      toast(next === 'none' ? '演示注入已关闭，Admin API 恢复正常返回' : '已注入「' + m.label + '」：' + m.desc,
        next === 'none' ? 'ok' : 'warn');
    }
    reloadModule(state.route.module);
  }

  /* ==========================================================
     05 · 权限（路由级 / 组件级 / API 级共用同一份字典）
     ========================================================== */

  const can = (capability) => !!API_ACL[capability] && API_ACL[capability].includes(state.role);
  const canRoute = (module) => !!ROUTE_ACL[module] && ROUTE_ACL[module].includes(state.role);
  const guardAttr = (capability, reason) =>
    ' data-requires="' + capability + '" data-reason="' + escapeHtml(reason || '') + '"';

  /* 无权限不隐藏按钮，而是 disabled + 原因气泡：权限分层因此"可演示"而不是"看不见"（规避走查 #13）。
     data-deferred 走同一套外壳，用来标 Phase 1 内延后项——它和"没权限"是两件事，但都需要能被键盘用户预知。 */
  let guardSeq = 0;
  function blockWithTip(el, reason) {
    el.dataset.permDisabled = '1';
    el.disabled = true;
    el.setAttribute('aria-disabled', 'true');
    /* 页头动作在 ≤639 会同时存在「原按钮 + 更多菜单里的副本」，所以 tipId 必须单调递增，
       不能用 token 哈希——否则两份副本会撞出重复 id（规避走查 #13）。 */
    guardSeq += 1;
    const tipId = 'guard-tip-' + guardSeq;
    const wrap = document.createElement('span');
    wrap.className = 'permission-guard';
    el.parentNode.insertBefore(wrap, el);
    wrap.appendChild(el);
    const tip = document.createElement('span');
    tip.className = 'guard-tip';
    tip.id = tipId;
    tip.setAttribute('role', 'note');
    tip.textContent = reason;
    wrap.appendChild(tip);
    /* disabled 的按钮不进 Tab 序列，键盘用户就永远打不开原因气泡，
       所以由包装元素自己接管焦点，并把同一条原因挂成它的描述。 */
    wrap.tabIndex = 0;
    wrap.setAttribute('aria-describedby', tipId);
    const described = el.getAttribute('aria-describedby');
    el.setAttribute('aria-describedby', described ? described + ' ' + tipId : tipId);
  }

  function applyGuards(root) {
    const scope = root || document;
    $$('[data-requires]', scope).forEach((el) => {
      if (el.dataset.guarded === '1') return;
      el.dataset.guarded = '1';
      if (can(el.dataset.requires)) return;
      blockWithTip(el, el.dataset.reason ||
        '当前角色（' + ROLE_LABELS[state.role].name + '）无权执行此操作');
    });
    $$('[data-deferred]', scope).forEach((el) => {
      if (el.dataset.guarded === '1') return;
      el.dataset.guarded = '1';
      const key = el.dataset.deferred;
      blockWithTip(el, el.dataset.reason || DEFERRED[key] || '该项在 Phase 1 内延后');
    });
  }

  /* ==========================================================
     06 · 浮层与焦点（规避走查 #10：焦点必须归还，Tab 不能逃逸）
     ========================================================== */

  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
    'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function restoreFocus(el) {
    if (el && el.isConnected && typeof el.focus === 'function' && el.getClientRects().length) {
      el.focus({ preventScroll: true });
      return;
    }
    refs.pageHead.focus({ preventScroll: true });
  }

  function pushLayer(kind, cfg) {
    state.layers.push({ kind: kind, id: cfg.id || kind, cfg: cfg, returnFocus: document.activeElement });
  }
  const topLayer = () => state.layers[state.layers.length - 1] || null;

  function openDrawer(cfg) {
    closeLayer('drawer');
    refs.drawer.className = 'drawer is-open' + (cfg.lg ? ' drawer--lg' : '');
    refs.drawer.innerHTML =
      '<div class="drawer-head">' +
        (cfg.icon ? icon(cfg.icon) : '') +
        '<div class="drawer-head-copy">' +
          '<h2 id="drawer-title">' + escapeHtml(cfg.title) + '</h2>' +
          (cfg.desc ? '<p>' + cfg.desc + '</p>' : '') +
        '</div>' +
        (cfg.headExtra || '') +
        '<button class="icon-btn" type="button" data-action="layer.close" data-kind="drawer" aria-label="关闭详情">' +
          icon('i-x') + '</button>' +
      '</div>' +
      (cfg.tabs ? '<div class="drawer-tabs">' + cfg.tabs + '</div>' : '') +
      '<div class="drawer-body" id="drawer-body">' + (cfg.body || '') + '</div>' +
      (cfg.foot ? '<div class="drawer-foot' + (cfg.footDanger ? ' is-danger' : '') + '">' + cfg.foot + '</div>' : '');
    refs.drawerScrim.classList.add('is-visible');
    pushLayer('drawer', cfg);
    applyGuards(refs.drawer);
    const first = $('[data-autofocus]', refs.drawer) || $(FOCUSABLE, refs.drawer);
    if (first) first.focus({ preventScroll: true });
    if (cfg.onMount) cfg.onMount(refs.drawer);
  }

  function openModal(cfg) {
    refs.modalBox.className = 'form-modal' +
      (cfg.size === 'lg' ? ' form-modal--lg' : cfg.size === 'sm' ? ' form-modal--sm' : '') +
      (cfg.danger ? ' is-danger' : '');
    refs.modalBox.innerHTML =
      '<div class="modal-head">' +
        icon(cfg.icon || 'i-pencil') +
        '<div class="modal-head-copy">' +
          '<h2 id="modal-title">' + escapeHtml(cfg.title) + '</h2>' +
          (cfg.desc ? '<p>' + cfg.desc + '</p>' : '') +
        '</div>' +
        '<button class="icon-btn" type="button" data-action="layer.close" data-kind="modal" aria-label="关闭弹窗">' +
          icon('i-x') + '</button>' +
      '</div>' +
      '<form class="modal-body" id="modal-form" novalidate>' +
        '<div id="modal-alert" hidden></div>' +
        (cfg.body || '') +
      '</form>' +
      '<div class="modal-foot" id="modal-foot">' + (cfg.foot || defaultModalFoot(cfg)) + '</div>';
    refs.modalLayer.classList.add('is-open');
    pushLayer('modal', cfg);
    applyGuards(refs.modalBox);
    const first = $('[data-autofocus]', refs.modalBox) ||
      $(FOCUSABLE, $('#modal-form', refs.modalBox)) || $(FOCUSABLE, refs.modalBox);
    if (first) first.focus({ preventScroll: true });
    if (cfg.onMount) cfg.onMount(refs.modalBox);
  }

  /* 提交按钮用 form="modal-form" 关联，回车与点击都走同一条 submit 委托 */
  function defaultModalFoot(cfg) {
    const c = cfg || {};
    return '<button class="btn" type="button" data-action="layer.close" data-kind="modal">' +
        escapeHtml(c.cancelText || '取消') + '</button>' +
      '<button class="btn ' + (c.danger ? 'btn--danger' : 'btn--primary') + '" type="submit" form="modal-form"' +
        (c.submitRequires ? guardAttr(c.submitRequires, c.submitReason) : '') + '>' +
        escapeHtml(c.submitText || '确认') + '</button>';
  }

  function showModalError(text) {
    const box = document.getElementById('modal-alert');
    if (!box || !refs.modalLayer.classList.contains('is-open')) return;
    box.hidden = false;
    box.setAttribute('role', 'alert');
    box.innerHTML = noticeBar({ kind: 'danger', icon: 'i-alert', text: text });
  }

  function closeLayer(kind) {
    const idx = findLastIndex(state.layers, (l) => l.kind === kind);
    if (idx < 0) return false;
    const layer = state.layers.splice(idx, 1)[0];
    if (kind === 'drawer') {
      refs.drawer.classList.remove('is-open');
      refs.drawerScrim.classList.remove('is-visible');
      setTimeout(() => { if (!refs.drawer.classList.contains('is-open')) refs.drawer.innerHTML = ''; }, 280);
    } else if (kind === 'modal') {
      refs.modalLayer.classList.remove('is-open');
      setTimeout(() => {
        if (!refs.modalLayer.classList.contains('is-open')) { refs.modalBox.innerHTML = ''; refs.modalBox.className = 'form-modal'; }
      }, 260);
    }
    restoreFocus(layer.returnFocus);
    return true;
  }

  function closeTopLayer() {
    const t = topLayer();
    return t ? closeLayer(t.kind) : false;
  }

  function trapFocus(container, e) {
    const nodes = $$(FOCUSABLE, container).filter((n) => n.getClientRects().length > 0);
    if (!nodes.length) { e.preventDefault(); return; }
    const active = document.activeElement;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey) {
      if (active === first || !container.contains(active)) { e.preventDefault(); last.focus(); }
    } else if (active === last || !container.contains(active)) {
      e.preventDefault(); first.focus();
    }
  }

  function setNavOpen(open) {
    state.navOpen = open;
    refs.sidenav.classList.toggle('is-open', open);
    refs.navScrim.classList.toggle('is-visible', open);
    refs.navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    refs.navToggle.setAttribute('aria-label', open ? '关闭导航' : '打开导航');
  }

  let openPopoverId = null;
  function closePopover() {
    if (!openPopoverId) return;
    const pop = document.getElementById(openPopoverId);
    const anchor = $('[aria-controls="' + openPopoverId + '"]');
    if (pop) pop.classList.remove('is-open');
    if (anchor) anchor.setAttribute('aria-expanded', 'false');
    openPopoverId = null;
  }
  function togglePopover(popId) {
    const anchor = openPopoverId === popId ? $('[aria-controls="' + popId + '"]') : null;
    closePopover();
    if (anchor) return;
    const pop = document.getElementById(popId);
    if (!pop) return;
    const btn = $('[aria-controls="' + popId + '"]');
    pop.classList.add('is-open');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    openPopoverId = popId;
    const first = $('.popover-item:not([disabled])', pop) || $(FOCUSABLE, pop);
    if (first) first.focus({ preventScroll: true });
  }

  /* ==========================================================
     07 · toast
     ========================================================== */

  let toastTimer = 0;
  const TOAST_ICON = { ok: 'i-check-circle', error: 'i-x-circle', warn: 'i-alert', info: 'i-info' };

  function toast(text, kind) {
    const k = TOAST_ICON[kind] ? kind : 'info';
    refs.toast.className = 'toast' + (k === 'error' ? ' is-error' : '');
    refs.toast.innerHTML = icon(TOAST_ICON[k]) + '<span class="toast-text">' + escapeHtml(text) + '</span>';
    void refs.toast.offsetWidth;
    refs.toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => refs.toast.classList.remove('is-visible'), 3800);
  }

  /* ==========================================================
     08 · 审计管道
     架构文档 §4：所有高权限写操作必须进入审计日志。
     这里做成"调用前先落 pending → 结果回填 success/denied/failed"，
     于是越权与失败也留痕，日志页能看到完整闭环。
     ========================================================== */

  function pushAudit(entry) {
    const item = Object.assign({
      id: uid('aud'), ts: Date.now(), action: 'unknown', method: 'GET',
      path: BASE, target: '—', detail: '', result: 'pending',
      actor: actorAccount(), actorRole: state.role, isNew: true
    }, entry);
    state.audit.items.unshift(item);
    return item;
  }

  function commitAudit(entry, result, extra) {
    entry.result = result;
    entry.ts = Date.now();
    const o = extra || {};
    if (o.detail) entry.detail = o.detail;
    if (o.reason) entry.detail = entry.detail ? entry.detail + '｜' + o.reason : o.reason;
    state.audit.unread += 1;
    renderBadges();
    if (state.route.module === 'logs' && state.route.sub === 'audit') paintAuditTable();
  }

  function clearAuditUnread() {
    if (!state.audit.unread && !state.audit.items.some((i) => i.isNew)) return;
    state.audit.unread = 0;
    state.audit.items.forEach((i) => { i.isNew = false; });
    renderBadges();
  }

  /* 路由级越权也记一条 denied，切到日志页就能看到（第二层闭环） */
  function recordDenied(module) {
    const entry = pushAudit({
      action: 'route.access_denied', method: 'GET', path: BASE + '/' + module,
      target: MODULES[module] ? MODULES[module].title : module,
      detail: '角色 ' + ROLE_LABELS[state.role].name + '（' + state.role + '）不在该路由的可访问列表内'
    });
    commitAudit(entry, 'denied');
  }

  function renderBadges() {
    const n = state.audit.unread;
    const show = n > 0 && canRoute('logs');
    const text = n > 99 ? '99+' : String(n);
    refs.bellBadge.hidden = !show;
    refs.bellBadge.textContent = text;
    refs.bell.setAttribute('aria-label', show ? '审计日志：' + n + ' 条未读' : '审计日志');
    const navBadge = document.getElementById('nav-badge-logs');
    if (navBadge) {
      navBadge.hidden = !show;
      navBadge.textContent = text;
      navBadge.classList.toggle('is-alert', show);
    }
  }

  /* 写操作闭环：pending 审计 → Admin API → 回填结果 → toast → 刷新 → 徽标 */
  async function runWrite(cfg) {
    const entry = pushAudit({
      action: cfg.action, method: cfg.method, path: BASE + cfg.path, target: cfg.target
    });
    setBusy(cfg.busyEl, true);
    try {
      const res = await adminApi.request(cfg.method, cfg.path, {
        capability: cfg.capability, body: cfg.body || {}, reason: cfg.reason
      });
      commitAudit(entry, 'success', { detail: res && res.detail });
      toast(cfg.successText || (res && res.detail) || '操作已完成', 'ok');
      if (cfg.closeModal !== false) closeLayer('modal');
      if (cfg.refresh) await cfg.refresh(res);
      return res;
    } catch (err) {
      const e = handleApiError(err);
      commitAudit(entry, e.status === 403 ? 'denied' : 'failed', { reason: e.detail || e.message });
      showModalError((e.status ? e.status + ' · ' : '') + e.message + (e.detail ? '（' + e.detail + '）' : ''));
      if (cfg.onFail) cfg.onFail(e);
      return null;
    } finally {
      setBusy(cfg.busyEl, false);
    }
  }

  /* ==========================================================
     09 · WebSocket 模拟
     /ws/runtime 与 /ws/logs：connecting → open → reconnecting(×3) → open；
     只 append 行、裁剪到 200 条，绝不整页重渲；离开路由必须停流。
     ========================================================== */

  const STREAM_STATE_TEXT = {
    connecting: '连接中', open: '已连接', reconnecting: '重连中', closed: '已断开'
  };

  function createStream(key, cfg) {
    stopStream(key);
    const st = {
      key: key, status: 'connecting', paused: false, autoScroll: true, level: 'all',
      lines: [], seq: 0, attempt: 0, timer: 0, openTimer: 0,
      make: cfg.make, minMs: cfg.minMs || 1200, maxMs: cfg.maxMs || 2800
    };
    state.streams[key] = st;
    paintStreamState(key);

    st.openTimer = setTimeout(() => {
      if (state.streams[key] !== st) return;
      st.status = 'open';
      paintStreamState(key);
      for (let i = 0; i < 6; i++) appendStreamLine(key, st.make(st, i), true);
      pump();
    }, 460);

    function pump() {
      clearTimeout(st.timer);
      st.timer = setTimeout(() => {
        if (state.streams[key] !== st) return;
        if (st.status === 'open' && !st.paused && !document.hidden) {
          st.seq += 1;
          appendStreamLine(key, st.make(st, st.seq), false);
        }
        pump();
      }, randInt(key + ':' + st.seq, st.minMs, st.maxMs));
    }
    return st;
  }

  function appendStreamLine(key, line, quiet) {
    const st = state.streams[key];
    if (!st || !line) return;
    st.lines.push(line);
    if (st.lines.length > 200) st.lines.splice(0, st.lines.length - 200);
    updateStreamCounters(key);
    const host = $('[data-stream-body="' + key + '"]');
    if (!host) return;
    if (st.level !== 'all' && line.level !== st.level) return;
    const ph = $('.log-line.is-placeholder', host);
    if (ph) ph.remove();
    host.appendChild(lineEl(line, quiet));
    while (host.children.length > 200) host.removeChild(host.firstChild);
    if (st.autoScroll) host.scrollTop = host.scrollHeight;
  }

  /* 流条数有两个落点：控制台工具栏与日志页的 run tab 计数。
     两处都不能整页重渲，所以单独抽出来，appendStreamLine 与 repaintStream 各调一次。 */
  function updateStreamCounters(key) {
    const st = state.streams[key];
    if (!st) return;
    const text = st.lines.length + ' 条';
    const countEl = $('[data-stream-count="' + key + '"]');
    if (countEl) countEl.textContent = text;
    if (key === 'logs') {
      const tabEl = $('.log-tabs .tab[data-tab="run"] .tab-count');
      if (tabEl) tabEl.textContent = String(st.lines.length);
    }
  }

  function lineEl(line, quiet) {
    const el = document.createElement('div');
    el.className = 'log-line level-' + (line.level || 'info') + (quiet ? '' : ' is-new');
    el.innerHTML =
      '<span class="log-ts">' + escapeHtml(formatClockSec(line.ts)) + '</span>' +
      '<span class="log-level">' + escapeHtml(line.level || 'info') + '</span>' +
      '<span class="log-msg">' + escapeHtml(line.msg) + '</span>' +
      (line.stack ? '<div class="log-stack">' + escapeHtml(line.stack) + '</div>' : '');
    return el;
  }

  function repaintStream(key) {
    const st = state.streams[key];
    const host = $('[data-stream-body="' + key + '"]');
    if (!st || !host) return;
    const frag = document.createDocumentFragment();
    st.lines
      .filter((l) => st.level === 'all' || l.level === st.level)
      .forEach((l) => frag.appendChild(lineEl(l, true)));
    host.innerHTML = '';
    host.appendChild(frag);
    if (!host.children.length) {
      const hint = document.createElement('div');
      hint.className = 'log-line is-placeholder';
      hint.textContent = st.lines.length
        ? '级别筛选（' + st.level + '）下没有命中，缓冲区仍保留 ' + st.lines.length + ' 行'
        : '已清空显示缓冲区 · 流仍在继续，新日志会接着追入';
      host.appendChild(hint);
    }
    if (st.autoScroll) host.scrollTop = host.scrollHeight;
    updateStreamCounters(key);
  }

  function paintStreamState(key) {
    const st = state.streams[key];
    const status = st ? st.status : 'closed';
    const text = STREAM_STATE_TEXT[status] || status;
    $$('[data-stream-state="' + key + '"]').forEach((el) => {
      el.className = 'stream-state is-' + status;
      el.innerHTML = '<span class="stream-dot" aria-hidden="true"></span><span>' + escapeHtml(text) + '</span>';
    });
    $$('[data-conn-banner="' + key + '"]').forEach((el) => {
      const bad = status !== 'open';
      el.classList.toggle('is-bad', bad);
      el.setAttribute('role', bad ? 'alert' : 'status');
      el.innerHTML = bad
        ? icon(status === 'closed' ? 'i-wifi-off' : 'i-alert') +
          '<span>' + escapeHtml(status === 'reconnecting'
            ? 'WebSocket 已断开，正在按指数退避重连（第 ' + (st ? st.attempt : 0) + '/3 次），以下数据可能不是最新'
            : status === 'connecting'
              ? '正在建立 /ws/' + key + ' 连接…'
              : '连接已断开，数据可能不是最新') + '</span>' +
          '<span class="spacer"></span>' +
          '<button class="btn btn--sm" type="button" data-action="stream.reconnect" data-stream="' + key + '">' +
            icon('i-refresh') + '立即重连</button>'
        : icon('i-wifi') + '<span>/ws/' + key + ' 已连接，实时推送中</span>';
    });
    const pane = $('[data-stream-pane="' + key + '"]');
    if (pane) pane.classList.toggle('is-paused', !!(st && st.paused));
    $$('[data-stream-toggle="' + key + '"]').forEach((b) => {
      const paused = !!(st && st.paused);
      b.innerHTML = icon(paused ? 'i-play' : 'i-pause') + '<span>' + (paused ? '继续' : '暂停') + '</span>';
      b.setAttribute('aria-pressed', paused ? 'true' : 'false');
      b.setAttribute('aria-label', paused ? '继续实时推送' : '暂停实时推送');
    });
  }

  /* 顶栏「注入断线」：状态打到 reconnecting，用来演示 banner 与指数退避 */
  function injectDisconnect(key) {
    const st = state.streams[key];
    if (!st) return;
    st.status = 'reconnecting';
    st.attempt = 0;
    paintStreamState(key);
    toast('已注入断线：' + key + ' 流进入指数退避重连', 'warn');
    const step = () => {
      if (state.streams[key] !== st || st.status !== 'reconnecting') return;
      st.attempt += 1;
      paintStreamState(key);
      if (st.attempt >= 2) {
        const used = st.attempt;
        setTimeout(() => {
          if (state.streams[key] !== st) return;
          st.status = 'open';
          st.attempt = 0;
          paintStreamState(key);
          appendStreamLine(key, { ts: Date.now(), level: 'info', msg: 'WebSocket 重连成功，恢复实时推送（指数退避 ' + used + ' 次）' });
        }, 620);
        return;
      }
      setTimeout(step, 900 * st.attempt);
    };
    setTimeout(step, 700);
  }

  function stopStream(key) {
    const st = state.streams[key];
    if (!st) return;
    clearTimeout(st.timer);
    clearTimeout(st.openTimer);
    delete state.streams[key];
  }
  function stopAllStreams() {
    Object.keys(state.streams).forEach(stopStream);
  }

  /* ==========================================================
     10 · 共享渲染
     列表页的三态（骨架 / 空 / 错误）只写一份，所有模块共用
     ========================================================== */

  const STATUS_TEXT = {
    active: '正常', pending: '待激活', disabled: '已禁用', suspended: '已暂停', reclaimed: '已回收',
    idle: '闲置', ended: '已结束', error: '异常', ok: '正常', degraded: '降级', down: '不可用',
    unknown: '未测试', draft: '草稿', published: '已发布', archived: '已归档',
    normal: '正常', corrected: '已修正', success: '成功', denied: '越权拒绝', failed: '失败'
  };
  const STATUS_VARIANT = {
    active: 'is-ok', pending: 'is-info', disabled: 'is-muted', suspended: 'is-warn', reclaimed: 'is-muted',
    idle: 'is-info', ended: 'is-muted', error: 'is-danger', ok: 'is-ok', degraded: 'is-warn', down: 'is-danger',
    unknown: 'is-muted', draft: 'is-warn', published: 'is-ok', archived: 'is-muted',
    normal: 'is-ok', corrected: 'is-info', success: 'is-ok', denied: 'is-warn', failed: 'is-danger',
    live: 'is-live', primary: 'is-primary', deferred: 'is-deferred',
    warn: 'is-warn', info: 'is-info'
  };
  function statusTag(status, text, extraCls) {
    return '<span class="status-tag ' + (STATUS_VARIANT[status] || 'is-muted') + (extraCls ? ' ' + extraCls : '') + '">' +
      escapeHtml(text === undefined ? (STATUS_TEXT[status] || status) : text) + '</span>';
  }
  const deferredTag = (text) => '<span class="status-tag is-deferred">' + escapeHtml(text || '延后') + '</span>';

  function td(html, cls, title) {
    return '<td' + (cls ? ' class="' + cls + '"' : '') + (title ? ' title="' + escapeHtml(title) + '"' : '') + '>' + html + '</td>';
  }

  /* colgroup 列宽与 --progress-value 进度条是全文件仅有的两处内联声明：
     列宽必须写在 col 上，table-layout:fixed + ellipsis 才可靠（规避走查 #15/#16）；
     进度条只把数值交给组件层的 --progress-value，不复制 .progress-bar 规则 */
  function tableHtml(cfg, rowsHtml) {
    const cols = cfg.columns.map((c) =>
      '<col' + (c.width ? ' style="width:' + c.width + '"' : '') + (c.cls ? ' class="' + c.cls + '"' : '') + '>').join('');
    const head = cfg.columns.map((c) =>
      '<th scope="col"' + (c.cls ? ' class="' + c.cls + '"' : '') + '>' + escapeHtml(c.label) + '</th>').join('');
    return '<table class="data-table">' +
      '<caption class="sr-only">' + escapeHtml(cfg.caption || '数据列表') + '</caption>' +
      '<colgroup>' + cols + '</colgroup>' +
      '<thead><tr>' + head + '</tr></thead>' +
      '<tbody>' + rowsHtml + '</tbody></table>';
  }

  function rowOpen(module, id, label, opts) {
    const o = opts || {};
    return '<button class="row-link" type="button" data-action="row.open" data-module="' + module +
      '" data-id="' + escapeHtml(id) + '" title="打开 ' + escapeHtml(label) + ' 详情">' +
      escapeHtml(label) + (o.suffix ? ' <span class="muted">' + escapeHtml(o.suffix) + '</span>' : '') + '</button>';
  }

  function rowActions(buttons) {
    return '<div class="row">' + buttons.join('') + '</div>';
  }
  function iconAction(action, iconId, label, dataset, requires, reason) {
    return '<button class="icon-btn" type="button" data-action="' + action + '"' + (dataset || '') +
      ' aria-label="' + escapeHtml(label) + '" title="' + escapeHtml(label) + '"' +
      (requires ? guardAttr(requires, reason) : '') + '>' + icon(iconId) + '</button>';
  }

  function skeletonRows(n) {
    let s = '';
    for (let i = 0; i < n; i++) {
      s += '<div class="skeleton-row" aria-hidden="true">' +
        '<span class="skeleton"></span><span class="skeleton"></span><span class="skeleton"></span>' +
        '<span class="skeleton"></span><span class="skeleton"></span></div>';
    }
    return s;
  }

  /* 卡片网格页（供应商、留存媒体）的 loading 不能用表格骨架，否则形状和结果对不上 */
  function skeletonCards(n, gridCls) {
    let s = '';
    for (let i = 0; i < n; i++) s += '<div class="skeleton skeleton-card" aria-hidden="true"></div>';
    return '<div class="' + gridCls + '">' + s + '</div>';
  }

  function emptyState(cfg) {
    const c = cfg || {};
    return '<div class="empty-state' + (c.variant ? ' ' + c.variant : '') + '">' +
      icon(c.icon || 'i-inbox', 'icon-lg') +
      '<strong>' + escapeHtml(c.title || '暂无数据') + '</strong>' +
      (c.desc ? '<p>' + c.desc + '</p>' : '') +
      (c.links ? '<div class="empty-links">' + c.links + '</div>' : '') +
      (c.actions ? '<div class="row">' + c.actions + '</div>' : '') +
      '</div>';
  }

  function noticeBar(cfg) {
    return '<div class="notice-bar' + (cfg.kind ? ' is-' + cfg.kind : '') + '">' +
      icon(cfg.icon || 'i-info') + '<div>' + (cfg.html || escapeHtml(cfg.text || '')) + '</div></div>';
  }

  /* rows = [[label, valueHtml], …]；value 由调用方负责 escape */
  function kvList(rows, opts) {
    const o = opts || {};
    return '<dl class="kv-list' + (o.dense ? ' is-dense' : '') + (o.mono ? ' is-mono' : '') + '">' +
      rows.map((r) => '<div class="kv-row"><dt>' + escapeHtml(r[0]) + '</dt><dd>' + r[1] + '</dd></div>').join('') +
      '</dl>';
  }

  function kvDiff(rows) {
    if (!rows || !rows.length) return '<p class="muted">该版本没有留下字段级差异记录。</p>';
    return '<div class="kv-diff">' + rows.map((d) =>
      '<div class="kv-diff-row ' + (d.kind || 'is-changed') + '">' +
      '<span>' + escapeHtml(d.field) + '</span>' +
      '<dd>' + escapeHtml(d.from || '（空）') + ' → ' + escapeHtml(d.to || '（空）') + '</dd>' +
      '</div>').join('') + '</div>';
  }

  function statCard(cfg) {
    const clickable = !!cfg.action;
    if (!clickable) {
      return '<div class="stat-card' + (cfg.alert ? ' is-alert' : '') + '">' +
        '<span class="stat-label">' + escapeHtml(cfg.label) + '</span>' +
        '<span class="stat-value">' + cfg.value + '</span>' +
        (cfg.foot ? '<span class="stat-foot">' + cfg.foot + '</span>' : '') + '</div>';
    }
    return '<button class="stat-card' + (cfg.alert ? ' is-alert' : '') + '" type="button" data-action="' + cfg.action + '"' +
      (cfg.module ? ' data-module="' + cfg.module + '"' : '') + (cfg.sub ? ' data-sub="' + cfg.sub + '"' : '') +
      (cfg.id ? ' data-id="' + escapeHtml(cfg.id) + '"' : '') + '>' +
      '<span class="stat-label">' + escapeHtml(cfg.label) + '</span>' +
      '<span class="stat-value">' + cfg.value + '</span>' +
      (cfg.foot ? '<span class="stat-foot">' + cfg.foot + '</span>' : '') + '</button>';
  }

  function progressHtml(value, max, label) {
    const p = pct(value, max);
    return '<div class="progress' + (p > 95 ? ' is-danger' : p > 80 ? ' is-warn' : '') + '" role="progressbar"' +
      ' aria-valuemin="0" aria-valuemax="' + max + '" aria-valuenow="' + value + '"' +
      ' aria-label="' + escapeHtml(label || '使用量') + '">' +
      '<span class="progress-bar" style="--progress-value:' + p + '%"></span></div>';
  }

  function renderPagination(key, pager) {
    const compact = state.layout === 'compact';
    const btn = (label, page, o) => '<button class="page-btn" type="button" data-action="list.page" data-key="' + key +
      '" data-page="' + page + '"' + (o.current ? ' aria-current="page"' : '') + (o.disabled ? ' disabled' : '') +
      ' aria-label="' + escapeHtml(o.aria || ('第 ' + page + ' 页')) + '">' + label + '</button>';
    const nums = compact ? '' : pageNumbers(pager.page, pager.pages).map((n) => n === 'gap'
      ? '<span class="page-gap" aria-hidden="true">…</span>'
      : btn(String(n), n, { current: n === pager.page })).join('');
    return '<nav class="pagination' + (compact ? ' is-compact' : '') + '" aria-label="分页导航">' +
      '<span class="page-summary">第 ' + pager.page + ' / ' + pager.pages + ' 页</span>' +
      btn(icon('i-chevron-left'), Math.max(1, pager.page - 1), { disabled: pager.page <= 1, aria: '上一页' }) +
      nums +
      btn(icon('i-chevron-right'), Math.min(pager.pages, pager.page + 1), { disabled: pager.page >= pager.pages, aria: '下一页' }) +
      '</nav>';
  }

  function footHtml(key, pager, extra) {
    return '<span>共 ' + pager.total + ' 条' + (pager.total ? '，当前显示 ' + pager.from + '–' + pager.to + ' 条' : '') + '</span>' +
      (extra || '') + renderPagination(key, pager);
  }

  function filterSearch(key, name, placeholder, value) {
    const id = 'fs-' + key + '-' + name;
    return '<span class="filter-field">' + icon('i-search') +
      '<input class="filter-input" id="' + id + '" type="search" data-action="filter.input" data-key="' + key +
      '" data-name="' + name + '" value="' + escapeHtml(value || '') + '" placeholder="' + escapeHtml(placeholder) +
      '" aria-label="' + escapeHtml(placeholder) + '" autocomplete="off"></span>';
  }
  function filterSelect(key, name, label, options, value) {
    const id = 'fsel-' + key + '-' + name;
    return '<select class="filter-select" id="' + id + '" data-action="filter.change" data-key="' + key +
      '" data-name="' + name + '" aria-label="' + escapeHtml(label) + '">' +
      options.map((o) => '<option value="' + escapeHtml(o[0]) + '"' + (String(o[0]) === String(value) ? ' selected' : '') + '>' +
        escapeHtml(o[1]) + '</option>').join('') + '</select>';
  }
  function filterChip(key, name, value, label, isOn, count) {
    return '<button class="chip' + (isOn ? ' is-on' : '') + '" type="button" data-action="filter.chip" data-key="' + key +
      '" data-name="' + name + '" data-value="' + escapeHtml(value) + '" aria-pressed="' + (isOn ? 'true' : 'false') + '">' +
      escapeHtml(label) + (count === undefined ? '' : '<span class="tab-count">' + count + '</span>') + '</button>';
  }

  function cardShell(cfg) {
    return '<section class="card">' +
      (cfg.title
        ? '<header class="card-head">' + (cfg.icon ? icon(cfg.icon) : '') +
          '<h2>' + escapeHtml(cfg.title) + '</h2>' +
          (cfg.desc ? '<span class="muted">' + escapeHtml(cfg.desc) + '</span>' : '') +
          '<span class="spacer"></span>' + (cfg.extra || '') + '</header>'
        : '') +
      '<div class="card-body' + (cfg.flush ? ' is-flush' : '') + '">' + (cfg.body || '') + '</div></section>';
  }

  function tabsHtml(action, tabs, active, opts) {
    const o = opts || {};
    return '<div class="tabs" role="group"' + (o.label ? ' aria-label="' + escapeHtml(o.label) + '"' : '') +
      (o.key ? ' data-key="' + o.key + '"' : '') + '>' +
      tabs.map((t) => '<button class="tab' + (t.key === active ? ' is-active' : '') + '" type="button"' +
        ' data-action="' + action + '"' + (o.key ? ' data-key="' + o.key + '"' : '') +
        ' data-tab="' + escapeHtml(t.key) + '" aria-pressed="' + (t.key === active ? 'true' : 'false') + '"' +
        (t.title ? ' title="' + escapeHtml(t.title) + '"' : '') + '>' +
        (t.icon ? icon(t.icon) : '') + escapeHtml(t.label) +
        (t.count === undefined ? '' : '<span class="tab-count">' + t.count + '</span>') +
        (t.deferred ? deferredTag('延后') : '') + '</button>').join('') + '</div>';
  }

  function sectionTitle(text, iconName) {
    return '<h3 class="section-title">' + (iconName ? icon(iconName) : '') + escapeHtml(text) + '</h3>';
  }

  function codeBlock(text) {
    const html = escapeHtml(text)
      .replace(/\{\{\s*([a-zA-Z0-9_.\-]+)\s*\}\}/g, '<span class="var">{{$1}}</span>')
      .replace(/^(\[\d+\][^\n]*)/gm, '<span class="layer">$1</span>')
      .replace(/^(#[^\n]*)/gm, '<span class="cm">$1</span>');
    return '<pre class="code-block">' + html + '</pre>';
  }

  function timelineHtml(items) {
    if (!items.length) return '<p class="muted">暂无记录。</p>';
    return '<div class="timeline">' + items.map((it) =>
      '<div class="timeline-item' + (it.muted ? ' is-muted' : '') + '">' +
        '<span class="timeline-dot">' + icon(it.icon || 'i-dot') + '</span>' +
        '<div><div class="timeline-head"><strong>' + escapeHtml(it.title) + '</strong>' +
          (it.tag || '') + (it.ts ? timeAgo(it.ts) : '') + '</div>' +
          (it.body ? '<div class="timeline-body">' + it.body + '</div>' : '') + '</div>' +
      '</div>').join('') + '</div>';
  }

  /* ---- 表单控件 ---- */
  function fieldHtml(cfg) {
    const id = cfg.id || 'f-' + hashStr(cfg.name + '|' + (cfg.label || '')).toString(36);
    const common = ' id="' + id + '" name="' + escapeHtml(cfg.name) + '"' +
      (cfg.disabled ? ' disabled' : '') + (cfg.required ? ' required' : '') +
      (cfg.autofocus ? ' data-autofocus' : '');
    let ctl;
    if (cfg.type === 'textarea') {
      ctl = '<textarea class="field-ctl' + (cfg.mono ? ' textarea-mono' : '') + '"' + common +
        ' rows="' + (cfg.rows || 3) + '"' + (cfg.placeholder ? ' placeholder="' + escapeHtml(cfg.placeholder) + '"' : '') +
        (cfg.maxlength ? ' maxlength="' + cfg.maxlength + '"' : '') + '>' + escapeHtml(cfg.value || '') + '</textarea>';
    } else if (cfg.type === 'select') {
      ctl = '<select class="field-ctl"' + common + '>' +
        cfg.options.map((o) => '<option value="' + escapeHtml(o[0]) + '"' +
          (String(o[0]) === String(cfg.value) ? ' selected' : '') + '>' + escapeHtml(o[1]) + '</option>').join('') + '</select>';
    } else if (cfg.type === 'switch') {
      return '<div class="field' + (cfg.full ? ' is-full' : '') + '">' +
        '<span class="field-label">' + escapeHtml(cfg.label || '') + (cfg.required ? ' <span class="req">*</span>' : '') + '</span>' +
        '<div class="row">' +
          '<button class="switch" type="button" role="switch" id="' + id + '" name="' + escapeHtml(cfg.name) +
            '" aria-checked="' + (cfg.value ? 'true' : 'false') + '" aria-label="' + escapeHtml(cfg.label || '开关') +
            '" data-action="form.switch"' + (cfg.disabled ? ' disabled' : '') +
            (cfg.requires ? guardAttr(cfg.requires, cfg.reason) : '') + '><span class="switch-knob"></span></button>' +
          '<span class="field-hint">' + (cfg.onText || '开') + ' / ' + (cfg.offText || '关') + '</span>' +
        '</div>' +
        (cfg.hint ? '<p class="field-hint">' + cfg.hint + '</p>' : '') +
        '<p class="field-error" id="' + id + '-error" hidden></p></div>';
    } else if (cfg.type === 'slider') {
      return '<div class="field' + (cfg.full ? ' is-full' : '') + ' slider-row">' +
        '<span class="slider-head"><span class="field-label">' + escapeHtml(cfg.label || '') + '</span>' +
          '<output for="' + id + '" data-slider-out="' + escapeHtml(cfg.name) + '">' + (cfg.value || 0) + '%</output></span>' +
        '<input class="slider" type="range" id="' + id + '" name="' + escapeHtml(cfg.name) + '" min="0" max="100" step="5"' +
          ' value="' + (cfg.value || 0) + '" data-action="form.slider"' + (cfg.disabled ? ' disabled' : '') + '>' +
        (cfg.hint ? '<p class="field-hint">' + cfg.hint + '</p>' : '') + '</div>';
    } else if (cfg.type === 'static') {
      return '<div class="field' + (cfg.full ? ' is-full' : '') + '">' +
        '<span class="field-label">' + escapeHtml(cfg.label || '') + '</span>' +
        '<div class="field-hint">' + (cfg.html || escapeHtml(cfg.value || '—')) + '</div></div>';
    } else {
      ctl = '<input class="field-ctl" type="' + (cfg.type || 'text') + '"' + common +
        ' value="' + escapeHtml(cfg.value === undefined || cfg.value === null ? '' : cfg.value) + '"' +
        (cfg.placeholder ? ' placeholder="' + escapeHtml(cfg.placeholder) + '"' : '') +
        (cfg.min !== undefined ? ' min="' + cfg.min + '"' : '') +
        (cfg.max !== undefined ? ' max="' + cfg.max + '"' : '') +
        (cfg.step ? ' step="' + cfg.step + '"' : '') +
        (cfg.maxlength ? ' maxlength="' + cfg.maxlength + '"' : '') +
        (cfg.inputmode ? ' inputmode="' + cfg.inputmode + '"' : '') +
        (cfg.autocomplete ? ' autocomplete="' + cfg.autocomplete + '"' : '') + '>';
    }
    return '<div class="field' + (cfg.full ? ' is-full' : '') + '">' +
      '<label for="' + id + '">' + escapeHtml(cfg.label || '') + (cfg.required ? ' <span class="req">*</span>' : '') + '</label>' +
      ctl +
      (cfg.hint ? '<p class="field-hint">' + cfg.hint + '</p>' : '') +
      '<p class="field-error" id="' + id + '-error" hidden></p></div>';
  }

  function readForm(root) {
    const nodes = $$('[name]', root).filter((el) => el.getAttribute('name'));
    const counts = {};
    nodes.forEach((el) => { const n = el.getAttribute('name'); counts[n] = (counts[n] || 0) + 1; });
    const out = {};
    nodes.forEach((el) => {
      const name = el.getAttribute('name');
      if (el.classList.contains('switch')) { out[name] = el.getAttribute('aria-checked') === 'true'; return; }
      if (el.type === 'checkbox') {
        if (counts[name] === 1) { out[name] = el.checked; return; }
        if (!out[name]) out[name] = [];
        if (el.checked) out[name].push(el.value);
        return;
      }
      if (el.type === 'radio') { if (el.checked) out[name] = el.value; return; }
      out[name] = el.value;
    });
    return out;
  }

  function setFieldError(root, name, msg) {
    const el = $('[name="' + name + '"]', root);
    if (!el) return;
    const field = el.closest('.field');
    if (field) field.classList.toggle('is-invalid', !!msg);
    const err = (el.id ? $('#' + el.id + '-error', root) : null) || (field ? $('.field-error', field) : null);
    if (err) { err.hidden = !msg; err.textContent = msg || ''; }
    if (msg) {
      el.setAttribute('aria-invalid', 'true');
      if (el.id) el.setAttribute('aria-describedby', el.id + '-error');
    } else {
      el.removeAttribute('aria-invalid');
    }
  }

  function clearFieldErrors(root) {
    $$('.field.is-invalid', root).forEach((f) => f.classList.remove('is-invalid'));
    $$('.field-error', root).forEach((e) => { e.hidden = true; e.textContent = ''; });
    $$('[aria-invalid]', root).forEach((e) => e.removeAttribute('aria-invalid'));
    const box = document.getElementById('modal-alert');
    if (box) { box.hidden = true; box.innerHTML = ''; }
  }

  /* ---- 列表页统一骨架：筛选条 + 表格卡（滚动区 + 底栏）---- */
  function mountList(host, key, cfg) {
    LIST_CFG[key] = cfg;
    const store = state.data[key];
    store.filters = store.filters || {};
    host.innerHTML =
      '<div class="filter-bar" id="filter-' + key + '">' + (cfg.filters ? cfg.filters(store) : '') + '</div>' +
      '<div class="table-card">' +
        '<div class="table-scroll" id="scroll-' + key + '"></div>' +
        '<div class="table-foot" id="foot-' + key + '" hidden></div>' +
      '</div>';
    store.dom = {
      bar: document.getElementById('filter-' + key),
      scroll: document.getElementById('scroll-' + key),
      foot: document.getElementById('foot-' + key)
    };
    store.page = 1;
    paintList(key);
    loadList(key);
  }

  function paintList(key) {
    const cfg = LIST_CFG[key];
    const store = state.data[key];
    if (!cfg || !store || !store.dom || !store.dom.scroll.isConnected) return;
    const scroll = store.dom.scroll;
    const foot = store.dom.foot;
    const endpoint = '<span class="mono">' + escapeHtml('GET ' + BASE + cfg.path) + '</span>';

    if (store.status === 'loading') {
      foot.hidden = true;
      scroll.innerHTML = '<div aria-busy="true"><span class="sr-only">正在加载 ' + escapeHtml(cfg.caption || '数据') + '</span>' +
        (cfg.skeleton ? cfg.skeleton() : skeletonRows(cfg.skeletonRows || 6)) + '</div>';
      return;
    }
    if (store.status === 'error') {
      foot.hidden = true;
      scroll.innerHTML = emptyState({
        variant: 'is-error', icon: 'i-bug', title: '加载失败',
        desc: escapeHtml(store.error || 'Admin API 无响应') + '<br>' + endpoint,
        actions: '<button class="btn btn--primary" type="button" data-action="list.reload" data-key="' + key + '">' +
          icon('i-refresh') + '重试</button>'
      });
      return;
    }

    const items = cfg.filter ? cfg.filter(store.items, store.filters) : store.items;
    const pager = paginate(items, store.page, cfg.pageSize || store.pageSize);
    store.page = pager.page;
    store.filtered = items.length;

    if (!pager.total) {
      foot.hidden = true;
      scroll.innerHTML = cfg.empty ? cfg.empty(store) : emptyState({
        icon: 'i-inbox', title: '没有符合条件的记录',
        desc: '当前筛选下 ' + escapeHtml(cfg.caption || '列表') + ' 为空，试着放宽条件或换一个关键字。'
      });
      return;
    }
    /* cfg.list 存在时由模块自己决定表格还是卡片网格（供应商、媒体留存两页用） */
    scroll.innerHTML = cfg.list
      ? cfg.list(pager.slice, store)
      : tableHtml(cfg, pager.slice.map((it) => cfg.row(it, store)).join(''));
    foot.hidden = false;
    foot.innerHTML = footHtml(key, pager, cfg.footExtra ? cfg.footExtra(store) : '');
    applyGuards(scroll);
  }

  async function loadList(key) {
    const cfg = LIST_CFG[key];
    const store = state.data[key];
    if (!cfg || !store) return;
    store.status = 'loading';
    store.error = null;
    paintList(key);
    try {
      const res = await adminApi.list(cfg.path);
      store.items = res.items || [];
      store.total = res.total === undefined ? store.items.length : res.total;
      store.tookMs = res.tookMs || 0;
      store.status = 'ready';
      if (cfg.afterLoad) cfg.afterLoad(store, res);
    } catch (err) {
      const e = handleApiError(err);
      store.status = 'error';
      store.error = (e.status ? e.status + ' · ' : '') + e.message + (e.detail ? '（' + e.detail + '）' : '');
    }
    paintList(key);
    openPendingDetail(key);
  }

  function reloadModule(module) {
    if (module && state.route.module !== module) return;
    renderRoute();
  }

  /* ==========================================================
     11 · VIEWS
     每个模块一个 VIEWS[key] = { scroll, actions(), render(host), renderDrawer?() }。
     列表模块统一走 mountList / paintList，骨架、空态、错误态只写一份。
     本节顺序 == CSS 07 节顺序 == 导航顺序。
     ========================================================== */

  const KIND_TEXT = { public: '正式用户', beta: '内测用户', internal: '内部账号' };
  const DEVICE_TEXT = { phone: '手机', desktop: '桌面端', tablet: '平板' };
  const MODE_TEXT = { reactive: 'Reactive', proactive: 'Proactive' };
  const PROVIDER_KIND_TEXT = { llm: 'LLM 推理', tts: '语音合成', vision: '视觉理解' };
  const MEDIA_KIND_TEXT = { audio: '音频留存', frame: '视觉留存' };
  const DIRECTION_TEXT = { inbound: '上行', outbound: '下行' };
  const BUFFER_KIND_TEXT = { message: '消息', perception: '感知事件', goal: '目标', state: 'State 快照' };
  const ACTIVITY_TEXT = { idle: '闲置', listening: '聆听中', chatting: '对话中', reflecting: '自省中', sleeping: '休眠' };
  const PHASE_TEXT = { morning: '清晨', afternoon: '午后', evening: '傍晚', night: '夜间', deep_night: '深夜' };
  const PLATFORM_TEXT = { android: 'Android', ios: 'iOS', desktop: '桌面端' };
  const ENV_TEXT = { dev: '开发', staging: '预发', prod: '生产' };

  const IDENTITY_SECTIONS = [
    { key: 'personality',   label: 'Personality',   icon: 'i-mask',     hint: '人格特质、语气与价值观，是 Prompt 第 1 层的来源' },
    { key: 'voice',         label: 'Voice',         icon: 'i-waveform', hint: '音色、语速、音高与停顿风格，交给语音合成供应商' },
    { key: 'aesthetic',     label: 'Aesthetic',     icon: 'i-spark',    hint: '色彩、意象与禁止的表达方式' },
    { key: 'boundaries',    label: 'Boundaries',    icon: 'i-shield',   hint: '硬约束与软约束，是 Prompt 第 2 层，运行时不可越过' },
    { key: 'selfNarrative', label: 'SelfNarrative', icon: 'i-user',     hint: '自我叙述：承认自己是 Agent 实例而不是真人' },
    { key: 'versionMeta',   label: 'VersionMeta',   icon: 'i-history',  hint: '版本号、发布状态、更新人与变更说明' }
  ];

  const memoryTypeLabel = (k) => (MEMORY_TYPE_MAP[k] ? MEMORY_TYPE_MAP[k].label : k);
  /* Promise.all 里任何一个拒绝都会让其余的变成未捕获拒绝，这里先各自落袋 */
  const settle = (p) => p.then((value) => ({ ok: true, value: value }), (error) => ({ ok: false, error: error }));

  const DETAIL_SOURCE = {
    users: findUser,
    agents: findAgent,
    identities: findIdentity,
    memories: findMemory,
    sessions: findSession,
    providers: findProvider,
    prompts: findPrompt,
    flags: findFlag,
    runtime: (id) => DB.runtime.find((r) => r.agentId === id) || null,
    media: findMedia
  };

  /* ---- 抽屉与表单的上下文 ---- */
  let drawerCtx = null;
  let formName = null;
  let formCtx = null;

  function openDetail(module, id, tab) {
    const view = VIEWS[module];
    const find = DETAIL_SOURCE[module];
    if (!view || !view.renderDrawer || !find) { toast('该模块没有详情抽屉', 'warn'); return; }
    const item = find(id);
    if (!item) { toast('记录 ' + id + ' 已不存在，列表可能已经刷新', 'error'); return; }
    drawerCtx = { module: module, id: id, tab: tab || (view.drawerTabs ? view.drawerTabs[0].key : null) };
    view.renderDrawer(item, drawerCtx.tab);
  }

  /* tab 切换只重画抽屉；焦点回到被点的那个 tab，不弹回行按钮 */
  function redrawDrawer(tab, focusTab) {
    if (!drawerCtx) return;
    if (tab) drawerCtx.tab = tab;
    const find = DETAIL_SOURCE[drawerCtx.module];
    const item = find ? find(drawerCtx.id) : null;
    if (!item) { closeLayer('drawer'); drawerCtx = null; return; }
    VIEWS[drawerCtx.module].renderDrawer(item, drawerCtx.tab, focusTab);
  }

  function openForm(name, ctx) {
    const f = FORMS[name];
    if (!f) { toast('未定义的表单：' + name, 'error'); return; }
    formCtx = ctx || {};
    if (f.requires && !can(f.requires)) {
      toast('403 · ' + (f.reason || '当前角色无权执行此操作'), 'error');
      return;
    }
    formName = name;
    openModal({
      title: typeof f.title === 'function' ? f.title(formCtx) : f.title,
      desc: f.desc ? f.desc(formCtx) : '',
      icon: f.icon || 'i-pencil',
      size: f.size,
      danger: f.danger,
      body: f.body(formCtx),
      submitText: f.submitText,
      cancelText: f.cancelText,
      submitRequires: f.requires,
      submitReason: f.reason
    });
  }

  async function submitForm(form) {
    const f = FORMS[formName];
    if (!f) return;
    clearFieldErrors(refs.modalBox);
    const values = readForm(form);
    const bad = f.validate ? f.validate(values, form, formCtx) : null;
    if (bad) {
      if (typeof bad === 'string') { showModalError(bad); return; }
      if (bad.field) {
        setFieldError(refs.modalBox, bad.field, bad.msg || '此项必填');
        const el = $('[name="' + bad.field + '"]', refs.modalBox);
        if (el) el.focus();
      } else if (bad.msg) {
        showModalError(bad.msg);
      }
      return;
    }
    await f.run(values, formCtx, $('button[type="submit"]', refs.modalBox), form);
  }

  function refreshCurrent() {
    const m = state.route.module;
    if (m === 'dashboard') { loadDashboard(refs.pageBody); return Promise.resolve(); }
    const store = state.data[m];
    if (LIST_CFG[m] && store && store.dom && store.dom.scroll && store.dom.scroll.isConnected) return loadList(m);
    return Promise.resolve();
  }

  /* 写操作成功后：刷新当前页 → 抽屉里还开着这条记录就跟着重画 */
  async function afterWrite(module) {
    await refreshCurrent();
    if (!drawerCtx || drawerCtx.module !== module) return;
    const find = DETAIL_SOURCE[module];
    if (find && find(drawerCtx.id)) redrawDrawer();
    else { closeLayer('drawer'); drawerCtx = null; }
  }

  /* ---- 表单里复用的小控件 ---- */
  function chipTag(name, value, label) {
    return '<span class="chip-tag" data-chip-value="' + escapeHtml(value) + '">' + escapeHtml(label || value) +
      '<button type="button" data-action="chip.remove" data-chips-for="' + escapeHtml(name) +
      '" data-value="' + escapeHtml(value) + '" data-label="' + escapeHtml(label || value) +
      '" aria-label="移除 ' + escapeHtml(label || value) + '">' +
      icon('i-x') + '</button></span>';
  }

  /* labelOf 默认按用户 ID 渲染，Identity 的特质 / 约束这类纯文本标签传入 (v) => v */
  function chipsInput(name, label, items, placeholder, hint, labelOf) {
    const mode = labelOf ? 'plain' : 'user';
    const text = labelOf || ((v) => userName(v) + '（' + v + '）');
    return '<div class="field is-full"><span class="field-label">' + escapeHtml(label) + '</span>' +
      '<div class="chips-input" data-chips="' + escapeHtml(name) + '" data-label-mode="' + mode + '">' +
        items.map((v) => chipTag(name, v, text(v))).join('') +
        '<input type="text" data-action="chip.add" data-chips-for="' + escapeHtml(name) +
          '" placeholder="' + escapeHtml(placeholder) + '" aria-label="' + escapeHtml(label) + '" autocomplete="off">' +
        '<input type="hidden" id="f-' + escapeHtml(name) + '" name="' + escapeHtml(name) + '" value="' + escapeHtml(items.join(',')) + '">' +
      '</div>' +
      (hint ? '<p class="field-hint">' + hint + '</p>' : '') +
      '<p class="field-error" id="f-' + name + '-error" hidden></p></div>';
  }

  function checkGroup(name, label, options, selected, hint) {
    return '<div class="field is-full"><span class="field-label">' + escapeHtml(label) + '</span>' +
      '<div class="row-wrap">' + options.map((o) =>
        '<label class="chip"><input type="checkbox" name="' + escapeHtml(name) + '" value="' + escapeHtml(o[0]) + '"' +
        (selected.indexOf(o[0]) >= 0 ? ' checked' : '') + '>' + escapeHtml(o[1]) + '</label>').join('') + '</div>' +
      (hint ? '<p class="field-hint">' + hint + '</p>' : '') + '</div>';
  }

  /* ==========================================================
     11.0 · 概览
     ========================================================== */

  VIEWS.dashboard = {
    scroll: 'page',
    actions: () => '<button class="btn btn--ghost" type="button" data-action="dashboard.refresh">' +
      icon('i-refresh') + '重新聚合</button>',
    render(host) { loadDashboard(host); }
  };

  async function loadDashboard(host) {
    const store = state.data.dashboard;
    store.status = 'loading';
    host.setAttribute('aria-busy', 'true');
    host.innerHTML = '<div class="view-stack">' +
      '<div class="stat-grid">' +
        Array(6).fill('<div class="skeleton skeleton-card" aria-hidden="true"></div>').join('') +
      '</div>' +
      '<div class="skeleton skeleton-card" aria-hidden="true"></div>' +
      '<div class="skeleton skeleton-card" aria-hidden="true"></div>' +
      '</div>';
    const res = await Promise.all([
      settle(adminApi.list('/users')), settle(adminApi.list('/agents')),
      settle(adminApi.list('/sessions')), settle(adminApi.list('/media'))
    ]);
    if (!host.isConnected) return;
    host.removeAttribute('aria-busy');
    const bad = res.find((r) => !r.ok);
    if (bad) {
      const e = handleApiError(bad.error);
      store.status = 'error';
      host.innerHTML = emptyState({
        variant: 'is-error', icon: 'i-bug', title: '概览聚合失败',
        desc: escapeHtml((e.status ? e.status + ' · ' : '') + e.message) +
          '<br>概览需要同时读取 <span class="mono">' + escapeHtml(BASE) +
          '/users · /agents · /sessions · /media</span> 四个只读端点，任一失败都会让整页降级。',
        actions: '<button class="btn btn--primary" type="button" data-action="dashboard.refresh">' +
          icon('i-refresh') + '重试</button>'
      });
      return;
    }
    store.status = 'ready';
    host.innerHTML = dashboardHtml(res[0].value.items, res[1].value.items, res[2].value.items, res[3].value.items);
    applyGuards(host);
  }

  function lockedCard(label, module) {
    return '<div class="stat-card">' +
      '<span class="stat-label">' + escapeHtml(label) + '</span>' +
      '<span class="stat-value">' + icon('i-lock') + '</span>' +
      '<span class="stat-foot">' + icon('i-ban') + '当前角色无权读取' + escapeHtml(MODULES[module].title) + '</span>' +
      '</div>';
  }

  function dashboardHtml(users, agents, sessions, media) {
    const role = state.role;
    const now = Date.now();
    const fresh = users.filter((u) => now - u.createdAt < 30 * 86400000).length;
    const off = users.filter((u) => u.status === 'disabled').length;
    const live = sessions.filter((s) => s.status === 'active').length;
    const broken = sessions.filter((s) => s.status === 'error').length;
    const frames = media.filter((m) => m.kind === 'frame');
    const frameSoon = frames.filter((m) => daysLeft(m.expiresAt) <= 2).length;
    const writes = state.audit.items.filter((i) => i.result !== 'pending');
    const denied = writes.filter((i) => i.result === 'denied').length;
    const failed = writes.filter((i) => i.result === 'failed').length;
    const badProviders = DB.providers.filter((p) => p.status === 'down' || p.status === 'degraded').length;
    const reclaimed = agents.filter((a) => a.status === 'reclaimed').length;

    const cards = [
      statCard({
        label: '用户总数', value: String(users.length),
        foot: '<span class="trend-up">+' + fresh + '</span> 近 30 天开通 · ' + off + ' 个已禁用',
        action: 'nav.go', module: 'users'
      }),
      canRoute('agents')
        ? statCard({
          label: 'Agent 实例', value: String(agents.filter((a) => a.status !== 'reclaimed').length),
          foot: agents.filter((a) => a.isDefault && a.status !== 'reclaimed').length + ' 个默认 Agent · ' + reclaimed + ' 个已回收',
          action: 'nav.go', module: 'agents'
        })
        : lockedCard('Agent 实例', 'agents'),
      statCard({
        label: '进行中 Session', value: String(live),
        alert: broken > 0,
        foot: broken ? '<span class="trend-down">' + broken + ' 个异常</span> 需要看错误堆栈' : '没有异常 Session',
        action: 'nav.go', module: 'sessions'
      }),
      canRoute('runtime')
        ? statCard({
          label: 'State 常驻 Agent', value: DB.runtime.length + ' / ' + agents.length,
          foot: '超容量按最近使用淘汰，常驻数受开关 runtime.state_resident 控制',
          action: 'nav.go', module: 'runtime'
        })
        : lockedCard('Agent 运行时状态', 'runtime'),
      canRoute('media')
        ? statCard({
          label: '留存媒体对象', value: String(media.length),
          alert: frameSoon > 0,
          foot: media.filter((m) => m.kind === 'audio').length + ' 个音频留存 · ' +
            (frameSoon ? '<span class="trend-down">' + frameSoon + ' 个视觉原帧 2 天内到期</span>' : frames.length + ' 个视觉原帧'),
          action: 'nav.go', module: 'media'
        })
        : lockedCard('留存媒体', 'media'),
      canRoute('logs')
        ? statCard({
          label: '审计记录（本会话）', value: String(writes.length),
          alert: denied + failed > 0,
          foot: denied + failed
            ? '<span class="trend-down">' + denied + ' 条越权拒绝 · ' + failed + ' 条失败</span>'
            : '全部成功，没有越权与失败',
          action: 'nav.go', module: 'logs', sub: 'audit'
        })
        : lockedCard('日志与审计', 'logs')
    ];

    return '<div class="view-stack">' +
      '<div class="stat-grid">' + cards.join('') + '</div>' +
      '<div class="view-split">' +
        '<div class="view-stack">' +
          cardShell({
            title: '最近写操作', icon: 'i-history', desc: '所有写操作都会进审计，这里只显示最新 5 条',
            extra: canRoute('logs')
              ? '<button class="btn btn--sm btn--ghost" type="button" data-action="nav.go" data-module="logs" data-sub="audit">' +
                '查看全部' + icon('i-chevron-right') + '</button>'
              : '<span class="status-tag is-muted">当前角色看不到审计</span>',
            body: recentWrites(5)
          }) +
          cardShell({
            title: '快捷入口', icon: 'i-index', desc: '按当前角色标记可访问性，无权访问的入口不隐藏',
            body: quickGrid()
          }) +
        '</div>' +
        '<div class="view-stack">' +
          cardShell({
            title: '实时状态', icon: 'i-activity', desc: '聚合自 Agent Service 只读端点',
            body: liveStrip()
          }) +
          noticeBar({
            kind: 'deferred', icon: 'i-clock',
            html: '<strong>Phase 1 内延后项</strong>：用户自助创建 Agent、用户侧配额门、记忆固化与衰减、' +
              '主动通知触达客户端、观察类主动行为、语义记忆与程序记忆。' +
              '这些能力在功能开关里有对应的行，但开关存在不等于能力开放；' +
              (canRoute('flags')
                ? '到「功能开关」页可以看到它们的灰度规则被固定在 dev 环境。'
                : '当前角色无权进入功能开关页查看灰度规则。')
          }) +
          noticeBar({
            kind: 'info', icon: 'i-shield',
            html: '当前演示角色是 <strong>' + escapeHtml(ROLE_LABELS[role].name) + '</strong>（' + escapeHtml(role) + '）。' +
              '权限分三层同时生效：路由级决定能不能进页面，组件级把按钮置灰并给出原因，' +
              'API 级在 <span class="mono">Admin API</span> 侧再校验一次能力标识——即使绕过前端按钮也会被拒。'
          }) +
          (badProviders ? noticeBar({
            kind: 'warn', icon: 'i-alert',
            html: '<strong>' + badProviders + ' 个模型供应商处于降级或不可用状态</strong>。' +
              '切换默认供应商不改变 Prompt 内容，也不改变 Agent 运行时行为。' +
              (canRoute('providers') ? '到供应商配置页可以做连通性测试。' : '当前角色无权进入供应商配置页。')
          }) : '') +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function recentWrites(n) {
    const items = state.audit.items.filter((i) => i.result !== 'pending').slice(0, n);
    if (!items.length) {
      return '<p class="muted">本次会话还没有产生任何写操作。到任意管理页做一次修改，这里会出现记录，' +
        '同时导航「日志、错误与审计」会亮出未读徽标，进入审计页后徽标清零。</p>';
    }
    return '<div class="feed">' + items.map((i) => {
      const ico = i.result === 'denied' ? 'i-lock' : i.result === 'failed' ? 'i-x-circle' : 'i-check-circle';
      return '<div class="feed-item">' + icon(ico) +
        '<span class="feed-copy"><strong>' + escapeHtml(AUDIT_ACTIONS[i.action] || i.action) + '</strong>' +
        '<span title="' + escapeHtml(i.target + ' · ' + (i.detail || '')) + '">' +
          escapeHtml(i.target) + ' · ' + escapeHtml(i.detail || '') + '</span></span>' +
        '<span class="feed-time">' + escapeHtml(formatRelative(i.ts)) + '</span></div>';
    }).join('') + '</div>';
  }

  function quickGrid() {
    return '<div class="quick-grid">' + Object.keys(MODULES).filter((k) => k !== 'dashboard').map((k) => {
      const m = MODULES[k];
      const ok = canRoute(k);
      return '<button class="quick-card" type="button" data-action="nav.go" data-module="' + k + '"' +
        (ok ? '' : ' disabled aria-disabled="true"') +
        ' title="' + escapeHtml(ok ? m.desc : '当前角色（' + ROLE_LABELS[state.role].name + '）无权访问' + m.title) + '">' +
        '<span class="quick-icon">' + icon(ok ? m.icon : 'i-lock') + '</span>' +
        '<span class="quick-copy"><strong>' + escapeHtml(m.title) + '</strong>' +
        '<span>' + escapeHtml(ok ? m.desc : '当前角色无权访问') + '</span></span></button>';
    }).join('') + '</div>';
  }

  function liveStrip() {
    const row = (ico, label, value, extra) =>
      '<div class="live-row">' + icon(ico) + '<strong>' + escapeHtml(label) + '</strong>' +
      '<span>' + value + '</span><span class="spacer"></span>' +
      (extra ? '<span class="cell-mono">' + escapeHtml(extra) + '</span>' : '') + '</div>';

    if (!canRoute('runtime')) {
      return '<div class="live-strip">' +
        row('i-lock', 'Agent 运行时', '<span class="muted">当前角色无权读取</span>', '') +
        row('i-messages', 'WebSocket', '<span class="muted">/ws/runtime 未建立</span>', '只读管理员不订阅实时流') +
        '</div>';
    }
    const rows = DB.runtime;
    const rpm = rows.reduce((s, r) => s + r.reactive.rpm, 0);
    const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.reactive.avgLatencyMs, 0) / rows.length) : 0;
    const ticks = rows.reduce((s, r) => s + r.proactive.tickPerMin, 0);
    const debounce = rows.reduce((s, r) => s + r.proactive.debounceHits, 0);
    const defLlm = DB.providers.find((p) => p.kind === 'llm' && p.isDefault);
    const defTts = DB.providers.find((p) => p.kind === 'tts' && p.isDefault);
    const soon = DB.media.filter((m) => m.kind === 'frame')
      .sort((a, b) => a.expiresAt - b.expiresAt)[0];
    return '<div class="live-strip">' +
      row('i-activity', 'Reactive Loop', rpm + ' 轮 / 分钟', '平均 ' + avg + 'ms') +
      row('i-clock', 'Proactive Loop', ticks + ' tick / 分钟', '去抖命中 ' + debounce + ' 次') +
      row('i-database', 'State 常驻', rows.length + ' 个 Agent', 'VersionSeq 单调递增') +
      row('i-plug', '默认 LLM', escapeHtml(defLlm ? defLlm.model : '未配置'), defLlm ? defLlm.latencyMs + 'ms' : '—') +
      row('i-waveform', '默认语音合成', escapeHtml(defTts ? defTts.model : '未配置'), defTts ? defTts.latencyMs + 'ms' : '—') +
      row('i-frame', '视觉原帧最近到期', soon ? daysLeft(soon.expiresAt) + ' 天后' : '无', soon ? soon.id : '') +
      row('i-wifi', 'WebSocket', '<span class="muted">/ws/runtime 未建立</span>', '进入运行时页才会订阅') +
      '</div>';
  }

  /* ==========================================================
     11.1 · 用户与角色管理
     ========================================================== */

  const USER_WRITE_REASON = '用户生命周期操作（开通 / 重置口令 / 禁用与恢复 / 删除）只开放给系统管理员';
  const USER_KIND_OPTIONS = [['all', '全部类型'], ['public', '正式用户'], ['beta', '内测用户'], ['internal', '内部账号']];
  const USER_STATUS_OPTIONS = [['all', '全部状态'], ['active', '正常'], ['pending', '待激活'], ['disabled', '已禁用']];
  const REGION_OPTIONS = ['华东 1', '华东 2', '华北 1', '华北 2', '华南 1', '华南 2', '华西 1', '华西 2']
    .map((r) => [r, r]);

  function usersFilterSummary(f) {
    const parts = [];
    if (f.q) parts.push('关键字「' + f.q + '」');
    if (f.kind !== 'all') parts.push(KIND_TEXT[f.kind] || f.kind);
    if (f.status !== 'all') parts.push(STATUS_TEXT[f.status] || f.status);
    return parts.join(' + ') || '无';
  }

  VIEWS.users = {
    scroll: 'list',
    drawerTabs: [
      { key: 'overview', label: '基本信息', icon: 'i-user' },
      { key: 'relations', label: 'Agent 与 Session', icon: 'i-agent' },
      { key: 'lifecycle', label: '生命周期历史', icon: 'i-history' }
    ],
    actions: () => '<button class="btn btn--primary" type="button" data-action="user.create"' +
      guardAttr('user:write', USER_WRITE_REASON) + '>' + icon('i-user-plus') + '开通用户</button>',
    render(host) {
      mountList(host, 'users', {
        path: '/users',
        caption: '用户列表',
        pageSize: 8,
        skeletonRows: 8,
        columns: [
          { label: '用户' },
          { label: '类型', width: '92px', cls: 'col-optional' },
          { label: 'Agent 配额', width: '150px' },
          { label: '状态', width: '88px' },
          { label: '最近活跃', width: '110px', cls: 'col-optional' },
          { label: '操作', width: '124px', cls: 'cell-actions' }
        ],
        filters(store) {
          const f = store.filters;
          return filterSearch('users', 'q', '搜索昵称、账号名、邮箱或用户 ID', f.q) +
            filterSelect('users', 'kind', '用户类型', USER_KIND_OPTIONS, f.kind) +
            USER_STATUS_OPTIONS.map((o) =>
              filterChip('users', 'status', o[0], o[1], f.status === o[0],
                o[0] === 'all' ? store.items.length : store.items.filter((u) => u.status === o[0]).length)).join('') +
            '<span class="filter-summary">只读端点 GET ' + BASE + '/users</span>';
        },
        filter(items, f) {
          const q = (f.q || '').trim().toLowerCase();
          return items.filter((u) =>
            (f.kind === 'all' || u.kind === f.kind) &&
            (f.status === 'all' || u.status === f.status) &&
            (!q || [u.name, u.handle, u.email, u.id, u.region].join(' ').toLowerCase().indexOf(q) >= 0));
        },
        row(u) {
          const used = agentCountOf(u.id);
          return '<tr>' +
            td('<span class="cell-id"><span class="cell-avatar">' + escapeHtml(u.name.slice(0, 1)) + '</span>' +
              '<span class="cell-id-copy">' + rowOpen('users', u.id, u.name) +
              '<span>' + escapeHtml(u.id + ' · @' + u.handle) + '</span></span></span>', '',
              u.name + '（' + u.email + '）') +
            td('<span class="status-tag is-muted">' + escapeHtml(KIND_TEXT[u.kind] || u.kind) + '</span>', 'col-optional') +
            td('<span class="quota-cell">' + progressHtml(used, u.quota.limit, u.name + ' 的 Agent 配额') +
              '<span class="progress-label">' + used + ' / ' + u.quota.limit + ' 个 Agent 实例</span></span>') +
            td(statusTag(u.status)) +
            td(timeAgo(u.lastActiveAt), 'col-optional cell-mono', formatDateTime(u.lastActiveAt)) +
            td(rowActions([
              iconAction('user.reset', 'i-key', '重置口令', ' data-id="' + u.id + '"', 'user:write', USER_WRITE_REASON),
              u.status === 'disabled'
                ? iconAction('user.enable', 'i-unlock', '恢复用户', ' data-id="' + u.id + '"', 'user:write', USER_WRITE_REASON)
                : iconAction('user.disable', 'i-power', '禁用用户', ' data-id="' + u.id + '"', 'user:write', USER_WRITE_REASON),
              iconAction('user.delete', 'i-trash', '删除用户（级联）', ' data-id="' + u.id + '"', 'user:write', USER_WRITE_REASON)
            ]), 'cell-actions') +
          '</tr>';
        },
        empty(store) {
          const f = store.filters;
          if (f.q || f.kind !== 'all' || f.status !== 'all') {
            return emptyState({
              icon: 'i-search', title: '没有匹配的用户',
              desc: '当前筛选条件是「' + escapeHtml(usersFilterSummary(f)) + '」，没有命中的记录。',
              actions: '<button class="btn btn--ghost" type="button" data-action="filter.reset" data-key="users">' +
                icon('i-refresh') + '清空筛选</button>'
            });
          }
          return emptyState({
            icon: 'i-inbox', title: '用户列表为空',
            desc: '演示注入「空数据」会让所有只读端点返回 0 条，用来检查空状态文案。关闭注入即可看到 mock 用户。',
            actions: '<button class="btn btn--ghost" type="button" data-action="chaos.set" data-mode="none">' +
              icon('i-check-circle') + '关闭演示注入</button>'
          });
        },
        footExtra(store) {
          return store.filtered !== store.items.length
            ? '<span class="filter-summary">筛选后 ' + store.filtered + ' 条</span>' : '';
        }
      });
    },
    renderDrawer(u, tab, focusTab) {
      openDrawer({
        title: u.name,
        icon: 'i-user',
        desc: '<span class="mono">' + escapeHtml(u.id) + '</span> · @' + escapeHtml(u.handle) + ' · ' +
          escapeHtml(KIND_TEXT[u.kind] || u.kind) + ' · ' + escapeHtml(u.email),
        headExtra: statusTag(u.status),
        tabs: tabsHtml('drawer.tab', VIEWS.users.drawerTabs, tab, { label: '用户详情分区' }),
        body: userDrawerBody(u, tab),
        foot: userDrawerFoot(u),
        onMount: focusTab ? focusActiveTab : null
      });
    }
  };

  function focusActiveTab(root) {
    const t = $('.tab.is-active', root);
    if (t) t.focus({ preventScroll: true });
  }

  function userDrawerBody(u, tab) {
    if (tab === 'relations') return userRelations(u);
    if (tab === 'lifecycle') return userLifecycle(u);
    const used = agentCountOf(u.id);
    return kvList([
      ['用户 ID', '<span class="mono">' + escapeHtml(u.id) + '</span>'],
      ['昵称', escapeHtml(u.name)],
      ['账号名', '<span class="mono">@' + escapeHtml(u.handle) + '</span>'],
      ['邮箱', escapeHtml(u.email)],
      ['类型', escapeHtml(KIND_TEXT[u.kind] || u.kind)],
      ['状态', statusTag(u.status)],
      ['注册时间', escapeHtml(formatDateTime(u.createdAt))],
      ['最近活跃', timeAgo(u.lastActiveAt)],
      ['登录设备', u.deviceCount + ' 台'],
      ['地域', escapeHtml(u.region)],
      ['Agent 配额', progressHtml(used, u.quota.limit, u.name + ' 的 Agent 配额') +
        '<span class="progress-label">已占用 ' + used + ' 个，上限 ' + u.quota.limit + ' 个</span>']
    ]) + noticeBar({
      kind: 'info', icon: 'i-shield',
      html: '用户生命周期的三个写操作——<strong>开通、重置口令、禁用与恢复</strong>——以及级联删除，' +
        '在权限矩阵里都只开放给系统管理员；只读管理员与内容管理员看到的是置灰按钮加原因气泡，' +
        '即使直接调用 <span class="mono">Admin API</span> 也会被能力校验拒绝并记一条 <span class="mono">denied</span> 审计。'
    }) + (used >= u.quota.limit ? noticeBar({
      kind: 'warn', icon: 'i-alert',
      html: '该用户的 Agent 配额已满（' + used + '/' + u.quota.limit + '），再登记新的 Agent 实例会被服务端以 409 拒绝。' +
        '注意：用户侧配额门是 Phase 1 内延后项，客户端不会收到配额拒绝，配额只在后台侧生效。'
    }) : '');
  }

  function userRelations(u) {
    const ags = DB.agents.filter((a) => a.ownerId === u.id);
    const ses = DB.sessions.filter((s) => s.userId === u.id).sort((a, b) => b.lastEventAt - a.lastEventAt);
    return sectionTitle('名下 Agent 实例（' + ags.length + '）', 'i-agent') +
      (ags.length ? timelineHtml(ags.map((a) => ({
        title: a.name,
        icon: a.isDefault ? 'i-spark' : 'i-agent',
        tag: statusTag(a.status) + (a.isDefault ? '<span class="status-tag is-primary">默认 Agent</span>' : ''),
        ts: a.lastRunAt,
        muted: a.status === 'reclaimed',
        body: '<span class="mono">' + escapeHtml(a.id) + '</span> · AI 身份 ' + escapeHtml(a.identityId) +
          ' · State v' + a.stateVersion + (a.resident ? ' · State 常驻' : ' · 未常驻') +
          (a.status === 'reclaimed' && a.reclaimReason ? '<br>回收原因：' + escapeHtml(a.reclaimReason) : '') +
          '<span class="row">' +
            '<button class="btn btn--sm btn--ghost" type="button" data-action="nav.go" data-module="identities" data-id="' +
              escapeHtml(a.identityId) + '">' + icon('i-mask') + 'AI 身份</button>' +
            '<button class="btn btn--sm btn--ghost" type="button" data-action="nav.go" data-module="agents" data-id="' +
              escapeHtml(a.id) + '">' + icon('i-agent') + 'Agent 详情</button>' +
          '</span>'
      }))) : '<p class="muted">该用户名下没有 Agent 实例。</p>') +
      '<div class="divider"></div>' +
      sectionTitle('最近 Session（' + ses.length + '）', 'i-messages') +
      (ses.length ? timelineHtml(ses.slice(0, 6).map((s) => ({
        title: s.id,
        icon: 'i-messages',
        tag: statusTag(s.status) + '<span class="status-tag is-info">' + escapeHtml(MODE_TEXT[s.mode] || s.mode) + '</span>',
        ts: s.lastEventAt,
        muted: s.status === 'ended',
        body: s.turnCount + ' 轮 · ' + escapeHtml(DEVICE_TEXT[s.device] || s.device) + ' · Agent ' + escapeHtml(s.agentId) +
          (s.error ? '<br><span class="muted">' + escapeHtml(s.error) + '</span>' : '')
      }))) : '<p class="muted">该用户没有 Session 记录。</p>');
  }

  function userLifecycle(u) {
    const related = state.audit.items.filter((i) => i.path.indexOf(u.id) >= 0);
    return sectionTitle('用户生命周期事件', 'i-history') +
      timelineHtml(u.lifecycle.slice().reverse().map((e) => ({
        title: AUDIT_ACTIONS[e.action] || e.action,
        icon: e.action === 'user.create' ? 'i-user-plus'
          : e.action === 'user.disable' ? 'i-power'
          : e.action === 'user.enable' ? 'i-unlock'
          : e.action === 'user.delete' ? 'i-trash' : 'i-key',
        ts: e.ts,
        body: escapeHtml(e.note) + '<br><span class="muted">操作人 ' + escapeHtml(e.actor) + '</span>'
      }))) +
      '<div class="divider"></div>' +
      sectionTitle('后台审计中与本用户相关的记录（' + related.length + '）', 'i-shield') +
      (related.length ? timelineHtml(related.map((i) => ({
        title: AUDIT_ACTIONS[i.action] || i.action,
        icon: i.result === 'denied' ? 'i-lock' : i.result === 'failed' ? 'i-x-circle' : 'i-check-circle',
        tag: statusTag(i.result),
        ts: i.ts,
        muted: i.result !== 'success',
        body: '<span class="mono">' + escapeHtml(i.method + ' ' + i.path) + '</span><br>' +
          escapeHtml(i.detail || '') + '<br><span class="muted">' + escapeHtml(i.actor) + ' · ' +
          escapeHtml(ROLE_LABELS[i.actorRole] ? ROLE_LABELS[i.actorRole].name : i.actorRole) + '</span>'
      }))) : '<p class="muted">审计里没有与本用户相关的记录。</p>') +
      noticeBar({
        kind: 'info', icon: 'i-shield',
        html: '删除用户会级联清理 Agent 实例、AI 身份、记忆、Session 与留存媒体对象，' +
          '但<strong>审计记录按独立保留期另行留存</strong>，删除动作本身也会记一条审计。'
      });
  }

  function userDrawerFoot(u) {
    const g = guardAttr('user:write', USER_WRITE_REASON);
    return '<button class="btn btn--ghost" type="button" data-action="user.quota" data-id="' + u.id + '"' + g + '>' +
        icon('i-sliders') + '调整配额</button>' +
      '<button class="btn btn--ghost" type="button" data-action="user.reset" data-id="' + u.id + '"' + g + '>' +
        icon('i-key') + '重置口令</button>' +
      '<span class="spacer"></span>' +
      (u.status === 'disabled'
        ? '<button class="btn btn--primary" type="button" data-action="user.enable" data-id="' + u.id + '"' + g + '>' +
          icon('i-unlock') + '恢复用户</button>'
        : '<button class="btn btn--ghost" type="button" data-action="user.disable" data-id="' + u.id + '"' + g + '>' +
          icon('i-power') + '禁用用户</button>') +
      '<button class="btn btn--danger" type="button" data-action="user.delete" data-id="' + u.id + '"' + g + '>' +
        icon('i-trash') + '删除</button>';
  }

  /* ---- 表单：开通 / 重置口令 / 禁用与恢复 / 调整配额 / 删除 ---- */

  FORMS.userCreate = {
    icon: 'i-user-plus',
    title: '开通用户',
    desc: () => '新用户初始状态为「待激活」，初始口令经带内渠道一次性下发，服务端只保存哈希。',
    requires: 'user:write',
    reason: USER_WRITE_REASON,
    submitText: '开通',
    body: () => '<div class="form-grid">' +
      fieldHtml({ name: 'name', label: '昵称', required: true, autofocus: true, placeholder: '例如：沈知微', maxlength: 24 }) +
      fieldHtml({ name: 'handle', label: '账号名', placeholder: '留空则自动生成', maxlength: 24, hint: '小写字母、数字与下划线，全站唯一' }) +
      fieldHtml({ name: 'email', label: '邮箱', type: 'email', placeholder: 'user@example.com', autocomplete: 'off' }) +
      fieldHtml({ name: 'kind', label: '用户类型', type: 'select', value: 'public', options: USER_KIND_OPTIONS.slice(1) }) +
      fieldHtml({ name: 'region', label: '地域', type: 'select', value: '华东 1', options: REGION_OPTIONS }) +
      fieldHtml({ name: 'quotaLimit', label: 'Agent 配额上限', type: 'number', value: 3, min: 1, max: 20, inputmode: 'numeric', hint: '用户侧配额门是 Phase 1 内延后项，这里只在后台侧生效' }) +
      fieldHtml({ name: 'note', label: '开通说明', type: 'textarea', full: true, rows: 2, maxlength: 120, placeholder: '会同时写入审计与用户生命周期历史' }) +
      '</div>',
    validate(v) {
      if (!v.name || !v.name.trim()) return { field: 'name', msg: '昵称必填' };
      if (v.handle && !/^[a-z0-9_]{2,24}$/.test(v.handle.trim())) return { field: 'handle', msg: '账号名只能用小写字母、数字与下划线，长度 2–24' };
      if (v.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email.trim())) return { field: 'email', msg: '邮箱格式不正确' };
      return null;
    },
    async run(v, ctx, busyEl) {
      await runWrite({
        action: 'user.create', method: 'POST', path: '/users', capability: 'user:write',
        target: '用户 @' + (v.handle || v.name), body: v, reason: USER_WRITE_REASON, busyEl: busyEl,
        refresh: () => afterWrite('users')
      });
    }
  };

  FORMS.userReset = {
    icon: 'i-key',
    title: '重置登录口令',
    desc: (ctx) => {
      const u = findUser(ctx.id);
      return u ? '目标：<span class="mono">' + escapeHtml(u.id) + '</span> · ' + escapeHtml(u.name) : '';
    },
    requires: 'user:write',
    reason: USER_WRITE_REASON,
    submitText: '重置口令',
    body: () => '<div class="form-grid">' +
      fieldHtml({
        name: 'reason', label: '重置原因', type: 'textarea', full: true, rows: 3, required: true, autofocus: true,
        maxlength: 120, placeholder: '例如：自助找回失败，用户已通过客服完成身份核验'
      }) +
      '</div>' +
      noticeBar({
        kind: 'info', icon: 'i-lock',
        html: '口令明文不入库、后台也不回显：服务端只保存哈希，新口令通过带内渠道一次性下发。' +
          '原因会原样写入审计，用于事后追溯。'
      }),
    validate: (v) => (!v.reason || !v.reason.trim() ? { field: 'reason', msg: '重置原因必填，会写入审计' } : null),
    async run(v, ctx, busyEl) {
      const u = findUser(ctx.id);
      await runWrite({
        action: 'user.reset_password', method: 'PUT', path: '/users/' + ctx.id + '/password',
        capability: 'user:write', target: '用户 ' + ctx.id + (u ? ' · ' + u.name : ''),
        body: { reason: v.reason.trim() }, reason: USER_WRITE_REASON, busyEl: busyEl,
        refresh: () => afterWrite('users')
      });
    }
  };

  FORMS.userStatus = {
    icon: 'i-power',
    title: (ctx) => (ctx.status === 'disabled' ? '禁用用户' : '恢复用户'),
    desc: (ctx) => {
      const u = findUser(ctx.id);
      return u ? '目标：<span class="mono">' + escapeHtml(u.id) + '</span> · ' + escapeHtml(u.name) +
        '，当前状态 ' + escapeHtml(STATUS_TEXT[u.status] || u.status) : '';
    },
    requires: 'user:write',
    reason: USER_WRITE_REASON,
    danger: true,
    submitText: (ctx) => (ctx.status === 'disabled' ? '确认禁用' : '确认恢复'),
    body: (ctx) => {
      const u = findUser(ctx.id);
      const disabling = ctx.status === 'disabled';
      return '<div class="form-grid">' +
        fieldHtml({
          name: 'reason', label: disabling ? '禁用原因' : '恢复原因', type: 'textarea', full: true, rows: 3,
          required: true, autofocus: true, maxlength: 120,
          placeholder: disabling ? '例如：风控标记疑似批量注册，禁用待复核' : '例如：申诉通过，恢复访问'
        }) +
        '</div>' +
        noticeBar({
          kind: disabling ? 'warn' : 'info', icon: disabling ? 'i-alert' : 'i-unlock',
          html: disabling
            ? '禁用后该用户名下 <strong>' + agentCountOf(ctx.id) + ' 个 Agent 实例</strong>的运行时会在下一轮 tick 停止，' +
              '但 Agent 数据、AI 身份、记忆与留存媒体全部保留；进行中的 Session 不会被强制结束。'
            : '恢复后用户可以重新访问，Agent 运行时会在下一轮 tick 重新加载 State 快照。'
        });
    },
    validate: (v) => (!v.reason || !v.reason.trim() ? { field: 'reason', msg: '状态变更原因必填，会写入审计' } : null),
    async run(v, ctx, busyEl) {
      const u = findUser(ctx.id);
      const disabling = ctx.status === 'disabled';
      await runWrite({
        action: disabling ? 'user.disable' : 'user.enable', method: 'PUT',
        path: '/users/' + ctx.id + '/status', capability: 'user:write',
        target: '用户 ' + ctx.id + (u ? ' · ' + u.name : ''),
        body: { status: ctx.status, reason: v.reason.trim() }, reason: USER_WRITE_REASON, busyEl: busyEl,
        refresh: () => afterWrite('users')
      });
    }
  };

  FORMS.userQuota = {
    icon: 'i-sliders',
    title: '调整 Agent 配额',
    desc: (ctx) => {
      const u = findUser(ctx.id);
      return u ? '目标：<span class="mono">' + escapeHtml(u.id) + '</span> · ' + escapeHtml(u.name) : '';
    },
    requires: 'user:write',
    reason: USER_WRITE_REASON,
    submitText: '保存配额',
    size: 'sm',
    body: (ctx) => {
      const u = findUser(ctx.id) || { id: ctx.id, quota: { limit: 3 } };
      const used = agentCountOf(u.id);
      return '<div class="form-grid">' +
        fieldHtml({
          name: 'current', label: '当前占用', type: 'static',
          html: used + ' / ' + u.quota.limit + ' 个 Agent 实例' + progressHtml(used, u.quota.limit, '当前配额占用')
        }) +
        fieldHtml({
          name: 'limit', label: '新的配额上限', type: 'number', value: u.quota.limit, min: 1, max: 20,
          inputmode: 'numeric', autofocus: true, hint: '不能低于已占用的 ' + used + ' 个'
        }) +
        fieldHtml({ name: 'reason', label: '调整原因', type: 'text', full: true, maxlength: 80, placeholder: '例如：内测用户扩容' }) +
        '</div>' +
        noticeBar({
          kind: 'deferred', icon: 'i-clock',
          html: DEFERRED.quotaGate
        });
    },
    validate(v, form, ctx) {
      const u = findUser(ctx.id);
      const n = Number(v.limit);
      if (!n || n < 1) return { field: 'limit', msg: '配额上限必须是大于 0 的整数' };
      if (u && n < agentCountOf(u.id)) return { field: 'limit', msg: '配额下限不能低于当前已占用的 ' + agentCountOf(u.id) + ' 个' };
      return null;
    },
    async run(v, ctx, busyEl) {
      const u = findUser(ctx.id);
      await runWrite({
        action: 'user.quota_update', method: 'PUT', path: '/users/' + ctx.id + '/agent-quota',
        capability: 'user:write', target: '用户 ' + ctx.id + (u ? ' · ' + u.name : ''),
        body: { limit: Number(v.limit), reason: v.reason }, reason: USER_WRITE_REASON, busyEl: busyEl,
        refresh: () => afterWrite(ctx.from || 'users')
      });
    }
  };

  FORMS.userDelete = {
    icon: 'i-trash',
    title: '删除用户（级联）',
    desc: (ctx) => {
      const u = findUser(ctx.id);
      return u ? '目标：<span class="mono">' + escapeHtml(u.id) + '</span> · ' + escapeHtml(u.name) +
        ' · ' + escapeHtml(KIND_TEXT[u.kind] || u.kind) : '';
    },
    requires: 'user:write',
    reason: USER_WRITE_REASON,
    danger: true,
    size: 'lg',
    submitText: '永久删除',
    body: (ctx) => {
      const u = findUser(ctx.id);
      if (!u) return '<p class="muted">该用户已不存在。</p>';
      const ags = DB.agents.filter((a) => a.ownerId === u.id);
      const ids = ags.map((a) => a.id);
      const rows = [
        ['i-agent', 'Agent 实例', ags.length, '归属登记一并解除，State 常驻立即释放'],
        ['i-mask', 'AI 身份', DB.identities.filter((x) => ids.indexOf(x.agentId) >= 0).length, 'Identity 的全部版本随 Agent 一起清理'],
        ['i-brain', '记忆', DB.memories.filter((m) => ids.indexOf(m.agentId) >= 0).length, '六类记忆全部删除，不可恢复'],
        ['i-messages', 'Session', DB.sessions.filter((s) => s.userId === u.id).length, '进行中的 Session 会被标记为已结束'],
        ['i-waveform', '留存媒体', DB.media.filter((m) => m.userId === u.id).length, '音频留存与视觉留存的对象存储字节一并删除，媒体索引保留']
      ];
      return '<div class="form-grid">' +
        fieldHtml({
          name: 'target', label: '当前状态', type: 'static', full: true,
          html: statusTag(u.status) + ' 注册于 ' + escapeHtml(formatDateTime(u.createdAt)) +
            '，最近活跃 ' + escapeHtml(formatRelative(u.lastActiveAt))
        }) +
        '</div>' +
        sectionTitle('级联删除范围', 'i-alert') +
        '<ul class="cascade-list">' + rows.map((r) =>
          '<li>' + icon(r[0]) +
          '<span>' + escapeHtml(r[1]) + ' <span class="muted">' + escapeHtml(r[3]) + '</span></span>' +
          '<span class="cascade-note">' + r[2] + ' 项</span></li>').join('') + '</ul>' +
        '<div class="form-grid">' +
        fieldHtml({
          name: 'reason', label: '删除原因', type: 'textarea', full: true, rows: 2, required: true, maxlength: 120,
          placeholder: '例如：用户提交注销申请，已完成身份核验'
        }) +
        fieldHtml({
          name: 'force', label: '我知道这不可恢复', type: 'switch', full: true, value: false,
          onText: '确认永久删除', offText: '未确认',
          hint: u.status === 'active' ? '该用户仍是活跃状态：必须先禁用，或在这里显式确认' : '该用户已禁用，仍建议显式确认'
        }) +
        '</div>' +
        noticeBar({
          kind: 'info', icon: 'i-shield',
          html: '审计记录不随用户删除而清理，它按独立保留期留存；本次删除动作本身也会写入一条审计。'
        });
    },
    validate(v, form, ctx) {
      if (!v.reason || !v.reason.trim()) return { field: 'reason', msg: '删除原因必填，会写入审计' };
      const u = findUser(ctx.id);
      if (u && u.status === 'active' && !v.force) {
        return { field: 'force', msg: '活跃用户需先禁用再删除，或勾选「我知道这不可恢复」' };
      }
      return null;
    },
    async run(v, ctx, busyEl) {
      const u = findUser(ctx.id);
      const res = await runWrite({
        action: 'user.delete', method: 'DELETE', path: '/users/' + ctx.id, capability: 'user:write',
        target: '用户 ' + ctx.id + (u ? ' · ' + u.name : ''),
        body: { reason: v.reason.trim(), force: v.force }, reason: USER_WRITE_REASON, busyEl: busyEl,
        refresh: () => afterWrite('users')
      });
      if (res && drawerCtx && drawerCtx.module === 'users' && drawerCtx.id === ctx.id) {
        closeLayer('drawer');
        drawerCtx = null;
      }
    }
  };

  /* 共享：审计条目 → 时间轴。agents / identities / memories / providers 的详情抽屉都复用这一份，
     避免每个模块各写一遍「方法 + 路径 + 结果 + 操作人」的排版。 */
  function auditTimeline(items, emptyText) {
    if (!items.length) return '<p class="muted">' + escapeHtml(emptyText || '审计里没有相关记录。') + '</p>';
    return timelineHtml(items.map((i) => ({
      title: AUDIT_ACTIONS[i.action] || i.action,
      icon: i.result === 'denied' ? 'i-lock' : i.result === 'failed' ? 'i-x-circle' : 'i-check-circle',
      tag: statusTag(i.result),
      ts: i.ts,
      muted: i.result !== 'success',
      body: '<span class="mono">' + escapeHtml(i.method + ' ' + i.path) + '</span><br>' +
        escapeHtml(i.detail || '') + '<br><span class="muted">' + escapeHtml(i.actor) + ' · ' +
        escapeHtml(ROLE_LABELS[i.actorRole] ? ROLE_LABELS[i.actorRole].name : i.actorRole) + '</span>'
    })));
  }

  const auditOf = (token) => state.audit.items.filter((i) =>
    (i.path || '').indexOf(token) >= 0 || (i.target || '').indexOf(token) >= 0);

  /* ==========================================================
     11.2 · Agent 实例管理
     术语按词表：Agent 归属登记 / 归属解析 / 默认 Agent
     ========================================================== */

  const AGENT_WRITE_REASON = 'Agent 实例的归属登记与回收开放给内容管理员与系统管理员';
  const AGENT_STATUS_OPTIONS = [
    ['all', '全部状态'], ['active', '正常'], ['idle', '闲置'], ['suspended', '已暂停'], ['reclaimed', '已回收']
  ];

  function agentOwnerOptions() {
    const ids = [];
    DB.agents.forEach((a) => { if (ids.indexOf(a.ownerId) < 0) ids.push(a.ownerId); });
    return [['all', '全部归属用户']].concat(ids.map((id) => [id, userName(id) + ' · ' + id]));
  }

  function agentsFilterSummary(f) {
    const parts = [];
    if (f.q) parts.push('关键字「' + f.q + '」');
    if (f.owner !== 'all') parts.push(userName(f.owner));
    if (f.status !== 'all') parts.push(STATUS_TEXT[f.status] || f.status);
    return parts.join(' + ') || '无';
  }

  function ownerLine(ownerId) {
    const u = findUser(ownerId);
    return '<span class="owner-line">' + icon('i-user') +
      '<span>' + escapeHtml(u ? u.name + ' · ' + u.id : ownerId) + '</span></span>';
  }

  /* 归属解析：只有默认 Agent 能靠 userId 解析出来，其余实例必须显式带 agentId */
  function resolveLine(ag) {
    return ag.isDefault
      ? '<span class="status-tag is-primary">默认 Agent</span> <span class="muted">Client API 只带 userId 时可解析到本实例</span>'
      : '<span class="status-tag is-muted">非默认</span> <span class="muted">必须由客户端显式指定 agentId 才会命中</span>';
  }

  function stateCell(ag) {
    return (ag.resident
      ? '<span class="status-tag is-ok">State 常驻</span>'
      : '<span class="status-tag is-muted">已淘汰</span>') +
      ' <span class="cell-mono">v' + ag.stateVersion + '</span>';
  }

  VIEWS.agents = {
    scroll: 'list',
    drawerTabs: [
      { key: 'registry', label: '归属登记', icon: 'i-agent' },
      { key: 'identity', label: 'AI 身份摘要', icon: 'i-mask' },
      { key: 'history', label: '回收与审计', icon: 'i-history' }
    ],
    actions: () =>
      '<button class="btn btn--ghost" type="button" data-action="agent.selfCreate" data-deferred="selfCreate">' +
        icon('i-clock') + '用户自助申请' + deferredTag('延后') + '</button>' +
      '<button class="btn btn--primary" type="button" data-action="agent.create"' +
        guardAttr('agent:write', AGENT_WRITE_REASON) + '>' + icon('i-plus') + '登记 Agent 实例</button>',
    render(host) {
      mountList(host, 'agents', {
        path: '/agents',
        caption: 'Agent 实例列表',
        pageSize: 8,
        skeletonRows: 8,
        columns: [
          { label: 'Agent 实例' },
          { label: '归属用户', width: '150px', cls: 'col-optional' },
          { label: '归属解析', width: '104px' },
          { label: 'Agent State', width: '150px' },
          { label: '状态', width: '88px' },
          { label: '最近运行', width: '104px', cls: 'col-optional' },
          { label: '操作', width: '92px', cls: 'cell-actions' }
        ],
        filters(store) {
          const f = store.filters;
          return filterSearch('agents', 'q', '搜索 Agent 名称、实例 ID 或 AI 身份 ID', f.q) +
            filterSelect('agents', 'owner', '归属用户', agentOwnerOptions(), f.owner) +
            AGENT_STATUS_OPTIONS.map((o) =>
              filterChip('agents', 'status', o[0], o[1], f.status === o[0],
                o[0] === 'all' ? store.items.length : store.items.filter((a) => a.status === o[0]).length)).join('') +
            '<span class="filter-summary">只读端点 GET ' + BASE + '/agents</span>';
        },
        filter(items, f) {
          const q = (f.q || '').trim().toLowerCase();
          return items.filter((a) =>
            (f.owner === 'all' || a.ownerId === f.owner) &&
            (f.status === 'all' || a.status === f.status) &&
            (!q || [a.name, a.id, a.identityId, a.ownerId, userName(a.ownerId)].join(' ').toLowerCase().indexOf(q) >= 0));
        },
        row(ag) {
          const idn = findIdentity(ag.identityId);
          return '<tr>' +
            td('<span class="cell-id"><span class="cell-avatar">' + icon('i-agent') + '</span>' +
              '<span class="cell-id-copy">' + rowOpen('agents', ag.id, ag.name) +
              '<span>' + escapeHtml(ag.id + ' · ' + (idn ? idn.id + ' v' + idn.version : '未绑定 AI 身份')) +
              '</span></span></span>', '', ag.name + '（归属 ' + userName(ag.ownerId) + '）') +
            td(ownerLine(ag.ownerId), 'col-optional', userName(ag.ownerId)) +
            td(ag.isDefault
              ? '<span class="status-tag is-primary">默认 Agent</span>'
              : '<span class="status-tag is-muted">非默认</span>') +
            td(stateCell(ag)) +
            td(statusTag(ag.status)) +
            td(timeAgo(ag.lastRunAt), 'col-optional cell-mono', formatDateTime(ag.lastRunAt)) +
            td(rowActions([
              iconAction('agent.identity', 'i-mask', '查看 AI 身份',
                ' data-id="' + escapeHtml(ag.identityId) + '"', 'identity:write', IDENTITY_WRITE_REASON),
              iconAction('agent.reclaim', 'i-reclaim', '回收 Agent 实例',
                ' data-id="' + ag.id + '"', 'agent:write', AGENT_WRITE_REASON)
            ]), 'cell-actions') +
          '</tr>';
        },
        empty(store) {
          const f = store.filters;
          if (f.q || f.owner !== 'all' || f.status !== 'all') {
            return emptyState({
              icon: 'i-search', title: '没有匹配的 Agent 实例',
              desc: '当前筛选条件是「' + escapeHtml(agentsFilterSummary(f)) + '」，没有命中的记录。',
              actions: '<button class="btn btn--ghost" type="button" data-action="filter.reset" data-key="agents">' +
                icon('i-refresh') + '清空筛选</button>'
            });
          }
          return emptyState({
            icon: 'i-agent', title: '还没有登记任何 Agent 实例',
            desc: 'Agent 实例只能由管理后台登记：先有用户，再为用户登记实例，创建时会同时派生一份草稿 AI 身份。',
            actions: '<button class="btn btn--primary" type="button" data-action="agent.create"' +
              guardAttr('agent:write', AGENT_WRITE_REASON) + '>' + icon('i-plus') + '登记 Agent 实例</button>'
          });
        },
        footExtra(store) {
          return store.filtered !== store.items.length
            ? '<span class="filter-summary">筛选后 ' + store.filtered + ' 条</span>' : '';
        }
      });
      /* 延后说明放在筛选条之上：它是页面级前提，不属于任何一行数据 */
      host.insertAdjacentHTML('afterbegin', noticeBar({
        kind: 'deferred', icon: 'i-clock',
        html: '<strong>用户自助创建与用户侧配额门是 Phase 1 内延后项。</strong>' + DEFERRED.selfCreate +
          '；本页的配额只在后台登记时校验，客户端不会收到配额拒绝。'
      }));
    },
    renderDrawer(ag, tab, focusTab) {
      openDrawer({
        title: ag.name,
        icon: 'i-agent',
        desc: '<span class="mono">' + escapeHtml(ag.id) + '</span> · 归属 ' + escapeHtml(userName(ag.ownerId)) +
          ' · AI 身份 <span class="mono">' + escapeHtml(ag.identityId) + '</span>',
        headExtra: statusTag(ag.status) + (ag.isDefault ? '<span class="status-tag is-primary">默认 Agent</span>' : ''),
        tabs: tabsHtml('drawer.tab', VIEWS.agents.drawerTabs, tab, { label: 'Agent 实例详情分区' }),
        body: agentDrawerBody(ag, tab),
        foot: agentDrawerFoot(ag),
        onMount: focusTab ? focusActiveTab : null
      });
    }
  };

  function agentDrawerBody(ag, tab) {
    if (tab === 'identity') return agentIdentityTab(ag);
    if (tab === 'history') return agentHistoryTab(ag);
    return agentRegistryTab(ag);
  }

  function agentRegistryTab(ag) {
    const owner = findUser(ag.ownerId);
    const used = owner ? agentCountOf(owner.id) : 0;
    const limit = owner ? owner.quota.limit : 0;
    return sectionTitle('Agent 归属登记', 'i-agent') +
      kvList([
        ['实例 ID', '<span class="mono">' + escapeHtml(ag.id) + '</span>'],
        ['名称', escapeHtml(ag.name)],
        ['归属用户', owner
          ? '<button class="row-link" type="button" data-action="nav.go" data-module="users" data-id="' +
            escapeHtml(owner.id) + '">' + escapeHtml(owner.name) + '</button> <span class="muted">@' +
            escapeHtml(owner.handle) + '</span>'
          : '<span class="muted">归属用户已不存在</span>'],
        ['归属解析', resolveLine(ag)],
        ['状态', statusTag(ag.status)],
        ['登记时间', formatDateTime(ag.createdAt) + ' <span class="muted">' + timeAgo(ag.createdAt) + '</span>'],
        ['最近运行', formatDateTime(ag.lastRunAt) + ' <span class="muted">' + timeAgo(ag.lastRunAt) + '</span>'],
        ['Agent State', stateCell(ag) + (ag.resident
          ? ' <span class="muted">按 Agent 维度常驻，超容量时按最近使用淘汰</span>'
          : ' <span class="muted">已从内存淘汰，下一轮触发时重新装载</span>')],
        ['VersionSeq', '<span class="mono">' + ag.stateVersion + '</span>'],
        ['绑定 AI 身份', '<button class="row-link" type="button" data-action="nav.go" data-module="identities" data-id="' +
          escapeHtml(ag.identityId) + '">' + escapeHtml(ag.identityId) + '</button>']
      ], { dense: true }) +
      '<div class="divider"></div>' +
      sectionTitle('归属用户配额', 'i-sliders') +
      progressHtml(used, limit, userName(ag.ownerId) + ' 的 Agent 配额') +
      '<p class="progress-label">' + used + ' / ' + limit + ' 个 Agent 实例' +
        (ag.status === 'reclaimed' ? '（已回收实例不占配额）' : '') + '</p>' +
      noticeBar({
        kind: 'info', icon: 'i-link',
        html: '归属解析发生在服务端：Client API 只携带 userId，由 Agent Service 解析出默认 Agent。' +
          '一个用户名下有多个实例时，客户端必须显式指定 agentId，否则只会命中默认 Agent。'
      });
  }

  function agentIdentityTab(ag) {
    const idn = findIdentity(ag.identityId);
    if (!idn) {
      return emptyState({
        icon: 'i-mask', title: '尚未绑定 AI 身份',
        desc: 'Agent 实例 <span class="mono">' + escapeHtml(ag.id) + '</span> 没有对应的 Identity 记录，' +
          '运行时拼装 Prompt 时会缺少第 1、2 层。'
      });
    }
    const p = idn.sections.personality;
    const v = idn.sections.voice;
    const b = idn.sections.boundaries;
    return sectionTitle('Identity 摘要', 'i-mask') +
      kvList([
        ['身份 ID', '<span class="mono">' + escapeHtml(idn.id) + '</span>'],
        ['版本', 'v' + idn.version + ' ' + statusTag(idn.status)],
        ['最近更新', timeAgo(idn.updatedAt) + ' <span class="muted">· ' + escapeHtml(idn.updatedBy) + '</span>'],
        ['人格特质', '<span class="trait-row">' + p.traits.map((t) =>
          '<span class="status-tag is-primary">' + escapeHtml(t) + '</span>').join('') + '</span>'],
        ['语气', escapeHtml(p.tone)],
        ['音色', escapeHtml(v.timbre)],
        ['语速 / 音高', '<span class="mono">' + escapeHtml(String(v.speed)) + ' / ' + escapeHtml(String(v.pitch)) + '</span>'],
        ['硬约束', b.hard.map((h) => escapeHtml(h)).join('<br>')]
      ], { dense: true }) +
      noticeBar({
        kind: 'info', icon: 'i-shield',
        html: 'Identity 对 Agent 运行时<strong>只读</strong>：管理后台是唯一写入口，每次写入都会 bump 版本号并进审计，' +
          '运行时在下一轮 tick 读到新版本。'
      }) +
      '<div class="row"><button class="btn btn--ghost btn--sm" type="button" data-action="nav.go" ' +
        'data-module="identities" data-id="' + escapeHtml(idn.id) + '">' + icon('i-external') +
        '打开 AI 身份详情</button></div>';
  }

  function agentHistoryTab(ag) {
    const items = [];
    if (ag.reclaimedAt) {
      items.push({
        title: 'Agent 实例已回收', icon: 'i-reclaim', ts: ag.reclaimedAt, tag: statusTag('reclaimed'),
        body: escapeHtml(ag.reclaimReason || '未填写原因') +
          '<br>回收时同步释放 State 常驻，并把该实例进行中的 Session 置为已结束。'
      });
    }
    items.push({
      title: 'Agent 归属登记', icon: 'i-plus', ts: ag.createdAt,
      body: '为 ' + escapeHtml(userName(ag.ownerId)) + ' 登记实例，绑定 AI 身份 <span class="mono">' +
        escapeHtml(ag.identityId) + '</span>。'
    });
    const related = auditOf(ag.id);
    return sectionTitle('回收与登记记录', 'i-history') + timelineHtml(items) +
      '<div class="divider"></div>' +
      sectionTitle('后台审计中的相关写操作（' + related.length + '）', 'i-shield') +
      auditTimeline(related, '审计里没有与本 Agent 实例相关的记录。') +
      noticeBar({
        kind: 'warn', icon: 'i-database',
        html: '回收只释放运行时资源：记忆与留存媒体按各自保留期留存，审计记录按独立保留期另行留存，都不会随回收清理。'
      });
  }

  function agentDrawerFoot(ag) {
    const idn = findIdentity(ag.identityId);
    return '<button class="btn btn--ghost" type="button" data-action="agent.identity" data-id="' +
        escapeHtml(ag.identityId) + '"' + (idn ? '' : ' disabled') +
        guardAttr('identity:write', IDENTITY_WRITE_REASON) + '>' + icon('i-mask') + '编辑 AI 身份</button>' +
      '<button class="btn btn--ghost" type="button" data-action="agent.quota" data-id="' + escapeHtml(ag.ownerId) +
        '"' + guardAttr('user:write', USER_WRITE_REASON) + '>' + icon('i-sliders') + '调整归属用户配额</button>' +
      '<span class="spacer"></span>' +
      (ag.status === 'reclaimed'
        ? '<span class="status-tag is-muted">已回收，无需重复操作</span>'
        : '<button class="btn btn--danger" type="button" data-action="agent.reclaim" data-id="' + ag.id + '"' +
          guardAttr('agent:write', AGENT_WRITE_REASON) + '>' + icon('i-reclaim') + '回收实例</button>');
  }

  FORMS.agentCreate = {
    icon: 'i-plus',
    title: '登记 Agent 实例',
    desc: () => 'POST <span class="mono">' + escapeHtml(BASE + '/agents') + '</span>',
    requires: 'agent:write',
    reason: AGENT_WRITE_REASON,
    submitText: '登记实例',
    body: (ctx) => {
      const options = DB.users
        .filter((u) => u.status !== 'disabled')
        .map((u) => [u.id, u.name + ' · ' + u.id + '（' + agentCountOf(u.id) + '/' + u.quota.limit + '）']);
      if (!options.length) options.push(['', '没有可登记的用户']);
      return '<div class="form-grid">' +
        fieldHtml({
          name: 'ownerId', label: '归属用户', type: 'select', full: true, options: options,
          value: ctx.ownerId || options[0][0], autofocus: !ctx.ownerId,
          hint: '已被禁用的用户不会出现在这里；配额已满的用户在提交时由服务端返回 409。'
        }) +
        fieldHtml({
          name: 'name', label: 'Agent 名称', type: 'text', full: true, required: true, maxlength: 24,
          value: '绫音', placeholder: '例如：绫音 · 夜谈', autofocus: !!ctx.ownerId,
          hint: '名称对用户可见，同一用户名下允许重名，归属解析只认默认 Agent。'
        }) +
        fieldHtml({
          name: 'note', label: '登记原因', type: 'text', full: true, maxlength: 80,
          placeholder: '例如：用户申请第二个实例用于工作场景'
        }) +
        '</div>' +
        noticeBar({
          kind: 'info', icon: 'i-mask',
          html: '登记时会同时从模板派生一份<strong>草稿状态</strong>的 AI 身份，需要在「AI 身份管理」里编辑后发布才会生效。'
        }) +
        noticeBar({ kind: 'deferred', icon: 'i-clock', html: DEFERRED.selfCreate + '，因此登记入口只在后台。' });
    },
    validate(v) {
      if (!v.ownerId) return { field: 'ownerId', msg: '请选择归属用户' };
      if (!v.name || !v.name.trim()) return { field: 'name', msg: 'Agent 名称必填' };
      return null;
    },
    async run(v, ctx, busyEl) {
      await runWrite({
        action: 'agent.create', method: 'POST', path: '/agents', capability: 'agent:write',
        target: 'Agent 实例 · 归属 ' + v.ownerId,
        body: { ownerId: v.ownerId, name: v.name.trim(), note: v.note }, reason: AGENT_WRITE_REASON,
        busyEl: busyEl, successText: '已登记 Agent 实例', refresh: () => afterWrite('agents')
      });
    }
  };

  FORMS.agentReclaim = {
    icon: 'i-reclaim',
    title: '回收 Agent 实例',
    desc: (ctx) => {
      const ag = findAgent(ctx.id);
      return ag ? '目标：<span class="mono">' + escapeHtml(ag.id) + '</span> · ' + escapeHtml(ag.name) +
        ' · 归属 ' + escapeHtml(userName(ag.ownerId)) : '';
    },
    requires: 'agent:write',
    reason: AGENT_WRITE_REASON,
    submitText: '确认回收',
    danger: true,
    body: (ctx) => {
      const ag = findAgent(ctx.id) || { id: ctx.id, name: ctx.id, resident: false, ownerId: '' };
      const active = DB.sessions.filter((s) => s.agentId === ag.id && s.status === 'active').length;
      const memories = DB.memories.filter((m) => m.agentId === ag.id).length;
      return '<div class="form-grid">' +
        fieldHtml({ name: 'status', label: '当前状态', type: 'static', html: statusTag(ag.status) + ' ' + stateCell(ag) }) +
        fieldHtml({
          name: 'reason', label: '回收原因', type: 'textarea', full: true, required: true, rows: 3, maxlength: 160,
          autofocus: true, placeholder: '原因会写入审计，例如：归属用户被禁用后超过 30 天未申诉'
        }) +
        '</div>' +
        sectionTitle('回收会发生什么', 'i-alert') +
        '<ul class="cascade-list">' +
          '<li>' + icon('i-activity') + '<span>释放 State 常驻</span><span class="cascade-note">' +
            (ag.resident ? '当前常驻，回收后从内存移除' : '当前未常驻，无需释放') + '</span></li>' +
          '<li>' + icon('i-messages') + '<span>进行中的 Session 置为已结束</span><span class="cascade-note">' +
            active + ' 个</span></li>' +
          '<li>' + icon('i-brain') + '<span>记忆保留，按保留期与衰减规则处理</span><span class="cascade-note">' +
            memories + ' 条</span></li>' +
          '<li>' + icon('i-shield') + '<span>审计记录按独立保留期另行留存</span><span class="cascade-note">不清理</span></li>' +
        '</ul>' +
        noticeBar({
          kind: 'danger', icon: 'i-alert',
          html: '回收不可撤销：实例状态会变为「已回收」，客户端归属解析将不再命中它。'
        });
    },
    validate(v, form, ctx) {
      const ag = findAgent(ctx.id);
      if (ag && ag.status === 'reclaimed') return '该 Agent 实例已经回收，无需重复操作';
      if (!v.reason || !v.reason.trim()) return { field: 'reason', msg: '回收原因必填，会写入审计' };
      return null;
    },
    async run(v, ctx, busyEl) {
      const ag = findAgent(ctx.id);
      const res = await runWrite({
        action: 'agent.reclaim', method: 'DELETE', path: '/agents/' + ctx.id, capability: 'agent:write',
        target: 'Agent ' + ctx.id + (ag ? ' · ' + ag.name : ''),
        body: { reason: v.reason.trim() }, reason: AGENT_WRITE_REASON, busyEl: busyEl,
        successText: '已回收 Agent 实例', refresh: () => afterWrite('agents')
      });
      if (res && drawerCtx && drawerCtx.module === 'agents' && drawerCtx.id === ctx.id) redrawDrawer();
    }
  };

  /* ==========================================================
     11.3 · AI 身份管理
     Identity 对运行时只读，管理后台是唯一写入口，每次写入必须审计并 bump 版本
     ========================================================== */

  const IDENTITY_WRITE_REASON = 'AI 身份的写入开放给内容管理员与系统管理员；运行时只读，后台是唯一写入口';
  const IDENTITY_STATUS_OPTIONS = [['all', '全部状态'], ['published', '已发布'], ['draft', '草稿'], ['archived', '已归档']];
  const EDITABLE_SECTIONS = ['personality', 'voice', 'aesthetic', 'boundaries'];

  const sectionOf = (key) => IDENTITY_SECTIONS.filter((s) => s.key === key)[0] || null;
  const sectionLabel = (key) => (sectionOf(key) ? sectionOf(key).label : key);
  const sectionHint = (key) => (sectionOf(key) ? sectionOf(key).hint : '');
  const splitChips = (s) => String(s === undefined || s === null ? '' : s).split(',')
    .map((x) => x.trim()).filter(Boolean);

  function navLink(module, id, label, title) {
    return '<button class="row-link" type="button" data-action="nav.go" data-module="' + module +
      '" data-id="' + escapeHtml(id) + '" title="' + escapeHtml(title || ('跳转到' + MODULES[module].title)) + '">' +
      escapeHtml(label) + '</button>';
  }

  function chipRow(arr, variant) {
    if (!arr || !arr.length) return '<span class="muted">（空）</span>';
    return '<span class="trait-row">' + arr.map((t) =>
      '<span class="status-tag ' + variant + '">' + escapeHtml(t) + '</span>').join('') + '</span>';
  }

  function identityBlock(section, inner) {
    return '<div class="identity-block"><p>' + escapeHtml(sectionHint(section)) + '</p>' + inner + '</div>';
  }

  VIEWS.identities = {
    scroll: 'list',
    drawerTabs: IDENTITY_SECTIONS.map((s) => ({
      key: s.key, label: s.label, icon: s.icon, title: s.hint, deferred: s.key === 'selfNarrative'
    })),
    render(host) {
      mountList(host, 'identities', {
        path: '/identities',
        caption: 'AI 身份列表',
        pageSize: 8,
        skeletonRows: 8,
        columns: [
          { label: 'AI 身份' },
          { label: '所属 Agent 实例', width: '158px', cls: 'col-optional' },
          { label: '版本', width: '72px' },
          { label: '状态', width: '88px' },
          { label: '更新人', width: '168px', cls: 'col-optional' },
          { label: '最近更新', width: '104px' },
          { label: '操作', width: '60px', cls: 'cell-actions' }
        ],
        filters(store) {
          const f = store.filters;
          return filterSearch('identities', 'q', '搜索身份 ID、Agent 名称或归属用户', f.q) +
            IDENTITY_STATUS_OPTIONS.map((o) =>
              filterChip('identities', 'status', o[0], o[1], f.status === o[0],
                o[0] === 'all' ? store.items.length : store.items.filter((x) => x.status === o[0]).length)).join('') +
            '<span class="filter-summary">写端点 PUT ' + BASE + '/identities/{id}</span>';
        },
        filter(items, f) {
          const q = (f.q || '').trim().toLowerCase();
          return items.filter((x) =>
            (f.status === 'all' || x.status === f.status) &&
            (!q || [x.id, x.agentId, x.agentName, x.ownerName, x.updatedBy].join(' ').toLowerCase().indexOf(q) >= 0));
        },
        row(it) {
          return '<tr>' +
            td('<span class="cell-id"><span class="cell-avatar">' + icon('i-mask') + '</span>' +
              '<span class="cell-id-copy">' + rowOpen('identities', it.id, it.agentName) +
              '<span>' + escapeHtml(it.id + ' · 归属 ' + it.ownerName) + '</span></span></span>', '',
              it.agentName + '（' + it.id + '）') +
            td(navLink('agents', it.agentId, it.agentId, '打开 Agent 实例 ' + it.agentName), 'col-optional', it.agentName) +
            td('<span class="cell-strong">v' + it.version + '</span>') +
            td(statusTag(it.status)) +
            td('<span class="cell-mono">' + escapeHtml(it.updatedBy) + '</span>', 'col-optional', it.updatedBy) +
            td(timeAgo(it.updatedAt), 'cell-mono', formatDateTime(it.updatedAt)) +
            td(rowActions([
              iconAction('identity.edit', 'i-pencil', '编辑 ' + sectionLabel('personality') + ' 分区',
                ' data-id="' + it.id + '" data-section="personality"', 'identity:write', IDENTITY_WRITE_REASON)
            ]), 'cell-actions') +
          '</tr>';
        },
        empty(store) {
          const f = store.filters;
          if (f.q || f.status !== 'all') {
            return emptyState({
              icon: 'i-search', title: '没有匹配的 AI 身份',
              desc: '当前筛选条件是「' + escapeHtml(identitiesFilterSummary(f)) + '」，没有命中的记录。',
              actions: '<button class="btn btn--ghost" type="button" data-action="filter.reset" data-key="identities">' +
                icon('i-refresh') + '清空筛选</button>'
            });
          }
          return emptyState({
            icon: 'i-mask', title: '还没有任何 AI 身份',
            desc: 'AI 身份不提供独立新建入口：它随 Agent 实例登记时由模板派生为草稿，再在这里编辑并发布。',
            actions: canRoute('agents')
              ? '<button class="btn btn--ghost" type="button" data-action="nav.go" data-module="agents">' +
                icon('i-agent') + '去登记 Agent 实例</button>'
              : ''
          });
        },
        footExtra(store) {
          return store.filtered !== store.items.length
            ? '<span class="filter-summary">筛选后 ' + store.filtered + ' 条</span>' : '';
        }
      });
      host.insertAdjacentHTML('afterbegin', noticeBar({
        kind: 'info', icon: 'i-shield',
        html: '<strong>Identity 对 Agent 运行时只读。</strong>管理后台是唯一写入口：每次写入都会 bump 版本号、' +
          '留下逐字段差异并记一条审计，运行时在下一轮 tick 读到新版本。'
      }));
    },
    renderDrawer(it, tab, focusTab) {
      openDrawer({
        title: it.agentName,
        icon: 'i-mask',
        desc: '<span class="mono">' + escapeHtml(it.id) + '</span> · v' + it.version + ' · 所属 Agent ' +
          escapeHtml(it.agentId) + ' · 归属 ' + escapeHtml(it.ownerName),
        headExtra: statusTag(it.status) + '<span class="status-tag is-primary">v' + it.version + '</span>',
        lg: true,
        tabs: tabsHtml('drawer.tab', VIEWS.identities.drawerTabs, tab, { label: 'AI 身份分区' }),
        body: identitySectionBody(it, tab),
        foot: identityDrawerFoot(it, tab),
        onMount: focusTab ? focusActiveTab : null
      });
    }
  };

  function identitiesFilterSummary(f) {
    const parts = [];
    if (f.q) parts.push('关键字「' + f.q + '」');
    if (f.status !== 'all') parts.push(STATUS_TEXT[f.status] || f.status);
    return parts.join(' + ') || '无';
  }

  function identitySectionBody(it, tab) {
    const s = it.sections[tab] || {};
    if (tab === 'personality') {
      return identityBlock('personality', kvList([
        ['人格特质', chipRow(s.traits, 'is-primary')],
        ['语气', escapeHtml(s.tone || '—')],
        ['价值观', chipRow(s.values, 'is-info')]
      ]) + editRow(it, 'personality'));
    }
    if (tab === 'voice') {
      return identityBlock('voice', kvList([
        ['音色', escapeHtml(s.timbre || '—')],
        ['语速倍率', '<span class="mono">' + escapeHtml(String(s.speed)) + '</span>'],
        ['音高偏移', '<span class="mono">' + escapeHtml(String(s.pitch)) + '</span>'],
        ['停顿与风格', escapeHtml(s.style || '—')]
      ]) + editRow(it, 'voice') +
        noticeBar({
          kind: 'info', icon: 'i-waveform',
          html: 'Voice 分区不参与 Prompt 拼装，它直接交给语音合成供应商。改这里只改变声音呈现，不改变说话内容。'
        }));
    }
    if (tab === 'aesthetic') {
      return identityBlock('aesthetic', kvList([
        ['色彩基调', escapeHtml(s.palette || '—')],
        ['意象', escapeHtml(s.imagery || '—')],
        ['禁止的表达', escapeHtml(s.forbidden || '—')]
      ]) + editRow(it, 'aesthetic') +
        noticeBar({
          kind: 'info', icon: 'i-spark',
          html: 'Aesthetic 只影响客户端呈现与自我描述用词，不构成约束；真正的约束写在 Boundaries 分区。'
        }));
    }
    if (tab === 'boundaries') {
      return sectionTitle('硬约束（运行时不可越过）', 'i-ban') + chipRow(s.hard, 'is-danger') +
        '<div class="divider"></div>' +
        sectionTitle('软约束（用户施压时可以坚持立场）', 'i-shield') + chipRow(s.soft, 'is-muted') +
        editRow(it, 'boundaries') +
        noticeBar({
          kind: 'warn', icon: 'i-shield',
          html: 'Boundaries 是 Prompt 拼装的<strong>第 2 层</strong>，紧跟 Identity 之后、Agent State 之前，' +
            '运行时不可越过。任何修改都会 bump 版本并进审计。'
        });
    }
    if (tab === 'selfNarrative') {
      return identityBlock('selfNarrative', kvList([
        ['自我叙述', escapeHtml(s.text || '—')],
        ['写入约定', escapeHtml(s.note || '—')]
      ]) +
        '<div class="row"><button class="btn btn--primary" type="button" data-action="identity.edit" data-id="' +
          escapeHtml(it.id) + '" data-section="selfNarrative" data-deferred="selfNarrative">' +
          icon('i-pencil') + '编辑本分区' + deferredTag('延后') + '</button></div>' +
        noticeBar({ kind: 'deferred', icon: 'i-clock', html: DEFERRED.selfNarrative }));
    }
    if (tab === 'versionMeta') return identityVersionTab(it);
    return emptyState({ icon: 'i-mask', title: '未知的 Identity 分区', desc: '分区 ' + escapeHtml(tab) + ' 不存在。' });
  }

  function editRow(it, section) {
    return '<div class="row"><button class="btn btn--ghost btn--sm" type="button" data-action="identity.edit"' +
      ' data-id="' + escapeHtml(it.id) + '" data-section="' + section + '"' +
      guardAttr('identity:write', IDENTITY_WRITE_REASON) + '>' + icon('i-pencil') + '编辑本分区</button>' +
      '<span class="muted">保存后 bump 到 v' + (it.version + 1) + ' 并写入审计</span></div>';
  }

  function identityVersionTab(it) {
    const m = it.sections.versionMeta || {};
    return sectionTitle('VersionMeta', 'i-history') +
      kvList([
        ['当前版本', '<span class="cell-strong">v' + it.version + '</span> ' + statusTag(it.status)],
        ['派生自', m.sourceVersion ? 'v' + m.sourceVersion : '—（初始版本）'],
        ['更新时间', formatDateTime(it.updatedAt) + ' <span class="muted">' + timeAgo(it.updatedAt) + '</span>'],
        ['更新人', '<span class="mono">' + escapeHtml(it.updatedBy) + '</span>'],
        ['变更说明', escapeHtml(m.changeNote || '—')]
      ], { dense: true }) +
      '<div class="divider"></div>' +
      sectionTitle('版本历史（' + it.history.length + '）', 'i-branch') +
      timelineHtml(it.history.map((h) => ({
        title: 'v' + h.version,
        icon: h.version === it.version ? 'i-check-circle' : 'i-history',
        tag: h.version === it.version ? '<span class="status-tag is-primary">当前</span>' : '',
        ts: h.ts,
        muted: h.version !== it.version,
        body: escapeHtml(h.note) + '<br><span class="muted">操作人 ' + escapeHtml(h.actor) + '</span>' + kvDiff(h.diff)
      }))) +
      auditSection(it) +
      noticeBar({
        kind: 'info', icon: 'i-shield',
        html: 'Identity 没有删除操作：旧版本以历史形式永久保留，逐字段差异可回溯到具体操作人。'
      });
  }

  function auditSection(it) {
    const related = auditOf(it.id);
    return '<div class="divider"></div>' +
      sectionTitle('后台审计中的相关写操作（' + related.length + '）', 'i-shield') +
      auditTimeline(related, '审计里没有与本 AI 身份相关的记录。');
  }

  function identityDrawerFoot(it, tab) {
    const left = EDITABLE_SECTIONS.indexOf(tab) >= 0
      ? '<button class="btn btn--primary" type="button" data-action="identity.edit" data-id="' + escapeHtml(it.id) +
        '" data-section="' + tab + '"' + guardAttr('identity:write', IDENTITY_WRITE_REASON) + '>' +
        icon('i-pencil') + '编辑 ' + escapeHtml(sectionLabel(tab)) + '</button>'
      : tab === 'selfNarrative'
        ? '<button class="btn btn--primary" type="button" data-action="identity.edit" data-id="' + escapeHtml(it.id) +
          '" data-section="selfNarrative" data-deferred="selfNarrative">' + icon('i-clock') +
          '编辑 ' + escapeHtml(sectionLabel(tab)) + deferredTag('延后') + '</button>'
        : '<span class="status-tag is-muted">VersionMeta 由系统维护</span>';
    return left +
      '<span class="spacer"></span>' +
      '<button class="btn btn--ghost" type="button" data-action="nav.go" data-module="agents" data-id="' +
        escapeHtml(it.agentId) + '">' + icon('i-agent') + '打开所属 Agent 实例</button>';
  }

  function identityEditFields(section, s) {
    const plain = (v) => v;
    if (section === 'personality') {
      return chipsInput('traits', '人格特质', s.traits || [], '输入特质后按回车添加',
        '建议 2–4 条，过多会让 Prompt 第 1 层失焦', plain) +
        fieldHtml({ name: 'tone', label: '语气', type: 'textarea', full: true, rows: 2, value: s.tone, required: true }) +
        chipsInput('values', '价值观', s.values || [], '输入价值观后按回车添加', '', plain);
    }
    if (section === 'voice') {
      return fieldHtml({ name: 'timbre', label: '音色', type: 'text', full: true, value: s.timbre, required: true }) +
        fieldHtml({
          name: 'speed', label: '语速倍率', type: 'number', value: s.speed, min: '0.5', max: '1.5', step: '0.01',
          inputmode: 'decimal', hint: '0.50–1.50，1.00 为供应商默认'
        }) +
        fieldHtml({
          name: 'pitch', label: '音高偏移', type: 'number', value: s.pitch, min: '-5', max: '5', step: '1',
          inputmode: 'numeric', hint: '-5 到 +5 的半音偏移'
        }) +
        fieldHtml({ name: 'style', label: '停顿与风格', type: 'textarea', full: true, rows: 2, value: s.style, required: true });
    }
    if (section === 'aesthetic') {
      return fieldHtml({ name: 'palette', label: '色彩基调', type: 'text', full: true, value: s.palette, required: true }) +
        fieldHtml({ name: 'imagery', label: '意象', type: 'text', full: true, value: s.imagery, required: true }) +
        fieldHtml({ name: 'forbidden', label: '禁止的表达', type: 'textarea', full: true, rows: 2, value: s.forbidden, required: true });
    }
    if (section === 'boundaries') {
      return chipsInput('hard', '硬约束', s.hard || [], '输入硬约束后按回车添加',
        '运行时不可越过，会拼进 Prompt 第 2 层', plain) +
        chipsInput('soft', '软约束', s.soft || [], '输入软约束后按回车添加',
          '用户施压时可以坚持立场', plain);
    }
    return noticeBar({ kind: 'deferred', icon: 'i-clock', html: DEFERRED.selfNarrative });
  }

  function readIdentityValue(section, v) {
    if (section === 'personality') return { traits: splitChips(v.traits), tone: v.tone.trim(), values: splitChips(v.values) };
    if (section === 'voice') {
      return {
        timbre: v.timbre.trim(), speed: Number(v.speed).toFixed(2),
        pitch: Number(v.pitch), style: v.style.trim()
      };
    }
    if (section === 'aesthetic') return { palette: v.palette.trim(), imagery: v.imagery.trim(), forbidden: v.forbidden.trim() };
    if (section === 'boundaries') return { hard: splitChips(v.hard), soft: splitChips(v.soft) };
    return {};
  }

  FORMS.identityEdit = {
    icon: 'i-pencil',
    size: 'lg',
    title: (ctx) => '编辑 ' + sectionLabel(ctx.section),
    desc: (ctx) => {
      const it = findIdentity(ctx.id);
      return it ? '目标：<span class="mono">' + escapeHtml(it.id) + '</span> · v' + it.version + ' · ' +
        escapeHtml(it.agentName) + '（归属 ' + escapeHtml(it.ownerName) + '）' : '';
    },
    requires: 'identity:write',
    reason: IDENTITY_WRITE_REASON,
    submitText: '保存并 bump 版本',
    body: (ctx) => {
      const it = findIdentity(ctx.id);
      if (!it) return noticeBar({ kind: 'danger', icon: 'i-alert', text: 'AI 身份已不存在，列表可能已经刷新。' });
      return '<div class="form-grid">' +
        fieldHtml({
          name: 'target', label: '目标', type: 'static', full: true,
          html: '<span class="mono">' + escapeHtml(it.id) + '</span> · v' + it.version + ' · ' +
            escapeHtml(it.agentName) + ' · Agent <span class="mono">' + escapeHtml(it.agentId) + '</span>'
        }) +
        fieldHtml({
          name: 'sectionName', label: '编辑分区', type: 'static', full: true,
          html: '<span class="cell-strong">' + escapeHtml(sectionLabel(ctx.section)) + '</span> ' +
            '<span class="muted">' + escapeHtml(sectionHint(ctx.section)) + '</span>'
        }) +
        identityEditFields(ctx.section, it.sections[ctx.section] || {}) +
        fieldHtml({
          name: 'note', label: '变更说明', type: 'textarea', full: true, rows: 2, required: true, maxlength: 120,
          autofocus: true, placeholder: '例如：收紧 voice.speed，避免夜间语速偏快',
          hint: '必填。Identity 的每次写入都要能被追溯，说明会进审计并出现在版本历史里。'
        }) +
        '</div>' +
        noticeBar({
          kind: 'info', icon: 'i-shield',
          html: '保存即发布：版本号 +1，运行时在下一轮 tick 读到新版本。没有任何字段变化的提交会被服务端以 409 拒绝。'
        });
    },
    validate(v, form, ctx) {
      if (EDITABLE_SECTIONS.indexOf(ctx.section) < 0) return sectionLabel(ctx.section) + ' 不支持在后台直接编辑';
      if (!v.note || !v.note.trim()) return { field: 'note', msg: '变更说明必填，Identity 的每次写入都要能被追溯' };
      if (ctx.section === 'personality') {
        if (!splitChips(v.traits).length) return { field: 'traits', msg: '至少保留一条人格特质' };
        if (!v.tone || !v.tone.trim()) return { field: 'tone', msg: '语气必填' };
      } else if (ctx.section === 'voice') {
        if (!v.timbre || !v.timbre.trim()) return { field: 'timbre', msg: '音色必填' };
        const sp = Number(v.speed);
        if (!isFinite(sp) || sp < 0.5 || sp > 1.5) return { field: 'speed', msg: '语速倍率必须在 0.50–1.50 之间' };
        const pi = Number(v.pitch);
        if (!isFinite(pi) || pi < -5 || pi > 5) return { field: 'pitch', msg: '音高偏移必须在 -5 到 +5 之间' };
      } else if (ctx.section === 'aesthetic') {
        if (!v.palette || !v.palette.trim()) return { field: 'palette', msg: '色彩基调必填' };
      } else if (ctx.section === 'boundaries') {
        if (!splitChips(v.hard).length) return { field: 'hard', msg: '至少要有一条硬约束' };
      }
      return null;
    },
    async run(v, ctx, busyEl) {
      const it = findIdentity(ctx.id);
      const res = await runWrite({
        action: 'identity.update', method: 'PUT', path: '/identities/' + ctx.id, capability: 'identity:write',
        target: 'AI 身份 ' + ctx.id + ' · ' + sectionLabel(ctx.section),
        body: { section: ctx.section, value: readIdentityValue(ctx.section, v), note: v.note.trim() },
        reason: IDENTITY_WRITE_REASON, busyEl: busyEl,
        successText: 'AI 身份已更新', refresh: () => refreshCurrent()
      });
      if (res && drawerCtx && drawerCtx.module === 'identities' && drawerCtx.id === ctx.id) {
        redrawDrawer('versionMeta');
      }
    }
  };

  /* ==========================================================
     11.4 · Memory 管理
     六类记忆按类型分区；语义记忆与程序记忆是 Phase 1 内延后项，数据为空
     ========================================================== */

  const MEMORY_WRITE_REASON = '记忆的修正与删除开放给内容管理员与系统管理员；只读管理员只能查看';
  const MEMORY_STATUS_OPTIONS = [['all', '全部状态'], ['normal', '正常'], ['corrected', '已修正'], ['archived', '已归档']];

  function memoryAgentOptions() {
    const ids = [];
    DB.memories.forEach((m) => { if (ids.indexOf(m.agentId) < 0) ids.push(m.agentId); });
    return [['all', '全部 Agent 实例']].concat(ids.map((id) => [id, agentName(id)]));
  }

  function memoriesFilterSummary(f) {
    const parts = [memoryTypeLabel(f.type)];
    if (f.q) parts.push('关键字「' + f.q + '」');
    if (f.agent !== 'all') parts.push(agentName(f.agent));
    if (f.status !== 'all') parts.push(STATUS_TEXT[f.status] || f.status);
    return parts.join(' + ');
  }

  function memoryTypeTabs(store) {
    const counts = {};
    MEMORY_TYPES.forEach((t) => { counts[t.key] = 0; });
    store.items.forEach((m) => { if (counts[m.type] !== undefined) counts[m.type] += 1; });
    return '<div class="nav-group-title">记忆类型</div>' +
      MEMORY_TYPES.map((t) => {
        const on = store.filters.type === t.key;
        return '<button class="side-tab' + (on ? ' is-active' : '') + '" type="button" data-action="memory.type"' +
          ' data-type="' + t.key + '" aria-pressed="' + (on ? 'true' : 'false') + '"' +
          ' title="' + escapeHtml(t.label + (t.deferred ? '：' + (DEFERRED[t.key] || '延后项') : '，共 ' + counts[t.key] + ' 条')) + '">' +
          icon(t.icon) + '<span class="nav-label">' + escapeHtml(t.label) + '</span>' +
          '<span class="tab-count">' + counts[t.key] + '</span>' +
          (t.deferred ? deferredTag('延后') : '') + '</button>';
      }).join('');
  }

  function repaintMemoryTabs() {
    const host = document.getElementById('memory-types');
    if (host) host.innerHTML = memoryTypeTabs(state.data.memories);
  }

  /* 固化与衰减只做规则声明：Phase 1 内不产生自动写入 */
  function consolidationCard() {
    return cardShell({
      title: '记忆固化与衰减',
      icon: 'i-layers',
      desc: '规则声明，Phase 1 内不产生自动写入',
      extra: deferredTag('延后'),
      body: kvList([
        ['固化条件', 'importance ≥ 0.85 且 recallCount ≥ 5 → 标记为长期记忆，退出衰减计算'],
        ['衰减公式', '<span class="mono">decayScore = importance × confidence × (1 − min(0.6, ageDays / 900))</span>'],
        ['归档阈值', 'decayScore &lt; 0.05 进入候选归档集，仍需人工确认，不会自动删除'],
        ['人工介入', '后台可以修正内容（保留原文）或删除；两者都写审计，删除动作本身也留存']
      ], { dense: true, mono: false }) +
        noticeBar({ kind: 'deferred', icon: 'i-clock', html: DEFERRED.consolidation })
    });
  }

  VIEWS.memories = {
    scroll: 'list',
    drawerTabs: [
      { key: 'content', label: '全文与元数据', icon: 'i-brain' },
      { key: 'recall', label: '召回历史', icon: 'i-target' },
      { key: 'correction', label: '修正历史', icon: 'i-history' }
    ],
    render(host) {
      host.innerHTML =
        '<div class="memory-layout">' +
          '<div class="side-panel">' +
            '<div class="side-scroll" id="memory-types" role="group" aria-label="记忆类型"></div>' +
          '</div>' +
          '<div class="memory-main" id="memory-main"></div>' +
        '</div>';
      repaintMemoryTabs();
      const main = document.getElementById('memory-main');
      mountList(main, 'memories', {
        path: '/memories',
        caption: '记忆列表',
        pageSize: 6,
        skeletonRows: 6,
        columns: [
          { label: '记忆内容' },
          { label: 'Agent 实例', width: '146px', cls: 'col-optional' },
          { label: '重要度 / 置信度', width: '152px' },
          { label: '召回', width: '64px', cls: 'col-optional' },
          { label: '状态', width: '88px' },
          { label: '最近召回', width: '104px', cls: 'col-optional' },
          { label: '操作', width: '92px', cls: 'cell-actions' }
        ],
        filters(store) {
          const f = store.filters;
          return filterSearch('memories', 'q', '搜索记忆内容、记忆 ID 或来源', f.q) +
            filterSelect('memories', 'agent', 'Agent 实例', memoryAgentOptions(), f.agent) +
            MEMORY_STATUS_OPTIONS.map((o) =>
              filterChip('memories', 'status', o[0], o[1], f.status === o[0],
                o[0] === 'all'
                  ? store.items.filter((m) => m.type === f.type).length
                  : store.items.filter((m) => m.type === f.type && m.status === o[0]).length)).join('') +
            '<span class="filter-summary">只读端点 GET ' + BASE + '/memories</span>';
        },
        filter(items, f) {
          const q = (f.q || '').trim().toLowerCase();
          return items.filter((m) =>
            m.type === f.type &&
            (f.agent === 'all' || m.agentId === f.agent) &&
            (f.status === 'all' || m.status === f.status) &&
            (!q || [m.content, m.id, m.source, m.agentId].join(' ').toLowerCase().indexOf(q) >= 0));
        },
        row(m) {
          const t = MEMORY_TYPE_MAP[m.type] || { icon: 'i-brain' };
          return '<tr>' +
            td('<span class="cell-id"><span class="cell-avatar">' + icon(t.icon) + '</span>' +
              '<span class="cell-id-copy">' + rowOpen('memories', m.id, m.content) +
              '<span>' + escapeHtml(m.id + ' · ' + memoryTypeLabel(m.type) + ' · ' + m.source) + '</span></span></span>',
              '', m.content) +
            td(navLink('agents', m.agentId, m.agentId, '打开 Agent 实例 ' + agentName(m.agentId)),
              'col-optional', agentName(m.agentId)) +
            td('<span class="quota-cell">' + progressHtml(Math.round(m.importance * 100), 100, '重要度') +
              '<span class="progress-label">' + m.importance.toFixed(2) + ' 重要 · ' + m.confidence.toFixed(2) +
              ' 置信 · 衰减 ' + m.decayScore.toFixed(2) + '</span></span>') +
            td(String(m.recallCount), 'col-optional cell-num') +
            td(statusTag(m.status)) +
            td(m.lastRecalledAt ? timeAgo(m.lastRecalledAt) : '<span class="muted">从未召回</span>',
              'col-optional cell-mono', m.lastRecalledAt ? formatDateTime(m.lastRecalledAt) : '') +
            td(rowActions([
              iconAction('memory.patch', 'i-pencil', '修正记忆内容', ' data-id="' + m.id + '"',
                'memory:write', MEMORY_WRITE_REASON),
              iconAction('memory.delete', 'i-trash', '删除记忆', ' data-id="' + m.id + '"',
                'memory:write', MEMORY_WRITE_REASON)
            ]), 'cell-actions') +
          '</tr>';
        },
        empty(store) {
          const f = store.filters;
          const t = MEMORY_TYPE_MAP[f.type];
          if (t && t.deferred) {
            return emptyState({
              variant: 'is-deferred', icon: t.icon, title: t.label + '在 Phase 1 内不启用',
              desc: escapeHtml(DEFERRED[f.type] || '') + '。左侧切换到已启用的四类可以看到真实数据。',
              actions: '<button class="btn btn--ghost" type="button" data-action="memory.type" data-type="episodic">' +
                icon('i-clock') + '切到情节记忆</button>'
            });
          }
          if (f.q || f.agent !== 'all' || f.status !== 'all') {
            return emptyState({
              icon: 'i-search', title: '没有匹配的记忆',
              desc: '当前筛选条件是「' + escapeHtml(memoriesFilterSummary(f)) + '」，没有命中的记录。',
              actions: '<button class="btn btn--ghost" type="button" data-action="filter.reset" data-key="memories">' +
                icon('i-refresh') + '清空筛选</button>'
            });
          }
          return emptyState({
            icon: 'i-inbox', title: t ? t.label + '为空' : '记忆为空',
            desc: '这一类还没有写入任何记忆。演示注入「空数据」也会让所有只读端点返回 0 条。',
            actions: '<button class="btn btn--ghost" type="button" data-action="chaos.set" data-mode="none">' +
              icon('i-check-circle') + '关闭演示注入</button>'
          });
        },
        footExtra(store) {
          return store.filtered !== store.items.length
            ? '<span class="filter-summary">筛选后 ' + store.filtered + ' 条</span>' : '';
        },
        afterLoad() { repaintMemoryTabs(); }
      });
      main.insertAdjacentHTML('beforeend', consolidationCard());
    },
    renderDrawer(m, tab, focusTab) {
      const ag = findAgent(m.agentId);
      const t = MEMORY_TYPE_MAP[m.type] || { icon: 'i-brain', label: m.type };
      openDrawer({
        title: t.label,
        icon: t.icon,
        desc: '<span class="mono">' + escapeHtml(m.id) + '</span> · Agent <span class="mono">' +
          escapeHtml(m.agentId) + '</span>' + (ag ? ' · 归属 ' + escapeHtml(userName(ag.ownerId)) : '') +
          ' · 来源 ' + escapeHtml(m.source),
        headExtra: statusTag(m.status) + '<span class="status-tag is-primary">importance ' +
          m.importance.toFixed(2) + '</span>',
        lg: true,
        tabs: tabsHtml('drawer.tab', VIEWS.memories.drawerTabs, tab, { label: '记忆详情分区' }),
        body: memoryDrawerBody(m, tab),
        foot: memoryDrawerFoot(m),
        onMount: focusTab ? focusActiveTab : null
      });
    }
  };

  function memoryDrawerBody(m, tab) {
    if (tab === 'recall') return memoryRecallTab(m);
    if (tab === 'correction') return memoryCorrectionTab(m);
    return memoryContentTab(m);
  }

  function memoryContentTab(m) {
    const ag = findAgent(m.agentId);
    return '<div class="recall-item">' +
        '<div class="recall-head">' + icon('i-brain') + '<span>记忆全文</span><span class="spacer"></span>' +
          '<span class="cell-mono">' + escapeHtml(m.id) + '</span></div>' +
        '<p class="recall-reason">' + escapeHtml(m.content) + '</p>' +
      '</div>' +
      sectionTitle('元数据', 'i-index') +
      kvList([
        ['类型', escapeHtml(memoryTypeLabel(m.type)) + (MEMORY_TYPE_MAP[m.type] && MEMORY_TYPE_MAP[m.type].deferred
          ? ' ' + deferredTag('延后') : '')],
        ['Agent 实例', ag
          ? navLink('agents', ag.id, ag.id, '打开 Agent 实例 ' + ag.name) +
            ' <span class="muted">' + escapeHtml(ag.name) + '</span>'
          : '<span class="muted">' + escapeHtml(m.agentId) + '（实例已不存在）</span>'],
        ['归属用户', ag ? escapeHtml(userName(ag.ownerId)) : '<span class="muted">—</span>'],
        ['写入来源', escapeHtml(m.source)],
        ['写入时间', formatDateTime(m.createdAt) + ' <span class="muted">' + timeAgo(m.createdAt) + '</span>'],
        ['状态', statusTag(m.status)],
        ['重要度', progressHtml(Math.round(m.importance * 100), 100, '重要度') +
          '<span class="progress-label">' + m.importance.toFixed(2) + '</span>'],
        ['置信度', progressHtml(Math.round(m.confidence * 100), 100, '置信度') +
          '<span class="progress-label">' + m.confidence.toFixed(2) +
            '（每次人工修正会下调 0.02，表示"被改过"的内容不再那么确定）</span>'],
        ['衰减分', '<span class="mono">' + m.decayScore.toFixed(2) + '</span>' +
          (m.decayScore < 0.05 ? ' <span class="status-tag is-warn">低于归档阈值</span>' : '')],
        ['召回次数', String(m.recallCount)],
        ['最近召回', m.lastRecalledAt
          ? formatDateTime(m.lastRecalledAt) + ' <span class="muted">' + timeAgo(m.lastRecalledAt) + '</span>'
          : '<span class="muted">从未被召回</span>']
      ], { dense: true }) +
      noticeBar({
        kind: 'info', icon: 'i-shield',
        html: '记忆按 Agent 实例维度隔离，不跨实例共享；同一用户的多个 Agent 各自维护自己的记忆集。' +
          '召回发生在 Prompt 拼装的<strong>第 6 层</strong>，由当轮任务筛选，不是全量灌入。'
      });
  }

  /* 召回优先级：把「为什么召回这条」拆成可判定的规则，逐条标注本条记忆是否命中 */
  function memoryPriority(m) {
    const rules = [
      { text: '用户显式要求写入（source = 用户显式要求）', hit: m.source === '用户显式要求' },
      { text: '与当前输入语义相似度高（阈值 0.75）', hit: m.recalls.some((r) => r.reason.indexOf('相似度') >= 0) },
      { text: '近 7 天内被引用过', hit: !!m.lastRecalledAt && m.lastRecalledAt > days(7) },
      { text: 'importance ≥ 0.60 的长期记忆', hit: m.importance >= 0.6 },
      { text: 'decayScore ≥ 0.05，未跌出候选集', hit: m.decayScore >= 0.05 }
    ];
    return rules.map((r, i) =>
      '<div class="recall-item"><div class="recall-head">' +
        icon(r.hit ? 'i-check-circle' : 'i-x-circle') + '<span>优先级 ' + (i + 1) + '</span>' +
        '<span class="spacer"></span>' +
        (r.hit ? '<span class="status-tag is-ok">命中</span>' : '<span class="status-tag is-muted">未命中</span>') +
      '</div><p class="recall-reason">' + escapeHtml(r.text) + '</p></div>').join('');
  }

  function memoryRecallTab(m) {
    return sectionTitle('召回优先级判定', 'i-sort') + memoryPriority(m) +
      '<div class="divider"></div>' +
      sectionTitle('召回历史（' + m.recalls.length + '）', 'i-target') +
      (m.recalls.length ? m.recalls.map((r) =>
        '<div class="recall-item">' +
          '<div class="recall-head">' + icon('i-target') + '<span>' + escapeHtml(r.layer) + '</span>' +
            '<span class="spacer"></span><span class="cell-mono">' + escapeHtml(r.sessionId) + '</span></div>' +
          '<p class="recall-reason">' + escapeHtml(r.reason) + '</p>' +
          '<div class="recall-head">' + icon('i-clock') + '<span>' + timeAgo(r.ts) + '</span>' +
            '<span class="spacer"></span>' +
            '<button class="btn btn--sm btn--ghost" type="button" data-action="nav.go" data-module="sessions"' +
              ' data-id="' + escapeHtml(r.sessionId) + '">' + icon('i-messages') + '打开 Session</button></div>' +
        '</div>').join('')
        : '<p class="muted">这条记忆还没有被召回过。</p>') +
      noticeBar({
        kind: 'info', icon: 'i-layers',
        html: '召回结果拼进 Prompt 第 6 层。后台只能看到"召回过什么、为什么召回"，' +
          '不能替运行时决定下一轮召回哪些记忆。'
      });
  }

  function memoryCorrectionTab(m) {
    const related = auditOf(m.id);
    return sectionTitle('修正历史（' + m.corrections.length + '）', 'i-history') +
      (m.corrections.length ? timelineHtml(m.corrections.map((c) => ({
        title: '内容修正',
        icon: 'i-pencil',
        ts: c.ts,
        body: '<span class="muted">修正前</span><br>' + escapeHtml(c.from) +
          '<br><span class="muted">修正后</span><br>' + escapeHtml(c.to) +
          '<br><span class="muted">' + escapeHtml(c.note) + ' · 操作人 ' + escapeHtml(c.actor) + '</span>'
      }))) : '<p class="muted">这条记忆没有被人工修正过。</p>') +
      '<div class="divider"></div>' +
      sectionTitle('后台审计中的相关写操作（' + related.length + '）', 'i-shield') +
      auditTimeline(related, '审计里没有与本记忆相关的记录。') +
      noticeBar({
        kind: 'warn', icon: 'i-alert',
        html: '修正<strong>保留原文</strong>，只把置信度下调 0.02；删除则连同召回历史与修正历史一起移除，' +
          '但删除动作本身会留在审计里。两者都只对内容管理员与系统管理员开放。'
      });
  }

  function memoryDrawerFoot(m) {
    const g = guardAttr('memory:write', MEMORY_WRITE_REASON);
    return '<button class="btn btn--ghost" type="button" data-action="memory.patch" data-id="' + m.id + '"' + g + '>' +
        icon('i-pencil') + '修正内容</button>' +
      '<span class="spacer"></span>' +
      '<button class="btn btn--ghost" type="button" data-action="nav.go" data-module="agents" data-id="' +
        escapeHtml(m.agentId) + '">' + icon('i-agent') + '所属 Agent 实例</button>' +
      '<button class="btn btn--danger" type="button" data-action="memory.delete" data-id="' + m.id + '"' + g + '>' +
        icon('i-trash') + '删除记忆</button>';
  }

  FORMS.memoryPatch = {
    icon: 'i-pencil',
    title: '修正记忆内容',
    desc: (ctx) => {
      const m = findMemory(ctx.id);
      return m ? '目标：<span class="mono">' + escapeHtml(m.id) + '</span> · ' + escapeHtml(memoryTypeLabel(m.type)) +
        ' · Agent <span class="mono">' + escapeHtml(m.agentId) + '</span>' : '';
    },
    requires: 'memory:write',
    reason: MEMORY_WRITE_REASON,
    submitText: '保存修正',
    body: (ctx) => {
      const m = findMemory(ctx.id);
      if (!m) return noticeBar({ kind: 'danger', icon: 'i-alert', text: '记忆已不存在，列表可能已经刷新。' });
      return '<div class="form-grid">' +
        fieldHtml({
          name: 'before', label: '修正前', type: 'static', full: true,
          html: '<span class="mono">' + escapeHtml(m.content) + '</span>'
        }) +
        fieldHtml({
          name: 'content', label: '修正后内容', type: 'textarea', full: true, rows: 4, required: true,
          maxlength: 240, value: m.content, autofocus: true,
          hint: '原文会保留在修正历史里，不会被覆盖。'
        }) +
        fieldHtml({
          name: 'reason', label: '修正原因', type: 'textarea', full: true, rows: 2, required: true, maxlength: 120,
          placeholder: '例如：把 Agent 的转述当成了用户原话'
        }) +
        '</div>' +
        noticeBar({
          kind: 'info', icon: 'i-brain',
          html: '保存后状态变为「已修正」，置信度下调 0.02，修正记录与原因一起写入审计。'
        });
    },
    validate(v) {
      if (!v.content || !v.content.trim()) return { field: 'content', msg: '修正后的内容不能为空' };
      if (!v.reason || !v.reason.trim()) return { field: 'reason', msg: '修正原因必填，会写入审计' };
      return null;
    },
    async run(v, ctx, busyEl) {
      await runWrite({
        action: 'memory.patch', method: 'PUT', path: '/memories/' + ctx.id, capability: 'memory:write',
        target: '记忆 ' + ctx.id, body: { content: v.content.trim(), reason: v.reason.trim() },
        reason: MEMORY_WRITE_REASON, busyEl: busyEl,
        successText: '记忆已修正', refresh: () => afterWrite('memories')
      });
    }
  };

  FORMS.memoryDelete = {
    icon: 'i-trash',
    title: '删除记忆',
    desc: (ctx) => {
      const m = findMemory(ctx.id);
      return m ? '目标：<span class="mono">' + escapeHtml(m.id) + '</span> · ' + escapeHtml(memoryTypeLabel(m.type)) : '';
    },
    requires: 'memory:write',
    reason: MEMORY_WRITE_REASON,
    submitText: '确认删除',
    size: 'sm',
    danger: true,
    body: (ctx) => {
      const m = findMemory(ctx.id);
      if (!m) return noticeBar({ kind: 'danger', icon: 'i-alert', text: '记忆已不存在，列表可能已经刷新。' });
      return '<div class="form-grid">' +
        fieldHtml({ name: 'content', label: '记忆内容', type: 'static', full: true, html: escapeHtml(m.content) }) +
        fieldHtml({
          name: 'reason', label: '删除原因', type: 'textarea', full: true, rows: 3, required: true, maxlength: 120,
          autofocus: true, placeholder: '例如：内容涉及第三方隐私，按申诉要求移除'
        }) +
        '</div>' +
        noticeBar({
          kind: 'danger', icon: 'i-alert',
          html: '删除不可撤销：召回历史与修正历史会一并移除。删除动作本身写入审计并按独立保留期留存。'
        });
    },
    validate(v) {
      if (!v.reason || !v.reason.trim()) return { field: 'reason', msg: '删除原因必填，会写入审计' };
      return null;
    },
    async run(v, ctx, busyEl) {
      const res = await runWrite({
        action: 'memory.delete', method: 'DELETE', path: '/memories/' + ctx.id, capability: 'memory:write',
        target: '记忆 ' + ctx.id + ' · ' + v.reason.trim().slice(0, 40),
        body: { reason: v.reason.trim() }, reason: MEMORY_WRITE_REASON, busyEl: busyEl,
        successText: '记忆已删除', refresh: () => afterWrite('memories')
      });
      if (res && drawerCtx && drawerCtx.module === 'memories' && drawerCtx.id === ctx.id) {
        closeLayer('drawer');
        drawerCtx = null;
      }
    }
  };

  /* ----------------------------------------------------------
     11.5 sessions · Session 与轮次（B 级：列表 + 筛选 + 抽屉 + 调试）
     注意列表里没有「互动模式」这一列：聊天 / 2D 形象 / 3D 形象只存在于
     客户端表现层，不进入跨仓库协议，所以三种模式共用同一 Agent 与同一
     Session，后台能看到的只有设备与触发 Loop（Reactive / Proactive）。
     ---------------------------------------------------------- */

  const SESSION_INJECT_REASON = '注入测试感知事件会写进 Working Memory Buffer，仅系统管理员可执行';
  const SESSION_STATUS_OPTIONS = [['all', '全部状态'], ['active', '进行中'], ['ended', '已结束'], ['error', '异常']];
  const SESSION_MODE_OPTIONS = [['all', '全部 Loop'], ['reactive', 'Reactive'], ['proactive', 'Proactive']];
  const BUFFER_CAPACITY = 8;

  function sessionAgentOptions() {
    const seen = {};
    const out = [['all', '全部 Agent 实例']];
    DB.sessions.forEach((s) => {
      if (seen[s.agentId]) return;
      seen[s.agentId] = 1;
      out.push([s.agentId, s.agentId + ' · ' + agentName(s.agentId)]);
    });
    return out;
  }

  function sessionsFilterSummary(f) {
    const parts = [];
    if (f.q) parts.push('关键字「' + f.q + '」');
    if (f.agent !== 'all') parts.push(f.agent);
    if (f.mode !== 'all') parts.push((MODE_TEXT[f.mode] || f.mode) + ' Loop');
    if (f.status !== 'all') parts.push(STATUS_TEXT[f.status] || f.status);
    return parts.length ? parts.join(' · ') : '无筛选';
  }

  const loopTag = (mode) => '<span class="status-tag ' + (mode === 'proactive' ? 'is-primary' : 'is-info') + '">' +
    escapeHtml(MODE_TEXT[mode] || mode) + '</span>';

  function promptAssemblyText(s) {
    const total = s.promptPreview.reduce((n, p) => n + p.tokens, 0);
    const lines = ['# Agent Service 在每次 LLM 调用前按固定顺序拼装，层序不可调换；后台只能改模板正文，不能改顺序'];
    s.promptPreview.forEach((p) => {
      lines.push(p.layer);
      lines.push('    来源 ' + p.source + ' · ' + p.tokens + ' tokens');
    });
    lines.push('# 合计 ' + total + ' tokens · 未超出上下文预算');
    return lines.join('\n');
  }

  function promptTotal(s) {
    return s.promptPreview.reduce((n, p) => n + p.tokens, 0);
  }

  /* ---- 抽屉分区 ---- */

  function sessionOverviewCard(s) {
    return cardShell({
      title: '会话概览',
      icon: 'i-messages',
      desc: s.id,
      body: kvList([
        ['归属用户', navLink('users', s.userId, userName(s.userId) + '（' + s.userId + '）', '打开用户 ' + s.userId)],
        ['Agent 实例', navLink('agents', s.agentId, agentName(s.agentId), '打开 Agent 实例 ' + s.agentId)],
        ['状态', statusTag(s.status)],
        ['触发 Loop', loopTag(s.mode)],
        ['所在设备', escapeHtml(DEVICE_TEXT[s.device] || s.device)],
        ['轮次', '<span class="cell-mono">' + s.turnCount + '</span> 轮，时间轴只保留最近 ' + s.timeline.length + ' 轮'],
        ['开始时间', '<span class="cell-mono">' + formatDateTime(s.startedAt) + '</span>'],
        ['最近事件', timeAgo(s.lastEventAt) + ' <span class="cell-mono muted">' + formatDateTime(s.lastEventAt) + '</span>'],
        ['Prompt tokens', '<span class="cell-mono">' + promptTotal(s) + '</span> / 轮，八层拼装']
      ], { dense: true })
    });
  }

  function sessionTurnsTab(s) {
    const items = s.timeline.map((t) => ({
      icon: t.kind === 'user' ? 'i-user' : 'i-agent',
      title: '#' + t.idx + ' ' + (t.kind === 'user' ? '用户' : '绫音'),
      tag: loopTag(t.mode),
      ts: t.ts,
      body: escapeHtml(t.text) + '<span class="cell-mono muted"> · ' + t.tokens + ' tokens · 首字延迟 ' +
        t.latencyMs + 'ms</span>'
    }));
    return (s.error
      ? noticeBar({ kind: 'danger', icon: 'i-bug', html: '<strong>本 Session 处于异常状态：</strong>' + escapeHtml(s.error) +
          '。错误详情可在<span class="mono"> 日志与审计 → 错误</span>里按 traceId 追。' })
      : '') +
      sessionOverviewCard(s) +
      cardShell({
        title: '轮次时间轴',
        icon: 'i-clock',
        desc: '最近 ' + s.timeline.length + ' 轮',
        body: timelineHtml(items)
      }) +
      noticeBar({
        kind: 'info', icon: 'i-info',
        html: '<strong>三种互动模式共用这一条 Session。</strong>聊天模式、2D 形象模式与 3D 形象模式的差异只存在于客户端表现层，' +
          '不进入跨仓库协议，因此这里没有互动模式字段，切换模式也不会新开 Session。'
      });
  }

  function sessionBufferTab(s) {
    const live = s.buffer.filter((b) => !b.evicted).length;
    const slots = s.buffer.map((b) => {
      const tag = b.evicted
        ? '<span class="status-tag is-muted">已剪枝</span>'
        : b.injected
          ? '<span class="status-tag is-primary">调试注入</span>'
          : '<span class="status-tag is-ok">在窗内</span>';
      return '<div class="buffer-slot' + (b.evicted ? ' is-evicted' : '') + '">' +
        '<span class="buffer-index">' + b.idx + '</span>' +
        '<div class="buffer-copy"><p>' + escapeHtml(b.text) + '</p>' +
          '<span>' + escapeHtml(BUFFER_KIND_TEXT[b.kind] || b.kind) + ' · ' + formatClock(b.ts) + '</span></div>' +
        tag + '</div>';
    }).join('');
    return cardShell({
      title: 'Working Memory Buffer 快照',
      icon: 'i-layers',
      desc: '容量 ' + BUFFER_CAPACITY + ' 条 · 在窗 ' + live + ' 条 · 已剪枝 ' + (s.buffer.length - live) + ' 条',
      body: (s.buffer.length ? slots : '<p class="muted">Buffer 为空。</p>') +
        '<div class="divider"></div>' +
        noticeBar({
          kind: 'info', icon: 'i-info',
          html: 'Buffer 由系统按容量与 TTL 自动剪枝，LLM 只读、不能自己往里写。超出 ' + BUFFER_CAPACITY +
            ' 条时最旧的一条被标记为已剪枝，长期信息靠记忆固化沉淀到 Memory Service。'
        })
    }) +
      noticeBar({ kind: 'deferred', icon: 'i-clock', html: DEFERRED.consolidation });
  }

  function stateFieldValue(s, key) {
    const v = s.agentState[key];
    if (key === 'Mood') {
      return '<span class="cell-mono">valence ' + v.valence.toFixed(2) + ' · arousal ' + v.arousal.toFixed(2) + '</span>';
    }
    if (key === 'Energy' || key === 'Affection' || key === 'Loneliness' || key === 'Curiosity') {
      return '<span class="quota-cell">' + progressHtml(v, 100, key) +
        '<span class="progress-label">' + v + ' / 100</span></span>';
    }
    if (key === 'CurrentGoal') return v ? escapeHtml(v) : '<span class="muted">（空）</span>';
    if (key === 'CurrentActivity') return escapeHtml(ACTIVITY_TEXT[v] || v) + ' <span class="cell-mono muted">' + escapeHtml(v) + '</span>';
    if (key === 'CircadianPhase') return escapeHtml(PHASE_TEXT[v] || v) + ' <span class="cell-mono muted">' + escapeHtml(v) + '</span>';
    if (key === 'LastInteractionAt') {
      return timeAgo(v) + ' <span class="cell-mono muted">' + formatDateTime(v) + '</span>';
    }
    if (key === 'ActiveDevice') return escapeHtml(DEVICE_TEXT[v] || v);
    return '<span class="cell-mono">' + escapeHtml(String(v)) + '</span>';
  }

  function sessionStateTab(s) {
    return cardShell({
      title: 'Agent State 快照',
      icon: 'i-activity',
      desc: 'VersionSeq ' + s.agentState.VersionSeq,
      body: kvList(STATE_FIELDS.map((f) => [f[0], stateFieldValue(s, f[0])]), { dense: true, mono: true })
    }) +
      cardShell({
        title: '字段含义',
        icon: 'i-index',
        desc: '十一字段，来自 Agent Service 架构设计 §6.1',
        body: '<div class="var-list">' + STATE_FIELDS.map((f) =>
          '<div><code>' + escapeHtml(f[0]) + '</code><span>' + escapeHtml(f[1]) + '</span></div>').join('') + '</div>'
      }) +
      noticeBar({
        kind: 'warn', icon: 'i-lock',
        html: '<strong>State 由系统规则维护，LLM 只读。</strong>后台同样没有直接改写 State 的入口——' +
          '想观察 State 变化，只能注入一个测试感知事件，让规则自己去改，改动会体现在 VersionSeq 上。'
      });
  }

  function sessionPromptTab(s) {
    return cardShell({
      title: 'Prompt 拼装预览',
      icon: 'i-scroll',
      desc: '合计 ' + promptTotal(s) + ' tokens',
      flush: true,
      body: codeBlock(promptAssemblyText(s))
    }) +
      cardShell({
        title: '各层来源',
        icon: 'i-layers',
        body: s.promptPreview.map((p) =>
          '<div class="recall-item"><div class="recall-head">' + icon('i-layers') +
          '<span>' + escapeHtml(p.layer) + '</span><span class="cell-mono">' + p.tokens + ' tokens</span></div>' +
          '<div class="recall-reason">' + escapeHtml(p.source) + '</div></div>').join('')
      }) +
      noticeBar({
        kind: 'info', icon: 'i-shield',
        html: '第 1、2 层来自 AI 身份，是<strong>前置固定层</strong>，运行时只读；后台改的是 Prompt 模板正文，' +
          '改完必须发布新版本才生效，层序与拼装时机都由 Agent Service 掌握。'
      });
  }

  function sessionMediaTab(s) {
    if (!s.mediaRefs.length) {
      return emptyState({ icon: 'i-waveform', title: '本轮没有产生留存媒体', desc: '纯文字轮次不会写音频留存或视觉留存。' });
    }
    const items = s.mediaRefs.map((r) => {
      const m = findMedia(r.id);
      const left = daysLeft(m ? m.expiresAt : 0);
      return '<div class="recall-item">' +
        '<div class="recall-head">' + icon(r.kind === 'audio' ? 'i-waveform' : 'i-frame') +
        '<span>' + escapeHtml(MEDIA_KIND_TEXT[r.kind] || r.kind) + ' · ' +
          escapeHtml(DIRECTION_TEXT[r.direction] || r.direction) + '</span>' +
        '<span class="cell-mono">' + escapeHtml(r.id) + '</span></div>' +
        '<div class="recall-reason">' + (m
          ? '<span class="mono">' + escapeHtml(m.objectKey) + '</span> · ' + formatBytes(m.bytes) +
            (m.durationMs ? ' · ' + formatDuration(m.durationMs) : '') + (m.resolution ? ' · ' + escapeHtml(m.resolution) : '') +
            ' · 保留 ' + m.retentionDays + ' 天，' + (left > 0 ? '还剩 ' + left + ' 天' : '已到期')
          : '索引已失效，对象可能已被生命周期策略清理') + '</div></div>';
    }).join('');
    return cardShell({
      title: '关联留存媒体',
      icon: 'i-waveform',
      desc: s.mediaRefs.length + ' 条媒体索引',
      extra: '<button class="btn btn--sm" type="button" data-action="nav.go" data-module="media">' +
        icon('i-external') + '去媒体留存</button>',
      body: items
    }) +
      noticeBar({
        kind: 'warn', icon: 'i-lock',
        html: '音频与图像字节只存对象存储，数据库里只有<strong>媒体索引</strong>。后台要听要看得先换取短期签名地址，' +
          '每次换取都会写一条审计；签名地址过期后必须重新换取。'
      });
  }

  function sessionDrawerBody(s, tab) {
    if (tab === 'buffer') return sessionBufferTab(s);
    if (tab === 'state') return sessionStateTab(s);
    if (tab === 'prompt') return sessionPromptTab(s);
    if (tab === 'media') return sessionMediaTab(s);
    return sessionTurnsTab(s);
  }

  function sessionDrawerFoot(s) {
    return '<button class="btn" type="button" data-action="session.replay" data-id="' + escapeHtml(s.id) + '">' +
        icon('i-scroll') + '重放本轮 Prompt</button>' +
      '<button class="btn btn--primary" type="button" data-action="session.inject" data-id="' + escapeHtml(s.id) + '"' +
        guardAttr('session:inject', SESSION_INJECT_REASON) + '>' + icon('i-flask') + '注入测试感知事件</button>' +
      '<span class="spacer"></span>' +
      '<button class="btn btn--ghost" type="button" data-action="nav.go" data-module="agents" data-id="' +
        escapeHtml(s.agentId) + '">' + icon('i-agent') + '打开 Agent 实例</button>';
  }

  VIEWS.sessions = {
    scroll: 'list',
    drawerTabs: [
      { key: 'turns', label: '轮次时间轴', icon: 'i-clock' },
      { key: 'buffer', label: 'Working Memory', icon: 'i-layers' },
      { key: 'state', label: 'Agent State', icon: 'i-activity' },
      { key: 'prompt', label: 'Prompt 拼装', icon: 'i-scroll' },
      { key: 'media', label: '关联留存', icon: 'i-waveform' }
    ],
    render(host) {
      mountList(host, 'sessions', {
        path: '/sessions',
        caption: 'Session 列表',
        pageSize: 8,
        skeletonRows: 8,
        columns: [
          { label: 'Session' },
          { label: '归属用户', width: '132px', cls: 'col-optional' },
          { label: 'Agent 实例', width: '128px', cls: 'col-optional' },
          { label: '触发 Loop', width: '104px' },
          { label: '轮次', width: '58px', cls: 'cell-num' },
          { label: '设备', width: '78px', cls: 'col-optional' },
          { label: '状态', width: '86px' },
          { label: '最近事件', width: '104px', cls: 'col-optional cell-mono' },
          { label: '操作', width: '60px', cls: 'cell-actions' }
        ],
        filters(store) {
          const f = store.filters;
          return filterSearch('sessions', 'q', '搜索 Session ID、用户或 Agent 实例', f.q) +
            filterSelect('sessions', 'agent', 'Agent 实例', sessionAgentOptions(), f.agent) +
            filterSelect('sessions', 'mode', '触发 Loop', SESSION_MODE_OPTIONS, f.mode) +
            SESSION_STATUS_OPTIONS.map((o) =>
              filterChip('sessions', 'status', o[0], o[1], f.status === o[0],
                o[0] === 'all' ? store.items.length : store.items.filter((s) => s.status === o[0]).length)).join('') +
            '<span class="filter-summary">只读端点 GET ' + BASE + '/sessions</span>';
        },
        filter(items, f) {
          const q = (f.q || '').trim().toLowerCase();
          return items.filter((s) =>
            (f.agent === 'all' || s.agentId === f.agent) &&
            (f.mode === 'all' || s.mode === f.mode) &&
            (f.status === 'all' || s.status === f.status) &&
            (!q || [s.id, s.userId, s.agentId, userName(s.userId), agentName(s.agentId)]
              .join(' ').toLowerCase().indexOf(q) >= 0));
        },
        row(s) {
          return '<tr>' +
            td('<span class="cell-id"><span class="cell-avatar">' + icon('i-messages') + '</span>' +
              '<span class="cell-id-copy">' + rowOpen('sessions', s.id, s.id) +
              '<span>' + escapeHtml(userName(s.userId) + ' · ' + agentName(s.agentId)) + '</span></span></span>',
              '', s.id + ' · ' + userName(s.userId) + ' · ' + agentName(s.agentId)) +
            td(navLink('users', s.userId, userName(s.userId), '打开用户 ' + s.userId), 'col-optional',
              userName(s.userId) + '（' + s.userId + '）') +
            td(navLink('agents', s.agentId, s.agentId, '打开 Agent 实例 ' + agentName(s.agentId)), 'col-optional',
              agentName(s.agentId)) +
            td(loopTag(s.mode)) +
            td(String(s.turnCount), 'cell-num') +
            td(escapeHtml(DEVICE_TEXT[s.device] || s.device), 'col-optional') +
            td(statusTag(s.status)) +
            td(timeAgo(s.lastEventAt), 'col-optional cell-mono', formatDateTime(s.lastEventAt)) +
            td(rowActions([
              iconAction('session.inject', 'i-flask', '注入测试感知事件', ' data-id="' + s.id + '"',
                'session:inject', SESSION_INJECT_REASON)
            ]), 'cell-actions') +
          '</tr>';
        },
        empty(store) {
          const f = store.filters;
          if (f.q || f.agent !== 'all' || f.mode !== 'all' || f.status !== 'all') {
            return emptyState({
              icon: 'i-search', title: '没有匹配的 Session',
              desc: '当前筛选条件是「' + escapeHtml(sessionsFilterSummary(f)) + '」，没有命中的记录。',
              actions: '<button class="btn btn--ghost" type="button" data-action="filter.reset" data-key="sessions">' +
                icon('i-refresh') + '清空筛选</button>'
            });
          }
          return emptyState({
            icon: 'i-inbox', title: '当前没有 Session',
            desc: '还没有用户与 Agent 实例建立过会话。演示注入「空数据」也会让所有只读端点返回 0 条。',
            actions: '<button class="btn btn--ghost" type="button" data-action="chaos.set" data-mode="none">' +
              icon('i-check-circle') + '关闭演示注入</button>'
          });
        },
        footExtra(store) {
          const active = store.items.filter((s) => s.status === 'active').length;
          return '<span class="filter-summary">进行中 ' + active + ' 条' +
            (store.filtered !== store.items.length ? ' · 筛选后 ' + store.filtered + ' 条' : '') + '</span>';
        }
      });
      host.insertAdjacentHTML('afterbegin', noticeBar({
        kind: 'info', icon: 'i-messages',
        html: '<strong>互动模式不是一条 Session 维度。</strong>聊天模式、2D 形象模式与 3D 形象模式共用同一 Agent 与同一 Session，' +
          '模式差异只存在于客户端表现层、不进入跨仓库协议，所以下表用「触发 Loop」区分 Reactive 与 Proactive，' +
          '用「设备」区分手机 / 桌面端 / 平板。'
      }));
    },
    renderDrawer(s, tab, focusTab) {
      openDrawer({
        title: 'Session ' + s.id,
        icon: 'i-messages',
        desc: escapeHtml(userName(s.userId)) + ' · Agent <span class="mono">' + escapeHtml(s.agentId) + '</span> · ' +
          escapeHtml(DEVICE_TEXT[s.device] || s.device) + ' · ' + s.turnCount + ' 轮',
        headExtra: statusTag(s.status) + loopTag(s.mode),
        lg: true,
        tabs: tabsHtml('drawer.tab', VIEWS.sessions.drawerTabs, tab, { label: 'Session 详情分区' }),
        body: sessionDrawerBody(s, tab),
        foot: sessionDrawerFoot(s),
        onMount: focusTab ? focusActiveTab : null
      });
    }
  };

  /* 重放是只读的：把当轮拼好的 Prompt 原样展示，不调 LLM、不写库、不进审计 */
  function openSessionReplay(id) {
    const s = findSession(id);
    if (!s) { toast('Session ' + id + ' 已不存在，列表可能已经刷新', 'error'); return; }
    openModal({
      title: '重放本轮 Prompt',
      icon: 'i-scroll',
      size: 'lg',
      desc: '<span class="mono">' + escapeHtml(s.id) + '</span> · 最近一轮 · 合计 ' + promptTotal(s) + ' tokens',
      body:
        noticeBar({
          kind: 'info', icon: 'i-eye',
          html: '只读重放：展示 Agent Service 当轮实际拼给 LLM 的八层内容，<strong>不会真的发起调用</strong>，' +
            '不产生写操作，因此不进审计。'
        }) +
        cardShell({
          title: '八层拼装结果', icon: 'i-layers', desc: '层序固定', flush: true,
          body: codeBlock(promptAssemblyText(s))
        }) +
        cardShell({
          title: '当轮上下文', icon: 'i-clock',
          body: kvList([
            ['轮次', '<span class="cell-mono">#' + s.timeline.length + '</span> / 共 ' + s.turnCount + ' 轮'],
            ['触发 Loop', loopTag(s.mode)],
            ['Buffer 在窗', '<span class="cell-mono">' + s.buffer.filter((b) => !b.evicted).length +
              '</span> / ' + BUFFER_CAPACITY + ' 条'],
            ['State 版本', '<span class="cell-mono">VersionSeq ' + s.agentState.VersionSeq + '</span>'],
            ['最近事件', timeAgo(s.lastEventAt)]
          ], { dense: true })
        }),
      foot: '<span class="status-tag is-muted">只读，无写操作</span>' +
        '<button class="btn btn--primary" type="button" data-action="layer.close" data-kind="modal" data-autofocus>' +
        icon('i-check') + '知道了</button>'
    });
  }

  FORMS.sessionInject = {
    title: '注入测试感知事件',
    icon: 'i-flask',
    desc: (ctx) => {
      const s = findSession(ctx.id);
      return s
        ? '目标：<span class="mono">' + escapeHtml(s.id) + '</span> · ' + escapeHtml(userName(s.userId)) +
          ' / Agent <span class="mono">' + escapeHtml(s.agentId) + '</span>'
        : '';
    },
    requires: 'session:inject',
    reason: SESSION_INJECT_REASON,
    submitText: '注入事件',
    body: (ctx) => {
      const s = findSession(ctx.id);
      if (!s) return noticeBar({ kind: 'danger', icon: 'i-alert', text: 'Session 已不存在，列表可能已经刷新。' });
      return '<div class="form-grid">' +
        fieldHtml({
          name: 'kind', label: '事件类型', type: 'static',
          html: '感知事件（perception）· 走 ClientSignal 通道，与真实客户端信号同形'
        }) +
        fieldHtml({
          name: 'buffer', label: 'Buffer 余量', type: 'static',
          html: statusTag(s.status) + ' <span class="cell-mono muted">在窗 ' +
            s.buffer.filter((b) => !b.evicted).length + ' / ' + BUFFER_CAPACITY + ' 条</span>'
        }) +
        fieldHtml({
          name: 'text', label: '事件内容', type: 'textarea', full: true, rows: 3, required: true,
          maxlength: 120, autofocus: true, placeholder: '例如：ClientSignal · 用户回到桌面端，环境噪音低',
          hint: '写入后自动带「调试注入 ·」前缀，便于在轮次与 Buffer 里和真实事件区分开'
        }) +
        '</div>' +
        noticeBar({
          kind: 'warn', icon: 'i-info',
          html: '注入只写 Working Memory Buffer，<strong>不会直接改写 Agent State</strong>；State 由系统规则维护、LLM 只读。' +
            'Buffer 容量 ' + BUFFER_CAPACITY + ' 条，超出按最旧剪枝。'
        }) +
        (s.status === 'ended'
          ? noticeBar({ kind: 'danger', icon: 'i-alert', text: '该 Session 已结束，服务端会返回 409，注入不会生效。' })
          : '');
    },
    validate(v, form, ctx) {
      const s = findSession(ctx.id);
      if (!s) return 'Session 已不存在，列表可能已经刷新。';
      if (s.status === 'ended') return '409 · Session 已结束，不能再注入调试事件';
      if (!v.text || !v.text.trim()) return { field: 'text', msg: '事件内容必填' };
      return null;
    },
    async run(v, ctx, busyEl) {
      const res = await runWrite({
        action: 'session.inject_debug_event', method: 'POST', path: '/sessions/' + ctx.id + '/debug-events',
        capability: 'session:inject', target: 'Session ' + ctx.id + ' · ' + v.text.trim().slice(0, 40),
        body: { text: v.text.trim() }, reason: SESSION_INJECT_REASON, busyEl: busyEl,
        successText: '已注入测试感知事件', refresh: () => refreshCurrent()
      });
      if (res && drawerCtx && drawerCtx.module === 'sessions' && drawerCtx.id === ctx.id) redrawDrawer('buffer');
    }
  };

  /* ----------------------------------------------------------
     11.6 providers · 模型供应商（A 级）
     密钥只存服务端 Secret，后台永远只拿到引用名与掩码，永不回显明文。
     ---------------------------------------------------------- */

  const PROVIDER_WRITE_REASON = '模型供应商属于系统级配置，仅系统管理员可写';
  const PROVIDER_KIND_OPTIONS = [['llm', 'LLM 推理'], ['tts', '语音合成'], ['vision', '视觉理解']];
  const PROVIDER_KIND_ICON = { llm: 'i-brain', tts: 'i-waveform', vision: 'i-frame' };
  const PROVIDER_KIND_FILTER = [['all', '全部类型']].concat(PROVIDER_KIND_OPTIONS);
  const PROVIDER_STATUS_OPTIONS = [
    ['all', '全部状态'], ['ok', '正常'], ['degraded', '劣化'], ['down', '不可用'], ['unknown', '未测试']
  ];
  const PROVIDER_COLUMNS = [
    { label: '供应商' },
    { label: 'Base URL', width: '240px', cls: 'col-optional' },
    { label: '密钥', width: '124px' },
    { label: '状态', width: '86px' },
    { label: '首字节延迟', width: '92px', cls: 'col-optional cell-num' },
    { label: '错误率', width: '76px', cls: 'col-optional cell-num' },
    { label: '默认', width: '76px' },
    { label: '最近测试', width: '100px', cls: 'col-optional cell-mono' },
    { label: '操作', width: '92px', cls: 'cell-actions' }
  ];

  const providerKindLabel = (k) => (PROVIDER_KIND_OPTIONS.filter((o) => o[0] === k)[0] || [k, k])[1];
  const providerKindIcon = (k) => PROVIDER_KIND_ICON[k] || 'i-plug';

  function providersFilterSummary(f) {
    const parts = [];
    if (f.q) parts.push('关键字「' + f.q + '」');
    if (f.kind !== 'all') parts.push(providerKindLabel(f.kind));
    return parts.length ? parts.join(' · ') : '无筛选';
  }

  /* 明文密钥永远不出现在后台：这里只渲染服务端返回的掩码 */
  function secretMask(p) {
    return '<span class="secret-mask" title="明文密钥只存服务端 Secret（' + escapeHtml(p.secretRef) + '），后台永不回显">' +
      icon('i-key') + escapeHtml(p.maskedKey) + '</span>';
  }

  function defaultTag(p) {
    return p.isDefault
      ? '<span class="status-tag is-primary">默认</span>'
      : '<span class="status-tag is-muted">备选</span>';
  }

  function providerActions(p) {
    return '<div class="row row-wrap">' +
      '<button class="btn btn--sm" type="button" data-action="provider.ping" data-id="' + escapeHtml(p.id) + '"' +
        guardAttr('provider:write', PROVIDER_WRITE_REASON) + '>' + icon('i-plug') + '测试连通性</button>' +
      '<button class="btn btn--sm" type="button" data-action="provider.edit" data-id="' + escapeHtml(p.id) + '"' +
        guardAttr('provider:write', PROVIDER_WRITE_REASON) + '>' + icon('i-pencil') + '编辑</button>' +
      (p.isDefault
        ? '<span class="status-tag is-muted">已是默认</span>'
        : '<button class="btn btn--sm" type="button" data-action="provider.default" data-id="' + escapeHtml(p.id) + '"' +
            guardAttr('provider:write', PROVIDER_WRITE_REASON) + '>' + icon('i-check-circle') + '设为默认</button>') +
      '</div>';
  }

  function providerCard(p) {
    return '<section class="card provider-card">' +
      '<div class="provider-top">' +
        '<span class="quick-icon">' + icon(providerKindIcon(p.kind)) + '</span>' +
        '<span class="provider-name">' + rowOpen('providers', p.id, p.name) +
          '<span>' + escapeHtml(p.id + ' · ' + providerKindLabel(p.kind) + ' · ' + p.model) + '</span></span>' +
        defaultTag(p) +
      '</div>' +
      '<span class="cell-mono muted ellipsis" title="' + escapeHtml(p.baseUrl) + '">' + escapeHtml(p.baseUrl) + '</span>' +
      '<div class="provider-foot">' + statusTag(p.status) +
        '<span class="cell-mono muted">' + (p.latencyMs ? p.latencyMs + 'ms' : '—') + ' · ' +
          p.calls24h + ' 次/24h · 错误率 ' + p.errorRate + '%</span></div>' +
      '<div class="provider-foot">' + secretMask(p) + '</div>' +
      providerActions(p) +
      '</section>';
  }

  function providerRow(p) {
    return '<tr>' +
      td('<span class="cell-id"><span class="cell-avatar">' + icon(providerKindIcon(p.kind)) + '</span>' +
        '<span class="cell-id-copy">' + rowOpen('providers', p.id, p.name) +
        '<span>' + escapeHtml(p.id + ' · ' + providerKindLabel(p.kind) + ' · ' + p.model) + '</span></span></span>',
        '', p.name + '（' + p.id + '）') +
      td('<span class="cell-mono ellipsis">' + escapeHtml(p.baseUrl) + '</span>', 'col-optional', p.baseUrl) +
      td(secretMask(p), '', '明文密钥只存服务端 Secret ' + p.secretRef + '，后台永不回显') +
      td(statusTag(p.status)) +
      td(p.latencyMs ? String(p.latencyMs) + 'ms' : '—', 'col-optional cell-num') +
      td(p.errorRate + '%', 'col-optional cell-num') +
      td(defaultTag(p)) +
      td(p.lastPingAt ? timeAgo(p.lastPingAt) : '<span class="muted">未测试</span>', 'col-optional cell-mono',
        p.lastPingAt ? formatDateTime(p.lastPingAt) : '') +
      td(rowActions([
        iconAction('provider.ping', 'i-plug', '测试连通性', ' data-id="' + p.id + '"',
          'provider:write', PROVIDER_WRITE_REASON),
        iconAction('provider.edit', 'i-pencil', '编辑供应商', ' data-id="' + p.id + '"',
          'provider:write', PROVIDER_WRITE_REASON)
      ]), 'cell-actions') +
    '</tr>';
  }

  function providerConfigTab(p) {
    return cardShell({
      title: '供应商配置',
      icon: providerKindIcon(p.kind),
      desc: p.id,
      body: kvList([
        ['名称', escapeHtml(p.name)],
        ['类型', escapeHtml(providerKindLabel(p.kind)) + ' <span class="cell-mono muted">' + escapeHtml(p.kind) + '</span>'],
        ['模型', '<span class="cell-mono">' + escapeHtml(p.model) + '</span>'],
        ['Base URL', '<span class="cell-mono">' + escapeHtml(p.baseUrl) + '</span>'],
        ['Secret 引用', '<span class="cell-mono">' + escapeHtml(p.secretRef) + '</span>'],
        ['密钥掩码', secretMask(p)],
        ['默认供应商', defaultTag(p) + ' <span class="muted">同类型只允许一个默认</span>'],
        ['连通状态', statusTag(p.status)],
        ['最近测试', p.lastPingAt
          ? timeAgo(p.lastPingAt) + ' <span class="cell-mono muted">' + formatDateTime(p.lastPingAt) + '</span>'
          : '<span class="muted">从未测试</span>'],
        ['最近更新', timeAgo(p.updatedAt) + ' <span class="muted">by ' + escapeHtml(p.updatedBy) + '</span>']
      ], { dense: true })
    }) +
      noticeBar({
        kind: 'warn', icon: 'i-lock',
        html: '<strong>明文密钥不会出现在后台。</strong>密钥只写进服务端 Secret 存储，Admin API 回传的永远是引用名与掩码；' +
          '轮换密钥时也只是提交新明文让服务端覆写，页面上不会回显旧值。'
      });
  }

  function providerStatsTab(p) {
    const errs = DB.errors.filter((e) => e.providerId === p.id);
    return '<div class="stat-grid">' +
      statCard({ label: '24 小时调用', value: '<span class="cell-mono">' + p.calls24h + '</span>', foot: '由 Agent Service 上报' }) +
      statCard({
        label: '平均首字节延迟', value: '<span class="cell-mono">' + (p.latencyMs || '—') + '</span>' + (p.latencyMs ? 'ms' : ''),
        foot: p.latencyMs > 1200 ? '<span class="trend-down">高于 1200ms 阈值</span>' : '<span class="trend-up">在阈值内</span>',
        alert: p.latencyMs > 1200
      }) +
      statCard({
        label: '错误率', value: '<span class="cell-mono">' + p.errorRate + '</span>%',
        foot: p.errorRate > 5 ? '<span class="trend-down">需要关注</span>' : '<span class="trend-up">正常</span>',
        alert: p.errorRate > 5
      }) +
      statCard({
        label: '关联错误', value: '<span class="cell-mono">' + errs.length + '</span>',
        foot: '最近 24 小时', alert: errs.length > 1,
        action: errs.length ? 'nav.go' : '', module: errs.length ? 'logs' : '', sub: errs.length ? 'errors' : ''
      }) +
      '</div>' +
      cardShell({
        title: '关联错误', icon: 'i-bug', desc: errs.length ? errs.length + ' 条' : '无',
        body: errs.length
          ? errs.map((e) => '<div class="recall-item"><div class="recall-head">' + icon('i-bug') +
              '<span>' + escapeHtml(e.message) + '</span><span class="cell-mono">' + escapeHtml(e.traceId) + '</span></div>' +
              '<div class="recall-reason">' + timeAgo(e.ts) + ' · 级别 ' + escapeHtml(e.level) + ' · 出现 ' + e.count + ' 次' +
              (e.agentId ? ' · Agent <span class="mono">' + escapeHtml(e.agentId) + '</span>' : '') + '</div></div>').join('')
          : '<p class="muted">该供应商最近没有记录到错误。</p>'
      }) +
      noticeBar({
        kind: 'info', icon: 'i-info',
        html: '调用统计由 Agent Service 侧上报，后台只做展示；这里看不到任何请求体或响应体原文，避免用户内容进入后台。'
      });
  }

  function providerHistoryTab(p) {
    return cardShell({
      title: '配置与切换历史', icon: 'i-history', desc: p.history.length + ' 条',
      body: timelineHtml(p.history.map((h) => ({
        icon: h.note.indexOf('默认') >= 0 ? 'i-check-circle' : 'i-pencil',
        title: h.note,
        ts: h.ts,
        body: '<span class="cell-mono">' + escapeHtml(h.actor) + '</span>'
      })))
    }) +
      cardShell({
        title: '相关审计记录', icon: 'i-shield', desc: 'Admin API 写操作',
        body: auditTimeline(auditOf('/providers/' + p.id), '该供应商还没有留下审计记录。')
      }) +
      noticeBar({
        kind: 'info', icon: 'i-shield',
        html: '每一次供应商配置变更都会写入审计，包含操作者、角色、时间、目标与结果；审计按独立保留期留存，不随供应商删除而消失。'
      });
  }

  function providerDrawerBody(p, tab) {
    if (tab === 'stats') return providerStatsTab(p);
    if (tab === 'history') return providerHistoryTab(p);
    return providerConfigTab(p);
  }

  function providerDrawerFoot(p) {
    return '<button class="btn" type="button" data-action="provider.ping" data-id="' + escapeHtml(p.id) + '"' +
        guardAttr('provider:write', PROVIDER_WRITE_REASON) + '>' + icon('i-plug') + '测试连通性</button>' +
      '<button class="btn btn--primary" type="button" data-action="provider.edit" data-id="' + escapeHtml(p.id) + '"' +
        guardAttr('provider:write', PROVIDER_WRITE_REASON) + '>' + icon('i-pencil') + '编辑配置</button>' +
      (p.isDefault ? '' :
        '<button class="btn" type="button" data-action="provider.default" data-id="' + escapeHtml(p.id) + '"' +
          guardAttr('provider:write', PROVIDER_WRITE_REASON) + '>' + icon('i-check-circle') + '设为默认</button>') +
      '<span class="spacer"></span>' +
      '<button class="btn btn--ghost" type="button" data-action="nav.go" data-module="logs" data-sub="errors">' +
        icon('i-bug') + '查看错误日志</button>';
  }

  VIEWS.providers = {
    scroll: 'list',
    drawerTabs: [
      { key: 'config', label: '配置', icon: 'i-plug' },
      { key: 'stats', label: '调用统计', icon: 'i-activity' },
      { key: 'history', label: '切换历史', icon: 'i-history' }
    ],
    actions() {
      const layout = state.data.providers.filters.layout;
      const seg = (key, iconId, label) =>
        '<button class="icon-btn' + (layout === key ? ' is-on' : '') + '" type="button" data-action="provider.layout"' +
        ' data-layout="' + key + '" aria-pressed="' + (layout === key ? 'true' : 'false') + '" aria-label="' + label + '"' +
        ' title="' + label + '">' + icon(iconId) + '</button>';
      return seg('grid', 'i-grid', '卡片视图') + seg('list', 'i-list', '表格视图') +
        '<button class="btn btn--primary" type="button" data-action="provider.create"' +
          guardAttr('provider:write', PROVIDER_WRITE_REASON) + '>' + icon('i-plus') + '新增供应商</button>';
    },
    render(host) {
      mountList(host, 'providers', {
        path: '/providers',
        caption: '模型供应商列表',
        pageSize: 9,
        skeleton() {
          return state.data.providers.filters.layout === 'list'
            ? skeletonRows(6)
            : skeletonCards(6, 'provider-grid');
        },
        columns: PROVIDER_COLUMNS,
        filters(store) {
          const f = store.filters;
          return filterSearch('providers', 'q', '搜索供应商名称、ID、模型或 Base URL', f.q) +
            filterSelect('providers', 'kind', '类型', PROVIDER_KIND_FILTER, f.kind) +
            PROVIDER_STATUS_OPTIONS.map((o) =>
              filterChip('providers', 'status', o[0], o[1], f.status === o[0],
                o[0] === 'all' ? store.items.length : store.items.filter((p) => p.status === o[0]).length)).join('') +
            '<span class="filter-summary">端点 GET ' + BASE + '/providers</span>';
        },
        filter(items, f) {
          const q = (f.q || '').trim().toLowerCase();
          return items.filter((p) =>
            (f.kind === 'all' || p.kind === f.kind) &&
            (f.status === 'all' || p.status === f.status) &&
            (!q || [p.name, p.id, p.model, p.baseUrl, p.secretRef].join(' ').toLowerCase().indexOf(q) >= 0));
        },
        list(slice, store) {
          return store.filters.layout === 'grid'
            ? '<div class="provider-grid">' + slice.map(providerCard).join('') + '</div>'
            : tableHtml({ caption: '模型供应商列表', columns: PROVIDER_COLUMNS }, slice.map(providerRow).join(''));
        },
        empty(store) {
          const f = store.filters;
          if (f.q || f.kind !== 'all' || f.status !== 'all') {
            return emptyState({
              icon: 'i-search', title: '没有匹配的供应商',
              desc: '当前筛选条件是「' + escapeHtml(providersFilterSummary(f)) + '」，没有命中的记录。',
              actions: '<button class="btn btn--ghost" type="button" data-action="filter.reset" data-key="providers">' +
                icon('i-refresh') + '清空筛选</button>'
            });
          }
          return emptyState({
            icon: 'i-plug', title: '还没有接入任何供应商',
            desc: '接入第一个供应商后，Agent Service 才能发起 LLM 推理、语音合成或视觉理解调用。',
            actions: '<button class="btn btn--primary" type="button" data-action="provider.create"' +
              guardAttr('provider:write', PROVIDER_WRITE_REASON) + '>' + icon('i-plus') + '新增供应商</button>'
          });
        },
        footExtra(store) {
          const defs = store.items.filter((p) => p.isDefault).length;
          const down = store.items.filter((p) => p.status === 'down').length;
          return '<span class="filter-summary">' + store.filtered + ' / ' + store.items.length + ' 条 · 默认 ' + defs +
            ' 个' + (down ? ' · <span class="status-tag is-danger">不可用 ' + down + '</span>' : '') + '</span>';
        }
      });
      host.insertAdjacentHTML('afterbegin', noticeBar({
        kind: 'info', icon: 'i-shield',
        html: '<strong>切换供应商不改变 Prompt，也不改变 Agent 运行时行为。</strong>供应商只是 Model Adapter 背后的一个实现，' +
          '八层拼装顺序、AI 身份与 Agent State 规则都与具体供应商无关；密钥只存服务端 Secret，后台永不回显明文。'
      }));
    },
    renderDrawer(p, tab, focusTab) {
      openDrawer({
        title: p.name,
        icon: providerKindIcon(p.kind),
        desc: '<span class="mono">' + escapeHtml(p.id) + '</span> · ' + escapeHtml(providerKindLabel(p.kind)) +
          ' · <span class="mono">' + escapeHtml(p.model) + '</span>',
        headExtra: statusTag(p.status) + defaultTag(p),
        tabs: tabsHtml('drawer.tab', VIEWS.providers.drawerTabs, tab, { label: '供应商详情分区' }),
        body: providerDrawerBody(p, tab),
        foot: providerDrawerFoot(p),
        onMount: focusTab ? focusActiveTab : null
      });
    }
  };

  /* 连通性测试：不需要表单，直接发请求；供应商 down 时服务端返回 502 */
  async function pingProvider(id, busyEl) {
    const p = findProvider(id);
    if (!p) { toast('供应商 ' + id + ' 已不存在，列表可能已经刷新', 'error'); return; }
    const res = await runWrite({
      action: 'provider.ping', method: 'POST', path: '/providers/' + id + '/ping', capability: 'provider:write',
      target: '供应商 ' + p.name + ' 连通性测试', reason: PROVIDER_WRITE_REASON, busyEl: busyEl,
      closeModal: false, successText: null, refresh: () => refreshCurrent()
    });
    if (res && drawerCtx && drawerCtx.module === 'providers' && drawerCtx.id === id) redrawDrawer();
  }

  function providerFormFields(p) {
    return '<div class="form-grid">' +
      fieldHtml({
        name: 'name', label: '供应商名称', type: 'text', full: true, required: true, maxlength: 40,
        value: p ? p.name : '', placeholder: '例如：备用语音合成供应商', autofocus: !p
      }) +
      fieldHtml({
        name: 'kind', label: '类型', type: 'select', options: PROVIDER_KIND_OPTIONS,
        value: p ? p.kind : 'llm', hint: '同一类型只允许一个默认供应商'
      }) +
      fieldHtml({
        name: 'model', label: '模型标识', type: 'text', value: p ? p.model : '', maxlength: 40,
        placeholder: '例如：gpt-4o-mini', hint: '留空表示由供应商侧决定'
      }) +
      fieldHtml({
        name: 'baseUrl', label: 'Base URL', type: 'text', full: true, required: true,
        value: p ? p.baseUrl : '', placeholder: 'https://api.example.local/v1',
        hint: '必须以 http:// 或 https:// 开头；请求由 Agent Service 的 Model Adapter 发出，后台不直连'
      }) +
      fieldHtml({
        name: 'secretRef', label: 'Secret 引用名', type: 'text', full: true, required: true,
        value: p ? p.secretRef : '', placeholder: 'SECRET_LLM_PRIMARY_KEY',
        hint: '4 位以上大写字母、数字或下划线，且以字母开头；后台保存的只是这个引用名'
      }) +
      fieldHtml({
        name: 'plainKey', label: p ? '轮换密钥（可选）' : '密钥明文', type: 'password', full: true,
        autocomplete: 'new-password', placeholder: p ? '留空表示不轮换' : 'sk-…',
        hint: '提交后直接写入服务端 Secret，<strong>页面不会回显</strong>，之后只能看到掩码'
      }) +
      '</div>' +
      (p ? '' : noticeBar({
        kind: 'info', icon: 'i-info',
        html: '新增的供应商初始状态是「未测试」，需要先跑一次连通性测试，再决定是否设为默认。'
      }));
  }

  function providerValidate(v) {
    if (!v.name || !v.name.trim()) return { field: 'name', msg: '供应商名称必填' };
    if (!v.baseUrl || !/^https?:\/\//.test(v.baseUrl.trim())) {
      return { field: 'baseUrl', msg: 'Base URL 必须以 http:// 或 https:// 开头' };
    }
    if (!v.secretRef || !/^[A-Z][A-Z0-9_]{3,}$/.test(v.secretRef.trim())) {
      return { field: 'secretRef', msg: 'Secret 引用名需为 4 位以上大写字母、数字或下划线，且以字母开头' };
    }
    return null;
  }

  const providerBodyOf = (v) => ({
    name: v.name.trim(), kind: v.kind, model: (v.model || '').trim(),
    baseUrl: v.baseUrl.trim(), secretRef: v.secretRef.trim(), plainKey: v.plainKey || ''
  });

  FORMS.providerCreate = {
    title: '新增模型供应商',
    icon: 'i-plus',
    desc: 'POST <span class="mono">' + BASE + '/providers</span>',
    requires: 'provider:write',
    reason: PROVIDER_WRITE_REASON,
    submitText: '新增供应商',
    body: () => providerFormFields(null),
    validate: providerValidate,
    async run(v, ctx, busyEl) {
      await runWrite({
        action: 'provider.create', method: 'POST', path: '/providers', capability: 'provider:write',
        target: '供应商 ' + v.name.trim(), body: providerBodyOf(v), reason: PROVIDER_WRITE_REASON,
        busyEl: busyEl, successText: '已新增供应商，密钥写入服务端 Secret', refresh: () => refreshCurrent()
      });
    }
  };

  FORMS.providerEdit = {
    title: '编辑模型供应商',
    icon: 'i-pencil',
    desc: (ctx) => {
      const p = findProvider(ctx.id);
      return p ? '目标：<span class="mono">' + escapeHtml(p.id) + '</span> · ' + escapeHtml(p.name) : '';
    },
    requires: 'provider:write',
    reason: PROVIDER_WRITE_REASON,
    submitText: '保存修改',
    body: (ctx) => {
      const p = findProvider(ctx.id);
      if (!p) return noticeBar({ kind: 'danger', icon: 'i-alert', text: '供应商已不存在，列表可能已经刷新。' });
      return providerFormFields(p) +
        noticeBar({
          kind: 'warn', icon: 'i-alert',
          html: '修改会立刻影响 Agent Service 的后续调用。当前密钥掩码是 <span class="mono">' +
            escapeHtml(p.maskedKey) + '</span>，留空「轮换密钥」表示保持不变。'
        });
    },
    validate: providerValidate,
    async run(v, ctx, busyEl) {
      const res = await runWrite({
        action: 'provider.update', method: 'PUT', path: '/providers/' + ctx.id, capability: 'provider:write',
        target: '供应商 ' + ctx.id + ' · ' + v.name.trim(), body: providerBodyOf(v), reason: PROVIDER_WRITE_REASON,
        busyEl: busyEl, successText: '供应商配置已更新', refresh: () => refreshCurrent()
      });
      if (res && drawerCtx && drawerCtx.module === 'providers' && drawerCtx.id === ctx.id) redrawDrawer();
    }
  };

  FORMS.providerDefault = {
    title: '设为默认供应商',
    icon: 'i-check-circle',
    desc: (ctx) => {
      const p = findProvider(ctx.id);
      return p ? escapeHtml(providerKindLabel(p.kind)) + ' · <span class="mono">' + escapeHtml(p.id) + '</span>' : '';
    },
    requires: 'provider:write',
    reason: PROVIDER_WRITE_REASON,
    submitText: '确认切换',
    size: 'sm',
    body: (ctx) => {
      const p = findProvider(ctx.id);
      if (!p) return noticeBar({ kind: 'danger', icon: 'i-alert', text: '供应商已不存在，列表可能已经刷新。' });
      const prev = DB.providers.filter((x) => x.kind === p.kind && x.isDefault && x.id !== p.id);
      return '<div class="form-grid">' +
        fieldHtml({ name: 'target', label: '切换为', type: 'static', full: true, html: escapeHtml(p.name) + ' <span class="cell-mono muted">' + escapeHtml(p.model) + '</span>' }) +
        fieldHtml({
          name: 'previous', label: '当前默认', type: 'static', full: true,
          html: prev.length ? escapeHtml(prev[0].name) + ' <span class="cell-mono muted">将转为备选</span>' : '<span class="muted">该类型当前没有默认供应商</span>'
        }) +
        '</div>' +
        noticeBar({
          kind: 'info', icon: 'i-shield',
          html: '<strong>供应商切换不改变 Prompt 内容，也不改变 Agent 运行时行为。</strong>' +
            '八层拼装顺序、AI 身份与 Agent State 规则都与具体供应商无关，切换只影响 Model Adapter 打到哪个上游。'
        }) +
        noticeBar({
          kind: 'warn', icon: 'i-alert',
          html: '切换会从下一次 LLM 调用开始生效，进行中的轮次仍走旧供应商；本次切换会写入审计。'
        });
    },
    validate(v, form, ctx) {
      const p = findProvider(ctx.id);
      if (!p) return '供应商已不存在，列表可能已经刷新。';
      if (p.isDefault) return '409 · ' + p.name + ' 已经是该类型的默认供应商';
      return null;
    },
    async run(v, ctx, busyEl) {
      const p = findProvider(ctx.id);
      const res = await runWrite({
        action: 'provider.set_default', method: 'PUT', path: '/providers/' + ctx.id + '/default',
        capability: 'provider:write', target: '供应商 ' + ctx.id + ' · 设为 ' + providerKindLabel(p.kind) + ' 默认',
        reason: PROVIDER_WRITE_REASON, busyEl: busyEl, successText: '已切换默认供应商',
        refresh: () => refreshCurrent()
      });
      if (res && drawerCtx && drawerCtx.module === 'providers' && drawerCtx.id === ctx.id) redrawDrawer();
    }
  };

  /* ----------------------------------------------------------
     11.7 prompts · Prompt 模板（A 级）
     Identity 是前置固定层、运行时只读；可变层单独组装、单独发布。
     fork 草稿 → 编辑 → 发布 / 回滚，每一步都进审计。
     ---------------------------------------------------------- */

  const PROMPT_WRITE_REASON = 'Prompt 模板属于内容配置，内容管理员与系统管理员可写';
  const PROMPT_STATUS_OPTIONS = [['all', '全部状态'], ['draft', '草稿'], ['published', '已发布'], ['archived', '已归档']];
  const PROMPT_COLUMNS = [
    { label: 'Prompt 模板' },
    { label: '所属层', width: '96px' },
    { label: '版本', width: '64px', cls: 'cell-num' },
    { label: '状态', width: '86px' },
    { label: '变量', width: '64px', cls: 'col-optional cell-num' },
    { label: '更新人', width: '168px', cls: 'col-optional' },
    { label: '最近更新', width: '104px', cls: 'col-optional cell-mono' },
    { label: '操作', width: '132px', cls: 'cell-actions' }
  ];

  /* 变量的来源层由前缀决定：这是后台唯一能给出的解释，正文本身不含语义标注 */
  const VAR_HINTS = [
    ['identity.', 'AI 身份分区，前置固定层，运行时只读'],
    ['state.', 'Agent State 快照，由系统规则维护，LLM 只读'],
    ['recall.', 'Memory Service 本次召回结果'],
    ['circadian.', '生物节律计算结果，按时间与时区推导'],
    ['intent.', 'ProactiveIntent，由 Proactive Loop 产出'],
    ['debounce.', '主动行为去抖窗口配置'],
    ['agent.', 'Agent 归属登记信息']
  ];
  const varHint = (name) => {
    const hit = VAR_HINTS.filter((h) => name.indexOf(h[0]) === 0)[0];
    return hit ? hit[1] : '由 Agent Service 在拼装时注入的运行时变量';
  };

  const layerOf = (pt) => PROMPT_LAYERS[pt.layerIndex - 1] || ('[' + pt.layerIndex + ']');
  const layerBadge = (pt) => {
    const raw = layerOf(pt);
    const m = raw.match(/^\[(\d+)\]\s*(System|User):\s*(.*)$/);
    return '<span class="status-tag ' + (m && m[2] === 'User' ? 'is-primary' : 'is-info') + '" title="' +
      escapeHtml(raw) + '">' + escapeHtml(m ? '[' + m[1] + '] ' + m[2] : raw) + '</span>';
  };

  function promptsFilterSummary(f) {
    const parts = [];
    if (f.q) parts.push('关键字「' + f.q + '」');
    if (f.status !== 'all') parts.push(STATUS_TEXT[f.status] || f.status);
    return parts.length ? parts.join(' · ') : '无筛选';
  }

  function promptRow(pt) {
    return '<tr>' +
      td('<span class="cell-id"><span class="cell-avatar">' + icon('i-scroll') + '</span>' +
        '<span class="cell-id-copy">' + rowOpen('prompts', pt.id, pt.name) +
        '<span>' + escapeHtml(pt.id + ' · ' + pt.purpose) + '</span></span></span>',
        '', pt.name + '（' + pt.id + '）') +
      td(layerBadge(pt), '', layerOf(pt)) +
      td('v' + pt.version, 'cell-num') +
      td(statusTag(pt.status)) +
      td(String(pt.vars.length), 'col-optional cell-num') +
      td('<span class="cell-mono ellipsis">' + escapeHtml(pt.updatedBy) + '</span>', 'col-optional', pt.updatedBy) +
      td(timeAgo(pt.updatedAt), 'col-optional cell-mono', formatDateTime(pt.updatedAt)) +
      td(rowActions([
        pt.status === 'draft'
          ? iconAction('prompt.edit', 'i-pencil', '编辑草稿', ' data-id="' + pt.id + '"',
              'prompt:write', PROMPT_WRITE_REASON)
          : iconAction('prompt.fork', 'i-branch', 'fork 草稿', ' data-id="' + pt.id + '"',
              'prompt:write', PROMPT_WRITE_REASON),
        iconAction('prompt.publish', 'i-upload', '发布', ' data-id="' + pt.id + '"',
          'prompt:write', PROMPT_WRITE_REASON),
        iconAction('prompt.rollback', 'i-rollback', '回滚到历史版本', ' data-id="' + pt.id + '"',
          'prompt:write', PROMPT_WRITE_REASON)
      ]), 'cell-actions') +
    '</tr>';
  }

  function promptBodyTab(pt) {
    return cardShell({
      title: '模板正文',
      icon: 'i-scroll',
      desc: 'v' + pt.version + ' · ' + pt.status,
      extra: '<button class="btn btn--sm" type="button" data-action="copy.text" data-copy="' +
        escapeHtml(pt.body) + '" aria-label="复制模板正文">' + icon('i-copy') + '复制</button>',
      flush: true,
      body: codeBlock(pt.body)
    }) +
      cardShell({
        title: '在八层拼装中的位置', icon: 'i-layers',
        body: '<div class="var-list">' + PROMPT_LAYERS.map((l, i) =>
          '<div><code' + (i + 1 === pt.layerIndex ? ' class="cell-strong"' : '') + '>' +
          escapeHtml(l.replace(/^(\[\d+\])\s*/, '$1 ')) + '</code><span>' +
          (i + 1 === pt.layerIndex ? '当前模板就在这一层' : '由其它模板或运行时数据填充') + '</span></div>').join('') + '</div>'
      }) +
      noticeBar({
        kind: 'info', icon: 'i-shield',
        html: '<strong>Identity 是前置固定层。</strong>第 1、2 层来自 AI 身份，运行时只读，后台改身份要走 AI 身份模块并留下版本；' +
          'Prompt 模板只能改可变层的措辞与变量，层序与拼装时机由 Agent Service 掌握，改不了。'
      });
  }

  function promptVarsTab(pt) {
    return cardShell({
      title: '变量清单',
      icon: 'i-hash',
      desc: pt.vars.length + ' 个，从正文里自动识别',
      body: pt.vars.length
        ? '<div class="var-list">' + pt.vars.map((v) =>
            '<div><code>{{' + escapeHtml(v) + '}}</code><span>' + escapeHtml(varHint(v)) + '</span></div>').join('') + '</div>'
        : '<p class="muted">正文里没有任何 {{变量}}，这个模板无法参与拼装，发布会被服务端拒绝。</p>'
      }) +
      noticeBar({
        kind: 'warn', icon: 'i-alert',
        html: '变量名拼错不会报错，只会在拼装时被替换成空串。发布前请对照这份清单确认：服务端会重新解析正文，' +
          '没有任何 {{变量}} 的模板会返回 422。'
      });
  }

  function promptHistoryTab(pt) {
    return cardShell({
      title: '版本历史', icon: 'i-history', desc: pt.history.length + ' 个版本',
      body: timelineHtml(pt.history.map((h) => ({
        icon: h.status === 'published' ? 'i-check-circle' : h.status === 'draft' ? 'i-pencil' : 'i-inbox',
        title: 'v' + h.version + ' · ' + h.note,
        tag: statusTag(h.status || 'archived'),
        ts: h.ts,
        body: '<span class="cell-mono">' + escapeHtml(h.actor) + '</span>' +
          (h.version === pt.version ? ' <span class="status-tag is-primary">当前版本</span>' :
            ' <button class="btn btn--sm" type="button" data-action="prompt.rollback" data-id="' + escapeHtml(pt.id) +
            '" data-version="' + h.version + '"' + guardAttr('prompt:write', PROMPT_WRITE_REASON) + '>' +
            icon('i-rollback') + '回滚到 v' + h.version + '</button>')
      })))
    }) +
      cardShell({
        title: '相关审计记录', icon: 'i-shield', desc: 'fork / 编辑 / 发布 / 回滚都进审计',
        body: auditTimeline(auditOf('/prompts/' + pt.id), '该模板还没有留下审计记录。')
      }) +
      noticeBar({
        kind: 'info', icon: 'i-info',
        html: '发布后同用途的旧版本自动转为归档；回滚不是删除历史，而是把某个历史版本重新置为发布态，回滚动作本身也记一条审计。'
      });
  }

  function promptDrawerBody(pt, tab) {
    if (tab === 'vars') return promptVarsTab(pt);
    if (tab === 'history') return promptHistoryTab(pt);
    return promptBodyTab(pt);
  }

  function promptDrawerFoot(pt) {
    const left = pt.status === 'draft'
      ? '<button class="btn btn--primary" type="button" data-action="prompt.edit" data-id="' + escapeHtml(pt.id) + '"' +
          guardAttr('prompt:write', PROMPT_WRITE_REASON) + '>' + icon('i-pencil') + '编辑草稿</button>' +
        '<button class="btn" type="button" data-action="prompt.publish" data-id="' + escapeHtml(pt.id) + '"' +
          guardAttr('prompt:write', PROMPT_WRITE_REASON) + '>' + icon('i-upload') + '发布 v' + pt.version + '</button>'
      : '<button class="btn btn--primary" type="button" data-action="prompt.fork" data-id="' + escapeHtml(pt.id) + '"' +
          guardAttr('prompt:write', PROMPT_WRITE_REASON) + '>' + icon('i-branch') + 'fork 出草稿</button>';
    return left +
      (pt.history.length > 1
        ? '<button class="btn" type="button" data-action="prompt.rollback" data-id="' + escapeHtml(pt.id) + '"' +
            guardAttr('prompt:write', PROMPT_WRITE_REASON) + '>' + icon('i-rollback') + '回滚</button>'
        : '<span class="status-tag is-muted">只有一个版本，无法回滚</span>') +
      '<span class="spacer"></span>' +
      '<button class="btn btn--ghost" type="button" data-action="nav.go" data-module="identities">' +
        icon('i-mask') + '去看 AI 身份</button>';
  }

  VIEWS.prompts = {
    scroll: 'list',
    drawerTabs: [
      { key: 'body', label: '模板正文', icon: 'i-scroll' },
      { key: 'vars', label: '变量清单', icon: 'i-hash' },
      { key: 'history', label: '版本历史', icon: 'i-history' }
    ],
    render(host) {
      mountList(host, 'prompts', {
        path: '/prompts',
        caption: 'Prompt 模板列表',
        pageSize: 8,
        skeletonRows: 6,
        columns: PROMPT_COLUMNS,
        filters(store) {
          const f = store.filters;
          return filterSearch('prompts', 'q', '搜索模板名称、ID、用途或变量', f.q) +
            PROMPT_STATUS_OPTIONS.map((o) =>
              filterChip('prompts', 'status', o[0], o[1], f.status === o[0],
                o[0] === 'all' ? store.items.length : store.items.filter((p) => p.status === o[0]).length)).join('') +
            '<span class="filter-summary">端点 GET ' + BASE + '/prompts</span>';
        },
        filter(items, f) {
          const q = (f.q || '').trim().toLowerCase();
          return items.filter((p) =>
            (f.status === 'all' || p.status === f.status) &&
            (!q || [p.name, p.id, p.purpose, p.vars.join(' '), p.body].join(' ').toLowerCase().indexOf(q) >= 0));
        },
        row: promptRow,
        empty(store) {
          const f = store.filters;
          if (f.q || f.status !== 'all') {
            return emptyState({
              icon: 'i-search', title: '没有匹配的模板',
              desc: '当前筛选条件是「' + escapeHtml(promptsFilterSummary(f)) + '」，没有命中的记录。',
              actions: '<button class="btn btn--ghost" type="button" data-action="filter.reset" data-key="prompts">' +
                icon('i-refresh') + '清空筛选</button>'
            });
          }
          return emptyState({
            icon: 'i-scroll', title: '还没有 Prompt 模板',
            desc: '模板是可变层，Identity 前置固定层不在这里维护。'
          });
        },
        footExtra(store) {
          const draft = store.items.filter((p) => p.status === 'draft').length;
          return '<span class="filter-summary">' + store.filtered + ' / ' + store.items.length + ' 条 · 草稿 ' +
            draft + ' 个</span>';
        }
      });
      host.insertAdjacentHTML('afterbegin', noticeBar({
        kind: 'info', icon: 'i-layers',
        html: '<strong>只有草稿可以编辑。</strong>已发布与已归档的版本是历史事实，想改必须先 fork 出草稿；' +
          '发布时同用途的旧版本自动转归档，变更说明必填并写入审计。'
      }));
    },
    renderDrawer(pt, tab, focusTab) {
      openDrawer({
        title: pt.name,
        icon: 'i-scroll',
        desc: '<span class="mono">' + escapeHtml(pt.id) + '</span> · ' + escapeHtml(pt.purpose) + ' · v' + pt.version,
        headExtra: statusTag(pt.status) + layerBadge(pt),
        lg: true,
        tabs: tabsHtml('drawer.tab', VIEWS.prompts.drawerTabs, tab, { label: 'Prompt 模板详情分区' }),
        body: promptDrawerBody(pt, tab),
        foot: promptDrawerFoot(pt),
        onMount: focusTab ? focusActiveTab : null
      });
    }
  };

  FORMS.promptFork = {
    title: 'fork 出草稿',
    icon: 'i-branch',
    desc: (ctx) => {
      const pt = findPrompt(ctx.id);
      return pt ? '源版本：<span class="mono">' + escapeHtml(pt.id) + '</span> · v' + pt.version + ' · ' +
        escapeHtml(STATUS_TEXT[pt.status] || pt.status) : '';
    },
    requires: 'prompt:write',
    reason: PROMPT_WRITE_REASON,
    submitText: 'fork 草稿',
    size: 'sm',
    body: (ctx) => {
      const pt = findPrompt(ctx.id);
      if (!pt) return noticeBar({ kind: 'danger', icon: 'i-alert', text: '模板已不存在，列表可能已经刷新。' });
      return '<div class="form-grid">' +
        fieldHtml({ name: 'from', label: '源模板', type: 'static', full: true, html: escapeHtml(pt.name) + ' <span class="cell-mono muted">v' + pt.version + '</span>' }) +
        fieldHtml({ name: 'next', label: '草稿版本', type: 'static', full: true, html: '<span class="cell-mono">v' + (pt.version + 1) + '</span> · 草稿不参与线上拼装' }) +
        fieldHtml({
          name: 'note', label: 'fork 说明', type: 'textarea', full: true, rows: 2, maxlength: 120, autofocus: true,
          placeholder: '例如：想收紧夜间主动关心的频率', value: '',
          hint: '留空则记为「从 v' + pt.version + ' fork 草稿」'
        }) +
        '</div>' +
        noticeBar({ kind: 'info', icon: 'i-info', html: 'fork 出来的草稿继承源版本正文与变量清单，改动只在草稿上发生，线上拼装不受影响。' });
    },
    validate(v, form, ctx) {
      const pt = findPrompt(ctx.id);
      if (!pt) return '模板已不存在，列表可能已经刷新。';
      if (pt.status === 'draft') return '409 · ' + pt.id + ' 已经是草稿，直接编辑即可';
      return null;
    },
    async run(v, ctx, busyEl) {
      const res = await runWrite({
        action: 'prompt.fork', method: 'POST', path: '/prompts', capability: 'prompt:write',
        target: 'Prompt ' + ctx.id + ' · fork v' + (findPrompt(ctx.id).version + 1),
        body: { fromId: ctx.id, note: (v.note || '').trim() }, reason: PROMPT_WRITE_REASON,
        busyEl: busyEl, successText: '已 fork 出草稿', refresh: () => refreshCurrent()
      });
      if (res && res.item) openDetail('prompts', res.item.id, 'body');
    }
  };

  FORMS.promptEdit = {
    title: '编辑草稿正文',
    icon: 'i-pencil',
    desc: (ctx) => {
      const pt = findPrompt(ctx.id);
      return pt ? '<span class="mono">' + escapeHtml(pt.id) + '</span> · v' + pt.version + ' · 草稿' : '';
    },
    requires: 'prompt:write',
    reason: PROMPT_WRITE_REASON,
    submitText: '保存草稿',
    size: 'lg',
    body: (ctx) => {
      const pt = findPrompt(ctx.id);
      if (!pt) return noticeBar({ kind: 'danger', icon: 'i-alert', text: '模板已不存在，列表可能已经刷新。' });
      return '<div class="form-grid">' +
        fieldHtml({
          name: 'body', label: '模板正文', type: 'textarea', full: true, rows: 14, mono: true, required: true,
          value: pt.body, autofocus: true,
          hint: '用 <span class="mono">{{变量名}}</span> 占位；以 <span class="mono">#</span> 开头的行会渲染成注释，也会原样发给 LLM'
        }) +
        fieldHtml({
          name: 'note', label: '变更说明', type: 'text', full: true, maxlength: 80,
          value: '', placeholder: '例如：把召回预算改成可配置变量'
        }) +
        '</div>' +
        noticeBar({
          kind: 'warn', icon: 'i-alert',
          html: '保存只改草稿，线上仍然拼装已发布版本。变量清单会在保存后按正文重新解析，删掉一个变量就等于删掉一段上下文。'
        });
    },
    validate(v, form, ctx) {
      const pt = findPrompt(ctx.id);
      if (!pt) return '模板已不存在，列表可能已经刷新。';
      if (pt.status !== 'draft') return '409 · 只有草稿可以编辑，' + (STATUS_TEXT[pt.status] || pt.status) + ' 版本请先 fork';
      if (!v.body || !v.body.trim()) return { field: 'body', msg: '模板正文不能为空' };
      return null;
    },
    async run(v, ctx, busyEl) {
      const res = await runWrite({
        action: 'prompt.update', method: 'PUT', path: '/prompts/' + ctx.id, capability: 'prompt:write',
        target: 'Prompt ' + ctx.id + ' · 草稿正文',
        body: { body: v.body, note: (v.note || '').trim() }, reason: PROMPT_WRITE_REASON,
        busyEl: busyEl, successText: '草稿已保存', refresh: () => refreshCurrent()
      });
      if (res && drawerCtx && drawerCtx.module === 'prompts' && drawerCtx.id === ctx.id) redrawDrawer('vars');
    }
  };

  FORMS.promptPublish = {
    title: '发布 Prompt 模板',
    icon: 'i-upload',
    desc: (ctx) => {
      const pt = findPrompt(ctx.id);
      return pt ? '<span class="mono">' + escapeHtml(pt.id) + '</span> · v' + pt.version + ' · ' +
        escapeHtml(pt.purpose) : '';
    },
    requires: 'prompt:write',
    reason: PROMPT_WRITE_REASON,
    submitText: '确认发布',
    body: (ctx) => {
      const pt = findPrompt(ctx.id);
      if (!pt) return noticeBar({ kind: 'danger', icon: 'i-alert', text: '模板已不存在，列表可能已经刷新。' });
      const prev = DB.prompts.filter((x) => x.id !== pt.id && x.purpose === pt.purpose && x.status === 'published');
      return '<div class="form-grid">' +
        fieldHtml({ name: 'layer', label: '所属层', type: 'static', html: escapeHtml(layerOf(pt)) }) +
        fieldHtml({
          name: 'replaces', label: '将取代', type: 'static',
          html: prev.length ? escapeHtml(prev[0].id) + ' <span class="cell-mono muted">v' + prev[0].version + ' → 归档</span>'
            : '<span class="muted">同用途当前没有发布版本</span>'
        }) +
        fieldHtml({
          name: 'vars', label: '识别到的变量', type: 'static', full: true,
          html: pt.vars.length
            ? pt.vars.map((v) => '<span class="chip-tag">{{' + escapeHtml(v) + '}}</span>').join(' ')
            : '<span class="muted">（空）服务端会返回 422</span>'
        }) +
        fieldHtml({
          name: 'note', label: '变更说明', type: 'textarea', full: true, rows: 3, required: true, maxlength: 120,
          autofocus: true, placeholder: '必填：这条说明会原样写入审计，是以后回滚的唯一依据'
        }) +
        '</div>' +
        noticeBar({
          kind: 'warn', icon: 'i-alert',
          html: '发布后<strong>下一次 LLM 调用就开始生效</strong>，进行中的轮次仍用旧版本。' +
            '发布动作与变更说明一起写入审计。'
        });
    },
    validate(v, form, ctx) {
      const pt = findPrompt(ctx.id);
      if (!pt) return '模板已不存在，列表可能已经刷新。';
      if (pt.status === 'published') return '409 · ' + pt.id + ' 已经是发布态';
      if (!pt.vars.length) return '422 · 模板里没有任何 {{变量}}，无法参与拼装';
      if (!v.note || !v.note.trim()) return { field: 'note', msg: '发布必须填写变更说明，说明会写入审计' };
      return null;
    },
    async run(v, ctx, busyEl) {
      const res = await runWrite({
        action: 'prompt.publish', method: 'POST', path: '/prompts/' + ctx.id + '/publish', capability: 'prompt:write',
        target: 'Prompt ' + ctx.id + ' · v' + findPrompt(ctx.id).version + ' · ' + v.note.trim().slice(0, 40),
        body: { note: v.note.trim() }, reason: PROMPT_WRITE_REASON,
        busyEl: busyEl, successText: '已发布，下一次 LLM 调用生效', refresh: () => refreshCurrent()
      });
      if (res && drawerCtx && drawerCtx.module === 'prompts' && drawerCtx.id === ctx.id) redrawDrawer('history');
    }
  };

  FORMS.promptRollback = {
    title: '回滚到历史版本',
    icon: 'i-rollback',
    desc: (ctx) => {
      const pt = findPrompt(ctx.id);
      return pt ? '<span class="mono">' + escapeHtml(pt.id) + '</span> · 当前 v' + pt.version : '';
    },
    requires: 'prompt:write',
    reason: PROMPT_WRITE_REASON,
    submitText: '确认回滚',
    size: 'sm',
    danger: true,
    body: (ctx) => {
      const pt = findPrompt(ctx.id);
      if (!pt) return noticeBar({ kind: 'danger', icon: 'i-alert', text: '模板已不存在，列表可能已经刷新。' });
      const options = pt.history.map((h) => [String(h.version), 'v' + h.version + ' · ' + h.note]);
      return '<div class="form-grid">' +
        fieldHtml({
          name: 'version', label: '目标版本', type: 'select', full: true, options: options,
          value: ctx.version ? String(ctx.version) : options[options.length - 1][0],
          hint: '回滚会把该版本重新置为发布态，同用途的其它发布版本转为归档'
        }) +
        '</div>' +
        noticeBar({
          kind: 'danger', icon: 'i-alert',
          html: '回滚立即影响线上拼装。历史不会被删除，回滚动作本身也会写入审计，包含操作者、角色与源版本。'
        });
    },
    validate(v, form, ctx) {
      const pt = findPrompt(ctx.id);
      if (!pt) return '模板已不存在，列表可能已经刷新。';
      if (!pt.history.some((h) => String(h.version) === String(v.version))) {
        return { field: 'version', msg: 'v' + v.version + ' 不在该模板的版本历史中' };
      }
      if (Number(v.version) === pt.version && pt.status === 'published') {
        return '409 · 当前已经是 v' + pt.version + ' 的发布态';
      }
      return null;
    },
    async run(v, ctx, busyEl) {
      const pt = findPrompt(ctx.id);
      const res = await runWrite({
        action: 'prompt.rollback', method: 'POST', path: '/prompts/' + ctx.id + '/rollback', capability: 'prompt:write',
        target: 'Prompt ' + ctx.id + ' · v' + pt.version + ' → v' + v.version,
        body: { version: Number(v.version) }, reason: PROMPT_WRITE_REASON,
        busyEl: busyEl, successText: '已回滚到 v' + v.version, refresh: () => refreshCurrent()
      });
      if (res && drawerCtx && drawerCtx.module === 'prompts' && drawerCtx.id === ctx.id) redrawDrawer('history');
    }
  };

  /* ==========================================================
     11.8 · 功能开关与灰度
     四个维度（百分比 / 白名单 / 平台 / 环境）同时满足才命中。
     延后项开关的存在本身不等于 Phase 1 对外开放，这一点在列表、抽屉、toast 三处都要说清楚。
     ========================================================== */

  const FLAG_WRITE_REASON = '功能开关会直接改变 Agent 运行时行为，仅系统管理员可写';
  const PLATFORM_OPTIONS = [['android', 'Android'], ['ios', 'iOS'], ['desktop', '桌面端']];
  const ENV_OPTIONS = [['dev', '开发'], ['staging', '预发'], ['prod', '生产']];
  const FLAG_SCOPE_OPTIONS = [
    ['all', '全部开关'], ['on', '已开启'], ['off', '已关闭'], ['deferred', 'Phase 1 内延后']
  ];
  const FLAG_COLUMNS = [
    { label: '功能开关' },
    { label: '开关', width: '66px' },
    { label: '灰度比例', width: '136px' },
    { label: '生效平台', width: '148px', cls: 'col-optional' },
    { label: '环境', width: '132px', cls: 'col-optional' },
    { label: '能力标识', width: '140px', cls: 'col-optional cell-mono' },
    { label: '最近更新', width: '100px', cls: 'cell-mono' },
    { label: '操作', width: '68px', cls: 'cell-actions' }
  ];

  const flagPlatformText = (p) => PLATFORM_TEXT[p] || p;
  const flagEnvText = (e) => ENV_TEXT[e] || e;
  const flagIcon = (f) => (f.deferred ? 'i-clock' : 'i-toggle');

  function flagScope(f) {
    if (f.deferred) return 'deferred';
    return f.enabled ? 'on' : 'off';
  }

  function flagsFilterSummary(f) {
    const parts = [];
    if (f.q) parts.push('关键字「' + f.q + '」');
    const scope = FLAG_SCOPE_OPTIONS.filter((o) => o[0] === f.scope)[0];
    if (scope && scope[0] !== 'all') parts.push(scope[1]);
    return parts.join(' · ') || '全部开关';
  }

  function flagSwitch(f) {
    return '<button class="switch" type="button" role="switch" aria-checked="' + (f.enabled ? 'true' : 'false') + '"' +
      ' aria-label="' + escapeHtml(f.name) + '（' + escapeHtml(f.key) + '）开关"' +
      ' data-action="flag.toggle" data-id="' + escapeHtml(f.key) + '"' +
      guardAttr('flag:write', FLAG_WRITE_REASON) + '><span class="switch-knob"></span></button>';
  }

  function flagPercentCell(f) {
    return '<span class="quota-cell">' + progressHtml(f.rule.percent, 100, f.key + ' 的灰度比例') +
      '<span class="progress-label">' + f.rule.percent + '% · 白名单 ' + f.rule.whitelist.length + ' 人</span></span>';
  }

  function flagRow(f) {
    return '<tr>' +
      td('<span class="cell-id"><span class="cell-avatar">' + icon(flagIcon(f)) + '</span>' +
        '<span class="cell-id-copy">' + rowOpen('flags', f.key, f.name) +
        '<span>' + escapeHtml(f.key) + '</span></span></span>',
        '', f.name + '（' + f.key + '）') +
      td(flagSwitch(f)) +
      td(flagPercentCell(f)) +
      td(chipRow(f.rule.platforms.map(flagPlatformText), 'is-info'), 'col-optional',
        '生效平台：' + (f.rule.platforms.map(flagPlatformText).join('、') || '（空）')) +
      td(chipRow(f.rule.envs.map(flagEnvText), 'is-muted'), 'col-optional',
        '生效环境：' + (f.rule.envs.map(flagEnvText).join('、') || '（空）')) +
      td('<span class="cell-mono ellipsis">' + escapeHtml(f.capability) + '</span>', 'col-optional',
        '写入该开关需要能力 ' + f.capability) +
      td(timeAgo(f.updatedAt), 'cell-mono', formatDateTime(f.updatedAt) + ' · ' + f.updatedBy) +
      td(rowActions([
        iconAction('flag.edit', 'i-sliders', '编辑灰度规则', ' data-id="' + escapeHtml(f.key) + '"',
          'flag:write', FLAG_WRITE_REASON)
      ]), 'cell-actions') +
    '</tr>';
  }

  /* ---- 命中预览：纯函数，输入 userId + 平台 + 环境，输出判定过程 ----
     百分比按 hashStr(key + ':' + userId) 稳定分桶，同一个用户每次结果一致，走查可复现。 */
  function flagHit(f, userId, platform, env) {
    const id = String(userId || '').trim();
    const plat = PLATFORM_TEXT[platform] ? platform : 'android';
    const en = ENV_TEXT[env] ? env : 'prod';
    if (!id) {
      return {
        hit: false, text: '输入一个用户 ID 开始预览',
        steps: ['百分比按 userId 稳定分桶，白名单按 userId 精确匹配，所以命中预览必须落到具体的用户上。']
      };
    }
    const u = findUser(id);
    if (!u) {
      return {
        hit: false, text: '无法判定 · ' + id + ' 不是已登记的用户',
        steps: ['灰度判定只发生在已登记的用户上；' + id + ' 不在 GET ' + BASE + '/users 的返回里。']
      };
    }
    const steps = [];
    let hit = true;
    steps.push('① 开关状态：' + (f.enabled
      ? '已开启，继续评估灰度规则'
      : '已关闭，后面三个维度不再评估'));
    if (!f.enabled) hit = false;

    const envIn = f.rule.envs.indexOf(en) >= 0;
    steps.push('② 环境：' + flagEnvText(en) + (envIn ? ' 在生效范围内' : ' 不在生效范围内'));
    if (!envIn) hit = false;

    const platIn = f.rule.platforms.indexOf(plat) >= 0;
    steps.push('③ 平台：' + flagPlatformText(plat) + (platIn ? ' 在生效范围内' : ' 不在生效范围内'));
    if (!platIn) hit = false;

    const whitelisted = f.rule.whitelist.indexOf(id) >= 0;
    steps.push('④ 白名单：' + (whitelisted
      ? '命中，' + userName(id) + ' 在名单内，跳过百分比分桶'
      : '未命中，需要走百分比分桶'));

    const bucket = hashStr(f.key + ':' + id) % 100;
    const byPercent = bucket < f.rule.percent;
    steps.push('⑤ 百分比分桶：' + f.key + ':' + id + ' → 桶 ' + bucket +
      '，灰度比例 ' + f.rule.percent + '%' + (byPercent ? '，命中' : '，未命中'));
    if (!whitelisted && !byPercent) hit = false;

    return {
      hit: hit,
      text: (hit ? '命中 · ' : '不命中 · ') + userName(id) + '（' + id + '）' +
        (hit ? '会启用' : '不会启用') + '「' + f.name + '」',
      steps: steps
    };
  }

  function hitResultHtml(r) {
    return '<div class="hit-result">' + icon(r.hit ? 'i-check-circle' : 'i-ban') +
      '<span>' + escapeHtml(r.text) + '</span><span class="spacer"></span>' +
      (r.hit ? statusTag('published', '命中') : statusTag('archived', '不命中')) + '</div>' +
      '<div class="hit-reason">' + r.steps.map((s) => escapeHtml(s)).join('<br>') + '</div>';
  }

  function previewFlagHit(key) {
    const f = findFlag(key);
    const box = $('[data-hit-result]');
    if (!f || !box) return;
    const user = $('#flag-hit-user');
    const plat = $('#flag-hit-platform');
    const env = $('#flag-hit-env');
    box.innerHTML = hitResultHtml(flagHit(f, user ? user.value : '', plat ? plat.value : '', env ? env.value : ''));
  }

  function flagRuleTab(f) {
    return (f.deferred
      ? noticeBar({
          kind: 'deferred', icon: 'i-clock',
          html: '<strong>' + escapeHtml(f.name) + '属 Phase 1 内延后项。</strong>' + escapeHtml(f.deferredNote) +
            '这里的规则可以先配好，但客户端不会读到它——开关存在不等于功能对外开放。'
        })
      : '') +
      cardShell({
        title: '灰度规则编辑器', icon: 'i-sliders',
        desc: '四个维度全部满足才命中',
        body: '<form class="rule-editor" id="flag-rule-form" novalidate>' +
          fieldHtml({
            type: 'switch', name: 'enabled', label: '开关状态', value: f.enabled,
            onText: '已开启', offText: '已关闭',
            hint: '关闭时保留规则定义，重新开启不需要重配。'
          }) +
          fieldHtml({
            type: 'slider', name: 'percent', label: '灰度比例', value: f.rule.percent, full: true,
            hint: '按 <span class="mono">hash(key + ":" + userId) % 100</span> 稳定分桶，同一个用户的命中结果不会随请求变化。'
          }) +
          chipsInput('whitelist', '白名单用户', f.rule.whitelist, '输入用户 ID 后回车',
            '白名单内的用户跳过百分比分桶，始终命中；用于内部账号与定向验证。') +
          checkGroup('platforms', '生效平台', PLATFORM_OPTIONS, f.rule.platforms,
            '平台由客户端上报，后台无法从 userId 推出；未勾选的平台一律不命中。') +
          checkGroup('envs', '生效环境', ENV_OPTIONS, f.rule.envs,
            '环境隔离用来保证生产不被开发中的规则影响。') +
          fieldHtml({
            type: 'static', name: 'capability', label: '写入所需能力', full: true,
            html: '<span class="cell-mono">' + escapeHtml(f.capability) + '</span>' +
              '<span class="muted"> · 本页的写操作统一要求 </span><span class="cell-mono">flag:write</span>' +
              '<span class="muted">，Admin API 在服务端会再校验一次</span>'
          }) +
        '</form>'
      }) +
      cardShell({
        title: '当前生效范围', icon: 'i-target',
        desc: '保存前的实际值',
        body: kvList([
          ['开关', f.enabled ? statusTag('active', '已开启') : statusTag('ended', '已关闭')],
          ['灰度比例', escapeHtml(f.rule.percent + '%')],
          ['白名单', f.rule.whitelist.length
            ? chipRow(f.rule.whitelist.map((v) => userName(v) + '（' + v + '）'), 'is-primary')
            : '<span class="muted">（空）</span>'],
          ['生效平台', chipRow(f.rule.platforms.map(flagPlatformText), 'is-info')],
          ['生效环境', chipRow(f.rule.envs.map(flagEnvText), 'is-muted')],
          ['最近更新', '<span class="cell-mono">' + escapeHtml(formatDateTime(f.updatedAt)) + '</span>'],
          ['更新人', escapeHtml(f.updatedBy)]
        ], { dense: true })
      });
  }

  function flagHitTab(f) {
    const first = f.rule.whitelist[0] || (DB.users[0] ? DB.users[0].id : '');
    const initial = flagHit(f, first, 'android', f.rule.envs.indexOf('prod') >= 0 ? 'prod' : f.rule.envs[0]);
    return cardShell({
      title: '命中预览', icon: 'i-target',
      desc: '只读推演，不写审计',
      body: '<div class="hit-preview">' +
        '<div class="field-inline">' +
          '<input class="field-ctl" id="flag-hit-user" type="text" value="' + escapeHtml(first) + '"' +
            ' placeholder="用户 ID，例如 u_1042" aria-label="用于命中预览的用户 ID" autocomplete="off">' +
          '<button class="btn btn--ghost" type="button" data-action="flag.hit" data-id="' + escapeHtml(f.key) + '">' +
            icon('i-play') + '计算命中</button>' +
        '</div>' +
        '<div class="field-inline">' +
          '<select class="field-ctl" id="flag-hit-platform" aria-label="用于命中预览的客户端平台">' +
            PLATFORM_OPTIONS.map((o) => '<option value="' + o[0] + '"' + (o[0] === 'android' ? ' selected' : '') +
              '>' + escapeHtml(o[1]) + '</option>').join('') + '</select>' +
          '<select class="field-ctl" id="flag-hit-env" aria-label="用于命中预览的环境">' +
            ENV_OPTIONS.map((o) => '<option value="' + o[0] + '"' +
              (o[0] === (f.rule.envs.indexOf('prod') >= 0 ? 'prod' : f.rule.envs[0]) ? ' selected' : '') + '>' +
              escapeHtml(o[1]) + '</option>').join('') + '</select>' +
        '</div>' +
        '<div data-hit-result>' + hitResultHtml(initial) + '</div>' +
      '</div>'
    }) +
    cardShell({
      title: '判定顺序', icon: 'i-layers',
      desc: 'AgentService 侧的真实顺序',
      body: timelineHtml([
        { title: '开关状态', icon: 'i-toggle', body: '关闭即短路，后面三个维度都不评估。' },
        { title: '环境', icon: 'i-branch', body: '客户端上报的环境必须在 <span class="mono">envs</span> 里。' },
        { title: '平台', icon: 'i-grid', body: '客户端上报的平台必须在 <span class="mono">platforms</span> 里。' },
        { title: '白名单', icon: 'i-users', body: '命中即通过，跳过百分比分桶。' },
        { title: '百分比分桶', icon: 'i-percent', body: '稳定哈希，结果不随请求变化，也不随重启变化。' }
      ]) +
      noticeBar({
        kind: 'info', icon: 'i-info',
        html: '命中预览是纯前端推演，不发请求、不写审计。真实判定发生在 AgentService 内，' +
          '后台只负责把规则写下去。'
      })
    });
  }

  function flagHistoryTab(f) {
    return cardShell({
      title: '规则变更历史', icon: 'i-history',
      desc: f.history.length + ' 条',
      body: timelineHtml(f.history.map((h) => ({
        title: h.note, icon: 'i-pencil', ts: h.ts,
        body: '<span class="muted">' + escapeHtml(h.actor) + '</span>'
      })))
    }) +
    cardShell({
      title: '相关审计记录', icon: 'i-shield',
      desc: '来自 Admin API 审计',
      body: auditTimeline(auditOf(f.key), '该开关还没有留下审计记录；改一次规则或拨一次开关就会出现。')
    }) +
    noticeBar({
      kind: 'info', icon: 'i-shield',
      html: '历史与审计是两条线：<strong>历史</strong>记录规则字段怎么变，<strong>审计</strong>记录谁在什么时候' +
        '调了哪个端点、结果是被允许还是被拒绝。越权调用同样会留下 <span class="mono">result: denied</span> 的记录。'
    });
  }

  function flagDrawerBody(f, tab) {
    if (tab === 'hit') return flagHitTab(f);
    if (tab === 'history') return flagHistoryTab(f);
    return flagRuleTab(f);
  }

  function flagDrawerFoot(f, tab) {
    if (tab === 'hit') {
      return '<span class="status-tag is-muted">只读推演 · 不写审计</span><span class="spacer"></span>' +
        '<button class="btn btn--ghost" type="button" data-action="drawer.tab" data-tab="rule">' +
        icon('i-sliders') + '去改规则</button>';
    }
    if (tab === 'history') {
      return '<span class="status-tag is-muted">历史只读</span><span class="spacer"></span>' +
        '<button class="btn btn--ghost" type="button" data-action="layer.close" data-kind="drawer">关闭</button>';
    }
    return '<button class="btn btn--primary" type="button" data-action="flag.save" data-id="' +
        escapeHtml(f.key) + '"' + guardAttr('flag:write', FLAG_WRITE_REASON) + '>' +
        icon('i-save') + '保存规则</button>' +
      '<button class="btn btn--ghost" type="button" data-action="drawer.tab" data-tab="rule" title="丢弃未保存的修改，按当前值重画">' +
        icon('i-refresh') + '放弃修改</button>' +
      '<span class="spacer"></span>' +
      (f.deferred ? deferredTag('Phase 1 内延后') : '');
  }

  VIEWS.flags = {
    scroll: 'list',
    drawerTabs: [
      { key: 'rule', label: '灰度规则', icon: 'i-sliders' },
      { key: 'hit', label: '命中预览', icon: 'i-target' },
      { key: 'history', label: '变更历史', icon: 'i-history' }
    ],
    render(host) {
      mountList(host, 'flags', {
        path: '/flags',
        caption: '功能开关列表',
        pageSize: 10,
        skeletonRows: 6,
        columns: FLAG_COLUMNS,
        filters(store) {
          const f = store.filters;
          return filterSearch('flags', 'q', '搜索开关名称、key 或说明', f.q) +
            FLAG_SCOPE_OPTIONS.map((o) => filterChip('flags', 'scope', o[0], o[1], f.scope === o[0],
              o[0] === 'all' ? store.items.length : store.items.filter((x) => flagScope(x) === o[0]).length)).join('') +
            '<span class="filter-summary">端点 GET ' + BASE + '/flags · PUT ' + BASE + '/flags/{key}</span>';
        },
        filter(items, f) {
          const q = (f.q || '').trim().toLowerCase();
          return items.filter((x) =>
            (f.scope === 'all' || flagScope(x) === f.scope) &&
            (!q || [x.key, x.name, x.deferredNote].join(' ').toLowerCase().indexOf(q) >= 0));
        },
        row: flagRow,
        empty(store) {
          const f = store.filters;
          if (f.q || f.scope !== 'all') {
            return emptyState({
              icon: 'i-search', title: '没有匹配的开关',
              desc: '当前筛选条件是「' + escapeHtml(flagsFilterSummary(f)) + '」，没有命中的记录。',
              actions: '<button class="btn btn--ghost" type="button" data-action="filter.reset" data-key="flags">' +
                icon('i-refresh') + '清空筛选</button>'
            });
          }
          return emptyState({ icon: 'i-toggle', title: '还没有功能开关', desc: '开关由服务端定义，后台只负责配置灰度规则。' });
        },
        footExtra(store) {
          const on = store.items.filter((x) => x.enabled).length;
          const deferred = store.items.filter((x) => x.deferred).length;
          return '<span class="filter-summary">' + store.filtered + ' / ' + store.items.length +
            ' 条 · 已开启 ' + on + ' · 延后项 ' + deferred + '</span>';
        }
      });
      host.insertAdjacentHTML('afterbegin', noticeBar({
        kind: 'deferred', icon: 'i-clock',
        html: '<strong>开关存在 ≠ Phase 1 开放。</strong>标着「延后」的开关（用户自助创建 Agent、用户侧配额门、' +
          '记忆固化与衰减、主动通知、观察类主动行为）可以先配好规则，但客户端在 Phase 1 内不会读到它们；' +
          '把它们拨到开启也不等于功能上线。'
      }));
    },
    renderDrawer(f, tab, focusTab) {
      openDrawer({
        title: f.name,
        icon: flagIcon(f),
        desc: '<span class="mono">' + escapeHtml(f.key) + '</span> · 灰度 ' + f.rule.percent + '% · 白名单 ' +
          f.rule.whitelist.length + ' 人',
        headExtra: (f.enabled ? statusTag('active', '已开启') : statusTag('ended', '已关闭')) +
          (f.deferred ? deferredTag('Phase 1 内延后') : ''),
        tabs: tabsHtml('drawer.tab', VIEWS.flags.drawerTabs, tab, { label: '功能开关详情分区' }),
        body: flagDrawerBody(f, tab),
        foot: flagDrawerFoot(f, tab),
        onMount(root) {
          if (focusTab) focusActiveTab(root);
          const form = $('#flag-rule-form', root);
          if (form) form.addEventListener('submit', (e) => e.preventDefault());
        }
      });
    }
  };

  async function toggleFlag(key, next, busyEl) {
    const f = findFlag(key);
    if (!f) return;
    await runWrite({
      action: 'flag.update', method: 'PUT', path: '/flags/' + encodeURIComponent(key), capability: 'flag:write',
      target: '功能开关 ' + key, body: { enabled: next }, reason: FLAG_WRITE_REASON, busyEl: busyEl,
      closeModal: false,
      successText: f.name + ' 已' + (next ? '开启' : '关闭') +
        (f.deferred ? '；该开关属 Phase 1 内延后项，开启不等于功能对外开放' : ''),
      refresh: () => afterWrite('flags')
    });
  }

  async function saveFlagRule(key, busyEl) {
    const f = findFlag(key);
    const form = $('#flag-rule-form');
    if (!f || !form) return;
    clearFieldErrors(form);
    const v = readForm(form);
    const whitelist = splitChips(v.whitelist);
    const unknown = whitelist.filter((x) => !findUser(x));
    if (unknown.length) {
      setFieldError(form, 'whitelist', unknown.join('、') + ' 不是已登记的用户 ID');
      toast('白名单里有未登记的用户 ID，已阻止提交', 'error');
      return;
    }
    await runWrite({
      action: 'flag.update', method: 'PUT', path: '/flags/' + encodeURIComponent(key), capability: 'flag:write',
      target: '功能开关 ' + key,
      body: {
        enabled: !!v.enabled,
        rule: {
          percent: clampPct(v.percent),
          whitelist: whitelist,
          platforms: Array.isArray(v.platforms) ? v.platforms : [],
          envs: Array.isArray(v.envs) ? v.envs : []
        }
      },
      reason: FLAG_WRITE_REASON, busyEl: busyEl, closeModal: false, successText: null,
      refresh: () => afterWrite('flags')
    });
  }

  /* ==========================================================
     11.9 · Agent 运行时
     实时流面板的外壳 runtime 与 logs 两页共用；data-* 钩子是 paintStreamState 唯一认识的东西。
     ========================================================== */

  const STREAM_LEVEL_OPTIONS = [
    ['all', '全部级别'], ['error', 'error'], ['warn', 'warn'], ['info', 'info'], ['debug', 'debug']
  ];
  const RUNTIME_RESIDENT_OPTIONS = [
    ['all', '全部 Agent'], ['resident', '常驻内存'], ['cold', '未常驻（按需加载）']
  ];
  const RUNTIME_COLUMNS = [
    { label: 'Agent 实例' },
    { label: 'State 常驻', width: '82px' },
    { label: 'Working Buffer', width: '128px' },
    { label: 'versionSeq', width: '96px', cls: 'col-optional cell-num' },
    { label: 'Reactive', width: '96px', cls: 'col-optional cell-num' },
    { label: 'Proactive', width: '96px', cls: 'col-optional cell-num' },
    { label: '平均延迟', width: '88px', cls: 'cell-num' },
    { label: '淘汰检查', width: '104px', cls: 'col-optional cell-mono' },
    { label: '操作', width: '86px', cls: 'cell-actions' }
  ];

  function consoleShell(cfg) {
    const key = cfg.key;
    return '<section class="console-pane' + (cfg.cls ? ' ' + cfg.cls : '') + '" data-stream-pane="' + key + '">' +
      '<div class="console-toolbar">' +
        '<span class="stream-state is-connecting" data-stream-state="' + key + '"></span>' +
        '<span class="cell-mono muted">' + escapeHtml(cfg.endpoint) + '</span>' +
        '<span class="spacer"></span>' +
        '<span class="filter-summary" data-stream-count="' + key + '">0 条</span>' +
        '<select class="filter-select" data-action="stream.level" data-stream="' + key + '" aria-label="级别筛选">' +
          STREAM_LEVEL_OPTIONS.map((o) => '<option value="' + o[0] + '">' + escapeHtml(o[1]) + '</option>').join('') +
        '</select>' +
        '<button class="icon-btn is-on" type="button" data-action="stream.autoscroll" data-stream="' + key + '"' +
          ' aria-pressed="true" aria-label="自动滚到底部" title="自动滚到底部">' + icon('i-scroll-bottom') + '</button>' +
        '<button class="btn btn--sm btn--ghost" type="button" data-action="stream.toggle" data-stream="' + key + '"' +
          ' data-stream-toggle="' + key + '" aria-pressed="false" aria-label="暂停实时推送">' +
          icon('i-pause') + '<span>暂停</span></button>' +
        '<button class="btn btn--sm btn--ghost" type="button" data-action="stream.clear" data-stream="' + key + '"' +
          ' aria-label="清空已收到的推送" title="清空">' + icon('i-trash') + '<span>清空</span></button>' +
        '<button class="btn btn--sm btn--ghost" type="button" data-action="stream.disconnect" data-stream="' + key + '"' +
          ' aria-label="注入一次断线，演示指数退避重连" title="注入断线">' +
          icon('i-wifi-off') + '<span>注入断线</span></button>' +
      '</div>' +
      '<div class="conn-banner" data-conn-banner="' + key + '" role="status"></div>' +
      '<div class="console-body" data-stream-body="' + key + '" role="log" aria-live="polite" tabindex="0"' +
        ' aria-label="' + escapeHtml(cfg.label) + '"></div>' +
    '</section>';
  }

  function runtimeStats() {
    const rows = DB.runtime;
    const rpm = rows.reduce((a, r) => a + r.reactive.rpm, 0);
    const tick = rows.reduce((a, r) => a + r.proactive.tickPerMin, 0);
    const avg = rows.length ? Math.round(rows.reduce((a, r) => a + r.reactive.avgLatencyMs, 0) / rows.length) : 0;
    return [
      statCard({
        label: '常驻 Agent 实例', value: String(rows.length),
        foot: '全库 ' + DB.agents.length + ' 个 Agent，其余按需从 State 快照恢复'
      }),
      statCard({ label: 'Reactive 每分钟轮次', value: String(rpm), foot: '由客户端事件驱动，同步等待产出' }),
      statCard({
        label: 'Proactive tick / 分钟', value: String(tick),
        foot: '固定节拍轮询，命中去抖窗口就放弃'
      }),
      statCard({
        label: '平均响应延迟', value: avg + '<span class="muted">ms</span>', alert: avg > 1200,
        foot: avg > 1200 ? '高于 1200ms 阈值，先查模型供应商' : '首字节到产出结束的均值'
      })
    ].join('');
  }

  /* 推送内容按 seq 轮转七种典型事件；数值走确定性伪随机，注入的结果可复现 */
  function runtimeLine(st, seq) {
    const pool = DB.runtime.length ? DB.runtime : [{ agentId: 'ag_2201', agentName: '绫音', stateVersion: 1842, bufferUsage: 4 }];
    const r = pool[seq % pool.length];
    const n = seq % 7;
    const ts = Date.now();
    if (n === 0) return { ts: ts, level: 'debug', msg: '[Reactive] ' + r.agentId + ' 收到客户端事件，开始按固定顺序拼装 8 层 Prompt' };
    if (n === 1) return { ts: ts, level: 'info', msg: '[Reactive] ' + r.agentId + ' 轮次完成 · AgentAction(speak) · ' + randInt('rt' + seq, 480, 1650) + 'ms · ' + randInt('tk' + seq, 320, 1480) + ' tokens' };
    if (n === 2) return { ts: ts, level: 'debug', msg: '[Proactive] ' + r.agentId + ' tick · 评估 Circadian / Loneliness / Energy，本轮不产出意图' };
    if (n === 3) return { ts: ts, level: 'info', msg: '[State] ' + r.agentId + ' 常驻内存 · versionSeq=' + (r.stateVersion + seq) + ' · Buffer ' + r.bufferUsage + '/8' };
    if (n === 4) return { ts: ts, level: 'warn', msg: '[Proactive] ' + r.agentId + ' 命中去抖窗口（' + randInt('db' + seq, 3, 20) + ' 分钟内已主动过），本次让位' };
    if (n === 5) return { ts: ts, level: 'warn', msg: '[Runtime] State 常驻容量接近上限，按最近使用列出淘汰候选：' + r.agentId };
    return { ts: ts, level: 'error', msg: '[Reactive] ' + r.agentId + ' 上游首字节超时 30000ms，本轮降级为兜底回复' };
  }

  function runtimeRow(r) {
    return '<tr>' +
      td('<span class="cell-id"><span class="cell-avatar">' + icon('i-agent') + '</span>' +
        '<span class="cell-id-copy">' + rowOpen('runtime', r.agentId, r.agentName) +
        '<span>' + escapeHtml(r.agentId + ' · ' + r.ownerName) + '</span></span></span>',
        '', r.agentName + '（' + r.agentId + '）') +
      td(r.resident ? statusTag('active', '常驻') : statusTag('ended', '未常驻')) +
      td('<span class="quota-cell">' + progressHtml(r.bufferUsage, 8, 'Working Memory Buffer 占用') +
        '<span class="progress-label">' + r.bufferUsage + ' / 8 槽</span></span>') +
      td(String(r.stateVersion), 'col-optional cell-num', 'State 快照的 versionSeq') +
      td(r.reactive.rpm + '/min', 'col-optional cell-num', '最近 24 小时 ' + r.reactive.turns24h + ' 轮') +
      td(r.proactive.tickPerMin + '/min', 'col-optional cell-num',
        '最近 24 小时触发 ' + r.proactive.fired24h + ' 次 · 去抖 ' + r.proactive.debounceHits + ' 次 · 让位 ' + r.proactive.yieldEvents + ' 次') +
      td(r.reactive.avgLatencyMs + 'ms', 'cell-num') +
      td(timeAgo(r.lastEvictionCheck), 'col-optional cell-mono',
        '最近一次淘汰检查 ' + formatDateTime(r.lastEvictionCheck) + ' · 常驻起点 ' + formatDateTime(r.sinceTs)) +
      td(rowActions([
        iconAction('nav.go', 'i-agent', '打开该 Agent 实例', ' data-module="agents" data-id="' + r.agentId + '"'),
        iconAction('nav.go', 'i-messages', '去看 Session 列表', ' data-module="sessions"')
      ]), 'cell-actions') +
    '</tr>';
  }

  function runtimeLoopsTab(r) {
    return '<div class="loop-pair">' +
      '<div class="loop-card"><h4>' + icon('i-messages') + 'Reactive Loop</h4>' +
        '<p>由客户端事件驱动：用户输入到达 → 按固定顺序拼装 8 层 Prompt → LLM 产出 AgentAction → 同步回给客户端。' +
        '一次事件对应一个轮次，不做定时轮询。</p></div>' +
      '<div class="loop-card"><h4>' + icon('i-clock') + 'Proactive Loop</h4>' +
        '<p>固定节拍 tick：读 Agent State 与 CircadianPhase 评估是否要主动，命中去抖窗口就放弃；' +
        '输出期间一旦收到用户输入立即让位，并取消进行中的合成。</p></div>' +
    '</div>' +
    cardShell({
      title: '两个 Loop 的实测指标', icon: 'i-activity', desc: r.agentId,
      body: kvList([
        ['Reactive 轮次', escapeHtml(r.reactive.rpm + ' / 分钟 · 最近 24 小时 ' + r.reactive.turns24h + ' 轮')],
        ['Reactive 延迟', escapeHtml('平均 ' + r.reactive.avgLatencyMs + 'ms')],
        ['Proactive tick', escapeHtml(r.proactive.tickPerMin + ' / 分钟 · 最近 24 小时触发 ' + r.proactive.fired24h + ' 次')],
        ['去抖命中', escapeHtml(r.proactive.debounceHits + ' 次')],
        ['让位事件', escapeHtml(r.proactive.yieldEvents + ' 次')],
        ['触发 Loop 的 Session', navLink('sessions', '', '去 Session 列表', '查看该 Agent 的 Session')]
      ], { dense: true })
    }) +
    noticeBar({
      kind: 'info', icon: 'i-layers',
      html: '两个 Loop <strong>共用同一个 Agent、同一份 State 和同一个 Working Memory Buffer</strong>，' +
        '区别只在触发方式。Agent State 由系统规则维护，LLM 只读不写。'
    });
  }

  function runtimeDecisionsTab(r) {
    return cardShell({
      title: '最近决策', icon: 'i-target', desc: r.decisions.length + ' 条',
      body: timelineHtml(r.decisions.map((d) => ({
        title: d.loop + ' Loop', icon: d.loop === 'Proactive' ? 'i-clock' : 'i-messages', ts: d.ts,
        tag: d.loop === 'Proactive' ? statusTag('primary', 'Proactive') : statusTag('info', 'Reactive'),
        body: escapeHtml(d.text)
      })))
    }) +
    '<div class="stat-grid">' +
      statCard({ label: '去抖命中', value: String(r.proactive.debounceHits), foot: '短时间内已经主动过，本次放弃' }) +
      statCard({ label: '让位事件', value: String(r.proactive.yieldEvents), foot: '输出期间收到用户输入，立即停下' }) +
      statCard({ label: 'Proactive 触发', value: String(r.proactive.fired24h), foot: '最近 24 小时实际产出的主动行为' }) +
    '</div>' +
    noticeBar({
      kind: 'info', icon: 'i-ban',
      html: '去抖与让位是「不打扰」的两道闸：<strong>去抖</strong>拦住频率过高的主动关心，' +
        '<strong>让位</strong>保证用户一开口就立刻拿到话语权。两者都只由系统规则判定，不交给 LLM 决定。'
    });
  }

  function runtimeStateTab(r) {
    return cardShell({
      title: 'State 常驻与淘汰', icon: 'i-database', desc: '按 Agent 维度常驻',
      body: kvList([
        ['Agent 实例', navLink('agents', r.agentId, r.agentName + '（' + r.agentId + '）')],
        ['归属用户', escapeHtml(r.ownerName)],
        ['常驻状态', r.resident ? statusTag('active', '常驻内存') : statusTag('ended', '未常驻')],
        ['常驻起点', '<span class="cell-mono">' + escapeHtml(formatDateTime(r.sinceTs)) + '</span> · ' + timeAgo(r.sinceTs)],
        ['versionSeq', '<span class="cell-mono">' + r.stateVersion + '</span>'],
        ['Buffer 占用', r.bufferUsage + ' / 8 槽'],
        ['最近淘汰检查', '<span class="cell-mono">' + escapeHtml(formatDateTime(r.lastEvictionCheck)) + '</span> · ' + timeAgo(r.lastEvictionCheck)],
        ['State 快照', navLink('sessions', '', '去 Session 里看快照', '在 Session 详情的 Agent State 分区查看十一字段')]
      ], { dense: true }) +
      '<div class="divider"></div>' +
      sectionTitle('Buffer 占用', 'i-layers') +
      progressHtml(r.bufferUsage, 8, 'Working Memory Buffer 占用') +
      '<span class="progress-label">' + r.bufferUsage + ' / 8 槽，超容量按最旧优先剪枝</span>'
    }) +
    noticeBar({
      kind: 'warn', icon: 'i-alert',
      html: 'State 常驻<strong>按 Agent 维度</strong>，不是按用户维度。容量吃紧时按最近使用淘汰，' +
        '被淘汰的 Agent 下一次事件到达时从 State 快照恢复；快照与 versionSeq 不一致时按事件回放重建。'
    });
  }

  function runtimeDrawerBody(r, tab) {
    if (tab === 'decisions') return runtimeDecisionsTab(r);
    if (tab === 'state') return runtimeStateTab(r);
    return runtimeLoopsTab(r);
  }

  VIEWS.runtime = {
    scroll: 'list',
    drawerTabs: [
      { key: 'loops', label: '双 Loop', icon: 'i-activity' },
      { key: 'decisions', label: '最近决策', icon: 'i-target' },
      { key: 'state', label: 'State 与淘汰', icon: 'i-database' }
    ],
    actions() {
      return '<button class="btn btn--ghost" type="button" data-action="stream.disconnect" data-stream="runtime">' +
        icon('i-wifi-off') + '注入断线</button>' +
        '<button class="btn btn--ghost" type="button" data-action="list.reload" data-key="runtime">' +
        icon('i-refresh') + '重新拉取</button>';
    },
    render(host) {
      mountList(host, 'runtime', {
        path: '/runtime/instances',
        caption: 'Agent 运行时列表',
        pageSize: 8,
        skeletonRows: 6,
        columns: RUNTIME_COLUMNS,
        filters(store) {
          const f = store.filters;
          return filterSearch('runtime', 'q', '搜索 Agent 名称、归属用户或 ID', f.q) +
            filterSelect('runtime', 'resident', '常驻状态', RUNTIME_RESIDENT_OPTIONS, f.resident) +
            '<span class="filter-summary">端点 GET ' + BASE + '/runtime/instances · 推送 /ws/runtime</span>';
        },
        filter(items, f) {
          const q = (f.q || '').trim().toLowerCase();
          return items.filter((r) =>
            (f.resident === 'all' || (f.resident === 'resident' ? !!r.resident : !r.resident)) &&
            (!q || [r.agentId, r.agentName, r.ownerName].join(' ').toLowerCase().indexOf(q) >= 0));
        },
        row: runtimeRow,
        empty(store) {
          const f = store.filters;
          if (f.resident === 'cold' && !f.q) {
            return emptyState({
              icon: 'i-database', title: '当前没有未常驻的 Agent',
              desc: '全库 ' + DB.agents.length + ' 个 Agent 里有 ' + DB.runtime.length +
                ' 个 State 常驻内存，其余的没有运行时记录——它们要么已被回收，要么等下一次事件到达时才从 State 快照恢复。',
              links: navLink('agents', '', '去 Agent 实例列表看回收记录', '查看 Agent 实例的归属与回收'),
              actions: '<button class="btn btn--ghost" type="button" data-action="filter.reset" data-key="runtime">' +
                icon('i-refresh') + '清空筛选</button>'
            });
          }
          return emptyState({
            icon: 'i-search', title: '没有匹配的运行时记录',
            desc: '当前筛选条件下没有命中。/ws/runtime 只推送 State 常驻的 Agent。',
            actions: '<button class="btn btn--ghost" type="button" data-action="filter.reset" data-key="runtime">' +
              icon('i-refresh') + '清空筛选</button>'
          });
        },
        footExtra(store) {
          const buf = store.items.reduce((a, r) => a + r.bufferUsage, 0);
          return '<span class="filter-summary">' + store.filtered + ' / ' + store.items.length +
            ' 个常驻 · Buffer 合计 ' + buf + ' 槽</span>';
        }
      });
      host.insertAdjacentHTML('afterbegin',
        noticeBar({
          kind: 'info', icon: 'i-wifi',
          html: '本页数据来自 <span class="mono">/ws/runtime</span> 实时推送。<strong>离开这个路由就会停流</strong>，' +
            '不会有后台连接一直挂着；断线后按指数退避重连，最多 3 次。'
        }) +
        '<div class="stat-grid">' + runtimeStats() + '</div>' +
        consoleShell({
          key: 'runtime', endpoint: '/ws/runtime', cls: 'is-live',
          label: 'Agent 运行时实时推送'
        }));
      applyGuards(host);
      createStream('runtime', { minMs: 1100, maxMs: 3200, make: runtimeLine });
    },
    renderDrawer(r, tab, focusTab) {
      openDrawer({
        title: r.agentName,
        icon: 'i-activity',
        desc: '<span class="mono">' + escapeHtml(r.agentId) + '</span> · ' + escapeHtml(r.ownerName) +
          ' · versionSeq ' + r.stateVersion,
        headExtra: (r.resident ? statusTag('live', '实时') : statusTag('ended', '未常驻')) +
          statusTag('info', 'Buffer ' + r.bufferUsage + '/8'),
        lg: true,
        tabs: tabsHtml('drawer.tab', VIEWS.runtime.drawerTabs, tab, { label: '运行时详情分区' }),
        body: runtimeDrawerBody(r, tab),
        foot: '<button class="btn btn--ghost" type="button" data-action="stream.disconnect" data-stream="runtime">' +
          icon('i-wifi-off') + '注入断线</button>' +
          '<button class="btn btn--ghost" type="button" data-action="nav.go" data-module="agents" data-id="' +
          escapeHtml(r.agentId) + '">' + icon('i-agent') + '打开 Agent 实例</button>' +
          '<span class="spacer"></span>' +
          '<button class="btn btn--ghost" type="button" data-action="layer.close" data-kind="drawer">关闭</button>',
        onMount(root) { if (focusTab) focusActiveTab(root); }
      });
    }
  };

  /* ==========================================================
     11.10 · 运行日志 / 错误 / 审计
     三个分区结构完全不同，用 hash 子路由（#/logs/run|errors|audit）区分，走查可以直接定位。
     content_admin 不在 ROUTE_ACL.logs 里，进不来本页——由 renderRoute 统一给 403 空态。
     ========================================================== */

  const LOG_TAB_KEYS = ['run', 'errors', 'audit'];
  const LOG_LEVEL_OPTIONS = [
    ['all', '全部级别'], ['error', 'error'], ['warn', 'warn'], ['info', 'info']
  ];
  const AUDIT_RESULT_OPTIONS = [
    ['all', '全部结果'], ['success', '成功'], ['denied', '越权拒绝'], ['failed', '失败'], ['pending', '进行中']
  ];
  const ERROR_COLUMNS = [
    { label: '错误摘要' },
    { label: '级别', width: '76px' },
    { label: 'traceId', width: '156px', cls: 'cell-mono' },
    { label: '关联', width: '168px', cls: 'col-optional' },
    { label: '次数', width: '64px', cls: 'col-optional cell-num' },
    { label: '最近出现', width: '104px', cls: 'cell-mono' },
    { label: '操作', width: '86px', cls: 'cell-actions' }
  ];
  const AUDIT_COLUMNS = [
    { label: '时间', width: '116px', cls: 'cell-mono' },
    { label: '操作', width: '132px' },
    { label: '端点', width: '210px', cls: 'col-optional cell-mono' },
    { label: '对象' },
    { label: '结果', width: '80px' },
    { label: '操作者', width: '176px', cls: 'col-optional' },
    { label: '说明', width: '200px', cls: 'col-optional' }
  ];

  /* renderPageHead 先于 view.render 执行，所以页头动作按钮不能读 filters.tab（那是上一帧的），
     必须和 render 用同一条规则从 hash 反解，否则首次进入 #/logs/audit 会出现「注入断线」。 */
  function logsActiveTab() {
    return LOG_TAB_KEYS.indexOf(state.route.sub) >= 0 ? state.route.sub : state.data.logs.filters.tab;
  }

  function logTabs() {
    const f = state.data.logs.filters;
    const st = state.streams.logs;
    return tabsHtml('logs.tab', [
      { key: 'run', label: '运行日志', icon: 'i-terminal', count: st ? st.lines.length : 0, title: '/ws/logs 实时尾部' },
      { key: 'errors', label: '错误', icon: 'i-bug', count: DB.errors.length, title: 'GET ' + BASE + '/logs/errors' },
      {
        key: 'audit', label: '审计', icon: 'i-shield', count: state.audit.items.length,
        title: state.audit.unread ? (state.audit.unread + ' 条未读，进入后清零') : ('GET ' + BASE + '/logs/audit')
      }
    ], f.tab, { label: '日志分区' });
  }

  /* /ws/logs 的推送内容：八种典型服务端日志轮转，数值走确定性伪随机 */
  function logLine(st, seq) {
    const ts = Date.now();
    const n = seq % 8;
    const ag = DB.agents[seq % DB.agents.length];
    const u = DB.users[seq % DB.users.length];
    if (n === 0) return { ts: ts, level: 'info', msg: 'AdminApi ' + pick('api' + seq, ['GET', 'GET', 'PUT', 'POST']) + ' ' + BASE + pick('p' + seq, ['/users', '/agents', '/identities', '/flags', '/media']) + ' → 200 · ' + randInt('ms' + seq, 18, 240) + 'ms' };
    if (n === 1) return { ts: ts, level: 'debug', msg: 'ModelAdapter 选定默认 LLM 供应商 pv_301 · 首字节 ' + randInt('tt' + seq, 180, 900) + 'ms' };
    if (n === 2) return { ts: ts, level: 'info', msg: 'Audit 写入 ' + pick('aa' + seq, ['flag.update', 'memory.patch', 'identity.update', 'media.signed_url']) + ' · actor=' + actorAccount() };
    if (n === 3) return { ts: ts, level: 'warn', msg: 'WorkingMemory ' + ag.id + ' Buffer 达到 ' + randInt('bf' + seq, 7, 9) + ' 槽，按最旧优先剪枝' };
    if (n === 4) return { ts: ts, level: 'debug', msg: 'StateStore 落盘 ' + ag.id + ' · versionSeq=' + (ag.stateVersion + seq) };
    if (n === 5) return { ts: ts, level: 'error', msg: 'ModelAdapter 上游超时：' + ag.id + ' 30000ms 内没有首字节', stack: 'ModelAdapterTimeout: upstream did not emit first token within 30000ms\n  at ModelAdapter.stream(ModelAdapter.kt:214)\n  at ReactiveLoop.runTurn(ReactiveLoop.kt:96)' };
    if (n === 6) return { ts: ts, level: 'warn', msg: 'AdminGuard 拒绝 ' + u.id + ' 相关写操作：角色缺少 ' + pick('cp' + seq, ['media:signed_url', 'user:write', 'flag:write']) };
    return { ts: ts, level: 'info', msg: 'SessionHeartbeat ' + pick('ss' + seq, ['ss_4101', 'ss_4103', 'ss_4106']) + ' 续期成功，TTL 重置为 300s' };
  }

  function renderLogsRunTab(pane) {
    pane.innerHTML =
      noticeBar({
        kind: 'info', icon: 'i-terminal',
        html: '运行日志来自 <span class="mono">/ws/logs</span> 的实时尾部推送，只保留最近 200 行；' +
          '<strong>离开这个路由就会停流</strong>。级别筛选与自动滚底只影响显示，不影响服务端。'
      }) +
      consoleShell({ key: 'logs', endpoint: '/ws/logs', cls: 'is-fill', label: '运行日志实时尾部' });
    createStream('logs', { minMs: 700, maxMs: 2200, make: logLine });
  }

  const providerLabel = (id) => {
    const p = findProvider(id);
    return p ? p.name + '（' + p.id + '）' : id;
  };

  function errorRow(e, store) {
    const open = store.selection === e.id;
    /* 关联列只放一条链接：td 的直接子元素才吃得到 .row-link 的行高与省略号规则，
       两条并排会把行撑高，完整的关联关系放在展开区里 */
    const rel = e.agentId
      ? navLink('agents', e.agentId, agentName(e.agentId), '打开该 Agent 实例')
      : (e.providerId ? navLink('providers', e.providerId, providerLabel(e.providerId), '打开该模型供应商') : '');
    const relTitle = [e.providerId ? providerLabel(e.providerId) : '', e.agentId ? agentName(e.agentId) : '']
      .filter(Boolean).join(' · ') || '无关联对象';
    const main = '<tr' + (open ? ' class="is-selected"' : '') + '>' +
      td('<span class="cell-id"><span class="cell-avatar">' + icon(e.level === 'error' ? 'i-bug' : e.level === 'warn' ? 'i-alert' : 'i-info') + '</span>' +
        '<span class="cell-id-copy">' +
          '<button class="row-link" type="button" data-action="error.open" data-id="' + e.id + '"' +
            ' aria-expanded="' + (open ? 'true' : 'false') + '" title="' + escapeHtml(e.message) + '">' +
            escapeHtml(e.message) + '</button>' +
          '<span>' + escapeHtml(e.id) + (e.stack ? ' · 有堆栈' : ' · 无堆栈') + '</span>' +
        '</span></span>', '', e.message) +
      td(statusTag(e.level, e.level)) +
      td('<span class="cell-mono ellipsis">' + escapeHtml(e.traceId) + '</span>', '', e.traceId) +
      td(rel || '<span class="muted">—</span>', 'col-optional', relTitle) +
      td(String(e.count), 'col-optional cell-num', '最近 24 小时出现 ' + e.count + ' 次') +
      td(timeAgo(e.ts), 'cell-mono', formatDateTime(e.ts)) +
      td(rowActions([
        iconAction('error.open', open ? 'i-chevron-down' : 'i-chevron-right',
          open ? '收起堆栈与上下文' : '展开堆栈与上下文', ' data-id="' + e.id + '"'),
        iconAction('copy.text', 'i-copy', '复制 traceId', ' data-id="' + e.id + '" data-copy="' + escapeHtml(e.traceId) + '"')
      ]), 'cell-actions') +
    '</tr>';
    if (!open) return main;
    return main + '<tr class="error-detail-row"><td colspan="' + ERROR_COLUMNS.length + '">' +
      (e.stack
        ? '<pre class="log-stack">' + escapeHtml(e.stack) + '</pre>'
        : '<p class="muted">这条记录没有堆栈：它是一条提示级日志，不是异常。</p>') +
      kvList([
        ['traceId', '<span class="row"><span class="cell-mono">' + escapeHtml(e.traceId) + '</span>' +
          '<button class="icon-btn" type="button" data-action="copy.text" data-id="' + e.id +
          '" data-copy="' + escapeHtml(e.traceId) + '" aria-label="复制 traceId" title="复制 traceId">' +
          icon('i-copy') + '</button></span>'],
        ['级别', statusTag(e.level, e.level)],
        ['累计次数', escapeHtml(String(e.count) + ' 次')],
        ['最近出现', '<span class="cell-mono">' + escapeHtml(formatDateTime(e.ts)) + '</span> · ' + timeAgo(e.ts)],
        ['关联供应商', e.providerId ? navLink('providers', e.providerId, providerLabel(e.providerId)) : '<span class="muted">无</span>'],
        ['关联 Agent', e.agentId ? navLink('agents', e.agentId, agentName(e.agentId)) : '<span class="muted">无</span>']
      ], { dense: true }) +
      noticeBar({
        kind: 'info', icon: 'i-index',
        html: 'traceId 贯穿客户端 → Admin API → Agent Service → 供应商调用，' +
          '复制它就能在错误列表、运行日志与审计之间对上同一次请求。'
      }) +
    '</td></tr>';
  }

  function auditRow(a) {
    return '<tr' + (a.isNew ? ' class="is-new"' : '') + '>' +
      td('<span class="cell-mono">' + escapeHtml(formatClock(a.ts)) + '</span>', '', formatDateTime(a.ts)) +
      td('<span class="ellipsis">' + escapeHtml(AUDIT_ACTIONS[a.action] || a.action) + '</span>', '',
        (AUDIT_ACTIONS[a.action] || a.action) + '（' + a.action + '）') +
      td('<span class="cell-mono ellipsis">' + escapeHtml(a.method + ' ' + a.path) + '</span>', 'col-optional',
        a.method + ' ' + a.path) +
      td('<span class="ellipsis">' + escapeHtml(a.target) + '</span>', '', a.target) +
      td(statusTag(a.result)) +
      td('<span class="ellipsis">' + escapeHtml(a.actor) + '</span>', 'col-optional',
        a.actor + ' · ' + (ROLE_LABELS[a.actorRole] ? ROLE_LABELS[a.actorRole].name : a.actorRole)) +
      td('<span class="ellipsis muted">' + escapeHtml(a.detail || '—') + '</span>', 'col-optional', a.detail || '') +
    '</tr>';
  }

  function errorListCfg() {
    return {
      path: '/logs/errors',
      caption: '错误日志列表',
      pageSize: 10,
      skeletonRows: 6,
      columns: ERROR_COLUMNS,
      filters(store) {
        const f = store.filters;
        return filterSearch('logs', 'q', '搜索错误摘要、traceId 或关联 ID', f.q) +
          filterSelect('logs', 'level', '级别', LOG_LEVEL_OPTIONS, f.level) +
          '<span class="filter-summary">端点 GET ' + BASE + '/logs/errors</span>';
      },
      filter(items, f) {
        const q = (f.q || '').trim().toLowerCase();
        return items.filter((e) =>
          (f.level === 'all' || e.level === f.level) &&
          (!q || [e.message, e.traceId, e.id, e.providerId || '', e.agentId || '', e.stack || '']
            .join(' ').toLowerCase().indexOf(q) >= 0));
      },
      row: errorRow,
      empty() {
        const f = state.data.logs.filters;
        if (f.q || f.level !== 'all') {
          return emptyState({
            icon: 'i-search', title: '没有匹配的错误',
            desc: '当前筛选条件下没有命中；级别筛选只看错误列表，不影响运行日志的实时尾部。',
            actions: '<button class="btn btn--ghost" type="button" data-action="filter.reset" data-key="logs">' +
              icon('i-refresh') + '清空筛选</button>'
          });
        }
        return emptyState({
          icon: 'i-check-circle', title: '当前没有错误记录',
          desc: '错误列表按 traceId 聚合，出现新的异常会自动排到最前。'
        });
      },
      footExtra(store) {
        const errs = store.items.filter((e) => e.level === 'error').length;
        return '<span class="filter-summary">' + store.filtered + ' / ' + store.items.length +
          ' 条 · error 级 ' + errs + ' 条</span>';
      }
    };
  }

  function auditListCfg() {
    return {
      path: '/logs/audit',
      caption: '审计日志列表',
      pageSize: 12,
      skeletonRows: 8,
      columns: AUDIT_COLUMNS,
      filters(store) {
        const f = store.filters;
        return filterSearch('logs', 'q', '搜索操作、端点、对象或说明', f.q) +
          AUDIT_RESULT_OPTIONS.map((o) => filterChip('logs', 'result', o[0], o[1], f.result === o[0],
            o[0] === 'all' ? store.items.length : store.items.filter((a) => a.result === o[0]).length)).join('') +
          '<button class="chip' + (f.mineOnly ? ' is-on' : '') + '" type="button" data-action="logs.mine"' +
            ' aria-pressed="' + (f.mineOnly ? 'true' : 'false') + '">' + icon('i-user') + '只看我的操作</button>' +
          '<span class="filter-summary">端点 GET ' + BASE + '/logs/audit · 只读</span>';
      },
      filter(items, f) {
        const q = (f.q || '').trim().toLowerCase();
        const me = actorAccount();
        return items.filter((a) =>
          (f.result === 'all' || a.result === f.result) &&
          (!f.mineOnly || a.actor === me) &&
          (!q || [AUDIT_ACTIONS[a.action] || a.action, a.action, a.method, a.path, a.target, a.detail || '', a.actor]
            .join(' ').toLowerCase().indexOf(q) >= 0));
      },
      row: auditRow,
      empty(store) {
        const f = store.filters;
        if (f.mineOnly) {
          return emptyState({
            icon: 'i-user', title: '你还没有做过写操作',
            desc: '当前登录身份是 <span class="mono">' + escapeHtml(actorAccount()) + '</span>；' +
              '任何一次写操作（包括被拒绝的越权调用）都会在这里留下一条记录。',
            actions: '<button class="btn btn--ghost" type="button" data-action="logs.mine">取消「只看我的操作」</button>'
          });
        }
        if (f.q || f.result !== 'all') {
          return emptyState({
            icon: 'i-search', title: '没有匹配的审计记录',
            desc: '换个关键字，或把结果筛选放回「全部结果」。',
            actions: '<button class="btn btn--ghost" type="button" data-action="filter.reset" data-key="logs">' +
              icon('i-refresh') + '清空筛选</button>'
          });
        }
        return emptyState({ icon: 'i-shield', title: '审计日志为空', desc: '所有写操作都会进审计，包括被拒绝的越权调用。' });
      },
      footExtra(store) {
        const denied = store.items.filter((a) => a.result === 'denied').length;
        const failed = store.items.filter((a) => a.result === 'failed').length;
        return '<span class="filter-summary">' + store.filtered + ' / ' + store.items.length +
          ' 条 · 越权拒绝 ' + denied + ' · 失败 ' + failed + '</span>';
      },
      afterLoad() {
        /* 进审计分区只清未读徽标，保留 isNew——这样刚写入的那条还会闪一次 .is-new，
           「全部标为已读」按钮才负责把 isNew 一起清掉。 */
        if (!state.audit.unread) return;
        state.audit.unread = 0;
        renderBadges();
      }
    };
  }

  /* 审计页正开着时，新写入的记录要立刻出现，不能等下一次手动刷新 */
  function paintAuditTable() {
    const store = state.data.logs;
    if (!LIST_CFG.logs || !store || !store.dom || !store.dom.scroll || !store.dom.scroll.isConnected) return;
    if (store.filters.tab !== 'audit') return;
    paintList('logs');
  }

  VIEWS.logs = {
    scroll: 'list',
    actions() {
      const tab = logsActiveTab();
      if (tab === 'run') {
        return '<button class="btn btn--ghost" type="button" data-action="stream.disconnect" data-stream="logs">' +
          icon('i-wifi-off') + '注入断线</button>';
      }
      if (tab === 'audit') {
        const pending = state.audit.unread > 0 || state.audit.items.some((i) => i.isNew);
        return '<button class="btn btn--ghost" type="button" data-action="audit.clearUnread"' +
          (pending ? '' : ' disabled') + '>' + icon('i-check') + '全部标为已读</button>';
      }
      return '<button class="btn btn--ghost" type="button" data-action="list.reload" data-key="logs">' +
        icon('i-refresh') + '重新拉取</button>';
    },
    render(host) {
      const f = state.data.logs.filters;
      const tab = logsActiveTab();
      f.tab = tab;
      host.innerHTML = '<div class="log-tabs">' + logTabs() + '</div><div class="logs-pane" id="logs-pane"></div>';
      const pane = document.getElementById('logs-pane');
      if (tab === 'run') renderLogsRunTab(pane);
      else mountList(pane, 'logs', tab === 'audit' ? auditListCfg() : errorListCfg());
      if (tab === 'audit') {
        pane.insertAdjacentHTML('afterbegin', noticeBar({
          kind: 'info', icon: 'i-shield',
          html: '审计<strong>只读</strong>，后台没有任何修改或删除审计的端点。所有写操作都会在这里留痕，' +
            '越权调用同样记为 <span class="mono">result: denied</span>；删除用户不会连带删除审计，' +
            '审计按自己的保留期独立留存。'
        }));
      }
      applyGuards(host);
    }
  };

  /* ---------- 11.11 留存媒体（音频留存 / 视觉留存 / 媒体索引） ----------
     安全边界：字节只存对象存储，数据库只保存媒体索引；后台不直连对象存储，
     只能换取 120s 短期签名地址，且每一次换取都写审计（AgentService §13）。 */

  const MEDIA_TAB_KEYS = ['audio', 'frame', 'index'];
  const MEDIA_SIGN_REASON = '留存媒体的字节只存在对象存储，仅系统管理员可换取短期签名地址';

  /* 签名地址失效属纯视图状态：字节还在不在由 expiresAt 决定，地址过没过期只影响按钮文案 */
  const lapsedSigned = {};
  let mediaTicker = 0;

  function mediaActiveTab() {
    return MEDIA_TAB_KEYS.indexOf(state.route.sub) >= 0 ? state.route.sub : state.data.media.filters.tab;
  }

  function mediaTabs() {
    const f = state.data.media.filters;
    const count = (k) => DB.media.filter((m) => m.kind === k).length;
    return tabsHtml('media.tab', [
      {
        key: 'audio', label: '留存音频', icon: 'i-waveform', count: count('audio'),
        title: '默认保留 ' + MEDIA_POLICY.audioDays + ' 天'
      },
      {
        key: 'frame', label: '视觉原帧', icon: 'i-frame', count: count('frame'),
        title: '默认保留 ' + MEDIA_POLICY.frameDays + ' 天'
      },
      {
        key: 'index', label: '媒体索引', icon: 'i-index', count: DB.media.length,
        title: '数据库只保存索引，不保存字节'
      }
    ], f.tab, { label: '留存媒体分区' });
  }

  function mediaPolicyNotice(tab) {
    if (tab === 'frame') {
      return noticeBar({
        kind: 'warn', icon: 'i-frame',
        html: '视觉原帧默认只保留 <strong>' + MEDIA_POLICY.frameDays + ' 天</strong>，卡片上直接显示剩余天数。' +
          '到期后对象存储里的字节被清理，<strong>媒体索引仍然保留</strong>；此时换取签名地址会拿到 ' +
          '<span class="mono">410 Gone</span>，这是保留策略生效，不是故障。'
      });
    }
    if (tab === 'index') {
      return noticeBar({
        kind: 'info', icon: 'i-database',
        html: '<strong>音频与原帧的字节只存对象存储，数据库只保存媒体索引。</strong>' +
          '本分区是只读视图：后台不通过 Client API 绕行，也不直连数据库或对象存储；' +
          '真要取用字节，必须去「留存音频 / 视觉原帧」分区换取短期签名地址。'
      });
    }
    return noticeBar({
      kind: 'info', icon: 'i-database',
      html: '音频字节只存对象存储，数据库只保存媒体索引（默认保留 <strong>' + MEDIA_POLICY.audioDays + ' 天</strong>）。' +
        '换取签名地址走 <span class="mono">POST ' + BASE + '/media/{id}/signed-url</span>，返回带 ' +
        '<span class="mono">sig</span> 与 <span class="mono">exp</span> 的地址，有效期 ' +
        MEDIA_POLICY.signedTtlSec + ' 秒，<strong>每一次换取都会写入审计</strong>。'
    });
  }

  function mediaSpec(m) {
    return m.kind === 'frame'
      ? m.resolution + ' · ' + formatBytes(m.bytes)
      : formatDuration(m.durationMs) + ' · ' + m.codec + ' · ' + (m.sampleRate / 1000) + 'kHz · ' + formatBytes(m.bytes);
  }

  /* 剩余天数按「占保留期的比例」变脸：视觉原帧只有 7 天，等剩 1 天才警示就太晚了 */
  function retentionTag(m) {
    const left = daysLeft(m.expiresAt);
    if (left <= 0) return statusTag('archived', '已超保留期');
    const ratio = left / m.retentionDays;
    return statusTag(ratio <= 0.15 ? 'danger' : (ratio <= 0.4 ? 'warn' : 'ok'), '剩余 ' + left + ' 天');
  }

  const signedLive = (m) => !!(m.signedUrl && m.signedExp > Date.now());

  function signButtonState(m) {
    const purged = Date.now() > m.expiresAt;
    const lapsed = !!lapsedSigned[m.id];
    const live = signedLive(m);
    return {
      purged: purged,
      live: live,
      ghost: purged || live,
      label: purged ? '已超保留期' : (lapsed ? '已过期，需重新换取' : (live ? '重新换取地址' : '换取签名地址')),
      icon: purged ? 'i-ban' : (lapsed ? 'i-clock' : 'i-key')
    };
  }

  function signButtonHtml(m, small) {
    const s = signButtonState(m);
    return '<button class="btn' + (small ? ' btn--sm' : '') + ' ' + (s.ghost ? 'btn--ghost' : 'btn--primary') + '"' +
      ' type="button" data-action="media.sign" data-id="' + escapeHtml(m.id) + '"' +
      ' data-sign-btn="' + escapeHtml(m.id) + '"' +
      (s.purged ? ' disabled aria-disabled="true" aria-label="已超保留期，不可换取签名地址" title="字节已被对象存储清理，换取签名地址会返回 410 Gone；这是保留策略生效，不是故障"' : '') +
      guardAttr('media:signed_url', MEDIA_SIGN_REASON) + '>' + icon(s.icon) + escapeHtml(s.label) + '</button>';
  }

  function countdownHtml(m) {
    const left = Math.max(0, Math.round((m.signedExp - Date.now()) / 1000));
    return '<span class="countdown' + (left <= 30 ? ' is-low' : '') + '" data-countdown="' + escapeHtml(m.id) + '">' +
      icon('i-clock') + '<span data-countdown-text>' + formatCountdown(left) + ' 后失效</span></span>';
  }

  function signedBoxHtml(m) {
    if (!signedLive(m)) return '';
    return '<div class="signed-box">' +
      '<div class="media-meta">' + icon('i-link') +
        '<span>短期签名地址 · TTL ' + MEDIA_POLICY.signedTtlSec + 's · 本次换取已写入审计</span></div>' +
      '<span class="signed-url">' + escapeHtml(m.signedUrl) + '</span>' +
      '<div class="signed-foot">' + countdownHtml(m) +
        '<button class="btn btn--ghost btn--sm" type="button" data-action="copy.text" data-copy="' +
          escapeHtml(m.signedUrl) + '">' + icon('i-copy') + '复制</button>' +
        '<span class="spacer"></span>' +
        '<span class="cell-mono muted">exp=' + Math.floor(m.signedExp / 1000) + '</span>' +
      '</div></div>';
  }

  /* 空插槽要 hidden，否则 grid 的 gap 会在每张未签名的卡片上留一条空白 */
  function signedSlotHtml(m) {
    const live = signedLive(m);
    return '<div data-signed-slot="' + escapeHtml(m.id) + '"' + (live ? '' : ' hidden') + '>' + signedBoxHtml(m) + '</div>';
  }

  /* 卡片与抽屉可能同时挂着同一条记录的插槽，所以全部更新，不能只取第一个 */
  function repaintSignedSlot(m) {
    $$('[data-signed-slot="' + m.id + '"]').forEach((slot) => {
      slot.innerHTML = signedBoxHtml(m);
      slot.hidden = !signedLive(m);
    });
    paintSignButton(m);
  }

  /* 原地改按钮而不是整体替换：替换会把焦点丢回 body，
     还会让 applyGuards 包好的 .permission-guard 变成孤儿节点（规避走查 #10） */
  function paintSignButton(m) {
    const s = signButtonState(m);
    $$('[data-sign-btn="' + m.id + '"]').forEach((btn) => {
      btn.classList.toggle('btn--primary', !s.ghost);
      btn.classList.toggle('btn--ghost', s.ghost);
      btn.innerHTML = icon(s.icon) + escapeHtml(s.label);
      if (s.purged) btn.disabled = true;
      else if (btn.dataset.permDisabled !== '1') btn.disabled = false;
    });
  }

  function stopMediaTicker() {
    if (mediaTicker) { clearInterval(mediaTicker); mediaTicker = 0; }
  }

  /* 每秒只改倒计时文本，不重画卡片；归零那一次才清地址、重画插槽与按钮 */
  function startMediaTicker() {
    stopMediaTicker();
    mediaTicker = setInterval(() => {
      if (state.route.module !== 'media') { stopMediaTicker(); return; }
      let live = 0;
      $$('[data-countdown]').forEach((el) => {
        const m = findMedia(el.dataset.countdown);
        if (!m) { el.remove(); return; }
        const left = Math.ceil((m.signedExp - Date.now()) / 1000);
        if (left > 0) {
          live += 1;
          el.classList.toggle('is-low', left <= 30);
          const text = $('[data-countdown-text]', el);
          if (text) text.textContent = formatCountdown(left) + ' 后失效';
          return;
        }
        m.signedUrl = null;
        m.signedExp = 0;
        lapsedSigned[m.id] = true;
        repaintSignedSlot(m);
      });
      if (!live) stopMediaTicker();
    }, 1000);
  }

  function mediaCard(m) {
    const isFrame = m.kind === 'frame';
    return '<article class="card media-card">' +
      '<div class="media-top">' +
        '<span class="media-icon' + (isFrame ? ' is-frame' : '') + '" aria-hidden="true">' +
          icon(isFrame ? 'i-frame' : 'i-waveform') + '</span>' +
        '<span class="media-name">' +
          '<strong>' + escapeHtml(MEDIA_KIND_TEXT[m.kind] + ' · ' + (DIRECTION_TEXT[m.direction] || m.direction)) + '</strong>' +
          '<span>' + escapeHtml(m.id + ' · ' + m.objectKey) + '</span>' +
        '</span>' +
        iconAction('row.open', 'i-index', '打开 ' + m.id + ' 的媒体索引详情',
          ' data-module="media" data-id="' + escapeHtml(m.id) + '"') +
      '</div>' +
      '<div class="media-meta"><span>' + escapeHtml(mediaSpec(m)) + '</span>' + retentionTag(m) + '</div>' +
      '<div class="media-meta">' + icon('i-user') +
        '<span>' + escapeHtml(userName(m.userId) + ' · ' + m.userId + ' · ' + m.agentId + ' · ' + m.sessionId) + '</span></div>' +
      signedSlotHtml(m) +
      '<div class="signed-foot">' + signButtonHtml(m, true) + '<span class="spacer"></span>' +
        '<span class="cell-mono muted">' + escapeHtml(formatDateTime(m.createdAt)) + '</span></div>' +
    '</article>';
  }

  function mediaMatches(m, q) {
    return !q || [m.id, m.objectKey, m.userId, m.agentId, m.sessionId].join(' ').toLowerCase().indexOf(q) >= 0;
  }

  function mediaCardCfg(kind) {
    return {
      path: '/media',
      caption: MEDIA_KIND_TEXT[kind] + '列表',
      pageSize: 9,
      skeleton: () => skeletonCards(6, 'media-grid'),
      columns: [],
      filters(store) {
        const f = store.filters;
        const items = store.items.filter((m) => m.kind === kind);
        const bytes = items.reduce((s, m) => s + m.bytes, 0);
        const days = kind === 'audio' ? MEDIA_POLICY.audioDays : MEDIA_POLICY.frameDays;
        return filterSearch('media', 'q', '搜索媒体索引 ID、对象键、用户、Agent 或 Session', f.q) +
          '<span class="filter-summary">' + items.length + ' 条 · 合计 ' + formatBytes(bytes) +
            ' · 默认保留 ' + days + ' 天</span>';
      },
      filter(items, f) {
        const q = (f.q || '').trim().toLowerCase();
        return items.filter((m) => m.kind === kind && mediaMatches(m, q));
      },
      list: (slice) => '<div class="media-grid">' + slice.map(mediaCard).join('') + '</div>',
      empty(store) {
        const f = store.filters;
        const total = store.items.filter((m) => m.kind === kind).length;
        if (!total) {
          return emptyState({
            icon: kind === 'frame' ? 'i-frame' : 'i-waveform',
            title: kind === 'frame' ? '没有视觉原帧' : '没有留存音频',
            desc: kind === 'frame'
              ? '视觉留存默认只保留 <strong>' + MEDIA_POLICY.frameDays + ' 天</strong>，超期字节会被清理，' +
                '媒体索引也会随之从列表里消失。'
              : '音频留存默认保留 <strong>' + MEDIA_POLICY.audioDays + ' 天</strong>；' +
                '客户端上传或 Agent 下行合成后才会出现在这里。',
            links: navLink('sessions', DB.sessions[0].id, '去 Session 列表看是哪一轮产生的', '打开会话管理')
          });
        }
        return emptyState({
          icon: 'i-search', title: '没有匹配的留存媒体',
          desc: '关键字 <span class="mono">' + escapeHtml(f.q) + '</span> 在 ' + total + ' 条' +
            MEDIA_KIND_TEXT[kind] + '里没有命中，试着换成媒体索引 ID 或对象键的一部分。',
          actions: '<button class="btn btn--ghost" type="button" data-action="filter.reset" data-key="media">' +
            icon('i-refresh') + '清空关键字</button>'
        });
      }
    };
  }

  const MEDIA_INDEX_COLUMNS = [
    { label: '媒体索引' },
    { label: '类型', width: '104px' },
    { label: '归属', width: '186px', cls: 'col-optional' },
    { label: '规格', width: '170px' },
    { label: '体积', width: '80px', cls: 'col-optional cell-num' },
    { label: '采集时间', width: '100px', cls: 'cell-mono' },
    { label: '保留至', width: '118px', cls: 'col-optional' },
    { label: '操作', width: '68px', cls: 'cell-actions' }
  ];

  function mediaIndexRow(m) {
    const spec = mediaSpec(m);
    return '<tr' + (state.data.media.selection === m.id ? ' class="is-selected"' : '') + '>' +
      td('<span class="cell-id"><span class="cell-avatar">' + escapeHtml(m.kind === 'frame' ? '帧' : '音') + '</span>' +
        '<span class="cell-id-copy">' + rowOpen('media', m.id, m.id) +
        '<span>' + escapeHtml(m.objectKey) + '</span></span></span>', '', m.objectKey) +
      td(statusTag(m.kind === 'audio' ? 'primary' : 'info', MEDIA_KIND_TEXT[m.kind])) +
      td('<span class="ellipsis">' + escapeHtml(userName(m.userId) + ' · ' + m.agentId) + '</span>', 'col-optional',
        userName(m.userId) + '（' + m.userId + '）· ' + agentName(m.agentId) + ' · ' + m.sessionId) +
      td('<span class="ellipsis">' + escapeHtml(spec) + '</span>', '', spec) +
      td(formatBytes(m.bytes), 'col-optional cell-num') +
      td(timeAgo(m.createdAt), 'cell-mono', formatDateTime(m.createdAt)) +
      td(retentionTag(m), 'col-optional',
        '保留期 ' + m.retentionDays + ' 天 · 到期 ' + formatDateTime(m.expiresAt)) +
      td(rowActions([iconAction('row.open', 'i-index', '打开 ' + m.id + ' 的媒体索引详情',
        ' data-module="media" data-id="' + escapeHtml(m.id) + '"')]), 'cell-actions') +
    '</tr>';
  }

  function mediaIndexCfg() {
    return {
      path: '/media',
      caption: '媒体索引',
      pageSize: 12,
      skeletonRows: 8,
      columns: MEDIA_INDEX_COLUMNS,
      filters(store) {
        const f = store.filters;
        return filterSearch('media', 'q', '搜索媒体索引 ID、对象键、用户、Agent 或 Session', f.q) +
          '<span class="filter-summary">只读 · GET ' + BASE + '/media · 数据库不保存字节</span>';
      },
      filter(items, f) {
        const q = (f.q || '').trim().toLowerCase();
        return items.filter((m) => mediaMatches(m, q));
      },
      row: mediaIndexRow,
      empty(store) {
        const f = store.filters;
        if (!store.items.length) {
          return emptyState({
            icon: 'i-database', title: '媒体索引是空的',
            desc: '还没有任何音频留存或视觉留存被登记。索引由 Agent Service 在写入对象存储后落库，' +
              '后台只读，不能手工新增或删除单条索引。'
          });
        }
        return emptyState({
          icon: 'i-search', title: '没有匹配的媒体索引',
          desc: '关键字 <span class="mono">' + escapeHtml(f.q) + '</span> 在 ' + store.items.length +
            ' 条索引里没有命中，试着换成对象键的一部分，例如 <span class="mono">retained/audio</span>。',
          actions: '<button class="btn btn--ghost" type="button" data-action="filter.reset" data-key="media">' +
            icon('i-refresh') + '清空关键字</button>'
        });
      },
      footExtra(store) {
        const audio = store.items.filter((m) => m.kind === 'audio').length;
        const frame = store.items.filter((m) => m.kind === 'frame').length;
        const bytes = store.items.reduce((s, m) => s + m.bytes, 0);
        return '<span class="muted">音频留存 ' + audio + ' 条 · 视觉留存 ' + frame + ' 条 · 合计 ' +
          formatBytes(bytes) + '</span>';
      }
    };
  }

  function mediaMetaTab(m) {
    const rows = [
      ['媒体索引', '<span class="mono">' + escapeHtml(m.id) + '</span>'],
      ['对象键', '<span class="mono">' + escapeHtml(m.objectKey) + '</span>'],
      ['类型', statusTag(m.kind === 'audio' ? 'primary' : 'info', MEDIA_KIND_TEXT[m.kind]) + ' ' +
        statusTag('muted', DIRECTION_TEXT[m.direction] || m.direction)],
      [m.kind === 'frame' ? '分辨率' : '时长', '<span class="mono">' +
        escapeHtml(m.kind === 'frame' ? m.resolution : formatDuration(m.durationMs)) + '</span>'],
      ['编码', '<span class="mono">' + escapeHtml(m.kind === 'frame' ? 'image/jpeg' : m.codec) + '</span>' +
        (m.sampleRate ? ' <span class="muted">· ' + (m.sampleRate / 1000) + 'kHz</span>' : '')],
      ['体积', '<span class="mono">' + escapeHtml(formatBytes(m.bytes)) + '</span>'],
      ['采集时间', timeAgo(m.createdAt) + ' <span class="muted cell-mono">' + escapeHtml(formatDateTime(m.createdAt)) + '</span>'],
      ['保留期', m.retentionDays + ' 天 ' + retentionTag(m)],
      ['到期时间', '<span class="mono">' + escapeHtml(formatDateTime(m.expiresAt)) + '</span>']
    ];
    return cardShell({ title: '索引元数据', icon: 'i-index', desc: '数据库里保存的全部内容', body: kvList(rows) }) +
      cardShell({
        title: '归属关系', icon: 'i-link', body: kvList([
          ['用户', navLink('users', m.userId, userName(m.userId), '打开用户详情') +
            ' <span class="muted mono">' + escapeHtml(m.userId) + '</span>'],
          ['Agent 实例', navLink('agents', m.agentId, agentName(m.agentId), '打开 Agent 实例详情')],
          ['Session', navLink('sessions', m.sessionId, m.sessionId, '打开会话详情')]
        ])
      }) +
      noticeBar({
        kind: 'info', icon: 'i-shield',
        html: '这些字段就是数据库里关于这条留存媒体的<strong>全部</strong>内容——没有字节，没有转写文本，' +
          '也没有可直接访问的公开 URL。删除用户时会按级联范围一并清理其留存媒体。'
      });
  }

  function mediaAccessTab(m) {
    const purged = Date.now() > m.expiresAt;
    return cardShell({
      title: '换取短期签名地址', icon: 'i-key',
      desc: 'POST ' + BASE + '/media/' + m.id + '/signed-url',
      extra: statusTag('muted', 'TTL ' + MEDIA_POLICY.signedTtlSec + 's'),
      body: '<div class="view-stack">' + signedSlotHtml(m) +
        '<div class="row row-wrap">' + signButtonHtml(m) +
          '<span class="muted">' + (purged ? '字节已清理，无法再签发' : '签发后地址 ' + MEDIA_POLICY.signedTtlSec + ' 秒内有效') + '</span>' +
        '</div>' +
        (purged
          ? noticeBar({
            kind: 'warn', icon: 'i-ban',
            html: '这条' + (m.kind === 'frame' ? '视觉留存' : '音频留存') + '已超过 ' + m.retentionDays +
              ' 天保留期，对象存储里的字节已被清理，换取签名地址会返回 <span class="mono">410 Gone</span>。' +
              '<strong>媒体索引不会被删除</strong>，仍然可以证明「这个时间点存在过这样一次留存」。'
          })
          : noticeBar({
            kind: 'info', icon: 'i-shield',
            html: '签名地址带 <span class="mono">sig</span> 与 <span class="mono">exp</span> 两个参数，过期后必须重新换取；' +
              '后台不缓存、不落库、也不会在页面刷新后保留。'
          })) + '</div>'
    }) +
      cardShell({
        title: '访问审计', icon: 'i-shield', desc: '每一次换取都留痕',
        body: auditTimeline(auditOf(m.id), '还没有人换取过这条留存媒体的签名地址。')
      }) +
      noticeBar({
        kind: 'info', icon: 'i-info',
        html: '「每次访问都要记审计」在这里是可验证的：换一次地址，' +
          '<button class="btn btn--ghost btn--sm" type="button" data-action="nav.go" data-module="logs"' +
            ' data-sub="audit">' + icon('i-shield') + '审计分区</button>' +
          '就会多出一条 <span class="mono">media.signed_url</span>；越权调用（例如内容管理员）同样会留下 ' +
          '<span class="mono">result: denied</span> 的记录。'
      });
  }

  function mediaDrawerBody(m, tab) {
    return tab === 'access' ? mediaAccessTab(m) : mediaMetaTab(m);
  }

  VIEWS.media = {
    scroll: 'list',
    drawerTabs: [
      { key: 'meta', label: '索引元数据', icon: 'i-index' },
      { key: 'access', label: '访问与审计', icon: 'i-key' }
    ],
    actions() {
      return '<button class="btn btn--ghost" type="button" data-action="list.reload" data-key="media">' +
        icon('i-refresh') + '重新拉取</button>';
    },
    render(host) {
      const f = state.data.media.filters;
      const tab = mediaActiveTab();
      f.tab = tab;
      host.innerHTML = '<div class="media-tabs">' + mediaTabs() + '</div>' +
        mediaPolicyNotice(tab) + '<div class="media-pane" id="media-pane"></div>';
      const pane = document.getElementById('media-pane');
      mountList(pane, 'media', tab === 'index' ? mediaIndexCfg() : mediaCardCfg(tab));
      applyGuards(host);
      startMediaTicker();
    },
    renderDrawer(m, tab, focusTab) {
      openDrawer({
        title: MEDIA_KIND_TEXT[m.kind] + ' ' + m.id,
        icon: m.kind === 'frame' ? 'i-frame' : 'i-waveform',
        desc: '<span class="mono">' + escapeHtml(m.objectKey) + '</span>',
        headExtra: retentionTag(m) + statusTag('muted', DIRECTION_TEXT[m.direction] || m.direction),
        tabs: tabsHtml('drawer.tab', VIEWS.media.drawerTabs, tab, { label: '留存媒体详情分区' }),
        body: mediaDrawerBody(m, tab),
        foot: signButtonHtml(m) +
          '<button class="btn btn--ghost" type="button" data-action="nav.go" data-module="sessions" data-id="' +
            escapeHtml(m.sessionId) + '">' + icon('i-messages') + '打开 Session</button>' +
          '<span class="spacer"></span>' +
          '<button class="btn btn--ghost" type="button" data-action="layer.close" data-kind="drawer">关闭</button>',
        onMount(root) {
          if (focusTab) focusActiveTab(root);
          startMediaTicker();
        }
      });
    }
  };

  async function signMedia(id, busyEl) {
    const m = findMedia(id);
    if (!m) { toast('留存媒体 ' + id + ' 已不存在，列表可能已经刷新', 'error'); return; }
    const res = await runWrite({
      action: 'media.signed_url',
      method: 'POST',
      path: '/media/' + id + '/signed-url',
      capability: 'media:signed_url',
      reason: MEDIA_SIGN_REASON,
      target: MEDIA_KIND_TEXT[m.kind] + ' ' + id,
      busyEl: busyEl,
      closeModal: false,
      refresh: () => {
        lapsedSigned[id] = false;
        repaintSignedSlot(m);
        startMediaTicker();
      }
    });
    if (!res) return;
    /* 抽屉正开着同一条记录时，访问审计要立刻长出新的一条 */
    if (drawerCtx && drawerCtx.module === 'media' && drawerCtx.id === id && drawerCtx.tab === 'access') {
      const body = document.getElementById('drawer-body');
      if (body) body.innerHTML = mediaDrawerBody(m, 'access');
      applyGuards(body);
    }
  }

  /* ---------- 11.12 统一拒绝页（路由级权限） ----------
     越权不是「入口消失」，而是一张说清楚为什么、能去哪儿、怎么换身份的页面。
     renderRoute 在跳到这里之前已经记下一条 result:"denied" 的审计——越权本身也要留痕。 */

  function forbiddenLinks(from) {
    /* 概览对三类角色都开放，固定放第一位；其余按 ROUTE_ACL 的声明顺序取两条 */
    const rest = Object.keys(ROUTE_ACL)
      .filter((k) => k !== 'dashboard' && k !== from && ROUTE_ACL[k].includes(state.role))
      .slice(0, 2);
    return ['dashboard'].concat(rest).map((k) =>
      navLink(k, '', MODULES[k].title, '前往' + MODULES[k].title + '：' + MODULES[k].desc)).join('');
  }

  function forbiddenActions(from) {
    /* 只有真能进这个路由的角色才值得给「换个身份重试」，否则按钮点下去还是 403 */
    const target = MODULES[from] ? from : null;
    /* 手输 #/403 或 API 级 403 落到这里时，当前角色可能本来就有权限：
       这时要给的出口是关掉注入与直接进入，而不是换身份。 */
    if (target && canRoute(target)) {
      let out = '<button class="btn btn--primary" type="button" data-action="nav.go" data-module="' + target + '">' +
        icon('i-external') + '直接进入' + escapeHtml(MODULES[target].title) + '</button>';
      if (state.chaos.mode !== 'none') {
        out += '<button class="btn btn--ghost" type="button" data-action="chaos.set" data-mode="none">' +
          icon('i-check-circle') + '关闭演示注入</button>';
      }
      if (canRoute('logs')) {
        out += '<button class="btn btn--ghost" type="button" data-action="nav.go" data-module="logs" data-sub="audit">' +
          icon('i-shield') + '看这次拒绝的审计记录</button>';
      }
      return out;
    }
    let out = ROLE_ORDER
      .filter((r) => r !== state.role && (!target || ROUTE_ACL[target].includes(r)))
      .map((r) => '<button class="btn btn--ghost" type="button" data-action="role.switch" data-role="' + r + '">' +
        icon(ROLE_LABELS[r].icon) + '以' + ROLE_LABELS[r].name + '身份重试</button>')
      .join('');
    if (canRoute('logs')) {
      out += '<button class="btn btn--ghost" type="button" data-action="nav.go" data-module="logs" data-sub="audit">' +
        icon('i-shield') + '看这次拒绝的审计记录</button>';
    }
    return out;
  }

  function forbiddenBody(from) {
    const role = ROLE_LABELS[state.role];
    const mod = MODULES[from] ? from : null;
    const allowed = Object.keys(ROUTE_ACL).filter((k) => ROUTE_ACL[k].includes(state.role)).length;
    /* 这一页有两种来路：真越权，以及 API 级 403（含演示注入）把手输链接打了回来。
       后者不能谎称当前角色没有路由权限——那会和权限矩阵互相打脸。 */
    const entitled = !!mod && canRoute(mod);
    return emptyState({
      variant: 'is-403', icon: 'i-lock',
      title: !mod ? '当前角色无权访问这个页面'
        : entitled ? '这次调用被 403 拒绝了' : '当前角色无权访问' + MODULES[mod].title,
      desc: (entitled
        ? '你正以 <strong>' + escapeHtml(role.name) + '</strong>（<span class="mono">' +
          escapeHtml(role.account) + '</span>）登录，这个身份<strong>本来就有</strong> ' +
          '<span class="mono">' + escapeHtml(mod) + '</span> 的路由权限。' +
          '<br>落在这页的是某一次<em>调用</em>被拒，而不是页面本身：常见于顶栏开着「注入 403」，' +
          '或某个端点在 API 级校验里要求更高的能力。'
        : '你正以 <strong>' + escapeHtml(role.name) + '</strong>（<span class="mono">' +
          escapeHtml(role.account) + '</span>）登录：' + escapeHtml(role.desc) + '。' +
          (mod
            ? '<br><span class="mono">' + escapeHtml(from) + '</span> 只对 ' +
              ROUTE_ACL[mod].map((r) => escapeHtml(ROLE_LABELS[r].name)).join(' / ') + ' 开放。'
            : '')) +
        '<br>这次访问已经被记成一条 <span class="mono">result: denied</span> 的审计。当前角色可访问 ' +
        allowed + ' 个模块：',
      links: forbiddenLinks(from),
      actions: forbiddenActions(from)
    });
  }

  VIEWS.forbidden = {
    scroll: 'page',
    render(host, from) {
      const mod = MODULES[from] ? from : null;
      /* 「点进来就是这一页」只在没有路由权限时成立；有权限的角色是从别处被 403 打回来的 */
      host.innerHTML = (mod && canRoute(mod)
        ? noticeBar({
            kind: 'info', icon: 'i-flask',
            html: '这一页是<strong>调用级</strong> 403 的落点，不是路由被拒。' +
              '先关掉顶栏的「演示注入」，或直接进入对应模块；' +
              '真正的权限分层在导航项的锁定标记与按钮上的原因气泡里演示。'
          })
        : noticeBar({
            kind: 'warn', icon: 'i-shield',
            html: '管理后台<strong>不隐藏</strong>无权限的入口：导航项照样可见，只是标成锁定，点进来就是这一页。' +
              '权限分层因此是「可演示」的，而不是「看不见」的。'
          })) +
        '<section class="card"><div class="card-body is-flush">' + forbiddenBody(from) + '</div></section>';
      applyGuards(host);
    }
  };

  /* ==========================================================
     12 · 路由 + 事件委托 + boot
     ========================================================== */

  /* ---- 12.1 hash 路由 ----
     用 hash 而不是纯 state 路由：走查可以直接打开 #/memories?type=episodic 复现任意状态，
     浏览器后退可用，刷新不丢页面。currentHash 是「我自己写过什么」的账本——
     writeHash 先记账再写地址栏，hashchange 回来时认出是自己写的就不重复渲染，
     这样 ?chaos= 只会被消费一次，不会被 setChaos → renderRoute 再打回来。 */

  let currentHash = location.hash || '';
  let pendingDetail = null;

  const decodeSafe = (s) => {
    try { return decodeURIComponent(String(s).replace(/\+/g, ' ')); } catch (e) { return String(s); }
  };

  function buildHash(route) {
    let h = '#/' + route.module;
    if (route.sub) h += '/' + route.sub;
    const p = route.params || {};
    const keys = Object.keys(p).filter((k) => p[k] !== null && p[k] !== undefined && p[k] !== '');
    if (keys.length) {
      h += '?' + keys.map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(p[k])).join('&');
    }
    return h;
  }

  function parseHash() {
    /* 工作台锚点不是后台模块；首次进入后台与 hashchange 使用同一边界。 */
    const raw = (location.hash || '').startsWith('#/') ? location.hash.slice(1) : '';
    const qi = raw.indexOf('?');
    const seg = (qi >= 0 ? raw.slice(0, qi) : raw).replace(/^\/+/, '').split('/').filter(Boolean);
    const params = {};
    if (qi >= 0) {
      raw.slice(qi + 1).split('&').filter(Boolean).forEach((pair) => {
        const i = pair.indexOf('=');
        const k = decodeSafe(i < 0 ? pair : pair.slice(0, i));
        if (k) params[k] = decodeSafe(i < 0 ? '' : pair.slice(i + 1));
      });
    }
    const mod = seg[0] ? decodeSafe(seg[0]) : 'dashboard';
    if (mod === '403') return { module: '403', sub: null, params: params };
    /* 未知模块当越权处理：导航项从不隐藏，所以「打不开」只可能是没权限或地址写错，
       两种都记一条 denied 审计，比静默跳回概览更能说明权限模型。 */
    if (!MODULES[mod]) return { module: '403', sub: null, params: Object.assign({ from: mod }, params) };
    return { module: mod, sub: seg[1] ? decodeSafe(seg[1]) : null, params: params };
  }

  function writeHash(str, replace) {
    currentHash = str;
    if (replace) {
      /* file:// 下 replaceState 可能抛 SecurityError，退回直接赋值；
         hashchange 会因为 currentHash 已更新而被忽略 */
      try { history.replaceState(null, '', str); return; } catch (e) { /* 落到下面 */ }
    }
    if (location.hash !== str) location.hash = str;
  }

  function setHashParams(patch, replace) {
    const next = {
      module: patch.module || state.route.module,
      sub: 'sub' in patch ? (patch.sub || null) : state.route.sub,
      params: Object.assign({}, state.route.params)
    };
    Object.keys(patch).forEach((k) => {
      if (k === 'module' || k === 'sub') return;
      const v = patch[k];
      if (v === null || v === undefined || v === '') delete next.params[k];
      else next.params[k] = v;
    });
    state.route = next;
    writeHash(buildHash(next), replace !== false);
  }

  function go(module, sub, id) {
    closePopover();
    if (state.layout === 'narrow' || state.layout === 'compact') setNavOpen(false);
    const str = buildHash({ module: module, sub: sub || null, params: id ? { id: id } : {} });
    /* 已经在这一页就不重渲：重渲会白白重启一次实时流 */
    if (str === currentHash) return;
    /* writeHash 先记 currentHash，所以随后的 hashchange 会被认成「自己写的」而忽略，
       渲染由这里直接负责；浏览器前进后退因为 currentHash 对不上才会走 hashchange。 */
    writeHash(str, false);
    renderRoute();
  }

  function consumeChaosParam() {
    const c = state.route.params.chaos;
    if (!c) return;
    delete state.route.params.chaos;
    writeHash(buildHash(state.route), true);
    const m = CHAOS_MODES.filter((x) => x.key === c)[0];
    if (!m || state.chaos.mode === c) return;
    state.chaos.mode = c;
    renderChaosMenu();
    toast('已从地址栏注入「' + m.label + '」：' + m.desc, c === 'none' ? 'ok' : 'warn');
  }

  /* hash 是筛选状态的一部分，必须在渲染前落到 filters 上，
     否则直接打开 #/memories?type=episodic 会先画一帧默认类型再跳。 */
  function applyRouteDefaults() {
    const p = state.route.params;
    const mod = state.route.module;
    if (mod === 'memories' && p.type && MEMORY_TYPES.some((t) => t.key === p.type)) {
      state.data.memories.filters.type = p.type;
    }
    /* 从导航进模块（没有子路径）时回到默认分区，不沿用上次停留的 tab */
    if (mod === 'logs' && !state.route.sub) state.data.logs.filters.tab = 'run';
    if (mod === 'media' && !state.route.sub) state.data.media.filters.tab = 'audio';
  }

  function renderRoute() {
    /* 离开实时页必须停流，否则 /ws/runtime 与 /ws/logs 的定时器会一直跑下去 */
    stopAllStreams();
    stopMediaTicker();
    currentHash = location.hash || '';
    state.route = parseHash();
    consumeChaosParam();
    applyRouteDefaults();

    closePopover();
    closeLayer('modal');
    formName = null;
    formCtx = null;
    closeDrawerRaw();

    renderNav();
    renderPageHead();

    const mod = state.route.module;
    refs.pageBody.innerHTML = '';

    if (mod === '403' || !canRoute(mod)) {
      /* 越权本身也要留痕：这条 denied 审计切到日志页就能看到（第二层闭环） */
      const from = mod === '403' ? (state.route.params.from || '403') : mod;
      recordDenied(from);
      refs.pageBody.className = 'page-body is-scroll';
      VIEWS.forbidden.render(refs.pageBody, from);
      refs.pageHead.focus({ preventScroll: true });
      return;
    }

    const view = VIEWS[mod];
    refs.pageBody.className = 'page-body ' + (view.scroll === 'page' ? 'is-scroll' : 'is-list');
    if (state.route.params.id) pendingDetail = { module: mod, id: state.route.params.id };
    view.render(refs.pageBody);
    applyGuards(refs.pageBody);
    /* 焦点落点是页头标题（tabindex="-1"），不给滚动容器 focus——规避走查 #2 的滚动容器焦点环 */
    refs.pageHead.focus({ preventScroll: true });
  }

  /* 深链（#/users?id=u_1001）要等列表真正落地才能开抽屉，所以挂在 loadList 末尾 */
  function openPendingDetail(key) {
    if (!pendingDetail || pendingDetail.module !== key) return;
    const p = pendingDetail;
    pendingDetail = null;
    if (state.route.module === p.module) openDetail(p.module, p.id);
  }

  function closeDrawerRaw() {
    pendingDetail = null;
    drawerCtx = null;
    closeLayer('drawer');
  }

  /* 用户主动关抽屉时要把 ?id= 从地址栏抹掉，否则下一次 renderRoute（例如切换演示注入）
     会照着 hash 把抽屉再打开一次。 */
  function closeDrawerAndSync() {
    const had = !!drawerCtx;
    closeDrawerRaw();
    if (had && state.route.params.id) setHashParams({ id: null }, true);
  }

  function closeTopLayerAndSync() {
    const t = topLayer();
    if (!t) return false;
    if (t.kind === 'drawer') { closeDrawerAndSync(); return true; }
    closeLayer('modal');
    formName = null;
    formCtx = null;
    return true;
  }

  /* ---- 12.2 框架渲染：导航树、页头、顶栏菜单、布局档位与时间戳 ---- */

  /* 无权限的入口不隐藏，只标成锁定：点进去仍然走路由，由 renderRoute 落到统一拒绝页。
     折叠成图标轨时 .nav-label 被 display:none 掉，所以 aria-label 必须自带完整名称。 */
  function navItemHtml(k) {
    const m = MODULES[k];
    const ok = canRoute(k);
    const active = state.route.module === k;
    return '<li><button class="nav-item" type="button" data-action="nav.go" data-module="' + k + '"' +
      ' aria-label="' + escapeHtml(m.title + (ok ? '' : '（当前角色无权访问）')) + '"' +
      ' title="' + escapeHtml(m.title + '：' + m.desc) + '"' +
      (active ? ' aria-current="page"' : '') + (ok ? '' : ' aria-disabled="true"') + '>' +
      icon(m.icon) +
      '<span class="nav-label">' + escapeHtml(m.title) + '</span>' +
      (ok ? '' : '<span class="nav-lock">' + icon('i-lock') + '</span>') +
      (k === 'logs' ? '<span class="nav-badge is-alert" id="nav-badge-logs" hidden>0</span>' : '') +
      '</button></li>';
  }

  function renderNav() {
    refs.navScroll.innerHTML = NAV_GROUPS.map((g) =>
      '<div class="nav-group" role="group" aria-labelledby="navg-' + g.items[0] + '">' +
        '<div class="nav-group-title" id="navg-' + g.items[0] + '">' + escapeHtml(g.title) + '</div>' +
        '<ul class="nav-list">' + g.items.map(navItemHtml).join('') + '</ul>' +
      '</div>').join('');
    renderBadges();
  }

  /* ≤639 时页头动作全部收进「更多」：CSS 只隐藏 .page-head-actions 的直接子元素，
     所以这里同时渲染原按钮和菜单里的副本，两份由同一次 applyGuards 各自打标。 */
  function moreAnchorHtml(acts) {
    return '<div class="popover-anchor more-anchor">' +
      '<button class="icon-btn" type="button" id="more-toggle" data-action="popover.toggle"' +
        ' data-pop="more-popover" aria-haspopup="menu" aria-expanded="false"' +
        ' aria-controls="more-popover" aria-label="更多页面操作">' + icon('i-more') + '</button>' +
      '<div class="popover" id="more-popover" role="menu" aria-label="页面操作">' +
        '<div class="popover-title">页面操作</div>' + acts +
      '</div></div>';
  }

  function renderPageHead() {
    const mod = state.route.module;
    const m = MODULES[mod];
    /* 路由级无权时页头必须跟着改口：否则标题写着「日志、错误与审计」，
       正文却是统一拒绝页，读起来像同一个页面的两种状态。 */
    const denied = mod === '403' || !canRoute(mod);
    /* 拒绝页有两种来路：真越权，以及某次调用被 API 级 / 演示注入 403 打回。
       后者角色本来就有路由权限，页头不能替正文下同一个结论。 */
    const from = mod === '403' ? state.route.params.from : null;
    const entitled = denied && !!from && !!MODULES[from] && canRoute(from);
    refs.pageTitle.textContent = denied ? (entitled ? '这次调用被拒绝' : '访问被拒绝') : m.title;
    refs.pageDesc.textContent = !denied ? m.desc : entitled
      ? '刚才那次调用被 403 拒绝；' + ROLE_LABELS[state.role].name + '本身有「' + MODULES[from].title +
        '」的路由权限。这次拒绝已经记入审计。'
      : '当前角色（' + ROLE_LABELS[state.role].name + '）没有' +
        (m ? '「' + m.title + '」' : '这个') + '页面的路由权限；这次访问已经记入审计。';
    /* 文档标题由工作台入口定义；区域路由只更新自己的页头。 */
    const view = denied ? null : VIEWS[mod];
    const acts = view && typeof view.actions === 'function' ? view.actions() : '';
    refs.pageActions.innerHTML = acts ? acts + moreAnchorHtml(acts) : '';
    /* 整块换掉 innerHTML 后原来的 popover 节点已经不存在，账本必须一起清掉，
       否则下一次 togglePopover 会先把「已经不存在的菜单」当成打开状态忽略一次点击 */
    openPopoverId = null;
    applyGuards(refs.pageActions);
  }

  function popoverRadio(action, dataset, iconId, title, desc, on) {
    return '<button class="popover-item" type="button" role="menuitemradio" data-action="' + action + '"' +
      (dataset || '') + ' aria-checked="' + (on ? 'true' : 'false') + '">' +
      icon(iconId) +
      '<span class="popover-item-copy"><strong>' + escapeHtml(title) + '</strong>' +
      (desc ? '<span>' + escapeHtml(desc) + '</span>' : '') + '</span></button>';
  }

  const roleModuleCount = (r) => Object.keys(ROUTE_ACL).filter((k) => ROUTE_ACL[k].includes(r)).length;

  function renderRoleMenu() {
    refs.rolePopover.innerHTML = '<div class="popover-title">切换演示角色</div>' +
      ROLE_ORDER.map((r) => popoverRadio('role.switch', ' data-role="' + r + '"', ROLE_LABELS[r].icon,
        ROLE_LABELS[r].name + '（' + roleModuleCount(r) + ' 个模块）', ROLE_LABELS[r].desc, r === state.role)).join('') +
      '<div class="popover-sep"></div>' +
      '<p class="popover-hint">角色由 Admin Token 决定，前端改不了；这里的切换是原型专用的演示开关，' +
      '等价于换一枚别的 Token 重新登录。路由级、组件级与 API 级权限会立刻整体重算，' +
      '无权限的入口不会隐藏，点进去是统一拒绝页并留下一条 <span class="mono">result: denied</span> 审计。</p>';
  }

  function renderRolePill() {
    const r = ROLE_LABELS[state.role];
    const use = document.getElementById('role-pill-icon');
    if (use) use.setAttribute('href', '#' + r.icon);
    refs.rolePillLabel.textContent = r.name;
    refs.roleSwitch.setAttribute('aria-label', '当前角色：' + r.name + '，切换演示角色');
    refs.adminName.textContent = r.name;
    refs.adminRole.textContent = actorAccount();
  }

  const chaosLabel = (k) => {
    const m = CHAOS_MODES.filter((x) => x.key === k)[0];
    return m ? m.label : k;
  };

  function renderChaosMenu() {
    refs.chaosPopover.innerHTML = '<div class="popover-title">演示注入</div>' +
      CHAOS_MODES.map((m) => popoverRadio('chaos.set', ' data-mode="' + m.key + '"', m.icon,
        m.label, m.desc, m.key === state.chaos.mode)).join('') +
      '<div class="popover-sep"></div>' +
      '<p class="popover-hint">注入只改变本页模拟请求的行为，不接触任何真实服务。' +
      '也可以写在地址栏里直接复现，例如 <span class="mono">#/users?chaos=500</span>。</p>';
    const on = state.chaos.mode !== 'none';
    refs.chaosToggle.classList.toggle('is-on', on);
    refs.chaosToggle.setAttribute('aria-label', on ? '演示注入：' + chaosLabel(state.chaos.mode) + '（点击修改）' : '演示注入');
  }

  function switchRole(role) {
    if (!ROLE_LABELS[role] || role === state.role) { closePopover(); return; }
    closePopover();
    state.role = role;
    state.admin = {
      id: 'adm_' + role, name: ROLE_LABELS[role].name, account: ROLE_LABELS[role].account, role: role
    };
    renderRolePill();
    renderRoleMenu();
    /* 停在 403 页时换完身份直接回到刚才那一页；仍然无权限就原地重渲，不重复记 denied */
    if (state.route.module === '403') {
      const from = state.route.params.from;
      if (from && MODULES[from] && canRoute(from)) { go(from); return; }
    }
    renderBadges();
    renderRoute();
  }

  /* 四档布局：桌面 / 图标轨（900–1199）/ 抽屉式侧栏（640–899）/ 紧凑（<640）。
     档位只由 JS 记录一次，CSS 断点与这里必须一致，否则 .is-rail 会和容器查询打架。
     量画布的 offsetWidth：它不受画布缩放（transform）影响，rect 会。
     页面被切走时宽度为 0，直接跳过，避免误降到紧凑档。 */
  function computeLayout() {
    const w = refs.stage.offsetWidth;
    if (!w) return false;
    const next = w < 640 ? 'compact' : w < 900 ? 'narrow' : w < 1200 ? 'rail' : 'desktop';
    if (next === state.layout) return false;
    const wasOverlay = state.layout === 'narrow' || state.layout === 'compact';
    state.layout = next;
    const rail = next === 'rail';
    refs.adminShell.classList.toggle('is-rail', rail);
    refs.sidenav.classList.toggle('is-rail', rail);
    if (wasOverlay && next !== 'narrow' && next !== 'compact') setNavOpen(false);
    return true;
  }

  let resizeTimer = 0;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      computeLayout();
      /* 紧凑档的分页只留首尾按钮，跨断点时要重画已挂载的列表；
         scroll.isConnected 为假说明这段 DOM 已经被换页丢弃，不能再画 */
      Object.keys(LIST_CFG).forEach((k) => {
        const store = state.data[k];
        if (store && store.dom && store.dom.scroll && store.dom.scroll.isConnected) paintList(k);
      });
    }, 120);
  }

  /* 相对时间统一走 data-time：30s 只改文本，不整页重渲（重渲会打断筛选输入与滚动位置） */
  function tickClock() {
    $$('[data-time]').forEach((el) => {
      const ts = Number(el.getAttribute('data-time'));
      if (!ts) return;
      const text = formatRelative(ts);
      if (el.textContent !== text) el.textContent = text;
    });
  }

  function startClock() {
    if (state.clock.tickTimer) return;
    state.clock.tickTimer = setInterval(tickClock, 30000);
  }

  function stopClock() {
    clearInterval(state.clock.tickTimer);
    state.clock.tickTimer = 0;
  }

  /* ---- 12.3 列表、筛选与浮层辅助 ---- */

  /* 只重画筛选条。搜索框里正在打字时绝不能重画，否则焦点与光标都会丢，
     所以 filter.input / filter.change 只 paintList，不碰这里。 */
  function repaintFilterBar(key) {
    const cfg = LIST_CFG[key];
    const store = state.data[key];
    if (!cfg || !store || !store.dom || !store.dom.bar || !store.dom.bar.isConnected) return;
    store.dom.bar.innerHTML = cfg.filters ? cfg.filters(store) : '';
    applyGuards(store.dom.bar);
  }

  function resetFilters(key) {
    const store = state.data[key];
    const d = FILTER_DEFAULTS[key];
    if (!store || !d) return;
    /* layout 与 tab 是视图形态而不是筛选条件：清空筛选不该把用户切到的分区打回去 */
    const keep = {};
    ['layout', 'tab'].forEach((k) => { if (store.filters[k] !== undefined) keep[k] = store.filters[k]; });
    store.filters = Object.assign({}, d, keep);
    store.page = 1;
    store.selection = null;
    repaintFilterBar(key);
    paintList(key);
    if (key === 'memories') repaintMemoryTabs();
    /* 「清空筛选」按钮本身在被重画的表格里面，重画后它已经不存在了，焦点交给搜索框 */
    const input = document.getElementById('fs-' + key + '-q');
    if (input) input.focus({ preventScroll: true });
  }

  const chipsBox = (name) => $('[data-chips="' + name + '"]');

  function currentChips(name) {
    const box = chipsBox(name);
    return box ? $$('.chip-tag', box).map((t) => t.dataset.chipValue) : [];
  }

  /* data-label-mode="user" 显示「昵称（ID）」，"plain" 用于特质、约束这类纯文本标签 */
  function chipLabelFor(box, v) {
    return box.dataset.labelMode === 'user' ? userName(v) + '（' + v + '）' : String(v);
  }

  function paintChips(name, arr) {
    const box = chipsBox(name);
    if (!box) return;
    const list = [];
    arr.forEach((v) => { if (v && list.indexOf(v) < 0) list.push(v); });
    $$('.chip-tag', box).forEach((t) => t.remove());
    const html = list.map((v) => chipTag(name, v, chipLabelFor(box, v))).join('');
    const input = $('input[type="text"]', box);
    if (input) input.insertAdjacentHTML('beforebegin', html);
    else box.insertAdjacentHTML('afterbegin', html);
    const hidden = $('input[type="hidden"]', box);
    if (hidden) hidden.value = list.join(',');
  }

  function onChipAdd(input) {
    const name = input.dataset.chipsFor;
    const box = chipsBox(name);
    if (!box) return;
    const value = input.value.trim().replace(/,+$/, '');
    input.value = '';
    if (!value) return;
    const exist = currentChips(name);
    if (exist.indexOf(value) >= 0) { toast('「' + name + '」里已经有 ' + value, 'warn'); return; }
    if (box.dataset.labelMode === 'user' && !findUser(value)) {
      setFieldError(input.closest('form') || document, name, value + ' 不是已登记的用户 ID');
      toast(value + ' 不是已登记的用户 ID', 'error');
      return;
    }
    paintChips(name, exist.concat(value));
  }

  /* 分区切换一律走 hash：#/logs/audit 这类地址要能直接打开复现。
     离开 run 分区必须停流，回来时 view 会重新建立 /ws/logs 连接。 */
  function switchLogsTab(tab) {
    if (LOG_TAB_KEYS.indexOf(tab) < 0) return;
    stopStream('logs');
    state.data.logs.filters.tab = tab;
    state.data.logs.selection = null;
    go('logs', tab);
  }

  function switchMediaTab(tab) {
    if (MEDIA_TAB_KEYS.indexOf(tab) < 0) return;
    stopMediaTicker();
    state.data.media.filters.tab = tab;
    state.data.media.selection = null;
    go('media', tab);
  }

  /* 记忆类型同时是 hash 参数：?type=episodic 是这一页的主要入口，必须可分享、可复现 */
  function switchMemoryType(type) {
    if (!MEMORY_TYPE_MAP[type]) return;
    state.data.memories.filters.type = type;
    state.data.memories.page = 1;
    setHashParams({ type: type }, false);
    repaintMemoryTabs();
    paintList('memories');
  }

  function switchProviderLayout(layout) {
    const f = state.data.providers.filters;
    if (f.layout === layout) return;
    f.layout = layout;
    state.data.providers.page = 1;
    renderPageHead();
    paintList('providers');
  }

  /* file:// 下 clipboard API 常被权限挡掉，退回临时 textarea + execCommand */
  function copyText(el) {
    const text = el.dataset.copy;
    if (text === undefined) return;
    const done = (ok) => toast(ok ? '已复制到剪贴板' : '浏览器拒绝了剪贴板写入，请手动选中复制', ok ? 'ok' : 'warn');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => done(true), () => done(false));
      return;
    }
    const ta = document.createElement('textarea');
    ta.className = 'sr-only';
    ta.setAttribute('aria-hidden', 'true');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    done(ok);
  }

  /* 「立即重连」不等退避计时器，直接把状态打到 open 并补一行，便于当场演示 banner 消失 */
  function reconnectNow(key) {
    const st = state.streams[key];
    if (!st) { toast('这条流当前没有挂载', 'info'); return; }
    const used = st.attempt;
    st.status = 'open';
    st.attempt = 0;
    paintStreamState(key);
    appendStreamLine(key, {
      ts: Date.now(), level: 'info',
      msg: '已手动触发重连并恢复实时推送（此前指数退避 ' + used + ' 次）'
    });
    toast('已重连 /ws/' + key, 'ok');
  }

  /* ---- 12.4 登录：账号 + 口令 + 演示角色 ----
     对应架构文档 §7 的 features/auth/（登录、Token 管理、权限指令）与 §9 第一步。
     角色不是前端选项：口令换回 Admin Token，Token 里带着角色，权限矩阵读的是 Token。 */

  function renderRoleGrid() {
    refs.roleGrid.innerHTML = ROLE_ORDER.map((r) => {
      const on = state.auth.loginRole === r;
      return '<button class="role-card' + (on ? ' is-active' : '') + '" type="button" role="radio"' +
        ' data-action="login.role" data-role="' + r + '"' +
        ' aria-checked="' + (on ? 'true' : 'false') + '" tabindex="' + (on ? '0' : '-1') + '">' +
        '<span class="role-icon">' + icon(ROLE_LABELS[r].icon) + '</span>' +
        '<span class="role-copy"><strong>' + escapeHtml(ROLE_LABELS[r].name) + '</strong>' +
          '<span class="mono">' + escapeHtml(ROLE_LABELS[r].account) + ' · 可访问 ' + roleModuleCount(r) + ' 个模块</span>' +
          '<span>' + escapeHtml(ROLE_LABELS[r].desc) + '</span></span>' +
        '<span class="role-check">' + icon('i-check') + '</span></button>';
    }).join('');
  }

  /* 选角色会顺手填上该角色的演示账号，但手动改过的账号不能被覆盖 */
  function syncLoginAccount() {
    const el = refs.loginAccount;
    const cur = el.value.trim();
    const isPreset = ROLE_ORDER.some((r) => ROLE_LABELS[r].account === cur);
    if (!cur || isPreset) el.value = ROLE_LABELS[state.auth.loginRole].account;
  }

  function setLoginRole(role, focus) {
    if (!ROLE_LABELS[role]) return;
    state.auth.loginRole = role;
    renderRoleGrid();
    syncLoginAccount();
    if (focus) {
      const card = $('[data-role="' + role + '"]', refs.roleGrid);
      if (card) card.focus({ preventScroll: true });
    }
  }

  function showLoginError(text) {
    refs.loginError.hidden = !text;
    refs.loginErrorText.textContent = text || '';
  }

  function validateLogin() {
    clearFieldErrors(refs.loginForm);
    showLoginError('');
    let bad = null;
    if (!refs.loginAccount.value.trim()) bad = { field: 'account', msg: '请输入管理员账号' };
    else if (refs.loginPassword.value.length < 6) {
      bad = { field: 'password', msg: '口令至少 6 位；原型不校验真实口令' };
    }
    if (!bad) return true;
    setFieldError(refs.loginForm, bad.field, bad.msg);
    const el = $('[name="' + bad.field + '"]', refs.loginForm);
    if (el) el.focus({ preventScroll: true });
    return false;
  }

  async function doLogin() {
    if (state.auth.submitting) return;
    if (!validateLogin()) return;
    state.auth.submitting = true;
    setBusy(refs.loginSubmit, true);
    const account = refs.loginAccount.value.trim();
    try {
      const res = await adminApi.request('POST', '/auth/login', {
        body: { account: account, role: state.auth.loginRole }
      });
      /* 以 Token 声明的角色为准：前端选了不等于拿到（这里 mock 会原样回，真实后端会按账号重算） */
      state.role = res.admin.role;
      state.admin = res.admin;
      enterShell();
      toast('已以' + ROLE_LABELS[state.role].name + '身份进入后台', 'ok');
    } catch (err) {
      const e = err instanceof ApiError ? err : new ApiError(0, (err && err.message) || '未知错误');
      showLoginError((e.status ? e.status + ' · ' : '') + e.message + (e.detail ? '（' + e.detail + '）' : ''));
      refs.loginPassword.focus({ preventScroll: true });
    } finally {
      state.auth.submitting = false;
      setBusy(refs.loginSubmit, false);
    }
  }

  function enterShell() {
    state.auth.phase = 'shell';
    refs.loginShell.hidden = true;
    refs.adminShell.hidden = false;
    renderRolePill();
    renderRoleMenu();
    renderChaosMenu();
    computeLayout();
    startClock();
    renderRoute();
  }

  function doLogout() {
    stopAllStreams();
    stopMediaTicker();
    closeLayer('modal');
    formName = null;
    formCtx = null;
    closeDrawerRaw();
    closePopover();
    state.layers.length = 0;
    state.auth.phase = 'login';
    state.auth.submitting = false;
    state.admin = null;
    refs.adminShell.hidden = true;
    refs.loginShell.hidden = false;
    refs.loginPassword.value = '';
    clearFieldErrors(refs.loginForm);
    showLoginError('');
    /* 文档标题由工作台入口定义；区域路由只更新自己的页头。 */
    renderRoleGrid();
    syncLoginAccount();
    setNavOpen(false);
    refs.loginAccount.focus({ preventScroll: true });
    toast('已退出登录，Admin Token 已从内存中清除', 'info');
  }

  /* ---- 12.5 动作表 ----
     所有 data-action 只在这张表里落地一次，视图层只负责把 data-* 写对。
     签名统一为 (el, event)，el 是带 data-action 的元素。 */

  const openById = (name, el, extra) =>
    openForm(name, Object.assign({ id: el.dataset.id }, extra || {}));

  /* 重画筛选条后原来那颗 chip 已经不存在，按同样的 data-* 找回新节点还焦点 */
  function refocusChip(key, name, value) {
    const again = $('[data-action="filter.chip"][data-key="' + key + '"][data-name="' + name +
      '"][data-value="' + value + '"]', refs.pageBody);
    if (again) again.focus({ preventScroll: true });
  }

  Object.assign(ACTIONS, {
    /* ---- 导航与浮层 ---- */
    'nav.go'(el) {
      go(el.dataset.module, el.dataset.sub || null, el.dataset.id || '');
    },
    'row.open'(el) {
      openDetail(el.dataset.module, el.dataset.id);
      /* ?id= 同步进地址栏（replace，不产生新的历史项）：刷新或分享这条链接还能直接开抽屉 */
      if (drawerCtx) setHashParams({ id: el.dataset.id }, true);
    },
    'layer.close'(el) {
      if (el.dataset.kind === 'drawer') { closeDrawerAndSync(); return; }
      closeLayer('modal');
      formName = null;
      formCtx = null;
    },
    'drawer.tab'(el) { redrawDrawer(el.dataset.tab, true); },
    'popover.toggle'(el) { togglePopover(el.dataset.pop); },

    /* ---- 顶栏 ---- */
    'copy.text'(el) { copyText(el); },
    'role.switch'(el) { switchRole(el.dataset.role); },
    'chaos.set'(el) { setChaos(el.dataset.mode); },
    'auth.logout'() { doLogout(); },

    /* ---- 列表与筛选 ---- */
    'list.page'(el) {
      const key = el.dataset.key;
      const store = state.data[key];
      if (!store) return;
      store.page = Number(el.dataset.page) || 1;
      paintList(key);
    },
    'list.reload'(el) { loadList(el.dataset.key); },
    'dashboard.refresh'() { loadDashboard(refs.pageBody); },
    'filter.chip'(el) {
      const key = el.dataset.key, name = el.dataset.name, value = el.dataset.value;
      const store = state.data[key];
      if (!store) return;
      store.filters[name] = value;
      store.page = 1;
      store.selection = null;
      repaintFilterBar(key);
      paintList(key);
      if (key === 'memories') repaintMemoryTabs();
      refocusChip(key, name, value);
    },
    'filter.reset'(el) { resetFilters(el.dataset.key); },

    /* ---- 分区切换 ---- */
    'logs.tab'(el) { switchLogsTab(el.dataset.tab); },
    'media.tab'(el) { switchMediaTab(el.dataset.tab); },
    'memory.type'(el) { switchMemoryType(el.dataset.type); },

    /* ---- 审计闭环 ---- */
    'logs.mine'() {
      const f = state.data.logs.filters;
      f.mineOnly = !f.mineOnly;
      state.data.logs.page = 1;
      repaintFilterBar('logs');
      paintList('logs');
      const chip = $('[data-action="logs.mine"]', refs.pageBody);
      if (chip) chip.focus({ preventScroll: true });
    },
    'audit.clearUnread'() {
      clearAuditUnread();
      paintAuditTable();
      renderPageHead();
      toast('已把全部审计记录标为已读', 'ok');
    },
    'error.open'(el) {
      const id = el.dataset.id;
      const store = state.data.logs;
      store.selection = store.selection === id ? null : id;
      paintList('logs');
      const again = $('[data-action="error.open"][data-id="' + id + '"]', refs.pageBody);
      if (again) again.focus({ preventScroll: true });
    },

    /* ---- 实时流 ---- */
    'stream.toggle'(el) {
      const st = state.streams[el.dataset.stream];
      if (!st) return;
      st.paused = !st.paused;
      paintStreamState(st.key);
    },
    'stream.clear'(el) {
      const st = state.streams[el.dataset.stream];
      if (!st) return;
      st.lines = [];
      repaintStream(st.key);
    },
    'stream.disconnect'(el) { injectDisconnect(el.dataset.stream); },
    'stream.reconnect'(el) { reconnectNow(el.dataset.stream); },
    'stream.autoscroll'(el) {
      const key = el.dataset.stream;
      const st = state.streams[key];
      if (!st) return;
      st.autoScroll = !st.autoScroll;
      el.classList.toggle('is-on', st.autoScroll);
      el.setAttribute('aria-pressed', st.autoScroll ? 'true' : 'false');
      el.setAttribute('aria-label', st.autoScroll ? '自动滚到底部' : '已关闭自动滚动');
      el.setAttribute('title', st.autoScroll ? '自动滚到底部' : '已关闭自动滚动，新行不再抢滚动位置');
      if (st.autoScroll) {
        const host = $('[data-stream-body="' + key + '"]');
        if (host) host.scrollTop = host.scrollHeight;
      }
    },

    /* ---- 用户与角色 ---- */
    'user.create'() { openForm('userCreate', {}); },
    'user.reset'(el) { openById('userReset', el); },
    'user.disable'(el) { openById('userStatus', el, { status: 'disabled' }); },
    'user.enable'(el) { openById('userStatus', el, { status: 'active' }); },
    'user.delete'(el) { openById('userDelete', el); },
    'user.quota'(el) { openById('userQuota', el); },

    /* ---- Agent 实例 ---- */
    'agent.create'() { openForm('agentCreate', {}); },
    /* 延后项按钮被 applyGuards 永久禁用，这里仍接上真实表单：入口存在≠能力开放，
       但去掉延后标记后它必须立刻可用，不能变成一颗死按钮。 */
    'agent.selfCreate'() { openForm('agentCreate', {}); },
    'agent.reclaim'(el) { openById('agentReclaim', el); },
    'agent.quota'(el) { openById('userQuota', el, { from: 'agents' }); },
    'agent.identity'(el) { go('identities', null, el.dataset.id); },

    /* ---- AI 身份 ---- */
    'identity.edit'(el) { openById('identityEdit', el, { section: el.dataset.section }); },

    /* ---- Memory ---- */
    'memory.patch'(el) { openById('memoryPatch', el); },
    'memory.delete'(el) { openById('memoryDelete', el); },

    /* ---- Session ---- */
    'session.replay'(el) { openSessionReplay(el.dataset.id); },
    'session.inject'(el) { openById('sessionInject', el); },

    /* ---- 模型供应商 ---- */
    'provider.create'() { openForm('providerCreate', {}); },
    'provider.edit'(el) { openById('providerEdit', el); },
    'provider.default'(el) { openById('providerDefault', el); },
    'provider.ping'(el) { pingProvider(el.dataset.id, el); },
    'provider.layout'(el) { switchProviderLayout(el.dataset.layout); },

    /* ---- Prompt ---- */
    'prompt.fork'(el) { openById('promptFork', el); },
    'prompt.edit'(el) { openById('promptEdit', el); },
    'prompt.publish'(el) { openById('promptPublish', el); },
    'prompt.rollback'(el) { openById('promptRollback', el, { version: el.dataset.version }); },

    /* ---- 功能开关 ---- */
    'flag.toggle'(el) {
      toggleFlag(el.dataset.id, el.getAttribute('aria-checked') !== 'true', el);
    },
    'flag.hit'(el) { previewFlagHit(el.dataset.id); },
    'flag.save'(el) { saveFlagRule(el.dataset.id, el); },
    /* 行内的「编辑灰度规则」不另开弹窗：抽屉里的 rule 页签就是编辑器，
       避免同一份规则出现两个入口两套状态。 */
    'flag.edit'(el) { openDetail('flags', el.dataset.id, 'rule'); },

    /* ---- 留存媒体 ---- */
    'media.sign'(el) { signMedia(el.dataset.id, el); },

    /* ---- 表单内控件 ---- */
    'form.switch'(el) {
      el.setAttribute('aria-checked', el.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
    },
    'chip.remove'(el) {
      const name = el.dataset.chipsFor;
      paintChips(name, currentChips(name).filter((v) => v !== el.dataset.value));
      const input = $('input[type="text"]', chipsBox(name));
      if (input) input.focus({ preventScroll: true });
    },
    'login.role'(el) { setLoginRole(el.dataset.role, true); }
  });

  /* input 类动作：搜索框防抖重画表格，滑块只改 <output> 文本 */
  const inputTimers = {};
  const INPUT_ACTIONS = {
    'filter.input'(el) {
      const key = el.dataset.key, name = el.dataset.name;
      const store = state.data[key];
      if (!store) return;
      store.filters[name] = el.value;
      store.page = 1;
      const id = key + ':' + name;
      clearTimeout(inputTimers[id]);
      inputTimers[id] = setTimeout(() => {
        delete inputTimers[id];
        paintList(key);
      }, 220);
    },
    'form.slider'(el) {
      const out = document.querySelector('[data-slider-out="' + el.getAttribute('name') + '"]');
      if (out) out.textContent = el.value + '%';
    }
  };

  /* change 类动作：select 本身会保持焦点与值，所以只重画结果 */
  const CHANGE_ACTIONS = {
    'filter.change'(el) {
      const key = el.dataset.key, name = el.dataset.name;
      const store = state.data[key];
      if (!store) return;
      store.filters[name] = el.value;
      store.page = 1;
      store.selection = null;
      paintList(key);
    },
    'stream.level'(el) {
      const st = state.streams[el.dataset.stream];
      if (!st) return;
      st.level = el.value;
      repaintStream(st.key);
    }
  };

  /* ---- 12.6 委托与监听：一张动作表 + 键盘可达 ---- */

  /* 三个表合起来才是完整清单。chip.add 只由 keydown 驱动，单独登记，
     否则点一下筛选输入框就会被误判成「没接线的动作」。 */
  const KEY_ONLY_ACTIONS = { 'chip.add': 1 };
  const isKnownAction = (name) =>
    Object.prototype.hasOwnProperty.call(ACTIONS, name) ||
    Object.prototype.hasOwnProperty.call(INPUT_ACTIONS, name) ||
    Object.prototype.hasOwnProperty.call(CHANGE_ACTIONS, name) ||
    Object.prototype.hasOwnProperty.call(KEY_ONLY_ACTIONS, name);

  /* 浮层的「归属区」= 锚点按钮 + 菜单本体；落在这两块之外才算点击外部 */
  function popoverRegion(popId) {
    const pop = document.getElementById(popId);
    if (!pop) return null;
    const btn = $('[aria-controls="' + popId + '"]');
    const anchor = btn ? btn.closest('.popover-anchor') : null;
    return { pop: pop, wrap: anchor || pop.parentElement };
  }

  /* 静态控件不走事件委托：它们只有一份，且要改的是 <use> 的 href 这类委托里拿不到的东西 */
  function bindStaticControls() {
    refs.loginPwdToggle.addEventListener('click', () => {
      const on = refs.loginPwdToggle.getAttribute('aria-pressed') === 'true';
      const pwd = refs.loginPassword;
      /* 切 type 会把光标弹回行首，所以记下选区再还原 */
      const start = pwd.selectionStart, end = pwd.selectionEnd;
      pwd.type = on ? 'password' : 'text';
      refs.loginPwdToggle.setAttribute('aria-pressed', on ? 'false' : 'true');
      refs.loginPwdToggle.setAttribute('aria-label', on ? '显示口令' : '隐藏口令');
      const use = $('use', refs.loginPwdToggle);
      if (use) use.setAttribute('href', on ? '#i-eye' : '#i-eye-off');
      pwd.focus({ preventScroll: true });
      try { pwd.setSelectionRange(start, end); } catch (err) { /* type=password 不支持选区时忽略 */ }
    });

    refs.navToggle.addEventListener('click', () => setNavOpen(!state.navOpen));
    refs.navScrim.addEventListener('click', () => setNavOpen(false));
    refs.drawerScrim.addEventListener('click', () => closeDrawerAndSync());
    /* 只有点在半透明遮罩上才关，点在 .form-modal 里不关 */
    refs.modalLayer.addEventListener('click', (e) => {
      if (e.target !== refs.modalLayer) return;
      closeLayer('modal');
      formName = null;
      formCtx = null;
    });
  }

  document.addEventListener('click', (e) => {
    if (openPopoverId) {
      const region = popoverRegion(openPopoverId);
      if (!region) openPopoverId = null;
      else if (!region.pop.contains(e.target) && !(region.wrap && region.wrap.contains(e.target))) {
        closePopover();
        return;
      }
    }
    if (!refs.stage.contains(e.target)) return;
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const fn = ACTIONS[el.dataset.action];
    if (!fn) {
      if (!isKnownAction(el.dataset.action)) toast('未接线的动作：' + el.dataset.action, 'warn');
      return;
    }
    /* 到这里才 preventDefault：表格里 .row-link、筛选输入框的聚焦都得留给原生行为 */
    e.preventDefault();
    fn(el, e);
  });

  document.addEventListener('input', (e) => {
    if (!refs.stage.contains(e.target)) return;
    const el = e.target.closest && e.target.closest('[data-action]');
    if (!el) return;
    const fn = INPUT_ACTIONS[el.dataset.action];
    if (fn) fn(el, e);
  });

  document.addEventListener('change', (e) => {
    if (!refs.stage.contains(e.target)) return;
    const el = e.target.closest && e.target.closest('[data-action]');
    if (!el) return;
    const fn = CHANGE_ACTIONS[el.dataset.action];
    if (fn) fn(el, e);
  });

  document.addEventListener('submit', (e) => {
    if (!refs.stage.contains(e.target)) return;
    /* 原型不落地，任何表单都不允许真的提交 */
    e.preventDefault();
    const form = e.target;
    /* 登录表单在合并单页时统一加了 admin- 前缀（客户端也有 login-form），
       这里的比较必须跟着改，否则委托永远不命中、点登录没有任何反应。 */
    if (form.id === 'admin-login-form') { doLogin(); return; }
    if (form.id === 'modal-form') { submitForm(form); return; }
    toast('未接线的表单提交：' + (form.id || '(无 id)'), 'warn');
  });

  const ARROW_STEP = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      /* 只处理落在本画布里的 ESC：同页还有客户端画布与组件示例，互不抢按键；
         全屏层自己也有一个守卫，内层浮层优先由这里消费。 */
      if (!refs.stage.contains(e.target) && !refs.stage.contains(document.activeElement)) return;
      if (openPopoverId) {
        const btn = $('[aria-controls="' + openPopoverId + '"]');
        closePopover();
        if (btn) btn.focus({ preventScroll: true });
        return;
      }
      if (state.navOpen) { setNavOpen(false); refs.navToggle.focus({ preventScroll: true }); return; }
      closeTopLayerAndSync();
      return;
    }

    if (e.key === 'Tab') {
      /* 抽屉之上还能叠弹窗，所以永远只锁最上层；没有浮层时若菜单开着就锁菜单 */
      const t = topLayer();
      if (t) { trapFocus(t.kind === 'modal' ? refs.modalBox : refs.drawer, e); return; }
      if (openPopoverId) {
        const pop = document.getElementById(openPopoverId);
        if (pop) trapFocus(pop, e);
      }
      return;
    }

    if (ARROW_STEP[e.key] && state.auth.phase === 'login') {
      const card = document.activeElement && document.activeElement.closest('#role-grid [role="radio"]');
      if (card) {
        e.preventDefault();
        const i = ROLE_ORDER.indexOf(card.dataset.role);
        const j = (i + ARROW_STEP[e.key] + ROLE_ORDER.length) % ROLE_ORDER.length;
        setLoginRole(ROLE_ORDER[j], true);
        return;
      }
    }

    const chipInput = e.target.closest && e.target.closest('[data-action="chip.add"]');
    if (!chipInput) return;
    /* 逗号既支持半角也支持全角：特质、标签是中文输入法下敲的 */
    if (e.key === 'Enter' || e.key === ',' || e.key === '，') {
      e.preventDefault();
      onChipAdd(chipInput);
      return;
    }
    if (e.key === 'Backspace' && !chipInput.value) {
      const name = chipInput.dataset.chipsFor;
      const list = currentChips(name);
      if (!list.length) return;
      e.preventDefault();
      paintChips(name, list.slice(0, -1));
      chipInput.focus({ preventScroll: true });
    }
  });

  window.addEventListener('hashchange', () => {
    const h = location.hash || '';
    /* 文档自身的分区锚点（#sec-*）不是后台路由，必须忽略：否则点一次顶部导航
       就会被 parseHash 当成未知模块，把画布渲染成 403。后台路由一律以 #/ 开头。 */
    if (h && h.indexOf('#/') !== 0) return;
    /* writeHash 会先把 currentHash 记下来，所以自己写的 hash 在这里被忽略；
       浏览器前进/后退、手改地址栏、handleApiError 直写 #/403 都对不上，照常渲染。 */
    if (h === currentHash) return;
    if (state.auth.phase !== 'shell') { currentHash = h; return; }
    renderRoute();
  });

  /* 画布宽度变化（嵌入档切换、进出全屏）由观察器驱动重算，不再听 window resize */
  new ResizeObserver(() => onResize()).observe(refs.stage);

  /* 切到后台标签页就停掉留存倒计时，避免定时器在不可见页面积压 */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stopMediaTicker(); return; }
    if (state.auth.phase === 'shell' && state.route.module === 'media') startMediaTicker();
  });

  /* ---- 12.7 启动 ---- */

  function boot() {
    seedAll();
    initStores();
    bindStaticControls();
    /* 先定布局档位：≤1199 首帧就得是图标轨，否则导航会先全展开再收缩，闪一下 */
    computeLayout();
    setLoginRole(state.auth.loginRole, false);
    renderRolePill();
    renderRoleMenu();
    renderChaosMenu();
    state.auth.phase = 'login';
    refs.loginShell.hidden = false;
    refs.adminShell.hidden = true;
    /* 文档标题由工作台入口定义；区域路由只更新自己的页头。 */
    refs.loginAccount.focus({ preventScroll: true });
  }

  window.AyaneUI.mountFilterSelects(refs.stage);
  boot();
})();

/* ============================================================
   自检清单（计划 §8 第 12 条）：JS 里出现的每个状态类名都在此对照 CSS 规则
   ------------------------------------------------------------
   classList.add / remove / toggle 驱动：
     is-loading      → .btn.is-loading、.icon-btn.is-loading        （setBusy）
     is-on           → .icon-btn.is-on、.chip.is-on                  （演示注入、分区开关）
     is-open         → .popover.is-open、.drawer.is-open、.modal-layer.is-open、
                       .sidenav.is-open、.stream-state.is-open       （浮层与连接态）
     is-visible      → .nav-scrim.is-visible、.drawer-scrim.is-visible、.toast.is-visible
     is-rail         → .admin-shell.is-rail、.sidenav.is-rail        （computeLayout）
     is-active       → .nav-item.is-active、.tab.is-active、.side-tab.is-active、
                       .role-card.is-active                          （renderNav / tabsHtml / renderRoleGrid）
     is-selected     → .data-table tbody tr.is-selected             （store.selection）
     is-new          → .data-table tbody tr.is-new、.log-line.is-new（commitAudit / appendStreamLine）
     is-placeholder  → .log-line.is-placeholder                      （repaintStream 空缓冲区提示）
     is-paused       → .console-pane.is-paused .console-body         （stream.toggle）
     is-bad          → .conn-banner.is-bad                           （injectDisconnect）
     is-alert        → .nav-badge.is-alert、.stat-card.is-alert      （renderBadges / statCard）
     is-compact      → .pagination.is-compact                        （renderPagination）
     is-invalid      → .field.is-invalid .field-ctl                  （setFieldError / clearFieldErrors）
     permission-guard / guard-tip → 同名规则（blockWithTip）
   模板字符串里拼出来的：
     is-flush → .card-body.is-flush      is-danger → .status-tag / .progress / .notice-bar /
                                            .drawer-foot / .form-modal 的 .is-danger
     is-low   → .countdown.is-low        is-warn  → .progress.is-warn
     is-error → .toast.is-error          is-mono / is-dense → .kv-list 变体
   ------------------------------------------------------------
   其余结构性不变量：
     1. 滚动所有权只有 7 处：.page-body.is-scroll、.table-scroll、.nav-scroll、
        .drawer-body、.modal-body、.console-body、.side-scroll；.admin-shell 恒 overflow:hidden。
     2. 所有 [hidden] 由 [hidden]{display:none!important} 兜底，class 优先级不能盖过它。
     3. z-index 只用变量阶梯：--z-nav 20 < --z-topbar 30 < --z-scrim 50 < --z-drawer 60
        < --z-modal 70 < --z-toast 90；.popover 取 --z-modal，.guard-tip 取 --z-topbar。
     4. 图标零 emoji：只用 <svg class="icon"><use href="#i-…"></use></svg>，
        JS 改 href 的只有口令按钮（#i-eye ↔ #i-eye-off）。
     5. 可点区域 ≥44×44 全靠 ::after 负 inset 扩展，不改盒模型尺寸。
     6. 文案省略只在 .ellipsis / .row-link 上生效，且它们必须是 td 的直接子元素
        （依赖 .data-table td > .ellipsis{display:block;min-width:0}），table 为 fixed 布局。
     7. 每次 innerHTML 重写之后必须重新 applyGuards(root)：
        renderPageHead、paintList、openDrawer、openModal、repaintFilterBar 五处已覆盖。
     8. 任何 writeHash 之后不重复渲染：go() 自己调 renderRoute，hashchange 靠 currentHash 去重。
   ============================================================ */