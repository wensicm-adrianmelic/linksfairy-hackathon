const SUPPORTED_UI_LANGUAGES = ["es", "en", "pt", "fr", "de", "it", "ca"];

const EN_MESSAGES = {
  stateSafe: "Safe website",
  stateCaution: "Caution",
  stateRisk: "Untrusted",
  stateUnknown: "No analysis",
  summaryUnavailable: "No summary is available for this page.",
  summaryWaiting: "Open a website and wait for the automatic analysis.",
  errorLoadAnalysis: "Could not load the analysis.",
  errorNoAnalysisData: "No analysis data is available yet.",
  purchaseHeading: "Purchase safety",
  reasonsHeading: "Justification",
  feedbackTitle: "Rate this analysis",
  settingsButton: "Settings",
  feedbackDownHint: "Something seems off?",
  feedbackDownPlaceholder: "Write 1-2 lines about what looked off.",
  feedbackSubmit: "Send",
  feedbackReasonIncorrect: "The result is incorrect",
  feedbackReasonRisky: "It is too risky",
  feedbackReasonUnclear: "I don't understand the text",
  feedbackReasonOther: "Other",
  feedbackYesLabel: "Useful for me",
  feedbackNoLabel: "Not useful for me",
  feedbackUnavailable: "Not available for this analysis.",
  feedbackAlreadyVoted: "You already voted on this analysis.",
  feedbackSent: "Thanks for your feedback.",
  feedbackError: "Could not send feedback.",
  cacheHitLabel: "Already analyzed by the community",
  cacheMissLabel: "Live analysis",
  cacheStatusUnknown: "Analysis status updated",
  cacheStatusNow: "Updated just now",
  cacheStatusFresh: "Updated {minutes} min ago"
};

