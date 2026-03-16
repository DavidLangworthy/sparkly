import {
  clamp,
  lerp,
  hash01,
  inkById,
  inkPresets,
  backgroundById,
  createSparkleNode
} from "./ink.js";

const MIN_VIEW_SCALE = 0.45;
const MAX_VIEW_SCALE = 3.6;
const WORLD_OVERSCAN_PX = 72;

function createViewportCanvasController({ elements, onUiChange = () => {} }) {
  const {
    stageRoot,
    paintCanvas,
    fxCanvas
  } = elements;

  const paintCtx = paintCanvas.getContext("2d");
  const fxCtx = fxCanvas.getContext("2d");
  const state = {
    activeInkId: inkPresets[0].id,
    brushSize: 20,
    mode: "spray",
    exportBackgroundId: "transparent",
    exportingKind: null,
    strokes: [],
    activeStroke: null,
    isDrawing: false,
    isSpacePanning: false,
    pointerId: null,
    cameraX: 0,
    cameraY: 0,
    viewScale: 1,
    viewportWidth: 0,
    viewportHeight: 0
  };
  const navigationGesture = {
    touchPoints: new Map(),
    isActive: false,
    startDistance: 0,
    startScale: 1,
    anchorWorldX: 0,
    anchorWorldY: 0
  };
  const panGesture = {
    isActive: false,
    pointerId: null,
    startClientX: 0,
    startClientY: 0,
    startCameraX: 0,
    startCameraY: 0
  };
  let initialized = false;

  function notifyUiChange() {
    onUiChange(state);
  }

  function getState() {
    return state;
  }

  function getPreset(stroke) {
    return inkById.get(stroke.inkId);
  }

  function waitForNextPaint() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });
  }

  function setExportingKind(nextKind) {
    state.exportingKind = nextKind;
    notifyUiChange();
  }

  function setBrushSize(nextSize) {
    state.brushSize = clamp(Math.round(nextSize), 6, 48);
    notifyUiChange();
  }

  function setMode(nextMode) {
    if (nextMode !== "brush" && nextMode !== "spray") {
      return;
    }

    state.mode = nextMode;
    notifyUiChange();
  }

  function setActiveInk(inkId) {
    if (!inkById.has(inkId)) {
      return;
    }

    state.activeInkId = inkId;
    notifyUiChange();
  }

  function setExportBackground(backgroundId) {
    if (!backgroundById.has(backgroundId)) {
      return;
    }

    state.exportBackgroundId = backgroundId;
    notifyUiChange();
  }

  function configureCanvas(canvas, ctx, width, height) {
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    canvas.style.width = `${Math.max(1, Math.round(width))}px`;
    canvas.style.height = `${Math.max(1, Math.round(height))}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.imageSmoothingEnabled = true;
  }

  function updateViewportSize(notify = true) {
    const width = Math.max(1, Math.round(stageRoot.clientWidth || window.innerWidth || 1));
    const height = Math.max(1, Math.round(stageRoot.clientHeight || window.innerHeight || 1));

    if (width === state.viewportWidth && height === state.viewportHeight) {
      return;
    }

    state.viewportWidth = width;
    state.viewportHeight = height;
    configureCanvas(paintCanvas, paintCtx, width, height);
    configureCanvas(fxCanvas, fxCtx, width, height);
    redrawPaint();
    if (notify) {
      notifyUiChange();
    }
  }

  function getCanvasRect() {
    return fxCanvas.getBoundingClientRect();
  }

  function screenToWorld(clientX, clientY) {
    const rect = getCanvasRect();
    const localX = clientX - rect.left - state.viewportWidth * 0.5;
    const localY = clientY - rect.top - state.viewportHeight * 0.5;
    return {
      x: state.cameraX + localX / state.viewScale,
      y: state.cameraY + localY / state.viewScale
    };
  }

  function setViewScale(nextScale, anchorClientX = null, anchorClientY = null, anchorWorldPoint = null) {
    const clampedScale = clamp(nextScale, MIN_VIEW_SCALE, MAX_VIEW_SCALE);

    if (!state.viewportWidth || !state.viewportHeight) {
      state.viewScale = clampedScale;
      redrawPaint();
      return;
    }

    const rect = getCanvasRect();
    const clientX = anchorClientX == null ? rect.left + state.viewportWidth * 0.5 : anchorClientX;
    const clientY = anchorClientY == null ? rect.top + state.viewportHeight * 0.5 : anchorClientY;
    const worldPoint = anchorWorldPoint || screenToWorld(clientX, clientY);
    const localX = clientX - rect.left - state.viewportWidth * 0.5;
    const localY = clientY - rect.top - state.viewportHeight * 0.5;

    state.viewScale = clampedScale;
    state.cameraX = worldPoint.x - localX / state.viewScale;
    state.cameraY = worldPoint.y - localY / state.viewScale;
    redrawPaint();
  }

  function isEditableTarget(target) {
    return target instanceof HTMLElement
      && Boolean(target.closest("input, textarea, select, button, summary, [contenteditable=\"\"], [contenteditable=\"true\"]"));
  }

  function getCanvasPoint(event) {
    const point = screenToWorld(event.clientX, event.clientY);
    return {
      x: point.x,
      y: point.y,
      t: performance.now(),
      pressure: event.pressure && event.pressure > 0 ? clamp(event.pressure, 0.2, 1) : 0.58
    };
  }

  function createEmptyBounds() {
    return {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity
    };
  }

  function expandBounds(bounds, x, y, pad = 0) {
    bounds.minX = Math.min(bounds.minX, x - pad);
    bounds.minY = Math.min(bounds.minY, y - pad);
    bounds.maxX = Math.max(bounds.maxX, x + pad);
    bounds.maxY = Math.max(bounds.maxY, y + pad);
  }

  function normalizeBounds(bounds) {
    if (!Number.isFinite(bounds.minX) || !Number.isFinite(bounds.minY) || !Number.isFinite(bounds.maxX) || !Number.isFinite(bounds.maxY)) {
      return {
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0
      };
    }

    return bounds;
  }

  function strokePointPad(stroke) {
    return stroke.brushSize * (stroke.mode === "spray" ? 2.3 : 1.7);
  }

  function updateStrokePointBounds(stroke, point) {
    const pad = strokePointPad(stroke);
    expandBounds(stroke.bounds, point.x, point.y, pad);
    expandBounds(stroke.renderBounds, point.x, point.y, pad);
  }

  function updateStrokeSparkleBounds(stroke, node) {
    const pad = node.size * 4.5 + node.drift * 3;
    expandBounds(stroke.renderBounds, node.x, node.y, pad);
  }

  function finalizeStrokeBounds(stroke) {
    stroke.bounds = normalizeBounds(stroke.bounds);
    stroke.renderBounds = normalizeBounds(stroke.renderBounds);
  }

  function measurePathLength(points) {
    let total = 0;
    for (let index = 1; index < points.length; index += 1) {
      total += Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y);
    }
    return total;
  }

  function sanitizePoint(rawPoint) {
    if (!rawPoint || !Number.isFinite(rawPoint.x) || !Number.isFinite(rawPoint.y)) {
      return null;
    }

    return {
      x: rawPoint.x,
      y: rawPoint.y,
      t: Number.isFinite(rawPoint.t) ? rawPoint.t : performance.now(),
      pressure: clamp(Number.isFinite(rawPoint.pressure) ? rawPoint.pressure : 0.58, 0.2, 1)
    };
  }

  function sanitizeSparkleNode(rawNode) {
    if (!rawNode || !Number.isFinite(rawNode.x) || !Number.isFinite(rawNode.y)) {
      return null;
    }

    return {
      x: rawNode.x,
      y: rawNode.y,
      size: clamp(Number.isFinite(rawNode.size) ? rawNode.size : 2, 0.4, 40),
      phase: Number.isFinite(rawNode.phase) ? rawNode.phase : 0,
      hueOffset: Number.isFinite(rawNode.hueOffset) ? rawNode.hueOffset : 0,
      drift: clamp(Number.isFinite(rawNode.drift) ? rawNode.drift : 0.4, 0, 4),
      brightness: clamp(Number.isFinite(rawNode.brightness) ? rawNode.brightness : 0.8, 0.1, 2)
    };
  }

  function sanitizeStroke(rawStroke) {
    if (!rawStroke || typeof rawStroke !== "object") {
      return null;
    }

    const points = Array.isArray(rawStroke.points)
      ? rawStroke.points.map(sanitizePoint).filter(Boolean)
      : [];

    if (!points.length) {
      return null;
    }

    const sparkleNodes = Array.isArray(rawStroke.sparkleNodes)
      ? rawStroke.sparkleNodes.map(sanitizeSparkleNode).filter(Boolean)
      : [];
    const stroke = {
      inkId: inkById.has(rawStroke.inkId) ? rawStroke.inkId : inkPresets[0].id,
      mode: rawStroke.mode === "spray" ? "spray" : "brush",
      brushSize: clamp(Number.isFinite(rawStroke.brushSize) ? rawStroke.brushSize : state.brushSize, 6, 96),
      points,
      sparkleNodes,
      pathLength: Number.isFinite(rawStroke.pathLength) ? rawStroke.pathLength : measurePathLength(points),
      seed: Number.isFinite(rawStroke.seed) ? rawStroke.seed : Math.random() * 1000,
      bounds: createEmptyBounds(),
      renderBounds: createEmptyBounds()
    };

    points.forEach((point) => updateStrokePointBounds(stroke, point));
    sparkleNodes.forEach((node) => updateStrokeSparkleBounds(stroke, node));
    finalizeStrokeBounds(stroke);
    return stroke;
  }

  function createStroke(point) {
    const stroke = {
      inkId: state.activeInkId,
      mode: state.mode,
      brushSize: state.brushSize,
      points: [point],
      sparkleNodes: [],
      pathLength: 0,
      seed: Math.random() * 1000 + performance.now() * 0.01,
      bounds: createEmptyBounds(),
      renderBounds: createEmptyBounds()
    };

    updateStrokePointBounds(stroke, point);

    Object.defineProperty(stroke, "_sparkleCandidateCount", {
      value: 0,
      writable: true,
      configurable: true
    });

    return stroke;
  }

  function getStrokeSpacing(stroke) {
    return stroke.mode === "spray"
      ? Math.max(3.2, stroke.brushSize * 0.28)
      : Math.max(0.9, stroke.brushSize * 0.08);
  }

  function getMaxSparkles(stroke, preset, currentPathLength = stroke.pathLength) {
    const baseCap = stroke.mode === "spray" ? 220 : 140;
    const hardCap = stroke.mode === "spray" ? 720 : 420;
    const attemptsPerStamp = stroke.mode === "spray"
      ? clamp(Math.round(stroke.brushSize * 0.72), 6, 24)
      : 1;
    const estimatedAttempts = Math.max(
      1,
      Math.ceil(Math.max(currentPathLength, stroke.brushSize) / getStrokeSpacing(stroke))
    ) * attemptsPerStamp;
    const chanceBase = preset.sparkleDensity * (stroke.mode === "spray" ? 1.25 : 0.8);
    const adaptiveCap = Math.round(estimatedAttempts * chanceBase * 1.35 + baseCap * 0.2);

    return clamp(Math.max(baseCap, adaptiveCap), baseCap, hardCap);
  }

  function ensureSparkleCandidateCount(stroke) {
    if (!Number.isFinite(stroke._sparkleCandidateCount)) {
      Object.defineProperty(stroke, "_sparkleCandidateCount", {
        value: stroke.sparkleNodes.length,
        writable: true,
        configurable: true
      });
    }
  }

  function maybeAddSparkleNode(stroke, preset, stamp, randomKey) {
    const chanceBase = preset.sparkleDensity * (stroke.mode === "spray" ? 1.25 : 0.8);
    if (hash01(randomKey) > chanceBase) {
      return;
    }

    ensureSparkleCandidateCount(stroke);
    stroke._sparkleCandidateCount += 1;
    const budget = getMaxSparkles(stroke, preset, stamp.travel);
    const sparkleNode = createSparkleNode(stamp, preset, randomKey);

    if (stroke.sparkleNodes.length < budget) {
      stroke.sparkleNodes.push(sparkleNode);
      updateStrokeSparkleBounds(stroke, sparkleNode);
      return;
    }

    const replacementIndex = Math.floor(hash01(randomKey + 10.37) * stroke._sparkleCandidateCount);
    if (replacementIndex < budget) {
      stroke.sparkleNodes[replacementIndex] = sparkleNode;
      stroke.renderBounds = createEmptyBounds();
      stroke.points.forEach((point) => updateStrokePointBounds(stroke, point));
      stroke.sparkleNodes.forEach((node) => updateStrokeSparkleBounds(stroke, node));
      finalizeStrokeBounds(stroke);
    }
  }

  function drawBrushStamp(ctx, stroke, preset, point, angle, travel, emitSparkles, stampIndex) {
    const radius = stroke.brushSize * 0.52 * (0.5 + point.pressure * 0.54);
    const stamp = {
      x: point.x,
      y: point.y,
      radius,
      angle,
      pressure: point.pressure,
      travel,
      progress: travel / Math.max(stroke.brushSize * 1.2, 1),
      seed: stroke.seed,
      isSpray: false
    };

    preset.renderStamp(ctx, stamp, 0);

    if (emitSparkles) {
      maybeAddSparkleNode(stroke, preset, stamp, stroke.seed + travel * 0.13 + stampIndex * 0.93);
    }
  }

  function drawSprayBurst(ctx, stroke, preset, point, angle, travel, emitSparkles, stampIndex) {
    const dotCount = clamp(Math.round(stroke.brushSize * 0.72), 6, 24);
    const scatter = preset.sprayScatter * (0.45 + stroke.brushSize * 0.03);

    for (let index = 0; index < dotCount; index += 1) {
      const key = stroke.seed + stampIndex * 19.7 + index * 13.3 + travel * 0.031;
      const theta = hash01(key) * Math.PI * 2;
      const distance = Math.sqrt(hash01(key + 1.7)) * scatter;
      const stamp = {
        x: point.x + Math.cos(theta) * distance,
        y: point.y + Math.sin(theta) * distance,
        radius: stroke.brushSize * lerp(0.12, 0.26, hash01(key + 2.4)) * (0.7 + point.pressure * 0.4),
        angle: angle + (hash01(key + 3.9) - 0.5) * 1.6,
        pressure: point.pressure,
        travel,
        progress: travel / Math.max(stroke.brushSize, 1) + index * 0.08,
        seed: stroke.seed + index * 0.01,
        isSpray: true
      };

      preset.renderStamp(ctx, stamp, 0);

      if (emitSparkles) {
        maybeAddSparkleNode(stroke, preset, stamp, key + 4.8);
      }
    }
  }

  function renderStrokeStart(ctx, stroke, emitSparkles) {
    const preset = getPreset(stroke);
    const point = stroke.points[0];
    const angle = Math.PI / 6;

    if (stroke.mode === "spray") {
      drawSprayBurst(ctx, stroke, preset, point, angle, 0, emitSparkles, 0);
    } else {
      drawBrushStamp(ctx, stroke, preset, point, angle, 0, emitSparkles, 0);
    }
  }

  function drawStrokeSegment(ctx, stroke, fromPoint, toPoint, startTravel, emitSparkles, segmentIndex) {
    const preset = getPreset(stroke);
    const dx = toPoint.x - fromPoint.x;
    const dy = toPoint.y - fromPoint.y;
    const distance = Math.hypot(dx, dy);
    const angle = distance > 0.001 ? Math.atan2(dy, dx) : 0;
    const spacing = getStrokeSpacing(stroke);
    const steps = Math.max(1, Math.ceil(distance / spacing));
    let travel = startTravel;

    for (let step = 1; step <= steps; step += 1) {
      const ratio = step / steps;
      const point = {
        x: lerp(fromPoint.x, toPoint.x, ratio),
        y: lerp(fromPoint.y, toPoint.y, ratio),
        t: lerp(fromPoint.t, toPoint.t, ratio),
        pressure: lerp(fromPoint.pressure, toPoint.pressure, ratio)
      };
      travel = startTravel + distance * ratio;

      if (stroke.mode === "spray") {
        drawSprayBurst(ctx, stroke, preset, point, angle, travel, emitSparkles, segmentIndex * 100 + step);
      } else {
        drawBrushStamp(ctx, stroke, preset, point, angle, travel, emitSparkles, segmentIndex * 100 + step);
      }
    }

    return travel;
  }

  function replayStroke(ctx, stroke) {
    if (!stroke.points.length) {
      return;
    }

    renderStrokeStart(ctx, stroke, false);
    let travel = 0;

    for (let index = 1; index < stroke.points.length; index += 1) {
      travel = drawStrokeSegment(ctx, stroke, stroke.points[index - 1], stroke.points[index], travel, false, index);
    }
  }

  function getRenderableStrokes() {
    return state.activeStroke ? [...state.strokes, state.activeStroke] : state.strokes;
  }

  function boundsIntersect(left, right) {
    return !(
      left.maxX < right.minX ||
      left.minX > right.maxX ||
      left.maxY < right.minY ||
      left.minY > right.maxY
    );
  }

  function getViewBounds(overscanPx = WORLD_OVERSCAN_PX) {
    const overscanWorld = overscanPx / state.viewScale;
    const halfWidth = state.viewportWidth * 0.5 / state.viewScale;
    const halfHeight = state.viewportHeight * 0.5 / state.viewScale;
    return {
      minX: state.cameraX - halfWidth - overscanWorld,
      minY: state.cameraY - halfHeight - overscanWorld,
      maxX: state.cameraX + halfWidth + overscanWorld,
      maxY: state.cameraY + halfHeight + overscanWorld
    };
  }

  function withViewportTransform(ctx, draw) {
    ctx.save();
    ctx.translate(state.viewportWidth * 0.5, state.viewportHeight * 0.5);
    ctx.scale(state.viewScale, state.viewScale);
    ctx.translate(-state.cameraX, -state.cameraY);
    draw();
    ctx.restore();
  }

  function drawVisiblePigment(ctx) {
    const visibleBounds = getViewBounds();
    getRenderableStrokes().forEach((stroke) => {
      if (!boundsIntersect(stroke.renderBounds, visibleBounds)) {
        return;
      }
      replayStroke(ctx, stroke);
    });
  }

  function drawVisibleSparkles(ctx, time) {
    const visibleBounds = getViewBounds();
    getRenderableStrokes().forEach((stroke) => {
      if (!boundsIntersect(stroke.renderBounds, visibleBounds)) {
        return;
      }
      const preset = getPreset(stroke);
      stroke.sparkleNodes.forEach((node) => {
        preset.renderGlint(ctx, node, time);
      });
    });
  }

  function redrawPaint() {
    if (!state.viewportWidth || !state.viewportHeight) {
      return;
    }

    paintCtx.clearRect(0, 0, state.viewportWidth, state.viewportHeight);
    withViewportTransform(paintCtx, () => {
      drawVisiblePigment(paintCtx);
    });
  }

  function getExportBounds() {
    const strokes = getRenderableStrokes();

    if (!strokes.length) {
      const halfWidth = state.viewportWidth * 0.5 / Math.max(state.viewScale, 0.001);
      const halfHeight = state.viewportHeight * 0.5 / Math.max(state.viewScale, 0.001);
      return {
        x: state.cameraX - halfWidth,
        y: state.cameraY - halfHeight,
        width: halfWidth * 2,
        height: halfHeight * 2
      };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    strokes.forEach((stroke) => {
      minX = Math.min(minX, stroke.renderBounds.minX);
      minY = Math.min(minY, stroke.renderBounds.minY);
      maxX = Math.max(maxX, stroke.renderBounds.maxX);
      maxY = Math.max(maxY, stroke.renderBounds.maxY);
    });

    const outerPad = 14;
    return {
      x: Math.floor(minX - outerPad),
      y: Math.floor(minY - outerPad),
      width: Math.max(1, Math.ceil(maxX + outerPad) - Math.floor(minX - outerPad)),
      height: Math.max(1, Math.ceil(maxY + outerPad) - Math.floor(minY - outerPad))
    };
  }

  function focusInkBounds(bounds = getExportBounds()) {
    if (!bounds || !Number.isFinite(bounds.width) || !Number.isFinite(bounds.height)) {
      return;
    }

    const paddingPx = 84;
    const availableWidth = Math.max(120, state.viewportWidth - paddingPx * 2);
    const availableHeight = Math.max(120, state.viewportHeight - paddingPx * 2);
    const nextScale = clamp(
      Math.min(availableWidth / Math.max(bounds.width, 1), availableHeight / Math.max(bounds.height, 1)),
      MIN_VIEW_SCALE,
      MAX_VIEW_SCALE
    );

    state.cameraX = bounds.x + bounds.width * 0.5;
    state.cameraY = bounds.y + bounds.height * 0.5;
    state.viewScale = nextScale;
    redrawPaint();
    notifyUiChange();
  }

  function renderCombinedFrame(
    ctx,
    time,
    width,
    height,
    bounds = getExportBounds(),
    background = backgroundById.get(state.exportBackgroundId) || backgroundById.get("transparent")
  ) {
    const scaleX = width / Math.max(bounds.width, 1);
    const scaleY = height / Math.max(bounds.height, 1);

    ctx.clearRect(0, 0, width, height);
    if (background.color) {
      ctx.fillStyle = background.color;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.save();
    ctx.scale(scaleX, scaleY);
    ctx.translate(-bounds.x, -bounds.y);
    getRenderableStrokes().forEach((stroke) => replayStroke(ctx, stroke));
    getRenderableStrokes().forEach((stroke) => {
      const preset = getPreset(stroke);
      stroke.sparkleNodes.forEach((node) => {
        preset.renderGlint(ctx, node, time);
      });
    });
    ctx.restore();
  }

  function serializeProjectModel() {
    return {
      app: "glitter-paint",
      version: 2,
      activeInkId: state.activeInkId,
      brushSize: state.brushSize,
      mode: state.mode,
      exportBackgroundId: state.exportBackgroundId,
      camera: {
        x: state.cameraX,
        y: state.cameraY,
        viewScale: state.viewScale
      },
      strokes: getRenderableStrokes().map((stroke) => ({
        inkId: stroke.inkId,
        mode: stroke.mode,
        brushSize: stroke.brushSize,
        points: stroke.points,
        sparkleNodes: stroke.sparkleNodes,
        pathLength: stroke.pathLength,
        seed: stroke.seed
      }))
    };
  }

  function loadProjectModel(raw) {
    if (!raw || !Array.isArray(raw.strokes) || (raw.version !== 1 && raw.version !== 2)) {
      throw new Error("Unsupported project format");
    }

    state.strokes = raw.strokes.map(sanitizeStroke).filter(Boolean);
    state.activeStroke = null;
    state.isDrawing = false;
    state.pointerId = null;

    if (inkById.has(raw.activeInkId)) {
      state.activeInkId = raw.activeInkId;
    }
    if (Number.isFinite(raw.brushSize)) {
      state.brushSize = clamp(Math.round(raw.brushSize), 6, 48);
    }
    if (raw.mode === "spray" || raw.mode === "brush") {
      state.mode = raw.mode;
    }
    if (backgroundById.has(raw.exportBackgroundId)) {
      state.exportBackgroundId = raw.exportBackgroundId;
    }

    if (raw.version === 2 && raw.camera && Number.isFinite(raw.camera.x) && Number.isFinite(raw.camera.y)) {
      state.cameraX = raw.camera.x;
      state.cameraY = raw.camera.y;
      state.viewScale = clamp(Number.isFinite(raw.camera.viewScale) ? raw.camera.viewScale : state.viewScale, MIN_VIEW_SCALE, MAX_VIEW_SCALE);
      redrawPaint();
      notifyUiChange();
      return;
    }

    focusInkBounds(getExportBounds());
  }

  function finishActiveStroke(commitStroke = true) {
    const capturedPointerId = state.pointerId;

    if (commitStroke && state.activeStroke) {
      finalizeStrokeBounds(state.activeStroke);
      state.strokes.push(state.activeStroke);
    }

    state.activeStroke = null;
    state.isDrawing = false;
    state.pointerId = null;
    if (capturedPointerId != null && fxCanvas.hasPointerCapture(capturedPointerId)) {
      fxCanvas.releasePointerCapture(capturedPointerId);
    }
    notifyUiChange();
  }

  function beginStroke(event) {
    if (state.isDrawing) {
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    event.preventDefault();
    state.pointerId = event.pointerId;
    state.isDrawing = true;
    fxCanvas.setPointerCapture(event.pointerId);
    const point = getCanvasPoint(event);
    state.activeStroke = createStroke(point);
    withViewportTransform(paintCtx, () => {
      renderStrokeStart(paintCtx, state.activeStroke, true);
    });
    notifyUiChange();
  }

  function extendStroke(event) {
    if (!state.isDrawing || event.pointerId !== state.pointerId || !state.activeStroke) {
      return;
    }

    event.preventDefault();
    const stroke = state.activeStroke;
    const point = getCanvasPoint(event);
    const lastPoint = stroke.points[stroke.points.length - 1];
    stroke.points.push(point);
    updateStrokePointBounds(stroke, point);
    withViewportTransform(paintCtx, () => {
      stroke.pathLength = drawStrokeSegment(
        paintCtx,
        stroke,
        lastPoint,
        point,
        stroke.pathLength,
        true,
        stroke.points.length - 1
      );
    });
  }

  function finishStroke(event) {
    if (!state.isDrawing || event.pointerId !== state.pointerId) {
      return;
    }

    event.preventDefault();
    finishActiveStroke(true);
  }

  function cancelStroke(event) {
    if (!state.isDrawing || event.pointerId !== state.pointerId) {
      return;
    }

    event.preventDefault();
    finishActiveStroke(false);
    redrawPaint();
  }

  function getNavigationGestureTouches() {
    return Array.from(navigationGesture.touchPoints.values());
  }

  function getNavigationGestureMetrics() {
    const [firstTouch, secondTouch] = getNavigationGestureTouches();
    const center = {
      x: (firstTouch.x + secondTouch.x) * 0.5,
      y: (firstTouch.y + secondTouch.y) * 0.5
    };
    const distance = Math.hypot(secondTouch.x - firstTouch.x, secondTouch.y - firstTouch.y);
    return { center, distance };
  }

  function beginNavigationGesture() {
    if (navigationGesture.touchPoints.size < 2) {
      return;
    }

    if (state.isDrawing) {
      const shouldCommitStroke = state.activeStroke
        && (state.activeStroke.pathLength > Math.max(6, state.activeStroke.brushSize * 0.35) || state.activeStroke.points.length > 2);
      finishActiveStroke(shouldCommitStroke);
    }

    const { center, distance } = getNavigationGestureMetrics();
    const anchorWorldPoint = screenToWorld(center.x, center.y);

    navigationGesture.isActive = true;
    navigationGesture.startDistance = Math.max(distance, 1);
    navigationGesture.startScale = state.viewScale;
    navigationGesture.anchorWorldX = anchorWorldPoint.x;
    navigationGesture.anchorWorldY = anchorWorldPoint.y;
  }

  function beginViewportPan(event) {
    if (event.pointerType === "touch") {
      return false;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return false;
    }

    event.preventDefault();
    panGesture.isActive = true;
    panGesture.pointerId = event.pointerId;
    panGesture.startClientX = event.clientX;
    panGesture.startClientY = event.clientY;
    panGesture.startCameraX = state.cameraX;
    panGesture.startCameraY = state.cameraY;
    fxCanvas.setPointerCapture(event.pointerId);
    updateCanvasCursor();
    return true;
  }

  function updateViewportPan(event) {
    if (!panGesture.isActive || event.pointerId !== panGesture.pointerId) {
      return false;
    }

    event.preventDefault();
    state.cameraX = panGesture.startCameraX - (event.clientX - panGesture.startClientX) / state.viewScale;
    state.cameraY = panGesture.startCameraY - (event.clientY - panGesture.startClientY) / state.viewScale;
    redrawPaint();
    return true;
  }

  function endViewportPan(event = null) {
    if (!panGesture.isActive) {
      return false;
    }

    if (event && event.pointerId !== panGesture.pointerId) {
      return false;
    }

    const capturedPointerId = panGesture.pointerId;
    panGesture.isActive = false;
    panGesture.pointerId = null;
    if (capturedPointerId != null && fxCanvas.hasPointerCapture(capturedPointerId)) {
      fxCanvas.releasePointerCapture(capturedPointerId);
    }
    updateCanvasCursor();
    return true;
  }

  function updateNavigationGesture() {
    if (!navigationGesture.isActive || navigationGesture.touchPoints.size < 2) {
      return;
    }

    const { center, distance } = getNavigationGestureMetrics();
    const scaleRatio = navigationGesture.startDistance > 0 ? distance / navigationGesture.startDistance : 1;
    setViewScale(
      navigationGesture.startScale * scaleRatio,
      center.x,
      center.y,
      { x: navigationGesture.anchorWorldX, y: navigationGesture.anchorWorldY }
    );
  }

  function handlePointerDown(event) {
    if (state.isSpacePanning && beginViewportPan(event)) {
      return;
    }

    if (event.pointerType === "touch") {
      navigationGesture.touchPoints.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY
      });
      if (navigationGesture.touchPoints.size >= 2) {
        event.preventDefault();
        beginNavigationGesture();
        return;
      }
    }

    beginStroke(event);
  }

  function handlePointerMove(event) {
    if (updateViewportPan(event)) {
      return;
    }

    if (event.pointerType === "touch" && navigationGesture.touchPoints.has(event.pointerId)) {
      navigationGesture.touchPoints.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY
      });

      if (navigationGesture.isActive) {
        event.preventDefault();
        updateNavigationGesture();
        return;
      }
    }

    extendStroke(event);
  }

  function handlePointerUp(event) {
    if (endViewportPan(event)) {
      return;
    }

    if (event.pointerType === "touch" && navigationGesture.touchPoints.has(event.pointerId)) {
      const wasNavigating = navigationGesture.isActive;
      navigationGesture.touchPoints.delete(event.pointerId);
      if (wasNavigating) {
        navigationGesture.isActive = navigationGesture.touchPoints.size >= 2;
        return;
      }
    }

    finishStroke(event);
  }

  function handlePointerCancel(event) {
    if (endViewportPan(event)) {
      return;
    }

    if (event.pointerType === "touch" && navigationGesture.touchPoints.has(event.pointerId)) {
      const wasNavigating = navigationGesture.isActive;
      navigationGesture.touchPoints.delete(event.pointerId);
      if (wasNavigating) {
        navigationGesture.isActive = navigationGesture.touchPoints.size >= 2;
        return;
      }
    }

    cancelStroke(event);
  }

  function handleLostPointerCapture(event) {
    if (endViewportPan(event)) {
      return;
    }

    if (navigationGesture.isActive) {
      return;
    }

    cancelStroke(event);
  }

  function handleStageWheel(event) {
    if (!event.ctrlKey) {
      return;
    }

    event.preventDefault();
    setViewScale(state.viewScale * Math.exp(-event.deltaY * 0.002), event.clientX, event.clientY);
    notifyUiChange();
  }

  function handleWindowKeyDown(event) {
    if (event.code !== "Space" || isEditableTarget(event.target)) {
      return;
    }

    event.preventDefault();
    if (!state.isSpacePanning) {
      state.isSpacePanning = true;
      updateCanvasCursor();
    }
  }

  function handleWindowKeyUp(event) {
    if (event.code !== "Space") {
      return;
    }

    if (state.isSpacePanning) {
      event.preventDefault();
      state.isSpacePanning = false;
      endViewportPan();
      updateCanvasCursor();
    }
  }

  function handleWindowBlur() {
    state.isSpacePanning = false;
    endViewportPan();
    updateCanvasCursor();
  }

  function updateCanvasCursor() {
    if (panGesture.isActive) {
      fxCanvas.style.cursor = "grabbing";
      return;
    }

    fxCanvas.style.cursor = state.isSpacePanning ? "grab" : "crosshair";
  }

  function undoLastStroke() {
    if (!state.strokes.length) {
      return;
    }

    state.strokes.pop();
    redrawPaint();
    notifyUiChange();
  }

  function clearAllStrokes() {
    state.strokes = [];
    state.activeStroke = null;
    state.isDrawing = false;
    state.pointerId = null;
    paintCtx.clearRect(0, 0, state.viewportWidth, state.viewportHeight);
    fxCtx.clearRect(0, 0, state.viewportWidth, state.viewportHeight);
    notifyUiChange();
  }

  function animate(time) {
    fxCtx.clearRect(0, 0, state.viewportWidth, state.viewportHeight);
    withViewportTransform(fxCtx, () => {
      drawVisibleSparkles(fxCtx, time);
    });
    requestAnimationFrame(animate);
  }

  function initialize() {
    if (initialized) {
      return;
    }

    initialized = true;
    updateViewportSize(false);
    fxCanvas.addEventListener("wheel", handleStageWheel, { passive: false });
    fxCanvas.addEventListener("pointerdown", handlePointerDown);
    fxCanvas.addEventListener("pointermove", handlePointerMove);
    fxCanvas.addEventListener("pointerup", handlePointerUp);
    fxCanvas.addEventListener("pointercancel", handlePointerCancel);
    fxCanvas.addEventListener("lostpointercapture", handleLostPointerCapture);
    fxCanvas.addEventListener("contextmenu", (event) => event.preventDefault());
    window.addEventListener("keydown", handleWindowKeyDown);
    window.addEventListener("keyup", handleWindowKeyUp);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("resize", updateViewportSize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateViewportSize);
    }

    updateCanvasCursor();
    requestAnimationFrame(animate);
    notifyUiChange();
  }

  return {
    initialize,
    getState,
    setBrushSize,
    setMode,
    setActiveInk,
    setExportBackground,
    setExportingKind,
    undoLastStroke,
    clearAllStrokes,
    serializeProjectModel,
    loadProjectModel,
    renderCombinedFrame,
    getExportBounds,
    waitForNextPaint,
    focusInkBounds
  };
}

export { createViewportCanvasController };
