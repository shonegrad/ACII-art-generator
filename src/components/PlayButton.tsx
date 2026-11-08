/**
 * Small play (▶) / stop (⏹) button placed beside an animated slider knob.
 * Clicking it starts a live preview of that knob animating in the ASCII output area.
 */

import { useCallback } from 'react';

interface PlayButtonProps {
    /** Knob this button previews */
    knob: 'brightness' | 'contrast' | 'gamma';
    /** Label shown for the knob (e.g. "Brightness") */
    label: string;
    /** Currently previewing knob (null = not previewing) */
    previewKnob: 'brightness' | 'contrast' | 'gamma' | null;
    /** Start preview callback */
    startPreview: (
        knob: 'brightness' | 'contrast' | 'gamma',
        imageUrl: string | null,
        width: number,
        height: number
    ) => Promise<void>;
    /** Stop preview callback */
    stopPreview: () => void;
    /** Source image URL (needed for pixel capture) */
    imageUrl: string | null;
    /** Output canvas size */
    width?: number;
    height?: number;
}

const DEFAULT_WIDTH = 480;
const DEFAULT_HEIGHT = 360;

export function PlayButton({
    knob,
    label,
    previewKnob,
    startPreview,
    stopPreview,
    imageUrl,
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
}: PlayButtonProps) {
    const isPreviewing = previewKnob === knob;

    const handleClick = useCallback(async () => {
        if (isPreviewing) {
            stopPreview();
        } else if (imageUrl) {
            await startPreview(knob, imageUrl, width, height);
        }
    }, [isPreviewing, stopPreview, startPreview, knob, imageUrl, width, height]);

    return (
        <button
            onClick={handleClick}
            disabled={!imageUrl}
            title={
                !imageUrl
                    ? 'Load an image to preview'
                    : isPreviewing
                    ? `Stop ${label} preview`
                    : `Preview ${label} animation`
            }
            aria-label={
                !imageUrl
                    ? 'Preview animation (load an image first)'
                    : isPreviewing
                    ? `Stop ${label} preview`
                    : `Preview ${label} animation`
            }
            className="inline-flex items-center justify-center rounded border border-primary text-primary bg-transparent py-1 px-2 text-xs font-medium hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isPreviewing ? '⏹' : '▶'}
        </button>
    );
}