const UI_MESSAGES = {
  en: EN_MESSAGES,
  es: {
    ...EN_MESSAGES,
    stateSafe: "Web segura",
    stateCaution: "Precaucion",
    stateRisk: "No confiable",
    stateUnknown: "Sin analisis",
    summaryUnavailable: "No hay resumen disponible para esta pagina.",
    summaryWaiting: "Abre una web y espera al analisis automatico.",
    errorLoadAnalysis: "No se pudo cargar el analisis.",
    errorNoAnalysisData: "No hay datos de analisis todavia.",
    purchaseHeading: "Seguridad al comprar",
    reasonsHeading: "Justificacion",
    feedbackTitle: "Valora este analisis",
    settingsButton: "Configuracion",
    feedbackDownHint: "Que te parecio raro?",
    feedbackDownPlaceholder: "Escribe 1-2 lineas de lo que te llamo la atencion.",
    feedbackSubmit: "Enviar",
    feedbackReasonIncorrect: "El resultado es incorrecto",
    feedbackReasonRisky: "Es muy arriesgado",
    feedbackReasonUnclear: "No entiendo el texto",
    feedbackReasonOther: "Otro",
    feedbackYesLabel: "Me resulta util",
    feedbackNoLabel: "No me resulta util",
    feedbackUnavailable: "No disponible para este analisis.",
    feedbackAlreadyVoted: "Ya has votado este analisis.",
    feedbackSent: "Gracias por tu feedback.",
    feedbackError: "No se pudo enviar el feedback.",
    cacheHitLabel: "Ya analizado por la comunidad",
    cacheMissLabel: "Analisis en vivo",
    cacheStatusUnknown: "Estado de analisis actualizado",
    cacheStatusNow: "Actualizado hace pocos segundos",
    cacheStatusFresh: "Actualizado hace {minutes} min"
  },
  pt: {
    ...EN_MESSAGES,
    stateSafe: "Site seguro",
    stateCaution: "Cautela",
    stateRisk: "Nao confiavel",
    stateUnknown: "Sem analise",
    summaryUnavailable: "Nao ha resumo disponivel para esta pagina.",
    summaryWaiting: "Abre um site e aguarda a analise automatica.",
    errorLoadAnalysis: "Nao foi possivel carregar a analise.",
    errorNoAnalysisData: "Ainda nao ha dados de analise.",
    purchaseHeading: "Seguranca ao comprar",
    reasonsHeading: "Justificacao",
    feedbackTitle: "Avalia esta analise",
    settingsButton: "Configuracao",
    feedbackDownHint: "O que te pareceu estranho?",
    feedbackDownPlaceholder: "Escreve 1-2 linhas sobre o que te chamou a atencao.",
    feedbackReasonIncorrect: "O resultado esta incorreto",
    feedbackReasonRisky: "E muito arriscado",
    feedbackReasonUnclear: "Nao entendo o texto",
    feedbackYesLabel: "Foi util",
    feedbackNoLabel: "Nao foi util",
    feedbackUnavailable: "Nao disponivel para esta analise.",
    feedbackAlreadyVoted: "Ja votaste nesta analise.",
    feedbackSent: "Obrigado pelo teu feedback.",
    feedbackError: "Nao foi possivel enviar o feedback.",
    cacheHitLabel: "Ja analisado pela comunidade",
    cacheMissLabel: "Analise em direto",
    cacheStatusUnknown: "Estado da analise atualizado",
    cacheStatusNow: "Atualizado ha poucos segundos",
    cacheStatusFresh: "Atualizado ha {minutes} min"
  },
  fr: {
    ...EN_MESSAGES,
    stateSafe: "Site sur",
    stateCaution: "Prudence",
    stateRisk: "Non fiable",
    stateUnknown: "Sans analyse",
    summaryUnavailable: "Aucun resume disponible pour cette page.",
    summaryWaiting: "Ouvre un site et attends l'analyse automatique.",
    errorLoadAnalysis: "Impossible de charger l'analyse.",
    errorNoAnalysisData: "Aucune donnee d'analyse disponible pour le moment.",
    purchaseHeading: "Securite de l'achat",
    reasonsHeading: "Justification",
    feedbackTitle: "Evalue cette analyse",
    settingsButton: "Configuration",
    feedbackDownHint: "Qu'est-ce qui te semble etrange ?",
    feedbackDownPlaceholder: "Ecris 1-2 lignes sur ce qui t'a alerte.",
    feedbackReasonIncorrect: "Le resultat est incorrect",
    feedbackReasonRisky: "C'est trop risqu",
    feedbackReasonUnclear: "Je ne comprends pas le texte",
    feedbackYesLabel: "Utile pour moi",
    feedbackNoLabel: "Pas utile pour moi",
    feedbackUnavailable: "Non disponible pour cette analyse.",
    feedbackAlreadyVoted: "Vous avez deja vote sur cette analyse.",
    feedbackSent: "Merci pour votre feedback.",
    feedbackError: "Impossible d'envoyer le feedback.",
    cacheHitLabel: "Deja analyse par la communaute",
    cacheMissLabel: "Analyse en direct",
    cacheStatusUnknown: "Etat de l'analyse mis a jour",
    cacheStatusNow: "Mis a jour a l'instant",
    cacheStatusFresh: "Mis a jour il y a {minutes} min"
  },
  de: {
    ...EN_MESSAGES,
    stateSafe: "Sichere Website",
    stateCaution: "Vorsicht",
    stateRisk: "Nicht vertrauenswurdig",
    stateUnknown: "Keine Analyse",
    summaryUnavailable: "Keine Zusammenfassung fur diese Seite verfugbar.",
    summaryWaiting: "Offne eine Website und warte auf die automatische Analyse.",
    errorLoadAnalysis: "Analyse konnte nicht geladen werden.",
    errorNoAnalysisData: "Noch keine Analysedaten verfugbar.",
    purchaseHeading: "Sicherheit beim Kauf",
    reasonsHeading: "Begrundung",
    feedbackTitle: "Bewerte diese Analyse",
    settingsButton: "Einstellungen",
    feedbackDownHint: "Was wirkt fur dich ungewohnlich?",
    feedbackDownPlaceholder: "Schreibe 1-2 Zeilen, was dir aufgefallen ist.",
    feedbackReasonIncorrect: "Das Ergebnis ist falsch",
    feedbackReasonRisky: "Es ist zu riskant",
    feedbackReasonUnclear: "Ich verstehe den Text nicht",
    feedbackYesLabel: "Hilfreich fur mich",
    feedbackNoLabel: "Nicht hilfreich fur mich",
    feedbackUnavailable: "Fur diese Analyse nicht verfugbar.",
    feedbackAlreadyVoted: "Du hast fur diese Analyse bereits abgestimmt.",
    feedbackSent: "Danke fur dein Feedback.",
    feedbackError: "Feedback konnte nicht gesendet werden.",
    cacheHitLabel: "Bereits von der Community analysiert",
    cacheMissLabel: "Live-Analyse",
    cacheStatusUnknown: "Analyse-Status aktualisiert",
    cacheStatusNow: "Gerade aktualisiert",
    cacheStatusFresh: "Vor {minutes} Min. aktualisiert"
  },
  it: {
    ...EN_MESSAGES,
    stateSafe: "Sito sicuro",
    stateCaution: "Attenzione",
    stateRisk: "Non affidabile",
    stateUnknown: "Nessuna analisi",
    summaryUnavailable: "Nessun riepilogo disponibile per questa pagina.",
    summaryWaiting: "Apri un sito e attendi l'analisi automatica.",
    errorLoadAnalysis: "Impossibile caricare l'analisi.",
    errorNoAnalysisData: "Nessun dato di analisi disponibile al momento.",
    purchaseHeading: "Sicurezza dell'acquisto",
    reasonsHeading: "Motivazione",
    feedbackTitle: "Valuta questa analisi",
    settingsButton: "Configurazione",
    feedbackDownHint: "Cosa ti sembra strano?",
    feedbackDownPlaceholder: "Scrivi 1-2 righe su cosa ti ha insospettito.",
    feedbackReasonIncorrect: "Il risultato e errato",
    feedbackReasonRisky: "E troppo rischioso",
    feedbackReasonUnclear: "Non capisco il testo",
    feedbackYesLabel: "Utile per me",
    feedbackNoLabel: "Non utile per me",
    feedbackUnavailable: "Non disponibile per questa analisi.",
    feedbackAlreadyVoted: "Hai gia votato questa analisi.",
    feedbackSent: "Grazie per il tuo feedback.",
    feedbackError: "Impossibile inviare il feedback.",
    cacheHitLabel: "Gia analizzato dalla comunita",
    cacheMissLabel: "Analisi in tempo reale",
    cacheStatusUnknown: "Stato analisi aggiornato",
    cacheStatusNow: "Aggiornato pochi secondi fa",
    cacheStatusFresh: "Aggiornato {minutes} min fa"
  },
  ca: {
    ...EN_MESSAGES,
    stateSafe: "Web segura",
    stateCaution: "Precaucio",
    stateRisk: "No confiable",
    stateUnknown: "Sense analisi",
    summaryUnavailable: "No hi ha resum disponible per a aquesta pagina.",
    summaryWaiting: "Obre un web i espera l'analisi automatica.",
    errorLoadAnalysis: "No s'ha pogut carregar l'analisi.",
    errorNoAnalysisData: "Encara no hi ha dades d'analisi.",
    purchaseHeading: "Seguretat en la compra",
    reasonsHeading: "Justificacio",
    feedbackTitle: "Valora aquesta analisi",
    settingsButton: "Configuracio",
    feedbackDownHint: "Que t'ha semblat estrany?",
    feedbackDownPlaceholder: "Escriu 1-2 linies del que t'ha cridat l'atencio.",
    feedbackReasonIncorrect: "El resultat es incorrecte",
    feedbackReasonRisky: "Es massa arriscat",
    feedbackReasonUnclear: "No entenc el text",
    feedbackYesLabel: "M'es util",
    feedbackNoLabel: "No m'es util",
    feedbackUnavailable: "No disponible per a aquesta analisi.",
    feedbackAlreadyVoted: "Ja has votat aquesta analisi.",
    feedbackSent: "Gracies pel teu feedback.",
    feedbackError: "No s'ha pogut enviar el feedback.",
    cacheHitLabel: "Ja analitzat per la comunitat",
    cacheMissLabel: "Analisi en viu",
    cacheStatusUnknown: "Estat de l'analisi actualitzat",
    cacheStatusNow: "Actualitzat fa pocs segons",
    cacheStatusFresh: "Actualitzat fa {minutes} min"
  }
};

