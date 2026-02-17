/**
 * ASCII character set definitions for image-to-ASCII conversion.
 * Each set maps brightness values to characters with different visual styles.
 */
export const ASCII_CHAR_SETS = {
    standard: {
        name: 'Standard',
        chars: '@%#*+=-:. ',
    },
    detailed: {
        name: 'Detailed',
        chars: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\\"^`\'. ',
    },
    simple: {
        name: 'Simple',
        chars: '█▉▊▋▌▍▎▏ ',
    },
    blocks: {
        name: 'Blocks',
        chars: '██▓▒░  ',
    },
    dots: {
        name: 'Dots',
        chars: '●◐○◌ ',
    },
    braille: {
        name: 'Braille',
        chars: '⣿⣾⣽⣻⣟⣯⣷⣿⡿⠿⠻⠟⠯⠷⠿⡇⠇⠃⠁ ',
    },
    geometric: {
        name: 'Geometric',
        chars: '◆◇◈◉◎●○◦∘∙ ',
    },
    technical: {
        name: 'Technical',
        chars: '▓▒░▚▞▛▜▟▙▘▝▗▖ ',
    },
    lines: {
        name: 'Lines',
        chars: '║│┃┊┋┌┐└┘├┤┬┴┼ ',
    },
    slopes: {
        name: 'Slopes',
        chars: '╱╲╳▲▼◄►◢◣◤◥ ',
    },
    retro: {
        name: 'Retro',
        chars: '▀▄█▌▐░▒▓ ',
    },
    minimal: {
        name: 'Minimal',
        chars: '██░░  ',
    },
    organic: {
        name: 'Organic',
        chars: '※●◐○◦∘∙⋅· ',
    },
    matrix: {
        name: 'Matrix',
        chars: '1 0  ',
    },
    artistic: {
        name: 'Artistic',
        chars: '▓▒░▨▦▥▤▣▢▧▩⬛⬜ ',
    },
} as const;

export type CharSetKey = keyof typeof ASCII_CHAR_SETS;
