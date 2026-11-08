/**
 * Animated GIF recorder dialog.
 *
 * Lets the user configure duration/FPS/loop and record a GIF where one knob
 * (brightness / contrast / gamma) sweeps its full range while the others stay fixed.
 */

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { recordKnobGif } from '@/lib/gifRecorder';
import type { ConversionOptions } from '@/hooks/useAsciiConverter';

interface GifRecorderModalProps {
    open: boolean;
    onClose: () => void;
    /** Knob to animate */
    knob: 'brightness' | 'contrast' | 'gamma';
    /** Current converter options (other knobs stay at these values) */
    baseOptions: ConversionOptions;
    /** Source image URL (re-rendered to pixels for recording) */
    imageUrl: string;
    /** Render supersampled source pixels (provided by useAsciiConverter) */
    capturePixels: (url: string, width: number, height: number) => Promise<ImageData>;
    /** Output canvas size */
    width: number;
    height: number;
}

const DEFAULT_DURATION = 3;
const DEFAULT_FPS = 15;
const DEFAULT_LOOP = 0;

export function GifRecorderModal({
    open,
    onClose,
    knob,
    baseOptions,
    imageUrl,
    capturePixels,
    width,
    height,
}: GifRecorderModalProps) {
    const [duration, setDuration] = useState(DEFAULT_DURATION);
    const [fps, setFps] = useState(DEFAULT_FPS);
    const [loop, setLoop] = useState(DEFAULT_LOOP);
    const [recording, setRecording] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleClose = useCallback(() => {
        setRecording(false);
        setProgress(0);
        onClose();
    }, [onClose]);

    const handleRecord = useCallback(async () => {
        if (recording) return;
        if (!imageUrl) return;
        setRecording(true);
        setProgress(0);

        try {
            // Capture supersampled source pixels (re-render image offscreen)
            const imageData = await capturePixels(imageUrl, width, height);

            const result = await recordKnobGif({
                imageData: imageData.data,
                srcWidth: imageData.width,
                srcHeight: imageData.height,
                baseOptions,
                knob,
                opts: {
                    knob,
                    duration,
                    fps,
                    loop,
                    width,
                    height,
                    onProgress: setProgress,
                },
            });

            // Auto-download
            const a = document.createElement('a');
            a.href = result.url;
            a.download = result.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(result.url);

            toast.success(`GIF saved (${knob} animation)`);
        } catch (err) {
            toast.error(
                `Failed to record GIF: ${err instanceof Error ? err.message : 'Unknown error'}`
            );
        } finally {
            setRecording(false);
            setProgress(0);
        }
    }, [recording, knob, baseOptions, imageUrl, capturePixels, duration, fps, loop, width, height]);

    const knobLabel = knob.charAt(0).toUpperCase() + knob.slice(1);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
                backgroundColor: 'rgba(10, 10, 10, 0.85)',
                backdropFilter: 'blur(8px)',
            }}
            onClick={handleClose}
        >
            <div
                className="bg-surface-1 border border-outline-variant rounded-xl p-6 shadow-2xl text-on-surface"
                style={{
                    minWidth: '320px',
                    maxWidth: '440px',
                    width: '90vw',
                    backgroundColor: 'var(--surface-1)',
                    color: 'var(--on-surface)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Record GIF</h3>
                    <button
                        onClick={handleClose}
                        className="text-on-surface-variant hover:text-on-surface"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                <p className="text-sm text-on-surface-variant mb-4">
                    Animate <strong>{knobLabel}</strong> from minimum to maximum while other knobs stay fixed.
                </p>

                {/* Settings */}
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-xs text-on-surface-variant mb-1">
                            Duration (seconds)
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="30"
                            value={duration}
                            onChange={(e) => setDuration(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                            className="w-full p-2 rounded border border-outline-variant bg-surface-2 text-on-surface"
                            disabled={recording}
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-on-surface-variant mb-1">
                            Frames per second
                        </label>
                        <input
                            type="number"
                            min="5"
                            max="30"
                            value={fps}
                            onChange={(e) => setFps(Math.max(5, Math.min(30, Number(e.target.value) || 15)))}
                            className="w-full p-2 rounded border border-outline-variant bg-surface-2 text-on-surface"
                            disabled={recording}
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-on-surface-variant mb-1">
                            Loop
                        </label>
                        <select
                            value={loop}
                            onChange={(e) => setLoop(Number(e.target.value))}
                            className="w-full p-2 rounded border border-outline-variant bg-surface-2 text-on-surface"
                            disabled={recording}
                        >
                            <option value={0}>Infinite</option>
                            <option value={1}>Once</option>
                            <option value={2}>Twice</option>
                            <option value={5}>5 times</option>
                        </select>
                    </div>
                </div>

                {/* Progress / Action */}
                {recording ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-on-surface-variant">Encoding GIF…</span>
                            <span className="font-mono text-xs">{Math.round(progress * 100)}%</span>
                        </div>
                        <div
                            className="w-full bg-surface-2 rounded-full h-2 overflow-hidden"
                            style={{ backgroundColor: 'var(--surface-2)' }}
                        >
                            <div
                                className="h-full"
                                style={{
                                    backgroundColor: 'var(--primary)',
                                    width: `${Math.round(progress * 100)}%`,
                                    transition: 'width 150ms ease-out',
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={handleRecord}
                        disabled={recording}
                        className="w-full py-3 rounded border border-primary text-primary font-medium hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        🎥 Record {knobLabel} animation
                    </button>
                )}

                <p className="text-xs text-on-surface-variant mt-3">
                    GIF downloads automatically when recording finishes.
                </p>
            </div>
        </div>
    );
}
