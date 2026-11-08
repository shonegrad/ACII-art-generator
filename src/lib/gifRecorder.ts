/**
 * Animated GIF recording for ASCII art.
 *
 * Renders a sequence of ASCII frames (one knob animated min→max, others fixed)
 * to an offscreen canvas, then encodes them to a GIF using gif.js (Web Worker
 * backed so the main thread stays responsive during encoding).
 */

import GIF from 'gif.js';
import workerScript from 'gif.js/dist/gif.worker.js?url';
import { renderAscii } from './asciiRender';
import type { ColorCell, ConversionOptions } from '@/hooks/useAsciiConverter';

export interface RecordOptions {
    /** Which knob to animate (brightness | contrast | gamma) */
    knob: 'brightness' | 'contrast' | 'gamma';
    /** Animation duration in seconds */
    duration: number;
    /** Frames per second */
    fps: number;
    /** GIF loop count (0 = infinite, -1 = no loop) or "boomerang" for forward-and-back */
    loop: number | 'boomerang';
    /** Output canvas width in pixels */
    width: number;
    /** Output canvas height in pixels */
    height: number;
    /** Progress callback (0→1) */
    onProgress?: (p: number) => void;
}

export interface RecordResult {
    blob: Blob;
    url: string;
    filename: string;
}

export const KNOB_RANGES: Record<'brightness' | 'contrast' | 'gamma', { min: number; max: number }> = {
    brightness: { min: 0, max: 2 },
    contrast: { min: 0, max: 3 },
    gamma: { min: 0.1, max: 3 },
};

const DEFAULT_FONT_SIZE = 10;

/** Knob display names for filenames. */
const KNOB_LABELS: Record<'brightness' | 'contrast' | 'gamma', string> = {
    brightness: 'brightness',
    contrast: 'contrast',
    gamma: 'gamma',
};

/** Render ASCII lines to an offscreen canvas, tiling characters edge-to-edge
 *  so the whole canvas is filled (no gaps or clipped edges). Character cells
 *  are placed at the exact cellWidth/cellHeight grid computed from the canvas
 *  size divided by grid dimensions, guaranteeing full coverage.
 */
