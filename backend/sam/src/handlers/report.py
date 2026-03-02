from __future__ import annotations

import re
import uuid
from typing import Any, Dict, Optional, Tuple

from shared.canonicalize import canonicalize_url
from shared.dynamodb import (
    build_report_sk,
    iso_now,
    now_epoch,
    query_report_reason_counts_for_analysis,
    query_analyses_for_hash,
    query_latest_analysis,
)
from shared.validation import ValidationError, require_dict, require_locale

REPORT_REASON_ALLOWED = {
    "incorrect_result",
    "false_positive",
    "false_negative",
    "unsafe_not_detected",
    "wrong_justification",
    "other",
}
FEEDBACK_ALLOWED = {"up", "down"}
REPORT_TTL_SECONDS = 60 * 60 * 24 * 180
CONTENT_HASH_PATTERN = re.compile(r"^[0-9a-f]{64}$")
NEGATIVE_REPORT_REASONS = {
    "incorrect_result",
    "false_positive",
    "false_negative",
    "unsafe_not_detected",
    "wrong_justification",
}


def _report_sort_tuple(sort_key: str) -> tuple[int, str]:
    parts = sort_key.split("#")
    if len(parts) >= 3:
        try:
            return (int(parts[2]), sort_key)
        except ValueError:
            return (0, sort_key)
    return (0, sort_key)


def _trim_text(value: Any) -> str:
    return value.strip() if isinstance(value, str) else ""


def _parse_analysis_id(value: str) -> Tuple[str, str, str]:
    parts = value.split("|")
    if len(parts) < 3:
        raise ValidationError(
            "analysis_id must follow format canonical_url|analysis_version|content_hash"
        )

    canonical_url = canonicalize_url(parts[0])
    analysis_version = _trim_text(parts[1])
    content_hash = _trim_text(parts[2]).lower()

    if not canonical_url:
        raise ValidationError("analysis_id canonical_url is invalid")
    if not analysis_version:
        raise ValidationError("analysis_id analysis_version is invalid")
    if not CONTENT_HASH_PATTERN.match(content_hash):
        raise ValidationError("analysis_id content_hash is invalid")

    return canonical_url, analysis_version, content_hash


def _validate_reason(payload: Dict[str, Any]) -> str:
    reason = _trim_text(payload.get("reason")).lower()
    if not reason:
        raise ValidationError("request.reason must be a non-empty string")
    if reason not in REPORT_REASON_ALLOWED:
        raise ValidationError(
            "request.reason must be one of: "
            + ", ".join(sorted(REPORT_REASON_ALLOWED))
        )
    return reason


def _validate_comment(payload: Dict[str, Any]) -> Optional[str]:
    comment = payload.get("comment")
    if comment is None:
        return None
    if not isinstance(comment, str):
        raise ValidationError("request.comment must be a string")
    cleaned = comment.strip()
    if not cleaned:
        return None
    if len(cleaned) > 1500:
        raise ValidationError("request.comment exceeds max length 1500")
    return cleaned


def _normalize_feedback(payload: Dict[str, Any]) -> Optional[str]:
    raw_feedback = _trim_text(payload.get("feedback")).lower()
    if not raw_feedback:
        return None

    aliases = {
        "up": "up",
        "yes": "up",
        "thumbs_up": "up",
        "pulgares hacia arriba": "up",
        "hacia arriba": "up",
        "arriba": "up",
        "down": "down",
        "no": "down",
        "thumbs_down": "down",
        "pulgares hacia abajo": "down",
        "hacia abajo": "down",
        "abajo": "down",
    }
    normalized = aliases.get(raw_feedback, "")
    if not normalized:
        raise ValidationError(
            "feedback must be one of: up, down (aliases supported)"
        )
    if normalized not in FEEDBACK_ALLOWED:
        raise ValidationError("feedback must be up or down")
    return normalized


def _validate_client_install_id(payload: Dict[str, Any]) -> Optional[str]:
    raw_client_install_id = _trim_text(payload.get("client_install_id"))
    if not raw_client_install_id:
        return None

    if len(raw_client_install_id) > 255:
        raise ValidationError("request.client_install_id is too long")
    return raw_client_install_id


