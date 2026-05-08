import styles from "./QuestionPanel.module.css";

export default function QuestionPanel({ question, questionIndex, totalQuestions }) {
  return (
    <div className={styles.panel}>
      <div className={styles.meta}>
        {totalQuestions != null && (
          <span className={styles.qCount}>
            Q&thinsp;{(questionIndex ?? 0) + 1}&thinsp;/&thinsp;{totalQuestions}
          </span>
        )}
        <span className={styles.sportBadge}>
          {question.emoji}&thinsp;{question.sport}
        </span>
        <span className={styles.difficulty} data-level={question.difficulty}>
          {question.difficulty}
        </span>
      </div>
      <p className={styles.text}>{question.question}</p>
    </div>
  );
}
