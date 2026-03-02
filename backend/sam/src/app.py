from __future__ import annotations

import base64
import json
import os
import hashlib
from fnmatch import fnmatch
from typing import Any, Callable, Dict

from handlers import lookup
from handlers import report
from shared.dynamodb import serialize_decimal
from shared.dynamodb import get_table
from shared.validation import ValidationError

HANDLERS: Dict[str, Callable[..., Dict[str, Any]]] = {
    "/v1/lookup": lookup.handle,
    "/v1/report": report.handle,
}


def _extract_route(event: Dict[str, Any]) -> str:
    route_key = event.get("routeKey", "")
    if isinstance(route_key, str) and " " in route_key:
        route = route_key.split(" ", 1)[1]
    else:
        route = event.get("rawPath") or event.get("path", "")

    if not isinstance(route, str):
        return ""

    if route.find("/v1/") >= 0:
        route = route[route.find("/v1/") :]

    return route.lower().rstrip("/")


def _parse_body(event: Dict[str, Any]) -> Dict[str, Any]:
    body = event.get("body")
    if body is None:
        return {}
    if event.get("isBase64Encoded"):
        body = base64.b64decode(body).decode("utf-8")
    if not isinstance(body, str):
        if isinstance(body, dict):
            return body
        raise ValueError("Request body type not supported")
    body = body.strip()
    if not body:
        return {}
    return json.loads(body)


def _extract_origin(event: Dict[str, Any]) -> str:
    headers = event.get("headers", {})
    if not isinstance(headers, dict):
        return ""

    origin = headers.get("origin")
    if not isinstance(origin, str):
        origin = headers.get("Origin")
    if not isinstance(origin, str):
        return ""

    return origin.strip()


def _extract_headers(event: Dict[str, Any]) -> Dict[str, str]:
    raw_headers = event.get("headers")
    if not isinstance(raw_headers, dict):
        return {}

    normalized: Dict[str, str] = {}
    for key, value in raw_headers.items():
        if isinstance(value, str):
            normalized[str(key).strip().lower()] = value
    return normalized


def _extract_client_install_id(event: Dict[str, Any], payload: Dict[str, Any]) -> str | None:
    raw_body_id = (
        payload.get("client_install_id")
        if isinstance(payload, dict)
        else None
    )
    if isinstance(raw_body_id, str):
        body_id = raw_body_id.strip()
        if body_id:
            return body_id

    raw_body_alt_id = (
        payload.get("clientInstallId")
        if isinstance(payload, dict)
        else None
    )
    if isinstance(raw_body_alt_id, str):
        alt_body_id = raw_body_alt_id.strip()
        if alt_body_id:
            return alt_body_id

    headers = _extract_headers(event)
    raw_header_id = (
        headers.get("x-client-install-id")
        or headers.get("x-install-id")
        or headers.get("x-client-id")
    )
    if isinstance(raw_header_id, str):
        header_id = raw_header_id.strip()
        if header_id:
            return header_id

    source_ip = None
    request_context = event.get("requestContext") or {}
    if isinstance(request_context, dict):
        http_context = request_context.get("http") or {}
        if isinstance(http_context, dict):
            raw_ip = http_context.get("sourceIp")
            if isinstance(raw_ip, str):
                source_ip = raw_ip.strip()

    raw_user_agent = headers.get("user-agent")
    if source_ip and isinstance(raw_user_agent, str):
        normalized_ua = raw_user_agent.strip().lower()
        if normalized_ua:
            digest = hashlib.sha256(f"{source_ip}|{normalized_ua}".encode("utf-8")).hexdigest()
            return digest

    return None


def _resolve_allowed_origin(event: Dict[str, Any]) -> str:
    configured = os.environ.get("ALLOWED_ORIGINS", "*").strip()
    if configured == "*":
        return "*"

    request_origin = _extract_origin(event)
    if not request_origin:
        return "null"

    allow_patterns = [part.strip() for part in configured.split(",") if part.strip()]
    for pattern in allow_patterns:
        if fnmatch(request_origin, pattern):
            return request_origin

    return "null"


def _build_response(
    status_code: int, payload: Dict[str, Any], event: Dict[str, Any]
) -> Dict[str, Any]:
    allowed_origin = _resolve_allowed_origin(event)
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": allowed_origin,
        "Access-Control-Allow-Headers": "content-type,x-requested-with",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
        "Vary": "Origin",
    }
    return {
        "statusCode": status_code,
        "headers": headers,
        "body": json.dumps(serialize_decimal(payload)),
    }


def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    try:
        config = {
            "table_name": os.environ["TABLE_NAME"],
            "analysis_ttl_seconds": int(os.environ["ANALYSIS_TTL_SECONDS"]),
            "analysis_version_default": os.environ["ANALYSIS_VERSION"],
            "mistral_parameter_name": os.environ["MISTRAL_PARAMETER_NAME"],
            "mistral_model": os.environ["MISTRAL_MODEL"],
            "mistral_translation_model": os.environ.get(
                "MISTRAL_TRANSLATION_MODEL",
                os.environ["MISTRAL_MODEL"],
            ),
            "mistral_request_timeout_seconds": int(
                os.environ.get("MISTRAL_REQUEST_TIMEOUT_SECONDS", "12")
            ),
        }
        table = get_table(config["table_name"])

        route = _extract_route(event)
        handler = HANDLERS.get(route)
        if not handler:
            return _build_response(
                404,
                {"error": "Not found", "path": route},
                event,
            )

        payload = _parse_body(event)
        client_install_id = _extract_client_install_id(event, payload if isinstance(payload, dict) else {})
        if client_install_id and isinstance(payload, dict):
            payload["client_install_id"] = client_install_id
        response = handler(payload, table, config)
        return _build_response(200, response, event)
    except ValidationError as err:
        return _build_response(400, {"error": str(err)}, event)
    except json.JSONDecodeError:
        return _build_response(400, {"error": "Invalid JSON body"}, event)
    except KeyError as err:
        return _build_response(
            500,
            {"error": f"Missing runtime config: {err}"},
            event,
        )
    except Exception:
        return _build_response(500, {"error": "Internal server error"}, event)
