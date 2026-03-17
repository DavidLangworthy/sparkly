import {
  createInkPreset
} from "./ink.js";
import {
  defaultPaletteDefinition,
  defaultInkDefinition,
  paletteSeedDefinitions,
  inkSeedDefinitions
} from "./glitter-seeds.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const normalizeHue = (value) => ((value % 360) + 360) % 360;
const hsl = (h, s, l, a = 1) => `hsla(${normalizeHue(h)} ${s}% ${l}% / ${a})`;

const parseHexColor = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const compact = value.trim().replace(/^#/, "");
  const hex = compact.length === 3
    ? compact.split("").map((character) => character + character).join("")
    : compact;
  if (!/^[0-9a-f]{6}$/i.test(hex)) {
    return null;
  }

  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16)
  ];
};

const blendModeOptions = [
  { value: "lighter", label: "Lighter" },
  { value: "screen", label: "Screen" }
];

const glintStyleOptions = [
  { value: "streak", label: "Streak" },
  { value: "dust", label: "Dust" },
  { value: "foil", label: "Foil" },
  { value: "soft", label: "Soft" },
  { value: "prism", label: "Prism" },
  { value: "ember", label: "Ember" }
];

const DEFAULT_PALETTE_RAW = defaultPaletteDefinition;
const DEFAULT_INK_RAW = defaultInkDefinition;

function toFiniteNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function clampAlpha(value, fallback) {
  return clamp(toFiniteNumber(value, fallback), 0, 1);
}

function clampFrequency(value, fallback) {
  return clamp(toFiniteNumber(value, fallback), 0, 12);
}

function clampTimeSpeed(value, fallback) {
  return clamp(toFiniteNumber(value, fallback), 0, 0.01);
}

function clampHueAmplitude(value, fallback) {
  return clamp(toFiniteNumber(value, fallback), 0, 120);
}

function clampColorChannel(value, fallback) {
  return clamp(toFiniteNumber(value, fallback), 0, 100);
}

function clampHueShift(value, fallback) {
  return clamp(toFiniteNumber(value, fallback), -180, 180);
}

function normalizeId(value, fallback) {
  const normalized = typeof value === "string"
    ? value.trim().replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    : "";
  return normalized || fallback;
}

function isRgbColorString(value) {
  return typeof value === "string" && /^rgba?\(\s*[-\d.\s,%]+\)$/i.test(value.trim());
}

function isColorString(value) {
  return typeof value === "string"
    && (Boolean(parseHexColor(value)) || isRgbColorString(value));
}

function normalizeColorString(value, fallback) {
  return isColorString(value) ? value.trim() : fallback;
}

function normalizePaletteStops(rawStops, fallbackStops) {
  const source = Array.isArray(rawStops) && rawStops.length ? rawStops : fallbackStops;
  const normalized = source.slice(0, 4).map((stop, index) => {
    const fallback = fallbackStops[Math.min(index, fallbackStops.length - 1)];
    return {
      hueShift: clampHueShift(stop?.hueShift, fallback.hueShift),
      saturation: clampColorChannel(stop?.saturation, fallback.saturation),
      lightness: clampColorChannel(stop?.lightness, fallback.lightness),
      alpha: clampAlpha(stop?.alpha, fallback.alpha)
    };
  });

  while (normalized.length < 4) {
    normalized.push({ ...normalized[normalized.length - 1] });
  }

  return normalized;
}

function normalizeSparkleColors(rawColors, fallbackColors) {
  const source = Array.isArray(rawColors) && rawColors.length ? rawColors : fallbackColors;
  return source
    .slice(0, 4)
    .map((color, index) => normalizeColorString(color, fallbackColors[Math.min(index, fallbackColors.length - 1)]))
    .filter(Boolean);
}

