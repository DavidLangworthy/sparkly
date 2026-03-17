import {
  fromPaletteInk,
  paletteSeedById,
  inkSeedById
} from "./glitter-algebra.js";

const BASE_INK_SPECS = [
  {
    baseInkId: "og-rainbow",
    label: "Rainbow Chrome",
    note: "The hero rainbow stripe. Pick a prism mood, then hop back to Draw.",
    previewSrc: "./previews/rainbow-chrome.svg"
  },
  {
    baseInkId: "gold",
    label: "Metallic Gold",
    note: "Gold wants three moods here: polished studio foil, OG white-hot glitz, and candy citrus sparkle.",
    previewSrc: "./previews/gold.svg"
  },
  {
    baseInkId: "silver",
    label: "Metallic Silver",
    note: "Silver is the trickiest one, so the sheet includes both brighter steel and OG mirror-white options.",
    previewSrc: "./previews/silver.svg"
  },
  {
    baseInkId: "pearl",
    label: "Pearl Mist",
    note: "Pearl ranges from shell-white sweetness to mint-lilac mermaid interference.",
    previewSrc: "./previews/pearl.svg"
  },
  {
    baseInkId: "opal",
    label: "Opal Veil",
    note: "Opal is already lovely, so the variants nudge it toward richer fire or softer sugar-cloud haze.",
    previewSrc: "./previews/opal.svg"
  },
  {
    baseInkId: "rose",
    label: "Rose Foil",
    note: "Rose gets a studio foil look, an OG white-champagne glitz look, and a deeper berry candy look.",
    previewSrc: "./previews/rose.svg"
  },
  {
    baseInkId: "galaxy",
    label: "Galaxy Dust",
    note: "Galaxy variants lean either candy-neon or darker midnight velvet while keeping the smoky cosmic body.",
    previewSrc: "./previews/galaxy.svg"
  },
  {
    baseInkId: "ember",
    label: "Ember Glitter",
    note: "Ember can be hot and crackly or softer and peachy-cute.",
    previewSrc: "./previews/ember.svg"
  }
];

