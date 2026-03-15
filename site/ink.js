// Keep these in scope so mixer-generated snippets can be pasted here.
import { definePalette, defineInk, fromPaletteInk } from "./glitter-algebra.js";

const TAU = Math.PI * 2;
const EXPORT_BACKGROUND = "#f6ecd8";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (start, end, amount) => start + (end - start) * amount;
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

const hash01 = (value) => {
  const sine = Math.sin(value * 127.1 + value * value * 0.037) * 43758.5453123;
  return sine - Math.floor(sine);
};

function addGradientStops(gradient, colors) {
  const lastIndex = Math.max(colors.length - 1, 1);
  colors.forEach((color, index) => {
    gradient.addColorStop(index / lastIndex, color);
  });
}

function createInkPreset(config) {
  return {
    ...config,
    renderStamp(ctx, stamp, time) {
      renderStampBase(ctx, stamp, this, time);
    },
    renderGlint(ctx, sparkleNode, time) {
      renderGlintBase(ctx, sparkleNode, this, time);
    }
  };
}

function renderStampBase(ctx, stamp, preset) {
  const palette = preset.palette ? preset.palette(stamp) : preset.baseColors;
  const radius = stamp.radius;
  const stretch = preset.stretch || 1.1;
  const squeeze = preset.squeeze || 0.84;
  const opacity = (preset.pigmentAlpha || 0.8) * (stamp.isSpray ? 0.72 : 0.98) * (0.55 + stamp.pressure * 0.55);
  const shineColor = preset.shineColor ? preset.shineColor(stamp) : "rgba(255,255,255,0.9)";
  const rimColor = preset.rimColor ? preset.rimColor(stamp) : "rgba(255,255,255,0.22)";
  const shadowColor = preset.shadowColor ? preset.shadowColor(stamp) : "rgba(88,56,22,0.1)";

  ctx.save();
  ctx.translate(stamp.x, stamp.y);
  ctx.rotate(stamp.angle + (preset.angleShift || 0));
  ctx.scale(stretch, squeeze);
  ctx.globalCompositeOperation = "source-over";

  const blendGradient = ctx.createRadialGradient(-radius * 0.12, -radius * 0.14, radius * 0.12, 0, 0, radius * 1.42);
  blendGradient.addColorStop(0, palette[1] || palette[0]);
  blendGradient.addColorStop(0.48, palette[palette.length - 1] || palette[0]);
  blendGradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.globalAlpha = opacity * (stamp.isSpray ? 0.18 : 0.28);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.1, 0, TAU);
  ctx.fillStyle = blendGradient;
  ctx.fill();

  const baseGradient = ctx.createRadialGradient(-radius * 0.22, -radius * 0.28, radius * 0.18, 0, 0, radius * 1.28);
  addGradientStops(baseGradient, palette);
  ctx.globalAlpha = opacity * 0.92;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TAU);
  ctx.fillStyle = baseGradient;
  ctx.fill();

  const sheen = ctx.createLinearGradient(-radius * 1.6, -radius * 0.75, radius * 1.6, radius * 0.75);
  sheen.addColorStop(0, "rgba(255,255,255,0)");
  sheen.addColorStop(0.26, "rgba(255,255,255,0)");
  sheen.addColorStop(0.54, shineColor);
  sheen.addColorStop(0.72, "rgba(255,255,255,0.04)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.globalAlpha = (preset.highlightAlpha || 0.32) * (stamp.isSpray ? 0.55 : 0.82);
  ctx.fillStyle = sheen;
  ctx.fill();

  ctx.globalAlpha = (preset.edgeAlpha || 0.16) * 0.28;
  ctx.lineWidth = Math.max(0.8, radius * 0.12);
  ctx.strokeStyle = rimColor;
  ctx.stroke();

  ctx.globalAlpha = (preset.shadowAlpha || 0.09) * 0.42;
  ctx.beginPath();
  ctx.arc(radius * 0.12, radius * 0.14, radius * 0.76, 0, TAU);
  ctx.fillStyle = shadowColor;
  ctx.fill();

  ctx.restore();
}

