import { useCallback } from 'react';
import { useAsciiConverter, type ConversionOptions } from '@/hooks/useAsciiConverter';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useExport } from '@/hooks/useExport';
import { ControlPanel } from './ControlPanel';
import { AsciiPreview } from './AsciiPreview';
import type { CharSetKey } from '@/lib/ascii-charsets';

export function ImageToAscii() {
  const converter = useAsciiConverter();
  const { asciiOutput, coloredOutput, imageInfo, isProcessing, options, canvasRef, convert, updateOption } = converter;

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
      />

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}