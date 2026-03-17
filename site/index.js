import { inkById, backgroundOptions } from "./ink.js";
import { createCanvasController } from "./canvas.js";
import { createExportController } from "./export.js";
import { buildParameterizedInkCatalog } from "./ink-variants.js";
import { drawInkSwoopPreview } from "./ink-preview.js";
import { renderIcon } from "./ui-icons.js";

const DEFAULT_BASE_INK_ID = "og-rainbow";
const DEFAULT_VIEW_MODE = "draw";
const INK_RAIL_HINT_KEY = "sparkly.inkRailHintSeen";
const VARIANT_SELECTIONS_KEY = "sparkly.variantSelections.v1";
const VIEW_MODE_KEY = "sparkly.index.viewMode.v1";

const stageRoot = document.getElementById("stageRoot");
const stageViewport = document.getElementById("stageViewport");
const canvasShell = document.getElementById("canvasShell");
const paintCanvas = document.getElementById("paintCanvas");
const fxCanvas = document.getElementById("fxCanvas");
const canvasWidthInput = document.getElementById("canvasWidthInput");
const canvasHeightInput = document.getElementById("canvasHeightInput");
const topOverlay = document.getElementById("topOverlay");
const controlsBackdrop = document.getElementById("controlsBackdrop");
const controlsSheet = document.getElementById("controlsSheet");
const controlsToggle = document.getElementById("controlsToggle");
const activeInkButton = document.getElementById("activeInkButton");
const activeInkPreview = document.getElementById("activeInkPreview");
const activeInkName = document.getElementById("activeInkName");
const activeInkMeta = document.getElementById("activeInkMeta");
const inkPicker = document.getElementById("inkPicker");
const drawViewButton = document.getElementById("drawViewButton");
const variantsViewButton = document.getElementById("variantsViewButton");
const variantSheet = document.getElementById("variantSheet");
const variantSheetTitle = document.getElementById("variantSheetTitle");
const variantSheetNote = document.getElementById("variantSheetNote");
const variantGrid = document.getElementById("variantGrid");
const backgroundPicker = document.getElementById("backgroundPicker");
const brushSizeInput = document.getElementById("brushSize");
const brushValue = document.getElementById("brushValue");
const brushModeButton = document.getElementById("brushModeButton");
const sprayModeButton = document.getElementById("sprayModeButton");
const undoButton = document.getElementById("undoButton");
const shareButton = document.getElementById("shareButton");
const saveGifButton = document.getElementById("saveGifButton");
const clearButton = document.getElementById("clearButton");
const saveProjectButton = document.getElementById("saveProjectButton");
const openProjectButton = document.getElementById("openProjectButton");
const projectInput = document.getElementById("projectInput");

const modeButtons = [brushModeButton, sprayModeButton];
const viewButtons = [drawViewButton, variantsViewButton];
const {
  entries: inkEntries,
  entryByBaseInkId,
  variantByRuntimeId
} = buildParameterizedInkCatalog(inkById);
const selectedRuntimeByBaseInkId = new Map(inkEntries.map((entry) => [entry.baseInkId, entry.defaultRuntimeId]));

const canvasController = createCanvasController({
  elements: {
    stageViewport,
    canvasShell,
    paintCanvas,
    fxCanvas,
    canvasWidthInput,
    canvasHeightInput
  },
  onUiChange: syncUi,
  transparentPreviewColor: "rgba(255, 255, 255, 0.96)",
  navigationGrowth: {
    enabled: true,
    initialViewportMultiplier: 2.35,
    edgeThresholdPx: 220,
    chunkWidth: 1024,
    chunkHeight: 768
  }
});

const exportController = createExportController({
  canvas: canvasController,
  paintCanvas
});

let currentBaseInkId = DEFAULT_BASE_INK_ID;
let currentViewMode = DEFAULT_VIEW_MODE;
let hasPlayedRailHint = false;
let sheetTouchStartY = null;
let lastCenteredBaseInkId = null;
let lastVariantSheetKey = "";
let variantPreviewQueueId = 0;
let variantPreviewEntries = [];
let overlaySyncId = 0;

function getState() {
  return canvasController.getState();
}

