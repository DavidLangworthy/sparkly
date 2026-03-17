import {
  blendModeOptions,
  glintStyleOptions,
  normalizePaletteDefinition,
  normalizeInkDefinition,
  fromPaletteInk,
  paletteSeedById,
  inkSeedById
} from "./glitter-algebra.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const normalizeHue = (value) => ((value % 360) + 360) % 360;

const DEFAULT_LEGACY_PRESET_RECIPE = toLegacyPresetRecipe({
  palette: paletteSeedById.get("rainbowChrome"),
  ink: inkSeedById.get("chrome")
});

function toLegacyPresetRecipe({ palette, ink }) {
  const sparkleProfile = ink.sparkleProfile || palette.sparkleProfile;
  const sparkleMotion = ink.sparkleMotion || palette.sparkleMotion;

  return {
    meta: {
      id: ink.meta.id,
      label: ink.meta.label,
      note: ink.meta.note
    },
    finish: {
      blendMode: palette.finish.blendMode,
      glintStyle: palette.finish.glintStyle,
      sheenSpeed: palette.finish.sheenSpeed
    },
    body: {
      stretch: palette.bodyProfile.stretch,
      squeeze: palette.bodyProfile.squeeze,
      sprayScatter: palette.bodyProfile.sprayScatter,
      pigmentAlpha: palette.bodyProfile.pigmentAlpha,
      highlightAlpha: palette.bodyProfile.highlightAlpha,
      edgeAlpha: palette.bodyProfile.edgeAlpha,
      paletteStops: ink.body.paletteStops
    },
    paletteMotion: {
      hueBase: ink.body.hueBase,
      sinProgressFreq: palette.bodyMotion.sinProgressFreq,
      sinSeedFreq: palette.bodyMotion.sinSeedFreq,
      sinAmplitude: palette.bodyMotion.sinAmplitude,
      cosProgressFreq: palette.bodyMotion.cosProgressFreq,
      cosSeedFreq: palette.bodyMotion.cosSeedFreq,
      cosAmplitude: palette.bodyMotion.cosAmplitude
    },
    shine: {
      hueBase: ink.shine.hueBase,
      progressFreq: palette.shineMotion.progressFreq,
      seedFreq: palette.shineMotion.seedFreq,
      amplitude: palette.shineMotion.amplitude,
      saturation: ink.shine.saturation,
      lightness: ink.shine.lightness,
      alpha: ink.shine.alpha
    },
    rim: {
      hueBase: ink.rim.hueBase,
      progressFreq: palette.rimMotion.progressFreq,
      seedFreq: palette.rimMotion.seedFreq,
      amplitude: palette.rimMotion.amplitude,
      saturation: ink.rim.saturation,
      lightness: ink.rim.lightness,
      alpha: ink.rim.alpha
    },
    shadow: {
      color: ink.shadow.color
    },
    sparkle: {
      baseColors: ink.sparkle.baseColors,
      density: sparkleProfile.density,
      sizeMin: sparkleProfile.sizeMin,
      sizeMax: sparkleProfile.sizeMax,
      hueRange: sparkleProfile.hueRange,
      brightnessMin: sparkleProfile.brightnessMin,
      brightnessMax: sparkleProfile.brightnessMax,
      driftMin: sparkleProfile.driftMin,
      driftMax: sparkleProfile.driftMax,
      hotspotChance: sparkleProfile.hotspotChance,
      hotspotBoost: sparkleProfile.hotspotBoost
    },
    sparkleMotion: {
      hueBase: ink.sparkle.hueBase,
      hueOffsetScale: sparkleMotion.hueOffsetScale,
      timeSinSpeed: sparkleMotion.timeSinSpeed,
      timeSinAmplitude: sparkleMotion.timeSinAmplitude,
      timeCosSpeed: sparkleMotion.timeCosSpeed,
      timeCosAmplitude: sparkleMotion.timeCosAmplitude,
      saturationBase: ink.sparkle.saturationBase,
      saturationAmplitude: ink.sparkle.saturationAmplitude,
      lightnessBase: ink.sparkle.lightnessBase,
      lightnessAmplitude: ink.sparkle.lightnessAmplitude,
      alpha: ink.sparkle.alpha
    }
  };
}

