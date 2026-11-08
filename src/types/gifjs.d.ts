declare module 'gif.js/dist/gif.worker.js?url' {
    const src: string;
    export default src;
}

declare module 'gif.js' {
    export interface GIFOptions {
        workers?: number;
        workerScript?: string;
        repeat?: number; // 0 = infinite, -1 = no loop
        background?: string;
        width?: number;
        height?: number;
        transparent?: string | null;
        dither?: boolean;
        debug?: boolean;
        quality?: number; // 1-30
        pixelAspect?: number;
    }

    export interface FrameOptions {
        delay?: number; // in hundredths of a second
        copy?: boolean;
        dispose?: number;
    }

    export default class GIF {
        constructor(options?: GIFOptions);
        on(event: 'progress', listener: (p: number) => void): GIF;
        on(event: 'finished', listener: (blob: Blob) => void): GIF;
        addFrame(
            frame: ImageData | HTMLCanvasElement | HTMLImageElement | { getImageData: () => ImageData },
            options?: FrameOptions
        ): void;
        render(): void;
        abort(): void;
    }
}
