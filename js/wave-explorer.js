/**
 * Interactive wavelength/frequency + ionosphere-skip explorer for T3B/T3C.
 * A log-scale frequency slider drives a live wavelength calculation, an
 * animated wave graphic whose visible cycle count scales with frequency (so
 * "shorter wavelength = more oscillations in the same space" is something
 * seen, not just stated), and a predict-then-reveal check on whether the
 * ionosphere reflects that frequency back to Earth or lets it pass through —
 * tying the T3B math to the T3C propagation mechanism in one widget.
 */
const HamWaveExplorer = (function () {
  const RANGES = [
    { name: "HF", minMHz: 3, maxMHz: 30 },
    { name: "VHF", minMHz: 30, maxMHz: 300 },
    { name: "UHF", minMHz: 300, maxMHz: 3000 },
  ];

  const TECH_BANDS = [
    { name: "10 meters", minMHz: 28, maxMHz: 29.7 },
    { name: "6 meters", minMHz: 50, maxMHz: 54 },
    { name: "2 meters", minMHz: 144, maxMHz: 148 },
    { name: "1.25 meters", minMHz: 222, maxMHz: 225 },
    { name: "70 centimeters", minMHz: 420, maxMHz: 450 },
    { name: "23 centimeters", minMHz: 1240, maxMHz: 1300 },
  ];

  function rangeAt(mhz) {
    return RANGES.find((r) => mhz >= r.minMHz && mhz < r.maxMHz) || RANGES[RANGES.length - 1];
  }

  function bandAt(mhz) {
    return TECH_BANDS.find((b) => mhz >= b.minMHz && mhz <= b.maxMHz) || null;
  }

  function fmt(n, digits) {
    return n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  function init(container, opts) {
    const minMHz = (opts && opts.minMHz) || 3;
    const maxMHz = (opts && opts.maxMHz) || 3000;
    const logMin = Math.log(minMHz);
    const logMax = Math.log(maxMHz);
    let freqMHz = 28.4; // starts inside the 10-meter band, which T3B already uses as the worked example

    let revealed = false;
    let picked = null; // "bounce" | "pass"
    let correct = 0;
    let attempts = 0;

    function fracFromFreq(mhz) {
      return (Math.log(mhz) - logMin) / (logMax - logMin);
    }
    function freqFromFrac(frac) {
      return Math.exp(logMin + frac * (logMax - logMin));
    }

    function wavelengthM(mhz) {
      return 300 / mhz;
    }

    function waveSvg(mhz) {
      // Map frequency (log scale) to a visible cycle count between 2 and 16 —
      // not to physical scale (impossible in one fixed box across a 1000x
      // frequency range), but faithfully ordered: higher frequency always
      // draws more compressed cycles than a lower one.
      const frac = fracFromFreq(mhz);
      const cycles = 2 + frac * 14;
      const width = 560;
      const height = 70;
      const midY = height / 2;
      const amp = 24;
      const points = [];
      const steps = 200;
      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * width;
        const y = midY - Math.sin((i / steps) * cycles * Math.PI * 2) * amp;
        points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" preserveAspectRatio="none" role="img" aria-label="Wave graphic, ${fmt(cycles, 1)} cycles shown across the box — higher frequency draws more compressed cycles">
        <polyline points="${points.join(" ")}" fill="none" stroke="var(--amber)" stroke-width="2" />
      </svg>`;
    }

    function render({ focus } = {}) {
      const mhz = freqMHz;
      const wl = wavelengthM(mhz);
      const range = rangeAt(mhz);
      const band = bandAt(mhz);
      const isHF = mhz < 30;
      const correctChoice = isHF ? "bounce" : "pass";
      const isCorrect = picked === correctChoice;
      const scoreBadge = attempts
        ? `<span class="badge ${correct === attempts ? "badge-success" : "badge-muted"}">${correct}/${attempts}</span>`
        : "";

      container.innerHTML = `
        <div class="wave-explorer panel panel-corners" role="group" aria-label="Wavelength and propagation explorer">
          <div class="panel-header">
            <span>Wavelength &amp; propagation explorer</span>
            <span class="cluster" style="gap:0.6rem;">${scoreBadge}<span class="readout" id="we-freq">${fmt(mhz, mhz < 30 ? 3 : 1)} MHz</span></span>
          </div>

          <div id="we-wave" style="margin:0.5rem 0 0.75rem;">${waveSvg(mhz)}</div>

          <div style="position:relative; height:1.75rem;">
            <input type="range" id="we-slider" min="0" max="1000" value="${Math.round(fracFromFreq(mhz) * 1000)}"
              aria-label="Frequency, log scale from ${minMHz} MHz to ${maxMHz} MHz"
              aria-valuetext="${fmt(mhz, mhz < 30 ? 3 : 1)} MHz, ${range.name}${band ? `, inside the Technician ${band.name} band` : ""}"
              style="width:100%;" />
          </div>
          <div class="cluster" style="justify-content:space-between; font-family:var(--font-mono); font-size:0.7rem; color:var(--text-faint); margin-top:-0.3rem;">
            <span>${minMHz} MHz</span>
            <span>${maxMHz.toLocaleString()} MHz</span>
          </div>

          <div class="grid grid-3" style="margin-top:1rem;">
            <div class="panel">
              <div class="panel-header"><span>Wavelength</span></div>
              <p class="readout" id="we-wavelength" style="margin:0; font-size:1.1rem;">${wl < 1 ? `${fmt(wl * 100, 1)} cm` : `${fmt(wl, wl < 10 ? 2 : 1)} m`}</p>
              <p class="text-faint" id="we-formula" style="margin:0.3rem 0 0; font-size:0.75rem;">300 &divide; ${fmt(mhz, 1)} MHz</p>
            </div>
            <div class="panel">
              <div class="panel-header"><span>Range name</span></div>
              <p class="readout" id="we-range" style="margin:0; font-size:1.1rem;">${range.name}</p>
              <p class="text-faint" id="we-range-bounds" style="margin:0.3rem 0 0; font-size:0.75rem;">${range.minMHz}&ndash;${range.maxMHz.toLocaleString()} MHz</p>
            </div>
            <div class="panel">
              <div class="panel-header"><span>Technician band</span></div>
              <p class="readout" id="we-band" style="margin:0; font-size:1.1rem;">${band ? band.name : "&mdash;"}</p>
              <p class="text-faint" id="we-band-bounds" style="margin:0.3rem 0 0; font-size:0.75rem;">${band ? `${band.minMHz}&ndash;${band.maxMHz} MHz` : "outside a Technician band"}</p>
            </div>
          </div>

          ${!revealed ? `
            <p class="text-dim" style="margin-top:1rem; margin-bottom:0.5rem;">
              Predict: at ${fmt(mhz, mhz < 30 ? 3 : 1)} MHz, does a signal typically <strong>bounce off the ionosphere</strong>
              back down to Earth, or <strong>pass through</strong> it into space?
            </p>
            <div class="cluster" role="radiogroup" aria-label="Your prediction" style="gap:0.5rem;">
              <button type="button" class="btn" data-guess="bounce">Bounces back (skip)</button>
              <button type="button" class="btn" data-guess="pass">Passes through</button>
            </div>
          ` : `
            <div class="cluster" style="gap:0.6rem; margin-top:1rem; align-items:center;">
              <span class="badge ${isCorrect ? "badge-success" : "badge-alert"}" tabindex="-1" id="we-feedback">${isCorrect ? "Correct" : "Not quite"}</span>
              <span class="text-dim" style="font-size:0.88rem;">${isHF ? "HF signals routinely skip off the ionosphere" : "VHF/UHF signals generally pass straight through"}</span>
            </div>
            <p class="text-dim" style="margin-top:0.5rem; margin-bottom:0;">
              ${isHF
                ? "The ionosphere is dense enough at HF wavelengths to bend the wave back down toward Earth — that's ordinary long-distance HF skip, not a rare event."
                : "VHF/UHF wavelengths are too short for the ionosphere to reliably bend back down — most of the signal keeps going into space, which is why VHF/UHF range is normally limited to roughly line-of-sight (T3C covers the occasional exceptions: sporadic E, tropo ducting, meteor scatter)."}
            </p>
            <div class="cluster" style="margin-top:0.85rem;">
              <button type="button" class="btn btn-primary" data-action="random">Try another frequency</button>
            </div>
          `}
        </div>
      `;
      wire();
      if (focus === "slider") container.querySelector("#we-slider").focus();
      if (focus === "feedback") container.querySelector("#we-feedback").focus();
    }

    function wire() {
      const slider = container.querySelector("#we-slider");
      const freqOut = container.querySelector("#we-freq");

      function liveUpdate() {
        // Continuous drag feedback: refresh the wave graphic and the three
        // numeric panels directly, without touching the question/guess
        // section below — that only resets once the learner settles on a
        // frequency (the "change" event), so buttons don't flicker mid-drag.
        const mhz = freqMHz;
        const wl = wavelengthM(mhz);
        const range = rangeAt(mhz);
        const band = bandAt(mhz);
        freqOut.textContent = `${fmt(mhz, mhz < 30 ? 3 : 1)} MHz`;
        container.querySelector("#we-wave").innerHTML = waveSvg(mhz);
        container.querySelector("#we-wavelength").textContent = wl < 1 ? `${fmt(wl * 100, 1)} cm` : `${fmt(wl, wl < 10 ? 2 : 1)} m`;
        container.querySelector("#we-formula").innerHTML = `300 &divide; ${fmt(mhz, 1)} MHz`;
        container.querySelector("#we-range").textContent = range.name;
        container.querySelector("#we-range-bounds").innerHTML = `${range.minMHz}&ndash;${range.maxMHz.toLocaleString()} MHz`;
        container.querySelector("#we-band").innerHTML = band ? band.name : "&mdash;";
        container.querySelector("#we-band-bounds").textContent = band ? `${band.minMHz}–${band.maxMHz} MHz` : "outside a Technician band";
      }

      slider.addEventListener("input", () => {
        freqMHz = freqFromFrac(Number(slider.value) / 1000);
        liveUpdate();
      });
      slider.addEventListener("change", () => {
        revealed = false;
        picked = null;
        render({ focus: "slider" });
      });

      container.querySelectorAll("[data-guess]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (revealed) return;
          picked = btn.dataset.guess;
          revealed = true;
          attempts += 1;
          if (picked === (freqMHz < 30 ? "bounce" : "pass")) correct += 1;
          render({ focus: "feedback" });
        });
      });

      const randomBtn = container.querySelector('[data-action="random"]');
      if (randomBtn) {
        randomBtn.addEventListener("click", () => {
          freqMHz = freqFromFrac(Math.random());
          revealed = false;
          picked = null;
          render({ focus: "slider" });
        });
      }
    }

    render();
  }

  return { init };
})();
