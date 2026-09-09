# Contracts 架构设计

上位架构：[项目整体架构设计](项目整体架构设计.md)

产品目标：[产品愿景与总纲](../product/产品愿景与总纲.md)

## 1. 仓库定位

`ayane-contracts` 是跨仓库的协议和数据契约来源，不包含业务实现，不包含客户端 UI，也不包含 Unity 工程。

## 2. 契约范围

- Client API。
- Admin API。
- WebSocket Event Schema。
- Identity DTO。
- Memory DTO。
- Session DTO。
- Agent Action Protocol。
- 错误码和错误分类。
- 协议版本和兼容规则。

## 3. 依赖关系

```text
ayane-contracts
       ↓
ayane-agent-service
ayane-client
ayane-admin-web
```

Unity 不直接依赖 `ayane-contracts`。KMP 客户端负责把 Agent Action Protocol 转换为 Unity Embodiment API。

## 4. 版本规则

- 使用 SemVer 管理契约版本。
- 破坏性字段变更必须升级主版本。
- 可选字段和向后兼容扩展使用次版本。
- 修复描述和校验问题使用补丁版本。
- 服务端、客户端和 Admin Web 必须声明支持的契约版本范围。

## 5. Action Protocol 边界

Action Protocol 只描述 Agent 希望身体执行的通用动作，例如说话、情绪、手势、注视和等待。

它不描述：

- Unity 具体组件名称。
- Avatar 的内部骨骼结构。
- 平台 View 或 Activity。
- Unity 工程资源路径。
- 后端数据库结构。

具体身体调用由 `ayane-client` 的 Unity Bridge 完成。

## 6. 变更流程

```text
契约评审
    ↓
Contracts 发布
    ↓
Agent Service / Client 适配
    ↓
Desktop / Android / iOS 验证
```

Unity 只在 Unity Embodiment API 发生变化时单独升级，不因 Contracts 的普通字段变化而直接升级。

## 7. 相关文档

- [客户端架构设计](客户端架构设计.md)
- [AgentService 架构设计](AgentService架构设计.md)
- [Unity 身体架构设计](Unity身体架构设计.md)
- [管理后台架构设计](管理后台架构设计.md)
