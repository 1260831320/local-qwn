const state = {
  currentView: "welcome",
  sessionId: crypto.randomUUID(),
  lastTrace: [],
  lastToolsUsed: [],
  pendingPatch: null,
  patchHistory: [],
  runtimeOptions: null,
  docsLanguage: "zh",
  docsCache: new Map(),
  docsStatus: "未加载",
  docsHeadings: [],
  activeDocsAnchor: "",
  viewScroll: {
    welcome: 0,
    chat: 0,
    docs: 0
  }
};

const views = {
  welcome: document.getElementById("welcomeView"),
  chat: document.getElementById("chatView"),
  docs: document.getElementById("docsView")
};

const navTabs = Array.from(document.querySelectorAll("[data-view-target]"));
const docsLanguageButtons = Array.from(document.querySelectorAll("[data-docs-language]"));
const suggestionButtons = Array.from(document.querySelectorAll(".suggestion"));

const topHealthBadge = document.getElementById("topHealthBadge");
const topHealthBtn = document.getElementById("topHealthBtn");
const topNewSessionBtn = document.getElementById("topNewSessionBtn");

const contextViewValue = document.getElementById("contextViewValue");
const contextSessionValue = document.getElementById("contextSessionValue");
const contextRouteValue = document.getElementById("contextRouteValue");
const contextTraceValue = document.getElementById("contextTraceValue");
const contextDocsValue = document.getElementById("contextDocsValue");
const contextPatchValue = document.getElementById("contextPatchValue");

const enterChatBtn = document.getElementById("enterChatBtn");
const showDocsBtn = document.getElementById("showDocsBtn");

const welcomeMachineValue = document.getElementById("welcomeMachineValue");
const welcomeBackendValue = document.getElementById("welcomeBackendValue");
const welcomeCodeProfileValue = document.getElementById("welcomeCodeProfileValue");
const welcomeGeneralProfileValue = document.getElementById("welcomeGeneralProfileValue");
const welcomeRuntimeHint = document.getElementById("welcomeRuntimeHint");
const welcomeHealthBadge = document.getElementById("welcomeHealthBadge");
const welcomeHealthSummary = document.getElementById("welcomeHealthSummary");
const welcomeSpringValue = document.getElementById("welcomeSpringValue");
const welcomeHealthBackendValue = document.getElementById("welcomeHealthBackendValue");
const welcomeOllamaValue = document.getElementById("welcomeOllamaValue");
const welcomeOpenvinoValue = document.getElementById("welcomeOpenvinoValue");

const machineProfileValue = document.getElementById("machineProfileValue");
const runtimeBackendValue = document.getElementById("runtimeBackendValue");
const runtimeModelValue = document.getElementById("runtimeModelValue");
const runtimeFallbackValue = document.getElementById("runtimeFallbackValue");
const runtimeModelProfileValue = document.getElementById("runtimeModelProfileValue");
const runtimeModelBackendValue = document.getElementById("runtimeModelBackendValue");
const runtimeModelFullValue = document.getElementById("runtimeModelFullValue");
const backendSelect = document.getElementById("backendSelect");
const modelProfileSelect = document.getElementById("modelProfileSelect");
const runtimeHint = document.getElementById("runtimeHint");

const healthStatus = document.getElementById("healthStatus");
const healthHeadline = document.getElementById("healthHeadline");
const healthSummary = document.getElementById("healthSummary");
const springStatusValue = document.getElementById("springStatusValue");
const healthBackendValue = document.getElementById("healthBackendValue");
const healthOllamaValue = document.getElementById("healthOllamaValue");
const healthOpenvinoValue = document.getElementById("healthOpenvinoValue");

const patchHistoryPanel = document.getElementById("patchHistoryPanel");
const patchHistoryList = document.getElementById("patchHistoryList");
const toolBar = document.getElementById("toolBar");
const patchPanel = document.getElementById("patchPanel");
const patchPreview = document.getElementById("patchPreview");
const applyPatchBtn = document.getElementById("applyPatchBtn");

const chatLog = document.getElementById("chatLog");
const tracePanel = document.getElementById("tracePanel");
const traceContent = document.getElementById("traceContent");
const showTraceBtn = document.getElementById("showTraceBtn");
const toggleTrace = document.getElementById("toggleTrace");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const requestStatus = document.getElementById("requestStatus");
const sendBtn = document.getElementById("sendBtn");

const docsInfoLanguage = document.getElementById("docsInfoLanguage");
const docsInfoSource = document.getElementById("docsInfoSource");
const docsInfoStatus = document.getElementById("docsInfoStatus");
const docsOutlineFilter = document.getElementById("docsOutlineFilter");
const docsOutline = document.getElementById("docsOutline");
const docsToChatBtn = document.getElementById("docsToChatBtn");
const docsRefreshBtn = document.getElementById("docsRefreshBtn");
const docsTitle = document.getElementById("docsTitle");
const docsMeta = document.getElementById("docsMeta");
const docsHeadingCount = document.getElementById("docsHeadingCount");
const docsReadingTime = document.getElementById("docsReadingTime");
const docsProgressText = document.getElementById("docsProgressText");
const docsProgressBar = document.getElementById("docsProgressBar");
const docsArticle = document.getElementById("docsArticle");

const toastStack = document.getElementById("toastStack");

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
  welcome: "欢迎页",
  chat: "聊天页",
  docs: "文档页"
};

bindEvents();
initialize();