function normalizeSparkleProfile(raw, fallback) {
  const sparkleProfile = raw && typeof raw === "object" ? raw : {};
  const sizeMin = clamp(toFiniteNumber(sparkleProfile.sizeMin, fallback.sizeMin), 0.4, 8);
  const driftMin = clamp(toFiniteNumber(sparkleProfile.driftMin, fallback.driftMin), 0, 2);
  const brightnessMin = clamp(toFiniteNumber(sparkleProfile.brightnessMin, fallback.brightnessMin), 0.1, 2);

  return {
    density: clamp(toFiniteNumber(sparkleProfile.density, fallback.density), 0, 0.14),
    sizeMin,
    sizeMax: clamp(toFiniteNumber(sparkleProfile.sizeMax, fallback.sizeMax), Math.max(0.8, sizeMin), 10),
    hueRange: clamp(toFiniteNumber(sparkleProfile.hueRange, fallback.hueRange), 0, 360),
    brightnessMin,
    brightnessMax: clamp(toFiniteNumber(sparkleProfile.brightnessMax, fallback.brightnessMax), brightnessMin, 2),
    driftMin,
    driftMax: clamp(toFiniteNumber(sparkleProfile.driftMax, fallback.driftMax), driftMin, 2),
    hotspotChance: clamp(toFiniteNumber(sparkleProfile.hotspotChance, fallback.hotspotChance), 0, 0.4),
    hotspotBoost: clamp(toFiniteNumber(sparkleProfile.hotspotBoost, fallback.hotspotBoost), 1, 2.2)
  };
}

function normalizeSparkleMotion(raw, fallback) {
  const sparkleMotion = raw && typeof raw === "object" ? raw : {};

  return {
    hueOffsetScale: clamp(toFiniteNumber(sparkleMotion.hueOffsetScale, fallback.hueOffsetScale), 0, 2),
    timeSinSpeed: clampTimeSpeed(sparkleMotion.timeSinSpeed, fallback.timeSinSpeed),
    timeSinAmplitude: clampHueAmplitude(sparkleMotion.timeSinAmplitude, fallback.timeSinAmplitude),
    timeCosSpeed: clampTimeSpeed(sparkleMotion.timeCosSpeed, fallback.timeCosSpeed),
    timeCosAmplitude: clampHueAmplitude(sparkleMotion.timeCosAmplitude, fallback.timeCosAmplitude)
  };
}

function normalizePaletteDefinition(raw) {
  const fallback = DEFAULT_PALETTE_RAW;
  const definition = raw && typeof raw === "object" ? raw : {};
  const meta = definition.meta && typeof definition.meta === "object" ? definition.meta : {};
  const finish = definition.finish && typeof definition.finish === "object" ? definition.finish : {};
  const bodyProfile = definition.bodyProfile && typeof definition.bodyProfile === "object" ? definition.bodyProfile : {};
  const bodyMotion = definition.bodyMotion && typeof definition.bodyMotion === "object" ? definition.bodyMotion : {};
  const shineMotion = definition.shineMotion && typeof definition.shineMotion === "object" ? definition.shineMotion : {};
  const rimMotion = definition.rimMotion && typeof definition.rimMotion === "object" ? definition.rimMotion : {};

  return {
    meta: {
      id: normalizeId(meta.id, fallback.meta.id),
      label: typeof meta.label === "string" && meta.label.trim() ? meta.label.trim() : fallback.meta.label,
      note: typeof meta.note === "string" ? meta.note.trim() : fallback.meta.note
    },
    finish: {
      blendMode: blendModeOptions.some((option) => option.value === finish.blendMode)
        ? finish.blendMode
        : fallback.finish.blendMode,
      glintStyle: glintStyleOptions.some((option) => option.value === finish.glintStyle)
        ? finish.glintStyle
        : fallback.finish.glintStyle,
      sheenSpeed: clamp(toFiniteNumber(finish.sheenSpeed, fallback.finish.sheenSpeed), 0.4, 2)
    },
    bodyProfile: {
      stretch: clamp(toFiniteNumber(bodyProfile.stretch, fallback.bodyProfile.stretch), 0.7, 1.5),
      squeeze: clamp(toFiniteNumber(bodyProfile.squeeze, fallback.bodyProfile.squeeze), 0.6, 1.1),
      sprayScatter: clamp(toFiniteNumber(bodyProfile.sprayScatter, fallback.bodyProfile.sprayScatter), 6, 32),
      pigmentAlpha: clampAlpha(bodyProfile.pigmentAlpha, fallback.bodyProfile.pigmentAlpha),
      highlightAlpha: clampAlpha(bodyProfile.highlightAlpha, fallback.bodyProfile.highlightAlpha),
      edgeAlpha: clampAlpha(bodyProfile.edgeAlpha, fallback.bodyProfile.edgeAlpha)
    },
    bodyMotion: {
      sinProgressFreq: clampFrequency(bodyMotion.sinProgressFreq, fallback.bodyMotion.sinProgressFreq),
      sinSeedFreq: clampFrequency(bodyMotion.sinSeedFreq, fallback.bodyMotion.sinSeedFreq),
      sinAmplitude: clampHueAmplitude(bodyMotion.sinAmplitude, fallback.bodyMotion.sinAmplitude),
      cosProgressFreq: clampFrequency(bodyMotion.cosProgressFreq, fallback.bodyMotion.cosProgressFreq),
      cosSeedFreq: clampFrequency(bodyMotion.cosSeedFreq, fallback.bodyMotion.cosSeedFreq),
      cosAmplitude: clampHueAmplitude(bodyMotion.cosAmplitude, fallback.bodyMotion.cosAmplitude)
    },
    shineMotion: {
      progressFreq: clampFrequency(shineMotion.progressFreq, fallback.shineMotion.progressFreq),
      seedFreq: clampFrequency(shineMotion.seedFreq, fallback.shineMotion.seedFreq),
      amplitude: clampHueAmplitude(shineMotion.amplitude, fallback.shineMotion.amplitude)
    },
    rimMotion: {
      progressFreq: clampFrequency(rimMotion.progressFreq, fallback.rimMotion.progressFreq),
      seedFreq: clampFrequency(rimMotion.seedFreq, fallback.rimMotion.seedFreq),
      amplitude: clampHueAmplitude(rimMotion.amplitude, fallback.rimMotion.amplitude)
    }
  };
}

