/**
 * Format ratio presets for constraining ASCII output aspect ratios.
 */
export const FORMAT_RATIOS = {
    free: { name: 'Free', ratio: null },
    '16:9': { name: '16:9 (Widescreen)', ratio: 16 / 9 },
    '4:3': { name: '4:3 (Classic)', ratio: 4 / 3 },
    '3:2': { name: '3:2 (Photo)', ratio: 3 / 2 },
    '1:1': { name: '1:1 (Square)', ratio: 1 },
    '2:3': { name: '2:3 (Portrait)', ratio: 2 / 3 },
    '3:4': { name: '3:4 (Portrait)', ratio: 3 / 4 },
    '9:16': { name: '9:16 (Vertical)', ratio: 9 / 16 },
} as const;

export type FormatRatioKey = keyof typeof FORMAT_RATIOS;
