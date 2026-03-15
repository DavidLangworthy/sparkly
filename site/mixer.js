import {
  TAU,
  clamp,
  lerp,
  hash01,
  parseHexColor,
  inkById,
  backgroundOptions,
  backgroundById,
  createSparkleNode
} from "./ink.js";
import {
  blendModeOptions,
  glintStyleOptions,
  normalizePaletteDefinition,
  normalizeInkDefinition,
  fromPaletteInk,
  generatePaletteSnippet,
  generateInkSnippet,
  generatePairSnippet,
  paletteSeedPresets,
  paletteSeedById,
  inkSeedPresets,
  inkSeedById
} from "./glitter-algebra.js";
import { upgradeLegacyRecipeToPaletteInk } from "./from-preset.js";
import { createCanvasController } from "./canvas.js";

const DESIGNER_PREVIEW_ID = "designer-preview";
const WORKSPACE_STORAGE_KEY = "sparkly.mixer.workspace.v2";
const LEGACY_STORAGE_KEY = "sparkly.mixer.draft.v1";
const LOOP_DURATION = 1800;

const PALETTE_CONTROL_DEFS = [
  {
    path: "finish.sheenSpeed",
    label: "Flash Speed",
    caption: "The speed of the sparkle flicker loop.",
    min: 0.4,
    max: 2,
    step: 0.01
  },
  {
    path: "bodyProfile.stretch",
    label: "Foil Stretch",
    caption: "How wide the body stretches across the stroke.",
    min: 0.7,
    max: 1.5,
    step: 0.01
  },
  {
    path: "bodyProfile.squeeze",
    label: "Body Squeeze",
    caption: "How narrow the pigment compresses vertically.",
    min: 0.6,
    max: 1.1,
    step: 0.01
  },
  {
    path: "bodyProfile.sprayScatter",
    label: "Spray Scatter",
    caption: "How far spray particles fling outward.",
    min: 6,
    max: 32,
    step: 1
  },
  {
    path: "bodyProfile.pigmentAlpha",
    label: "Body Opacity",
    caption: "The weight of the pigment body.",
    min: 0,
    max: 1,
    step: 0.01
  },
  {
    path: "bodyProfile.highlightAlpha",
    label: "Top Shine",
    caption: "The soft highlight streak through the body.",
    min: 0,
    max: 1,
    step: 0.01
  },
  {
    path: "bodyProfile.edgeAlpha",
    label: "Edge Shine",
    caption: "The thin edge light that trims the pigment.",
    min: 0,
    max: 1,
    step: 0.01
  },
  {
    path: "sparkleProfile.density",
    label: "Sparkle Crowd",
    caption: "How often sparkles get emitted along the stroke.",
    min: 0,
    max: 0.14,
    step: 0.001
  },
  {
    path: "sparkleProfile.sizeMin",
    label: "Sparkle Size Min",
    caption: "The smallest glint size.",
    min: 0.4,
    max: 8,
    step: 0.1
  },
  {
    path: "sparkleProfile.sizeMax",
    label: "Sparkle Size Max",
    caption: "The largest glint size.",
    min: 0.8,
    max: 10,
    step: 0.1
  },
  {
    path: "sparkleProfile.driftMin",
    label: "Drift Min",
    caption: "The gentlest sparkle travel.",
    min: 0,
    max: 2,
    step: 0.01
  },
  {
    path: "sparkleProfile.driftMax",
    label: "Drift Max",
    caption: "The boldest sparkle travel.",
    min: 0,
    max: 2,
    step: 0.01
  }
];

const PALETTE_ADVANCED_CONTROL_DEFS = [
  { path: "bodyMotion.sinProgressFreq", label: "Wave A Progress Freq", caption: "How fast the first body wave changes along a stroke.", min: 0, max: 12, step: 0.01 },
  { path: "bodyMotion.sinSeedFreq", label: "Wave A Seed Freq", caption: "How much the first body wave reacts to per-stroke seed.", min: 0, max: 12, step: 0.01 },
  { path: "bodyMotion.sinAmplitude", label: "Wave A Width", caption: "How far the first body wave swings in hue.", min: 0, max: 120, step: 1 },
  { path: "bodyMotion.cosProgressFreq", label: "Wave B Progress Freq", caption: "How fast the second body wave changes along a stroke.", min: 0, max: 12, step: 0.01 },
  { path: "bodyMotion.cosSeedFreq", label: "Wave B Seed Freq", caption: "How much the second body wave reacts to per-stroke seed.", min: 0, max: 12, step: 0.01 },
  { path: "bodyMotion.cosAmplitude", label: "Wave B Width", caption: "How far the second body wave swings in hue.", min: 0, max: 120, step: 1 },
  { path: "shineMotion.progressFreq", label: "Shine Progress Freq", caption: "How fast shine changes along the stroke.", min: 0, max: 12, step: 0.01 },
  { path: "shineMotion.seedFreq", label: "Shine Seed Freq", caption: "How much shine reacts to per-stroke seed.", min: 0, max: 12, step: 0.01 },
  { path: "shineMotion.amplitude", label: "Shine Hue Swing", caption: "Hue travel of the shine layer.", min: 0, max: 120, step: 1 },
  { path: "rimMotion.progressFreq", label: "Rim Progress Freq", caption: "How fast the rim changes along the stroke.", min: 0, max: 12, step: 0.01 },
  { path: "rimMotion.seedFreq", label: "Rim Seed Freq", caption: "How much the rim reacts to per-stroke seed.", min: 0, max: 12, step: 0.01 },
  { path: "rimMotion.amplitude", label: "Rim Hue Swing", caption: "Hue travel of the rim light.", min: 0, max: 120, step: 1 },
  { path: "sparkleProfile.hueRange", label: "Sparkle Hue Range", caption: "How wide sparkle hue offsets can spread.", min: 0, max: 360, step: 1 },
  { path: "sparkleProfile.brightnessMin", label: "Brightness Min", caption: "The dimmest sparkle brightness.", min: 0.1, max: 2, step: 0.01 },
  { path: "sparkleProfile.brightnessMax", label: "Brightness Max", caption: "The brightest sparkle brightness.", min: 0.1, max: 2, step: 0.01 },
  { path: "sparkleProfile.hotspotChance", label: "Hotspot Chance", caption: "How often a sparkle gets an extra brightness boost.", min: 0, max: 0.4, step: 0.01 },
  { path: "sparkleProfile.hotspotBoost", label: "Hotspot Boost", caption: "The multiplier for hotspot sparkles.", min: 1, max: 2.2, step: 0.01 },
  { path: "sparkleMotion.hueOffsetScale", label: "Hue Offset Scale", caption: "How much each sparkle reacts to its hue offset.", min: 0, max: 2, step: 0.01 },
  { path: "sparkleMotion.timeSinSpeed", label: "Sin Speed", caption: "How fast the first sparkle hue swing animates.", min: 0, max: 0.01, step: 0.0001 },
  { path: "sparkleMotion.timeSinAmplitude", label: "Sin Swing", caption: "The first time-based hue swing in the sparkles.", min: 0, max: 120, step: 1 },
  { path: "sparkleMotion.timeCosSpeed", label: "Cos Speed", caption: "How fast the second sparkle hue swing animates.", min: 0, max: 0.01, step: 0.0001 },
  { path: "sparkleMotion.timeCosAmplitude", label: "Cos Swing", caption: "The second time-based hue swing in the sparkles.", min: 0, max: 120, step: 1 }
];

const INK_CONTROL_DEFS = [
  {
    path: "body.hueBase",
    label: "Body Hue Base",
    caption: "The main color center for the pigment body.",
    min: 0,
    max: 360,
    step: 1
  }
];

