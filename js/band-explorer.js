/**
 * Interactive frequency-segment explorer. Renders a horizontal ruler over
 * [minKHz, maxKHz] with colored privilege segments and a keyboard/pointer
 * -operable cursor that reports what's authorized at the selected frequency.
 *
 * segments: [{ fromKHz, toKHz, label, className, detail }]
 */
const HamBandExplorer = (function () {
  function fmtMHz(khz) {
    return (khz / 1000).toFixed(3).replace(/0$/, "").replace(/\.$/, ".000").replace(/^(\d+\.\d{3}).*/, "$1");
  }

  function init(container, { minKHz, maxKHz, stepKHz, segments, title, unit }) {
    let current = minKHz + Math.round((maxKHz - minKHz) / 2 / stepKHz) * stepKHz;

    container.innerHTML = `
      <div class="band-explorer panel panel-corners" role="group" aria-label="${title}">
        <div class="panel-header"><span>${title}</span><span class="readout" id="be-freq"></span></div>
        <div class="band-ruler" id="be-ruler" style="position:relative; height:2.5rem; border:1px solid var(--border); border-radius:4px; overflow:hidden; background:var(--bg-inset);">
          ${segments.map((s) => `
            <div class="band-segment ${s.className}" title="${s.label}"
              style="position:absolute; top:0; bottom:0; left:${pct(s.fromKHz)}%; width:${pct(s.toKHz) - pct(s.fromKHz)}%;">
            </div>
          `).join("")}
          <div id="be-cursor" role="slider" tabindex="0"
            aria-label="Frequency selector"
            aria-valuemin="${minKHz}" aria-valuemax="${maxKHz}" aria-valuenow="${current}"
            style="position:absolute; top:-3px; bottom:-3px; width:3px; background:var(--text); box-shadow:0 0 8px 2px rgba(237,230,217,0.6); cursor:ew-resize;">
            <span style="position:absolute; top:-0.6rem; left:50%; transform:translateX(-50%); width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:6px solid var(--text);"></span>
          </div>
        </div>
        <div class="cluster" style="justify-content:space-between; margin-top:0.35rem; font-family:var(--font-mono); font-size:0.7rem; color:var(--text-faint);">
          <span>${fmtMHz(minKHz)} ${unit}</span>
          <span>${fmtMHz(maxKHz)} ${unit}</span>
        </div>
        <div class="cluster" style="margin-top:0.75rem; gap:1rem;">
          ${segments.map((s) => `<span class="cluster" style="gap:0.4rem;"><span class="swatch ${s.className}" style="display:inline-block;width:0.8em;height:0.8em;border-radius:2px;"></span><span class="text-dim" style="font-size:0.82rem;">${s.label}</span></span>`).join("")}
        </div>
        <p id="be-detail" class="text-dim" style="margin-top:0.75rem; margin-bottom:0;"></p>
      </div>
    `;

    function pct(khz) {
      return ((khz - minKHz) / (maxKHz - minKHz)) * 100;
    }

    const ruler = container.querySelector("#be-ruler");
    const cursor = container.querySelector("#be-cursor");
    const freqOut = container.querySelector("#be-freq");
    const detailOut = container.querySelector("#be-detail");

    function segmentAt(khz) {
      return segments.find((s) => khz >= s.fromKHz && khz <= s.toKHz) || null;
    }

    function update() {
      const leftPct = ((current - minKHz) / (maxKHz - minKHz)) * 100;
      cursor.style.left = `calc(${leftPct}% - 1.5px)`;
      cursor.setAttribute("aria-valuenow", String(current));
      const seg = segmentAt(current);
      cursor.setAttribute("aria-valuetext", `${fmtMHz(current)} ${unit} — ${seg ? seg.label : "outside authorized segment"}`);
      freqOut.textContent = `${fmtMHz(current)} ${unit}`;
      detailOut.textContent = seg ? seg.detail : "Outside this band's Technician-authorized range.";
    }

    function setFromClientX(clientX) {
      const rect = ruler.getBoundingClientRect();
      const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const raw = minKHz + frac * (maxKHz - minKHz);
      current = Math.round(raw / stepKHz) * stepKHz;
      update();
    }

    ruler.addEventListener("pointerdown", (e) => {
      setFromClientX(e.clientX);
      const move = (ev) => setFromClientX(ev.clientX);
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });

    cursor.addEventListener("keydown", (e) => {
      const bigStep = stepKHz * 10;
      if (e.key === "ArrowRight") { current = Math.min(maxKHz, current + stepKHz); update(); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { current = Math.max(minKHz, current - stepKHz); update(); e.preventDefault(); }
      else if (e.key === "PageUp") { current = Math.min(maxKHz, current + bigStep); update(); e.preventDefault(); }
      else if (e.key === "PageDown") { current = Math.max(minKHz, current - bigStep); update(); e.preventDefault(); }
      else if (e.key === "Home") { current = minKHz; update(); e.preventDefault(); }
      else if (e.key === "End") { current = maxKHz; update(); e.preventDefault(); }
    });

    update();
  }

  return { init };
})();