function bindEvents() {
  for (const button of navTabs) {
    button.addEventListener("click", () => {
      switchView(button.dataset.viewTarget || "welcome");
    });
  }

  enterChatBtn.addEventListener("click", () => {
    switchView("chat", { focusComposer: true });
  });

  showDocsBtn.addEventListener("click", () => {
    switchView("docs");
  });

  docsToChatBtn.addEventListener("click", () => {
    if (!messageInput.value.trim()) {
      messageInput.value = state.docsLanguage === "en"
        ? "I just reviewed the README. Please summarize the current architecture and the next debugging steps in Chinese."
        : "我刚看完 README，请基于当前项目文档梳理架构、运行方式和下一步联调重点。";
    }
    switchView("chat", { focusComposer: true });
  });

  docsRefreshBtn.addEventListener("click", async () => {
    await loadDocs(state.docsLanguage, { force: true });
  });

  for (const button of docsLanguageButtons) {
    button.addEventListener("click", async () => {
      await loadDocs(button.dataset.docsLanguage || "zh");
    });
  }

  backendSelect.addEventListener("change", () => {
    updateRouteContext();
  });

  modelProfileSelect.addEventListener("change", () => {
    updateRouteContext();
  });

  for (const button of suggestionButtons) {
    button.addEventListener("click", () => {
      messageInput.value = button.dataset.message || "";
      switchView("chat", { focusComposer: true });
    });
  }

  topHealthBtn.addEventListener("click", async () => {
    await refreshHealth();
  });

  topNewSessionBtn.addEventListener("click", async () => {
    await resetSession();
  });

  messageInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
      return;
    }
    event.preventDefault();
    chatForm.requestSubmit();
  });

  showTraceBtn.addEventListener("click", () => {
    refreshTracePanel(true);
  });

  toggleTrace.addEventListener("click", () => {
    tracePanel.classList.add("hidden");
  });

  docsOutlineFilter.addEventListener("input", () => {
    renderDocsOutline(state.docsHeadings);
  });

  window.addEventListener("scroll", () => {
    if (state.currentView === "docs") {
      updateDocsScrollState();
    }
  }, { passive: true });

  window.addEventListener("popstate", () => {
    const locationState = readLocationState();
    state.docsLanguage = locationState.language;
    updateDocsLanguageButtons();
    switchView(locationState.view, { focusComposer: false, skipHistory: true });
  });

  applyPatchBtn.addEventListener("click", async () => {
    if (!state.pendingPatch) {
      return;
    }

    const applyingPatch = state.pendingPatch;
    setButtonBusy(applyPatchBtn, true, "应用中...");

    try {
      const data = await requestJson("/api/patch/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionId: state.sessionId,
          patchId: applyingPatch.patchId
        })
      });

      appendMessage(
        "assistant",
        "QWEN",
        data.success ? `补丁已应用：${data.message}` : `补丁应用失败：${data.message}`
      );
      pushPatchHistory(applyingPatch, data.success, data.message);

      if (data.success) {
        renderPatch(null);
        showToast("补丁已成功应用。", "success");
      } else {
        showToast("补丁应用失败，请先检查预览内容。", "error");
      }
    } catch (error) {
      pushPatchHistory(applyingPatch, false, error.message);
      appendMessage("assistant", "QWEN", `补丁应用失败：${error.message}`);
      showToast(`补丁应用失败：${error.message}`, "error");
    } finally {
      setButtonBusy(applyPatchBtn, false, "应用中...", "应用补丁");
    }
  });

  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = messageInput.value.trim();
    if (!message) {
      return;
    }

    appendMessage("user", "你", message);
    messageInput.value = "";
    appendMessage("assistant", "QWEN", "正在整理回复，请稍候...");
    const pending = chatLog.lastElementChild;
    pending.classList.add("pending");

    setComposerBusy(true);
    setRequestStatus("busy", "状态：请求处理中");

    try {
      const data = await requestJson("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message,
          sessionId: state.sessionId,
          backend: backendSelect.value || "auto",
          modelProfile: modelProfileSelect.value || "auto"
        })
      });

      state.lastTrace = Array.isArray(data.steps) ? data.steps : [];
      renderTools(Array.isArray(data.toolsUsed) ? data.toolsUsed : []);
      renderPatch(data.pendingPatch || null);
      updateTraceButton();
      refreshTracePanel(false);
      updateResolvedRuntime(data);

      setMessageContent(pending, data.answer || "模型返回了空响应。", { markdown: true });
      pending.classList.remove("pending");

      setRequestStatus(
        "idle",
        data.fallbackUsed ? "状态：已完成，已走回退" : "状态：已完成"
      );

      if (data.pendingPatch) {
        showToast("已生成补丁预览，确认后可直接应用。", "info");
      } else if (data.fallbackUsed) {
        showToast(`本次请求已自动回退到 ${formatBackendLabel(data.backend)}。`, "warning");
      } else {
        showToast(`请求已完成，命中 ${formatBackendLabel(data.backend)}。`, "success");
      }
    } catch (error) {
      setMessageContent(pending, `请求失败：${error.message}`);
      pending.classList.remove("pending");
      setRequestStatus("error", "状态：请求失败");
      refreshTracePanel(false);
      showToast(`请求失败：${error.message}`, "error");
    } finally {
      setComposerBusy(false);
      chatLog.scrollTop = chatLog.scrollHeight;
    }
  });
}

function initialize() {
  const locationState = readLocationState();
  state.docsLanguage = locationState.language;
  resetChatLog();
  renderTools([]);
  renderPatch(null);
  renderPatchHistory();
  renderHealthFailure("等待健康检查。");
  setRequestStatus("idle", "状态：就绪");
  updateSessionContext();
  updateRouteContext();
  updateDocsContext();
  updatePatchContext();
  updateDocsLanguageButtons();
  updateTraceButton();
  switchView(locationState.view, { focusComposer: false, skipHistory: true, resetScroll: true });
  void loadRuntimeOptions();
  void refreshHealth({ silent: true });
}