function getEntry(baseInkId) {
  return entryByBaseInkId.get(baseInkId) || null;
}

function getVariantMatch(runtimeId) {
  return variantByRuntimeId.get(runtimeId) || null;
}

function getSelectedRuntimeId(baseInkId = currentBaseInkId) {
  const entry = getEntry(baseInkId);
  if (!entry) {
    return null;
  }

  return selectedRuntimeByBaseInkId.get(baseInkId) || entry.defaultRuntimeId;
}

function getSelectedVariant(baseInkId = currentBaseInkId) {
  const entry = getEntry(baseInkId);
  const runtimeId = getSelectedRuntimeId(baseInkId);
  return entry?.variants.find((variant) => variant.runtimeId === runtimeId) || entry?.variants[0] || null;
}

function loadVariantSelections() {
  try {
    const raw = JSON.parse(localStorage.getItem(VARIANT_SELECTIONS_KEY) || "{}");
    if (!raw || typeof raw !== "object") {
      return;
    }

    inkEntries.forEach((entry) => {
      const runtimeId = raw[entry.baseInkId];
      if (typeof runtimeId !== "string") {
        return;
      }

      const match = getVariantMatch(runtimeId);
      if (match && match.entry.baseInkId === entry.baseInkId) {
        selectedRuntimeByBaseInkId.set(entry.baseInkId, runtimeId);
      }
    });
  } catch {
    // Ignore malformed local drafts and keep curated defaults.
  }
}

function saveVariantSelections() {
  const serialized = {};
  selectedRuntimeByBaseInkId.forEach((runtimeId, baseInkId) => {
    serialized[baseInkId] = runtimeId;
  });
  localStorage.setItem(VARIANT_SELECTIONS_KEY, JSON.stringify(serialized));
}

function loadViewMode() {
  const saved = localStorage.getItem(VIEW_MODE_KEY);
  if (saved === "variants") {
    currentViewMode = "variants";
  }
}

function saveViewMode() {
  localStorage.setItem(VIEW_MODE_KEY, currentViewMode);
}

function syncInkSelectionFromCanvas() {
  const match = getVariantMatch(getState().activeInkId);
  if (!match) {
    return;
  }

  currentBaseInkId = match.entry.baseInkId;
  selectedRuntimeByBaseInkId.set(match.entry.baseInkId, match.variant.runtimeId);
}

function markRailHintSeen() {
  hasPlayedRailHint = true;
  localStorage.setItem(INK_RAIL_HINT_KEY, "1");
}

function syncOverlayOffset() {
  cancelAnimationFrame(overlaySyncId);
  overlaySyncId = requestAnimationFrame(() => {
    const rect = topOverlay.getBoundingClientRect();
    stageRoot.style.setProperty("--overlay-offset", `${Math.ceil(rect.height + 12)}px`);
  });
}

function closeControls() {
  controlsSheet.hidden = true;
  controlsBackdrop.hidden = true;
  controlsToggle.setAttribute("aria-expanded", "false");
  controlsToggle.title = "Show controls";
  controlsToggle.setAttribute("aria-label", "Show controls");
  controlsToggle.innerHTML = renderIcon("sliders");
  syncOverlayOffset();
}

function openControls() {
  controlsSheet.hidden = false;
  controlsBackdrop.hidden = false;
  controlsSheet.classList.remove("is-open");
  void controlsSheet.offsetWidth;
  controlsSheet.classList.add("is-open");
  controlsToggle.setAttribute("aria-expanded", "true");
  controlsToggle.title = "Hide controls";
  controlsToggle.setAttribute("aria-label", "Hide controls");
  controlsToggle.innerHTML = renderIcon("chevronUp");
  syncOverlayOffset();
}

function toggleControls() {
  if (controlsSheet.hidden) {
    openControls();
  } else {
    closeControls();
  }
}

function setViewMode(nextMode) {
  if (nextMode !== "draw" && nextMode !== "variants") {
    return;
  }

  currentViewMode = nextMode;
  stageViewport.hidden = nextMode === "variants";
  variantSheet.hidden = nextMode !== "variants";
  saveViewMode();
  updateViewButtons();

  if (currentViewMode === "variants") {
    renderVariantSheet();
  }

  syncOverlayOffset();
}

