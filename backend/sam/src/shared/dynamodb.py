from __future__ import annotations

import time
from collections.abc import Mapping
from decimal import Decimal
from typing import Any, Dict, List, Optional

import boto3
from boto3.dynamodb.conditions import Attr, Key


def get_table(table_name: str):
    return boto3.resource("dynamodb").Table(table_name)


def now_epoch() -> int:
    return int(time.time())


def iso_now() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def build_analysis_pk(canonical_url: str) -> str:
    return f"URL#{canonical_url}"


def build_analysis_sk(
    analysis_version: str, content_hash: str, created_at: int
) -> str:
    return f"ANALYSIS#{analysis_version}#{content_hash}#{created_at}"


def build_report_sk(
    analysis_version: str, created_at: int, report_id: str
) -> str:
    return f"REPORT#{analysis_version}#{created_at}#{report_id}"


def normalize_locale(locale: str) -> str:
    raw_locale = (locale or "").strip().replace("_", "-").lower()
    if not raw_locale:
        return ""

    parts = [part.strip() for part in raw_locale.split("-") if part.strip()]
    if not parts:
        return ""

    return "-".join(parts)


def locale_variants(locale: str) -> List[str]:
    normalized = normalize_locale(locale)
    if not normalized:
        return []

    language = normalized.split("-", 1)[0]
    if language == normalized:
        return [language]

    return [normalized, language]


def query_analyses_for_hash(
    table,
    canonical_url: str,
    analysis_version: str,
    content_hash: str,
    limit: int = 5,
) -> List[Dict[str, Any]]:
    pk = build_analysis_pk(canonical_url)
    prefix = f"ANALYSIS#{analysis_version}#{content_hash}#"
    resp = table.query(
        KeyConditionExpression=(
            Key("PK").eq(pk) & Key("SK").begins_with(prefix)
        ),
        ScanIndexForward=False,
        Limit=limit,
    )
    return resp.get("Items", [])


def query_latest_any_analysis(
    table,
    canonical_url: str,
    analysis_version: str,
    limit: int = 20,
) -> List[Dict[str, Any]]:
    pk = build_analysis_pk(canonical_url)
    prefix = f"ANALYSIS#{analysis_version}#"
    resp = table.query(
        KeyConditionExpression=(
            Key("PK").eq(pk) & Key("SK").begins_with(prefix)
        ),
        ScanIndexForward=False,
        Limit=limit,
    )
    return resp.get("Items", [])


def query_latest_analysis(
    table,
    canonical_url: str,
    analysis_version: str,
) -> Optional[Dict[str, Any]]:
    items = query_latest_any_analysis(
        table,
        canonical_url,
        analysis_version,
        limit=1,
    )
    return items[0] if items else None


def query_report_reason_counts_for_analysis(
    table,
    canonical_url: str,
    analysis_version: str,
    analysis_id: str | None = None,
    client_install_id: str | None = None,
    scan_desc: bool = False,
    include_sk: bool = False,
    include_client_install_id: bool = False,
) -> List[Dict[str, Any]]:
    pk = build_analysis_pk(canonical_url)
    prefix = f"REPORT#{analysis_version}#"

    key_condition = Key("PK").eq(pk) & Key("SK").begins_with(prefix)
    expression_names = {
        "#reason": "reason",
        "#feedback": "feedback",
    }
    projection_fields = ["#reason", "#feedback"]
    if include_client_install_id:
        expression_names["#client_install_id"] = "client_install_id"
        if "#client_install_id" not in projection_fields:
            projection_fields.append("#client_install_id")
    if include_sk:
        expression_names["#sort_key"] = "SK"
        projection_fields.append("#sort_key")
    if client_install_id:
        expression_names["#client_install_id"] = "client_install_id"
        projection_fields.append("#client_install_id")

    filter_expression = Attr("type").eq("report")
    if analysis_id:
        filter_expression = filter_expression & Attr("analysis_id").eq(analysis_id)
    if client_install_id:
        filter_expression = filter_expression & Attr("client_install_id").eq(client_install_id)

    items: List[Dict[str, Any]] = []
    pagination = None
    projection_expression = ", ".join(projection_fields)

    while True:
        kwargs = {
            "KeyConditionExpression": key_condition,
            "FilterExpression": filter_expression,
            "ProjectionExpression": projection_expression,
            "ExpressionAttributeNames": expression_names,
            "ScanIndexForward": not scan_desc,
        }
        if pagination is not None:
            kwargs["ExclusiveStartKey"] = pagination
        response = table.query(**kwargs)
        items.extend(response.get("Items", []))

        pagination = response.get("LastEvaluatedKey")
        if not pagination:
            break

    return items


def upsert_analysis_translation(
    table,
    item: Mapping[str, Any],
    locale: str,
    translation_summary: str,
    translation_reasons: List[str],
    translation_recommended_action_text: str,
    translation_purchase_recommendation_text: str | None = None,
) -> None:
    if not isinstance(item, Mapping):
        return
    table.update_item(
        Key={"PK": item["PK"], "SK": item["SK"]},
        UpdateExpression=(
            "SET translations.#locale = :translation, "
            "updated_at = :updated_at"
        ),
        ExpressionAttributeNames={"#locale": locale},
        ExpressionAttributeValues={
            ":translation": {
                "summary": translation_summary,
                "reasons": translation_reasons,
                "recommended_action_text": translation_recommended_action_text,
                "purchase_recommendation_text": translation_purchase_recommendation_text,
            },
            ":updated_at": iso_now(),
        },
    )


def serialize_decimal(value: Any) -> Any:
    if isinstance(value, Decimal):
        if value == value.to_integral():
            return int(value)
        return float(value)
    if isinstance(value, list):
        return [serialize_decimal(v) for v in value]
    if isinstance(value, Mapping):
        return {k: serialize_decimal(v) for k, v in value.items()}
    return value


def _to_int_or_default(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default
