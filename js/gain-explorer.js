/**
 * Antenna radiation-pattern explorer for T9A. Draws a simple top-down polar
 * plot for isotropic / dipole / Yagi so "gain redistributes power, it
 * doesn't create it" is something seen (the lobe grows in one direction
 * only because it shrinks somewhere else) rather than just asserted in
 * prose. Shapes are illustrative textbook approximations, not to-scale
 * antenna-modeling output — labeled as such.
 */
const HamGainExplorer = (function () {
  const PATTERNS = {
    isotropic: {
      label: "Isotropic (reference)",
      blurb: "A theoretical antenna that radiates perfectly equally in every direction. Nothing real behaves quite like this — it exists as the 0 dBi reference point every other antenna's gain is measured against.",
      r: () => 70,
    },
    dipole: {
      label: "Half-wave dipole",
      blurb: "Strongest broadside to the wire (top and bottom of this view), almost nothing straight off the ends — the classic figure-8. Notice the two lobes are smaller than a Yagi's single lobe: a dipole trades away far less of its \"weak\" directions to build up its strong ones.",
      // Wire runs left-right (0°/180°); broadside lobes at 90°/270°.
      r: (theta) => 14 + 74 * Math.abs(Math.sin(theta)),
    },
    yagi: {
      label: "Yagi (beam)",
      blurb: "Among Technician-tested antenna types, the Yagi offers the greatest gain — nearly all the power is concentrated into one forward lobe, with only a small backlobe and almost nothing to the sides.",
      // Forward direction is 90° (up, matching the "pointed away from the
      // feed line" convention used in the accompanying diagram caption).
      r: (theta) => 8 + 90 * Math.pow(Math.max(0, Math.cos(theta - Math.PI / 2) * 0.5 + 0.5), 5),
    },
  };

  function polarPoints(rFn, cx, cy) {
    const steps = 144;
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * Math.PI * 2;
      const r = rFn(theta);
      pts.push(`${(cx + r * Math.cos(theta)).toFixed(1)},${(cy + r * Math.sin(theta)).toFixed(1)}`);
    }
    return pts.join(" ");
  }

  function patternSvg(key) {
    const cx = 110, cy = 110, size = 220;
    const ring = (r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--border)" stroke-width="1" stroke-dasharray="2 3" />`;
    return `
      <svg viewBox="0 0 ${size} ${size}" width="100%" height="220" role="img" aria-label="${PATTERNS[key].label} radiation pattern, top-down view">
        ${ring(35)}${ring(70)}${ring(105)}
        <line x1="${cx - 105}" y1="${cy}" x2="${cx + 105}" y2="${cy}" stroke="var(--border)" stroke-width="1" />
        <line x1="${cx}" y1="${cy - 105}" x2="${cx}" y2="${cy + 105}" stroke="var(--border)" stroke-width="1" />
        <polygon points="${polarPoints(PATTERNS[key].r, cx, cy)}" fill="rgba(255,176,0,0.22)" stroke="var(--amber)" stroke-width="2" />
        <circle cx="${cx}" cy="${cy}" r="3" fill="var(--text)" />
      </svg>
    `;
  }

  function init(container) {
    let current = "isotropic";
    let revealed = false;
    let picked = null;
    let correct = 0;
    let attempts = 0;

    function render({ focus } = {}) {
      const scoreBadge = attempts
        ? `<span class="badge ${correct === attempts ? "badge-success" : "badge-muted"}">${correct}/${attempts}</span>`
        : "";
      container.innerHTML = `
        <div class="gain-explorer panel panel-corners" role="group" aria-label="Antenna radiation pattern explorer">
          <div class="panel-header">
            <span>Antenna radiation pattern explorer</span>
            ${scoreBadge}
          </div>
          <div class="cluster" role="tablist" aria-label="Antenna type" style="gap:0.5rem; margin-bottom:0.75rem;">
            ${Object.keys(PATTERNS).map((key) => `
              <button type="button" class="btn ${key === current ? "btn-primary" : ""}" data-pattern="${key}" role="tab" aria-selected="${key === current}">${PATTERNS[key].label}</button>
            `).join("")}
          </div>
          <div style="max-width:22rem; margin:0 auto;">${patternSvg(current)}</div>
          <p class="text-dim" style="text-align:center; font-size:0.72rem; margin:0 0 0.5rem;">Top-down view &mdash; same transmitter power feeds every shape; only the distribution changes. Illustrative shape, not a to-scale antenna model.</p>
          <p class="text-dim" style="margin-top:0.5rem;">${PATTERNS[current].blurb}</p>

          <div class="section-label" style="margin:1.25rem 0 0.75rem;">Check yourself</div>
          ${!revealed ? `
            <p class="text-dim" style="margin-bottom:0.5rem;">
              You need the strongest possible signal at one distant, fixed station, and your transmitter power
              is the same no matter which antenna you feed it into. Which antenna gets you there?
            </p>
            <div class="cluster" role="radiogroup" aria-label="Your answer" style="gap:0.5rem;">
              ${Object.keys(PATTERNS).map((key) => `<button type="button" class="btn" data-guess="${key}">${PATTERNS[key].label}</button>`).join("")}
            </div>
          ` : `
            <div class="cluster" style="gap:0.6rem; align-items:center;">
              <span class="badge ${picked === "yagi" ? "badge-success" : "badge-alert"}" tabindex="-1" id="ge-feedback">${picked === "yagi" ? "Correct" : "Not quite"}</span>
              <span class="text-dim" style="font-size:0.88rem;">The Yagi wins &mdash; point its concentrated lobe at the one station you care about.</span>
            </div>
            <p class="text-dim" style="margin-top:0.5rem; margin-bottom:0;">
              An isotropic or dipole antenna spreads the same power more evenly, so less of it reaches any one
              direction. A Yagi doesn't transmit more power overall — it just gives up coverage in the directions
              you don't need to reinforce the one direction you do.
            </p>
            <div class="cluster" style="margin-top:0.85rem;">
              <button type="button" class="btn btn-primary" data-action="reset">Try again</button>
            </div>
          `}
        </div>
      `;
      wire();
      if (focus === "feedback") container.querySelector("#ge-feedback").focus();
    }

    function wire() {
      container.querySelectorAll("[data-pattern]").forEach((btn) => {
        btn.addEventListener("click", () => {
          current = btn.dataset.pattern;
          render();
        });
      });
      container.querySelectorAll("[data-guess]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (revealed) return;
          picked = btn.dataset.guess;
          revealed = true;
          attempts += 1;
          if (picked === "yagi") correct += 1;
          render({ focus: "feedback" });
        });
      });
      const resetBtn = container.querySelector('[data-action="reset"]');
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          revealed = false;
          picked = null;
          render();
        });
      }
    }

    render();
  }

  return { init };
})();
