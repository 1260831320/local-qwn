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
    { id: "welcome", label: "总览", note: "了解功能与使用方式" },
    { id: "chat", label: "工作台", note: "开始对话与确认变更" },
    { id: "docs", label: "手册", note: "阅读说明与常见内容" }
  ];

  const VIEW_SECTIONS = {
    welcome: [
      { anchor: "welcome-hero", label: "亮点" },
      { anchor: "welcome-workflow", label: "使用流程" },
      { anchor: "welcome-inputs", label: "你可以做什么" },
      { anchor: "welcome-compare", label: "模式选择" },
      { anchor: "welcome-run", label: "更多信息" }
    ],
    chat: [
      { anchor: "chat-conversation", label: "对话" },
      { anchor: "chat-runtime", label: "偏好与状态" },
      { anchor: "chat-signals", label: "预留功能" },
      { anchor: "chat-patch", label: "变更确认" }
    ],
    docs: [
      { anchor: "docs-reader", label: "正文" },
      { anchor: "docs-overview", label: "摘要" }
    ]
  };

  const WELCOME_INPUT_CARDS = [
    {
      id: "source",
      title: "你可以做什么",
      description: "常用入口已经收在同一处。",
      items: ["阅读当前版本说明", "和本地模型直接对话", "在确认后应用变更"]
    },
    {
      id: "boundary",
      title: "安心使用",
      description: "所有重要动作都会先给出明确反馈。",
      items: ["涉及写入时会先预览", "只在当前工作区内处理文件", "未开放的能力不会假装可用"]
    },
    {
      id: "goal",
      title: "当前重点",
      description: "先把现在真正可用的体验做好。",
      items: ["优先保证本地可用", "优先保证界面清晰易用", "为后续扩展保留位置"]
    }
  ];

  const WORKFLOW_STEPS = [
    {
      id: "runtime",
      label: "先看状态",
      title: "先确认服务和当前模式",
      description: "开始前先看系统是否可用，以及当前会使用哪种回答模式。",
      input: "系统状态与当前设置",
      output: "当前引擎、回答模式、可用状态",
      note: "如果某个服务暂时不可用，界面会直接展示当前状态。"
    },
    {
      id: "docs",
      label: "再看手册",
      title: "从手册快速了解功能",
      description: "手册页提供当前版本说明、功能摘要和章节导航。",
      input: "当前说明文档",
      output: "功能摘要、章节目录、阅读进度",
      note: "适合先了解整体，再进入对话。"
    },
    {
      id: "chat",
      label: "开始对话",
      title: "直接提出问题或任务",
      description: "聊天区优先展示对话本身，常用提问和变更确认放在侧边。",
      input: "你的问题、当前偏好",
      output: "回答内容、处理过程、建议动作",
      note: "如果你手动切换模式，系统会按你的选择回答。"
    },
    {
      id: "patch",
      label: "确认变更",
      title: "变更前先看一眼",
      description: "涉及写入时会先展示预览，确认后才会真正应用。",
      input: "待确认内容",
      output: "应用结果、失败提醒、最近记录",
      note: "这是当前版本最重要的安全边界之一。"
    }
  ];

  const BACKEND_COMPARISON = [
    {
      id: "ollama",
      name: "Ollama",
      emphasis: "更适合复杂问题",
      principle: "更适合连续对话、较长回答和更复杂的任务。",
      advantages: ["回答通常更完整", "复杂问题表现更稳定", "当前默认体验更成熟"],
      limits: ["资源占用更高", "对设备压力更明显"],
      linkage: "如果你希望回答更完整或问题更复杂，通常更适合选择这一路线。"
    },
    {
      id: "openvino",
      name: "OpenVINO",
      emphasis: "更适合轻量使用",
      principle: "更适合轻量问答和更节省资源的本地体验。",
      advantages: ["占用更轻", "普通设备更容易运行", "适合短问短答"],
      limits: ["复杂任务表现更保守", "当前不适合作为重度代码模式"],
      linkage: "如果你更看重轻量和低成本运行，这一路线会更合适。"
    }
  ];

  const RUN_GUIDE_CARDS = [
    {
      id: "entry",
      title: "打开即用",
      path: "在浏览器中访问 http://localhost:8080",
      description: "首页会汇总总览、工作台和手册入口。"
    },
    {
      id: "check",
      title: "先读手册",
      path: "手册页支持 中文 / English",
      description: "适合先了解当前版本能做什么，再决定下一步。"
    },
    {
      id: "write",
      title: "安全确认",
      path: "所有变更都会先预览再确认",
      description: "你始终可以先看到将要发生的变化。"
    }
  ];

  const RESERVE_CARDS = [
    { id: "voice", title: "语音模式", description: "界面已经预留入口，当前先提供稳定文本体验。", status: "现状：稍后开放" },
    { id: "device", title: "设备连接", description: "麦克风和摄像头区域已经预留，当前不会伪造连接状态。", status: "现状：未启用" },
    { id: "avatar", title: "数字形象", description: "后续会接入更完整的形象表达，当前先保留展示位置。", status: "现状：占位" },
    { id: "emotion", title: "情绪建议", description: "相关结果区已经预留，当前版本暂未开放。", status: "现状：等待更新" }
  ];

  const CHAT_SUGGESTIONS = [
    { id: "overview", label: "这能做什么", message: "请用简洁中文介绍这套本地工作台能做什么。" },
    { id: "getting-started", label: "怎么开始", message: "我是第一次使用，请告诉我先看哪里、再做什么。" },
    { id: "status", label: "看看状态", message: "请结合当前状态，告诉我现在适合做什么。" },
    { id: "manual", label: "总结手册", message: "请根据当前手册内容，总结最值得先看的三个要点。" }
  ];

  const SIGNAL_CARDS = [
    { id: "voice", label: "语音模式", title: "后续开放", description: "当前先提供稳定的文本体验，语音入口已预留。" },
    { id: "device", label: "设备连接", title: "稍后接入", description: "麦克风和摄像头区域已经预留，当前不会伪造连接状态。" },
    { id: "avatar", label: "数字形象", title: "等待升级", description: "后续会接入更完整的形象表达，当前先保留展示位置。" },
    { id: "emotion", label: "情绪建议", title: "持续完善中", description: "相关结果区已经预留，当前版本暂未开放。" }
  ];

  const DOCS_LANGUAGES = [
    { id: "zh", label: "中文" },
    { id: "en", label: "English" }
  ];

  const DOCS_PIPELINE_STEPS = [
    {
      id: "source",
      title: "双语阅读",
      description: "你可以在中文和 English 之间切换。"
    },
    {
      id: "render",
      title: "章节定位",
      description: "左侧目录和摘要卡片可以快速跳到重点。"
    },
    {
      id: "reading",
      title: "阅读进度",
      description: "页面顶部会显示当前阅读进度。"
    },
    {
      id: "handoff",
      title: "继续提问",
      description: "看完后可以直接带着问题回到工作台。"
    }
  ];

  const WORKSPACE_STATE_KEY = "hongzhi.workspace.state.v1";
  const MAX_PATCH_HISTORY_ITEMS = 6;

  function createSessionId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `session-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }

  function readStoredWorkspaceState() {
    try {
      const raw = window.localStorage.getItem(WORKSPACE_STATE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function writeStoredWorkspaceState(state) {
    try {
      window.localStorage.setItem(WORKSPACE_STATE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      return false;
    }
  }

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
      summary: "这里会显示当前服务、回答引擎和整体状态。",
      spring: "未检查",
      backend: "未检查",
      ollama: "未检查",
      openvino: "未检查"
    };
  }

  function createInitialDocsState() {
    return {
      title: "项目说明",
      meta: "点击“阅读手册”后会加载当前版本说明。",
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
        sessionId: createSessionId(),
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
        showBackToTop: false,
        topDockCompact: false,
        sidebarExpanded: true
      };
    },

    computed: {
      isSidebarCollapsed() {
        return !this.sidebarExpanded;
      },

      currentViewLabel() {
        return VIEW_LABELS[this.currentView] || VIEW_LABELS.welcome;
      },

      sidebarToggleText() {
        return this.isSidebarCollapsed ? "展开" : "收起侧栏";
      },

      sidebarToggleHint() {
        return this.currentView === "welcome"
          ? "首页默认展开"
          : "工作台与手册默认折叠";
      },

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
            label: "当前引擎",
            value: backendValue,
            note: this.healthState.visual === "idle" ? "等待状态更新" : "当前可用的回答服务"
          },
          {
            label: "回答模式",
            value: this.runtimeSummary.welcomeCodeProfile,
            note: "当前推荐模式"
          },
          {
            label: "变更状态",
            value: this.pendingPatch ? "待你确认" : "安全预览",
            note: this.pendingPatch?.path ? utils.shortenPath(this.pendingPatch.path) : "涉及写入时会先预览"
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
        return this.lastTrace.length ? this.lastTrace.join("\n\n") : "当前还没有可显示的处理过程。";
      },

      traceButtonText() {
        return this.lastTrace.length ? `查看处理过程 (${this.lastTrace.length})` : "查看处理过程";
      },

      patchMetaItems() {
        const items = [];
        if (this.pendingPatch?.path) {
          items.push(`文件：${this.pendingPatch.path}`);
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

    watch: {
      sessionId() {
        this.persistWorkspaceState();
      },

      selectedBackend() {
        this.persistWorkspaceState();
      },

      selectedModelProfile() {
        this.persistWorkspaceState();
      },

      docsLanguage() {
        this.persistWorkspaceState();
      },

      currentView() {
        this.persistWorkspaceState();
      },

      sidebarExpanded() {
        this.persistWorkspaceState();
      },

      patchHistory: {
        handler() {
          this.persistWorkspaceState();
        },
        deep: true
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
        const modeLabel = selectedProfileId === "auto" ? "当前使用推荐设置" : "当前使用手动选择";

        this.runtimeSummary.welcomeMachine = this.runtimeOptions.machineProfile || "未标注";
        this.runtimeSummary.welcomeBackend = utils.formatBackendLabel(this.runtimeOptions.configuredBackend || "auto");
        this.runtimeSummary.welcomeCodeProfile = this.formatProfileLabel(this.runtimeOptions.autoCodeProfile || "auto");
        this.runtimeSummary.welcomeGeneralProfile = this.formatProfileLabel(this.runtimeOptions.autoGeneralProfile || "auto");
        this.runtimeSummary.welcomeHint = `当前推荐引擎为 ${utils.formatBackendLabel(this.runtimeOptions.configuredBackend || "auto")}，回答模式为 ${this.formatProfileLabel(this.runtimeOptions.autoCodeProfile || "auto")}，通用模式为 ${this.formatProfileLabel(this.runtimeOptions.autoGeneralProfile || "auto")}。`;
        this.runtimeSummary.welcomeHintError = false;

        this.runtimeSummary.machineProfile = this.runtimeOptions.machineProfile || "未标注";
        this.runtimeSummary.backend = utils.formatBackendLabel(resolvedBackend);
        this.runtimeSummary.model = this.formatProfileLabel(derivedProfileId);
        this.runtimeSummary.fallback = utils.formatFallbackLabel(this.runtimeOptions.configuredFallbackBackend);
        this.runtimeSummary.modelProfile = this.formatProfileLabel(derivedProfileId);
        this.runtimeSummary.modelBackend = utils.formatBackendLabel(profile?.backend || resolvedBackend);
        this.runtimeSummary.modelFull = profile?.model || "系统会自动选择更合适的模型";
        this.runtimeSummary.hint = `${modeLabel}，系统会在需要时自动回退。`;
        this.runtimeSummary.hintError = false;
      },

      updateResolvedRuntime(response) {
        const resolvedBackend = response.backend || this.selectedBackend || this.runtimeOptions?.configuredBackend || "auto";
        const resolvedProfileId = response.modelProfile || this.selectedModelProfile || this.resolveDefaultProfileId(resolvedBackend);
        const profile = this.findProfileOption(resolvedProfileId);
        const fallbackText = response.fallbackUsed ? "本次回答已切换到备用引擎。" : "本次回答未使用备用引擎。";
        const selectionMode = utils.localizeSelectionMode(response.selectionMode);

        this.runtimeSummary.backend = utils.formatBackendLabel(resolvedBackend);
        this.runtimeSummary.model = this.formatProfileLabel(resolvedProfileId);
        this.runtimeSummary.fallback = utils.formatFallbackLabel(this.runtimeOptions?.configuredFallbackBackend);
        this.runtimeSummary.modelProfile = this.formatProfileLabel(resolvedProfileId);
        this.runtimeSummary.modelBackend = utils.formatBackendLabel(profile?.backend || resolvedBackend);
        this.runtimeSummary.modelFull = response.model || profile?.model || "未返回模型标识";
        this.runtimeSummary.hint = `本次使用 ${utils.formatBackendLabel(resolvedBackend)} / ${this.formatProfileLabel(resolvedProfileId)}，当前为${selectionMode}。${fallbackText}`;
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
        this.healthState.summary = "这里会显示当前服务、回答引擎和整体状态。";
        this.healthState.spring = "未检查";
        this.healthState.backend = "未检查";
        this.healthState.ollama = "未检查";
        this.healthState.openvino = "未检查";
      },

      renderHealthChecking() {
        this.healthState.visual = "checking";
        this.healthState.detail = "正在检查当前本地服务状态";
        this.healthState.headline = "正在检查本地服务";
        this.healthState.summary = "正在检查当前服务和可用引擎。";
      },

      renderHealthSnapshot(data, visualState) {
        const backendLabel = utils.formatBackendLabel(data.backend);
        const summary = visualState === "ok"
          ? `当前服务可用，正在使用 ${backendLabel}。`
          : visualState === "degraded"
            ? `当前服务可用，但部分能力可能受限，当前使用 ${backendLabel}。`
            : `当前服务暂不可用，请稍后再试。`;
        const headline = visualState === "ok"
          ? `服务可用 · ${backendLabel}`
          : visualState === "degraded"
            ? `服务降级 · ${backendLabel}`
            : `服务异常 · ${backendLabel}`;

        this.healthState.visual = visualState;
        this.healthState.detail = [
          `应用 ${utils.localizeStatus(data.spring)}`,
          `引擎 ${backendLabel}`,
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

      normalizeStoredPatchHistory(entries) {
        if (!Array.isArray(entries)) {
          return [];
        }

        return entries
          .filter((entry) => entry && typeof entry === "object")
          .map((entry) => ({
            id: String(entry.id || createSessionId()),
            path: String(entry.path || "未标注文件"),
            success: Boolean(entry.success),
            message: String(entry.message || (entry.success ? "变更已应用。" : "变更应用失败。")),
            time: String(entry.time || "")
          }))
          .slice(0, MAX_PATCH_HISTORY_ITEMS);
      },

      restoreLocalWorkspaceState(storedState, locationState) {
        this.sessionId = typeof storedState?.sessionId === "string" && storedState.sessionId.trim()
          ? storedState.sessionId.trim()
          : createSessionId();
        this.selectedBackend = typeof storedState?.selectedBackend === "string" && storedState.selectedBackend.trim()
          ? storedState.selectedBackend
          : "auto";
        this.selectedModelProfile = typeof storedState?.selectedModelProfile === "string" && storedState.selectedModelProfile.trim()
          ? storedState.selectedModelProfile
          : "auto";
        this.patchHistory = this.normalizeStoredPatchHistory(storedState?.patchHistory);
        this.currentView = locationState.view;
        this.docsLanguage = locationState.language;
        this.sidebarExpanded = typeof storedState?.sidebarExpanded === "boolean"
          ? storedState.sidebarExpanded
          : locationState.view === "welcome";
      },

      persistWorkspaceState() {
        writeStoredWorkspaceState({
          sessionId: this.sessionId,
          selectedBackend: this.selectedBackend || "auto",
          selectedModelProfile: this.selectedModelProfile || "auto",
          currentView: this.currentView,
          docsLanguage: this.docsLanguage,
          sidebarExpanded: this.sidebarExpanded,
          patchHistory: this.patchHistory.slice(0, MAX_PATCH_HISTORY_ITEMS)
        });
      },

      buildChatMessageFromSnapshot(message) {
        const role = message?.role === "assistant" ? "assistant" : "user";
        return {
          id: createSessionId(),
          role,
          label: role === "assistant" ? "鸿栀" : "你",
          html: role === "assistant"
            ? createMarkdownHtml(message?.content || "")
            : createPlainHtml(message?.content || ""),
          pending: false
        };
      },

      async restoreSessionSnapshot(options = {}) {
        const silent = Boolean(options.silent);

        try {
          const data = await utils.requestJson(`/api/session/${encodeURIComponent(this.sessionId)}`);
          const messages = Array.isArray(data.messages) ? data.messages : [];
          this.pendingPatch = data.pendingPatch || null;
          this.lastTrace = [];
          this.lastToolsUsed = [];
          this.traceVisible = false;

          if (!data.hasContent) {
            if (!this.chatMessages.length) {
              this.resetChatLog();
            }
            return;
          }

          if (messages.length) {
            this.chatMessages = messages.map((message) => this.buildChatMessageFromSnapshot(message));
          } else if (!this.chatMessages.length) {
            this.resetChatLog();
          }

          this.setRequestStatus("idle", this.pendingPatch ? "状态：已恢复对话与待确认变更" : "状态：已恢复最近对话");
          if (!silent) {
            this.showToast(
              this.pendingPatch ? "已恢复最近对话和待确认变更。" : "已恢复最近对话。",
              "success"
            );
          }

          this.$nextTick(() => {
            this.scrollChatToBottom();
          });
        } catch (error) {
          if (!silent) {
            this.showToast(`恢复最近对话失败：${error.message}`, "warning");
          }
        }
      },

      readLocationState(defaults = {}) {
        const url = new URL(window.location.href);
        const nextView = url.searchParams.get("view");
        const fallbackView = Object.prototype.hasOwnProperty.call(VIEW_LABELS, defaults.view) ? defaults.view : "welcome";
        const view = Object.prototype.hasOwnProperty.call(VIEW_LABELS, nextView) ? nextView : fallbackView;
        const fallbackLanguage = utils.normalizeDocsLanguage(defaults.language || this.docsLanguage || "zh");
        const language = utils.normalizeDocsLanguage(url.searchParams.get("lang") || fallbackLanguage);
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

      syncSidebarState(view, options = {}) {
        if (options.preserveSidebarState) {
          return;
        }
        this.sidebarExpanded = view === "welcome";
      },

      toggleSidebar() {
        this.sidebarExpanded = !this.sidebarExpanded;
        this.$nextTick(() => {
          this.queueViewportUpdate();
        });
      },

      switchView(view, options = {}) {
        if (!Object.prototype.hasOwnProperty.call(VIEW_LABELS, view)) {
          return;
        }

        const previousView = this.currentView;
        this.viewScroll[this.currentView] = window.scrollY;
        this.currentView = view;
        this.activeViewAnchor = (VIEW_SECTIONS[view] || [])[0]?.anchor || "";
        if (view !== previousView) {
          this.syncSidebarState(view, options);
        }

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
            ? "I just finished the guide. Please summarize the most useful things to try first in Chinese."
            : "我刚看完手册，请用中文帮我总结当前版本最值得先体验的功能。";
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
          id: createSessionId(),
          role: "assistant",
          label: "鸿栀",
          html: createPlainHtml("欢迎来到鸿栀。你可以在这里阅读说明、发起对话、查看状态，并在确认后应用变更。"),
          pending: false
        }];
      },

      appendMessage(role, label, content, options = {}) {
        const message = {
          id: createSessionId(),
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

          this.setRequestStatus("idle", data.fallbackUsed ? "状态：已完成，已切换到备用引擎" : "状态：已完成");

          if (data.pendingPatch) {
            this.showToast("已生成变更预览，确认后可直接应用。", "info");
          } else if (data.fallbackUsed) {
            this.showToast(`本次请求已回退到 ${utils.formatBackendLabel(data.backend)}。`, "warning");
          } else {
            this.showToast(`请求已完成，当前使用 ${utils.formatBackendLabel(data.backend)}。`, "success");
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
          id: createSessionId(),
          path: patch.path || "未标注文件",
          success: Boolean(success),
          message: message || (success ? "变更已应用。" : "变更应用失败。"),
          time: new Date().toLocaleString("zh-CN", { hour12: false })
        });

        this.patchHistory = this.patchHistory.slice(0, MAX_PATCH_HISTORY_ITEMS);
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
            this.appendMessage("assistant", "鸿栀", `变更已应用：${data.message}`);
            this.pushPatchHistory(applyingPatch, true, data.message);
            this.pendingPatch = null;
            this.showToast("变更已成功应用。", "success");
          } else {
            this.appendMessage("assistant", "鸿栀", `变更应用失败：${data.message}`);
            this.pushPatchHistory(applyingPatch, false, data.message);
            this.showToast("变更应用失败，请先检查预览内容。", "error");
          }
        } catch (error) {
          this.appendMessage("assistant", "鸿栀", `变更应用失败：${error.message}`);
          this.pushPatchHistory(applyingPatch, false, error.message);
          this.showToast(`变更应用失败：${error.message}`, "error");
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

        this.sessionId = createSessionId();
        this.lastTrace = [];
        this.lastToolsUsed = [];
        this.pendingPatch = null;
        this.patchHistory = [];
        this.traceVisible = false;
        this.composerText = "";
        this.resetChatLog();
        this.updateRuntimeSummaryFromOptions();
        this.setRequestStatus("idle", "状态：已开始新的对话");
        this.isResettingSession = false;
        this.showToast("已开始新的对话。", "info");
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
          this.persistWorkspaceState();
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
        this.docsState.meta = `正在加载 ${utils.getDocsSourceName(normalizedLanguage)}。`;
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
        this.docsState.meta = `${sourceName} · 当前版本说明`;
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
        this.docsState.meta = `${utils.getDocsSourceName(normalizedLanguage)} 暂时无法加载。`;
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
        this.topDockCompact = window.scrollY > 56;
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
        const locationState = this.readLocationState({
          view: this.currentView,
          language: this.docsLanguage
        });
        this.docsLanguage = locationState.language;
        this.switchView(locationState.view, { focusComposer: false, skipHistory: true, preserveSidebarState: true });
      },

      showToast(message, tone = "info") {
        const toast = {
          id: createSessionId(),
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
      const storedState = readStoredWorkspaceState();
      const locationState = this.readLocationState({
        view: storedState?.currentView,
        language: storedState?.docsLanguage
      });
      this.restoreLocalWorkspaceState(storedState, locationState);
      this.resetChatLog();
      this.renderHealthIdle();
      this.updateRuntimeSummaryFromOptions();
      this.setRequestStatus("idle", "状态：就绪");
      this.switchView(locationState.view, {
        focusComposer: false,
        skipHistory: true,
        resetScroll: true,
        preserveSidebarState: true
      });

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

      void this.restoreSessionSnapshot({ silent: true });
      void this.loadRuntimeOptions();
      void this.refreshHealth({ silent: true });
      this.queueViewportUpdate();
      this.persistWorkspaceState();
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
