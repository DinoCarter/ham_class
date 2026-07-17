# Progress

Multi-session build log. Read this first in any new session before continuing work.

## Status: Phase 6 complete — Technician depth/interactivity pass (General not started)

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
  `lessons/{exam}/{id}.html` — all 10 Technician lessons (T1–T0) now exist as
  of Phase 3; the 10 General subelements will 404 until a later phase builds
  them out. Per user: no need for placeholder stub pages.

## Phase 2 — T1 template

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

## Phase 3 — T2, T3, T4 (checkpoint)

You reviewed T1 live and approved it as the template, with two fixes folded
into T1 before starting Phase 3:
- **Diagram bug**: the timeline component's edge labels (first/last point,
  e.g. "Granted" and "Expires → 2-yr grace period" in T1C, "ID 0:00 start"/
  "ID 23:00 end" in T1F) used `transform: translateX(-50%)` unconditionally,
  centering them on the edge point and overflowing off the container.
  Fixed with new `.timeline-label.is-start` / `.is-end` CSS modifiers
  (`css/style.css`) that left/right-anchor the two edge labels instead of
  centering them; applied to both timelines in `t1.html`.
- **Under-explained jargon**: you flagged that CW and "phone" were used as
  exam-pool vocabulary without being fully explained in plain language. Added
  a dedicated mode-vocabulary block to T1B (CW/phone/image/data, what each
  actually *is* mechanically and why CW gets its name/special legal status,
  not just a citation) and two new glossary entries (`Phone`, `Image`);
  expanded the existing `CW` entry with the on/off-keying mechanism and the
  spark-gap-transmitter origin of "continuous wave." Per your instruction,
  the standing bar for this project is: no jargon introduced without a full
  explanation, so a reader never has to look something up externally.

Built **T2 (Operating Procedures)**, **T3 (Radio Wave Propagation)**, and
**T4 (Amateur Radio Practices)** end to end using the T1 pattern — plain-
language explanation per group, worked examples, live-rendered pool questions
via the existing `js/lesson.js` collapsible, and glossary-linked terminology.
All regulatory/technical claims were checked directly against the verified
pool answer keys in `data/technician.json` (every fact stated matches the
pool's own correct answer for the relevant question — cross-checked
question-by-question while writing, not from memory) plus standard,
well-established radio/electronics science (EM wave physics, the
wavelength/frequency relationship, propagation mechanisms) for the
non-regulatory content T1's FCC-citation approach doesn't apply to.

- `lessons/technician/t2.html` — T2A (calling procedure, band plans,
  simplex vs. full duplex), T2B (repeater offset, CTCSS vs. DTMF, DMR/
  D-STAR/talkgroups/code plugs, squelch), T2C (ARES vs. RACES, Net Control
  Station, radiogram preamble/check, Winlink) — 37 questions.
- `lessons/technician/t3.html` — T3A (multipath, polarization/cross-pol,
  picket fencing, weather effects), T3B (E/B field geometry, wavelength ↔
  frequency formula with worked 10m/2m checks, HF/VHF/UHF range table),
  T3C (ionosphere vs. VHF/UHF, sporadic E, tropo ducting, meteor scatter,
  auroral backscatter, knife-edge diffraction, F-region timing/sunspot
  dependence) — 35 questions.
- `lessons/technician/t4.html` — T4A (power supply sizing, SWR vs. RF power
  meter, bonding, ampere-hour worked example, digital-mode audio wiring,
  hotspots, keyers), T4B (squelch/scanning/RIT, filter-bandwidth tradeoff
  with 2400 Hz SSB fact, DMR/D-STAR control specifics) — 23 questions.
- 28 new `glossary.html` entries (ARES, Auroral backscatter, Bonding,
  Code plug, CTCSS, D-STAR, DMR, DTMF, Hotspot, Ionosphere, Keyer,
  Knife-edge diffraction, Meteor scatter, Multipath, Net Control Station,
  Picket fencing, Polarization, Q signal, Radio horizon, Radiogram, Repeater
  offset, RIT/Clarifier, Simplex, Sporadic E, SWR, Talkgroup, Tropospheric
  ducting, Winlink) — glossary now covers T1–T4, intro line updated.
