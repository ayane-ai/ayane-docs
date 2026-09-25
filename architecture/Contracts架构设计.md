# Contracts 架构设计

上位架构：[项目整体架构设计](项目整体架构设计.md)

产品目标：[产品愿景与总纲](../product/产品愿景与总纲.md)

## 1. 契约域定位

契约域是跨仓库的协议和数据契约来源，不包含业务实现，不包含客户端 UI，也不包含 Unity 工程。

Phase 1 不建立独立的 `ayane-contracts` 仓库：契约由 `ayane-agent-service` 内的 `contracts` 模块承载，见 [Agent Service 架构设计](AgentService架构设计.md)。契约作为 Client API、Admin API 和 Action Protocol 唯一来源的原则不变，独立仓库延迟到满足第 7 节触发条件后再建立。

## 2. 契约范围

契约按约束强度分为两级。

**版本化契约**（有版本承诺和兼容规则）：

- Client API。
- WebSocket Event Schema。
- Identity DTO。
- Memory DTO。
- Session DTO。
- Agent Action Protocol。
- 错误码和错误分类。
- 协议版本和兼容规则。

Identity、Memory、Session 与 Agent Action Protocol 的 DTO 以「用户 + Agent」为维度；Session 标识必须携带 Agent 标识。登录、刷新与登出端点属于版本化 Client API；客户端访问任何 Agent 维度资源时，服务端必须校验该 Agent 归属于当前登录用户。二进制音频帧、视觉帧、口型时间轴与两类帧的参数（采样率、尺寸、编码与触发策略）同属版本化范围。

**生成来源契约**（无版本承诺）：

- Admin API。

Admin API 的 OpenAPI 定义保留在契约范围内，但只作为 `ayane-admin-web` TypeScript 类型生成的唯一来源，不适用版本承诺和兼容规则：

- Admin API 唯一消费方是管理后台，服务端与其可 lockstep 演进，不存在需要防漂移的第三方。
- Admin API 变更随服务端修改同步，`ayane-admin-web` 始终按最新定义重新生成类型，不声明版本范围。
- Admin API 与 Client API 的权限隔离由 `ayane-agent-service` 的路由和鉴权设计保证，不依赖契约版本管理。

## 3. 依赖关系

```text
contracts 模块（Phase 1，位于 ayane-agent-service）
       ↓
ayane-agent-service
ayane-client
ayane-admin-web
```

Unity 不直接依赖契约。KMP 客户端负责把 Agent Action Protocol 转换为 Unity Embodiment API。

## 4. 版本规则

本节规则只适用于第 2 节的版本化契约；Admin API 作为生成来源契约不做版本承诺，始终跟随最新定义。

Phase 1 契约随 `ayane-agent-service` 版本一起演进，不启用独立发版流程；以下 SemVer 规则自契约独立成仓库后生效：

- 使用 SemVer 管理契约版本。
- 破坏性字段变更必须升级主版本。
- 可选字段和向后兼容扩展使用次版本。
- 修复描述和校验问题使用补丁版本。
- 服务端和客户端必须声明支持的契约版本范围；Admin Web 不声明版本范围。
- 音频帧与视觉帧的格式、尺寸、采样率、编码与触发策略的变更属于破坏性变更，客户端与服务端必须同步升级。

## 5. Action Protocol 边界

Action Protocol 只描述 Agent 希望身体执行的通用动作，例如说话、情绪、手势、注视和等待。

它不描述：

- Unity 具体组件名称。
- Avatar 的内部骨骼结构。
- 平台 View 或 Activity。
- Unity 工程资源路径。
- 后端数据库结构。

具体身体调用由 `ayane-client` 的 Unity Bridge 完成。

说话动作通过回复标识与音频帧关联；协议本身不承载音频字节。

视觉摘要不是动作：它经感知事件进入 Runtime，不进入 Agent Action Protocol。

## 6. 变更流程

Phase 1 契约与消费方由同一人维护，流程简化为：

```text
契约模块修改
    ↓
Agent Service / Client 适配
    ↓
Desktop / Android / iOS 验证
```

契约独立成仓库后启用完整流程：

```text
契约评审
    ↓
Contracts 发布
    ↓
Agent Service / Client 适配
    ↓
Desktop / Android / iOS 验证
```

Unity 只在 Unity Embodiment API 发生变化时单独升级，不因契约的普通字段变化而直接升级。

## 7. 契约独立的触发条件

满足以下任一条件时，把 `contracts` 模块抽出为独立的 `ayane-contracts` 仓库，并启用第 4 节 SemVer 规则和第 6 节完整流程：

- `ayane-admin-web` 开工，需要稳定的 TypeScript 类型生成来源。
- 协议趋于稳定，需要正式的版本承诺和兼容性管理。
- 出现第二名开发者，需要跨人协作的契约评审边界。

## 8. 相关文档

- [客户端架构设计](客户端架构设计.md)
- [Agent Service 架构设计](AgentService架构设计.md)
- [Unity 身体架构设计](Unity身体架构设计.md)
- [管理后台架构设计](管理后台架构设计.md)
