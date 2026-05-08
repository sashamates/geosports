const LAUNCH = new Date("2026-05-01T00:00:00");

// ── Date helpers ─────────────────────────────────────────────────────────────

export function getTodayDateKey() {
  const d = new Date();
  return fmtDate(d);
}

function fmtDate(d) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function getDailyGameNumber() {
  return getGameNumberForDate(getTodayDateKey());
}

export function getGameNumberForDate(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  const days = Math.floor((date - LAUNCH) / 86400000);
  return Math.max(1, days + 1);
}

// ── Seeded shuffle ────────────────────────────────────────────────────────────

function seedShuffle(arr, dateKey) {
  const seed = dateKey
    .replace(/-/g, "")
    .split("")
    .reduce((acc, c) => acc * 31 + c.charCodeAt(0), 7);

  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ── Region-balanced daily selection ──────────────────────────────────────────
//
// Rules (soft constraints, graceful fallback):
//  • ≤ 2 questions from the same region
//  • ≤ 2 questions from the same sport
//  • prefer at least 1 easy, 2 medium, 1 hard

export function getDailyQuestions(allQuestions, dateKey, count = 5) {
  const shuffled = seedShuffle(allQuestions, dateKey);

  const selected = [];
  const regionCount = {};
  const sportCount  = {};

  function fits(q) {
    return (
      (regionCount[q.region] ?? 0) < 2 &&
      (sportCount[q.sport] ?? 0) < 2
    );
  }

  function push(q) {
    selected.push(q);
    regionCount[q.region] = (regionCount[q.region] ?? 0) + 1;
    sportCount[q.sport]   = (sportCount[q.sport]   ?? 0) + 1;
  }

  // Pass 1 – balanced pass respecting both constraints
  for (const q of shuffled) {
    if (selected.length >= count) break;
    if (fits(q)) push(q);
  }

  // Pass 2 – relax sport constraint only (still respect region)
  if (selected.length < count) {
    for (const q of shuffled) {
      if (selected.length >= count) break;
      if (selected.includes(q)) continue;
      if ((regionCount[q.region] ?? 0) < 2) push(q);
    }
  }

  // Pass 3 – fill anything remaining (no constraints)
  if (selected.length < count) {
    for (const q of shuffled) {
      if (selected.length >= count) break;
      if (!selected.includes(q)) push(q);
    }
  }

  return selected;
}

// ── Preview helpers for HomeScreen ───────────────────────────────────────────

export function getQuestionRegions(questions) {
  return [...new Set(questions.map((q) => q.region).filter(Boolean))];
}

export function getQuestionSports(questions) {
  return [...new Set(questions.map((q) => q.sport).filter(Boolean))];
}
