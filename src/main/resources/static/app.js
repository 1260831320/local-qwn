const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const chatLog = document.getElementById("chatLog");
const newSessionBtn = document.getElementById("newSessionBtn");
const healthBtn = document.getElementById("healthBtn");
const healthStatus = document.getElementById("healthStatus");
const tracePanel = document.getElementById("tracePanel");
const traceContent = document.getElementById("traceContent");
const showTraceBtn = document.getElementById("showTraceBtn");
const toggleTrace = document.getElementById("toggleTrace");
const toolBar = document.getElementById("toolBar");
const patchPanel = document.getElementById("patchPanel");
const patchPreview = document.getElementById("patchPreview");
const applyPatchBtn = document.getElementById("applyPatchBtn");
const patchHistoryPanel = document.getElementById("patchHistoryPanel");
const patchHistoryList = document.getElementById("patchHistoryList");
const backendSelect = document.getElementById("backendSelect");
const modelProfileSelect = document.getElementById("modelProfileSelect");
const runtimeHint = document.getElementById("runtimeHint");
const machineProfileValue = document.getElementById("machineProfileValue");
const runtimeBackendValue = document.getElementById("runtimeBackendValue");
const runtimeModelValue = document.getElementById("runtimeModelValue");
const runtimeFallbackValue = document.getElementById("runtimeFallbackValue");

const HEALTH_STATE_LABELS = {
  checking: "CHECKING",
  ok: "HEALTHY",
  degraded: "DEGRADED",
  fail: "FAILED"
};

let lastTrace = [];
let pendingPatch = null;
let patchHistory = [];
let runtimeOptions = null;
let sessionId = crypto.randomUUID();

for (const button of document.querySelectorAll(".suggestion")) {
  button.addEventListener("click", () => {
    messageInput.value = button.dataset.message || "";
    messageInput.focus();
  });
}

messageInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.isComposing || event.ctrlKey) {
    return;
  }
  event.preventDefault();
  chatForm.requestSubmit();
});

healthBtn.addEventListener("click", async () => {
  await refreshHealth();
});

newSessionBtn.addEventListener("click", async () => {
  try {
    await fetch(`/api/session/${sessionId}/clear`, { method: "POST" });
  } catch (error) {
    // best effort
  }
  sessionId = crypto.randomUUID();
  lastTrace = [];
  pendingPatch = null;
  patchHistory = [];
  renderTools([]);
  renderPatch(null);
  renderPatchHistory();
  tracePanel.classList.add("hidden");
  chatLog.innerHTML = "";
  appendMessage("assistant", "QWEN", "A new session has started.");
});

showTraceBtn.addEventListener("click", () => {
  refreshTracePanel(true);
});

toggleTrace.addEventListener("click", () => {
  tracePanel.classList.add("hidden");
});

applyPatchBtn.addEventListener("click", async () => {
  if (!pendingPatch) {
    return;
  }

  const applyingPatch = pendingPatch;
  applyPatchBtn.disabled = true;
  try {
    const data = await requestJson("/api/patch/apply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sessionId,
        patchId: pendingPatch.patchId
      })
    });

    appendMessage(
      "assistant",
      "QWEN",
      data.success
        ? `Patch applied: ${data.message}`
        : `Patch failed: ${data.message}`
    );
    pushPatchHistory(applyingPatch, data.success, data.message);
    if (data.success) {
      renderPatch(null);
    }
  } catch (error) {
    pushPatchHistory(applyingPatch, false, error.message);
    appendMessage("assistant", "QWEN", `Applying the patch failed: ${error.message}`);
  } finally {
    applyPatchBtn.disabled = false;
  }
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = messageInput.value.trim();
  if (!message) {
    return;
  }

  appendMessage("user", "YOU", message);
  messageInput.value = "";
  appendMessage("assistant", "QWEN", "Thinking...");
  const pending = chatLog.lastElementChild;

  try {
    const data = await requestJson("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        sessionId,
        backend: backendSelect.value || "auto",
        modelProfile: modelProfileSelect.value || "auto"
      })
    });

    lastTrace = Array.isArray(data.steps) ? data.steps : [];
    renderTools(Array.isArray(data.toolsUsed) ? data.toolsUsed : []);
    renderPatch(data.pendingPatch || null);
    refreshTracePanel(false);
    updateResolvedRuntime(data);
    pending.querySelector(".message-body").textContent = data.answer || "(empty response)";
  } catch (error) {
    pending.querySelector(".message-body").textContent = `Request failed: ${error.message}`;
    refreshTracePanel(false);
  }

  chatLog.scrollTop = chatLog.scrollHeight;
});

