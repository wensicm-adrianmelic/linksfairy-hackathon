from __future__ import annotations

from typing import Any, Dict

from shared.canonicalize import canonicalize_url
from shared.dynamodb import (
    build_analysis_pk,
    build_analysis_sk,
    locale_variants,
    normalize_locale,
    iso_now,
    now_epoch,
)
from shared.validation import (
    ValidationError,
    require_dict,
    require_fields,
    require_locale,
    validate_analysis_payload,
)


def _normalize_snapshot(snapshot: Any) -> Dict[str, Any]:
    if not isinstance(snapshot, dict):
        return {}
    allowed = [
        "title",
        "hostname",
        "lang",
        "meta_description",
        "text_excerpt",
    ]
    out: Dict[str, Any] = {}
    for key in allowed:
        value = snapshot.get(key)
        if isinstance(value, str) and value.strip():
            out[key] = value.strip()
    return out


def _is_english_locale(locale: str) -> bool:
    return (locale or "").lower().startswith("en")


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


def handle(payload: Dict[str, Any], table, config: Dict[str, Any]) -> Dict[str, Any]:
    payload = require_dict(payload, "request")
    require_fields(
        payload,
        [
            "url",
            "canonical_url",
            "content_hash",
            "locale",
            "analysis_version",
            "analysis",
        ],
        "request",
    )

    canonical_url = canonicalize_url(payload["canonical_url"])
    if not canonical_url:
        raise ValidationError("canonical_url is invalid")

    url = str(payload["url"]).strip()
    if not url:
        raise ValidationError("url is empty")

    content_hash = str(payload["content_hash"]).strip()
    if not content_hash:
        raise ValidationError("content_hash is empty")

    source_locale = normalize_locale(
        require_locale({"locale": payload["locale"]}, "locale")
    )
    if not source_locale:
        raise ValidationError("locale is invalid")
    analysis_version = str(payload["analysis_version"]).strip() or config[
        "analysis_version_default"
    ]
    analysis = validate_analysis_payload(payload["analysis"])

    created_at = now_epoch()
    ttl_seconds = int(config["analysis_ttl_seconds"])
    item_id = build_analysis_sk(analysis_version, content_hash, created_at)

    translations: Dict[str, Dict[str, Any]] = {}
    summary_localized = analysis.get("summary_localized")
    reasons_localized = analysis.get("reasons_localized")

    _add_translation(
        translations,
        "en",
        analysis["summary_en"],
        analysis["reasons_en"],
        analysis["recommended_action_text_en"],
        analysis.get("purchase_recommendation_text_en"),
    )

    if (
        not _is_english_locale(source_locale)
        and isinstance(summary_localized, str)
        and summary_localized.strip()
        and isinstance(reasons_localized, list)
        and reasons_localized
    ):
        localized_recommendation_text = analysis.get(
            "recommended_action_text_localized"
        ) or analysis.get("overall_advice_text")
        _add_translation(
            translations,
            source_locale,
            summary_localized.strip(),
            [str(reason).strip() for reason in reasons_localized],
            localized_recommendation_text,
            analysis.get("purchase_recommendation_text"),
        )

    status = payload.get("status", "published")
    if status not in {"published", "pending", "stale"}:
        raise ValidationError("status must be published/pending/stale")

    item = {
        "PK": build_analysis_pk(canonical_url),
        "SK": item_id,
        "type": "analysis",
        "analysis_version": analysis_version,
        "content_hash": content_hash,
        "url": url,
        "canonical_url": canonical_url,
        "hostname": payload.get("hostname"),
        "model": payload.get("model"),
        "status": status,
        "source_locale": source_locale,
        "created_at": iso_now(),
        "updated_at": iso_now(),
        "ttl": created_at + ttl_seconds,
        "expires_at": created_at + ttl_seconds,
        "snapshot": _normalize_snapshot(payload.get("snapshot")),
        "scores": analysis["scores"],
        "summary_en": analysis["summary_en"],
        "reasons_en": analysis["reasons_en"],
        "summary_localized": summary_localized
        if isinstance(summary_localized, str)
        else None,
        "reasons_localized": reasons_localized
        if isinstance(reasons_localized, list)
        else None,
        "notable_signals": analysis.get("notable_signals"),
        "recommended_action": analysis["recommended_action"],
        "translations": translations,
        "report_count": 0,
        "confirmations": 0,
    }
    if analysis.get("polarization_risk") is not None:
        item["scores"]["polarization_risk"] = analysis["polarization_risk"]

    if item["hostname"] is not None and not str(item["hostname"]).strip():
        item["hostname"] = None

    table.put_item(Item=item)

    return {
        "ok": True,
        "id": f"{canonical_url}|{analysis_version}|{content_hash}",
        "stored_locale": source_locale,
        "status": status,
    }