function switchView(view, options = {}) {
  if (!views[view]) {
    return;
  }

  if (views[state.currentView]) {
    state.viewScroll[state.currentView] = window.scrollY;
  }

  state.currentView = view;

  for (const [name, element] of Object.entries(views)) {
    element.classList.toggle("hidden", name !== view);
  }

  for (const button of navTabs) {
    const active = button.dataset.viewTarget === view;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  }

  updateViewContext();
  updateDocumentTitle();

  if (!options.skipHistory) {
    syncLocationState({ replace: Boolean(options.replaceHistory) });
  }

  if (view === "docs") {
    void loadDocs(state.docsLanguage);
  }

  const targetScroll = options.resetScroll ? 0 : (state.viewScroll[view] || 0);
  requestAnimationFrame(() => {
    window.scrollTo({ top: targetScroll, behavior: "auto" });
    if (view === "chat" && options.focusComposer !== false) {
      messageInput.focus();
    }
    if (view === "docs") {
      updateDocsScrollState();
    }
  });
}

async function resetSession() {
  const previousSessionId = state.sessionId;
  setButtonBusy(topNewSessionBtn, true, "重置中...");

  try {
    await fetch(`/api/session/${previousSessionId}/clear`, { method: "POST" });
  } catch (error) {
    // Best effort only.
  } finally {
    state.sessionId = crypto.randomUUID();
    state.lastTrace = [];
    state.lastToolsUsed = [];
    state.pendingPatch = null;
    state.patchHistory = [];
    messageInput.value = "";
    renderTools([]);
    renderPatch(null);
    renderPatchHistory();
    tracePanel.classList.add("hidden");
    resetChatLog();
    if (state.runtimeOptions) {
      updateRuntimeSummaryFromOptions();
    }
    updateSessionContext();
    updateTraceButton();
    updatePatchContext();
    setRequestStatus("idle", "状态：新会话");
    setButtonBusy(topNewSessionBtn, false, "重置中...", "新会话");
    showToast("已重置会话上下文。", "info");
  }
}

async function refreshHealth(options = {}) {
  const silent = Boolean(options.silent);
  setButtonBusy(topHealthBtn, true, "检查中...");
  renderHealthChecking();

  try {
    const data = await requestJson("/api/health");
    const visualState = mapHealthState(data.status);
    setHealthVisualState(visualState, buildHealthDetail(data));
    renderHealthSnapshot(data, visualState);

    if (!silent) {
      showToast(
        visualState === "ok" ? "健康检查通过。" : "健康检查完成，当前为降级或异常状态。",
        visualState === "ok" ? "success" : "warning"
      );
    }
  } catch (error) {
    renderHealthFailure(error.message);
    if (!silent) {
      showToast(`健康检查失败：${error.message}`, "error");
    }
  } finally {
    setButtonBusy(topHealthBtn, false, "检查中...", "健康检查");
  }
}

function renderHealthChecking() {
  setHealthVisualState("checking", "正在检查当前本地服务状态。");
  healthHeadline.textContent = "正在检查本地服务";
  healthSummary.textContent = "正在检查 Spring Boot、主后端和两个推理通道。";
  welcomeHealthSummary.textContent = "正在检查当前应用和模型后端状态。";
}

function renderHealthSnapshot(data, visualState) {
  const statusText = visualState === "ok"
    ? "服务可用"
    : visualState === "degraded"
      ? "服务降级"
      : "服务异常";
  const backendLabel = formatBackendLabel(data.backend);
  const summary = data.message || `当前主后端为 ${backendLabel}。`;

  healthHeadline.textContent = `${statusText} · ${backendLabel}`;
  healthSummary.textContent = summary;
  springStatusValue.textContent = localizeStatus(data.spring);
  healthBackendValue.textContent = backendLabel;
  healthOllamaValue.textContent = localizeStatus(data.ollama);
  healthOpenvinoValue.textContent = localizeStatus(data.openvino);

  welcomeHealthSummary.textContent = summary;
  welcomeSpringValue.textContent = localizeStatus(data.spring);
  welcomeHealthBackendValue.textContent = backendLabel;
  welcomeOllamaValue.textContent = localizeStatus(data.ollama);
  welcomeOpenvinoValue.textContent = localizeStatus(data.openvino);
}

function renderHealthFailure(message) {
  setHealthVisualState("fail", message || "未能获取当前健康状态。");
  healthHeadline.textContent = "健康检查失败";
  healthSummary.textContent = message || "未能获取健康状态。";
  springStatusValue.textContent = "失败";
  healthBackendValue.textContent = "未知";
  healthOllamaValue.textContent = "未知";
  healthOpenvinoValue.textContent = "未知";

  welcomeHealthSummary.textContent = message || "未能获取健康状态。";
  welcomeSpringValue.textContent = "失败";
  welcomeHealthBackendValue.textContent = "未知";
  welcomeOllamaValue.textContent = "未知";
  welcomeOpenvinoValue.textContent = "未知";
}

function setHealthVisualState(visualState, detail) {
  topHealthBadge.textContent = TOP_HEALTH_LABELS[visualState] || TOP_HEALTH_LABELS.fail;
  topHealthBadge.className = `top-health ${visualState}`;
  topHealthBadge.title = detail || "";

  healthStatus.textContent = BADGE_LABELS[visualState] || BADGE_LABELS.fail;
  healthStatus.className = `soft-badge ${visualState}`;

  welcomeHealthBadge.textContent = BADGE_LABELS[visualState] || BADGE_LABELS.fail;
  welcomeHealthBadge.className = `soft-badge ${visualState}`;
}

function mapHealthState(status) {
  if (status === "healthy") {
    return "ok";
  }
  if (status === "degraded") {
    return "degraded";
  }
  return "fail";
}

function buildHealthDetail(data) {
  return [
    `应用 ${localizeStatus(data.spring)}`,
    `后端 ${formatBackendLabel(data.backend)}`,
    `Ollama ${localizeStatus(data.ollama)}`,
    `OpenVINO ${localizeStatus(data.openvino)}`,
    data.machineProfile ? `机器 ${data.machineProfile}` : ""
  ].filter(Boolean).join(" | ");
}

