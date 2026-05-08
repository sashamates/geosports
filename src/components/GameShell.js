"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { questions as allQuestions } from "@/data/questions";
import { getDistanceKm } from "@/lib/distance";
import { calcScore } from "@/lib/scoring";
import { getScoreLabel } from "@/lib/resultLabels";
import { getResultPhrase } from "@/lib/resultPhrases";
import {
  getTodayDateKey, getDailyGameNumber,
  getGameNumberForDate, getDailyQuestions,
} from "@/lib/dailyChallenge";
import {
  hasCompletedToday, getResultForDate,
  saveCompletedGame, saveChallengeResult,
} from "@/lib/storage";
import HomeScreen    from "./HomeScreen";
import GameHeader    from "./GameHeader";
import QuestionPanel from "./QuestionPanel";
import MapView       from "./MapView";
import ResultPanel   from "./ResultPanel";
import FinalScore    from "./FinalScore";
import styles from "./GameShell.module.css";

const RESULT_PANEL_DELAY = 1200; // after animated reveal + toast appear
const TIMEOUT_PANEL_DELAY = 900; // timeout is simpler — no line animation
const QUESTION_SECONDS   = 60;

export default function GameShell() {
  // ── Refs resolved on mount from URL + localStorage ───────────────────────
  const dateKey         = useRef(getTodayDateKey());
  const gameNumber      = useRef(getDailyGameNumber());
  const questions       = useRef(getDailyQuestions(allQuestions, dateKey.current));
  const isChallengeMode = useRef(false);
  const challengedScore = useRef(null);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [view, setView]               = useState("loading");
  const [qIndex, setQIndex]           = useState(0);
  const [results, setResults]         = useState([]);
  const [currentResult, setCurrentResult] = useState(null);
  const [showPanel, setShowPanel]     = useState(false);
  const panelTimer                    = useRef(null);

  // ── Timer state ──────────────────────────────────────────────────────────
  const [timeLeft, setTimeLeft]  = useState(QUESTION_SECONDS);
  const timerRef                 = useRef(null);
  const guessLockedRef           = useRef(false);
  const handleTimeoutRef         = useRef(null);

  // ── On mount: read URL params, then check daily completion ───────────────
  useEffect(() => {
    const params    = new URLSearchParams(window.location.search);
    const rawDate   = params.get("challengeDate");
    const rawScore  = params.get("challengeScore");
    const dateRe    = /^\d{4}-\d{2}-\d{2}$/;

    if (rawDate && dateRe.test(rawDate) && rawScore && !isNaN(Number(rawScore))) {
      isChallengeMode.current = true;
      challengedScore.current = Number(rawScore);
      dateKey.current         = rawDate;
      gameNumber.current      = getGameNumberForDate(rawDate);
      questions.current       = getDailyQuestions(allQuestions, rawDate);
      setView("home");
    } else {
      const stored = getResultForDate(dateKey.current);
      if (stored?.completed) {
        setResults(stored.results);
        setView("finished");
      } else {
        setView("home");
      }
    }
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────
  const question   = questions.current[qIndex];
  const totalScore = results.reduce((s, r) => s + r.score, 0);
  const isLast     = qIndex === questions.current.length - 1;

  // ── Tap helper: show only on Q1 before any guess ─────────────────────────
  const showTapHelper = view === "playing" && qIndex === 0 && !currentResult && results.length === 0;

  // ── Timeout handler ───────────────────────────────────────────────────────
  const handleTimeout = useCallback(() => {
    if (guessLockedRef.current) return;
    guessLockedRef.current = true;
    clearInterval(timerRef.current);

    const q = questions.current[qIndex];
    setCurrentResult({
      questionId:      q.id,
      question:        q.question,
      sport:           q.sport,
      emoji:           q.emoji,
      guessedLat:      null,
      guessedLng:      null,
      answerLat:       q.lat,
      answerLng:       q.lng,
      distanceKm:      null,
      score:           0,
      scoreLabel:      "No points",
      answerLabel:     q.answerLabel,
      explanation:     q.explanation,
      timedOut:      true,
      resultPhrase:  getResultPhrase(null, 0, true),
    });
    clearTimeout(panelTimer.current);
    panelTimer.current = setTimeout(() => setShowPanel(true), TIMEOUT_PANEL_DELAY);
  }, [qIndex]);

  useEffect(() => { handleTimeoutRef.current = handleTimeout; }, [handleTimeout]);

  // ── Timer: start/reset per question ──────────────────────────────────────
  useEffect(() => {
    if (view !== "playing") return;

    guessLockedRef.current = false;
    setTimeLeft(QUESTION_SECONDS);
    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTimeout(() => handleTimeoutRef.current?.(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [qIndex, view]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleGuess = useCallback((lat, lng) => {
    if (currentResult || guessLockedRef.current) return;
    guessLockedRef.current = true;
    clearInterval(timerRef.current);

    const q          = questions.current[qIndex];
    const distanceKm = getDistanceKm(lat, lng, q.lat, q.lng);
    const score      = calcScore(distanceKm);

    setCurrentResult({
      questionId:   q.id,
      question:     q.question,
      sport:        q.sport,
      emoji:        q.emoji,
      guessedLat:   lat, guessedLng: lng,
      answerLat:    q.lat, answerLng: q.lng,
      distanceKm,   score,
      scoreLabel:   getScoreLabel(score),
      answerLabel:  q.answerLabel,
      explanation:  q.explanation,
      resultPhrase: getResultPhrase(distanceKm, score, false),
    });

    clearTimeout(panelTimer.current);
    panelTimer.current = setTimeout(() => setShowPanel(true), RESULT_PANEL_DELAY);
  }, [currentResult, qIndex]);

  const handleNext = useCallback(() => {
    if (!currentResult) return;
    const newResults = [...results, currentResult];
    setResults(newResults);
    setCurrentResult(null);
    setShowPanel(false);

    if (isLast) {
      const total = newResults.reduce((s, r) => s + r.score, 0);
      if (isChallengeMode.current) {
        saveChallengeResult(dateKey.current, challengedScore.current, total, newResults);
      } else {
        saveCompletedGame(dateKey.current, gameNumber.current, total, newResults);
      }
      setView("finished");
    } else {
      setQIndex((i) => i + 1);
    }
  }, [currentResult, results, isLast]);

  const handleReset = useCallback(() => {
    clearInterval(timerRef.current);
    guessLockedRef.current = false;
    setTimeLeft(QUESTION_SECONDS);
    setResults([]);
    setCurrentResult(null);
    setShowPanel(false);
    setQIndex(0);
    questions.current = getDailyQuestions(allQuestions, dateKey.current);
    setView("home");
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  if (view === "loading") return <div className={styles.shell} />;

  if (view === "home") {
    const stored = !isChallengeMode.current ? getResultForDate(dateKey.current) : null;
    return (
      <div className={styles.shell}>
        <HomeScreen
          gameNumber={gameNumber.current}
          questions={questions.current}
          alreadyPlayed={!isChallengeMode.current && hasCompletedToday(dateKey.current)}
          storedResult={stored}
          isChallengeMode={isChallengeMode.current}
          challengedScore={challengedScore.current}
          onPlay={() => setView("playing")}
          onViewResults={() => { if (stored) setResults(stored.results); setView("finished"); }}
        />
      </div>
    );
  }

  if (view === "finished") {
    const total = results.reduce((s, r) => s + r.score, 0);
    return (
      <div className={styles.shell}>
        <FinalScore
          results={results}
          gameNumber={gameNumber.current}
          totalScore={total}
          dateKey={dateKey.current}
          onReset={handleReset}
          isChallengeMode={isChallengeMode.current}
          challengedScore={challengedScore.current}
        />
      </div>
    );
  }

  // view === "playing"
  return (
    <div className={styles.shell}>
      <GameHeader
        questionIndex={qIndex}
        totalQuestions={questions.current.length}
        gameNumber={gameNumber.current}
        timeLeft={timeLeft}
        totalScore={totalScore}
      />
      <QuestionPanel
        question={question}
        questionIndex={qIndex}
        totalQuestions={questions.current.length}
      />
      <MapView
        question={question}
        questionId={question.id}
        onGuess={handleGuess}
        currentResult={currentResult}
        showTapHelper={showTapHelper}
      />
      {showPanel && currentResult && (
        <ResultPanel
          result={currentResult}
          onNext={handleNext}
          isLast={isLast}
        />
      )}
    </div>
  );
}
