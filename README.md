# 鸿栀 v1.0.0

`鸿栀` 当前是一个本地优先的情感陪护机器人原型仓库。

它还不是完整的 A22 多模态数字人系统，当前阶段的目标是先把下面几件事做扎实：

- 验证本地部署与本地推理是否稳定可用
- 验证受控工具调用与边界化文件修改
- 验证浏览器工作台在普通硬件上的可用性
- 验证 `Ollama` 与 `OpenVINO` 间的本地后端路由

长期方向对齐第十七届中国大学生服务外包创新创业大赛 A22 题，逐步演进为“基于 AI 大语言模型的情感陪护虚拟数字人系统”。

## 当前版本定位

- 版本：`v1.0.0`
- 描述：`情感陪护机器人原型`
- 阶段：本地能力验证 + 前端结构收束

当前版本强调：

- 中文优先
- 本地优先
- 安全边界优先
- 文档同源优先

## 当前产品面

### 浏览器工作台

前端由 `Spring Boot` 直接托管，使用本地 vendored `Vue 3` 实现单页工作台，主入口位于 `src/main/resources/static`。

当前包含三个主视图：

- 总览
  - 以蓝白报告型结构展示项目定位、输入边界、流程分析、后端对比与运行说明
- 工作台
  - 提供聊天、运行态选择、健康状态、执行链路、补丁预览与补丁确认
- 手册
  - 直接读取 `README.md / README.en.md`
  - 支持章节索引、标题锚点、阅读进度与章节摘要

### 后端能力

当前 HTTP 接口：

- `POST /api/chat`
- `GET /api/health`
- `GET /api/runtime/options`
- `GET /api/docs/{language}`
- `POST /api/patch/apply`
- `POST /api/session/{sessionId}/clear`

当前注册工具：

- `list_files`
- `read_file`
- `read_many_files`
- `search_in_files`
- `write_file`
- `preview_patch_file`
- `patch_file`

## 当前前端结构

```text
src/main/resources/static
├─ index.html
├─ styles.css
├─ app.js
├─ vendor/
│  └─ vue.global.prod.js
├─ scripts/
│  ├─ core.js
│  ├─ markdown.js
│  └─ vue/
│     └─ workspace-app.js
└─ styles/
   ├─ base.css
   ├─ welcome.css
   ├─ chat.css
   └─ docs.css
```

说明：

- `core.js`
  - 前端通用请求、格式化与文档语言工具
- `markdown.js`
  - README 渲染、标题提取、阅读时长估算
- `workspace-app.js`
  - Vue 工作台状态、视图切换、接口编排、滚动联动
- `styles/*.css`
  - 共享视觉层与视图样式拆分

## 模型后端与路由

当前支持两类本地后端：

- `ollama`
- `openvino`

请求选择优先级：

1. 显式 `modelProfile`
2. 显式 `backend`
3. 后端自动分类

当前经验结论：

- `Ollama`
  - 更适合代码理解、补丁修改、复杂工具链联调
- `OpenVINO`
  - 更适合轻量写作、本地推理验证与普通硬件部署实验

重要限制：

- 当前 `OpenVINO` 路径已经验证可运行
- 但它还不是 `Ollama` 的编码任务等价替代

## 安全边界

仓库当前有意保持保守：

- 文件操作限制在配置的工作区根目录内
- 禁止路径穿越
- `write_file` 仅允许创建，不覆盖已有文件
- `patch_file` 必须基于同会话预览结果
- 当前没有开放原始 shell 给模型直接执行

不要为了演示效果破坏这些边界。

## 运行环境

- `Java 17`
- `Spring Boot 3`
- 至少一个可用本地后端
  - `Ollama`
  - 或 `OpenVINO` 本地 Python 推理路径

当前已验证的 OpenVINO 关键信息：

- wrapper: `${user.dir}/scripts/openvino/run_genai.py`
- validated machine profile: `redmibook14`
- validated model: `qwen2.5-1.5b-instruct-int4-ov`
- preferred device: `NPU`

## 快速启动

### Windows

```powershell
.\mvnw.cmd spring-boot:run
```

### macOS / Linux

```bash
./mvnw spring-boot:run
```

启动后入口：

- 工作台：`http://localhost:8080`
- 健康检查：`http://localhost:8080/api/health`
- 中文手册：`http://localhost:8080/api/docs/zh`
- 英文手册：`http://localhost:8080/api/docs/en`

## 常用验证

### 前端语法检查

```powershell
node --check src/main/resources/static/app.js
node --check src/main/resources/static/scripts/core.js
node --check src/main/resources/static/scripts/markdown.js
node --check src/main/resources/static/scripts/vue/workspace-app.js
```

### 后端回归

```powershell
.\mvnw.cmd test
```

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

### 获取中文手册

```bash
curl http://localhost:8080/api/docs/zh
```

## 配置文件

共享与机器覆盖配置：

- `src/main/resources/application.yml`
- `src/main/resources/machines/common.yml`
- `src/main/resources/machines/default.yml`
- `src/main/resources/machines/<profile>.yml`

常用键：

- `qwen.backend.type`
- `qwen.backend.fallback-type`
- `qwen.ollama.base-url`
- `qwen.ollama.model`
- `qwen.openvino.python-exe`
- `qwen.openvino.script-path`
- `qwen.openvino.model-dir`
- `qwen.tools.workspace-root`

## 当前仍缺的能力

这几项已经在前端保留结构位，但当前版本没有假装实现：

- 语音模式入口
- 麦克风 / 摄像头状态读取
- 数字人状态区
- 情绪理解 / 干预结构化结果

## 近期演进方向

- 持久化会话历史与 pending patch
- 将补丁预览升级为结构化 payload
- 为 `ASR / TTS / avatar / emotion-state` 预留更明确 contract
- 继续提高本地推理、文档阅读与工作台联调的一体化程度

## 分支协作

推荐分支模型：

- `master`
  - 稳定发布
- `develop`
  - 日常集成
- `feature/<task>`
  - 短期任务分支

当前前后端仍处于单仓协作阶段，建议在共享基线下分支并行开发，而不是创建长期设备专属分支。
