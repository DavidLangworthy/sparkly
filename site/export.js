import { parseHexColor, backgroundById } from "./ink.js";

const GIF_ALPHA_DITHER_4X4 = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5
];

class ByteWriter {
  constructor() {
    this.bytes = [];
  }

  writeByte(value) {
    this.bytes.push(value & 255);
  }

  writeBytes(values) {
    values.forEach((value) => this.writeByte(value));
  }

  writeShort(value) {
    this.writeByte(value & 255);
    this.writeByte((value >> 8) & 255);
  }

  writeText(text) {
    for (let index = 0; index < text.length; index += 1) {
      this.writeByte(text.charCodeAt(index));
    }
  }

  toUint8Array() {
    return new Uint8Array(this.bytes);
  }
}

function nextPowerOfTwo(value) {
  let size = 2;
  while (size < value && size < 256) {
    size <<= 1;
  }
  return size;
}

function quantizeColor(red, green, blue) {
  return ((red >> 3) << 10) | ((green >> 3) << 5) | (blue >> 3);
}

function expandColorKey(key) {
  return [
    (((key >> 10) & 31) << 3) | 4,
    (((key >> 5) & 31) << 3) | 4,
    ((key & 31) << 3) | 4
  ];
}

function colorDistanceSquared(left, right) {
  return (
    (left[0] - right[0]) * (left[0] - right[0]) +
    (left[1] - right[1]) * (left[1] - right[1]) +
    (left[2] - right[2]) * (left[2] - right[2])
  );
}