function appendMessage(role, badge, content) {
  const article = document.createElement("article");
  article.className = `message ${role}`;

  const badgeEl = document.createElement("div");
  badgeEl.className = "message-badge";
  badgeEl.textContent = badge;

  const body = document.createElement("div");
  body.className = "message-body";
  body.textContent = content;

  article.appendChild(badgeEl);
  article.appendChild(body);
  chatLog.appendChild(article);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function renderTools(toolsUsed) {
  toolBar.innerHTML = "";
  if (!toolsUsed.length) {
    toolBar.classList.add("hidden");
    return;
  }
  toolBar.classList.remove("hidden");
  for (const tool of toolsUsed) {
    const chip = document.createElement("span");
    chip.className = "tool-chip";
    chip.textContent = tool;
    toolBar.appendChild(chip);
  }
}

function renderPatch(patch) {
  pendingPatch = patch;
  patchPreview.replaceChildren();
  if (!patch) {
    patchPanel.classList.add("hidden");
    return;
  }
  patchPanel.classList.remove("hidden");

  const meta = document.createElement("div");
  meta.className = "patch-meta";
  meta.appendChild(createPatchMetaItem(`FILE ${patch.path || "(unknown)"}`));

  const line = extractPreviewLine(patch.preview);
  if (line) {
    meta.appendChild(createPatchMetaItem(`LINE ${line}`));
  }

  const diff = document.createElement("div");
  diff.className = "patch-diff";
  diff.appendChild(createDiffCard("remove", "Current", patch.search || ""));
  diff.appendChild(createDiffCard("add", "Updated", patch.replace || ""));

  patchPreview.appendChild(meta);
  patchPreview.appendChild(diff);
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
  body.textContent = content || "(empty)";

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
  patchHistory.unshift({
    path: patch.path || "(unknown)",
    success,
    message: message || "",
    time: new Date().toLocaleTimeString("zh-CN", { hour12: false })
  });
  patchHistory = patchHistory.slice(0, 6);
  renderPatchHistory();
}

function renderPatchHistory() {
  patchHistoryList.replaceChildren();
  if (!patchHistory.length) {
    patchHistoryPanel.classList.add("hidden");
    return;
  }

  patchHistoryPanel.classList.remove("hidden");
  for (const entry of patchHistory) {
    const item = document.createElement("article");
    item.className = `patch-history-item ${entry.success ? "success" : "fail"}`;

    const badge = document.createElement("div");
    badge.className = "patch-history-badge";
    badge.textContent = entry.success ? "Applied" : "Failed";

    const main = document.createElement("div");
    main.className = "patch-history-main";

    const path = document.createElement("div");
    path.className = "patch-history-path";
    path.textContent = entry.path;

    const message = document.createElement("div");
    message.className = "patch-history-message";
    message.textContent = entry.message || (entry.success ? "Patch applied." : "Patch failed.");

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
}

function refreshTracePanel(forceOpen) {
  if (forceOpen) {
    tracePanel.classList.remove("hidden");
  }
  if (tracePanel.classList.contains("hidden")) {
    return;
  }
  traceContent.textContent = lastTrace.length
    ? lastTrace.join("\n\n")
    : "No execution trace is available yet.";
}

async function refreshHealth() {
  setHealthState("checking", "Checking Spring Boot and local model backends...");
  try {
    const data = await requestJson("/api/health");
    const nextState = data.status === "healthy" ? "ok" : data.status === "degraded" ? "degraded" : "fail";
    setHealthState(nextState, buildHealthDetail(data));
    if (data.machineProfile) {
      machineProfileValue.textContent = data.machineProfile;
    }
  } catch (error) {
    setHealthState("fail", `Health check failed: ${error.message}`);
  }
}

function setHealthState(state, detail) {
  healthStatus.textContent = HEALTH_STATE_LABELS[state] || HEALTH_STATE_LABELS.fail;
  healthStatus.className = `health-pill ${state}`;
  healthStatus.title = detail || "";
}

function buildHealthDetail(data) {
  const backend = data.backend || "unknown";
  const spring = data.spring || "unknown";
  const ollama = data.ollama || "unknown";
  const openvino = data.openvino || "unknown";
  const machineProfile = data.machineProfile || "unknown";
  const message = data.message || "";
  return `Spring: ${spring} | Machine: ${machineProfile} | Backend: ${backend} | Ollama: ${ollama} | OpenVINO: ${openvino}${message ? ` | ${message}` : ""}`;
}

async function loadRuntimeOptions() {
  try {
    runtimeOptions = await requestJson("/api/runtime/options");
    populateBackendOptions(runtimeOptions.availableBackends || []);
    populateModelProfileOptions(runtimeOptions.modelProfiles || []);
    updateRuntimeSummaryFromOptions();
  } catch (error) {
    runtimeHint.textContent = `Runtime options are unavailable: ${error.message}`;
    runtimeHint.classList.add("runtime-hint-error");
  }
}

function populateBackendOptions(backends) {
  const current = backendSelect.value || "auto";
  backendSelect.innerHTML = "";
  backendSelect.appendChild(createOption("auto", "Auto"));
  for (const backend of backends) {
    backendSelect.appendChild(createOption(backend, backend));
  }
  backendSelect.value = hasOption(backendSelect, current) ? current : "auto";
}

function populateModelProfileOptions(profiles) {
  const current = modelProfileSelect.value || "auto";
  modelProfileSelect.innerHTML = "";
  modelProfileSelect.appendChild(createOption("auto", "Auto"));
  for (const profile of profiles) {
    const label = profile.displayName
      ? `${profile.displayName} (${profile.backend})`
      : `${profile.id} (${profile.backend})`;
    modelProfileSelect.appendChild(createOption(profile.id, label));
  }
  modelProfileSelect.value = hasOption(modelProfileSelect, current) ? current : "auto";
}

function updateRuntimeSummaryFromOptions() {
  machineProfileValue.textContent = runtimeOptions.machineProfile || "unknown";
  runtimeBackendValue.textContent = runtimeOptions.configuredBackend || "auto";
  runtimeFallbackValue.textContent = runtimeOptions.configuredFallbackBackend || "none";
  runtimeModelValue.textContent = `auto: ${runtimeOptions.autoCodeProfile || "?"} / ${runtimeOptions.autoGeneralProfile || "?"}`;
  runtimeHint.textContent = buildDefaultRuntimeHint(runtimeOptions);
  runtimeHint.classList.remove("runtime-hint-error");
}

function updateResolvedRuntime(data) {
  runtimeBackendValue.textContent = data.fallbackUsed
    ? `${data.backend || "unknown"} (fallback)`
    : (data.backend || "unknown");
  runtimeModelValue.textContent = formatResolvedModel(data);
  runtimeHint.textContent = buildResolvedRuntimeHint(data);
  runtimeHint.classList.remove("runtime-hint-error");
}

function formatResolvedModel(data) {
  const profile = data.modelProfile || "unknown-profile";
  const model = abbreviateModel(data.model || "");
  return model ? `${profile} -> ${model}` : profile;
}

function buildDefaultRuntimeHint(options) {
  return `Auto mode uses ${options.autoCodeProfile || "?"} for coding/tool work and ${options.autoGeneralProfile || "?"} for lightweight writing. If both fields are set, model profile wins.`;
}

function buildResolvedRuntimeHint(data) {
  const mode = data.selectionMode || "unknown";
  const reason = data.selectionReason || "No selection reason was returned.";
  const fallback = data.fallbackUsed ? " Fallback was used during this turn." : "";
  return `${mode}: ${reason}${fallback}`;
}

function abbreviateModel(model) {
  if (!model) {
    return "";
  }
  if (model.length <= 48) {
    return model;
  }
  return `${model.slice(0, 22)}...${model.slice(-18)}`;
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

loadRuntimeOptions();
refreshHealth();
