import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Copy, Download, Upload, X, Sparkles, Image, ToggleLeft } from 'lucide-react';
import { Switch } from './ui/switch';
import { toast } from 'sonner@2.0.3';
import { copyToClipboard } from './utils/clipboard';

// Safe toast wrapper to handle potential import issues
const safeToast = {
  success: (message: string) => {
    try {
      toast.success(message);
    } catch (error) {
      console.log('SUCCESS:', message);
    }
  },
  error: (message: string) => {
    try {
      toast.error(message);
    } catch (error) {
      console.error('ERROR:', message);
    }
  },
  info: (message: string) => {
    try {
      toast.info(message);
    } catch (error) {
      console.log('INFO:', message);
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

export function ImageToAscii() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [asciiOutput, setAsciiOutput] = useState('');
  const [charSet, setCharSet] = useState('standard');
  const [outputWidth, setOutputWidth] = useState([80]);
  const [preserveAspectRatio, setPreserveAspectRatio] = useState(true);
  const [aspectRatioMultiplier, setAspectRatioMultiplier] = useState([0.5]);
  const [imageInfo, setImageInfo] = useState<{width: number, height: number, aspectRatio: number} | null>(null);
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



  const convertImageToAscii = useCallback((imageUrl: string, width: number, charset: string, preserveRatio: boolean = true, ratioMultiplier: number = 0.5) => {
    console.log('Starting image conversion...', { imageUrl: imageUrl.substring(0, 50), width, charset, preserveRatio, ratioMultiplier });
    
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
        let finalWidth = Math.max(Math.min(width, 200), 10);
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

        console.log('Processing dimensions - Width:', finalWidth, 'Height:', finalHeight, 'Original Aspect Ratio:', originalAspectRatio.toFixed(3), 'Adjusted Ratio:', (finalHeight/finalWidth).toFixed(3));

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
        
        for (let y = 0; y < finalHeight; y++) {
          let line = '';
          for (let x = 0; x < finalWidth; x++) {
            const offset = (y * finalWidth + x) * 4;
            const r = pixels[offset] || 0;
            const g = pixels[offset + 1] || 0;
            const b = pixels[offset + 2] || 0;
            
            // Convert to grayscale using luminance formula
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            
            // Map grayscale to character (ensure valid index)
            const charIndex = Math.min(Math.floor((gray / 255) * (chars.length - 1)), chars.length - 1);
            const selectedChar = chars[chars.length - 1 - charIndex]; // Invert for dark-on-light
            line += selectedChar || ' ';
          }
          
          // Ensure line is exactly finalWidth characters
          if (line.length < finalWidth) {
            line = line.padEnd(finalWidth, ' ');
          } else if (line.length > finalWidth) {
            line = line.substring(0, finalWidth);
          }
          
          lines.push(line);
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
      convertImageToAscii(selectedImage, outputWidth[0], charSet, checked, aspectRatioMultiplier[0]);
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
        convertImageToAscii(selectedImage, outputWidth[0], charSet, preserveAspectRatio, newValue[0]);
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
      convertImageToAscii(imageUrl, outputWidth[0], charSet, preserveAspectRatio, aspectRatioMultiplier[0]);
      
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
        convertImageToAscii(selectedImage, newWidth[0], charSet, preserveAspectRatio, aspectRatioMultiplier[0]);
      }, 300);
    }
  };

  const handleCharSetChange = (newCharSet: string) => {
    setCharSet(newCharSet);
    if (selectedImage && !isProcessing) {
      convertImageToAscii(selectedImage, outputWidth[0], newCharSet, preserveAspectRatio, aspectRatioMultiplier[0]);
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
      convertImageToAscii(sampleImageUrl, outputWidth[0], charSet, preserveAspectRatio, aspectRatioMultiplier[0]);
      safeToast.success('Sample image loaded successfully');
      
    } catch (error) {
      console.error('Sample image creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      safeToast.error(`Failed to create sample image: ${errorMessage}`);
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
    ctx.fillStyle = '#000000';
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Render each line
    lines.forEach((line, index) => {
      ctx.fillText(line, padding, padding + index * lineHeight);
    });

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

  // Show loading while checking browser compatibility
  if (browserSupported === null) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-160px)] sm:h-[calc(100vh-180px)] lg:h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Checking browser compatibility...</p>
        </div>
      </div>
    );
  }

  // Show fallback message if browser is not supported
  if (!browserSupported) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-160px)] sm:h-[calc(100vh-180px)] lg:h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Browser Not Supported</CardTitle>
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
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100vh-160px)] sm:h-[calc(100vh-180px)] lg:h-[calc(100vh-200px)] max-w-full">
      {/* Controls Sidebar */}
      <div className="w-full lg:w-80 flex-shrink-0 max-h-full">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Image to ASCII</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 h-[calc(100%-80px)] overflow-y-auto">
            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label>Upload Image</Label>
              {!selectedImage ? (
                <div className="space-y-3">
                  <div 
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('border-primary');
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-primary');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-primary');
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
                    <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, GIF, WebP</p>
                  </div>
                  <Button variant="outline" onClick={handleTrySample} className="w-full">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Try Sample
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <img 
                      src={selectedImage} 
                      alt="Selected" 
                      className="w-full h-auto max-h-48 object-contain rounded-lg border bg-muted/20"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      New Image
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTrySample}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Try Sample
                    </Button>
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

            {/* Controls */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="charset-select">Character Set</Label>
                <Select value={charSet} onValueChange={handleCharSetChange}>
                  <SelectTrigger id="charset-select">
                    <SelectValue placeholder="Select character set" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ASCII_CHAR_SETS).map(([key, set]) => (
                      <SelectItem key={key} value={key}>
                        {set.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="width-slider">Output Width: {outputWidth[0]} chars</Label>
                <Slider
                  id="width-slider"
                  min={20}
                  max={200}
                  step={5}
                  value={outputWidth}
                  onValueChange={handleWidthChange}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="aspect-ratio-toggle" className="text-sm">Preserve Aspect Ratio</Label>
                  <Switch
                    id="aspect-ratio-toggle"
                    checked={preserveAspectRatio}
                    onCheckedChange={handleAspectRatioToggle}
                  />
                </div>
                
                {preserveAspectRatio && (
                  <div className="space-y-2">
                    <Label htmlFor="ratio-slider">Character Ratio: {aspectRatioMultiplier[0].toFixed(2)}</Label>
                    <Slider
                      id="ratio-slider"
                      min={0.3}
                      max={1.0}
                      step={0.05}
                      value={aspectRatioMultiplier}
                      onValueChange={handleAspectRatioMultiplierChange}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Adjust to compensate for character height/width ratio
                    </p>
                  </div>
                )}
              </div>

              {imageInfo && (
                <div className="text-xs text-muted-foreground space-y-1 p-2 bg-muted/20 rounded">
                  <p>Original: {imageInfo.width}×{imageInfo.height}px</p>
                  <p>Aspect Ratio: {imageInfo.aspectRatio.toFixed(3)}:1</p>
                  {preserveAspectRatio && (
                    <p>Character Ratio: {(imageInfo.aspectRatio * aspectRatioMultiplier[0]).toFixed(3)}:1</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {isProcessing && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsProcessing(false);
                    if (processingTimeoutRef.current) {
                      clearTimeout(processingTimeoutRef.current);
                    }
                    safeToast.info('Processing cancelled');
                  }}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel Processing
                </Button>
              )}
              <Button
                onClick={handleCopy}
                disabled={!asciiOutput || isProcessing}
                className="w-full"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy to Clipboard
              </Button>
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={!asciiOutput || isProcessing}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download as TXT
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadPNG}
                disabled={!asciiOutput || isProcessing}
                className="w-full"
              >
                <Image className="w-4 h-4 mr-2" />
                Download as PNG
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>
                Upload any image to convert it to ASCII art. Adjust the width and character set for different effects.
              </p>
              {selectedImage && (
                <p className="mt-2 text-xs text-muted-foreground/70">
                  Tip: Large images are automatically resized for optimal performance.
                </p>
              )}
              {isProcessing && (
                <p className="mt-2 text-xs text-blue-600">
                  Processing image... Please wait.
                </p>
              )}
              {asciiOutput && !isProcessing && (
                <p className="mt-2 text-xs text-green-600">
                  ✓ ASCII art generated successfully! ({(() => {
                    const lines = asciiOutput.split('\n');
                    const widths = lines.map(line => line.length);
                    const minWidth = Math.min(...widths);
                    const maxWidth = Math.max(...widths);
                    const isRectangular = minWidth === maxWidth;
                    return `${lines.length} lines, ${maxWidth} chars wide${isRectangular ? ' (rectangular)' : ' (mixed widths)'}`;
                  })()})
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ASCII Output Area */}
      <div className="flex-1 min-w-0">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Generated ASCII Art</CardTitle>
          </CardHeader>
          <CardContent className="h-[calc(100%-80px)]">
            <div className="h-full bg-muted/30 rounded-lg p-3 overflow-auto relative">
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Processing image...</p>
                  </div>
                </div>
              )}
              <div className="w-full h-full overflow-auto scrollbar-thin">
                <pre className="font-mono text-xs leading-[1.0] whitespace-pre block min-w-fit min-h-full select-all">
                  {asciiOutput || 'Upload an image in the sidebar to generate ASCII art...'}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}