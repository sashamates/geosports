import StatsPanel from "./StatsPanel";
import styles from "./HomeScreen.module.css";

export default function HomeScreen({
  gameNumber,
  alreadyPlayed,
  storedResult,
  questions,
  onPlay,
  onViewResults,
  // Challenge mode
  isChallengeMode = false,
  challengedScore = null,
}) {
  const regions = questions ? [...new Set(questions.map((q) => q.region).filter(Boolean))] : [];
  const sports  = questions ? [...new Set(questions.map((q) => q.sport).filter(Boolean))]  : [];

  return (
    <div className={styles.screen}>
      <div className={styles.inner}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>{isChallengeMode ? "⚔️" : "⚽"}</span>
          <h1 className={styles.logoText}>GeoSports</h1>
        </div>

        {isChallengeMode ? (
          /* ── Challenge mode ── */
          <>
            <div className={styles.challengeBanner}>
              <div className={styles.challengeTitle}>Friend Challenge</div>
              <div className={styles.challengeTarget}>
                Beat <strong>{challengedScore?.toLocaleString()}</strong>&thinsp;/&thinsp;5,000
              </div>
            </div>

            <div className={styles.todayBox}>
              <div className={styles.todayLabel}>Challenge #{gameNumber}</div>
              <div className={styles.todayMeta}>
                <span>5 questions</span>
                <span className={styles.dot}>·</span>
                <span>Max 5,000 pts</span>
              </div>
              {regions.length > 0 && (
                <div className={styles.todayHint}>
                  🌍 {regions.join(" · ")}
                </div>
              )}
            </div>

            <button className={styles.btnPrimary} onClick={onPlay}>
              Accept Challenge
            </button>
          </>
        ) : (
          /* ── Daily mode ── */
          <>
            <p className={styles.tagline}>
              Read the clue.<br />
              Drop the pin.<br />
              Score by distance.
            </p>

            {alreadyPlayed ? (
              <div className={styles.doneBox}>
                <p className={styles.doneMsg}>You&rsquo;ve completed today&rsquo;s challenge.</p>
                <p className={styles.doneScore}>
                  Score: <strong>{storedResult?.totalScore?.toLocaleString()}</strong>&thinsp;/&thinsp;5,000
                </p>
                <button className={styles.btnPrimary} onClick={onViewResults}>
                  View Results
                </button>
                <p className={styles.comeBack}>Come back tomorrow for a new challenge.</p>
              </div>
            ) : (
              <button className={styles.btnPrimary} onClick={onPlay}>
                Play Today
              </button>
            )}

            <StatsPanel />
          </>
        )}
      </div>
    </div>
  );
}
