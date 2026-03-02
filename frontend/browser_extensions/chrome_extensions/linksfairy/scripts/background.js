const STORAGE_KEYS = {
  blockNotifications: "blockNotifications",
  tabAnalyses: "tabAnalyses",
  clientInstallId: "clientInstallId",
  clientInstallCreatedAt: "clientInstallCreatedAt"
};

const LEGACY_STORAGE_KEYS = ["mistralApiKey", "mistralApiKeyValidated"];

const DEFAULT_STORAGE = {
  [STORAGE_KEYS.blockNotifications]: false,
  [STORAGE_KEYS.tabAnalyses]: {}
};

const API_HOST = "https://YOUR_API_BASE_URL";
const API_BASE_PATH = "/prod";
const LOOKUP_ANALYSIS_VERSION = "v1.1";
const LOOKUP_ENDPOINT = `${API_HOST}${API_BASE_PATH}/v1/lookup`;
const REPORT_ENDPOINT = `${API_HOST}${API_BASE_PATH}/v1/report`;
const API_ENDPOINTS = {
  lookup: LOOKUP_ENDPOINT,
  report: REPORT_ENDPOINT
};

const ACTION_ICON_PATHS_BY_STATE = {
  safe: {
    16: "images/fairy-status-safe-16.png",
    32: "images/fairy-status-safe-32.png",
    48: "images/fairy-status-safe-48.png",
    128: "images/fairy-status-safe-128.png"
  },
  caution: {
    16: "images/fairy-status-caution-16.png",
    32: "images/fairy-status-caution-32.png",
    48: "images/fairy-status-caution-48.png",
    128: "images/fairy-status-caution-128.png"
  },
  risk: {
    16: "images/fairy-status-risk-16.png",
    32: "images/fairy-status-risk-32.png",
    48: "images/fairy-status-risk-48.png",
    128: "images/fairy-status-risk-128.png"
  },
  unknown: {
    16: "images/fairy-status-loading-16.png",
    32: "images/fairy-status-loading-32.png",
    48: "images/fairy-status-loading-48.png",
    128: "images/fairy-status-loading-128.png"
  }
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(DEFAULT_STORAGE, (values) => {
    const normalized = {
      [STORAGE_KEYS.blockNotifications]:
        typeof values[STORAGE_KEYS.blockNotifications] === "boolean"
          ? values[STORAGE_KEYS.blockNotifications]
          : false,
      [STORAGE_KEYS.tabAnalyses]:
        values[STORAGE_KEYS.tabAnalyses] && typeof values[STORAGE_KEYS.tabAnalyses] === "object"
          ? values[STORAGE_KEYS.tabAnalyses]
          : {}
    };

    chrome.storage.local.set(normalized, () => {
      chrome.storage.local.remove(LEGACY_STORAGE_KEYS, () => {
        applyNotificationPolicy(normalized[STORAGE_KEYS.blockNotifications] !== false);
        void refreshToolbarForActiveTab();
      });
    });
  });
});

chrome.runtime.onStartup.addListener(() => {
  applyNotificationPolicyFromStorage();
  refreshToolbarForActiveTab();
});

chrome.action.onClicked.addListener((tab) => {
  const tabId = tab && typeof tab.id === "number" ? tab.id : null;
  if (tabId === null) {
    return;
  }

  void requestPanelToggle(tabId);
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  const tabId = activeInfo && typeof activeInfo.tabId === "number" ? activeInfo.tabId : null;
  if (tabId === null) {
    return;
  }
  void refreshToolbarForTab(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (!changeInfo || changeInfo.status !== "loading") {
    return;
  }
  void clearTabAnalysis(tabId);
  void applyActionIconForTab(tabId, "unknown");
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void clearTabAnalysis(tabId);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") {
    return;
  }

  if (!changes[STORAGE_KEYS.blockNotifications]) {
    return;
  }

  const nextValue = changes[STORAGE_KEYS.blockNotifications].newValue;
  applyNotificationPolicy(nextValue !== false);
});

function applyNotificationPolicyFromStorage() {
  chrome.storage.local.get(
    {
      [STORAGE_KEYS.blockNotifications]: false
    },
    (values) => {
      applyNotificationPolicy(values[STORAGE_KEYS.blockNotifications] !== false);
    }
  );
}