function normalizeInkDefinition(raw) {
  const fallback = DEFAULT_INK_RAW;
  const definition = raw && typeof raw === "object" ? raw : {};
  const meta = definition.meta && typeof definition.meta === "object" ? definition.meta : {};
  const body = definition.body && typeof definition.body === "object" ? definition.body : {};
  const shine = definition.shine && typeof definition.shine === "object" ? definition.shine : {};
  const rim = definition.rim && typeof definition.rim === "object" ? definition.rim : {};
  const shadow = definition.shadow && typeof definition.shadow === "object" ? definition.shadow : {};
  const sparkle = definition.sparkle && typeof definition.sparkle === "object" ? definition.sparkle : {};
  const sparkleProfile = definition.sparkleProfile && typeof definition.sparkleProfile === "object" ? definition.sparkleProfile : {};
  const sparkleMotion = definition.sparkleMotion && typeof definition.sparkleMotion === "object" ? definition.sparkleMotion : {};

  return {
    meta: {
      id: normalizeId(meta.id, fallback.meta.id).toLowerCase(),
      paletteId: normalizeId(meta.paletteId, fallback.meta.paletteId),
      label: typeof meta.label === "string" && meta.label.trim() ? meta.label.trim() : fallback.meta.label,
      note: typeof meta.note === "string" ? meta.note.trim() : fallback.meta.note
    },
    body: {
      hueBase: normalizeHue(toFiniteNumber(body.hueBase, fallback.body.hueBase)),
      paletteStops: normalizePaletteStops(body.paletteStops, fallback.body.paletteStops)
    },
    shine: {
      hueBase: normalizeHue(toFiniteNumber(shine.hueBase, fallback.shine.hueBase)),
      saturation: clampColorChannel(shine.saturation, fallback.shine.saturation),
      lightness: clampColorChannel(shine.lightness, fallback.shine.lightness),
      alpha: clampAlpha(shine.alpha, fallback.shine.alpha)
    },
    rim: {
      hueBase: normalizeHue(toFiniteNumber(rim.hueBase, fallback.rim.hueBase)),
      saturation: clampColorChannel(rim.saturation, fallback.rim.saturation),
      lightness: clampColorChannel(rim.lightness, fallback.rim.lightness),
      alpha: clampAlpha(rim.alpha, fallback.rim.alpha)
    },
    shadow: {
      color: normalizeColorString(shadow.color, fallback.shadow.color)
    },
    sparkle: {
      baseColors: normalizeSparkleColors(sparkle.baseColors, fallback.sparkle.baseColors),
      hueBase: normalizeHue(toFiniteNumber(sparkle.hueBase, fallback.sparkle.hueBase)),
      saturationBase: clampColorChannel(sparkle.saturationBase, fallback.sparkle.saturationBase),
      saturationAmplitude: clampColorChannel(sparkle.saturationAmplitude, fallback.sparkle.saturationAmplitude),
      lightnessBase: clampColorChannel(sparkle.lightnessBase, fallback.sparkle.lightnessBase),
      lightnessAmplitude: clampColorChannel(sparkle.lightnessAmplitude, fallback.sparkle.lightnessAmplitude),
      alpha: clampAlpha(sparkle.alpha, fallback.sparkle.alpha)
    },
    sparkleProfile: normalizeSparkleProfile(sparkleProfile, fallback.sparkleProfile),
    sparkleMotion: normalizeSparkleMotion(sparkleMotion, fallback.sparkleMotion)
  };
}

