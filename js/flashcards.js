const HamFlashcards = (function () {
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function figureSrc(root, figure) {
    if (!figure) return null;
    const ext = figure.startsWith("G") ? "png" : "jpg";
    return `${root}data/source/diagrams/${figure}.${ext}`;
  }

  function init(mount, { examKey, subelementId, questions, root }) {
    const deck = shuffle(questions);
    let i = 0;
    let flipped = false;
    let firstLookCorrect = 0;
    let firstLookGraded = 0;
    let gradedThisCard = false;

    function render() {
      if (i >= deck.length) {
        mount.innerHTML = `
          <div class="panel panel-corners stack" style="text-align:center;">
            <div class="hero-kicker" style="margin:0;">// deck complete</div>
            <h2 style="margin:0;">${deck.length} card${deck.length === 1 ? "" : "s"} reviewed</h2>
            <p class="text-dim">${firstLookCorrect} / ${firstLookGraded} marked "got it" on first look.</p>
            <div class="cluster" style="justify-content:center;">
              <button class="btn btn-primary" type="button" data-action="restart">Shuffle again</button>
              <button class="btn" type="button" data-action="picker">Choose another deck</button>
            </div>
          </div>
        `;
        mount.querySelector('[data-action="restart"]').addEventListener("click", () => {
          i = 0; flipped = false; firstLookCorrect = 0; firstLookGraded = 0; gradedThisCard = false;
          deck.splice(0, deck.length, ...shuffle(questions));
          render();
        });
        mount.querySelector('[data-action="picker"]').addEventListener("click", () => {
          mount.dispatchEvent(new CustomEvent("ham:back-to-picker", { bubbles: true }));
        });
        return;
      }

      const q = deck[i];
      const figSrc = figureSrc(root, q.figure);
      const pct = Math.round(((i) / deck.length) * 100);

      mount.innerHTML = `
        <div class="meter-row" style="margin-bottom:1rem;">
          <div class="meter"><span style="width:${pct}%"></span></div>
          <span class="readout text-faint">${i + 1} / ${deck.length}</span>
        </div>
        <button type="button" class="panel panel-corners flashcard" data-action="flip" aria-live="polite"
          style="display:block; width:100%; text-align:left; cursor:pointer; min-height:14rem;">
          <div class="cluster" style="justify-content:space-between; margin-bottom:0.75rem;">
            <span class="badge">${q.id}</span>
            ${q.citation ? `<span class="badge badge-muted">§${q.citation}</span>` : ""}
          </div>
          <p style="font-size:1.05rem;">${q.question}</p>
          ${figSrc ? `<img src="${figSrc}" alt="Reference figure ${q.figure}" style="max-width:16rem; margin:0.5rem 0; border:1px solid var(--border);">` : ""}
          ${flipped ? `
            <div class="stack" style="margin-top:1rem; border-top:1px solid var(--border); padding-top:1rem;">
              ${"ABCD".split("").map((l) => `
                <div class="cluster" style="gap:0.5rem;">
                  <span class="badge ${l === q.answer ? "badge-success" : "badge-muted"}">${l}</span>
                  <span class="${l === q.answer ? "text" : "text-dim"}">${q.choices[l]}</span>
                </div>
              `).join("")}
            </div>
          ` : `<p class="text-faint" style="margin-top:1rem;">Tap or press space to reveal the answer</p>`}
        </button>
        <div class="cluster" style="justify-content:center; margin-top:1rem;">
          ${flipped ? `
            <button class="btn" type="button" data-action="missed">Missed it</button>
            <button class="btn btn-primary" type="button" data-action="got-it">Got it</button>
          ` : `
            <button class="btn btn-primary" type="button" data-action="flip">Flip card</button>
          `}
        </div>
      `;

      const card = mount.querySelector('[data-action="flip"].flashcard');
      if (card) card.addEventListener("click", (e) => { if (!flipped) { flipped = true; render(); } });
      const flipBtn = mount.querySelector('button[data-action="flip"]:not(.flashcard)');
      if (flipBtn) flipBtn.addEventListener("click", () => { flipped = true; render(); });

      const gotIt = mount.querySelector('[data-action="got-it"]');
      const missed = mount.querySelector('[data-action="missed"]');
      if (gotIt) gotIt.addEventListener("click", () => grade(true));
      if (missed) missed.addEventListener("click", () => grade(false));
    }

    function grade(correct) {
      if (!gradedThisCard) {
        HamStorage.recordAnswer(examKey, deck[i].id, deck[i].subelement, correct);
        firstLookGraded++;
        if (correct) firstLookCorrect++;
        gradedThisCard = true;
      }
      i++;
      flipped = false;
      gradedThisCard = false;
      render();
    }

    mount.tabIndex = -1;
    mount.addEventListener("keydown", (e) => {
      if (i >= deck.length) return;
      if ((e.key === " " || e.key === "Enter") && !flipped) {
        e.preventDefault();
        flipped = true;
        render();
      } else if (flipped && (e.key === "1" || e.key.toLowerCase() === "g")) {
        grade(true);
      } else if (flipped && (e.key === "2" || e.key.toLowerCase() === "m")) {
        grade(false);
      }
    });

    render();
  }

  return { init };
})();
