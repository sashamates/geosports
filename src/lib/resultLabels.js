export function getScoreLabel(score) {
  if (score >= 950) return "Bullseye";
  if (score >= 850) return "Elite";
  if (score >= 700) return "Solid";
  if (score >= 500) return "Decent";
  if (score >= 250) return "Rough";
  if (score > 0)   return "Miles off";
  return "No points";
}

export function getScoreSquare(score) {
  if (score >= 900) return "🟩";
  if (score >= 700) return "🟨";
  if (score >= 400) return "🟧";
  if (score > 0)   return "🟥";
  return "⬛";
}