const INK_ADVANCED_CONTROL_DEFS = [
  { path: "shine.hueBase", label: "Shine Hue Base", caption: "Base hue for the top sheen.", min: 0, max: 360, step: 1 },
  { path: "shine.saturation", label: "Shine Saturation", caption: "Color intensity of the shine layer.", min: 0, max: 100, step: 1 },
  { path: "shine.lightness", label: "Shine Lightness", caption: "Brightness of the shine layer.", min: 0, max: 100, step: 1 },
  { path: "shine.alpha", label: "Shine Alpha", caption: "Opacity of the shine layer.", min: 0, max: 1, step: 0.01 },
  { path: "rim.hueBase", label: "Rim Hue Base", caption: "Base hue for the edge light.", min: 0, max: 360, step: 1 },
  { path: "rim.saturation", label: "Rim Saturation", caption: "Color intensity of the rim light.", min: 0, max: 100, step: 1 },
  { path: "rim.lightness", label: "Rim Lightness", caption: "Brightness of the rim light.", min: 0, max: 100, step: 1 },
  { path: "rim.alpha", label: "Rim Alpha", caption: "Opacity of the rim light.", min: 0, max: 1, step: 0.01 },
  { path: "sparkle.hueBase", label: "Sparkle Hue Base", caption: "The center color for glints before motion kicks in.", min: 0, max: 360, step: 1 },
  { path: "sparkle.saturationBase", label: "Sparkle Saturation", caption: "How intense the sparkle colors read overall.", min: 0, max: 100, step: 1 },
  { path: "sparkle.saturationAmplitude", label: "Saturation Swing", caption: "How much sparkle saturation pulses.", min: 0, max: 100, step: 1 },
  { path: "sparkle.lightnessBase", label: "Sparkle Lightness", caption: "How bright the sparkles feel at rest.", min: 0, max: 100, step: 1 },
  { path: "sparkle.lightnessAmplitude", label: "Lightness Swing", caption: "How much sparkle brightness pulses.", min: 0, max: 100, step: 1 },
  { path: "sparkle.alpha", label: "Sparkle Alpha", caption: "The overall opacity of glints.", min: 0, max: 1, step: 0.01 }
];

const dom = {
  paletteSelect: document.getElementById("paletteSelect"),
  inkSelect: document.getElementById("inkSelect"),
  inkSelectHint: document.getElementById("inkSelectHint"),
  backgroundPicker: document.getElementById("backgroundPicker"),
  resetPaletteButton: document.getElementById("resetPaletteButton"),
  resetInkButton: document.getElementById("resetInkButton"),
  copyPaletteCodeButton: document.getElementById("copyPaletteCodeButton"),
  copyInkCodeButton: document.getElementById("copyInkCodeButton"),
  copyPairJsonButton: document.getElementById("copyPairJsonButton"),
  paletteScopeText: document.getElementById("paletteScopeText"),
  paletteControls: document.getElementById("paletteControls"),
  paletteBlendModeButtons: document.getElementById("paletteBlendModeButtons"),
  paletteGlintStyleButtons: document.getElementById("paletteGlintStyleButtons"),
  inkLabel: document.getElementById("inkLabel"),
  inkId: document.getElementById("inkId"),
  inkNote: document.getElementById("inkNote"),
  inkControls: document.getElementById("inkControls"),
  paletteGrid: document.getElementById("paletteGrid"),
  sparkleColorGrid: document.getElementById("sparkleColorGrid"),
  paletteAdvancedControls: document.getElementById("paletteAdvancedControls"),
  inkAdvancedControls: document.getElementById("inkAdvancedControls"),
  shadowColorInput: document.getElementById("shadowColorInput"),
  layerModeButtons: document.getElementById("layerModeButtons"),
  playPauseButton: document.getElementById("playPauseButton"),
  timeScrubber: document.getElementById("timeScrubber"),
  timeInput: document.getElementById("timeInput"),
  timeReadout: document.getElementById("timeReadout"),
  sampleCanvas: document.getElementById("sampleCanvas"),
  stampCanvas: document.getElementById("stampCanvas"),
  sprayCanvas: document.getElementById("sprayCanvas"),
  glintCanvas: document.getElementById("glintCanvas"),
  sparkleStripCanvas: document.getElementById("sparkleStripCanvas"),
  sandboxModeButtons: document.getElementById("sandboxModeButtons"),
  sandboxClearButton: document.getElementById("sandboxClearButton"),
  sandboxBrushSize: document.getElementById("sandboxBrushSize"),
  sandboxBrushInput: document.getElementById("sandboxBrushInput"),
  sandboxBrushValue: document.getElementById("sandboxBrushValue"),
  sandboxStageViewport: document.getElementById("sandboxStageViewport"),
  sandboxCanvasShell: document.getElementById("sandboxCanvasShell"),
  sandboxPaintCanvas: document.getElementById("sandboxPaintCanvas"),
  sandboxFxCanvas: document.getElementById("sandboxFxCanvas"),
  sandboxCanvasWidthInput: document.getElementById("sandboxCanvasWidthInput"),
  sandboxCanvasHeightInput: document.getElementById("sandboxCanvasHeightInput"),
  paletteCodeOutput: document.getElementById("paletteCodeOutput"),
  copyPaletteCodeButtonSecondary: document.getElementById("copyPaletteCodeButtonSecondary"),
  inkCodeOutput: document.getElementById("inkCodeOutput"),
  copyInkCodeButtonSecondary: document.getElementById("copyInkCodeButtonSecondary"),
  pairJsonOutput: document.getElementById("pairJsonOutput"),
  applyPairJsonButton: document.getElementById("applyPairJsonButton"),
  downloadPairButton: document.getElementById("downloadPairButton"),
  importPairButton: document.getElementById("importPairButton"),
  copyPairJsonButtonSecondary: document.getElementById("copyPairJsonButtonSecondary"),
  pairImportInput: document.getElementById("pairImportInput"),
  statusText: document.getElementById("statusText")
};

const numericBindings = [];
const paletteBindings = [];
const sparkleColorBindings = [];

let sandboxController = null;
let persistTimer = 0;
let statusTimer = 0;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function slugifyId(value) {
  const normalized = typeof value === "string"
    ? value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    : "";
  return normalized || "custom-ink";
}

function ensureUniqueId(baseId, existingIds, currentId = null) {
  if (!existingIds.has(baseId) || baseId === currentId) {
    return baseId;
  }

  let index = 2;
  let candidate = `${baseId}-${index}`;
  while (existingIds.has(candidate) && candidate !== currentId) {
    index += 1;
    candidate = `${baseId}-${index}`;
  }
  return candidate;
}

function getPathValue(object, path) {
  return path.split(".").reduce((current, part) => current?.[part], object);
}

function setPathValue(object, path, value) {
  const parts = path.split(".");
  let current = object;
  for (let index = 0; index < parts.length - 1; index += 1) {
    current = current[parts[index]];
  }
  current[parts[parts.length - 1]] = value;
}

function parseCssColor(value) {
  const hex = parseHexColor(value);
  if (hex) {
    return hex;
  }

  if (typeof value !== "string") {
    return null;
  }

  const match = value.trim().match(/^rgba?\((.+)\)$/i);
  if (!match) {
    return null;
  }

  const numbers = match[1].split(",").map((part) => Number.parseFloat(part.trim()));
  if (numbers.length < 3 || numbers.some((number) => !Number.isFinite(number))) {
    return null;
  }

  return numbers.slice(0, 3).map((number) => clamp(Math.round(number), 0, 255));
}

function rgbToHex(red, green, blue) {
  return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function colorToHex(value, fallback = "#ffffff") {
  const rgb = parseCssColor(value);
  return rgb ? rgbToHex(rgb[0], rgb[1], rgb[2]) : fallback;
}

function rgbToHsl(red, green, blue) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: lightness * 100 };
  }

  const delta = max - min;
  const saturation = lightness > 0.5
    ? delta / (2 - max - min)
    : delta / (max + min);

  let hue = 0;
  switch (max) {
    case r:
      hue = (g - b) / delta + (g < b ? 6 : 0);
      break;
    case g:
      hue = (b - r) / delta + 2;
      break;
    default:
      hue = (r - g) / delta + 4;
      break;
  }

  return {
    h: hue * 60,
    s: saturation * 100,
    l: lightness * 100
  };
}

