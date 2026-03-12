# local-qwn

`local-qwn` 是一个面向本地研发联调场景的 Qwen Agent 项目。

它基于 `Java 17 + Spring Boot 3`，提供受控工具边界、可切换模型后端、会话上下文和补丁确认流程。目标不是做一个完全放开的自治代理，而是先把本地模型接入、文件操作和请求路由做成可审计、可演进的工程底座。

## 当前能力

- 聊天接口：`POST /api/chat`
  - 支持会话上下文
  - 支持 request 级后端选择
  - 支持 request 级模型档位选择
- 运行时状态接口：`GET /api/health`
  - 展示 Spring Boot、Ollama、OpenVINO 的可达性
  - 展示当前机器档案与主后端
- 运行时选项接口：`GET /api/runtime/options`
  - 返回可用后端、模型档位与自动路由信息
- 文档接口：`GET /api/docs/{lang}`
  - 直接读取仓库中的双语 README
- 补丁确认接口：`POST /api/patch/apply`
  - 只允许应用当前会话里已经预览过的补丁
- 会话清理接口：`POST /api/session/{sessionId}/clear`
- 浏览器端工作台
  - 欢迎页
  - 聊天页
  - 文档页
  - 工具链路、补丁预览、补丁记录、健康状态面板

## 模型与路由

当前项目支持两类后端：

- `ollama`
- `openvino`

请求路由优先级：

1. 显式 `modelProfile`
2. 显式 `backend`
3. 自动判断请求类型

自动判断的基本策略：

- 编码、调试、工具规划类请求优先走编码档位
- 轻量写作、整理、翻译类请求优先走轻量档位
- 当目标后端不可用时，会尝试回退到可配置的备用后端

## 已注册工具

- `list_files`
- `read_file`
- `read_many_files`
- `search_in_files`
- `write_file`
- `preview_patch_file`
- `patch_file`

## 安全边界

当前实现刻意保持保守：

- 所有文件操作都限制在配置好的工作区根目录内
- `write_file` 仅允许创建新文件，不允许直接覆盖现有文件
- `patch_file` 必须先有同轮、同参数的 `preview_patch_file`
- 搜索、读取、补丁预览都带有限流、截断和路径校验
- 当前没有开放原始 shell 执行

## 目录说明

- `src/main/java/cn/zzy/qwen/controller`
  - HTTP API 入口
- `src/main/java/cn/zzy/qwen/service`
  - Agent 编排、后端调用、健康检查、会话状态、文档读取
- `src/main/java/cn/zzy/qwen/tools`
  - 受控工具与工作区边界
- `src/main/resources/static`
  - 前端页面、样式和交互逻辑
- `src/main/resources/machines`
  - 机器档案与运行时覆盖配置

## 快速启动

### Windows

```powershell
.\mvnw.cmd spring-boot:run
```

### macOS / Linux

```bash
./mvnw spring-boot:run
```

启动后：

- 工作台：`http://localhost:8080`
- 健康检查：`http://localhost:8080/api/health`
- 文档接口：`http://localhost:8080/api/docs/zh`

## 运行前准备

- Java 17
- 本地可用的模型后端
  - Ollama：建议至少准备 `qwen2.5-coder:14b`
  - OpenVINO：建议准备已验证的轻量模型和 Python 入口脚本

示例：

```bash
ollama pull qwen2.5-coder:14b
```

## 配置说明

项目支持共享配置和机器档案配置：

- `src/main/resources/application.yml`
- `src/main/resources/machines/common.yml`
- `src/main/resources/machines/default.yml`
- `src/main/resources/machines/<profile>.yml`

常用配置项：

- `qwen.backend.type`
- `qwen.backend.fallback-type`
- `qwen.ollama.base-url`
- `qwen.ollama.model`
- `qwen.openvino.python-exe`
- `qwen.openvino.script-path`
- `qwen.openvino.model-dir`
- `qwen.tools.workspace-root`

## 常用接口示例

### 聊天请求

```bash
curl -X POST http://localhost:8080/api/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\":\"read pom.xml\",\"sessionId\":\"demo\",\"backend\":\"auto\",\"modelProfile\":\"auto\"}"
```

### 获取运行时选项

```bash
curl http://localhost:8080/api/runtime/options
```

### 获取中文文档

```bash
curl http://localhost:8080/api/docs/zh
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

## 分支协作

推荐协作方式：

- `master`
  - 稳定发布分支
- `develop`
  - 日常集成分支
- `feature/<task>`
  - 短期任务分支

建议流程：

1. 新功能先从 `develop` 切出任务分支
2. 在任务分支完成开发和联调
3. 合并回 `develop`
4. 稳定后再进入 `master`

## 当前重点方向

- 持久化会话历史与 pending patch
- 把补丁预览从文本协议升级为结构化 diff
- 增强欢迎页、文档页和聊天页的一体化体验
- 继续优化 request 级模型路由与跨后端回退策略