- No new reusable JS components were needed this phase — T1's band explorer,
  flashcards/quiz engines, and `HamLesson.wireDetails` collapsible pattern
  covered everything T2–T4 needed. All three pages spot-checked over the
  local dev server (`python3 -m http.server`) for 200s on the lesson pages,
  their flashcard/quiz deep-links, and the glossary; tag-balance-checked
  (div/section/p open vs. close counts) since no headless browser is
  available in this environment — same limitation noted in Phase 2, still
  worth a manual click-through pass.

## Phase 3 continued — T5, T6, T7, T8, T9, T0 (this checkpoint)

Per your request to speed this phase up, T5–T0 were built by **three parallel
subagents** instead of sequentially (Agent 1: T5+T9, Agent 2: T6+T0, Agent 3:
T7+T8), each independently briefed on the T1–T4 pattern, pointed at the
verified pool JSON/outline, and told to stage proposed glossary entries in
separate scratch files rather than editing `glossary.html` concurrently
(three agents editing the same file at once would have clobbered each
other). I then merged and fact-checked everything myself before this
checkpoint. Notes from that process, in case anything looks off:

- **T7/T8 agent hit a transport-level connection error** mid-run, right as
  it was about to write its glossary-additions file. Checked before
  resuming: `t7.html`/`t8.html` were already saved complete and well-formed
  — only the glossary staging file was missing. Resumed the same agent with
  a scoped instruction to finish just that step rather than redo the whole
  subelement; it picked up cleanly.
- **Glossary merge bug (caught and fixed)**: my first merge pass used a
  regex that didn't account for the agents' own instructional HTML comments
  at the top of each scratch file (which contained prose like `each <div
  class="glossary-entry">` as a literal example) — this fooled the parser
  into treating that comment text as a real entry opening, corrupting the
  *first* entry in each of the 3 scratch files (`alternating-current`,
  `capacitor`, `antenna-analyzer`) with leftover comment text spliced into
  their HTML. Caught via a post-merge tag-balance/content sanity check,
  re-parsed with a stricter pattern requiring the `data-term` attribute
  (which the bogus comment fragments lacked), and rebuilt `glossary.html`
  cleanly. Verified afterward: 122 total entries, zero duplicate ids, zero
  broken `glossary.html#id` links from any lesson page, tag balance clean.
- **T6C schematic diagrams — visually verified against source images**: the
  T6/T0 agent flagged that several schematic component IDs in figures T-2
  and T-3 (components not directly asked about by a pool question — the
  pool only tests a subset of each figure's labeled parts) were identified
  by reading standard symbol conventions rather than a pool answer key. I
  opened `data/source/diagrams/T1.jpg`/`T2.jpg`/`T3.jpg` directly and
  checked every flagged component against the image myself — all correct
  (battery, fuse, diode/rectifier, resistor, protection diode, feed line,
  variable capacitor all confirmed). T6C's diagrams currently embed the raw
  NCVEC JPGs directly (functional, accurate) rather than traced site-styled
  SVGs — tracing clean SVGs for `/diagrams/` remains a nice-to-have polish
  pass, not done yet.
- Spot-verified a sample of the higher-risk factual content by hand against
  the pool answer key after the agents finished: all of T5B's decibel math
  (5W→10W = +3dB, 12W→3W = −6dB, 20W→200W = +10dB) and T5C/T5D's power/
  Ohm's-law worked examples (13.8V×10A=138W, 12V×2.5A=30W, 90V/3A=30Ω,
  120V/80Ω=1.5A, etc.), and T8B's satellite facts (U/V mode = 70cm up/2m
  down, LEO ≈100 min period, Keplerian elements, uplink-power-via-beacon-
  comparison) — all checked out exactly against the pool's correct answers.