def _resolve_report_target(
    payload: Dict[str, Any], config: Dict[str, Any]
) -> Dict[str, str]:
    raw_canonical = _trim_text(payload.get("canonical_url"))
    canonical_url = canonicalize_url(raw_canonical) if raw_canonical else ""
    analysis_id = _trim_text(payload.get("analysis_id"))

    parsed_from_analysis_id = None
    if analysis_id:
        parsed_from_analysis_id = _parse_analysis_id(analysis_id)
        canonical_from_id, analysis_version_from_id, content_hash_from_id = (
            parsed_from_analysis_id
        )
        if canonical_url and canonical_url != canonical_from_id:
            raise ValidationError(
                "canonical_url does not match canonical_url embedded in analysis_id"
            )
        canonical_url = canonical_from_id
    if not canonical_url:
        raise ValidationError("request must include canonical_url or analysis_id")

    analysis_version = (
        parsed_from_analysis_id[1]
        if parsed_from_analysis_id
        else str(config.get("analysis_version_default", "")).strip() or "v1"
    )
    content_hash = parsed_from_analysis_id[2] if parsed_from_analysis_id else ""

    return {
        "canonical_url": canonical_url,
        "analysis_id": analysis_id,
        "analysis_version": analysis_version,
        "content_hash": content_hash,
    }


def _find_analysis_item_for_report(
    table,
    canonical_url: str,
    analysis_version: str,
    content_hash: str,
):
    if content_hash:
        matches = query_analyses_for_hash(
            table,
            canonical_url,
            analysis_version,
            content_hash,
            limit=1,
        )
        if matches:
            return matches[0]

    return query_latest_analysis(table, canonical_url, analysis_version)


