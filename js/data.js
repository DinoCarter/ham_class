const HamData = (function () {
  const cache = {};

  function root() {
    const mount = document.getElementById("site-header");
    return (mount && mount.dataset.root) || "";
  }

  async function loadJSON(path) {
    if (cache[path]) return cache[path];
    const res = await fetch(root() + path);
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    const json = await res.json();
    cache[path] = json;
    return json;
  }

  const EXAMS = {
    technician: {
      key: "technician",
      label: "Technician",
      element: "Element 2",
      questions: "data/technician.json",
      outline: "data/technician-outline.json",
    },
    general: {
      key: "general",
      label: "General",
      element: "Element 3",
      questions: "data/general.json",
      outline: "data/general-outline.json",
    },
  };

  async function getQuestions(examKey) {
    return loadJSON(EXAMS[examKey].questions);
  }

  async function getOutline(examKey) {
    return loadJSON(EXAMS[examKey].outline);
  }

  async function getSubelement(examKey, subelementId) {
    const [questions, outline] = await Promise.all([
      getQuestions(examKey),
      getOutline(examKey),
    ]);
    return {
      meta: outline.find((s) => s.id === subelementId) || null,
      questions: questions.filter((q) => q.subelement === subelementId),
    };
  }

  return { EXAMS, getQuestions, getOutline, getSubelement };
})();
