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

const HEALTH_STATE_LABELS = {
  checking: "\u68c0\u6d4b\u4e2d",
  ok: "\u53cc\u7aef\u6b63\u5e38",
  degraded: "\u540e\u7aef\u964d\u7ea7",
  fail: "\u68c0\u6d4b\u5931\u8d25"
};

let lastTrace = [];
let pendingPatch = null;
let patchHistory = [];
let sessionId = crypto.randomUUID();

for (const button of document.querySelectorAll(".suggestion")) {
  button.addEventListener("click", () => {
    messageInput.value = button.dataset.message || "";
    messageInput.focus();
  });
}

messageInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.isComposing) {
    return;
  }
  if (event.ctrlKey) {
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
  appendMessage("assistant", "QWEN", "\u5df2\u521b\u5efa\u65b0\u4f1a\u8bdd\u3002\u65b0\u7684\u4e0a\u4e0b\u6587\u5df2\u7ecf\u5f00\u59cb\u3002");
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
    const response = await fetch("/api/patch/apply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sessionId,
        patchId: pendingPatch.patchId
      })
    });

    if (!response.ok) {
      throw new Error(`\u72b6\u6001\u7801 ${response.status}`);
    }

    const data = await response.json();
    appendMessage(
      "assistant",
      "QWEN",
      data.success
        ? `\u4fee\u6539\u5df2\u5e94\u7528\uff1a${data.message}`
        : `\u4fee\u6539\u5931\u8d25\uff1a${data.message}`
    );
    pushPatchHistory(applyingPatch, data.success, data.message);
    if (data.success) {
      renderPatch(null);
    }
  } catch (error) {
    pushPatchHistory(applyingPatch, false, error.message);
    appendMessage("assistant", "QWEN", `\u5e94\u7528\u4fee\u6539\u5931\u8d25\uff1a${error.message}`);
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
  appendMessage("assistant", "QWEN", "\u6b63\u5728\u601d\u8003...");
  const pending = chatLog.lastElementChild;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message, sessionId })
    });

    if (!response.ok) {
      throw new Error(`\u72b6\u6001\u7801 ${response.status}`);
    }

    const data = await response.json();
    lastTrace = Array.isArray(data.steps) ? data.steps : [];
    renderTools(Array.isArray(data.toolsUsed) ? data.toolsUsed : []);
    renderPatch(data.pendingPatch || null);
    refreshTracePanel(false);
    pending.querySelector(".message-body").textContent = data.answer || "(empty response)";
  } catch (error) {
    pending.querySelector(".message-body").textContent = `\u8bf7\u6c42\u5931\u8d25\uff1a${error.message}`;
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
    : "\u5f53\u524d\u8fd8\u6ca1\u6709\u53ef\u663e\u793a\u7684\u6267\u884c\u8f68\u8ff9\u3002";
}

async function refreshHealth() {
  setHealthState("checking", "\u6b63\u5728\u68c0\u67e5 Spring Boot \u4e0e\u672c\u5730\u6a21\u578b\u540e\u7aef...");
  try {
    const response = await fetch("/api/health");
    if (!response.ok) {
      throw new Error(`\u72b6\u6001\u7801 ${response.status}`);
    }
    const data = await response.json();
    const nextState = data.status === "healthy" ? "ok" : data.status === "degraded" ? "degraded" : "fail";
    setHealthState(nextState, buildHealthDetail(data));
  } catch (error) {
    setHealthState("fail", `\u5065\u5eb7\u68c0\u67e5\u5931\u8d25\uff1a${error.message}`);
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

refreshHealth();