function renderGlintBase(ctx, node, preset, time) {
  const t = time * 0.001 * preset.sheenSpeed + node.phase;
  const flicker = 0.5 + 0.5 * Math.sin(t * 1.7 + node.drift * 4.2);
  const pulse = 0.55 + 0.45 * Math.cos(t * 0.9 + node.phase * 0.7);
  const alpha = (0.12 + pulse * 0.58) * node.brightness;
  const radius = node.size * (0.75 + pulse * 0.9);
  const x = node.x + Math.cos(t + node.phase) * node.drift * 0.35;
  const y = node.y + Math.sin(t * 1.12 + node.phase * 0.8) * node.drift * 0.35;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(node.phase * 0.35 + time * 0.00018 * preset.sheenSpeed);
  ctx.globalCompositeOperation = preset.blendMode;

  const color = preset.sparkleColor
    ? preset.sparkleColor(node, time, flicker)
    : preset.sparkleColors[Math.floor(hash01(node.hueOffset) * preset.sparkleColors.length) % preset.sparkleColors.length];
  const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.85);
  halo.addColorStop(0, color);
  halo.addColorStop(0.48, color);
  halo.addColorStop(1, "rgba(255,255,255,0)");
  ctx.globalAlpha = alpha * 0.35;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.22, 0, TAU);
  ctx.fillStyle = halo;
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = "round";

  switch (preset.glintStyle) {
    case "dust":
      drawDustGlint(ctx, radius, alpha, flicker);
      break;
    case "foil":
      drawFoilGlint(ctx, radius, alpha, flicker);
      break;
    case "soft":
      drawSoftGlint(ctx, radius, alpha, flicker);
      break;
    case "prism":
      drawPrismGlint(ctx, radius, alpha, flicker);
      break;
    case "ember":
      drawEmberGlint(ctx, radius, alpha, flicker);
      break;
    default:
      drawStreakGlint(ctx, radius, alpha, flicker);
      break;
  }

  ctx.restore();
}

function drawStreakGlint(ctx, radius, alpha, flicker) {
  ctx.globalAlpha = alpha * (0.8 + flicker * 0.2);
  ctx.lineWidth = Math.max(0.8, radius * 0.22);
  ctx.beginPath();
  ctx.moveTo(-radius * 2.5, 0);
  ctx.lineTo(radius * 2.5, 0);
  ctx.stroke();

  ctx.globalAlpha = alpha * 0.5;
  ctx.lineWidth = Math.max(0.7, radius * 0.12);
  ctx.beginPath();
  ctx.moveTo(0, -radius * 1.15);
  ctx.lineTo(0, radius * 1.15);
  ctx.stroke();

  ctx.globalAlpha = alpha * 0.7;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.42, 0, TAU);
  ctx.fill();
}

function drawFoilGlint(ctx, radius, alpha, flicker) {
  const color = ctx.strokeStyle;
  const halo = ctx.createRadialGradient(0, 0, radius * 0.04, 0, 0, radius * 1.18);
  halo.addColorStop(0, "rgba(255,255,255,0.98)");
  halo.addColorStop(0.22, color);
  halo.addColorStop(1, "rgba(255,255,255,0)");

  ctx.globalAlpha = alpha * (0.48 + flicker * 0.18);
  ctx.beginPath();
  ctx.arc(0, 0, radius * (0.8 + flicker * 0.12), 0, TAU);
  ctx.fillStyle = halo;
  ctx.fill();

  ctx.fillStyle = color;
  drawStreakGlint(ctx, radius * 1.04, alpha * 1.04, flicker);

  ctx.globalAlpha = alpha * (0.82 + flicker * 0.16);
  ctx.beginPath();
  ctx.moveTo(0, -radius * 1.02);
  ctx.lineTo(radius * 0.76, 0);
  ctx.lineTo(0, radius * 1.02);
  ctx.lineTo(-radius * 0.76, 0);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = alpha * 0.5;
  ctx.lineWidth = Math.max(0.7, radius * 0.12);
  ctx.beginPath();
  ctx.moveTo(-radius * 1.15, -radius * 1.15);
  ctx.lineTo(radius * 1.15, radius * 1.15);
  ctx.moveTo(radius * 1.15, -radius * 1.15);
  ctx.lineTo(-radius * 1.15, radius * 1.15);
  ctx.stroke();
}

function drawDustGlint(ctx, radius, alpha, flicker) {
  ctx.globalAlpha = alpha * 0.8;
  ctx.beginPath();
  ctx.arc(0, 0, radius * (0.5 + flicker * 0.24), 0, TAU);
  ctx.fill();

  ctx.globalAlpha = alpha * 0.45;
  ctx.lineWidth = Math.max(0.7, radius * 0.1);
  ctx.beginPath();
  ctx.moveTo(-radius * 1.2, 0);
  ctx.lineTo(radius * 1.2, 0);
  ctx.moveTo(0, -radius * 1.2);
  ctx.lineTo(0, radius * 1.2);
  ctx.stroke();
}

