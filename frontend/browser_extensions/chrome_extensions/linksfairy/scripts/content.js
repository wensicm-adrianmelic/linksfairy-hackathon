(() => {
  const INJECTION_VERSION = "2026-03-01.12";
  const existingRuntime = window.__linksfairyRuntime;

  if (existingRuntime && existingRuntime.version === INJECTION_VERSION) {
    return;
  }

  if (existingRuntime && typeof existingRuntime.destroy === "function") {
    try {
      existingRuntime.destroy();
    } catch (_error) {
      // Ignore cleanup errors from previous runtime instances.
    }
  }

  if (isSearchResultsPage(window.location)) {
    return;
  }

  if (!isSafePageForAnalysis(window.location)) {
    return;
  }

  const staleRoot = document.getElementById("linksfairy-root");
  if (staleRoot && staleRoot.parentNode) {
    staleRoot.parentNode.removeChild(staleRoot);
  }

  window.__linksfairyInjected = true;
  window.__linksfairyInjectedVersion = INJECTION_VERSION;

  const STORAGE_KEYS = {
    autoRejectCookies: "autoRejectCookies",
    uiLanguage: "uiLanguage",
    advancedFeedbackMode: "advancedFeedbackMode",
    clientInstallId: "clientInstallId",
    clientInstallCreatedAt: "clientInstallCreatedAt"
  };
  const LEGACY_STORAGE_KEYS = ["analysisVotes", "analysisVoteCounts"];

  const FEEDBACK_SELECTED_CLASS = "linksfairy-feedback-btn-selected";

  const SUPPORTED_UI_LANGUAGES = ["es", "en", "pt", "fr", "de", "it", "ca"];

  const FAIRY_SVG_BY_STATE = {
    risk: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240"><defs><radialGradient id="orbRed" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="35%" stop-color="#ffd0d0" stop-opacity="0.9"/><stop offset="70%" stop-color="#ff1a1a" stop-opacity="0.95"/><stop offset="100%" stop-color="#b80000" stop-opacity="1"/></radialGradient><linearGradient id="wingFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.75"/><stop offset="100%" stop-color="#f3d6d6" stop-opacity="0.22"/></linearGradient><filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g opacity="0.95" filter="url(#softGlow)"><circle cx="78" cy="162" r="7" fill="#ff1a1a" opacity="0.35"/><circle cx="62" cy="176" r="4.5" fill="#ff1a1a" opacity="0.28"/><circle cx="48" cy="190" r="3.2" fill="#ff1a1a" opacity="0.22"/><circle cx="36" cy="204" r="2.4" fill="#ff1a1a" opacity="0.18"/></g><g filter="url(#softGlow)" stroke="#7f9090" stroke-opacity="0.9" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="url(#wingFill)"><path d="M112 98 C92 78, 64 56, 44 70 C26 84, 40 112, 66 138 C78 150, 96 146, 106 132 C114 121, 118 112, 120 106 C122 102, 118 100, 112 98 Z"/><path d="M156 114 C182 96, 214 96, 222 112 C232 132, 208 152, 178 152 C166 152, 158 144, 156 134 C154 124, 152 118, 156 114 Z"/><path d="M134 150 C150 166, 160 192, 144 202 C126 214, 110 190, 114 168 C116 158, 124 152, 134 150 Z"/><path d="M92 128 C68 134, 48 146, 52 160 C56 176, 80 174, 98 160 C108 152, 108 140, 102 134 C98 130, 96 128, 92 128 Z"/><g fill="none" stroke="#7f9090" stroke-opacity="0.35" stroke-width="1.4"><path d="M104 104 C86 90, 64 78, 50 80"/><path d="M104 118 C86 110, 68 98, 54 96"/><path d="M162 124 C184 116, 206 114, 216 120"/><path d="M160 138 C182 134, 202 132, 214 136"/><path d="M126 160 C134 174, 140 188, 136 198"/><path d="M84 144 C72 150, 62 160, 62 166"/></g></g><g filter="url(#softGlow)"><circle cx="130" cy="110" r="54" fill="url(#orbRed)"/><ellipse cx="112" cy="92" rx="22" ry="18" fill="#ffffff" opacity="0.55"/><ellipse cx="120" cy="100" rx="10" ry="8" fill="#ffffff" opacity="0.35"/></g></svg>`,
    caution: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240"><defs><radialGradient id="orbYellow" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="35%" stop-color="#fff2b3" stop-opacity="0.9"/><stop offset="70%" stop-color="#ffd400" stop-opacity="0.98"/><stop offset="100%" stop-color="#b38f00" stop-opacity="1"/></radialGradient><linearGradient id="wingFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.75"/><stop offset="100%" stop-color="#f7efd2" stop-opacity="0.22"/></linearGradient><filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g opacity="0.95" filter="url(#softGlow)"><circle cx="78" cy="162" r="7" fill="#ffd400" opacity="0.35"/><circle cx="62" cy="176" r="4.5" fill="#ffd400" opacity="0.28"/><circle cx="48" cy="190" r="3.2" fill="#ffd400" opacity="0.22"/><circle cx="36" cy="204" r="2.4" fill="#ffd400" opacity="0.18"/></g><g filter="url(#softGlow)" stroke="#7f9090" stroke-opacity="0.9" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="url(#wingFill)"><path d="M112 98 C92 78, 64 56, 44 70 C26 84, 40 112, 66 138 C78 150, 96 146, 106 132 C114 121, 118 112, 120 106 C122 102, 118 100, 112 98 Z"/><path d="M156 114 C182 96, 214 96, 222 112 C232 132, 208 152, 178 152 C166 152, 158 144, 156 134 C154 124, 152 118, 156 114 Z"/><path d="M134 150 C150 166, 160 192, 144 202 C126 214, 110 190, 114 168 C116 158, 124 152, 134 150 Z"/><path d="M92 128 C68 134, 48 146, 52 160 C56 176, 80 174, 98 160 C108 152, 108 140, 102 134 C98 130, 96 128, 92 128 Z"/><g fill="none" stroke="#7f9090" stroke-opacity="0.35" stroke-width="1.4"><path d="M104 104 C86 90, 64 78, 50 80"/><path d="M104 118 C86 110, 68 98, 54 96"/><path d="M162 124 C184 116, 206 114, 216 120"/><path d="M160 138 C182 134, 202 132, 214 136"/><path d="M126 160 C134 174, 140 188, 136 198"/><path d="M84 144 C72 150, 62 160, 62 166"/></g></g><g filter="url(#softGlow)"><circle cx="130" cy="110" r="54" fill="url(#orbYellow)"/><ellipse cx="112" cy="92" rx="22" ry="18" fill="#ffffff" opacity="0.55"/><ellipse cx="120" cy="100" rx="10" ry="8" fill="#ffffff" opacity="0.35"/></g></svg>`,
    safe: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240"><defs><radialGradient id="orbGreen" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="35%" stop-color="#c9ffe0" stop-opacity="0.9"/><stop offset="70%" stop-color="#00c853" stop-opacity="0.98"/><stop offset="100%" stop-color="#008a39" stop-opacity="1"/></radialGradient><linearGradient id="wingFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.75"/><stop offset="100%" stop-color="#dff7ea" stop-opacity="0.22"/></linearGradient><filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g opacity="0.95" filter="url(#softGlow)"><circle cx="78" cy="162" r="7" fill="#00c853" opacity="0.35"/><circle cx="62" cy="176" r="4.5" fill="#00c853" opacity="0.28"/><circle cx="48" cy="190" r="3.2" fill="#00c853" opacity="0.22"/><circle cx="36" cy="204" r="2.4" fill="#00c853" opacity="0.18"/></g><g filter="url(#softGlow)" stroke="#7f9090" stroke-opacity="0.9" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="url(#wingFill)"><path d="M112 98 C92 78, 64 56, 44 70 C26 84, 40 112, 66 138 C78 150, 96 146, 106 132 C114 121, 118 112, 120 106 C122 102, 118 100, 112 98 Z"/><path d="M156 114 C182 96, 214 96, 222 112 C232 132, 208 152, 178 152 C166 152, 158 144, 156 134 C154 124, 152 118, 156 114 Z"/><path d="M134 150 C150 166, 160 192, 144 202 C126 214, 110 190, 114 168 C116 158, 124 152, 134 150 Z"/><path d="M92 128 C68 134, 48 146, 52 160 C56 176, 80 174, 98 160 C108 152, 108 140, 102 134 C98 130, 96 128, 92 128 Z"/><g fill="none" stroke="#7f9090" stroke-opacity="0.35" stroke-width="1.4"><path d="M104 104 C86 90, 64 78, 50 80"/><path d="M104 118 C86 110, 68 98, 54 96"/><path d="M162 124 C184 116, 206 114, 216 120"/><path d="M160 138 C182 134, 202 132, 214 136"/><path d="M126 160 C134 174, 140 188, 136 198"/><path d="M84 144 C72 150, 62 160, 62 166"/></g></g><g filter="url(#softGlow)"><circle cx="130" cy="110" r="54" fill="url(#orbGreen)"/><ellipse cx="112" cy="92" rx="22" ry="18" fill="#ffffff" opacity="0.55"/><ellipse cx="120" cy="100" rx="10" ry="8" fill="#ffffff" opacity="0.35"/></g></svg>`
  };

  const FAIRY_ICON_BY_STATE = {
    safe: svgToDataUri(FAIRY_SVG_BY_STATE.safe),
    caution: svgToDataUri(FAIRY_SVG_BY_STATE.caution),
    risk: svgToDataUri(FAIRY_SVG_BY_STATE.risk),
    unknown: svgToDataUri(FAIRY_SVG_BY_STATE.caution)
  };

  const UI_MESSAGES = {
    es: {
      settingsButton: "Configuracion",
      closeButton: "Cerrar",
      question: "¿Quieres analizar si esta web es segura?",
      analyzeButton: "Analizar",
      dismissButton: "No ahora",
      apiKeyLabel: "API key de Mistral",
      apiKeyInfo: "Introduce la clave de Mistral para ejecutar el analisis.",
      runWithKeyButton: "Analizar con clave",
      cancelButton: "Cancelar",
      reasonsSummary: "Justificación",
      actionsSummary: "Acciones recomendadas",
      purchaseSafetySummary: "Seguridad al comprar",
      purchaseSafetySafe: "Comprar en esta web parece seguro.",
      purchaseSafetyCaution: "Comprar aquí requiere precauci\u00f3n y revisar el contexto.",
      purchaseSafetyRisk: "No se recomienda comprar en esta web por ahora.",
      purchaseSafetyUnknown: "No se detecta contexto de compra suficiente para valorar este aspecto.",
      loadingTitle: "Analizando tu seguridad",
      loadingSummary: "Revisando tu seguridad.",
      riskMeterTitle: "Índice de seguridad",
      errorOpenSettings: "No se pudo abrir la configuracion.",
      errorApiKeyRequired: "Introduce tu API key de Mistral para continuar.",
      errorAnalysisFailed: "El analisis no pudo completarse.",
      errorUnexpected: "Error inesperado.",
      errorAnalyzeTitle: "No se pudo analizar",
      fallbackSummary: "No hay detalles adicionales del analisis para esta web.",
      resultSafeTitle: "La web parece segura",
      resultRiskTitle: "No confiar en esta web",
      resultCautionTitle: "Mira esto con calma antes de seguir",
      resultNeutralTitle: "No hay evidencia suficiente",
      resultUnknownTitle: "Resultado no concluyente",
      stateSafeLabel: "Web segura",
      stateCautionLabel: "Precaucion",
      stateRiskLabel: "No confiable",
      stateUnknownLabel: "Sin analisis",
      feedbackPrompt: "Valora el resultado",
      feedbackYes: "👍",
      feedbackNo: "👎",
      feedbackYesLabel: "Me resulta util",
      feedbackNoLabel: "No me resulta util",
      feedbackDownHint: "¿Qué te pareció raro?",
      feedbackDownPlaceholder: "Escribe 1-2 líneas de lo que te llamó la atención.",
      feedbackSubmit: "Enviar",
      feedbackAdvancedReasonIncorrect: "El resultado es incorrecto",
      feedbackAdvancedReasonRisky: "Es muy arriesgado",
      feedbackAdvancedReasonUnclear: "No entiendo el texto",
      feedbackAdvancedReasonOther: "Otro",
      feedbackDownReasonPlaceholder: "Incorrecto",
      feedbackSent: "Gracias por tu feedback.",
      feedbackAlreadyVoted: "Ya has votado este analisis.",
      feedbackError: "No se pudo enviar el feedback.",
      loadingStep1: "Leyendo la página...",
      loadingStep2: "Revisando tu seguridad...",
      loadingStep3: "Casi listo...",
      cacheNewLabel: "Análisis nuevo",
      cacheCommunityLabel: "Ya analizado por la comunidad",
      cacheStatusFresh: "Actualizado hace {minutes} min",
      cacheStatusNow: "Actualizado hace pocos segundos",
      cacheStatusUnknown: "Estado de análisis actualizado",
      recommendationTitle: "Recomendación para ti ahora",
      recommendationSafe: "Puedes seguir y navegar tranquilo.",
      recommendationCaution: "No avances todavía. Revisa esto con calma antes de poner datos.",
      recommendationRisk: "No compres ni metas datos aquí.",
      recommendationUnknown: "Mejor mira esta web con calma antes de hacer nada.",
      cacheFreshLabel: "Actualizado recientemente",
      cacheHitLabel: "Ya analizado por la comunidad",
      cacheMissLabel: "Análisis en vivo",
      errorTimeout: "Tiempo de espera agotado al analizar la web.",
      errorNetwork: "Error de red al contactar con el backend.",
      errorBackend4xx: "Peticion invalida. Revisa los datos enviados.",
      errorBackend5xx: "El backend no esta disponible temporalmente.",
      errorParse: "Respuesta invalida del backend.",
      errorApiKeyRejected: "La API key de Mistral no fue aceptada."
    },
    en: {
      settingsButton: "Settings",
      closeButton: "Close",
      question: "Do you want to analyze whether this website is safe?",
      analyzeButton: "Analyze",
      dismissButton: "Not now",
      apiKeyLabel: "Mistral API key",
      apiKeyInfo: "Enter your Mistral key to run the analysis.",
      runWithKeyButton: "Analyze with key",
      cancelButton: "Cancel",
      reasonsSummary: "Justification",
      actionsSummary: "Recommended actions",
      purchaseSafetySummary: "Purchase safety",
      purchaseSafetySafe: "Buying on this website can be safe.",
      purchaseSafetyCaution: "Buying here is possible but should be reviewed carefully first.",
      purchaseSafetyRisk: "Do not buy here until the site is verified.",
      purchaseSafetyUnknown: "No clear purchase context was detected to assess this reliably.",
      loadingTitle: "Analyzing your safety",
      loadingSummary: "Checking your safety.",
      riskMeterTitle: "Security index",
      errorOpenSettings: "Could not open settings.",
      errorApiKeyRequired: "Enter your Mistral API key to continue.",
      errorAnalysisFailed: "Analysis could not be completed.",
      errorUnexpected: "Unexpected error.",
      errorAnalyzeTitle: "Could not analyze",
      fallbackSummary: "No additional analysis details were returned for this page.",
      resultSafeTitle: "The website looks safe",
      resultRiskTitle: "Do not trust this website",
      resultCautionTitle: "Proceed with caution",
      resultNeutralTitle: "Not enough evidence",
      resultUnknownTitle: "Inconclusive result",
      stateSafeLabel: "Safe website",
      stateCautionLabel: "Caution",
      stateRiskLabel: "Untrusted",
      stateUnknownLabel: "No analysis",
      feedbackPrompt: "Rate the result",
      feedbackYes: "👍",
      feedbackNo: "👎",
      feedbackYesLabel: "Useful for me",
      feedbackNoLabel: "Not useful for me",
      feedbackDownHint: "Something seems off?",
      feedbackDownPlaceholder: "Write 1-2 lines about what looked off. (optional)",
      feedbackSubmit: "Send",
      feedbackAdvancedReasonIncorrect: "The result is incorrect",
      feedbackAdvancedReasonRisky: "Looks risky",
      feedbackAdvancedReasonUnclear: "I can't understand it",
      feedbackAdvancedReasonOther: "Other",
      feedbackDownReasonPlaceholder: "Incorrect result",
      feedbackSent: "Thanks for your feedback.",
      feedbackAlreadyVoted: "You already voted on this analysis.",
      feedbackError: "Could not send feedback.",
      loadingStep1: "Reading the page...",
      loadingStep2: "Checking your safety...",
      loadingStep3: "Almost ready...",
      cacheNewLabel: "New analysis",
      cacheCommunityLabel: "Already analyzed by the community",
      cacheStatusFresh: "Updated {minutes} min ago",
      cacheStatusNow: "Updated just now",
      cacheStatusUnknown: "Fresh analysis",
      recommendationTitle: "Quick action for you",
      recommendationSafe: "You can continue with normal use.",
      recommendationCaution: "Check again and review checkout details before continuing.",
      recommendationRisk: "Wait and review this site later.",
      recommendationUnknown: "Take a quick check before you continue.",
      cacheFreshLabel: "Updated just now",
      cacheHitLabel: "Already analyzed by the community",
      cacheMissLabel: "New analysis",
      errorTimeout: "Analysis timed out while calling backend.",
      errorNetwork: "Network error contacting backend.",
      errorBackend4xx: "Invalid request. Check the submitted data.",
      errorBackend5xx: "Backend is temporarily unavailable.",
      errorParse: "Invalid backend response.",
      errorApiKeyRejected: "Mistral API key was rejected."
    },
    pt: {
      settingsButton: "Configurar",
      closeButton: "Fechar",
      question: "Quer analisar se este site e seguro?",
      analyzeButton: "Analisar",
      dismissButton: "Agora nao",
      apiKeyLabel: "API key da Mistral",
      apiKeyInfo: "Introduz a chave da Mistral para executar a analise.",
      runWithKeyButton: "Analisar com chave",
      cancelButton: "Cancelar",
      reasonsSummary: "Justificacao",
      actionsSummary: "Acoes recomendadas",
      purchaseSafetySummary: "Seguranca para comprar",
      purchaseSafetySafe: "Pode ser seguro comprar neste site.",
      purchaseSafetyCaution: "Comprar aqui exige cautela e revisao.",
      purchaseSafetyRisk: "N\u00e3o \u00e9 recomendada a compra neste site ainda.",
      purchaseSafetyUnknown: "Nao foi detectado contexto suficiente de compra para avaliar com seguran\u00e7a.",
      loadingTitle: "A analisar sua segurança",
      loadingSummary: "A consultar agente remoto.",
      riskMeterTitle: "Indice de seguranca",
      errorOpenSettings: "Nao foi possivel abrir as configuracoes.",
      errorApiKeyRequired: "Introduz a tua API key da Mistral para continuar.",
      errorAnalysisFailed: "A analise nao pode ser concluida.",
      errorUnexpected: "Erro inesperado.",
      errorAnalyzeTitle: "Nao foi possivel analisar",
      fallbackSummary: "Nao foram devolvidos detalhes adicionais da analise para esta pagina.",
      resultSafeTitle: "O site parece seguro",
      resultRiskTitle: "Nao confiar neste site",
      resultCautionTitle: "Proceder com cautela",
      resultNeutralTitle: "Nao ha evidencia suficiente",
      resultUnknownTitle: "Resultado inconclusivo",
      feedbackPrompt: "Classificar resultado",
      feedbackYes: "👍",
      feedbackNo: "👎",
      feedbackUp: "👍 Sim",
      feedbackDown: "👎 Não",
      feedbackSent: "Obrigado pelo seu feedback.",
      feedbackError: "Nao foi possivel enviar o feedback."
    },
    fr: {
      settingsButton: "Configurer",
      closeButton: "Fermer",
      question: "Voulez-vous analyser si ce site est sur ?",
      analyzeButton: "Analyser",
      dismissButton: "Pas maintenant",
      apiKeyLabel: "Cle API Mistral",
      apiKeyInfo: "Saisissez la cle Mistral pour executer l'analyse.",
      runWithKeyButton: "Analyser avec la cle",
      cancelButton: "Annuler",
      reasonsSummary: "Justification",
      actionsSummary: "Actions recommandees",
      purchaseSafetySummary: "S\u00e9curit\u00e9 de l'achat",
      purchaseSafetySafe: "L'achat sur ce site semble s\u00fbr.",
      purchaseSafetyCaution: "Acheter ici demande prudence et v\u00e9rification.",
      purchaseSafetyRisk: "Il est pr\u00e9f\u00e9rable de ne pas acheter ici pour l'instant.",
      purchaseSafetyUnknown: "Contexte d'achat non d\u00e9tect\u00e9 pour \u00e9valuer en s\u00e9curit\u00e9.",
      loadingTitle: "Analyse de votre sécurité",
      loadingSummary: "Consultation de l'agent distant.",
      riskMeterTitle: "Indice de securite",
      errorOpenSettings: "Impossible d'ouvrir la configuration.",
      errorApiKeyRequired: "Saisissez votre cle API Mistral pour continuer.",
      errorAnalysisFailed: "L'analyse n'a pas pu etre terminee.",
      errorUnexpected: "Erreur inattendue.",
      errorAnalyzeTitle: "Analyse impossible",
      fallbackSummary: "Aucun detail d'analyse supplementaire n'a ete retourne pour cette page.",
      resultSafeTitle: "Le site semble sur",
      resultRiskTitle: "Ne pas faire confiance a ce site",
      resultCautionTitle: "Faire preuve de prudence",
      resultNeutralTitle: "Preuves insuffisantes",
      resultUnknownTitle: "Resultat non concluant",
      feedbackPrompt: "Évaluer le résultat",
      feedbackYes: "👍",
      feedbackNo: "👎",
      feedbackUp: "👍 Oui",
      feedbackDown: "👎 Non",
      feedbackSent: "Merci pour votre avis.",
      feedbackError: "Impossible d'envoyer le feedback."
    },
    de: {
      settingsButton: "Einstellungen",
      closeButton: "Schließen",
      question: "Moechtest du pruefen, ob diese Website sicher ist?",
      analyzeButton: "Analysieren",
      dismissButton: "Nicht jetzt",
      apiKeyLabel: "Mistral API-Schluessel",
      apiKeyInfo: "Gib deinen Mistral-Schluessel ein, um die Analyse zu starten.",
      runWithKeyButton: "Mit Schluessel analysieren",
      cancelButton: "Abbrechen",
      reasonsSummary: "Begruendung",
      actionsSummary: "Empfohlene Aktionen",
      purchaseSafetySummary: "Sicherheit beim Kauf",
      purchaseSafetySafe: "Der Kauf auf dieser Website scheint sicher zu sein.",
      purchaseSafetyCaution: "Der Kauf hier erfordert Vorsicht und eine pr\u00fcfende Kontrolle.",
      purchaseSafetyRisk: "Es wird derzeit nicht empfohlen, hier zu kaufen.",
      purchaseSafetyUnknown: "Es wurde kein klarer Kaufkontext f\u00fcr eine sichere Bewertung gefunden.",
      loadingTitle: "Ihre Sicherheit wird geprüft",
      loadingSummary: "Remote-Agent wird abgefragt.",
      riskMeterTitle: "Sicherheitsindex",
      errorOpenSettings: "Einstellungen konnten nicht geoeffnet werden.",
      errorApiKeyRequired: "Gib deinen Mistral API-Schluessel ein, um fortzufahren.",
      errorAnalysisFailed: "Analyse konnte nicht abgeschlossen werden.",
      errorUnexpected: "Unerwarteter Fehler.",
      errorAnalyzeTitle: "Analyse fehlgeschlagen",
      fallbackSummary: "Es wurden keine zusaetzlichen Analysedetails fuer diese Seite zurueckgegeben.",
      resultSafeTitle: "Die Website wirkt sicher",
      resultRiskTitle: "Dieser Website nicht vertrauen",
      resultCautionTitle: "Mit Vorsicht nutzen",
      resultNeutralTitle: "Nicht genug Beweise",
      resultUnknownTitle: "Nicht eindeutiges Ergebnis",
      feedbackPrompt: "Bewerten Sie das Ergebnis",
      feedbackYes: "👍",
      feedbackNo: "👎",
      feedbackUp: "👍 Ja",
      feedbackDown: "👎 Nein",
      feedbackSent: "Danke für dein Feedback.",
      feedbackError: "Feedback konnte nicht gesendet werden."
    },
    it: {
      settingsButton: "Configura",
      closeButton: "Chiudi",
      question: "Vuoi analizzare se questo sito e sicuro?",
      analyzeButton: "Analizza",
      dismissButton: "Non ora",
      apiKeyLabel: "API key di Mistral",
      apiKeyInfo: "Inserisci la chiave Mistral per eseguire l'analisi.",
      runWithKeyButton: "Analizza con chiave",
      cancelButton: "Annulla",
      reasonsSummary: "Motivazione",
      actionsSummary: "Azioni consigliate",
      purchaseSafetySummary: "Sicurezza dell'acquisto",
      purchaseSafetySafe: "Puoi acquistare su questo sito in modo generalmente sicuro.",
      purchaseSafetyCaution: "Acquista qui con cautela e verifica il contesto.",
      purchaseSafetyRisk: "Per ora non \u00e8 consigliato acquistare qui.",
      purchaseSafetyUnknown: "Nessun contesto di acquisto chiaro\u00e8 stato rilevato.",
      loadingTitle: "Analizzando la tua sicurezza",
      loadingSummary: "Consultazione agente remoto.",
      riskMeterTitle: "Indice di sicurezza",
      errorOpenSettings: "Impossibile aprire le impostazioni.",
      errorApiKeyRequired: "Inserisci la tua API key Mistral per continuare.",
      errorAnalysisFailed: "Analisi non completata.",
      errorUnexpected: "Errore imprevisto.",
      errorAnalyzeTitle: "Analisi non riuscita",
      fallbackSummary: "Non sono stati restituiti dettagli aggiuntivi dell'analisi per questa pagina.",
      resultSafeTitle: "Il sito sembra sicuro",
      resultRiskTitle: "Non fidarti di questo sito",
      resultCautionTitle: "Procedere con cautela",
      resultNeutralTitle: "Evidenze insufficienti",
      resultUnknownTitle: "Risultato non conclusivo",
      feedbackPrompt: "Valuta il risultato",
      feedbackYes: "👍",
      feedbackNo: "👎",
      feedbackUp: "👍 Sì",
      feedbackDown: "👎 No",
      feedbackSent: "Grazie per il tuo feedback.",
      feedbackError: "Impossibile inviare il feedback."
    },
    ca: {
      settingsButton: "Configurar",
      closeButton: "Tancar",
      question: "Vols analitzar si aquest lloc web es segur?",
      analyzeButton: "Analitzar",
      dismissButton: "Ara no",
      apiKeyLabel: "API key de Mistral",
      apiKeyInfo: "Introdueix la clau de Mistral per executar l'analisi.",
      runWithKeyButton: "Analitzar amb clau",
      cancelButton: "Cancelar",
      reasonsSummary: "Justificacio",
      actionsSummary: "Accions recomanades",
      purchaseSafetySummary: "Seguretat al comprar",
      purchaseSafetySafe: "Comprar a aquest lloc sembla segur.",
      purchaseSafetyCaution: "Comprar aqu\u00ed requereix cautela i revisi\u00f3.",
      purchaseSafetyRisk: "Ara per ara no es recomana comprar en aquest web.",
      purchaseSafetyUnknown: "No s'ha detectat un context de compra clar per valorar-ho amb seguretat.",
      loadingTitle: "Analitzant la teva seguretat",
      loadingSummary: "Consultant l'agent remot.",
      riskMeterTitle: "Index de seguretat",
      errorOpenSettings: "No s'ha pogut obrir la configuracio.",
      errorApiKeyRequired: "Introdueix la teva API key de Mistral per continuar.",
      errorAnalysisFailed: "L'analisi no s'ha pogut completar.",
      errorUnexpected: "Error inesperat.",
      errorAnalyzeTitle: "No s'ha pogut analitzar",
      fallbackSummary: "No s'han retornat detalls addicionals de l'analisi per a aquesta pagina.",
      resultSafeTitle: "La web sembla segura",
      resultRiskTitle: "No confiar en aquesta web",
      resultCautionTitle: "Avançar amb precaució",
      resultNeutralTitle: "No hi ha prou evidència",
      resultUnknownTitle: "Resultat no concloent",
      feedbackPrompt: "Valora el resultat",
      feedbackYes: "👍",
      feedbackNo: "👎",
      feedbackUp: "👍 Sí",
      feedbackDown: "👎 No",
      feedbackSent: "Gràcies pel teu feedback.",
      feedbackError: "No s'ha pogut enviar el feedback."
    }
  };

  const SNAPSHOT_LIMITS = {
    pageHtmlChars: 150000,
    visibleTextChars: 50000,
    headingCountPerLevel: 12,
    metaValueChars: 1024,
    scriptDomainChars: 128,
    pageTextSectionChars: 1400,
    formActionLimit: 12
  };

  const SUSPICIOUS_KEYWORDS = [
    "verify your account",
    "verifica tu cuenta",
    "confirma tu cuenta",
    "ingresa tus datos",
    "credit card",
    "numero de tarjeta",
    "pay with",
    "ingresa contraseña",
    "introduce password",
    "download now",
    "downloading",
    "cuidado",
    "alerta",
    "urgente",
    "activa tu cuenta",
    "security alert",
    "fraude",
    "phishing",
    "suspicious activity",
    "acceso bloqueado",
    "session expired"
  ];

  const PURCHASE_CTA_PATTERNS = [
    /\badd to cart\b/,
    /\bbuy now\b/,
    /\bcheckout\b/,
    /\bshop now\b/,
    /\bcomprar\b/,
    /\bcarrito\b/,
    /\bcesta\b/,
    /\bpagar\b/,
    /\bpago\b/,
    /\bpayment\b/,
    /\bbilling\b/,
    /\border\b/,
    /\bpedido\b/,
    /\bsuscrib(?:e|ir|irse)\b/,
    /\bsubscribe\b/,
    /\btienda\b/,
    /\bstore\b/
  ];

  const PURCHASE_URL_PATTERNS = [
    /\/(?:cart|checkout|shop|store|product|products|buy|order|pedido|carrito|cesta|pago|payment|billing)(?:[/?#]|$)/,
    /(?:\?|&)(?:add[_-]?to[_-]?cart|checkout|product|sku|item|order|pedido|payment|billing)=/
  ];

  const PURCHASE_TEXT_PATTERNS = [
    /\badd to cart\b/,
    /\bbuy now\b/,
    /\bcheckout\b/,
    /\bcomprar\b/,
    /\bpagar\b/,
    /\bpayment\b/,
    /\border\b/,
    /\bpedido\b/,
    /\bshipping\b/,
    /\benvio\b/,
    /\bdelivery\b/,
    /\bpaypal\b/,
    /\bstripe\b/,
    /\bvisa\b/,
    /\bmastercard\b/
  ];

  const PURCHASE_PRICE_PATTERNS = [
    /(?:€|\$|£)\s*\d{1,5}(?:[.,]\d{1,2})?/,
    /\d{1,5}(?:[.,]\d{1,2})?\s*(?:€|\$|£|\beur\b|\busd\b|\bgbp\b)/
  ];

  const COOKIE_REJECTOR_CONFIG = {
    maxAttempts: 24,
    intervalMs: 1200
  };

  const COOKIE_CONTEXT_PATTERNS = [
    /cookie/,
    /consent/,
    /gdpr/,
    /privacy/,
    /privacidad/,
    /onetrust/,
    /didomi/,
    /trustarc/
  ];

  const COOKIE_REJECT_PATTERNS = [
    /rechazar/,
    /denegar/,
    /solo necesarias/,
    /solo esenciales/,
    /reject all/,
    /deny all/,
    /decline all/,
    /only necessary/,
    /essential only/,
    /tout refuser/,
    /alles ablehnen/,
    /alle ablehnen/,
    /rifiuta/,
    /rejeitar/
  ];

  const COOKIE_CONFIGURE_PATTERNS = [
    /configurar cookies/,
    /preferencias de cookies/,
    /cookie settings/,
    /manage cookies/,
    /manage preferences/,
    /privacy settings/,
    /personalizar/,
    /customize/
  ];

  const COOKIE_ACCEPT_PATTERNS = [
    /aceptar/,
    /accept/,
    /allow all/,
    /agree/,
    /autoriser/,
    /akzeptieren/,
    /consent/
  ];

  function isSearchResultsPage(currentLocation) {
    if (!currentLocation) {
      return false;
    }

    const hostname =
      typeof currentLocation.hostname === "string" ? currentLocation.hostname.toLowerCase() : "";
    const pathname =
      typeof currentLocation.pathname === "string" ? currentLocation.pathname.toLowerCase() : "";
    const search = typeof currentLocation.search === "string" ? currentLocation.search : "";

    if (!hostname || !pathname) {
      return false;
    }

    const params = new URLSearchParams(search);
    const hasGenericSearchQuery = params.has("q") || params.has("query") || params.has("text");
    const hasYahooQuery = params.has("p") || hasGenericSearchQuery;

    const isGoogleSearch =
      /(^|\.)google\./.test(hostname) && (pathname.startsWith("/search") || pathname === "/webhp");
    const isBingSearch = /(^|\.)bing\.com$/.test(hostname) && pathname.startsWith("/search");
    const isYahooSearch = /(^|\.)yahoo\./.test(hostname) && pathname.startsWith("/search");

    if (isGoogleSearch || isBingSearch) {
      return hasGenericSearchQuery;
    }

    if (isYahooSearch) {
      return hasYahooQuery;
    }

    return false;
  }

  function isSafePageForAnalysis(currentLocation) {
    if (!currentLocation) {
      return false;
    }

    const protocol = toTrimmedString(currentLocation.protocol).toLowerCase();
    const hostname = toTrimmedString(currentLocation.hostname).toLowerCase();
    const pathname = toTrimmedString(currentLocation.pathname).toLowerCase();

    if (!protocol || !hostname) {
      return false;
    }

    if (protocol === "chrome:" || protocol === "chrome-extension:" || protocol === "about:" || protocol === "file:" || protocol === "view-source:") {
      return false;
    }

    if (!["http:", "https:"].includes(protocol)) {
      return false;
    }

    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname.endsWith(".local")) {
      return false;
    }

    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) || /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) || /^172\.(1[6-9]|2[0-9]|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return false;
    }

    if (hostname === "0.0.0.0" || hostname.startsWith("10.") || hostname.endsWith(".intranet")) {
      return false;
    }

    const authPathPatterns = [
      /^\/(?:login|signin|sign\-in|signout|register|signup|log(?:in)?|auth|oauth|sso|password|forgot|reset|account|profile|dashboard)\b/,
      /(?:^|\/)(my-account|signin|sign-up|log-in|signup|register)\b/,
      /\/(signin|login|auth|oauth|sso|signup|register|password|recover|forgot)(\/.*)?$/i
    ];

    if (authPathPatterns.some((pattern) => pattern.test(pathname))) {
      return false;
    }

    return true;
  }

  function startAutoCookieRejector() {
    if (window.__linksfairyCookieRejectorStarted) {
      return;
    }

    window.__linksfairyCookieRejectorStarted = true;

    let attempts = 0;
    let configureClicked = false;

    const runAttempt = () => {
      attempts += 1;

      const rejectCandidate = findCookieActionCandidate("reject");
      if (rejectCandidate) {
        triggerElementClick(rejectCandidate);
        return true;
      }

      if (!configureClicked) {
        const configureCandidate = findCookieActionCandidate("configure");
        if (configureCandidate) {
          configureClicked = triggerElementClick(configureCandidate);
        }
      }

      return attempts >= COOKIE_REJECTOR_CONFIG.maxAttempts;
    };

    if (runAttempt()) {
      return;
    }

    const timer = window.setInterval(() => {
      if (runAttempt()) {
        window.clearInterval(timer);
      }
    }, COOKIE_REJECTOR_CONFIG.intervalMs);
  }

  function findCookieActionCandidate(actionType) {
    const roots = collectSearchRoots(document);

    for (const rootNode of roots) {
      const candidate = findCookieActionCandidateInRoot(rootNode, actionType);
      if (candidate) {
        return candidate;
      }
    }

    return null;
  }

  function collectSearchRoots(doc) {
    const roots = [];
    const queue = [];

    const pushRoot = (rootNode) => {
      if (!rootNode || roots.includes(rootNode)) {
        return;
      }
      roots.push(rootNode);
      queue.push(rootNode);
    };

    pushRoot(doc);

    while (queue.length > 0) {
      const currentRoot = queue.shift();
      if (!currentRoot || !currentRoot.querySelectorAll) {
        continue;
      }

      const shadowHosts = currentRoot.querySelectorAll("*");
      shadowHosts.forEach((host) => {
        if (host.shadowRoot) {
          pushRoot(host.shadowRoot);
        }
      });

      const iframes = currentRoot.querySelectorAll("iframe");
      iframes.forEach((frame) => {
        try {
          if (frame.contentDocument) {
            pushRoot(frame.contentDocument);
          }
        } catch (_error) {
          // Ignore cross-origin iframes.
        }
      });
    }

    return roots;
  }

  function findCookieActionCandidateInRoot(rootNode, actionType) {
    if (!rootNode || !rootNode.querySelectorAll) {
      return null;
    }

    const selector = "button, [role='button'], a, input[type='button'], input[type='submit'], [aria-label]";
    const clickableNodes = rootNode.querySelectorAll(selector);

    for (const node of clickableNodes) {
      if (!node || typeof node !== "object") {
        continue;
      }

      if (!isElementInteractable(node)) {
        continue;
      }

      const label = normalizeForMatch(getClickableLabel(node));
      if (!label) {
        continue;
      }

      if (!matchesCookieContext(node)) {
        continue;
      }

      if (matchesAnyPattern(label, COOKIE_ACCEPT_PATTERNS)) {
        continue;
      }

      if (actionType === "reject" && matchesAnyPattern(label, COOKIE_REJECT_PATTERNS)) {
        return node;
      }

      if (actionType === "configure" && matchesAnyPattern(label, COOKIE_CONFIGURE_PATTERNS)) {
        return node;
      }
    }

    return null;
  }

  function getClickableLabel(node) {
    if (!node) {
      return "";
    }

    const labelCandidates = [
      node.getAttribute && node.getAttribute("aria-label"),
      node.getAttribute && node.getAttribute("title"),
      "value" in node ? node.value : "",
      node.textContent
    ];

    return labelCandidates.map((candidate) => toTrimmedString(candidate)).find(Boolean) || "";
  }

  function isElementInteractable(node) {
    if (!node || node.disabled) {
      return false;
    }

    const rect = node.getBoundingClientRect ? node.getBoundingClientRect() : null;
    if (!rect || rect.width <= 0 || rect.height <= 0) {
      return false;
    }

    const style = window.getComputedStyle ? window.getComputedStyle(node) : null;
    if (!style) {
      return true;
    }

    if (style.visibility === "hidden" || style.display === "none" || style.pointerEvents === "none") {
      return false;
    }

    return true;
  }

  function matchesCookieContext(node) {
    let current = node;
    let depth = 0;

    while (current && depth < 8) {
      const idValue = toTrimmedString(current.id);
      const classValue = toTrimmedString(current.className);
      const idAndClass = normalizeForMatch(`${idValue} ${classValue}`);
      if (matchesAnyPattern(idAndClass, COOKIE_CONTEXT_PATTERNS)) {
        return true;
      }

      const contextText = normalizeForMatch(toTrimmedString(current.textContent).slice(0, 600));
      if (matchesAnyPattern(contextText, COOKIE_CONTEXT_PATTERNS)) {
        return true;
      }

      current = getParentNode(current);
      depth += 1;
    }

    return false;
  }

  function getParentNode(node) {
    if (!node) {
      return null;
    }

    if (node.parentElement) {
      return node.parentElement;
    }

    if (!node.getRootNode) {
      return null;
    }

    const rootNode = node.getRootNode();
    if (rootNode && rootNode.host) {
      return rootNode.host;
    }

    return null;
  }

  function triggerElementClick(node) {
    if (!node || typeof node.click !== "function") {
      return false;
    }

    try {
      node.click();
      return true;
    } catch (_error) {
      return false;
    }
  }

  function matchesAnyPattern(text, patterns) {
    if (!text || !Array.isArray(patterns)) {
      return false;
    }

    return patterns.some((pattern) => pattern.test(text));
  }

  function normalizeForMatch(value) {
    return toTrimmedString(value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
  }

  function normalizeUiLanguagePreference(value) {
    const raw = toTrimmedString(value).toLowerCase();
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

  function getUiMessage(language, key) {
    const pack = UI_MESSAGES[language] || UI_MESSAGES.en;
    if (typeof pack[key] === "string" && pack[key]) {
      return pack[key];
    }

    return UI_MESSAGES.en[key] || "";
  }

  function getFeedbackSubmitLabel(language) {
    const normalizedLanguage = toTrimmedString(language).toLowerCase().split("-")[0];
    const rawLabel = toTrimmedString(getUiMessage(language, "feedbackSubmit"));
    if (normalizedLanguage === "es") {
      return "Enviar";
    }
    if (rawLabel.toLowerCase() === "para enviar") {
      return "Enviar";
    }
    return rawLabel || "Send";
  }

  function getHeaderStateLabel(stateValue, language) {
    if (stateValue === "safe") {
      return getUiMessage(language, "stateSafeLabel");
    }
    if (stateValue === "caution") {
      return getUiMessage(language, "stateCautionLabel");
    }
    if (stateValue === "risk") {
      return getUiMessage(language, "stateRiskLabel");
    }
    return getUiMessage(language, "stateUnknownLabel");
  }

  function applyUiMessages(dom, language) {
    dom.headerTitle.textContent = "Link's Fairy";
    if (dom.headerState) {
      dom.headerState.textContent = getHeaderStateLabel("unknown", language);
    }
    dom.launcherButton.title = "Link's Fairy";
    dom.launcherButton.setAttribute("aria-label", "Link's Fairy");
    if (dom.openOptionsButton) {
      const settingsLabel = getUiMessage(language, "settingsButton");
      dom.openOptionsButton.textContent = settingsLabel;
      dom.openOptionsButton.title = settingsLabel;
      dom.openOptionsButton.setAttribute("aria-label", settingsLabel);
    }
    if (dom.closeButton) {
      dom.closeButton.title = getUiMessage(language, "closeButton");
      dom.closeButton.setAttribute("aria-label", getUiMessage(language, "closeButton"));
    }
    dom.statusReasonsSummary.textContent = getUiMessage(language, "reasonsSummary");
    dom.statusActionsSummary.textContent = getUiMessage(language, "actionsSummary");
    if (dom.statusPurchaseSafetySummary) {
      dom.statusPurchaseSafetySummary.textContent = getUiMessage(language, "purchaseSafetySummary");
    }
    dom.feedbackTitle.textContent = getUiMessage(language, "feedbackPrompt");
    dom.feedbackYesButton.textContent = getUiMessage(language, "feedbackYes");
    dom.feedbackNoButton.textContent = getUiMessage(language, "feedbackNo");
    dom.feedbackYesButton.setAttribute("aria-label", getUiMessage(language, "feedbackYesLabel"));
    dom.feedbackNoButton.setAttribute("aria-label", getUiMessage(language, "feedbackNoLabel"));
    dom.feedbackDownSubmit.textContent = getFeedbackSubmitLabel(language);
  }

  const root = document.createElement("div");
  root.id = "linksfairy-root";

  const shadowRoot = root.attachShadow({ mode: "open" });
  shadowRoot.innerHTML = `
    <style>
      :host {
        all: initial;
        --linksfairy-ui-zoom: 1;
        --linksfairy-card-width: 380px;
      }

      .linksfairy-card {
        position: fixed;
        top: 12px;
        right: 12px;
        z-index: 2147483647;
        width: var(--linksfairy-card-width);
        min-width: var(--linksfairy-card-width);
        max-width: var(--linksfairy-card-width);
        height: auto;
        max-height: calc(100vh - 24px);
        max-height: calc(100dvh - 24px);
        border-radius: 12px;
        border: 1px solid #d9dce3;
        box-shadow: 0 10px 28px rgba(20, 32, 54, 0.22);
        background: #f9fafc;
        color: #1a2538;
        font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        zoom: var(--linksfairy-ui-zoom);
      }

      .linksfairy-launcher {
        position: fixed;
        top: 12px;
        right: 12px;
        z-index: 2147483647;
        display: none !important;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
        box-sizing: border-box;
        zoom: var(--linksfairy-ui-zoom);
      }

      .linksfairy-launcher-bubble {
        position: relative;
        max-width: min(400px, calc(100vw - 96px));
        max-height: min(200px, calc(100vh - 120px));
        overflow: auto;
        border: 1px solid #b9c6dd;
        border-radius: 12px;
        background: #ffffff;
        color: #1a2538;
        box-shadow: 0 8px 24px rgba(20, 32, 54, 0.18);
        padding: 9px 11px;
        font-size: 12px;
        line-height: 1.35;
        white-space: normal;
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      .linksfairy-launcher-bubble::after {
        content: "";
        position: absolute;
        top: 100%;
        right: 24px;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid #ffffff;
      }

      .linksfairy-launcher-bubble::before {
        content: "";
        position: absolute;
        top: 100%;
        right: 23px;
        border-left: 9px solid transparent;
        border-right: 9px solid transparent;
        border-top: 9px solid #b9c6dd;
      }

      .linksfairy-launcher-bubble p {
        margin: 0;
      }

      .linksfairy-launcher-btn {
        border: 0;
        background: transparent;
        padding: 0;
        width: 56px;
        height: 56px;
        border-radius: 999px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 18px rgba(20, 32, 54, 0.22);
        transition: transform 0.15s ease;
      }

      .linksfairy-launcher-btn:hover {
        transform: translateY(-1px);
      }

      .linksfairy-launcher-btn:focus-visible {
        outline: 2px solid #d9e7ff;
        outline-offset: 2px;
      }

      .linksfairy-launcher-fairy {
        width: 56px;
        height: 56px;
        object-fit: contain;
        border-radius: 999px;
      }

      .linksfairy-launcher-fairy.linksfairy-loading,
      .linksfairy-status-fairy.linksfairy-loading {
        animation: linksfairy-fairy-loading 1.3s ease-in-out infinite;
      }

      @keyframes linksfairy-fairy-loading {
        0% {
          transform: scale(1) rotate(0deg);
          filter: hue-rotate(0deg) saturate(1) brightness(1);
        }

        33% {
          transform: scale(1.04) rotate(1.5deg);
          filter: hue-rotate(-18deg) saturate(1.08) brightness(1.04);
        }

        66% {
          transform: scale(0.98) rotate(-1.5deg);
          filter: hue-rotate(18deg) saturate(1.12) brightness(0.97);
        }

        100% {
          transform: scale(1) rotate(0deg);
          filter: hue-rotate(0deg) saturate(1) brightness(1);
        }
      }

      .linksfairy-header {
        padding: 10px 12px;
        background: linear-gradient(120deg, #204f8f, #2a7ac5);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .linksfairy-header.linksfairy-safe {
        background: linear-gradient(120deg, #1b7f56, #39ab6f);
      }

      .linksfairy-header.linksfairy-caution {
        background: linear-gradient(120deg, #b08b1d, #cfb72c);
      }

      .linksfairy-header.linksfairy-risk {
        background: linear-gradient(120deg, #9f2323, #cc3535);
      }

      .linksfairy-header.linksfairy-unknown {
        background: linear-gradient(120deg, #5f6f87, #778ca3);
      }

      .linksfairy-header-title {
        line-height: 1.2;
        margin: 0;
        font-size: 15px;
        font-weight: 700;
      }

      .linksfairy-header-state {
        font-size: 12px;
        opacity: 0.95;
        font-weight: 600;
      }

      .linksfairy-options-btn {
        border: 0;
        background: transparent;
        color: #ffffff;
        width: 26px;
        height: 26px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        font-size: 17px;
        cursor: pointer;
        transition: transform 0.15s ease, background-color 0.15s ease;
      }

      .linksfairy-options-btn:hover {
        background-color: rgba(255, 255, 255, 0.15);
        transform: rotate(30deg);
      }

      .linksfairy-options-btn:focus-visible {
        outline: 2px solid #d9e7ff;
        outline-offset: 2px;
      }

      .linksfairy-header-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .linksfairy-body {
        flex: 1 1 auto;
        padding: 12px;
        font-size: 13px;
        line-height: 1.45;
        overflow-y: auto;
        overscroll-behavior: contain;
        min-height: 0;
      }

      .linksfairy-body p {
        margin: 0 0 10px;
      }

      .linksfairy-field {
        display: block;
        margin-bottom: 8px;
      }

      .linksfairy-field span {
        display: block;
        margin-bottom: 4px;
        font-size: 12px;
        color: #42516b;
      }

      .linksfairy-input {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid #bec7d6;
        border-radius: 8px;
        padding: 7px 9px;
        font-size: 12px;
        background: #ffffff;
        color: #1f2d42;
      }

      .linksfairy-info {
        margin: 0 0 10px;
        font-size: 12px;
        color: #42516b;
      }

      .linksfairy-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: center;
      }

      .linksfairy-btn {
        border: 0;
        border-radius: 8px;
        padding: 7px 10px;
        font-size: 12px;
        cursor: pointer;
      }

      .linksfairy-btn-primary {
        background: #175da8;
        color: #ffffff;
      }

      .linksfairy-btn-secondary {
        background: #e4e9f2;
        color: #1d2b42;
      }

      .linksfairy-btn:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }

      .linksfairy-status {
        margin-top: 0;
        border-radius: 10px;
        border: 1px solid #d9deea;
        background: #ffffff;
        padding: 10px;
      }

      .linksfairy-status-title-row {
        display: none;
      }

      .linksfairy-status-fairy {
        width: 30px;
        height: 30px;
        flex: 0 0 30px;
        object-fit: contain;
        border-radius: 999px;
      }

      .linksfairy-status-title {
        margin: 0;
        font-weight: 700;
        font-size: 12px;
        line-height: 1.2;
      }

      .linksfairy-status-title-risk {
        color: #c40000;
        font-weight: 800;
      }

      .linksfairy-status p {
        margin: 0 0 6px;
        font-size: 12px;
      }

      .linksfairy-status-summary {
        margin: 0 0 8px;
        position: relative;
        background: #ffffff;
        border: 1px solid #b9c6dd;
        border-radius: 10px;
        padding: 10px;
        font-size: 13px;
        line-height: 1.35;
        white-space: normal;
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      .linksfairy-recommendation {
        display: none;
      }

      .linksfairy-analysis-meta {
        margin: 0 0 8px;
        font-size: 11px;
        line-height: 1.3;
        color: #4b5d76;
        text-align: center;
      }

      .linksfairy-status.linksfairy-loading .linksfairy-status-summary {
        animation: linksfairy-summary-loading 1.4s ease-in-out infinite;
      }

      .linksfairy-status.linksfairy-loading .linksfairy-status-title {
        animation: linksfairy-title-loading 1.4s ease-in-out infinite;
      }

      .linksfairy-launcher-bubble.linksfairy-loading {
        animation: linksfairy-summary-loading 1.4s ease-in-out infinite;
      }

      @keyframes linksfairy-summary-loading {
        0% {
          border-color: #c6d1e5;
        }

        50% {
          border-color: #8fb1e5;
          box-shadow: 0 0 9px rgba(39, 93, 184, 0.25);
        }

        100% {
          border-color: #c6d1e5;
        }
      }

      @keyframes linksfairy-title-loading {
        0% {
          opacity: 0.9;
        }

        50% {
          opacity: 1;
        }

        100% {
          opacity: 0.9;
        }
      }

      .linksfairy-status-summary::before {
        display: none;
      }

      .linksfairy-status-summary::after {
        display: none;
      }

      .linksfairy-status-summary p {
        margin: 0 0 6px;
      }

      .linksfairy-status-summary ul,
      .linksfairy-status-summary ol {
        margin: 0 0 6px 18px;
        padding: 0;
      }

      .linksfairy-status-summary li {
        margin: 0 0 4px;
      }

      .linksfairy-status-summary code {
        padding: 1px 4px;
        border-radius: 4px;
        background: #edf2f8;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
        color: #2f3d5a;
      }

      .linksfairy-reasons {
        margin: 0;
        padding-left: 16px;
        font-size: 12px;
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      .linksfairy-accordion {
        margin-top: 10px;
        border: 0;
        border-radius: 0;
        background: transparent;
        overflow: visible;
      }

      .linksfairy-accordion-summary {
        cursor: default;
        font-size: 13px;
        font-weight: 700;
        color: #17223b;
        padding: 0 0 6px;
        user-select: none;
        list-style: none;
      }

      .linksfairy-accordion-summary::-webkit-details-marker {
        display: none;
      }

      .linksfairy-accordion-summary::before {
        display: none;
      }

      .linksfairy-accordion-content {
        padding: 0;
      }

      .linksfairy-purchase-safety-content {
        padding: 0;
        font-size: 12px;
      }

      .linksfairy-purchase-safety-safe {
        color: #1f7b45;
      }

      .linksfairy-purchase-safety-caution {
        color: #956d1b;
      }

      .linksfairy-purchase-safety-risk {
        color: #a72e2e;
      }

      .linksfairy-purchase-safety-unknown {
        color: #4f607b;
      }

      .linksfairy-actions-list {
        margin: 0;
        padding-left: 16px;
        font-size: 12px;
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      .linksfairy-actions-list li {
        margin: 0 0 4px;
      }

      .linksfairy-feedback {
        margin-top: 12px;
        border: 1px solid #d9deea;
        border-radius: 10px;
        background: #f9fbff;
        padding: 10px;
      }

      .linksfairy-feedback-title {
        display: block;
        margin: 0 0 8px;
        font-size: 12px;
        font-weight: 700;
        color: #243755;
      }

      .linksfairy-feedback-option {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        min-width: 54px;
      }

      .linksfairy-feedback-count {
        font-size: 10px;
        color: #4c607e;
        line-height: 1.2;
      }

      .linksfairy-feedback-form {
        margin-top: 8px;
        border-top: 1px solid #d6deea;
        padding-top: 6px;
      }

      .linksfairy-feedback-hint {
        margin: 0 0 6px;
        font-size: 11px;
        color: #40516d;
      }

      .linksfairy-feedback-form textarea {
        width: 100%;
        box-sizing: border-box;
        min-height: 44px;
        resize: vertical;
        border: 1px solid #c4cfdf;
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 11px;
        color: #1f2d42;
        background: #ffffff;
      }

      .linksfairy-feedback-advanced-row {
        margin: 0 0 6px;
      }

      .linksfairy-feedback-select {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid #c4cfdf;
        border-radius: 6px;
        padding: 5px 6px;
        font-size: 11px;
        background: #ffffff;
      }

      .linksfairy-feedback-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 6px;
      }

      .linksfairy-feedback-submit {
        min-width: 80px;
        padding: 6px 10px;
        font-size: 11px;
      }

      .linksfairy-btn-feedback-yes {
        opacity: 0.85;
        background: #1f8f4f;
        color: #ffffff;
      }

      .linksfairy-btn-feedback-no {
        opacity: 0.85;
        background: #c43333;
        color: #ffffff;
      }

      .linksfairy-feedback-btn-selected {
        opacity: 1;
        box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.22);
      }

      .linksfairy-feedback-message {
        margin: 4px 0 0;
        font-size: 11px;
        color: #46576f;
      }

      .linksfairy-status-actions p {
        margin: 0 0 6px;
        font-size: 12px;
      }

      .linksfairy-hidden {
        display: none;
      }

      .linksfairy-safe {
        border-color: #87c79b;
        background: #effaf2;
      }

      .linksfairy-risk {
        border-color: #f1b8b8;
        background: #fff1f1;
      }

      .linksfairy-unknown {
        border-color: #d9e0ed;
        background: #f2f4f8;
      }

      .linksfairy-caution {
        border-color: #e3d599;
        background: #fff9df;
      }

      .linksfairy-status.linksfairy-safe,
      .linksfairy-status.linksfairy-caution,
      .linksfairy-status.linksfairy-risk,
      .linksfairy-status.linksfairy-neutral,
      .linksfairy-status.linksfairy-unknown {
        border-color: #d9deea;
        background: #ffffff;
      }

      .linksfairy-risk-meter {
        display: none !important;
      }

      .linksfairy-footer {
        display: flex;
        justify-content: flex-end;
        padding: 8px 12px 12px;
      }

      .linksfairy-settings-btn {
        border: 0;
        border-radius: 8px;
        background: #14559b;
        color: #ffffff;
        font-size: 12px;
        padding: 7px 10px;
        cursor: pointer;
      }

      .linksfairy-settings-btn:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }

      .linksfairy-risk-meter-title {
        margin: 0 0 4px;
        font-size: 11px;
        color: #546078;
        line-height: 1.3;
      }

      .linksfairy-risk-meter-rail {
        --linksfairy-gradient-height: 22px;
        --linksfairy-rail-gap: 10px;
        position: relative;
        width: 100%;
        padding: var(--linksfairy-rail-gap) 0 24px;
      }

      .linksfairy-risk-gradient {
        width: 100%;
        height: var(--linksfairy-gradient-height);
        border-radius: 4px;
        background: linear-gradient(
          90deg,
          #e31616 0%,
          #f4371c 18%,
          #efde00 48%,
          #b6d400 66%,
          #62c400 100%
        );
      }

      .linksfairy-risk-pointer-wrap {
        position: absolute;
        top: calc(var(--linksfairy-rail-gap) + var(--linksfairy-gradient-height) - 1px);
        left: 50%;
        width: 0;
        transform: translateX(-50%);
        transition: left 0.26s ease;
        pointer-events: none;
        font-size: 0;
        line-height: 0;
      }

      .linksfairy-risk-pointer {
        display: block;
        width: 0;
        height: 0;
        line-height: 0;
        font-size: 0;
        border-left: 9px solid transparent;
        border-right: 9px solid transparent;
        border-top: 0;
        border-bottom: 14px solid #9c9c9c;
      }

    </style>
    <div id="linksfairy-launcher" class="linksfairy-launcher">
      <div id="linksfairy-launcher-bubble" class="linksfairy-launcher-bubble linksfairy-hidden"></div>
      <button id="linksfairy-launcher-button" class="linksfairy-launcher-btn" aria-label="Link's Fairy" title="Link's Fairy">
        <img id="linksfairy-launcher-fairy" class="linksfairy-launcher-fairy" alt="" aria-hidden="true" />
      </button>
    </div>
    <section class="linksfairy-card linksfairy-hidden" id="linksfairy-card">
      <header class="linksfairy-header">
        <span id="linksfairy-header-title" class="linksfairy-header-title">Link's Fairy</span>
        <div class="linksfairy-header-actions">
          <span id="linksfairy-header-state" class="linksfairy-header-state"></span>
          <button id="linksfairy-close" class="linksfairy-options-btn" title="" aria-label="">×</button>
        </div>
      </header>
      <div class="linksfairy-body">
      <article id="linksfairy-status" class="linksfairy-status linksfairy-hidden" aria-live="polite">
        <div class="linksfairy-status-title-row">
          <img id="linksfairy-status-fairy" class="linksfairy-status-fairy linksfairy-hidden" alt="" aria-hidden="true" />
          <h2 id="linksfairy-status-title" class="linksfairy-status-title"></h2>
        </div>
        <div id="linksfairy-status-summary" class="linksfairy-status-summary"></div>
        <p id="linksfairy-recommendation" class="linksfairy-recommendation"></p>
        <p id="linksfairy-analysis-meta" class="linksfairy-analysis-meta" hidden></p>
        <details id="linksfairy-purchase-safety-section" class="linksfairy-accordion linksfairy-hidden" open>
          <summary id="linksfairy-purchase-safety-summary" class="linksfairy-accordion-summary"></summary>
            <div class="linksfairy-purchase-safety-content">
              <div id="linksfairy-status-purchase-safety"></div>
            </div>
          </details>
          <div id="linksfairy-risk-meter" class="linksfairy-risk-meter linksfairy-hidden">
            <p id="linksfairy-risk-meter-title" class="linksfairy-risk-meter-title"></p>
            <div class="linksfairy-risk-meter-rail">
              <div class="linksfairy-risk-gradient" aria-hidden="true"></div>
              <div id="linksfairy-risk-pointer" class="linksfairy-risk-pointer-wrap" aria-hidden="true">
                <span class="linksfairy-risk-pointer"></span>
              </div>
            </div>
          </div>
          <details id="linksfairy-reasons-section" class="linksfairy-accordion linksfairy-hidden" open>
            <summary id="linksfairy-reasons-summary" class="linksfairy-accordion-summary"></summary>
            <div class="linksfairy-accordion-content">
              <ul id="linksfairy-status-reasons" class="linksfairy-reasons"></ul>
            </div>
          </details>
          <details id="linksfairy-actions-section" class="linksfairy-accordion linksfairy-hidden">
            <summary id="linksfairy-actions-summary" class="linksfairy-accordion-summary"></summary>
            <div class="linksfairy-accordion-content">
              <div id="linksfairy-status-actions" class="linksfairy-status-actions"></div>
            </div>
          </details>
          <div id="linksfairy-feedback" class="linksfairy-feedback linksfairy-hidden">
            <p id="linksfairy-feedback-title" class="linksfairy-feedback-title"></p>
            <div class="linksfairy-actions">
              <div class="linksfairy-feedback-option">
                <button id="linksfairy-feedback-yes" class="linksfairy-btn linksfairy-btn-feedback-yes" aria-label="">👍</button>
                <div id="linksfairy-feedback-yes-count" class="linksfairy-feedback-count">0</div>
              </div>
              <div class="linksfairy-feedback-option">
                <button id="linksfairy-feedback-no" class="linksfairy-btn linksfairy-btn-feedback-no" aria-label="">👎</button>
                <div id="linksfairy-feedback-no-count" class="linksfairy-feedback-count">0</div>
              </div>
            </div>
            <div id="linksfairy-feedback-form" class="linksfairy-feedback-form linksfairy-hidden">
              <p id="linksfairy-feedback-form-hint" class="linksfairy-feedback-hint"></p>
              <div id="linksfairy-feedback-advanced-row" class="linksfairy-feedback-advanced-row linksfairy-hidden">
                <label>
                  <select id="linksfairy-feedback-down-reason" class="linksfairy-feedback-select"></select>
                </label>
              </div>
              <textarea id="linksfairy-feedback-down-comment" class="linksfairy-input" placeholder=""></textarea>
              <div class="linksfairy-feedback-actions">
                <button id="linksfairy-feedback-down-submit" class="linksfairy-btn linksfairy-btn-primary linksfairy-feedback-submit"></button>
              </div>
            </div>
            <p id="linksfairy-feedback-message" class="linksfairy-feedback-message"></p>
          </div>
        </article>
      </div>
      <footer class="linksfairy-footer">
        <button id="linksfairy-open-options" class="linksfairy-settings-btn" title="" aria-label=""></button>
      </footer>
    </section>
  `;

  if (!document.documentElement) {
    return;
  }

  document.documentElement.appendChild(root);

  const elements = {
    card: shadowRoot.getElementById("linksfairy-card"),
    launcher: shadowRoot.getElementById("linksfairy-launcher"),
    launcherButton: shadowRoot.getElementById("linksfairy-launcher-button"),
    launcherBubble: shadowRoot.getElementById("linksfairy-launcher-bubble"),
    launcherFairy: shadowRoot.getElementById("linksfairy-launcher-fairy"),
    header: shadowRoot.querySelector(".linksfairy-header"),
    headerTitle: shadowRoot.getElementById("linksfairy-header-title"),
    headerState: shadowRoot.getElementById("linksfairy-header-state"),
    openOptionsButton: shadowRoot.getElementById("linksfairy-open-options"),
    closeButton: shadowRoot.getElementById("linksfairy-close"),
    status: shadowRoot.getElementById("linksfairy-status"),
    statusFairy: shadowRoot.getElementById("linksfairy-status-fairy"),
    statusTitle: shadowRoot.getElementById("linksfairy-status-title"),
    statusSummary: shadowRoot.getElementById("linksfairy-status-summary"),
    statusRecommendation: shadowRoot.getElementById("linksfairy-recommendation"),
    statusAnalysisMeta: shadowRoot.getElementById("linksfairy-analysis-meta"),
    statusRiskMeter: shadowRoot.getElementById("linksfairy-risk-meter"),
    statusRiskMeterTitle: shadowRoot.getElementById("linksfairy-risk-meter-title"),
    statusRiskPointer: shadowRoot.getElementById("linksfairy-risk-pointer"),
    statusPurchaseSafetySection: shadowRoot.getElementById("linksfairy-purchase-safety-section"),
    statusPurchaseSafetySummary: shadowRoot.getElementById("linksfairy-purchase-safety-summary"),
    statusPurchaseSafetyMessage: shadowRoot.getElementById("linksfairy-status-purchase-safety"),
    statusReasonsSection: shadowRoot.getElementById("linksfairy-reasons-section"),
    statusReasonsSummary: shadowRoot.getElementById("linksfairy-reasons-summary"),
    statusActionsSection: shadowRoot.getElementById("linksfairy-actions-section"),
    statusActionsSummary: shadowRoot.getElementById("linksfairy-actions-summary"),
    statusReasons: shadowRoot.getElementById("linksfairy-status-reasons"),
    statusActions: shadowRoot.getElementById("linksfairy-status-actions"),
    feedbackSection: shadowRoot.getElementById("linksfairy-feedback"),
    feedbackTitle: shadowRoot.getElementById("linksfairy-feedback-title"),
    feedbackYesButton: shadowRoot.getElementById("linksfairy-feedback-yes"),
    feedbackNoButton: shadowRoot.getElementById("linksfairy-feedback-no"),
    feedbackYesCount: shadowRoot.getElementById("linksfairy-feedback-yes-count"),
    feedbackNoCount: shadowRoot.getElementById("linksfairy-feedback-no-count"),
    feedbackMessage: shadowRoot.getElementById("linksfairy-feedback-message"),
    feedbackForm: shadowRoot.getElementById("linksfairy-feedback-form"),
    feedbackFormHint: shadowRoot.getElementById("linksfairy-feedback-form-hint"),
    feedbackDownReasonWrap: shadowRoot.getElementById("linksfairy-feedback-advanced-row"),
    feedbackDownReason: shadowRoot.getElementById("linksfairy-feedback-down-reason"),
    feedbackDownComment: shadowRoot.getElementById("linksfairy-feedback-down-comment"),
    feedbackDownSubmit: shadowRoot.getElementById("linksfairy-feedback-down-submit")
  };

  const state = {
    autoRejectCookies: false,
    uiLanguagePreference: "auto",
    uiLanguage: resolveUiLanguage("auto"),
    clientInstallId: "",
    advancedFeedbackMode: false,
    isExpanded: false,
    launcherBubbleHtml: "",
    lastAnalysisId: "",
    lastCanonicalUrl: "",
    lastVoteKey: "",
    lastCountKey: "",
    userFeedbackVote: "",
    feedbackCounts: {},
    loadingAnimationTimer: null,
    loadingDotCount: 0,
    loadingSummaryBase: [],
    loadingTitleBase: ""
  };
  let removePanelSizeListeners = null;

  const hydrationPromise = Promise.all([
    hydrateAutoRejectSetting(state),
    hydrateUiLanguageSetting(state),
    hydrateAdvancedFeedbackMode(state),
    hydrateClientInstallId(state),
    clearLegacyFeedbackStorage()
  ]);

  hydrationPromise.then(() => {
    applyUiMessages(elements, state.uiLanguage);
    if (state.autoRejectCookies) {
      startAutoCookieRejector();
    }
  });
  setInitialState(elements, state);
  applyUiMessages(elements, state.uiLanguage);
  void hydratePanelSizing(root);
  void hydrationPromise.then(() => {
    runAnalysis().catch((error) => {
      showError(elements, mapAnalysisError(error.message, state.uiLanguage), state.uiLanguage);
    });
  });

  if (elements.openOptionsButton) {
    elements.openOptionsButton.addEventListener("click", async () => {
      const result = await sendRuntimeMessage({ action: "openOptionsPage" });
      if (!result.ok) {
        showError(elements, result.error || getUiMessage(state.uiLanguage, "errorOpenSettings"), state.uiLanguage);
      }
    });
  }

  if (elements.closeButton) {
    elements.closeButton.addEventListener("click", () => {
      setExpanded(elements, false);
    });
  }

  elements.launcherButton.addEventListener("click", () => {
    setExpanded(elements, !state.isExpanded);
  });

  elements.feedbackYesButton.addEventListener("click", () => {
    submitFeedbackVote("yes");
  });

  elements.feedbackNoButton.addEventListener("click", () => {
    openFeedbackDownForm();
  });

  elements.feedbackDownSubmit.addEventListener("click", () => {
    submitFeedbackVote("no", true);
  });

  const runtimeMessageHandler = (message, _sender, sendResponse) => {
    if (!message || typeof message.action !== "string") {
      return;
    }

    if (message.action === "collapseLinksfairyPanel") {
      setExpanded(elements, false);
      sendResponse({ ok: true, expanded: false });
      return true;
    }

    if (message.action !== "toggleLinksfairyPanel") {
      return;
    }

    setExpanded(elements, !state.isExpanded);
    sendResponse({ ok: true, expanded: state.isExpanded });
    return true;
  };
  chrome.runtime.onMessage.addListener(runtimeMessageHandler);

  window.__linksfairyRuntime = {
    version: INJECTION_VERSION,
    destroy: () => {
      try {
        chrome.runtime.onMessage.removeListener(runtimeMessageHandler);
      } catch (_error) {
        // No-op if runtime listener cleanup is not available.
      }
      try {
        stopLoadingPulse(elements);
      } catch (_error) {
        // Ignore cleanup errors.
      }
      if (typeof removePanelSizeListeners === "function") {
        try {
          removePanelSizeListeners();
        } catch (_error) {
          // Ignore cleanup errors.
        }
        removePanelSizeListeners = null;
      }
      if (root && root.parentNode) {
        root.parentNode.removeChild(root);
      }
    }
  };

  async function hydratePanelSizing(hostElement) {
    const response = await sendRuntimeMessage({ action: "getTabZoom" });
    const rawZoom = Number(
      response &&
      response.ok &&
      response.result &&
      response.result.zoom
    );
    const zoomFactor = Number.isFinite(rawZoom) && rawZoom > 0 ? rawZoom : 1;

    const applySizing = () => {
      const visualWidth =
        window.visualViewport && Number.isFinite(window.visualViewport.width)
          ? window.visualViewport.width
          : window.innerWidth;
      const safeVisualWidth = Number.isFinite(visualWidth) && visualWidth > 0
        ? visualWidth
        : 1280;
      const effectiveViewportWidth = safeVisualWidth * zoomFactor;
      const maxCardWidth = 380;
      const minCardWidth = 320;
      const availableWidth = Math.max(220, Math.floor(effectiveViewportWidth - 24));
      const cardWidth = Math.max(
        minCardWidth,
        Math.min(maxCardWidth, availableWidth)
      );
      hostElement.style.setProperty("--linksfairy-card-width", `${cardWidth}px`);

      const compensation = Math.max(0.25, Math.min(1, 1 / zoomFactor));
      hostElement.style.setProperty("--linksfairy-ui-zoom", String(compensation));
    };

    applySizing();

    const resizeHandler = () => {
      applySizing();
    };

    window.addEventListener("resize", resizeHandler);
    const viewport = window.visualViewport;
    if (viewport && viewport.addEventListener) {
      viewport.addEventListener("resize", resizeHandler);
    }

    removePanelSizeListeners = () => {
      window.removeEventListener("resize", resizeHandler);
      if (viewport && viewport.removeEventListener) {
        viewport.removeEventListener("resize", resizeHandler);
      }
    };
  }

  function setExpanded(dom, expanded) {
    state.isExpanded = expanded === true;
    dom.card.classList.toggle("linksfairy-hidden", !state.isExpanded);
    if (state.isExpanded) {
      hideLauncherBubble(dom);
    } else if (state.launcherBubbleHtml) {
      setLauncherBubble(dom, state.launcherBubbleHtml);
    }
  }

  function setLauncherBubble(dom, html) {
    const bubbleHtml = toTrimmedString(html);
    if (!bubbleHtml) {
      hideLauncherBubble(dom);
      return;
    }

    dom.launcherBubble.innerHTML = bubbleHtml;
    dom.launcherBubble.classList.remove("linksfairy-hidden");
  }

  function hideLauncherBubble(dom) {
    dom.launcherBubble.innerHTML = "";
    dom.launcherBubble.classList.add("linksfairy-hidden");
  }

  function buildLauncherBubbleHtml(analysis) {
    const text = truncateText(toTrimmedString(analysis.summary || analysis.recommendedActionText || analysis.title), 320);
    if (!text) {
      return "";
    }

    return renderMarkdownBlock(text);
  }

  function setInitialState(dom, localState) {
    setHeaderStateClass(dom, "");
    setStatusFairy(dom, "safe");
    if (dom.headerState) {
      dom.headerState.textContent = getHeaderStateLabel("unknown", localState.uiLanguage);
    }
    localState.launcherBubbleHtml = "";
    hideLauncherBubble(dom);
    setExpanded(dom, false);

    dom.status.classList.add("linksfairy-hidden");
    dom.statusRecommendation.textContent = "";
    dom.statusAnalysisMeta.textContent = "";
    dom.statusAnalysisMeta.hidden = true;
    dom.statusPurchaseSafetySection.classList.add("linksfairy-hidden");
    dom.statusPurchaseSafetyMessage.textContent = "";
    dom.statusPurchaseSafetyMessage.className = "linksfairy-purchase-safety-content";
    if (dom.statusPurchaseSafetySummary) {
      dom.statusPurchaseSafetySummary.textContent = getUiMessage(localState.uiLanguage, "purchaseSafetySummary");
    }
    localState.lastAnalysisId = "";
    localState.lastCanonicalUrl = "";
    localState.lastVoteKey = "";
    localState.lastCountKey = "";
    localState.userFeedbackVote = "";
    dom.feedbackYesCount.textContent = "0";
    dom.feedbackNoCount.textContent = "0";
    applyFeedbackSelectionClasses(dom, "");
    hideFeedbackSection(dom);
  }

  async function runAnalysis() {
    setBusy(elements, true);
    showLoading(elements, state.uiLanguage);

    try {
      const pageSnapshot = buildPageSnapshot();
      const hasPurchaseContext = detectPurchaseContext(pageSnapshot);

      const response = await sendRuntimeMessage({
        action: "analyzeCurrentPage",
        payload: {
          pageUrl: window.location.href,
          pageTitle: document.title,
          pageExcerpt: extractPageExcerpt(),
          canonicalUrl: getCanonicalUrl(),
          documentLanguage: getDocumentLanguage(),
          locale: getBrowserLanguage(),
          urlDomain: getCurrentDomain(),
          urlTld: getCurrentTopLevelDomain(),
          pageSnapshot,
          clientInstallId: state.clientInstallId,
          clientContext: await getClientContext()
        }
      });

      if (!response.ok) {
        throw new Error(response.error || getUiMessage(state.uiLanguage, "errorAnalysisFailed"));
      }

      const normalized = normalizeAnalysisResponse(
        response.result && response.result.data,
        state.uiLanguage,
        { hasPurchaseContext }
      );
      state.lastAnalysisId = normalized.analysisId || "";
      state.lastCanonicalUrl = normalized.canonicalUrl || getCanonicalUrl() || sanitizePageUrl(window.location.href);
      showResult(elements, normalized);
    } catch (error) {
      showError(elements, mapAnalysisError(error.message, state.uiLanguage), state.uiLanguage);
    } finally {
      stopLoadingPulse(elements);
      setBusy(elements, false);
    }
  }

  function setBusy(dom, busy) {
    if (dom.openOptionsButton) {
      dom.openOptionsButton.disabled = busy;
    }

    dom.feedbackYesButton.disabled = busy;
    dom.feedbackNoButton.disabled = busy;
    dom.feedbackDownSubmit.disabled = busy;
  }

  function showLoading(dom, language) {
    stopLoadingPulse(dom);
    setHeaderStateClass(dom, "safe");
    setStatusFairy(dom, "safe");
    if (dom.headerState) {
      dom.headerState.textContent = getHeaderStateLabel("unknown", language);
    }
    state.launcherBubbleHtml = "";
    dom.status.classList.remove(
      "linksfairy-hidden",
      "linksfairy-safe",
      "linksfairy-risk",
      "linksfairy-caution",
      "linksfairy-neutral",
      "linksfairy-unknown"
    );
    dom.status.classList.add("linksfairy-safe");
    dom.statusTitle.classList.remove("linksfairy-status-title-risk");
    dom.statusTitle.classList.remove("linksfairy-hidden");
    dom.statusSummary.classList.remove("linksfairy-hidden");
    startLoadingPulse(dom, language);
    dom.statusRecommendation.textContent = "";
    dom.statusAnalysisMeta.textContent = "";
    dom.statusAnalysisMeta.hidden = true;
    dom.statusRiskMeter.classList.add("linksfairy-hidden");
    dom.statusRiskMeterTitle.textContent = "";
    setRiskPointerPosition(dom, 50);
    dom.statusReasonsSection.classList.add("linksfairy-hidden");
    dom.statusPurchaseSafetySection.classList.add("linksfairy-hidden");
    dom.statusActionsSection.classList.add("linksfairy-hidden");
    dom.statusActions.innerHTML = "";
    hideFeedbackSection(dom);
    clearReasons(dom.statusReasons);
  }

  function showResult(dom, analysis) {
    stopLoadingPulse(dom);
    const resultState = analysis.advisedState || (analysis.safe === true ? "safe" : analysis.safe === false ? "risk" : "neutral");
    const shouldAutoExpandForRisk = resultState === "risk" || resultState === "caution";
    const stateClass =
      resultState === "safe"
        ? "linksfairy-safe"
        : resultState === "risk"
          ? "linksfairy-risk"
          : resultState === "caution"
            ? "linksfairy-caution"
            : resultState === "unknown"
              ? "linksfairy-unknown"
              : "linksfairy-neutral";

    dom.status.classList.remove(
      "linksfairy-hidden",
      "linksfairy-safe",
      "linksfairy-risk",
      "linksfairy-caution",
      "linksfairy-neutral",
      "linksfairy-unknown"
    );
    dom.status.classList.add(stateClass);
    setHeaderStateClass(dom, resultState === "neutral" ? "unknown" : resultState);
    setStatusFairy(dom, resultState);
    if (dom.headerState) {
      dom.headerState.textContent = getHeaderStateLabel(
        resultState === "neutral" ? "unknown" : resultState,
        state.uiLanguage
      );
    }
    dom.statusTitle.classList.remove("linksfairy-hidden");
    dom.statusSummary.classList.remove("linksfairy-hidden");
    dom.statusTitle.classList.toggle("linksfairy-status-title-risk", resultState === "risk");
    dom.statusTitle.textContent = analysis.title;
    dom.statusSummary.innerHTML = renderMarkdownBlock(analysis.summary);
    dom.statusRecommendation.textContent = getRecommendationText(resultState, state.uiLanguage);
    dom.statusAnalysisMeta.textContent = buildCacheLabelText(analysis);
    dom.statusAnalysisMeta.hidden = false;
    const launcherHtml = buildLauncherBubbleHtml(analysis);
    if (launcherHtml) {
      state.launcherBubbleHtml = launcherHtml;
      if (!state.isExpanded) {
        setLauncherBubble(dom, launcherHtml);
      }
    } else {
      state.launcherBubbleHtml = "";
      hideLauncherBubble(dom);
    }
    renderPurchaseSafetySection(dom, analysis, state.uiLanguage);
    showFeedbackSection(dom, analysis);

    if (typeof analysis.riskScore === "number" && Number.isFinite(analysis.riskScore)) {
      const riskScore = analysis.riskScore;
      const effectiveRisk = applyConfidenceToRiskScore(riskScore, analysis.confidenceScore);
      const safetyScore = clampPercentage((1 - effectiveRisk / 10) * 100);
      const displayPosition = safetyScore;
      dom.statusRiskMeter.classList.remove("linksfairy-hidden");
      dom.statusRiskMeterTitle.textContent = getUiMessage(state.uiLanguage, "riskMeterTitle");
      setRiskPointerPosition(dom, displayPosition);
    } else {
      dom.statusRiskMeter.classList.add("linksfairy-hidden");
      dom.statusRiskMeterTitle.textContent = "";
      setRiskPointerPosition(dom, 50);
    }

    clearReasons(dom.statusReasons);
    analysis.reasons.slice(0, 5).forEach((reason) => {
      const li = document.createElement("li");
      li.innerHTML = renderInlineMarkdown(reason);
      dom.statusReasons.appendChild(li);
    });

    if (analysis.reasons.length > 0) {
      dom.statusReasonsSection.classList.remove("linksfairy-hidden");
      dom.statusReasonsSection.open = true;
    } else {
      dom.statusReasonsSection.classList.add("linksfairy-hidden");
    }

    renderRecommendedActions(dom, analysis.recommendedActionText);

    const shouldAutoExpand = isResultRiskyOrCaution(resultState, analysis);
    if (shouldAutoExpand) {
      setExpanded(dom, true);
    }
  }

  function isResultRiskyOrCaution(resultState, analysis) {
    if (resultState === "risk" || resultState === "caution") {
      return true;
    }

    return (
      analysis &&
      (analysis.purchaseSafety === "risk" || analysis.purchaseSafety === "caution")
    );
  }

  function showError(dom, message, language) {
    stopLoadingPulse(dom);
    setHeaderStateClass(dom, "risk");
    setStatusFairy(dom, "risk");
    if (dom.headerState) {
      dom.headerState.textContent = getHeaderStateLabel("unknown", language);
    }
    dom.status.classList.remove(
      "linksfairy-hidden",
      "linksfairy-safe",
      "linksfairy-risk",
      "linksfairy-caution",
      "linksfairy-neutral",
      "linksfairy-unknown"
    );
    dom.status.classList.add("linksfairy-risk");
    dom.statusTitle.classList.remove("linksfairy-status-title-risk", "linksfairy-hidden");
    dom.statusSummary.classList.remove("linksfairy-hidden");
    dom.statusTitle.textContent = getUiMessage(language, "errorAnalyzeTitle");
    dom.statusSummary.textContent = message;
    dom.statusRecommendation.textContent = "";
    dom.statusAnalysisMeta.textContent = "";
    dom.statusAnalysisMeta.hidden = true;
    const launcherHtml = renderMarkdownBlock(truncateText(message, 260));
    state.launcherBubbleHtml = launcherHtml;
    if (!state.isExpanded) {
      setLauncherBubble(dom, launcherHtml);
    }
    dom.statusRiskMeter.classList.add("linksfairy-hidden");
    dom.statusRiskMeterTitle.textContent = "";
    setRiskPointerPosition(dom, 50);
    dom.statusReasonsSection.classList.add("linksfairy-hidden");
    dom.statusPurchaseSafetySection.classList.add("linksfairy-hidden");
    dom.statusActionsSection.classList.add("linksfairy-hidden");
    dom.statusActions.innerHTML = "";
    hideFeedbackSection(dom);
    clearReasons(dom.statusReasons);
  }

  function startLoadingPulse(dom, language) {
    if (!dom || !dom.status) {
      return;
    }

    stopLoadingPulse(dom);

    const loadingTitle = getUiMessage(language, "loadingTitle") || "";
    const loadingStep1 = getUiMessage(language, "loadingStep1") || loadingTitle;
    const loadingStep2 = getUiMessage(language, "loadingStep2") || loadingStep1;
    const loadingStep3 = getUiMessage(language, "loadingStep3") || loadingStep1;
    const messages = [loadingStep1, loadingStep2, loadingStep3];
    state.loadingSummaryBase = messages;
    state.loadingTitleBase = loadingTitle;
    state.loadingDotCount = 0;

    dom.status.classList.add("linksfairy-loading");
    if (dom.statusFairy) {
      dom.statusFairy.classList.add("linksfairy-loading");
    }
    if (dom.launcherFairy) {
      dom.launcherFairy.classList.add("linksfairy-loading");
    }

    const updateLoadingText = () => {
      const summaryText = state.loadingSummaryBase[state.loadingDotCount % state.loadingSummaryBase.length];
      state.loadingDotCount += 1;
      const titleText = state.loadingTitleBase;

      dom.statusTitle.textContent = titleText;
      dom.statusSummary.textContent = summaryText;
      if (dom.statusRecommendation) {
        dom.statusRecommendation.textContent = "";
      }

      if (!state.isExpanded) {
        dom.launcherBubble.classList.add("linksfairy-loading");
        setLauncherBubble(dom, summaryText);
      }
    };

    updateLoadingText();
    state.loadingAnimationTimer = window.setInterval(updateLoadingText, 500);
  }

  function stopLoadingPulse(dom) {
    if (state.loadingAnimationTimer) {
      window.clearInterval(state.loadingAnimationTimer);
      state.loadingAnimationTimer = null;
    }

    if (!dom || !dom.status) {
      return;
    }

    state.loadingDotCount = 0;
    state.loadingSummaryBase = [];
    state.loadingTitleBase = "";

    dom.status.classList.remove("linksfairy-loading");
    if (dom.statusFairy) {
      dom.statusFairy.classList.remove("linksfairy-loading");
    }
    if (dom.launcherFairy) {
      dom.launcherFairy.classList.remove("linksfairy-loading");
    }
    if (dom.launcherBubble) {
      dom.launcherBubble.classList.remove("linksfairy-loading");
    }
  }

  function hideFeedbackSection(dom) {
    dom.feedbackSection.classList.add("linksfairy-hidden");
    dom.feedbackMessage.textContent = "";
    dom.feedbackYesButton.disabled = true;
    dom.feedbackNoButton.disabled = true;
    dom.feedbackDownSubmit.disabled = true;
    dom.feedbackYesCount.textContent = "0";
    dom.feedbackNoCount.textContent = "0";
    dom.feedbackForm.classList.add("linksfairy-hidden");
    dom.feedbackFormHint.textContent = "";
    dom.feedbackDownComment.value = "";
    dom.feedbackDownReason.selectedIndex = 0;
    state.userFeedbackVote = "";
    applyFeedbackSelectionClasses(dom, "");
  }

  function showFeedbackSection(dom, analysis) {
    const voteKey = toTrimmedString(analysis.canonicalUrl || analysis.analysisId);
    state.lastVoteKey = voteKey;
    const countKey = toTrimmedString(analysis.canonicalUrl || state.lastCanonicalUrl || sanitizePageUrl(window.location.href));
    state.lastCountKey = countKey || voteKey;
    state.userFeedbackVote = normalizeFeedbackVote(
      analysis && analysis.userFeedback
        ? analysis.userFeedback
        : analysis && analysis.user_feedback
    );

    if (state.lastCountKey) {
      state.feedbackCounts[state.lastCountKey] = normalizeFeedbackCounts(analysis && analysis.feedbackCounts);
    }

    dom.feedbackSection.classList.remove("linksfairy-hidden");
    dom.feedbackTitle.textContent = getUiMessage(state.uiLanguage, "feedbackPrompt");
    dom.feedbackYesButton.textContent = getUiMessage(state.uiLanguage, "feedbackYes");
    dom.feedbackNoButton.textContent = getUiMessage(state.uiLanguage, "feedbackNo");
    dom.feedbackDownSubmit.textContent = getFeedbackSubmitLabel(state.uiLanguage);
    setupFeedbackFormLabels(dom);
    renderFeedbackCounts(dom, state.lastCountKey);
    applyFeedbackSelectionClasses(dom, state.userFeedbackVote);

    if (!voteKey) {
      dom.feedbackMessage.textContent = "";
      dom.feedbackYesButton.disabled = true;
      dom.feedbackNoButton.disabled = true;
      dom.feedbackDownSubmit.disabled = true;
      dom.feedbackForm.classList.add("linksfairy-hidden");
      return;
    }

    if (state.userFeedbackVote) {
      dom.feedbackMessage.textContent = getUiMessage(state.uiLanguage, "feedbackAlreadyVoted");
      dom.feedbackYesButton.disabled = false;
      dom.feedbackNoButton.disabled = false;
      dom.feedbackDownSubmit.disabled = true;
      dom.feedbackForm.classList.add("linksfairy-hidden");
      return;
    }

    dom.feedbackMessage.textContent = "";
    dom.feedbackYesButton.disabled = false;
    dom.feedbackNoButton.disabled = false;
    dom.feedbackDownSubmit.disabled = true;
    dom.feedbackDownComment.value = "";
    dom.feedbackDownReason.selectedIndex = 0;
    dom.feedbackForm.classList.add("linksfairy-hidden");
    setFeedbackFormMode(dom, state.advancedFeedbackMode);
  }

  function setupFeedbackFormLabels(dom) {
    const reasonHint = getUiMessage(state.uiLanguage, "feedbackDownHint");
    const reasonPlaceholder = getUiMessage(state.uiLanguage, "feedbackDownPlaceholder");
    const isAdvanced = state.advancedFeedbackMode === true;

    if (reasonHint) {
      dom.feedbackFormHint.textContent = reasonHint;
      dom.feedbackDownReason.setAttribute("aria-label", reasonHint);
    }

    if (reasonPlaceholder) {
      dom.feedbackDownComment.placeholder = reasonPlaceholder;
    }

    if (!isAdvanced) {
      dom.feedbackDownReasonWrap.classList.add("linksfairy-hidden");
      return;
    }

    dom.feedbackDownReason.innerHTML = "";
    const options = [
      {
        value: "incorrect_result",
        label: getUiMessage(state.uiLanguage, "feedbackAdvancedReasonIncorrect")
      },
      {
        value: "too_risky",
        label: getUiMessage(state.uiLanguage, "feedbackAdvancedReasonRisky")
      },
      {
        value: "unclear",
        label: getUiMessage(state.uiLanguage, "feedbackAdvancedReasonUnclear")
      },
      {
        value: "other",
        label: getUiMessage(state.uiLanguage, "feedbackAdvancedReasonOther")
      }
    ];

    const cleaned = options.map((item) => {
      const label = toTrimmedString(item.label) || item.value;
      return { value: item.value, label };
    });

    cleaned.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label;
      dom.feedbackDownReason.appendChild(option);
    });

    dom.feedbackDownReasonWrap.classList.remove("linksfairy-hidden");
  }

  function setFeedbackFormMode(dom, isAdvancedMode) {
    if (!dom || !dom.feedbackDownReasonWrap) {
      return;
    }

    if (isAdvancedMode === true) {
      dom.feedbackDownReasonWrap.classList.remove("linksfairy-hidden");
      return;
    }

    dom.feedbackDownReasonWrap.classList.add("linksfairy-hidden");
    if (dom.feedbackDownReason) {
      dom.feedbackDownReason.selectedIndex = 0;
    }
  }

  async function openFeedbackDownForm() {
    if (elements.feedbackNoButton.disabled) {
      return;
    }

    const currentVote = state.userFeedbackVote;
    if (currentVote === "down") {
      elements.feedbackMessage.textContent = getUiMessage(state.uiLanguage, "feedbackAlreadyVoted");
      return;
    }

    elements.feedbackForm.classList.remove("linksfairy-hidden");
    if (state.advancedFeedbackMode !== true) {
      elements.feedbackDownReasonWrap.classList.add("linksfairy-hidden");
    } else {
      elements.feedbackDownReasonWrap.classList.remove("linksfairy-hidden");
    }

    elements.feedbackDownSubmit.textContent = getFeedbackSubmitLabel(state.uiLanguage);
    elements.feedbackDownSubmit.disabled = false;
    elements.feedbackDownComment.focus();
  }

  async function submitFeedbackVote(voteValue, fromDownForm = false) {
    const voteKey = toTrimmedString(state.lastVoteKey);
    if (!voteKey) {
      return;
    }

    const normalizedVote = normalizeFeedbackVote(voteValue);
    if (!normalizedVote) {
      return;
    }

    const previousVote = state.userFeedbackVote;
    if (previousVote === normalizedVote) {
      elements.feedbackMessage.textContent = getUiMessage(state.uiLanguage, "feedbackAlreadyVoted");
      applyFeedbackSelectionClasses(elements, previousVote);
      if (voteValue === "down") {
        elements.feedbackForm.classList.add("linksfairy-hidden");
      }
      elements.feedbackDownSubmit.disabled = true;
      elements.feedbackYesButton.disabled = false;
      elements.feedbackNoButton.disabled = false;
      return;
    }

    elements.feedbackYesButton.disabled = true;
    elements.feedbackNoButton.disabled = true;
    elements.feedbackMessage.textContent = "";

    const isPositiveVote = normalizedVote === "up";
    const normalizedFeedback = isPositiveVote ? "up" : "down";

    if (!isPositiveVote && !fromDownForm) {
      openFeedbackDownForm();
      return;
    }

    const reasonRaw = isPositiveVote
      ? "other"
      : (state.advancedFeedbackMode === true
        ? toTrimmedString(elements.feedbackDownReason.value)
        : "incorrect_result");
    const reason = normalizeReportReason(reasonRaw, isPositiveVote);
    const comment = isPositiveVote ? "" : toTrimmedString(elements.feedbackDownComment.value);

    try {
      const payload = {
        analysis_id: state.lastAnalysisId || undefined,
        canonical_url: state.lastCanonicalUrl || sanitizePageUrl(window.location.href),
        feedback: normalizedFeedback,
        reason,
        comment,
        locale: getBrowserLanguage()
      };

      if (state.clientInstallId) {
        payload.client_install_id = state.clientInstallId;
      }

      const response = await sendRuntimeMessage({
        action: "submitReport",
        payload
      });

      if (!response.ok) {
        throw new Error(response.error || getUiMessage(state.uiLanguage, "feedbackError"));
      }

      const backendData = response.result && response.result.data && typeof response.result.data === "object"
        ? response.result.data
        : {};
      state.userFeedbackVote = normalizeFeedbackVote(
        backendData.user_feedback || normalizedVote
      ) || normalizedVote;
      const countKey = toTrimmedString(state.lastCountKey) || voteKey;
      const backendCounts = normalizeFeedbackCounts(
        backendData.feedback_counts || {
          up: backendData.report_up_count,
          down: backendData.report_down_count,
          total: backendData.report_count
        }
      );
      if (backendCounts.total > 0 || backendCounts.up > 0 || backendCounts.down > 0) {
        state.feedbackCounts[countKey] = backendCounts;
      }

      const incremented = backendData.incremented_report_count;
      elements.feedbackMessage.textContent = incremented
        ? getUiMessage(state.uiLanguage, "feedbackSent")
        : getUiMessage(state.uiLanguage, "feedbackAlreadyVoted");

      applyFeedbackSelectionClasses(elements, normalizedVote);
      elements.feedbackYesButton.disabled = false;
      elements.feedbackNoButton.disabled = false;
      elements.feedbackDownSubmit.disabled = true;
      elements.feedbackForm.classList.add("linksfairy-hidden");
      elements.feedbackDownComment.value = "";
      elements.feedbackDownReason.selectedIndex = 0;
      setFeedbackFormMode(elements, state.advancedFeedbackMode);
      renderFeedbackCounts(elements, countKey);
    } catch (error) {
      elements.feedbackMessage.textContent = error.message || getUiMessage(state.uiLanguage, "feedbackError");
      elements.feedbackYesButton.disabled = false;
      elements.feedbackNoButton.disabled = false;
      if (normalizedVote === "down") {
        elements.feedbackDownSubmit.disabled = false;
      } else {
        elements.feedbackDownSubmit.disabled = true;
      }
    }
  }

  function normalizeReportReason(rawReason, isPositiveVote = false) {
    const normalized = toTrimmedString(rawReason).toLowerCase();

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

  function getFeedbackCountEntry(countKey) {
    const raw = state.feedbackCounts[countKey];
    const parsedUp = Number.isFinite(Number(raw && raw.up)) ? Number(raw.up) : 0;
    const parsedDown = Number.isFinite(Number(raw && raw.down)) ? Number(raw.down) : 0;
    return {
      up: Math.max(0, Math.trunc(parsedUp)),
      down: Math.max(0, Math.trunc(parsedDown))
    };
  }

  function applyFeedbackSelectionClasses(dom, voteValue) {
    const normalizedVote = normalizeFeedbackVote(voteValue);
    dom.feedbackYesButton.classList.toggle(FEEDBACK_SELECTED_CLASS, normalizedVote === "up");
    dom.feedbackNoButton.classList.toggle(FEEDBACK_SELECTED_CLASS, normalizedVote === "down");
  }

  function normalizeFeedbackVote(voteValue) {
    const normalized = toTrimmedString(voteValue).toLowerCase();
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

  function renderFeedbackCounts(dom, countKey) {
    const counts = getFeedbackCountEntry(countKey);
    dom.feedbackYesCount.textContent = String(counts.up);
    dom.feedbackNoCount.textContent = String(counts.down);
  }

  function setHeaderStateClass(dom, state) {
    if (!dom.header) {
      return;
    }

    dom.header.classList.remove("linksfairy-safe", "linksfairy-risk", "linksfairy-caution", "linksfairy-unknown");
    if (state === "safe" || state === "risk" || state === "caution" || state === "unknown") {
      dom.header.classList.add(`linksfairy-${state}`);
    }
  }

  function setStatusFairy(dom, state) {
    if (!dom.statusFairy && !dom.launcherFairy) {
      return;
    }

    if (!state || !FAIRY_ICON_BY_STATE[state]) {
      if (dom.statusFairy) {
        dom.statusFairy.classList.add("linksfairy-hidden");
        dom.statusFairy.removeAttribute("src");
      }
      if (dom.launcherFairy) {
        dom.launcherFairy.removeAttribute("src");
      }
      return;
    }

    if (dom.statusFairy) {
      dom.statusFairy.src = FAIRY_ICON_BY_STATE[state];
      dom.statusFairy.classList.remove("linksfairy-hidden");
    }
    if (dom.launcherFairy) {
      dom.launcherFairy.src = FAIRY_ICON_BY_STATE[state];
    }
  }

  function extractPageExcerpt() {
    const metaDescription = getMetaContent("description");

    const textBlocks = Array.from(document.querySelectorAll("h1, h2, p"))
      .map((node) => toTrimmedString(node.textContent))
      .filter(Boolean)
      .slice(0, 16)
      .join(" ");

    return truncateText([toTrimmedString(metaDescription), textBlocks].filter(Boolean).join(" "), SNAPSHOT_LIMITS.pageTextSectionChars);
  }

  function buildPageSnapshot() {
    const documentLanguage = getDocumentLanguage();
    const canonicalUrl = getCanonicalUrl();
    const urlInfo = getUrlInfo(window.location.href);

    return {
      canonical_tag: canonicalUrl,
      visible_text: getVisiblePageText(),
      meta_description: getMetaContent("description"),
      meta_keywords: getMetaContent("keywords"),
      headings: {
        h1: getHeadingTexts("h1", SNAPSHOT_LIMITS.headingCountPerLevel),
        h2: getHeadingTexts("h2", SNAPSHOT_LIMITS.headingCountPerLevel),
        h3: getHeadingTexts("h3", SNAPSHOT_LIMITS.headingCountPerLevel)
      },
      links: collectLinkStats(),
      forms: collectFormStats(),
      scripts: collectScriptStats(),
      iframes: collectIframeStats(),
      document_language: documentLanguage,
      tld: getCurrentTopLevelDomain(),
      url_domain: getCurrentDomain(),
      is_https: urlInfo.is_https,
      contains_redirects: detectRedirectSignals(),
      contains_suspicious_keywords: detectSuspiciousKeywordsInSnapshot(
        `${document.title || ""} ${getMetaContent("description") || ""} ${getVisiblePageText()}`
      ),
      source: "content-script"
    };
  }

  function detectPurchaseContext(snapshot) {
    const explicitSnapshotFlag = pickBoolean([
      snapshot && snapshot.purchase_context,
      snapshot && snapshot.has_purchase_context
    ]);
    if (explicitSnapshotFlag !== null) {
      return explicitSnapshotFlag;
    }

    const forms = snapshot && snapshot.forms && typeof snapshot.forms === "object"
      ? snapshot.forms
      : {};
    const formsCount = numberOrNull(forms.count) || 0;
    const actionTargets = Array.isArray(forms.action_targets) ? forms.action_targets : [];
    const hasPurchaseActionTarget = actionTargets
      .map((target) => normalizeForMatch(target))
      .some((target) => matchesAnyPattern(target, PURCHASE_URL_PATTERNS));

    const ctaNodes = Array.from(
      document.querySelectorAll("a[href], button, input[type='submit'], input[type='button'], [role='button']")
    ).slice(0, 300);

    let ctaMatches = 0;
    for (const node of ctaNodes) {
      const candidateText = normalizeForMatch([
        node.textContent,
        node.getAttribute && node.getAttribute("aria-label"),
        node.getAttribute && node.getAttribute("title"),
        node.getAttribute && node.getAttribute("value"),
        node.getAttribute && node.getAttribute("href"),
        node.getAttribute && node.getAttribute("data-action")
      ].filter(Boolean).join(" "));

      if (!candidateText) {
        continue;
      }

      if (matchesAnyPattern(candidateText, PURCHASE_CTA_PATTERNS) || matchesAnyPattern(candidateText, PURCHASE_URL_PATTERNS)) {
        ctaMatches += 1;
        if (ctaMatches >= 2) {
          break;
        }
      }
    }

    const headingText = [
      ...(snapshot && snapshot.headings && Array.isArray(snapshot.headings.h1) ? snapshot.headings.h1 : []),
      ...(snapshot && snapshot.headings && Array.isArray(snapshot.headings.h2) ? snapshot.headings.h2 : []),
      ...(snapshot && snapshot.headings && Array.isArray(snapshot.headings.h3) ? snapshot.headings.h3 : [])
    ].join(" ");

    const contentSample = normalizeForMatch([
      document.title,
      getMetaContent("description"),
      getMetaContent("keywords"),
      snapshot && snapshot.meta_description,
      snapshot && snapshot.meta_keywords,
      headingText,
      snapshot && snapshot.visible_text ? snapshot.visible_text.slice(0, 12000) : ""
    ].filter(Boolean).join(" "));

    const hasPurchaseText = matchesAnyPattern(contentSample, PURCHASE_TEXT_PATTERNS);
    const hasPriceSignal = matchesAnyPattern(contentSample, PURCHASE_PRICE_PATTERNS);
    const hasCommerceSchema = Boolean(
      document.querySelector('[itemtype*="Product"], [itemprop="price"], meta[property="product:price:amount"], meta[property="og:type"][content="product"]')
    );

    if (hasCommerceSchema || hasPurchaseActionTarget || ctaMatches >= 2) {
      return true;
    }

    if (hasPurchaseText && (hasPriceSignal || formsCount > 0)) {
      return true;
    }

    return false;
  }

  function getMetaContent(name) {
    const normalizedName = toTrimmedString(name).toLowerCase();
    if (!normalizedName) {
      return "";
    }

    const metaByName = document.querySelector(`meta[name='${normalizedName}'], meta[property='${normalizedName}']`);
    const metaByNameFallback = document.querySelector(`meta[name="${normalizedName}"], meta[property="${normalizedName}"]`);

    const meta =
      metaByName ||
      metaByNameFallback;

    return toTrimmedString(
      meta && meta.getAttribute("content")
    );
  }

  function getCanonicalUrl() {
    const canonicalHref = toTrimmedString(
      document.querySelector("link[rel='canonical']")?.getAttribute("href")
    );

    if (!canonicalHref) {
      return "";
    }

    try {
      return sanitizePageUrl(canonicalHref);
    } catch (_error) {
      return sanitizeUrlValue(canonicalHref);
    }
  }

  function getDocumentLanguage() {
    return (
      toTrimmedString(document.documentElement && document.documentElement.lang) ||
      getBrowserLanguage()
    );
  }

  function getBrowserLanguage() {
    return toTrimmedString(navigator && (navigator.language || navigator.userLanguage));
  }

  function getCurrentDomain() {
    return getUrlInfo(window.location.href).domain;
  }

  function getCurrentTopLevelDomain() {
    return getUrlInfo(window.location.href).tld;
  }

  function getUrlInfo(url) {
    const parsed = safeParseUrl(url);
    const domain = parsed ? parsed.hostname : "";
    const hostnameParts = domain ? domain.split(".").filter(Boolean) : [];
    const tld = hostnameParts.length > 0 ? hostnameParts[hostnameParts.length - 1] : "";

    return {
      domain,
      tld,
      is_https: parsed ? parsed.protocol === "https:" : false
    };
  }

  function safeParseUrl(rawUrl) {
    const input = toTrimmedString(rawUrl);
    if (!input) {
      return null;
    }

    try {
      return new URL(input, window.location.href);
    } catch (_error) {
      return null;
    }
  }

  function collectLinkStats() {
    const links = Array.from(document.querySelectorAll("a[href]"));
    const currentUrl = safeParseUrl(window.location.href);
    const currentHost = currentUrl ? currentUrl.hostname : "";
    const externalDomains = new Set();
    let externalCount = 0;
    let totalCount = 0;

    links.forEach((link) => {
      const href = toTrimmedString(link.getAttribute("href"));
      if (!href || href.startsWith("javascript:") || href.startsWith("#")) {
        return;
      }

      const parsed = safeParseUrl(href);
      if (!parsed) {
        return;
      }

      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return;
      }

      totalCount += 1;
      if (currentHost && parsed.hostname && parsed.hostname !== currentHost) {
        externalCount += 1;
        externalDomains.add(parsed.hostname);
      }
    });

    return {
      total: totalCount,
      external: externalCount,
      unique_external_domains: Array.from(externalDomains).slice(0, SNAPSHOT_LIMITS.formActionLimit)
    };
  }

  function collectFormStats() {
    const forms = Array.from(document.forms);
    const actionTargets = new Set();

    let fieldsCount = 0;
    let passwordFields = 0;

    forms.forEach((form) => {
      const fields = form.querySelectorAll("input, textarea, select, button");
      fieldsCount += fields.length;
      passwordFields += form.querySelectorAll("input[type='password']").length;
      const action = toTrimmedString(form.getAttribute("action"));
      if (action) {
        actionTargets.add(sanitizeUrlValue(toTrimmedString(action), true));
      }
    });

    return {
      count: forms.length,
      fields_count: fieldsCount,
      password_fields: passwordFields,
      action_targets: Array.from(actionTargets).slice(0, SNAPSHOT_LIMITS.formActionLimit)
    };
  }

  function collectScriptStats() {
    const scripts = Array.from(document.scripts);
    let inlineScripts = 0;
    let externalScripts = 0;
    const externalScriptDomains = new Set();

    scripts.forEach((script) => {
      const src = toTrimmedString(script.getAttribute("src"));
      if (!src) {
        inlineScripts += 1;
        return;
      }

      const parsed = safeParseUrl(src);
      if (!parsed) {
        return;
      }

      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        externalScripts += 1;
        if (parsed.hostname) {
          externalScriptDomains.add(parsed.hostname);
        }
      }
    });

    return {
      total: scripts.length,
      inline: inlineScripts,
      external: externalScripts,
      external_domains: Array.from(externalScriptDomains).slice(0, SNAPSHOT_LIMITS.formActionLimit)
    };
  }

  function collectIframeStats() {
    const iframes = Array.from(document.querySelectorAll("iframe[src]"));
    const currentHost = safeParseUrl(window.location.href)?.hostname || "";
    let externalIframes = 0;
    const externalIframeDomains = new Set();

    iframes.forEach((iframe) => {
      const src = toTrimmedString(iframe.getAttribute("src"));
      if (!src) {
        return;
      }

      const parsed = safeParseUrl(src);
      if (!parsed) {
        return;
      }

      if (parsed.hostname && parsed.hostname !== currentHost) {
        externalIframes += 1;
        externalIframeDomains.add(parsed.hostname);
      }
    });

    return {
      total: iframes.length,
      external: externalIframes,
      external_domains: Array.from(externalIframeDomains).slice(0, SNAPSHOT_LIMITS.formActionLimit)
    };
  }

  function getHeadingTexts(selector, maxCount) {
    return Array.from(document.querySelectorAll(selector))
      .map((heading) => toTrimmedString(heading.textContent))
      .filter(Boolean)
      .slice(0, maxCount)
      .map((heading) => truncateText(heading, SNAPSHOT_LIMITS.metaValueChars));
  }

  function getVisiblePageText() {
    const bodyText = document.body ? document.body.innerText : "";
    return truncateText(toTrimmedString(bodyText), SNAPSHOT_LIMITS.visibleTextChars);
  }

  function detectRedirectSignals() {
    const metaRefresh = !!document.querySelector('meta[http-equiv="refresh"]');
    const hasRedirectQuery = /(?:^|[?&])(url|redirect|next|return|to|goto|next_url|target|dest|destination)=/i.test(
      toTrimmedString(window.location.search)
    );

    return metaRefresh || hasRedirectQuery;
  }

  function detectSuspiciousKeywordsInSnapshot(text) {
    const candidateText = toTrimmedString(text).toLowerCase();
    if (!candidateText) {
      return false;
    }

    const matched = SUSPICIOUS_KEYWORDS.filter((keyword) => candidateText.includes(keyword));
    return matched.length > 0;
  }

  function sanitizeDocumentHtml(rootElement) {
    if (!rootElement) {
      return "";
    }

    try {
      const clone = rootElement.cloneNode(true);
      clone.querySelectorAll("script, style, noscript").forEach((element) => element.remove());

      clone.querySelectorAll("input, textarea, select, button").forEach((field) => {
        if ("value" in field) {
          field.value = "";
        }
      });

      clone.querySelectorAll("*").forEach((element) => {
        Array.from(element.attributes).forEach((attribute) => {
          const attributeName = toTrimmedString(attribute.name).toLowerCase();
          if (!attributeName) {
            return;
          }

          if (attributeName.startsWith("on")) {
            element.removeAttribute(attribute.name);
          }

          if (attributeName === "src" || attributeName === "href") {
            const value = toTrimmedString(attribute.value);
            if (!value || value.startsWith("data:") || value.startsWith("javascript:")) {
              element.removeAttribute(attribute.name);
              return;
            }
            element.setAttribute(attribute.name, sanitizeUrlValue(value, true));
          }
        });
      });

      return truncateText(clone.outerHTML || "", SNAPSHOT_LIMITS.pageHtmlChars);
    } catch (_error) {
      return truncateText(toTrimmedString(rootElement.outerHTML), SNAPSHOT_LIMITS.pageHtmlChars);
    }
  }

  function sanitizeUrlValue(value, keepPath = false) {
    const raw = toTrimmedString(value);
    if (!raw) {
      return "";
    }

    if (raw.startsWith("javascript:") || raw.startsWith("data:")) {
      return "";
    }

    const [pathWithoutHash] = raw.split("#");
    const [pathWithoutQuery] = toTrimmedString(pathWithoutHash).split("?");
    const parsed = safeParseUrl(pathWithoutQuery);

    if (!parsed) {
      return "";
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }

    const pathname = parsed.pathname || "/";
    const hasPath = pathname && pathname !== "/";
    const sanitized = keepPath && hasPath ? `${parsed.origin}${pathname}` : parsed.origin;
    return truncateText(sanitized, 256);
  }

  function sanitizePageUrl(value) {
    return sanitizeUrlValue(value, true);
  }

  function truncateText(value, maxLength) {
    const text = toTrimmedString(value);
    return text.length > maxLength ? text.slice(0, maxLength) : text;
  }

  function buildLocaleVariants(language, payload = {}) {
    const variants = [];
    const add = (rawValue) => {
      const normalized = toTrimmedString(rawValue).toLowerCase();
      if (!normalized || variants.includes(normalized)) {
        return;
      }
      variants.push(normalized);
    };
    const addLocaleFamily = (rawLocale) => {
      const normalized = toTrimmedString(rawLocale).toLowerCase();
      if (!normalized) {
        return;
      }
      add(normalized);
      add(normalized.replace(/-/g, "_"));
      const base = normalized.split(/[-_]/)[0];
      add(base);
    };

    addLocaleFamily(language);
    addLocaleFamily(payload && payload.served_locale);
    addLocaleFamily(payload && payload.source_locale);
    add("en");

    return variants;
  }

  function pickLocalizedPayloadText(payload, analysis, baseKey, language) {
    const safePayload = payload && typeof payload === "object" ? payload : {};
    const safeAnalysis = analysis && typeof analysis === "object" ? analysis : {};
    const translations = safePayload.translations && typeof safePayload.translations === "object"
      ? safePayload.translations
      : {};
    const localeVariants = buildLocaleVariants(language, safePayload);

    const translationText = localeVariants
      .map((locale) => {
        const byExact = translations[locale];
        const byHyphen = translations[locale.replace(/_/g, "-")];
        const byUnderscore = translations[locale.replace(/-/g, "_")];
        const entry = byExact || byHyphen || byUnderscore;
        if (!entry || typeof entry !== "object") {
          return "";
        }
        return toTrimmedString(entry[baseKey]);
      })
      .find(Boolean);

    if (translationText) {
      return translationText;
    }

    const directCandidates = [
      safeAnalysis[baseKey],
      safePayload[baseKey]
    ];

    localeVariants.forEach((locale) => {
      const suffix = locale.replace(/-/g, "_");
      directCandidates.push(
        safeAnalysis[`${baseKey}_${suffix}`],
        safePayload[`${baseKey}_${suffix}`]
      );
    });

    return pickString(directCandidates);
  }

  function pickLocalizedPayloadArray(payload, analysis, baseKey, language) {
    const safePayload = payload && typeof payload === "object" ? payload : {};
    const safeAnalysis = analysis && typeof analysis === "object" ? analysis : {};
    const translations = safePayload.translations && typeof safePayload.translations === "object"
      ? safePayload.translations
      : {};
    const localeVariants = buildLocaleVariants(language, safePayload);

    const translationArray = localeVariants
      .map((locale) => {
        const byExact = translations[locale];
        const byHyphen = translations[locale.replace(/_/g, "-")];
        const byUnderscore = translations[locale.replace(/-/g, "_")];
        const entry = byExact || byHyphen || byUnderscore;
        if (!entry || typeof entry !== "object") {
          return [];
        }
        return normalizeReasons(entry[baseKey]);
      })
      .find((items) => Array.isArray(items) && items.length > 0);

    if (translationArray && translationArray.length > 0) {
      return translationArray;
    }

    const directCandidates = [
      safeAnalysis[baseKey],
      safePayload[baseKey]
    ];

    localeVariants.forEach((locale) => {
      const suffix = locale.replace(/-/g, "_");
      directCandidates.push(
        safeAnalysis[`${baseKey}_${suffix}`],
        safePayload[`${baseKey}_${suffix}`]
      );
    });

    const directArray = directCandidates
      .map((value) => normalizeReasons(value))
      .find((items) => Array.isArray(items) && items.length > 0);

    return directArray || [];
  }

  function normalizeAnalysisResponse(data, language, context = {}) {
    const payload = data && typeof data === "object" ? data : {};
    const analysis = payload.analysis && typeof payload.analysis === "object" ? payload.analysis : null;

    const purchaseContextDetected = inferPurchaseContext(payload, context.hasPurchaseContext);
    const declaredAdvice = getDeclaredAdviceValue(payload);
    const hasPurchaseOnlyAdvice = declaredAdvice === "avoid_purchase" || declaredAdvice === "verify_elsewhere";
    const includeActionAdviceInMainBlocks = !hasPurchaseOnlyAdvice;
    const advisedState = inferAdviceState(payload, purchaseContextDetected);
    const analysisId = pickString([
      analysis && analysis.analysis_id,
      payload.analysis_id,
      payload.analysisId,
      payload.id
    ]);
    const summary =
      pickString([
        pickLocalizedPayloadText(payload, analysis, "summary", language),
        payload.explanation,
        payload.message,
        payload.result && payload.result.summary,
        payload.summary && payload.summary.text
      ]);

    const reasons = dedupeArray(
      normalizeReasons(
        pickLocalizedPayloadArray(payload, analysis, "reasons", language)
      ),
      normalizeReasons(
        pickLocalizedPayloadArray(payload, analysis, "notable_signals", language)
      )
    );

    const overallAdviceText = pickString([
      pickLocalizedPayloadText(payload, analysis, "overall_advice_text", language),
      analysis && analysis.overallAdviceText,
      payload.overallAdviceText
    ]);

    const recommendedActionText = pickString([
      pickLocalizedPayloadText(payload, analysis, "recommended_action_text", language),
      payload.recommendedActionText
    ]);

    const summaryAdviceText = includeActionAdviceInMainBlocks
      ? pickString([
        overallAdviceText,
        recommendedActionText,
        analysis && analysis.traffic_light_reason,
        payload.traffic_light_reason
      ])
      : "";

    const localizedSummaryAdviceText = includeActionAdviceInMainBlocks
      ? pickLocalizedAdviceText(summaryAdviceText, language, declaredAdvice, false)
      : "";

    const safe = inferSafeFromPayload(payload, advisedState);
    const riskData = extractRiskScore(payload);
    const confidenceScore = extractConfidenceScore(payload);
    const responseStatus = pickString([payload.status]);
    const purchaseSafety = inferPurchaseSafetyState(payload, advisedState, riskData.score, confidenceScore, purchaseContextDetected);
    const purchaseSafetyText = pickString([
      pickLocalizedPayloadText(payload, analysis, "purchase_recommendation_text", language),
      pickLocalizedPayloadText(payload, analysis, "overall_advice_text", language),
      analysis && analysis.purchase_safety_text,
      payload.purchase_safety_text,
      analysis && analysis.traffic_light_reason,
      payload.traffic_light_reason,
      overallAdviceText,
      recommendedActionText
    ]);
    const purchaseAdviceLocalized = pickLocalizedAdviceText(purchaseSafetyText, language, declaredAdvice, true);
    const finalPurchaseSafetyMessage = toTrimmedString(purchaseAdviceLocalized) || getUiMessage(language, getPurchaseSafetyMessageKey(purchaseSafety));
    const fresh = typeof payload.fresh === "boolean" ? payload.fresh : null;
    const cacheHit = typeof payload.cache_hit === "boolean" ? payload.cache_hit : responseStatus === "hit";
    const analysisQuality = pickString([payload.analysis_quality]) || "valid";
    const createdAt = pickString([
      payload.created_at,
      analysis && analysis.created_at,
      payload.createdAt,
      analysis && analysis.createdAt,
      payload.updated_at,
      analysis && analysis.updated_at,
      payload.updatedAt,
      analysis && analysis.updatedAt
    ]);
    const expiresAt = numberOrNull(payload.expires_at);
    const canonicalUrl = pickString([
      payload.canonical_url,
      payload.canonicalUrl,
      parseCanonicalFromAnalysisId(analysisId),
      payload.page_url,
      payload.pageUrl
    ]);
    const feedbackCounts = normalizeFeedbackCounts(
      (analysis && analysis.feedback_counts) ||
      payload.feedback_counts ||
      {
        up: analysis && analysis.report_up_count,
        down: analysis && analysis.report_down_count,
        total: analysis && analysis.report_count
      }
    );
    const userFeedback = normalizeFeedbackVote(
      (analysis && analysis.user_feedback) ||
      (analysis && analysis.userFeedback) ||
      payload.user_feedback ||
      payload.userFeedback
    );

    const sanitizedSummary = (declaredAdvice === "avoid_purchase" || declaredAdvice === "verify_elsewhere")
      ? stripPurchaseSafetyFromSummary(summary)
      : summary;
    const normalizedSummary = toTrimmedString(localizeAnalysisText(sanitizedSummary, language, declaredAdvice)) || getUiMessage(language, "fallbackSummary");
    const normalizedAdviceText = toTrimmedString(localizedSummaryAdviceText);
    const finalSummary = (
      [
        normalizedAdviceText,
        normalizedSummary
      ].filter(Boolean).join("\n\n")
    ) || getUiMessage(language, "fallbackSummary");

    const title = advisedState === "safe"
      ? getUiMessage(language, "resultSafeTitle")
      : advisedState === "risk"
        ? getUiMessage(language, "resultRiskTitle")
        : advisedState === "caution"
          ? getUiMessage(language, "resultCautionTitle")
          : advisedState === "neutral"
            ? getUiMessage(language, "resultNeutralTitle")
            : advisedState === "unknown"
              ? getUiMessage(language, "resultUnknownTitle")
            : safe === true
              ? getUiMessage(language, "resultSafeTitle")
              : safe === false
                ? getUiMessage(language, "resultRiskTitle")
                : getUiMessage(language, "resultUnknownTitle");

    const normalizedRecommendedActionText = normalizeRecommendedActionText(
      includeActionAdviceInMainBlocks ? recommendedActionText : ""
    ).map((item) => localizeAnalysisText(item, language, declaredAdvice)).filter(Boolean);
    if (normalizedAdviceText && normalizedRecommendedActionText.length > 0) {
      const normalizedAdviceTextLower = normalizedAdviceText.toLowerCase();
      const dedupedActions = normalizedRecommendedActionText.filter(
        (item) => toTrimmedString(item).toLowerCase() !== normalizedAdviceTextLower
      );
      normalizedRecommendedActionText.length = 0;
      normalizedRecommendedActionText.push(...dedupedActions);
    }

    const localizedReasons = dedupeArray(
      reasons
        .map((reason) => localizeAnalysisText(reason, language, declaredAdvice))
        .filter(Boolean),
      []
    );

    return {
      analysisId,
      safe,
      advisedState,
      title,
      summary: finalSummary,
      reasons: localizedReasons.slice(0, 5),
      recommendedActionText: normalizedRecommendedActionText,
      hasPurchaseContext: purchaseContextDetected,
      purchaseSafety,
      purchaseSafetyMessage: finalPurchaseSafetyMessage,
      riskScore: riskData.score,
      riskSource: riskData.source,
      confidenceScore,
      status: responseStatus || "unknown",
      cacheHit,
      fresh,
      analysisQuality,
      createdAt,
      expiresAt,
      canonicalUrl,
      feedbackCounts,
      userFeedback
    };
  }

  function getDeclaredAdviceValue(payload) {
    const analysis = payload && typeof payload.analysis === "object" ? payload.analysis : null;
    return pickString([
      analysis && analysis.overall_advice,
      payload.overall_advice,
      analysis && analysis.traffic_light,
      payload.traffic_light,
      analysis && analysis.recommended_action,
      payload.recommended_action,
      payload.action
    ]).toLowerCase();
  }

  function inferAdviceState(payload, hasPurchaseContext = true) {
    const analysis = payload && typeof payload.analysis === "object" ? payload.analysis : null;
    const declaredAdvice = getDeclaredAdviceValue(payload);
    const purchaseOnlyAdvice = (declaredAdvice === "avoid_purchase" || declaredAdvice === "verify_elsewhere") && hasPurchaseContext;

    if (declaredAdvice === "safe_enough") {
      return "safe";
    }

    if (declaredAdvice === "caution") {
      return "caution";
    }

    if (declaredAdvice === "avoid_purchase") {
      return "risk";
    }

    if (declaredAdvice === "verify_elsewhere") {
      return "caution";
    }

    if (declaredAdvice === "insufficient_evidence") {
      return "neutral";
    }

    if (declaredAdvice === "neutral") {
      return "neutral";
    }

    if (declaredAdvice === "green") {
      return "safe";
    }

    if (declaredAdvice === "yellow" || declaredAdvice === "amber") {
      return "caution";
    }

    if (declaredAdvice === "red") {
      return "risk";
    }

    if (declaredAdvice === "gray") {
      return "neutral";
    }

    if (declaredAdvice === "allow" || declaredAdvice === "permitir" || declaredAdvice === "proceed") {
      return "safe";
    }

    if (
      declaredAdvice === "block" ||
      declaredAdvice === "deny" ||
      declaredAdvice === "reject" ||
      declaredAdvice === "alert"
    ) {
      return "risk";
    }

    const scores = analysis && analysis.scores && typeof analysis.scores === "object"
      ? analysis.scores
      : payload && payload.scores && typeof payload.scores === "object"
        ? payload.scores
        : null;

    if (scores) {
      const primaryRisk = normalizeRiskScore(scores.risk);
      const scamRisk = normalizeRiskScore(scores.scam_risk);
      const confidence = normalizeRiskScore(scores.confidence);
      const riskForDecisionRaw = primaryRisk !== null ? primaryRisk : scamRisk;
      const riskForDecision = applyConfidenceToRiskScore(riskForDecisionRaw, confidence);

      if (riskForDecision !== null) {
        if (purchaseOnlyAdvice && riskForDecision >= 5) {
          return "risk";
        }
        if (riskForDecision >= 7) {
          return "risk";
        }
        if (riskForDecision >= 4) {
          return "caution";
        }
        return "safe";
      }

      const riskKeys = [
        "manipulation_pressure_risk",
        "privacy_risk",
        "impersonation_risk",
        "manipulation_risk",
        "phishing_risk",
        "malware_risk",
        "risk",
        "danger_level"
      ];
      const normalizedValues = Object.entries(scores)
        .filter(([key]) => riskKeys.includes(key))
        .map(([, value]) => normalizeRiskScore(value))
        .filter((value) => value !== null)
        .map((value) => applyConfidenceToRiskScore(value, confidence));

      if (normalizedValues.length > 0) {
        const maxRisk = Math.max(...normalizedValues);
        if (purchaseOnlyAdvice && maxRisk >= 5) {
          return "risk";
        }
        if (maxRisk >= 7) {
          return "risk";
        }
        if (maxRisk >= 4) {
          return "caution";
        }
        return "safe";
      }
    }

    if (purchaseOnlyAdvice) {
      return "caution";
    }

    return "unknown";
  }

  function inferPurchaseContext(payload, fallbackHasPurchaseContext = false) {
    const analysis = payload && typeof payload.analysis === "object" ? payload.analysis : null;
    const explicit = pickBoolean([
      analysis && analysis.has_purchase_context,
      analysis && analysis.purchase_context,
      analysis && analysis.purchase_context_detected,
      analysis && analysis.is_purchase_context,
      payload && payload.has_purchase_context,
      payload && payload.purchase_context,
      payload && payload.purchase_context_detected,
      payload && payload.is_purchase_context
    ]);

    if (explicit !== null) {
      return explicit;
    }

    if (typeof fallbackHasPurchaseContext === "boolean") {
      return fallbackHasPurchaseContext;
    }

    return false;
  }

  function inferSafeFromPayload(payload, advisedState) {
    const analysis = payload && typeof payload.analysis === "object" ? payload.analysis : null;

    if (advisedState === "safe") {
      return true;
    }

    if (advisedState === "risk") {
      return false;
    }

    if (advisedState === "caution" || advisedState === "neutral") {
      return null;
    }

    const analysisSafe = pickBoolean([
      payload.safe,
      payload.is_safe,
      payload.result && payload.result.safe,
      payload.verdict && payload.verdict.safe,
      analysis && analysis.safe,
      analysis && analysis.is_safe
    ]);

    if (analysisSafe !== null) {
      return analysisSafe;
    }

    const scores = analysis && analysis.scores && typeof analysis.scores === "object"
      ? analysis.scores
      : payload && payload.scores && typeof payload.scores === "object"
        ? payload.scores
        : null;
    if (scores) {
      const primaryRisk = normalizeRiskScore(scores.risk);
      const scamRisk = normalizeRiskScore(scores.scam_risk);
      const confidence = normalizeRiskScore(scores.confidence);
      const riskForDecision = applyConfidenceToRiskScore(primaryRisk !== null ? primaryRisk : scamRisk, confidence);

      if (riskForDecision !== null) {
        if (riskForDecision >= 7) {
          return false;
        }

        if (riskForDecision <= 3) {
          return true;
        }

        return null;
      }

      const riskKeys = ["impersonation_risk", "manipulation_risk", "phishing_risk", "malware_risk", "risk", "danger_level"];
      const values = Object.entries(scores)
        .filter(([key]) => riskKeys.includes(key))
        .map(([, value]) => normalizeRiskScore(value))
        .filter((value) => Number.isFinite(value));
      const adjustedValues = values.map((value) => applyConfidenceToRiskScore(value, confidence));

      if (adjustedValues.length > 0) {
        const maxRisk = Math.max(...adjustedValues);

        if (maxRisk >= 7) {
          return false;
        }

        if (maxRisk <= 3) {
          return true;
        }
      }
    }

    return null;
  }

  function getPurchaseSafetyMessageKey(purchaseSafety) {
    if (purchaseSafety === "safe") {
      return "purchaseSafetySafe";
    }

    if (purchaseSafety === "caution") {
      return "purchaseSafetyCaution";
    }

    if (purchaseSafety === "risk") {
      return "purchaseSafetyRisk";
    }

    return "purchaseSafetyUnknown";
  }

  function inferPurchaseSafetyState(payload, advisedState, riskScore, confidenceScore, hasPurchaseContext = true) {
    if (!hasPurchaseContext) {
      return "unknown";
    }

    const analysis = payload && typeof payload.analysis === "object" ? payload.analysis : null;
    const declaredAdvice = pickString([
      analysis && analysis.overall_advice,
      payload.overall_advice,
      analysis && analysis.recommended_action,
      payload.recommended_action
    ]).toLowerCase();

    if (declaredAdvice === "safe_enough") {
      return "safe";
    }

    if (declaredAdvice === "avoid_purchase") {
      return "risk";
    }

    if (declaredAdvice === "caution") {
      return "caution";
    }

    if (declaredAdvice === "verify_elsewhere") {
      return "caution";
    }

    if (declaredAdvice === "insufficient_evidence") {
      return "unknown";
    }

    if (declaredAdvice === "green" || advisedState === "safe") {
      return "safe";
    }

    if (declaredAdvice === "yellow" || declaredAdvice === "amber" || advisedState === "caution") {
      return "caution";
    }

    if (declaredAdvice === "red" || advisedState === "risk") {
      return "risk";
    }

    if (riskScore === null || riskScore === undefined) {
      return "unknown";
    }

    const effectiveRisk = applyConfidenceToRiskScore(riskScore, confidenceScore);
    if (effectiveRisk === null) {
      return "unknown";
    }

    if (effectiveRisk >= 7) {
      return "risk";
    }

    if (effectiveRisk >= 4) {
      return "caution";
    }

    return "safe";
  }

  function renderPurchaseSafetySection(dom, analysis, language) {
    if (!analysis || analysis.hasPurchaseContext !== true) {
      dom.statusPurchaseSafetySection.classList.add("linksfairy-hidden");
      dom.statusPurchaseSafetyMessage.textContent = "";
      dom.statusPurchaseSafetyMessage.className = "linksfairy-purchase-safety-content";
      return;
    }

    const state = analysis && analysis.purchaseSafety
      ? analysis.purchaseSafety
      : "unknown";
    const message = toTrimmedString(analysis && analysis.purchaseSafetyMessage)
      || getUiMessage(language, getPurchaseSafetyMessageKey(state));

    dom.statusPurchaseSafetySection.classList.remove("linksfairy-hidden");

    const classes = [
      "linksfairy-purchase-safety-safe",
      "linksfairy-purchase-safety-caution",
      "linksfairy-purchase-safety-risk",
      "linksfairy-purchase-safety-unknown"
    ];
    classes.forEach((statusClass) => dom.statusPurchaseSafetyMessage.classList.remove(statusClass));
    dom.statusPurchaseSafetyMessage.classList.remove("linksfairy-purchase-safety-content");
    dom.statusPurchaseSafetyMessage.classList.add("linksfairy-purchase-safety-content");
    dom.statusPurchaseSafetyMessage.classList.add(`linksfairy-purchase-safety-${state}`);
    dom.statusPurchaseSafetyMessage.innerHTML = renderMarkdownBlock(message);
  }

  function getRecommendationText(advisedState, language) {
    const normalizedState = advisedState === "safe"
      ? "safe"
      : advisedState === "caution"
        ? "caution"
        : advisedState === "risk"
          ? "risk"
          : "unknown";

    if (normalizedState === "safe") {
      return getUiMessage(language, "recommendationSafe");
    }

    if (normalizedState === "caution") {
      return getUiMessage(language, "recommendationCaution");
    }

    if (normalizedState === "risk") {
      return getUiMessage(language, "recommendationRisk");
    }

    return getUiMessage(language, "recommendationUnknown");
  }

  function buildCacheLabelText(analysis) {
    const language = state.uiLanguage;
    const cacheType = analysis && analysis.cacheHit === true
      ? getUiMessage(language, "cacheCommunityLabel")
      : getUiMessage(language, "cacheFreshLabel");

    const ageText = analysis ? buildAgeText(analysis.createdAt, analysis.fresh, language) : "";
    return toTrimmedString([cacheType, ageText].filter(Boolean).join(" · ")) || getUiMessage(language, "cacheStatusUnknown");
  }

  function buildAgeText(createdAt, fresh, language) {
    const createdAtDate = createdAt ? new Date(createdAt) : null;
    if (!createdAtDate || Number.isNaN(createdAtDate.getTime())) {
      return "";
    }

    if (fresh === false) {
      return getUiMessage(language, "cacheStatusUnknown");
    }

    const now = Date.now();
    const seconds = Math.max(0, Math.floor((now - createdAtDate.getTime()) / 1000));
    const minutes = Math.max(0, Math.floor(seconds / 60));

    if (minutes < 1) {
      return getUiMessage(language, "cacheStatusNow");
    }

    return getUiMessage(language, "cacheStatusFresh").replace("{minutes}", String(minutes));
  }

  function normalizeReasons(value) {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value.map((item) => toTrimmedString(item)).filter(Boolean);
    }

    if (typeof value === "string") {
      return [value.trim()];
    }

    return [];
  }

  function dedupeArray(primaryItems, secondaryItems) {
    const primaryList = Array.isArray(primaryItems) ? primaryItems : [];
    const secondaryList = Array.isArray(secondaryItems) ? secondaryItems : [];

    const seen = new Set();
    const result = [];

    primaryList
      .concat(secondaryList)
      .forEach((item) => {
        const value = toTrimmedString(item);
        const key = value.toLowerCase();
        if (!value || seen.has(key)) {
          return;
        }

        seen.add(key);
        result.push(value);
      });

    return result;
  }

  function normalizeRecommendedActionText(value) {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value.map((item) => toTrimmedString(item)).filter(Boolean);
    }

    if (typeof value === "string") {
      const text = toTrimmedString(value);
      if (!text) {
        return [];
      }

      const parts = text
        .split(/\r?\n+/)
        .map((item) => toTrimmedString(item))
        .filter(Boolean);

      return parts.length > 0 ? parts : [text];
    }

    return [];
  }

  function renderRecommendedActions(dom, actionEntries) {
    dom.statusActions.innerHTML = "";

    if (!Array.isArray(actionEntries) || actionEntries.length === 0) {
      dom.statusActionsSection.classList.add("linksfairy-hidden");
      return;
    }

    dom.statusActionsSection.classList.remove("linksfairy-hidden");

    if (actionEntries.length === 1) {
      dom.statusActions.innerHTML = renderMarkdownBlock(actionEntries[0]);
      return;
    }

    const list = document.createElement("ul");
    list.className = "linksfairy-actions-list";

    actionEntries.forEach((entry) => {
      const li = document.createElement("li");
      li.innerHTML = renderInlineMarkdown(entry);
      list.appendChild(li);
    });

    dom.statusActions.appendChild(list);
  }

  function escapeHtml(value) {
    const text = toTrimmedString(value);
    if (!text) {
      return "";
    }

    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderInlineMarkdown(value) {
    return escapeHtml(value)
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]*)`/g, "<code>$1</code>");
  }

  function renderMarkdownBlock(value) {
    const source = toTrimmedString(value);
    if (!source) {
      return "";
    }

    const lines = source.replace(/\r\n/g, "\n").split("\n");
    let html = "";
    let listType = "";
    const closeList = () => {
      if (listType === "ul") {
        html += "</ul>";
      }

      if (listType === "ol") {
        html += "</ol>";
      }

      listType = "";
    };

    lines.forEach((line) => {
      const trimmed = toTrimmedString(line);

      if (!trimmed) {
        closeList();
        return;
      }

      const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (orderedMatch) {
        if (listType !== "ol") {
          closeList();
          html += "<ol>";
          listType = "ol";
        }

        html += `<li>${renderInlineMarkdown(orderedMatch[2])}</li>`;
        return;
      }

      const unorderedMatch = trimmed.match(/^[*\-+]\s+(.*)$/);
      if (unorderedMatch) {
        if (listType !== "ul") {
          closeList();
          html += "<ul>";
          listType = "ul";
        }

        html += `<li>${renderInlineMarkdown(unorderedMatch[1])}</li>`;
        return;
      }

      closeList();
      html += `<p>${renderInlineMarkdown(trimmed)}</p>`;
    });

    closeList();
    return html;
  }

  function extractRiskScore(payload) {
    const analysis = payload && typeof payload.analysis === "object" ? payload.analysis : null;
    const scoresSource = analysis && analysis.scores && typeof analysis.scores === "object"
      ? analysis.scores
      : payload && payload.scores && typeof payload.scores === "object"
        ? payload.scores
        : null;

    if (!scoresSource) {
      return { score: null, source: null };
    }

    const riskKeysPriority = [
      "risk",
      "scam_risk",
      "manipulation_pressure_risk",
      "privacy_risk",
      "impersonation_risk",
      "manipulation_risk",
      "phishing_risk",
      "malware_risk",
      "danger_level"
    ];

    for (const key of riskKeysPriority) {
      if (scoresSource[key] === undefined) {
        continue;
      }

      const normalized = normalizeRiskScore(scoresSource[key]);
      if (normalized !== null) {
        return {
          score: normalized,
          source: `analysis.scores.${key}`
        };
      }
    }

    const normalizedValues = Object.entries(scoresSource)
      .filter(([key, value]) => {
        if (riskKeysPriority.includes(key)) {
          return true;
        }

        return false;
      })
      .map(([, value]) => normalizeRiskScore(value))
      .filter((value) => value !== null);

    if (normalizedValues.length === 0) {
      return { score: null, source: null };
    }

    return {
      score: Math.max(...normalizedValues),
      source: "analysis.scores"
    };
  }

  function applyConfidenceToRiskScore(riskScore, confidenceScore) {
    if (typeof riskScore !== "number" || Number.isNaN(riskScore)) {
      return null;
    }

    const normalizedRisk = clampScore(riskScore);
    if (typeof confidenceScore !== "number" || Number.isNaN(confidenceScore)) {
      return normalizedRisk;
    }

    const confidence = clampScore(confidenceScore);
    const confidencePenalty = (10 - confidence) * 0.25;
    return clampScore(normalizedRisk + confidencePenalty);
  }

  function clampScore(value) {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return NaN;
    }

    return Math.min(Math.max(value, 0), 10);
  }

  function normalizeRiskScore(value) {
    const number = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(number)) {
      return null;
    }

    if (number >= 0 && number < 1) {
      return number * 10;
    }

    if (number >= 1 && number <= 10) {
      return number;
    }

    if (number > 10 && number <= 100) {
      return number / 10;
    }

    return null;
  }

  function extractConfidenceScore(payload) {
    const analysis = payload && typeof payload.analysis === "object" ? payload.analysis : null;
    const scoresSource = analysis && analysis.scores && typeof analysis.scores === "object"
      ? analysis.scores
      : payload && payload.scores && typeof payload.scores === "object"
        ? payload.scores
        : null;

    if (!scoresSource) {
      return null;
    }

    const normalized = normalizeRiskScore(scoresSource.confidence);
    return normalized === null ? null : Math.round(normalized);
  }

  function parseCanonicalFromAnalysisId(analysisId) {
    const raw = toTrimmedString(analysisId);
    if (!raw) {
      return "";
    }

    const parts = raw.split("|");
    if (parts.length < 3) {
      return "";
    }

    return sanitizePageUrl(parts[0]);
  }

  function mapAnalysisError(message, language) {
    const raw = toTrimmedString(message);
    if (!raw) {
      return getUiMessage(language, "errorUnexpected");
    }

    const normalized = raw
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (
      normalized.includes("timeout") ||
      normalized.includes("timed out") ||
      normalized.includes("tiempo de espera")
    ) {
      return getUiMessage(language, "errorTimeout");
    }

    if (
      normalized.includes("failed to fetch") ||
      normalized.includes("network") ||
      normalized.includes("conexion")
    ) {
      return getUiMessage(language, "errorNetwork");
    }

    if (normalized.includes("invalid json") || normalized.includes("response") && normalized.includes("json")) {
      return getUiMessage(language, "errorParse");
    }

    if (normalized.includes("api key") && normalized.includes("mistral")) {
      return getUiMessage(language, "errorApiKeyRejected");
    }

    if (
      normalized.includes("receiving end does not exist") ||
      normalized.includes("could not establish connection") ||
      normalized.includes("cannot access contents of url") ||
      normalized.includes("extensions::") ||
      normalized.includes("no tab with id")
    ) {
      return getUiMessage(language, "errorAnalysisFailed");
    }

    if (
      normalized.includes("no se pudo analizar la web") ||
      normalized.includes("could not analyze") ||
      normalized.includes("analysis failed")
    ) {
      return getUiMessage(language, "errorAnalysisFailed");
    }

    if (/http\s*4\d\d/.test(normalized)) {
      return getUiMessage(language, "errorBackend4xx");
    }

    if (/http\s*5\d\d/.test(normalized)) {
      return getUiMessage(language, "errorBackend5xx");
    }

    // Show backend/user-friendly messages when available; keep technical traces hidden.
    if (
      raw.length <= 180 &&
      !/(typeerror|referenceerror|syntaxerror|at\s+\S+\s+\(|chrome-extension|<anonymous>|stack)/i.test(raw)
    ) {
      return raw;
    }

    return getUiMessage(language, "errorAnalysisFailed");
  }

  function setRiskPointerPosition(dom, position) {
    if (!dom || !dom.statusRiskPointer) {
      return;
    }

    const normalized = clampPercentage(position);
    const safePosition = clampPercentage(normalized, 4.5, 95.5);
    dom.statusRiskPointer.style.left = `${safePosition}%`;
  }

  function clampPercentage(value, min = 0, max = 100) {
    const number = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(number)) {
      return 50;
    }

    if (number < min) {
      return min;
    }

    if (number > max) {
      return max;
    }

    return number;
  }

  function pickBoolean(candidates) {
    for (const candidate of candidates) {
      if (typeof candidate === "boolean") {
        return candidate;
      }
    }

    return null;
  }

  function pickString(candidates) {
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }

    return "";
  }

  function svgToDataUri(svg) {
    const compact = toTrimmedString(svg).replace(/\s{2,}/g, " ");
    return `data:image/svg+xml;utf8,${encodeURIComponent(compact)}`;
  }

  function pickLocalizedAdviceText(rawText, language, declaredAdvice = "", forceAdviceFallback = false) {
    const normalizedAdvice = toTrimmedString(declaredAdvice).toLowerCase();
    const translatedAdvice = toTrimmedString(rawText);
    if (translatedAdvice) {
      return translatedAdvice;
    }

    if (!forceAdviceFallback) {
      return "";
    }

    if (!normalizedAdvice) {
      return "";
    }

    if (normalizedAdvice === "avoid_purchase") {
      return getUiMessage(language, "purchaseSafetyRisk");
    }

    if (normalizedAdvice === "verify_elsewhere") {
      return getUiMessage(language, "purchaseSafetyCaution");
    }

    return translatedAdvice;
  }

  function localizeAnalysisText(rawText, language, declaredAdvice = "") {
    const text = toTrimmedString(rawText);
    if (!text) {
      return "";
    }

    const normalizedLanguage = toTrimmedString(language).toLowerCase();
    if (!normalizedLanguage.startsWith("es")) {
      return text;
    }

    let localized = text;

    // Remove English guardrail prefix if a Spanish variant is present in the same sentence.
    localized = localized.replace(
      /\*\*Purchase safety guardrail:\*\*[\s\S]*?(?=\*\*Protecci[oó]n de compra:\*\*|$)/gi,
      ""
    );
    localized = localized.replace(
      /Purchase safety guardrail:[\s\S]*?(?=Protecci[oó]n de compra:|$)/gi,
      ""
    );

    const replacements = [
      [/Avoid buying or sharing credentials until the site is verified\.?/gi, getUiMessage("es", "purchaseSafetyRisk")],
      [/No visible contact details\.?/gi, "No hay detalles de contacto visibles."],
      [/No legal information\.?/gi, "No hay informacion legal visible."],
      [/No return policies\.?/gi, "No hay politicas de devolucion visibles."],
      [/Lack of customer reviews\.?/gi, "Falta de resenas de clientes verificables."],
      [/The page has a clear description of services and professional background\.?/gi, "La pagina tiene una descripcion clara de servicios y trayectoria profesional."],
      [/The contact form submits to an AWS Lambda URL(?:[^.]*\.)?/gi, "El formulario de contacto envía datos a un endpoint externo; revisa eso antes de meter información personal."],
      [/This page has a clear description of services and professional background\.?/gi, "La pagina tiene una descripcion clara de servicios y trayectoria profesional."],
      [/This page clearly describes its services and professional background\.?/gi, "La pagina describe servicios y experiencia de forma clara."],
      [/Warning about fraudulent websites\.?/gi, "Hay un aviso de sitios fraudulentos."],
      [/This site appears to be a legitimate e-commerce website that sells shoes and clothing\.?/gi, "Este sitio parece un comercio electrónico legítimo de calzado y ropa."],
      [/Purchase safety guardrail:\s*confidence\/trust signals are not strong enough for a safe-buy recommendation\.?/gi, "Proteccion de compra: la confianza detectada no es suficiente para recomendar una compra segura."],
      [/Purchase safety guardrail:\s*risk signals are above strict shopping-safe thresholds\.?/gi, "Proteccion de compra: hay señales de riesgo para comprar con tranquilidad."],
      [/Purchase safety guardrail:\s*the page contains high-risk sales wording(?:[^.]*\.)?/gi, "Proteccion de compra: hay señales de venta demasiado agresivas o poco claras."],
      [/The contact form does not offer explicit alternatives or support contacts\.?/gi, "El formulario de contacto no muestra opciones claras para soporte o alternativas."]
    ];

    replacements.forEach(([pattern, replacement]) => {
      localized = localized.replace(pattern, replacement);
    });

    if (toTrimmedString(declaredAdvice).toLowerCase() === "avoid_purchase") {
      localized = localized.replace(
        /Avoid buying or sharing credentials until the site is verified\.?/gi,
        getUiMessage("es", "purchaseSafetyRisk")
      );
    }

    localized = localized
      .replace(/\s{2,}/g, " ")
      .replace(/\s+\./g, ".")
      .trim();

    if (containsLikelyEnglishText(localized)) {
      const fallback = getSpanishFallbackByAdvice(declaredAdvice);
      return fallback || getUiMessage("es", "fallbackSummary");
    }

    return localized;
  }

  function containsLikelyEnglishText(text) {
    const cleaned = toTrimmedString(text).toLowerCase();
    if (!cleaned) {
      return false;
    }

    const tokens = cleaned.match(/\b[a-z]{3,}\b/g) || [];
    if (!tokens.length) {
      return false;
    }

    const englishMarkers = [
      "the",
      "and",
      "this",
      "that",
      "with",
      "for",
      "your",
      "you",
      "they",
      "is",
      "are",
      "safe",
      "risk",
      "purchase",
      "buy",
      "page",
      "website",
      "contact",
      "form",
      "checkout",
      "support",
      "credentials",
      "policy"
    ];
    let markerHits = 0;
    for (const token of tokens) {
      if (englishMarkers.includes(token)) {
        markerHits += 1;
      }
    }

    return markerHits >= 4;
  }

  function getSpanishFallbackByAdvice(advice) {
    const normalizedAdvice = toTrimmedString(advice).toLowerCase();
    if (normalizedAdvice === "avoid_purchase") {
      return getUiMessage("es", "purchaseSafetyRisk");
    }

    if (normalizedAdvice === "verify_elsewhere") {
      return getUiMessage("es", "purchaseSafetyCaution");
    }

    if (normalizedAdvice === "caution") {
      return getUiMessage("es", "recommendationCaution");
    }

    if (normalizedAdvice === "safe_enough") {
      return getUiMessage("es", "recommendationSafe");
    }

    return getUiMessage("es", "recommendationUnknown");
  }

  function stripPurchaseSafetyFromSummary(rawText) {
    let text = toTrimmedString(rawText);
    if (!text) {
      return "";
    }

    text = text
      .replace(/\*\*Purchase safety guardrail:\*\*[\s\S]*?(?=\*\*[^*]+\*\*|$)/gi, "")
      .replace(/Purchase safety guardrail:\s*[^.!?]*[.!]?/gi, "")
      .replace(/\*\*(?:Valla de seguridad de compra|Protecci[oó]n de compra|Proteccion de compra|Purchase safety)\s*:\*\*[\s\S]*?(?:[.!?]|$)/gi, "")
      .replace(/Avoid buying or sharing credentials until the site is verified\.?/gi, "")
      .replace(/The contact form submits to an AWS Lambda URL(?:[^.]*\.)?/gi, "")
      .replace(/This page (?:has|is|is not)[^.!?]*not clearly safe for buying\.?/gi, "")
      .replace(/The page is not clearly safe for buying[^.!?]*\./gi, "")
      .replace(/No se recomienda comprar en esta web por ahora\.?/gi, "")
      .replace(/No es seguro para comprar[^.!?]*\./gi, "")
      .replace(/no est[aá] claramente seguro para comprar\.?/gi, "")
      .replace(/\s{2,}/g, " ")
      .replace(/(^[,\.\-;\:\s]+|[,\.\-;\:\s]+$)/g, "")
      .trim();

    if (!text) {
      return "";
    }

    const duplicatedPatterns = [
      /\*\*[^*]*Compra\s*[^*]*\*\*/gi,
      /\*\*[^*]*Purchase[^*]*\*\*/gi
    ];

    duplicatedPatterns.forEach((pattern) => {
      text = text.replace(pattern, "").trim();
    });

    return text.replace(/\s{2,}/g, " ").trim();
  }

  function sendRuntimeMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, error: chrome.runtime.lastError.message });
          return;
        }

        resolve(response || { ok: false, error: "Respuesta vacia del runtime." });
      });
    });
  }

  function setStorageValues(values) {
    return new Promise((resolve) => {
      chrome.storage.local.set(values, resolve);
    });
  }

  function hydrateAutoRejectSetting(localState) {
    return new Promise((resolve) => {
      chrome.storage.local.get(
        {
          [STORAGE_KEYS.autoRejectCookies]: false
        },
        (values) => {
          localState.autoRejectCookies = values[STORAGE_KEYS.autoRejectCookies] === true;
          resolve();
        }
      );
    });
  }

  function hydrateUiLanguageSetting(localState) {
    return new Promise((resolve) => {
      chrome.storage.local.get(
        {
          [STORAGE_KEYS.uiLanguage]: "auto"
        },
        (values) => {
          localState.uiLanguagePreference = normalizeUiLanguagePreference(values[STORAGE_KEYS.uiLanguage]);
          localState.uiLanguage = resolveUiLanguage(localState.uiLanguagePreference);
          resolve();
        }
      );
    });
  }

  function hydrateAdvancedFeedbackMode(localState) {
    return new Promise((resolve) => {
      chrome.storage.local.get(
        {
          [STORAGE_KEYS.advancedFeedbackMode]: false
        },
        (values) => {
          const rawValue = values[STORAGE_KEYS.advancedFeedbackMode];
          localState.advancedFeedbackMode = rawValue === true;
          resolve();
        }
      );
    });
  }

  function clearLegacyFeedbackStorage() {
    return new Promise((resolve) => {
      chrome.storage.local.remove(LEGACY_STORAGE_KEYS, () => {
        resolve();
      });
    });
  }

  function clearReasons(container) {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    return "unknown";
  }

  function toTrimmedString(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  async function getClientContext() {
    return {
      language: toTrimmedString(navigator && (navigator.language || navigator.userLanguage)),
      document_language: toTrimmedString(document && document.documentElement && document.documentElement.lang),
      page_protocol: toTrimmedString(window && window.location && window.location.protocol),
      is_secure: (window && window.location && window.location.protocol) === "https:"
    };
  }

  function numberOrNull(value) {
    const number = typeof value === "number" && Number.isFinite(value) ? value : Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function hydrateClientInstallId(localState) {
    return new Promise((resolve) => {
      chrome.storage.local.get(
        {
          [STORAGE_KEYS.clientInstallId]: "",
          [STORAGE_KEYS.clientInstallCreatedAt]: ""
        },
        async (values) => {
          const existingId = toTrimmedString(values[STORAGE_KEYS.clientInstallId]);

          if (existingId) {
            localState.clientInstallId = existingId;
            resolve();
            return;
          }

          const generatedId = generateInstallId();
          localState.clientInstallId = generatedId;

          await setStorageValues({
            [STORAGE_KEYS.clientInstallId]: generatedId,
            [STORAGE_KEYS.clientInstallCreatedAt]: new Date().toISOString()
          });

          resolve();
        }
      );
    });
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
})();