function applyNotificationPolicy(shouldBlock) {
  if (!chrome.contentSettings || !chrome.contentSettings.notifications) {
    return;
  }

  chrome.contentSettings.notifications.set(
    {
      primaryPattern: "<all_urls>",
      secondaryPattern: "<all_urls>",
      setting: shouldBlock ? "block" : "ask",
      scope: "regular"
    },
    () => {
      // Ignore runtime errors in environments where this policy cannot be applied.
    }
  );
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.action !== "string") {
    return;
  }

  if (message.action === "analyzeCurrentPage") {
    analyzeCurrentPage(message.payload, sender)
      .then((result) => {
        sendResponse({ ok: true, result });
      })
      .catch((error) => {
        sendResponse({ ok: false, error: error.message || "Error desconocido." });
      });

    return true;
  }

  if (message.action === "submitReport") {
    submitReport(message.payload || {})
      .then((result) => {
        sendResponse({ ok: true, result });
      })
      .catch((error) => {
        sendResponse({ ok: false, error: error.message || "Error enviando feedback." });
      });

    return true;
  }

  if (message.action === "openOptionsPage") {
    chrome.runtime.openOptionsPage(() => {
      if (chrome.runtime.lastError) {
        sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }

      sendResponse({ ok: true });
    });

    return true;
  }

  if (message.action === "getActiveTabAnalysis") {
    getActiveTabAnalysis()
      .then((result) => {
        sendResponse({ ok: true, result });
      })
      .catch((error) => {
        sendResponse({ ok: false, error: error.message || "No se pudo cargar el analisis." });
      });

    return true;
  }

  if (message.action === "getTabZoom") {
    getSenderTabZoom(sender)
      .then((zoom) => {
        sendResponse({ ok: true, result: { zoom } });
      })
      .catch((error) => {
        sendResponse({ ok: false, error: error.message || "No se pudo resolver el zoom de la pestaña." });
      });

    return true;
  }
});

async function getSenderTabZoom(sender) {
  const tabId = sender && sender.tab && typeof sender.tab.id === "number" ? sender.tab.id : null;
  if (tabId === null || !chrome.tabs || typeof chrome.tabs.getZoom !== "function") {
    return 1;
  }

  return new Promise((resolve) => {
    chrome.tabs.getZoom(tabId, (zoomFactor) => {
      if (chrome.runtime.lastError) {
        resolve(1);
        return;
      }
      const parsedZoom = Number(zoomFactor);
      resolve(Number.isFinite(parsedZoom) && parsedZoom > 0 ? parsedZoom : 1);
    });
  });
}

async function submitReport(payload) {
  const requestPayload = payload && typeof payload === "object" ? payload : {};
  const analysisId = toTrimmedString(requestPayload.analysis_id);
  const canonicalUrl = toTrimmedString(requestPayload.canonical_url);
  const reason = toTrimmedString(requestPayload.reason).toLowerCase();
  const feedback = normalizeFeedbackValue(requestPayload.feedback);
  const locale = normalizeLocale(requestPayload.locale || "en-US");
  const comment = toTrimmedString(requestPayload.comment);

  if (!analysisId && !canonicalUrl) {
    throw new Error("analysis_id o canonical_url es obligatorio para report.");
  }

  const normalizedReason = resolveReportReason(reason, feedback);

  if (!normalizedReason) {
    throw new Error("reason o feedback es obligatorio para report.");
  }

  const body = {
    locale: locale || "en-US"
  };

  if (analysisId) {
    body.analysis_id = analysisId;
  }

  if (canonicalUrl) {
    body.canonical_url = canonicalUrl;
  }

  if (normalizedReason) {
    body.reason = normalizedReason;
  }

  if (feedback) {
    body.feedback = feedback;
  }

  if (comment) {
    body.comment = comment;
  }

  const requestClientInstallId = toTrimmedString(requestPayload.client_install_id || requestPayload.clientInstallId);
  const clientInstallId = requestClientInstallId || (await ensureClientInstallId());
  if (clientInstallId) {
    body.client_install_id = clientInstallId;
  }

  const reportResponse = await runReportRequest(API_ENDPOINTS.report, body);
  if (reportResponse.ok) {
    return {
      httpStatus: reportResponse.httpStatus,
      data: reportResponse.data
    };
  }

  throw new Error(
    reportResponse.errorMessage || `El lambda respondio con estado HTTP ${reportResponse.httpStatus}.`
  );
}