function drawSoftGlint(ctx, radius, alpha, flicker) {
  const glow = ctx.createRadialGradient(0, 0, radius * 0.08, 0, 0, radius * 1.5);
  glow.addColorStop(0, "rgba(255,255,255,0.95)");
  glow.addColorStop(0.35, ctx.fillStyle);
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.globalAlpha = alpha * 0.62;
  ctx.beginPath();
  ctx.arc(0, 0, radius * (0.7 + flicker * 0.25), 0, TAU);
  ctx.fillStyle = glow;
  ctx.fill();

  ctx.fillStyle = ctx.strokeStyle;
  ctx.globalAlpha = alpha * 0.42;
  ctx.beginPath();
  ctx.ellipse(radius * 0.35, -radius * 0.16, radius * 0.45, radius * 0.2, -0.4, 0, TAU);
  ctx.fill();
}

function drawPrismGlint(ctx, radius, alpha, flicker) {
  const spin = 0.25 + flicker * 0.35;
  ctx.rotate(spin);
  ctx.globalAlpha = alpha * 0.72;
  ctx.beginPath();
  ctx.moveTo(0, -radius * 1.5);
  ctx.lineTo(radius * 1.22, 0);
  ctx.lineTo(0, radius * 1.5);
  ctx.lineTo(-radius * 1.22, 0);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = alpha * 0.46;
  ctx.lineWidth = Math.max(0.8, radius * 0.12);
  ctx.beginPath();
  ctx.moveTo(-radius * 1.95, 0);
  ctx.lineTo(radius * 1.95, 0);
  ctx.moveTo(0, -radius * 1.95);
  ctx.lineTo(0, radius * 1.95);
  ctx.stroke();
}

function drawEmberGlint(ctx, radius, alpha, flicker) {
  ctx.globalAlpha = alpha * 0.92;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.56, 0, TAU);
  ctx.fill();

  ctx.globalAlpha = alpha * 0.48;
  ctx.lineWidth = Math.max(0.75, radius * 0.18);
  ctx.beginPath();
  ctx.moveTo(-radius * 1.7, 0);
  ctx.lineTo(radius * 1.7, 0);
  ctx.moveTo(0, -radius * 0.85);
  ctx.lineTo(0, radius * 0.85);
  ctx.stroke();

  ctx.globalAlpha = alpha * 0.42;
  ctx.beginPath();
  ctx.arc(radius * 0.75, -radius * 0.62, radius * 0.28 * (0.85 + flicker * 0.4), 0, TAU);
  ctx.arc(-radius * 0.65, radius * 0.55, radius * 0.18 * (0.8 + flicker * 0.35), 0, TAU);
  ctx.fill();
}

