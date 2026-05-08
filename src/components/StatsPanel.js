"use client";

import { useEffect, useState } from "react";
import { getStats } from "@/lib/storage";
import styles from "./StatsPanel.module.css";

export default function StatsPanel() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    setStats(getStats());
  }, []);

  if (!stats || stats.gamesPlayed === 0) return null;

  const avg = stats.gamesPlayed > 0
    ? Math.round(stats.totalScoreAllGames / stats.gamesPlayed).toLocaleString()
    : "—";

  const rows = [
    { label: "Played",       value: stats.gamesPlayed },
    { label: "Streak",       value: `${stats.currentStreak} 🔥` },
    { label: "Best streak",  value: stats.maxStreak },
    { label: "Best score",   value: stats.bestScore.toLocaleString() },
    { label: "Avg score",    value: avg },
    { label: "Bullseyes",    value: stats.perfectGuesses },
  ];

  return (
    <div className={styles.panel}>
      <div className={styles.title}>Your Stats</div>
      <div className={styles.grid}>
        {rows.map((r) => (
          <div key={r.label} className={styles.cell}>
            <span className={styles.val}>{r.value}</span>
            <span className={styles.lbl}>{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
