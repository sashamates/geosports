"use client";

import { useState, useEffect, useRef } from "react";
import { getMapStartView } from "@/lib/mapStartView";
import { getHighlightRadiusKm, createCircleGeoJSON } from "@/lib/mapHighlight";
import styles from "./MapView.module.css";

const LINE_DURATION = 700;

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function lineGeoJSON(x1, y1, x2, y2) {
  return {
    type: "Feature",
    geometry: { type: "LineString", coordinates: [[x1, y1], [x2, y2]] },
  };
}

// Resolves once the map has stopped moving, or after fallbackMs if moveend never fires.
function waitForMapStill(map, fallbackMs = 900) {
  return new Promise((resolve) => {
    let resolved = false;
    let stableFrames = 0;

    const finish = () => {
      if (resolved) return;
      resolved = true;
      map.off("moveend", onMoveEnd);
      resolve();
    };

    const checkStable = () => {
      if (resolved) return;
      if (!map.isMoving() && !map.isZooming() && !map.isRotating()) {
        stableFrames += 1;
      } else {
        stableFrames = 0;
      }
      if (stableFrames >= 3) {
        finish();
      } else {
        requestAnimationFrame(checkStable);
      }
    };

    const onMoveEnd = () => requestAnimationFrame(checkStable);
    map.once("moveend", onMoveEnd);

    // Fallback: if moveend never fires, start stability check after fallbackMs
    setTimeout(() => requestAnimationFrame(checkStable), fallbackMs);
  });
}

