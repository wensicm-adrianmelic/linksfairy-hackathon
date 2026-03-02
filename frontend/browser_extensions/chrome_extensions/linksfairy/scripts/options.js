const STORAGE_KEYS = {
  autoRejectCookies: "autoRejectCookies",
  blockNotifications: "blockNotifications",
  advancedFeedbackMode: "advancedFeedbackMode",
  uiLanguage: "uiLanguage"
};

const LEGACY_STORAGE_KEYS = ["mistralApiKey", "mistralApiKeyValidated"];

const DEFAULT_STORAGE = {
  [STORAGE_KEYS.autoRejectCookies]: false,
  [STORAGE_KEYS.blockNotifications]: false,
  [STORAGE_KEYS.advancedFeedbackMode]: false,
  [STORAGE_KEYS.uiLanguage]: "auto"
};

const SUPPORTED_UI_LANGUAGES = ["es", "en", "pt", "fr", "de", "it", "ca"];

const UI_MESSAGES = {
  es: {
    documentTitle: "Link's Fairy - Configuracion",
    settingsTitle: "Configuracion de Link's Fairy",
    settingsIntro:
      "Linksfairy usa la clave segura del backend. Aqui puedes ajustar idioma y opciones avanzadas.",
    uiLanguageLabel: "Idioma de Linksfairy",
    languageOptionAuto: "Automatico (idioma del navegador)",
    autoRejectCookiesLabel: "Auto-rechazar cookies",
    blockNotificationsLabel: "Bloquear notificaciones web",
    advancedFeedbackModeLabel: "Modo avanzado (más opciones de feedback)",
    saveButton: "Guardar configuracion",
    statusSavedOk: "Configuracion guardada correctamente."
  },
  en: {
    documentTitle: "Link's Fairy - Settings",
    settingsTitle: "Link's Fairy Settings",
    settingsIntro:
      "Linksfairy uses the secure backend key. Here you can adjust language and advanced options.",
    uiLanguageLabel: "Linksfairy language",
    languageOptionAuto: "Automatic (browser language)",
    autoRejectCookiesLabel: "Auto-reject cookies",
    blockNotificationsLabel: "Block website notifications",
    advancedFeedbackModeLabel: "Advanced mode (more feedback options)",
    saveButton: "Save settings",
    statusSavedOk: "Settings saved successfully."
  },
  pt: {
    documentTitle: "Link's Fairy - Configuracao",
    settingsTitle: "Configuracao do Link's Fairy",
    settingsIntro:
      "O Linksfairy usa a chave segura do backend. Aqui podes ajustar idioma e opcoes avancadas.",
    uiLanguageLabel: "Idioma do Linksfairy",
    languageOptionAuto: "Automatico (idioma do navegador)",
    autoRejectCookiesLabel: "Rejeitar cookies automaticamente",
    blockNotificationsLabel: "Bloquear notificacoes dos sites",
    advancedFeedbackModeLabel: "Modo avanzado (mais opcoes de feedback)",
    saveButton: "Guardar configuracao",
    statusSavedOk: "Configuracao guardada com sucesso."
  },
  fr: {
    documentTitle: "Link's Fairy - Configuration",
    settingsTitle: "Configuration de Link's Fairy",
    settingsIntro:
      "Linksfairy utilise la cle securisee du backend. Ici, tu peux regler la langue et les options avancees.",
    uiLanguageLabel: "Langue de Linksfairy",
    languageOptionAuto: "Automatique (langue du navigateur)",
    autoRejectCookiesLabel: "Rejeter automatiquement les cookies",
    blockNotificationsLabel: "Bloquer les notifications web",
    advancedFeedbackModeLabel: "Mode avance (plus d'options de feedback)",
    saveButton: "Enregistrer",
    statusSavedOk: "Configuration enregistree avec succes."
  },
  de: {
    documentTitle: "Link's Fairy - Einstellungen",
    settingsTitle: "Link's Fairy Einstellungen",
    settingsIntro:
      "Linksfairy verwendet den sicheren Backend-Schluessel. Hier stellst du Sprache und erweiterte Optionen ein.",
    uiLanguageLabel: "Linksfairy Sprache",
    languageOptionAuto: "Automatisch (Browsersprache)",
    autoRejectCookiesLabel: "Cookies automatisch ablehnen",
    blockNotificationsLabel: "Web-Benachrichtigungen blockieren",
    advancedFeedbackModeLabel: "Erweiterter Modus (mehr Feedback-Optionen)",
    saveButton: "Einstellungen speichern",
    statusSavedOk: "Einstellungen erfolgreich gespeichert."
  },
  it: {
    documentTitle: "Link's Fairy - Configurazione",
    settingsTitle: "Configurazione di Link's Fairy",
    settingsIntro:
      "Linksfairy usa la chiave sicura del backend. Qui puoi regolare lingua e opzioni avanzate.",
    uiLanguageLabel: "Lingua di Linksfairy",
    languageOptionAuto: "Automatico (lingua del browser)",
    autoRejectCookiesLabel: "Rifiuta automaticamente i cookie",
    blockNotificationsLabel: "Blocca notifiche web",
    advancedFeedbackModeLabel: "Modalità avanzata (più opzioni feedback)",
    saveButton: "Salva configurazione",
    statusSavedOk: "Configurazione salvata con successo."
  },
  ca: {
    documentTitle: "Link's Fairy - Configuracio",
    settingsTitle: "Configuracio de Link's Fairy",
    settingsIntro:
      "Linksfairy fa servir la clau segura del backend. Aqui pots ajustar idioma i opcions avancades.",
    uiLanguageLabel: "Idioma de Linksfairy",
    languageOptionAuto: "Automatic (idioma del navegador)",
    autoRejectCookiesLabel: "Auto-rebutjar cookies",
    blockNotificationsLabel: "Bloquejar notificacions web",
    advancedFeedbackModeLabel: "Mode avançat (més opcions de feedback)",
    saveButton: "Desar configuracio",
    statusSavedOk: "Configuracio desada correctament."
  }
};

