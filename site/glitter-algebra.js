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

const LEGACY_DEFAULT_PRESET_RECIPE = {
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

const LEGACY_RAW_SEED_PRESETS = [
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
  LEGACY_DEFAULT_PRESET_RECIPE,
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

const DEFAULT_PALETTE_RAW = {
  meta: {
    id: "rainbowChrome",
    label: "Rainbow Chrome",
    note: "Shifting chrome behavior with prismatic flips and high-energy sheen."
  },
  finish: {
    blendMode: "lighter",
    glintStyle: "prism",
    sheenSpeed: 1.3
  },
  bodyProfile: {
    stretch: 1.24,
    squeeze: 0.8,
    sprayScatter: 22,
    pigmentAlpha: 0.82,
    highlightAlpha: 0.46,
    edgeAlpha: 0.2
  },
  bodyMotion: {
    sinProgressFreq: 1.28,
    sinSeedFreq: 5.6,
    sinAmplitude: 92,
    cosProgressFreq: 0.36,
    cosSeedFreq: 2.4,
    cosAmplitude: 36
  },
  shineMotion: {
    progressFreq: 1.08,
    seedFreq: 3.8,
    amplitude: 44
  },
  rimMotion: {
    progressFreq: 0.9,
    seedFreq: 4.1,
    amplitude: 42
  },
  sparkleProfile: {
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
    hueOffsetScale: 1,
    timeSinSpeed: 0.0011,
    timeSinAmplitude: 64,
    timeCosSpeed: 0.0008,
    timeCosAmplitude: 18
  }
};

const DEFAULT_INK_RAW = {
  meta: {
    id: "chrome",
    paletteId: "rainbowChrome",
    label: "Rainbow Chrome",
    note: "A shifting chrome ribbon with prismatic sparkles and rotating color flips."
  },
  body: {
    hueBase: 220,
    paletteStops: [
      { hueShift: -56, saturation: 74, lightness: 36, alpha: 0.92 },
      { hueShift: 0, saturation: 94, lightness: 58, alpha: 0.9 },
      { hueShift: 118, saturation: 82, lightness: 64, alpha: 0.84 },
      { hueShift: 176, saturation: 86, lightness: 78, alpha: 0.88 }
    ]
  },
  shine: {
    hueBase: 180,
    saturation: 100,
    lightness: 88,
    alpha: 0.88
  },
  rim: {
    hueBase: 316,
    saturation: 80,
    lightness: 80,
    alpha: 0.3
  },
  shadow: {
    color: "rgba(52, 66, 112, 0.14)"
  },
  sparkle: {
    baseColors: ["#ffffff", "rgba(255,160,221,0.92)", "rgba(114,239,245,0.92)"],
    hueBase: 220,
    saturationBase: 100,
    saturationAmplitude: 0,
    lightnessBase: 74,
    lightnessAmplitude: 8,
    alpha: 0.95
  }
};

const METALLIC_FOIL_PALETTE_RAW = {
  meta: {
    id: "metallicFoil",
    label: "Metallic Foil",
    note: "Shared foil behavior for metallic inks with brighter hotspots and a sharper reflected edge."
  },
  finish: {
    blendMode: "lighter",
    glintStyle: "foil",
    sheenSpeed: 1.05
  },
  bodyProfile: {
    stretch: 1.2,
    squeeze: 0.83,
    sprayScatter: 18,
    pigmentAlpha: 0.83,
    highlightAlpha: 0.44,
    edgeAlpha: 0.23
  },
  bodyMotion: {
    sinProgressFreq: 1.06,
    sinSeedFreq: 5.4,
    sinAmplitude: 15,
    cosProgressFreq: 0.24,
    cosSeedFreq: 2.8,
    cosAmplitude: 4
  },
  shineMotion: {
    progressFreq: 0.85,
    seedFreq: 4.8,
    amplitude: 15
  },
  rimMotion: {
    progressFreq: 0.67,
    seedFreq: 4.4,
    amplitude: 20
  },
  sparkleProfile: {
    density: 0.064,
    sizeMin: 1.65,
    sizeMax: 5.15,
    hueRange: 190,
    brightnessMin: 0.7,
    brightnessMax: 1.55,
    driftMin: 0.21,
    driftMax: 1.18,
    hotspotChance: 0.08,
    hotspotBoost: 1.45
  },
  sparkleMotion: {
    hueOffsetScale: 0.08,
    timeSinSpeed: 0.0012,
    timeSinAmplitude: 10,
    timeCosSpeed: 0.0008,
    timeCosAmplitude: 3
  }
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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

function normalizeLegacyPresetRecipe(raw) {
  const fallback = LEGACY_DEFAULT_PRESET_RECIPE;
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

function normalizePaletteDefinition(raw) {
  const fallback = DEFAULT_PALETTE_RAW;
  const definition = raw && typeof raw === "object" ? raw : {};
  const meta = definition.meta && typeof definition.meta === "object" ? definition.meta : {};
  const finish = definition.finish && typeof definition.finish === "object" ? definition.finish : {};
  const bodyProfile = definition.bodyProfile && typeof definition.bodyProfile === "object" ? definition.bodyProfile : {};
  const bodyMotion = definition.bodyMotion && typeof definition.bodyMotion === "object" ? definition.bodyMotion : {};
  const shineMotion = definition.shineMotion && typeof definition.shineMotion === "object" ? definition.shineMotion : {};
  const rimMotion = definition.rimMotion && typeof definition.rimMotion === "object" ? definition.rimMotion : {};
  const sparkleProfile = definition.sparkleProfile && typeof definition.sparkleProfile === "object" ? definition.sparkleProfile : {};
  const sparkleMotion = definition.sparkleMotion && typeof definition.sparkleMotion === "object" ? definition.sparkleMotion : {};
  const sizeMin = clamp(toFiniteNumber(sparkleProfile.sizeMin, fallback.sparkleProfile.sizeMin), 0.4, 8);
  const driftMin = clamp(toFiniteNumber(sparkleProfile.driftMin, fallback.sparkleProfile.driftMin), 0, 2);
  const brightnessMin = clamp(toFiniteNumber(sparkleProfile.brightnessMin, fallback.sparkleProfile.brightnessMin), 0.1, 2);

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
    },
    sparkleProfile: {
      density: clamp(toFiniteNumber(sparkleProfile.density, fallback.sparkleProfile.density), 0, 0.14),
      sizeMin,
      sizeMax: clamp(toFiniteNumber(sparkleProfile.sizeMax, fallback.sparkleProfile.sizeMax), Math.max(0.8, sizeMin), 10),
      hueRange: clamp(toFiniteNumber(sparkleProfile.hueRange, fallback.sparkleProfile.hueRange), 0, 360),
      brightnessMin,
      brightnessMax: clamp(toFiniteNumber(sparkleProfile.brightnessMax, fallback.sparkleProfile.brightnessMax), brightnessMin, 2),
      driftMin,
      driftMax: clamp(toFiniteNumber(sparkleProfile.driftMax, fallback.sparkleProfile.driftMax), driftMin, 2),
      hotspotChance: clamp(toFiniteNumber(sparkleProfile.hotspotChance, fallback.sparkleProfile.hotspotChance), 0, 0.4),
      hotspotBoost: clamp(toFiniteNumber(sparkleProfile.hotspotBoost, fallback.sparkleProfile.hotspotBoost), 1, 2.2)
    },
    sparkleMotion: {
      hueOffsetScale: clamp(toFiniteNumber(sparkleMotion.hueOffsetScale, fallback.sparkleMotion.hueOffsetScale), 0, 2),
      timeSinSpeed: clampTimeSpeed(sparkleMotion.timeSinSpeed, fallback.sparkleMotion.timeSinSpeed),
      timeSinAmplitude: clampHueAmplitude(sparkleMotion.timeSinAmplitude, fallback.sparkleMotion.timeSinAmplitude),
      timeCosSpeed: clampTimeSpeed(sparkleMotion.timeCosSpeed, fallback.sparkleMotion.timeCosSpeed),
      timeCosAmplitude: clampHueAmplitude(sparkleMotion.timeCosAmplitude, fallback.sparkleMotion.timeCosAmplitude)
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
    }
  };
}

function definePalette(definition) {
  return normalizePaletteDefinition(definition);
}

function defineInk(definition) {
  return normalizeInkDefinition(definition);
}

function paletteFromLegacyPreset(recipe, metaOverride = {}) {
  return {
    meta: {
      id: metaOverride.id || `${recipe.meta.id}-palette`,
      label: metaOverride.label || `${recipe.meta.label} Palette`,
      note: metaOverride.note || recipe.meta.note
    },
    finish: {
      blendMode: recipe.finish.blendMode,
      glintStyle: recipe.finish.glintStyle,
      sheenSpeed: recipe.finish.sheenSpeed
    },
    bodyProfile: {
      stretch: recipe.body.stretch,
      squeeze: recipe.body.squeeze,
      sprayScatter: recipe.body.sprayScatter,
      pigmentAlpha: recipe.body.pigmentAlpha,
      highlightAlpha: recipe.body.highlightAlpha,
      edgeAlpha: recipe.body.edgeAlpha
    },
    bodyMotion: {
      sinProgressFreq: recipe.paletteMotion.sinProgressFreq,
      sinSeedFreq: recipe.paletteMotion.sinSeedFreq,
      sinAmplitude: recipe.paletteMotion.sinAmplitude,
      cosProgressFreq: recipe.paletteMotion.cosProgressFreq,
      cosSeedFreq: recipe.paletteMotion.cosSeedFreq,
      cosAmplitude: recipe.paletteMotion.cosAmplitude
    },
    shineMotion: {
      progressFreq: recipe.shine.progressFreq,
      seedFreq: recipe.shine.seedFreq,
      amplitude: recipe.shine.amplitude
    },
    rimMotion: {
      progressFreq: recipe.rim.progressFreq,
      seedFreq: recipe.rim.seedFreq,
      amplitude: recipe.rim.amplitude
    },
    sparkleProfile: {
      density: recipe.sparkle.density,
      sizeMin: recipe.sparkle.sizeMin,
      sizeMax: recipe.sparkle.sizeMax,
      hueRange: recipe.sparkle.hueRange,
      brightnessMin: recipe.sparkle.brightnessMin,
      brightnessMax: recipe.sparkle.brightnessMax,
      driftMin: recipe.sparkle.driftMin,
      driftMax: recipe.sparkle.driftMax,
      hotspotChance: recipe.sparkle.hotspotChance,
      hotspotBoost: recipe.sparkle.hotspotBoost
    },
    sparkleMotion: {
      hueOffsetScale: recipe.sparkleMotion.hueOffsetScale,
      timeSinSpeed: recipe.sparkleMotion.timeSinSpeed,
      timeSinAmplitude: recipe.sparkleMotion.timeSinAmplitude,
      timeCosSpeed: recipe.sparkleMotion.timeCosSpeed,
      timeCosAmplitude: recipe.sparkleMotion.timeCosAmplitude
    }
  };
}

function inkFromLegacyPreset(recipe, paletteId, metaOverride = {}) {
  return {
    meta: {
      id: metaOverride.id || recipe.meta.id,
      paletteId,
      label: metaOverride.label || recipe.meta.label,
      note: metaOverride.note || recipe.meta.note
    },
    body: {
      hueBase: recipe.paletteMotion.hueBase,
      paletteStops: clone(recipe.body.paletteStops)
    },
    shine: {
      hueBase: recipe.shine.hueBase,
      saturation: recipe.shine.saturation,
      lightness: recipe.shine.lightness,
      alpha: recipe.shine.alpha
    },
    rim: {
      hueBase: recipe.rim.hueBase,
      saturation: recipe.rim.saturation,
      lightness: recipe.rim.lightness,
      alpha: recipe.rim.alpha
    },
    shadow: {
      color: recipe.shadow.color
    },
    sparkle: {
      baseColors: clone(recipe.sparkle.baseColors),
      hueBase: recipe.sparkleMotion.hueBase,
      saturationBase: recipe.sparkleMotion.saturationBase,
      saturationAmplitude: recipe.sparkleMotion.saturationAmplitude,
      lightnessBase: recipe.sparkleMotion.lightnessBase,
      lightnessAmplitude: recipe.sparkleMotion.lightnessAmplitude,
      alpha: recipe.sparkleMotion.alpha
    }
  };
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
    sparkleDensity: normalizedPalette.sparkleProfile.density,
    sparkleSizeRange: [normalizedPalette.sparkleProfile.sizeMin, normalizedPalette.sparkleProfile.sizeMax],
    sparkleHueRange: normalizedPalette.sparkleProfile.hueRange,
    sparkleBrightnessRange: [normalizedPalette.sparkleProfile.brightnessMin, normalizedPalette.sparkleProfile.brightnessMax],
    sparkleDriftRange: [normalizedPalette.sparkleProfile.driftMin, normalizedPalette.sparkleProfile.driftMax],
    sparkleHotspotChance: normalizedPalette.sparkleProfile.hotspotChance,
    sparkleHotspotBoost: normalizedPalette.sparkleProfile.hotspotBoost,
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
        + node.hueOffset * normalizedPalette.sparkleMotion.hueOffsetScale
        + Math.sin(time * normalizedPalette.sparkleMotion.timeSinSpeed + node.phase) * normalizedPalette.sparkleMotion.timeSinAmplitude
        + Math.cos(time * normalizedPalette.sparkleMotion.timeCosSpeed + node.drift * 3.8) * normalizedPalette.sparkleMotion.timeCosAmplitude,
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

function upgradeLegacyRecipeToPaletteInk(recipe) {
  const normalized = normalizeLegacyPresetRecipe(recipe);
  const paletteId = `${normalized.meta.id || "custom"}-palette`;

  return {
    palette: definePalette(paletteFromLegacyPreset(normalized, {
      id: paletteId,
      label: `${normalized.meta.label} Palette`,
      note: `Imported from legacy preset "${normalized.meta.label}".`
    })),
    ink: defineInk(inkFromLegacyPreset(normalized, paletteId, {
      id: normalized.meta.id || "custom-ink",
      label: normalized.meta.label,
      note: normalized.meta.note
    }))
  };
}

const legacySeedPresets = LEGACY_RAW_SEED_PRESETS.map((seed) => normalizeLegacyPresetRecipe(seed));
const legacySeedById = new Map(legacySeedPresets.map((seed) => [seed.meta.id, seed]));

const paletteSeedPresets = [
  definePalette(paletteFromLegacyPreset(legacySeedById.get("chrome"), {
    id: "rainbowChrome",
    label: "Rainbow Chrome",
    note: "Shifting chrome behavior with prismatic flips and high-energy sheen."
  })),
  definePalette(METALLIC_FOIL_PALETTE_RAW),
  definePalette(paletteFromLegacyPreset(legacySeedById.get("pearl"), {
    id: "pearlIridescence",
    label: "Pearl Iridescence",
    note: "Soft milky behavior with opaline interference and restrained prism flashes."
  })),
  definePalette(paletteFromLegacyPreset(legacySeedById.get("opal"), {
    id: "opalPrism",
    label: "Opal Prism",
    note: "Luminous opal behavior with pastel body color and brighter prism fire."
  })),
  definePalette(paletteFromLegacyPreset(legacySeedById.get("galaxy"), {
    id: "cosmicDust",
    label: "Cosmic Dust",
    note: "Dark smoky body behavior with slow spectral star glints."
  })),
  definePalette(paletteFromLegacyPreset(legacySeedById.get("ember"), {
    id: "emberGlow",
    label: "Ember Glow",
    note: "Fire-like material behavior with hotter flicker and ember glints."
  }))
];

const inkSeedPresets = [
  defineInk(inkFromLegacyPreset(legacySeedById.get("chrome"), "rainbowChrome")),
  defineInk(inkFromLegacyPreset(legacySeedById.get("gold"), "metallicFoil")),
  defineInk(inkFromLegacyPreset(legacySeedById.get("silver"), "metallicFoil")),
  defineInk(inkFromLegacyPreset(legacySeedById.get("rose"), "metallicFoil")),
  defineInk(inkFromLegacyPreset(legacySeedById.get("pearl"), "pearlIridescence")),
  defineInk(inkFromLegacyPreset(legacySeedById.get("opal"), "opalPrism")),
  defineInk(inkFromLegacyPreset(legacySeedById.get("galaxy"), "cosmicDust")),
  defineInk(inkFromLegacyPreset(legacySeedById.get("ember"), "emberGlow"))
];

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
  inksByPaletteId,
  upgradeLegacyRecipeToPaletteInk
};
