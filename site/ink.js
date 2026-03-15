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

function cloneRecipe(recipe) {
  return JSON.parse(JSON.stringify(recipe));
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
  createSparkleNode,
  blendModeOptions,
  glintStyleOptions,
  normalizePresetRecipe,
  fromPreset,
  generatePresetSnippet,
  mixerSeedPresets,
  mixerSeedById
};
