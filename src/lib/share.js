import { getScoreSquare } from "./resultLabels";

export function buildShareText(results, gameNumber, totalScore) {
  const total = totalScore ?? results.reduce((s, r) => s + r.score, 0);
  const lines = results.map((r) => `${r.emoji} ${getScoreSquare(r.score)} ${r.score}`);
  return [
    `GeoSports #${gameNumber ?? ""}`,
    `${total.toLocaleString()} / 5,000`,
    "",
    ...lines,
    "",
    "Read the clue. Drop the pin.",
  ].join("\n");
}

export function getChallengeLink(dateKey, totalScore) {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/?challengeDate=${dateKey}&challengeScore=${totalScore}`;
}
