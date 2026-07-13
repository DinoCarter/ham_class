const HamLesson = (function () {
  async function renderGroupQuestions(examKey, groupId, mount) {
    const all = await HamData.getQuestions(examKey);
    const qs = all.filter((q) => q.group === groupId);
    mount.innerHTML = qs.map((q) => `
      <div class="stack" style="border-bottom:1px solid var(--border); padding-bottom:0.75rem; margin-bottom:0.75rem;">
        <div class="cluster" style="justify-content:space-between;">
          <span class="badge badge-muted">${q.id}</span>
          ${q.citation ? `<span class="text-faint" style="font-family:var(--font-mono); font-size:0.72rem;">&sect;${q.citation}</span>` : ""}
        </div>
        <p style="margin:0;">${q.question}</p>
        <div class="stack" style="gap:0.25rem;">
          ${"ABCD".split("").map((l) => `
            <div class="cluster" style="gap:0.5rem;">
              <span class="badge ${l === q.answer ? "badge-success" : "badge-muted"}" style="min-width:1.6em; justify-content:center;">${l}</span>
              <span class="${l === q.answer ? "text" : "text-dim"}" style="font-size:0.9rem;">${q.choices[l]}</span>
            </div>
          `).join("")}
        </div>
      </div>
    `).join("");
  }

  function wireDetails(root) {
    root.querySelectorAll("details[data-group]").forEach((details) => {
      let loaded = false;
      details.addEventListener("toggle", () => {
        if (details.open && !loaded) {
          loaded = true;
          const mount = details.querySelector("[data-questions]");
          renderGroupQuestions(details.dataset.exam, details.dataset.group, mount);
        }
      });
    });
  }

  return { renderGroupQuestions, wireDetails };
})();
