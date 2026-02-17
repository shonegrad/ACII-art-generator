import { useCallback } from 'react';
import { toast } from 'sonner';
import type { ColorCell } from './useAsciiConverter';

interface ExportOptions {
    asciiOutput: string;
    coloredOutput: ColorCell[][];
    colorMode: boolean;
}

export function useExport({ asciiOutput, coloredOutput, colorMode }: ExportOptions) {
    /** Download as plain text file */
    const downloadTxt = useCallback(() => {
        if (!asciiOutput) return;
        const blob = new Blob([asciiOutput], { type: 'text/plain' });
        downloadBlob(blob, `ascii-art-${Date.now()}.txt`);
        toast.success('ASCII art downloaded!');
    }, [asciiOutput]);

    /** Render to PNG and download */
    const downloadPng = useCallback(() => {
        if (!asciiOutput) return;

        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return;

        const fontSize = 12;
        const lineHeight = fontSize * 1.2;
        const fontFamily = 'Courier New, monospace';
        ctx.font = `${fontSize}px ${fontFamily}`;

        const lines = asciiOutput.split('\n');
        const maxLineLength = Math.max(...lines.map((l) => l.length));
        const charWidth = ctx.measureText('M').width;
        const padding = 20;

        tempCanvas.width = maxLineLength * charWidth + padding * 2;
        tempCanvas.height = lines.length * lineHeight + padding * 2;

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        if (colorMode && coloredOutput.length > 0) {
            coloredOutput.forEach((line, lineIndex) => {
                let xPos = padding;
                line.forEach((cell) => {
                    ctx.fillStyle = cell.color;
                    ctx.fillText(cell.char, xPos, padding + lineIndex * lineHeight);
                    xPos += charWidth;
                });
            });
        } else {
            ctx.fillStyle = '#000000';
            lines.forEach((line, index) => {
                ctx.fillText(line, padding, padding + index * lineHeight);
            });
        }

        tempCanvas.toBlob((blob) => {
            if (!blob) {
                toast.error('Failed to generate PNG');
                return;
            }
            downloadBlob(blob, `ascii-art-${Date.now()}.png`);
            toast.success('ASCII art PNG downloaded!');
        }, 'image/png');
    }, [asciiOutput, coloredOutput, colorMode]);

    /** Generate and download SVG */
    const downloadSvg = useCallback(() => {
        if (!asciiOutput) return;

        const lines = asciiOutput.split('\n');
        const fontSize = 12;
        const lineHeight = 14.4;
        const charWidth = fontSize * 0.6;

        const maxLineLength = Math.max(...lines.map((l) => l.length));
        const width = maxLineLength * charWidth + 40;
        const height = lines.length * lineHeight + 40;

        const escapeXML = (str: string) =>
            str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');

        let content: string;

        if (colorMode && coloredOutput.length > 0) {
            content = coloredOutput
                .map((line, lineIndex) => {
                    const lineContent = line
                        .map(
                            (cell, charIndex) =>
                                `<tspan x="${20 + charIndex * charWidth}" fill="${cell.color}">${escapeXML(cell.char)}</tspan>`
                        )
                        .join('');
                    return `<tspan y="${20 + lineIndex * lineHeight + fontSize}">${lineContent}</tspan>`;
                })
                .join('\n');
        } else {
            content = lines
                .map(
                    (line, i) =>
                        `<tspan x="20" dy="${i === 0 ? '1em' : '1.2em'}">${escapeXML(line)}</tspan>`
                )
                .join('');
        }

        const textAttrs =
            colorMode && coloredOutput.length > 0
                ? ''
                : ' x="20" y="20" fill="black"';

        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  <text${textAttrs} font-family="'Courier New', Courier, monospace" font-size="${fontSize}px" xml:space="preserve">
${content}
  </text>
</svg>`;

        const blob = new Blob([svg], { type: 'image/svg+xml' });
        downloadBlob(blob, `ascii-art-${Date.now()}.svg`);
        toast.success('ASCII art SVG downloaded!');
    }, [asciiOutput, coloredOutput, colorMode]);

    return { downloadTxt, downloadPng, downloadSvg };
}

/** Shared helper to trigger a file download from a blob */
function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Defer removal and revocation to ensure Chrome/Safari process the download
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}
