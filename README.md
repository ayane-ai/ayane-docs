# Ayane Digital Life

本仓库维护二次元 AI 数字生命的产品愿景、工程架构和技术调研。当前阶段为 Phase 1 / Digital Life。

## 阅读入口

1. [产品愿景与总纲](product/产品愿景与总纲.md)：产品定义、持续身份、跨设备存在和四阶段愿景。
2. [项目整体架构设计](architecture/项目整体架构设计.md)：产品目标到工程系统的映射、仓库边界和系统链路。
3. [调研与技术选型](research/调研与技术选型.md)：调研资料入口，当前包含 [Phase 1 实现准备与 GitHub 参考项目调研](research/Phase%201%20实现准备与%20GitHub%20参考项目调研.md)。

产品愿景与总纲是目标来源，项目整体架构将目标落实为工程边界，各仓库架构进一步说明职责。调研文档提供选型参考，服从产品目标和已确认的架构决策。

## 文档目录

- `product/`：以《产品愿景与总纲》为入口，保存产品目标文档。
- `architecture/`：以《项目整体架构设计》为入口，关联七份独立仓库架构。
- `research/`：以《调研与技术选型》为入口，关联 Phase 1 等专题调研。

| 仓库 | 架构文档 | 职责 |
| --- | --- | --- |
| ayane-contracts | [Contracts 架构设计](architecture/Contracts架构设计.md) | Client API、Admin API、事件和动作契约 |
| ayane-client | [客户端架构设计](architecture/客户端架构设计.md) | 基于 NomiKit 的 Desktop、Android、iOS 统一客户端，Desktop 为主 |
| ayane-agent-service | [Agent Service 架构设计](architecture/AgentService架构设计.md) | Identity、Memory、Agent Runtime、World Model 和云端模型适配 |
| ayane-unity-embodiment | [Unity 身体架构设计](architecture/Unity身体架构设计.md) | 独立身体能力 API 和版本化 Unity 产物 |
| ayane-admin-web | [管理后台架构设计](architecture/管理后台架构设计.md) | 管理界面，通过 Admin API 访问服务端 |
| ayane-infrastructure | [基础设施架构设计](architecture/基础设施架构设计.md) | 部署、环境、Secret、CI/CD 和监控 |
| ayane-docs | [文档仓库架构设计](architecture/文档仓库架构设计.md) | 文档分层、关联与维护 |

Unity 不直接依赖 Contracts。客户端 Bridge 负责将 Agent Action Protocol 映射为 Unity Embodiment API，并引用固定版本的 Unity 产物。

## Notion 来源

- [二次元 AI 数字生命](https://app.notion.com/p/3c5670a55e4d81649e30d626312bd4fc)：对应本地产品愿景与总纲。
- [Phase 1 实现准备与 GitHub 参考项目调研](https://app.notion.com/p/3d3670a55e4d81fea3b8c6b9a97633a7)：对应本地 Phase 1 调研文档。

本地文档来自已有架构文件及用户提供的 Notion 导出包，不代表与 Notion 实时同步。

## 维护规则

- 产品目标归入 `product/`，架构约束归入 `architecture/`，调研与选型归入 `research/`。
- 产品总纲和工程架构分别保留，互不覆盖。
- 独立架构文档回链项目整体架构及产品总纲，文档间使用相对链接。
- 保留原文中的图表、代码块和示例，目录整理不改写正文。
- 不设 `archive/`；正式文件名使用中文标题，不携带 Notion 页面 ID。
- 移动或重命名文档时同步修正链接。来源差异需单独核对，不因导出时间较新而自动覆盖已确认的工程决策。

## Notion 入口映射

根 README 对应“Ayane Digital Life”根页面，其下三个入口依次为“产品愿景与总纲”“项目整体架构设计”“调研与技术选型”。

每个目录的中文入口文档作为对应父页面正文，其余文档作为该页的子文档；根目录以外不使用 README.md。普通交叉链接只用于导航，不改变页面父子关系。

完整入口映射见[文档仓库架构设计](architecture/文档仓库架构设计.md#7-notion-页面层级约定)。本次仅准备本地结构和同步约定，未修改 Notion。
