import { Copy, Download, Image as ImageIcon, FileCode } from 'lucide-react';
import { ASCII_CHAR_SETS, type CharSetKey } from '@/lib/ascii-charsets';
import type { ColorCell } from '@/hooks/useAsciiConverter';
import { copyToClipboard } from './utils/clipboard';
import { toast } from 'sonner';

interface AsciiPreviewProps {
    asciiOutput: string;
    coloredOutput: ColorCell[][];
    colorMode: boolean;
    isProcessing: boolean;
    charSet: CharSetKey;
    onCharSetChange: (key: CharSetKey) => void;
    onDownloadTxt: () => void;
    onDownloadPng: () => void;
    onDownloadSvg: () => void;
}

export function AsciiPreview({
    asciiOutput,
    coloredOutput,
    colorMode,
    isProcessing,
    charSet,
    onCharSetChange,
    onDownloadTxt,
    onDownloadPng,
    onDownloadSvg,
}: AsciiPreviewProps) {
    const handleCopy = async () => {
        if (!asciiOutput) {
            toast.error('No ASCII art to copy');
            return;
        }
        const result = await copyToClipboard(asciiOutput);
        if (result.success) {
            if (result.method === 'manual') {
                toast.info('Press Cmd+C to copy the selected text');
            } else {
                toast.success('Copied to clipboard!');
            }
        } else {
            toast.error(`Failed to copy: ${result.error || 'Unknown error'}`);
        }
    };

    const hasOutput = Boolean(asciiOutput);

    return (
        <div className="preview-panel">
            {/* Style Chips */}
            <div className="chip-bar">
                {Object.entries(ASCII_CHAR_SETS).map(([key, set]) => (
                    <button
                        key={key}
                        onClick={() => onCharSetChange(key as CharSetKey)}
                        className={`style-chip ${charSet === key ? 'style-chip--active' : ''}`}
                    >
                        {set.name}
                    </button>
                ))}
            </div>

            {/* Canvas Area */}
            <div className="canvas-area">
                <div className="dot-pattern" />

                <div
                    style={!asciiOutput ? {
                        width: '100%',
                        height: '100%',
                        transition: 'all 400ms cubic-bezier(0.2, 0, 0, 1)',
                    } : {
                        position: 'relative',
                        maxWidth: '100%',
                        maxHeight: '100%',
                        transition: 'all 400ms cubic-bezier(0.2, 0, 0, 1)',
                        ...(isProcessing ? { opacity: 0.5, filter: 'blur(4px)', transform: 'scale(0.97)' } : {}),
                    }}
                >
                    <div className={`terminal-card ${!asciiOutput ? 'terminal-card--empty' : ''}`}>


                        <div className={`terminal-body ${!asciiOutput ? 'terminal-body--empty' : 'terminal-body--filled'}`}>
                            <div className={`terminal-content ${asciiOutput ? 'terminal-content--filled' : ''}`}>
                                <pre className="ascii-output">
                                    {colorMode && coloredOutput.length > 0 ? (
                                        coloredOutput.map((line, lineIndex) => (
                                            <div key={lineIndex}>
                                                {line.map((cell, cellIndex) => (
                                                    <span key={cellIndex} style={{ color: cell.color }}>
                                                        {cell.char}
                                                    </span>
                                                ))}
                                            </div>
                                        ))
                                    ) : (
                                        <span className="empty-placeholder">
                                            {asciiOutput || 'Drop an image to begin…'}
                                        </span>
                                    )}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>

                {isProcessing && (
                    <div className="processing-overlay">
                        <div className="processing-pill">
                            <div className="spinner" />
                            Generating…
                        </div>
                    </div>
                )}
            </div>

            {/* Action Bar */}
            <div className="action-bar">
                <div className="action-bar__left">
                    {asciiOutput &&
                        (() => {
                            const lines = asciiOutput.split('\n');
                            const maxWidth = Math.max(...lines.map((l) => l.length));
                            return <span className="action-bar__dims">{maxWidth} × {lines.length}</span>;
                        })()}
                </div>
                <div className="action-bar__actions">
                    <button className="action-btn action-btn--primary" onClick={handleCopy} disabled={!hasOutput || isProcessing}>
                        <Copy size={14} />
                        Copy
                    </button>
                    <button className="action-btn" onClick={onDownloadTxt} disabled={!hasOutput || isProcessing} title="Download TXT">
                        <Download size={14} />
                        TXT
                    </button>
                    <button className="action-btn" onClick={onDownloadPng} disabled={!hasOutput || isProcessing} title="Download PNG">
                        <ImageIcon size={14} />
                        PNG
                    </button>
                    <button className="action-btn" onClick={onDownloadSvg} disabled={!hasOutput || isProcessing} title="Download SVG">
                        <FileCode size={14} />
                        SVG
                    </button>
                </div>
            </div>
        </div>
    );
}
