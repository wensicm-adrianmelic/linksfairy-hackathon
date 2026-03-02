from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
import re
from decimal import Decimal
from typing import Any, Dict, List, Tuple

import boto3
from botocore.exceptions import ClientError

from shared.canonicalize import canonicalize_url, compute_content_hash
from shared.dynamodb import (
    build_analysis_sk,
    query_analyses_for_hash,
    query_report_reason_counts_for_analysis,
    locale_variants,
    normalize_locale,
    iso_now,
    now_epoch,
    serialize_decimal,
)
from shared.validation import (
    ValidationError,
    validate_lookup_request,
)

MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"
MISTRAL_MAX_RETRIES = 2
RECOMMENDED_ACTIONS = {
    "safe_enough",
    "caution",
    "avoid_purchase",
    "verify_elsewhere",
    "insufficient_evidence",
}
RECOMMENDED_ACTION_TEXT_FALLBACK = {
    "safe_enough": (
        "This page looks fine. Keep your usual security habits and stay "
        "alert."
    ),
    "caution": "Take a breath and review this page one more time.",
    "avoid_purchase": (
        "Do not buy or share passwords or payment details until you prove this "
        "site is real."
    ),
    "verify_elsewhere": (
        "Check the same store on its official site before trusting this one."
    ),
    "insufficient_evidence": (
        "There is not enough proof yet. Confirm with another trusted source."
    ),
}
RECOMMENDED_ACTION_TEXT_FALLBACK_LOCALIZED = {
    "es": {
        "safe_enough": "Esto parece tranquilo. Puedes seguir con prudencia.",
        "caution": "Antes de seguir, revisa este punto con calma.",
        "avoid_purchase": (
            "No compres ni des datos sensibles hasta confirmar que esta web es real."
        ),
        "verify_elsewhere": (
            "Busca esta tienda en su web oficial y compárala antes de pagar."
        ),
        "insufficient_evidence": (
            "Aún no hay pruebas claras. Comprueba otra fuente antes de confiar."
        ),
    },
}
OVERALL_ADVICE_TEXT_FALLBACK_LOCALIZED = {
    "es": {
        "safe_enough": (
            "Todo parece correcto y sin señales raras."
        ),
        "caution": (
            "No está claro. Mira esta página despacio antes de seguir."
        ),
        "avoid_purchase": (
            "No compres ni compartas datos aquí hasta verificar que es real."
        ),
        "verify_elsewhere": (
            "Mira la web oficial de esta tienda antes de continuar."
        ),
        "insufficient_evidence": (
            "Aún no hay pruebas suficientes. Comprueba en otra fuente."
        ),
    },
    "en": {
        "safe_enough": "This looks low risk. Keep normal security habits.",
        "caution": "Be careful and review the page before using it.",
        "avoid_purchase": "Avoid buying or sharing sensitive data here.",
        "verify_elsewhere": "Check this site from an official source first.",
        "insufficient_evidence": (
            "Not enough evidence yet. Verify from trusted sources."
        ),
    },
}

FEEDBACK_ALLOWED = {"up", "down"}
NEGATIVE_REPORT_REASONS = {
    "incorrect_result",
    "false_positive",
    "false_negative",
    "unsafe_not_detected",
    "wrong_justification",
}


_API_KEY_CACHE: Dict[str, str] = {}
PURCHASE_CONTEXT_KEYWORDS_STRONG = (
    "buy now",
    "add to cart",
    "checkout",
    "shop now",
    "order now",
    "finalize purchase",
    "finalizar compra",
    "comprar",
    "anadir al carrito",
    "agregar al carrito",
    "carrito",
    "pago seguro",
    "secure payment",
    "secure checkout",
    "tienda online",
)
PURCHASE_CONTEXT_KEYWORDS_WEAK = (
    "purchase",
    "shipping",
    "free shipping",
    "producto",
    "productos",
    "precio",
    "precios",
    "discount",
    "descuento",
)
PURCHASE_CONTEXT_ANCHOR_KEYWORDS = (
    "buy",
    "buying",
    "comprar",
    "compra",
    "carrito",
    "checkout",
    "pagar",
    "pago",
    "pay",
    "payment",
    "order",
    "pedido",
    "shop",
    "tienda",
)
PURCHASE_ACTION_HINTS = (
    "checkout",
    "cart",
    "payment",
    "pay",
    "order",
    "shop",
    "tienda",
    "carrito",
    "pago",
    "comprar",
)
PURCHASE_TRUST_SIGNAL_GROUPS = (
    (
        "about us",
        "about",
        "sobre nosotros",
        "quienes somos",
        "empresa",
        "company",
        "merchant",
    ),
    (
        "terms",
        "privacy",
        "cookies",
        "refund",
        "returns",
        "shipping policy",
        "return policy",
        "terms of service",
        "politica de privacidad",
        "politica de cookies",
        "politica de devoluciones",
        "aviso legal",
        "terminos y condiciones",
    ),
    (
        "contact",
        "contacto",
        "support",
        "soporte",
        "telefono",
        "phone",
        "address",
        "direccion",
        "email",
        "correo",
    ),
    (
        "secure checkout",
        "secure payment",
        "pago seguro",
        "ssl",
        "https",
        "paypal",
        "stripe",
        "visa",
        "mastercard",
    ),
)
HIGH_RISK_PURCHASE_TERMS = (
    " demo ",
    "demo",
    "demostracion",
    "landing",
    "landing page",
    "showroom",
    "show case",
    "muestra",
    "muestra y venta",
    "sitio demo",
    "sitio de prueba",
    "storefront",
    "site clone",
    "page template",
    "plantilla",
    "replica",
    "counterfeit",
    "fake",
    "imitacion",
    "suplantacion",
    "suplantación",
    "fake site",
    "fake storefront",
    "100% discount",
    "90% off",
    "80% off",
    "liquidacion",
    "solo hoy",
    "limited time",
    "only today",
    "urgent",
)


def _has_strictly_ecommerce_terms(text_blob: str) -> bool:
    if not text_blob:
        return False

    return any(
        token in text_blob
        for token in (
            "tienda online",
            "tienda",
            "carrito",
            "checkout",
            "pagar",
            "pago",
            "checkout",
            "add to cart",
            "finalize purchase",
            "finalizar compra",
            "agregar al carrito",
            "comprar",
        )
    )


def _trim_text(value: Any, max_length: int = 1400) -> str:
    if not isinstance(value, str):
        return ""
    value = value.strip()
    if len(value) <= max_length:
        return value
    return value[:max_length]


def _normalize_text_for_match(value: Any) -> str:
    if not isinstance(value, str):
        return ""
    normalized = value.lower().strip()
    if not normalized:
        return ""
    replacements = (
        ("á", "a"),
        ("é", "e"),
        ("í", "i"),
        ("ó", "o"),
        ("ú", "u"),
        ("ü", "u"),
        ("ñ", "n"),
    )
    for source, target in replacements:
        normalized = normalized.replace(source, target)
    return normalized


def _snapshot_text_blob(snapshot: Dict[str, Any]) -> str:
    chunks: List[str] = []
    for key in ("visible_text", "meta_description", "meta_keywords", "canonical_tag"):
        text_value = _normalize_text_for_match(snapshot.get(key))
        if text_value:
            chunks.append(text_value)

    headings = snapshot.get("headings")
    if isinstance(headings, dict):
        for heading_key in ("h1", "h2", "h3"):
            values = headings.get(heading_key)
            if isinstance(values, list):
                for value in values:
                    text_value = _normalize_text_for_match(value)
                    if text_value:
                        chunks.append(text_value)
    return " ".join(chunks)


def _blob_indicates_purchase_context(text_blob: str) -> bool:
    if not text_blob:
        return False
    if _blob_has_high_risk_purchase_terms(text_blob):
        return True
    if any(
        keyword in text_blob for keyword in PURCHASE_CONTEXT_KEYWORDS_STRONG
    ):
        return True

    weak_matches = 0
    for keyword in PURCHASE_CONTEXT_KEYWORDS_WEAK:
        if keyword in text_blob:
            weak_matches += 1
            if weak_matches >= 2:
                break

    has_anchor = any(
        keyword in text_blob for keyword in PURCHASE_CONTEXT_ANCHOR_KEYWORDS
    )
    if weak_matches >= 2 and has_anchor:
        return True

    return False