function normalizeFeedbackValue(value) {
  const normalized = toTrimmedString(value).toLowerCase();
  if (!normalized) {
    return "";
  }

  const map = {
    up: "up",
    down: "down",
    yes: "up",
    no: "down",
    "thumbs_up": "up",
    "thumbs_down": "down",
    "pulgares hacia arriba": "up",
    "pulgares hacia abajo": "down",
    "hacia arriba": "up",
    "hacia abajo": "down",
    arriba: "up",
    abajo: "down"
  };

  return map[normalized] || "";
}

function resolveReportReason(rawReason, feedback) {
  const normalized = toTrimmedString(rawReason).toLowerCase();
  const normalizedFeedback = toTrimmedString(feedback).toLowerCase();

  if (normalizedFeedback === "up") {
    return "other";
  }

  const map = {
    incorrect_result: "incorrect_result",
    false_positive: "false_positive",
    false_negative: "false_negative",
    unsafe_not_detected: "unsafe_not_detected",
    wrong_justification: "wrong_justification",
    other: "other",
    too_risky: "wrong_justification",
    risky: "wrong_justification",
    unclear: "other",
    not_understood: "other"
  };

  if (!normalized) {
    return normalizedFeedback === "down" ? "incorrect_result" : "other";
  }

  return map[normalized] || "other";
}

