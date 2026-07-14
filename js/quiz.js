const HamQuiz = (function () {
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

  // Real VE exams draw exactly one random question from each group (35
  // groups in both the Technician and General pools = a 35-question exam).
  function drawExam(allQuestions) {
    const byGroup = {};
    allQuestions.forEach((q) => {
      (byGroup[q.group] = byGroup[q.group] || []).push(q);
    });
    const picked = Object.values(byGroup).map((pool) => pool[Math.floor(Math.random() * pool.length)]);
    return shuffle(picked);
  }

  function init(mount, { examKey, subelementId, questions, root, isFullExam }) {
    const deck = isFullExam ? drawExam(questions) : shuffle(questions);
    let i = 0;
    const answers = new Array(deck.length).fill(null);

    function render() {
      if (i >= deck.length) {
        renderResults();
        return;
      }
      const q = deck[i];
      const figSrc = figureSrc(root, q.figure);
      const pct = Math.round((i / deck.length) * 100);
      const chosen = answers[i];

      mount.innerHTML = `
        <div class="meter-row" style="margin-bottom:1rem;">
          <div class="meter" role="progressbar" aria-label="Quiz progress" aria-valuemin="1" aria-valuemax="${deck.length}" aria-valuenow="${i + 1}" aria-valuetext="Question ${i + 1} of ${deck.length}"><span style="width:${pct}%"></span></div>
          <span class="readout text-faint">${i + 1} / ${deck.length}</span>
        </div>
        <div class="panel panel-corners">
          <div class="cluster" style="justify-content:space-between; margin-bottom:0.75rem;">
            <span class="badge">${q.id}</span>
            ${q.citation ? `<span class="badge badge-muted">§${q.citation}</span>` : ""}
          </div>
          <p style="font-size:1.05rem;">${q.question}</p>
          ${figSrc ? `<img src="${figSrc}" alt="Reference figure ${q.figure}" style="max-width:16rem; margin:0.5rem 0; border:1px solid var(--border);">` : ""}
          <div class="stack" role="radiogroup" aria-label="Answer choices" style="margin-top:1rem;">
            ${"ABCD".split("").map((l) => `
              <button type="button" class="btn" data-choice="${l}" role="radio" aria-checked="${chosen === l}"
                style="justify-content:flex-start; text-align:left; ${chosen ? choiceStyle(l, q.answer, chosen) : ""}">
                <span class="badge badge-muted" style="margin-right:0.6em;">${l}</span> ${q.choices[l]}
              </button>
            `).join("")}
          </div>
        </div>
        <div class="cluster" style="justify-content:flex-end; margin-top:1rem;">
          <button class="btn btn-primary" type="button" data-action="next" ${chosen ? "" : "disabled"}>
            ${i === deck.length - 1 ? "Finish" : "Next"}
          </button>
        </div>
      `;

      mount.querySelectorAll("[data-choice]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (answers[i]) return;
          answers[i] = btn.dataset.choice;
          HamStorage.recordAnswer(examKey, q.id, q.subelement, btn.dataset.choice === q.answer);
          render();
        });
      });
      const nextBtn = mount.querySelector('[data-action="next"]');
      if (nextBtn) nextBtn.addEventListener("click", () => { i++; render(); });

      // Re-rendering replaces the whole subtree, which would otherwise drop
      // keyboard focus back to the top of the page after every answer/Next —
      // restore it to whichever control is the logical next stop.
      const focusTarget = chosen ? nextBtn : mount.querySelector("[data-choice]");
      if (focusTarget) focusTarget.focus();
    }

    function choiceStyle(letter, correct, chosen) {
      if (letter === correct) return "border-color:var(--success); box-shadow:0 0 0 1px var(--success);";
      if (letter === chosen) return "border-color:var(--alert); box-shadow:0 0 0 1px var(--alert);";
      return "opacity:0.6;";
    }

    function renderResults() {
      const correctCount = deck.reduce((n, q, idx) => n + (answers[idx] === q.answer ? 1 : 0), 0);
      const scorePct = (correctCount / deck.length) * 100;
      const pass = isFullExam ? scorePct >= (26 / 35) * 100 : null;
      if (isFullExam) {
        HamStorage.recordQuizResult(examKey, scorePct, correctCount, deck.length);
      }

      mount.innerHTML = `
        <div class="panel panel-corners stack" style="text-align:center;">
          <div class="hero-kicker" style="margin:0;">// session complete</div>
          <h2 class="readout" tabindex="-1" style="margin:0; font-size:2rem;">${correctCount} / ${deck.length}</h2>
          <p class="text-dim">${Math.round(scorePct)}% correct${pass !== null ? ` &mdash; ${pass ? "PASS" : "below the 74% (26/35) passing threshold"}` : ""}</p>
          ${pass !== null ? `<span class="badge ${pass ? "badge-success" : "badge-alert"}" style="justify-self:center;">${pass ? "PASS" : "FAIL"}</span>` : ""}
          <div class="section-label">Review</div>
          <div class="stack" style="text-align:left;">
            ${deck.map((q, idx) => `
              <div class="cluster" style="justify-content:space-between; border-bottom:1px solid var(--border); padding-bottom:0.5rem;">
                <span>${q.id}: ${q.question}</span>
                <span class="badge ${answers[idx] === q.answer ? "badge-success" : "badge-alert"}">
                  ${answers[idx] === q.answer ? "correct" : `your: ${answers[idx]} &middot; correct: ${q.answer}`}
                </span>
              </div>
            `).join("")}
          </div>
          <div class="cluster" style="justify-content:center; margin-top:1rem;">
            <button class="btn" type="button" data-action="picker">Choose another quiz</button>
          </div>
        </div>
      `;
      mount.querySelector('[data-action="picker"]').addEventListener("click", () => {
        mount.dispatchEvent(new CustomEvent("ham:back-to-picker", { bubbles: true }));
      });

      // Same focus-restoration concern as render(): move focus to the results
      // heading so keyboard/screen-reader users land somewhere meaningful
      // instead of the page silently losing focus.
      mount.querySelector("h2").focus();
    }

    render();
  }

  return { init };
})();