def _count_purchase_trust_signals_from_blob(
    canonical_url: str, text_blob: str
) -> int:
    score = 0
    normalized_url = _normalize_text_for_match(canonical_url)
    if normalized_url.startswith("https://"):
        score += 1
    for signal_group in PURCHASE_TRUST_SIGNAL_GROUPS:
        if any(keyword in text_blob for keyword in signal_group):
            score += 1
    return score


def _blob_has_high_risk_purchase_terms(text_blob: str) -> bool:
    if not text_blob:
        return False
    return any(term in text_blob for term in HIGH_RISK_PURCHASE_TERMS)


def _snapshot_indicates_purchase_context(snapshot: Dict[str, Any]) -> bool:
    text_blob = _snapshot_text_blob(snapshot)
    if _blob_indicates_purchase_context(text_blob):
        return True

    forms = snapshot.get("forms")
    if isinstance(forms, dict):
        action_targets = forms.get("action_targets", [])
        if isinstance(action_targets, list):
            for action_target in action_targets:
                normalized_target = _normalize_text_for_match(action_target)
                if any(
                    hint in normalized_target
                    for hint in PURCHASE_ACTION_HINTS
                ):
                    return True
    return False


def _count_purchase_trust_signals(
    canonical_url: str, snapshot: Dict[str, Any]
) -> int:
    text_blob = _snapshot_text_blob(snapshot)
    return _count_purchase_trust_signals_from_blob(canonical_url, text_blob)


def _snapshot_has_high_risk_purchase_terms(snapshot: Dict[str, Any]) -> bool:
    text_blob = _snapshot_text_blob(snapshot)
    return _blob_has_high_risk_purchase_terms(text_blob)


def _analysis_text_blob(
    summary: Any, reasons: Any, notable_signals: Any
) -> str:
    chunks: List[str] = []
    normalized_summary = _normalize_text_for_match(summary)
    if normalized_summary:
        chunks.append(normalized_summary)

    if isinstance(reasons, list):
        for reason in reasons:
            normalized_reason = _normalize_text_for_match(reason)
            if normalized_reason:
                chunks.append(normalized_reason)

    if isinstance(notable_signals, list):
        for signal in notable_signals:
            normalized_signal = _normalize_text_for_match(signal)
            if normalized_signal:
                chunks.append(normalized_signal)

    return " ".join(chunks)


def _resolve_feedback_counts_from_report_history(
    table,
    item: Dict[str, Any],
    include_client_install_id: bool = False,
    include_sk: bool = False,
) -> Optional[Tuple[int, int, int]]:
    canonical_url = item.get("canonical_url")
    analysis_id = item.get("analysis_id")
    analysis_version = item.get("analysis_version")

    if (
        not isinstance(canonical_url, str)
        or not canonical_url
        or not isinstance(analysis_id, str)
        or not analysis_id
        or not isinstance(analysis_version, str)
        or not analysis_version
    ):
        return None

    report_items = query_report_reason_counts_for_analysis(
        table,
        canonical_url=canonical_url,
        analysis_version=analysis_version,
        analysis_id=analysis_id,
        include_client_install_id=include_client_install_id,
        include_sk=include_sk,
    )
    if not report_items:
        return None

    latest_vote_per_client: Dict[str, str] = {}
    latest_vote_key_per_client: Dict[str, str] = {}

    def sort_tuple(sort_key: str) -> tuple[int, str]:
        parts = sort_key.split("#")
        if len(parts) >= 3:
            try:
                return (int(parts[2]), sort_key)
            except ValueError:
                return (0, sort_key)
        return (0, sort_key)

    report_count = 0
    for report_item in report_items:
        sort_key = _trim_text(report_item.get("SK"))

        feedback = str(report_item.get("feedback", "")).strip().lower()
        if feedback == "up":
            vote = "up"
        elif feedback == "down":
            vote = "down"
        else:
            reason = str(report_item.get("reason", "")).strip().lower()
            if reason == "other":
                vote = "up"
            elif reason in NEGATIVE_REPORT_REASONS:
                vote = "down"
            else:
                report_count += 1
                continue

        client_key = _trim_text(report_item.get("client_install_id"))
        if not client_key:
            client_key = f":legacy:{sort_key or str(report_count)}"
        if (client_key not in latest_vote_key_per_client) or (
            sort_tuple(sort_key or str(report_count))
            > sort_tuple(latest_vote_key_per_client.get(client_key, ""))
        ):
            latest_vote_per_client[client_key] = vote
            latest_vote_key_per_client[client_key] = sort_key or str(report_count)

        report_count += 1

    up_votes = 0
    down_votes = 0
    for vote in latest_vote_per_client.values():
        if vote == "up":
            up_votes += 1
        elif vote == "down":
            down_votes += 1

    if up_votes == 0 and down_votes == 0:
        return None

    return (up_votes, down_votes, up_votes + down_votes)


def _resolve_latest_user_feedback(
    table,
    analysis_item: Dict[str, Any],
    client_install_id: str,
) -> str:
    canonical_url = _trim_text(analysis_item.get("canonical_url"))
    analysis_id = _trim_text(analysis_item.get("analysis_id"))
    analysis_version = _trim_text(analysis_item.get("analysis_version"))

    if (
        not canonical_url
        or not analysis_id
        or not analysis_version
        or not client_install_id
    ):
        return ""

    report_items = query_report_reason_counts_for_analysis(
        table,
        canonical_url=canonical_url,
        analysis_version=analysis_version,
        analysis_id=analysis_id,
        client_install_id=client_install_id,
        scan_desc=True,
        include_sk=True,
    )
    if not report_items:
        return ""

    for report_item in report_items:
        raw_feedback = _trim_text(report_item.get("feedback")).lower()
        if raw_feedback in FEEDBACK_ALLOWED:
            return raw_feedback

        reason = _trim_text(report_item.get("reason")).lower()
        if reason == "other":
            return "up"
        if reason in NEGATIVE_REPORT_REASONS:
            return "down"

    return ""


def _append_guardrail_reason(
    analysis_payload: Dict[str, Any], reason_text: str
) -> None:
    reasons = analysis_payload.get("reasons_en")
    if not isinstance(reasons, list):
        reasons = []
    normalized_reasons: List[str] = []
    for reason in reasons:
        if isinstance(reason, str):
            clean_reason = reason.strip()
            if clean_reason:
                normalized_reasons.append(clean_reason)
    if reason_text not in normalized_reasons:
        normalized_reasons.insert(0, reason_text)
    analysis_payload["reasons_en"] = normalized_reasons[:5]


def _set_guardrail_advice(
    analysis_payload: Dict[str, Any], advice: str
) -> None:
    fallback_text = RECOMMENDED_ACTION_TEXT_FALLBACK.get(
        advice,
        RECOMMENDED_ACTION_TEXT_FALLBACK["insufficient_evidence"],
    )
    analysis_payload["recommended_action"] = advice
    analysis_payload["overall_advice"] = advice
    analysis_payload["recommended_action_text_en"] = fallback_text
    analysis_payload["overall_advice_text_en"] = fallback_text
    analysis_payload["recommended_action_text_localized"] = None
    analysis_payload["overall_advice_text"] = None


def _prefix_guardrail_summary(
    analysis_payload: Dict[str, Any], prefix_text: str
) -> None:
    summary = analysis_payload.get("summary_en")
    if not isinstance(summary, str):
        return
    cleaned_prefix = prefix_text.strip()
    cleaned_summary = summary.strip()
    if not cleaned_prefix or not cleaned_summary:
        return
    lower_summary = cleaned_summary.lower()
    lower_prefix = cleaned_prefix.lower()
    if lower_summary.startswith(lower_prefix):
        return
    analysis_payload["summary_en"] = _trim_text(
        f"{cleaned_prefix} {cleaned_summary}", max_length=4000
    )


