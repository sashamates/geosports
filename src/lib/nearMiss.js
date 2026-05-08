const BANDS = [
  {
    max: 10,
    msgs: [
      "Dead on. We'll pretend that was skill.",
      "Bullseye. No notes.",
      "Perfect pin. Annoyingly good.",
    ],
  },
  {
    max: 50,
    msgs: [
      "Close enough to claim you meant it.",
      "Basically there. Geography teachers can relax.",
      "You were right there, which is deeply inconvenient for everyone else.",
    ],
  },
  {
    max: 100,
    msgs: [
      "A very respectable miss. Still a miss.",
      "Close enough for a confident retelling later.",
      "You can absolutely pretend you knew it.",
    ],
  },
  {
    max: 500,
    msgs: [
      "Right region, wrong parking lot.",
      "The vibe was correct. The pin was not.",
      "A noble effort from the general area.",
    ],
  },
  {
    max: 1500,
    msgs: [
      "You had the right sport. Possibly the wrong hemisphere emotionally.",
      "Close idea, wrong spot. A classic.",
      "Somewhere, a cartographer just sighed.",
    ],
  },
  {
    max: 3000,
    msgs: [
      "Bold. Not accurate, but bold.",
      "You've selected a place on Earth. That's a start.",
      "The confidence was louder than the geography.",
    ],
  },
  {
    max: Infinity,
    msgs: [
      "A long way off. Spiritually, physically, cartographically.",
      "That pin needs a connecting flight.",
      "Several time zones have filed a complaint.",
      "The map has asked for some space.",
    ],
  },
];

export function getNearMissMessage(distanceKm, score) {
  if (score === 1000) {
    const perfect = BANDS[0].msgs;
    return perfect[Math.floor(Math.random() * perfect.length)];
  }
  const band = BANDS.find((b) => distanceKm <= b.max) ?? BANDS[BANDS.length - 1];
  return band.msgs[Math.floor(Math.random() * band.msgs.length)];
}
