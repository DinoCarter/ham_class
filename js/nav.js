(function () {
  const NAV_LINKS = [
    { href: "index.html", label: "Home" },
    { href: "technician.html", label: "Technician" },
    { href: "general.html", label: "General" },
    { href: "flashcards.html", label: "Flashcards" },
    { href: "quiz.html", label: "Quiz" },
    { href: "dashboard.html", label: "Dashboard" },
    { href: "glossary.html", label: "Glossary" },
  ];

  function currentPath() {
    const p = location.pathname.split("/").pop();
    return p === "" ? "index.html" : p;
  }

  function renderHeader() {
    const mount = document.getElementById("site-header");
    if (!mount) return;
    const here = currentPath();
    const root = mount.dataset.root || "";

    const links = NAV_LINKS.map((l) => {
      const href = root + l.href;
      const isCurrent = l.href === here;
      return `<a href="${href}"${isCurrent ? ' aria-current="page"' : ""}>${l.label}</a>`;
    }).join("");

    mount.innerHTML = `
      <div class="container">
        <a class="brand" href="${root}index.html">
          <span class="lamp" aria-hidden="true"></span>
          <span>HAM&nbsp;OPS<small>Element&nbsp;2&nbsp;/&nbsp;Element&nbsp;3&nbsp;trainer</small></span>
        </a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" aria-label="Toggle navigation menu">
          <span></span>
        </button>
        <nav class="site-nav" id="primary-nav" aria-label="Primary">${links}</nav>
      </div>
    `;

    const toggle = mount.querySelector(".nav-toggle");
    const nav = mount.querySelector(".site-nav");
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  function renderFooter() {
    const mount = document.getElementById("site-footer");
    if (!mount) return;
    const root = mount.dataset.root || "";
    mount.innerHTML = `
      <div class="container">
        <div>
          Question pools &copy; <a href="https://ncvec.org" target="_blank" rel="noopener">NCVEC Question Pool Committee</a>.
          Regulatory text from FCC Part 97. Background material informed by
          <a href="https://www.arrl.org" target="_blank" rel="noopener">ARRL</a> reference publications.
        </div>
        <div>Technician pool (2026&ndash;2030) effective 7/1/2026. General pool (2023&ndash;2027) effective 7/1/2023, 6th Errata Feb 4 2026.</div>
        <div><a href="${root}README.md">About this project</a> &middot; runs entirely offline in your browser, no accounts, no tracking.</div>
      </div>
    `;
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderHeader();
    renderFooter();
  });
})();