def _apply_purchase_safety_guardrails(
    canonical_url: str,
    snapshot: Dict[str, Any],
    analysis_payload: Dict[str, Any],
) -> None:
    if not _snapshot_indicates_purchase_context(snapshot):
        return

    scores = analysis_payload.get("scores", {})
    risk = _coerce_score(scores.get("scam_risk"))
    if risk is None:
        risk = _coerce_score(scores.get("risk"))
    manipulation_risk = _coerce_score(
        scores.get("manipulation_pressure_risk")
    )
    privacy_risk = _coerce_score(scores.get("privacy_risk"))
    confidence = _coerce_score(scores.get("confidence"))

    risk = 5 if risk is None else risk
    manipulation_risk = 0 if manipulation_risk is None else manipulation_risk
    privacy_risk = 0 if privacy_risk is None else privacy_risk
    confidence = 5 if confidence is None else confidence

    trust_signals = _count_purchase_trust_signals(canonical_url, snapshot)
    has_high_risk_terms = _snapshot_has_high_risk_purchase_terms(snapshot)

    if has_high_risk_terms:
        _set_guardrail_advice(analysis_payload, "avoid_purchase")
        _prefix_guardrail_summary(
            analysis_payload,
            "**Purchase safety guardrail:** this page is not clearly safe for buying.",
        )
        _append_guardrail_reason(
            analysis_payload,
            "Purchase safety guardrail: the page contains high-risk sales wording (for example demo/replica/extreme-discount patterns).",
        )
        return

    if risk >= 6 or manipulation_risk >= 6 or privacy_risk >= 7:
        _set_guardrail_advice(analysis_payload, "avoid_purchase")
        _prefix_guardrail_summary(
            analysis_payload,
            "**Purchase safety guardrail:** this page is not clearly safe for buying.",
        )
        _append_guardrail_reason(
            analysis_payload,
            "Purchase safety guardrail: risk signals are above strict shopping-safe thresholds.",
        )
        return

    if confidence < 6 and trust_signals < 2:
        _set_guardrail_advice(analysis_payload, "avoid_purchase")
        _prefix_guardrail_summary(
            analysis_payload,
            "**Purchase safety guardrail:** this page is not clearly safe for buying.",
        )
        _append_guardrail_reason(
            analysis_payload,
            "Purchase safety guardrail: confidence is not high enough and trust evidence is incomplete.",
        )
        return

    if confidence < 10 and trust_signals < 2:
        _set_guardrail_advice(analysis_payload, "caution")
        _prefix_guardrail_summary(
            analysis_payload,
            "**Purchase safety guardrail:** this page needs extra verification before buying.",
        )
        _append_guardrail_reason(
            analysis_payload,
            "Purchase safety guardrail: confidence is below 10/10, so the advice is downgraded to caution for shopping decisions.",
        )


def _safe_int_score(payload: Dict[str, Any], field_name: str) -> int:
    value = payload.get(field_name)
    normalized = _coerce_score(value)
    if normalized is None:
        raise ValidationError(f"analysis.{field_name} must be integer 0..10")
    value = normalized
    if not 0 <= value <= 10:
        raise ValidationError(
            f"analysis.{field_name} must be between 0 and 10"
        )
    return value


def _coerce_score(value: Any) -> int | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, Decimal):
        value = float(value)
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        if value.is_integer():
            return int(value)
        rounded = int(round(value))
        return rounded if 0 <= rounded <= 10 else None
    if isinstance(value, str):
        try:
            normalized_text = value.strip()
            if not normalized_text:
                return None
            ratio_match = re.fullmatch(
                r"(?i)\s*(\d{1,3}(?:\.\d+)?|\.\d+)\s*/\s*(\d{1,3}(?:\.\d+)?)\s*",
                normalized_text,
            )
            if ratio_match:
                numerator = float(ratio_match.group(1))
                denominator = float(ratio_match.group(2))
                if denominator <= 0:
                    return None
                ratio = numerator / denominator
                scaled = int(round(ratio * 10)) if denominator != 10 else int(
                    round(numerator)
                )
                return scaled if 0 <= scaled <= 10 else None
            if normalized_text.endswith("%"):
                percent_value = normalized_text[:-1].strip()
                if not percent_value:
                    return None
                numeric_value = float(percent_value)
                return (
                    int(round(numeric_value / 10))
                    if 0 <= numeric_value <= 100
                    else None
                )
            if "." in normalized_text:
                return _coerce_score(float(normalized_text))
            return int(normalized_text)
        except ValueError:
            return None
        except TypeError:
            return None
    return None


def _safe_int_score_with_default(
    payload: Dict[str, Any], field_name: str, default: int
) -> int:
    value = payload.get(field_name)
    if value is None:
        return default
    normalized = _coerce_score(value)
    if normalized is None:
        return default
    if not 0 <= normalized <= 10:
        raise ValidationError(
            f"analysis.{field_name} must be between 0 and 10"
        )
    return normalized


def _normalize_optional_int(
    payload: Dict[str, Any], field_name: str
) -> int | None:
    value = payload.get(field_name)
    if value is None:
        return None
    normalized = _coerce_score(value)
    if normalized is None:
        raise ValidationError(f"analysis.{field_name} must be integer 0..10")
    value = normalized
    if not 0 <= value <= 10:
        raise ValidationError(
            f"analysis.{field_name} must be between 0 and 10"
        )
    return value


def _coalesce_risk_from_legacy(payload: Dict[str, Any]) -> int:
    legacy_risks = [
        payload.get("scam_risk"),
        payload.get("impersonation_risk"),
        payload.get("manipulation_risk"),
        payload.get("risk"),
    ]
    normalized_legacy = []
    for risk in legacy_risks:
        normalized_risk = _coerce_score(risk)
        if normalized_risk is None:
            continue
        normalized_legacy.append(normalized_risk)
    if not normalized_legacy:
        return 5
    return max(normalized_legacy)


def _normalize_scores_for_response(
    scores: Dict[str, Any],
) -> Dict[str, int]:
    risk = _normalize_optional_int(scores, "scam_risk")
    if risk is None:
        risk = _coalesce_risk_from_legacy(scores)
    confidence = _normalize_optional_int(scores, "confidence")
    if confidence is None:
        confidence = 5
    return {
        "risk": risk,
        "scam_risk": risk,
        "manipulation_pressure_risk": (
            _normalize_optional_int(scores, "manipulation_pressure_risk") or 0
        ),
        "privacy_risk": _normalize_optional_int(scores, "privacy_risk") or 0,
        "confidence": confidence,
    }


def _safe_reason_list(payload: Dict[str, Any], field_name: str) -> List[str]:
    raw_reasons = payload.get(field_name)
    if not isinstance(raw_reasons, list) or not raw_reasons:
        raise ValidationError(
            f"analysis.{field_name} must be a non-empty list"
        )
    if len(raw_reasons) > 5:
        raise ValidationError(f"analysis.{field_name} max 5 items")
    normalized_reasons: List[str] = []
    for reason in raw_reasons:
        if not isinstance(reason, str) or not reason.strip():
            raise ValidationError(
                f"analysis.{field_name} must only contain non-empty text"
            )
        normalized_reasons.append(reason.strip())
    return _dedupe_reason_texts(normalized_reasons, max_items=5)


def _dedupe_reason_texts(reasons: List[str], max_items: int = 5) -> List[str]:
    if not reasons:
        return []
    dedupe: List[str] = []
    seen: set[str] = set()
    for reason in reasons:
        if not isinstance(reason, str):
            continue
        normalized_reason = reason.strip()
        if not normalized_reason:
            continue
        reason_key = normalized_reason.lower()
        if reason_key in seen:
            continue
        seen.add(reason_key)
        dedupe.append(normalized_reason)
        if len(dedupe) >= max_items:
            break
    return dedupe


def _parse_json_payload(raw_text: str) -> Dict[str, Any]:
    try:
        return json.loads(raw_text)
    except Exception as error:
        raise ValidationError("model did not return valid JSON") from error


def _extract_json_from_model_output(model_text: str) -> Dict[str, Any]:
    content = (model_text or "").strip()
    if not content:
        raise ValidationError("model response content was empty")

    candidates = [content]

    fenced_json = re.findall(
        r"```(?:json)?\s*(\{.*?\})\s*```",
        content,
        flags=re.IGNORECASE | re.DOTALL,
    )
    candidates.extend(fenced_json)

    start_indices = [idx for idx, ch in enumerate(content) if ch == "{"]
    for start in start_indices:
        depth = 0
        inside_string = False
        escaped = False
        end = -1
        for pos in range(start, len(content)):
            char = content[pos]
            if inside_string:
                if escaped:
                    escaped = False
                elif char == "\\":
                    escaped = True
                elif char == '"':
                    inside_string = False
                continue
            if char == '"':
                inside_string = True
            elif char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0:
                    end = pos
                    break
        if end != -1:
            candidates.append(content[start : end + 1])

    for candidate in candidates:
        try:
            return json.loads(candidate)
        except Exception:
            continue

    raise ValidationError("model response JSON is invalid")