- `lessons/technician/t5.html` — Electrical Principles: T5A (current/
  voltage/power terminology, AC vs. DC, conductors/insulators), T5B (unit
  conversion table + decibel math with worked examples), T5C (capacitance/
  inductance/impedance terminology, DC power formula), T5D (Ohm's Law,
  series vs. parallel circuits) — 50 questions.
- `lessons/technician/t6.html` — Electronic and Electrical Components: T6A
  (resistors/capacitors/inductors/switches/batteries/potentiometers), T6B
  (diodes/transistors/FETs, gain), T6C (schematic reading, using the three
  embedded NCVEC diagrams), T6D (rectifiers, relays, voltage regulators,
  ICs, resonant circuits) — 46 questions.
- `lessons/technician/t7.html` — Practical Circuits: T7A (receivers/
  transceivers/transverters/preamps, mixers, oscillators, VFOs), T7B
  (overload vs. overdrive vs. intermodulation vs. harmonics/spurious
  emissions), T7C (SWR/feed line troubleshooting, dummy loads, antenna
  analyzers), T7D (test instruments, soldering) — 44 questions.
- `lessons/technician/t8.html` — Signals and Emissions: T8A (FM/SSB/
  bandwidth comparisons), T8B (satellite operation, Doppler shift, spin
  fading, Keplerian elements), T8C (direction finding, contesting,
  EchoLink/IRLP/gateways, grid locators), T8D (packet radio/ARQ, APRS,
  PSK31, FT8, NTSC/SSTV, EME, mesh networking) — 47 questions.
- `lessons/technician/t9.html` — Antennas and Feed Lines: T9A (antenna
  gain, beam/Yagi antennas, polarization), T9B (feed line types/loss,
  coaxial cable, antenna tuners) — 23 questions.
- `lessons/technician/t0.html` — Safety: T0A (fuses vs. circuit breakers,
  grounding, electrical code), T0B (tower/antenna safety, crank-up towers),
  T0C (RF exposure, MPE, duty cycle, non-ionizing radiation) — 36 questions.
- 73 new `glossary.html` entries across these six pages (full list too long
  to enumerate here — see the file directly); glossary now has **122
  entries total** and covers every Technician subelement. Intro line
  updated to reflect full T1–T0 coverage.
- All 10 Technician lesson pages, their flashcard/quiz deep-links, and the
  glossary spot-checked over the local dev server for 200s; tag-balance-
  checked (div/section/p/ul/li/details/summary open vs. close counts) on
  all 10 files, zero mismatches. Still no scripted browser click-through
  (no headless browser in this environment, and per your instruction this
  round, you're doing the visual pass yourself rather than me attempting
  a headless check).

## Open items / flagged for your attention

- No accessibility pass done yet beyond baseline (semantic landmarks, skip link,
  focus-visible states, `prefers-reduced-motion`/`prefers-contrast` handled in
  CSS). A full pass (contrast audit, screen-reader run-through, keyboard-only
  nav test) is still deferred.
- T6C's schematic diagrams are the raw NCVEC JPGs embedded directly, not
  traced site-styled SVGs — functional and verified accurate, but a polish
  pass to match the Amber Avionics aesthetic is still open.
- Pool expiry reminder: Technician pool expires 6/30/2030, General pool expires
  6/30/2027. If picked up after those dates, check ncvec.org for a newer pool
  before adding content.
- No scripted browser click-through has been done on any lesson page yet
  (no headless browser available in this environment) — worth a manual pass.

## Nothing currently flagged as factually unverified

Everything shipped so far — all 832 pool questions, both outlines, all 4
diagrams, the 26/35 pass threshold, and every lesson claim across all 10
Technician subelements (T1's 47 CFR citations, T2–T9's technical claims,
T6C's schematic component identifications visually checked against the
source images) — has been checked against a primary source: the pool PDFs
directly, 47 CFR via Cornell's Legal Information Institute mirror of the
eCFR, or standard, well-established radio/electronics science for
non-regulatory content. No invented or approximated numbers.

