import { describe, it, expect } from 'vitest';
import { ASCII_CHAR_SETS } from './ascii-charsets';
import { FORMAT_RATIOS } from './format-ratios';

describe('ASCII_CHAR_SETS', () => {
    it('contains expected standard charsets', () => {
        expect(ASCII_CHAR_SETS.standard).toBeDefined();
        expect(ASCII_CHAR_SETS.detailed).toBeDefined();
        expect(ASCII_CHAR_SETS.blocks).toBeDefined();
        expect(ASCII_CHAR_SETS.matrix).toBeDefined();
    });

    it('all charsets have non-empty chars string and a name', () => {
        for (const [_key, set] of Object.entries(ASCII_CHAR_SETS)) {
            expect(set.chars.length).toBeGreaterThan(0);
            expect(set.name).toBeDefined();
            expect(set.name.length).toBeGreaterThan(0);
            // Every charset should end with a space for "empty" pixels
            expect(set.chars[set.chars.length - 1]).toBe(' ');
        }
    });

    it('standard charset has expected character order (dark to light)', () => {
        const chars = ASCII_CHAR_SETS.standard.chars;
        // First char is darkest (@), last is lightest (space)
        expect(chars[0]).toBe('@');
        expect(chars[chars.length - 1]).toBe(' ');
    });

    it('has at least 10 charsets', () => {
        expect(Object.keys(ASCII_CHAR_SETS).length).toBeGreaterThanOrEqual(10);
    });
});

describe('FORMAT_RATIOS', () => {
    it('contains expected presets', () => {
        expect(FORMAT_RATIOS.free).toBeDefined();
        expect(FORMAT_RATIOS['16:9']).toBeDefined();
        expect(FORMAT_RATIOS['4:3']).toBeDefined();
        expect(FORMAT_RATIOS['1:1']).toBeDefined();
    });

    it('free ratio has null ratio value', () => {
        expect(FORMAT_RATIOS.free.ratio).toBeNull();
    });

    it('numeric ratios are mathematically correct', () => {
        expect(FORMAT_RATIOS['16:9'].ratio).toBeCloseTo(16 / 9, 5);
        expect(FORMAT_RATIOS['4:3'].ratio).toBeCloseTo(4 / 3, 5);
        expect(FORMAT_RATIOS['1:1'].ratio).toBe(1);
        expect(FORMAT_RATIOS['9:16'].ratio).toBeCloseTo(9 / 16, 5);
    });

    it('all entries have a name', () => {
        for (const [, ratio] of Object.entries(FORMAT_RATIOS)) {
            expect(ratio.name).toBeDefined();
            expect(ratio.name.length).toBeGreaterThan(0);
        }
    });
});