const STORAGE_KEYS = {
  clientInstallId: "clientInstallId",
  advancedFeedbackMode: "advancedFeedbackMode",
  uiLanguage: "uiLanguage",
  tabAnalyses: "tabAnalyses"
};
const LEGACY_STORAGE_KEYS = ["analysisVotes", "analysisVoteCounts"];

const FEEDBACK_SELECTED_CLASS = "feedback-btn-selected";
const POPUP_TARGET_VISUAL_WIDTH = 380;
const POPUP_MIN_CSS_WIDTH = 320;
const POPUP_MAX_CSS_WIDTH = 1200;
const LIVE_REFRESH_INTERVAL_MS = 1200;

const stateLabel = document.getElementById("stateLabel");
const summary = document.getElementById("summary");
const analysisMeta = document.getElementById("analysisMeta");
const reasonsSection = document.getElementById("reasonsSection");
const reasonsHeading = document.getElementById("reasonsHeading");
const reasonsList = document.getElementById("reasonsList");
const purchaseSection = document.getElementById("purchaseSection");
const purchaseHeading = document.getElementById("purchaseHeading");
const purchaseText = document.getElementById("purchaseText");
const head = document.getElementById("head");
const settingsBtn = document.getElementById("settingsBtn");
const feedbackSection = document.getElementById("feedbackSection");
const feedbackTitle = document.getElementById("feedbackTitle");
const feedbackYesBtn = document.getElementById("feedbackYesBtn");
const feedbackNoBtn = document.getElementById("feedbackNoBtn");
const feedbackYesCount = document.getElementById("feedbackYesCount");
const feedbackNoCount = document.getElementById("feedbackNoCount");
const feedbackMessage = document.getElementById("feedbackMessage");
const feedbackForm = document.getElementById("feedbackForm");
const feedbackFormHint = document.getElementById("feedbackFormHint");
const feedbackAdvancedRow = document.getElementById("feedbackAdvancedRow");
const feedbackDownReason = document.getElementById("feedbackDownReason");
const feedbackDownComment = document.getElementById("feedbackDownComment");
const feedbackDownSubmitBtn = document.getElementById("feedbackDownSubmitBtn");