async function loadRuntimeOptions() {
  try {
    const data = await requestJson("/api/runtime/options");
    state.runtimeOptions = data;
    populateBackendOptions(data.availableBackends || []);
    populateModelProfileOptions(data.modelProfiles || []);
    updateRuntimeSummaryFromOptions();
    updateRouteContext();
  } catch (error) {
    runtimeHint.textContent = `运行时选项不可用：${error.message}`;
    runtimeHint.classList.add("is-error");
    welcomeRuntimeHint.textContent = `默认配置读取失败：${error.message}`;
    welcomeRuntimeHint.classList.add("is-error");
  }
}

function populateBackendOptions(backends) {
  const current = backendSelect.value || "auto";
  backendSelect.innerHTML = "";
  backendSelect.appendChild(createOption("auto", "自动"));
  for (const backend of backends) {
    backendSelect.appendChild(createOption(backend, formatBackendLabel(backend)));
  }
  backendSelect.value = hasOption(backendSelect, current) ? current : "auto";
}

function populateModelProfileOptions(profiles) {
  const current = modelProfileSelect.value || "auto";
  modelProfileSelect.innerHTML = "";
  modelProfileSelect.appendChild(createOption("auto", "自动"));
  for (const profile of profiles) {
    const label = profile.displayName
      ? `${profile.displayName} (${formatBackendLabel(profile.backend)})`
      : `${profile.id} (${formatBackendLabel(profile.backend)})`;
    modelProfileSelect.appendChild(createOption(profile.id, label));
  }
  modelProfileSelect.value = hasOption(modelProfileSelect, current) ? current : "auto";
}

function updateRuntimeSummaryFromOptions() {
  const options = state.runtimeOptions;
  if (!options) {
    return;
  }

  welcomeMachineValue.textContent = options.machineProfile || "未知";
  welcomeBackendValue.textContent = formatBackendLabel(options.configuredBackend);
  welcomeCodeProfileValue.textContent = formatProfileLabel(options.autoCodeProfile);
  welcomeGeneralProfileValue.textContent = formatProfileLabel(options.autoGeneralProfile);
  welcomeRuntimeHint.textContent = buildWelcomeRuntimeHint(options);
  welcomeRuntimeHint.classList.remove("is-error");

  machineProfileValue.textContent = options.machineProfile || "未知";
  runtimeBackendValue.textContent = formatBackendLabel(options.configuredBackend);
  runtimeModelValue.textContent = "等待请求";
  runtimeFallbackValue.textContent = formatFallbackLabel(options.configuredFallbackBackend);
  updateModelDetails({
    profileText: `${formatProfileLabel(options.autoCodeProfile)} / ${formatProfileLabel(options.autoGeneralProfile)}`,
    backendText: "自动路由",
    modelText: [
      `代码档：${findProfileOption(options.autoCodeProfile)?.model || options.autoCodeProfile || "未知"}`,
      `轻写作：${findProfileOption(options.autoGeneralProfile)?.model || options.autoGeneralProfile || "未知"}`
    ].join("\n")
  });
  runtimeHint.textContent = buildDefaultRuntimeHint(options);
  runtimeHint.classList.remove("is-error");
  updateRouteContext();
}

function updateResolvedRuntime(data) {
  runtimeBackendValue.textContent = data.fallbackUsed
    ? `${formatBackendLabel(data.backend)}（自动回退）`
    : formatBackendLabel(data.backend);
  runtimeModelValue.textContent = formatResolvedModelSummary(data);
  runtimeFallbackValue.textContent = data.fallbackUsed
    ? "已触发回退"
    : formatFallbackLabel(state.runtimeOptions?.configuredFallbackBackend);
  updateModelDetails({
    profileText: formatResolvedModelSummary(data),
    backendText: formatBackendLabel(data.backend),
    modelText: data.model || "未知"
  });
  runtimeHint.textContent = buildResolvedRuntimeHint(data);
  runtimeHint.classList.remove("is-error");
}

function buildWelcomeRuntimeHint(options) {
  const fallback = options.configuredFallbackBackend
    ? `，不可用时会回退到 ${formatBackendLabel(options.configuredFallbackBackend)}`
    : "";
  return `默认主后端为 ${formatBackendLabel(options.configuredBackend)}，自动代码档使用 ${formatProfileLabel(options.autoCodeProfile)}，自动轻写作使用 ${formatProfileLabel(options.autoGeneralProfile)}${fallback}。`;
}

function buildDefaultRuntimeHint(options) {
  return `自动模式会优先把代码、调试和工具规划类请求路由到 ${formatProfileLabel(options.autoCodeProfile)}，把轻写作、整理和翻译类请求路由到 ${formatProfileLabel(options.autoGeneralProfile)}。`;
}

function buildResolvedRuntimeHint(data) {
  const reason = data.selectionReason || "本次请求未返回选择原因。";
  const mode = localizeSelectionMode(data.selectionMode);
  const fallback = data.fallbackUsed ? " 本次请求触发了后端回退。" : "";
  return `${mode}：${reason}${fallback}`;
}

function formatResolvedModelSummary(data) {
  if (data.modelProfile) {
    return formatProfileLabel(data.modelProfile);
  }
  if (data.model) {
    return shortenModelIdentifier(data.model);
  }
  return "未标注档位";
}

function updateModelDetails(details) {
  runtimeModelProfileValue.textContent = details.profileText || "未知";
  runtimeModelBackendValue.textContent = details.backendText || "未知";
  runtimeModelFullValue.textContent = details.modelText || "未知";
}

function renderTools(toolsUsed) {
  state.lastToolsUsed = [...toolsUsed];
  toolBar.innerHTML = "";
  if (!toolsUsed.length) {
    toolBar.classList.add("hidden");
    updateTraceContext();
    return;
  }

  toolBar.classList.remove("hidden");
  for (const tool of toolsUsed) {
    const chip = document.createElement("span");
    chip.className = "tool-chip";
    chip.textContent = tool;
    toolBar.appendChild(chip);
  }
  updateTraceContext();
}