const inkPresets = [
  createInkPreset({
    id: "gold",
    label: "Metallic Gold",
    note: "Antique-to-champagne foil with brighter metallic fire and sharper flash points.",
    baseColors: ["#53300a", "#ae6e12", "#eab93e", "#fff0b8"],
    sparkleColors: ["rgba(255,248,223,0.96)", "rgba(250,219,142,0.95)"],
    blendMode: "lighter",
    sheenSpeed: 0.94,
    sparkleDensity: 0.064,
    sparkleSizeRange: [1.7, 5.3],
    sparkleHueRange: 180,
    sparkleBrightnessRange: [0.7, 1.55],
    sparkleDriftRange: [0.22, 1.2],
    sparkleHotspotChance: 0.08,
    sparkleHotspotBoost: 1.45,
    sprayScatter: 18,
    stretch: 1.2,
    squeeze: 0.84,
    pigmentAlpha: 0.84,
    highlightAlpha: 0.42,
    edgeAlpha: 0.22,
    glintStyle: "foil",
    palette: (stamp) => {
      const hue = 43
        + Math.sin(stamp.progress * 1.02 + stamp.seed * 4.2) * 11
        + Math.cos(stamp.progress * 0.22 + stamp.seed * 2.6) * 4;
      return [
        hsl(hue - 14, 68, 16, 0.96),
        hsl(hue - 4, 78, 34, 0.95),
        hsl(hue + 8, 94, 54, 0.92),
        hsl(hue + 18, 100, 84, 0.86)
      ];
    },
    shineColor: (stamp) => hsl(50 + Math.sin(stamp.progress * 0.8 + stamp.seed * 5) * 14, 100, 92, 0.94),
    rimColor: (stamp) => hsl(56 + Math.cos(stamp.progress * 0.56 + stamp.seed * 4.2) * 18, 92, 84, 0.34),
    shadowColor: () => "rgba(68, 38, 6, 0.22)",
    sparkleColor: (node, time) => {
      const interference = 0.5 + 0.5 * Math.sin(time * 0.0011 + node.phase * 1.4);
      const hue = 46 + node.hueOffset * 0.08 + interference * 18;
      return hsl(hue, 100, 78 + interference * 10, 0.96);
    }
  }),
  createInkPreset({
    id: "silver",
    label: "Metallic Silver",
    note: "Layered steel foil with icy cyan-lilac flashes and brighter mirror cuts.",
    baseColors: ["#283342", "#677488", "#d7dee9", "#fcfdff"],
    sparkleColors: ["rgba(255,255,255,0.96)", "rgba(204,228,255,0.94)"],
    blendMode: "lighter",
    sheenSpeed: 1.14,
    sparkleDensity: 0.066,
    sparkleSizeRange: [1.6, 5.1],
    sparkleHueRange: 220,
    sparkleBrightnessRange: [0.72, 1.6],
    sparkleDriftRange: [0.2, 1.18],
    sparkleHotspotChance: 0.1,
    sparkleHotspotBoost: 1.5,
    sprayScatter: 16,
    stretch: 1.18,
    squeeze: 0.82,
    pigmentAlpha: 0.82,
    highlightAlpha: 0.46,
    edgeAlpha: 0.26,
    glintStyle: "foil",
    palette: (stamp) => {
      const hue = 214
        + Math.sin(stamp.progress * 1.12 + stamp.seed * 6.4) * 20
        + Math.cos(stamp.progress * 0.26 + stamp.seed * 3.4) * 4;
      return [
        hsl(hue - 18, 18, 16, 0.96),
        hsl(hue - 4, 18, 36, 0.94),
        hsl(hue + 8, 20, 74, 0.9),
        hsl(hue + 30, 42, 96, 0.88)
      ];
    },
    shineColor: (stamp) => hsl(216 + Math.sin(stamp.progress * 0.92 + stamp.seed * 5.1) * 24, 64, 97, 0.94),
    rimColor: (stamp) => hsl(242 + Math.cos(stamp.progress * 0.76 + stamp.seed * 4.8) * 26, 56, 88, 0.34),
    shadowColor: () => "rgba(56, 66, 82, 0.2)",
    sparkleColor: (node, time) => {
      const interference = Math.sin(time * 0.0013 + node.phase) * 24 + Math.cos(time * 0.0009 + node.drift * 3.8) * 10;
      const hue = 216 + node.hueOffset * 0.08 + interference;
      return hsl(hue, 88, 84 + Math.sin(time * 0.0017 + node.phase) * 6, 0.95);
    }
  }),
  createInkPreset({
    id: "chrome",
    label: "Rainbow Chrome",
    note: "A shifting chrome ribbon with prismatic sparkles and rotating color flips.",
    baseColors: ["#5460d8", "#ff7d73", "#5fe6ad"],
    sparkleColors: ["rgba(255,255,255,0.95)", "rgba(255,160,221,0.92)", "rgba(114,239,245,0.92)"],
    blendMode: "lighter",
    sheenSpeed: 1.3,
    sparkleDensity: 0.07,
    sparkleSizeRange: [1.8, 5.6],
    sprayScatter: 22,
    stretch: 1.24,
    squeeze: 0.8,
    pigmentAlpha: 0.82,
    highlightAlpha: 0.46,
    edgeAlpha: 0.2,
    glintStyle: "prism",
    palette: (stamp) => {
      const hue = stamp.progress * 72 + stamp.seed * 37;
      return [
        hsl(hue + 215, 74, 36, 0.92),
        hsl(hue + 8, 94, 58, 0.9),
        hsl(hue + 128, 82, 64, 0.84)
      ];
    },
    shineColor: (stamp) => hsl(stamp.progress * 90 + stamp.seed * 50 + 42, 100, 88, 0.88),
    rimColor: (stamp) => hsl(stamp.progress * 90 + stamp.seed * 50 + 180, 80, 80, 0.3),
    shadowColor: (stamp) => hsl(stamp.progress * 90 + stamp.seed * 40 + 228, 56, 24, 0.14),
    sparkleColor: (node, time) => hsl(node.hueOffset + time * 0.05 + 200, 100, 74, 0.95)
  }),
  createInkPreset({
    id: "pearl",
    label: "Pearl Mist",
    note: "Milky pearl with mint-lilac interference and brighter opaline flashes.",
    baseColors: ["#918a98", "#dedbe2", "#f5fbf6", "#fff6f7"],
    sparkleColors: ["rgba(255,248,255,0.95)", "rgba(201,244,255,0.9)", "rgba(255,213,235,0.9)"],
    blendMode: "lighter",
    sheenSpeed: 0.86,
    sparkleDensity: 0.07,
    sparkleSizeRange: [1.8, 5.4],
    sparkleHueRange: 260,
    sparkleBrightnessRange: [0.75, 1.7],
    sparkleDriftRange: [0.22, 1.24],
    sparkleHotspotChance: 0.12,
    sparkleHotspotBoost: 1.5,
    sprayScatter: 16,
    stretch: 1.14,
    squeeze: 0.9,
    pigmentAlpha: 0.74,
    highlightAlpha: 0.36,
    edgeAlpha: 0.16,
    glintStyle: "prism",
    palette: (stamp) => {
      const hue = 206
        + Math.sin(stamp.progress * 1.5 + stamp.seed * 7.2) * 34
        + Math.cos(stamp.progress * 0.32 + stamp.seed * 2.8) * 10;
      return [
        hsl(hue - 78, 10, 56, 0.64),
        hsl(hue - 12, 16, 80, 0.78),
        hsl(hue + 42, 28, 92, 0.82),
        hsl(hue + 92, 44, 97, 0.88)
      ];
    },
    shineColor: (stamp) => hsl(208 + Math.sin(stamp.progress * 1.1 + stamp.seed * 4.2) * 26, 54, 97, 0.9),
    rimColor: (stamp) => hsl(318 + Math.cos(stamp.progress * 0.9 + stamp.seed * 4.1) * 18, 42, 90, 0.28),
    shadowColor: () => "rgba(120, 112, 128, 0.12)",
    sparkleColor: (node, time) => {
      const hue = 204 + node.hueOffset * 0.16 + Math.sin(time * 0.0011 + node.phase) * 54;
      const saturation = 68 + Math.max(0, Math.sin(node.phase * 2.1)) * 10;
      const lightness = 90 + Math.cos(time * 0.0013 + node.phase) * 4;
      return hsl(hue, saturation, lightness, 0.94);
    }
  }),
  createInkPreset({
    id: "opal",
    label: "Opal Veil",
    note: "Pale aqua-lilac pigment with peach fire and drifting opalescent flashes.",
    baseColors: ["#7cc5be", "#d6c9f6", "#fff1f2"],
    sparkleColors: ["rgba(230,255,246,0.94)", "rgba(221,224,255,0.94)", "rgba(255,219,252,0.92)"],
    blendMode: "screen",
    sheenSpeed: 0.92,
    sparkleDensity: 0.064,
    sparkleSizeRange: [1.7, 5.4],
    sprayScatter: 19,
    stretch: 1.16,
    squeeze: 0.86,
    pigmentAlpha: 0.78,
    highlightAlpha: 0.36,
    edgeAlpha: 0.16,
    glintStyle: "prism",
    palette: (stamp) => {
      const hue = 162 + Math.sin(stamp.progress * 1.45 + stamp.seed * 8.6) * 42;
      return [
        hsl(hue - 12, 44, 60, 0.76),
        hsl(hue + 84, 56, 84, 0.8),
        hsl(hue + 156, 78, 94, 0.9)
      ];
    },
    shineColor: (stamp) => hsl(176 + Math.sin(stamp.progress * 1.08 + stamp.seed * 3.8) * 28, 88, 93, 0.9),
    rimColor: (stamp) => hsl(304 + Math.cos(stamp.progress * 0.9 + stamp.seed * 4.1) * 24, 78, 88, 0.3),
    shadowColor: () => "rgba(105, 145, 150, 0.1)",
    sparkleColor: (node, time) => hsl(178 + node.hueOffset * 0.18 + Math.sin(time * 0.0011 + node.phase) * 64, 92, 84, 0.94)
  }),
  createInkPreset({
    id: "rose",
    label: "Rose Foil",
    note: "Rose foil with plum-copper body color and brighter champagne flash.",
    baseColors: ["#613244", "#b46d7e", "#efbcc2", "#fff0dc"],
    sparkleColors: ["rgba(255,227,225,0.95)", "rgba(255,183,190,0.92)", "rgba(255,235,194,0.9)"],
    blendMode: "lighter",
    sheenSpeed: 1.12,
    sparkleDensity: 0.063,
    sparkleSizeRange: [1.6, 5],
    sparkleHueRange: 170,
    sparkleBrightnessRange: [0.7, 1.5],
    sparkleDriftRange: [0.2, 1.16],
    sparkleHotspotChance: 0.08,
    sparkleHotspotBoost: 1.42,
    sprayScatter: 18,
    stretch: 1.22,
    squeeze: 0.82,
    pigmentAlpha: 0.84,
    highlightAlpha: 0.44,
    edgeAlpha: 0.2,
    glintStyle: "foil",
    palette: (stamp) => {
      const hue = 352
        + Math.sin(stamp.progress * 1.04 + stamp.seed * 5.6) * 14
        + Math.cos(stamp.progress * 0.24 + stamp.seed * 2.5) * 4;
      return [
        hsl(hue - 10, 34, 18, 0.96),
        hsl(hue + 2, 44, 36, 0.95),
        hsl(hue + 16, 66, 68, 0.9),
        hsl(hue + 32, 100, 88, 0.84)
      ];
    },
    shineColor: (stamp) => hsl(24 + Math.sin(stamp.progress * 0.82 + stamp.seed * 4.3) * 12, 100, 92, 0.94),
    rimColor: (stamp) => hsl(4 + Math.cos(stamp.progress * 0.68 + stamp.seed * 4.1) * 16, 78, 86, 0.32),
    shadowColor: () => "rgba(88, 38, 48, 0.18)",
    sparkleColor: (node, time) => {
      const interference = 0.5 + 0.5 * Math.sin(time * 0.0012 + node.phase * 1.1);
      const hue = 9 + node.hueOffset * 0.08 + interference * 16;
      return hsl(hue, 96, 82 + interference * 10, 0.95);
    }
  }),
  createInkPreset({
    id: "galaxy",
    label: "Galaxy Dust",
    note: "Black-opal ink with smoky body color and slow spectral star flashes.",
    baseColors: ["#0f1018", "#345069", "#a173d5"],
    sparkleColors: ["rgba(232,239,255,0.96)", "rgba(150,224,255,0.92)", "rgba(255,194,254,0.88)"],
    blendMode: "lighter",
    sheenSpeed: 1.22,
    sparkleDensity: 0.085,
    sparkleSizeRange: [1.2, 5.8],
    sprayScatter: 24,
    stretch: 1.12,
    squeeze: 0.88,
    pigmentAlpha: 0.78,
    highlightAlpha: 0.32,
    edgeAlpha: 0.18,
    glintStyle: "dust",
    palette: (stamp) => {
      const hue = 196 + Math.sin(stamp.progress * 1.18 + stamp.seed * 6.9) * 54;
      return [
        hsl(hue - 24, 24, 8, 0.96),
        hsl(hue + 38, 46, 24, 0.88),
        hsl(hue + 110, 82, 68, 0.82)
      ];
    },
    shineColor: (stamp) => hsl(214 + Math.sin(stamp.progress * 1 + stamp.seed * 4.2) * 36, 82, 76, 0.78),
    rimColor: (stamp) => hsl(302 + Math.cos(stamp.progress * 0.72 + stamp.seed * 4.6) * 28, 74, 72, 0.24),
    shadowColor: () => "rgba(7, 10, 20, 0.28)",
    sparkleColor: (node, time) => hsl(205 + node.hueOffset * 0.34 + Math.sin(time * 0.0013 + node.phase) * 68, 100, 80, 0.94)
  }),
  createInkPreset({
    id: "ember",
    label: "Ember Glitter",
    note: "Hot ember pigment with rose-gold sparks and a faster firefly flicker.",
    baseColors: ["#7a1c12", "#e65a1b", "#ffcc67"],
    sparkleColors: ["rgba(255,244,193,0.96)", "rgba(255,188,84,0.95)", "rgba(255,123,62,0.92)", "rgba(255,154,136,0.9)"],
    blendMode: "lighter",
    sheenSpeed: 1.42,
    sparkleDensity: 0.072,
    sparkleSizeRange: [1.4, 5.1],
    sprayScatter: 22,
    stretch: 1.18,
    squeeze: 0.82,
    pigmentAlpha: 0.86,
    highlightAlpha: 0.36,
    edgeAlpha: 0.16,
    glintStyle: "ember",
    palette: (stamp) => {
      const hue = 18 + Math.sin(stamp.progress * 1.12 + stamp.seed * 6.1) * 10;
      return [
        hsl(hue - 8, 72, 28, 0.95),
        hsl(hue + 4, 88, 52, 0.92),
        hsl(hue + 32, 96, 72, 0.86)
      ];
    },
    shineColor: (stamp) => hsl(34 + Math.sin(stamp.progress * 0.88 + stamp.seed * 4.9) * 12, 100, 84, 0.88),
    rimColor: (stamp) => hsl(20 + Math.cos(stamp.progress * 0.8 + stamp.seed * 3.9) * 14, 90, 72, 0.24),
    shadowColor: () => "rgba(104, 24, 9, 0.16)",
    sparkleColor: (node, time) => hsl(22 + node.hueOffset * 0.08 + Math.sin(time * 0.0018 + node.phase) * 22, 100, 74, 0.95)
  })
];

