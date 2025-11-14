import { useEffect, useState } from "react";

/**
 * Creates a custom diagonal pattern for Chart.js
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
 * @param {string} backgroundColor - The background color
 * @param {string} lineColor - The color of the diagonal lines
 * @returns {CanvasPattern | null} - The created pattern
 */
const createDiagonalPattern = (ctx: CanvasRenderingContext2D, backgroundColor: string, lineColor: string): CanvasPattern | null => {
  const canvas = document.createElement("canvas");
  const size = 10; // Size of the pattern
  canvas.width = size;
  canvas.height = size;

  const patternCtx = canvas.getContext("2d");
  if (patternCtx) {
    // Fill background
    patternCtx.fillStyle = backgroundColor;
    patternCtx.fillRect(0, 0, size, size);

    // Draw diagonal line
    patternCtx.strokeStyle = lineColor;
    patternCtx.lineWidth = 0.8;
    patternCtx.beginPath();
    patternCtx.moveTo(-0.1, -0.1);
    patternCtx.lineTo(size * 1.1, size * 1.1);
    patternCtx.stroke();
  }

  return ctx.createPattern(canvas, "repeat");
};

/**
 * Custom hook to generate a Chart.js pattern
 * @param {string} backgroundColor - The background color
 * @param {string} lineColor - The color of the diagonal lines
 * @returns {CanvasPattern | null} - The generated pattern
 */
const useChartPattern = (backgroundColor: string, lineColor: string): CanvasPattern | null => {
  const [pattern, setPattern] = useState<CanvasPattern | null>(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const generatedPattern = createDiagonalPattern(ctx, backgroundColor, lineColor);
      setPattern(generatedPattern);
    }
  }, [backgroundColor, lineColor]);

  return pattern;
};

export default useChartPattern;
