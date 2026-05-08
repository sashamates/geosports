import styles from "./GameHeader.module.css";

function formatShotClock(seconds) {
  if (seconds < 10) return `0${seconds}`;
  return String(seconds);
}

export default function GameHeader({ questionIndex, totalQuestions, gameNumber, timeLeft, totalScore }) {
  const clockStr   = formatShotClock(timeLeft);
  const clockState = timeLeft <= 5 ? styles.danger : timeLeft <= 15 ? styles.warning : "";

  return (
    <header className={styles.header}>
      {/* Row 1: score card + shot clock */}
      <div className={styles.topRow}>
        <div className={styles.scoreCard}>
          <span className={styles.scoreLabel}>SCORE</span>
          <div className={styles.scoreNum}>
            {(totalScore ?? 0).toLocaleString()}
            <span className={styles.scoreDenom}>&thinsp;/ 5,000</span>
          </div>
        </div>

        <div className={`${styles.shotClock} ${clockState}`}>
          <span className={styles.shotClockLabel}>SHOT CLOCK</span>
          <span className={styles.shotClockTime}>{clockStr}</span>
          {timeLeft <= 5 && (
            <span className={styles.urgency}>GET THE SHOT OFF</span>
          )}
        </div>
      </div>

      {/* Row 2: branding + question counter */}
      <div className={styles.bottomRow}>
        <div className={styles.logo}>
          <span>⚽</span>
          <span className={styles.logoText}>GeoSports</span>
          {gameNumber && <span className={styles.gameNum}>#{gameNumber}</span>}
        </div>
        <span className={styles.qCount}>
          Q&thinsp;{questionIndex + 1}&thinsp;/&thinsp;{totalQuestions}
        </span>
      </div>
    </header>
  );
}