const form = document.getElementById("settings-form");
const uiLanguageSelect = document.getElementById("ui-language");
const autoRejectCookiesCheckbox = document.getElementById("auto-reject-cookies");
const blockNotificationsCheckbox = document.getElementById("block-notifications");
const advancedFeedbackModeCheckbox = document.getElementById("advanced-feedback-mode");
const statusNode = document.getElementById("status");
const settingsTitleNode = document.getElementById("settings-title");
const settingsIntroNode = document.getElementById("settings-intro");
const uiLanguageLabelNode = document.getElementById("ui-language-label");
const autoRejectCookiesLabelNode = document.getElementById("auto-reject-cookies-label");
const blockNotificationsLabelNode = document.getElementById("block-notifications-label");
const advancedFeedbackModeLabelNode = document.getElementById("advanced-feedback-mode-label");
const saveButton = document.getElementById("save-button");

let storageSnapshot = { ...DEFAULT_STORAGE };
let activeUiLanguage = resolveUiLanguage(DEFAULT_STORAGE[STORAGE_KEYS.uiLanguage]);

hydrateForm();
applyUiLanguage(activeUiLanguage);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  saveForm();
});

uiLanguageSelect.addEventListener("change", () => {
  activeUiLanguage = resolveUiLanguage(uiLanguageSelect.value);
  applyUiLanguage(activeUiLanguage);
});

function hydrateForm() {
  chrome.storage.local.get(DEFAULT_STORAGE, (values) => {
    chrome.storage.local.remove(LEGACY_STORAGE_KEYS);
    storageSnapshot = normalizeStorageValues(values);
  uiLanguageSelect.value = storageSnapshot[STORAGE_KEYS.uiLanguage];
  activeUiLanguage = resolveUiLanguage(storageSnapshot[STORAGE_KEYS.uiLanguage]);
  applyUiLanguage(activeUiLanguage);
  autoRejectCookiesCheckbox.checked = storageSnapshot[STORAGE_KEYS.autoRejectCookies];
  blockNotificationsCheckbox.checked = storageSnapshot[STORAGE_KEYS.blockNotifications];
  advancedFeedbackModeCheckbox.checked = storageSnapshot[STORAGE_KEYS.advancedFeedbackMode];
  });
}

function saveForm() {
  const payload = {
    [STORAGE_KEYS.autoRejectCookies]: autoRejectCookiesCheckbox.checked === true,
    [STORAGE_KEYS.blockNotifications]: blockNotificationsCheckbox.checked === true,
    [STORAGE_KEYS.advancedFeedbackMode]: advancedFeedbackModeCheckbox.checked === true,
    [STORAGE_KEYS.uiLanguage]: normalizeUiLanguagePreference(uiLanguageSelect.value)
  };

  chrome.storage.local.set(payload, () => {
    if (chrome.runtime.lastError) {
      showStatus(chrome.runtime.lastError.message, "error");
      return;
    }

    chrome.storage.local.remove(LEGACY_STORAGE_KEYS, () => {
      storageSnapshot = normalizeStorageValues(payload);
      activeUiLanguage = resolveUiLanguage(storageSnapshot[STORAGE_KEYS.uiLanguage]);
      applyUiLanguage(activeUiLanguage);
      showStatusByKey("statusSavedOk", "ok");
    });
  });
}