function parseHexColor(value) {
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
}

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

function normalizePresetRecipe(raw) {
  const fallback = DEFAULT_LEGACY_PRESET_RECIPE;
  const recipe = raw && typeof raw === "object" ? raw : {};
  const meta = recipe.meta && typeof recipe.meta === "object" ? recipe.meta : {};
  const finish = recipe.finish && typeof recipe.finish === "object" ? recipe.finish : {};
  const body = recipe.body && typeof recipe.body === "object" ? recipe.body : {};
  const paletteMotion = recipe.paletteMotion && typeof recipe.paletteMotion === "object" ? recipe.paletteMotion : {};
  const shine = recipe.shine && typeof recipe.shine === "object" ? recipe.shine : {};
  const rim = recipe.rim && typeof recipe.rim === "object" ? recipe.rim : {};
  const shadow = recipe.shadow && typeof recipe.shadow === "object" ? recipe.shadow : {};
  const sparkle = recipe.sparkle && typeof recipe.sparkle === "object" ? recipe.sparkle : {};
  const sparkleMotion = recipe.sparkleMotion && typeof recipe.sparkleMotion === "object" ? recipe.sparkleMotion : {};

  const sizeMin = clamp(toFiniteNumber(sparkle.sizeMin, fallback.sparkle.sizeMin), 0.4, 8);
  const driftMin = clamp(toFiniteNumber(sparkle.driftMin, fallback.sparkle.driftMin), 0, 2);
  const brightnessMin = clamp(toFiniteNumber(sparkle.brightnessMin, fallback.sparkle.brightnessMin), 0.1, 2);

  return {
    meta: {
      id: normalizeId(meta.id ?? meta.label, fallback.meta.id).toLowerCase(),
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
    body: {
      stretch: clamp(toFiniteNumber(body.stretch, fallback.body.stretch), 0.7, 1.5),
      squeeze: clamp(toFiniteNumber(body.squeeze, fallback.body.squeeze), 0.6, 1.1),
      sprayScatter: clamp(toFiniteNumber(body.sprayScatter, fallback.body.sprayScatter), 6, 32),
      pigmentAlpha: clampAlpha(body.pigmentAlpha, fallback.body.pigmentAlpha),
      highlightAlpha: clampAlpha(body.highlightAlpha, fallback.body.highlightAlpha),
      edgeAlpha: clampAlpha(body.edgeAlpha, fallback.body.edgeAlpha),
      paletteStops: normalizePaletteStops(body.paletteStops, fallback.body.paletteStops)
    },
    paletteMotion: {
      hueBase: normalizeHue(toFiniteNumber(paletteMotion.hueBase, fallback.paletteMotion.hueBase)),
      sinProgressFreq: clampFrequency(paletteMotion.sinProgressFreq, fallback.paletteMotion.sinProgressFreq),
      sinSeedFreq: clampFrequency(paletteMotion.sinSeedFreq, fallback.paletteMotion.sinSeedFreq),
      sinAmplitude: clampHueAmplitude(paletteMotion.sinAmplitude, fallback.paletteMotion.sinAmplitude),
      cosProgressFreq: clampFrequency(paletteMotion.cosProgressFreq, fallback.paletteMotion.cosProgressFreq),
      cosSeedFreq: clampFrequency(paletteMotion.cosSeedFreq, fallback.paletteMotion.cosSeedFreq),
      cosAmplitude: clampHueAmplitude(paletteMotion.cosAmplitude, fallback.paletteMotion.cosAmplitude)
    },
    shine: {
      hueBase: normalizeHue(toFiniteNumber(shine.hueBase, fallback.shine.hueBase)),
      progressFreq: clampFrequency(shine.progressFreq, fallback.shine.progressFreq),
      seedFreq: clampFrequency(shine.seedFreq, fallback.shine.seedFreq),
      amplitude: clampHueAmplitude(shine.amplitude, fallback.shine.amplitude),
      saturation: clampColorChannel(shine.saturation, fallback.shine.saturation),
      lightness: clampColorChannel(shine.lightness, fallback.shine.lightness),
      alpha: clampAlpha(shine.alpha, fallback.shine.alpha)
    },
    rim: {
      hueBase: normalizeHue(toFiniteNumber(rim.hueBase, fallback.rim.hueBase)),
      progressFreq: clampFrequency(rim.progressFreq, fallback.rim.progressFreq),
      seedFreq: clampFrequency(rim.seedFreq, fallback.rim.seedFreq),
      amplitude: clampHueAmplitude(rim.amplitude, fallback.rim.amplitude),
      saturation: clampColorChannel(rim.saturation, fallback.rim.saturation),
      lightness: clampColorChannel(rim.lightness, fallback.rim.lightness),
      alpha: clampAlpha(rim.alpha, fallback.rim.alpha)
    },
    shadow: {
      color: normalizeColorString(shadow.color, fallback.shadow.color)
    },
    sparkle: {
      baseColors: normalizeSparkleColors(sparkle.baseColors, fallback.sparkle.baseColors),
      density: clamp(toFiniteNumber(sparkle.density, fallback.sparkle.density), 0, 0.14),
      sizeMin,
      sizeMax: clamp(toFiniteNumber(sparkle.sizeMax, fallback.sparkle.sizeMax), Math.max(0.8, sizeMin), 10),
      hueRange: clamp(toFiniteNumber(sparkle.hueRange, fallback.sparkle.hueRange), 0, 360),
      brightnessMin,
      brightnessMax: clamp(toFiniteNumber(sparkle.brightnessMax, fallback.sparkle.brightnessMax), brightnessMin, 2),
      driftMin,
      driftMax: clamp(toFiniteNumber(sparkle.driftMax, fallback.sparkle.driftMax), driftMin, 2),
      hotspotChance: clamp(toFiniteNumber(sparkle.hotspotChance, fallback.sparkle.hotspotChance), 0, 0.4),
      hotspotBoost: clamp(toFiniteNumber(sparkle.hotspotBoost, fallback.sparkle.hotspotBoost), 1, 2.2)
    },
    sparkleMotion: {
      hueBase: normalizeHue(toFiniteNumber(sparkleMotion.hueBase, fallback.sparkleMotion.hueBase)),
      hueOffsetScale: clamp(toFiniteNumber(sparkleMotion.hueOffsetScale, fallback.sparkleMotion.hueOffsetScale), 0, 2),
      timeSinSpeed: clampTimeSpeed(sparkleMotion.timeSinSpeed, fallback.sparkleMotion.timeSinSpeed),
      timeSinAmplitude: clampHueAmplitude(sparkleMotion.timeSinAmplitude, fallback.sparkleMotion.timeSinAmplitude),
      timeCosSpeed: clampTimeSpeed(sparkleMotion.timeCosSpeed, fallback.sparkleMotion.timeCosSpeed),
      timeCosAmplitude: clampHueAmplitude(sparkleMotion.timeCosAmplitude, fallback.sparkleMotion.timeCosAmplitude),
      saturationBase: clampColorChannel(sparkleMotion.saturationBase, fallback.sparkleMotion.saturationBase),
      saturationAmplitude: clampColorChannel(sparkleMotion.saturationAmplitude, fallback.sparkleMotion.saturationAmplitude),
      lightnessBase: clampColorChannel(sparkleMotion.lightnessBase, fallback.sparkleMotion.lightnessBase),
      lightnessAmplitude: clampColorChannel(sparkleMotion.lightnessAmplitude, fallback.sparkleMotion.lightnessAmplitude),
      alpha: clampAlpha(sparkleMotion.alpha, fallback.sparkleMotion.alpha)
    }
  };
}

function upgradeLegacyRecipeToPaletteInk(recipe) {
  const normalized = normalizePresetRecipe(recipe);
  const paletteId = `${normalized.meta.id || "custom"}-palette`;

  return {
    palette: normalizePaletteDefinition({
      meta: {
        id: paletteId,
        label: `${normalized.meta.label} Palette`,
        note: `Imported from legacy preset "${normalized.meta.label}".`
      },
      finish: {
        blendMode: normalized.finish.blendMode,
        glintStyle: normalized.finish.glintStyle,
        sheenSpeed: normalized.finish.sheenSpeed
      },
      bodyProfile: {
        stretch: normalized.body.stretch,
        squeeze: normalized.body.squeeze,
        sprayScatter: normalized.body.sprayScatter,
        pigmentAlpha: normalized.body.pigmentAlpha,
        highlightAlpha: normalized.body.highlightAlpha,
        edgeAlpha: normalized.body.edgeAlpha
      },
      bodyMotion: {
        sinProgressFreq: normalized.paletteMotion.sinProgressFreq,
        sinSeedFreq: normalized.paletteMotion.sinSeedFreq,
        sinAmplitude: normalized.paletteMotion.sinAmplitude,
        cosProgressFreq: normalized.paletteMotion.cosProgressFreq,
        cosSeedFreq: normalized.paletteMotion.cosSeedFreq,
        cosAmplitude: normalized.paletteMotion.cosAmplitude
      },
      shineMotion: {
        progressFreq: normalized.shine.progressFreq,
        seedFreq: normalized.shine.seedFreq,
        amplitude: normalized.shine.amplitude
      },
      rimMotion: {
        progressFreq: normalized.rim.progressFreq,
        seedFreq: normalized.rim.seedFreq,
        amplitude: normalized.rim.amplitude
      }
    }),
    ink: normalizeInkDefinition({
      meta: {
        id: normalized.meta.id || "custom-ink",
        paletteId,
        label: normalized.meta.label,
        note: normalized.meta.note
      },
      body: {
        hueBase: normalized.paletteMotion.hueBase,
        paletteStops: normalized.body.paletteStops
      },
      shine: {
        hueBase: normalized.shine.hueBase,
        saturation: normalized.shine.saturation,
        lightness: normalized.shine.lightness,
        alpha: normalized.shine.alpha
      },
      rim: {
        hueBase: normalized.rim.hueBase,
        saturation: normalized.rim.saturation,
        lightness: normalized.rim.lightness,
        alpha: normalized.rim.alpha
      },
      shadow: {
        color: normalized.shadow.color
      },
      sparkle: {
        baseColors: normalized.sparkle.baseColors,
        hueBase: normalized.sparkleMotion.hueBase,
        saturationBase: normalized.sparkleMotion.saturationBase,
        saturationAmplitude: normalized.sparkleMotion.saturationAmplitude,
        lightnessBase: normalized.sparkleMotion.lightnessBase,
        lightnessAmplitude: normalized.sparkleMotion.lightnessAmplitude,
        alpha: normalized.sparkleMotion.alpha
      },
      sparkleProfile: {
        density: normalized.sparkle.density,
        sizeMin: normalized.sparkle.sizeMin,
        sizeMax: normalized.sparkle.sizeMax,
        hueRange: normalized.sparkle.hueRange,
        brightnessMin: normalized.sparkle.brightnessMin,
        brightnessMax: normalized.sparkle.brightnessMax,
        driftMin: normalized.sparkle.driftMin,
        driftMax: normalized.sparkle.driftMax,
        hotspotChance: normalized.sparkle.hotspotChance,
        hotspotBoost: normalized.sparkle.hotspotBoost
      },
      sparkleMotion: {
        hueOffsetScale: normalized.sparkleMotion.hueOffsetScale,
        timeSinSpeed: normalized.sparkleMotion.timeSinSpeed,
        timeSinAmplitude: normalized.sparkleMotion.timeSinAmplitude,
        timeCosSpeed: normalized.sparkleMotion.timeCosSpeed,
        timeCosAmplitude: normalized.sparkleMotion.timeCosAmplitude
      }
    })
  };
}

function fromPreset(recipe) {
  return fromPaletteInk(upgradeLegacyRecipeToPaletteInk(recipe));
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

function generatePresetSnippet(recipe) {
  const normalized = normalizePresetRecipe(recipe);
  return `fromPreset(${formatValue(normalized, 0)}),`;
}

export {
  blendModeOptions,
  glintStyleOptions,
  normalizePresetRecipe,
  upgradeLegacyRecipeToPaletteInk,
  fromPreset,
  generatePresetSnippet
};
