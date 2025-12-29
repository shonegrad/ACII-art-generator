import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copyToClipboard, getClipboardSupportInfo } from './clipboard';

describe('clipboard utilities', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('copyToClipboard', () => {
        it('should return error for empty text', async () => {
            const result = await copyToClipboard('');
            expect(result.success).toBe(false);
            expect(result.error).toBe('No text provided to copy');
        });

        it('should use modern clipboard API when available', async () => {
            const mockWriteText = vi.fn().mockResolvedValue(undefined);
            Object.assign(navigator.clipboard, { writeText: mockWriteText });

            const result = await copyToClipboard('Hello World');

            expect(result.success).toBe(true);
            expect(result.method).toBe('modern');
            expect(mockWriteText).toHaveBeenCalledWith('Hello World');
        });

        it('should handle ASCII art with special characters', async () => {
            const asciiArt = `
████  ████
█  █  █  █
████  ████
      `.trim();

            const mockWriteText = vi.fn().mockResolvedValue(undefined);
            Object.assign(navigator.clipboard, { writeText: mockWriteText });

            const result = await copyToClipboard(asciiArt);

            expect(result.success).toBe(true);
            expect(mockWriteText).toHaveBeenCalledWith(asciiArt);
        });
    });

    describe('getClipboardSupportInfo', () => {
        it('should return support information', () => {
            const info = getClipboardSupportInfo();

            expect(info).toHaveProperty('hasModernAPI');
            expect(info).toHaveProperty('hasLegacyAPI');
            expect(info).toHaveProperty('isSecureContext');
            expect(typeof info.hasModernAPI).toBe('boolean');
        });
    });
});
