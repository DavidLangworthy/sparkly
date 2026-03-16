import { TAU, hash01, lerp, createSparkleNode } from "./ink.js";

function drawSprayBurst(ctx, preset, point, angle, progress, seed, density, brushSize, sparkles) {
  const baseCount = Math.max(8, Math.round(brushSize * 0.74 * density));
  const scatter = (preset.sprayScatter || 18) * (0.34 + brushSize * 0.024) * lerp(0.92, 1.08, density);

  for (let index = 0; index < baseCount; index += 1) {
    const key = seed + progress * 31.3 + index * 13.1;
    const theta = hash01(key) * TAU;
    const distance = Math.sqrt(hash01(key + 1.9)) * scatter;
    const stamp = {
      x: point.x + Math.cos(theta) * distance,
      y: point.y + Math.sin(theta) * distance,
      radius: brushSize * lerp(0.12, 0.28, hash01(key + 2.4)) * (0.78 + density * 0.38),
      angle: angle + (hash01(key + 4.3) - 0.5) * 1.5,
      pressure: 0.94,
      travel: progress * 340,
      progress: progress * 7.2 + index * 0.08,
      seed: seed + index * 0.01,
      isSpray: true
    };

    preset.renderStamp(ctx, stamp, 0);
  }

  if (sparkles && Math.floor(progress * 1000) % 4 === 0) {
    sparkles.push(createSparkleNode({
      x: point.x,
      y: point.y,
      radius: brushSize * 0.6,
      angle,
      pressure: 0.94,
      travel: progress * 340,
      progress: progress * 7.2,
      seed,
      isSpray: true
    }, preset, seed + progress * 19.7));
  }
}

function drawInkSwoopPreview(canvas, preset, {
  compact = false,
  active = false
} = {}) {
  const width = Math.max(canvas.clientWidth || canvas.width || 140, compact ? 52 : 140);
  const height = Math.max(canvas.clientHeight || canvas.height || 44, compact ? 28 : 58);
  const dpr = Math.max(window.devicePixelRatio || 1, 1);
  const ctx = canvas.getContext("2d");
  const seed = 27.35 + width * 0.01;
  const sparkles = [];
  const horizontalPad = compact ? 7 : 14;
  const verticalPad = compact ? 3 : 8;
  const steps = compact ? 32 : 68;
  const brushSize = compact ? 14 : 24;
  const amplitude = height * 0.13;
  const baseY = height * 0.53;
  const availableWidth = Math.max(12, width - horizontalPad * 2);

  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;

  for (let index = 0; index < steps; index += 1) {
    const ratio = steps === 1 ? 0 : index / (steps - 1);
    const eased = Math.sin(ratio * Math.PI);
    const x = horizontalPad + ratio * availableWidth;
    const y = baseY + Math.sin(ratio * Math.PI * 1.15 - Math.PI * 0.15) * amplitude;
    const point = { x, y };
    const nextRatio = Math.min(1, ratio + 1 / Math.max(steps - 1, 1));
    const nextPoint = {
      x: horizontalPad + nextRatio * availableWidth,
      y: baseY + Math.sin(nextRatio * Math.PI * 1.15 - Math.PI * 0.15) * amplitude
    };
    const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x);
    const density = compact
      ? 0.7 + eased * 0.55
      : 0.78 + eased * 0.86;

    drawSprayBurst(ctx, preset, point, angle, ratio, seed, density, brushSize, sparkles);
  }

  sparkles.slice(0, compact ? 5 : 10).forEach((node, index) => {
    preset.renderGlint(ctx, node, 1120 + index * 41);
  });

  if (active) {
    const glow = ctx.createLinearGradient(0, 0, width, 0);
    glow.addColorStop(0, "rgba(111, 70, 230, 0)");
    glow.addColorStop(0.3, "rgba(111, 70, 230, 0.16)");
    glow.addColorStop(0.5, "rgba(241, 120, 200, 0.24)");
    glow.addColorStop(0.7, "rgba(102, 197, 255, 0.16)");
    glow.addColorStop(1, "rgba(111, 70, 230, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, height - 6, width, 6);
  }
}

export { drawInkSwoopPreview };
