# Agent Service 架构设计

上位架构：[项目整体架构设计](项目整体架构设计.md)

产品目标：[产品愿景与总纲](../product/产品愿景与总纲.md)

## 1. 仓库定位

`ayane-agent-service` 是独立部署的后端服务，负责持续 Identity、Memory、Session 和 Agent Runtime。

服务端建议使用 Kotlin/Ktor，与 `ayane-client` 的跨平台技术体系保持一致；具体实现可以按服务端需要演进，但不能把服务端源码放入客户端仓库。

## 2. 服务边界

### Client API

- 用户登录和会话建立。
- 消息提交和流式响应。
- Identity 查询。
- Memory 查询和用户可控的记忆操作。
- Action Event Stream。

### Admin API

- 用户和角色管理。
- Identity 和 Memory 管理。
- Session 查看。
- 模型、Prompt 和功能开关配置。
- 日志、审计和运行状态查看。

Client API 和 Admin API 必须使用不同的鉴权、权限和审计规则。

## 3. 核心模块

```text
ayane-agent-service
├── Client API / WebSocket
├── Admin API
├── Identity
├── Memory
├── Session
├── Agent Runtime
├── World Model
├── Model Adapter
├── Authorization
└── Logs / Audit
```

### Identity

负责人格、偏好、关系、自我模型和长期配置。

### Memory

负责用户资料、重要事实、对话事件、关系变化和记忆检索。

### Agent Runtime

负责感知、上下文组装、推理、规划、决策和动作生成。

### World Model

负责时间、用户状态、设备存在和会话上下文。Phase 1 只维护最小上下文，不实现真实智能家居控制。

### Model Adapter

统一接入云端 OpenAI-compatible API。模型供应商可以替换，但不应影响 Identity、Memory 和 Action Protocol。

## 4. 运行链路

```text
Client
    ↓ HTTPS / WebSocket
Client API
    ↓
Agent Runtime
    ├── Identity
    ├── Memory
    ├── World Model
    └── Model Adapter
    ↓
Action Event Stream
    ↓
ayane-client
```

## 5. 数据权属与安全

- Identity 和核心 Memory 的权威数据在服务端。
- 客户端只保存缓存和临时会话状态。
- 云端 API Key 只存在于服务端 Secret 环境。
- Unity 不访问服务端数据库和模型服务。
- Admin API 的高权限操作必须记录审计事件。

## 6. 相关文档

- [Contracts 架构设计](Contracts架构设计.md)
- [客户端架构设计](客户端架构设计.md)
- [管理后台架构设计](管理后台架构设计.md)
- [基础设施架构设计](基础设施架构设计.md)
