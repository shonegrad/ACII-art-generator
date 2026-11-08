import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { type CharSetKey } from '@/lib/ascii-charsets';
import { FORMAT_RATIOS, type FormatRatioKey } from '@/lib/format-ratios';
import { renderAscii, SUPER_SAMPLE } from '@/lib/asciiRender';
import { KNOB_RANGES } from '@/lib/gifRecorder';

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
    gamma: number;
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

export const DEFAULT_OPTIONS: ConversionOptions = {
    width: 120,
    charset: 'standard',
    preserveAspectRatio: true,
    aspectRatioMultiplier: 0.5,
    brightness: 0.8,
    contrast: 1.2,
    gamma: 1.0,
    inverted: false,
    colorMode: true,
    formatRatio: 'free',
};

export function useAsciiConverter() {
    const DEFAULT_FONT_SIZE = 10;
    const [asciiOutput, setAsciiOutput] = useState('');
    const [coloredOutput, setColoredOutput] = useState<ColorCell[][]>([]);
    const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [options, setOptions] = useState<ConversionOptions>(DEFAULT_OPTIONS);
    const [previewKnob, setPreviewKnob] = useState<'brightness' | 'contrast' | 'gamma' | null>(null);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    // OffscreenCanvas is decoupled from the DOM; preferred processing surface
    // with hidden DOM canvas fallback.
    const offscreenCanvasRef = useRef<OffscreenCanvas | null>(null);
    const processingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cancelledRef = useRef(false);

    // Preview state for live animation preview (not a GIF export)
    const previewKnobRef = useRef<'brightness' | 'contrast' | 'gamma' | null>(null);
    const previewActiveRef = useRef(false);
    const previewStartTimeRef = useRef<number>(0);
    const previewFrameRef = useRef<number>(0);
    const previewPixelsRef = useRef<ImageData | null>(null);
    const previewSrcWidthRef = useRef(0);
    const previewSrcHeightRef = useRef(0);
    const previewCharAspectRef = useRef(0.5); // charWidth/lineHeight ≈ 0.52

    /** Acquire a 2D canvas surface sized for processing.
     *  Prefers OffscreenCanvas (no DOM sync, worker-compatible); falls back to
     *  a hidden <canvas> element in older browsers.
     */
    const getProcessingCanvas = useCallback(
        (width: number, height: number): HTMLCanvasElement | OffscreenCanvas => {
            if (typeof OffscreenCanvas !== 'undefined') {
                const existing = offscreenCanvasRef.current;
                if (existing && existing.width === width && existing.height === height) {
                    return existing;
                }
                const canvas = new OffscreenCanvas(width, height);
                offscreenCanvasRef.current = canvas;
                return canvas;
            }
            let domCanvas = canvasRef.current;
            if (!domCanvas) {
                domCanvas = document.createElement('canvas');
                domCanvas.style.display = 'none';
                document.body.appendChild(domCanvas);
                canvasRef.current = domCanvas;
            }
            domCanvas.width = width;
            domCanvas.height = height;
            return domCanvas;
        },
        []
    );

    // Cleanup timeout and mark cancelled on unmount so in-flight
    // image loads don't set state on an unmounted component.
    useEffect(() => {
        return () => {
            cancelledRef.current = true;
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

            cancelledRef.current = false;
            setIsProcessing(true);

            // Safety timeout to prevent infinite processing
            const safetyTimeout = setTimeout(() => {
                if (cancelledRef.current) return;
                setIsProcessing(false);
                toast.error('Processing timeout — please try again');
            }, 10000);

            const img = document.createElement('img');
            img.crossOrigin = 'Anonymous';

            img.onload = () => {
                if (cancelledRef.current) return;
                try {
                    const originalAspectRatio = img.height / img.width;
                    setImageInfo({
                        width: img.width,
                        height: img.height,
                        aspectRatio: originalAspectRatio,
                    });

                    // Calculate dimensions
                    const finalWidth = Math.max(Math.min(opts.width, 200), 10);
                    let finalHeight: number;

                    // Apply format ratio if set, otherwise use image aspect ratio
                    const ratioConfig = FORMAT_RATIOS[opts.formatRatio];
                    if (ratioConfig.ratio !== null && opts.formatRatio !== 'free') {
                        const targetRatio = 1 / ratioConfig.ratio; // height/width
                        finalHeight = Math.floor(finalWidth * targetRatio * opts.aspectRatioMultiplier);
                    } else if (opts.preserveAspectRatio) {
                        finalHeight = Math.floor(finalWidth * originalAspectRatio * opts.aspectRatioMultiplier);
                    } else {
                        finalHeight = finalWidth;
                    }

                    finalHeight = Math.max(Math.min(finalHeight, 200), 10);

                    // Acquire a processing canvas (OffscreenCanvas preferred, DOM fallback)
                    const canvas = getProcessingCanvas(finalWidth * SUPER_SAMPLE, finalHeight * SUPER_SAMPLE);
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        setIsProcessing(false);
                        toast.error('Cannot get canvas context');
                        return;
                    }

                    ctx.clearRect(0, 0, finalWidth * SUPER_SAMPLE, finalHeight * SUPER_SAMPLE);
                    ctx.drawImage(
                        img,
                        0,
                        0,
                        finalWidth * SUPER_SAMPLE,
                        finalHeight * SUPER_SAMPLE
                    );

                    const imageData = ctx.getImageData(
                        0,
                        0,
                        finalWidth * SUPER_SAMPLE,
                        finalHeight * SUPER_SAMPLE
                    );

                    const srcWidth = finalWidth * SUPER_SAMPLE;
                    const srcHeight = finalHeight * SUPER_SAMPLE;

                    const { lines, colorLines } = renderAscii(
                        imageData.data,
                        srcWidth,
                        srcHeight,
                        finalWidth,
                        finalHeight,
                        opts
                    );
                    const asciiOutput = lines.join('\n');
                    setAsciiOutput(asciiOutput);
                    setColoredOutput(opts.colorMode ? colorLines : []);
                    clearTimeout(safetyTimeout);
                    setIsProcessing(false);
                    if (asciiOutput.length === 0) {
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
                if (cancelledRef.current) return;
                toast.error('Failed to load image');
                clearTimeout(safetyTimeout);
                setIsProcessing(false);
            };

            img.src = imageUrl;
        },
        [getProcessingCanvas]
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

    /** Render the source image to a supersampled canvas and return its ImageData.
     *  Used by the GIF recorder to get source pixels without touching the live preview.
     */
    const captureSupersampledPixels = useCallback(
        (imageUrl: string, finalWidth: number, finalHeight: number): Promise<ImageData> => {
            return new Promise((resolve, reject) => {
                const img = document.createElement('img');
                img.crossOrigin = 'Anonymous';
                img.onload = () => {
                    try {
                        const canvas = getProcessingCanvas(
                            finalWidth * SUPER_SAMPLE,
                            finalHeight * SUPER_SAMPLE
                        );
                        const ctx = canvas.getContext('2d');
                        if (!ctx) {
                            reject(new Error('Cannot get canvas context'));
                            return;
                        }
                        ctx.clearRect(
                            0,
                            0,
                            finalWidth * SUPER_SAMPLE,
                            finalHeight * SUPER_SAMPLE
                        );
                        ctx.drawImage(
                            img,
                            0,
                            0,
                            finalWidth * SUPER_SAMPLE,
                            finalHeight * SUPER_SAMPLE
                        );
                        resolve(
                            ctx.getImageData(
                                0,
                                0,
                                finalWidth * SUPER_SAMPLE,
                                finalHeight * SUPER_SAMPLE
                            )
                        );
                    } catch (err) {
                        reject(err);
                    }
                };
                img.onerror = () => {
                    reject(new Error('Failed to load image'));
                };
                img.src = imageUrl;
            });
        },
        [getProcessingCanvas]
    );

    /** Set the ASCII output directly for live preview (bypasses convert pipeline). */
    const setPreviewFrame = useCallback((lines: string[], colorLines: ColorCell[][]) => {
        setAsciiOutput(lines.join('\n'));
        setColoredOutput(colorLines);
    }, []);

    /** Start a live preview animation for the given knob. */
    const startPreview = useCallback(
        async (
            knob: 'brightness' | 'contrast' | 'gamma',
            imageUrl: string | null,
            width: number,
            height: number
        ) => {
            if (previewActiveRef.current) stopPreview();
            if (!imageUrl) return;

            // Capture supersampled source pixels once for fast re-rendering
            const imageData = await captureSupersampledPixels(imageUrl, width, height);
            previewPixelsRef.current = imageData;
            previewSrcWidthRef.current = imageData.width;
            previewSrcHeightRef.current = imageData.height;
            previewKnobRef.current = knob;
            setPreviewKnob(knob);
            previewActiveRef.current = true;
            previewStartTimeRef.current = performance.now();

            // Measure exact char cell aspect ratio so preview isn't stretched
            const measureCanvas = document.createElement('canvas');
            const measureCtx = measureCanvas.getContext('2d');
            if (measureCtx) {
                measureCtx.font = `${DEFAULT_FONT_SIZE}px 'Courier New', Courier, monospace`;
                const mw = measureCtx.measureText('M').width || DEFAULT_FONT_SIZE * 0.6;
                const charAspectRatio = mw / (DEFAULT_FONT_SIZE * 1.15); // width/height of a char cell (~0.52)
                previewCharAspectRef.current = charAspectRatio;
            }

            const loop = () => {
                if (!previewActiveRef.current) return;

                const now = performance.now();
                const elapsed = (now - previewStartTimeRef.current) / 1000; // seconds
                const duration = 2; // 2 second cycle
                const cycle = elapsed % duration;
                const t = cycle / duration; // 0 → 1 over duration

                // Boomerang: forward then back
                const tBoomerang = t < 0.5 ? t * 2 : (1 - t) * 2;

                const { min, max } = KNOB_RANGES[knob];
                const value = min + (max - min) * tBoomerang;

                // Re-render with animated knob value using pure render (fast)
                // Compute grid dimensions preserving source image aspect ratio.
                // Character cells are ~2x taller than wide (charAspectRatio ≈ 0.5),
                // so we apply that multiplier to prevent vertical stretching.
                const imageAspectRatio =
                    previewSrcHeightRef.current / previewSrcWidthRef.current; // height/width
                const gridWidth = Math.max(20, Math.min(120, Math.floor(width / 10)));
                const gridHeight = Math.max(
                    10,
                    Math.floor(
                        gridWidth * imageAspectRatio * previewCharAspectRef.current
                    )
                );

                const { lines, colorLines } = renderAscii(
                    previewPixelsRef.current!.data,
                    previewSrcWidthRef.current,
                    previewSrcHeightRef.current,
                    gridWidth,
                    gridHeight,
                    { ...options, [knob]: value } as ConversionOptions
                );

                setPreviewFrame(lines, colorLines);
                previewFrameRef.current = requestAnimationFrame(loop);
            };
            previewFrameRef.current = requestAnimationFrame(loop);
        },
        [captureSupersampledPixels, renderAscii, setPreviewFrame, options]
    );

    /** Stop the live preview and restore the original option value. */
    const stopPreview = useCallback(() => {
        previewActiveRef.current = false;
        if (previewFrameRef.current) {
            cancelAnimationFrame(previewFrameRef.current);
        }
        previewKnobRef.current = null;
        setPreviewKnob(null);
        previewPixelsRef.current = null;
    }, []);

    // Cleanup preview on unmount
    useEffect(() => {
        return () => {
            stopPreview();
        };
    }, [stopPreview]);

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
        captureSupersampledPixels,
        startPreview,
        stopPreview,
        previewKnob,
    };
}
