# Progress

Multi-session build log. Read this first in any new session before continuing work.

## Status: Phase 1 (Foundation) — complete, pending your review

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
  localStorage), `flashcards.html` + `quiz.html` (placeholder — explicitly marked
  "under construction," per user direction not worth building out further until
  the real interactive pattern is established in Phase 2), `dashboard.html`
  (fully functional now — per-subelement accuracy meters + quiz history table,
  reads live from localStorage), `glossary.html` (placeholder).
- `technician.html` / `general.html` link each subelement card to
  `lessons/{exam}/{id}.html` — **these lesson pages don't exist yet** and will
  404 until Phase 2+ builds them. Per user: no need for placeholder stub pages,
  the site will be built out before real use.

## Open items / flagged for your attention

- No accessibility pass done yet beyond baseline (semantic landmarks, skip link,
  focus-visible states, `prefers-reduced-motion`/`prefers-contrast` handled in
  CSS). A full pass (contrast audit, screen-reader run-through, keyboard-only
  nav test) is scheduled for Phase 5 per the build plan.
- Pool expiry reminder: Technician pool expires 6/30/2030, General pool expires
  6/30/2027. If picked up after those dates, check ncvec.org for a newer pool
  before adding content.

## Nothing currently flagged as factually unverified

Everything shipped so far (all 832 questions, both outlines, all 4 diagrams, the
26/35 pass threshold cited on `technician.html`/`general.html`/`quiz.html`) has
been checked against a primary source (the pool PDFs themselves, or 47 CFR
97.503 via Cornell's Legal Information Institute mirror of the eCFR). Lesson
"why" content (physics/regulatory background beyond the pool) hasn't been
written yet — that starts in Phase 2 and will carry its own citations.

## What's next — Phase 2

Build Technician subelement **T1 (Commission's Rules)** completely end-to-end as
the template/pattern for every other subelement: full lesson content, worked
examples/analogies, at least one interactive/animated element, linked quiz
questions, flashcards. This is a checkpoint — depth/tone/interactivity get
reviewed here before replicating the pattern 19 more times across T2–T0 and
G1–G0.