def _build_fallback_analysis_payload(
    canonical_url: str, requested_locale: str
) -> Dict[str, Any]:
    locale_prefix = (requested_locale or "").lower().split("-", 1)[0]
    fallback_reason_action_text = RECOMMENDED_ACTION_TEXT_FALLBACK.get(
        "insufficient_evidence",
        "There is not enough evidence yet. Verify from trusted sources.",
    )
    summary_en = (
        f"**Could not analyze `{canonical_url}` reliably right now.** "
        "Using a fallback result until analysis completes."
    )
    reasons_en = [
        "The analysis model did not return a valid structured payload.",
        "The page analysis was retried but remains inconclusive.",
        "Please retry in a moment.",
    ]
    summary_localized = None
    reasons_localized = None
    action_text_localized = None

    if not _is_english_locale(requested_locale):
        summary_localized = (
            "**No hemos podido analizar esta página de forma fiable** "
            "ahora mismo. Se devuelve un resultado de cobertura."
        )
        reasons_localized = [
            "El modelo no devolvió un resultado estructurado válido.",
            "Se detectó un error al parsear la salida de análisis.",
            "Inténtalo de nuevo en unos segundos.",
        ]
        action_text_localized = RECOMMENDED_ACTION_TEXT_FALLBACK_LOCALIZED.get(
            locale_prefix,
            {},
        ).get(
            "insufficient_evidence",
            "Aún no hay suficiente evidencia. Verifica con fuentes fiables.",
        )

    return {
        "scores": {
            "risk": 5,
            "scam_risk": 5,
            "manipulation_pressure_risk": 3,
            "privacy_risk": 3,
            "confidence": 2,
        },
        "analysis_quality": "fallback",
        "recommended_action": "insufficient_evidence",
        "overall_advice": "insufficient_evidence",
        "summary_en": summary_en,
        "reasons_en": reasons_en,
        "notable_signals": [],
        "summary_localized": summary_localized,
        "reasons_localized": reasons_localized,
        "recommended_action_text_en": fallback_reason_action_text,
        "recommended_action_text_localized": action_text_localized,
        "overall_advice_text": action_text_localized,
        "has_purchase_context": False,
        "purchase_recommendation_text_en": None,
        "purchase_recommendation_text": None,
    }


def _call_mistral(
    api_key: str,
    model: str,
    messages: List[Dict[str, str]],
    timeout_seconds: int,
) -> Dict[str, Any]:
    request_payload = {
        "model": model,
        "temperature": 0.1,
        "max_tokens": 1500,
        "messages": messages,
        "response_format": {"type": "json_object"},
    }
    use_response_format = True

    last_error: str | None = None
    retry_codes = {429, 500, 502, 503, 504}
    for attempt in range(MISTRAL_MAX_RETRIES + 1):
        if not use_response_format:
            request_payload.pop("response_format", None)
        request_params = urllib.request.Request(
            MISTRAL_API_URL,
            data=json.dumps(request_payload, ensure_ascii=False).encode(
                "utf-8"
            ),
            method="POST",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
        )
        try:
            with urllib.request.urlopen(
                request_params,
                timeout=timeout_seconds,
            ) as response:
                response_payload = response.read().decode("utf-8")
            return _parse_json_payload(response_payload)
        except urllib.error.HTTPError as error:
            if (
                use_response_format
                and error.code == 400
                and "response_format" in error.reason.lower()
            ):
                use_response_format = False
                continue
            last_error = f"{error.code}: {error.reason}"
            if error.code not in retry_codes or attempt == MISTRAL_MAX_RETRIES:
                break
            time.sleep(0.25 * (attempt + 1))
        except urllib.error.URLError as error:
            last_error = str(error)
            if attempt == MISTRAL_MAX_RETRIES:
                break
            time.sleep(0.25 * (attempt + 1))
        except Exception as error:
            last_error = str(error)
            break

    raise ValidationError(f"mistral request failed: {last_error}")


def _read_mistral_message(model_output: Dict[str, Any]) -> str:
    try:
        candidates = model_output["choices"]
        message = candidates[0]["message"]
        return message.get("content", "")
    except (KeyError, TypeError, IndexError) as error:
        raise ValidationError(
            "mistral response has unexpected format"
        ) from error


def _resolve_mistral_api_key(
    parameter_name: str, request_api_key: str | None
) -> str:
    if request_api_key:
        return request_api_key

    cached_key = _API_KEY_CACHE.get(parameter_name)
    if cached_key:
        return cached_key

    ssm = boto3.client("ssm")
    try:
        response = ssm.get_parameter(Name=parameter_name, WithDecryption=True)
    except ClientError as error:
        raise ValidationError(
            f"failed to read SSM parameter {parameter_name}"
        ) from error
    parameter = response.get("Parameter", {})
    api_key = str(parameter.get("Value", "")).strip()
    if not api_key:
        raise ValidationError(
            f"SSM parameter {parameter_name} is missing the api key value"
        )
    _API_KEY_CACHE[parameter_name] = api_key
    return api_key


def _prepare_snapshot_prompt(snapshot: Dict[str, Any]) -> Dict[str, Any]:
    snapshot_keys = (
        "canonical_tag",
        "visible_text",
        "meta_description",
        "meta_keywords",
        "document_language",
        "headings",
        "links",
        "forms",
        "scripts",
        "iframes",
    )
    prepared: Dict[str, Any] = {}
    for key in snapshot_keys:
        value = snapshot.get(key)
        if isinstance(value, str):
            prepared[key] = _trim_text(value, max_length=1400)
        elif isinstance(value, (dict, list, bool, int, float)):
            prepared[key] = value
    return prepared


def _build_analysis_prompt(
    canonical_url: str,
    source_locale: str,
    requested_locale: str,
    snapshot: Dict[str, Any],
) -> List[Dict[str, str]]:
    system_prompt = (
        "You are a cautious safety checker, but use a friendly 'parental' "
        "tone.\n"
        "Use very short sentences, no security jargon, no technical terms, "
        "and speak in plain second-person language.\n"
        "You analyze only the provided snapshot and return structured JSON for a "
        "risk-signal UI.\n"
        "Use only the provided snapshot. Do not invent facts.\n"
        "Prefer conservative outputs when evidence is weak.\n"
        "Evaluate general page safety first.\n"
        "If there is clear purchase/ecommerce context, also provide a short"
        " purchase recommendation.\n"
        "If there is no purchase context, set has_purchase_context=false and"
        " leave purchase recommendation fields empty.\n"
        "If the page looks like a demo, template, cloned storefront, landing "
        "page, or fake brand replica, set overall_advice=avoid_purchase and "
        "risk>=7.\n"
        "Only use avoid_purchase for pages that look clearly risky.\n"
        "Always write summary_en, reasons_en, and "
        "overall_advice_text_en in English, in Markdown format.\n"
        "Use safe, readable Markdown in summary and reasons.\n"
        "Avoid repeating the same idea twice between summary and reasons.\n"
        "Add a non-technical, very simple overall_advice_text.\n"
        "Return JSON only."
    )

    user_payload = {
        "source_locale": source_locale,
        "requested_locale": requested_locale,
        "canonical_url": canonical_url,
        "snapshot": _prepare_snapshot_prompt(snapshot),
    }
    user_prompt = (
        "Analyze this page snapshot and return JSON with this exact schema:\n"
        "{\n"
        '  "scam_risk": int 0..10,\n'
        '  "manipulation_pressure_risk": int 0..10,\n'
        '  "privacy_risk": int 0..10,\n'
        '  "risk": int 0..10,\n'
        '  "confidence": int 0..10,\n'
        '  "overall_advice": one of '
        "safe_enough|caution|avoid_purchase|verify_elsewhere|insufficient_evidence,\n"
        '  "recommended_action": optional alias of overall_advice,\n'
        '  "summary_en": string,\n'
        '  "reasons_en": [1..5 strings],\n'
        '  "overall_advice_text_en": string,\n'
        '  "recommended_action_text_en": optional alias of overall_advice_text_en,\n'
        '  "has_purchase_context": optional boolean,\n'
        '  "purchase_recommendation_text_en": optional string (only when has_purchase_context=true),\n'
        '  "notable_signals": optional array strings,\n'
        '  "summary_localized": optional if requested_locale differs from source_locale,\n'
        '  "reasons_localized": optional localized list [1..5 strings] '
        "if requested_locale differs.\n"
        '  "overall_advice_text": optional localized concise text if '
        "requested_locale differs.\n"
        '  "purchase_recommendation_text": optional localized purchase recommendation if requested_locale differs and has_purchase_context=true.\n'
        "}\n"
        "Only include JSON.\n"
        f"INPUT={json.dumps(user_payload, ensure_ascii=False)}"
    )
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]