const popupState = {
  currentAnalysis: null,
  currentTabUrl: "",
  voteKey: "",
  clientInstallId: "",
  userFeedback: "",
  advancedFeedbackMode: false,
  uiLanguagePreference: "auto",
  uiLanguage: resolveUiLanguage("auto")
};
let liveRefreshTimer = null;
let isRefreshing = false;

settingsBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

feedbackYesBtn.addEventListener("click", () => {
  void submitFeedback("up");
});

feedbackNoBtn.addEventListener("click", () => {
  void openFeedbackDownForm();
});

if (feedbackDownSubmitBtn) {
  feedbackDownSubmitBtn.addEventListener("click", () => {
    void submitFeedback("down", true);
  });
}

void initializePopup().catch((error) => {
  summary.textContent = error && error.message ? error.message : getUiMessage("errorLoadAnalysis");
  summary.classList.add("muted");
});

async function initializePopup() {
  await collapseInPageBannerOnPopupOpen();
  await normalizePopupWidth();
  await hydrateFeedbackStorage();
  applyUiMessages();
  startLiveRefresh();
  await refreshActiveTabAnalysis(true);
}

async function collapseInPageBannerOnPopupOpen() {
  if (!chrome.tabs || !chrome.tabs.query || !chrome.tabs.sendMessage) {
    return;
  }

  const activeTab = await new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }
      resolve(Array.isArray(tabs) && tabs.length > 0 ? tabs[0] : null);
    });
  });

  if (!activeTab || typeof activeTab.id !== "number") {
    return;
  }

  await new Promise((resolve) => {
    chrome.tabs.sendMessage(
      activeTab.id,
      { action: "collapseLinksfairyPanel" },
      () => {
        resolve();
      }
    );
  });
}

function startLiveRefresh() {
  if (liveRefreshTimer !== null) {
    return;
  }

  const refresh = async () => {
    if (isFeedbackFormOpen()) {
      return;
    }
    if (isRefreshing) {
      return;
    }
    isRefreshing = true;
    try {
      await refreshActiveTabAnalysis(false);
    } finally {
      isRefreshing = false;
    }
  };

  liveRefreshTimer = window.setInterval(() => {
    void refresh();
  }, LIVE_REFRESH_INTERVAL_MS);

  chrome.storage.onChanged.addListener(handleStorageChanged);
  window.addEventListener("beforeunload", stopLiveRefresh);
}

function stopLiveRefresh() {
  if (liveRefreshTimer !== null) {
    window.clearInterval(liveRefreshTimer);
    liveRefreshTimer = null;
  }
  chrome.storage.onChanged.removeListener(handleStorageChanged);
  window.removeEventListener("beforeunload", stopLiveRefresh);
}

function handleStorageChanged(changes, areaName) {
  if (areaName !== "local" || !changes) {
    return;
  }

  let shouldRefresh = false;

  if (changes[STORAGE_KEYS.uiLanguage]) {
    popupState.uiLanguagePreference = normalizeUiLanguagePreference(
      changes[STORAGE_KEYS.uiLanguage].newValue
    );
    popupState.uiLanguage = resolveUiLanguage(popupState.uiLanguagePreference);
    applyUiMessages();
    shouldRefresh = true;
  }

  if (changes[STORAGE_KEYS.advancedFeedbackMode]) {
    popupState.advancedFeedbackMode = changes[STORAGE_KEYS.advancedFeedbackMode].newValue === true;
    setupFeedbackForm();
    shouldRefresh = true;
  }

  if (changes[STORAGE_KEYS.tabAnalyses]) {
    shouldRefresh = true;
  }

  if (!shouldRefresh || isFeedbackFormOpen()) {
    return;
  }

  void refreshActiveTabAnalysis(false);
}