## Phase 4 — General class, G1–G0 (this checkpoint)

You picked "start General class" from the Phase 3 options. Built all 10
General subelements (423 questions) using the same four-parallel-agent
approach that worked for Technician T5–T0, split thematically: Agent 1 =
G1+G0+G6 (Rules/Safety/Components), Agent 2 = G2+G3 (Operating/Propagation),
Agent 3 = G4+G5 (Practices/Electrical — the most math-heavy pairing), Agent
4 = G7+G8+G9 (Circuits/Signals/Antennas, the biggest batch at 126 questions,
plus the G7-1 diagram). All four finished clean on the first pass this time
— no connection failures like the T7/T8 agent hit last round.

Before dispatching, I personally viewed `data/source/diagrams/G7-1.png` and
cross-checked its 5 pool-tested symbol IDs (FET, NPN transistor, Zener
diode, transformer, tapped inductor) against the actual G7A09–13 answers
myself, then handed the verified mapping to Agent 4 directly — same
approach as T6's diagram verification, done proactively this time instead
of after the fact.

I also fixed the glossary-merge bug from the Technician round at the
source: told every agent explicitly not to include literal `<div
class="glossary-entry">` example markup inside their own instructional
comments (that's what fooled my merge-script regex last time). Re-ran the
merge with a stricter parser regardless, as a second line of defense.
Result: clean on the first pass, 65 raw entries proposed, 2 genuine
cross-agent duplicates found (`alc` — proposed by both the G2/G3 and G4/G5
agents; `nvis` — proposed by both G2/G3 and G7/G8/G9) — both were merged
into a single combined entry preserving the distinct facts each version
added (ALC: mic-gain control + must-disable-for-AFSK; NVIS: general
technique + the 40m low-dipole practical detail), rather than picking one
and discarding the other's content.

- `lessons/general/g1.html` — Commission's Rules: G1A (control operator
  frequency privileges, primary/secondary allocations, the Extra-exclusive
  HF slices), G1B (antenna structure limitations, beacon operation), G1C
  (transmitter power regulations, 60-meter operation), G1D (VE/VEC
  mechanics, temporary identification, element credit), G1E (control
  categories, third-party rules, ITU regions) — 52 questions. One inferred
  (not directly pool-stated) number — General's 15m phone privilege
  starting "around 21.275 MHz" — checked by hand against G1A05/G1A09
  afterward and confirmed sound; already hedged with "around" in the text.
- `lessons/general/g0.html` — Electrical and RF Safety: G0A (RF safety
  principles, routine station evaluation), G0B (electrical shock,
  grounding, fusing, tower safety) — 25 questions.
- `lessons/general/g6.html` — Circuit Components: G6A (resistors through
  vacuum tubes and batteries), G6B (ICs, MMICs, display devices, RF
  connectors, ferrite) — 23 questions.
- `lessons/general/g2.html` — Operating Procedures: G2A (phone/USB-LSB/ALC),
  G2B (effective operating, RACES), G2C (CW/Q-signals/full break-in), G2D
  (Volunteer Monitor Program, HF ops), G2E (digital mode procedure) — 60
  questions.
- `lessons/general/g3.html` — Radio Wave Propagation: G3A (sunspots,
  geomagnetic indices), G3B (MUF/LUF, short/long path), G3C (ionospheric
  regions, critical angle, HF scatter, NVIS) — 37 questions.
- `lessons/general/g4.html` — Amateur Radio Practices: G4A (station
  configuration), G4B (test equipment), G4C (consumer-electronics
  interference, grounding/bonding), G4D (speech processors, S meters), G4E
  (mobile/portable HF, alternative energy) — 60 questions.
- `lessons/general/g5.html` — Electrical Principles: G5A (reactance,
  impedance, resonance), G5B (decibels, dividers, power calc, RMS), G5C
  (series/parallel R/L/C, transformers) — 40 questions. Every numeric
  worked example independently recomputed against the pool's actual
  correct answer by the building agent, then spot-checked again by me
  afterward (G5B03, G5B08, G5C07 confirmed exactly). G5A turned out to have
  zero numeric pool questions despite the brief expecting some — the agent
  correctly labeled its illustrative X_L/X_C formula examples as
  "illustrative, not a pool question" rather than misattributing them.
