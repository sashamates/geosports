const VIEWS = {
  "North America": { center: [-98, 39],  zoom: 2.7 },
  "South America": { center: [-60, -15], zoom: 2.7 },
  "Europe":        { center: [15, 50],   zoom: 3.1 },
  "Africa":        { center: [20, 2],    zoom: 2.7 },
  "Asia":          { center: [90, 35],   zoom: 2.4 },
  "Oceania":       { center: [140, -25], zoom: 2.8 },
};

export function getMapStartView(question) {
  if (!question) return { center: [0, 20], zoom: 2.0 };
  const key = question.continent || question.region || "";
  const preset = VIEWS[key];
  if (preset) return preset;
  // Fallback: use answer coords but zoomed out so nothing is revealed
  if (question.lat != null && question.lng != null) {
    return { center: [question.lng, question.lat], zoom: 2.0 };
  }
  return { center: [0, 20], zoom: 2.0 };
}
