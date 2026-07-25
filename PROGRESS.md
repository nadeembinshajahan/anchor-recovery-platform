# Engineering log — Pulari

A phased record of how this project was built during PromptWars (Trivandrum,
July 2026), from scaffold to the platform that exists today. Each phase notes
what was built and why it was built that way.

## Phase 1 — Scaffold and first complete platform

*Commits: `02a755f`, `35d7eed`, `14d4b99`*

- Next.js 16 + TypeScript + Tailwind scaffold, then the full feature set in a
  single pass: zero-typing SOS flows, the Gemini Live voice companion,
  caregiver coaching, curated education, geolocated nearby-help, and the
  on-device safety plan.
- Two architectural decisions made on day one and never reversed:
  **one audited AI surface** (every prompt built in `lib/prompts.ts`, every
  model call through `lib/gemini.ts`, server-side only) and **privacy without
  accounts** (the safety plan lives in `localStorage`; the supporter's phone
  number never leaves the device).
- Deployed to a GCP Compute Engine VM behind Caddy with automatic HTTPS —
  chosen over serverless because the voice feature needs reliable WebSocket
  behavior, and browsers require a secure context for microphone access.

## Phase 2 — Design system and audio-reactive voice

*Commits: `f916a52`, `d2dd0d1`*

- Full visual redesign: warm gradient backdrop, frosted-glass cards, sidebar
  navigation, staggered motion with `prefers-reduced-motion` respected.
- The voice page became the centerpiece: an orb driven by real audio
  amplitude — `AnalyserNode` taps on both the microphone and the model's
  playback bus, rendered via `requestAnimationFrame` transform mutation so
  there are zero React re-renders per animation frame.
- Voice output language policy set to "mirror the speaker": English by
  default, reply in Malayalam/Hindi/Tamil when spoken to in them.

## Phase 3 — Efficiency and hardening

*Commits: `ca85e69`, `96138d2`, `0016c41`*

- Replaced the O(n) sliding-window rate limiter with an **O(1) token
  bucket** (constant time and memory per client, lazy refill, bounded keys).
- Added a **TTL + LRU response cache** keyed on task + context + full
  profile (personalized scripts can never leak between users) and
  **single-flight coalescing** so identical concurrent requests share one
  model call.
- Generation timeouts, `Retry-After` on 429s, request body size caps,
  security headers, a lazy singleton SDK client, and an 8× reduction in
  audio worklet message traffic.
- Test suite grew from 24 to 60, adding direct POST-handler coverage:
  rate-limit behavior, cache semantics, error sanitization.

## Phase 4 — The sunshine redesign and integration fixes

*Commits: `75486ed`, `8ea8c31`*

- Second visual iteration ("sunshine glass"): serif display type, sunrise
  palette, manual theme toggle, refined cards and forms.
- Replaced the retired KIRAN helpline with the National De-addiction
  Helpline **14446** everywhere — helpline data is static configuration,
  never model-generated.

## Phase 5 — Prevention, citations, dark mode, and the rename

*Commit: `ef6628b`*

- **Prevention became a first-class flow** (`/prevent`): name an upcoming
  high-risk event and get before/day-of steps, a word-for-word exit line, an
  ally ask, and early warning signs.
- **Anti-hallucination citations**: generated education and coaching may cite
  only a hand-verified source catalogue (`lib/sources.ts` — WHO, NIDA,
  NIMHANS, Vimukthi, Tele-MANAS); unknown citation ids are structurally
  dropped before rendering.
- OS-level dark mode restored on top of the sunrise theme with AA+ contrast
  throughout.
- Voice model pinned to `gemini-2.5-flash-native-audio-latest` after direct
  repro showed the 3.1 live preview dropping connections (server 1011); text
  generation moved to `gemini-3.6-flash` with thinking capped at minimal so
  reasoning tokens cannot truncate crisis answers.
- All four feature components adopted the shared `useGenerate` hook,
  removing ~55 lines of duplicated fetch plumbing. Renamed **Anchor →
  Pulari** (പുലരി — dawn).

## Phase 6 — Language personalization

*Commit: `8ba6bf4`*

- One-tap response-language preference (English / മലയാളം / हिन्दी / தமிழ்)
  on the safety plan, validated server-side against an allowlist, flowing
  through every generation with correct `lang` attributes for screen readers
  and matching speech-synthesis locales.
- The voice companion now **speaks first** on connect — a warm greeting, by
  name and in the preferred language, instead of silence.

## Phase 7 — Structure and contracts (current)

- Split the design-system stylesheet into focused partials and oversized
  modules into single-purpose files.
- Moved request validation to zod schemas behind the same public API,
  added typed env access (`lib/env.ts`), a `/api/health` probe, this log,
  and a multi-stage Dockerfile for container deployment.
- Broadened tests beyond units and route handlers to component renders and
  page-level accessibility assertions.
