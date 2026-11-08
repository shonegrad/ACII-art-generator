/**
 * Web Worker for off-main-thread ASCII conversion.
 *
 * Receives a transferable pixel buffer + options, runs the pure renderAscii
 * algorithm, and posts the result back. Keeps the UI responsive for large
 * images by moving pixel sampling + character mapping off the main thread.
 */

import { renderAscii } from '@/lib/asciiRender';
import type { ConversionOptions } from '@/hooks/useAsciiConverter';

interface WorkerInput {
    /** Raw RGBA pixel buffer (transferable). */
    data: Uint8ClampedArray;
    width: number;
    height: number;
    finalWidth: number;
    finalHeight: number;
    opts: ConversionOptions;
}

self.onmessage = (e: MessageEvent<WorkerInput>) => {
    const { data, width, height, finalWidth, finalHeight, opts } = e.data;
    const { lines, colorLines } = renderAscii(data, width, height, finalWidth, finalHeight, opts);
    (self as unknown as Worker).postMessage({
        asciiOutput: lines.join('\n'),
        coloredOutput: colorLines,
    });
};