function showStatus(message, type) {
  statusNode.textContent = message;
  statusNode.className = type === "error" ? "error" : "ok";
}

function showStatusByKey(key, type) {
  showStatus(getUiMessage(activeUiLanguage, key), type);
}

function applyUiLanguage(languageCode) {
  const message = getMessagePack(languageCode);
  document.documentElement.lang = languageCode;
  document.title = message.documentTitle;
  settingsTitleNode.textContent = message.settingsTitle;
  settingsIntroNode.textContent = message.settingsIntro;
  uiLanguageLabelNode.textContent = message.uiLanguageLabel;
  autoRejectCookiesLabelNode.textContent = message.autoRejectCookiesLabel;
  blockNotificationsLabelNode.textContent = message.blockNotificationsLabel;
  advancedFeedbackModeLabelNode.textContent = message.advancedFeedbackModeLabel;
  saveButton.textContent = message.saveButton;
  applyLanguageOptionLabels(message);
}

function applyLanguageOptionLabels(message) {
  const optionAuto = uiLanguageSelect.querySelector("option[value='auto']");
  const optionEs = uiLanguageSelect.querySelector("option[value='es']");
  const optionEn = uiLanguageSelect.querySelector("option[value='en']");
  const optionPt = uiLanguageSelect.querySelector("option[value='pt']");
  const optionFr = uiLanguageSelect.querySelector("option[value='fr']");
  const optionDe = uiLanguageSelect.querySelector("option[value='de']");
  const optionIt = uiLanguageSelect.querySelector("option[value='it']");
  const optionCa = uiLanguageSelect.querySelector("option[value='ca']");

  if (optionAuto) optionAuto.textContent = message.languageOptionAuto;
  if (optionEs) optionEs.textContent = "Espanol";
  if (optionEn) optionEn.textContent = "English";
  if (optionPt) optionPt.textContent = "Portugues";
  if (optionFr) optionFr.textContent = "Francais";
  if (optionDe) optionDe.textContent = "Deutsch";
  if (optionIt) optionIt.textContent = "Italiano";
  if (optionCa) optionCa.textContent = "Catala";
}

function getUiMessage(languageCode, key) {
  const message = getMessagePack(languageCode);
  if (typeof message[key] === "string" && message[key]) {
    return message[key];
  }

  return UI_MESSAGES.en[key] || "";
}

function getMessagePack(languageCode) {
  if (UI_MESSAGES[languageCode]) {
    return UI_MESSAGES[languageCode];
  }

  return UI_MESSAGES.en;
}

function resolveUiLanguage(preference) {
  const normalized = normalizeUiLanguagePreference(preference);
  if (normalized !== "auto") {
    return normalized;
  }

  const navigatorLanguage = (navigator.language || navigator.userLanguage || "en").toLowerCase();
  const base = navigatorLanguage.split("-")[0];
  return SUPPORTED_UI_LANGUAGES.includes(base) ? base : "en";
}

function normalizeUiLanguagePreference(value) {
  const raw = toTrimmedString(value).toLowerCase();
  if (!raw || raw === "auto") {
    return "auto";
  }

  const base = raw.split("-")[0];
  return SUPPORTED_UI_LANGUAGES.includes(base) ? base : "auto";
}

function normalizeStorageValues(values) {
  return {
    [STORAGE_KEYS.autoRejectCookies]:
      typeof values[STORAGE_KEYS.autoRejectCookies] === "boolean"
        ? values[STORAGE_KEYS.autoRejectCookies]
        : false,
    [STORAGE_KEYS.blockNotifications]:
      typeof values[STORAGE_KEYS.blockNotifications] === "boolean"
        ? values[STORAGE_KEYS.blockNotifications]
        : false,
    [STORAGE_KEYS.advancedFeedbackMode]:
      typeof values[STORAGE_KEYS.advancedFeedbackMode] === "boolean"
        ? values[STORAGE_KEYS.advancedFeedbackMode]
        : false,
    [STORAGE_KEYS.uiLanguage]:
      typeof values[STORAGE_KEYS.uiLanguage] === "string"
        ? normalizeUiLanguagePreference(values[STORAGE_KEYS.uiLanguage])
        : "auto"
  };
}

function toTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}