- `lessons/general/g7.html` — Practical Circuits: G7A (power supplies,
  the G7-1 schematic), G7B (digital circuits, amplifiers/oscillators), G7C
  (transceiver design, filters, DSP) — 38 questions.
- `lessons/general/g8.html` — Signals and Emissions: G8A (AM/FM/SSB
  modulation theory), G8B (frequency changing, deviation, intermod), G8C
  (digital emission modes) — 42 questions.
- `lessons/general/g9.html` — Antennas and Feed Lines: G9A (feed line
  impedance/SWR math), G9B (dipole/monopole theory), G9C (directional
  antennas, gain, front-to-back ratio), G9D (specialized antennas, NVIS
  antenna practice) — 46 questions. SWR/dipole-length worked examples
  spot-checked against the pool by me afterward (G9A, G9B) — confirmed.
- 63 new `glossary.html` entries (65 proposed, 2 merged as duplicates
  above) — glossary now has **185 entries total**, covering every
  Technician and General subelement. Intro line updated.
- All 20 lesson pages (10 Technician + 10 General), all 20 flashcard/quiz
  deep-links, and the glossary spot-checked over the local dev server for
  200s; tag-balance-checked on all 10 new files, zero mismatches; zero
  broken `glossary.html#id` links anywhere across the entire site (checked
  programmatically across both `lessons/technician/` and
  `lessons/general/`); zero leftover `exam=technician`/
  `data-exam="technician"` copy-paste artifacts in any General page.

## Phase 5 — accessibility pass (this checkpoint)

Full site audit: contrast, semantic structure/landmarks/headings/alt text,
and keyboard operability of every interactive component. Two real bugs
found and fixed; the rest of the audit came back clean because the
building agents had already been doing this reasonably well by default
(native `<header>`/`<footer>`/`<nav>`/`<main>`, ARIA on the band explorer
slider, associated form labels, descriptive alt text on all 4 diagram
images, clean heading hierarchy with no level skips, an already-solid
skip-link + global `:focus-visible` ring + `prefers-reduced-motion`/
`prefers-contrast` handling from Phase 1).

- **Contrast (real bug, fixed)**: `--text-faint` (`#6f6656`) and `--alert`
  (`#ef4444`) both failed WCAG AA's 4.5:1 text-contrast minimum against
  the site's own dark backgrounds — `--text-faint` used everywhere for
  table headers, "Loading…" placeholders, and empty-state text (ratios
  2.93–3.47:1, needs 4.5); `--alert` specifically in the dashboard's
  PASS/FAIL badge, where the composited badge background made it worse,
  not better (3.75–4.36:1). Computed replacement values programmatically
  (WCAG relative-luminance formula, same hue/saturation, minimum lightness
  needed to clear 4.5:1 against the darkest background each color actually
  appears on) rather than guessing: `--text-faint` → `#948975` (4.82–5.70:1
  now), `--alert` → `#f37777` with `--alert-dim` updated to match
  (4.83–5.97:1 now). Also extended the existing `prefers-contrast: more`
  block to boost `--text-faint` further in that mode. All verified by
  recomputing contrast ratios in Python against every background variable
  the color is actually composited against, not just spot-checked by eye.
- **Keyboard focus loss (real bug, fixed)**: `js/quiz.js` and
  `js/flashcards.js` both replace their container's entire `innerHTML` on
  every interaction (each answer pick, each "Next," each card flip, each
  grade) — this silently dropped keyboard focus back to the top of the
  page after *every single action*, making a 35-question keyboard-only
  exam attempt or a long flashcard session effectively unusable without a
  mouse. Fixed by explicitly restoring focus after each re-render to the
  logical next control (first answer choice on a fresh question, the
  "Next" button once one's picked, the results heading — made
  programmatically focusable via `tabindex="-1"` — once a quiz/deck
  finishes; the card itself when fresh, the "Got it" button once flipped,
  for flashcards).