function renderPatch(patch) {
  state.pendingPatch = patch;
  patchPreview.replaceChildren();

  if (!patch) {
    patchPanel.classList.add("hidden");
    updatePatchContext();
    return;
  }

  patchPanel.classList.remove("hidden");

  const meta = document.createElement("div");
  meta.className = "patch-meta";
  meta.appendChild(createPatchMetaItem(`文件 ${patch.path || "未知文件"}`));

  const line = extractPreviewLine(patch.preview);
  if (line) {
    meta.appendChild(createPatchMetaItem(`行号 ${line}`));
  }

  const diff = document.createElement("div");
  diff.className = "patch-diff";
  diff.appendChild(createDiffCard("remove", "当前内容", patch.search || ""));
  diff.appendChild(createDiffCard("add", "更新后", patch.replace || ""));

  patchPreview.appendChild(meta);
  patchPreview.appendChild(diff);
  updatePatchContext();
}

function createPatchMetaItem(text) {
  const item = document.createElement("div");
  item.className = "patch-meta-item";
  item.textContent = text;
  return item;
}

function createDiffCard(kind, label, content) {
  const card = document.createElement("section");
  card.className = `diff-card ${kind}`;

  const heading = document.createElement("div");
  heading.className = "diff-label";
  heading.textContent = label;

  const body = document.createElement("pre");
  body.className = "diff-body";
  body.textContent = content || "（空）";

  card.appendChild(heading);
  card.appendChild(body);
  return card;
}

function extractPreviewLine(preview) {
  const match = /^LINE:\s*(.+)$/m.exec(preview || "");
  return match ? match[1] : "";
}

function pushPatchHistory(patch, success, message) {
  if (!patch) {
    return;
  }

  state.patchHistory.unshift({
    path: patch.path || "未知文件",
    success,
    message: message || "",
    time: new Date().toLocaleTimeString("zh-CN", { hour12: false })
  });
  state.patchHistory = state.patchHistory.slice(0, 6);
  renderPatchHistory();
}

function renderPatchHistory() {
  patchHistoryList.replaceChildren();

  if (!state.patchHistory.length) {
    patchHistoryPanel.classList.add("hidden");
    updatePatchContext();
    return;
  }

  patchHistoryPanel.classList.remove("hidden");
  for (const entry of state.patchHistory) {
    const item = document.createElement("article");
    item.className = `patch-history-item ${entry.success ? "success" : "fail"}`;

    const badge = document.createElement("div");
    badge.className = "patch-history-badge";
    badge.textContent = entry.success ? "成功" : "失败";

    const main = document.createElement("div");
    main.className = "patch-history-main";

    const path = document.createElement("div");
    path.className = "patch-history-path";
    path.textContent = entry.path;

    const message = document.createElement("div");
    message.className = "patch-history-message";
    message.textContent = entry.message || (entry.success ? "补丁已应用。" : "补丁应用失败。");

    const time = document.createElement("div");
    time.className = "patch-history-time";
    time.textContent = entry.time;

    main.appendChild(path);
    main.appendChild(message);

    item.appendChild(badge);
    item.appendChild(main);
    item.appendChild(time);
    patchHistoryList.appendChild(item);
  }
  updatePatchContext();
}

