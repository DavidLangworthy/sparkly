import {
  TAU,
  clamp,
  lerp,
  hash01,
  inkById,
  inkPresets,
  backgroundById,
  createSparkleNode
} from "./ink.js";

const MIN_SCENE_DIMENSION = 320;
const MAX_SCENE_DIMENSION = 4096;
const MIN_VIEW_SCALE = 0.5;
const MAX_VIEW_SCALE = 2.5;

function createCanvasController({ elements, onUiChange = () => {} }) {
  const {
    stageViewport,
    canvasShell,
    paintCanvas,
    fxCanvas,
    canvasWidthInput,
    canvasHeightInput
  } = elements;
  const paintCtx = paintCanvas.getContext("2d");
  const fxCtx = fxCanvas.getContext("2d");
  const exportSparkleCanvas = document.createElement("canvas");
  const exportSparkleCtx = exportSparkleCanvas.getContext("2d");
  const state = {
    activeInkId: "chrome",
    brushSize: 20,
    mode: "spray",
    exportBackgroundId: "paper",
    exportingKind: null,
    strokes: [],
    activeStroke: null,
    isDrawing: false,
    isSpacePanning: false,
    pointerId: null,
    sceneWidth: 0,
    sceneHeight: 0,
    viewScale: 1
  };
  const navigationGesture = {
    touchPoints: new Map(),
    isActive: false,
    startDistance: 0,
    startScale: 1,
    anchorSceneX: 0,
    anchorSceneY: 0
  };
  const panGesture = {
    isActive: false,
    pointerId: null,
    startClientX: 0,
    startClientY: 0,
    startScrollLeft: 0,
    startScrollTop: 0
  };

  let initialized = false;

  function notifyUiChange() {
    onUiChange(state);
  }

  function getState() {
    return state;
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

  function getExportBackground() {
    return backgroundById.get(state.exportBackgroundId) || backgroundById.get("paper");
  }

  function updateCanvasBackground() {
    const background = getExportBackground();
    canvasShell.style.background = background.color
      ? background.color
      : "linear-gradient(45deg, rgba(126, 112, 96, 0.18) 25%, transparent 25%, transparent 75%, rgba(126, 112, 96, 0.18) 75%), linear-gradient(45deg, rgba(126, 112, 96, 0.18) 25%, transparent 25%, transparent 75%, rgba(126, 112, 96, 0.18) 75%), rgba(255, 255, 255, 0.92)";
    canvasShell.style.backgroundSize = background.color ? "auto" : "16px 16px";
    canvasShell.style.backgroundPosition = background.color ? "0 0" : "0 0, 8px 8px, 0 0";
  }

  function setExportBackground(backgroundId) {
    if (!backgroundById.has(backgroundId)) {
      return;
    }

    state.exportBackgroundId = backgroundId;
    updateCanvasBackground();
    notifyUiChange();
  }

  function clampSceneDimension(value, fallback) {
    const numericValue = Number.isFinite(value) ? value : fallback;
    return clamp(Math.round(numericValue), MIN_SCENE_DIMENSION, MAX_SCENE_DIMENSION);
  }

  function syncCanvasSizeInputs() {
    if (!state.sceneWidth || !state.sceneHeight) {
      return;
    }

    canvasWidthInput.value = String(state.sceneWidth);
    canvasHeightInput.value = String(state.sceneHeight);
  }

  function syncCanvasDisplaySize() {
    if (!state.sceneWidth || !state.sceneHeight) {
      return;
    }

    canvasShell.style.width = `${Math.max(1, Math.round(state.sceneWidth * state.viewScale))}px`;
    canvasShell.style.height = `${Math.max(1, Math.round(state.sceneHeight * state.viewScale))}px`;
  }

  function updateCanvasCursor() {
    if (panGesture.isActive) {
      fxCanvas.style.cursor = "grabbing";
      return;
    }

    fxCanvas.style.cursor = state.isSpacePanning ? "grab" : "crosshair";
  }

  function isEditableTarget(target) {
    return target instanceof HTMLElement
      && Boolean(target.closest("input, textarea, select, button, [contenteditable=\"\"], [contenteditable=\"true\"]"));
  }

  function getScenePointFromClient(clientX, clientY) {
    const rect = fxCanvas.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return {
        x: state.sceneWidth * 0.5,
        y: state.sceneHeight * 0.5
      };
    }

    return {
      x: clamp(((clientX - rect.left) / rect.width) * state.sceneWidth, 0, state.sceneWidth),
      y: clamp(((clientY - rect.top) / rect.height) * state.sceneHeight, 0, state.sceneHeight)
    };
  }

  function getViewportCenterClientPoint() {
    const rect = stageViewport.getBoundingClientRect();
    return {
      x: rect.left + rect.width * 0.5,
      y: rect.top + rect.height * 0.5
    };
  }

  function setViewScale(nextScale, anchorClientX = null, anchorClientY = null, anchorScenePoint = null) {
    const clampedScale = clamp(nextScale, MIN_VIEW_SCALE, MAX_VIEW_SCALE);

    if (!state.sceneWidth || !state.sceneHeight) {
      state.viewScale = clampedScale;
      syncCanvasDisplaySize();
      return;
    }

    const viewportRect = stageViewport.getBoundingClientRect();
    const clientX = anchorClientX == null ? viewportRect.left + viewportRect.width * 0.5 : anchorClientX;
    const clientY = anchorClientY == null ? viewportRect.top + viewportRect.height * 0.5 : anchorClientY;
    const scenePoint = anchorScenePoint || getScenePointFromClient(clientX, clientY);

    state.viewScale = clampedScale;
    syncCanvasDisplaySize();

    stageViewport.scrollLeft = canvasShell.offsetLeft + scenePoint.x * state.viewScale - (clientX - viewportRect.left);
    stageViewport.scrollTop = canvasShell.offsetTop + scenePoint.y * state.viewScale - (clientY - viewportRect.top);
  }

  function configureCanvas(canvas, ctx, width, height) {
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.imageSmoothingEnabled = true;
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

    return {
      inkId: inkById.has(rawStroke.inkId) ? rawStroke.inkId : inkPresets[0].id,
      mode: rawStroke.mode === "spray" ? "spray" : "brush",
      brushSize: clamp(Number.isFinite(rawStroke.brushSize) ? rawStroke.brushSize : state.brushSize, 6, 96),
      points,
      sparkleNodes,
      pathLength: Number.isFinite(rawStroke.pathLength) ? rawStroke.pathLength : measurePathLength(points),
      seed: Number.isFinite(rawStroke.seed) ? rawStroke.seed : Math.random() * 1000
    };
  }

  function redrawPaint() {
    paintCtx.clearRect(0, 0, state.sceneWidth, state.sceneHeight);
    state.strokes.forEach((stroke) => replayStroke(paintCtx, stroke));
    if (state.activeStroke) {
      replayStroke(paintCtx, state.activeStroke);
    }
  }

  function applySceneSize(nextWidth, nextHeight, preserveView = true) {
    if (state.isDrawing) {
      finishActiveStroke(true);
    }

    const width = clampSceneDimension(nextWidth, state.sceneWidth || stageViewport.clientWidth || 960);
    const height = clampSceneDimension(nextHeight, state.sceneHeight || stageViewport.clientHeight || 720);
    const hadScene = state.sceneWidth > 0 && state.sceneHeight > 0;
    const viewportCenter = getViewportCenterClientPoint();
    const centerScenePoint = hadScene && preserveView ? getScenePointFromClient(viewportCenter.x, viewportCenter.y) : null;

    state.sceneWidth = width;
    state.sceneHeight = height;

    configureCanvas(paintCanvas, paintCtx, width, height);
    configureCanvas(fxCanvas, fxCtx, width, height);
    syncCanvasDisplaySize();
    syncCanvasSizeInputs();
    redrawPaint();

    if (centerScenePoint) {
      setViewScale(state.viewScale, viewportCenter.x, viewportCenter.y, centerScenePoint);
    } else {
      stageViewport.scrollLeft = Math.max(0, Math.round((canvasShell.offsetWidth - stageViewport.clientWidth) * 0.5));
      stageViewport.scrollTop = Math.max(0, Math.round((canvasShell.offsetHeight - stageViewport.clientHeight) * 0.5));
    }

    notifyUiChange();
  }

  function initializeStage() {
    const width = clampSceneDimension(stageViewport.clientWidth - 36, 960);
    const height = clampSceneDimension(stageViewport.clientHeight - 36, 720);
    applySceneSize(width, height, false);
  }

  function getCanvasPoint(event) {
    const rect = fxCanvas.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return {
        x: state.sceneWidth * 0.5,
        y: state.sceneHeight * 0.5,
        t: performance.now(),
        pressure: event.pressure && event.pressure > 0 ? clamp(event.pressure, 0.2, 1) : 0.58
      };
    }

    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * state.sceneWidth, 0, state.sceneWidth),
      y: clamp(((event.clientY - rect.top) / rect.height) * state.sceneHeight, 0, state.sceneHeight),
      t: performance.now(),
      pressure: event.pressure && event.pressure > 0 ? clamp(event.pressure, 0.2, 1) : 0.58
    };
  }

  function createStroke(point) {
    const stroke = {
      inkId: state.activeInkId,
      mode: state.mode,
      brushSize: state.brushSize,
      points: [point],
      sparkleNodes: [],
      pathLength: 0,
      seed: Math.random() * 1000 + performance.now() * 0.01
    };

    Object.defineProperty(stroke, "_sparkleCandidateCount", {
      value: 0,
      writable: true,
      configurable: true
    });

    return stroke;
  }

  function getPreset(stroke) {
    return inkById.get(stroke.inkId);
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
      return;
    }

    const replacementIndex = Math.floor(hash01(randomKey + 10.37) * stroke._sparkleCandidateCount);
    if (replacementIndex < budget) {
      stroke.sparkleNodes[replacementIndex] = sparkleNode;
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
      const theta = hash01(key) * TAU;
      const distance = Math.sqrt(hash01(key + 1.7)) * scatter;
      const x = point.x + Math.cos(theta) * distance;
      const y = point.y + Math.sin(theta) * distance;
      const radius = stroke.brushSize * lerp(0.12, 0.26, hash01(key + 2.4)) * (0.7 + point.pressure * 0.4);
      const stamp = {
        x,
        y,
        radius,
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

  function getExportBounds() {
    const strokes = getRenderableStrokes();

    if (!strokes.length) {
      return {
        x: 0,
        y: 0,
        width: state.sceneWidth,
        height: state.sceneHeight
      };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    strokes.forEach((stroke) => {
      const strokePad = stroke.brushSize * (stroke.mode === "spray" ? 2.3 : 1.7);
      stroke.points.forEach((point) => {
        minX = Math.min(minX, point.x - strokePad);
        minY = Math.min(minY, point.y - strokePad);
        maxX = Math.max(maxX, point.x + strokePad);
        maxY = Math.max(maxY, point.y + strokePad);
      });

      stroke.sparkleNodes.forEach((node) => {
        const sparklePad = node.size * 4.5 + node.drift * 3;
        minX = Math.min(minX, node.x - sparklePad);
        minY = Math.min(minY, node.y - sparklePad);
        maxX = Math.max(maxX, node.x + sparklePad);
        maxY = Math.max(maxY, node.y + sparklePad);
      });
    });

    const outerPad = 28;
    const x = clamp(Math.floor(minX - outerPad), 0, state.sceneWidth);
    const y = clamp(Math.floor(minY - outerPad), 0, state.sceneHeight);
    const right = clamp(Math.ceil(maxX + outerPad), 0, state.sceneWidth);
    const bottom = clamp(Math.ceil(maxY + outerPad), 0, state.sceneHeight);

    return {
      x,
      y,
      width: Math.max(1, right - x),
      height: Math.max(1, bottom - y)
    };
  }

  function drawSparklesToContext(ctx, time, scaleX = 1, scaleY = 1, offsetX = 0, offsetY = 0) {
    ctx.save();
    ctx.scale(scaleX, scaleY);
    ctx.translate(-offsetX, -offsetY);
    getRenderableStrokes().forEach((stroke) => {
      const preset = getPreset(stroke);
      stroke.sparkleNodes.forEach((node) => {
        preset.renderGlint(ctx, node, time);
      });
    });
    ctx.restore();
  }

  function renderCombinedFrame(
    ctx,
    time,
    width,
    height,
    bounds = { x: 0, y: 0, width: state.sceneWidth, height: state.sceneHeight },
    background = getExportBackground()
  ) {
    const sourceScaleX = paintCanvas.width / state.sceneWidth;
    const sourceScaleY = paintCanvas.height / state.sceneHeight;

    if (exportSparkleCanvas.width !== width || exportSparkleCanvas.height !== height) {
      exportSparkleCanvas.width = width;
      exportSparkleCanvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);
    if (background.color) {
      ctx.fillStyle = background.color;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(
      paintCanvas,
      bounds.x * sourceScaleX,
      bounds.y * sourceScaleY,
      bounds.width * sourceScaleX,
      bounds.height * sourceScaleY,
      0,
      0,
      width,
      height
    );
    exportSparkleCtx.clearRect(0, 0, width, height);
    drawSparklesToContext(exportSparkleCtx, time, width / bounds.width, height / bounds.height, bounds.x, bounds.y);
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(exportSparkleCanvas, 0, 0, width, height);
  }

  function serializeProjectModel() {
    return {
      app: "shimmer-ink-studio",
      version: 1,
      sceneWidth: state.sceneWidth,
      sceneHeight: state.sceneHeight,
      activeInkId: state.activeInkId,
      brushSize: state.brushSize,
      mode: state.mode,
      exportBackgroundId: state.exportBackgroundId,
      strokes: getRenderableStrokes()
    };
  }

  function loadProjectModel(raw) {
    if (!raw || raw.version !== 1 || !Array.isArray(raw.strokes)) {
      throw new Error("Unsupported project format");
    }

    const importedSceneWidth = Number.isFinite(raw.sceneWidth) && raw.sceneWidth > 0
      ? clampSceneDimension(raw.sceneWidth, state.sceneWidth || 960)
      : state.sceneWidth;
    const importedSceneHeight = Number.isFinite(raw.sceneHeight) && raw.sceneHeight > 0
      ? clampSceneDimension(raw.sceneHeight, state.sceneHeight || 720)
      : state.sceneHeight;
    const importedStrokes = raw.strokes.map(sanitizeStroke).filter(Boolean);

    if (importedSceneWidth && importedSceneHeight) {
      applySceneSize(importedSceneWidth, importedSceneHeight, false);
    }

    state.strokes = importedStrokes;
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

    updateCanvasBackground();
    redrawPaint();
    notifyUiChange();
  }

  function finishActiveStroke(commitStroke = true) {
    const capturedPointerId = state.pointerId;

    if (commitStroke && state.activeStroke) {
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
    renderStrokeStart(paintCtx, state.activeStroke, true);
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
    stroke.pathLength = drawStrokeSegment(
      paintCtx,
      stroke,
      lastPoint,
      point,
      stroke.pathLength,
      true,
      stroke.points.length - 1
    );
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
  }

  function getNavigationGestureTouches() {
    return Array.from(navigationGesture.touchPoints.values());
  }

  function getNavigationGestureMetrics() {
    const touches = getNavigationGestureTouches();
    const [firstTouch, secondTouch] = touches;
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
    const anchorScenePoint = getScenePointFromClient(center.x, center.y);

    navigationGesture.isActive = true;
    navigationGesture.startDistance = Math.max(distance, 1);
    navigationGesture.startScale = state.viewScale;
    navigationGesture.anchorSceneX = anchorScenePoint.x;
    navigationGesture.anchorSceneY = anchorScenePoint.y;
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
    panGesture.startScrollLeft = stageViewport.scrollLeft;
    panGesture.startScrollTop = stageViewport.scrollTop;
    fxCanvas.setPointerCapture(event.pointerId);
    updateCanvasCursor();
    return true;
  }

  function updateViewportPan(event) {
    if (!panGesture.isActive || event.pointerId !== panGesture.pointerId) {
      return false;
    }

    event.preventDefault();
    stageViewport.scrollLeft = panGesture.startScrollLeft - (event.clientX - panGesture.startClientX);
    stageViewport.scrollTop = panGesture.startScrollTop - (event.clientY - panGesture.startClientY);
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
      { x: navigationGesture.anchorSceneX, y: navigationGesture.anchorSceneY }
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
    paintCtx.clearRect(0, 0, state.sceneWidth, state.sceneHeight);
    fxCtx.clearRect(0, 0, state.sceneWidth, state.sceneHeight);
    notifyUiChange();
  }

  function rerender() {
    redrawPaint();
    notifyUiChange();
  }

  function animate(time) {
    fxCtx.globalCompositeOperation = "source-over";
    fxCtx.clearRect(0, 0, state.sceneWidth, state.sceneHeight);
    drawSparklesToContext(fxCtx, time, 1, 1);

    requestAnimationFrame(animate);
  }

  function initialize() {
    if (initialized) {
      return;
    }

    initialized = true;
    stageViewport.addEventListener("wheel", handleStageWheel, { passive: false });
    fxCanvas.addEventListener("pointerdown", handlePointerDown);
    fxCanvas.addEventListener("pointermove", handlePointerMove);
    fxCanvas.addEventListener("pointerup", handlePointerUp);
    fxCanvas.addEventListener("pointercancel", handlePointerCancel);
    fxCanvas.addEventListener("lostpointercapture", handleLostPointerCapture);
    fxCanvas.addEventListener("contextmenu", (event) => event.preventDefault());
    window.addEventListener("keydown", handleWindowKeyDown);
    window.addEventListener("keyup", handleWindowKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    updateCanvasBackground();
    initializeStage();
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
    applySceneSize,
    rerender
  };
}

export { createCanvasController };
