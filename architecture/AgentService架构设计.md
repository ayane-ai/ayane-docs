# Agent Service 架构设计

上位架构：[项目整体架构设计](项目整体架构设计.md)

产品目标：[产品愿景与总纲](../product/产品愿景与总纲.md)

## 1. 仓库定位

`ayane-agent-service` 是独立部署的后端服务，负责持续 Identity、Memory、Session 和 Agent Runtime。

服务端使用 Kotlin + Spring Boot，与 `ayane-client` 共享 Kotlin 语言生态，但框架独立演进；不能把服务端源码放入客户端仓库。

## 1.1 技术选型

服务端采用 Kotlin + Spring Boot 构建，主要基于以下考虑：

- **生态成熟度**：Spring Boot 拥有成熟的企业级生态，在安全、数据访问、审计等方面提供完善支持，适合后续复杂阶段的需求。
- **模型接入简化**：通过 Spring AI（`spring-ai-starter-model-openai`）接入云端 OpenAI-compatible API，减少 Model Adapter 的开发量，并提供现成的观测能力。
- **团队熟悉度**：团队对 Spring 和 Ktor 熟悉程度相当，选择 Spring Boot 可降低学习成本。

虽然客户端使用 Kotlin Multiplatform，服务端改用 Spring Boot 会降低技术栈一致性，但 API 契约（ayane-contracts）仍能确保接口统一。Model Adapter 保持独立，未来如需替换模型供应商，只需修改适配层。

## 2. 运行链路

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

## 3. 数据权属与安全

- Identity 和核心 Memory 的权威数据在服务端。
- 客户端只保存缓存和临时会话状态。
- 云端 API Key 只存在于服务端 Secret 环境。
- Unity 不访问服务端数据库和模型服务。
- Admin API 的高权限操作必须记录审计事件。

## 4. 相关文档

- [Contracts 架构设计](Contracts架构设计.md)
- [客户端架构设计](客户端架构设计.md)
- [管理后台架构设计](管理后台架构设计.md)
- [基础设施架构设计](基础设施架构设计.md)
