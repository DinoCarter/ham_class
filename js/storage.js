const HamStorage = (function () {
  const KEY = "ham-course-progress-v1";

  function readAll() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : { subelements: {}, quizzes: [] };
    } catch (e) {
      console.warn("HamStorage: failed to read progress, resetting.", e);
      return { subelements: {}, quizzes: [] };
    }
  }

  function writeAll(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function recordAnswer(examKey, questionId, subelementId, wasCorrect) {
    const state = readAll();
    const subKey = `${examKey}:${subelementId}`;
    if (!state.subelements[subKey]) {
      state.subelements[subKey] = { seen: {}, correct: {} };
    }
    const bucket = state.subelements[subKey];
    bucket.seen[questionId] = (bucket.seen[questionId] || 0) + 1;
    if (wasCorrect) {
      bucket.correct[questionId] = (bucket.correct[questionId] || 0) + 1;
    }
    writeAll(state);
  }

  function recordQuizResult(examKey, scorePct, correctCount, totalCount) {
    const state = readAll();
    state.quizzes.push({
      exam: examKey,
      scorePct,
      correctCount,
      totalCount,
      timestamp: new Date().toISOString(),
    });
    writeAll(state);
  }

  function getSubelementStats(examKey, subelementId) {
    const state = readAll();
    const bucket = state.subelements[`${examKey}:${subelementId}`];
    if (!bucket) return { seenCount: 0, accuracy: null };
    const ids = Object.keys(bucket.seen);
    const seenCount = ids.length;
    const totalAttempts = ids.reduce((sum, id) => sum + bucket.seen[id], 0);
    const totalCorrect = ids.reduce((sum, id) => sum + (bucket.correct[id] || 0), 0);
    return {
      seenCount,
      accuracy: totalAttempts > 0 ? totalCorrect / totalAttempts : null,
    };
  }

  function getQuizHistory(examKey) {
    const state = readAll();
    return examKey ? state.quizzes.filter((q) => q.exam === examKey) : state.quizzes;
  }

  function resetAll() {
    localStorage.removeItem(KEY);
  }

  return {
    recordAnswer,
    recordQuizResult,
    getSubelementStats,
    getQuizHistory,
    resetAll,
  };
})();