function hslToRgb(hue, saturation, lightness) {
  const h = ((hue % 360) + 360) % 360 / 360;
  const s = clamp(saturation, 0, 100) / 100;
  const l = clamp(lightness, 0, 100) / 100;

  if (s === 0) {
    const channel = Math.round(l * 255);
    return [channel, channel, channel];
  }

  const hueToRgb = (p, q, t) => {
    let value = t;
    if (value < 0) {
      value += 1;
    }
    if (value > 1) {
      value -= 1;
    }
    if (value < 1 / 6) {
      return p + (q - p) * 6 * value;
    }
    if (value < 1 / 2) {
      return q;
    }
    if (value < 2 / 3) {
      return p + (q - p) * (2 / 3 - value) * 6;
    }
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return [
    Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
    Math.round(hueToRgb(p, q, h) * 255),
    Math.round(hueToRgb(p, q, h - 1 / 3) * 255)
  ];
}

function hueShiftFromAbsolute(targetHue, hueBase) {
  return ((((targetHue - hueBase) % 360) + 540) % 360) - 180;
}

function formatNumber(value) {
  const rounded = Math.round(value * 1000) / 1000;
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }
  return String(rounded).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

function formatControlValue(value, definition) {
  const suffix = definition.suffix || "";
  return `${formatNumber(value)}${suffix}`;
}

function resizeCanvasToBox(canvas) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const dpr = Math.max(window.devicePixelRatio || 1, 1);
  const targetWidth = Math.max(1, Math.round(width * dpr));
  const targetHeight = Math.max(1, Math.round(height * dpr));
  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.imageSmoothingEnabled = true;
  return { ctx, width, height };
}

function drawTransparentBackground(ctx, width, height) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  const cell = 18;
  for (let y = 0; y < height; y += cell) {
    for (let x = 0; x < width; x += cell) {
      if (((x / cell) + (y / cell)) % 2 === 0) {
        ctx.fillStyle = "rgba(116, 92, 66, 0.14)";
        ctx.fillRect(x, y, cell, cell);
      }
    }
  }
}

function drawPreviewBackground(ctx, width, height, background) {
  if (background?.color) {
    ctx.fillStyle = background.color;
    ctx.fillRect(0, 0, width, height);
  } else {
    drawTransparentBackground(ctx, width, height);
  }

  ctx.save();
  const glow = ctx.createRadialGradient(width * 0.22, height * 0.12, 0, width * 0.22, height * 0.12, width * 0.4);
  glow.addColorStop(0, "rgba(255,255,255,0.35)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function createDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function setStatus(message, tone = "info", sticky = false) {
  dom.statusText.textContent = message;
  dom.statusText.classList.toggle("is-error", tone === "error");
  window.clearTimeout(statusTimer);

  if (!sticky && message) {
    statusTimer = window.setTimeout(() => {
      dom.statusText.textContent = "";
      dom.statusText.classList.remove("is-error");
    }, 3200);
  }
}

function createSeedWorkspace() {
  const paletteOrder = paletteSeedPresets.map((palette) => palette.meta.id);
  const paletteInkOrder = {};
  const palettes = {};
  const inks = {};

  paletteSeedPresets.forEach((palette) => {
    palettes[palette.meta.id] = clone(palette);
    paletteInkOrder[palette.meta.id] = [];
  });

  inkSeedPresets.forEach((ink) => {
    inks[ink.meta.id] = clone(ink);
    const collection = paletteInkOrder[ink.meta.paletteId] || [];
    collection.push(ink.meta.id);
    paletteInkOrder[ink.meta.paletteId] = collection;
  });

  return {
    schemaVersion: 2,
    selectedPaletteId: "rainbowChrome",
    selectedInkId: "chrome",
    paletteOrder,
    paletteInkOrder,
    palettes,
    inks,
    backgroundId: "paper",
    layerMode: "combined",
    isPlaying: true,
    scrubMs: 900,
    idTouched: {
      palettes: {},
      inks: {}
    }
  };
}

function getWorkspaceInkIds(workspace, paletteId) {
  const ordered = Array.isArray(workspace.paletteInkOrder?.[paletteId])
    ? workspace.paletteInkOrder[paletteId]
    : [];
  const seen = new Set();
  const result = [];

  ordered.forEach((inkId) => {
    const ink = workspace.inks[inkId];
    if (ink && ink.meta.paletteId === paletteId && !seen.has(inkId)) {
      seen.add(inkId);
      result.push(inkId);
    }
  });

  Object.values(workspace.inks).forEach((ink) => {
    if (ink.meta.paletteId === paletteId && !seen.has(ink.meta.id)) {
      seen.add(ink.meta.id);
      result.push(ink.meta.id);
    }
  });

  return result;
}

function normalizeWorkspaceState(raw) {
  const workspace = createSeedWorkspace();
  const source = raw && typeof raw === "object" ? raw : {};
  const rawPalettes = source.palettes && typeof source.palettes === "object" ? source.palettes : {};
  const rawInks = source.inks && typeof source.inks === "object" ? source.inks : {};

  Object.values(rawPalettes).forEach((palette) => {
    const normalized = normalizePaletteDefinition(palette);
    workspace.palettes[normalized.meta.id] = normalized;
    if (!workspace.paletteOrder.includes(normalized.meta.id)) {
      workspace.paletteOrder.push(normalized.meta.id);
    }
    workspace.paletteInkOrder[normalized.meta.id] = workspace.paletteInkOrder[normalized.meta.id] || [];
  });

  Object.values(rawInks).forEach((ink) => {
    const normalized = normalizeInkDefinition(ink);
    workspace.inks[normalized.meta.id] = normalized;
    if (!workspace.palettes[normalized.meta.paletteId]) {
      workspace.palettes[normalized.meta.paletteId] = normalizePaletteDefinition({
        meta: {
          id: normalized.meta.paletteId,
          label: normalized.meta.paletteId,
          note: "Recovered custom palette."
        }
      });
      workspace.paletteOrder.push(normalized.meta.paletteId);
    }
    workspace.paletteInkOrder[normalized.meta.paletteId] = workspace.paletteInkOrder[normalized.meta.paletteId] || [];
  });

  if (Array.isArray(source.paletteOrder)) {
    const seen = new Set();
    workspace.paletteOrder = source.paletteOrder.filter((paletteId) => {
      if (!workspace.palettes[paletteId] || seen.has(paletteId)) {
        return false;
      }
      seen.add(paletteId);
      return true;
    });

    Object.keys(workspace.palettes).forEach((paletteId) => {
      if (!seen.has(paletteId)) {
        workspace.paletteOrder.push(paletteId);
      }
    });
  }

  const savedPaletteInkOrder = source.paletteInkOrder && typeof source.paletteInkOrder === "object"
    ? source.paletteInkOrder
    : {};
  workspace.paletteOrder.forEach((paletteId) => {
    const ordered = Array.isArray(savedPaletteInkOrder[paletteId]) ? savedPaletteInkOrder[paletteId] : [];
    const seen = new Set();
    const result = [];

    ordered.forEach((inkId) => {
      const ink = workspace.inks[inkId];
      if (ink && ink.meta.paletteId === paletteId && !seen.has(inkId)) {
        seen.add(inkId);
        result.push(inkId);
      }
    });

    Object.values(workspace.inks).forEach((ink) => {
      if (ink.meta.paletteId === paletteId && !seen.has(ink.meta.id)) {
        seen.add(ink.meta.id);
        result.push(ink.meta.id);
      }
    });

    workspace.paletteInkOrder[paletteId] = result;
  });

  workspace.selectedPaletteId = workspace.palettes[source.selectedPaletteId]
    ? source.selectedPaletteId
    : workspace.paletteOrder[0];

  const selectedInkCandidates = getWorkspaceInkIds(workspace, workspace.selectedPaletteId);
  workspace.selectedInkId = selectedInkCandidates.includes(source.selectedInkId)
    ? source.selectedInkId
    : selectedInkCandidates[0];

  workspace.backgroundId = backgroundById.has(source.backgroundId) ? source.backgroundId : "paper";
  workspace.layerMode = source.layerMode === "pigment" || source.layerMode === "sparkles" ? source.layerMode : "combined";
  workspace.isPlaying = typeof source.isPlaying === "boolean" ? source.isPlaying : true;
  workspace.scrubMs = clamp(Number.parseFloat(source.scrubMs) || 900, 0, LOOP_DURATION);
  workspace.idTouched = {
    palettes: source.idTouched?.palettes && typeof source.idTouched.palettes === "object" ? source.idTouched.palettes : {},
    inks: source.idTouched?.inks && typeof source.idTouched.inks === "object" ? source.idTouched.inks : {}
  };

  return workspace;
}

function addPairToWorkspace(target, pair, { select = true } = {}) {
  const palette = normalizePaletteDefinition(pair.palette);
  const ink = normalizeInkDefinition({
    ...pair.ink,
    meta: {
      ...(pair.ink?.meta || {}),
      paletteId: palette.meta.id
    }
  });

  target.palettes[palette.meta.id] = palette;
  target.inks[ink.meta.id] = ink;

  if (!target.paletteOrder.includes(palette.meta.id)) {
    target.paletteOrder.push(palette.meta.id);
  }

  const order = target.paletteInkOrder[palette.meta.id] || [];
  if (!order.includes(ink.meta.id)) {
    order.push(ink.meta.id);
  }
  target.paletteInkOrder[palette.meta.id] = order;

  if (select) {
    target.selectedPaletteId = palette.meta.id;
    target.selectedInkId = ink.meta.id;
  }
}

function makeCustomPair(pair, workspace) {
  const paletteId = ensureUniqueId(
    `custom-${slugifyId(pair.palette.meta.id || "palette")}`,
    new Set(Object.keys(workspace.palettes))
  );
  const inkId = ensureUniqueId(
    `custom-${slugifyId(pair.ink.meta.id || "ink")}`,
    new Set(Object.keys(workspace.inks))
  );

  return {
    palette: normalizePaletteDefinition({
      ...pair.palette,
      meta: {
        ...(pair.palette.meta || {}),
        id: paletteId,
        label: pair.palette.meta?.label || "Custom Palette"
      }
    }),
    ink: normalizeInkDefinition({
      ...pair.ink,
      meta: {
        ...(pair.ink.meta || {}),
        id: inkId,
        paletteId,
        label: pair.ink.meta?.label || "Custom Ink"
      }
    })
  };
}

function loadWorkspaceState() {
  try {
    const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (raw) {
      return normalizeWorkspaceState(JSON.parse(raw));
    }
  } catch {
    // Ignore broken saved workspace and fall through to migration/default.
  }

  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const sourceRecipe = parsed.recipe || parsed.seedRecipe;
      if (sourceRecipe) {
        const workspace = createSeedWorkspace();
        const customPair = makeCustomPair(upgradeLegacyRecipeToPaletteInk(sourceRecipe), workspace);
        addPairToWorkspace(workspace, customPair, { select: true });
        workspace.backgroundId = backgroundById.has(parsed.backgroundId) ? parsed.backgroundId : "paper";
        workspace.idTouched.inks[customPair.ink.meta.id] = Boolean(parsed.idTouched);
        return workspace;
      }
    }
  } catch {
    // Ignore broken legacy draft and fall through to default.
  }

  return createSeedWorkspace();
}

