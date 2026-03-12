# local-qwn

`local-qwn` 是一个基于 Java 17、Spring Boot 3 和 Ollama 的本地 Qwen Agent 项目。

它的目标不是做一个“完全放开权限”的自动化代理，而是先构建一层可控、可审计、可逐步扩展的本地执行边界，包括：

- 聊天接口
- 受控文件工具
- patch 预览与确认应用
- 健康检查与前端可视化
- 会话记忆与工具执行轨迹

## 核心能力

- `POST /api/chat`
  - 通过受限多步 agent loop 调用本地 Ollama 模型
- `GET /api/health`
  - 检查 Spring Boot 进程与 Ollama 可达性
- `POST /api/patch/apply`
  - 只允许应用当前会话里已预览的 pending patch
- `POST /api/session/{sessionId}/clear`
  - 清理当前会话上下文与待确认 patch
- 浏览器前端
  - 聊天面板、工具轨迹、健康状态、patch 预览与确认历史

当前已注册工具：

- `list_files`
- `read_file`
- `read_many_files`
- `search_in_files`
- `write_file`
- `preview_patch_file`
- `patch_file`

## 安全边界

这个项目当前刻意保持保守。

- 所有文件操作都限制在配置的工作区根目录下
- `patch_file` 必须先有同一轮、同参数的 `preview_patch_file`
- `write_file` 只允许创建新文件，不允许直接覆盖已有文件
- 读取、搜索和 patch 都有文件大小、目录遍历、输出截断等保护
- 当前没有开放原始 shell 执行

## 系统结构

整体结构可以概括为：

`Browser UI -> Spring Boot API -> Agent Loop -> Tool Registry -> Workspace / Ollama`

主要模块：

- `src/main/java/cn/zzy/qwen/controller`
  - REST API 入口
- `src/main/java/cn/zzy/qwen/service`
  - Agent 编排、Ollama 调用、健康检查、会话与 patch 状态
- `src/main/java/cn/zzy/qwen/tools`
  - 受控文件工具与工作区边界
- `src/main/resources/static`
  - 前端页面、样式和交互逻辑

## 环境要求

- Java 17
- Ollama
- 已拉取本地模型，例如：

```bash
ollama pull qwen2.5-coder:14b
```

## 配置

默认配置位于：

- `src/main/resources/application.yml`

关键配置项：

- `qwen.ollama.base-url`
- `qwen.ollama.model`
- `qwen.ollama.timeout-seconds`
- `qwen.tools.workspace-root`

如果项目目录发生变化，请同步更新 `workspace-root`。

## 快速启动

### Windows

```powershell
.\mvnw.cmd spring-boot:run
```

### macOS / Linux

```bash
./mvnw spring-boot:run
```

启动后访问：

- 前端页面：`http://localhost:8080`
- 健康检查：`http://localhost:8080/api/health`

## 接口示例

### 发送聊天请求

```bash
curl -X POST http://localhost:8080/api/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\":\"read pom.xml\",\"sessionId\":\"demo\"}"
```

### 健康检查

```bash
curl http://localhost:8080/api/health
```

## 测试

### Windows

```powershell
.\mvnw.cmd test
```

### macOS / Linux

```bash
./mvnw test
```

## 分支策略

当前仓库采用下面的协作方式：

- `master`
  - 稳定发布分支
- `develop`
  - 日常开发与多终端同步分支

建议流程：

1. 新修改先进入 `develop`
2. 多终端在 `develop` 上同步和对齐
3. 功能稳定后再合并到 `master`

## 当前改进方向

- 持久化会话历史与 pending patch
- 把 patch 预览协议从纯文本升级为结构化 diff 数据
- 增加更强的项目摘要 / code map 能力
- 后续再考虑白名单 shell、RAG 与流式输出

## 贡献

欢迎在 `develop` 分支基础上继续迭代这个项目。

如果你准备提交改动，建议附带：

- 变更说明
- 关键接口影响
- 测试结果
- 是否涉及安全边界调整
