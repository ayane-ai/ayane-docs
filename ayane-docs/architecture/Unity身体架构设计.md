# Unity 身体架构设计

上位架构：[项目整体架构设计](项目整体架构设计.md)

产品目标：[产品愿景与总纲](../product/产品愿景与总纲.md)

## 1. 仓库定位

`ayane-unity-embodiment` 是独立 Unity 仓库，负责 AI 在数字空间中的身体表现。

它可以独立构建和测试，不依赖 `ayane-contracts`、`ayane-agent-service` 或 `ayane-client` 源码。

## 2. Unity 职责

- VRM Avatar。
- 3D 场景。
- Animation。
- Facial Expression。
- BlendShape。
- Lip Sync。
- Gesture。
- Camera。
- 3D Audio。
- Unity Embodiment API。

Unity 不负责：

- AI Identity。
- Memory。
- Session。
- Prompt。
- LLM 调用。
- 用户账号。
- 后端数据库。
- Agent Action Protocol 的解析。

## 3. 对外产物

```text
ayane-unity-embodiment
       ↓ 独立构建
├── Desktop Unity Runtime
├── Android Unity Library
└── iOS Unity Framework
```

客户端通过各自的 Unity Bridge 固定引用对应产物。

## 4. 集成边界

```text
Agent Action Protocol
        ↓
ayane-client Unity Bridge
        ↓
Unity Embodiment API
        ↓
Avatar / Animation / Emotion / Gesture / Lip Sync
```

Unity 只接受身体能力调用，不直接理解后端的 Identity、Memory 和业务状态。

## 5. 平台接入

### Desktop

优先使用独立 Unity Runtime 和本地通信方式。客户端负责启动、停止、重连和异常恢复。

### Android

使用 Unity 导出的 Android Library。Android Bridge 负责容器、Activity 生命周期和资源管理。

### iOS

使用 Unity 导出的 iOS Framework。iOS Bridge 负责 Framework 加载、UIViewController 生命周期和音频会话。

## 6. 版本规则

- Unity Embodiment API 独立版本化。
- Desktop Runtime、Android Library、iOS Framework 维护兼容版本表。
- 客户端只引用固定版本产物。
- 不使用 Unity 工程源码作为客户端长期依赖。
- 不使用 Git Submodule 代替正式产物发布。

## 7. 相关文档

- [客户端架构设计](客户端架构设计.md)
- [Contracts 架构设计](Contracts架构设计.md)
- [AgentService 架构设计](AgentService架构设计.md)
- [基础设施架构设计](基础设施架构设计.md)
