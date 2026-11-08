import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { type CharSetKey } from '@/lib/ascii-charsets';
import { FORMAT_RATIOS, type FormatRatioKey } from '@/lib/format-ratios';
import { renderAscii, SUPER_SAMPLE } from '@/lib/asciiRender';

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
    const [asciiOutput, setAsciiOutput] = useState('');
    const [coloredOutput, setColoredOutput] = useState<ColorCell[][]>([]);
    const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [options, setOptions] = useState<ConversionOptions>(DEFAULT_OPTIONS);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    // OffscreenCanvas is decoupled from the DOM and can be transferred to a
    // Web Worker, making it the preferred surface for pixel processing
    // (progressive enhancement; falls back to a hidden DOM canvas).
    const offscreenCanvasRef = useRef<OffscreenCanvas | null>(null);
    // Worker reference (lazily created) for off-main-thread conversion.
    const workerRef = useRef<Worker | null>(null);
    const processingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cancelledRef = useRef(false);

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

    /** Lazily create a Web Worker for off-main-thread ASCII conversion.
     *  Vite bundles the worker entry point; falls back to local rendering
     *  when Workers are unavailable.
     */
    const getWorker = useCallback((): Worker | null => {
        if (typeof Worker === 'undefined') return null;
        if (!workerRef.current) {
            workerRef.current = new Worker(
                new URL('../workers/asciiWorker.ts', import.meta.url)
            );
        }
        return workerRef.current;
    }, []);

    // Cleanup timeout, mark cancelled on unmount, and terminate the worker
    // so in-flight work doesn't set state on an unmounted component.
    useEffect(() => {
        return () => {
            cancelledRef.current = true;
            if (processingTimeoutRef.current) {
                clearTimeout(processingTimeoutRef.current);
            }
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
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

                    const worker = getWorker();
                    if (worker) {
                        // Offload pixel sampling + character mapping to the worker.
                        // imageData.data is transferred (zero-copy) to the worker.
                        worker.onmessage = (e: MessageEvent<{
                            asciiOutput: string;
                            coloredOutput: ColorCell[][];
                        }>) => {
                            if (cancelledRef.current) return;
                            const { asciiOutput, coloredOutput } = e.data;
                            setAsciiOutput(asciiOutput);
                            setColoredOutput(opts.colorMode ? coloredOutput : []);
                            clearTimeout(safetyTimeout);
                            setIsProcessing(false);
                            if (asciiOutput.length === 0) {
                                toast.error('No ASCII output generated');
                            } else {
                                toast.success(
                                    `ASCII art generated! (${finalWidth}×${finalHeight} characters)`
                                );
                            }
                        };
                        worker.postMessage(
                            {
                                data: imageData.data,
                                width: srcWidth,
                                height: srcHeight,
                                finalWidth,
                                finalHeight,
                                opts,
                            },
                            [imageData.data]
                        );
                    } else {
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
        [getProcessingCanvas, getWorker]
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
    };
}
