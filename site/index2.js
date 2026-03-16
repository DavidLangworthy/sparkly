import {
  inkById,
  backgroundOptions,
  createSparkleNode
} from "./ink.js";
import {
  createCanvasController
} from "./canvas.js";
import {
  createExportController
} from "./export.js";
import {
  fromPaletteInk,
  paletteSeedById,
  inkSeedById
} from "./glitter-algebra.js";

const DEFAULT_INK_ID = "param-og-rainbow";
const exportLabels = {
  share: "Share GIF",
  png: "PNG",
  gif: "GIF"
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

const inkPicker = document.getElementById("inkPicker");
const backgroundPicker = document.getElementById("backgroundPicker");
const brushSizeInput = document.getElementById("brushSize");
const brushValue = document.getElementById("brushValue");
const modeButtons = Array.from(document.querySelectorAll("[data-mode]"));
const undoButton = document.getElementById("undoButton");
const clearButton = document.getElementById("clearButton");
const saveButton = document.getElementById("saveButton");
const openButton = document.getElementById("openButton");
const shareButton = document.getElementById("shareButton");
const exportButton = document.getElementById("exportButton");
const gifButton = document.getElementById("gifButton");
const canvasSizeForm = document.getElementById("canvasSizeForm");
const canvasWidthInput = document.getElementById("canvasWidthInput");
const canvasHeightInput = document.getElementById("canvasHeightInput");
const projectInput = document.getElementById("projectInput");
const activeInkName = document.getElementById("activeInkName");
const activeInkMeta = document.getElementById("activeInkMeta");
const controlsPopover = document.getElementById("controlsPopover");
const stageViewport = document.getElementById("stageViewport");
const canvasShell = document.getElementById("canvasShell");
const paintCanvas = document.getElementById("paintCanvas");
const fxCanvas = document.getElementById("fxCanvas");

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
    return {
      id: runtimeId,
      label: runtimePreset.label,
      note: runtimePreset.note,
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
  onUiChange: syncUi
});

const exportController = createExportController({
  canvas: canvasController,
  paintCanvas
});

function getState() {
  return canvasController.getState();
}

function hash01(value) {
  const sine = Math.sin(value * 127.1 + value * value * 0.037) * 43758.5453123;
  return sine - Math.floor(sine);
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function drawInkStripePreview(canvas, preset) {
  const width = Math.max(canvas.clientWidth, 148);
  const height = Math.max(canvas.clientHeight, 76);
  const dpr = Math.max(window.devicePixelRatio || 1, 1);
  const ctx = canvas.getContext("2d");
  const previewBrushSize = 30;
  const dotCount = Math.max(20, Math.min(38, Math.round(previewBrushSize * 0.96)));
  const scatter = (preset.sprayScatter || 18) * (0.26 + previewBrushSize * 0.018);
  const steps = 54;
  const seed = 27.35;
  const sparkles = [];

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;

  for (let index = 0; index < steps; index += 1) {
    const ratio = steps === 1 ? 0 : index / (steps - 1);
    const x = -12 + ratio * (width + 24);
    const y = height * 0.52 + Math.sin(ratio * Math.PI * 1.04 + seed * 0.01) * height * 0.045;
    const burstRadius = 8.8 + Math.sin(ratio * Math.PI) * 1.8;
    const burst = {
      x,
      y,
      radius: burstRadius,
      angle: Math.sin(ratio * Math.PI * 1.2) * 0.04,
      pressure: 0.94,
      travel: ratio * width * 0.62,
      progress: ratio * 6.2,
      seed,
      isSpray: true
    };

    for (let dot = 0; dot < dotCount; dot += 1) {
      const key = seed + index * 31.7 + dot * 9.1;
      const theta = hash01(key) * Math.PI * 2;
      const distance = Math.sqrt(hash01(key + 1.7)) * scatter;
      const stamp = {
        x: burst.x + Math.cos(theta) * distance,
        y: burst.y + Math.sin(theta) * distance,
        radius: burstRadius * lerp(0.16, 0.35, hash01(key + 2.4)),
        angle: burst.angle + (hash01(key + 3.9) - 0.5) * 0.6,
        pressure: burst.pressure,
        travel: burst.travel,
        progress: burst.progress + dot * 0.055,
        seed: burst.seed + dot * 0.01,
        isSpray: true
      };
      preset.renderStamp(ctx, stamp, 0);
    }

    if (index % 4 === 0) {
      sparkles.push(createSparkleNode(burst, preset, seed + index * 1.73));
    }
  }

  sparkles.slice(0, 10).forEach((node, index) => {
    preset.renderGlint(ctx, node, 1100 + index * 37);
  });
}

function redrawPickerPreviews() {
  inkPicker.querySelectorAll(".ink-option").forEach((button) => {
    const canvas = button.querySelector("canvas");
    const preset = inkById.get(button.dataset.inkId);
    if (canvas && preset) {
      drawInkStripePreview(canvas, preset);
    }
  });
}

function buildInkPicker() {
  const fragment = document.createDocumentFragment();

  inkEntries.forEach((entry) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ink-option";
    button.setAttribute("role", "listitem");
    button.dataset.inkId = entry.id;
    button.setAttribute("aria-label", entry.label);
    button.innerHTML = `
      <canvas class="ink-option__preview" width="148" height="76" aria-hidden="true"></canvas>
      <span class="ink-option__label">${entry.label}</span>
    `;
    button.addEventListener("click", () => canvasController.setActiveInk(entry.id));
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
    button.dataset.backgroundId = background.id;
    button.setAttribute("aria-label", background.label);
    if (background.color) {
      button.style.setProperty("--bg-color", background.color);
    }
    button.addEventListener("click", () => canvasController.setExportBackground(background.id));
    fragment.appendChild(button);
  });

  backgroundPicker.appendChild(fragment);
}