const VARIANT_DEFINITIONS = {
  "og-rainbow": [
    {
      id: "hero",
      label: "Hero",
      description: "The current rainbow hero: glossy prism sparkles with strong color travel and no apology."
    },
    {
      id: "bubblegum-arcade",
      label: "Bubblegum Arcade",
      description: "Sweeter pink-cyan-lime prism pops with a candy-coated haze through the ribbon.",
      inkPatch: {
        body: {
          paletteStops: [
            { hueShift: -116, saturation: 84, lightness: 68, alpha: 0.94 },
            { hueShift: -12, saturation: 78, lightness: 70, alpha: 0.92 },
            { hueShift: 94, saturation: 82, lightness: 76, alpha: 0.9 },
            { hueShift: 178, saturation: 88, lightness: 72, alpha: 0.88 }
          ]
        },
        sparkle: {
          baseColors: [
            "rgba(255,142,226,0.92)",
            "rgba(121,247,255,0.92)",
            "rgba(176,255,133,0.9)",
            "rgba(255,198,128,0.88)"
          ],
          lightnessBase: 76,
          lightnessAmplitude: 6
        }
      }
    },
    {
      id: "aurora-haze",
      label: "Aurora Haze",
      description: "A softer pastel rainbow with floatier prism stars and a dreamy lilac-mint glow.",
      palettePatch: {
        bodyProfile: {
          pigmentAlpha: 0.78,
          highlightAlpha: 0.42
        }
      },
      inkPatch: {
        body: {
          paletteStops: [
            { hueShift: -126, saturation: 62, lightness: 74, alpha: 0.92 },
            { hueShift: -20, saturation: 58, lightness: 78, alpha: 0.9 },
            { hueShift: 92, saturation: 64, lightness: 84, alpha: 0.88 },
            { hueShift: 176, saturation: 68, lightness: 80, alpha: 0.86 }
          ]
        },
        sparkle: {
          baseColors: [
            "rgba(225,209,255,0.88)",
            "rgba(198,255,230,0.88)",
            "rgba(255,214,242,0.86)",
            "rgba(193,235,255,0.88)"
          ],
          lightnessBase: 82,
          lightnessAmplitude: 5,
          alpha: 0.92
        },
        sparkleProfile: {
          density: 0.064,
          brightnessMax: 1.18
        }
      }
    }
  ],
  gold: [
    {
      id: "studio",
      label: "Studio Pop",
      description: "Balanced gold foil with lime-champagne sparkle and colored metallic twinkles."
    },
    {
      id: "og-glitz",
      label: "OG Glitz",
      description: "Closest to the earlier white-hot gold look: paler foil body with sugar-white mirror cuts.",
      palettePatch: {
        bodyProfile: {
          highlightAlpha: 0.48
        }
      },
      inkPatch: {
        glintBlendMode: "lighter",
        sparkle: {
          baseColors: [
            "rgba(255,248,223,0.98)",
            "rgba(250,219,142,0.95)",
            "rgba(255,240,214,0.94)"
          ],
          hueBase: 50,
          saturationBase: 70,
          saturationAmplitude: 12,
          lightnessBase: 80,
          lightnessAmplitude: 12
        },
        sparkleProfile: {
          brightnessMin: 0.72,
          brightnessMax: 1.9,
          hotspotChance: 0.18,
          hotspotBoost: 1.76
        }
      }
    },
    {
      id: "citrus-cutie",
      label: "Citrus Cutie",
      description: "More chartreuse-champagne confetti with playful green skips and less pure white heat.",
      inkPatch: {
        sparkle: {
          baseColors: [
            "rgba(245,255,176,0.92)",
            "rgba(255,216,108,0.92)",
            "rgba(255,169,94,0.9)",
            "rgba(255,240,208,0.92)"
          ],
          hueBase: 62,
          saturationBase: 94,
          saturationAmplitude: 30,
          lightnessBase: 69,
          lightnessAmplitude: 15
        },
        sparkleMotion: {
          timeSinAmplitude: 102,
          timeCosAmplitude: 32
        }
      }
    }
  ],
  silver: [
    {
      id: "studio",
      label: "Studio Steel",
      description: "Current smoky-steel silver with colored icy flashes and a darker foil body."
    },
    {
      id: "bright-steel",
      label: "Bright Steel",
      description: "A lighter silver ribbon with crisp white cuts and cool blue-lilac sparkle without going full white-hot.",
      inkPatch: {
        body: {
          paletteStops: [
            { hueShift: -28, saturation: 24, lightness: 16, alpha: 0.96 },
            { hueShift: -8, saturation: 20, lightness: 38, alpha: 0.94 },
            { hueShift: 20, saturation: 24, lightness: 74, alpha: 0.9 },
            { hueShift: 48, saturation: 54, lightness: 97, alpha: 0.88 }
          ]
        },
        sparkle: {
          baseColors: [
            "rgba(247,249,255,0.97)",
            "rgba(188,226,255,0.92)",
            "rgba(207,199,255,0.9)",
            "rgba(214,255,250,0.88)"
          ],
          hueBase: 222,
          saturationBase: 62,
          saturationAmplitude: 22,
          lightnessBase: 74,
          lightnessAmplitude: 14
        },
        sparkleProfile: {
          brightnessMin: 0.68,
          brightnessMax: 1.82,
          hotspotChance: 0.15,
          hotspotBoost: 1.68
        }
      }
    },
    {
      id: "og-mirror",
      label: "OG Mirror",
      description: "Closest to the old mirror-silver vibe with whiter hot spots and icy blue glints.",
      inkPatch: {
        glintBlendMode: "lighter",
        body: {
          paletteStops: [
            { hueShift: -24, saturation: 22, lightness: 20, alpha: 0.96 },
            { hueShift: -6, saturation: 18, lightness: 42, alpha: 0.94 },
            { hueShift: 18, saturation: 20, lightness: 78, alpha: 0.9 },
            { hueShift: 42, saturation: 46, lightness: 98, alpha: 0.88 }
          ]
        },
        sparkle: {
          baseColors: [
            "rgba(255,255,255,0.98)",
            "rgba(204,228,255,0.94)",
            "rgba(233,240,255,0.94)"
          ],
          hueBase: 220,
          saturationBase: 56,
          saturationAmplitude: 10,
          lightnessBase: 82,
          lightnessAmplitude: 12
        },
        sparkleProfile: {
          brightnessMin: 0.74,
          brightnessMax: 1.92,
          hotspotChance: 0.18,
          hotspotBoost: 1.78
        }
      }
    }
  ],
  pearl: [
    {
      id: "studio",
      label: "Studio Mist",
      description: "Current mint-lilac pearl with opaline sparkle and a milky body."
    },
    {
      id: "snow-shell",
      label: "Snow Shell",
      description: "Whiter nacre body with shell-sugar flashes and a few bright pearl-star pops.",
      inkPatch: {
        glintBlendMode: "lighter",
        body: {
          paletteStops: [
            { hueShift: -112, saturation: 18, lightness: 46, alpha: 0.74 },
            { hueShift: -20, saturation: 22, lightness: 78, alpha: 0.82 },
            { hueShift: 54, saturation: 28, lightness: 92, alpha: 0.86 },
            { hueShift: 118, saturation: 42, lightness: 98, alpha: 0.88 }
          ]
        },
        sparkle: {
          baseColors: [
            "rgba(255,250,255,0.96)",
            "rgba(220,251,255,0.9)",
            "rgba(255,227,242,0.9)",
            "rgba(233,255,247,0.88)"
          ],
          hueBase: 220,
          saturationBase: 54,
          saturationAmplitude: 18,
          lightnessBase: 82,
          lightnessAmplitude: 14
        },
        sparkleProfile: {
          brightnessMin: 0.74,
          brightnessMax: 1.86,
          hotspotChance: 0.16,
          hotspotBoost: 1.66
        }
      }
    },
    {
      id: "mermaid-shell",
      label: "Mermaid Shell",
      description: "More mint, lilac, and blush interference with visibly colored prism flakes.",
      inkPatch: {
        body: {
          paletteStops: [
            { hueShift: -124, saturation: 28, lightness: 34, alpha: 0.76 },
            { hueShift: -18, saturation: 38, lightness: 64, alpha: 0.82 },
            { hueShift: 66, saturation: 48, lightness: 86, alpha: 0.86 },
            { hueShift: 132, saturation: 68, lightness: 95, alpha: 0.88 }
          ]
        },
        sparkle: {
          baseColors: [
            "rgba(201,255,233,0.9)",
            "rgba(228,204,255,0.9)",
            "rgba(255,207,232,0.88)",
            "rgba(199,235,255,0.9)"
          ],
          hueBase: 238,
          saturationBase: 84,
          saturationAmplitude: 26,
          lightnessBase: 78,
          lightnessAmplitude: 15
        }
      }
    }
  ],
  opal: [
    {
      id: "studio",
      label: "Studio Fire",
      description: "Current opal balance: pastel body with drifting peach-and-citron fire."
    },
    {
      id: "fire-kiss",
      label: "Fire Kiss",
      description: "Richer peach, citron, and candy-white fire for a more opulent opal flash.",
      inkPatch: {
        sparkle: {
          baseColors: [
            "rgba(255,244,182,0.9)",
            "rgba(255,212,170,0.9)",
            "rgba(209,255,235,0.92)",
            "rgba(255,248,255,0.92)"
          ],
          hueBase: 154,
          saturationBase: 94,
          saturationAmplitude: 24,
          lightnessBase: 76,
          lightnessAmplitude: 15
        },
        sparkleProfile: {
          brightnessMax: 1.6,
          hotspotChance: 0.12,
          hotspotBoost: 1.42
        }
      }
    },
    {
      id: "sugar-cloud",
      label: "Sugar Cloud",
      description: "Softer pastel opal with airy mint-lilac haze and fewer hard fire cuts.",
      palettePatch: {
        bodyProfile: {
          pigmentAlpha: 0.74
        }
      },
      inkPatch: {
        body: {
          paletteStops: [
            { hueShift: -28, saturation: 42, lightness: 58, alpha: 0.78 },
            { hueShift: 94, saturation: 50, lightness: 80, alpha: 0.84 },
            { hueShift: 166, saturation: 68, lightness: 94, alpha: 0.9 },
            { hueShift: 208, saturation: 66, lightness: 86, alpha: 0.86 }
          ]
        },
        sparkle: {
          baseColors: [
            "rgba(213,255,236,0.88)",
            "rgba(214,218,255,0.88)",
            "rgba(255,216,245,0.86)",
            "rgba(255,244,189,0.84)"
          ],
          lightnessBase: 80,
          lightnessAmplitude: 10,
          alpha: 0.9
        },
        sparkleProfile: {
          density: 0.066,
          brightnessMax: 1.34
        }
      }
    }
  ],
  rose: [
    {
      id: "studio",
      label: "Studio Foil",
      description: "Current rose foil with plum-copper body color and warm champagne flashes."
    },
    {
      id: "og-glitz",
      label: "OG Glitz",
      description: "Closest to the earlier rose-metal sparkle with white-champagne mirror cuts.",
      inkPatch: {
        glintBlendMode: "lighter",
        sparkle: {
          baseColors: [
            "rgba(255,227,225,0.97)",
            "rgba(255,183,190,0.92)",
            "rgba(255,235,194,0.9)",
            "rgba(255,245,236,0.94)"
          ],
          hueBase: 16,
          saturationBase: 66,
          saturationAmplitude: 12,
          lightnessBase: 80,
          lightnessAmplitude: 12
        },
        sparkleProfile: {
          brightnessMin: 0.72,
          brightnessMax: 1.88,
          hotspotChance: 0.18,
          hotspotBoost: 1.72
        }
      }
    },
    {
      id: "berry-bonbon",
      label: "Berry Bonbon",
      description: "A deeper berry-rose body with saturated blush, coral, and peach candy flashes.",
      inkPatch: {
        body: {
          paletteStops: [
            { hueShift: -18, saturation: 48, lightness: 14, alpha: 0.96 },
            { hueShift: -2, saturation: 54, lightness: 28, alpha: 0.95 },
            { hueShift: 18, saturation: 70, lightness: 58, alpha: 0.9 },
            { hueShift: 34, saturation: 94, lightness: 84, alpha: 0.84 }
          ]
        },
        sparkle: {
          baseColors: [
            "rgba(255,164,198,0.9)",
            "rgba(255,210,170,0.88)",
            "rgba(255,126,180,0.9)",
            "rgba(255,237,224,0.92)"
          ],
          hueBase: 354,
          saturationBase: 92,
          saturationAmplitude: 22,
          lightnessBase: 70,
          lightnessAmplitude: 14
        }
      }
    }
  ],
  galaxy: [
    {
      id: "studio",
      label: "Studio Dust",
      description: "Current galaxy body: smoky violet-black with slow spectral star flashes."
    },
    {
      id: "neon-nebula",
      label: "Neon Nebula",
      description: "More candy neon stars in cyan, lime, and pink against the space-dust body.",
      inkPatch: {
        sparkle: {
          baseColors: [
            "rgba(156,247,255,0.92)",
            "rgba(173,255,132,0.9)",
            "rgba(255,165,242,0.88)",
            "rgba(131,169,255,0.9)"
          ],
          saturationBase: 96,
          saturationAmplitude: 18,
          lightnessBase: 72,
          lightnessAmplitude: 10
        },
        sparkleProfile: {
          brightnessMax: 1.42,
          hotspotChance: 0.08,
          hotspotBoost: 1.24
        }
      }
    },
    {
      id: "midnight-pop",
      label: "Midnight Pop",
      description: "Darker velvet space with fewer, brighter stars and cleaner contrast.",
      palettePatch: {
        bodyProfile: {
          pigmentAlpha: 0.9
        }
      },
      inkPatch: {
        body: {
          paletteStops: [
            { hueShift: -28, saturation: 20, lightness: 5, alpha: 0.96 },
            { hueShift: 34, saturation: 38, lightness: 16, alpha: 0.88 },
            { hueShift: 106, saturation: 70, lightness: 58, alpha: 0.82 },
            { hueShift: 170, saturation: 68, lightness: 74, alpha: 0.7 }
          ]
        },
        sparkleProfile: {
          density: 0.076,
          brightnessMin: 0.62,
          brightnessMax: 1.48
        }
      }
    }
  ],
  ember: [
    {
      id: "studio",
      label: "Studio Glow",
      description: "Current ember ribbon with rose-gold sparks and a warm glittery flicker."
    },
    {
      id: "peach-spark",
      label: "Peach Spark",
      description: "Softer apricot fire with pink sugar embers and a cuter, lighter body.",
      inkPatch: {
        body: {
          paletteStops: [
            { hueShift: -12, saturation: 78, lightness: 42, alpha: 0.92 },
            { hueShift: 4, saturation: 86, lightness: 56, alpha: 0.9 },
            { hueShift: 18, saturation: 96, lightness: 72, alpha: 0.88 },
            { hueShift: 32, saturation: 100, lightness: 86, alpha: 0.84 }
          ]
        },
        sparkle: {
          baseColors: [
            "rgba(255,221,177,0.92)",
            "rgba(255,164,178,0.9)",
            "rgba(255,193,124,0.9)",
            "rgba(255,240,198,0.92)"
          ],
          hueBase: 24,
          saturationBase: 92,
          saturationAmplitude: 18,
          lightnessBase: 74,
          lightnessAmplitude: 12
        }
      }
    },
    {
      id: "firecracker",
      label: "Firecracker",
      description: "Hotter orange-red bursts with bigger crackly flares and sharper contrast.",
      palettePatch: {
        bodyProfile: {
          pigmentAlpha: 0.9,
          highlightAlpha: 0.4
        }
      },
      inkPatch: {
        sparkle: {
          baseColors: [
            "rgba(255,244,193,0.98)",
            "rgba(255,188,84,0.96)",
            "rgba(255,97,54,0.92)",
            "rgba(255,142,120,0.9)"
          ],
          hueBase: 18,
          saturationBase: 100,
          saturationAmplitude: 12,
          lightnessBase: 72,
          lightnessAmplitude: 12
        },
        sparkleProfile: {
          brightnessMin: 0.62,
          brightnessMax: 1.56,
          hotspotChance: 0.08,
          hotspotBoost: 1.26
        }
      }
    }
  ]
};

