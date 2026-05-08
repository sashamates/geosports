"use client";

import { useState } from "react";
import { buildShareText } from "@/lib/share";
import styles from "./ShareButton.module.css";

export default function ShareButton({ results, gameNumber, totalScore }) {
  const [status, setStatus] = useState("idle"); // idle | shared | copied

  async function handleShare() {
    const text = buildShareText(results, gameNumber, totalScore);

    if (navigator.share) {
      try {
        await navigator.share({ text });
        setStatus("shared");
        setTimeout(() => setStatus("idle"), 2500);
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {}
  }

  const label =
    status === "copied" ? "✓ Copied!" : status === "shared" ? "✓ Shared!" : "Share Result";

  return (
    <button className={styles.btn} onClick={handleShare}>
      {label}
    </button>
  );
}