function definePalette(definition) {
  return normalizePaletteDefinition(definition);
}

function defineInk(definition) {
  return normalizeInkDefinition(definition);
}

function getPaletteHue(palette, ink, stamp) {
  return ink.body.hueBase
    + Math.sin(stamp.progress * palette.bodyMotion.sinProgressFreq + stamp.seed * palette.bodyMotion.sinSeedFreq)
      * palette.bodyMotion.sinAmplitude
    + Math.cos(stamp.progress * palette.bodyMotion.cosProgressFreq + stamp.seed * palette.bodyMotion.cosSeedFreq)
      * palette.bodyMotion.cosAmplitude;
}

function getPaletteFromDefinition(palette, ink, stamp) {
  const hue = getPaletteHue(palette, ink, stamp);
  return ink.body.paletteStops.map((stop) => hsl(
    hue + stop.hueShift,
    stop.saturation,
    stop.lightness,
    stop.alpha
  ));
}

function fromPaletteInk({ palette, ink }) {
  const normalizedPalette = normalizePaletteDefinition(palette);
  const normalizedInk = normalizeInkDefinition({
    ...ink,
    meta: {
      ...(ink?.meta || {}),
      paletteId: normalizedPalette.meta.id
    }
  });
  const neutralPalette = getPaletteFromDefinition(normalizedPalette, normalizedInk, { progress: 0, seed: 0 });

  return createInkPreset({
    id: normalizedInk.meta.id,
    label: normalizedInk.meta.label,
    note: normalizedInk.meta.note,
    baseColors: neutralPalette.slice(0, 3),
    sparkleColors: normalizedInk.sparkle.baseColors,
    blendMode: normalizedPalette.finish.blendMode,
    sheenSpeed: normalizedPalette.finish.sheenSpeed,
    sparkleDensity: normalizedInk.sparkleProfile.density,
    sparkleSizeRange: [normalizedInk.sparkleProfile.sizeMin, normalizedInk.sparkleProfile.sizeMax],
    sparkleHueRange: normalizedInk.sparkleProfile.hueRange,
    sparkleBrightnessRange: [normalizedInk.sparkleProfile.brightnessMin, normalizedInk.sparkleProfile.brightnessMax],
    sparkleDriftRange: [normalizedInk.sparkleProfile.driftMin, normalizedInk.sparkleProfile.driftMax],
    sparkleHotspotChance: normalizedInk.sparkleProfile.hotspotChance,
    sparkleHotspotBoost: normalizedInk.sparkleProfile.hotspotBoost,
    sprayScatter: normalizedPalette.bodyProfile.sprayScatter,
    stretch: normalizedPalette.bodyProfile.stretch,
    squeeze: normalizedPalette.bodyProfile.squeeze,
    pigmentAlpha: normalizedPalette.bodyProfile.pigmentAlpha,
    highlightAlpha: normalizedPalette.bodyProfile.highlightAlpha,
    edgeAlpha: normalizedPalette.bodyProfile.edgeAlpha,
    glintStyle: normalizedPalette.finish.glintStyle,
    palette: (stamp) => getPaletteFromDefinition(normalizedPalette, normalizedInk, stamp),
    shineColor: (stamp) => hsl(
      normalizedInk.shine.hueBase
        + Math.sin(stamp.progress * normalizedPalette.shineMotion.progressFreq + stamp.seed * normalizedPalette.shineMotion.seedFreq)
          * normalizedPalette.shineMotion.amplitude,
      normalizedInk.shine.saturation,
      normalizedInk.shine.lightness,
      normalizedInk.shine.alpha
    ),
    rimColor: (stamp) => hsl(
      normalizedInk.rim.hueBase
        + Math.cos(stamp.progress * normalizedPalette.rimMotion.progressFreq + stamp.seed * normalizedPalette.rimMotion.seedFreq)
          * normalizedPalette.rimMotion.amplitude,
      normalizedInk.rim.saturation,
      normalizedInk.rim.lightness,
      normalizedInk.rim.alpha
    ),
    shadowColor: () => normalizedInk.shadow.color,
    sparkleColor: (node, time) => hsl(
      normalizedInk.sparkle.hueBase
        + node.hueOffset * normalizedInk.sparkleMotion.hueOffsetScale
        + Math.sin(time * normalizedInk.sparkleMotion.timeSinSpeed + node.phase) * normalizedInk.sparkleMotion.timeSinAmplitude
        + Math.cos(time * normalizedInk.sparkleMotion.timeCosSpeed + node.drift * 3.8) * normalizedInk.sparkleMotion.timeCosAmplitude,
      normalizedInk.sparkle.saturationBase
        + Math.sin(node.phase * 2.1) * normalizedInk.sparkle.saturationAmplitude,
      normalizedInk.sparkle.lightnessBase
        + Math.cos(time * 0.0013 + node.phase) * normalizedInk.sparkle.lightnessAmplitude,
      normalizedInk.sparkle.alpha
    )
  });
}