async function runReportRequest(reportEndpoint, requestBody) {
  const response = await fetch(reportEndpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  const responseText = await response.text();
  const parsedBody = parseResponseBody(responseText);

  if (response.ok) {
    return {
      ok: true,
      httpStatus: response.status,
      data: parsedBody,
      errorMessage: ""
    };
  }

  return {
    ok: false,
    httpStatus: response.status,
    data: parsedBody,
    errorMessage: getErrorMessage(parsedBody) || `El lambda respondio con estado HTTP ${response.status}.`
  };
}

async function analyzeCurrentPage(payload, sender) {
  const requestPayload = payload && typeof payload === "object" ? payload : {};
  const pageUrl = toTrimmedString(requestPayload.pageUrl);
  const tabId = sender && sender.tab && typeof sender.tab.id === "number" ? sender.tab.id : null;

  if (!pageUrl) {
    throw new Error("No se ha recibido la URL de la pagina.");
  }

  if (tabId !== null) {
    await applyActionIconForTab(tabId, "unknown");
  }

  const lookupEndpoint = API_ENDPOINTS.lookup;

  const requestBody = {
    page_url: pageUrl,
    page_title: toTrimmedString(requestPayload.pageTitle),
    page_excerpt: toTrimmedString(requestPayload.pageExcerpt).slice(0, 1400),
    source: "linksfairy-chrome-extension",
    requested_at: new Date().toISOString(),
    analysis_version: LOOKUP_ANALYSIS_VERSION
  };

  const canonicalUrl = toTrimmedString(requestPayload.canonicalUrl);
  const documentLanguage = toTrimmedString(requestPayload.documentLanguage);
  const urlDomain = toTrimmedString(requestPayload.urlDomain);
  const urlTld = toTrimmedString(requestPayload.urlTld);

  if (canonicalUrl) {
    requestBody.canonical_url = canonicalUrl;
  }

  if (documentLanguage) {
    requestBody.document_language = documentLanguage;
  }

  requestBody.document_language = normalizeLocale(
    requestBody.document_language || requestPayload.documentLanguage || requestPayload.locale || ""
  );

  if (!requestBody.document_language) {
    requestBody.document_language = "en-US";
  }

  requestBody.locale = normalizeLocale(
    requestPayload.locale || requestBody.document_language || requestPayload.documentLanguage || "en-US"
  );

  if (urlDomain) {
    requestBody.url_domain = urlDomain;
  }

  if (urlTld) {
    requestBody.tld = urlTld;
  }

  const normalizedSnapshot = normalizeLookupSnapshot(
    normalizePageSnapshot(requestPayload.pageSnapshot),
    requestBody
  );
  requestBody.snapshot = normalizedSnapshot;

  if (!requestBody.canonical_url && normalizedSnapshot && normalizedSnapshot.canonical_tag) {
    requestBody.canonical_url = normalizedSnapshot.canonical_tag;
  }

  if (!requestBody.document_language && normalizedSnapshot && normalizedSnapshot.document_language) {
    requestBody.document_language = normalizedSnapshot.document_language;
  }

  if (!requestBody.url_domain && normalizedSnapshot && normalizedSnapshot.url_domain) {
    requestBody.url_domain = normalizedSnapshot.url_domain;
  }

  if (!requestBody.tld && normalizedSnapshot && normalizedSnapshot.tld) {
    requestBody.tld = normalizedSnapshot.tld;
  }

  const clientInstallId = toTrimmedString(requestPayload.clientInstallId);
  if (clientInstallId) {
    requestBody.client_install_id = clientInstallId;
  }

  const normalizedClientContext = normalizeClientContext(requestPayload.clientContext);
  if (normalizedClientContext) {
    requestBody.client_context = normalizedClientContext;
  }

  const primaryLookup = await runLookupRequest(lookupEndpoint, requestBody);
  if (primaryLookup.ok) {
    if (tabId !== null) {
      await persistTabAnalysis(tabId, pageUrl, primaryLookup.data);
      await applyActionIconForTab(tabId, deriveAdviceState(primaryLookup.data));
    }
    return {
      httpStatus: primaryLookup.httpStatus,
      data: primaryLookup.data
    };
  }

  throw new Error(primaryLookup.errorMessage || "No se pudo analizar la web.");
}

function parseResponseBody(rawText) {
  if (!rawText) {
    return {};
  }

  try {
    return JSON.parse(rawText);
  } catch (_error) {
    return { raw_response: rawText };
  }
}

function getErrorMessage(parsedBody) {
  if (!parsedBody || typeof parsedBody !== "object") {
    return "";
  }

  if (typeof parsedBody.error === "string") {
    return parsedBody.error;
  }

  if (typeof parsedBody.message === "string") {
    return parsedBody.message;
  }

  return "";
}

async function runLookupRequest(lookupEndpoint, requestBody) {
  const response = await fetch(lookupEndpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  const responseText = await response.text();
  const parsedBody = parseResponseBody(responseText);

  if (response.ok) {
    return {
      ok: true,
      httpStatus: response.status,
      data: parsedBody,
      errorMessage: ""
    };
  }

  return {
    ok: false,
    httpStatus: response.status,
    data: parsedBody,
    errorMessage: getErrorMessage(parsedBody) || `El lambda respondio con estado HTTP ${response.status}.`
  };
}

  function toTrimmedString(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function numberOrNull(value) {
    const number = typeof value === "number" ? value : Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function truncateText(value, maxLength) {
    const text = toTrimmedString(value);
    return text.length > maxLength ? text.slice(0, maxLength) : text;
  }

  function normalizeClientContext(value) {
    if (!value || typeof value !== "object") {
      return null;
    }

    const viewport = value.viewport || {};

    const clientContext = {
      user_agent: truncateText(toTrimmedString(value.user_agent), 400),
      language: truncateText(normalizeLocale(value.language), 64),
      platform: truncateText(toTrimmedString(value.platform), 64),
      timezone: truncateText(toTrimmedString(value.timezone), 128),
      document_language: truncateText(normalizeLocale(value.document_language), 64),
      referrer: truncateText(toTrimmedString(value.referrer), 512),
      page_protocol: truncateText(toTrimmedString(value.page_protocol), 16),
      is_secure: value.is_secure === true,
      webdriver: value.webdriver === true,
      viewport_width: numberOrNull(viewport.width),
      viewport_height: numberOrNull(viewport.height)
    };

    if (clientContext.viewport_width === null && clientContext.viewport_height === null) {
      delete clientContext.viewport_width;
      delete clientContext.viewport_height;
    }

    const sanitizedContext = {};
    Object.entries(clientContext).forEach(([key, currentValue]) => {
      if (currentValue === null || currentValue === undefined) {
        return;
      }

      if (typeof currentValue === "boolean") {
        sanitizedContext[key] = currentValue;
        return;
      }

      if (typeof currentValue === "number") {
        sanitizedContext[key] = currentValue;
        return;
      }

      if (typeof currentValue === "string" && currentValue.trim()) {
        sanitizedContext[key] = currentValue;
      }
    });

    return Object.keys(sanitizedContext).length > 0 ? sanitizedContext : null;
  }

  function normalizePageSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    const normalized = {
      canonical_tag: truncateText(toTrimmedString(snapshot.canonical_tag), 1024),
      page_html: truncateText(toTrimmedString(snapshot.page_html), 150000),
      visible_text: truncateText(toTrimmedString(snapshot.visible_text), 50000),
      meta_description: truncateText(toTrimmedString(snapshot.meta_description), 1024),
      meta_keywords: truncateText(toTrimmedString(snapshot.meta_keywords), 1024),
      document_language: truncateText(toTrimmedString(snapshot.document_language), 64),
      tld: truncateText(toTrimmedString(snapshot.tld), 64),
      url_domain: truncateText(toTrimmedString(snapshot.url_domain), 255),
      is_https: snapshot.is_https === true,
      contains_redirects: snapshot.contains_redirects === true,
      contains_suspicious_keywords: snapshot.contains_suspicious_keywords === true
    };

    normalized.headings = {
      h1: normalizeTextArray(snapshot.headings && snapshot.headings.h1, 12),
      h2: normalizeTextArray(snapshot.headings && snapshot.headings.h2, 12),
      h3: normalizeTextArray(snapshot.headings && snapshot.headings.h3, 12)
    };

    normalized.links = normalizeNumberPair(snapshot.links);
    normalized.forms = normalizeForms(snapshot.forms);
    normalized.scripts = normalizeScriptOrIframe(snapshot.scripts);
    normalized.iframes = normalizeScriptOrIframe(snapshot.iframes);

    return normalized;
  }

function normalizeLookupSnapshot(snapshot, requestBody) {
  const normalized = snapshot || {};
  const result = {
    ...normalized,
    canonical_tag: truncateText(
      toTrimmedString(normalized.canonical_tag || requestBody.canonical_url || requestBody.page_url),
      1024
    ),
    visible_text: normalizeTextField(normalized.visible_text, 50000),
    meta_description: normalizeTextField(normalized.meta_description, 1024),
    headings: {
      h1: normalizeTextArray(normalized.headings && normalized.headings.h1, 12),
        h2: normalizeTextArray(normalized.headings && normalized.headings.h2, 12),
        h3: normalizeTextArray(normalized.headings && normalized.headings.h3, 12)
      },
      links: normalizeNumberPair(normalized.links),
      forms: normalizeForms(normalized.forms),
      scripts: normalizeScriptOrIframe(normalized.scripts),
      iframes: normalizeScriptOrIframe(normalized.iframes),
      document_language: normalizeLocale(requestBody.document_language || normalized.document_language || ""),
      locale: normalizeLocale(requestBody.locale || requestBody.document_language || normalized.locale || normalized.document_language || "")
    };

  const normalizedPageHtml = normalizeTextField(normalized.page_html, 150000);
  if (normalizedPageHtml) {
    result.page_html = normalizedPageHtml;
  } else {
    delete result.page_html;
  }

  return result;
}

  function normalizeTextField(value, maxLength) {
    return truncateText(toTrimmedString(value), maxLength);
  }

  function normalizeLocale(value) {
    const raw = toTrimmedString(value).replace(/_/g, "-");
    if (!raw) {
      return "";
    }

    const parts = raw
      .split("-")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      return "";
    }

    const normalizedParts = [parts[0].toLowerCase()];

    parts.slice(1).forEach((part) => {
      if (/^[a-zA-Z]{2}$/.test(part)) {
        normalizedParts.push(part.toUpperCase());
        return;
      }

      if (/^[a-zA-Z]{4}$/.test(part)) {
        normalizedParts.push(`${part[0].toUpperCase()}${part.slice(1).toLowerCase()}`);
        return;
      }

      if (/^\d{3}$/.test(part)) {
        normalizedParts.push(part);
        return;
      }

      normalizedParts.push(part.toLowerCase());
    });

    return normalizedParts.join("-");
  }

function normalizeTextArray(value, maxItems) {
    if (!Array.isArray(value)) {
      return [];
    }

    const safeMaxItems = Math.max(0, Number(maxItems) || 0);
  return value
    .map((item) => truncateText(toTrimmedString(item), 220))
    .filter(Boolean)
    .slice(0, safeMaxItems);
}

async function ensureClientInstallId() {
  const values = await getStorageLocal({
    [STORAGE_KEYS.clientInstallId]: ""
  });
  const existingId = toTrimmedString(values[STORAGE_KEYS.clientInstallId]);

  if (existingId) {
    return existingId;
  }

  const generatedId = generateInstallId();
  await setStorageLocal({
    [STORAGE_KEYS.clientInstallId]: generatedId,
    [STORAGE_KEYS.clientInstallCreatedAt]: new Date().toISOString()
  });

  return generatedId;
}

function generateInstallId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes)
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }

  return `lf-${Date.now()}-${Math.random().toString(16).slice(2, 12)}`;
}

  function normalizeNumberPair(value) {
    if (!value || typeof value !== "object") {
      return {
        total: 0,
        external: 0,
        unique_external_domains: []
      };
    }

    return {
      total: numberOrNull(value.total) || 0,
      external: numberOrNull(value.external) || 0,
      unique_external_domains: normalizeTextArray(value.unique_external_domains, 30)
    };
  }

  function normalizeForms(value) {
    if (!value || typeof value !== "object") {
      return {
        count: 0,
        fields_count: 0,
        password_fields: 0,
        action_targets: []
      };
    }

    return {
      count: numberOrNull(value.count) || 0,
      fields_count: numberOrNull(value.fields_count) || 0,
      password_fields: numberOrNull(value.password_fields) || 0,
      action_targets: normalizeTextArray(value.action_targets, 12)
    };
  }

  function normalizeScriptOrIframe(value) {
    if (!value || typeof value !== "object") {
      return {
        total: 0,
        inline: 0,
        external: 0,
        external_domains: []
      };
    }

    return {
      total: numberOrNull(value.total) || 0,
      inline: numberOrNull(value.inline) || 0,
      external: numberOrNull(value.external) || 0,
      external_domains: normalizeTextArray(value.external_domains, 20)
    };
  }

