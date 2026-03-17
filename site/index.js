import { inkById, backgroundOptions } from "./ink.js";
import { createCanvasController } from "./canvas.js";
import { createExportController } from "./export.js";
import { fromPaletteInk, paletteSeedById, inkSeedById } from "./glitter-algebra.js";
import { renderIcon } from "./ui-icons.js";

const DEFAULT_INK_ID = "param-og-rainbow";
const INK_RAIL_HINT_KEY = "sparkly.inkRailHintSeen";
const PREVIEW_BY_RUNTIME_ID = {
  "param-og-rainbow": "./previews/rainbow-chrome.svg",
  "param-gold": "./previews/gold.svg",
  "param-silver": "./previews/silver.svg",
  "param-pearl": "./previews/pearl.svg",
  "param-opal": "./previews/opal.svg",
  "param-rose": "./previews/rose.svg",
  "param-galaxy": "./previews/galaxy.svg",
  "param-ember": "./previews/ember.svg"
};
const parameterizedInkSpecs = [
  { inkId: "og-rainbow", runtimeId: "param-og-rainbow" },
  { inkId: "gold", runtimeId: "param-gold" },
  { inkId: "silver", runtimeId: "param-silver" },
  { inkId: "pearl", runtimeId: "param-pearl" },
  { inkId: "opal", runtimeId: "param-opal" },
  { inkId: "rose", runtimeId: "param-rose" },
  { inkId: "galaxy", runtimeId: "param-galaxy" },
  { inkId: "ember", runtimeId: "param-ember" }
];

const stageViewport = document.getElementById("stageViewport");
const canvasShell = document.getElementById("canvasShell");
const paintCanvas = document.getElementById("paintCanvas");
const fxCanvas = document.getElementById("fxCanvas");
const canvasWidthInput = document.getElementById("canvasWidthInput");
const canvasHeightInput = document.getElementById("canvasHeightInput");
const controlsBackdrop = document.getElementById("controlsBackdrop");
const controlsSheet = document.getElementById("controlsSheet");
const controlsToggle = document.getElementById("controlsToggle");
const activeInkButton = document.getElementById("activeInkButton");
const activeInkPreview = document.getElementById("activeInkPreview");
const activeInkName = document.getElementById("activeInkName");
const activeInkMeta = document.getElementById("activeInkMeta");
const inkPicker = document.getElementById("inkPicker");
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
let hasPlayedRailHint = false;
let sheetTouchStartY = null;
let lastCenteredInkId = null;

function registerParameterizedInks() {
  return parameterizedInkSpecs.map(({ inkId, runtimeId }) => {
    const ink = inkSeedById.get(inkId);
    const palette = paletteSeedById.get(ink.meta.paletteId);
    const runtimePreset = fromPaletteInk({
      palette,
      ink: {
        ...ink,
        meta: {
          ...ink.meta,
          id: runtimeId
        }
      }
    });

    inkById.set(runtimeId, runtimePreset);
    const label = inkId === "og-rainbow" ? "Rainbow Chrome" : runtimePreset.label;
    return {
      id: runtimeId,
      label,
      note: inkId === "og-rainbow"
        ? "A shifting chrome ribbon with prismatic sparkles and rotating color flips."
        : runtimePreset.note,
      previewSrc: PREVIEW_BY_RUNTIME_ID[runtimeId],
      preset: runtimePreset
    };
  });
}

const inkEntries = registerParameterizedInks();
const inkEntriesById = new Map(inkEntries.map((entry) => [entry.id, entry]));

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

function getState() {
  return canvasController.getState();
}

function getEntry(inkId) {
  return inkEntriesById.get(inkId) || null;
}

function markRailHintSeen() {
  hasPlayedRailHint = true;
  localStorage.setItem(INK_RAIL_HINT_KEY, "1");
}

function closeControls() {
  controlsSheet.hidden = true;
  controlsBackdrop.hidden = true;
  controlsToggle.setAttribute("aria-expanded", "false");
  controlsToggle.title = "Show controls";
  controlsToggle.setAttribute("aria-label", "Show controls");
  controlsToggle.innerHTML = renderIcon("sliders");
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
}

function toggleControls() {
  if (controlsSheet.hidden) {
    openControls();
  } else {
    closeControls();
  }
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
    button.dataset.inkId = entry.id;

    image.className = "ink-option__preview";
    image.src = entry.previewSrc;
    image.alt = "";
    image.decoding = "async";
    image.loading = "lazy";
    image.draggable = false;

    button.appendChild(image);
    button.addEventListener("click", () => {
      markRailHintSeen();
      canvasController.setActiveInk(entry.id);
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
  const entry = getEntry(getState().activeInkId);
  if (!entry) {
    return;
  }

  if (activeInkPreview.getAttribute("src") !== entry.previewSrc) {
    activeInkPreview.setAttribute("src", entry.previewSrc);
  }
}

function scrollInkIntoView(inkId, behavior = "smooth") {
  const button = inkPicker.querySelector(`[data-ink-id="${inkId}"]`);
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
  const state = getState();
  inkPicker.querySelectorAll(".ink-option").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.inkId === state.activeInkId);
  });
}

function updateInkReadout() {
  const state = getState();
  const entry = getEntry(state.activeInkId);
  const preset = inkById.get(state.activeInkId);

  activeInkName.textContent = entry ? entry.label : preset?.label || "Ink";
  activeInkMeta.textContent = entry?.note || preset?.note || "";
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

function syncUi() {
  const state = getState();
  updateInkButtons();
  updateSelectedPreview();
  updateInkReadout();
  updateModeButtons();
  updateBackgroundButtons();
  updateActionButtons();
  brushSizeInput.value = String(state.brushSize);
  brushValue.textContent = `${state.brushSize}px`;

  if (state.activeInkId !== lastCenteredInkId && getEntry(state.activeInkId)) {
    scrollInkIntoView(state.activeInkId, lastCenteredInkId ? "smooth" : "auto");
    lastCenteredInkId = state.activeInkId;
  }
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
  updateControlIcons();
  buildInkPicker();
  buildBackgroundPicker();

  canvasController.setActiveInk(DEFAULT_INK_ID);
  canvasController.setMode("spray");
  canvasController.setExportBackground("transparent");
  canvasController.initialize();

  controlsToggle.addEventListener("click", toggleControls);
  controlsBackdrop.addEventListener("click", closeControls);
  activeInkButton.addEventListener("click", () => scrollInkIntoView(getState().activeInkId));
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
    }
  });

  initializeSheetSwipeClose();
  closeControls();
  syncUi();

  if (localStorage.getItem(INK_RAIL_HINT_KEY)) {
    hasPlayedRailHint = true;
  } else {
    requestAnimationFrame(() => {
      requestAnimationFrame(maybePlayRailHint);
    });
  }
}

initialize();