const state = {
  ...loadWorkspaceState(),
  previewPreset: null,
  playOrigin: performance.now()
};
state.playOrigin -= state.scrubMs;

function getCurrentPalette() {
  return state.palettes[state.selectedPaletteId];
}

function getCurrentInk() {
  return state.inks[state.selectedInkId];
}

function getInkIdsForCurrentPalette() {
  return getWorkspaceInkIds(state, state.selectedPaletteId);
}

function compilePreviewPreset() {
  state.previewPreset = fromPaletteInk({
    palette: getCurrentPalette(),
    ink: getCurrentInk()
  });
  inkById.set(DESIGNER_PREVIEW_ID, state.previewPreset);
}

function persistWorkspace() {
  window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify({
        schemaVersion: 2,
        selectedPaletteId: state.selectedPaletteId,
        selectedInkId: state.selectedInkId,
        paletteOrder: state.paletteOrder,
        paletteInkOrder: state.paletteInkOrder,
        palettes: state.palettes,
        inks: state.inks,
        backgroundId: state.backgroundId,
        layerMode: state.layerMode,
        isPlaying: state.isPlaying,
        scrubMs: state.scrubMs,
        idTouched: state.idTouched
      }));
    } catch {
      setStatus("Could not save the local mixer workspace.", "error");
    }
  }, 150);
}

function getCurrentBackground() {
  return backgroundById.get(state.backgroundId) || backgroundById.get("paper");
}

function refreshWorkspace({ persist = false, rerender = true } = {}) {
  compilePreviewPreset();

  if (sandboxController) {
    inkById.set(DESIGNER_PREVIEW_ID, state.previewPreset);
    if (rerender) {
      sandboxController.rerender();
    }
  }

  syncUi();

  if (persist) {
    persistWorkspace();
  }
}

function selectPalette(paletteId, { persist = true } = {}) {
  if (!state.palettes[paletteId]) {
    return;
  }

  state.selectedPaletteId = paletteId;
  const inkIds = getWorkspaceInkIds(state, paletteId);
  if (!inkIds.includes(state.selectedInkId)) {
    state.selectedInkId = inkIds[0];
  }
  refreshWorkspace({ persist, rerender: true });
}

function selectInk(inkId, { persist = true } = {}) {
  const inkIds = getInkIdsForCurrentPalette();
  if (!inkIds.includes(inkId)) {
    return;
  }

  state.selectedInkId = inkId;
  refreshWorkspace({ persist, rerender: true });
}

function applyCurrentPalette(nextPalette, { persist = false } = {}) {
  state.palettes[state.selectedPaletteId] = normalizePaletteDefinition({
    ...nextPalette,
    meta: {
      ...(nextPalette.meta || {}),
      id: state.selectedPaletteId
    }
  });
  refreshWorkspace({ persist });
}

function applyCurrentInk(nextInk, { persist = false, previousId = state.selectedInkId } = {}) {
  const currentPaletteId = state.selectedPaletteId;
  const normalized = normalizeInkDefinition({
    ...nextInk,
    meta: {
      ...(nextInk.meta || {}),
      paletteId: currentPaletteId
    }
  });

  const nextId = ensureUniqueId(normalized.meta.id, new Set(Object.keys(state.inks)), previousId);
  normalized.meta.id = nextId;

  state.inks[nextId] = normalized;
  if (previousId !== nextId) {
    delete state.inks[previousId];
  }

  const order = [...(state.paletteInkOrder[currentPaletteId] || [])];
  const existingIndex = order.indexOf(previousId);
  if (existingIndex >= 0) {
    order[existingIndex] = nextId;
  } else if (!order.includes(nextId)) {
    order.push(nextId);
  }
  state.paletteInkOrder[currentPaletteId] = Array.from(new Set(order));

  if (previousId !== nextId) {
    if (state.idTouched.inks[previousId]) {
      state.idTouched.inks[nextId] = state.idTouched.inks[previousId];
    }
    delete state.idTouched.inks[previousId];
  }

  state.selectedInkId = nextId;
  refreshWorkspace({ persist });
}

function updatePaletteField(path, value) {
  const draft = clone(getCurrentPalette());
  setPathValue(draft, path, value);
  applyCurrentPalette(draft, { persist: true });
}

function updateInkField(path, value) {
  const currentInkId = state.selectedInkId;
  const draft = clone(getCurrentInk());
  setPathValue(draft, path, value);

  if (path === "meta.label" && !state.idTouched.inks[currentInkId]) {
    draft.meta.id = slugifyId(draft.meta.label);
  }
  if (path === "meta.id") {
    state.idTouched.inks[currentInkId] = true;
    draft.meta.id = slugifyId(draft.meta.id);
  }

  applyCurrentInk(draft, { persist: true, previousId: currentInkId });
}

