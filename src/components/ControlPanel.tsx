import { Upload, X, Sparkles, Shuffle, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { toast } from 'sonner';
import { FORMAT_RATIOS, type FormatRatioKey } from '@/lib/format-ratios';
import type { ConversionOptions, ImageInfo } from '@/hooks/useAsciiConverter';

interface ControlPanelProps {
    selectedImage: string | null;
    imageInfo: ImageInfo | null;
    options: ConversionOptions;

    isProcessing: boolean;
    fileInputRef: React.RefObject<HTMLInputElement | null> | React.RefObject<HTMLInputElement>;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onTrySample: () => void;
    onRandomImage: () => void;
    onRemoveImage: () => void;
    onProcessFile: (file: File) => Promise<void>;
    onOptionChange: <K extends keyof ConversionOptions>(
        key: K,
        value: ConversionOptions[K],
        debounce?: boolean
    ) => void;

}

export function ControlPanel({
    selectedImage,
    imageInfo,
    options,
    isProcessing,
    fileInputRef,
    onFileUpload,
    onTrySample,
    onRandomImage,
    onRemoveImage,
    onProcessFile,
    onOptionChange,
}: ControlPanelProps) {
    const { theme, setTheme } = useTheme();



    return (
        <div className="control-panel">
            {/* Header */}
            <div className="control-panel__header">
                <span className="control-panel__logo">ASCII Gen</span>
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '9999px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'inherit',
                        transition: 'background 200ms',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </button>
            </div>

            {/* Body */}
            <div className="control-panel__body">

                {/* ── Input Source ── */}
                <div className="control-panel__section">
                    <div className="control-panel__section-label">Input</div>

                    {!selectedImage ? (
                        <>
                            <div
                                className="upload-zone"
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.style.borderColor = 'hsl(300 100% 50%)';
                                    e.currentTarget.style.background = 'hsl(300 100% 50% / 0.04)';
                                }}
                                onDragLeave={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.style.borderColor = '';
                                    e.currentTarget.style.background = '';
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.style.borderColor = '';
                                    e.currentTarget.style.background = '';
                                    const files = e.dataTransfer.files;
                                    if (files.length > 0 && files[0].type.startsWith('image/')) {
                                        onProcessFile(files[0]).catch(() => toast.error('Failed to process dropped file'));
                                    } else {
                                        toast.error('Please drop an image file');
                                    }
                                }}
                            >
                                <div className="upload-zone__icon">
                                    <Upload size={18} style={{ color: 'hsl(300 100% 50%)' }} />
                                </div>
                                <div className="upload-zone__title">Upload image</div>
                                <div className="upload-zone__subtitle">or drag and drop</div>
                            </div>

                            <div className="quick-actions">
                                <Button variant="outline" onClick={onTrySample} className="h-9" style={{ fontSize: '13px' }} disabled={isProcessing}>
                                    <Sparkles size={14} style={{ marginRight: '6px' }} />
                                    Sample
                                </Button>
                                <Button variant="outline" onClick={onRandomImage} className="h-9" style={{ fontSize: '13px' }} disabled={isProcessing}>
                                    <Shuffle size={14} style={{ marginRight: '6px' }} />
                                    Random
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            <div className="image-preview" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <img src={selectedImage} alt="Selected" />
                                <div className="image-preview__overlay">
                                    <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                                        Change
                                    </Button>
                                    <Button variant="destructive" size="icon" style={{ width: '32px', height: '32px' }} onClick={onRemoveImage}>
                                        <X size={14} />
                                    </Button>
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', fontSize: 'var(--type-label)', color: 'var(--on-surface-variant)' }}>
                                {imageInfo && `${imageInfo.width} × ${imageInfo.height}px`}
                            </div>
                        </div>
                    )}
                    <input ref={fileInputRef as React.RefObject<HTMLInputElement>} type="file" accept="image/*" onChange={onFileUpload} style={{ display: 'none' }} />
                </div>

                {/* ── Output Settings ── */}
                <div className="control-panel__section">
                    <div className="control-panel__section-label">Output</div>

                    {/* Width */}
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                        <div className="control-row">
                            <span className="control-label">Width</span>
                            <span className="control-value">{options.width}</span>
                        </div>
                        <Slider
                            min={20}
                            max={200}
                            step={4}
                            value={[options.width]}
                            onValueChange={([v]: number[]) => onOptionChange('width', v, true)}
                            className="w-full"
                            style={{ marginTop: '8px' }}
                        />
                    </div>

                    {/* Format Ratio */}
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                        <div className="control-row" style={{ marginBottom: '6px' }}>
                            <span className="control-label">Format</span>
                        </div>
                        <Select
                            value={options.formatRatio}
                            onValueChange={(v: string) => onOptionChange('formatRatio', v as FormatRatioKey)}
                        >
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(FORMAT_RATIOS).map(([key, ratio]) => (
                                    <SelectItem key={key} value={key} className="text-xs">
                                        {ratio.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Aspect Ratio */}
                    <div className="control-row" style={{ marginBottom: 'var(--space-2)' }}>
                        <span className="control-label">Preserve aspect ratio</span>
                        <Switch
                            checked={options.preserveAspectRatio}
                            onCheckedChange={(v: boolean) => onOptionChange('preserveAspectRatio', v)}
                            className="scale-75 origin-right"
                        />
                    </div>

                    {/* Char Ratio Fix */}
                    {options.preserveAspectRatio && (
                        <div style={{ marginBottom: 'var(--space-4)' }}>
                            <div className="control-row">
                                <span className="control-label" style={{ fontSize: 'var(--type-label)', color: 'var(--on-surface-variant)' }}>Char ratio fix</span>
                                <span className="control-value">{options.aspectRatioMultiplier.toFixed(2)}</span>
                            </div>
                            <Slider
                                min={0.3}
                                max={1.0}
                                step={0.05}
                                value={[options.aspectRatioMultiplier]}
                                onValueChange={([v]: number[]) => onOptionChange('aspectRatioMultiplier', v, true)}
                                style={{ marginTop: '8px' }}
                            />
                        </div>
                    )}
                </div>

                {/* ── Style & Filters ── */}
                <div className="control-panel__section">
                    <div className="control-panel__section-label">Style</div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                        <div className="control-row" style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)' }}>
                            <span className="control-label">Invert</span>
                            <Switch
                                checked={options.inverted}
                                onCheckedChange={(v: boolean) => onOptionChange('inverted', v)}
                                className="scale-75"
                            />
                        </div>
                        <div className="control-row" style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)' }}>
                            <span className="control-label">Color</span>
                            <Switch
                                checked={options.colorMode}
                                onCheckedChange={(v: boolean) => onOptionChange('colorMode', v)}
                                className="scale-75"
                            />
                        </div>
                    </div>

                    {/* Brightness */}
                    <div style={{ marginBottom: 'var(--space-3)' }}>
                        <div className="control-row">
                            <span className="control-label">Brightness</span>
                            <span className="control-value">{options.brightness.toFixed(1)}</span>
                        </div>
                        <Slider
                            min={0}
                            max={2}
                            step={0.1}
                            value={[options.brightness]}
                            onValueChange={([v]: number[]) => onOptionChange('brightness', v, true)}
                            style={{ marginTop: '8px' }}
                        />
                    </div>

                    {/* Contrast */}
                    <div>
                        <div className="control-row">
                            <span className="control-label">Contrast</span>
                            <span className="control-value">{options.contrast.toFixed(1)}</span>
                        </div>
                        <Slider
                            min={0}
                            max={2}
                            step={0.1}
                            value={[options.contrast]}
                            onValueChange={([v]: number[]) => onOptionChange('contrast', v, true)}
                            style={{ marginTop: '8px' }}
                        />
                    </div>
                </div>
            </div>


        </div>
    );
}