function updateInkButtons() {
  const state = getState();
  inkPicker.querySelectorAll(".ink-option").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.inkId === state.activeInkId);
  });
}

function updateInkReadout() {
  const state = getState();
  const entry = inkEntriesById.get(state.activeInkId);
  const preset = inkById.get(state.activeInkId);

  activeInkName.textContent = entry ? entry.label : preset?.label || "Ink";
  activeInkMeta.textContent = entry?.note || preset?.note || "";
}

function updateBackgroundButtons() {
  const state = getState();
  backgroundPicker.querySelectorAll(".background-chip").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.backgroundId === state.exportBackgroundId);
  });
}

function updateModeButtons() {
  const state = getState();
  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === state.mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function updateActionButtons() {
  const state = getState();
  const hasCommittedStrokes = state.strokes.length > 0;
  const hasAnything = hasCommittedStrokes || Boolean(state.activeStroke);
  const isExporting = Boolean(state.exportingKind);

  undoButton.disabled = !hasCommittedStrokes;
  clearButton.disabled = !hasAnything;
  shareButton.disabled = !hasAnything || isExporting;
  exportButton.disabled = !hasAnything || isExporting;
  gifButton.disabled = !hasAnything || isExporting;
}

function updateExportButtons() {
  const state = getState();
  const isSharingGif = state.exportingKind === "share-gif";
  const isPngExporting = state.exportingKind === "png";
  const isGifExporting = state.exportingKind === "gif";

  shareButton.classList.toggle("is-busy", isSharingGif);
  exportButton.classList.toggle("is-busy", isPngExporting);
  gifButton.classList.toggle("is-busy", isGifExporting);
  shareButton.textContent = isSharingGif ? "Sharing..." : exportLabels.share;
  exportButton.textContent = isPngExporting ? "PNG..." : exportLabels.png;
  gifButton.textContent = isGifExporting ? "GIF..." : exportLabels.gif;
}

function updateBrushSizeReadout() {
  const state = getState();
  brushSizeInput.value = String(state.brushSize);
  brushValue.textContent = `${state.brushSize} px`;
}

function syncUi() {
  updateBrushSizeReadout();
  updateInkButtons();
  updateInkReadout();
  updateBackgroundButtons();
  updateModeButtons();
  updateExportButtons();
  updateActionButtons();
}

function handleCanvasSizeSubmit(event) {
  event.preventDefault();
  canvasController.applySceneSize(Number(canvasWidthInput.value), Number(canvasHeightInput.value));
}

let previewResizeFrame = 0;

window.addEventListener("resize", () => {
  cancelAnimationFrame(previewResizeFrame);
  previewResizeFrame = requestAnimationFrame(redrawPickerPreviews);
});

document.addEventListener("click", (event) => {
  if (controlsPopover.open && !controlsPopover.contains(event.target)) {
    controlsPopover.open = false;
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    controlsPopover.open = false;
  }
});

brushSizeInput.addEventListener("input", (event) => {
  canvasController.setBrushSize(Number(event.target.value));
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    canvasController.setMode(button.dataset.mode);
  });
});

undoButton.addEventListener("click", () => canvasController.undoLastStroke());
clearButton.addEventListener("click", () => canvasController.clearAllStrokes());
saveButton.addEventListener("click", () => exportController.saveProject());
openButton.addEventListener("click", () => projectInput.click());
shareButton.addEventListener("click", () => exportController.shareGif());
exportButton.addEventListener("click", () => exportController.exportPng());
gifButton.addEventListener("click", () => exportController.exportGif());
canvasSizeForm.addEventListener("submit", handleCanvasSizeSubmit);
projectInput.addEventListener("change", (event) => exportController.openProjectFile(event));

buildInkPicker();
buildBackgroundPicker();
canvasController.setActiveInk(DEFAULT_INK_ID);
canvasController.setMode("spray");
canvasController.setExportBackground("transparent");
canvasController.initialize();
syncUi();
redrawPickerPreviews();