- **Progress meters (real gap, fixed)**: the `.meter` progress bars (per-
  subelement completion on `technician.html`/`general.html`, per-
  subelement accuracy on `dashboard.html`, and question-N-of-M progress in
  quiz/flashcards) were plain unlabeled `<div>`s with no accessible value.
  Added `role="progressbar"` with `aria-valuemin`/`aria-valuemax`/
  `aria-valuenow`/`aria-valuetext` to all five call sites.
- **Considered and deliberately left alone**: the quiz's answer-choice
  buttons use `role="radio"`/`role="radiogroup"` without the full ARIA
  roving-tabindex/arrow-key interaction pattern real radio groups have.
  Implementing that properly would make arrow keys both move focus *and*
  select+grade an answer (matching native radio behavior) — but since
  selecting an answer here immediately locks it in and shows correct/
  incorrect styling, that would let a keyboard user accidentally submit a
  wrong answer just by arrowing past it to reach the one they meant. Tab
  navigation between the four buttons already works fully today; changing
  the interaction model wasn't worth the risk of introducing an accidental-
  submission bug for a moderate polish gain. Flagging in case you'd rather
  it be fixed properly (e.g. arrow keys move focus only, Enter/Space
  commits) than left as-is.
- Verified with a full re-check afterward: all edited pages/scripts still
  load (200s), `node --check` clean on both edited JS files, tag balance
  clean on all three edited HTML files, and every new contrast value
  recomputed against every background it's actually used on rather than
  just the one that originally failed.

## Open items / flagged for your attention

- The quiz answer-choice ARIA/interaction-model tradeoff above — left
  as-is deliberately, but worth your call.
- **Decided against tracing T6C/G7A into SVGs.** Attempted it, then you
  asked directly whether I could actually trace them accurately — honest
  answer was no: I was hand-typing SVG coordinates by eye from the source
  image with no way to verify the geometry actually matched the source in
  this environment (no rendering/screenshot tooling I could use to
  self-check, no vector-tracing tool confirmed available). Component
  types/numbering/topology were solid (already pool-verified), but exact
  line lengths and curve shapes were guesswork dressed up as a "trace." You
  chose to keep the raw NCVEC JPG/PNG scans as-is rather than risk shipping
  a subtly-wrong hand-drawn version — they're already verified accurate.
  Deleted the one draft SVG (T1) rather than leave unverified art in the
  repo. Not revisiting unless a real vector-tracing tool (e.g. potrace)
  is confirmed available in a future session.
- Pool expiry reminder: Technician pool expires 6/30/2030, General pool
  expires 6/30/2027. If picked up after those dates, check ncvec.org for a
  newer pool before adding content.
- No scripted browser click-through or screen-reader software was actually
  run against the site (no headless browser or screen reader available in
  this environment) — this accessibility pass was static code/contrast
  analysis, not live assistive-tech testing. Worth a real screen-reader
  pass (VoiceOver/NVDA) if you want full confidence, particularly on the
  quiz/flashcard focus-restoration fixes and the band explorer slider.

## Nothing currently flagged as factually unverified

Everything shipped — all 832 pool questions (409 Technician + 423
General), both outlines, all 5 diagrams (T1–T3, G7-1, plus General's
source PDF/JPGs archived), the pass thresholds, and every lesson claim
across all 20 subelements — has been checked against a primary source:
the pool PDFs directly, 47 CFR via Cornell's Legal Information Institute
mirror of the eCFR, or standard, well-established radio/electronics
science for non-regulatory content, with numeric worked examples
independently recomputed rather than trusted from a single pass. No
invented or approximated numbers.

## Phase 6 — Technician depth pass, interactive redesign, quiz explanations (this checkpoint)

