const paletteSeedDefinitions = [
  {
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
  },
  {
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
  },
  {
    meta: {
      id: "pearlIridescence",
      label: "Pearl Iridescence",
      note: "Soft milky behavior with opaline interference and restrained prism flashes."
    },
    finish: {
      blendMode: "lighter",
      glintStyle: "prism",
      sheenSpeed: 0.86
    },
    bodyProfile: {
      stretch: 1.14,
      squeeze: 0.9,
      sprayScatter: 16,
      pigmentAlpha: 0.74,
      highlightAlpha: 0.36,
      edgeAlpha: 0.16
    },
    bodyMotion: {
      sinProgressFreq: 1.5,
      sinSeedFreq: 7.2,
      sinAmplitude: 34,
      cosProgressFreq: 0.32,
      cosSeedFreq: 2.8,
      cosAmplitude: 10
    },
    shineMotion: {
      progressFreq: 1.1,
      seedFreq: 4.2,
      amplitude: 26
    },
    rimMotion: {
      progressFreq: 0.9,
      seedFreq: 4.1,
      amplitude: 18
    },
    sparkleProfile: {
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
      hueOffsetScale: 0.16,
      timeSinSpeed: 0.0011,
      timeSinAmplitude: 54,
      timeCosSpeed: 0,
      timeCosAmplitude: 0
    }
  },
  {
    meta: {
      id: "opalPrism",
      label: "Opal Prism",
      note: "Luminous opal behavior with pastel body color and brighter prism fire."
    },
    finish: {
      blendMode: "screen",
      glintStyle: "prism",
      sheenSpeed: 0.92
    },
    bodyProfile: {
      stretch: 1.16,
      squeeze: 0.86,
      sprayScatter: 19,
      pigmentAlpha: 0.78,
      highlightAlpha: 0.36,
      edgeAlpha: 0.16
    },
    bodyMotion: {
      sinProgressFreq: 1.45,
      sinSeedFreq: 8.6,
      sinAmplitude: 42,
      cosProgressFreq: 0.3,
      cosSeedFreq: 2.3,
      cosAmplitude: 12
    },
    shineMotion: {
      progressFreq: 1.08,
      seedFreq: 3.8,
      amplitude: 28
    },
    rimMotion: {
      progressFreq: 0.9,
      seedFreq: 4.1,
      amplitude: 24
    },
    sparkleProfile: {
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
      hueOffsetScale: 0.18,
      timeSinSpeed: 0.0011,
      timeSinAmplitude: 64,
      timeCosSpeed: 0,
      timeCosAmplitude: 0
    }
  },
  {
    meta: {
      id: "cosmicDust",
      label: "Cosmic Dust",
      note: "Dark smoky body behavior with slow spectral star glints."
    },
    finish: {
      blendMode: "lighter",
      glintStyle: "dust",
      sheenSpeed: 1.22
    },
    bodyProfile: {
      stretch: 1.12,
      squeeze: 0.88,
      sprayScatter: 24,
      pigmentAlpha: 0.78,
      highlightAlpha: 0.32,
      edgeAlpha: 0.18
    },
    bodyMotion: {
      sinProgressFreq: 1.18,
      sinSeedFreq: 6.9,
      sinAmplitude: 54,
      cosProgressFreq: 0.24,
      cosSeedFreq: 2.2,
      cosAmplitude: 16
    },
    shineMotion: {
      progressFreq: 1,
      seedFreq: 4.2,
      amplitude: 36
    },
    rimMotion: {
      progressFreq: 0.72,
      seedFreq: 4.6,
      amplitude: 28
    },
    sparkleProfile: {
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
      hueOffsetScale: 0.34,
      timeSinSpeed: 0.0013,
      timeSinAmplitude: 68,
      timeCosSpeed: 0,
      timeCosAmplitude: 0
    }
  },
  {
    meta: {
      id: "emberGlow",
      label: "Ember Glow",
      note: "Fire-like material behavior with hotter flicker and ember glints."
    },
    finish: {
      blendMode: "lighter",
      glintStyle: "ember",
      sheenSpeed: 1.42
    },
    bodyProfile: {
      stretch: 1.18,
      squeeze: 0.82,
      sprayScatter: 22,
      pigmentAlpha: 0.86,
      highlightAlpha: 0.36,
      edgeAlpha: 0.16
    },
    bodyMotion: {
      sinProgressFreq: 1.12,
      sinSeedFreq: 6.1,
      sinAmplitude: 10,
      cosProgressFreq: 0.28,
      cosSeedFreq: 2.2,
      cosAmplitude: 3
    },
    shineMotion: {
      progressFreq: 0.88,
      seedFreq: 4.9,
      amplitude: 12
    },
    rimMotion: {
      progressFreq: 0.8,
      seedFreq: 3.9,
      amplitude: 14
    },
    sparkleProfile: {
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
      hueOffsetScale: 0.08,
      timeSinSpeed: 0.0018,
      timeSinAmplitude: 22,
      timeCosSpeed: 0,
      timeCosAmplitude: 0
    }
  }
];