function loadPairBundle(bundle, statusMessage, { persist = true, forceCustom = false } = {}) {
  let pair = null;

  if (bundle && typeof bundle === "object" && bundle.schemaVersion === 2 && bundle.palette && bundle.ink) {
    pair = {
      palette: normalizePaletteDefinition(bundle.palette),
      ink: normalizeInkDefinition(bundle.ink)
    };
  } else {
    pair = upgradeLegacyRecipeToPaletteInk(bundle);
    forceCustom = true;
  }

  if (forceCustom) {
    pair = makeCustomPair(pair, state);
  }

  addPairToWorkspace(state, pair, { select: true });
  state.idTouched.inks[state.selectedInkId] = Boolean(forceCustom);
  refreshWorkspace({ persist });
  setStatus(statusMessage);
}

function createNumericControl(container, scope, definition) {
  const wrapper = document.createElement("div");
  wrapper.className = "slider-control";

  const head = document.createElement("div");
  head.className = "slider-head";

  const title = document.createElement("div");
  title.className = "slider-title";
  title.textContent = definition.label;

  const readout = document.createElement("div");
  readout.className = "slider-caption";

  head.append(title, readout);

  const caption = document.createElement("div");
  caption.className = "slider-caption";
  caption.textContent = definition.caption;

  const inputs = document.createElement("div");
  inputs.className = "slider-inputs";

  const range = document.createElement("input");
  range.type = "range";
  range.min = String(definition.min);
  range.max = String(definition.max);
  range.step = String(definition.step);

  const number = document.createElement("input");
  number.type = "number";
  number.min = String(definition.min);
  number.max = String(definition.max);
  number.step = String(definition.step);

  const applyValue = (nextValue) => {
    const numeric = Number.parseFloat(nextValue);
    if (!Number.isFinite(numeric)) {
      return;
    }

    if (scope === "palette") {
      updatePaletteField(definition.path, numeric);
    } else {
      updateInkField(definition.path, numeric);
    }
  };

  range.addEventListener("input", (event) => applyValue(event.target.value));
  number.addEventListener("input", (event) => applyValue(event.target.value));

  inputs.append(range, number);
  wrapper.append(head, caption, inputs);
  container.appendChild(wrapper);

  numericBindings.push({ scope, definition, range, number, readout });
}

function buildNumericControls(container, scope, definitions) {
  definitions.forEach((definition) => createNumericControl(container, scope, definition));
}

function buildPaletteCards() {
  for (let index = 0; index < 4; index += 1) {
    const card = document.createElement("article");
    card.className = "palette-card";

    const top = document.createElement("div");
    top.className = "palette-card__top";

    const title = document.createElement("div");
    title.innerHTML = `<strong>Stop ${index + 1}</strong><div class="slider-caption">A palette stop in the body gradient.</div>`;

    const swatch = document.createElement("div");
    swatch.className = "palette-swatch";

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.setAttribute("aria-label", `Palette stop ${index + 1} color`);

    swatch.appendChild(colorInput);
    top.append(title, swatch);

    const controls = document.createElement("div");
    controls.className = "palette-mini";

    const stopDefinitions = [
      { path: `body.paletteStops.${index}.hueShift`, label: "Hue Shift", min: -180, max: 180, step: 1 },
      { path: `body.paletteStops.${index}.saturation`, label: "Saturation", min: 0, max: 100, step: 1 },
      { path: `body.paletteStops.${index}.lightness`, label: "Lightness", min: 0, max: 100, step: 1 },
      { path: `body.paletteStops.${index}.alpha`, label: "Alpha", min: 0, max: 1, step: 0.01 }
    ];

    stopDefinitions.forEach((definition) => {
      const miniGroup = document.createElement("div");
      miniGroup.className = "slider-control";
      const miniHead = document.createElement("div");
      miniHead.className = "slider-head";
      const miniTitle = document.createElement("div");
      miniTitle.className = "slider-title";
      miniTitle.textContent = definition.label;
      const miniReadout = document.createElement("div");
      miniReadout.className = "slider-caption";
      miniHead.append(miniTitle, miniReadout);

      const miniInputs = document.createElement("div");
      miniInputs.className = "slider-inputs";

      const range = document.createElement("input");
      range.type = "range";
      range.min = String(definition.min);
      range.max = String(definition.max);
      range.step = String(definition.step);

      const number = document.createElement("input");
      number.type = "number";
      number.min = String(definition.min);
      number.max = String(definition.max);
      number.step = String(definition.step);

      const applyValue = (nextValue) => {
        const numeric = Number.parseFloat(nextValue);
        if (!Number.isFinite(numeric)) {
          return;
        }
        updateInkField(definition.path, numeric);
      };

      range.addEventListener("input", (event) => applyValue(event.target.value));
      number.addEventListener("input", (event) => applyValue(event.target.value));

      miniInputs.append(range, number);
      miniGroup.append(miniHead, miniInputs);
      controls.appendChild(miniGroup);
      numericBindings.push({ scope: "ink", definition, range, number, readout: miniReadout });
    });

    colorInput.addEventListener("input", (event) => {
      const rgb = parseHexColor(event.target.value);
      if (!rgb) {
        return;
      }

      const draft = clone(getCurrentInk());
      const stop = draft.body.paletteStops[index];
      const converted = rgbToHsl(rgb[0], rgb[1], rgb[2]);
      stop.hueShift = hueShiftFromAbsolute(converted.h, draft.body.hueBase);
      stop.saturation = converted.s;
      stop.lightness = converted.l;
      applyCurrentInk(draft, { persist: true });
    });

    card.append(top, controls);
    dom.paletteGrid.appendChild(card);
    paletteBindings.push({ index, colorInput });
  }
}

function buildSparkleColorCards() {
  for (let index = 0; index < 4; index += 1) {
    const card = document.createElement("article");
    card.className = "sparkle-color-card";

    const top = document.createElement("div");
    top.className = "sparkle-color-card__top";

    const title = document.createElement("div");
    title.innerHTML = `<strong>Flash ${index + 1}</strong><div class="slider-caption">A color available to the glitter layer.</div>`;

    const enabled = document.createElement("input");
    enabled.type = "checkbox";
    enabled.setAttribute("aria-label", `Enable sparkle color ${index + 1}`);

    top.append(title, enabled);

    const body = document.createElement("div");
    body.className = "sparkle-swatch";

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.setAttribute("aria-label", `Sparkle color ${index + 1}`);

    const mini = document.createElement("div");
    mini.className = "sparkle-mini";

    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.spellcheck = false;

    mini.append(textInput);
    body.append(colorInput, mini);

    enabled.addEventListener("change", () => {
      const draft = clone(getCurrentInk());
      const colors = [...draft.sparkle.baseColors];
      if (enabled.checked) {
        while (colors.length <= index) {
          colors.push(colors[colors.length - 1] || "#ffffff");
        }
      } else if (colors.length > 1 && index < colors.length) {
        colors.splice(index, 1);
      }
      draft.sparkle.baseColors = colors;
      applyCurrentInk(draft, { persist: true });
    });

    colorInput.addEventListener("input", (event) => {
      const draft = clone(getCurrentInk());
      while (draft.sparkle.baseColors.length <= index) {
        draft.sparkle.baseColors.push(draft.sparkle.baseColors[draft.sparkle.baseColors.length - 1] || "#ffffff");
      }
      draft.sparkle.baseColors[index] = event.target.value;
      applyCurrentInk(draft, { persist: true });
    });

    textInput.addEventListener("change", (event) => {
      const draft = clone(getCurrentInk());
      while (draft.sparkle.baseColors.length <= index) {
        draft.sparkle.baseColors.push(draft.sparkle.baseColors[draft.sparkle.baseColors.length - 1] || "#ffffff");
      }
      draft.sparkle.baseColors[index] = event.target.value;
      applyCurrentInk(draft, { persist: true });
    });

    card.append(top, body);
    dom.sparkleColorGrid.appendChild(card);
    sparkleColorBindings.push({ index, enabled, colorInput, textInput });
  }
}

