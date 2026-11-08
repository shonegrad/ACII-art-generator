/**
 * Small record (●) button placed beside an animated slider knob.
 * Clicking it opens the GIF recorder modal for that knob.
 */

import { useState } from 'react';
import type { ConversionOptions } from '@/hooks/useAsciiConverter';
import { Button } from './ui/button';
import { GifRecorderModal } from './GifRecorderModal';

interface RecordButtonProps {
    /** Knob this button controls */
    knob: 'brightness' | 'contrast' | 'gamma';
    /** Label shown for the knob (e.g. "Brightness") */
    label: string;
    /** Current converter options */
    baseOptions: ConversionOptions;
    /** Source image URL (re-rendered to pixels for recording) */
    imageUrl: string | null;
    /** Render supersampled source pixels (provided by useAsciiConverter) */
    capturePixels: (url: string, width: number, height: number) => Promise<ImageData>;
    /** Output canvas size */
    width?: number;
    height?: number;
}

const DEFAULT_WIDTH = 480;
const DEFAULT_HEIGHT = 360;

export function RecordButton({
    knob,
    label,
    baseOptions,
    imageUrl,
    capturePixels,
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
}: RecordButtonProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const disabled = !imageUrl;

    return (
        <>
            <Button
                onClick={() => setModalOpen(true)}
                disabled={disabled}
                variant="outline"
                size="icon"
                aria-label={`Record ${label} animation`}
                title={disabled ? 'Load an image to record' : `Record ${label} animation (GIF)`}
                className="!text-primary !border-primary hover:bg-primary/10"
            >
                ●
            </Button>

            <GifRecorderModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                knob={knob}
                baseOptions={baseOptions}
                imageUrl={imageUrl || ''}
                capturePixels={capturePixels}
                width={width}
                height={height}
            />
        </>
    );
}