async function normalizePopupWidth() {
  const zoomFactor = await getActiveTabZoomFactor();
  const safeZoom = Number.isFinite(zoomFactor) && zoomFactor > 0 ? zoomFactor : 1;
  const cssWidth = Math.round(POPUP_TARGET_VISUAL_WIDTH / safeZoom);
  const clampedCssWidth = Math.max(
    POPUP_MIN_CSS_WIDTH,
    Math.min(POPUP_MAX_CSS_WIDTH, cssWidth)
  );
  document.documentElement.style.setProperty(
    "--linksfairy-popup-width",
    `${clampedCssWidth}px`
  );
}

async function getActiveTabZoomFactor() {
  if (!chrome.tabs || !chrome.tabs.query || !chrome.tabs.getZoom) {
    return 1;
  }

  const activeTab = await new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }
      resolve(Array.isArray(tabs) && tabs.length > 0 ? tabs[0] : null);
    });
  });

  if (!activeTab || typeof activeTab.id !== "number") {
    return 1;
  }

  return new Promise((resolve) => {
    chrome.tabs.getZoom(activeTab.id, (zoomFactor) => {
      if (chrome.runtime.lastError) {
        resolve(1);
        return;
      }
      const parsedZoom = Number(zoomFactor);
      resolve(Number.isFinite(parsedZoom) && parsedZoom > 0 ? parsedZoom : 1);
    });
  });
}

async function refreshActiveTabAnalysis(raiseOnFailure) {
  const response = await sendMessage({
    action: "getActiveTabAnalysis"
  });

  if (!response || response.ok !== true) {
    if (raiseOnFailure === true) {
      throw new Error((response && response.error) || getUiMessage("errorNoAnalysisData"));
    }
    return;
  }

  const result = response.result;
  const analysis = result && result.analysis ? result.analysis : null;
  popupState.currentTabUrl = toText(result && result.url);
  if (!analysis) {
    renderEmpty();
    return;
  }

  const state = normalizeState(analysis.state);
  head.classList.remove("safe", "caution", "risk");
  if (state !== "unknown") {
    head.classList.add(state);
  }
  stateLabel.textContent = getStateLabel(state);

  const summaryText = toText(analysis.summary || analysis.overallAdviceText);
  if (summaryText) {
    summary.textContent = summaryText;
    summary.classList.remove("muted");
  } else {
    summary.textContent = getUiMessage("summaryUnavailable");
    summary.classList.add("muted");
  }

  renderAnalysisMeta(analysis);
  renderPurchase(analysis);
  renderReasons(analysis.reasons);
  renderFeedback(analysis);
}

function renderEmpty() {
  popupState.currentAnalysis = null;
  popupState.voteKey = "";
  popupState.userFeedback = "";
  head.classList.remove("safe", "caution", "risk");
  stateLabel.textContent = getStateLabel("unknown");
  summary.textContent = getUiMessage("summaryWaiting");
  summary.classList.add("muted");
  renderAnalysisMeta(null);
  applyFeedbackSelectionClasses("");
  purchaseSection.hidden = true;
  reasonsSection.hidden = true;
  feedbackSection.hidden = true;
  setFeedbackMessage("");
}

function renderAnalysisMeta(analysis) {
  if (!analysisMeta) {
    return;
  }

  const text = buildCacheMetaText(analysis);
  if (!text) {
    analysisMeta.textContent = "";
    analysisMeta.classList.add("muted");
    return;
  }

  analysisMeta.textContent = text;
  analysisMeta.classList.remove("muted");
}

function buildCacheMetaText(analysis) {
  const raw = analysis && typeof analysis === "object" ? analysis : null;
  if (!raw) {
    return "";
  }

  const cacheType = raw.cacheHit === true
    ? getUiMessage("cacheHitLabel")
    : getUiMessage("cacheMissLabel");
  const ageText = buildAgeText(raw.createdAt, raw.fresh);
  return [cacheType, ageText].filter(Boolean).join(" · ");
}

function buildAgeText(createdAt, fresh) {
  const createdAtDate = createdAt ? new Date(createdAt) : null;
  if (!createdAtDate || Number.isNaN(createdAtDate.getTime())) {
    return "";
  }

  if (fresh === false) {
    return getUiMessage("cacheStatusUnknown");
  }

  const now = Date.now();
  const seconds = Math.max(0, Math.floor((now - createdAtDate.getTime()) / 1000));
  const minutes = Math.max(0, Math.floor(seconds / 60));

  if (minutes < 1) {
    return getUiMessage("cacheStatusNow");
  }

  return getUiMessage("cacheStatusFresh", { minutes: String(minutes) });
}

function renderPurchase(analysis) {
  const hasPurchaseContext = analysis && analysis.hasPurchaseContext === true;
  const text = toText(analysis && analysis.purchaseRecommendationText);
  if (!hasPurchaseContext || !text) {
    purchaseSection.hidden = true;
    purchaseText.textContent = "";
    return;
  }

  purchaseSection.hidden = false;
  purchaseText.textContent = text;
}