function updateControlIcons() {
  undoButton.innerHTML = renderIcon("undo");
  shareButton.innerHTML = renderIcon("share");
  controlsToggle.innerHTML = renderIcon("sliders");
  brushModeButton.innerHTML = renderIcon("brush");
  sprayModeButton.innerHTML = renderIcon("spray");
  saveGifButton.innerHTML = renderIcon("download");
  clearButton.innerHTML = renderIcon("trash");
  saveProjectButton.innerHTML = renderIcon("saveProject");
  openProjectButton.innerHTML = renderIcon("folderOpen");
  document.getElementById("modeIconHost").innerHTML = renderIcon("chevronDown");
  document.getElementById("brushIconHost").innerHTML = renderIcon("brush");
  document.getElementById("backgroundIconHost").innerHTML = renderIcon("circle");
  document.getElementById("actionsIconHost").innerHTML = renderIcon("sliders");
}

function buildInkPicker() {
  const fragment = document.createDocumentFragment();

  inkEntries.forEach((entry) => {
    const button = document.createElement("button");
    const image = document.createElement("img");

    button.type = "button";
    button.className = "ink-option";
    button.setAttribute("role", "listitem");
    button.setAttribute("aria-label", entry.label);
    button.title = entry.label;
    button.dataset.baseInkId = entry.baseInkId;

    image.className = "ink-option__preview";
    image.src = entry.previewSrc;
    image.alt = "";
    image.decoding = "async";
    image.loading = "lazy";
    image.draggable = false;

    button.appendChild(image);
    button.addEventListener("click", () => {
      markRailHintSeen();
      activateBaseInk(entry.baseInkId);
    });
    fragment.appendChild(button);
  });

  inkPicker.appendChild(fragment);
}

function buildBackgroundPicker() {
  const fragment = document.createDocumentFragment();

  backgroundOptions.forEach((background) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `background-chip ${background.className || ""}`.trim();
    button.setAttribute("role", "listitem");
    button.setAttribute("aria-label", background.label);
    button.title = background.label;
    button.dataset.backgroundId = background.id;
    if (background.color) {
      button.style.setProperty("--bg-color", background.color);
    }
    button.addEventListener("click", () => canvasController.setExportBackground(background.id));
    fragment.appendChild(button);
  });

  backgroundPicker.appendChild(fragment);
}

function updateSelectedPreview() {
  const entry = getEntry(currentBaseInkId);
  if (!entry) {
    return;
  }

  if (activeInkPreview.getAttribute("src") !== entry.previewSrc) {
    activeInkPreview.setAttribute("src", entry.previewSrc);
  }
}

function scrollInkIntoView(baseInkId, behavior = "smooth") {
  const button = inkPicker.querySelector(`[data-base-ink-id="${baseInkId}"]`);
  if (!button) {
    return;
  }

  button.scrollIntoView({
    behavior,
    block: "nearest",
    inline: "center"
  });
}

function updateInkButtons() {
  inkPicker.querySelectorAll(".ink-option").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.baseInkId === currentBaseInkId);
  });
}

function updateInkReadout() {
  const entry = getEntry(currentBaseInkId);
  const variant = getSelectedVariant(currentBaseInkId);

  activeInkName.textContent = entry?.label || "Ink";
  activeInkMeta.textContent = variant
    ? `${variant.label} · ${variant.description}`
    : entry?.note || "";
}

