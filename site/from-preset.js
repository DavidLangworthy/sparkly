import {
  createInkPreset
} from "./ink.js";

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

const DEFAULT_PRESET_RECIPE = {
  meta: {
    id: "chrome",
    label: "Rainbow Chrome",
    note: "A shifting chrome ribbon with prismatic sparkles and rotating color flips."
  },
  finish: {
    blendMode: "lighter",
    glintStyle: "prism",
    sheenSpeed: 1.3
  },
  body: {
    stretch: 1.24,
    squeeze: 0.8,
    sprayScatter: 22,
    pigmentAlpha: 0.82,
    highlightAlpha: 0.46,
    edgeAlpha: 0.2,
    paletteStops: [
      { hueShift: -56, saturation: 74, lightness: 36, alpha: 0.92 },
      { hueShift: 0, saturation: 94, lightness: 58, alpha: 0.9 },
      { hueShift: 118, saturation: 82, lightness: 64, alpha: 0.84 },
      { hueShift: 176, saturation: 86, lightness: 78, alpha: 0.88 }
    ]
  },
  paletteMotion: {
    hueBase: 220,
    sinProgressFreq: 1.28,
    sinSeedFreq: 5.6,
    sinAmplitude: 92,
    cosProgressFreq: 0.36,
    cosSeedFreq: 2.4,
    cosAmplitude: 36
  },
  shine: {
    hueBase: 180,
    progressFreq: 1.08,
    seedFreq: 3.8,
    amplitude: 44,
    saturation: 100,
    lightness: 88,
    alpha: 0.88
  },
  rim: {
    hueBase: 316,
    progressFreq: 0.9,
    seedFreq: 4.1,
    amplitude: 42,
    saturation: 80,
    lightness: 80,
    alpha: 0.3
  },
  shadow: {
    color: "rgba(52, 66, 112, 0.14)"
  },
  sparkle: {
    baseColors: ["#ffffff", "rgba(255,160,221,0.92)", "rgba(114,239,245,0.92)"],
    density: 0.07,
    sizeMin: 1.8,
    sizeMax: 5.6,
    hueRange: 320,
    brightnessMin: 0.55,
    brightnessMax: 1.25,
    driftMin: 0.18,
    driftMax: 1.12,
    hotspotChance: 0,
    hotspotBoost: 1
  },
  sparkleMotion: {
    hueBase: 220,
    hueOffsetScale: 1,
    timeSinSpeed: 0.0011,
    timeSinAmplitude: 64,
    timeCosSpeed: 0.0008,
    timeCosAmplitude: 18,
    saturationBase: 100,
    saturationAmplitude: 0,
    lightnessBase: 74,
    lightnessAmplitude: 8,
    alpha: 0.95
  }
};

