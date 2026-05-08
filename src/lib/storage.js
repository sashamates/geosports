const DAILY_KEY    = "geosports-v1";
const CHALLENGE_KEY = "geosports-challenges";

function getYesterday(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

const DEFAULT_STATS = {
  gamesPlayed: 0,
  currentStreak: 0,
  maxStreak: 0,
  bestScore: 0,
  totalScoreAllGames: 0,
  perfectGuesses: 0,
  lastCompletedDate: null,
};

// ── Daily storage ─────────────────────────────────────────────────────────────

export function getStoredData() {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (!raw) return { resultsByDate: {}, stats: { ...DEFAULT_STATS } };
    const parsed = JSON.parse(raw);
    return {
      resultsByDate: parsed.resultsByDate ?? {},
      stats: { ...DEFAULT_STATS, ...(parsed.stats ?? {}) },
    };
  } catch {
    return { resultsByDate: {}, stats: { ...DEFAULT_STATS } };
  }
}

function saveStoredData(data) {
  try { localStorage.setItem(DAILY_KEY, JSON.stringify(data)); } catch {}
}

export function getResultForDate(dateKey) {
  return getStoredData().resultsByDate[dateKey] ?? null;
}

export function hasCompletedToday(dateKey) {
  return Boolean(getResultForDate(dateKey)?.completed);
}

export function saveCompletedGame(dateKey, gameNumber, totalScore, results) {
  const data = getStoredData();
  data.resultsByDate[dateKey] = { completed: true, dateKey, gameNumber, totalScore, results };

  const stats     = data.stats;
  const yesterday = getYesterday(dateKey);
  const streak    = stats.lastCompletedDate === yesterday ? stats.currentStreak + 1 : 1;

  stats.gamesPlayed        += 1;
  stats.currentStreak       = streak;
  stats.maxStreak           = Math.max(stats.maxStreak, streak);
  stats.bestScore           = Math.max(stats.bestScore, totalScore);
  stats.totalScoreAllGames += totalScore;
  stats.lastCompletedDate   = dateKey;
  stats.perfectGuesses     += results.filter((r) => r.score === 1000).length;

  saveStoredData(data);
}

export function getStats() {
  return getStoredData().stats;
}

export function resetToday(dateKey) {
  const data  = getStoredData();
  const entry = data.resultsByDate[dateKey];
  if (!entry) return;

  const s = data.stats;
  s.gamesPlayed        = Math.max(0, s.gamesPlayed - 1);
  s.totalScoreAllGames = Math.max(0, s.totalScoreAllGames - entry.totalScore);
  s.perfectGuesses     = Math.max(0, s.perfectGuesses - entry.results.filter((r) => r.score === 1000).length);
  if (s.lastCompletedDate === dateKey) {
    const remaining = Object.keys(data.resultsByDate).filter((k) => k !== dateKey).sort();
    s.lastCompletedDate = remaining.length ? remaining[remaining.length - 1] : null;
    s.currentStreak     = Math.max(0, s.currentStreak - 1);
  }

  delete data.resultsByDate[dateKey];
  saveStoredData(data);
}

// ── Challenge storage (separate – never affects daily streaks) ────────────────

export function saveChallengeResult(dateKey, challengedScore, playerScore, results) {
  try {
    const raw  = localStorage.getItem(CHALLENGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    const key  = `${dateKey}-${challengedScore}`;
    data[key]  = { dateKey, challengedScore, playerScore, results, completedAt: Date.now() };
    localStorage.setItem(CHALLENGE_KEY, JSON.stringify(data));
  } catch {}
}
