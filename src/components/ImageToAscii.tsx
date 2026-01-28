import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Copy, Download, Upload, X, Sparkles, Image as ImageIcon, Shuffle, FileCode, Palette, Monitor, Sun, Moon } from 'lucide-react';
import { Switch } from './ui/switch';
import { toast } from 'sonner';
import { copyToClipboard } from './utils/clipboard';

// Safe toast wrapper to handle potential import issues
const safeToast = {
  success: (message: string) => {
    try {
      toast.success(message);
    } catch {
      console.warn('SUCCESS:', message);
    }
  },
  error: (message: string) => {
    try {
      toast.error(message);
    } catch {
      console.error('ERROR:', message);
    }
  },
  info: (message: string) => {
    try {
      toast.info(message);
    } catch {
      console.warn('INFO:', message);
    }
  }
};

// Different ASCII character sets for different styles
const ASCII_CHAR_SETS = {
  standard: {
    name: 'Standard',
    chars: '@%#*+=-:. '
  },
  detailed: {
    name: 'Detailed',
    chars: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\\"^`\'. '
  },
  simple: {
    name: 'Simple',
    chars: '█▉▊▋▌▍▎▏ '
  },
  blocks: {
    name: 'Blocks',
    chars: '██▓▒░  '
  },
  dots: {
    name: 'Dots',
    chars: '●◐○◌ '
  },
  braille: {
    name: 'Braille',
    chars: '⣿⣾⣽⣻⣟⣯⣷⣿⡿⠿⠻⠟⠯⠷⠿⡇⠇⠃⠁ '
  },
  geometric: {
    name: 'Geometric',
    chars: '◆◇◈◉◎●○◦∘∙ '
  },
  technical: {
    name: 'Technical',
    chars: '▓▒░▚▞▛▜▟▙▘▝▗▖ '
  },
  lines: {
    name: 'Lines',
    chars: '║│┃┊┋┌┐└┘├┤┬┴┼ '
  },
  slopes: {
    name: 'Slopes',
    chars: '╱╲╳▲▼◄►◢◣◤◥ '
  },
  retro: {
    name: 'Retro',
    chars: '▀▄█▌▐░▒▓ '
  },
  minimal: {
    name: 'Minimal',
    chars: '██░░  '
  },
  organic: {
    name: 'Organic',
    chars: '※●◐○◦∘∙⋅· '
  },
  matrix: {
    name: 'Matrix',
    chars: '1 0  '
  },
  artistic: {
    name: 'Artistic',
    chars: '▓▒░▨▦▥▤▣▢▧▩⬛⬜ '
  }
};

// Format ratio presets
const FORMAT_RATIOS = {
  free: { name: 'Free', ratio: null },
  '16:9': { name: '16:9 (Widescreen)', ratio: 16 / 9 },
  '4:3': { name: '4:3 (Classic)', ratio: 4 / 3 },
  '3:2': { name: '3:2 (Photo)', ratio: 3 / 2 },
  '1:1': { name: '1:1 (Square)', ratio: 1 },
  '2:3': { name: '2:3 (Portrait)', ratio: 2 / 3 },
  '3:4': { name: '3:4 (Portrait)', ratio: 3 / 4 },
  '9:16': { name: '9:16 (Vertical)', ratio: 9 / 16 },
};

