# Link's Fairy

<p align="center">
  <a href="https://youtu.be/pWsfGoO9NTg" target="_blank" rel="noopener">
    <img width="560" alt="Link's Fairy demo" src="https://img.youtube.com/vi/pWsfGoO9NTg/hqdefault.jpg" />
  </a>
</p>

<p align="center">
  <a href="https://youtu.be/pWsfGoO9NTg">Watch the demo</a>
</p>

Collective AI for safer browsing.

Link's Fairy is a browser assistant that detects risky online pages, explains why in plain language, and lets the next user benefit from prior analysis.

## What problem are we solving?

People can be tricked by convincing but unsafe pages, domain confusion, manipulative purchase flows, and misleading information.

Most users need a simple signal before acting:

- is it likely safe,
- what smells suspicious,
- and what should I do now.

Current tools are often too technical, too generic, or too slow for normal browsing.

## What does this MVP do?

The MVP analyzes the current page context and returns:

- a short summary,
- readable reasons,
- a confidence-aware recommendation,
- a traffic-light signal,
- and a lightweight private feedback loop (`👍` / `👎`) with optional comments.

## Why this is different

Most tools analyze each user separately.

Link's Fairy stores a shared analysis result for a page, so the next user gets faster answers and lower cost, without re-running the full AI analysis every time.

## User flow

1. User opens a page.
2. Opens the extension popup.
3. Extension collects a compact page snapshot.
4. Backend checks cache.
5. If cache miss, backend generates analysis and stores it.
6. Result is shown immediately in popup with safe-language explanation.
7. Optional private feedback is sent back to improve future responses.

## Architecture

- **Frontend**: Chrome extension (Manifest V3) with popup, options and background worker.
- **Backend**: AWS API Gateway + Lambda (SAM).
- **Storage**: DynamoDB for shared analyses and feedback.
- **AI**: Mistral provides structured analysis and translation text.

### API surface

- `POST /v1/lookup`
  - Check cache and generate analysis if needed.
- `POST /v1/report`
  - Store lightweight private feedback.

## Design principles

- Plain language first.
- Explainability over technical jargon.
- Privacy by design.
- Cheap operations by reusing shared analysis.
- Community improvement over private-only scoring.

## Repository layout

- `backend/sam`: backend API, SAM template and Lambda handlers.
- `frontend/browser_extensions/chrome_extensions/linksfairy`: extension source.
- `scripts`: helper scripts.
- `demo`: place demo video and presentation assets.

## Vision beyond this MVP

This first version focuses on web safety and suspicious commerce flows. Long-term the same architecture can cover:

- concise summaries for long pages and videos,
- bias and manipulation detection,
- argument quality and misinformation checks,
- community-ranked safety notes.

The long-term vision remains: an **immune system for the mind**, starting from safer browsing.

## Safety notes

This is a prototype safety assistant.
It provides risk framing, not legal judgments.
Use it as decision support, not as definitive truth.

## Setup

- Configure AWS and Mistral credentials in your backend environment.
- Deploy backend with SAM.
- Load extension in Chrome developer mode.
