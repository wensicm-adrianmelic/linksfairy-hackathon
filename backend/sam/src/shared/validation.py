from __future__ import annotations

import re
from decimal import Decimal
from typing import Any, Iterable, List

from .models import (
    ANALYSIS_REQUIRED_FIELDS,
    ANALYSIS_SCORE_FIELDS,
    RECOMMENDED_ACTIONS,
)


class ValidationError(ValueError):
    pass


def require_dict(payload: Any, context: str) -> dict:
    if not isinstance(payload, dict):
        raise ValidationError(f"{context} must be a JSON object")
    return payload


def require_fields(payload: dict, fields: Iterable[str], context: str) -> None:
    missing = [name for name in fields if name not in payload]
    if missing:
        raise ValidationError(
            f"{context} missing fields: {', '.join(sorted(missing))}"
        )


def require_string(
    payload: dict, field: str, context: str, max_len: int = 2048
) -> str:
    value = payload.get(field)
    if not isinstance(value, str) or not value.strip():
        raise ValidationError(f"{context}.{field} must be a non-empty string")
    value = value.strip()
    if len(value) > max_len:
        raise ValidationError(
            f"{context}.{field} exceeds max length {max_len}"
        )
    return value


def require_locale(payload: dict, field: str = "locale") -> str:
    raw_locale = payload.get(field, "en")
    if raw_locale is None:
        return "en"
    if not isinstance(raw_locale, str) or not raw_locale.strip():
        raise ValidationError(f"invalid {field}")
    locale = raw_locale.strip().lower()
    if not re.match(r"^[a-z]{2}(?:-[a-z]{2})?$", locale):
        raise ValidationError(f"{field} must be a locale like en or es-es")
    return locale


def require_optional_string(
    payload: dict, field: str, context: str, max_len: int = 2048
) -> str | None:
    value = payload.get(field)
    if value is None:
        return None
    if not isinstance(value, str) or not value.strip():
        raise ValidationError(f"{context}.{field} must be a non-empty string")
    value = value.strip()
    if len(value) > max_len:
        raise ValidationError(
            f"{context}.{field} exceeds max length {max_len}"
        )
    return value


def require_boolean(payload: dict, field: str, context: str) -> bool:
    value = payload.get(field)
    if value is None:
        return False
    if not isinstance(value, bool):
        raise ValidationError(f"{context}.{field} must be boolean")
    return value


def _coerce_score(value: Any) -> int | None:
    if isinstance(value, Decimal):
        if value == value.to_integral():
            return int(value)
        rounded = int(round(float(value)))
        return rounded if 0 <= rounded <= 10 else None
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        if value.is_integer():
            return int(value)
        return int(round(value))
    if isinstance(value, str):
        value = value.strip()
        if not value:
            return None
        try:
            numeric = float(value)
        except ValueError:
            return None
        if numeric.is_integer():
            return int(numeric)
        rounded = int(round(numeric))
        if 0 <= rounded <= 10:
            return rounded
    return None


def require_int_score(payload: dict, field: str, context: str) -> int:
    normalized = _coerce_score(payload.get(field))
    if normalized is None:
        raise ValidationError(f"{context}.{field} must be integer 0..10")
    if not 0 <= normalized <= 10:
        raise ValidationError(f"{context}.{field} must be between 0 and 10")
    return normalized


def validate_reasons(payload: dict, field: str, context: str) -> List[str]:
    value = payload.get(field)
    if not isinstance(value, list) or not value:
        raise ValidationError(f"{context}.{field} must be a non-empty list")
    if len(value) > 5:
        raise ValidationError(f"{context}.{field} max 5 items")
    reasons: List[str] = []
    for item in value:
        if not isinstance(item, str) or not item.strip():
            raise ValidationError(f"{context}.{field} must only contain text")
        reasons.append(item.strip())
    return reasons


