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
  getShareFilename,
  isShareAbortError
} from "./gif-core.js";

function createViewportExportController({ canvas }) {
  function getExportBackground() {
    const state = canvas.getState();
    return backgroundById.get(state.exportBackgroundId) || backgroundById.get("transparent");
  }

  function saveProject() {
    downloadBlob(
      new Blob([JSON.stringify(canvas.serializeProjectModel(), null, 2)], { type: "application/json" }),
      `glitter-paint-${Date.now()}.shimmerink`
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
    const exportScale = Math.max(window.devicePixelRatio || 1, 1);
    const width = Math.max(1, Math.round(bounds.width * exportScale));
    const height = Math.max(1, Math.round(bounds.height * exportScale));
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
      downloadBlob(await buildGifBlob(), getShareFilename("gif"));
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

  return {
    saveProject,
    openProjectFile,
    exportGif,
    shareGif
  };
}

export { createViewportExportController };
