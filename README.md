# HAM OPS — Technician & General License Trainer

A self-contained, offline-capable web course for the FCC Technician (Element 2) and
General (Element 3) amateur radio license exams — built from the ground up to teach
*why* the rules and physics work, not just which multiple-choice letter to pick.

Plain HTML/CSS/JS. No build step, no framework, no npm dependencies, no backend.
Progress is stored in the browser's `localStorage` only.

## Status

This is a multi-session build. See [PROGRESS.md](PROGRESS.md) for what's done, what's
next, and anything flagged as unverified. Currently: **Phase 1 (foundation) complete.**

## Running locally

Because pages load question data via `fetch()`, you need to serve the files over
HTTP rather than opening `index.html` directly from disk (browsers block `fetch` of
`file://` resources). From the repo root:

```
python3 -m http.server 8000
```

then open `http://localhost:8000/`. Any other static file server works too.

## Deploying

Served via GitHub Pages directly from the `main` branch root — no build step
required. Live at https://dinocarter.github.io/ham_class/. Repo Settings → Pages
is set to **Source: Deploy from a branch**, branch **main**, folder **/(root)**.

## Repo structure

```
index.html, technician.html, general.html, ...   top-level pages
css/style.css                                     all styling
js/nav.js, data.js, storage.js                    shared app logic
data/technician.json, general.json                parsed question pools
data/technician-outline.json, general-outline.json subelement/group metadata
data/source/                                      original PDFs + diagram images,
                                                   kept for provenance/re-verification
diagrams/                                          traced SVG reference diagrams (T-1,
                                                   T-2, T-3, G7-1) — added as the
                                                   subelements that use them are built
lessons/technician/, lessons/general/             per-subelement lesson content
```

## Source material & attribution

- **Question pools**: © NCVEC Question Pool Committee. Fetched directly from
  [ncvec.org](https://ncvec.org) and parsed programmatically — never hand-transcribed
  or taken from third-party answer keys.
  - Technician (Element 2): 2026–2030 pool, public release Feb 19 2026, effective
    7/1/2026 through 6/30/2030. 409 questions, 10 subelements, 3 reference diagrams.
  - General (Element 3): 2023–2027 pool, 6th Errata Feb 4 2026, effective 7/1/2023
    through 6/30/2027. 423 active questions (9 withdrawn by errata), 10 subelements,
    1 reference diagram.
  - Original PDFs are kept in `data/source/` so the parsed JSON can always be
    re-verified against the source.
- **Regulatory text**: FCC Part 97 (47 CFR Part 97), cited by section wherever a
  question or lesson references a specific rule.
- **Background/explanatory material**: informed by ARRL reference publications
  (arrl.org) where lessons go beyond the question pool itself into underlying
  physics or regulatory context.

If this project is revisited after the pools expire (Technician: 6/30/2030,
General: 6/30/2027), check ncvec.org for a newer pool before adding content.

## Accuracy policy

This is a licensing-exam site — wrong information is worse than none. Every
question/answer comes straight from parsing the official pool PDF (with an
automated cross-check of every parsed ID+answer against the source text — see
`data/source/parse_pool.py`). Explanatory content that goes beyond the pool itself
is kept to well-established fact, cited where it matters, and anything that
couldn't be verified is flagged in PROGRESS.md rather than shipped silently.
