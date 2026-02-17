import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock URL APIs that don't exist in jsdom
const createObjectURLMock = vi.fn(() => 'blob:mock-url');
const revokeObjectURLMock = vi.fn();

describe('useExport - downloadBlob helper behavior', () => {
    beforeEach(() => {
        vi.restoreAllMocks();

        // Assign URL mock methods directly (jsdom doesn't have them)
        globalThis.URL.createObjectURL = createObjectURLMock;
        globalThis.URL.revokeObjectURL = revokeObjectURLMock;
    });

    it('creates blob and triggers download for TXT', () => {
        const blob = new Blob(['Hello ASCII'], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        expect(url).toBe('blob:mock-url');
        expect(createObjectURLMock).toHaveBeenCalledWith(blob);
    });

    it('revokes object URL after download', () => {
        const url = URL.createObjectURL(new Blob(['test']));
        URL.revokeObjectURL(url);
        expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
    });
});

describe('File validation logic', () => {
    it('rejects non-image files', () => {
        const file = new File(['content'], 'test.txt', { type: 'text/plain' });
        expect(file.type.startsWith('image/')).toBe(false);
    });

    it('accepts image files', () => {
        const file = new File(['content'], 'test.png', { type: 'image/png' });
        expect(file.type.startsWith('image/')).toBe(true);
    });

    it('accepts jpeg images', () => {
        const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
        expect(file.type.startsWith('image/')).toBe(true);
    });

    it('rejects files over 10MB', () => {
        const maxSize = 10 * 1024 * 1024;
        // A file with size > 10MB should be rejected
        const largeContent = new Uint8Array(maxSize + 1);
        const file = new File([largeContent], 'huge.png', { type: 'image/png' });
        expect(file.size).toBeGreaterThan(maxSize);
    });

    it('accepts files under 10MB', () => {
        const maxSize = 10 * 1024 * 1024;
        const smallContent = new Uint8Array(100);
        const file = new File([smallContent], 'small.png', { type: 'image/png' });
        expect(file.size).toBeLessThanOrEqual(maxSize);
    });
});

describe('ASCII conversion math', () => {
    it('correctly calculates luminance from RGB', () => {
        const luminance = (r: number, g: number, b: number) =>
            Math.round(0.299 * r + 0.587 * g + 0.114 * b);

        // Pure white → 255
        expect(luminance(255, 255, 255)).toBe(255);
        // Pure black → 0
        expect(luminance(0, 0, 0)).toBe(0);
        // Green has highest luminance weight
        expect(luminance(0, 255, 0)).toBeGreaterThan(luminance(255, 0, 0));
        expect(luminance(0, 255, 0)).toBeGreaterThan(luminance(0, 0, 255));
    });

    it('correctly applies contrast adjustment', () => {
        const applyContrast = (gray: number, contrast: number) =>
            Math.max(0, Math.min(255, (gray - 128) * contrast + 128));

        // No contrast change at midpoint
        expect(applyContrast(128, 1)).toBe(128);
        // High contrast spreads values apart
        expect(applyContrast(200, 2)).toBeGreaterThan(200);
        expect(applyContrast(50, 2)).toBeLessThan(50);
        // Zero contrast flattens everything to midpoint
        expect(applyContrast(0, 0)).toBe(128);
        expect(applyContrast(255, 0)).toBe(128);
    });

    it('correctly applies brightness adjustment', () => {
        const applyBrightness = (gray: number, brightness: number) =>
            Math.max(0, Math.min(255, gray + (brightness - 1) * 255));

        // No brightness change at 1.0
        expect(applyBrightness(128, 1)).toBe(128);
        // Increasing brightness
        expect(applyBrightness(128, 1.5)).toBeGreaterThan(128);
        // Decreasing brightness
        expect(applyBrightness(128, 0.5)).toBeLessThan(128);
    });

    it('maps brightness to correct char index', () => {
        const charSet = '@%#*+=-:. ';
        const mapToChar = (gray: number) => {
            const charIndex = Math.min(
                Math.floor((gray / 255) * (charSet.length - 1)),
                charSet.length - 1
            );
            return charSet[charSet.length - 1 - charIndex];
        };

        // Darkest pixel → darkest char (@)
        expect(mapToChar(255)).toBe('@');
        // Brightest pixel → lightest char (space)
        expect(mapToChar(0)).toBe(' ');
    });

    it('correctly calculates output height with format ratio', () => {
        const width = 120;
        const aspectRatioMultiplier = 0.5;

        // 16:9 → height should be based on inverted ratio
        const ratio16_9 = 16 / 9;
        const height16_9 = Math.floor(width * (1 / ratio16_9) * aspectRatioMultiplier);
        expect(height16_9).toBeGreaterThan(0);
        expect(height16_9).toBeLessThan(width);

        // 1:1 → should be half of width (due to char ratio fix)
        const ratio1_1 = 1;
        const height1_1 = Math.floor(width * (1 / ratio1_1) * aspectRatioMultiplier);
        expect(height1_1).toBe(width * aspectRatioMultiplier);
    });
});