def _resolve_feedback_counts_from_report_history(
    table,
    analysis_item: Dict[str, Any],
) -> Optional[Dict[str, int]]:
    canonical_url = _trim_text(analysis_item.get("canonical_url"))
    analysis_id = _trim_text(analysis_item.get("analysis_id"))
    analysis_version = _trim_text(analysis_item.get("analysis_version"))
    if not canonical_url or not analysis_id or not analysis_version:
        return None

    report_items = query_report_reason_counts_for_analysis(
        table,
        canonical_url=canonical_url,
        analysis_version=analysis_version,
        analysis_id=analysis_id,
        include_sk=True,
        include_client_install_id=True,
    )
    if not report_items:
        return None

    latest_vote_per_client: Dict[str, str] = {}
    latest_vote_key_per_client: Dict[str, str] = {}
    report_count = 0
    for report_item in report_items:
        sort_key = _trim_text(report_item.get("SK"))

        raw_feedback = _trim_text(report_item.get("feedback")).lower()
        raw_reason = _trim_text(report_item.get("reason")).lower()
        if raw_feedback in FEEDBACK_ALLOWED:
            vote = raw_feedback
        elif raw_reason == "other":
            vote = "up"
        elif raw_reason in NEGATIVE_REPORT_REASONS:
            vote = "down"
        else:
            continue

        client_key = _trim_text(report_item.get("client_install_id"))
        if not client_key:
            client_key = f":legacy:{sort_key or str(report_count)}"

        previous_key = latest_vote_key_per_client.get(client_key, "")
        if (not previous_key) or (
            _report_sort_tuple(sort_key) > _report_sort_tuple(previous_key)
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

    return {
        "up": up_votes,
        "down": down_votes,
        "total": up_votes + down_votes,
    }


def _resolve_latest_feedback_for_client(
    table,
    analysis_item: Dict[str, Any],
    client_install_id: str,
) -> str:
    if not client_install_id:
        return ""

    canonical_url = _trim_text(analysis_item.get("canonical_url"))
    analysis_version = _trim_text(analysis_item.get("analysis_version"))
    analysis_id = _trim_text(analysis_item.get("analysis_id"))
    if (
        not canonical_url
        or not analysis_version
    ):
        return ""

    previous_vote = _find_latest_feedback_record_for_client(
        table=table,
        canonical_url=canonical_url,
        analysis_version=analysis_version,
        analysis_id=analysis_id,
        client_install_id=client_install_id,
    )
    if not previous_vote:
        return ""

    raw_feedback = _trim_text(previous_vote.get("feedback"))
    return raw_feedback if raw_feedback in FEEDBACK_ALLOWED else ""


def _find_latest_feedback_record_for_client(
    table,
    canonical_url: str,
    analysis_version: str,
    analysis_id: str | None,
    client_install_id: str,
) -> Optional[Dict[str, str]]:
    if not canonical_url or not analysis_version or not client_install_id:
        return None

    report_items = query_report_reason_counts_for_analysis(
        table,
        canonical_url=canonical_url,
        analysis_version=analysis_version,
        analysis_id=analysis_id,
        client_install_id=client_install_id,
        scan_desc=True,
        include_sk=True,
    )
    latest_feedback: Optional[str] = None
    latest_sort_key = ""
    for report_item in report_items:
        feedback = _trim_text(report_item.get("feedback")).lower()
        if feedback not in FEEDBACK_ALLOWED:
            continue
        sort_key = _trim_text(report_item.get("SK"))
        if not sort_key:
            continue
        latest_feedback = feedback
        latest_sort_key = sort_key
        break

    if latest_feedback is not None:
        return {"feedback": latest_feedback, "sk": latest_sort_key}

    return None


def _sync_analysis_feedback_counts(
    table,
    analysis_item: Dict[str, Any],
) -> Dict[str, int]:
    report_counts = {
        "total": 0,
        "up": 0,
        "down": 0,
    }

    reconciled = _resolve_feedback_counts_from_report_history(
        table,
        analysis_item,
    )
    if reconciled:
        report_counts = reconciled

    table.update_item(
        Key={"PK": analysis_item["PK"], "SK": analysis_item["SK"]},
        UpdateExpression=(
            "SET report_count = :total, report_up_count = :up_count, "
            "report_down_count = :down_count, updated_at = :updated_at"
        ),
        ExpressionAttributeValues={
            ":total": report_counts["total"],
            ":up_count": report_counts["up"],
            ":down_count": report_counts["down"],
            ":updated_at": iso_now(),
        },
    )

    return report_counts


def handle(
    payload: Dict[str, Any], table, config: Dict[str, Any]
) -> Dict[str, Any]:
    request_payload = require_dict(payload, "request")
    locale = require_locale(request_payload, "locale")
    reason = _validate_reason(request_payload)
    comment = _validate_comment(request_payload)
    feedback = _normalize_feedback(request_payload)
    client_install_id = _validate_client_install_id(request_payload)
    target = _resolve_report_target(request_payload, config)

    canonical_url = target["canonical_url"]
    analysis_id = target["analysis_id"]
    analysis_version = target["analysis_version"]
    content_hash = target["content_hash"]

    timestamp = now_epoch()

    analysis_item = _find_analysis_item_for_report(
        table,
        canonical_url,
        analysis_version,
        content_hash,
    )
    if analysis_item and not analysis_id:
        analysis_id = _trim_text(analysis_item.get("analysis_id"))

    if analysis_item and feedback and client_install_id:
        previous_vote = _find_latest_feedback_record_for_client(
            table,
            canonical_url=canonical_url,
            analysis_version=analysis_version,
            analysis_id=analysis_id,
            client_install_id=client_install_id,
        )
        if previous_vote:
            previous_feedback = previous_vote.get("feedback")
            if previous_feedback == feedback:
                report_counts = _sync_analysis_feedback_counts(table, analysis_item)
                user_feedback = _trim_text(previous_feedback)
                return {
                    "status": "recorded",
                    "report_id": None,
                    "canonical_url": canonical_url,
                    "analysis_id": analysis_id or None,
                    "analysis_version": analysis_version,
                    "locale": locale,
                    "reason": reason,
                    "analysis_found": True,
                    "incremented_report_count": False,
                    "report_count": report_counts["total"],
                    "report_up_count": report_counts["up"],
                    "report_down_count": report_counts["down"],
                    "feedback_counts": report_counts,
                    "user_feedback": user_feedback,
                }

    report_id = str(uuid.uuid4())
    report_item = {
        "PK": f"URL#{canonical_url}",
        "SK": build_report_sk(analysis_version, timestamp, report_id),
        "type": "report",
        "report_id": report_id,
        "canonical_url": canonical_url,
        "analysis_version": analysis_version,
        "locale": locale,
        "reason": reason,
        "created_at": iso_now(),
        "updated_at": iso_now(),
        "ttl": timestamp + REPORT_TTL_SECONDS,
    }
    if feedback:
        report_item["feedback"] = feedback
    if analysis_id:
        report_item["analysis_id"] = analysis_id
    if content_hash:
        report_item["content_hash"] = content_hash
    if comment:
        report_item["comment"] = comment
    if client_install_id:
        report_item["client_install_id"] = client_install_id
    table.put_item(Item=report_item)

    report_counts = {"total": 0, "up": 0, "down": 0}
    analysis_found = analysis_item is not None

    if analysis_item:
        report_counts = _sync_analysis_feedback_counts(
            table,
            analysis_item,
        )
        if not analysis_id:
            analysis_id = _trim_text(analysis_item.get("analysis_id"))

    response = {
        "status": "recorded",
        "report_id": report_id,
        "canonical_url": canonical_url,
        "analysis_id": analysis_id or None,
        "analysis_version": analysis_version,
        "locale": locale,
        "reason": reason,
        "analysis_found": analysis_found,
        "incremented_report_count": analysis_found,
        "report_count": report_counts["total"] if analysis_found else None,
        "report_up_count": report_counts["up"] if analysis_found else None,
        "report_down_count": report_counts["down"] if analysis_found else None,
        "feedback_counts": report_counts if analysis_found else None,
        "user_feedback": (
            _resolve_latest_feedback_for_client(
                table,
                analysis_item,
                client_install_id or "",
            )
            if analysis_found and client_install_id
            else ""
        ),
    }
    return response
