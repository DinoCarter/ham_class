# Progress

Multi-session build log. Read this first in any new session before continuing work.

## Status: Phase 2 (T1 template) — complete, pending your review

Deployed and live at https://dinocarter.github.io/ham_class/ (GitHub Pages,
deploy-from-`main` — enabled by user).

## What's built

**Data pipeline** (`data/`)
- Fetched current official pools directly from ncvec.org:
  - Technician (Element 2) 2026–2030 pool, public release **Feb 19 2026** (merges
    the Dec 18 2025 base release + Feb 19 2026 errata — 4 questions had text
    changes, all confirmed already merged into this PDF's body text).
    `https://ncvec.org/downloads/2026-2030 Technician Pool and Syllabus Public
    Release Feb 19 2026.pdf`
  - General (Element 3) 2023–2027 pool, **6th Errata, Feb 4 2026**.
    `https://ncvec.org/downloads/General Class Pool and Syllabus 2023-2027 Public
    Release with 6th Errata Feb 4 2026.pdf`
  - Both original PDFs archived in `data/source/` for re-verification.
- Parsed with `data/source/parse_pool.py` (pypdf text extraction + regex) into
  `data/technician.json` (409 questions) and `data/general.json` (423 active
  questions + 9 marked `deleted` in source, not included in the JSON: G1A04,
  G1C08, G1C09, G1C10, G1E09, G6B09, G8C01, G9C06, G9D13).
- Parsed subelement/group outlines with `data/source/parse_outline.py` into
  `data/technician-outline.json` / `data/general-outline.json` (10 subelements,
  35 groups each, titles + group descriptions).
- **Verification performed** (not just spot checks — every question):
  1. Every parsed `(question ID, answer letter)` pair regex-matched back against
     the raw extracted source text. 409/409 Technician and 423/423 General
     matched with zero mismatches.
  2. Per-subelement question counts cross-checked against each pool's own
     syllabus summary table. Technician matches exactly on all 10 subelements
     (68/37/35/23/50/46/44/47/23/36). General matches on 9/10 subelements; **G1
     shows 52 parsed vs. 54 in the syllabus table** — explained below, not a bug.
  3. Every subelement/group ID referenced in the outline exists in the question
     data and vice versa (35/35 groups both pools).
  4. Manually inspected multi-line question/answer reconstruction (longest
     questions in each pool) for line-wrap corruption — clean.
  5. Manually viewed all 4 reference diagrams after extraction — legible, labels
     match the component-ID questions that reference them.
- **Resolved discrepancy (General G1 count)**: the General pool PDF contains a
  syllabus summary block that is one errata revision behind the actual question
  body. It still counts G1A04 and G1C09 (54), but both are marked "Question
  Deleted" in the body itself (which reflects the 6th errata, the most recent).
  The body is authoritative for what's actually asked, so 52 active G1 questions
  is correct. Confirmed by checking each deletion's errata date against the
  syllabus block's position in the document.
- Reference diagrams extracted directly from official sources, not redrawn from
  memory:
  - Technician T-1, T-2, T-3: official JPGs linked from the NCVEC Technician pool
    page, saved to `data/source/diagrams/T1.jpg` / `T2.jpg` / `T3.jpg`.
  - General G7-1: the JPG link on the NCVEC page 404'd; extracted directly from
    the embedded image on the last page of the General pool PDF instead (via
    pypdf + Pillow), saved to `data/source/diagrams/G7-1.png`. Verified visually —
    matches the component numbering used in G7A09–G7A13.
  - These are raw sources for tracing, not final site assets. Traced SVGs belong
    in `/diagrams/` and get added when the subelement that uses them (T6 for the
    three Technician diagrams, G7 for G7-1) is built out — not done yet.

**Site skeleton**
- Design system locked in: **Amber Avionics Console** aesthetic (user choice) —
  charcoal-black background, amber primary accent with glow, green=correct/pass,
  red=alert, monospace for technical readouts (call-signs, question IDs, meters),
  system sans-serif for body text. All in `css/style.css`, no external fonts/CDNs.
- Shared JS (`js/nav.js`, `js/data.js`, `js/storage.js`): header/footer injection
  with active-page highlighting and mobile menu, JSON pool loading with caching,
  localStorage progress read/write helpers (namespaced key
  `ham-course-progress-v1`).
- Pages built: `index.html` (home), `technician.html` + `general.html` (live
  subelement listings pulled from the parsed JSON, with progress meters wired to
  localStorage), `dashboard.html` (per-subelement accuracy meters + quiz history
  table, reads live from localStorage).
- `technician.html` / `general.html` link each subelement card to
  `lessons/{exam}/{id}.html` — only `lessons/technician/t1.html` exists so far
  (built in Phase 2); the other 19 will 404 until later phases build them out.
  Per user: no need for placeholder stub pages.

## Phase 2 — T1 template (this checkpoint)

Built Technician subelement **T1 (Commission's Rules)** completely end-to-end as
the pattern for every other subelement. Review this before Phase 3 replicates it
19 more times.

**`lessons/technician/t1.html`** — full lesson content for all 6 groups
(T1A–T1F, 68 questions). Every regulatory claim is either a pool-verified
Q&A fact (already cross-checked in Phase 1) or a directly-quoted/verified 47 CFR
citation looked up this session (97.1 basis-and-purpose full text, the
28.0–28.3/28.3–28.5 MHz 10m mode split from 97.301(e)/97.305, the CW-anywhere
rule in 97.305(a)) — nothing paraphrased from memory. Each group section has a
plain-language explanation, a worked example, and a collapsible "covers
T1_01–T1_NN" block that renders the actual pool questions live from
`data/technician.json` (via `js/lesson.js`) rather than being hand-retyped, so
lesson prose can never drift from the verified data.

**Interactive element**: a keyboard-and-pointer operable frequency explorer
(`js/band-explorer.js`) over Technician's 28.000–28.500 MHz slice, showing the
data/RTTY vs. phone/image split live as you move the cursor. Built as a generic
reusable component (`HamBandExplorer.init(el, {minKHz, maxKHz, segments, ...})`)
so later "clickable band plan" needs (T9, General HF privileges) can reuse it
rather than rebuilding.

**Flashcard and quiz engines** (`js/flashcards.js`, `js/quiz.js`) — built
generic/data-driven rather than T1-specific, since the mechanics don't depend on
subelement: pick an exam + subelement (or "all") on `flashcards.html` /
`quiz.html`, or deep-link with `?exam=technician&subelement=T1` (used by T1's
"Practice" links). Flashcards self-grade and record to `HamStorage`; quiz mode
has two variants — subelement practice (all questions, untap timed) and **full
exam simulation** (35 questions, exactly one drawn per group — verified this
matches how VE exams are actually constructed: 35 groups total across each
pool's outline, confirmed in Phase 1 — not an approximated/even split across
subelements). Full-exam results are scored against the verified 26/35 (74%)
threshold and logged to quiz history on the dashboard.

**Glossary**: `glossary.html` now has 19 real terms introduced in T1 (Part 97,
control operator, control point, repeater, third-party communications, CW,
RACES, etc.), each linked from its first use in the lesson, with a client-side
filter box. Grows as later subelements are built.

**Not yet exercised end-to-end by a real automated click-through**: headless
Chrome CLI screenshots confirmed the lesson page, band explorer, and
flashcards/quiz auto-start (via query params) all render correctly with real
data. Full interactive flows (flipping every card, completing a full quiz,
checking the results screen) were verified by code review rather than scripted
browser automation — no Playwright/Puppeteer/chromium-cli available in this
environment. Worth a manual click-through pass in a real browser.

## Open items / flagged for your attention

- No accessibility pass done yet beyond baseline (semantic landmarks, skip link,
  focus-visible states, `prefers-reduced-motion`/`prefers-contrast` handled in
  CSS). A full pass (contrast audit, screen-reader run-through, keyboard-only
  nav test) is scheduled for Phase 5 per the build plan.
- Pool expiry reminder: Technician pool expires 6/30/2030, General pool expires
  6/30/2027. If picked up after those dates, check ncvec.org for a newer pool
  before adding content.

## Nothing currently flagged as factually unverified

Everything shipped so far — all 832 questions, both outlines, all 4 diagrams,
the 26/35 pass threshold, the T1 lesson's regulatory claims (47 CFR 97.1,
97.301(e), 97.303, 97.305(a)/(c), and every other citation in T1) — has been
checked against a primary source: either the pool PDFs directly, or 47 CFR via
Cornell's Legal Information Institute mirror of the eCFR. No invented or
approximated numbers.

## What's next — Phase 3

Build out the remaining Technician subelements, **T2–T0**, using the T1
pattern (assuming you're happy with T1's depth/tone/interactivity after
reviewing it). Checkpoint roughly every 3–4 subelements rather than all at
once, per the original build plan.
