window.HongzhiFrontend = window.HongzhiFrontend || {};

window.HongzhiFrontend.createWorkspaceApp = () => {
  const utils = window.HongzhiFrontend.utils;
  const markdown = window.HongzhiFrontend.markdown;

  const TOP_HEALTH_LABELS = {
    idle: "未检查",
    checking: "检查中",
    ok: "系统正常",
    degraded: "部分降级",
    fail: "状态异常"
  };

  const BADGE_LABELS = {
    idle: "未检查",
    checking: "检查中",
    ok: "健康",
    degraded: "降级",
    fail: "异常"
  };

  const VIEW_LABELS = {
    welcome: "总览",
    chat: "工作台",
    docs: "手册"
  };

  const NAV_ITEMS = [
    { id: "welcome", label: "总览", note: "项目定位、流程与对比" },
    { id: "chat", label: "工作台", note: "请求路由、对话与补丁确认" },
    { id: "docs", label: "手册", note: "README 同源阅读与章节导航" }
  ];

  const VIEW_SECTIONS = {
    welcome: [
      { anchor: "welcome-hero", label: "概览" },
      { anchor: "welcome-inputs", label: "输入与边界" },
      { anchor: "welcome-workflow", label: "流程分析" },
      { anchor: "welcome-compare", label: "后端对比" },
      { anchor: "welcome-run", label: "运行说明" }
    ],
    chat: [
      { anchor: "chat-runtime", label: "运行态" },
      { anchor: "chat-signals", label: "扩展位" },
      { anchor: "chat-conversation", label: "会话" },
      { anchor: "chat-patch", label: "补丁确认" }
    ],
    docs: [
      { anchor: "docs-overview", label: "概览" },
      { anchor: "docs-reader", label: "正文" }
    ]
  };

  const WELCOME_INPUT_CARDS = [
    {
      id: "source",
      title: "输入源",
      description: "当前前端真正依赖的数据入口。",
      items: ["README.md / README.en.md", "GET /api/runtime/options", "GET /api/health"]
    },
    {
      id: "boundary",
      title: "执行边界",
      description: "当前系统已经明确的安全约束。",
      items: ["文件操作限定在工作区内部", "补丁必须先预览再确认应用", "不提供给模型直接 raw shell 执行"]
    },
    {
      id: "goal",
      title: "当前目标",
      description: "强调阶段性验证，不假装已经完成 A22 全量能力。",
      items: ["验证本地部署与本地推理", "验证受控工具调用与多后端路由", "为鸿栀后续多模态链路预留扩展位"]
    }
  ];

  const WORKFLOW_STEPS = [
    {
      id: "runtime",
      label: "运行态识别",
      title: "先确认机器、后端与默认档位",
      description: "所有联调都应该从运行态开始，避免误判当前请求会走哪条链路。",
      input: "机器档案、后端配置、模型档位",
      output: "当前主后端、默认代码档位、回退链路",
      note: "OpenVINO 已验证本地轻量推理，但现在还不是 Ollama 的编码等价替代。"
    },
    {
      id: "docs",
      label: "文档同步",
      title: "直接从 README 建立项目上下文",
      description: "手册页直接读取仓库 README，减少说明文字与实际代码长期分叉。",
      input: "README.md / README.en.md",
      output: "章节索引、阅读进度、运行说明",
      note: "适合先扫读结构与边界，再决定是否进入聊天联调。"
    },
    {
      id: "chat",
      label: "请求联调",
      title: "在受控工作台里发起实际请求",
      description: "保留后端选择、档位选择、trace 和工具链反馈，但不再拆成多块互相抢焦点的面板。",
      input: "自然语言请求、后端偏好、模型档位",
      output: "回答内容、工具使用记录、执行链路",
      note: "中文优先，保留自动路由和回退能力。"
    },
    {
      id: "patch",
      label: "补丁确认",
      title: "所有写入仍通过预览与确认",
      description: "前端不跳过补丁信任边界，让写入操作保持可读、可审查、可回顾。",
      input: "pendingPatch、patch preview、sessionId",
      output: "应用结果、失败原因、补丁记录",
      note: "这是当前工作台最重要的可信边界之一。"
    }
  ];

  const BACKEND_COMPARISON = [
    {
      id: "ollama",
      name: "Ollama",
      emphasis: "当前更适合编码联调",
      principle: "作为当前本地大模型主链路，更适合复杂推理、代码理解和补丁相关任务。",
      advantages: ["编码任务适配度更高", "联调路径更成熟", "适合作为当前默认主后端"],
      limits: ["资源占用更高", "对普通硬件压力更明显"],
      linkage: "当请求偏向代码理解、补丁修改或复杂工具链时，更适合优先保持在这条路线。"
    },
    {
      id: "openvino",
      name: "OpenVINO",
      emphasis: "当前更偏轻量本地验证",
      principle: "通过本地 Python 进程完成推理，已经验证普通设备上的轻量本地部署可行性。",
      advantages: ["更强调本地部署可达性", "适合轻量写作和助手场景", "为后续端侧路线保留空间"],
      limits: ["当前不是 Ollama 的编码等价替代", "更依赖特定设备与模型验证环境"],
      linkage: "当目标是验证端侧推理链路、设备适配或低成本运行时，这条路线更有价值。"
    }
  ];

  const RUN_GUIDE_CARDS = [
    {
      id: "entry",
      title: "入口与内容源",
      path: "src/main/resources/static/index.html",
      description: "前端由 Spring Boot 直接托管，手册内容以 README.md / README.en.md 为唯一同源来源。"
    },
    {
      id: "check",
      title: "最小检查顺序",
      path: "GET /api/health → GET /api/runtime/options → GET /api/docs/{language}",
      description: "先确认健康与路由，再进入手册或聊天联调，不要反过来。"
    },
    {
      id: "write",
      title: "写入链路",
      path: "POST /api/chat → pendingPatch → POST /api/patch/apply",
      description: "任何代码修改仍经过预览与确认，不允许直接跳过。"
    }
  ];

  const RESERVE_CARDS = [
    { id: "voice", title: "语音模式入口", description: "界面保留模式切换位，但当前不接通 ASR / TTS。", status: "现状：仅文本" },
    { id: "device", title: "麦克风 / 摄像头状态", description: "结构位已预留，前端不伪造本机设备状态。", status: "现状：未采集" },
    { id: "avatar", title: "数字人状态区", description: "后续可接立绘、口型、表情或 2D / 3D 驱动，现在只保留占位结构。", status: "现状：占位" },
    { id: "emotion", title: "情绪理解 / 干预结果", description: "为未来风险识别、干预建议与再评估结果预留前端承接位置。", status: "现状：等待接口" }
  ];

  const CHAT_SUGGESTIONS = [
    { id: "overview", label: "项目概览", message: "请列出项目根目录的关键文件，并用中文总结当前能力。" },
    { id: "architecture", label: "解释架构", message: "请读取 pom.xml，并用中文解释当前前后端结构。" },
    { id: "runtime", label: "检查运行时", message: "请根据当前运行时配置说明这次请求大概率会走哪个后端。" },
    { id: "next-step", label: "继续联调", message: "请基于当前 README 总结前后端职责边界，并给出下一步联调重点。" }
  ];

  const SIGNAL_CARDS = [
    { id: "voice", label: "语音模式", title: "入口已预留", description: "未来可接 ASR / TTS；当前只接收文本输入并返回文本结果。" },
    { id: "device", label: "设备状态", title: "暂不读取本机采集能力", description: "麦克风和摄像头只保留结构位，不伪造已连接效果。" },
    { id: "avatar", label: "数字人状态", title: "等待头像驱动链路", description: "后续可接 2D / 3D 形象、口型与表情驱动，当前没有对应接口。" },
    { id: "emotion", label: "情绪理解 / 干预", title: "等待结构化结果", description: "这里将来用于承接风险判断、干预建议和再评估结果，当前接口尚未提供。" }
  ];

  const DOCS_LANGUAGES = [
    { id: "zh", label: "中文" },
    { id: "en", label: "English" }
  ];

  const DOCS_PIPELINE_STEPS = [
    {
      id: "source",
      title: "README 源文件",
      description: "正文直接来自仓库 README.md / README.en.md。"
    },
    {
      id: "render",
      title: "前端解析",
      description: "本地 Markdown 渲染负责标题、列表、代码块和引用块结构。"
    },
    {
      id: "reading",
      title: "阅读联动",
      description: "章节索引、阅读进度和当前锚点保持同步。"
    },
    {
      id: "handoff",
      title: "带着手册去工作台",
      description: "从文档页直接切回聊天页，继续联调或提问。"
    }
  ];

  function createPlainHtml(text) {
    return `<p>${utils.escapeHtml(String(text || "")).replace(/\n/g, "<br>")}</p>`;
  }

  function createMarkdownHtml(text) {
    const rendered = markdown.renderMarkdown(text || "");
    return rendered.html || createPlainHtml(text || "");
  }

  function createInitialRuntimeSummary() {
    return {
      welcomeMachine: "读取中",
      welcomeBackend: "读取中",
      welcomeCodeProfile: "读取中",
      welcomeGeneralProfile: "读取中",
      welcomeHint: "正在读取运行时选项...",
      welcomeHintError: false,
      machineProfile: "读取中",
      backend: "读取中",
      model: "读取中",
      fallback: "读取中",
      modelProfile: "读取中",
      modelBackend: "读取中",
      modelFull: "读取中",
      hint: "正在读取运行时选项...",
      hintError: false
    };
  }

  function createInitialHealthState() {
    return {
      visual: "idle",
      detail: "等待健康检查",
      headline: "等待健康检查",
      summary: "这里会显示当前应用、主后端以及两个推理通道的状态。",
      spring: "未检查",
      backend: "未检查",
      ollama: "未检查",
      openvino: "未检查"
    };
  }

  function createInitialDocsState() {
    return {
      title: "项目说明",
      meta: "点击“阅读手册”后会直接加载仓库 README。",
      renderMode: "placeholder",
      html: "",
      errorMessage: "",
      readingTime: "--",
      progress: 0
    };
  }

  return {
    data() {
      return {
        utils,
        navItems: NAV_ITEMS,
        welcomeInputCards: WELCOME_INPUT_CARDS,
        workflowSteps: WORKFLOW_STEPS,
        backendComparison: BACKEND_COMPARISON,
        runGuideCards: RUN_GUIDE_CARDS,
        reserveCards: RESERVE_CARDS,
        chatSuggestions: CHAT_SUGGESTIONS,
        signalCards: SIGNAL_CARDS,
        docsLanguages: DOCS_LANGUAGES,
        docsPipelineSteps: DOCS_PIPELINE_STEPS,
        currentView: "welcome",
        activeWorkflowStepId: WORKFLOW_STEPS[0].id,
        activeViewAnchor: VIEW_SECTIONS.welcome[0].anchor,
        sessionId: crypto.randomUUID(),
        runtimeOptions: null,
        selectedBackend: "auto",
        selectedModelProfile: "auto",
        runtimeSummary: createInitialRuntimeSummary(),
        healthState: createInitialHealthState(),
        lastTrace: [],
        lastToolsUsed: [],
        pendingPatch: null,
        patchHistory: [],
        chatMessages: [],
        composerText: "",
        requestStatusTone: "idle",
        requestStatusText: "状态：就绪",
        isSubmitting: false,
        isApplyingPatch: false,
        isHealthChecking: false,
        isResettingSession: false,
        traceVisible: false,
        docsLanguage: "zh",
        docsStatus: "未加载",
        docsCache: {},
        docsHeadings: [],
        docsOutlineFilter: "",
        activeDocsAnchor: "",
        docsState: createInitialDocsState(),
        toasts: [],
        viewScroll: { welcome: 0, chat: 0, docs: 0 },
        showBackToTop: false
      };
    },

    computed: {
      topHealthLabel() {
        return TOP_HEALTH_LABELS[this.healthState.visual] || TOP_HEALTH_LABELS.fail;
      },

      healthBadgeLabel() {
        return BADGE_LABELS[this.healthState.visual] || BADGE_LABELS.fail;
      },

      currentOutlineEyebrow() {
        return this.currentView === "docs" ? "文档章节" : "页面锚点";
      },

      currentOutlineTitle() {
        return this.currentView === "docs" ? "章节索引" : "页面导航";
      },

      currentOutlineItems() {
        if (this.currentView === "docs") {
          return this.docsHeadings.length ? this.filteredDocsHeadings : VIEW_SECTIONS.docs;
        }
        if (this.currentView === "chat") {
          return VIEW_SECTIONS.chat.filter((item) => item.anchor !== "chat-patch" || this.pendingPatch || this.patchHistory.length);
        }
        return VIEW_SECTIONS[this.currentView] || [];
      },

      currentActiveAnchor() {
        return this.currentView === "docs" ? this.activeDocsAnchor : this.activeViewAnchor;
      },

      activeWorkflowStep() {
        return this.workflowSteps.find((item) => item.id === this.activeWorkflowStepId) || this.workflowSteps[0];
      },

      heroMetrics() {
        const backendValue = this.healthState.backend !== "未检查"
          ? this.healthState.backend
          : this.runtimeSummary.welcomeBackend;

        return [
          {
            label: "主后端",
            value: backendValue,
            note: this.healthState.visual === "idle" ? "等待健康检查完成" : "来自 /api/health 与运行时摘要"
          },
          {
            label: "默认代码档位",
            value: this.runtimeSummary.welcomeCodeProfile,
            note: "来自 /api/runtime/options"
          },
          {
            label: "写入边界",
            value: this.pendingPatch ? "有待确认补丁" : "预览前不写入",
            note: this.pendingPatch?.path ? utils.shortenPath(this.pendingPatch.path) : "仍通过 preview + apply"
          }
        ];
      },

      backendOptions() {
        const items = [{ value: "auto", label: "自动" }];
        for (const backend of this.runtimeOptions?.availableBackends || []) {
          if (backend) {
            items.push({ value: backend, label: utils.formatBackendLabel(backend) });
          }
        }
        return items;
      },

      modelProfileOptions() {
        const items = [{ value: "auto", label: "自动" }];
        for (const profile of this.runtimeOptions?.modelProfiles || []) {
          if (!profile?.id) {
            continue;
          }
          const suffix = profile.backend ? ` · ${utils.formatBackendLabel(profile.backend)}` : "";
          items.push({ value: profile.id, label: `${profile.displayName || profile.id}${suffix}` });
        }
        return items;
      },

      filteredDocsHeadings() {
        const keyword = this.docsOutlineFilter.trim().toLowerCase();
        if (!keyword) {
          return this.docsHeadings;
        }
        return this.docsHeadings.filter((heading) => heading.text.toLowerCase().includes(keyword));
      },

      traceText() {
        return this.lastTrace.length ? this.lastTrace.join("\n\n") : "当前还没有可显示的执行链路。";
      },

      traceButtonText() {
        return this.lastTrace.length ? `查看执行链路 (${this.lastTrace.length})` : "查看执行链路";
      },

      patchMetaItems() {
        const items = [];
        if (this.pendingPatch?.path) {
          items.push(`文件：${this.pendingPatch.path}`);
        }
        if (this.pendingPatch?.patchId) {
          items.push(`Patch ID：${this.pendingPatch.patchId}`);
        }
        return items;
      },

      docsProgressText() {
        return `${Math.round(this.docsState.progress)}%`;
      },

      docsSourceName() {
        return utils.getDocsSourceName(this.docsLanguage);
      },

      docsSummaryCards() {
        if (!this.docsHeadings.length) {
          return [];
        }

        return this.docsHeadings.slice(0, 6).map((heading, index) => ({
          anchor: heading.anchor,
          title: heading.text,
          levelLabel: `H${heading.level}`,
          index: String(index + 1).padStart(2, "0")
        }));
      }
    },

    methods: {
      formatBackendLabel(backend) {
        return utils.formatBackendLabel(backend);
      },

      formatProfileLabel(profileId) {
        if (!profileId || profileId === "auto") {
          return "自动";
        }
        const profile = this.findProfileOption(profileId);
        return profile?.displayName || profileId;
      },

      getDocsLanguageLabel(language) {
        return utils.getDocsLanguageLabel(language);
      },

      getPatchHistoryTone(success) {
        return success ? "success" : "fail";
      },

      getPatchHistoryLabel(success) {
        return success ? "成功" : "失败";
      },

      findProfileOption(profileId) {
        if (!this.runtimeOptions || !Array.isArray(this.runtimeOptions.modelProfiles)) {
          return null;
        }
        return this.runtimeOptions.modelProfiles.find((profile) => profile.id === profileId) || null;
      },

      resolveDefaultProfileId(backend) {
        if (!this.runtimeOptions) {
          return "auto";
        }
        if (backend && backend !== "auto") {
          return this.runtimeOptions.defaultProfilesByBackend?.[backend] || this.runtimeOptions.autoCodeProfile || "auto";
        }
        return this.runtimeOptions.autoCodeProfile || "auto";
      },
      updateRuntimeSummaryFromOptions() {
        if (!this.runtimeOptions) {
          return;
        }

        const availableBackends = this.runtimeOptions.availableBackends || [];
        if (this.selectedBackend !== "auto" && !availableBackends.includes(this.selectedBackend)) {
          this.selectedBackend = "auto";
        }

        if (this.selectedModelProfile !== "auto" && !this.findProfileOption(this.selectedModelProfile)) {
          this.selectedModelProfile = "auto";
        }

        const selectedBackend = this.selectedBackend || "auto";
        const selectedProfileId = this.selectedModelProfile || "auto";
        const derivedProfileId = selectedProfileId === "auto"
          ? this.resolveDefaultProfileId(selectedBackend)
          : selectedProfileId;
        const profile = this.findProfileOption(derivedProfileId);
        const resolvedBackend = selectedBackend === "auto"
          ? (profile?.backend || this.runtimeOptions.configuredBackend || "auto")
          : selectedBackend;
        const modeLabel = selectedProfileId === "auto" ? "当前按默认档位推断" : "当前按手动档位锁定";

        this.runtimeSummary.welcomeMachine = this.runtimeOptions.machineProfile || "未标注";
        this.runtimeSummary.welcomeBackend = utils.formatBackendLabel(this.runtimeOptions.configuredBackend || "auto");
        this.runtimeSummary.welcomeCodeProfile = this.formatProfileLabel(this.runtimeOptions.autoCodeProfile || "auto");
        this.runtimeSummary.welcomeGeneralProfile = this.formatProfileLabel(this.runtimeOptions.autoGeneralProfile || "auto");
        this.runtimeSummary.welcomeHint = `默认主后端为 ${utils.formatBackendLabel(this.runtimeOptions.configuredBackend || "auto")}，代码档位为 ${this.formatProfileLabel(this.runtimeOptions.autoCodeProfile || "auto")}，通用档位为 ${this.formatProfileLabel(this.runtimeOptions.autoGeneralProfile || "auto")}。`;
        this.runtimeSummary.welcomeHintError = false;

        this.runtimeSummary.machineProfile = this.runtimeOptions.machineProfile || "未标注";
        this.runtimeSummary.backend = utils.formatBackendLabel(resolvedBackend);
        this.runtimeSummary.model = this.formatProfileLabel(derivedProfileId);
        this.runtimeSummary.fallback = utils.formatFallbackLabel(this.runtimeOptions.configuredFallbackBackend);
        this.runtimeSummary.modelProfile = this.formatProfileLabel(derivedProfileId);
        this.runtimeSummary.modelBackend = utils.formatBackendLabel(profile?.backend || resolvedBackend);
        this.runtimeSummary.modelFull = profile?.model || "由后端按请求类型自动决定";
        this.runtimeSummary.hint = `${modeLabel}，仍保留后端自动路由与回退能力。`;
        this.runtimeSummary.hintError = false;
      },

      updateResolvedRuntime(response) {
        const resolvedBackend = response.backend || this.selectedBackend || this.runtimeOptions?.configuredBackend || "auto";
        const resolvedProfileId = response.modelProfile || this.selectedModelProfile || this.resolveDefaultProfileId(resolvedBackend);
        const profile = this.findProfileOption(resolvedProfileId);
        const fallbackText = response.fallbackUsed ? "本次请求触发了回退链路。" : "本次请求未触发回退。";
        const selectionMode = utils.localizeSelectionMode(response.selectionMode);
        const selectionReason = response.selectionReason ? ` 原因：${response.selectionReason}` : "";

        this.runtimeSummary.backend = utils.formatBackendLabel(resolvedBackend);
        this.runtimeSummary.model = this.formatProfileLabel(resolvedProfileId);
        this.runtimeSummary.fallback = utils.formatFallbackLabel(this.runtimeOptions?.configuredFallbackBackend);
        this.runtimeSummary.modelProfile = this.formatProfileLabel(resolvedProfileId);
        this.runtimeSummary.modelBackend = utils.formatBackendLabel(profile?.backend || resolvedBackend);
        this.runtimeSummary.modelFull = response.model || profile?.model || "未返回模型标识";
        this.runtimeSummary.hint = `本次命中 ${utils.formatBackendLabel(resolvedBackend)} / ${this.formatProfileLabel(resolvedProfileId)}，${selectionMode}。${fallbackText}${selectionReason}`;
        this.runtimeSummary.hintError = false;
      },

      mapHealthState(status) {
        if (status === "healthy") {
          return "ok";
        }
        if (status === "degraded") {
          return "degraded";
        }
        return "fail";
      },

      renderHealthIdle() {
        this.healthState.visual = "idle";
        this.healthState.detail = "等待健康检查";
        this.healthState.headline = "等待健康检查";
        this.healthState.summary = "这里会显示当前应用、主后端以及两个推理通道的状态。";
        this.healthState.spring = "未检查";
        this.healthState.backend = "未检查";
        this.healthState.ollama = "未检查";
        this.healthState.openvino = "未检查";
      },

      renderHealthChecking() {
        this.healthState.visual = "checking";
        this.healthState.detail = "正在检查当前本地服务状态";
        this.healthState.headline = "正在检查本地服务";
        this.healthState.summary = "正在检查 Spring Boot、主后端以及两个推理通道。";
      },

      renderHealthSnapshot(data, visualState) {
        const backendLabel = utils.formatBackendLabel(data.backend);
        const summary = data.message || `当前主后端为 ${backendLabel}。`;
        const headline = visualState === "ok"
          ? `服务可用 · ${backendLabel}`
          : visualState === "degraded"
            ? `服务降级 · ${backendLabel}`
            : `服务异常 · ${backendLabel}`;

        this.healthState.visual = visualState;
        this.healthState.detail = [
          `应用 ${utils.localizeStatus(data.spring)}`,
          `后端 ${backendLabel}`,
          `Ollama ${utils.localizeStatus(data.ollama)}`,
          `OpenVINO ${utils.localizeStatus(data.openvino)}`,
          data.machineProfile ? `机器 ${data.machineProfile}` : ""
        ].filter(Boolean).join(" | ");
        this.healthState.headline = headline;
        this.healthState.summary = summary;
        this.healthState.spring = utils.localizeStatus(data.spring);
        this.healthState.backend = backendLabel;
        this.healthState.ollama = utils.localizeStatus(data.ollama);
        this.healthState.openvino = utils.localizeStatus(data.openvino);
      },

      renderHealthFailure(message) {
        const failureMessage = message || "未能获取当前健康状态。";
        this.healthState.visual = "fail";
        this.healthState.detail = failureMessage;
        this.healthState.headline = "健康检查失败";
        this.healthState.summary = failureMessage;
        this.healthState.spring = "失败";
        this.healthState.backend = "未知";
        this.healthState.ollama = "未知";
        this.healthState.openvino = "未知";
      },

      renderRuntimeOptionsFailure(message) {
        this.runtimeSummary.welcomeMachine = "读取失败";
        this.runtimeSummary.welcomeBackend = "未知";
        this.runtimeSummary.welcomeCodeProfile = "未知";
        this.runtimeSummary.welcomeGeneralProfile = "未知";
        this.runtimeSummary.welcomeHint = `默认配置读取失败：${message}`;
        this.runtimeSummary.welcomeHintError = true;
        this.runtimeSummary.machineProfile = "读取失败";
        this.runtimeSummary.backend = "未知";
        this.runtimeSummary.model = "未知";
        this.runtimeSummary.fallback = "未知";
        this.runtimeSummary.modelProfile = "未知";
        this.runtimeSummary.modelBackend = "未知";
        this.runtimeSummary.modelFull = "未返回";
        this.runtimeSummary.hint = `运行时选项不可用：${message}`;
        this.runtimeSummary.hintError = true;
      },

      readLocationState() {
        const url = new URL(window.location.href);
        const nextView = url.searchParams.get("view");
        const view = Object.prototype.hasOwnProperty.call(VIEW_LABELS, nextView) ? nextView : "welcome";
        const language = utils.normalizeDocsLanguage(url.searchParams.get("lang") || this.docsLanguage);
        return { view, language };
      },

      syncLocationState(options = {}) {
        const url = new URL(window.location.href);
        const nextView = this.currentView;
        const nextLanguage = utils.normalizeDocsLanguage(this.docsLanguage);

        if (nextView === "welcome") {
          url.searchParams.delete("view");
        } else {
          url.searchParams.set("view", nextView);
        }

        if (nextView === "docs" || nextLanguage === "en") {
          url.searchParams.set("lang", nextLanguage);
        } else {
          url.searchParams.delete("lang");
        }

        const nextPath = `${url.pathname}${url.search}`;
        const currentPath = `${window.location.pathname}${window.location.search}`;
        if (nextPath === currentPath) {
          return;
        }

        const method = options.replace ? "replaceState" : "pushState";
        window.history[method]({ view: nextView, language: nextLanguage }, "", nextPath);
      },

      switchView(view, options = {}) {
        if (!Object.prototype.hasOwnProperty.call(VIEW_LABELS, view)) {
          return;
        }

        this.viewScroll[this.currentView] = window.scrollY;
        this.currentView = view;
        this.activeViewAnchor = (VIEW_SECTIONS[view] || [])[0]?.anchor || "";

        if (!options.skipHistory) {
          this.syncLocationState({ replace: Boolean(options.replaceHistory) });
        }

        if (view === "docs") {
          void this.loadDocs(this.docsLanguage, { skipHistory: true });
        }

        const targetScroll = options.resetScroll ? 0 : (this.viewScroll[view] || 0);
        document.title = `鸿栀本地工作台 · ${VIEW_LABELS[this.currentView] || "工作台"}`;

        window.requestAnimationFrame(() => {
          window.scrollTo({ top: targetScroll, behavior: "auto" });
          if (view === "chat" && options.focusComposer) {
            this.focusComposer();
          }
          this.queueViewportUpdate();
        });
      },
      focusComposer() {
        const input = document.getElementById("messageInput");
        if (input) {
          input.focus();
        }
      },

      useSuggestion(message) {
        this.composerText = message;
        this.switchView("chat", { focusComposer: true });
      },

      enterChatFromDocs() {
        if (!this.composerText.trim()) {
          this.composerText = this.docsLanguage === "en"
            ? "I just reviewed the README. Please summarize the current architecture and the next debugging steps in Chinese."
            : "我刚看完 README，请基于当前仓库文档整理架构、运行方式和下一步联调重点。";
        }
        this.switchView("chat", { focusComposer: true });
      },

      scrollToSection(anchor) {
        if (!anchor) {
          return;
        }
        const target = document.getElementById(anchor);
        if (!target) {
          return;
        }
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        if (this.currentView === "docs") {
          this.activeDocsAnchor = anchor;
        } else {
          this.activeViewAnchor = anchor;
        }
      },

      scrollToTop() {
        window.scrollTo({ top: 0, behavior: "smooth" });
      },

      setRequestStatus(tone, text) {
        this.requestStatusTone = tone;
        this.requestStatusText = text;
      },

      handleComposerKeydown(event) {
        if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
          return;
        }
        event.preventDefault();
        if (!this.isSubmitting) {
          void this.submitChat();
        }
      },

      resetChatLog() {
        this.chatMessages = [{
          id: crypto.randomUUID(),
          role: "assistant",
          label: "鸿栀",
          html: createPlainHtml("我是鸿栀当前的文本工作台前端。这里仍以本地推理、README 阅读、受控工具调用和补丁确认流程为主，语音、数字人和情绪干预暂时只保留结构位。"),
          pending: false
        }];
      },

      appendMessage(role, label, content, options = {}) {
        const message = {
          id: crypto.randomUUID(),
          role,
          label,
          html: options.markdown ? createMarkdownHtml(content) : createPlainHtml(content),
          pending: Boolean(options.pending)
        };
        this.chatMessages.push(message);
        this.$nextTick(() => {
          this.scrollChatToBottom();
        });
        return message;
      },

      setMessageContent(message, content, options = {}) {
        if (!message) {
          return;
        }
        message.html = options.markdown ? createMarkdownHtml(content) : createPlainHtml(content);
      },

      scrollChatToBottom() {
        const chatLog = document.getElementById("chatLog");
        if (chatLog) {
          chatLog.scrollTop = chatLog.scrollHeight;
        }
      },

      async submitChat() {
        const message = this.composerText.trim();
        if (!message || this.isSubmitting) {
          return;
        }

        this.appendMessage("user", "你", message);
        this.composerText = "";
        const pendingMessage = this.appendMessage("assistant", "鸿栀", "正在整理回复，请稍候...", { pending: true });

        this.isSubmitting = true;
        this.setRequestStatus("busy", "状态：请求处理中");

        try {
          const data = await utils.requestJson("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message,
              sessionId: this.sessionId,
              backend: this.selectedBackend || "auto",
              modelProfile: this.selectedModelProfile || "auto"
            })
          });

          this.lastTrace = Array.isArray(data.steps) ? data.steps : [];
          this.lastToolsUsed = Array.isArray(data.toolsUsed) ? data.toolsUsed : [];
          this.pendingPatch = data.pendingPatch || null;
          this.traceVisible = false;
          this.updateResolvedRuntime(data);
          this.setMessageContent(pendingMessage, data.answer || "模型返回了空响应。", { markdown: true });
          pendingMessage.pending = false;

          this.setRequestStatus("idle", data.fallbackUsed ? "状态：已完成，触发回退链路" : "状态：已完成");

          if (data.pendingPatch) {
            this.showToast("已生成补丁预览，确认后可直接应用。", "info");
          } else if (data.fallbackUsed) {
            this.showToast(`本次请求已回退到 ${utils.formatBackendLabel(data.backend)}。`, "warning");
          } else {
            this.showToast(`请求已完成，命中 ${utils.formatBackendLabel(data.backend)}。`, "success");
          }
        } catch (error) {
          this.setMessageContent(pendingMessage, `请求失败：${error.message}`);
          pendingMessage.pending = false;
          this.setRequestStatus("error", "状态：请求失败");
          this.showToast(`请求失败：${error.message}`, "error");
        } finally {
          this.isSubmitting = false;
          this.$nextTick(() => {
            this.scrollChatToBottom();
          });
        }
      },

      pushPatchHistory(patch, success, message) {
        if (!patch) {
          return;
        }

        this.patchHistory.unshift({
          id: crypto.randomUUID(),
          path: patch.path || "未标注文件",
          success: Boolean(success),
          message: message || (success ? "补丁已应用。" : "补丁应用失败。"),
          time: new Date().toLocaleString("zh-CN", { hour12: false })
        });

        this.patchHistory = this.patchHistory.slice(0, 6);
      },

      async applyPatch() {
        if (!this.pendingPatch || this.isApplyingPatch) {
          return;
        }

        const applyingPatch = this.pendingPatch;
        this.isApplyingPatch = true;

        try {
          const data = await utils.requestJson("/api/patch/apply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: this.sessionId, patchId: applyingPatch.patchId })
          });

          if (data.success) {
            this.appendMessage("assistant", "鸿栀", `补丁已应用：${data.message}`);
            this.pushPatchHistory(applyingPatch, true, data.message);
            this.pendingPatch = null;
            this.showToast("补丁已成功应用。", "success");
          } else {
            this.appendMessage("assistant", "鸿栀", `补丁应用失败：${data.message}`);
            this.pushPatchHistory(applyingPatch, false, data.message);
            this.showToast("补丁应用失败，请先检查预览内容。", "error");
          }
        } catch (error) {
          this.appendMessage("assistant", "鸿栀", `补丁应用失败：${error.message}`);
          this.pushPatchHistory(applyingPatch, false, error.message);
          this.showToast(`补丁应用失败：${error.message}`, "error");
        } finally {
          this.isApplyingPatch = false;
        }
      },

      async resetSession() {
        if (this.isResettingSession) {
          return;
        }

        const previousSessionId = this.sessionId;
        this.isResettingSession = true;

        try {
          await fetch(`/api/session/${previousSessionId}/clear`, { method: "POST" });
        } catch (error) {
          // Best effort only.
        }

        this.sessionId = crypto.randomUUID();
        this.lastTrace = [];
        this.lastToolsUsed = [];
        this.pendingPatch = null;
        this.patchHistory = [];
        this.traceVisible = false;
        this.composerText = "";
        this.resetChatLog();
        this.updateRuntimeSummaryFromOptions();
        this.setRequestStatus("idle", "状态：新会话");
        this.isResettingSession = false;
        this.showToast("已重置会话上下文。", "info");
      },

      async refreshHealth(options = {}) {
        const silent = Boolean(options.silent);
        if (this.isHealthChecking) {
          return;
        }

        this.isHealthChecking = true;
        this.renderHealthChecking();

        try {
          const data = await utils.requestJson("/api/health");
          const visualState = this.mapHealthState(data.status);
          this.renderHealthSnapshot(data, visualState);

          if (!silent) {
            this.showToast(
              visualState === "ok" ? "健康检查通过。" : "健康检查完成，当前为降级或异常状态。",
              visualState === "ok" ? "success" : "warning"
            );
          }
        } catch (error) {
          this.renderHealthFailure(error.message);
          if (!silent) {
            this.showToast(`健康检查失败：${error.message}`, "error");
          }
        } finally {
          this.isHealthChecking = false;
        }
      },

      async loadRuntimeOptions() {
        try {
          const data = await utils.requestJson("/api/runtime/options");
          this.runtimeOptions = data;
          this.updateRuntimeSummaryFromOptions();
        } catch (error) {
          this.renderRuntimeOptionsFailure(error.message);
        }
      },
      renderDocsLoading(language) {
        const normalizedLanguage = utils.normalizeDocsLanguage(language);
        this.docsLanguage = normalizedLanguage;
        this.docsStatus = "加载中";
        this.docsHeadings = [];
        this.activeDocsAnchor = "";
        this.docsState.title = normalizedLanguage === "en" ? "Project Guide" : "项目说明";
        this.docsState.meta = `正在从 ${utils.getDocsSourceName(normalizedLanguage)} 读取内容。`;
        this.docsState.renderMode = "loading";
        this.docsState.html = "";
        this.docsState.errorMessage = "";
        this.docsState.readingTime = "--";
        this.docsState.progress = 0;
      },

      renderDocsContent(data, options = {}) {
        const language = utils.normalizeDocsLanguage(data.language);
        const rendered = markdown.renderMarkdown(data.content || "");
        const sourceName = utils.getDocsSourceName(language);

        this.docsLanguage = language;
        this.docsStatus = options.fromCache ? "已缓存" : "已同步";
        this.docsHeadings = rendered.headings.filter((heading) => heading.level <= 3);
        this.activeDocsAnchor = this.docsHeadings[0]?.anchor || "";
        this.docsState.title = data.title || (language === "en" ? "Project Guide" : "项目说明");
        this.docsState.meta = `${sourceName} · 直接读取仓库 README · 前端不维护额外副本。`;
        this.docsState.renderMode = rendered.html ? "content" : "placeholder";
        this.docsState.html = rendered.html;
        this.docsState.errorMessage = "";
        this.docsState.readingTime = `${markdown.estimateReadingMinutes(data.content || "")} 分钟`;
        this.docsState.progress = 0;
      },

      renderDocsError(language, message) {
        const normalizedLanguage = utils.normalizeDocsLanguage(language);
        this.docsLanguage = normalizedLanguage;
        this.docsStatus = "加载失败";
        this.docsHeadings = [];
        this.activeDocsAnchor = "";
        this.docsState.title = normalizedLanguage === "en" ? "Project Guide" : "项目说明";
        this.docsState.meta = `读取 ${utils.getDocsSourceName(normalizedLanguage)} 失败。`;
        this.docsState.renderMode = "error";
        this.docsState.html = "";
        this.docsState.errorMessage = `文档加载失败：${message}`;
        this.docsState.readingTime = "--";
        this.docsState.progress = 0;
      },

      async loadDocs(language, options = {}) {
        const nextLanguage = utils.normalizeDocsLanguage(language);
        this.docsLanguage = nextLanguage;

        if (!options.skipHistory) {
          this.syncLocationState({ replace: Boolean(options.replaceHistory) });
        }

        if (!options.force && this.docsCache[nextLanguage]) {
          this.renderDocsContent(this.docsCache[nextLanguage], { fromCache: true });
          this.queueDocsScrollUpdate(options.resetScroll);
          return;
        }

        this.renderDocsLoading(nextLanguage);

        try {
          const data = await utils.requestJson(`/api/docs/${nextLanguage}`);
          this.docsCache[nextLanguage] = data;
          this.renderDocsContent(data, { fromCache: false });
          this.queueDocsScrollUpdate(options.resetScroll);
        } catch (error) {
          this.renderDocsError(nextLanguage, error.message);
          this.showToast(`文档加载失败：${error.message}`, "error");
        }
      },

      queueDocsScrollUpdate(resetScroll) {
        if (this.currentView !== "docs") {
          return;
        }

        this.$nextTick(() => {
          if (resetScroll) {
            this.viewScroll.docs = 0;
            window.scrollTo({ top: 0, behavior: "auto" });
          }
          this.queueViewportUpdate();
        });
      },

      updateDocsScrollState() {
        const content = document.querySelector("#docsArticle .docs-content");
        if (!content) {
          this.docsState.progress = 0;
          this.activeDocsAnchor = "";
          return;
        }

        this.docsState.progress = this.calculateDocsProgress(content);
        this.updateActiveDocsAnchor();
      },

      calculateDocsProgress(content) {
        const viewportHeight = window.innerHeight || 1;
        const top = content.getBoundingClientRect().top + window.scrollY;
        const height = content.offsetHeight;
        const start = top - 180;
        const end = top + height - viewportHeight;

        if (end <= start) {
          return 100;
        }
        if (window.scrollY <= start) {
          return 0;
        }
        if (window.scrollY >= end) {
          return 100;
        }

        const ratio = (window.scrollY - start) / (end - start);
        return Math.max(0, Math.min(100, Number((ratio * 100).toFixed(1))));
      },

      updateActiveDocsAnchor() {
        if (!this.docsHeadings.length) {
          this.activeDocsAnchor = "";
          return;
        }

        let activeAnchor = this.docsHeadings[0].anchor;
        for (const heading of this.docsHeadings) {
          const target = document.getElementById(heading.anchor);
          if (target && target.getBoundingClientRect().top <= 180) {
            activeAnchor = heading.anchor;
          }
        }
        this.activeDocsAnchor = activeAnchor;
      },

      updateViewSectionAnchor() {
        const sections = VIEW_SECTIONS[this.currentView] || [];
        if (!sections.length) {
          this.activeViewAnchor = "";
          return;
        }

        let activeAnchor = sections[0].anchor;
        for (const section of sections) {
          const target = document.getElementById(section.anchor);
          if (target && target.getBoundingClientRect().top <= 220) {
            activeAnchor = section.anchor;
          }
        }
        this.activeViewAnchor = activeAnchor;
      },

      queueViewportUpdate() {
        if (this._viewportFrame) {
          return;
        }
        this._viewportFrame = window.requestAnimationFrame(() => {
          this._viewportFrame = null;
          this.updateViewportState();
        });
      },

      updateViewportState() {
        this.showBackToTop = window.scrollY > 560;
        if (this.currentView === "docs") {
          this.updateDocsScrollState();
          return;
        }
        this.updateViewSectionAnchor();
      },

      handleWindowScroll() {
        this.queueViewportUpdate();
      },

      handlePopState() {
        const locationState = this.readLocationState();
        this.docsLanguage = locationState.language;
        this.switchView(locationState.view, { focusComposer: false, skipHistory: true });
      },

      showToast(message, tone = "info") {
        const toast = {
          id: crypto.randomUUID(),
          message,
          tone,
          visible: false
        };

        this.toasts.push(toast);

        this.$nextTick(() => {
          toast.visible = true;
        });

        window.setTimeout(() => {
          toast.visible = false;
          window.setTimeout(() => {
            this.toasts = this.toasts.filter((item) => item.id !== toast.id);
          }, 220);
        }, 2600);
      }
    },
    mounted() {
      const locationState = this.readLocationState();
      this.docsLanguage = locationState.language;
      this.resetChatLog();
      this.renderHealthIdle();
      this.updateRuntimeSummaryFromOptions();
      this.setRequestStatus("idle", "状态：就绪");
      this.switchView(locationState.view, { focusComposer: false, skipHistory: true, resetScroll: true });

      this._onScroll = () => {
        this.handleWindowScroll();
      };
      this._onResize = () => {
        this.queueViewportUpdate();
      };
      this._onPopState = () => {
        this.handlePopState();
      };

      window.addEventListener("scroll", this._onScroll, { passive: true });
      window.addEventListener("resize", this._onResize, { passive: true });
      window.addEventListener("popstate", this._onPopState);

      void this.loadRuntimeOptions();
      void this.refreshHealth({ silent: true });
      this.queueViewportUpdate();
    },

    beforeUnmount() {
      if (this._onScroll) {
        window.removeEventListener("scroll", this._onScroll);
      }
      if (this._onResize) {
        window.removeEventListener("resize", this._onResize);
      }
      if (this._onPopState) {
        window.removeEventListener("popstate", this._onPopState);
      }
      if (this._viewportFrame) {
        window.cancelAnimationFrame(this._viewportFrame);
      }
    }
  };
};