function cloneValue(value) {
  if (Array.isArray(value)) {
    return value.map(cloneValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneValue(item)]));
  }

  return value;
}

function mergeValue(base, patch) {
  if (patch === undefined) {
    return cloneValue(base);
  }

  if (Array.isArray(patch)) {
    return patch.map(cloneValue);
  }

  if (patch && typeof patch === "object" && !Array.isArray(patch) && base && typeof base === "object" && !Array.isArray(base)) {
    const keys = new Set([...Object.keys(base), ...Object.keys(patch)]);
    const merged = {};
    keys.forEach((key) => {
      merged[key] = mergeValue(base[key], patch[key]);
    });
    return merged;
  }

  return cloneValue(patch);
}

function buildVariantPreset(baseInkId, variant) {
  const baseInk = inkSeedById.get(baseInkId);
  const basePalette = paletteSeedById.get(baseInk.meta.paletteId);
  const runtimeId = `param-${baseInkId}--${variant.id}`;
  const mergedPalette = mergeValue(basePalette, variant.palettePatch || {});
  const mergedInk = mergeValue(baseInk, variant.inkPatch || {});

  mergedInk.meta = {
    ...mergedInk.meta,
    id: runtimeId
  };

  return {
    runtimeId,
    preset: fromPaletteInk({
      palette: mergedPalette,
      ink: mergedInk
    })
  };
}