function appendMessage(role, badge, content, options = {}) {
  const article = document.createElement("article");
  article.className = `message ${role}`;

  const badgeEl = document.createElement("div");
  badgeEl.className = "message-badge";
  badgeEl.textContent = badge;

  const body = document.createElement("div");
  body.className = "message-body";

  article.appendChild(badgeEl);
  article.appendChild(body);
  setMessageContent(article, content, options);
  chatLog.appendChild(article);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function setMessageContent(article, content, options = {}) {
  const body = article.querySelector(".message-body");
  if (!body) {
    return;
  }

  if (options.markdown) {
    const rendered = renderMarkdown(content || "");
    body.classList.add("rich-text");
    body.innerHTML = rendered.html || `<p>${escapeHtml(content || "")}</p>`;
    return;
  }

  body.classList.remove("rich-text");
  body.textContent = content;
}

function resetChatLog() {
  chatLog.innerHTML = "";
  appendMessage(
    "assistant",
    "QWEN",
    [
      "欢迎进入本地 Qwen 工作台。",
      "",
      "- 先做一次健康检查，确认当前主后端和回退链路。",
      "- 需要项目全貌时，先去文档页看 README，再带着上下文回来聊天。",
      "- 需要改代码时，再在这里发起中文联调请求，结合 trace 和补丁预览推进。"
    ].join("\n"),
    { markdown: true }
  );
}

function refreshTracePanel(forceOpen) {
  if (forceOpen) {
    tracePanel.classList.remove("hidden");
  }
  if (tracePanel.classList.contains("hidden")) {
    return;
  }
  traceContent.textContent = state.lastTrace.length
    ? state.lastTrace.join("\n\n")
    : "当前还没有可显示的执行链路。";
}

async function loadDocs(language, options = {}) {
  const normalized = normalizeDocsLanguage(language);
  state.docsLanguage = normalized;
  updateDocsLanguageButtons();
  syncLocationState({ replace: Boolean(options.replaceHistory) });

  if (!options.force && state.docsCache.has(normalized)) {
    renderDocs(state.docsCache.get(normalized), { fromCache: true });
    return;
  }

  renderDocsLoading(normalized);
  setButtonBusy(docsRefreshBtn, true, "加载中...");

  try {
    const data = await requestJson(`/api/docs/${normalized}`);
    state.docsCache.set(normalized, data);
    renderDocs(data, { fromCache: false });
  } catch (error) {
    renderDocsError(normalized, error.message);
    showToast(`文档加载失败：${error.message}`, "error");
  } finally {
    setButtonBusy(docsRefreshBtn, false, "加载中...", "重新加载文档");
  }
}

function renderDocsLoading(language) {
  state.docsStatus = "加载中";
  state.docsHeadings = [];
  setActiveDocsAnchor("");
  docsTitle.textContent = language === "en" ? "Project Guide" : "项目说明";
  docsMeta.textContent = `正在从 ${getDocsSourceName(language)} 读取内容。`;
  docsInfoLanguage.textContent = getDocsLanguageLabel(language);
  docsInfoSource.textContent = getDocsSourceName(language);
  docsInfoStatus.textContent = "加载中";
  docsHeadingCount.textContent = "0";
  docsReadingTime.textContent = "--";
  renderDocsProgress(0);
  docsArticle.innerHTML = `<div class="docs-loading"><p>正在加载 ${getDocsSourceName(language)} ...</p></div>`;
  docsOutline.innerHTML = `<p class="empty-copy">文档加载中...</p>`;
  updateDocsContext();
}

function renderDocs(data, options = {}) {
  const language = normalizeDocsLanguage(data.language);
  state.docsLanguage = language;
  updateDocsLanguageButtons();

  const rendered = renderMarkdown(data.content || "");
  const sourceName = getDocsSourceName(language);
  state.docsStatus = options.fromCache ? "已缓存" : "已同步";
  state.docsHeadings = rendered.headings.filter((heading) => heading.level <= 3);

  docsTitle.textContent = data.title || (language === "en" ? "Project Guide" : "项目说明");
  docsMeta.textContent = `${sourceName} · 直接读取仓库文档 · 适合先浏览结构再进入聊天。`;
  docsInfoLanguage.textContent = getDocsLanguageLabel(language);
  docsInfoSource.textContent = sourceName;
  docsInfoStatus.textContent = state.docsStatus;
  docsHeadingCount.textContent = String(state.docsHeadings.length);
  docsReadingTime.textContent = `${estimateReadingMinutes(data.content || "")} 分钟`;
  docsArticle.innerHTML = rendered.html
    ? `<div class="docs-content">${rendered.html}</div>`
    : `<div class="docs-placeholder"><p>当前文档没有可显示内容。</p></div>`;
  renderDocsOutline(state.docsHeadings);
  updateDocsContext();
  requestAnimationFrame(() => {
    updateDocsScrollState();
  });
}

function renderDocsError(language, message) {
  state.docsStatus = "加载失败";
  state.docsHeadings = [];
  setActiveDocsAnchor("");
  docsInfoLanguage.textContent = getDocsLanguageLabel(language);
  docsInfoSource.textContent = getDocsSourceName(language);
  docsInfoStatus.textContent = state.docsStatus;
  docsMeta.textContent = `读取 ${getDocsSourceName(language)} 失败。`;
  docsHeadingCount.textContent = "0";
  docsReadingTime.textContent = "--";
  renderDocsProgress(0);
  docsArticle.innerHTML = `<div class="docs-error"><p>文档加载失败：${escapeHtml(message)}</p></div>`;
  docsOutline.innerHTML = `<p class="empty-copy">文档加载失败，无法生成目录。</p>`;
  updateDocsContext();
}

function renderDocsOutline(headings) {
  docsOutline.replaceChildren();

  const keyword = docsOutlineFilter.value.trim().toLowerCase();
  const visibleHeadings = headings.filter((heading) => {
    if (!keyword) {
      return true;
    }
    return heading.text.toLowerCase().includes(keyword);
  });

  if (!headings.length) {
    docsOutline.innerHTML = `<p class="empty-copy">当前文档没有可用的标题导航。</p>`;
    return;
  }

  if (!visibleHeadings.length) {
    docsOutline.innerHTML = `<p class="empty-copy">没有匹配当前关键词的章节。</p>`;
    return;
  }

  for (const heading of visibleHeadings) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `outline-button level-${Math.min(heading.level, 3)}`;
    button.dataset.anchor = heading.anchor;
    button.textContent = heading.text;
    button.addEventListener("click", () => {
      setActiveDocsAnchor(heading.anchor);
      const target = document.getElementById(heading.anchor);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    button.classList.toggle("active", heading.anchor === state.activeDocsAnchor);
    docsOutline.appendChild(button);
  }
}

function readLocationState() {
  const url = new URL(window.location.href);
  const view = views[url.searchParams.get("view")] ? url.searchParams.get("view") : "welcome";
  const language = normalizeDocsLanguage(url.searchParams.get("lang") || state.docsLanguage);
  return { view, language };
}

function syncLocationState(options = {}) {
  const url = new URL(window.location.href);
  const nextView = state.currentView;
  const nextLanguage = normalizeDocsLanguage(state.docsLanguage);

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
}

function updateViewContext() {
  contextViewValue.textContent = VIEW_LABELS[state.currentView] || "工作台";
}

function updateSessionContext() {
  contextSessionValue.textContent = shortenSessionId(state.sessionId);
  contextSessionValue.title = state.sessionId;
}

function updateRouteContext() {
  const backend = formatBackendLabel(backendSelect.value || "auto");
  const profile = formatProfileLabel(modelProfileSelect.value || "auto");
  contextRouteValue.textContent = `后端 ${backend} · 档位 ${profile}`;
  contextRouteValue.title = "显示的是当前请求下拉框中的手动偏好。";
}

function updateTraceContext() {
  if (!state.lastTrace.length) {
    contextTraceValue.textContent = "暂无请求";
    contextTraceValue.title = "";
    return;
  }

  const toolText = state.lastToolsUsed.length ? ` · ${state.lastToolsUsed.length} 个工具` : "";
  contextTraceValue.textContent = `${state.lastTrace.length} 步链路${toolText}`;
  contextTraceValue.title = state.lastTrace.join("\n\n");
}

function updateDocsContext() {
  contextDocsValue.textContent = `${getDocsSourceName(state.docsLanguage)} · ${state.docsStatus}`;
  contextDocsValue.title = `当前文档语言：${getDocsLanguageLabel(state.docsLanguage)}`;
}

function updatePatchContext() {
  if (state.pendingPatch?.path) {
    contextPatchValue.textContent = `待确认 ${shortenPath(state.pendingPatch.path)}`;
    contextPatchValue.title = state.pendingPatch.path;
    return;
  }

  if (state.patchHistory.length) {
    const latest = state.patchHistory[0];
    contextPatchValue.textContent = `${latest.success ? "最近已应用" : "最近失败"} · ${shortenPath(latest.path)}`;
    contextPatchValue.title = latest.path;
    return;
  }

  contextPatchValue.textContent = "无待确认补丁";
  contextPatchValue.title = "";
}

function updateDocumentTitle() {
  document.title = `Qwen 本地工作台 · ${VIEW_LABELS[state.currentView] || "工作台"}`;
}

function updateTraceButton() {
  const traceCount = state.lastTrace.length;
  showTraceBtn.disabled = traceCount === 0;
  showTraceBtn.textContent = traceCount ? `查看上次链路 (${traceCount})` : "查看上次链路";
  showTraceBtn.title = traceCount ? `最近一次请求返回 ${traceCount} 个 trace 步骤。` : "当前还没有请求 trace。";
  updateTraceContext();
}

function updateDocsScrollState() {
  const content = docsArticle.querySelector(".docs-content");
  if (!content) {
    renderDocsProgress(0);
    setActiveDocsAnchor("");
    return;
  }

  renderDocsProgress(calculateDocsProgress(content));
  updateActiveDocsAnchor();
}

function calculateDocsProgress(content) {
  const viewportHeight = window.innerHeight || 1;
  const top = content.getBoundingClientRect().top + window.scrollY;
  const height = content.offsetHeight;
  const start = top - 170;
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

  return Math.max(0, Math.min(100, Math.round(((window.scrollY - start) / (end - start)) * 100)));
}

function renderDocsProgress(progress) {
  docsProgressText.textContent = `${progress}%`;
  docsProgressBar.style.width = `${progress}%`;
}

function updateActiveDocsAnchor() {
  if (!state.docsHeadings.length) {
    setActiveDocsAnchor("");
    return;
  }

  let activeAnchor = state.docsHeadings[0].anchor;
  for (const heading of state.docsHeadings) {
    const element = document.getElementById(heading.anchor);
    if (element && element.getBoundingClientRect().top <= 180) {
      activeAnchor = heading.anchor;
    }
  }
  setActiveDocsAnchor(activeAnchor);
}

function setActiveDocsAnchor(anchor) {
  state.activeDocsAnchor = anchor;
  for (const button of docsOutline.querySelectorAll(".outline-button")) {
    button.classList.toggle("active", button.dataset.anchor === anchor);
  }
}

function estimateReadingMinutes(markdown) {
  const text = extractPlainText(markdown);
  const cjkCount = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const latinWords = text.replace(/[\u4e00-\u9fff]/g, " ").split(/\s+/).filter(Boolean).length;
  const totalMinutes = (cjkCount / 450) + (latinWords / 220);
  return Math.max(1, Math.round(totalMinutes || 1));
}

function extractPlainText(markdown) {
  return String(markdown || "")
    .replace(/\r\n?/g, "\n")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*_\-]/g, " ")
    .replace(/\d+\./g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shortenSessionId(sessionId) {
  if (!sessionId) {
    return "未知";
  }
  return sessionId.length > 10 ? `${sessionId.slice(0, 8)}...` : sessionId;
}

function shortenPath(path) {
  const value = String(path || "");
  const parts = value.split(/[\\/]/).filter(Boolean);
  if (parts.length <= 2) {
    return value || "未知文件";
  }
  return `${parts[0]}/.../${parts[parts.length - 1]}`;
}

function renderMarkdown(markdown) {
  const lines = String(markdown || "").replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  const headings = [];
  const usedAnchors = new Set();

  let paragraphLines = [];
  let listType = null;
  let listItems = [];
  let quoteLines = [];
  let inCodeBlock = false;
  let codeLanguage = "";
  let codeLines = [];

  function flushParagraph() {
    if (!paragraphLines.length) {
      return;
    }
    blocks.push(`<p>${renderInlineMarkdown(paragraphLines.join(" "))}</p>`);
    paragraphLines = [];
  }

  function flushList() {
    if (!listItems.length || !listType) {
      return;
    }
    const items = listItems.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join("");
    blocks.push(`<${listType}>${items}</${listType}>`);
    listType = null;
    listItems = [];
  }

  function flushQuote() {
    if (!quoteLines.length) {
      return;
    }
    blocks.push(`<blockquote><p>${renderInlineMarkdown(quoteLines.join(" "))}</p></blockquote>`);
    quoteLines = [];
  }

  function flushCode() {
    if (!codeLines.length && !codeLanguage) {
      return;
    }
    const languageClass = codeLanguage ? ` class="language-${escapeAttribute(codeLanguage)}"` : "";
    blocks.push(`<pre><code${languageClass}>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
    codeLines = [];
    codeLanguage = "";
  }

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, "  ");

    if (inCodeBlock) {
      if (/^```/.test(line.trim())) {
        flushCode();
        inCodeBlock = false;
      } else {
        codeLines.push(rawLine);
      }
      continue;
    }

    const fenceMatch = line.match(/^```([\w-]*)\s*$/);
    if (fenceMatch) {
      flushParagraph();
      flushList();
      flushQuote();
      inCodeBlock = true;
      codeLanguage = fenceMatch[1] || "";
      codeLines = [];
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      flushQuote();
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      flushQuote();
      const level = Math.min(headingMatch[1].length, 3);
      const text = stripMarkdown(headingMatch[2].trim());
      const anchor = createAnchor(text, usedAnchors, headings.length + 1);
      headings.push({ level, text, anchor });
      blocks.push(`<h${level} id="${anchor}">${renderInlineMarkdown(headingMatch[2].trim())}</h${level}>`);
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flushParagraph();
      flushList();
      flushQuote();
      blocks.push("<hr>");
      continue;
    }

    const quoteMatch = line.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      quoteLines.push(quoteMatch[1]);
      continue;
    }

    const unorderedMatch = line.match(/^[-*]\s+(.+)$/);
    if (unorderedMatch) {
      flushParagraph();
      flushQuote();
      if (listType && listType !== "ul") {
        flushList();
      }
      listType = "ul";
      listItems.push(unorderedMatch[1]);
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph();
      flushQuote();
      if (listType && listType !== "ol") {
        flushList();
      }
      listType = "ol";
      listItems.push(orderedMatch[1]);
      continue;
    }

    paragraphLines.push(line.trim());
  }

  if (inCodeBlock) {
    flushCode();
  }
  flushParagraph();
  flushList();
  flushQuote();

  return {
    html: blocks.join(""),
    headings
  };
}

function renderInlineMarkdown(text) {
  let safe = escapeHtml(text || "");
  const codeTokens = [];

  safe = safe.replace(/`([^`]+)`/g, (_, code) => {
    const token = `@@CODE${codeTokens.length}@@`;
    codeTokens.push(`<code>${code}</code>`);
    return token;
  });

  safe = safe.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
    const href = /^https?:\/\//i.test(url) ? url : "#";
    if (href === "#") {
      return `<a href="#">${label}</a>`;
    }
    return `<a href="${escapeAttribute(href)}" target="_blank" rel="noreferrer">${label}</a>`;
  });

  safe = safe.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  safe = safe.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  for (let index = 0; index < codeTokens.length; index += 1) {
    safe = safe.replace(`@@CODE${index}@@`, codeTokens[index]);
  }

  return safe;
}

function stripMarkdown(text) {
  return String(text || "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[>#]/g, "")
    .trim();
}

function createAnchor(text, usedAnchors, fallbackIndex) {
  const base = stripMarkdown(text)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "") || `section-${fallbackIndex}`;

  let candidate = base;
  let suffix = 2;

  while (usedAnchors.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  usedAnchors.add(candidate);
  return candidate;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function updateDocsLanguageButtons() {
  for (const button of docsLanguageButtons) {
    const active = button.dataset.docsLanguage === state.docsLanguage;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  }
}

function normalizeDocsLanguage(language) {
  return String(language || "").toLowerCase().startsWith("en") ? "en" : "zh";
}

function getDocsSourceName(language) {
  return normalizeDocsLanguage(language) === "en" ? "README.en.md" : "README.md";
}

function getDocsLanguageLabel(language) {
  return normalizeDocsLanguage(language) === "en" ? "English" : "中文";
}

function setComposerBusy(busy) {
  messageInput.disabled = busy;
  sendBtn.disabled = busy;
  backendSelect.disabled = busy;
  modelProfileSelect.disabled = busy;
  setButtonBusy(sendBtn, busy, "发送中...", "发送请求");
}

function setRequestStatus(tone, text) {
  requestStatus.className = `request-status ${tone}`;
  requestStatus.textContent = text;
}

function setButtonBusy(button, busy, busyLabel, idleLabel) {
  if (!button.dataset.idleLabel) {
    button.dataset.idleLabel = idleLabel || button.textContent;
  }
  button.disabled = busy;
  button.textContent = busy ? busyLabel : (idleLabel || button.dataset.idleLabel);
}

function createOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function hasOption(select, value) {
  return Array.from(select.options).some((option) => option.value === value);
}

function findProfileOption(profileId) {
  if (!state.runtimeOptions || !Array.isArray(state.runtimeOptions.modelProfiles)) {
    return null;
  }
  return state.runtimeOptions.modelProfiles.find((profile) => profile.id === profileId) || null;
}

function formatProfileLabel(profileId) {
  if (!profileId || profileId === "auto") {
    return "自动";
  }
  const profile = findProfileOption(profileId);
  return profile?.displayName || profileId;
}

function formatBackendLabel(backend) {
  switch (backend) {
    case "ollama":
      return "Ollama";
    case "openvino":
      return "OpenVINO";
    case "auto":
      return "自动";
    default:
      return backend || "未知";
  }
}

function formatFallbackLabel(backend) {
  return backend ? formatBackendLabel(backend) : "无";
}

function shortenModelIdentifier(model) {
  const text = String(model || "");
  const parts = text.split(/[\\/]/);
  return parts[parts.length - 1] || text || "未知";
}

function localizeSelectionMode(mode) {
  switch (mode) {
    case "profile":
      return "手动档位";
    case "backend":
      return "手动后端";
    case "fallback":
      return "自动回退";
    case "auto":
      return "自动路由";
    default:
      return "未标注模式";
  }
}

function localizeStatus(status) {
  switch (status) {
    case "up":
      return "可用";
    case "down":
      return "不可用";
    case "disabled":
      return "未配置";
    case "healthy":
      return "健康";
    case "degraded":
      return "降级";
    default:
      return status || "未知";
  }
}

function showToast(message, tone = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${tone}`;
  toast.textContent = message;
  toastStack.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("visible");
  });

  window.setTimeout(() => {
    toast.classList.remove("visible");
    window.setTimeout(() => toast.remove(), 220);
  }, 2600);
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (isJson && payload && typeof payload === "object") {
      throw new Error(payload.error || payload.message || `Status ${response.status}`);
    }
    throw new Error(payload || `Status ${response.status}`);
  }

  return payload;
}