def _build_translation_prompt(
    source_locale: str,
    target_locale: str,
    summary_en: str,
    reasons_en: List[str],
    overall_advice_text_en: str,
    purchase_recommendation_text_en: str | None = None,
) -> List[Dict[str, str]]:
    system_prompt = (
        "You are a translator for safety notes."
        " Return a concise localized version in structured JSON.\n"
        "Use simple words and tone for non-technical readers.\n"
        "Respond ONLY in the target language.\n"
        "If target language is not English, do not include English words in "
        "the output.\n"
        "Keep summary and reasons in markdown-friendly phrasing.\n"
        "Return a short ELI5-like overall_advice_text.\n"
        " Return JSON only."
    )
    user_payload = {
        "source_locale": source_locale,
        "target_locale": target_locale,
        "summary_en": summary_en,
        "reasons_en": reasons_en,
        "overall_advice_text_en": overall_advice_text_en,
        "purchase_recommendation_text_en": purchase_recommendation_text_en,
    }
    user_prompt = (
        "Translate the following structured analysis and return JSON:\n"
        '{ "summary_localized": "...", "reasons_localized": ["..."], '
        '"overall_advice_text": "...", "purchase_recommendation_text": "..." }\n'
        f"INPUT={json.dumps(user_payload, ensure_ascii=False)}"
    )
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]


def _normalize_analysis_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    normalized_score = _normalize_optional_int(payload, "scam_risk")
    if normalized_score is None:
        normalized_score = _normalize_optional_int(payload, "risk")
    if normalized_score is None:
        normalized_score = _coalesce_risk_from_legacy(payload)
    recommended_advice = _validate_recommended_action(
        payload.get("overall_advice", payload.get("recommended_action"))
    )
    overall_advice_text_en = payload.get("overall_advice_text_en")
    if not isinstance(overall_advice_text_en, str):
        overall_advice_text_en = payload.get("recommended_action_text_en")
    if not isinstance(overall_advice_text_en, str):
        overall_advice_text_en = RECOMMENDED_ACTION_TEXT_FALLBACK.get(
            recommended_advice
        )
    overall_advice_text_en = overall_advice_text_en.strip()
    has_purchase_context = _normalize_optional_bool(
        payload, "has_purchase_context"
    )
    purchase_recommendation_text_en = _normalize_optional_text(
        payload, "purchase_recommendation_text_en"
    )
    purchase_recommendation_text_localized = _normalize_optional_text(
        payload, "purchase_recommendation_text"
    )

    return {
        "scores": {
            "risk": normalized_score,
            "scam_risk": normalized_score,
            "manipulation_pressure_risk": _safe_int_score_with_default(
                payload, "manipulation_pressure_risk", 0
            ),
            "privacy_risk": _safe_int_score_with_default(
                payload, "privacy_risk", 0
            ),
            "confidence": _safe_int_score_with_default(
                payload, "confidence", 5
            ),
        },
        "recommended_action": recommended_advice,
        "overall_advice": recommended_advice,
        "overall_advice_text_en": _validate_text(
            {"overall_advice_text_en": overall_advice_text_en},
            "overall_advice_text_en",
            max_length=1200,
        ),
        "recommended_action_text_en": _validate_text(
            {"recommended_action_text_en": overall_advice_text_en},
            "recommended_action_text_en",
            max_length=1200,
        ),
        "summary_en": _validate_text(payload, "summary_en", max_length=4000),
        "reasons_en": _safe_reason_list(payload, "reasons_en"),
        "notable_signals": _normalize_optional_signals(payload),
        "summary_localized": _normalize_optional_text(
            payload, "summary_localized"
        ),
        "reasons_localized": _normalize_optional_reasons(
            payload, "reasons_localized"
        ),
        "recommended_action_text_localized": _normalize_optional_text(
            payload, "overall_advice_text"
        ),
        "overall_advice_text": _normalize_optional_text(
            payload, "overall_advice_text"
        ),
        "has_purchase_context": has_purchase_context,
        "purchase_recommendation_text_en": purchase_recommendation_text_en,
        "purchase_recommendation_text": purchase_recommendation_text_localized,
    }


def _validate_recommended_action(payload: Any, context: str = "recommended_action") -> str:
    if not isinstance(payload, str):
        raise ValidationError(f"analysis.{context} must be a text")
    recommended_action = payload.strip()
    if recommended_action not in RECOMMENDED_ACTIONS:
        raise ValidationError(f"analysis.{context} is invalid")
    return recommended_action


def _validate_text(
    payload: Dict[str, Any], field_name: str, max_length: int = 2000
) -> str:
    value = payload.get(field_name)
    if not isinstance(value, str):
        raise ValidationError(f"analysis.{field_name} must be text")
    value = value.strip()
    if not value:
        raise ValidationError(f"analysis.{field_name} is empty")
    if len(value) > max_length:
        raise ValidationError(f"analysis.{field_name} too long")
    return value


def _normalize_optional_text(
    payload: Dict[str, Any], field_name: str
) -> str | None:
    value = payload.get(field_name)
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValidationError(f"analysis.{field_name} must be text")
    value = value.strip()
    if not value:
        return None
    return value


def _normalize_optional_bool(
    payload: Dict[str, Any], field_name: str
) -> bool | None:
    value = payload.get(field_name)
    if value is None:
        return None
    if not isinstance(value, bool):
        raise ValidationError(f"analysis.{field_name} must be boolean")
    return value


def _normalize_optional_reasons(
    payload: Dict[str, Any], field_name: str
) -> List[str] | None:
    value = payload.get(field_name)
    if value is None:
        return None
    reasons = _safe_reason_list(payload, field_name)
    if len(reasons) > 5:
        raise ValidationError(f"analysis.{field_name} max 5 items")
    return reasons


def _normalize_optional_signals(payload: Dict[str, Any]) -> List[str]:
    value = payload.get("notable_signals", [])
    if value is None:
        return []
    if not isinstance(value, list):
        raise ValidationError("analysis.notable_signals must be a list")
    if len(value) > 10:
        raise ValidationError("analysis.notable_signals max 10 items")
    normalized_signals: List[str] = []
    for signal in value:
        if not isinstance(signal, str):
            raise ValidationError(
                "analysis.notable_signals items must be text"
            )
        signal_text = signal.strip()
        if signal_text:
            normalized_signals.append(signal_text)
    return normalized_signals