function isTransparentGifPixel(frame, pixelIndex, alpha) {
  if (alpha <= 0) {
    return true;
  }

  if (alpha >= 255) {
    return false;
  }

  const x = pixelIndex % frame.width;
  const y = Math.floor(pixelIndex / frame.width);
  const threshold = (GIF_ALPHA_DITHER_4X4[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
  return alpha / 255 <= threshold;
}

function collectGifColorCounts(frame, counts, transparentBackground) {
  for (let pixel = 0, index = 0; index < frame.data.length; index += 4, pixel += 1) {
    if (transparentBackground && isTransparentGifPixel(frame, pixel, frame.data[index + 3])) {
      continue;
    }

    const key = quantizeColor(frame.data[index], frame.data[index + 1], frame.data[index + 2]);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
}

function buildGifPaletteFromCounts(counts, transparentBackground, backgroundColor = null) {
  const palette = transparentBackground ? [[0, 0, 0]] : [];
  const backgroundKey = backgroundColor
    ? quantizeColor(backgroundColor[0], backgroundColor[1], backgroundColor[2])
    : null;
  const seenKeys = new Set();
  if (backgroundKey != null) {
    palette.push(expandColorKey(backgroundKey));
    seenKeys.add(backgroundKey);
  }

  const rankedEntries = Array.from(counts.entries())
    .filter(([key]) => !seenKeys.has(key))
    .map(([key, count]) => {
      const color = expandColorKey(key);
      const chroma = Math.max(color[0], color[1], color[2]) - Math.min(color[0], color[1], color[2]);
      const contrast = backgroundColor
        ? Math.sqrt(colorDistanceSquared(color, backgroundColor))
        : 96;
      const score = count * (1 + chroma / 144) * (1 + contrast / 112);
      return { key, color, count, score };
    })
    .sort((left, right) => right.score - left.score || right.count - left.count);

  [30 * 30, 18 * 18, 0].forEach((minimumDistance) => {
    rankedEntries.forEach((entry) => {
      if (palette.length >= 256 || seenKeys.has(entry.key)) {
        return;
      }

      const isTooClose = minimumDistance > 0
        && palette.some((color) => colorDistanceSquared(color, entry.color) < minimumDistance);
      if (isTooClose) {
        return;
      }

      palette.push(entry.color);
      seenKeys.add(entry.key);
    });
  });

  const tableSize = nextPowerOfTwo(Math.max(2, palette.length));
  while (palette.length < tableSize) {
    palette.push(palette[palette.length - 1] || [0, 0, 0]);
  }

  return palette;
}

function mapFrameToPalette(frame, palette, transparentBackground) {
  const indexed = new Uint8Array(frame.data.length / 4);
  const cache = new Map();
  const startIndex = transparentBackground ? 1 : 0;

  for (let pixel = 0, index = 0; index < frame.data.length; index += 4, pixel += 1) {
    if (transparentBackground && isTransparentGifPixel(frame, pixel, frame.data[index + 3])) {
      indexed[pixel] = 0;
      continue;
    }

    const key = quantizeColor(frame.data[index], frame.data[index + 1], frame.data[index + 2]);
    if (!cache.has(key)) {
      const [red, green, blue] = expandColorKey(key);
      let bestIndex = startIndex;
      let bestDistance = Infinity;

      for (let paletteIndex = startIndex; paletteIndex < palette.length; paletteIndex += 1) {
        const color = palette[paletteIndex];
        const distance =
          (red - color[0]) * (red - color[0]) +
          (green - color[1]) * (green - color[1]) +
          (blue - color[2]) * (blue - color[2]);

        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = paletteIndex;
          if (distance === 0) {
            break;
          }
        }
      }

      cache.set(key, bestIndex);
    }

    indexed[pixel] = cache.get(key);
  }

  return indexed;
}

function lzwEncode(indices, minCodeSize) {
  const clearCode = 1 << minCodeSize;
  const endCode = clearCode + 1;
  const output = [];
  let bitBuffer = 0;
  let bitCount = 0;
  let codeSize = minCodeSize + 1;
  let pendingCodeSizeIncrease = false;
  let dictionary = new Map();
  let nextCode = endCode + 1;

  function writeCode(code) {
    bitBuffer += code * (2 ** bitCount);
    bitCount += codeSize;

    while (bitCount >= 8) {
      output.push(bitBuffer & 255);
      bitBuffer = Math.floor(bitBuffer / 256);
      bitCount -= 8;
    }

    if (pendingCodeSizeIncrease) {
      codeSize += 1;
      pendingCodeSizeIncrease = false;
    }
  }

  function resetDictionary() {
    dictionary = new Map();
    nextCode = endCode + 1;
    codeSize = minCodeSize + 1;
    pendingCodeSizeIncrease = false;
  }

  if (!indices.length) {
    writeCode(clearCode);
    writeCode(endCode);
    if (bitCount > 0) {
      output.push(bitBuffer & 255);
    }
    return output;
  }

  writeCode(clearCode);
  let prefixCode = indices[0];

  for (let index = 1; index < indices.length; index += 1) {
    const symbol = indices[index];
    const key = prefixCode * 256 + symbol;

    if (dictionary.has(key)) {
      prefixCode = dictionary.get(key);
      continue;
    }

    writeCode(prefixCode);

    if (nextCode < 4096) {
      dictionary.set(key, nextCode);
      nextCode += 1;
      if (nextCode === (1 << codeSize) && codeSize < 12) {
        pendingCodeSizeIncrease = true;
      }
    } else {
      writeCode(clearCode);
      resetDictionary();
    }

    prefixCode = symbol;
  }

  writeCode(prefixCode);
  writeCode(endCode);

  if (bitCount > 0) {
    output.push(bitBuffer & 255);
  }

  return output;
}

function writeSubBlocks(writer, bytes) {
  for (let offset = 0; offset < bytes.length; offset += 255) {
    const chunk = bytes.slice(offset, offset + 255);
    writer.writeByte(chunk.length);
    writer.writeBytes(chunk);
  }
  writer.writeByte(0);
}

function createGifWriter(width, height, palette) {
  const writer = new ByteWriter();

  writer.writeText("GIF89a");
  writer.writeShort(width);
  writer.writeShort(height);
  writer.writeByte(0x80 | 0x70 | (Math.round(Math.log2(palette.length)) - 1));
  writer.writeByte(0);
  writer.writeByte(0);
  palette.forEach((color) => writer.writeBytes(color));

  writer.writeBytes([0x21, 0xFF, 0x0B]);
  writer.writeText("NETSCAPE2.0");
  writer.writeBytes([0x03, 0x01, 0x00, 0x00, 0x00]);

  return writer;
}

function appendGifFrame(writer, frame, palette, delayCentiseconds, transparentBackground) {
  const minCodeSize = Math.max(2, Math.ceil(Math.log2(palette.length)));
  const indexed = mapFrameToPalette(frame, palette, transparentBackground);
  writer.writeBytes([0x21, 0xF9, 0x04, transparentBackground ? 0x05 : 0x04]);
  writer.writeShort(delayCentiseconds);
  writer.writeByte(transparentBackground ? 0 : 0);
  writer.writeByte(0);

  writer.writeByte(0x2C);
  writer.writeShort(0);
  writer.writeShort(0);
  writer.writeShort(frame.width);
  writer.writeShort(frame.height);
  writer.writeByte(0);
  writer.writeByte(minCodeSize);
  writeSubBlocks(writer, lzwEncode(indexed, minCodeSize));
}

function finishGif(writer) {
  writer.writeByte(0x3B);
  return writer.toUint8Array();
}

function buildGifFrameTimes(startTime, frameCount, loopDuration) {
  if (frameCount <= 1) {
    return [startTime];
  }

  const forwardFrameCount = Math.floor(frameCount / 2) + 1;
  const frameStep = loopDuration / frameCount;
  const forwardTimes = Array.from(
    { length: forwardFrameCount },
    (_, index) => startTime + frameStep * index
  );
  const reverseTimes = forwardTimes.slice(1, -1).reverse();

  return [...forwardTimes, ...reverseTimes];
}

function getExportFilename(extension) {
  return `shimmer-ink-${Date.now()}.${extension}`;
}

function canShareFile(file) {
  return typeof navigator.share === "function"
    && typeof navigator.canShare === "function"
    && navigator.canShare({ files: [file] });
}

function isShareAbortError(error) {
  return Boolean(error) && error.name === "AbortError";
}

function createExportController({ canvas, paintCanvas }) {
  function getExportBackground() {
    const state = canvas.getState();
    return backgroundById.get(state.exportBackgroundId) || backgroundById.get("paper");
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = filename;
    link.href = url;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function serializeProject() {
    return JSON.stringify(canvas.serializeProjectModel(), null, 2);
  }

  function createTrimmedExportCanvas(background) {
    const state = canvas.getState();
    const bounds = canvas.getExportBounds();
    const sourceScaleX = paintCanvas.width / state.sceneWidth;
    const sourceScaleY = paintCanvas.height / state.sceneHeight;
    const exportCanvas = document.createElement("canvas");

    exportCanvas.width = Math.max(1, Math.round(bounds.width * sourceScaleX));
    exportCanvas.height = Math.max(1, Math.round(bounds.height * sourceScaleY));

    const exportCtx = exportCanvas.getContext("2d");
    canvas.renderCombinedFrame(
      exportCtx,
      performance.now(),
      exportCanvas.width,
      exportCanvas.height,
      bounds,
      background
    );

    return exportCanvas;
  }

  function saveProject() {
    downloadBlob(
      new Blob([serializeProject()], { type: "application/json" }),
      `shimmer-ink-${Date.now()}.shimmerink`
    );
  }

  async function openProjectFile(event) {
    const [file] = event.target.files || [];
    if (!file) {
      return;
    }

    try {
      canvas.loadProjectModel(JSON.parse(await file.text()));
    } catch (error) {
      alert("That project file could not be opened.");
    } finally {
      event.target.value = "";
    }
  }

  async function buildGifBlob() {
    const background = getExportBackground();
    const bounds = canvas.getExportBounds();
    const state = canvas.getState();
    const sourceScaleX = paintCanvas.width / state.sceneWidth;
    const sourceScaleY = paintCanvas.height / state.sceneHeight;
    const width = Math.max(1, Math.round(bounds.width * sourceScaleX));
    const height = Math.max(1, Math.round(bounds.height * sourceScaleY));
    const captureCanvas = document.createElement("canvas");
    const captureCtx = captureCanvas.getContext("2d");
    const frameCount = 18;
    const loopDuration = 1800;
    const delayCentiseconds = Math.max(2, Math.round(loopDuration / frameCount / 10));
    const startTime = performance.now();
    const frameTimes = buildGifFrameTimes(startTime, frameCount, loopDuration);

    captureCanvas.width = width;
    captureCanvas.height = height;
    const transparentBackground = !background.color;
    const backgroundColor = transparentBackground ? null : parseHexColor(background.color);
    const paletteCounts = new Map();

    frameTimes.forEach((time) => {
      canvas.renderCombinedFrame(captureCtx, time, width, height, bounds, background);
      collectGifColorCounts(captureCtx.getImageData(0, 0, width, height), paletteCounts, transparentBackground);
    });

    const palette = buildGifPaletteFromCounts(paletteCounts, transparentBackground, backgroundColor);
    const writer = createGifWriter(width, height, palette);

    frameTimes.forEach((time) => {
      canvas.renderCombinedFrame(captureCtx, time, width, height, bounds, background);
      appendGifFrame(writer, captureCtx.getImageData(0, 0, width, height), palette, delayCentiseconds, transparentBackground);
    });

    return new Blob([finishGif(writer)], { type: "image/gif" });
  }

  async function exportGif() {
    if (canvas.getState().exportingKind) {
      return;
    }

    canvas.setExportingKind("gif");

    try {
      await canvas.waitForNextPaint();
      downloadBlob(await buildGifBlob(), getExportFilename("gif"));
    } catch (error) {
      alert("GIF export failed.");
    } finally {
      canvas.setExportingKind(null);
    }
  }

  async function shareGif() {
    if (canvas.getState().exportingKind) {
      return;
    }

    canvas.setExportingKind("share-gif");

    try {
      await canvas.waitForNextPaint();
      const filename = getExportFilename("gif");
      const blob = await buildGifBlob();
      const file = typeof File === "function"
        ? new File([blob], filename, { type: "image/gif", lastModified: Date.now() })
        : null;

      if (file && canShareFile(file)) {
        try {
          await navigator.share({
            files: [file],
            title: "Glitter Paint",
            text: "Animated glitter paint GIF"
          });
          return;
        } catch (error) {
          if (isShareAbortError(error)) {
            return;
          }
        }
      }

      downloadBlob(blob, filename);
    } catch (error) {
      alert("GIF share failed.");
    } finally {
      canvas.setExportingKind(null);
    }
  }

  async function exportPng() {
    const state = canvas.getState();
    if (state.exportingKind) {
      return;
    }

    canvas.setExportingKind("png");

    try {
      await canvas.waitForNextPaint();
      const background = getExportBackground();
      const exportCanvas = createTrimmedExportCanvas(background);

      const link = document.createElement("a");
      link.download = getExportFilename("png");
      link.href = exportCanvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      alert("PNG export failed.");
    } finally {
      canvas.setExportingKind(null);
    }
  }

  return {
    saveProject,
    openProjectFile,
    exportPng,
    exportGif,
    shareGif
  };
}

export { createExportController };
