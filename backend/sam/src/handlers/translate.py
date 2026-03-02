from __future__ import annotations

from typing import Any, Dict

from shared.canonicalize import canonicalize_url
from shared.dynamodb import (
    locale_variants,
    iso_now,
    query_analyses_for_hash,
    normalize_locale,
)
from shared.validation import (
    ValidationError,
    require_boolean,
    require_dict,
    require_fields,
    require_locale,
)


def _normalize_reasons(value: Any) -> list[str]:
    if not isinstance(value, list) or not value:
        raise ValidationError("reasons_localized must be a non-empty list")
    if len(value) > 5:
        raise ValidationError("reasons_localized max 5 items")
    return [str(reason).strip() for reason in value if str(reason).strip()]


def _is_english_locale(locale: str) -> bool:
    return (locale or "").lower().startswith("en")


def _translation_candidates(locale: str) -> list[str]:
    normalized = normalize_locale(locale)
    if not normalized:
        return []

    locales: list[str] = []
    for candidate in locale_variants(normalized):
        if candidate not in locales:
            locales.append(candidate)
        candidate_with_underscore = candidate.replace("-", "_")
        if candidate_with_underscore not in locales:
            locales.append(candidate_with_underscore)
    return locales


def _find_translation(translations: Dict[str, Any], locale: str) -> Dict[str, Any]:
    if not isinstance(translations, dict):
        return {}

    for candidate in _translation_candidates(locale):
        translation = translations.get(candidate)
        if isinstance(translation, dict):
            return translation
    return {}


def _build_translation_payload(item: Dict[str, Any], locale: str) -> Dict[str, Any]:
    source_locale = item.get("source_locale", "en")
    if _is_english_locale(locale) and _is_english_locale(source_locale):
        return {
            "summary": item.get("summary_en"),
            "reasons": item.get("reasons_en", []),
            "source": "source_locale",
        }

    translation = _find_translation(item.get("translations", {}), locale)
    if translation:
        return {
            "summary": translation.get("summary"),
            "reasons": translation.get("reasons", []),
            "source": "translation_cache",
        }
    return {}


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

def handle(payload: Dict[str, Any], table, _config: Dict[str, Any]) -> Dict[str, Any]:
    payload = require_dict(payload, "request")
    require_fields(
        payload,
        ["canonical_url", "analysis_version", "content_hash", "locale"],
        "request",
    )

    canonical_url = canonicalize_url(payload["canonical_url"])
    if not canonical_url:
        raise ValidationError("canonical_url is invalid")

    analysis_version = str(payload["analysis_version"]).strip()
    if not analysis_version:
        raise ValidationError("analysis_version is empty")

    content_hash = str(payload["content_hash"]).strip()
    if not content_hash:
        raise ValidationError("content_hash is empty")

    locale = normalize_locale(str(payload["locale"]))
    if not locale:
        raise ValidationError("locale is invalid")

    need_only = False
    if "need_only" in payload:
        need_only = require_boolean(payload, "need_only", "request")

    analysis_items = query_analyses_for_hash(
        table,
        canonical_url,
        analysis_version,
        content_hash,
        limit=1,
    )
    if not analysis_items:
        return {
            "status": "not_found",
            "ok": False,
            "message": "analysis_not_found",
        }

    item = analysis_items[0]
    current = _build_translation_payload(item, locale)

    incoming_summary = payload.get("summary_localized")
    incoming_reasons = payload.get("reasons_localized")
    if incoming_summary is not None or incoming_reasons is not None:
        if not isinstance(incoming_summary, str) or not incoming_summary.strip():
            raise ValidationError("summary_localized must be non-empty text")
        normalized_reasons = _normalize_reasons(incoming_reasons)
        translation = {
            "summary": incoming_summary.strip(),
            "reasons": normalized_reasons,
            "updated_at": iso_now(),
        }
        _store_locale_translation(table, item, locale, translation)
        return {
            "status": "stored",
            "ok": True,
            "locale": locale,
            "source_locale": item.get("source_locale", "en"),
            "translation": {
                "summary": translation["summary"],
                "reasons": translation["reasons"],
            },
        }

    if current:
        return {
            "status": "hit",
            "ok": True,
            "locale": locale,
            "source_locale": item.get("source_locale", "en"),
            "translation": current,
        }

    if need_only:
        return {
            "status": "missing",
            "ok": False,
            "locale": locale,
            "source_locale": item.get("source_locale", "en"),
            "action": "generate_and_send",
            "message": "translation_missing",
        }

    return {
        "status": "missing",
        "ok": False,
        "locale": locale,
        "source_locale": item.get("source_locale", "en"),
        "action": "generate_and_send",
        "message": "translation_missing",
    }
