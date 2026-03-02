# Link's Fairy Backend (SAM + Python)

Backend deployed in `eu-west-1` with:

- HTTP API Gateway
- 1 Lambda (`BackendFunction`)
- DynamoDB single-table storage with TTL

## Active endpoints

This version exposes only **2 routes**:

1. `POST /v1/lookup`
2. `POST /v1/report`

`submit-analysis` and `translate` are not exposed in this API.

## Contract for `POST /v1/lookup`

Minimum request fields:

- `canonical_url` or `page_url`
- `document_language` (example: `es-ES`)
- `locale` (example: `es-ES`, `en-US`)
- `snapshot` (non-empty object)
- `mistral_api_key` optional (BYOK for testing)

Main response fields:

- `status` (`hit` or `generated`)
- `cache_hit` (`true/false`)
- `fresh`
- `analysis`:
  - `scores.risk` (0..10)
  - `scores.scam_risk` (0..10)
  - `scores.manipulation_pressure_risk` (0..10)
  - `scores.privacy_risk` (0..10)
  - `scores.confidence` (0..10)
  - `summary` (markdown)
  - `reasons` (markdown array)
  - `overall_advice`
  - `overall_advice_text`
  - `traffic_light`
  - `traffic_light_reason`
  - `recommended_action` (legacy compatible)
  - `recommended_action_text` (legacy compatible)
- `analysis_id`
- `canonical_url`
- `created_at`
- `expires_at`
- `analysis_version`
- `analysis_quality` (`valid` or `fallback`)

## Contract for `POST /v1/report`

Request:

- `canonical_url` or `analysis_id`
- `reason` (one of: `incorrect_result`, `false_positive`, `false_negative`, `unsafe_not_detected`, `wrong_justification`, `other`)
- `locale`
- `comment` optional

Behavior:

- Stores a `type=report` record in DynamoDB.
- Tries to resolve the target analysis and runs `ADD report_count :1` when matched.

Response:

- `status: recorded`
- `report_id`
- `canonical_url`
- `analysis_id` (if resolvable)
- `analysis_found` (bool)
- `incremented_report_count` (bool)
- `report_count` (when applicable)

## Deployment

From `backend/sam`:

```powershell
sam build
sam deploy --guided --region eu-west-1
```

Or directly:

```powershell
sam deploy --region eu-west-1 --capabilities CAPABILITY_IAM
```

## Key parameters

- `StageName` (default `prod`)
- `AnalysisTableName` (default `linksfairy-kv`)
- `AnalysisTtlSeconds` (default `604800`)
- `AnalysisVersion` (default `v1.1`)
- `MistralParameterName` (default `mistral-dev`)
- `MistralModel` / `MistralTranslationModel`
- `MistralRequestTimeoutSeconds`
- `CorsAllowOrigins` (comma-separated list; default `*`)

## CORS notes

- API Gateway uses `CorsAllowOrigins`.
- Lambda also applies origin filtering through `ALLOWED_ORIGINS` (derived from the same parameter).