async function getActiveTabAnalysis() {
  const activeTab = await queryActiveTab();
  if (!activeTab || typeof activeTab.id !== "number") {
    return null;
  }

  const tabMap = await getTabAnalysesMap();
  const record = tabMap[String(activeTab.id)] || null;
  const state = record && typeof record.state === "string" ? record.state : "unknown";
  await applyActionIconForTab(activeTab.id, state);
  if (!record) {
    return {
      tabId: activeTab.id,
      url: toTrimmedString(activeTab.url),
      analysis: null
    };
  }

  return {
    tabId: activeTab.id,
    url: toTrimmedString(activeTab.url),
    analysis: record
  };
}

async function persistTabAnalysis(tabId, pageUrl, responseData) {
  const normalizedTabId = Number(tabId);
  if (!Number.isFinite(normalizedTabId)) {
    return;
  }

  const tabMap = await getTabAnalysesMap();
  tabMap[String(normalizedTabId)] = buildTabAnalysisRecord(pageUrl, responseData);
  await setStorageLocal({
    [STORAGE_KEYS.tabAnalyses]: tabMap
  });
}

async function clearTabAnalysis(tabId) {
  const normalizedTabId = Number(tabId);
  if (!Number.isFinite(normalizedTabId)) {
    return;
  }

  const tabMap = await getTabAnalysesMap();
  const key = String(normalizedTabId);
  if (!Object.prototype.hasOwnProperty.call(tabMap, key)) {
    return;
  }

  delete tabMap[key];
  await setStorageLocal({
    [STORAGE_KEYS.tabAnalyses]: tabMap
  });
}