def _apply_response_purchase_guardrails(
    canonical_url: str,
    analysis_scores: Dict[str, Any],
    summary: Any,
    reasons: Any,
    notable_signals: Any,
    overall_advice: Any,
    advice_text: Any,
    enforce_avoid_on_snapshot_risk: bool,
) -> Tuple[str, str, str, List[str]]:
    advice_value = (
        overall_advice
        if isinstance(overall_advice, str) and overall_advice in RECOMMENDED_ACTIONS
        else "insufficient_evidence"
    )
    advice_text_value = (
        advice_text
        if isinstance(advice_text, str) and advice_text.strip()
        else RECOMMENDED_ACTION_TEXT_FALLBACK.get(
            advice_value, RECOMMENDED_ACTION_TEXT_FALLBACK["insufficient_evidence"]
        )
    )
    summary_value = summary if isinstance(summary, str) and summary.strip() else ""

    reasons_value: List[str] = []
    if isinstance(reasons, list):
        for reason in reasons:
            if isinstance(reason, str) and reason.strip():
                reasons_value.append(reason.strip())

    text_blob = _analysis_text_blob(summary_value, reasons_value, notable_signals)
    if not _blob_indicates_purchase_context(text_blob):
        return advice_value, advice_text_value, summary_value, reasons_value

    risk = _coerce_score(analysis_scores.get("scam_risk"))
    if risk is None:
        risk = _coerce_score(analysis_scores.get("risk"))
    manipulation_risk = _coerce_score(
        analysis_scores.get("manipulation_pressure_risk")
    )
    privacy_risk = _coerce_score(analysis_scores.get("privacy_risk"))
    confidence = _coerce_score(analysis_scores.get("confidence"))

    risk = 5 if risk is None else risk
    manipulation_risk = 0 if manipulation_risk is None else manipulation_risk
    privacy_risk = 0 if privacy_risk is None else privacy_risk
    confidence = 5 if confidence is None else confidence
    trust_signals = _count_purchase_trust_signals_from_blob(
        canonical_url, text_blob
    )
    has_high_risk_terms = _blob_has_high_risk_purchase_terms(text_blob)
    has_ecommerce_terms = _has_strictly_ecommerce_terms(text_blob)

    def with_reason(reason_text: str) -> List[str]:
        merged_reasons = [*reasons_value]
        merged_reasons.append(reason_text)
        return _dedupe_reason_texts(merged_reasons, max_items=5)

    weak_trust = trust_signals < 3
    high_risk_purchase_context = has_high_risk_terms and has_ecommerce_terms
    high_risk_by_score = risk >= 5 and weak_trust
    weak_trust_guardrail = trust_signals <= 2 and risk >= 4
    low_confidence_guardrail = confidence <= 6 and trust_signals <= 2
    if enforce_avoid_on_snapshot_risk:
        forced_text = RECOMMENDED_ACTION_TEXT_FALLBACK["avoid_purchase"]
        forced_summary = summary_value
        prefix = (
            "**Purchase safety guardrail:** this page looks like a risky "
            "demo/template storefront."
        )
        if forced_summary and not forced_summary.lower().startswith(prefix.lower()):
            forced_summary = _trim_text(f"{prefix} {forced_summary}", 4000)
        return (
            "avoid_purchase",
            forced_text,
            forced_summary,
            with_reason(
                "Purchase safety guardrail: snapshot text indicates demo/template-style"
                " storefront patterns."
            ),
        )
    if (
        high_risk_purchase_context
        or high_risk_by_score
        or weak_trust_guardrail
        or risk >= 6
        or manipulation_risk >= 6
        or privacy_risk >= 6
        or low_confidence_guardrail
    ):
        forced_text = RECOMMENDED_ACTION_TEXT_FALLBACK["avoid_purchase"]
        forced_summary = summary_value
        prefix = (
            "**Purchase safety guardrail:** this page is not clearly safe for buying."
        )
        if forced_summary and not forced_summary.lower().startswith(prefix.lower()):
            forced_summary = _trim_text(f"{prefix} {forced_summary}", 4000)
        return (
            "avoid_purchase",
            forced_text,
            forced_summary,
            with_reason(
                "Purchase safety guardrail: confidence/trust signals are not strong enough for a safe-buy recommendation."
            ),
        )

    if confidence < 10 and weak_trust:
        forced_text = RECOMMENDED_ACTION_TEXT_FALLBACK["caution"]
        forced_summary = summary_value
        prefix = (
            "**Purchase safety guardrail:** this page needs extra verification before buying."
        )
        if forced_summary and not forced_summary.lower().startswith(prefix.lower()):
            forced_summary = _trim_text(f"{prefix} {forced_summary}", 4000)
        return (
            "caution",
            forced_text,
            forced_summary,
            with_reason(
                "Purchase safety guardrail: safe-buy requires confidence 10/10."
            ),
        )

    return advice_value, advice_text_value, summary_value, reasons_value


def _build_lookup_analysis_response(
    item: Dict[str, Any],
    requested_locale: str,
    fresh: bool,
    status: str,
    table,
) -> Dict[str, Any]:
    analysis_scores = item.get("scores", {})
    source_locale = item.get("source_locale", "en")
    translated, translated_locale = _find_translation(
        item.get("translations", {}), requested_locale
    )
    overall_advice = item.get("overall_advice") or item.get(
        "recommended_action"
    )
    recommended_action_text = item.get("recommended_action_text_en")
    purchase_recommendation_text = item.get("purchase_recommendation_text_en")
    requested_locale_key = (requested_locale or "").lower()

    if isinstance(translated, dict):
        summary = translated.get("summary")
        reasons = translated.get("reasons")
        translated_recommended_action_text = translated.get(
            "recommended_action_text"
        )
        translated_purchase_recommendation_text = translated.get(
            "purchase_recommendation_text"
        )
        has_locale_text = (
            isinstance(summary, str)
            and summary.strip()
            and isinstance(reasons, list)
        )
        if has_locale_text:
            served_locale = translated_locale
        else:
            translated_recommended_action_text = item.get(
                "recommended_action_text_en"
            )
            translated_purchase_recommendation_text = item.get(
                "purchase_recommendation_text_en"
            )
            summary = item.get("summary_en")
            reasons = item.get("reasons_en", [])
            served_locale = "en"
    else:
        summary = item.get("summary_en")
        reasons = item.get("reasons_en", [])
        served_locale = "en"
        translated_recommended_action_text = None
        translated_purchase_recommendation_text = None

    if (
        isinstance(translated_recommended_action_text, str)
        and translated_recommended_action_text.strip()
    ):
        recommended_action_text = translated_recommended_action_text
    if (
        isinstance(translated_purchase_recommendation_text, str)
        and translated_purchase_recommendation_text.strip()
    ):
        purchase_recommendation_text = translated_purchase_recommendation_text

    if not isinstance(recommended_action_text, str):
        fallback_text_map = (
            OVERALL_ADVICE_TEXT_FALLBACK_LOCALIZED.get(
                requested_locale_key.split("-", 1)[0], {}
            )
        )
        if not fallback_text_map:
            fallback_text_map = OVERALL_ADVICE_TEXT_FALLBACK_LOCALIZED["en"]
        recommended_action_text = fallback_text_map.get(
            overall_advice,
            RECOMMENDED_ACTION_TEXT_FALLBACK.get(
                overall_advice, "Proceed with caution."
            ),
        )

    traffic_light_map = {
        "safe_enough": "green",
        "caution": "yellow",
        "avoid_purchase": "red",
        "verify_elsewhere": "red",
        "insufficient_evidence": "gray",
    }
    traffic_light = traffic_light_map.get(overall_advice, "gray")
    has_purchase_context = item.get("has_purchase_context")
    if not isinstance(has_purchase_context, bool):
        has_purchase_context = _blob_indicates_purchase_context(
            _analysis_text_blob(
                summary,
                reasons,
                item.get("notable_signals", []),
            )
        )
    if has_purchase_context:
        if not isinstance(purchase_recommendation_text, str):
            purchase_recommendation_text = recommended_action_text
        purchase_recommendation_text = purchase_recommendation_text.strip()
        if not purchase_recommendation_text:
            purchase_recommendation_text = recommended_action_text
    else:
        purchase_recommendation_text = None

    report_total = int(item.get("report_count", 0) or 0)
    report_up = int(item.get("report_up_count", 0) or 0)
    report_down = int(item.get("report_down_count", 0) or 0)
    fallback_counts = _resolve_feedback_counts_from_report_history(
        table,
        item,
        include_client_install_id=True,
        include_sk=True,
    )
    if fallback_counts:
        report_up, report_down, report_total = fallback_counts

    return {
        "status": status,
        "cache_hit": status == "hit",
        "fresh": fresh,
        "canonical_url": item.get("canonical_url"),
        "analysis": {
            "scores": serialize_decimal(
                _normalize_scores_for_response(analysis_scores)
            ),
            "summary": summary,
            "reasons": reasons,
            "overall_advice": overall_advice,
            "overall_advice_text": recommended_action_text,
            "traffic_light": traffic_light,
            "traffic_light_reason": recommended_action_text,
            "notable_signals": item.get("notable_signals", []),
            "recommended_action": overall_advice,
            "recommended_action_text": recommended_action_text,
            "has_purchase_context": has_purchase_context,
            "purchase_recommendation_text": purchase_recommendation_text,
            "feedback_counts": {
                "up": max(0, report_up),
                "down": max(0, report_down),
                "total": max(0, report_total),
            },
        },
        "analysis_id": item.get("analysis_id"),
        "source_locale": source_locale,
        "served_locale": served_locale,
        "content_hash": item.get("content_hash"),
        "expires_at": item.get("expires_at"),
        "created_at": item.get("created_at"),
        "analysis_version": item.get("analysis_version"),
        "analysis_quality": item.get("analysis_quality", "valid"),
    }