function renderReasons(reasons) {
  while (reasonsList.firstChild) {
    reasonsList.removeChild(reasonsList.firstChild);
  }

  if (!Array.isArray(reasons) || reasons.length === 0) {
    reasonsSection.hidden = true;
    return;
  }

  reasons.slice(0, 5).forEach((reason) => {
    const li = document.createElement("li");
    li.textContent = toText(reason);
    reasonsList.appendChild(li);
  });
  reasonsSection.hidden = reasonsList.children.length === 0;
}

function renderFeedback(analysis) {
  popupState.currentAnalysis = analysis;
  popupState.voteKey = toText(analysis.canonicalUrl || analysis.analysisId);
  const currentVote = normalizeFeedbackVote(
    analysis && (analysis.userFeedback || analysis.user_feedback)
  );
  popupState.userFeedback = currentVote;
  applyFeedbackSelectionClasses(currentVote);
  setupFeedbackForm();

  feedbackSection.hidden = false;
  renderFeedbackCounts();
  hideFeedbackForm();

  if (!popupState.voteKey) {
    feedbackYesBtn.disabled = true;
    feedbackNoBtn.disabled = true;
    if (feedbackDownSubmitBtn) {
      feedbackDownSubmitBtn.disabled = true;
    }
    setFeedbackMessage(getUiMessage("feedbackUnavailable"));
    return;
  }

  if (currentVote) {
    feedbackYesBtn.disabled = false;
    feedbackNoBtn.disabled = false;
    if (feedbackDownSubmitBtn) {
      feedbackDownSubmitBtn.disabled = true;
    }
    setFeedbackMessage(getUiMessage("feedbackAlreadyVoted"));
    return;
  }

  feedbackYesBtn.disabled = false;
  feedbackNoBtn.disabled = false;
  if (feedbackDownSubmitBtn) {
    feedbackDownSubmitBtn.disabled = true;
  }
  setFeedbackMessage("");
}

function renderFeedbackCounts() {
  const entry = normalizeFeedbackCounts(
    popupState.currentAnalysis && popupState.currentAnalysis.feedbackCounts
  );
  feedbackYesCount.textContent = String(entry.up);
  feedbackNoCount.textContent = String(entry.down);
}

function setFeedbackMessage(text) {
  feedbackMessage.textContent = toText(text);
}

function setupFeedbackForm() {
  if (!feedbackForm) {
    return;
  }

  if (feedbackFormHint) {
    feedbackFormHint.textContent = getUiMessage("feedbackDownHint");
  }

  if (feedbackDownComment) {
    feedbackDownComment.placeholder = getUiMessage("feedbackDownPlaceholder");
  }

  if (feedbackDownSubmitBtn) {
    feedbackDownSubmitBtn.textContent = getFeedbackSubmitLabel();
  }

  if (feedbackDownReason) {
    const currentValue = toText(feedbackDownReason.value);
    const options = [
      { value: "incorrect_result", label: getUiMessage("feedbackReasonIncorrect") },
      { value: "too_risky", label: getUiMessage("feedbackReasonRisky") },
      { value: "unclear", label: getUiMessage("feedbackReasonUnclear") },
      { value: "other", label: getUiMessage("feedbackReasonOther") }
    ];

    feedbackDownReason.innerHTML = "";
    options.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label;
      feedbackDownReason.appendChild(option);
    });

    const hasValue = options.some((item) => item.value === currentValue);
    feedbackDownReason.value = hasValue ? currentValue : "incorrect_result";
    feedbackDownReason.setAttribute("aria-label", getUiMessage("feedbackDownHint"));
  }

  if (feedbackAdvancedRow) {
    feedbackAdvancedRow.hidden = popupState.advancedFeedbackMode !== true;
  }
}

function isFeedbackFormOpen() {
  return Boolean(feedbackForm) && feedbackForm.hidden === false;
}

function hideFeedbackForm() {
  if (feedbackForm) {
    feedbackForm.hidden = true;
  }
  if (feedbackDownComment) {
    feedbackDownComment.value = "";
  }
  if (feedbackDownReason) {
    feedbackDownReason.selectedIndex = 0;
  }
}

async function openFeedbackDownForm() {
  if (feedbackNoBtn.disabled) {
    return;
  }

  const currentVote = normalizeFeedbackVote(popupState.userFeedback);
  if (currentVote === "down") {
    setFeedbackMessage(getUiMessage("feedbackAlreadyVoted"));
    return;
  }

  if (!feedbackForm) {
    return;
  }

  feedbackForm.hidden = false;
  if (feedbackAdvancedRow) {
    feedbackAdvancedRow.hidden = popupState.advancedFeedbackMode !== true;
  }
  if (feedbackDownSubmitBtn) {
    feedbackDownSubmitBtn.textContent = getFeedbackSubmitLabel();
    feedbackDownSubmitBtn.disabled = false;
  }
  if (feedbackDownComment) {
    feedbackDownComment.focus();
  }
}

