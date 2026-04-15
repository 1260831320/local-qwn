window.HongzhiFrontend = window.HongzhiFrontend || {};

window.HongzhiFrontend.utils = (() => {
  function requestJson(url, options = {}) {
    return fetch(url, options).then(async (response) => {
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
    });
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

  function setButtonBusy(button, busy, busyLabel, idleLabel) {
    if (!button) {
      return;
    }

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

  function localizeSelectionMode(mode) {
    switch (mode) {
      case "profile":
        return "手动模式";
      case "backend":
        return "手动引擎";
      case "fallback":
        return "自动回退";
      case "auto":
        return "自动推荐";
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

  function shortenModelIdentifier(model) {
    const text = String(model || "");
    const parts = text.split(/[\\/]/);
    return parts[parts.length - 1] || text || "未知";
  }

  function shortenPath(path) {
    const value = String(path || "");
    const parts = value.split(/[\\/]/).filter(Boolean);
    if (parts.length <= 2) {
      return value || "未知文件";
    }
    return `${parts[0]}/.../${parts[parts.length - 1]}`;
  }

  function normalizeDocsLanguage(language) {
    return String(language || "").toLowerCase().startsWith("en") ? "en" : "zh";
  }

  function getDocsSourceName(language) {
    return normalizeDocsLanguage(language) === "en" ? "English Guide" : "中文说明";
  }

  function getDocsLanguageLabel(language) {
    return normalizeDocsLanguage(language) === "en" ? "English" : "中文";
  }

  return {
    requestJson,
    escapeHtml,
    escapeAttribute,
    setButtonBusy,
    createOption,
    hasOption,
    formatBackendLabel,
    formatFallbackLabel,
    localizeSelectionMode,
    localizeStatus,
    shortenModelIdentifier,
    shortenPath,
    normalizeDocsLanguage,
    getDocsSourceName,
    getDocsLanguageLabel
  };
})();