function buildTabAnalysisRecord(pageUrl, responseData) {
  const payload = responseData && typeof responseData === "object" ? responseData : {};
  const analysis = payload.analysis && typeof payload.analysis === "object" ? payload.analysis : {};
  const servedLocale = toTrimmedString(payload.served_locale || payload.source_locale).toLowerCase();
  const reasons = pickBestReasons(payload, analysis, servedLocale);
  const summary = pickBestText(payload, analysis, "summary", servedLocale);
  const overallAdviceText = pickBestText(payload, analysis, "overall_advice_text", servedLocale);
  const recommendedActionText = pickBestText(payload, analysis, "recommended_action_text", servedLocale);
  const purchaseRecommendationText = pickBestText(payload, analysis, "purchase_recommendation_text", servedLocale);
  const state = deriveAdviceState(payload);

  return {
    pageUrl: toTrimmedString(pageUrl),
    canonicalUrl: toTrimmedString(payload.canonical_url),
    state,
    overallAdvice: toTrimmedString(analysis.overall_advice || analysis.recommended_action),
    summary,
    overallAdviceText: toTrimmedString(overallAdviceText || recommendedActionText),
    purchaseRecommendationText,
    hasPurchaseContext: analysis.has_purchase_context === true,
    userFeedback: toTrimmedString(analysis.user_feedback || analysis.userFeedback),
    feedbackCounts: normalizeFeedbackCounts(
      analysis.feedback_counts || {
        up: analysis.report_up_count,
        down: analysis.report_down_count,
        total: analysis.report_count
      }
    ),
    reasons,
    scores: analysis.scores && typeof analysis.scores === "object" ? analysis.scores : {},
    analysisId: toTrimmedString(payload.analysis_id),
    cacheHit: payload.cache_hit === true || toTrimmedString(payload.status).toLowerCase() === "hit",
    fresh: typeof payload.fresh === "boolean" ? payload.fresh : null,
    createdAt: toTrimmedString(
      payload.created_at ||
      analysis.created_at ||
      payload.createdAt ||
      analysis.createdAt ||
      payload.updated_at ||
      analysis.updated_at ||
      payload.updatedAt ||
      analysis.updatedAt
    ),
    updatedAt: new Date().toISOString()
  };
}

