import { useCallback, useMemo } from 'react';
import { useAsciiConverter, type ConversionOptions } from '@/hooks/useAsciiConverter';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useExport } from '@/hooks/useExport';
import { ControlPanel } from './ControlPanel';
import { AsciiPreview } from './AsciiPreview';
import type { CharSetKey } from '@/lib/ascii-charsets';

export function ImageToAscii() {
  const converter = useAsciiConverter();
  const { asciiOutput, coloredOutput, imageInfo, isProcessing, options, canvasRef, convert, updateOption, captureSupersampledPixels, startPreview, stopPreview, previewKnob } = converter;

  const onImageReady = useCallback(
    (url: string) => {
      convert(url, options);
    },
    [convert, options]
  );

  const upload = useImageUpload(onImageReady);

  const { downloadTxt, downloadPng, downloadSvg } = useExport({
    asciiOutput,
    coloredOutput,
    colorMode: options.colorMode,
  });

  /** Centralized option change handler */
  const handleOptionChange = useCallback(
    <K extends keyof ConversionOptions>(key: K, value: ConversionOptions[K], debounce = false) => {
      updateOption(key, value, upload.selectedImage, debounce);
    },
    [updateOption, upload.selectedImage]
  );

  /** Character set change from preview chips */
  const handleCharSetChange = useCallback(
    (key: CharSetKey) => {
      handleOptionChange('charset', key);
    },
    [handleOptionChange]
  );

  /** Compute GIF canvas dimensions preserving source image aspect ratio.
   *  Max width 480px; height derived from aspect ratio (capped at 720px max). */
  const gifDimensions = useMemo(() => {
    if (!imageInfo) return { width: 480, height: 360 };
    const maxWidth = 480;
    const maxHeight = 720;
    let width = maxWidth;
    // imageInfo.aspectRatio is height/width
    let height = Math.floor(width * imageInfo.aspectRatio);
    if (height > maxHeight) {
        height = maxHeight;
        width = Math.floor(height / imageInfo.aspectRatio);
    }
    return { width, height };
  }, [imageInfo]);

  return (
    <div className="app-layout">
      <ControlPanel
        selectedImage={upload.selectedImage}
        imageInfo={imageInfo}
        options={options}
        isProcessing={isProcessing || upload.isProcessing}
        fileInputRef={upload.fileInputRef}
        onFileUpload={upload.handleFileUpload}
        onTrySample={upload.handleTrySample}
        onRandomImage={upload.handleRandomImage}
        onRemoveImage={upload.handleRemoveImage}
        onProcessFile={upload.processFile}
        onOptionChange={handleOptionChange}
        capturePixels={captureSupersampledPixels}
        imageUrl={upload.selectedImage}
        gifWidth={gifDimensions.width}
        gifHeight={gifDimensions.height}
        previewKnob={previewKnob}
        startPreview={startPreview}
        stopPreview={stopPreview}
      />

      <AsciiPreview
        asciiOutput={asciiOutput}
        coloredOutput={coloredOutput}
        colorMode={options.colorMode}
        isProcessing={isProcessing || upload.isProcessing}
        charSet={options.charset}
        onCharSetChange={handleCharSetChange}
        onDownloadTxt={downloadTxt}
        onDownloadPng={downloadPng}
        onDownloadSvg={downloadSvg}
        onFileDrop={upload.processFile}
      />

      {/* Hidden canvas for image processing (OffscreenCanvas preferred; DOM fallback) */}
      {typeof OffscreenCanvas === 'undefined' && <canvas ref={canvasRef} style={{ display: 'none' }} />}
    </div>
  );
}