"use client";

import { useEffect, useState } from "react";
import { getScoreSquare } from "@/lib/resultLabels";
import { getStats } from "@/lib/storage";
import { buildShareText, getChallengeLink } from "@/lib/share";
import ShareButton from "./ShareButton";
import styles from "./FinalScore.module.css";

export default function FinalScore({
  results,
  gameNumber,
  totalScore,
  dateKey,
  onReset,
  isChallengeMode = false,
  challengedScore = null,
}) {
  const [stats, setStats] = useState(null);
  const [challengeStatus, setChallengeStatus] = useState("idle"); // idle | copied | shared

  useEffect(() => {
    if (!isChallengeMode) setStats(getStats());
  }, [isChallengeMode]);

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  // Challenge result label
  let challengeOutcome = null;
  if (isChallengeMode && challengedScore !== null) {
    if (totalScore > challengedScore)      challengeOutcome = { msg: "You beat the challenge! 🏆", color: "var(--green)" };
    else if (totalScore === challengedScore) challengeOutcome = { msg: "You tied the challenge! 🤝", color: "var(--gold)" };
    else                                   challengeOutcome = { msg: "You lost the challenge.", color: "var(--text-muted)" };
  }

  async function handleChallengeShare() {
    const link = getChallengeLink(dateKey, totalScore);
    const text = `GeoSports Challenge #${gameNumber}\nI scored ${totalScore.toLocaleString()} / 5,000. Can you beat me?\n\n${link}`;
    if (navigator.share) {
      try { await navigator.share({ text }); setChallengeStatus("shared"); setTimeout(() => setChallengeStatus("idle"), 2500); return; } catch {}
    }
    try { await navigator.clipboard.writeText(link); setChallengeStatus("copied"); setTimeout(() => setChallengeStatus("idle"), 2500); } catch {}
  }

  const challengeBtnLabel =
    challengeStatus === "copied" ? "✓ Link copied!" :
    challengeStatus === "shared" ? "✓ Shared!" :
    "Challenge a Friend";

  return (
    <div className={styles.screen}>
      <div className={styles.inner}>
        {/* Header */}
        <div className={styles.head}>
          <div className={styles.logo}>
            {isChallengeMode ? "⚔️ GeoSports Challenge" : "⚽ GeoSports Daily"}
          </div>
          <div className={styles.sub}>#{gameNumber} · {dateStr}</div>
        </div>

        {/* Challenge context */}
        {isChallengeMode && challengedScore !== null && (
          <div className={styles.challengeBox}>
            <div className={styles.challengeRow}>
              <span className={styles.challengeLbl}>Score to beat</span>
              <span className={styles.challengeVal}>{challengedScore.toLocaleString()}</span>
            </div>
            <div className={styles.challengeRow}>
              <span className={styles.challengeLbl}>Your score</span>
              <span className={styles.challengeVal}>{totalScore.toLocaleString()}</span>
            </div>
            {challengeOutcome && (
              <div className={styles.challengeOutcome} style={{ color: challengeOutcome.color }}>
                {challengeOutcome.msg}
              </div>
            )}
          </div>
        )}

        {/* Total */}
        <div className={styles.totalBox}>
          <div className={styles.totalLabel}>Total Score</div>
          <div className={styles.totalScore}>
            {totalScore.toLocaleString()}
            <span className={styles.totalDenom}>&thinsp;/&thinsp;5,000</span>
          </div>
          <div className={styles.squares}>
            {results.map((r) => getScoreSquare(r.score))}
          </div>
        </div>

        {/* Breakdown */}
        <div className={styles.breakdown}>
          {results.map((r, i) => (
            <div key={i} className={styles.row}>
              <span className={styles.rowEmoji}>{r.emoji}</span>
              <div className={styles.rowMeta}>
                <span className={styles.rowLabel}>{r.answerLabel}</span>
                <span className={styles.rowSport}>
                  {r.sport} · {r.distanceKm == null ? "no guess" : r.distanceKm < 10 ? "< 10 km" : `${r.distanceKm.toLocaleString()} km`}
                </span>
              </div>
              <span className={styles.rowSquare}>{getScoreSquare(r.score)}</span>
              <span className={styles.rowScore}>{r.score}</span>
            </div>
          ))}
        </div>

        {/* Daily stats (hidden in challenge mode) */}
        {!isChallengeMode && stats && stats.gamesPlayed > 0 && (
          <div className={styles.statsGrid}>
            {[
              { val: stats.gamesPlayed, lbl: "Played" },
              { val: `${stats.currentStreak}🔥`, lbl: "Streak" },
              { val: stats.maxStreak, lbl: "Best streak" },
              { val: stats.bestScore.toLocaleString(), lbl: "Best score" },
              { val: Math.round(stats.totalScoreAllGames / stats.gamesPlayed).toLocaleString(), lbl: "Avg score" },
              { val: stats.perfectGuesses, lbl: "Bullseyes" },
            ].map((s) => (
              <div key={s.lbl} className={styles.statCell}>
                <span className={styles.statVal}>{s.val}</span>
                <span className={styles.statLbl}>{s.lbl}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <ShareButton results={results} gameNumber={gameNumber} totalScore={totalScore} />
          <button className={styles.challengeBtn} onClick={handleChallengeShare}>
            {challengeBtnLabel}
          </button>
        </div>

        <a
          className={styles.reportLink}
          href={`mailto:sashamates12@gmail.com?subject=${encodeURIComponent("GeoSports: Bad clue report")}`}
        >
          See a bad clue? Report it.
        </a>
      </div>
    </div>
  );
}