function buildToggleButtons(container, options, currentValue, onSelect) {
  container.textContent = "";
  options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "toggle-button";
    button.dataset.value = option.value;
    button.textContent = option.label;
    button.classList.toggle("is-active", option.value === currentValue);
    button.addEventListener("click", () => onSelect(option.value));
    container.appendChild(button);
  });
}

function buildBackgroundPicker() {
  const fragment = document.createDocumentFragment();

  backgroundOptions.forEach((background) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `background-chip ${background.className || ""}`.trim();
    button.dataset.backgroundId = background.id;
    button.setAttribute("role", "listitem");
    button.textContent = background.label;
    if (background.color) {
      button.style.setProperty("--bg-color", background.color);
    }
    button.addEventListener("click", () => {
      state.backgroundId = background.id;
      if (sandboxController) {
        sandboxController.setExportBackground(background.id);
      }
      syncUi();
      persistWorkspace();
    });
    fragment.appendChild(button);
  });

  dom.backgroundPicker.appendChild(fragment);
}

function buildUi() {
  buildNumericControls(dom.paletteControls, "palette", PALETTE_CONTROL_DEFS);
  buildNumericControls(dom.inkControls, "ink", INK_CONTROL_DEFS);
  buildNumericControls(dom.paletteAdvancedControls, "palette", PALETTE_ADVANCED_CONTROL_DEFS);
  buildNumericControls(dom.inkAdvancedControls, "ink", INK_ADVANCED_CONTROL_DEFS);
  buildPaletteCards();
  buildSparkleColorCards();
  buildBackgroundPicker();

  buildToggleButtons(dom.paletteBlendModeButtons, blendModeOptions, getCurrentPalette().finish.blendMode, (value) => {
    updatePaletteField("finish.blendMode", value);
  });

  buildToggleButtons(dom.paletteGlintStyleButtons, glintStyleOptions, getCurrentPalette().finish.glintStyle, (value) => {
    updatePaletteField("finish.glintStyle", value);
  });

  buildToggleButtons(dom.layerModeButtons, [
    { value: "combined", label: "Combined" },
    { value: "pigment", label: "Pigment Only" },
    { value: "sparkles", label: "Sparkles Only" }
  ], state.layerMode, (value) => {
    state.layerMode = value;
    syncUi();
    persistWorkspace();
  });

  buildToggleButtons(dom.sandboxModeButtons, [
    { value: "brush", label: "Brush" },
    { value: "spray", label: "Spray" }
  ], "brush", (value) => {
    if (sandboxController) {
      sandboxController.setMode(value);
    }
  });
}

function syncNumericBindings() {
  numericBindings.forEach(({ scope, definition, range, number, readout }) => {
    const source = scope === "palette" ? getCurrentPalette() : getCurrentInk();
    const value = getPathValue(source, definition.path);
    const formatted = formatNumber(value);
    if (document.activeElement !== range) {
      range.value = formatted;
    }
    if (document.activeElement !== number) {
      number.value = formatted;
    }
    readout.textContent = formatControlValue(value, definition);
  });
}

function syncHeaderFields() {
  const currentInk = getCurrentInk();
  if (document.activeElement !== dom.inkLabel) {
    dom.inkLabel.value = currentInk.meta.label;
  }
  if (document.activeElement !== dom.inkId) {
    dom.inkId.value = currentInk.meta.id;
  }
  if (document.activeElement !== dom.inkNote) {
    dom.inkNote.value = currentInk.meta.note;
  }
  if (document.activeElement !== dom.shadowColorInput) {
    dom.shadowColorInput.value = currentInk.shadow.color;
  }
}

function syncPaletteCards() {
  const currentInk = getCurrentInk();
  paletteBindings.forEach(({ index, colorInput }) => {
    const stop = currentInk.body.paletteStops[index];
    const absoluteHue = currentInk.body.hueBase + stop.hueShift;
    const rgb = hslToRgb(absoluteHue, stop.saturation, stop.lightness);
    colorInput.value = rgbToHex(rgb[0], rgb[1], rgb[2]);
  });
}

function syncSparkleColorCards() {
  const currentInk = getCurrentInk();
  sparkleColorBindings.forEach(({ index, enabled, colorInput, textInput }) => {
    const isActive = index < currentInk.sparkle.baseColors.length;
    const color = currentInk.sparkle.baseColors[Math.min(index, currentInk.sparkle.baseColors.length - 1)] || "#ffffff";
    enabled.checked = isActive;
    colorInput.disabled = !isActive;
    textInput.disabled = !isActive;
    colorInput.value = colorToHex(color);
    if (document.activeElement !== textInput) {
      textInput.value = color;
    }
  });
}

function syncToggleButtons(container, currentValue) {
  container.querySelectorAll(".toggle-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.value === currentValue);
  });
}

function syncBackgroundButtons() {
  dom.backgroundPicker.querySelectorAll(".background-chip").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.backgroundId === state.backgroundId);
  });
}

function syncPaletteSelector() {
  const activeElement = document.activeElement;
  dom.paletteSelect.textContent = "";
  state.paletteOrder.forEach((paletteId) => {
    const palette = state.palettes[paletteId];
    if (!palette) {
      return;
    }
    const option = document.createElement("option");
    option.value = paletteId;
    option.textContent = palette.meta.label;
    dom.paletteSelect.appendChild(option);
  });
  if (activeElement !== dom.paletteSelect) {
    dom.paletteSelect.value = state.selectedPaletteId;
  }
}

function syncInkSelector() {
  const activeElement = document.activeElement;
  const inkIds = getInkIdsForCurrentPalette();
  dom.inkSelect.textContent = "";
  inkIds.forEach((inkId) => {
    const ink = state.inks[inkId];
    const option = document.createElement("option");
    option.value = inkId;
    option.textContent = ink.meta.label;
    dom.inkSelect.appendChild(option);
  });
  dom.inkSelect.disabled = inkIds.length <= 1;
  dom.inkSelectHint.textContent = inkIds.length <= 1
    ? "This palette currently has one ink."
    : `${inkIds.length} inks in this palette.`;
  if (activeElement !== dom.inkSelect) {
    dom.inkSelect.value = state.selectedInkId;
  }
}

function syncPaletteSummary() {
  const palette = getCurrentPalette();
  dom.paletteScopeText.textContent = palette.meta.note || "Tune the shared material behavior for this family.";
}

function syncOutputs() {
  const currentPalette = getCurrentPalette();
  const currentInk = getCurrentInk();
  dom.paletteCodeOutput.value = generatePaletteSnippet(currentPalette);
  dom.inkCodeOutput.value = generateInkSnippet(currentInk);
  if (document.activeElement !== dom.pairJsonOutput) {
    dom.pairJsonOutput.value = generatePairSnippet({ palette: currentPalette, ink: currentInk });
  }
}

function syncAnimationControls() {
  dom.timeReadout.textContent = `${Math.round(state.scrubMs)} ms`;
  if (document.activeElement !== dom.timeScrubber) {
    dom.timeScrubber.value = String(Math.round(state.scrubMs));
  }
  if (document.activeElement !== dom.timeInput) {
    dom.timeInput.value = String(Math.round(state.scrubMs));
  }
  dom.playPauseButton.textContent = state.isPlaying ? "Pause" : "Play";
}

function syncResetButtons() {
  dom.resetPaletteButton.disabled = !paletteSeedById.has(state.selectedPaletteId);
  dom.resetInkButton.disabled = !inkSeedById.has(state.selectedInkId);
}

function syncSandboxUi(sandboxState = sandboxController?.getState()) {
  if (!sandboxState) {
    return;
  }

  dom.sandboxBrushSize.value = String(sandboxState.brushSize);
  dom.sandboxBrushInput.value = String(sandboxState.brushSize);
  dom.sandboxBrushValue.textContent = `${sandboxState.brushSize} px`;
  syncToggleButtons(dom.sandboxModeButtons, sandboxState.mode);
}