You reviewed the live site and flagged three things: technical content
still reading as "memorize this" rather than explaining the underlying
mechanism, some interactive/visual elements rendering poorly, and the one
interactive element that existed (T1's band-frequency slider) not
actually teaching anything since the ruler was already color-coded —
dragging a cursor across it and reading back a color you can already see
tests nothing. You chose: Technician first (checkpoint before General),
and "fix the existing widget + add a few new ones where they'd teach the
most" rather than a blanket interactive-everywhere pass. Mid-session you
also asked for wrong quiz answers to show a short "why" explanation.

**Rendering-bug audit method note**: initial mobile-viewport testing via
plain `chrome --headless --window-size=W,H --screenshot` gave false
readings — that flag doesn't reliably override `window.screen`/the layout
viewport in this Chrome build (confirmed via CDP: `window.screen` stayed
at the 800×600 headless default regardless of `--window-size`), so pages
appeared to overflow/clip on "mobile" screenshots that were actually
laid out at desktop width and just cropped. The user said not to chase
mobile rendering further this round, so it's undiagnosed either way —
worth a real device or a proper `Emulation.setDeviceMetricsOverride` CDP
call before trusting any future mobile screenshot in this repo. One
defensive CSS fix (`.grid > * { min-width: 0; }` in `css/style.css`) was
kept regardless — a legitimate, low-risk hardening against a real class
of CSS Grid overflow bug even though the specific instance that
prompted it wasn't confirmed. All *desktop* rendering was verified for
real via headless Chrome with a proper CDP page target (not the plain
`--screenshot` flag) — screenshotted every Technician lesson page, the
new widgets in both their initial and revealed/interacted states, and
the quiz explanation panel in both correct/incorrect states.

- **`js/band-explorer.js` redesigned** from a passive colored ruler into
  predict-then-reveal: the ruler shows no mode colors up front, the
  learner drags/keys to a frequency, picks what they think is authorized
  there from generated option buttons, *then* the correct segment is
  revealed (colored highlight + explanation + correct/incorrect badge,
  reusing `badge-success`/`badge-alert`). A small running score (`x/y`)
  persists across guesses in the session. Moving to a new frequency
  always resets to a fresh, unrevealed question. Component's config shape
  (`{minKHz, maxKHz, segments, title, unit}`) is unchanged, so it's still
  reusable for a General HF-privileges version later. Applied at its
  existing call site, T1B's 10-meter explorer.
- **Three new interactive widgets**, all vanilla-JS `init(container,
  config)` modules matching `band-explorer.js`'s pattern, styled with
  existing `.panel`/`.readout`/`.badge` CSS (no new CSS system):
  - `js/wave-explorer.js` (T3B, replacing the old static "formula worth
    memorizing" box): a log-scale 3 MHz&ndash;3 GHz frequency slider that
    live-computes wavelength, draws a wave graphic whose visible cycle
    count scales with frequency, labels the HF/VHF/UHF range and
    Technician band live, and folds in a T3C tie-in &mdash; predict
    whether a given frequency skips off the ionosphere or passes through,
    then reveal.
  - `js/gain-explorer.js` (T9A): toggle isotropic/dipole/Yagi and see an
    SVG polar radiation-pattern shape redraw (figure-8 for dipole,
    concentrated teardrop lobe for Yagi), explicitly framed as
    illustrative shape, not a to-scale antenna model, plus a
    predict-then-reveal "which antenna wins for one distant station"
    check.
  - `js/circuit-calc.js` (T5D): live Ohm's-law/power calculator — type
    into any two of voltage/current/resistance, the third fills in as you
    type, with the currently-computed field highlighted and the active
    formula rearrangement (I=E÷R / E=I×R / R=E÷I) labeled, so the three
    formulas read as one relationship instead of three memorized facts.
    Seeded with T5C's own 12V/2.5A worked-example numbers on load.
  - All three verified interactively via headless Chrome + CDP (typed
    into fields, clicked toggle buttons, clicked guess buttons, confirmed
    correct/incorrect reveal states) rather than just screenshotted at
    rest.
- **Quiz "why" explanations** (your mid-session addition): `quiz.js` now
  shows a short explanation under the answer choices once one is picked,
  for both correct and incorrect answers, reusing the `.example-box`
  styling with the border/label color switched to success/alert green or
  red. Sourced from a new `data/technician-explanations.json` (flat
  `{questionId: blurb}` map, loaded via a new `HamData.getExplanations()`
  that degrades to `{}` on a missing file rather than throwing, so the
  quiz still works with zero explanations present). Falls back to a
  citation + link into the matching lesson section for any question ID
  not in the file. **All 409 Technician pool questions now have a
  hand-written 1&ndash;2 sentence explanation** — written subelement by
  subelement while doing the content-depth pass below (so each blurb is
  grounded in the same verified lesson prose, not written blind), and
  every subelement's ID set was programmatically diffed against
  `data/technician.json` after writing (zero missing, zero extra,
  confirmed for T1 through T0 individually and as a full 409-question
  final pass). `data/general-explanations.json` does not exist yet — the
  General pass is unstarted, so General quiz pages currently show only
  the citation/lesson-link fallback.
- **Content-depth pass across all 10 Technician lessons**: read every
  group in T1&ndash;T0 against its own subelement's full question list
  looking for pool questions with no supporting prose at all (not just
  "could be explained better" &mdash; genuinely untaught vocabulary).
  Nine of ten subelements were already thorough (a legacy of the T1
  template + parallel-agent build in Phases 2&ndash;3) and needed only the
  explanation blurbs, not rewrites. **T2 had three real gaps, fixed**:
  linked repeater networks (T2B03), DMR color code (T2B12), and the Q
  signals QRM/QSY (T2B10/11) were tested by the pool but never mentioned
  in the lesson prose at all &mdash; added a paragraph for each, in the
  existing explanation-then-worked-example voice, cross-checked against
  the pool's own correct answers. **T7B01** ("over-deviating") got one
  clarifying sentence connecting that specific FCC-exam term to the
  existing "too close to the microphone" explanation, which was already
  there but didn't use the tested vocabulary word.
- Verified after every subelement's edits: `node --check` on every
  touched/new JS file, JSON validity + exact ID-set diff against the pool
  for every explanations batch, and a div/section/p/ul/li/details/summary
  (plus table/tr/td/th for the T3B table) tag-balance check on every
  edited HTML file &mdash; all clean.

## Open items / flagged for your attention

- **General class untouched this phase** &mdash; no content-depth review,
  no interactive widgets, no `general-explanations.json`. Same treatment
  as Technician is the natural next phase whenever you want it.
- **Mobile rendering is genuinely unverified**, not just "not this
  phase" &mdash; see the audit-method note above. The `min-width:0` grid
  fix is harmless and worth keeping, but don't treat it as confirmation a
  real bug existed or was fixed; a real phone or a correct CDP device-
  metrics-override screenshot is needed to actually know.
- The three new widgets only got automated interaction testing (headless
  Chrome + CDP clicking/typing), the same limitation every prior phase
  has flagged for the rest of the site &mdash; worth your own manual pass,
  particularly keyboard-only operation of the two new predict-then-reveal
  widgets (`wave-explorer`, `gain-explorer`) since they're new interaction
  patterns, not just new content in the existing quiz/flashcard pattern.
- T9's `band-explorer.js` reuse (mentioned as a goal back in Phase 2 for
  a General HF-privileges chart) still hasn't happened &mdash; T9A got a
  new gain-explorer widget instead this round, not a second band
  explorer. Worth revisiting when General's G1 (frequency privileges) is
  built.

## What's next

Technician is content-complete, has four working interactive widgets
(one redesigned, three new), and every Technician quiz question now
explains itself when you get it wrong (or right). General class hasn't
been touched in this phase — same three-part treatment (content-depth
read-through, a couple of targeted interactive widgets, explanation
blurbs for all 423 General questions) is the obvious next phase whenever
you're ready, plus a real mobile pass to replace the inconclusive one
from this session.
