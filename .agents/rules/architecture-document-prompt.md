# 架构文档提示词

这是架构文档，不是实现文档。

目标文件的 `codePolicy = none`。

你只能修改架构级内容：

- 模块职责
- 依赖边界
- 数据流
- 运行模式
- 部署关系
- 端点清单
- 测试分层
- 演进条件

你不得写入：

- Kotlin / Java 代码
- 接口签名
- 类定义
- 函数实现
- Ktor Application.module
- Koin modules
- Exposed transaction
- Gradle 脚本
- Version Catalog
- YAML / HOCON 配置
- Bash 代码块

包结构和接口能力必须用表格或列表表达。
只允许 Mermaid 和纯文本拓扑图代码块。
启动命令和 API 路径必须使用行内代码。
如果任务中提供了代码示例，只能用于理解方案，不得复制进目标架构文档。
修改完成后检查目标文档是否出现禁止代码块或实现 API。