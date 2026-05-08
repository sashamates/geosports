export function getHighlightRadiusKm(question) {
  // TODO: when question.highlightType === "state" | "country" and question.highlightId
  // is present, swap the circle for a real boundary polygon loaded from GeoJSON.
  switch (question?.answerType) {
    case "stadium":
    case "venue":
      return 20;
    case "city":
      return 55;
    case "state":
      return 150;
    case "country":
    case "region":
      return 220;
    default:
      return 55; // treat as city-scale
  }
}

export function createCircleGeoJSON(centerLng, centerLat, radiusKm, points = 96) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dx = radiusKm / (111.32 * Math.cos(toRad(centerLat)));
  const dy = radiusKm / 110.574;
  const coords = [];

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    coords.push([
      centerLng + dx * Math.cos(angle),
      centerLat + dy * Math.sin(angle),
    ]);
  }

  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [coords] },
    properties: {},
  };
}