const RAW_MIXER_SEED_PRESETS = [
  {
    meta: {
      id: "gold",
      label: "Metallic Gold",
      note: "Antique-to-champagne foil with brighter metallic fire and sharper flash points."
    },
    finish: {
      blendMode: "lighter",
      glintStyle: "foil",
      sheenSpeed: 0.94
    },
    body: {
      stretch: 1.2,
      squeeze: 0.84,
      sprayScatter: 18,
      pigmentAlpha: 0.84,
      highlightAlpha: 0.42,
      edgeAlpha: 0.22,
      paletteStops: [
        { hueShift: -14, saturation: 68, lightness: 16, alpha: 0.96 },
        { hueShift: -4, saturation: 78, lightness: 34, alpha: 0.95 },
        { hueShift: 8, saturation: 94, lightness: 54, alpha: 0.92 },
        { hueShift: 18, saturation: 100, lightness: 84, alpha: 0.86 }
      ]
    },
    paletteMotion: {
      hueBase: 43,
      sinProgressFreq: 1.02,
      sinSeedFreq: 4.2,
      sinAmplitude: 11,
      cosProgressFreq: 0.22,
      cosSeedFreq: 2.6,
      cosAmplitude: 4
    },
    shine: {
      hueBase: 50,
      progressFreq: 0.8,
      seedFreq: 5,
      amplitude: 14,
      saturation: 100,
      lightness: 92,
      alpha: 0.94
    },
    rim: {
      hueBase: 56,
      progressFreq: 0.56,
      seedFreq: 4.2,
      amplitude: 18,
      saturation: 92,
      lightness: 84,
      alpha: 0.34
    },
    shadow: {
      color: "rgba(68, 38, 6, 0.22)"
    },
    sparkle: {
      baseColors: ["rgba(255,248,223,0.96)", "rgba(250,219,142,0.95)"],
      density: 0.064,
      sizeMin: 1.7,
      sizeMax: 5.3,
      hueRange: 180,
      brightnessMin: 0.7,
      brightnessMax: 1.55,
      driftMin: 0.22,
      driftMax: 1.2,
      hotspotChance: 0.08,
      hotspotBoost: 1.45
    },
    sparkleMotion: {
      hueBase: 55,
      hueOffsetScale: 0.08,
      timeSinSpeed: 0.0011,
      timeSinAmplitude: 9,
      timeCosSpeed: 0.0007,
      timeCosAmplitude: 3,
      saturationBase: 100,
      saturationAmplitude: 0,
      lightnessBase: 83,
      lightnessAmplitude: 5,
      alpha: 0.96
    }
  },
  {
    meta: {
      id: "silver",
      label: "Metallic Silver",
      note: "Layered steel foil with icy cyan-lilac flashes and brighter mirror cuts."
    },
    finish: {
      blendMode: "lighter",
      glintStyle: "foil",
      sheenSpeed: 1.14
    },
    body: {
      stretch: 1.18,
      squeeze: 0.82,
      sprayScatter: 16,
      pigmentAlpha: 0.82,
      highlightAlpha: 0.46,
      edgeAlpha: 0.26,
      paletteStops: [
        { hueShift: -18, saturation: 18, lightness: 16, alpha: 0.96 },
        { hueShift: -4, saturation: 18, lightness: 36, alpha: 0.94 },
        { hueShift: 8, saturation: 20, lightness: 74, alpha: 0.9 },
        { hueShift: 30, saturation: 42, lightness: 96, alpha: 0.88 }
      ]
    },
    paletteMotion: {
      hueBase: 214,
      sinProgressFreq: 1.12,
      sinSeedFreq: 6.4,
      sinAmplitude: 20,
      cosProgressFreq: 0.26,
      cosSeedFreq: 3.4,
      cosAmplitude: 4
    },
    shine: {
      hueBase: 216,
      progressFreq: 0.92,
      seedFreq: 5.1,
      amplitude: 24,
      saturation: 64,
      lightness: 97,
      alpha: 0.94
    },
    rim: {
      hueBase: 242,
      progressFreq: 0.76,
      seedFreq: 4.8,
      amplitude: 26,
      saturation: 56,
      lightness: 88,
      alpha: 0.34
    },
    shadow: {
      color: "rgba(56, 66, 82, 0.2)"
    },
    sparkle: {
      baseColors: ["rgba(255,255,255,0.96)", "rgba(204,228,255,0.94)"],
      density: 0.066,
      sizeMin: 1.6,
      sizeMax: 5.1,
      hueRange: 220,
      brightnessMin: 0.72,
      brightnessMax: 1.6,
      driftMin: 0.2,
      driftMax: 1.18,
      hotspotChance: 0.1,
      hotspotBoost: 1.5
    },
    sparkleMotion: {
      hueBase: 220,
      hueOffsetScale: 0.08,
      timeSinSpeed: 0.0013,
      timeSinAmplitude: 24,
      timeCosSpeed: 0.0009,
      timeCosAmplitude: 10,
      saturationBase: 88,
      saturationAmplitude: 8,
      lightnessBase: 84,
      lightnessAmplitude: 6,
      alpha: 0.95
    }
  },
  DEFAULT_PRESET_RECIPE,
  {
    meta: {
      id: "pearl",
      label: "Pearl Mist",
      note: "Milky pearl with mint-lilac interference and brighter opaline flashes."
    },
    finish: {
      blendMode: "lighter",
      glintStyle: "prism",
      sheenSpeed: 0.86
    },
    body: {
      stretch: 1.14,
      squeeze: 0.9,
      sprayScatter: 16,
      pigmentAlpha: 0.74,
      highlightAlpha: 0.36,
      edgeAlpha: 0.16,
      paletteStops: [
        { hueShift: -78, saturation: 10, lightness: 56, alpha: 0.64 },
        { hueShift: -12, saturation: 16, lightness: 80, alpha: 0.78 },
        { hueShift: 42, saturation: 28, lightness: 92, alpha: 0.82 },
        { hueShift: 92, saturation: 44, lightness: 97, alpha: 0.88 }
      ]
    },
    paletteMotion: {
      hueBase: 206,
      sinProgressFreq: 1.5,
      sinSeedFreq: 7.2,
      sinAmplitude: 34,
      cosProgressFreq: 0.32,
      cosSeedFreq: 2.8,
      cosAmplitude: 10
    },
    shine: {
      hueBase: 208,
      progressFreq: 1.1,
      seedFreq: 4.2,
      amplitude: 26,
      saturation: 54,
      lightness: 97,
      alpha: 0.9
    },
    rim: {
      hueBase: 318,
      progressFreq: 0.9,
      seedFreq: 4.1,
      amplitude: 18,
      saturation: 42,
      lightness: 90,
      alpha: 0.28
    },
    shadow: {
      color: "rgba(120, 112, 128, 0.12)"
    },
    sparkle: {
      baseColors: ["rgba(255,248,255,0.95)", "rgba(201,244,255,0.9)", "rgba(255,213,235,0.9)"],
      density: 0.07,
      sizeMin: 1.8,
      sizeMax: 5.4,
      hueRange: 260,
      brightnessMin: 0.75,
      brightnessMax: 1.7,
      driftMin: 0.22,
      driftMax: 1.24,
      hotspotChance: 0.12,
      hotspotBoost: 1.5
    },
    sparkleMotion: {
      hueBase: 206,
      hueOffsetScale: 0.16,
      timeSinSpeed: 0.0011,
      timeSinAmplitude: 54,
      timeCosSpeed: 0,
      timeCosAmplitude: 0,
      saturationBase: 68,
      saturationAmplitude: 10,
      lightnessBase: 90,
      lightnessAmplitude: 4,
      alpha: 0.94
    }
  },
  {
    meta: {
      id: "opal",
      label: "Opal Veil",
      note: "Pale aqua-lilac pigment with peach fire and drifting opalescent flashes."
    },
    finish: {
      blendMode: "screen",
      glintStyle: "prism",
      sheenSpeed: 0.92
    },
    body: {
      stretch: 1.16,
      squeeze: 0.86,
      sprayScatter: 19,
      pigmentAlpha: 0.78,
      highlightAlpha: 0.36,
      edgeAlpha: 0.16,
      paletteStops: [
        { hueShift: -12, saturation: 44, lightness: 60, alpha: 0.76 },
        { hueShift: 84, saturation: 56, lightness: 84, alpha: 0.8 },
        { hueShift: 156, saturation: 78, lightness: 94, alpha: 0.9 },
        { hueShift: 212, saturation: 72, lightness: 88, alpha: 0.86 }
      ]
    },
    paletteMotion: {
      hueBase: 162,
      sinProgressFreq: 1.45,
      sinSeedFreq: 8.6,
      sinAmplitude: 42,
      cosProgressFreq: 0.3,
      cosSeedFreq: 2.3,
      cosAmplitude: 12
    },
    shine: {
      hueBase: 176,
      progressFreq: 1.08,
      seedFreq: 3.8,
      amplitude: 28,
      saturation: 88,
      lightness: 93,
      alpha: 0.9
    },
    rim: {
      hueBase: 304,
      progressFreq: 0.9,
      seedFreq: 4.1,
      amplitude: 24,
      saturation: 78,
      lightness: 88,
      alpha: 0.3
    },
    shadow: {
      color: "rgba(105, 145, 150, 0.1)"
    },
    sparkle: {
      baseColors: ["rgba(230,255,246,0.94)", "rgba(221,224,255,0.94)", "rgba(255,219,252,0.92)"],
      density: 0.064,
      sizeMin: 1.7,
      sizeMax: 5.4,
      hueRange: 260,
      brightnessMin: 0.58,
      brightnessMax: 1.34,
      driftMin: 0.18,
      driftMax: 1.12,
      hotspotChance: 0,
      hotspotBoost: 1
    },
    sparkleMotion: {
      hueBase: 178,
      hueOffsetScale: 0.18,
      timeSinSpeed: 0.0011,
      timeSinAmplitude: 64,
      timeCosSpeed: 0,
      timeCosAmplitude: 0,
      saturationBase: 92,
      saturationAmplitude: 0,
      lightnessBase: 84,
      lightnessAmplitude: 0,
      alpha: 0.94
    }
  },
  {
    meta: {
      id: "rose",
      label: "Rose Foil",
      note: "Rose foil with plum-copper body color and brighter champagne flash."
    },
    finish: {
      blendMode: "lighter",
      glintStyle: "foil",
      sheenSpeed: 1.12
    },
    body: {
      stretch: 1.22,
      squeeze: 0.82,
      sprayScatter: 18,
      pigmentAlpha: 0.84,
      highlightAlpha: 0.44,
      edgeAlpha: 0.2,
      paletteStops: [
        { hueShift: -10, saturation: 34, lightness: 18, alpha: 0.96 },
        { hueShift: 2, saturation: 44, lightness: 36, alpha: 0.95 },
        { hueShift: 16, saturation: 66, lightness: 68, alpha: 0.9 },
        { hueShift: 32, saturation: 100, lightness: 88, alpha: 0.84 }
      ]
    },
    paletteMotion: {
      hueBase: 352,
      sinProgressFreq: 1.04,
      sinSeedFreq: 5.6,
      sinAmplitude: 14,
      cosProgressFreq: 0.24,
      cosSeedFreq: 2.5,
      cosAmplitude: 4
    },
    shine: {
      hueBase: 24,
      progressFreq: 0.82,
      seedFreq: 4.3,
      amplitude: 12,
      saturation: 100,
      lightness: 92,
      alpha: 0.94
    },
    rim: {
      hueBase: 4,
      progressFreq: 0.68,
      seedFreq: 4.1,
      amplitude: 16,
      saturation: 78,
      lightness: 86,
      alpha: 0.32
    },
    shadow: {
      color: "rgba(88, 38, 48, 0.18)"
    },
    sparkle: {
      baseColors: ["rgba(255,227,225,0.95)", "rgba(255,183,190,0.92)", "rgba(255,235,194,0.9)"],
      density: 0.063,
      sizeMin: 1.6,
      sizeMax: 5,
      hueRange: 170,
      brightnessMin: 0.7,
      brightnessMax: 1.5,
      driftMin: 0.2,
      driftMax: 1.16,
      hotspotChance: 0.08,
      hotspotBoost: 1.42
    },
    sparkleMotion: {
      hueBase: 17,
      hueOffsetScale: 0.08,
      timeSinSpeed: 0.0012,
      timeSinAmplitude: 8,
      timeCosSpeed: 0.0007,
      timeCosAmplitude: 3,
      saturationBase: 96,
      saturationAmplitude: 0,
      lightnessBase: 87,
      lightnessAmplitude: 5,
      alpha: 0.95
    }
  },
  {
    meta: {
      id: "galaxy",
      label: "Galaxy Dust",
      note: "Black-opal ink with smoky body color and slow spectral star flashes."
    },
    finish: {
      blendMode: "lighter",
      glintStyle: "dust",
      sheenSpeed: 1.22
    },
    body: {
      stretch: 1.12,
      squeeze: 0.88,
      sprayScatter: 24,
      pigmentAlpha: 0.78,
      highlightAlpha: 0.32,
      edgeAlpha: 0.18,
      paletteStops: [
        { hueShift: -24, saturation: 24, lightness: 8, alpha: 0.96 },
        { hueShift: 38, saturation: 46, lightness: 24, alpha: 0.88 },
        { hueShift: 110, saturation: 82, lightness: 68, alpha: 0.82 },
        { hueShift: 168, saturation: 74, lightness: 80, alpha: 0.72 }
      ]
    },
    paletteMotion: {
      hueBase: 196,
      sinProgressFreq: 1.18,
      sinSeedFreq: 6.9,
      sinAmplitude: 54,
      cosProgressFreq: 0.24,
      cosSeedFreq: 2.2,
      cosAmplitude: 16
    },
    shine: {
      hueBase: 214,
      progressFreq: 1,
      seedFreq: 4.2,
      amplitude: 36,
      saturation: 82,
      lightness: 76,
      alpha: 0.78
    },
    rim: {
      hueBase: 302,
      progressFreq: 0.72,
      seedFreq: 4.6,
      amplitude: 28,
      saturation: 74,
      lightness: 72,
      alpha: 0.24
    },
    shadow: {
      color: "rgba(7, 10, 20, 0.28)"
    },
    sparkle: {
      baseColors: ["rgba(232,239,255,0.96)", "rgba(150,224,255,0.92)", "rgba(255,194,254,0.88)"],
      density: 0.085,
      sizeMin: 1.2,
      sizeMax: 5.8,
      hueRange: 320,
      brightnessMin: 0.55,
      brightnessMax: 1.3,
      driftMin: 0.18,
      driftMax: 1.12,
      hotspotChance: 0,
      hotspotBoost: 1
    },
    sparkleMotion: {
      hueBase: 205,
      hueOffsetScale: 0.34,
      timeSinSpeed: 0.0013,
      timeSinAmplitude: 68,
      timeCosSpeed: 0,
      timeCosAmplitude: 0,
      saturationBase: 100,
      saturationAmplitude: 0,
      lightnessBase: 80,
      lightnessAmplitude: 0,
      alpha: 0.94
    }
  },
  {
    meta: {
      id: "ember",
      label: "Ember Glitter",
      note: "Hot ember pigment with rose-gold sparks and a faster firefly flicker."
    },
    finish: {
      blendMode: "lighter",
      glintStyle: "ember",
      sheenSpeed: 1.42
    },
    body: {
      stretch: 1.18,
      squeeze: 0.82,
      sprayScatter: 22,
      pigmentAlpha: 0.86,
      highlightAlpha: 0.36,
      edgeAlpha: 0.16,
      paletteStops: [
        { hueShift: -8, saturation: 72, lightness: 28, alpha: 0.95 },
        { hueShift: 4, saturation: 88, lightness: 52, alpha: 0.92 },
        { hueShift: 32, saturation: 96, lightness: 72, alpha: 0.86 },
        { hueShift: 58, saturation: 92, lightness: 82, alpha: 0.8 }
      ]
    },
    paletteMotion: {
      hueBase: 18,
      sinProgressFreq: 1.12,
      sinSeedFreq: 6.1,
      sinAmplitude: 10,
      cosProgressFreq: 0.28,
      cosSeedFreq: 2.2,
      cosAmplitude: 3
    },
    shine: {
      hueBase: 34,
      progressFreq: 0.88,
      seedFreq: 4.9,
      amplitude: 12,
      saturation: 100,
      lightness: 84,
      alpha: 0.88
    },
    rim: {
      hueBase: 20,
      progressFreq: 0.8,
      seedFreq: 3.9,
      amplitude: 14,
      saturation: 90,
      lightness: 72,
      alpha: 0.24
    },
    shadow: {
      color: "rgba(104, 24, 9, 0.16)"
    },
    sparkle: {
      baseColors: ["rgba(255,244,193,0.96)", "rgba(255,188,84,0.95)", "rgba(255,123,62,0.92)", "rgba(255,154,136,0.9)"],
      density: 0.072,
      sizeMin: 1.4,
      sizeMax: 5.1,
      hueRange: 180,
      brightnessMin: 0.58,
      brightnessMax: 1.42,
      driftMin: 0.18,
      driftMax: 1.12,
      hotspotChance: 0,
      hotspotBoost: 1
    },
    sparkleMotion: {
      hueBase: 22,
      hueOffsetScale: 0.08,
      timeSinSpeed: 0.0018,
      timeSinAmplitude: 22,
      timeCosSpeed: 0,
      timeCosAmplitude: 0,
      saturationBase: 100,
      saturationAmplitude: 0,
      lightnessBase: 74,
      lightnessAmplitude: 0,
      alpha: 0.95
    }
  }
];

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