function updateViewButtons() {
  viewButtons.forEach((button) => {
    const isActive = button.dataset.view === currentViewMode;
    button.classList.toggle("view-chip--active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}

function updateModeButtons() {
  const state = getState();
  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === state.mode;
    button.classList.toggle("tool-icon--active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function updateBackgroundButtons() {
  const state = getState();
  backgroundPicker.querySelectorAll(".background-chip").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.backgroundId === state.exportBackgroundId);
  });
}

function updateActionButtons() {
  const state = getState();
  const hasCommitted = state.strokes.length > 0;
  const hasAnything = hasCommitted || Boolean(state.activeStroke);
  const isSharing = state.exportingKind === "share-gif";
  const isSavingGif = state.exportingKind === "gif";
  const isExporting = Boolean(state.exportingKind);

  undoButton.disabled = !hasCommitted;
  shareButton.disabled = !hasAnything || isExporting;
  saveGifButton.disabled = !hasAnything || isExporting;
  clearButton.disabled = !hasAnything;
  saveProjectButton.disabled = !hasAnything || isExporting;

  shareButton.classList.toggle("is-busy", isSharing);
  saveGifButton.classList.toggle("is-busy", isSavingGif);
}

function queueVariantPreviewRender() {
  cancelAnimationFrame(variantPreviewQueueId);
  variantPreviewQueueId = requestAnimationFrame(() => {
    const activeRuntimeId = getSelectedRuntimeId(currentBaseInkId);
    variantPreviewEntries.forEach(({ canvas, variant }) => {
      drawInkSwoopPreview(canvas, variant.preset, {
        active: activeRuntimeId === variant.runtimeId
      });
    });
  });
}

function renderVariantSheet() {
  const entry = getEntry(currentBaseInkId);
  const activeRuntimeId = getSelectedRuntimeId(currentBaseInkId);
  const nextKey = `${currentBaseInkId}:${activeRuntimeId}`;

  if (!entry) {
    return;
  }

  if (lastVariantSheetKey === nextKey && currentViewMode === "variants") {
    queueVariantPreviewRender();
    return;
  }

  lastVariantSheetKey = nextKey;
  variantPreviewEntries = [];
  variantGrid.textContent = "";
  variantSheetTitle.textContent = `${entry.label} Test Sheet`;
  variantSheetNote.textContent = entry.note;

  entry.variants.forEach((variant) => {
    const card = document.createElement("button");
    const top = document.createElement("div");
    const text = document.createElement("div");
    const title = document.createElement("strong");
    const description = document.createElement("p");
    const badge = document.createElement("span");
    const preview = document.createElement("canvas");

    card.type = "button";
    card.className = "variant-card";
    card.dataset.runtimeId = variant.runtimeId;
    card.dataset.variantId = variant.id;
    card.setAttribute("aria-pressed", activeRuntimeId === variant.runtimeId ? "true" : "false");

    top.className = "variant-card__top";
    text.className = "variant-card__text";
    title.className = "variant-card__title";
    description.className = "variant-card__description";
    badge.className = "variant-card__badge";
    preview.className = "variant-card__preview";

    title.textContent = variant.label;
    description.textContent = variant.description;
    badge.textContent = activeRuntimeId === variant.runtimeId ? "Using in canvas" : "Tap to use";

    text.appendChild(title);
    text.appendChild(description);
    top.appendChild(text);
    top.appendChild(badge);
    card.appendChild(top);
    card.appendChild(preview);

    if (activeRuntimeId === variant.runtimeId) {
      card.classList.add("is-active");
    }

    card.addEventListener("click", () => {
      applyVariant(variant.runtimeId);
    });

    variantPreviewEntries.push({ canvas: preview, variant });
    variantGrid.appendChild(card);
  });

  queueVariantPreviewRender();
}

function applyVariant(runtimeId) {
  const match = getVariantMatch(runtimeId);
  if (!match) {
    return;
  }

  currentBaseInkId = match.entry.baseInkId;
  selectedRuntimeByBaseInkId.set(match.entry.baseInkId, match.variant.runtimeId);
  saveVariantSelections();
  canvasController.setActiveInk(match.variant.runtimeId);
}

function activateBaseInk(baseInkId) {
  const entry = getEntry(baseInkId);
  if (!entry) {
    return;
  }

  currentBaseInkId = baseInkId;
  canvasController.setActiveInk(getSelectedRuntimeId(baseInkId) || entry.defaultRuntimeId);
}

function syncUi() {
  const state = getState();
  syncInkSelectionFromCanvas();
  updateInkButtons();
  updateSelectedPreview();
  updateInkReadout();
  updateViewButtons();
  updateModeButtons();
  updateBackgroundButtons();
  updateActionButtons();
  brushSizeInput.value = String(state.brushSize);
  brushValue.textContent = `${state.brushSize}px`;

  if (currentBaseInkId !== lastCenteredBaseInkId && getEntry(currentBaseInkId)) {
    scrollInkIntoView(currentBaseInkId, lastCenteredBaseInkId ? "smooth" : "auto");
    lastCenteredBaseInkId = currentBaseInkId;
  }

  if (currentViewMode === "variants") {
    renderVariantSheet();
  }

  syncOverlayOffset();
}

function maybePlayRailHint() {
  if (hasPlayedRailHint) {
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    markRailHintSeen();
    return;
  }

  if (inkPicker.scrollWidth <= inkPicker.clientWidth + 12) {
    return;
  }

  hasPlayedRailHint = true;
  setTimeout(() => {
    inkPicker.scrollTo({ left: 32, behavior: "smooth" });
    setTimeout(() => {
      inkPicker.scrollTo({ left: 0, behavior: "smooth" });
      localStorage.setItem(INK_RAIL_HINT_KEY, "1");
    }, 420);
  }, 480);
}

function handleProjectOpen() {
  projectInput.click();
}

function handleWindowResize() {
  if (currentViewMode === "variants") {
    queueVariantPreviewRender();
  }
  syncOverlayOffset();
  maybePlayRailHint();
}

function initializeSheetSwipeClose() {
  controlsSheet.addEventListener("touchstart", (event) => {
    sheetTouchStartY = event.touches[0]?.clientY ?? null;
  }, { passive: true });

  controlsSheet.addEventListener("touchend", (event) => {
    if (sheetTouchStartY == null) {
      return;
    }

    const endY = event.changedTouches[0]?.clientY ?? sheetTouchStartY;
    if (endY - sheetTouchStartY < -42) {
      closeControls();
    }
    sheetTouchStartY = null;
  });
}

function initialize() {
  loadVariantSelections();
  loadViewMode();
  updateControlIcons();
  buildInkPicker();
  buildBackgroundPicker();

  const initialRuntimeId = getSelectedRuntimeId(DEFAULT_BASE_INK_ID) || getEntry(DEFAULT_BASE_INK_ID)?.defaultRuntimeId;
  canvasController.setActiveInk(initialRuntimeId);
  canvasController.setMode("spray");
  canvasController.setExportBackground("transparent");
  canvasController.initialize();

  controlsToggle.addEventListener("click", toggleControls);
  controlsBackdrop.addEventListener("click", closeControls);
  activeInkButton.addEventListener("click", () => scrollInkIntoView(currentBaseInkId));
  drawViewButton.addEventListener("click", () => setViewMode("draw"));
  variantsViewButton.addEventListener("click", () => setViewMode("variants"));
  undoButton.addEventListener("click", () => canvasController.undoLastStroke());
  shareButton.addEventListener("click", () => exportController.shareGif());
  saveGifButton.addEventListener("click", () => exportController.exportGif());
  clearButton.addEventListener("click", () => canvasController.clearAllStrokes());
  saveProjectButton.addEventListener("click", () => exportController.saveProject());
  openProjectButton.addEventListener("click", handleProjectOpen);
  projectInput.addEventListener("change", (event) => exportController.openProjectFile(event));
  brushSizeInput.addEventListener("input", (event) => canvasController.setBrushSize(Number(event.target.value)));
  modeButtons.forEach((button) => {
    button.addEventListener("click", () => canvasController.setMode(button.dataset.mode));
  });
  inkPicker.addEventListener("scroll", () => {
    if (!hasPlayedRailHint) {
      markRailHintSeen();
    }
  }, { passive: true });
  window.addEventListener("resize", handleWindowResize);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeControls();
      if (currentViewMode === "variants") {
        setViewMode("draw");
      }
    }
  });

  initializeSheetSwipeClose();
  closeControls();
  syncUi();
  setViewMode(currentViewMode);

  if (localStorage.getItem(INK_RAIL_HINT_KEY)) {
    hasPlayedRailHint = true;
  } else {
    requestAnimationFrame(() => {
      requestAnimationFrame(maybePlayRailHint);
    });
  }
}

initialize();