export default function MapView({
  onGuess,
  question,
  questionId,
  currentResult,
  showTapHelper,
}) {
  const containerRef         = useRef(null);
  const mapRef               = useRef(null);
  const markersRef           = useRef([]);
  const lineLayerRef         = useRef(false);
  const animFrameRef         = useRef(null);
  const onGuessRef           = useRef(onGuess);
  const questionRef          = useRef(question);
  const hasAnimatedRevealRef = useRef(false);
  const isLineAnimatingRef   = useRef(false);

  const [mapStatus,    setMapStatus]    = useState("loading"); // loading | loaded | error
  const [toastVisible, setToastVisible] = useState(false);
  const [toastFading,  setToastFading]  = useState(false);
  const toastTimerRef = useRef(null);

  useEffect(() => { onGuessRef.current  = onGuess;  }, [onGuess]);
  useEffect(() => { questionRef.current = question; }, [question]);

  // Clear toast timer on unmount
  useEffect(() => () => { clearTimeout(toastTimerRef.current); }, []);

  // ── Init map once ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const maplibre = await import("maplibre-gl");
        await import("maplibre-gl/dist/maplibre-gl.css");
        if (!containerRef.current || mapRef.current) return;

        const startView = getMapStartView(questionRef.current);

        const map = new maplibre.Map({
          container: containerRef.current,
          style: voyagerStyle(),
          center: startView.center,
          zoom: startView.zoom,
          minZoom: 0.5,
          maxZoom: 14,
          doubleClickZoom: false,
          dragRotate: true,
          touchZoomRotate: true,
          attributionControl: true,
        });

        map.on("load", () => {
          setMapStatus("loaded");
          try { map.setProjection({ type: "globe" }); } catch {}
          try {
            map.setSky({
              "sky-color": "#0a0f1e",
              "sky-horizon-blend": 0.5,
              "horizon-color": "#1a2744",
              "horizon-fog-blend": 0.6,
              "atmosphere-blend": 0.65,
            });
          } catch {}
        });

        map.on("click", (e) => {
          if (mapRef.current?._locked) return;
          onGuessRef.current(e.lngLat.lat, e.lngLat.lng);
        });

        mapRef.current = map;
      } catch {
        setMapStatus("error");
      }
    }

    init();
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  // ── Clear everything + fly to start view on question change ───────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    clearOverlays(map);
    map._locked = false;
    hideToast();
    hasAnimatedRevealRef.current = false;
    isLineAnimatingRef.current   = false;
    const view = getMapStartView(questionRef.current);
    map.flyTo({ center: view.center, zoom: view.zoom, duration: 800 });
  }, [questionId]);

  // ── Reveal sequence when a result arrives ─────────────────────────────────
  useEffect(() => {
    if (!currentResult) return;
    if (hasAnimatedRevealRef.current) return;
    hasAnimatedRevealRef.current = true;

    const map = mapRef.current;
    if (!map) return;

    map._locked = true;
    hideToast();

    let cancelled = false;

    import("maplibre-gl").then(async (maplibre) => {
      if (cancelled || !mapRef.current) return;

      clearOverlays(map);

      const { guessedLat, guessedLng, answerLat, answerLng, timedOut, score } = currentResult;

      // ── TIMEOUT: no user pin ──────────────────────────────────────────────
      if (timedOut || guessedLat === null) {
        const ansMarker = new maplibre.Marker({ element: answerPinEl(false), anchor: "bottom" })
          .setLngLat([answerLng, answerLat])
          .addTo(map);
        markersRef.current.push(ansMarker);

        map.flyTo({ center: [answerLng, answerLat], zoom: 5, duration: 900 });

        await waitForMapStill(map, 950);
        if (!cancelled) showToast();
        return;
      }

      // ── NORMAL GUESS ──────────────────────────────────────────────────────
      const isPerfectPin = score === 1000;

      // 1. User pin
      const userMarker = new maplibre.Marker({ element: userPinEl(), anchor: "bottom" })
        .setLngLat([guessedLng, guessedLat])
        .addTo(map);
      markersRef.current.push(userMarker);

      if (cancelled) return;

      // 2. Fit both pins — extra bottom padding so pins stay above the result panel overlay
      map.fitBounds(
        [
          [Math.min(guessedLng, answerLng) - 0.05, Math.min(guessedLat, answerLat) - 0.05],
          [Math.max(guessedLng, answerLng) + 0.05, Math.max(guessedLat, answerLat) + 0.05],
        ],
        { padding: { top: 80, bottom: 260, left: 60, right: 60 }, maxZoom: 8, duration: 750 }
      );

      // 3. Wait until the map is completely still — no camera calls after this point
      await waitForMapStill(map, 900);
      if (cancelled) return;

      // 4. Answer pin (map is now still)
      const ansMarker = new maplibre.Marker({ element: answerPinEl(isPerfectPin), anchor: "bottom" })
        .setLngLat([answerLng, answerLat])
        .addTo(map);
      markersRef.current.push(ansMarker);

      // 5. Draw line — returns a Promise; only setData is called inside, no camera movement
      await animateLine(map, guessedLng, guessedLat, answerLng, answerLat, () => cancelled);
      if (cancelled) return;

      // 6. Highlight + toast — only after line is fully drawn
      addHighlight(map, questionRef.current);
      showToast();
    });

    return () => { cancelled = true; };
  }, [currentResult?.questionId]);

  // ── Toast helpers ─────────────────────────────────────────────────────────
  function showToast() {
    clearTimeout(toastTimerRef.current);
    setToastFading(false);
    setToastVisible(true);
    // Begin fade-out after 2500ms, remove from DOM after the 400ms transition
    toastTimerRef.current = setTimeout(() => {
      setToastFading(true);
      toastTimerRef.current = setTimeout(() => {
        setToastVisible(false);
        setToastFading(false);
        toastTimerRef.current = null;
      }, 400);
    }, 2500);
  }

  function hideToast() {
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = null;
    setToastVisible(false);
    setToastFading(false);
  }

  // ── Line animation — no camera calls inside ───────────────────────────────
  function animateLine(map, gLng, gLat, aLng, aLat, isCancelled) {
    return new Promise((resolve) => {
      isLineAnimatingRef.current = true;

      const LINE = "result-line";
      try {
        if (map.getLayer(LINE)) map.removeLayer(LINE);
        if (map.getSource(LINE)) map.removeSource(LINE);
      } catch {}

      map.addSource(LINE, { type: "geojson", data: lineGeoJSON(gLng, gLat, gLng, gLat) });
      map.addLayer({
        id: LINE, type: "line", source: LINE,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#f26b38", "line-width": 3.5, "line-opacity": 0.92 },
      });
      lineLayerRef.current = true;

      const t0 = performance.now();

      function frame(now) {
        if (isCancelled()) {
          isLineAnimatingRef.current = false;
          resolve();
          return;
        }

        const elapsed  = now - t0;
        const progress = Math.min(elapsed / LINE_DURATION, 1);
        const eased    = easeOutCubic(progress);

        const cLng = gLng + (aLng - gLng) * eased;
        const cLat = gLat + (aLat - gLat) * eased;

        const src = map.getSource(LINE);
        if (src) src.setData(lineGeoJSON(gLng, gLat, cLng, cLat));

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(frame);
        } else {
          animFrameRef.current = null;
          isLineAnimatingRef.current = false;
          resolve();
        }
      }

      animFrameRef.current = requestAnimationFrame(frame);
    });
  }

  // ── Overlay management ────────────────────────────────────────────────────
  function clearOverlays(map) {
    if (!map) return;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    markersRef.current.forEach((m) => { try { m.remove(); } catch {} });
    markersRef.current = [];

    if (lineLayerRef.current) {
      try { if (map.getLayer("result-line")) map.removeLayer("result-line"); } catch {}
      try { if (map.getSource("result-line")) map.removeSource("result-line"); } catch {}
      lineLayerRef.current = false;
    }

    try { if (map.getLayer("answer-highlight-outline")) map.removeLayer("answer-highlight-outline"); } catch {}
    try { if (map.getLayer("answer-highlight-fill"))    map.removeLayer("answer-highlight-fill");    } catch {}
    try { if (map.getSource("answer-highlight"))        map.removeSource("answer-highlight");         } catch {}
  }

  function addHighlight(map, q) {
    if (!q) return;
    const radius  = getHighlightRadiusKm(q);
    const geoJSON = createCircleGeoJSON(q.lng, q.lat, radius);
    const SRC = "answer-highlight", FILL = "answer-highlight-fill", OUTLINE = "answer-highlight-outline";

    try {
      if (map.getLayer(OUTLINE)) map.removeLayer(OUTLINE);
      if (map.getLayer(FILL))    map.removeLayer(FILL);
      if (map.getSource(SRC))    map.removeSource(SRC);

      map.addSource(SRC, { type: "geojson", data: geoJSON });
      map.addLayer({ id: FILL,    type: "fill", source: SRC, paint: { "fill-color": "#2ee59d", "fill-opacity": 0.22 } });
      map.addLayer({ id: OUTLINE, type: "line", source: SRC, paint: { "line-color": "#2ee59d", "line-width": 2.5, "line-opacity": 0.7 } });
    } catch {}
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      {mapStatus === "loading" && (
        <div className={styles.mapOverlay}>Loading map…</div>
      )}
      {mapStatus === "error" && (
        <div className={styles.mapOverlay}>Map failed to load. Refresh and try again.</div>
      )}
      <div ref={containerRef} className={styles.map} />

      {toastVisible && currentResult?.resultPhrase && (
        <div className={`${styles.resultToast} ${toastFading ? styles.resultToastFading : ""}`}>
          {currentResult.resultPhrase}
        </div>
      )}

      {showTapHelper && (
        <div className={styles.tapHelper}>
          <strong className={styles.tapHelperMain}>Tap the map to drop your pin</strong>
          <span className={styles.tapHelperSub}>No confirmation. Choose carefully.</span>
        </div>
      )}
    </div>
  );
}

// ── Module-level helpers ──────────────────────────────────────────────────────
function voyagerStyle() {
  return {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      carto: {
        type: "raster",
        tiles: ["https://basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© CARTO, © OpenStreetMap contributors",
        maxzoom: 19,
      },
    },
    layers: [
      { id: "bg",    type: "background", paint: { "background-color": "#0d1b2a" } },
      { id: "carto", type: "raster",     source: "carto", paint: { "raster-opacity": 1 } },
    ],
  };
}

function userPinEl() {
  const el = document.createElement("div");
  el.className = "user-pin-marker";
  el.innerHTML = `
    <div class="user-pin-marker__ripple"></div>
    <div class="user-pin-marker__pin"></div>
  `;
  return el;
}

function answerPinEl(perfectPin = false) {
  const el = document.createElement("div");
  el.style.cssText = `
    width: 26px; height: 26px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    background: #f5c518;
    border: 3px solid #111;
    box-shadow: 0 2px 12px rgba(0,0,0,0.7);
    cursor: default; flex-shrink: 0;
  `;
  if (perfectPin) el.classList.add("perfect-pin-marker");
  return el;
}
