/**
 * Interactive frequency-segment explorer, predict-then-reveal style. Renders a
 * horizontal ruler over [minKHz, maxKHz] with a keyboard/pointer-operable
 * cursor. The ruler itself never shows segment colors up front — the learner
 * has to commit a guess for what's authorized at the selected frequency
 * before the answer (and a colored highlight of that one segment) appears.
 * Moving to a new frequency resets the question so every position has to be
 * answered fresh, not read off a permanently color-coded chart.
 *
 * segments: [{ fromKHz, toKHz, label, className, detail }]
 */
const HamBandExplorer = (function () {
  function fmtMHz(khz) {
    return (khz / 1000).toFixed(3).replace(/0$/, "").replace(/\.$/, ".000").replace(/^(\d+\.\d{3}).*/, "$1");
  }

  function init(container, { minKHz, maxKHz, stepKHz, segments, title, unit }) {
    let current = minKHz + Math.round((maxKHz - minKHz) / 2 / stepKHz) * stepKHz;
    let revealed = false;
    let picked = null; // guessed className, or "__none" for "not authorized"
    let correct = 0;
    let attempts = 0;

    const options = [];
    const seenClasses = new Set();
    segments.forEach((s) => {
      if (!seenClasses.has(s.className)) {
        seenClasses.add(s.className);
        options.push({ className: s.className, label: s.label });
      }
    });
    options.push({ className: "__none", label: "Not authorized here" });

    function pct(khz) {
      return ((khz - minKHz) / (maxKHz - minKHz)) * 100;
    }

    function segmentAt(khz) {
      return segments.find((s) => khz >= s.fromKHz && khz <= s.toKHz) || null;
    }

    function askNewQuestion(freq) {
      current = freq;
      revealed = false;
      picked = null;
    }

    function render({ focus } = {}) {
      const seg = segmentAt(current);
      const correctClassName = seg ? seg.className : "__none";
      const isCorrect = picked === correctClassName;
      const scoreBadge = attempts
        ? `<span class="badge ${correct === attempts ? "badge-success" : "badge-muted"}">${correct}/${attempts}</span>`
        : "";

      container.innerHTML = `
        <div class="band-explorer panel panel-corners" role="group" aria-label="${title}">
          <div class="panel-header">
            <span>${title}</span>
            <span class="cluster" style="gap:0.6rem;">${scoreBadge}<span class="readout" id="be-freq">${fmtMHz(current)} ${unit}</span></span>
          </div>
          <div class="band-ruler" id="be-ruler" style="position:relative; height:2.5rem; border:1px solid var(--border); border-radius:4px; overflow:hidden; background:var(--bg-inset);">
            ${revealed && seg ? `
              <div class="band-segment ${seg.className}" style="position:absolute; top:0; bottom:0; left:${pct(seg.fromKHz)}%; width:${pct(seg.toKHz) - pct(seg.fromKHz)}%;"></div>
            ` : ""}
            <div id="be-cursor" role="slider" tabindex="0"
              aria-label="Frequency selector"
              aria-valuemin="${minKHz}" aria-valuemax="${maxKHz}" aria-valuenow="${current}"
              aria-valuetext="${fmtMHz(current)} ${unit}${revealed ? `, ${isCorrect ? "your answer was correct" : "answer revealed"}` : ", answer not yet chosen"}"
              style="position:absolute; top:-3px; bottom:-3px; width:3px; background:var(--text); box-shadow:0 0 8px 2px rgba(237,230,217,0.6); cursor:ew-resize; left:calc(${pct(current)}% - 1.5px);">
              <span style="position:absolute; top:-0.6rem; left:50%; transform:translateX(-50%); width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:6px solid var(--text);"></span>
            </div>
          </div>
          <div class="cluster" style="justify-content:space-between; margin-top:0.35rem; font-family:var(--font-mono); font-size:0.7rem; color:var(--text-faint);">
            <span>${fmtMHz(minKHz)} ${unit}</span>
            <span>${fmtMHz(maxKHz)} ${unit}</span>
          </div>

          ${!revealed ? `
            <p class="text-dim" style="margin-top:0.85rem; margin-bottom:0.5rem;">
              Drag the cursor above (or focus it and use the arrow keys), then say what's authorized at
              <strong class="readout">${fmtMHz(current)} ${unit}</strong>:
            </p>
            <div class="cluster" role="radiogroup" aria-label="Your answer" style="gap:0.5rem;">
              ${options.map((o) => `<button type="button" class="btn" data-guess="${o.className}">${o.label}</button>`).join("")}
            </div>
          ` : `
            <div class="cluster" style="gap:0.6rem; margin-top:0.85rem; align-items:center;">
              <span class="badge ${isCorrect ? "badge-success" : "badge-alert"}" tabindex="-1" id="be-feedback">${isCorrect ? "Correct" : "Not quite"}</span>
              <span class="text-dim" style="font-size:0.88rem;">${seg ? seg.label : "Not authorized here"}${!isCorrect ? ` &mdash; you picked "${(options.find((o) => o.className === picked) || {}).label}"` : ""}</span>
            </div>
            <p id="be-detail" class="text-dim" style="margin-top:0.6rem; margin-bottom:0;">${seg ? seg.detail : "Outside this range, Technician has no privileges here."}</p>
            <div class="cluster" style="margin-top:0.85rem; gap:0.5rem;">
              <button type="button" class="btn btn-primary" data-action="random">Try another frequency</button>
            </div>
          `}
        </div>
      `;
      wire();
      if (focus === "cursor") container.querySelector("#be-cursor").focus();
      if (focus === "feedback") container.querySelector("#be-feedback").focus();
    }

    function wire() {
      const ruler = container.querySelector("#be-ruler");
      const cursor = container.querySelector("#be-cursor");
      const freqOut = container.querySelector("#be-freq");

      function moveCursorLive(khz) {
        // During a drag, just reposition the cursor and readout without a
        // full re-render — the question/answer panel only updates once the
        // learner settles on a frequency, so buttons don't flicker mid-drag.
        current = khz;
        cursor.style.left = `calc(${pct(current)}% - 1.5px)`;
        cursor.setAttribute("aria-valuenow", String(current));
        freqOut.textContent = `${fmtMHz(current)} ${unit}`;
      }

      function setFromClientX(clientX) {
        const rect = ruler.getBoundingClientRect();
        const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        const raw = minKHz + frac * (maxKHz - minKHz);
        moveCursorLive(Math.round(raw / stepKHz) * stepKHz);
      }

      ruler.addEventListener("pointerdown", (e) => {
        setFromClientX(e.clientX);
        const move = (ev) => setFromClientX(ev.clientX);
        const up = () => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
          if (revealed || picked !== null) askNewQuestion(current);
          render();
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      });

      cursor.addEventListener("keydown", (e) => {
        const bigStep = stepKHz * 10;
        let moved = true;
        if (e.key === "ArrowRight") current = Math.min(maxKHz, current + stepKHz);
        else if (e.key === "ArrowLeft") current = Math.max(minKHz, current - stepKHz);
        else if (e.key === "PageUp") current = Math.min(maxKHz, current + bigStep);
        else if (e.key === "PageDown") current = Math.max(minKHz, current - bigStep);
        else if (e.key === "Home") current = minKHz;
        else if (e.key === "End") current = maxKHz;
        else moved = false;
        if (moved) {
          e.preventDefault();
          askNewQuestion(current);
          render({ focus: "cursor" });
        }
      });

      container.querySelectorAll("[data-guess]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (revealed) return;
          picked = btn.dataset.guess;
          revealed = true;
          attempts += 1;
          if (picked === (segmentAt(current) ? segmentAt(current).className : "__none")) correct += 1;
          render({ focus: "feedback" });
        });
      });

      const randomBtn = container.querySelector('[data-action="random"]');
      if (randomBtn) {
        randomBtn.addEventListener("click", () => {
          const steps = Math.round((maxKHz - minKHz) / stepKHz);
          askNewQuestion(minKHz + Math.floor(Math.random() * (steps + 1)) * stepKHz);
          render({ focus: "cursor" });
        });
      }
    }

    render();
  }

  return { init };
})();
