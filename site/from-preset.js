import {
  blendModeOptions,
  glintStyleOptions,
  upgradeLegacyRecipeToPaletteInk,
  fromPaletteInk
} from "./glitter-algebra.js";

function toLegacyPresetRecipe({ palette, ink }) {
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
      density: palette.sparkleProfile.density,
      sizeMin: palette.sparkleProfile.sizeMin,
      sizeMax: palette.sparkleProfile.sizeMax,
      hueRange: palette.sparkleProfile.hueRange,
      brightnessMin: palette.sparkleProfile.brightnessMin,
      brightnessMax: palette.sparkleProfile.brightnessMax,
      driftMin: palette.sparkleProfile.driftMin,
      driftMax: palette.sparkleProfile.driftMax,
      hotspotChance: palette.sparkleProfile.hotspotChance,
      hotspotBoost: palette.sparkleProfile.hotspotBoost
    },
    sparkleMotion: {
      hueBase: ink.sparkle.hueBase,
      hueOffsetScale: palette.sparkleMotion.hueOffsetScale,
      timeSinSpeed: palette.sparkleMotion.timeSinSpeed,
      timeSinAmplitude: palette.sparkleMotion.timeSinAmplitude,
      timeCosSpeed: palette.sparkleMotion.timeCosSpeed,
      timeCosAmplitude: palette.sparkleMotion.timeCosAmplitude,
      saturationBase: ink.sparkle.saturationBase,
      saturationAmplitude: ink.sparkle.saturationAmplitude,
      lightnessBase: ink.sparkle.lightnessBase,
      lightnessAmplitude: ink.sparkle.lightnessAmplitude,
      alpha: ink.sparkle.alpha
    }
  };
}

function normalizePresetRecipe(raw) {
  return toLegacyPresetRecipe(upgradeLegacyRecipeToPaletteInk(raw));
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
  fromPreset,
  generatePresetSnippet
};
