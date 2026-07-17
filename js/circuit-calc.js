/**
 * Live Ohm's Law + DC power calculator for T5D (and the T5C power formula).
 * Type into any two of voltage/current/resistance and the third fills in as
 * you type, along with power — the active field (the one being computed)
 * is highlighted along with which rearrangement of the law is currently in
 * use, so the three formulas read as one relationship instead of three
 * separate facts to memorize.
 */
const HamCircuitCalc = (function () {
  function fmt(n) {
    if (n === null || !isFinite(n)) return "&mdash;";
    const rounded = Math.round(n * 1000) / 1000;
    return rounded.toLocaleString(undefined, { maximumFractionDigits: 3 });
  }

  function init(container) {
    const values = { E: 12, I: 2.5, R: null };
    // order[0] is the "output" field (computed from the other two); the
    // other two are treated as the fixed inputs. Typing into a field
    // promotes it to input and demotes whichever of the other two was
    // edited longest ago back to being the computed output.
    let order = ["R", "E", "I"];

    function compute() {
      const out = order[0];
      const [a, b] = order.slice(1);
      if (values[a] === null || values[b] === null || isNaN(values[a]) || isNaN(values[b])) {
        values[out] = null;
        return;
      }
      if (out === "R") values.R = values.I === 0 ? null : values.E / values.I;
      else if (out === "E") values.E = values.I * values.R;
      else if (out === "I") values.I = values.R === 0 ? null : values.E / values.R;
    }

    function formulaLabel() {
      const out = order[0];
      if (out === "R") return "R = E &divide; I";
      if (out === "E") return "E = I &times; R";
      return "I = E &divide; R";
    }

    compute();

    function render() {
      const power = (values.E !== null && values.I !== null && !isNaN(values.E) && !isNaN(values.I))
        ? values.E * values.I
        : null;
      const outField = order[0];

      container.innerHTML = `
        <div class="panel panel-corners" role="group" aria-label="Ohm's Law and power calculator">
          <div class="panel-header"><span>Ohm's Law &amp; power calculator</span></div>
          <p class="text-dim" style="margin-top:0; margin-bottom:0.85rem;">
            Type into any two fields &mdash; the third fills in live. Whichever field you haven't
            touched most recently is the one being computed (highlighted below), so you can watch
            the law rearrange itself instead of picking a formula from memory.
          </p>
          <div class="grid grid-3">
            ${["E", "I", "R"].map((key) => {
              const label = key === "E" ? "Voltage (E), volts" : key === "I" ? "Current (I), amps" : "Resistance (R), ohms";
              const isOut = key === outField;
              return `
                <div class="field" style="margin-bottom:0;">
                  <label for="cc-${key}">${label}${isOut ? ' <span class="text-faint">(computed)</span>' : ""}</label>
                  <input type="text" inputmode="decimal" id="cc-${key}" data-field="${key}"
                    value="${values[key] === null || isNaN(values[key]) ? "" : fmt(values[key]).replace("&mdash;", "")}"
                    style="${isOut ? "border-color:var(--amber); box-shadow:0 0 0 1px var(--amber-glow);" : ""}" />
                </div>
              `;
            }).join("")}
          </div>
          <div class="cluster" style="justify-content:space-between; margin-top:1rem;">
            <span class="readout" style="font-size:1rem;">P = ${fmt(power)} W</span>
            <span class="badge">${formulaLabel()}</span>
          </div>
        </div>
      `;
      wire();
    }

    function wire() {
      container.querySelectorAll("[data-field]").forEach((input) => {
        input.addEventListener("input", () => {
          const key = input.dataset.field;
          const raw = input.value.trim();
          const parsed = raw === "" ? null : Number(raw);
          values[key] = raw === "" ? null : (isNaN(parsed) ? NaN : parsed);
          // Promote this field to "input" status (most recently touched);
          // whichever of the remaining two hasn't been touched in longest
          // becomes the new computed output.
          order = [...order.filter((k) => k !== key), key];
          // order[0] should be the field NOT touched most recently among
          // the other two — after the push above, order[2] is this field,
          // so the computed output is order[0] (unchanged relative order
          // of the untouched pair).
          compute();
          render();
          const el = container.querySelector(`#cc-${key}`);
          if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
        });
      });
    }

    render();
  }

  return { init };
})();