function formatNumber(value) {
  const rounded = Math.round(value * 1000) / 1000;
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }

  return String(rounded).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

function formatValue(value, depth = 0) {
  const indent = "  ".repeat(depth);
  const nextIndent = "  ".repeat(depth + 1);

  if (Array.isArray(value)) {
    if (!value.length) {
      return "[]";
    }

    const inline = value.length <= 2 && value.every((item) => item == null || typeof item !== "object");
    if (inline) {
      return `[${value.map((item) => formatValue(item, depth + 1)).join(", ")}]`;
    }

    return `[\n${value.map((item) => `${nextIndent}${formatValue(item, depth + 1)}`).join(",\n")}\n${indent}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    return `{\n${entries.map(([key, item]) => `${nextIndent}${key}: ${formatValue(item, depth + 1)}`).join(",\n")}\n${indent}}`;
  }

  if (typeof value === "number") {
    return formatNumber(value);
  }

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return "null";
}

function generatePaletteSnippet(palette) {
  const normalized = normalizePaletteDefinition(palette);
  return `const ${normalized.meta.id} = definePalette(${formatValue(normalized, 0)});`;
}

function generateInkSnippet(ink) {
  const normalized = normalizeInkDefinition(ink);
  return `const ${normalized.meta.id} = defineInk(${formatValue(normalized, 0)});`;
}

function generatePairSnippet({ palette, ink }) {
  const normalizedPalette = normalizePaletteDefinition(palette);
  const normalizedInk = normalizeInkDefinition({
    ...ink,
    meta: {
      ...(ink?.meta || {}),
      paletteId: normalizedPalette.meta.id
    }
  });

  return JSON.stringify({
    schemaVersion: 2,
    palette: normalizedPalette,
    ink: normalizedInk
  }, null, 2);
}

const paletteSeedPresets = paletteSeedDefinitions.map((palette) => definePalette(palette));
const inkSeedPresets = inkSeedDefinitions.map((ink) => defineInk(ink));
const paletteSeedById = new Map(paletteSeedPresets.map((palette) => [palette.meta.id, palette]));
const inkSeedById = new Map(inkSeedPresets.map((ink) => [ink.meta.id, ink]));
const inksByPaletteId = new Map();

inkSeedPresets.forEach((ink) => {
  const collection = inksByPaletteId.get(ink.meta.paletteId) || [];
  collection.push(ink);
  inksByPaletteId.set(ink.meta.paletteId, collection);
});

export {
  blendModeOptions,
  glintStyleOptions,
  definePalette,
  defineInk,
  normalizePaletteDefinition,
  normalizeInkDefinition,
  fromPaletteInk,
  generatePaletteSnippet,
  generateInkSnippet,
  generatePairSnippet,
  paletteSeedPresets,
  paletteSeedById,
  inkSeedPresets,
  inkSeedById,
  inksByPaletteId
};
