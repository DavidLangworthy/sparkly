import { parseHexColor, backgroundById } from "./ink.js";
import {
  appendGifFrame,
  buildGifFrameTimes,
  buildGifPaletteFromCounts,
  canShareFile,
  collectGifColorCounts,
  createGifWriter,
  downloadBlob,
  finishGif,
  getExportFilename,
  getShareFilename,
  isShareAbortError
} from "./gif-core.js";

function createExportController({ canvas, paintCanvas }) {
  function getExportBackground() {
    const state = canvas.getState();
    return backgroundById.get(state.exportBackgroundId) || backgroundById.get("paper");
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
      const filename = getShareFilename("gif");
      const blob = await buildGifBlob();
      const file = typeof File === "function"
        ? new File([blob], filename, { type: "image/gif", lastModified: Date.now() })
        : null;

      if (file && canShareFile(file)) {
        try {
          await navigator.share({ files: [file] });
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