def validate_analysis_payload(analysis: dict) -> dict:
    recommended_action_fallback = {
        "safe_enough": "This looks low risk. Keep usual security habits.",
        "caution": "Be careful and review the page before continuing.",
        "avoid_purchase": "Don't buy or share sensitive data here.",
        "verify_elsewhere": "Check this site from an official source first.",
        "insufficient_evidence": "Not enough evidence; verify before trusting.",
    }

    required_fields = set(ANALYSIS_REQUIRED_FIELDS)
    if analysis.get("recommended_action") and not analysis.get(
        "overall_advice"
    ):
        required_fields = required_fields - {"overall_advice"}
    require_fields(
        analysis,
        required_fields,
        "analysis",
    )
    normalized = {
        "scores": {},
        "recommended_action": None,
        "summary_en": None,
        "reasons_en": None,
        "recommended_action_text_en": None,
        "summary_localized": analysis.get("summary_localized"),
        "reasons_localized": analysis.get("reasons_localized"),
        "recommended_action_text_localized": analysis.get(
            "recommended_action_text"
        ),
        "notable_signals": analysis.get("notable_signals", []),
        "overall_advice": analysis.get("overall_advice"),
        "overall_advice_text_en": None,
        "overall_advice_text": analysis.get("overall_advice_text"),
        "traffic_light": analysis.get("traffic_light"),
        "traffic_light_reason": analysis.get("traffic_light_reason"),
    }

    for score_field in ANALYSIS_SCORE_FIELDS:
        normalized["scores"][score_field] = require_int_score(
            analysis, score_field, "analysis"
        )

    recommended_action = analysis.get("overall_advice")
    if not recommended_action:
        recommended_action = analysis.get("recommended_action")
    normalized["recommended_action"] = require_string(
        {"recommended_action": recommended_action},
        "recommended_action",
        max_len=64,
    )
    if normalized["recommended_action"] not in RECOMMENDED_ACTIONS:
        raise ValidationError("analysis.recommended_action is invalid")
    normalized["overall_advice"] = normalized["recommended_action"]

    normalized["summary_en"] = require_string(
        analysis, "summary_en", "analysis", max_len=2000
    )
    normalized["reasons_en"] = validate_reasons(
        analysis, "reasons_en", "analysis"
    )
    recommended_action_text_en = analysis.get("recommended_action_text_en")
    if not recommended_action_text_en:
        recommended_action_text_en = analysis.get("overall_advice_text")
    normalized["recommended_action_text_en"] = (
        require_string(
            {"recommended_action_text_en": recommended_action_text_en},
            "recommended_action_text_en",
            max_len=1200,
        )
        if recommended_action_text_en
        else recommended_action_fallback[normalized["recommended_action"]]
    )
    normalized["overall_advice_text_en"] = normalized[
        "recommended_action_text_en"
    ]

    traffic_light = normalized["traffic_light"]
    if traffic_light is not None and not isinstance(traffic_light, str):
        raise ValidationError("analysis.traffic_light must be text")
    if traffic_light is not None:
        traffic_light = traffic_light.strip().lower()
        if traffic_light not in {"red", "yellow", "green"}:
            raise ValidationError(
                "analysis.traffic_light must be red|yellow|green"
            )
    normalized["traffic_light"] = traffic_light

    optional_summary_localized = analysis.get("summary_localized")
    optional_reasons_localized = analysis.get("reasons_localized")
    if optional_summary_localized is not None:
        if (
            not isinstance(optional_summary_localized, str)
            or not optional_summary_localized.strip()
        ):
            raise ValidationError("analysis.summary_localized must be text")
        normalized["summary_localized"] = optional_summary_localized.strip()
    if optional_reasons_localized is not None:
        if (
            not isinstance(optional_reasons_localized, list)
            or not optional_reasons_localized
        ):
            raise ValidationError(
                "analysis.reasons_localized must be a non-empty list"
            )
        if len(optional_reasons_localized) > 5:
            raise ValidationError("analysis.reasons_localized max 5 items")
        normalized["reasons_localized"] = [
            str(reason).strip() for reason in optional_reasons_localized
        ]

    traffic_reason = normalized["traffic_light_reason"]
    if traffic_reason is not None:
        if not isinstance(traffic_reason, str) or not traffic_reason.strip():
            raise ValidationError(
                "analysis.traffic_light_reason must be non-empty text"
            )
        normalized["traffic_light_reason"] = traffic_reason.strip()

    return normalized


def validate_lookup_request(payload: Any) -> Dict[str, Any]:
    request_payload = require_dict(payload, "request")
    has_canonical_url = request_payload.get("canonical_url")
    has_page_url = request_payload.get("page_url")
    if not isinstance(has_canonical_url, str) and not isinstance(
        has_page_url, str
    ):
        raise ValidationError("request must include canonical_url or page_url")

    require_fields(
        request_payload,
        ["document_language", "locale", "snapshot"],
        "request",
    )

    snapshot = request_payload.get("snapshot")
    if not isinstance(snapshot, dict):
        raise ValidationError("request.snapshot must be an object")
    if not snapshot:
        raise ValidationError("request.snapshot must not be empty")

    canonical_url = request_payload.get("canonical_url")
    if not isinstance(canonical_url, str) or not canonical_url.strip():
        canonical_url = request_payload.get("page_url")

    return {
        "canonical_url": canonical_url,
        "document_language": require_locale(
            {"document_language": request_payload["document_language"]},
            "document_language",
        ),
        "locale": require_locale(request_payload, "locale"),
        "mistral_api_key": require_optional_string(
            request_payload, "mistral_api_key", "request", max_len=4096
        ),
        "snapshot": snapshot,
    }
