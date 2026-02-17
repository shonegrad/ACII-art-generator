import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { ASCII_CHAR_SETS, type CharSetKey } from '@/lib/ascii-charsets';
import { FORMAT_RATIOS, type FormatRatioKey } from '@/lib/format-ratios';

/** Colored character cell for colored ASCII output */
export interface ColorCell {
    char: string;
    color: string;
}

/** Conversion options — replaces positional parameters */
export interface ConversionOptions {
    width: number;
    charset: CharSetKey;
    preserveAspectRatio: boolean;
    aspectRatioMultiplier: number;
    brightness: number;
    contrast: number;
    inverted: boolean;
    colorMode: boolean;
    formatRatio: FormatRatioKey;
}

/** Image dimensions info */
export interface ImageInfo {
    width: number;
    height: number;
    aspectRatio: number;
}

const DEFAULT_OPTIONS: ConversionOptions = {
    width: 120,
    charset: 'standard',
    preserveAspectRatio: true,
    aspectRatioMultiplier: 0.5,
    brightness: 1,
    contrast: 1,
    inverted: false,
    colorMode: true,
    formatRatio: 'free',
};

export function useAsciiConverter() {
    const [asciiOutput, setAsciiOutput] = useState('');
    const [coloredOutput, setColoredOutput] = useState<ColorCell[][]>([]);
    const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [options, setOptions] = useState<ConversionOptions>(DEFAULT_OPTIONS);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const processingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (processingTimeoutRef.current) {
                clearTimeout(processingTimeoutRef.current);
            }
        };
    }, []);

    /** Core conversion: image URL → ASCII text */
    const convert = useCallback(
        (imageUrl: string, opts: ConversionOptions) => {
            // Clear any pending debounce
            if (processingTimeoutRef.current) {
                clearTimeout(processingTimeoutRef.current);
            }

            setIsProcessing(true);

            // Safety timeout to prevent infinite processing
            const safetyTimeout = setTimeout(() => {
                setIsProcessing(false);
                toast.error('Processing timeout — please try again');
            }, 10000);

            const img = document.createElement('img');
            img.crossOrigin = 'Anonymous';

            img.onload = () => {
                try {
                    const originalAspectRatio = img.height / img.width;
                    setImageInfo({
                        width: img.width,
                        height: img.height,
                        aspectRatio: originalAspectRatio,
                    });

                    const canvas = canvasRef.current;
                    if (!canvas) {
                        setIsProcessing(false);
                        toast.error('Canvas not available');
                        return;
                    }

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        setIsProcessing(false);
                        toast.error('Cannot get canvas context');
                        return;
                    }

                    // Calculate dimensions
                    const finalWidth = Math.max(Math.min(opts.width, 200), 10);
                    let finalHeight: number;

                    // Apply format ratio if set, otherwise use image aspect ratio
                    const ratioConfig = FORMAT_RATIOS[opts.formatRatio];
                    if (ratioConfig.ratio !== null && opts.formatRatio !== 'free') {
                        // Format ratio constrains the output shape
                        const targetRatio = 1 / ratioConfig.ratio; // height/width
                        finalHeight = Math.floor(finalWidth * targetRatio * opts.aspectRatioMultiplier);
                    } else if (opts.preserveAspectRatio) {
                        finalHeight = Math.floor(finalWidth * originalAspectRatio * opts.aspectRatioMultiplier);
                    } else {
                        finalHeight = finalWidth;
                    }

                    finalHeight = Math.max(Math.min(finalHeight, 200), 10);

                    canvas.width = finalWidth;
                    canvas.height = finalHeight;
                    ctx.clearRect(0, 0, finalWidth, finalHeight);
                    ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

                    const imageData = ctx.getImageData(0, 0, finalWidth, finalHeight);
                    const pixels = imageData.data;
                    const charSet = ASCII_CHAR_SETS[opts.charset];
                    const chars = charSet.chars;

                    const lines: string[] = [];
                    const colorLines: ColorCell[][] = [];

                    for (let y = 0; y < finalHeight; y++) {
                        let line = '';
                        const colorLine: ColorCell[] = [];

                        for (let x = 0; x < finalWidth; x++) {
                            const offset = (y * finalWidth + x) * 4;
                            const r = pixels[offset] || 0;
                            const g = pixels[offset + 1] || 0;
                            const b = pixels[offset + 2] || 0;

                            // Luminance → grayscale
                            let gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

                            // Apply contrast
                            gray = (gray - 128) * opts.contrast + 128;

                            // Apply brightness
                            gray = gray + (opts.brightness - 1) * 255;

                            // Clamp
                            gray = Math.max(0, Math.min(255, gray));

                            // Invert
                            if (!opts.inverted) {
                                gray = 255 - gray;
                            }

                            // Map to character
                            const charIndex = Math.min(
                                Math.floor((gray / 255) * (chars.length - 1)),
                                chars.length - 1
                            );
                            const selectedChar = chars[chars.length - 1 - charIndex] || ' ';
                            line += selectedChar;

                            if (opts.colorMode) {
                                colorLine.push({ char: selectedChar, color: `rgb(${r}, ${g}, ${b})` });
                            }
                        }

                        // Pad to exact width
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

                    const finalAscii = lines.join('\n');
                    setAsciiOutput(finalAscii);
                    setColoredOutput(opts.colorMode ? colorLines : []);

                    clearTimeout(safetyTimeout);
                    setIsProcessing(false);

                    if (finalAscii.length === 0) {
                        toast.error('No ASCII output generated');
                    } else {
                        toast.success(`ASCII art generated! (${finalWidth}×${lines.length} characters)`);
                    }
                } catch (error) {
                    toast.error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    clearTimeout(safetyTimeout);
                    setIsProcessing(false);
                }
            };

            img.onerror = () => {
                toast.error('Failed to load image');
                clearTimeout(safetyTimeout);
                setIsProcessing(false);
            };

            img.src = imageUrl;
        },
        []
    );

    /** Debounced convert for slider changes */
    const debouncedConvert = useCallback(
        (imageUrl: string, opts: ConversionOptions) => {
            if (processingTimeoutRef.current) {
                clearTimeout(processingTimeoutRef.current);
            }
            processingTimeoutRef.current = setTimeout(() => {
                convert(imageUrl, opts);
            }, 300);
        },
        [convert]
    );

    /** Update a single option and reconvert */
    const updateOption = useCallback(
        <K extends keyof ConversionOptions>(
            key: K,
            value: ConversionOptions[K],
            imageUrl: string | null,
            debounce = false
        ) => {
            setOptions((prev) => {
                const next = { ...prev, [key]: value };
                if (imageUrl && !debounce) {
                    convert(imageUrl, next);
                } else if (imageUrl && debounce) {
                    debouncedConvert(imageUrl, next);
                }
                return next;
            });
        },
        [convert, debouncedConvert]
    );

    return {
        asciiOutput,
        coloredOutput,
        imageInfo,
        isProcessing,
        options,
        canvasRef,
        convert,
        debouncedConvert,
        updateOption,
        setOptions,
    };
}
