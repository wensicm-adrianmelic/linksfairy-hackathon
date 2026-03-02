from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, List
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


def canonicalize_url(raw_url: str) -> str:
    if not isinstance(raw_url, str):
        return ""

    normalized_url = raw_url.strip()
    if not normalized_url:
        return ""

    parsed = urlsplit(normalized_url)
    if not parsed.scheme or not parsed.netloc:
        return ""

    netloc = parsed.netloc.lower()
    path = parsed.path or "/"
    if len(path) > 1:
        path = path.rstrip("/")

    query_items = []
    for key, value in parse_qsl(parsed.query, keep_blank_values=True):
        lower_key = key.lower()
        if lower_key.startswith("utm_") or lower_key in {"fbclid", "gclid"}:
            continue
        query_items.append((key, value))

    query_items.sort(key=lambda item: item[0])
    query = urlencode(query_items, doseq=True)

    return urlunsplit((parsed.scheme.lower(), netloc, path, query, ""))


def _normalize_text(value: Any, max_length: int = 1200) -> str:
    if not isinstance(value, str):
        return ""
    clean_text = value.strip()
    if not clean_text:
        return ""
    return clean_text[:max_length]


def _normalize_list(value: Any, max_items: int = 10) -> List[str]:
    if not isinstance(value, list):
        return []

    normalized: List[str] = []
    for item in value:
        if not isinstance(item, str):
            continue
        clean_text = item.strip()
        if clean_text:
            normalized.append(clean_text)
        if len(normalized) >= max_items:
            break
    return normalized


def _normalize_map_value(value: Any) -> Any:
    if isinstance(value, dict):
        out: Dict[str, Any] = {}
        for key, item in value.items():
            if isinstance(item, (str, bool, int, float)):
                out[str(key)] = item
            elif isinstance(item, list):
                out[str(key)] = _normalize_list(item, max_items=10)
        return out
    if isinstance(value, list):
        return _normalize_list(value, max_items=10)
    return value


def normalize_snapshot_for_content_hash(snapshot: Any) -> Dict[str, Any]:
    if not isinstance(snapshot, dict):
        return {}

    normalized_snapshot: Dict[str, Any] = {}

    scalar_keys = [
        "canonical_tag",
        "visible_text",
        "text_excerpt",
        "meta_description",
        "meta_keywords",
        "document_language",
        "tld",
        "url_domain",
        "is_https",
        "contains_redirects",
        "contains_suspicious_keywords",
    ]
    for key in scalar_keys:
        text = _normalize_text(snapshot.get(key))
        if text:
            normalized_snapshot[key] = text
        elif isinstance(snapshot.get(key), bool):
            normalized_snapshot[key] = bool(snapshot.get(key))
        elif snapshot.get(key) is not None:
            normalized_snapshot[key] = snapshot.get(key)

    map_keys = [
        "headings",
        "links",
        "forms",
        "scripts",
        "iframes",
    ]
    for key in map_keys:
        normalized_value = _normalize_map_value(snapshot.get(key))
        if normalized_value:
            normalized_snapshot[key] = normalized_value

    return normalized_snapshot


def compute_content_hash(
    canonical_url: str, source_locale: str, snapshot: Dict[str, Any]
) -> str:
    digest_input = {
        "canonical_url": canonical_url,
        "source_locale": source_locale,
        "snapshot": normalize_snapshot_for_content_hash(snapshot),
    }
    serialized = json.dumps(
        digest_input, sort_keys=True, ensure_ascii=False, separators=(",", ":")
    )
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()