function slugifyId(value) {
  const normalized = typeof value === "string"
    ? value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
    : "";
  return normalized || "custom-ink";
}

function isRgbColorString(value) {
  return /^rgba?\(\s*[-\d.\s,%]+\)$/i.test(value.trim());
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
  const fallback = DEFAULT_PRESET_RECIPE;
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

  return {
    meta: {
      id: slugifyId(meta.id ?? meta.label ?? fallback.meta.id),
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
      sizeMin: clamp(toFiniteNumber(sparkle.sizeMin, fallback.sparkle.sizeMin), 0.4, 8),
      sizeMax: clamp(
        toFiniteNumber(sparkle.sizeMax, fallback.sparkle.sizeMax),
        Math.max(0.8, clamp(toFiniteNumber(sparkle.sizeMin, fallback.sparkle.sizeMin), 0.4, 8)),
        10
      ),
      hueRange: clamp(toFiniteNumber(sparkle.hueRange, fallback.sparkle.hueRange), 0, 360),
      brightnessMin: clamp(toFiniteNumber(sparkle.brightnessMin, fallback.sparkle.brightnessMin), 0.1, 2),
      brightnessMax: clamp(toFiniteNumber(sparkle.brightnessMax, fallback.sparkle.brightnessMax), 0.1, 2),
      driftMin: clamp(toFiniteNumber(sparkle.driftMin, fallback.sparkle.driftMin), 0, 2),
      driftMax: clamp(toFiniteNumber(sparkle.driftMax, fallback.sparkle.driftMax), 0, 2),
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

function getPaletteHue(recipe, stamp) {
  return recipe.paletteMotion.hueBase
    + Math.sin(stamp.progress * recipe.paletteMotion.sinProgressFreq + stamp.seed * recipe.paletteMotion.sinSeedFreq)
      * recipe.paletteMotion.sinAmplitude
    + Math.cos(stamp.progress * recipe.paletteMotion.cosProgressFreq + stamp.seed * recipe.paletteMotion.cosSeedFreq)
      * recipe.paletteMotion.cosAmplitude;
}

function getPaletteFromRecipe(recipe, stamp) {
  const hue = getPaletteHue(recipe, stamp);
  return recipe.body.paletteStops.map((stop) => hsl(
    hue + stop.hueShift,
    stop.saturation,
    stop.lightness,
    stop.alpha
  ));
}

function fromPreset(recipe) {
  const normalized = normalizePresetRecipe(recipe);
  const neutralPalette = getPaletteFromRecipe(normalized, { progress: 0, seed: 0 });

  return createInkPreset({
    id: normalized.meta.id,
    label: normalized.meta.label,
    note: normalized.meta.note,
    baseColors: neutralPalette.slice(0, 3),
    sparkleColors: normalized.sparkle.baseColors,
    blendMode: normalized.finish.blendMode,
    sheenSpeed: normalized.finish.sheenSpeed,
    sparkleDensity: normalized.sparkle.density,
    sparkleSizeRange: [normalized.sparkle.sizeMin, normalized.sparkle.sizeMax],
    sparkleHueRange: normalized.sparkle.hueRange,
    sparkleBrightnessRange: [normalized.sparkle.brightnessMin, normalized.sparkle.brightnessMax],
    sparkleDriftRange: [normalized.sparkle.driftMin, normalized.sparkle.driftMax],
    sparkleHotspotChance: normalized.sparkle.hotspotChance,
    sparkleHotspotBoost: normalized.sparkle.hotspotBoost,
    sprayScatter: normalized.body.sprayScatter,
    stretch: normalized.body.stretch,
    squeeze: normalized.body.squeeze,
    pigmentAlpha: normalized.body.pigmentAlpha,
    highlightAlpha: normalized.body.highlightAlpha,
    edgeAlpha: normalized.body.edgeAlpha,
    glintStyle: normalized.finish.glintStyle,
    palette: (stamp) => getPaletteFromRecipe(normalized, stamp),
    shineColor: (stamp) => hsl(
      normalized.shine.hueBase
        + Math.sin(stamp.progress * normalized.shine.progressFreq + stamp.seed * normalized.shine.seedFreq)
          * normalized.shine.amplitude,
      normalized.shine.saturation,
      normalized.shine.lightness,
      normalized.shine.alpha
    ),
    rimColor: (stamp) => hsl(
      normalized.rim.hueBase
        + Math.cos(stamp.progress * normalized.rim.progressFreq + stamp.seed * normalized.rim.seedFreq)
          * normalized.rim.amplitude,
      normalized.rim.saturation,
      normalized.rim.lightness,
      normalized.rim.alpha
    ),
    shadowColor: () => normalized.shadow.color,
    sparkleColor: (node, time) => hsl(
      normalized.sparkleMotion.hueBase
        + node.hueOffset * normalized.sparkleMotion.hueOffsetScale
        + Math.sin(time * normalized.sparkleMotion.timeSinSpeed + node.phase) * normalized.sparkleMotion.timeSinAmplitude
        + Math.cos(time * normalized.sparkleMotion.timeCosSpeed + node.drift * 3.8) * normalized.sparkleMotion.timeCosAmplitude,
      normalized.sparkleMotion.saturationBase
        + Math.sin(node.phase * 2.1) * normalized.sparkleMotion.saturationAmplitude,
      normalized.sparkleMotion.lightnessBase
        + Math.cos(time * 0.0013 + node.phase) * normalized.sparkleMotion.lightnessAmplitude,
      normalized.sparkleMotion.alpha
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

function formatPresetValue(value, depth = 0) {
  const indent = "  ".repeat(depth);
  const nextIndent = "  ".repeat(depth + 1);

  if (Array.isArray(value)) {
    if (!value.length) {
      return "[]";
    }

    const inline = value.length <= 2 && value.every((item) => item == null || typeof item !== "object");
    if (inline) {
      return `[${value.map((item) => formatPresetValue(item, depth + 1)).join(", ")}]`;
    }

    return `[\n${value.map((item) => `${nextIndent}${formatPresetValue(item, depth + 1)}`).join(",\n")}\n${indent}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    return `{\n${entries.map(([key, item]) => `${nextIndent}${key}: ${formatPresetValue(item, depth + 1)}`).join(",\n")}\n${indent}}`;
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
  const orderedRecipe = {
    meta: normalized.meta,
    finish: normalized.finish,
    body: normalized.body,
    paletteMotion: normalized.paletteMotion,
    shine: normalized.shine,
    rim: normalized.rim,
    shadow: normalized.shadow,
    sparkle: normalized.sparkle,
    sparkleMotion: normalized.sparkleMotion
  };

  return `fromPreset(${formatPresetValue(orderedRecipe, 0)}),`;
}

const mixerSeedPresets = RAW_MIXER_SEED_PRESETS.map((seed) => normalizePresetRecipe(seed));
const mixerSeedById = new Map(mixerSeedPresets.map((seed) => [seed.meta.id, seed]));

export {
  blendModeOptions,
  glintStyleOptions,
  normalizePresetRecipe,
  fromPreset,
  generatePresetSnippet,
  mixerSeedPresets,
  mixerSeedById
};