const inkSeedDefinitions = [
  {
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
  },
  {
    meta: {
      id: "gold",
      paletteId: "metallicFoil",
      label: "Metallic Gold",
      note: "Antique-to-champagne foil with brighter metallic fire and sharper flash points."
    },
    body: {
      hueBase: 43,
      paletteStops: [
        { hueShift: -14, saturation: 68, lightness: 16, alpha: 0.96 },
        { hueShift: -4, saturation: 78, lightness: 34, alpha: 0.95 },
        { hueShift: 8, saturation: 94, lightness: 54, alpha: 0.92 },
        { hueShift: 18, saturation: 100, lightness: 84, alpha: 0.86 }
      ]
    },
    shine: {
      hueBase: 50,
      saturation: 100,
      lightness: 92,
      alpha: 0.94
    },
    rim: {
      hueBase: 56,
      saturation: 92,
      lightness: 84,
      alpha: 0.34
    },
    shadow: {
      color: "rgba(68, 38, 6, 0.22)"
    },
    sparkle: {
      baseColors: ["rgba(255,248,223,0.96)", "rgba(250,219,142,0.95)"],
      hueBase: 55,
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
      paletteId: "metallicFoil",
      label: "Metallic Silver",
      note: "Layered steel foil with icy cyan-lilac flashes and brighter mirror cuts."
    },
    body: {
      hueBase: 214,
      paletteStops: [
        { hueShift: -18, saturation: 18, lightness: 16, alpha: 0.96 },
        { hueShift: -4, saturation: 18, lightness: 36, alpha: 0.94 },
        { hueShift: 8, saturation: 20, lightness: 74, alpha: 0.9 },
        { hueShift: 30, saturation: 42, lightness: 96, alpha: 0.88 }
      ]
    },
    shine: {
      hueBase: 216,
      saturation: 64,
      lightness: 97,
      alpha: 0.94
    },
    rim: {
      hueBase: 242,
      saturation: 56,
      lightness: 88,
      alpha: 0.34
    },
    shadow: {
      color: "rgba(56, 66, 82, 0.2)"
    },
    sparkle: {
      baseColors: ["rgba(255,255,255,0.96)", "rgba(204,228,255,0.94)"],
      hueBase: 220,
      saturationBase: 88,
      saturationAmplitude: 8,
      lightnessBase: 84,
      lightnessAmplitude: 6,
      alpha: 0.95
    }
  },
  {
    meta: {
      id: "rose",
      paletteId: "metallicFoil",
      label: "Rose Foil",
      note: "Rose foil with plum-copper body color and brighter champagne flash."
    },
    body: {
      hueBase: 352,
      paletteStops: [
        { hueShift: -10, saturation: 34, lightness: 18, alpha: 0.96 },
        { hueShift: 2, saturation: 44, lightness: 36, alpha: 0.95 },
        { hueShift: 16, saturation: 66, lightness: 68, alpha: 0.9 },
        { hueShift: 32, saturation: 100, lightness: 88, alpha: 0.84 }
      ]
    },
    shine: {
      hueBase: 24,
      saturation: 100,
      lightness: 92,
      alpha: 0.94
    },
    rim: {
      hueBase: 4,
      saturation: 78,
      lightness: 86,
      alpha: 0.32
    },
    shadow: {
      color: "rgba(88, 38, 48, 0.18)"
    },
    sparkle: {
      baseColors: [
        "rgba(255,227,225,0.95)",
        "rgba(255,183,190,0.92)",
        "rgba(255,235,194,0.9)"
      ],
      hueBase: 17,
      saturationBase: 96,
      saturationAmplitude: 0,
      lightnessBase: 87,
      lightnessAmplitude: 5,
      alpha: 0.95
    }
  },
  {
    meta: {
      id: "pearl",
      paletteId: "pearlIridescence",
      label: "Pearl Mist",
      note: "Milky pearl with mint-lilac interference and brighter opaline flashes."
    },
    body: {
      hueBase: 206,
      paletteStops: [
        { hueShift: -78, saturation: 10, lightness: 56, alpha: 0.64 },
        { hueShift: -12, saturation: 16, lightness: 80, alpha: 0.78 },
        { hueShift: 42, saturation: 28, lightness: 92, alpha: 0.82 },
        { hueShift: 92, saturation: 44, lightness: 97, alpha: 0.88 }
      ]
    },
    shine: {
      hueBase: 208,
      saturation: 54,
      lightness: 97,
      alpha: 0.9
    },
    rim: {
      hueBase: 318,
      saturation: 42,
      lightness: 90,
      alpha: 0.28
    },
    shadow: {
      color: "rgba(120, 112, 128, 0.12)"
    },
    sparkle: {
      baseColors: [
        "rgba(255,248,255,0.95)",
        "rgba(201,244,255,0.9)",
        "rgba(255,213,235,0.9)"
      ],
      hueBase: 206,
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
      paletteId: "opalPrism",
      label: "Opal Veil",
      note: "Pale aqua-lilac pigment with peach fire and drifting opalescent flashes."
    },
    body: {
      hueBase: 162,
      paletteStops: [
        { hueShift: -12, saturation: 44, lightness: 60, alpha: 0.76 },
        { hueShift: 84, saturation: 56, lightness: 84, alpha: 0.8 },
        { hueShift: 156, saturation: 78, lightness: 94, alpha: 0.9 },
        { hueShift: 180, saturation: 72, lightness: 88, alpha: 0.86 }
      ]
    },
    shine: {
      hueBase: 176,
      saturation: 88,
      lightness: 93,
      alpha: 0.9
    },
    rim: {
      hueBase: 304,
      saturation: 78,
      lightness: 88,
      alpha: 0.3
    },
    shadow: {
      color: "rgba(105, 145, 150, 0.1)"
    },
    sparkle: {
      baseColors: [
        "rgba(230,255,246,0.94)",
        "rgba(221,224,255,0.94)",
        "rgba(255,219,252,0.92)"
      ],
      hueBase: 178,
      saturationBase: 92,
      saturationAmplitude: 0,
      lightnessBase: 84,
      lightnessAmplitude: 0,
      alpha: 0.94
    }
  },
  {
    meta: {
      id: "galaxy",
      paletteId: "cosmicDust",
      label: "Galaxy Dust",
      note: "Black-opal ink with smoky body color and slow spectral star flashes."
    },
    body: {
      hueBase: 196,
      paletteStops: [
        { hueShift: -24, saturation: 24, lightness: 8, alpha: 0.96 },
        { hueShift: 38, saturation: 46, lightness: 24, alpha: 0.88 },
        { hueShift: 110, saturation: 82, lightness: 68, alpha: 0.82 },
        { hueShift: 168, saturation: 74, lightness: 80, alpha: 0.72 }
      ]
    },
    shine: {
      hueBase: 214,
      saturation: 82,
      lightness: 76,
      alpha: 0.78
    },
    rim: {
      hueBase: 302,
      saturation: 74,
      lightness: 72,
      alpha: 0.24
    },
    shadow: {
      color: "rgba(7, 10, 20, 0.28)"
    },
    sparkle: {
      baseColors: [
        "rgba(232,239,255,0.96)",
        "rgba(150,224,255,0.92)",
        "rgba(255,194,254,0.88)"
      ],
      hueBase: 205,
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
      paletteId: "emberGlow",
      label: "Ember Glitter",
      note: "Hot ember pigment with rose-gold sparks and a faster firefly flicker."
    },
    body: {
      hueBase: 18,
      paletteStops: [
        { hueShift: -8, saturation: 72, lightness: 28, alpha: 0.95 },
        { hueShift: 4, saturation: 88, lightness: 52, alpha: 0.92 },
        { hueShift: 32, saturation: 96, lightness: 72, alpha: 0.86 },
        { hueShift: 58, saturation: 92, lightness: 82, alpha: 0.8 }
      ]
    },
    shine: {
      hueBase: 34,
      saturation: 100,
      lightness: 84,
      alpha: 0.88
    },
    rim: {
      hueBase: 20,
      saturation: 90,
      lightness: 72,
      alpha: 0.24
    },
    shadow: {
      color: "rgba(104, 24, 9, 0.16)"
    },
    sparkle: {
      baseColors: [
        "rgba(255,244,193,0.96)",
        "rgba(255,188,84,0.95)",
        "rgba(255,123,62,0.92)",
        "rgba(255,154,136,0.9)"
      ],
      hueBase: 22,
      saturationBase: 100,
      saturationAmplitude: 0,
      lightnessBase: 74,
      lightnessAmplitude: 0,
      alpha: 0.95
    }
  }
];

const defaultPaletteDefinition = paletteSeedDefinitions[0];
const defaultInkDefinition = inkSeedDefinitions[0];

export {
  defaultPaletteDefinition,
  defaultInkDefinition,
  paletteSeedDefinitions,
  inkSeedDefinitions
};