export function ImageToAscii() {
  const { theme, setTheme } = useTheme();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [asciiOutput, setAsciiOutput] = useState('');
  const [coloredAsciiOutput, setColoredAsciiOutput] = useState<Array<Array<{ char: string; color: string }>>>([]);
  const [charSet, setCharSet] = useState('standard');
  const [outputWidth, setOutputWidth] = useState([120]);
  const [,] = useState([40]);
  const [preserveAspectRatio, setPreserveAspectRatio] = useState(true);
  const [aspectRatioMultiplier, setAspectRatioMultiplier] = useState([0.5]);
  const [brightness, setBrightness] = useState([1]);
  const [contrast, setContrast] = useState([1]);
  const [inverted, setInverted] = useState(false);
  const [colorMode, setColorMode] = useState(true);
  const [formatRatio, setFormatRatio] = useState('free');
  const [imageInfo, setImageInfo] = useState<{ width: number, height: number, aspectRatio: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [browserSupported, setBrowserSupported] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check browser compatibility on mount
  useEffect(() => {
    try {
      const isSupported =
        typeof document !== 'undefined' &&
        typeof HTMLCanvasElement !== 'undefined' &&
        typeof HTMLImageElement !== 'undefined' &&
        typeof FileReader !== 'undefined' &&
        typeof URL !== 'undefined' &&
        typeof Blob !== 'undefined';

      setBrowserSupported(isSupported);

      if (!isSupported) {
        console.warn('Browser does not support required APIs for image processing');
        safeToast.error('Your browser does not support image processing features');
      }
    } catch (error) {
      console.error('Browser compatibility check failed:', error);
      setBrowserSupported(false);
    }
  }, []);



  const convertImageToAscii = useCallback((
    imageUrl: string,
    width: number,
    charset: string,
    preserveRatio: boolean = true,
    ratioMultiplier: number = 0.5,
    brightnessValue: number = 1,
    contrastValue: number = 1,
    isInverted: boolean = false,
    isColorMode: boolean = false
  ) => {
    console.log('Starting image conversion...', { width, charset, preserveRatio, ratioMultiplier, brightnessValue, contrastValue, isInverted });

    // Check browser support first
    if (!browserSupported) {
      safeToast.error('Image processing not supported in this browser');
      return;
    }

    // Clear any existing timeout
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }

    setIsProcessing(true);

    // Safety timeout to prevent infinite processing
    const safetyTimeout = setTimeout(() => {
      console.warn('Processing timeout reached, resetting...');
      setIsProcessing(false);
      safeToast.error('Processing timeout - please try again');
    }, 10000); // 10 second timeout

    // Safely create Image element using createElement as fallback
    let img;
    try {
      // Check if we're in a browser environment
      if (typeof document === 'undefined') {
        throw new Error('Document not available');
      }

      // Try document.createElement first (more reliable)
      img = document.createElement('img');

      // Verify it's actually an HTMLImageElement
      if (!(img instanceof HTMLImageElement)) {
        throw new Error('Created element is not an HTMLImageElement');
      }

    } catch (domError) {
      console.error('Image element creation error:', domError);
      safeToast.error('Failed to create image element - browser compatibility issue');
      clearTimeout(safetyTimeout);
      setIsProcessing(false);
      return;
    }

    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      try {
        console.log('Image loaded successfully. Dimensions:', img.width, 'x', img.height);

        // Store image info for display
        const originalAspectRatio = img.height / img.width;
        setImageInfo({
          width: img.width,
          height: img.height,
          aspectRatio: originalAspectRatio
        });

        const canvas = canvasRef.current;
        if (!canvas) {
          console.error('Canvas ref is null');
          setIsProcessing(false);
          safeToast.error('Canvas not available');
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error('Cannot get 2d context from canvas');
          setIsProcessing(false);
          safeToast.error('Cannot get canvas context');
          return;
        }

        // Calculate dimensions with improved aspect ratio handling
        const finalWidth = Math.max(Math.min(width, 200), 10);
        let finalHeight;

        if (preserveRatio) {
          // Use the aspect ratio multiplier to account for character height/width ratio
          // Characters are typically taller than they are wide, so we need to adjust
          const adjustedAspectRatio = originalAspectRatio * ratioMultiplier;
          finalHeight = Math.floor(finalWidth * adjustedAspectRatio);
        } else {
          // If not preserving aspect ratio, use a square output
          finalHeight = finalWidth;
        }

        // Ensure reasonable dimensions
        finalHeight = Math.max(Math.min(finalHeight, 200), 10);

        console.log('Processing dimensions - Width:', finalWidth, 'Height:', finalHeight, 'Original Aspect Ratio:', originalAspectRatio.toFixed(3), 'Adjusted Ratio:', (finalHeight / finalWidth).toFixed(3));

        canvas.width = finalWidth;
        canvas.height = finalHeight;

        // Clear canvas and draw image
        ctx.clearRect(0, 0, finalWidth, finalHeight);
        ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

        let imageData;
        try {
          imageData = ctx.getImageData(0, 0, finalWidth, finalHeight);
          console.log('Image data extracted successfully. Pixels:', imageData.data.length);
        } catch (error) {
          console.error('Error getting image data:', error);
          safeToast.error('Failed to process image data');
          setIsProcessing(false);
          return;
        }

        const pixels = imageData.data;
        const charSet = ASCII_CHAR_SETS[charset as keyof typeof ASCII_CHAR_SETS];
        if (!charSet) {
          console.error('Invalid charset:', charset);
          safeToast.error('Invalid character set selected');
          setIsProcessing(false);
          return;
        }

        const chars = charSet.chars;
        let ascii = '';

        // Process pixels - ensuring rectangular output
        const lines: string[] = [];
        const colorLines: Array<Array<{ char: string; color: string }>> = [];

        for (let y = 0; y < finalHeight; y++) {
          let line = '';
          const colorLine: Array<{ char: string; color: string }> = [];
          for (let x = 0; x < finalWidth; x++) {
            const offset = (y * finalWidth + x) * 4;
            const r = pixels[offset] || 0;
            const g = pixels[offset + 1] || 0;
            const b = pixels[offset + 2] || 0;

            // Convert to grayscale using luminance formula
            let gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

            // Apply contrast
            gray = ((gray - 128) * contrastValue) + 128;

            // Apply brightness (add/subtract value properly scaled)
            // Brightness 1 is neutral. 0 is black, 2 is white(-ish).
            // Map 0-2 to -128 to 128 offset approximately
            gray = gray + ((brightnessValue - 1) * 255);

            // Clamp values
            gray = Math.max(0, Math.min(255, gray));

            // Apply invert
            if (!isInverted) {
              gray = 255 - gray;
            }

            // Map grayscale to character (ensure valid index)
            const charIndex = Math.min(Math.floor((gray / 255) * (chars.length - 1)), chars.length - 1);
            const selectedChar = chars[chars.length - 1 - charIndex]; // Invert for dark-on-light
            line += selectedChar || ' ';

            // Store color data for colored mode
            if (isColorMode) {
              colorLine.push({
                char: selectedChar || ' ',
                color: `rgb(${r}, ${g}, ${b})`
              });
            }
          }

          // Ensure line is exactly finalWidth characters
          if (line.length < finalWidth) {
            line = line.padEnd(finalWidth, ' ');
          } else if (line.length > finalWidth) {
            line = line.substring(0, finalWidth);
          }

          lines.push(line);
          if (isColorMode) {
            colorLines.push(colorLine);
          }
        }

        // Join lines and ensure rectangular format
        ascii = lines.join('\n');

        // Validate rectangular format and get final ASCII
        const asciiLines = ascii.split('\n').filter(line => line.length > 0);

        // Ensure all lines have the same length (rectangular format)
        const targetWidth = finalWidth;
        const normalizedLines = asciiLines.map(line => {
          if (line.length < targetWidth) {
            return line.padEnd(targetWidth, ' ');
          } else if (line.length > targetWidth) {
            return line.substring(0, targetWidth);
          }
          return line;
        });

        // Ensure we have the expected number of lines
        while (normalizedLines.length < finalHeight) {
          normalizedLines.push(' '.repeat(targetWidth));
        }
        if (normalizedLines.length > finalHeight) {
          normalizedLines.splice(finalHeight);
        }

        const finalAscii = normalizedLines.join('\n');
        const actualWidth = normalizedLines.length > 0 ? normalizedLines[0].length : 0;
        const actualHeight = normalizedLines.length;

        console.log('ASCII processing complete. Length:', finalAscii.length, 'Target dimensions:', finalWidth, 'x', finalHeight, 'Actual dimensions:', actualWidth, 'x', actualHeight);

        // Verify rectangular format
        const allLinesSameLength = normalizedLines.every(line => line.length === actualWidth);
        if (!allLinesSameLength) {
          console.warn('Not all lines have the same length - fixing...');
          const fixedLines = normalizedLines.map(line => line.padEnd(actualWidth, ' '));
          setAsciiOutput(fixedLines.join('\n'));
        } else {
          setAsciiOutput(finalAscii);
        }

        // Store colored output if in color mode
        if (isColorMode) {
          setColoredAsciiOutput(colorLines);
        } else {
          setColoredAsciiOutput([]);
        }
        clearTimeout(safetyTimeout);
        setIsProcessing(false);

        if (finalAscii.length === 0) {
          safeToast.error('No ASCII output generated');
          console.error('Empty ASCII output');
        } else {
          console.log('ASCII generated successfully. Rectangular format verified:', allLinesSameLength);
          safeToast.success(`ASCII art generated! (${actualWidth}×${actualHeight} characters, rectangular format)`);
        }
      } catch (error) {
        console.error('Error processing image:', error);
        safeToast.error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        clearTimeout(safetyTimeout);
        setIsProcessing(false);
      }
    };

    img.onerror = (error) => {
      console.error('Image load error:', error);
      safeToast.error('Failed to load image');
      clearTimeout(safetyTimeout);
      setIsProcessing(false);
    };

    // Set source - this triggers the loading
    img.src = imageUrl;
  }, [browserSupported]);

  const handleAspectRatioToggle = (checked: boolean) => {
    setPreserveAspectRatio(checked);
    if (selectedImage && !isProcessing) {
      convertImageToAscii(selectedImage, outputWidth[0], charSet, checked, aspectRatioMultiplier[0], brightness[0], contrast[0], inverted, colorMode);
    }
  };

  const handleAspectRatioMultiplierChange = (newValue: number[]) => {
    setAspectRatioMultiplier(newValue);
    if (selectedImage && !isProcessing && preserveAspectRatio) {
      // Use timeout to prevent spam
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      processingTimeoutRef.current = setTimeout(() => {
        convertImageToAscii(selectedImage, outputWidth[0], charSet, preserveAspectRatio, newValue[0], brightness[0], contrast[0], inverted, colorMode);
      }, 300);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  // Shared function to process any file
  const processFile = async (file: File) => {
    if (!browserSupported) {
      safeToast.error('File processing not supported in this browser');
      return;
    }

    if (isProcessing) {
      safeToast.info('Please wait for current processing to complete');
      return;
    }

    console.log('File selected:', file.name, file.type, file.size);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      safeToast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      safeToast.error('File is too large. Maximum size is 10MB.');
      return;
    }

    try {
      console.log('Creating FileReader...');

      // Check if FileReader is available and can be constructed
      if (typeof FileReader === 'undefined') {
        throw new Error('FileReader is not supported in this browser');
      }

      let reader;
      try {
        reader = new FileReader();
      } catch (constructorError) {
        console.error('FileReader constructor error:', constructorError);
        throw new Error('Failed to create FileReader instance');
      }

      // Create promise to handle async FileReader
      const imageUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = (event) => {
          try {
            const result = event.target?.result;
            if (typeof result === 'string' && result.startsWith('data:')) {
              console.log('File read successfully, data URL length:', result.length);
              resolve(result);
            } else {
              reject(new Error('Invalid file data format'));
            }
          } catch (err) {
            reject(err);
          }
        };

        reader.onerror = () => {
          const error = reader.error || new Error('FileReader failed');
          console.error('FileReader error:', error);
          reject(error);
        };

        reader.onabort = () => {
          reject(new Error('File reading was aborted'));
        };

        // Start reading the file
        reader.readAsDataURL(file);
      });

      console.log('Setting selected image...');
      setSelectedImage(imageUrl);

      console.log('Starting conversion...');
      convertImageToAscii(imageUrl, outputWidth[0], charSet, preserveAspectRatio, aspectRatioMultiplier[0], brightness[0], contrast[0], inverted, colorMode);

    } catch (error) {
      console.error('Image processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      safeToast.error(`Failed to process image: ${errorMessage}`);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Process file without await to avoid potential async issues
    processFile(file).catch((error) => {
      console.error('File upload handler error:', error);
      safeToast.error('Failed to upload file');
    });
  };

  const handleRemoveImage = () => {
    // Clear any pending processing
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }

    setSelectedImage(null);
    setAsciiOutput('');
    setImageInfo(null);
    setIsProcessing(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleWidthChange = (newWidth: number[]) => {
    setOutputWidth(newWidth);
    if (selectedImage && !isProcessing) {
      // Use timeout to prevent spam
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      processingTimeoutRef.current = setTimeout(() => {
        convertImageToAscii(selectedImage, newWidth[0], charSet, preserveAspectRatio, aspectRatioMultiplier[0], brightness[0], contrast[0], inverted, colorMode);
      }, 300);
    }
  };



  const handleCharSetChange = (newCharSet: string) => {
    setCharSet(newCharSet);
    if (selectedImage && !isProcessing) {
      convertImageToAscii(selectedImage, outputWidth[0], newCharSet, preserveAspectRatio, aspectRatioMultiplier[0], brightness[0], contrast[0], inverted, colorMode);
    }
  };

  const handleTrySample = () => {
    if (!browserSupported) {
      safeToast.error('Sample image not supported in this browser');
      return;
    }

    if (isProcessing) {
      safeToast.info('Please wait for current processing to complete');
      return;
    }

    try {
      console.log('Creating sample image...');

      // Check if canvas is supported
      if (typeof document.createElement !== 'function') {
        throw new Error('Canvas not supported');
      }

      let canvas, ctx;
      try {
        // Check if we're in a browser environment
        if (typeof document === 'undefined') {
          throw new Error('Document not available');
        }

        canvas = document.createElement('canvas');

        // Verify it's actually an HTMLCanvasElement
        if (!(canvas instanceof HTMLCanvasElement)) {
          throw new Error('Created element is not an HTMLCanvasElement');
        }

        ctx = canvas.getContext('2d');

        if (!ctx || !(ctx instanceof CanvasRenderingContext2D)) {
          throw new Error('Failed to get 2D rendering context');
        }

      } catch (canvasError) {
        console.error('Canvas creation error:', canvasError);
        throw new Error('Failed to create canvas element - browser compatibility issue');
      }

      if (!ctx) {
        throw new Error('Cannot get canvas 2D context');
      }

      // Create a simple reliable test image
      canvas.width = 200;
      canvas.height = 150;

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Create simple black to white gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#000000');
      gradient.addColorStop(0.5, '#666666');
      gradient.addColorStop(1, '#ffffff');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add simple shapes for better ASCII conversion
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(20, 20, 40, 40);

      ctx.fillStyle = '#000000';
      ctx.fillRect(140, 20, 40, 40);

      ctx.fillStyle = '#666666';
      ctx.fillRect(80, 80, 40, 40);

      // Convert to data URL
      const sampleImageUrl = canvas.toDataURL('image/png');

      if (!sampleImageUrl || !sampleImageUrl.startsWith('data:')) {
        throw new Error('Failed to generate sample image data');
      }

      console.log('Sample image created successfully, data URL length:', sampleImageUrl.length);

      setSelectedImage(sampleImageUrl);
      convertImageToAscii(sampleImageUrl, outputWidth[0], charSet, preserveAspectRatio, aspectRatioMultiplier[0], brightness[0], contrast[0], inverted, colorMode);
      safeToast.success('Sample image loaded successfully');

    } catch (error) {
      console.error('Sample image creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      safeToast.error(`Failed to create sample image: ${errorMessage}`);
    }
  };

  const handleRandomImage = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      // Use a random ID to prevent caching issues
      const randomId = Math.floor(Math.random() * 1000);
      const imageUrl = `https://picsum.photos/id/${randomId}/800/600`;

      console.log('Fetching random image:', imageUrl);

      // Fetch as blob to avoid some potential CORS issues with canvas taint
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to fetch random image');

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      setSelectedImage(objectUrl);
      convertImageToAscii(objectUrl, outputWidth[0], charSet, preserveAspectRatio, aspectRatioMultiplier[0], brightness[0], contrast[0], inverted, colorMode);

    } catch (error) {
      console.error('Random image error:', error);
      safeToast.error('Failed to load random image');
      setIsProcessing(false);
    }
  };

  const handleBrightnessChange = (value: number[]) => {
    setBrightness(value);
    if (selectedImage && !isProcessing) {
      if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = setTimeout(() => {
        convertImageToAscii(selectedImage, outputWidth[0], charSet, preserveAspectRatio, aspectRatioMultiplier[0], value[0], contrast[0], inverted, colorMode);
      }, 300);
    }
  };

  const handleContrastChange = (value: number[]) => {
    setContrast(value);
    if (selectedImage && !isProcessing) {
      if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = setTimeout(() => {
        convertImageToAscii(selectedImage, outputWidth[0], charSet, preserveAspectRatio, aspectRatioMultiplier[0], brightness[0], value[0], inverted, colorMode);
      }, 300);
    }
  };

  const handleInvertToggle = (checked: boolean) => {
    setInverted(checked);
    if (selectedImage && !isProcessing) {

      convertImageToAscii(selectedImage, outputWidth[0], charSet, preserveAspectRatio, aspectRatioMultiplier[0], brightness[0], contrast[0], checked, colorMode);
    }
  };

  const handleColorModeToggle = (checked: boolean) => {
    setColorMode(checked);
    if (selectedImage && !isProcessing) {

      convertImageToAscii(selectedImage, outputWidth[0], charSet, preserveAspectRatio, aspectRatioMultiplier[0], brightness[0], contrast[0], inverted, checked);
    }
  };

  const handleFormatRatioChange = (newRatio: string) => {
    setFormatRatio(newRatio);
    if (selectedImage && !isProcessing) {

      convertImageToAscii(selectedImage, outputWidth[0], charSet, preserveAspectRatio, aspectRatioMultiplier[0], brightness[0], contrast[0], inverted, colorMode);
    }
  };

  const handleCopy = async () => {
    if (!asciiOutput) {
      safeToast.error('No ASCII art to copy');
      return;
    }

    const result = await copyToClipboard(asciiOutput);

    if (result.success) {
      switch (result.method) {
        case 'modern':
          safeToast.success('ASCII art copied to clipboard!');
          break;
        case 'legacy':
          safeToast.success('ASCII art copied to clipboard! (using legacy method)');
          break;
        case 'manual':
          safeToast.info('Please press Ctrl+C (Cmd+C on Mac) to copy the selected text');
          break;
      }
    } else {
      safeToast.error(`Failed to copy: ${result.error || 'Unknown error'}`);
      console.error('Copy failed:', result.error);
    }
  };

  const handleDownload = () => {
    try {
      // Check browser compatibility
      if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof Blob === 'undefined') {
        throw new Error('Browser does not support file downloads');
      }

      const element = document.createElement('a');
      const file = new Blob([asciiOutput], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `image-ascii-art-${Date.now()}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      safeToast.success('ASCII art downloaded!');
    } catch (error) {
      console.error('Download error:', error);
      safeToast.error('Failed to download file - browser compatibility issue');
    }
  };

  const handleDownloadPNG = () => {
    if (!asciiOutput) return;

    try {
      // Check browser compatibility
      if (typeof document === 'undefined') {
        throw new Error('Document not available');
      }

      // Create a temporary canvas for rendering
      const tempCanvas = document.createElement('canvas');

      if (!(tempCanvas instanceof HTMLCanvasElement)) {
        throw new Error('Failed to create canvas element');
      }

      const ctx = tempCanvas.getContext('2d');
      if (!ctx || !(ctx instanceof CanvasRenderingContext2D)) {
        throw new Error('Failed to get 2D rendering context');
      }

      // Set up font and measurement
      const fontSize = 12;
      const lineHeight = fontSize * 1.2;
      const fontFamily = 'Courier New, monospace';
      ctx.font = `${fontSize}px ${fontFamily}`;

      // Split ASCII into lines and calculate dimensions
      const lines = asciiOutput.split('\n');
      const maxLineLength = Math.max(...lines.map(line => line.length));

      // Measure character width
      const charWidth = ctx.measureText('M').width;

      // Set canvas dimensions with padding
      const padding = 20;
      tempCanvas.width = maxLineLength * charWidth + padding * 2;
      tempCanvas.height = lines.length * lineHeight + padding * 2;

      // Set background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      // Set text properties
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      // Render each line - with color support
      if (colorMode && coloredAsciiOutput.length > 0) {
        // Render with colors
        coloredAsciiOutput.forEach((line, lineIndex) => {
          let xPos = padding;
          line.forEach((cell) => {
            ctx.fillStyle = cell.color;
            ctx.fillText(cell.char, xPos, padding + lineIndex * lineHeight);
            xPos += charWidth;
          });
        });
      } else {
        // Render in black (original behavior)
        ctx.fillStyle = '#000000';
        lines.forEach((line, index) => {
          ctx.fillText(line, padding, padding + index * lineHeight);
        });
      }

      // Convert to blob and download
      tempCanvas.toBlob((blob) => {
        if (!blob) {
          safeToast.error('Failed to generate PNG');
          return;
        }

        try {
          const element = document.createElement('a');
          element.href = URL.createObjectURL(blob);
          element.download = `ascii-art-${Date.now()}.png`;
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
          safeToast.success('ASCII art PNG downloaded!');
        } catch (downloadError) {
          console.error('PNG download error:', downloadError);
          safeToast.error('Failed to download PNG file');
        }
      }, 'image/png');

    } catch (error) {
      console.error('PNG generation error:', error);
      safeToast.error('Failed to generate PNG - browser compatibility issue');
    }
  };

  const handleDownloadSVG = () => {
    if (!asciiOutput) return;

    try {
      const lines = asciiOutput.split('\n');
      const fontSize = 12;
      const lineHeight = 14.4; // 1.2em
      const charWidth = fontSize * 0.6;

      // Calculate dimensions (add padding)
      const maxLineLength = Math.max(...lines.map(line => line.length));
      const width = (maxLineLength * charWidth) + 40;
      const height = (lines.length * lineHeight) + 40;

      // Escape special characters for XML
      const escapeXML = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

      let content: string;

      if (colorMode && coloredAsciiOutput.length > 0) {
        // Render with colors - each character as a separate tspan
        content = coloredAsciiOutput
          .map((line, lineIndex) => {
            const lineContent = line.map((cell, charIndex) =>
              `<tspan x="${20 + charIndex * charWidth}" fill="${cell.color}">${escapeXML(cell.char)}</tspan>`
            ).join('');
            return `<tspan y="${20 + lineIndex * lineHeight + fontSize}">${lineContent}</tspan>`;
          })
          .join('\n');
      } else {
        // Original black text
        content = lines
          .map((line, i) => `<tspan x="20" dy="${i === 0 ? '1em' : '1.2em'}">${escapeXML(line)}</tspan>`)
          .join('');
      }

      const svg = colorMode && coloredAsciiOutput.length > 0
        ? `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  <text font-family="'Courier New', Courier, monospace" font-size="${fontSize}px" xml:space="preserve">
${content}
  </text>
</svg>`
        : `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  <text x="20" y="20" font-family="'Courier New', Courier, monospace" font-size="${fontSize}px" fill="black" xml:space="preserve">
${content}
  </text>
</svg>`;

      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const element = document.createElement('a');
      element.href = url;
      element.download = `ascii-art-${Date.now()}.svg`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(url);

      safeToast.success('ASCII art SVG downloaded!');
    } catch (error) {
      console.error('SVG export error:', error);
      safeToast.error('Failed to export SVG');
    }
  };

  // Show loading while checking browser compatibility
  if (browserSupported === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground animate-pulse">Initializing engine...</p>
        </div>
      </div>
    );
  }

  // Show fallback message if browser is not supported
  if (!browserSupported) {
    return (
      <div className="flex items-center justify-center h-screen bg-background p-4">
        <Card className="w-full max-w-md border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <X className="w-5 h-5" />
              Browser Not Supported
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your browser does not support the required features for image to ASCII conversion.
              Please try using a modern browser like Chrome, Firefox, or Safari.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-background overflow-hidden text-foreground selection:bg-primary/20 transition-colors duration-300">

      {/* LEFT SIDEBAR - CONTROLS */}
      <div className="w-full lg:w-80 flex-col border-r border-border bg-card/30 backdrop-blur-xl z-20 flex shadow-sm">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border bg-card/50 flex items-center justify-between">
          <div className="flex items-center gap-3 font-bold text-xl tracking-tight">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">ASCII Gen</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-9 h-9"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400 fill-indigo-400/20" />
            )}
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8">

            {/* 1. Input Section */}
            <div className="space-y-4">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Input Source</Label>
              {!selectedImage ? (
                <div className="space-y-3">
                  <div
                    className="group border-2 border-dashed border-input hover:border-primary/50 transition-all duration-300 rounded-xl p-8 text-center cursor-pointer bg-muted/5 hover:bg-muted/10"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('border-primary');
                      e.currentTarget.classList.add('bg-primary/5');
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-primary');
                      e.currentTarget.classList.remove('bg-primary/5');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-primary');
                      e.currentTarget.classList.remove('bg-primary/5');
                      const files = e.dataTransfer.files;
                      if (files.length > 0) {
                        const file = files[0];
                        if (file.type.startsWith('image/')) {
                          processFile(file).catch((error) => {
                            console.error('Drag and drop error:', error);
                            safeToast.error('Failed to process dropped file');
                          });
                        } else {
                          safeToast.error('Please drop an image file');
                        }
                      }
                    }}
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium">Click to upload image</p>
                    <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={handleTrySample} className="h-9">
                      <Sparkles className="w-3.5 h-3.5 mr-2 text-orange-500" />
                      Sample
                    </Button>
                    <Button variant="outline" onClick={handleRandomImage} className="h-9">
                      <Shuffle className="w-3.5 h-3.5 mr-2 text-blue-500" />
                      Random
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="relative group rounded-xl overflow-hidden border bg-muted/20 shadow-sm aspect-video flex items-center justify-center">
                    <img
                      src={selectedImage}
                      alt="Selected"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8"
                      >
                        Change
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleRemoveImage}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-center text-muted-foreground">
                    {imageInfo && `${imageInfo.width} × ${imageInfo.height}px`}
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <Separator />

            {/* 2. Controls Accordion */}
            <Accordion type="multiple" defaultValue={["output", "style"]} className="w-full">

              <AccordionItem value="output" className="border-none">
                <AccordionTrigger className="py-2 hover:no-underline hover:bg-muted/50 px-2 rounded-lg text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-primary" />
                    Output Settings
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-2 pt-2 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md">
                      <Label htmlFor="width-slider" className="text-xs font-mono">Width</Label>
                      <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono font-bold">{outputWidth[0]}</span>
                    </div>
                    <Slider
                      id="width-slider"
                      min={20}
                      max={200}
                      step={4}
                      value={outputWidth}
                      onValueChange={handleWidthChange}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Format Ratio</Label>
                    <Select value={formatRatio} onValueChange={handleFormatRatioChange}>
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

                  <div className="flex items-center justify-between">
                    <Label htmlFor="aspect-ratio-toggle" className="text-xs cursor-pointer">Preserve Aspect Ratio</Label>
                    <Switch
                      id="aspect-ratio-toggle"
                      checked={preserveAspectRatio}
                      onCheckedChange={handleAspectRatioToggle}
                      className="scale-75 origin-right"
                    />
                  </div>

                  {preserveAspectRatio && (
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs text-muted-foreground">Char Ratio Fix</Label>
                        <span className="text-[10px] text-muted-foreground font-mono">{aspectRatioMultiplier[0].toFixed(2)}</span>
                      </div>
                      <Slider
                        min={0.3}
                        max={1.0}
                        step={0.05}
                        value={aspectRatioMultiplier}
                        onValueChange={handleAspectRatioMultiplierChange}
                      />
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="style" className="border-none">
                <AccordionTrigger className="py-2 hover:no-underline hover:bg-muted/50 px-2 rounded-lg text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-secondary" />
                    Style & Filters
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-2 pt-2 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2 p-2 bg-muted/30 rounded-lg">
                      <div className="flex justify-between items-center">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Invert</Label>
                        <Switch checked={inverted} onCheckedChange={handleInvertToggle} className="scale-75" />
                      </div>
                    </div>
                    <div className="space-y-2 p-2 bg-muted/30 rounded-lg">
                      <div className="flex justify-between items-center">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Color</Label>
                        <Switch checked={colorMode} onCheckedChange={handleColorModeToggle} className="scale-75" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Brightness</span>
                        <span>{brightness[0].toFixed(1)}</span>
                      </div>
                      <Slider
                        min={0} max={2} step={0.1}
                        value={brightness} onValueChange={handleBrightnessChange}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Contrast</span>
                        <span>{contrast[0].toFixed(1)}</span>
                      </div>
                      <Slider
                        min={0} max={2} step={0.1}
                        value={contrast} onValueChange={handleContrastChange}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

            </Accordion>

          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border bg-card/50 space-y-4">
          <Button
            onClick={handleCopy}
            disabled={!asciiOutput || isProcessing}
            className="w-full shadow-lg shadow-primary/20 hover:shadow-primary/40 font-semibold transition-all duration-300 active:scale-[0.98]"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy ASCII
          </Button>

          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={!asciiOutput || isProcessing}
              className="w-full justify-start hover:bg-accent transition-all"
            >
              <Download className="w-4 h-4 mr-2 text-primary" />
              Download TXT
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadPNG}
              disabled={!asciiOutput || isProcessing}
              className="w-full justify-start hover:bg-accent transition-all"
            >
              <ImageIcon className="w-4 h-4 mr-2 text-primary" />
              Download PNG
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadSVG}
              disabled={!asciiOutput || isProcessing}
              className="w-full justify-start hover:bg-accent transition-all"
            >
              <FileCode className="w-4 h-4 mr-2 text-primary" />
              Download SVG
            </Button>
          </div>
        </div>
      </div>

      {/* RIGHT PREVIEW AREA */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-background relative transition-colors duration-300">
        {/* Main Canvas Area */}
        <div className="flex-1 p-6 md:p-10 overflow-hidden relative flex items-center justify-center bg-muted/30">
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />

          <div className={`relative max-w-full max-h-full transition-all duration-500 ${isProcessing ? 'opacity-50 blur-sm scale-95' : 'opacity-100 scale-100'}`}>
            {/* ASCII Output Card with Forced White Background */}
            <div className="relative shadow-2xl rounded-xl overflow-hidden border border-border bg-white ring-1 ring-black/5">
              {/* Terminal-style Header - Forced light colors for visibility */}
              <div className="h-8 bg-zinc-100 flex items-center px-4 gap-2 border-b border-zinc-200">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-300"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-300"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-300"></div>
                </div>
                <span className="ml-3 text-[10px] text-zinc-400 font-mono uppercase tracking-widest font-bold">ascii-terminal</span>
              </div>

              {/* White Background Content Area */}
              <div className="max-w-[calc(100vw-400px)] max-h-[calc(100vh-280px)] overflow-auto bg-white">
                <div className="p-6 md:p-8 min-w-fit">
                  <pre
                    className="font-mono text-[10px] md:text-xs leading-[1.15] md:leading-[1.15] whitespace-pre block select-text text-zinc-900"
                    style={{
                      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                      letterSpacing: '0px'
                    }}
                  >
                    {colorMode && coloredAsciiOutput.length > 0 ? (
                      coloredAsciiOutput.map((line, lineIndex) => (
                        <div key={lineIndex}>
                          {line.map((cell, cellIndex) => (
                            <span key={cellIndex} style={{ color: cell.color }}>{cell.char}</span>
                          ))}
                        </div>
                      ))
                    ) : (
                      <span className={!asciiOutput ? "text-zinc-400 italic" : "text-zinc-900"}>
                        {asciiOutput || 'Waiting for image...'}
                      </span>
                    )}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Processing Indicator Overlay */}
          {
            isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center z-50">
                <div className="bg-zinc-900/90 backdrop-blur-md px-8 py-5 rounded-2xl shadow-2xl border border-zinc-700 flex items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                  <span className="font-medium text-white">Generating ASCII...</span>
                </div>
              </div>
            )
          }
        </div>

        {/* Character Set Selection - Material Design Chips */}
        <div className="px-6 py-5 border-t border-border bg-card/80 backdrop-blur transition-colors" >
          <div className="flex items-center gap-4">
            <Label className="text-xs font-bold text-muted-foreground whitespace-nowrap uppercase tracking-widest">Styles</Label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
              {Object.entries(ASCII_CHAR_SETS).map(([key, set]) => (
                <button
                  key={key}
                  onClick={() => handleCharSetChange(key)}
                  className={`px-5 py-2 rounded-full text-xs font-semibold transition-all duration-300 whitespace-nowrap active:scale-95 ${charSet === key
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-border"
                    }`}
                >
                  {set.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="h-10 border-t border-border bg-card flex items-center px-6 justify-center text-[10px] text-muted-foreground font-mono uppercase tracking-widest transition-colors" >
          {asciiOutput && (() => {
            const lines = asciiOutput.split('\n');
            const widths = lines.map(line => line.length);
            const maxWidth = Math.max(...widths);
            return `${maxWidth} × ${lines.length} characters`;
          })()}
        </div>

      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}