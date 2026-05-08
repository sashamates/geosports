const TIMEOUT_PHRASES = [
  "Shot clock violation.",
  "The buzzer got you.",
  "Possession over. No pin dropped.",
  "The map wins this possession.",
];

const BANDS = [
  {
    maxScore: 1000, maxDist: 10,
    phrases: [
      "Perfect pin.",
      "Bullseye. Annoyingly good.",
      "Dead on.",
      "No notes.",
      "Put that on the highlight reel.",
    ],
  },
  {
    maxDist: 50,
    phrases: [
      "Close enough to flex.",
      "Basically there.",
      "You can claim that one.",
      "The judges will allow it.",
      "That's a veteran move.",
    ],
  },
  {
    maxDist: 100,
    phrases: [
      "Respectable miss.",
      "Close enough for the group chat.",
      "You knew the assignment.",
      "Not perfect. Still smug.",
      "A strong away performance.",
    ],
  },
  {
    maxDist: 500,
    phrases: [
      "Right region, wrong parking lot.",
      "The vibe was correct.",
      "Solid geography cosplay.",
      "You were in the neighbourhood. Sort of.",
      "Participation trophy close.",
    ],
  },
  {
    maxDist: 1500,
    phrases: [
      "Ambitious. Incorrect.",
      "Good idea. Bad coordinates.",
      "A bold interpretation of nearby.",
      "Somewhere, a cartographer sighed.",
      "Close in spirit only.",
    ],
  },
  {
    maxDist: 3000,
    phrases: [
      "That pin needs a bus transfer.",
      "Technically the same planet.",
      "Confidence: high. Accuracy: pending.",
      "You selected land. Progress.",
      "The map has follow-up questions.",
    ],
  },
  {
    maxDist: Infinity,
    phrases: [
      "Several time zones object.",
      "That pin needs a connecting flight.",
      "The globe felt that one.",
      "A heroic miss.",
      "Geography has left the chat.",
    ],
  },
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getResultPhrase(distanceKm, score, timedOut) {
  if (timedOut) return pick(TIMEOUT_PHRASES);
  if (distanceKm === null) return "No guess. Bold strategy.";

  if (score === 1000 || distanceKm <= 10) return pick(BANDS[0].phrases);

  const band = BANDS.find((b) => distanceKm <= b.maxDist) ?? BANDS[BANDS.length - 1];
  return pick(band.phrases);
}