async function submitFeedback(feedbackValue, fromDownForm = false) {
  if (!popupState.currentAnalysis || !popupState.voteKey) {
    return;
  }

  const normalizedVote = normalizeFeedbackVote(feedbackValue);
  if (!normalizedVote) {
    return;
  }

  const previousVote = normalizeFeedbackVote(popupState.userFeedback);
  if (previousVote === normalizedVote) {
    setFeedbackMessage(getUiMessage("feedbackAlreadyVoted"));
    applyFeedbackSelectionClasses(previousVote);
    return;
  }

  feedbackYesBtn.disabled = true;
  feedbackNoBtn.disabled = true;
  if (feedbackDownSubmitBtn) {
    feedbackDownSubmitBtn.disabled = true;
  }
  setFeedbackMessage("");

  const isUp = normalizedVote === "up";
  if (!isUp && !fromDownForm) {
    await openFeedbackDownForm();
    feedbackYesBtn.disabled = false;
    feedbackNoBtn.disabled = false;
    return;
  }

  const reasonRaw = isUp
    ? "other"
    : (popupState.advancedFeedbackMode === true
      ? toText(feedbackDownReason && feedbackDownReason.value)
      : "incorrect_result");
  const reason = normalizeReportReason(reasonRaw, isUp);
  const comment = isUp ? "" : toText(feedbackDownComment && feedbackDownComment.value);

  const payload = {
    analysis_id: toText(popupState.currentAnalysis.analysisId) || undefined,
    canonical_url: toText(popupState.currentAnalysis.canonicalUrl || popupState.currentTabUrl) || undefined,
    feedback: isUp ? "up" : "down",
    reason,
    comment,
    locale: navigator.language || "en-US"
  };

  if (popupState.clientInstallId) {
    payload.client_install_id = popupState.clientInstallId;
  }

  try {
    const response = await sendMessage({
      action: "submitReport",
      payload
    });
    if (!response || response.ok !== true) {
      throw new Error((response && response.error) || getUiMessage("feedbackError"));
    }

    const backendData = response.result && response.result.data && typeof response.result.data === "object"
      ? response.result.data
      : {};
    popupState.userFeedback = normalizeFeedbackVote(
      backendData.user_feedback || normalizedVote
    );
    const backendCounts = normalizeFeedbackCounts(
      backendData.feedback_counts || {
        up: backendData.report_up_count,
        down: backendData.report_down_count,
        total: backendData.report_count
      }
    );
    popupState.currentAnalysis.feedbackCounts = backendCounts;

    renderFeedbackCounts();
    const incremented = backendData.incremented_report_count;
    setFeedbackMessage(incremented ? getUiMessage("feedbackSent") : getUiMessage("feedbackAlreadyVoted"));
    applyFeedbackSelectionClasses(normalizedVote);
    hideFeedbackForm();
    feedbackYesBtn.disabled = false;
    feedbackNoBtn.disabled = false;
    if (feedbackDownSubmitBtn) {
      feedbackDownSubmitBtn.disabled = true;
    }
  } catch (error) {
    setFeedbackMessage((error && error.message) || getUiMessage("feedbackError"));
    feedbackYesBtn.disabled = false;
    feedbackNoBtn.disabled = false;
    if (feedbackDownSubmitBtn) {
      feedbackDownSubmitBtn.disabled = false;
    }
  }
}

async function hydrateFeedbackStorage() {
  const values = await getStorageValues({
    [STORAGE_KEYS.clientInstallId]: "",
    [STORAGE_KEYS.advancedFeedbackMode]: false,
    [STORAGE_KEYS.uiLanguage]: "auto"
  });

  popupState.clientInstallId = toText(values[STORAGE_KEYS.clientInstallId]);
  popupState.advancedFeedbackMode = values[STORAGE_KEYS.advancedFeedbackMode] === true;
  popupState.uiLanguagePreference = normalizeUiLanguagePreference(values[STORAGE_KEYS.uiLanguage]);
  popupState.uiLanguage = resolveUiLanguage(popupState.uiLanguagePreference);
  await removeStorageValues(LEGACY_STORAGE_KEYS);
}

function applyFeedbackSelectionClasses(voteValue) {
  const normalizedVote = normalizeFeedbackVote(voteValue);
  feedbackYesBtn.classList.toggle(FEEDBACK_SELECTED_CLASS, normalizedVote === "up");
  feedbackNoBtn.classList.toggle(FEEDBACK_SELECTED_CLASS, normalizedVote === "down");
}

