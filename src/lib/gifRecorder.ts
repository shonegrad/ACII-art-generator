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
    /** GIF loop count (0 = infinite, -1 = no loop) */
    loop: number;
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

const KNOB_RANGES: Record<'brightness' | 'contrast' | 'gamma', { min: number; max: number }> = {
    brightness: { min: 0, max: 2 },
    contrast: { min: 0, max: 3 },
    gamma: { min: 0.1, max: 3 },
};

const DEFAULT_FONT_SIZE = 10;
const DEFAULT_LINE_HEIGHT = 1.2;

/** Knob display names for filenames. */
const KNOB_LABELS: Record<'brightness' | 'contrast' | 'gamma', string> = {
    brightness: 'brightness',
    contrast: 'contrast',
    gamma: 'gamma',
};

/** Render ASCII lines to an offscreen canvas, matching the preview style. */
function renderAsciiToCanvas(
    lines: string[],
    colorLines: ColorCell[][],
    colorMode: boolean,
    width: number,
    height: number,
    fontSize: number
): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const lineHeight = fontSize * DEFAULT_LINE_HEIGHT;
    const charWidth = fontSize * 0.6; // approximate monospace advance

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.font = `${fontSize}px 'Courier New', Courier, monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    if (colorMode && colorLines.length > 0) {
        colorLines.forEach((line, lineIndex) => {
            let xPos = 0;
            line.forEach((cell) => {
                ctx.fillStyle = cell.color;
                ctx.fillText(cell.char, xPos, lineIndex * lineHeight);
                xPos += charWidth;
            });
        });
    } else {
        ctx.fillStyle = '#000000';
        lines.forEach((line, index) => {
            ctx.fillText(line, 0, index * lineHeight);
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
    knob: 'brightness' | 'contrast' | 'gamma';
    opts: RecordOptions;
}): Promise<RecordResult> {
    const { duration, fps, loop, width, height, onProgress } = opts;
    const { min, max } = KNOB_RANGES[knob];
    const totalFrames = Math.max(1, Math.round(duration * fps));

    return new Promise((resolve, reject) => {
        let gif: InstanceType<typeof GIF>;
        try {
            gif = new GIF({
                workers: 2,
                workerScript,
                quality: 10,
                width,
                height,
                repeat: loop,
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

        const renderNextFrame = () => {
            if (frameIndex >= totalFrames) {
                gif.render();
                return;
            }

            const t = frameIndex / Math.max(1, totalFrames - 1);
            const value = min + (max - min) * t;

            const frameOpts: ConversionOptions = { ...baseOptions, [knob]: value };

            // Render ASCII grid. Size the grid to fit the output canvas.
            const cellW = Math.max(4, Math.floor(width / 100));
            const cellH = Math.max(6, Math.floor(height / 60));
            const finalWidth = Math.max(1, Math.floor(width / cellW));
            const finalHeight = Math.max(1, Math.floor(height / cellH));

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
                DEFAULT_FONT_SIZE
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