def _is_fresh_analysis(item: Dict[str, Any], now_timestamp: int) -> bool:
    ttl = int(item.get("ttl", 0) or 0)
    if ttl <= 0:
        return False
    return now_timestamp <= ttl


def _is_english_locale(locale: str) -> bool:
    return (locale or "").lower().startswith("en")


def _translation_candidates(locale: str) -> list[str]:
    normalized = normalize_locale(locale)
    if not normalized:
        return []

    candidates: list[str] = []
    for candidate in locale_variants(normalized):
        if candidate not in candidates:
            candidates.append(candidate)
        candidate_underscore = candidate.replace("-", "_")
        if candidate_underscore not in candidates:
            candidates.append(candidate_underscore)
    return candidates


def _find_translation(
    translations: Dict[str, Any], locale: str
) -> Tuple[Dict[str, Any], str]:
    if not isinstance(translations, dict):
        return {}, ""
    for candidate in _translation_candidates(locale):
        translation = translations.get(candidate)
        if isinstance(translation, dict):
            summary = translation.get("summary")
            reasons = translation.get("reasons")
            if (
                isinstance(summary, str)
                and summary.strip()
                and isinstance(reasons, list)
            ):
                return translation, candidate
    return {}, ""


def _add_translation(
    translations: Dict[str, Dict[str, Any]],
    locale: str,
    summary: str,
    reasons: list[str],
    recommended_action_text: str | None,
    purchase_recommendation_text: str | None,
) -> None:
    for translation_locale in locale_variants(locale):
        translations[translation_locale] = {
            "summary": summary,
            "reasons": reasons,
            "recommended_action_text": recommended_action_text,
            "overall_advice_text": recommended_action_text,
            "purchase_recommendation_text": purchase_recommendation_text,
        }


def _store_locale_translation(
    table,
    item: Dict[str, Any],
    locale: str,
    translation: Dict[str, Any],
) -> None:
    for translation_locale in locale_variants(locale):
        table.update_item(
            Key={"PK": item["PK"], "SK": item["SK"]},
            UpdateExpression=(
                "SET translations.#locale = :translation, "
                "updated_at = :updated_at"
            ),
            ExpressionAttributeNames={"#locale": translation_locale},
            ExpressionAttributeValues={
                ":translation": translation,
                ":updated_at": iso_now(),
            },
        )


def _generate_translation(
    analysis_item: Dict[str, Any],
    requested_locale: str,
    config: Dict[str, Any],
    api_key: str,
) -> Tuple[str, List[str], str, str | None]:
    summary_en = analysis_item.get("summary_en", "")
    reasons_en = analysis_item.get("reasons_en", [])
    overall_advice_text_en = analysis_item.get("overall_advice_text_en", "")
    purchase_recommendation_text_en = analysis_item.get(
        "purchase_recommendation_text_en", ""
    )
    if not overall_advice_text_en:
        overall_advice = analysis_item.get("overall_advice")
        if not overall_advice:
            overall_advice = analysis_item.get("recommended_action", "")
        overall_advice_text_en = RECOMMENDED_ACTION_TEXT_FALLBACK.get(
            overall_advice,
            "Review this site before using it.",
        )
    if not summary_en or not reasons_en:
        raise ValidationError("source analysis lacks fields for translation")

    messages = _build_translation_prompt(
        analysis_item.get("source_locale", "en"),
        requested_locale,
        _trim_text(summary_en, 500),
        [_trim_text(reason, 500) for reason in reasons_en],
        _trim_text(overall_advice_text_en, 400),
        _trim_text(purchase_recommendation_text_en, 400),
    )
    try:
        model_output = _call_mistral(
            api_key,
            config["mistral_translation_model"],
            messages,
            int(config["mistral_request_timeout_seconds"]),
        )
        content = _read_mistral_message(model_output)
        parsed = _extract_json_from_model_output(content)
        summary = _validate_text(parsed, "summary_localized", max_length=2000)
        reasons = _safe_reason_list(parsed, "reasons_localized")
        action_text = _validate_text(
            parsed, "overall_advice_text", max_length=300
        )
        purchase_text = _normalize_optional_text(
            parsed, "purchase_recommendation_text"
        )
        return summary, reasons, action_text, purchase_text
    except ValidationError:
        locale = (requested_locale or "").lower().split("-", 1)[0]
        fallback_texts = RECOMMENDED_ACTION_TEXT_FALLBACK_LOCALIZED.get(
            locale,
            RECOMMENDED_ACTION_TEXT_FALLBACK,
        )
        fallback_overall_advice = analysis_item.get("overall_advice")
        if not fallback_overall_advice:
            fallback_overall_advice = analysis_item.get("recommended_action", "")
        fallback_action = fallback_texts.get(
            fallback_overall_advice,
            RECOMMENDED_ACTION_TEXT_FALLBACK.get(
                fallback_overall_advice,
                "Review this site before trusting it.",
            ),
        )
        fallback_reasons: List[str] = []
        for reason in reasons_en:
            if not isinstance(reason, str):
                continue
            clean_reason = _trim_text(reason, 500)
            if clean_reason:
                fallback_reasons.append(clean_reason)
        if not fallback_reasons:
            fallback_reasons = ["No additional details were available."]
        fallback_purchase_text = (
            _trim_text(purchase_recommendation_text_en, 400)
            if isinstance(purchase_recommendation_text_en, str)
            and purchase_recommendation_text_en.strip()
            else None
        )
        return (
            _trim_text(summary_en, 2000),
            fallback_reasons[:5],
            fallback_action,
            fallback_purchase_text,
        )


def _analyze_web_page(
    canonical_url: str,
    source_locale: str,
    requested_locale: str,
    snapshot: Dict[str, Any],
    config: Dict[str, Any],
    request_api_key: str | None,
) -> Dict[str, Any]:
    api_key = _resolve_mistral_api_key(
        config["mistral_parameter_name"], request_api_key
    )
    messages = _build_analysis_prompt(
        canonical_url, source_locale, requested_locale, snapshot
    )
    try:
        raw_response = _call_mistral(
            api_key,
            config["mistral_model"],
            messages,
            int(config["mistral_request_timeout_seconds"]),
        )
        parsed = _extract_json_from_model_output(
            _read_mistral_message(raw_response)
        )
        normalized = _normalize_analysis_payload(parsed)
        normalized["analysis_quality"] = "valid"
    except ValidationError:
        normalized = _build_fallback_analysis_payload(
            canonical_url, requested_locale
        )

    has_purchase_context = normalized.get("has_purchase_context")
    snapshot_has_high_risk = _snapshot_has_high_risk_purchase_terms(snapshot)
    if has_purchase_context is None:
        has_purchase_context = _snapshot_indicates_purchase_context(snapshot)
    normalized["has_purchase_context"] = bool(has_purchase_context)
    if normalized["has_purchase_context"]:
        (
            guarded_advice,
            guarded_text,
            guarded_summary,
            guarded_reasons,
        ) = _apply_response_purchase_guardrails(
            canonical_url,
            normalized["scores"],
            normalized["summary_en"],
            normalized["reasons_en"],
            normalized["notable_signals"],
            normalized["overall_advice"],
            normalized["recommended_action_text_en"],
            snapshot_has_high_risk,
        )
        normalized["overall_advice"] = guarded_advice
        normalized["recommended_action"] = guarded_advice
        normalized["overall_advice_text_en"] = guarded_text
        normalized["recommended_action_text_en"] = guarded_text
        normalized["summary_en"] = _trim_text(guarded_summary, 4000)
        normalized["reasons_en"] = guarded_reasons[:5]

    if normalized["has_purchase_context"]:
        purchase_message = _trim_text(
            normalized.get("purchase_recommendation_text_en"), 1200
        )
        if not purchase_message:
            purchase_message = _trim_text(
                normalized.get("recommended_action_text_en"), 1200
            )
        normalized["purchase_recommendation_text_en"] = purchase_message or None
    else:
        normalized["purchase_recommendation_text_en"] = None
        normalized["purchase_recommendation_text"] = None

    if (not _is_english_locale(requested_locale)) and not normalized.get(
        "summary_localized"
    ):
        (
            translated_summary,
            translated_reasons,
            translated_action_text,
            translated_purchase_text,
        ) = _generate_translation(
            {
                "summary_en": normalized["summary_en"],
                "reasons_en": normalized["reasons_en"],
                "source_locale": source_locale,
                "overall_advice_text_en": normalized[
                    "recommended_action_text_en"
                ],
                "purchase_recommendation_text_en": normalized.get(
                    "purchase_recommendation_text_en"
                ),
            },
            requested_locale,
            config,
            api_key,
        )
        normalized["summary_localized"] = translated_summary
        normalized["reasons_localized"] = translated_reasons
        normalized["recommended_action_text_localized"] = (
            translated_action_text
        )
        normalized["overall_advice_text"] = translated_action_text
        if normalized["has_purchase_context"]:
            normalized["purchase_recommendation_text"] = (
                translated_purchase_text
            )

    return normalized