function applyUiMessages() {
  document.documentElement.lang = popupState.uiLanguage;

  if (!popupState.currentAnalysis) {
    stateLabel.textContent = getStateLabel("unknown");
    if (!toText(summary.textContent)) {
      summary.textContent = getUiMessage("summaryWaiting");
      summary.classList.add("muted");
    }
  }

  if (purchaseHeading) {
    purchaseHeading.textContent = getUiMessage("purchaseHeading");
  }
  if (reasonsHeading) {
    reasonsHeading.textContent = getUiMessage("reasonsHeading");
  }
  if (feedbackTitle) {
    feedbackTitle.textContent = getUiMessage("feedbackTitle");
  }

  settingsBtn.textContent = getUiMessage("settingsButton");
  settingsBtn.title = getUiMessage("settingsButton");
  settingsBtn.setAttribute("aria-label", getUiMessage("settingsButton"));

  feedbackYesBtn.setAttribute("aria-label", getUiMessage("feedbackYesLabel"));
  feedbackNoBtn.setAttribute("aria-label", getUiMessage("feedbackNoLabel"));

  setupFeedbackForm();
}

function normalizeFeedbackVote(voteValue) {
  const normalized = toText(voteValue).toLowerCase();
  if (normalized === "up" || normalized === "down") {
    return normalized;
  }

  if (normalized === "yes") {
    return "up";
  }

  if (normalized === "no") {
    return "down";
  }

  return "";
}

function normalizeReportReason(rawReason, isPositiveVote = false) {
  const normalized = toText(rawReason).toLowerCase();

  if (isPositiveVote) {
    return "other";
  }

  const reportReasonMap = {
    incorrect_result: "incorrect_result",
    too_risky: "wrong_justification",
    unclear: "other",
    other: "other",
    false_positive: "false_positive",
    false_negative: "false_negative",
    unsafe_not_detected: "unsafe_not_detected",
    wrong_justification: "wrong_justification"
  };

  return reportReasonMap[normalized] || "incorrect_result";
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

function getStorageValues(defaults) {
  return new Promise((resolve) => {
    chrome.storage.local.get(defaults, (values) => {
      resolve(values || defaults || {});
    });
  });
}

function removeStorageValues(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.remove(keys || [], () => {
      resolve();
    });
  });
}

function normalizeUiLanguagePreference(value) {
  const raw = toText(value).toLowerCase();
  if (!raw || raw === "auto") {
    return "auto";
  }

  const base = raw.split("-")[0];
  return SUPPORTED_UI_LANGUAGES.includes(base) ? base : "auto";
}

function resolveUiLanguage(preference) {
  const normalized = normalizeUiLanguagePreference(preference);
  if (normalized !== "auto") {
    return normalized;
  }

  const browserLanguage = (navigator.language || navigator.userLanguage || "en").toLowerCase();
  const base = browserLanguage.split("-")[0];
  return SUPPORTED_UI_LANGUAGES.includes(base) ? base : "en";
}

function getUiMessage(key, replacements = null) {
  const languagePack = UI_MESSAGES[popupState.uiLanguage] || EN_MESSAGES;
  const baseText = languagePack[key] || EN_MESSAGES[key] || "";
  if (!replacements || typeof baseText !== "string") {
    return baseText;
  }

  return baseText.replace(/\{(\w+)\}/g, (_match, token) => {
    if (Object.prototype.hasOwnProperty.call(replacements, token)) {
      return String(replacements[token]);
    }
    return `{${token}}`;
  });
}

function getFeedbackSubmitLabel() {
  const normalizedLanguage = toText(popupState.uiLanguage).toLowerCase().split("-")[0];
  const rawLabel = toText(getUiMessage("feedbackSubmit"));
  if (normalizedLanguage === "es") {
    return "Enviar";
  }
  if (rawLabel.toLowerCase() === "para enviar") {
    return "Enviar";
  }
  return rawLabel || "Send";
}

function getStateLabel(stateValue) {
  if (stateValue === "safe") {
    return getUiMessage("stateSafe");
  }
  if (stateValue === "caution") {
    return getUiMessage("stateCaution");
  }
  if (stateValue === "risk") {
    return getUiMessage("stateRisk");
  }
  return getUiMessage("stateUnknown");
}

function normalizeState(value) {
  const raw = toText(value).toLowerCase();
  if (raw === "safe" || raw === "caution" || raw === "risk") {
    return raw;
  }
  return "unknown";
}

function toText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function sendMessage(payload) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(payload, (response) => {
      resolve(response || null);
    });
  });
}
