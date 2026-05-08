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

// ── Region/difficulty-balanced daily selection ────────────────────────────────
//
// Target per game: 1 easy · 2 medium · 1 hard · 1 deep-cut
// Soft constraints (relaxed gracefully):
//   • ≤ 2 questions from the same region
//   • ≤ 2 questions from the same sport

export function getDailyQuestions(allQuestions, dateKey, count = 5) {
  const shuffled = seedShuffle(allQuestions, dateKey);

  const selected = [];
  const regionCount = {};
  const sportCount  = {};
  const used        = new Set();

  function balanced(q) {
    return (regionCount[q.region] ?? 0) < 2 && (sportCount[q.sport] ?? 0) < 2;
  }

  function relaxedRegion(q) {
    return (regionCount[q.region] ?? 0) < 2;
  }

  function push(q) {
    selected.push(q);
    used.add(q.id);
    regionCount[q.region] = (regionCount[q.region] ?? 0) + 1;
    sportCount[q.sport]   = (sportCount[q.sport]   ?? 0) + 1;
  }

  // Pass 1 – fill each difficulty slot with full balance constraints
  const targets = ["easy", "medium", "medium", "hard", "deep-cut"];
  for (const difficulty of targets) {
    if (selected.length >= count) break;
    const pick = shuffled.find(q => !used.has(q.id) && q.difficulty === difficulty && balanced(q));
    if (pick) push(pick);
  }

  // Pass 2 – fill remaining slots, any difficulty, still balanced
  for (const q of shuffled) {
    if (selected.length >= count) break;
    if (!used.has(q.id) && balanced(q)) push(q);
  }

  // Pass 3 – relax sport constraint, keep region constraint
  for (const q of shuffled) {
    if (selected.length >= count) break;
    if (!used.has(q.id) && relaxedRegion(q)) push(q);
  }

  // Pass 4 – fill anything remaining (no constraints)
  for (const q of shuffled) {
    if (selected.length >= count) break;
    if (!used.has(q.id)) push(q);
  }

  return selected;
}

// ── Daily theme label ─────────────────────────────────────────────────────────

export function getDailyTheme(questions) {
  const hardCount     = questions.filter(q => q.difficulty === "hard" || q.difficulty === "deep-cut").length;
  const bigGameCount  = questions.filter(q => ["final", "upset", "rivalry"].includes(q.clueType)).length;
  const footballCount = questions.filter(q => q.sport === "Football").length;

  if (hardCount >= 3)    return "Sicko Mode";
  if (bigGameCount >= 3) return "Big Game Lore";
  if (footballCount >= 3) return "Football Cities";
  return "Mixed Sports";
}

// ── Preview helpers for HomeScreen ───────────────────────────────────────────

export function getQuestionRegions(questions) {
  return [...new Set(questions.map((q) => q.region).filter(Boolean))];
}

export function getQuestionSports(questions) {
  return [...new Set(questions.map((q) => q.sport).filter(Boolean))];
}