function pickBestText(payload, analysis, baseKey, servedLocale = "") {
  const locale = toTrimmedString(servedLocale).toLowerCase();
  const localeUnderscore = locale.replace(/-/g, "_");
  const localeBase = locale.split("-")[0];
  const translations = payload && payload.translations && typeof payload.translations === "object"
    ? payload.translations
    : {};

  const translationCandidates = [
    translations[locale],
    translations[localeUnderscore],
    translations[localeBase]
  ].filter((item) => item && typeof item === "object");

  const localizedTranslationText = translationCandidates
    .map((item) => toTrimmedString(item[baseKey]))
    .find(Boolean);

  const localizedDirectText = [
    toTrimmedString(analysis && analysis[baseKey]),
    toTrimmedString(payload && payload[baseKey]),
    toTrimmedString(analysis && analysis[`${baseKey}_${localeUnderscore}`]),
    toTrimmedString(payload && payload[`${baseKey}_${localeUnderscore}`]),
    toTrimmedString(analysis && analysis[`${baseKey}_${localeBase}`]),
    toTrimmedString(payload && payload[`${baseKey}_${localeBase}`]),
    toTrimmedString(analysis && analysis[`${baseKey}_en`]),
    toTrimmedString(payload && payload[`${baseKey}_en`])
  ].find(Boolean);

  return localizedTranslationText || localizedDirectText || "";
}

function pickBestReasons(payload, analysis, servedLocale = "") {
  const locale = toTrimmedString(servedLocale).toLowerCase();
  const localeUnderscore = locale.replace(/-/g, "_");
  const localeBase = locale.split("-")[0];
  const translations = payload && payload.translations && typeof payload.translations === "object"
    ? payload.translations
    : {};

  const translationCandidates = [
    translations[locale],
    translations[localeUnderscore],
    translations[localeBase]
  ].filter((item) => item && typeof item === "object");

  const translationReasons = translationCandidates
    .map((item) => normalizeTextArray(item.reasons, 5))
    .find((items) => Array.isArray(items) && items.length > 0);

  const directCandidates = [
    analysis && analysis.reasons,
    payload && payload.reasons,
    analysis && analysis[`reasons_${localeUnderscore}`],
    payload && payload[`reasons_${localeUnderscore}`],
    analysis && analysis[`reasons_${localeBase}`],
    payload && payload[`reasons_${localeBase}`],
    analysis && analysis.reasons_en,
    payload && payload.reasons_en
  ];

  const directReasons = directCandidates
    .map((value) => normalizeTextArray(value, 5))
    .find((items) => Array.isArray(items) && items.length > 0);

  return (translationReasons || directReasons || []).slice(0, 5);
}

function normalizeFeedbackCounts(rawValue) {
  const raw = rawValue && typeof rawValue === "object" ? rawValue : {};
  const up = Number.isFinite(Number(raw.up)) ? Number(raw.up) : 0;
  const down = Number.isFinite(Number(raw.down)) ? Number(raw.down) : 0;
  const total = Number.isFinite(Number(raw.total))
    ? Number(raw.total)
    : Number.isFinite(Number(raw.report_count))
      ? Number(raw.report_count)
      : up + down;
  return {
    up: Math.max(0, Math.trunc(up)),
    down: Math.max(0, Math.trunc(down)),
    total: Math.max(0, Math.trunc(total))
  };
}