const inkById = new Map(inkPresets.map((preset) => [preset.id, preset]));

const backgroundOptions = [
  { id: "transparent", label: "Transparent", color: null, className: "background-chip--transparent" },
  { id: "paper", label: "Paper", color: EXPORT_BACKGROUND },
  { id: "ivory", label: "Ivory", color: "#fff7ef" },
  { id: "blush", label: "Blush", color: "#f8e3e8" },
  { id: "mint", label: "Mint", color: "#e3f1e8" },
  { id: "midnight", label: "Midnight", color: "#18131b" }
];

const backgroundById = new Map(backgroundOptions.map((background) => [background.id, background]));

function createSparkleNode(stamp, preset, randomKey) {
  const minSize = preset.sparkleSizeRange[0];
  const maxSize = preset.sparkleSizeRange[1];
  const spread = stamp.radius * (stamp.isSpray ? 1.6 : 0.72);
  const sparkleHueRange = Number.isFinite(preset.sparkleHueRange) ? preset.sparkleHueRange : 320;
  const sparkleBrightnessRange = Array.isArray(preset.sparkleBrightnessRange) && preset.sparkleBrightnessRange.length === 2
    ? preset.sparkleBrightnessRange
    : [0.55, 1.25];
  const sparkleDriftRange = Array.isArray(preset.sparkleDriftRange) && preset.sparkleDriftRange.length === 2
    ? preset.sparkleDriftRange
    : [0.18, 1.12];
  const sparkleHotspotChance = Number.isFinite(preset.sparkleHotspotChance) ? preset.sparkleHotspotChance : 0;
  const sparkleHotspotBoost = Number.isFinite(preset.sparkleHotspotBoost) ? preset.sparkleHotspotBoost : 1;
  let brightness = lerp(sparkleBrightnessRange[0], sparkleBrightnessRange[1], hash01(randomKey + 9.2));

  if (hash01(randomKey + 11.4) < sparkleHotspotChance) {
    brightness *= sparkleHotspotBoost;
  }

  return {
    x: stamp.x + (hash01(randomKey + 1.17) - 0.5) * spread,
    y: stamp.y + (hash01(randomKey + 2.11) - 0.5) * spread,
    size: lerp(minSize, maxSize, hash01(randomKey + 3.09)) * (0.7 + stamp.pressure * 0.45),
    phase: hash01(randomKey + 4.3) * TAU,
    hueOffset: (hash01(randomKey + 5.9) - 0.5) * sparkleHueRange,
    drift: lerp(sparkleDriftRange[0], sparkleDriftRange[1], hash01(randomKey + 7.7)),
    brightness: clamp(brightness, 0.1, 2)
  };
}

export {
  TAU,
  clamp,
  lerp,
  normalizeHue,
  hsl,
  hash01,
  parseHexColor,
  inkPresets,
  inkById,
  backgroundOptions,
  backgroundById,
  createInkPreset,
  renderStampBase,
  renderGlintBase,
  createSparkleNode
};