function getLegacyRuntimeId(baseInkId) {
  return `param-${baseInkId}`;
}

function buildParameterizedInkCatalog(runtimePresetMap) {
  const entries = BASE_INK_SPECS.map((spec) => {
    const baseInk = inkSeedById.get(spec.baseInkId);
    const variants = (VARIANT_DEFINITIONS[spec.baseInkId] || []).map((variant, index) => {
      const { runtimeId, preset } = buildVariantPreset(spec.baseInkId, variant);
      runtimePresetMap.set(runtimeId, preset);

      return {
        id: variant.id,
        runtimeId,
        label: variant.label,
        description: variant.description,
        isDefault: Boolean(variant.isDefault || index === 0),
        preset
      };
    });

    const defaultVariant = variants.find((variant) => variant.isDefault) || variants[0];

    return {
      baseInkId: spec.baseInkId,
      label: spec.label || baseInk.meta.label,
      note: spec.note || baseInk.meta.note,
      previewSrc: spec.previewSrc,
      variants,
      legacyRuntimeId: getLegacyRuntimeId(spec.baseInkId),
      defaultRuntimeId: defaultVariant.runtimeId
    };
  });

  const entryByBaseInkId = new Map(entries.map((entry) => [entry.baseInkId, entry]));
  const variantByRuntimeId = new Map();

  entries.forEach((entry) => {
    const defaultVariant = entry.variants.find((variant) => variant.runtimeId === entry.defaultRuntimeId) || entry.variants[0];
    if (defaultVariant) {
      runtimePresetMap.set(entry.legacyRuntimeId, defaultVariant.preset);
      variantByRuntimeId.set(entry.legacyRuntimeId, {
        entry,
        variant: defaultVariant
      });
    }

    entry.variants.forEach((variant) => {
      variantByRuntimeId.set(variant.runtimeId, {
        entry,
        variant
      });
    });
  });

  return {
    entries,
    entryByBaseInkId,
    variantByRuntimeId
  };
}

export { buildParameterizedInkCatalog };