function deriveAdviceState(payload) {
  const analysis = payload && typeof payload.analysis === "object" ? payload.analysis : {};
  const trafficLight = toTrimmedString(analysis.traffic_light).toLowerCase();
  if (trafficLight === "green") {
    return "safe";
  }
  if (trafficLight === "yellow" || trafficLight === "amber") {
    return "caution";
  }
  if (trafficLight === "red") {
    return "risk";
  }

  const advice = toTrimmedString(analysis.overall_advice || analysis.recommended_action).toLowerCase();
  if (advice === "safe_enough") {
    return "safe";
  }
  if (advice === "caution") {
    return "caution";
  }
  if (advice === "avoid_purchase" || advice === "verify_elsewhere") {
    return "risk";
  }

  const scores = analysis.scores && typeof analysis.scores === "object" ? analysis.scores : {};
  const risk = Number(scores.risk ?? scores.scam_risk);
  if (Number.isFinite(risk)) {
    if (risk >= 7) {
      return "risk";
    }
    if (risk >= 4) {
      return "caution";
    }
    return "safe";
  }

  return "unknown";
}

async function refreshToolbarForActiveTab() {
  const activeTab = await queryActiveTab();
  if (!activeTab || typeof activeTab.id !== "number") {
    return;
  }
  await refreshToolbarForTab(activeTab.id);
}

async function refreshToolbarForTab(tabId) {
  const tabMap = await getTabAnalysesMap();
  const record = tabMap[String(tabId)];
  const state = record && typeof record.state === "string" ? record.state : "unknown";
  await applyActionIconForTab(tabId, state);
}

async function applyActionIconForTab(tabId, state) {
  const normalizedState = ACTION_ICON_PATHS_BY_STATE[state] ? state : "unknown";
  const path = resolveIconPathSet(ACTION_ICON_PATHS_BY_STATE[normalizedState]);
  await new Promise((resolve) => {
    chrome.action.setIcon(
      {
        tabId,
        path
      },
      () => {
        resolve();
      }
    );
  });

  await new Promise((resolve) => {
    chrome.action.setIcon(
      {
        path
      },
      () => {
        resolve();
      }
    );
  });

  await new Promise((resolve) => {
    chrome.action.setBadgeText(
      {
        tabId,
        text: ""
      },
      () => {
        resolve();
      }
    );
  });
}

function resolveIconPathSet(pathSet) {
  const resolved = {};
  const source = pathSet && typeof pathSet === "object" ? pathSet : {};
  Object.keys(source).forEach((sizeKey) => {
    const value = toTrimmedString(source[sizeKey]);
    if (!value) {
      return;
    }
    resolved[sizeKey] = chrome.runtime.getURL(value);
  });
  return resolved;
}

async function getTabAnalysesMap() {
  const values = await getStorageLocal({
    [STORAGE_KEYS.tabAnalyses]: {}
  });

  const raw = values[STORAGE_KEYS.tabAnalyses];
  return raw && typeof raw === "object" ? raw : {};
}

function getStorageLocal(defaults) {
  return new Promise((resolve) => {
    chrome.storage.local.get(defaults, (values) => {
      resolve(values || {});
    });
  });
}

function setStorageLocal(value) {
  return new Promise((resolve) => {
    chrome.storage.local.set(value, () => {
      resolve();
    });
  });
}

function queryActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }

      resolve(Array.isArray(tabs) && tabs.length > 0 ? tabs[0] : null);
    });
  });
}

function requestPanelToggle(tabId) {
  return sendPanelToggleMessage(tabId).then(async (delivered) => {
    if (delivered) {
      return true;
    }

    const injected = await ensureContentScriptInjected(tabId);
    if (!injected) {
      return false;
    }

    return sendPanelToggleMessage(tabId);
  });
}

function sendPanelToggleMessage(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(
      tabId,
      { action: "toggleLinksfairyPanel" },
      (response) => {
        if (chrome.runtime.lastError) {
          resolve(false);
          return;
        }

        resolve(Boolean(response && response.ok));
      }
    );
  });
}

function ensureContentScriptInjected(tabId) {
  if (!chrome.scripting || !chrome.scripting.executeScript) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        files: ["scripts/content.js"]
      },
      () => {
        resolve(!chrome.runtime.lastError);
      }
    );
  });
}