function renderAsciiToCanvas(
    lines: string[],
    colorLines: ColorCell[][],
    colorMode: boolean,
    width: number,
    height: number,
    fontSize: number,
    cellWidth: number,
    cellHeight: number
): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.font = `${fontSize}px 'Courier New', Courier, monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    if (colorMode && colorLines.length > 0) {
        colorLines.forEach((line, lineIndex) => {
            line.forEach((cell, charIndex) => {
                ctx.fillStyle = cell.color;
                ctx.fillText(cell.char, charIndex * cellWidth, lineIndex * cellHeight);
            });
        });
    } else {
        ctx.fillStyle = '#000000';
        lines.forEach((line, index) => {
            // Draw each character individually so every cell aligns to the
            // exact cell grid and the text fills the canvas width/height.
            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if (ch !== ' ') {
                    ctx.fillText(ch, i * cellWidth, index * cellHeight);
                }
            }
        });
    }

    return canvas;
}

/**
 * Record an animated GIF where one knob sweeps min→max while others stay fixed.
 */
export async function recordKnobGif({
    imageData,
    srcWidth,
    srcHeight,
    baseOptions,
    knob,
    opts,
}: {
    /** Supersampled RGBA pixel buffer of the source image */
    imageData: Uint8ClampedArray;
    srcWidth: number;
    srcHeight: number;
    baseOptions: ConversionOptions;
    /** Which knob to animate */
    knob: 'brightness' | 'contrast' | 'gamma';
    opts: RecordOptions;
}): Promise<RecordResult> {
    const { duration, fps, loop, width, height, onProgress } = opts;

    // Validate knob and resolve its animation range
    const range = KNOB_RANGES[knob];
    if (!range) {
        throw new Error(`Invalid knob: ${knob}`);
    }
    const { min, max } = range;
    const forwardFrames = Math.max(1, Math.round(duration * fps));

    // Boomerang renders forward then backward (excluding max endpoint to avoid repeats)
    const isBoomerang = loop === 'boomerang';
    let backFrames = 0;
    if (isBoomerang && forwardFrames > 1) {
        backFrames = forwardFrames - 1;
    }
    const totalFrames = forwardFrames + backFrames;

    return new Promise((resolve, reject) => {
        let gif: InstanceType<typeof GIF>;
        try {
            gif = new GIF({
                workers: 2,
                workerScript,
                quality: 10,
                width,
                height,
                repeat: typeof loop === 'number' ? loop : 0,
                background: '#ffffff',
            });
        } catch (err) {
            reject(err);
            return;
        }

        gif.on('finished', (blob: Blob) => {
            const filename = `ascii-${KNOB_LABELS[knob]}-anim-${Date.now()}.gif`;
            const url = URL.createObjectURL(blob);
            resolve({ blob, url, filename });
        });
        gif.on('progress', (p: number) => {
            onProgress?.(p);
        });

        let frameIndex = 0;

        // Measure true monospace metrics so the ASCII grid tiles the canvas
        // edge-to-edge (no gaps, no clipped edges).
        const measureCanvas = document.createElement('canvas');
        const measureCtx = measureCanvas.getContext('2d');
        if (!measureCtx) {
            reject(new Error('Cannot measure text metrics'));
            return;
        }
        measureCtx.font = `${DEFAULT_FONT_SIZE}px 'Courier New', Courier, monospace`;
        const charWidth = measureCtx.measureText('M').width || DEFAULT_FONT_SIZE * 0.6;

        // Size the ASCII grid to fill the output canvas exactly.
        // Use measured char metrics to pick grid dimensions, then compute
        // exact cellWidth/cellHeight so finalWidth * cellWidth === width
        // and finalHeight * cellHeight === height — zero gaps.
        const finalWidth = Math.max(1, Math.floor(width / charWidth));
        const finalHeight = Math.max(1, Math.floor(height / charWidth * 1.15));
        const cellWidth = width / finalWidth;
        const cellHeight = height / finalHeight;

        const renderNextFrame = () => {
            if (frameIndex >= totalFrames) {
                gif.render();
                return;
            }

            // Compute normalized position t (0→1) for this frame
            let t: number;
            if (isBoomerang && frameIndex >= forwardFrames) {
                // Backward pass: max→min, excluding max at start
                const backIndex = frameIndex - forwardFrames;
                t = forwardFrames > 1 ? 1 - (backIndex + 1) / (forwardFrames - 1) : 0;
            } else {
                // Forward pass: min→max
                t = forwardFrames > 1 ? frameIndex / (forwardFrames - 1) : 0;
            }

            const value = min + (max - min) * t;

            // Explicitly set the animated knob while keeping others at base values
            const frameOpts: ConversionOptions = { ...baseOptions };
            if (knob === 'brightness') {
                frameOpts.brightness = value;
            } else if (knob === 'contrast') {
                frameOpts.contrast = value;
            } else if (knob === 'gamma') {
                frameOpts.gamma = value;
            }

            const { lines, colorLines } = renderAscii(
                imageData,
                srcWidth,
                srcHeight,
                finalWidth,
                finalHeight,
                frameOpts
            );

            const frameCanvas = renderAsciiToCanvas(
                lines,
                colorLines,
                frameOpts.colorMode,
                width,
                height,
                DEFAULT_FONT_SIZE,
                cellWidth,
                cellHeight
            );

            gif.addFrame(frameCanvas, { delay: Math.round(100 / fps), copy: true });
            frameIndex++;

            // Use setTimeout (not requestAnimationFrame) so the gif.js Web
            // Workers can breathe between frames and the UI stays responsive.
            setTimeout(renderNextFrame, 0);
        };

        renderNextFrame();
    });
}