def _store_analysis(
    table,
    canonical_url: str,
    analysis_version: str,
    content_hash: str,
    source_locale: str,
    requested_locale: str,
    config: Dict[str, Any],
    analysis_payload: Dict[str, Any],
) -> Dict[str, Any]:
    created_at_timestamp = now_epoch()
    ttl_seconds = int(config["analysis_ttl_seconds"])
    item_id = build_analysis_sk(
        analysis_version,
        content_hash,
        created_at_timestamp,
    )

    analysis_id = f"{canonical_url}|{analysis_version}|{content_hash}"
    expires_at = created_at_timestamp + ttl_seconds
    translations: Dict[str, Dict[str, Any]] = {}
    _add_translation(
        translations,
        "en",
        analysis_payload["summary_en"],
        analysis_payload["reasons_en"],
        analysis_payload["recommended_action_text_en"],
        analysis_payload.get("purchase_recommendation_text_en"),
    )

    if not _is_english_locale(requested_locale):
        translation_summary = analysis_payload.get("summary_localized")
        translation_reasons = analysis_payload.get("reasons_localized")
        translation_action = analysis_payload.get("overall_advice_text")
        translation_purchase = analysis_payload.get("purchase_recommendation_text")
        if not translation_action:
            translation_action = analysis_payload.get(
                "recommended_action_text_localized"
            )
        if translation_summary and translation_reasons:
            _add_translation(
                translations,
                requested_locale,
                translation_summary,
                translation_reasons,
                translation_action,
                translation_purchase,
            )

    item = {
        "PK": f"URL#{canonical_url}",
        "SK": item_id,
        "type": "analysis",
        "analysis_version": analysis_version,
        "content_hash": content_hash,
        "canonical_url": canonical_url,
        "source_locale": source_locale,
        "status": "published",
        "created_at": iso_now(),
        "updated_at": iso_now(),
        "ttl": expires_at,
        "expires_at": expires_at,
        "scores": {
            "risk": analysis_payload["scores"]["risk"],
            "scam_risk": analysis_payload["scores"]["scam_risk"],
            "manipulation_pressure_risk": analysis_payload["scores"][
                "manipulation_pressure_risk"
            ],
            "privacy_risk": analysis_payload["scores"]["privacy_risk"],
            "confidence": analysis_payload["scores"]["confidence"],
        },
        "summary_en": analysis_payload["summary_en"],
        "reasons_en": analysis_payload["reasons_en"],
        "notable_signals": analysis_payload["notable_signals"],
        "recommended_action": analysis_payload["recommended_action"],
        "overall_advice": analysis_payload["overall_advice"],
        "recommended_action_text_en": analysis_payload[
            "recommended_action_text_en"
        ],
        "overall_advice_text_en": analysis_payload["overall_advice_text_en"],
        "has_purchase_context": bool(
            analysis_payload.get("has_purchase_context", False)
        ),
        "purchase_recommendation_text_en": analysis_payload.get(
            "purchase_recommendation_text_en"
        ),
        "translations": translations,
        "report_count": 0,
        "report_up_count": 0,
        "report_down_count": 0,
        "confirmations": 0,
        "analysis_id": analysis_id,
        "analysis_quality": analysis_payload.get("analysis_quality", "valid"),
    }
    table.put_item(Item=item)
    response_item = item.copy()
    response_item["content_hash"] = content_hash
    return response_item


def _analyze_or_return_cached(
    table,
    canonical_url: str,
    analysis_version: str,
    content_hash: str,
    requested_locale: str,
    source_locale: str,
    snapshot: Dict[str, Any],
    config: Dict[str, Any],
    request_api_key: str | None,
) -> Dict[str, Any]:
    now_timestamp = int(time.time())
    current_time = now_timestamp
    cached = query_analyses_for_hash(
        table,
        canonical_url,
        analysis_version,
        content_hash,
        limit=1,
    )

    if cached:
        item = cached[0]
        if _is_fresh_analysis(item, current_time):
            translations = item.get("translations", {})
            cached_translation, _ = _find_translation(translations, requested_locale)
            if cached_translation:
                return _build_lookup_analysis_response(
                    item, requested_locale, True, "hit", table
                )

            if not _is_english_locale(requested_locale):
                api_key = _resolve_mistral_api_key(
                    config["mistral_parameter_name"], request_api_key
                )
                (
                    summary,
                    reasons,
                    action_text,
                    purchase_text,
                ) = _generate_translation(
                    item,
                    requested_locale,
                    config,
                    api_key,
                )
                translation = {
                    "summary": summary,
                    "reasons": reasons,
                    "recommended_action_text": action_text,
                    "overall_advice_text": action_text,
                    "purchase_recommendation_text": purchase_text,
                }
                _store_locale_translation(
                    table,
                    item,
                    requested_locale,
                    translation,
                )
                translations = item.get("translations", {})
                if not isinstance(translations, dict):
                    translations = {}
                item["translations"] = translations
                _add_translation(
                    item["translations"],
                    requested_locale,
                    translation["summary"],
                    translation["reasons"],
                    translation["recommended_action_text"],
                    translation["purchase_recommendation_text"],
                )
                return _build_lookup_analysis_response(
                    item, requested_locale, True, "hit", table
                )
            return _build_lookup_analysis_response(
                item, requested_locale, True, "hit", table
            )

        # fallthrough to re-run analysis if stale or incomplete

    analysis_payload = _analyze_web_page(
        canonical_url,
        source_locale,
        requested_locale,
        snapshot,
        config,
        request_api_key,
    )
    item = _store_analysis(
        table,
        canonical_url,
        analysis_version,
        content_hash,
        source_locale,
        requested_locale,
        config,
        analysis_payload,
    )
    return _build_lookup_analysis_response(
        item, requested_locale, True, "generated", table
    )


def handle(
    payload: Dict[str, Any], table, config: Dict[str, Any]
) -> Dict[str, Any]:
    request_payload = validate_lookup_request(payload)
    canonical_input = request_payload["canonical_url"]
    if not isinstance(canonical_input, str) or not canonical_input.strip():
        raise ValidationError("canonical_url is missing")

    canonical_url = canonicalize_url(canonical_input)
    if not canonical_url:
        raise ValidationError("canonical_url is invalid")

    source_locale = request_payload["document_language"]
    requested_locale = request_payload["locale"]
    request_api_key = request_payload.get("mistral_api_key")
    snapshot = request_payload["snapshot"]
    analysis_version = (
        str(payload.get("analysis_version", "")).strip()
        or config["analysis_version_default"]
    )

    content_hash = compute_content_hash(canonical_url, source_locale, snapshot)
    response = _analyze_or_return_cached(
        table=table,
        canonical_url=canonical_url,
        analysis_version=analysis_version,
        content_hash=content_hash,
        requested_locale=requested_locale,
        source_locale=source_locale,
        snapshot=snapshot,
        config=config,
        request_api_key=request_api_key,
    )

    analysis = response.get("analysis")
    if isinstance(analysis, dict):
        analysis_id = _trim_text(response.get("analysis_id") or analysis.get("analysis_id"))
        client_install_id = _trim_text(payload.get("client_install_id"))
        analysis["user_feedback"] = _resolve_latest_user_feedback(
            table,
            {
                "canonical_url": canonical_url,
                "analysis_version": analysis_version,
                "analysis_id": analysis_id,
            },
            client_install_id,
        )
    return response