function syncUi() {
  syncPaletteSelector();
  syncInkSelector();
  syncPaletteSummary();
  syncHeaderFields();
  syncNumericBindings();
  syncPaletteCards();
  syncSparkleColorCards();
  syncOutputs();
  syncAnimationControls();
  syncBackgroundButtons();
  syncToggleButtons(dom.paletteBlendModeButtons, getCurrentPalette().finish.blendMode);
  syncToggleButtons(dom.paletteGlintStyleButtons, getCurrentPalette().finish.glintStyle);
  syncToggleButtons(dom.layerModeButtons, state.layerMode);
  syncSandboxUi();
  syncResetButtons();
}

function initializeSandbox() {
  sandboxController = createCanvasController({
    elements: {
      stageViewport: dom.sandboxStageViewport,
      canvasShell: dom.sandboxCanvasShell,
      paintCanvas: dom.sandboxPaintCanvas,
      fxCanvas: dom.sandboxFxCanvas,
      canvasWidthInput: dom.sandboxCanvasWidthInput,
      canvasHeightInput: dom.sandboxCanvasHeightInput
    },
    onUiChange: syncSandboxUi
  });

  sandboxController.initialize();
  sandboxController.applySceneSize(760, 420, false);
  sandboxController.setActiveInk(DESIGNER_PREVIEW_ID);
  sandboxController.setExportBackground(state.backgroundId);
  syncSandboxUi();
}

function getPreviewTime(now) {
  if (state.isPlaying) {
    state.scrubMs = (now - state.playOrigin) % LOOP_DURATION;
  }
  return state.scrubMs;
}

function createCurvePoints(width, height, config) {
  const points = [];
  const count = 54;
  for (let index = 0; index <= count; index += 1) {
    const t = index / count;
    const x = lerp(width * config.xStart, width * config.xEnd, t);
    const baseY = lerp(height * config.yStart, height * config.yEnd, t);
    const y = baseY
      + Math.sin(t * TAU * config.waveA + config.phase) * config.ampA
      + Math.cos(t * TAU * config.waveB + config.phase * 0.7) * config.ampB;
    const pressure = clamp(config.pressureBase + Math.sin(t * Math.PI) * config.pressureSwing, 0.22, 1);
    points.push({
      x,
      y,
      pressure,
      t: t * 1000
    });
  }
  return points;
}

function getStrokeSpacing(stroke) {
  return stroke.mode === "spray"
    ? Math.max(3.2, stroke.brushSize * 0.28)
    : Math.max(0.9, stroke.brushSize * 0.08);
}

function maybeAddPreviewSparkle(nodes, stroke, preset, stamp, randomKey) {
  const chanceBase = preset.sparkleDensity * (stroke.mode === "spray" ? 1.25 : 0.8);
  if (hash01(randomKey) > chanceBase) {
    return;
  }

  if (nodes.length >= (stroke.mode === "spray" ? 240 : 180)) {
    return;
  }

  nodes.push(createSparkleNode(stamp, preset, randomKey));
}

function drawBrushPreviewStamp(ctx, preset, stroke, point, angle, travel, nodes, shouldDrawBody, stampIndex) {
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

  if (shouldDrawBody) {
    preset.renderStamp(ctx, stamp, 0);
  }
  maybeAddPreviewSparkle(nodes, stroke, preset, stamp, stroke.seed + travel * 0.13 + stampIndex * 0.93);
}

function drawSprayPreviewBurst(ctx, preset, stroke, point, angle, travel, nodes, shouldDrawBody, stampIndex) {
  const dotCount = clamp(Math.round(stroke.brushSize * 0.72), 6, 24);
  const scatter = preset.sprayScatter * (0.45 + stroke.brushSize * 0.03);
  for (let index = 0; index < dotCount; index += 1) {
    const key = stroke.seed + stampIndex * 19.7 + index * 13.3 + travel * 0.031;
    const theta = hash01(key) * TAU;
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

    if (shouldDrawBody) {
      preset.renderStamp(ctx, stamp, 0);
    }
    maybeAddPreviewSparkle(nodes, stroke, preset, stamp, key + 4.8);
  }
}

function renderPreviewStroke(ctx, preset, stroke, time, layerMode) {
  if (!stroke.points.length) {
    return;
  }

  const nodes = [];
  const shouldDrawBody = layerMode !== "sparkles";
  const shouldDrawSparkles = layerMode !== "pigment";

  const drawAtPoint = (point, angle, travel, stampIndex) => {
    if (stroke.mode === "spray") {
      drawSprayPreviewBurst(ctx, preset, stroke, point, angle, travel, nodes, shouldDrawBody, stampIndex);
    } else {
      drawBrushPreviewStamp(ctx, preset, stroke, point, angle, travel, nodes, shouldDrawBody, stampIndex);
    }
  };

  drawAtPoint(stroke.points[0], Math.PI / 6, 0, 0);

  let travel = 0;
  for (let index = 1; index < stroke.points.length; index += 1) {
    const fromPoint = stroke.points[index - 1];
    const toPoint = stroke.points[index];
    const dx = toPoint.x - fromPoint.x;
    const dy = toPoint.y - fromPoint.y;
    const distance = Math.hypot(dx, dy);
    const angle = distance > 0.001 ? Math.atan2(dy, dx) : 0;
    const spacing = getStrokeSpacing(stroke);
    const steps = Math.max(1, Math.ceil(distance / spacing));

    for (let step = 1; step <= steps; step += 1) {
      const ratio = step / steps;
      const point = {
        x: lerp(fromPoint.x, toPoint.x, ratio),
        y: lerp(fromPoint.y, toPoint.y, ratio),
        pressure: lerp(fromPoint.pressure, toPoint.pressure, ratio)
      };
      travel += distance / steps;
      drawAtPoint(point, angle, travel, index * 100 + step);
    }
  }

  if (shouldDrawSparkles) {
    nodes.forEach((node) => preset.renderGlint(ctx, node, time));
  }
}

function buildSampleStrokes(width, height) {
  const majorSize = clamp(Math.min(width, height) * 0.082, 18, 42);
  const minorSize = clamp(Math.min(width, height) * 0.066, 14, 34);
  return [
    {
      mode: "brush",
      brushSize: majorSize,
      seed: 31,
      points: createCurvePoints(width, height, {
        xStart: 0.08,
        xEnd: 0.92,
        yStart: 0.22,
        yEnd: 0.28,
        waveA: 1.25,
        waveB: 0.55,
        ampA: height * 0.08,
        ampB: height * 0.03,
        pressureBase: 0.54,
        pressureSwing: 0.28,
        phase: 0.8
      })
    },
    {
      mode: "spray",
      brushSize: majorSize + 2,
      seed: 73,
      points: createCurvePoints(width, height, {
        xStart: 0.1,
        xEnd: 0.86,
        yStart: 0.62,
        yEnd: 0.74,
        waveA: 1.6,
        waveB: 0.9,
        ampA: height * 0.09,
        ampB: height * 0.05,
        pressureBase: 0.48,
        pressureSwing: 0.24,
        phase: 2.1
      })
    },
    {
      mode: "brush",
      brushSize: minorSize,
      seed: 129,
      points: createCurvePoints(width, height, {
        xStart: 0.18,
        xEnd: 0.82,
        yStart: 0.5,
        yEnd: 0.46,
        waveA: 2.1,
        waveB: 1.1,
        ampA: height * 0.05,
        ampB: height * 0.02,
        pressureBase: 0.42,
        pressureSwing: 0.18,
        phase: 3.2
      })
    }
  ];
}

function renderSampleBoard(time) {
  const { ctx, width, height } = resizeCanvasToBox(dom.sampleCanvas);
  drawPreviewBackground(ctx, width, height, getCurrentBackground());

  const strokes = buildSampleStrokes(width, height);
  strokes.forEach((stroke) => renderPreviewStroke(ctx, state.previewPreset, stroke, time, state.layerMode));
}

