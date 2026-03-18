const sparkleProfiles = {
  rainbowChrome: {
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
  ogRainbow: {
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
  gold: {
    density: 0.068,
    sizeMin: 1.7,
    sizeMax: 5.35,
    hueRange: 236,
    brightnessMin: 0.62,
    brightnessMax: 1.74,
    driftMin: 0.22,
    driftMax: 1.22,
    hotspotChance: 0.13,
    hotspotBoost: 1.62
  },
  silver: {
    density: 0.069,
    sizeMin: 1.7,
    sizeMax: 5.4,
    hueRange: 278,
    brightnessMin: 0.64,
    brightnessMax: 1.94,
    driftMin: 0.22,
    driftMax: 1.22,
    hotspotChance: 0.17,
    hotspotBoost: 1.8
  },
  rose: {
    density: 0.066,
    sizeMin: 1.7,
    sizeMax: 5.25,
    hueRange: 224,
    brightnessMin: 0.62,
    brightnessMax: 1.74,
    driftMin: 0.21,
    driftMax: 1.18,
    hotspotChance: 0.12,
    hotspotBoost: 1.58
  },
  pearl: {
    density: 0.078,
    sizeMin: 1.9,
    sizeMax: 5.7,
    hueRange: 312,
    brightnessMin: 0.7,
    brightnessMax: 1.74,
    driftMin: 0.24,
    driftMax: 1.28,
    hotspotChance: 0.13,
    hotspotBoost: 1.56
  },
  opal: {
    density: 0.071,
    sizeMin: 1.8,
    sizeMax: 5.8,
    hueRange: 320,
    brightnessMin: 0.56,
    brightnessMax: 1.76,
    driftMin: 0.2,
    driftMax: 1.16,
    hotspotChance: 0.16,
    hotspotBoost: 1.52
  },
  galaxy: {
    density: 0.085,
    sizeMin: 1.2,
    sizeMax: 5.8,
    hueRange: 320,
    brightnessMin: 0.55,
    brightnessMax: 1.36,
    driftMin: 0.18,
    driftMax: 1.12,
    hotspotChance: 0.04,
    hotspotBoost: 1.14
  },
  ember: {
    density: 0.072,
    sizeMin: 1.4,
    sizeMax: 5.1,
    hueRange: 180,
    brightnessMin: 0.58,
    brightnessMax: 1.5,
    driftMin: 0.18,
    driftMax: 1.12,
    hotspotChance: 0.05,
    hotspotBoost: 1.16
  }
};

const sparkleMotions = {
  rainbowChrome: {
    hueOffsetScale: 1,
    timeSinSpeed: 0.0011,
    timeSinAmplitude: 64,
    timeCosSpeed: 0.0008,
    timeCosAmplitude: 18
  },
  ogRainbow: {
    hueOffsetScale: 1,
    timeSinSpeed: 0.0013,
    timeSinAmplitude: 96,
    timeCosSpeed: 0.0006,
    timeCosAmplitude: 14
  },
  gold: {
    hueOffsetScale: 0.16,
    timeSinSpeed: 0.0013,
    timeSinAmplitude: 20,
    timeCosSpeed: 0.0009,
    timeCosAmplitude: 8
  },
  silver: {
    hueOffsetScale: 0.36,
    timeSinSpeed: 0.00125,
    timeSinAmplitude: 28,
    timeCosSpeed: 0.00095,
    timeCosAmplitude: 12
  },
  rose: {
    hueOffsetScale: 0.22,
    timeSinSpeed: 0.00125,
    timeSinAmplitude: 26,
    timeCosSpeed: 0.0009,
    timeCosAmplitude: 10
  },
  pearl: {
    hueOffsetScale: 0.3,
    timeSinSpeed: 0.00115,
    timeSinAmplitude: 64,
    timeCosSpeed: 0.0007,
    timeCosAmplitude: 18
  },
  opal: {
    hueOffsetScale: 0.52,
    timeSinSpeed: 0.00115,
    timeSinAmplitude: 128,
    timeCosSpeed: 0.0008,
    timeCosAmplitude: 46
  },
  galaxy: {
    hueOffsetScale: 0.34,
    timeSinSpeed: 0.0013,
    timeSinAmplitude: 68,
    timeCosSpeed: 0,
    timeCosAmplitude: 0
  },
  ember: {
    hueOffsetScale: 0.08,
    timeSinSpeed: 0.0018,
    timeSinAmplitude: 22,
    timeCosSpeed: 0,
    timeCosAmplitude: 0
  }
};

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
    }
  },
  {
    meta: {
      id: "ogRainbowPrism",
      label: "OG Rainbow Prism",
      note: "A broader old-school rainbow ribbon with blue-red-green body splits and stronger along-stripe color travel."
    },
    finish: {
      blendMode: "lighter",
      glintStyle: "prism",
      sheenSpeed: 1.28
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
      sinProgressFreq: 0.74,
      sinSeedFreq: 4.2,
      sinAmplitude: 132,
      cosProgressFreq: 0,
      cosSeedFreq: 0,
      cosAmplitude: 0
    },
    shineMotion: {
      progressFreq: 0.82,
      seedFreq: 4.8,
      amplitude: 88
    },
    rimMotion: {
      progressFreq: 0.82,
      seedFreq: 4.8,
      amplitude: 88
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
    }
  },
  {
    meta: {
      id: "pearlIridescence",
      label: "Pearl Iridescence",
      note: "Soft milky behavior with opaline interference and restrained prism flashes."
    },
    finish: {
      blendMode: "screen",
      glintStyle: "prism",
      sheenSpeed: 0.82
    },
    bodyProfile: {
      stretch: 1.14,
      squeeze: 0.9,
      sprayScatter: 16,
      pigmentAlpha: 0.76,
      highlightAlpha: 0.34,
      edgeAlpha: 0.14
    },
    bodyMotion: {
      sinProgressFreq: 1.42,
      sinSeedFreq: 7.2,
      sinAmplitude: 24,
      cosProgressFreq: 0.32,
      cosSeedFreq: 2.8,
      cosAmplitude: 8
    },
    shineMotion: {
      progressFreq: 1.06,
      seedFreq: 4.2,
      amplitude: 18
    },
    rimMotion: {
      progressFreq: 0.9,
      seedFreq: 4.1,
      amplitude: 12
    }
  },
  {
    meta: {
      id: "opalPrism",
      label: "Opal Prism",
      note: "Luminous opal behavior with pastel body color and brighter prism fire."
    },
    finish: {
      blendMode: "lighter",
      glintStyle: "prism",
      sheenSpeed: 0.98
    },
    bodyProfile: {
      stretch: 1.16,
      squeeze: 0.86,
      sprayScatter: 19,
      pigmentAlpha: 0.8,
      highlightAlpha: 0.4,
      edgeAlpha: 0.18
    },
    bodyMotion: {
      sinProgressFreq: 1.45,
      sinSeedFreq: 8.6,
      sinAmplitude: 54,
      cosProgressFreq: 0.3,
      cosSeedFreq: 2.3,
      cosAmplitude: 16
    },
    shineMotion: {
      progressFreq: 1.08,
      seedFreq: 3.8,
      amplitude: 34
    },
    rimMotion: {
      progressFreq: 0.9,
      seedFreq: 4.1,
      amplitude: 30
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
    },
    sparkleProfile: sparkleProfiles.rainbowChrome,
    sparkleMotion: sparkleMotions.rainbowChrome
  },
  {
    meta: {
      id: "og-rainbow",
      paletteId: "ogRainbowPrism",
      label: "OG Rainbow",
      note: "Closer to the original handwritten rainbow stripe, but still built from the parameterized palette and ink model."
    },
    body: {
      hueBase: 0,
      paletteStops: [
        { hueShift: -145, saturation: 74, lightness: 36, alpha: 0.92 },
        { hueShift: 8, saturation: 94, lightness: 58, alpha: 0.9 },
        { hueShift: 128, saturation: 82, lightness: 64, alpha: 0.84 },
        { hueShift: 128, saturation: 82, lightness: 64, alpha: 0.84 }
      ]
    },
    shine: {
      hueBase: 42,
      saturation: 100,
      lightness: 88,
      alpha: 0.88
    },
    rim: {
      hueBase: 180,
      saturation: 80,
      lightness: 80,
      alpha: 0.3
    },
    shadow: {
      color: "hsla(228 56% 24% / 0.14)"
    },
    sparkle: {
      baseColors: ["#ffffff", "rgba(255,160,221,0.92)", "rgba(114,239,245,0.92)"],
      hueBase: 200,
      saturationBase: 100,
      saturationAmplitude: 0,
      lightnessBase: 74,
      lightnessAmplitude: 0,
      alpha: 0.95
    },
    sparkleProfile: sparkleProfiles.ogRainbow,
    sparkleMotion: sparkleMotions.ogRainbow
  },
  {
    meta: {
      id: "gold",
      paletteId: "metallicFoil",
      label: "Metallic Gold",
      note: "Antique-to-champagne foil with brighter metallic fire and sharper flash points."
    },
    glintBlendMode: "source-over",
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
      baseColors: [
        "rgba(255,240,200,0.96)",
        "rgba(255,211,94,0.94)",
        "rgba(242,255,164,0.86)",
        "rgba(255,184,82,0.9)",
        "rgba(255,248,228,0.94)"
      ],
      hueBase: 46,
      saturationBase: 84,
      saturationAmplitude: 22,
      lightnessBase: 68,
      lightnessAmplitude: 15,
      alpha: 0.96
    },
    sparkleProfile: sparkleProfiles.gold,
    sparkleMotion: sparkleMotions.gold
  },
  {
    meta: {
      id: "silver",
      paletteId: "metallicFoil",
      label: "Metallic Silver",
      note: "Mirror-steel silver with icy blue-lilac flashes and brighter reflective cuts."
    },
    glintBlendMode: "source-over",
    body: {
      hueBase: 214,
      paletteStops: [
        { hueShift: -24, saturation: 22, lightness: 24, alpha: 0.96 },
        { hueShift: -4, saturation: 16, lightness: 56, alpha: 0.94 },
        { hueShift: 20, saturation: 20, lightness: 84, alpha: 0.9 },
        { hueShift: 42, saturation: 38, lightness: 98, alpha: 0.88 }
      ]
    },
    shine: {
      hueBase: 216,
      saturation: 40,
      lightness: 100,
      alpha: 0.94
    },
    rim: {
      hueBase: 242,
      saturation: 40,
      lightness: 93,
      alpha: 0.34
    },
    shadow: {
      color: "rgba(56, 66, 82, 0.16)"
    },
    sparkle: {
      baseColors: [
        "rgba(255,255,255,0.98)",
        "rgba(214,236,255,0.94)",
        "rgba(220,213,255,0.9)",
        "rgba(214,248,255,0.9)",
        "rgba(245,248,255,0.96)"
      ],
      hueBase: 222,
      saturationBase: 56,
      saturationAmplitude: 18,
      lightnessBase: 80,
      lightnessAmplitude: 18,
      alpha: 0.95
    },
    sparkleProfile: {
      ...sparkleProfiles.silver,
      brightnessMin: 0.66,
      brightnessMax: 2.06,
      hotspotChance: 0.2,
      hotspotBoost: 1.86
    },
    sparkleMotion: {
      ...sparkleMotions.silver,
      timeSinAmplitude: 26,
      timeCosAmplitude: 10
    }
  },
  {
    meta: {
      id: "rose",
      paletteId: "metallicFoil",
      label: "Rose Foil",
      note: "Rose foil with plum-copper body color and brighter champagne flash."
    },
    glintBlendMode: "source-over",
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
        "rgba(255,229,220,0.95)",
        "rgba(255,170,186,0.9)",
        "rgba(255,214,160,0.88)",
        "rgba(255,196,138,0.9)",
        "rgba(255,244,236,0.94)"
      ],
      hueBase: 12,
      saturationBase: 80,
      saturationAmplitude: 24,
      lightnessBase: 72,
      lightnessAmplitude: 16,
      alpha: 0.95
    },
    sparkleProfile: {
      ...sparkleProfiles.rose,
      brightnessMax: 1.78,
      hotspotChance: 0.13
    },
    sparkleMotion: sparkleMotions.rose
  },
  {
    meta: {
      id: "pearl",
      paletteId: "pearlIridescence",
      label: "Pearl Mist",
      note: "Shell-white pearl with mint-lilac nacre and soft sugary star flashes."
    },
    glintBlendMode: "source-over",
    body: {
      hueBase: 206,
      paletteStops: [
        { hueShift: -112, saturation: 18, lightness: 42, alpha: 0.76 },
        { hueShift: -24, saturation: 22, lightness: 74, alpha: 0.82 },
        { hueShift: 52, saturation: 30, lightness: 90, alpha: 0.86 },
        { hueShift: 112, saturation: 40, lightness: 98, alpha: 0.88 }
      ]
    },
    shine: {
      hueBase: 204,
      saturation: 30,
      lightness: 98,
      alpha: 0.9
    },
    rim: {
      hueBase: 324,
      saturation: 28,
      lightness: 92,
      alpha: 0.24
    },
    shadow: {
      color: "rgba(120, 112, 128, 0.12)"
    },
    sparkle: {
      baseColors: [
        "rgba(255,250,247,0.94)",
        "rgba(224,251,243,0.9)",
        "rgba(242,228,255,0.9)",
        "rgba(255,233,240,0.88)",
        "rgba(255,255,255,0.94)"
      ],
      hueBase: 212,
      saturationBase: 54,
      saturationAmplitude: 20,
      lightnessBase: 83,
      lightnessAmplitude: 13,
      alpha: 0.94
    },
    sparkleProfile: {
      ...sparkleProfiles.pearl,
      hueRange: 268,
      brightnessMax: 1.74,
      hotspotChance: 0.13,
      hotspotBoost: 1.56
    },
    sparkleMotion: {
      ...sparkleMotions.pearl,
      hueOffsetScale: 0.28,
      timeSinAmplitude: 58,
      timeCosAmplitude: 18
    }
  },
  {
    meta: {
      id: "opal",
      paletteId: "opalPrism",
      label: "Opal Veil",
      note: "Luminous opal with aqua-lilac body color and richer peach-citron fire."
    },
    glintBlendMode: "source-over",
    body: {
      hueBase: 162,
      paletteStops: [
        { hueShift: -34, saturation: 72, lightness: 36, alpha: 0.82 },
        { hueShift: 92, saturation: 78, lightness: 62, alpha: 0.86 },
        { hueShift: 160, saturation: 96, lightness: 86, alpha: 0.9 },
        { hueShift: 208, saturation: 92, lightness: 78, alpha: 0.86 }
      ]
    },
    shine: {
      hueBase: 176,
      saturation: 96,
      lightness: 94,
      alpha: 0.9
    },
    rim: {
      hueBase: 24,
      saturation: 82,
      lightness: 88,
      alpha: 0.3
    },
    shadow: {
      color: "rgba(118, 146, 126, 0.1)"
    },
    sparkle: {
      baseColors: [
        "rgba(255,240,178,0.94)",
        "rgba(255,196,148,0.92)",
        "rgba(208,255,237,0.92)",
        "rgba(230,213,255,0.92)",
        "rgba(255,246,204,0.92)"
      ],
      hueBase: 152,
      saturationBase: 98,
      saturationAmplitude: 30,
      lightnessBase: 72,
      lightnessAmplitude: 18,
      alpha: 0.94
    },
    sparkleProfile: {
      ...sparkleProfiles.opal,
      brightnessMax: 1.8,
      hotspotChance: 0.17,
      hotspotBoost: 1.56
    },
    sparkleMotion: {
      ...sparkleMotions.opal,
      hueOffsetScale: 0.54,
      timeSinAmplitude: 132,
      timeCosAmplitude: 48
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
        "rgba(255,194,254,0.88)",
        "rgba(181,255,164,0.84)"
      ],
      hueBase: 205,
      saturationBase: 96,
      saturationAmplitude: 10,
      lightnessBase: 78,
      lightnessAmplitude: 8,
      alpha: 0.94
    },
    sparkleProfile: sparkleProfiles.galaxy,
    sparkleMotion: sparkleMotions.galaxy
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
        "rgba(255,154,136,0.9)",
        "rgba(255,188,212,0.84)"
      ],
      hueBase: 22,
      saturationBase: 96,
      saturationAmplitude: 8,
      lightnessBase: 72,
      lightnessAmplitude: 6,
      alpha: 0.95
    },
    sparkleProfile: sparkleProfiles.ember,
    sparkleMotion: sparkleMotions.ember
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
