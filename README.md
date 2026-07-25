# ⚓ Anchor — Recovery & Prevention Platform

A multi-modal, GenAI-powered recovery and prevention platform for people navigating
substance use disorders **and** the caregivers supporting them. Built for the
PromptWars challenge (Google for Developers × Hack2Skill).

**Live demo:** https://34.14.134.236.sslip.io · **Stack:** Next.js 16 · TypeScript · Tailwind CSS 4 · Gemini API (`@google/genai`) · Google Maps

---

## Chosen vertical

**Recovery and Prevention Platform** — supporting individuals with substance use
disorders and their families with generative AI as the core engine, designed
specifically for moments when **cognitive load is highest**.

## The design principle behind everything: zero typing under stress

A person mid-craving or mid-panic cannot fill in forms. Every crisis-path
interaction in Anchor is a **single tap or a spoken word**:

| Requirement (from the problem statement) | Where it lives | How |
| --- | --- | --- |
| Zero-typing interventions | `/sos` | Six big situation buttons → instant step-by-step grounding script + guided breathing. No keyboard, ever. |
| Personalized emergency scripts | `/sos` + `/plan` | The on-device safety plan (name, substance, trusted contact, coping tools that have worked before) is attached to the AI request, so Gemini writes the script *for this person*, addressing them by name and using their own coping tools. |
| Generative AI as core engine | `app/api/generate` + `lib/gemini.ts` + `lib/prompts.ts` | Every feature (scripts, caregiver coaching, education, companion) is a task type routed through one audited Gemini surface with shared safety guardrails. |
| Multi-modal | `/companion` | Real-time **voice** conversation via Gemini Live (ephemeral-token architecture), with text + speech-synthesis fallback; visual breathing guidance; maps. |
| Educational resources | `/learn` | Curated, clinically-sane static content (works offline) + "Explain this simply" powered by Gemini per topic. |
| Contextual safety tools | `/nearby` | Geolocated Google Maps search for de-addiction centres, hospitals, pharmacies, counselling & AA/NA meetings + one-tap 24×7 helplines (National De-addiction 14446, Tele-MANAS, Vandrevala). |
| Empowering families/caregivers | `/caregiver` | "Say this, not that" scripts for hard moments (relapse, denial, boundaries, burnout) generated on demand. |

## Approach and logic

1. **One audited AI surface.** All prompts are built in `lib/prompts.ts` and all model
   calls go through `lib/gemini.ts` (server-only). Guardrails — never diagnose, never
   give medication advice, escalate emergencies to 112/helplines first — are enforced
   in the system prompt of *every* task type. Nothing reaches the model that is not
   constructed in that module.
2. **Personalization without accounts.** The safety plan lives in `localStorage`
   only. No sign-up, no server-side storage of health data. Only the fields the model
   needs are attached per-request (the supporter's phone number, for instance, never
   leaves the device — see `planToProfile`).
3. **Resilience by layering.** Every AI feature has a non-AI floor: the SOS flow
   shows a safe generic grounding script instantly while the personalized one loads
   (and keeps it if the network fails); the voice companion falls back to tap-to-talk
   chips + speech synthesis if a Live session can't be established; `/learn` content
   is fully readable offline; helplines are static `tel:` links. A broken flow never
   leaves a user in crisis with a spinner.
4. **Efficient by construction.** Requests are throttled by an O(1) token-bucket
   rate limiter (constant time and memory per client, no timer threads). Repeated
   generations (education explainers, common crisis scripts) are served from an
   in-memory TTL + LRU response cache instead of re-billing the model. The Gemini
   SDK client is a lazy singleton. On the client, the audio-reactive visuals run
   off `requestAnimationFrame` transform mutations — zero React re-renders per
   frame — and heavy audio code loads only on the voice page.
5. **Security is architectural, not decorative.** The Gemini key exists only
   server-side. The browser gets a **single-use, short-lived ephemeral token** for
   Live voice sessions (`app/api/live-token`). Requests are schema-validated and
   length-capped (`parseGenerateRequest`), rate-limited per client
   (`lib/rateLimit.ts`), and model output is rendered as plain text — never as HTML —
   eliminating injection-based XSS (`components/AiText.tsx`).

## How it works

```
Browser (React client components)
│
├── /sos, /learn, /caregiver ──► POST /api/generate ──► lib/prompts (validate+build)
│        one tap, no typing         rate-limited          └► lib/gemini ──► Gemini 2.5 Flash
│
├── /companion (voice) ──► POST /api/live-token ──► ephemeral token (single-use, 2 min window)
│        └── browser connects DIRECTLY to Gemini Live with the token:
│            mic 16 kHz PCM ──► Live session ──► 24 kHz audio replies (full duplex)
│
├── /nearby ──► Google Maps embed (geolocated category search) + tel: helplines
└── /plan ──► localStorage only (feeds personalization; clearable anytime)
```

### Run locally

```bash
npm install
cp .env.example .env.local   # add your GEMINI_API_KEY
npm run dev                  # http://localhost:3000
```

### Quality gates

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript strict
npm test           # Vitest unit tests (validation, rate limiting, rendering)
npm run build      # production build
```

## Accessibility

Designed for "diverse users and environments" as a first-class constraint, because
the target user may be shaking, crying, or cognitively flooded:

- Large touch targets and short sentences on every crisis path
- Semantic HTML, labeled controls, skip-link, keyboard operability, visible focus rings
- `aria-live` announcements for async AI content; `aria-busy` while loading
- `prefers-reduced-motion` respected (breathing animation degrades gracefully)
- Light/dark themes with WCAG-conscious contrast; screen-reader fallback link for the map embed

## Assumptions

- **India-first locale** (event context): emergency number 112, De-addiction 14446 / Tele-MANAS /
  Vandrevala helplines. Constants live in `lib/config.ts` for easy localization.
- Anchor is a **support tool, not a medical device**; it consistently routes
  emergencies to human help first and never gives clinical or medication advice.
- Single-instance in-memory rate limiting is acceptable for a demo deployment;
  a shared store (Redis) would replace it in production.
- The evaluator may not grant mic permissions, so every voice feature has an
  equivalent tap-only path.

## License

MIT — see [LICENSE](LICENSE).