function renderStampCard() {
  const { ctx, width, height } = resizeCanvasToBox(dom.stampCanvas);
  drawPreviewBackground(ctx, width, height, getCurrentBackground());
  state.previewPreset.renderStamp(ctx, {
    x: width * 0.5,
    y: height * 0.54,
    radius: Math.min(width, height) * 0.18,
    angle: Math.PI / 8,
    pressure: 0.86,
    travel: 42,
    progress: 0.76,
    seed: 27,
    isSpray: false
  }, 0);
}

function renderSprayCard() {
  const { ctx, width, height } = resizeCanvasToBox(dom.sprayCanvas);
  drawPreviewBackground(ctx, width, height, getCurrentBackground());
  const stroke = {
    mode: "spray",
    brushSize: Math.min(width, height) * 0.22,
    seed: 41
  };
  drawSprayPreviewBurst(ctx, state.previewPreset, stroke, {
    x: width * 0.5,
    y: height * 0.52,
    pressure: 0.74
  }, Math.PI / 5, 38, [], true, 0);
}

function renderGlintCard(time) {
  const { ctx, width, height } = resizeCanvasToBox(dom.glintCanvas);
  drawPreviewBackground(ctx, width, height, getCurrentBackground());
  state.previewPreset.renderGlint(ctx, {
    x: width * 0.5,
    y: height * 0.52,
    size: Math.min(width, height) * 0.07,
    phase: 1.2,
    hueOffset: 42,
    drift: 0.82,
    brightness: 1.28
  }, time);
}

function renderSparkleStripCard(time) {
  const { ctx, width, height } = resizeCanvasToBox(dom.sparkleStripCanvas);
  drawPreviewBackground(ctx, width, height, getCurrentBackground());
  const count = 12;
  for (let index = 0; index < count; index += 1) {
    state.previewPreset.renderGlint(ctx, {
      x: lerp(width * 0.12, width * 0.88, index / (count - 1)),
      y: height * 0.5 + Math.sin(index * 0.7) * height * 0.06,
      size: lerp(3.2, 7.4, (index % 4) / 3),
      phase: index * 0.48,
      hueOffset: lerp(-110, 110, index / (count - 1)),
      drift: lerp(0.18, 1.26, index / (count - 1)),
      brightness: lerp(0.72, 1.48, (index % 5) / 4)
    }, time);
  }
}

function renderFrame(now) {
  const time = getPreviewTime(now);
  syncAnimationControls();
  renderSampleBoard(time);
  renderStampCard();
  renderSprayCard();
  renderGlintCard(time);
  renderSparkleStripCard(time);
  requestAnimationFrame(renderFrame);
}

function bindEvents() {
  dom.paletteSelect.addEventListener("change", (event) => selectPalette(event.target.value));
  dom.inkSelect.addEventListener("change", (event) => selectInk(event.target.value));

  dom.inkLabel.addEventListener("input", (event) => updateInkField("meta.label", event.target.value));
  dom.inkId.addEventListener("change", (event) => updateInkField("meta.id", event.target.value));
  dom.inkNote.addEventListener("input", (event) => updateInkField("meta.note", event.target.value));
  dom.shadowColorInput.addEventListener("change", (event) => updateInkField("shadow.color", event.target.value));

  dom.resetPaletteButton.addEventListener("click", () => {
    const seed = paletteSeedById.get(state.selectedPaletteId);
    if (!seed) {
      setStatus("No built-in seed for this palette.", "error");
      return;
    }
    applyCurrentPalette(clone(seed), { persist: true });
    setStatus("Palette reset to its seed.");
  });

  dom.resetInkButton.addEventListener("click", () => {
    const seed = inkSeedById.get(state.selectedInkId);
    if (!seed) {
      setStatus("No built-in seed for this ink.", "error");
      return;
    }
    state.idTouched.inks[state.selectedInkId] = false;
    applyCurrentInk(clone(seed), { persist: true });
    setStatus("Ink reset to its seed.");
  });

  const copyPaletteCode = async () => {
    try {
      await copyText(dom.paletteCodeOutput.value);
      setStatus("Palette code copied.");
    } catch {
      setStatus("Could not copy palette code.", "error");
    }
  };

  const copyInkCode = async () => {
    try {
      await copyText(dom.inkCodeOutput.value);
      setStatus("Ink code copied.");
    } catch {
      setStatus("Could not copy ink code.", "error");
    }
  };

  const copyPairJson = async () => {
    try {
      await copyText(dom.pairJsonOutput.value);
      setStatus("Pair JSON copied.");
    } catch {
      setStatus("Could not copy pair JSON.", "error");
    }
  };

  dom.copyPaletteCodeButton.addEventListener("click", copyPaletteCode);
  dom.copyPaletteCodeButtonSecondary.addEventListener("click", copyPaletteCode);
  dom.copyInkCodeButton.addEventListener("click", copyInkCode);
  dom.copyInkCodeButtonSecondary.addEventListener("click", copyInkCode);
  dom.copyPairJsonButton.addEventListener("click", copyPairJson);
  dom.copyPairJsonButtonSecondary.addEventListener("click", copyPairJson);

  dom.playPauseButton.addEventListener("click", () => {
    if (state.isPlaying) {
      state.isPlaying = false;
    } else {
      state.isPlaying = true;
      state.playOrigin = performance.now() - state.scrubMs;
    }
    syncAnimationControls();
    persistWorkspace();
  });

  const applyScrub = (nextValue) => {
    const numeric = clamp(Number.parseFloat(nextValue) || 0, 0, LOOP_DURATION);
    state.scrubMs = numeric;
    state.isPlaying = false;
    syncAnimationControls();
    persistWorkspace();
  };

  dom.timeScrubber.addEventListener("input", (event) => applyScrub(event.target.value));
  dom.timeInput.addEventListener("input", (event) => applyScrub(event.target.value));

  dom.sandboxClearButton.addEventListener("click", () => {
    if (sandboxController) {
      sandboxController.clearAllStrokes();
    }
  });

  const applySandboxBrushSize = (nextValue) => {
    const numeric = clamp(Math.round(Number.parseFloat(nextValue) || 20), 6, 48);
    if (sandboxController) {
      sandboxController.setBrushSize(numeric);
    }
  };

  dom.sandboxBrushSize.addEventListener("input", (event) => applySandboxBrushSize(event.target.value));
  dom.sandboxBrushInput.addEventListener("input", (event) => applySandboxBrushSize(event.target.value));

  dom.applyPairJsonButton.addEventListener("click", () => {
    try {
      loadPairBundle(JSON.parse(dom.pairJsonOutput.value), "Pair JSON applied.", { forceCustom: false });
    } catch {
      setStatus("That JSON could not be parsed into a palette and ink pair.", "error", true);
    }
  });

  dom.downloadPairButton.addEventListener("click", () => {
    createDownload(
      new Blob([dom.pairJsonOutput.value], { type: "application/json" }),
      `sparkly-pair-${Date.now()}.json`
    );
    setStatus("Pair JSON downloaded.");
  });

  dom.importPairButton.addEventListener("click", () => dom.pairImportInput.click());
  dom.pairImportInput.addEventListener("change", async (event) => {
    const [file] = event.target.files || [];
    if (!file) {
      return;
    }

    try {
      loadPairBundle(JSON.parse(await file.text()), "Imported palette and ink pair.", { forceCustom: false });
    } catch {
      setStatus("That file could not be imported as palette/ink JSON.", "error", true);
    } finally {
      event.target.value = "";
    }
  });

  window.addEventListener("resize", () => {
    syncUi();
  });
}

compilePreviewPreset();
buildUi();
bindEvents();
initializeSandbox();

if (sandboxController) {
  sandboxController.setActiveInk(DESIGNER_PREVIEW_ID);
  sandboxController.setExportBackground(state.backgroundId);
}

syncUi();
requestAnimationFrame(renderFrame);
