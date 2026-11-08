/**
 * Pure ASCII rendering — worker-portable (no React/DOM imports).
 *
 * Converts a pixel buffer into ASCII art lines using supersampling (to
 * suppress jaggies from nearest-neighbor downsampling) and a power-curve
 * contrast enhancement (to sharpen boundaries between light/dark regions),
 * following the techniques described in
 * "ASCII characters are not pixels: a deep dive into ASCII rendering"
 * (alexharri.com).
 */

import { ASCII_CHAR_SETS } from '@/lib/ascii-charsets';
import type { ColorCell, ConversionOptions } from '@/hooks/useAsciiConverter';

/** Internal rendering quality knobs (not exposed to the UI yet). */
export const SUPER_SAMPLE = 2; // render at N× linear resolution, then average → anti-aliased edges
export const CONTRAST_ENHANCE_EXPONENT = 1.15; // >1 pulls mid-tones darker, sharpening boundaries

/** Render pixel data → ASCII lines (pure, worker-portable). */
export function renderAscii(
    pixels: Uint8ClampedArray,
    srcWidth: number,
    srcHeight: number,
    finalWidth: number,
    finalHeight: number,
    opts: ConversionOptions
): { lines: string[]; colorLines: ColorCell[][] } {
    const charSet = ASCII_CHAR_SETS[opts.charset];
    const chars = charSet.chars;

    const lines: string[] = [];
    const colorLines: ColorCell[][] = [];

    // Each output cell covers a SUPER_SAMPLE×SUPER_SAMPLE block of source pixels.
    const sx = srcWidth / finalWidth;
    const sy = srcHeight / finalHeight;

    for (let y = 0; y < finalHeight; y++) {
        let line = '';
        const colorLine: ColorCell[] = [];

        const yy0 = Math.floor(y * sy);
        const yy1 = Math.ceil((y + 1) * sy);

        for (let x = 0; x < finalWidth; x++) {
            const xx0 = Math.floor(x * sx);
            const xx1 = Math.ceil((x + 1) * sx);

            // Average luminance over the supersampled block covering this cell.
            let sumR = 0;
            let sumG = 0;
            let sumB = 0;
            let count = 0;
            for (let yy = yy0; yy < yy1; yy++) {
                for (let xx = xx0; xx < xx1; xx++) {
                    if (yy >= srcHeight || xx >= srcWidth) continue;
                    const offset = (yy * srcWidth + xx) * 4;
                    sumR += pixels[offset] || 0;
                    sumG += pixels[offset + 1] || 0;
                    sumB += pixels[offset + 2] || 0;
                    count++;
                }
            }
            const r = count ? Math.round(sumR / count) : 0;
            const g = count ? Math.round(sumG / count) : 0;
            const b = count ? Math.round(sumB / count) : 0;

            // Luminance → grayscale (Rec. 601 luma)
            let gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

            // Gamma correction (perceptual mid-tone weighting)
            const norm = gray / 255;
            gray = Math.round(255 * Math.pow(norm, 1 / opts.gamma));

            // Contrast
            gray = (gray - 128) * opts.contrast + 128;

            // Brightness
            gray = gray + (opts.brightness - 1) * 255;

            // Clamp
            gray = Math.max(0, Math.min(255, gray));

            // Invert
            if (opts.inverted) {
                gray = 255 - gray;
            }

            // Contrast enhancement: power curve on normalized lightness.
            // Pulls mid-tones toward zero, exaggerating boundaries between
            // dark/mid regions (sharper-looking ASCII output).
            const enhancedNorm = Math.pow(gray / 255, CONTRAST_ENHANCE_EXPONENT);
            gray = Math.round(enhancedNorm * 255);

            // Map to character (dark-to-light ordered charset)
            const charIndex = Math.min(
                Math.floor((gray / 255) * (chars.length - 1)),
                chars.length - 1
            );
            const selectedChar = chars[charIndex] || ' ';
            line += selectedChar;

            if (opts.colorMode) {
                colorLine.push({ char: selectedChar, color: `rgb(${r}, ${g}, ${b})` });
            }
        }

        lines.push(line.padEnd(finalWidth, ' ').substring(0, finalWidth));
        if (opts.colorMode) {
            colorLines.push(colorLine);
        }
    }

    // Ensure exact height
    while (lines.length < finalHeight) {
        lines.push(' '.repeat(finalWidth));
    }
    if (lines.length > finalHeight) {
        lines.splice(finalHeight);
    }

    return { lines, colorLines };
}
