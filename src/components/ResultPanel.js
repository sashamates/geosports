import { getScoreLabel } from "@/lib/resultLabels";
import styles from "./ResultPanel.module.css";

export default function ResultPanel({ result, onNext, isLast }) {
  const { score, distanceKm, answerLabel, explanation, timedOut } = result;
  const isPerfect = score === 1000;
  const label     = getScoreLabel(score);

  let gradeColor;
  if (timedOut)          gradeColor = "var(--red)";
  else if (score >= 900) gradeColor = "var(--green)";
  else if (score >= 700) gradeColor = "var(--gold)";
  else if (score >= 400) gradeColor = "var(--orange)";
  else                   gradeColor = "var(--red)";

  const distStr = timedOut
    ? "No guess — shot clock expired"
    : distanceKm < 10
    ? "less than 10 km away"
    : `${distanceKm.toLocaleString()} km away`;

  return (
    <div className={[
      styles.panel,
      isPerfect ? styles.perfectPin : "",
      timedOut  ? styles.timedOut   : "",
    ].join(" ")}>

      {isPerfect && <div className={styles.perfectBadge}>PERFECT PIN ★</div>}
      {timedOut  && <div className={styles.timeoutBadge}>SHOT CLOCK VIOLATION</div>}

      <div className={styles.top}>
        <div className={styles.answerBlock}>
          <span className={styles.answerLbl}>Correct answer</span>
          <span className={styles.answerVal}>{answerLabel}</span>
        </div>
        <div className={styles.scoreBlock}>
          <span className={styles.scoreNum}>{score}</span>
          <span className={styles.scoreDenom}>/1000</span>
        </div>
      </div>

      <div className={styles.middle}>
        <span className={styles.dist}>📍 {distStr}</span>
        <span className={styles.scoreLabel} style={{ color: gradeColor }}>{label}</span>
      </div>

      <p className={styles.explanation}>{explanation}</p>

      <button className={styles.nextBtn} onClick={onNext}>
        {isLast ? "View Final Score" : "Next Question →"}
      </button>
    </div>
  );
}
