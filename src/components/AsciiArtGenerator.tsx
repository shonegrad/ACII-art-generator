import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Copy, Download, Image } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { copyToClipboard } from './utils/clipboard';

// ASCII art font styles
const ASCII_FONTS = {
  block: {
    name: "Block",
    chars: {
      'A': ['████', '█  █', '████', '█  █', '█  █'],
      'B': ['███ ', '█  █', '███ ', '█  █', '███ '],
      'C': ['████', '█   ', '█   ', '█   ', '████'],
      'D': ['███ ', '█  █', '█  █', '█  █', '███ '],
      'E': ['████', '█   ', '███ ', '█   ', '████'],
      'F': ['████', '█   ', '███ ', '█   ', '█   '],
      'G': ['████', '█   ', '█ ██', '█  █', '████'],
      'H': ['█  █', '█  █', '████', '█  █', '█  █'],
      'I': ['████', ' ██ ', ' ██ ', ' ██ ', '████'],
      'J': ['████', '  ██', '  ██', '█ ██', '████'],
      'K': ['█  █', '█ █ ', '██  ', '█ █ ', '█  █'],
      'L': ['█   ', '█   ', '█   ', '█   ', '████'],
      'M': ['█  █', '████', '█  █', '█  █', '█  █'],
      'N': ['█  █', '██ █', '█ ██', '█  █', '█  █'],
      'O': ['████', '█  █', '█  █', '█  █', '████'],
      'P': ['███ ', '█  █', '███ ', '█   ', '█   '],
      'Q': ['████', '█  █', '█  █', '█ █ ', '██ █'],
      'R': ['███ ', '█  █', '███ ', '█ █ ', '█  █'],
      'S': ['████', '█   ', '████', '   █', '████'],
      'T': ['████', ' ██ ', ' ██ ', ' ██ ', ' ██ '],
      'U': ['█  █', '█  █', '█  █', '█  █', '████'],
      'V': ['█  █', '█  █', '█  █', ' ██ ', ' ██ '],
      'W': ['█  █', '█  █', '█  █', '████', '█  █'],
      'X': ['█  █', ' ██ ', ' ██ ', ' ██ ', '█  █'],
      'Y': ['█  █', '█  █', ' ██ ', ' ██ ', ' ██ '],
      'Z': ['████', '  █ ', ' ██ ', '█   ', '████'],
      ' ': ['    ', '    ', '    ', '    ', '    '],
      '!': [' ██ ', ' ██ ', ' ██ ', '    ', ' ██ '],
      '?': ['████', '  █ ', ' ██ ', '    ', ' ██ '],
      '0': ['████', '█  █', '█  █', '█  █', '████'],
      '1': [' ██ ', '███ ', ' ██ ', ' ██ ', '████'],
      '2': ['████', '   █', '████', '█   ', '████'],
      '3': ['████', '   █', '████', '   █', '████'],
      '4': ['█  █', '█  █', '████', '   █', '   █'],
      '5': ['████', '█   ', '████', '   █', '████'],
      '6': ['████', '█   ', '████', '█  █', '████'],
      '7': ['████', '   █', '  ██', ' ██ ', '██  '],
      '8': ['████', '█  █', '████', '█  █', '████'],
      '9': ['████', '█  █', '████', '   █', '████'],
    }
  },
  small: {
    name: "Small",
    chars: {
      'A': ['▄█▄', '█▀█', '█ █'],
      'B': ['█▀▄', '█▀▄', '█▄▀'],
      'C': ['▄▀█', '█  ', '▀▄█'],
      'D': ['█▀▄', '█ █', '█▄▀'],
      'E': ['█▀▀', '█▀ ', '▀▀▀'],
      'F': ['█▀▀', '█▀ ', '█  '],
      'G': ['▄▀█', '█▄█', '▀▀█'],
      'H': ['█ █', '█▀█', '█ █'],
      'I': ['▀█▀', ' █ ', '▄█▄'],
      'J': ['▀▀█', ' ▄█', '▀▀ '],
      'K': ['█ █', '██ ', '█ █'],
      'L': ['█  ', '█  ', '▀▀▀'],
      'M': ['█▄█', '█▀█', '█ █'],
      'N': ['█▄█', '█▀█', '█ █'],
      'O': ['▄▀█▄', '█ █', '▀▄█▀'],
      'P': ['█▀▄', '█▀ ', '█  '],
      'Q': ['▄▀█▄', '█▄█', '▀ █'],
      'R': ['█▀▄', '██ ', '█ █'],
      'S': ['▄▀▀', '▀▀▄', '▄▄▀'],
      'T': ['▀█▀', ' █ ', ' █ '],
      'U': ['█ █', '█ █', '▀▄▀'],
      'V': ['█ █', '█ █', ' ▀ '],
      'W': ['█ █', '█▀█', '█▄█'],
      'X': ['█ █', ' ▀ ', '█ █'],
      'Y': ['█ █', ' ▀ ', ' █ '],
      'Z': ['▀▀▀', ' ▄▀', '▀▀▀'],
      ' ': ['   ', '   ', '   '],
      '!': [' █ ', ' █ ', ' ▄ '],
      '?': ['▀▀▄', ' ▄▀', ' ▄ '],
      '0': ['▄▀▄', '█ █', '▀▄▀'],
      '1': [' ▄ ', '▄█ ', '▀▀▀'],
      '2': ['▀▀▄', ' ▄▀', '▀▀▀'],
      '3': ['▀▀▄', ' ▀▄', '▄▄▀'],
      '4': ['▄ ▄', '▀▀█', '  █'],
      '5': ['▀▀▀', '▀▀▄', '▄▄▀'],
      '6': ['▄▀▀', '█▀▄', '▀▄▀'],
      '7': ['▀▀▀', ' ▄▀', ' █ '],
      '8': ['▄▀▄', '▄▀▄', '▀▄▀'],
      '9': ['▄▀▄', '▀▀█', '▄▄▀'],
    }
  },
  thin: {
    name: "Thin",
    chars: {
      'A': ['┌─┐', '├─┤', '┘ └'],
      'B': ['├─┐', '├─┤', '└─┘'],
      'C': ['┌──', '│  ', '└──'],
      'D': ['├─┐', '│ │', '└─┘'],
      'E': ['┌──', '├──', '└──'],
      'F': ['┌──', '├──', '└  '],
      'G': ['┌──', '│ ┐', '└─┘'],
      'H': ['│ │', '├─┤', '┘ └'],
      'I': ['───', ' │ ', '───'],
      'J': ['──┐', ' ┌┘', '─┘ '],
      'K': ['│ │', '├┐ ', '┘└┐'],
      'L': ['│  ', '│  ', '└──'],
      'M': ['│ │', '├┬┤', '┘└┘'],
      'N': ['│ │', '├┼┤', '┘ └'],
      'O': ['┌─┐', '│ │', '└─┘'],
      'P': ['├─┐', '├─┘', '└  '],
      'Q': ['┌─┐', '│┌┘', '└┼─'],
      'R': ['├─┐', '├┬┘', '┘└┐'],
      'S': ['┌──', '└─┐', '──┘'],
      'T': ['───', ' │ ', ' └ '],
      'U': ['│ │', '│ │', '└─┘'],
      'V': ['│ │', '│ │', '└┬┘'],
      'W': ['│ │', '├┬┤', '┘└┘'],
      'X': ['│ │', '└┬┘', '┌┘└'],
      'Y': ['│ │', '└┬┘', ' └ '],
      'Z': ['───', '┌─┘', '└──'],
      ' ': ['   ', '   ', '   '],
      '!': [' │ ', ' │ ', ' ● '],
      '?': ['─┐ ', '┌┘ ', ' ● '],
      '0': ['┌─┐', '│ │', '└─┘'],
      '1': [' ┌ ', '┌┘ ', '└──'],
      '2': ['──┐', '┌─┘', '└──'],
      '3': ['──┐', '──┤', '──┘'],
      '4': ['│ │', '└─┤', '  │'],
      '5': ['───', '└─┐', '──┘'],
      '6': ['┌──', '├─┐', '└─┘'],
      '7': ['───', ' ┌┘', ' └ '],
      '8': ['┌─┐', '├─┤', '└─┘'],
      '9': ['┌─┐', '└─┤', '──┘'],
    }
  }
};

export function AsciiArtGenerator() {
  const [inputText, setInputText] = useState('HELLO');
  const [selectedFont, setSelectedFont] = useState('block');
  const [asciiOutput, setAsciiOutput] = useState('');

  const generateAscii = useCallback((text: string, font: keyof typeof ASCII_FONTS) => {
    try {
      console.log('Generating ASCII for:', text, 'with font:', font);
      
      if (!text.trim()) {
        setAsciiOutput('');
        return;
      }

      const fontData = ASCII_FONTS[font];
      if (!fontData) {
        console.error('Font not found:', font);
        setAsciiOutput('Font not found');
        return;
      }

      const upperText = text.toUpperCase();
      const height = Math.max(...Object.values(fontData.chars).map(char => char.length));
      const lines: string[] = Array(height).fill('');

      for (let i = 0; i < height; i++) {
        for (const char of upperText) {
          const charPattern = fontData.chars[char as keyof typeof fontData.chars];
          if (charPattern && charPattern[i]) {
            lines[i] += charPattern[i] + ' ';
          } else {
            // For unsupported characters, add spaces
            lines[i] += '    ';
          }
        }
      }

      const result = lines.join('\n');
      console.log('Generated ASCII length:', result.length);
      setAsciiOutput(result);
    } catch (error) {
      console.error('Error generating ASCII:', error);
      setAsciiOutput('Error generating ASCII art');
    }
  }, []);

  // Generate ASCII whenever input changes
  React.useEffect(() => {
    generateAscii(inputText, selectedFont as keyof typeof ASCII_FONTS);
  }, [inputText, selectedFont, generateAscii]);

  // Initial generation on mount
  React.useEffect(() => {
    generateAscii('HELLO', 'block');
  }, [generateAscii]);

  const handleCopy = async () => {
    if (!asciiOutput) {
      toast.error('No ASCII art to copy');
      return;
    }

    const result = await copyToClipboard(asciiOutput);
    
    if (result.success) {
      switch (result.method) {
        case 'modern':
          toast.success('ASCII art copied to clipboard!');
          break;
        case 'legacy':
          toast.success('ASCII art copied to clipboard! (using legacy method)');
          break;
        case 'manual':
          toast.info('Please press Ctrl+C (Cmd+C on Mac) to copy the selected text');
          break;
      }
    } else {
      toast.error(`Failed to copy: ${result.error || 'Unknown error'}`);
      console.error('Copy failed:', result.error);
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([asciiOutput], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `ascii-art-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('ASCII art downloaded!');
  };

  const handleDownloadPNG = () => {
    if (!asciiOutput) return;

    // Create a temporary canvas for rendering
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    // Set up font and measurement
    const fontSize = 16;
    const lineHeight = fontSize * 1.1;
    const fontFamily = 'Courier New, monospace';
    ctx.font = `${fontSize}px ${fontFamily}`;

    // Split ASCII into lines and calculate dimensions
    const lines = asciiOutput.split('\n');
    const maxLineLength = Math.max(...lines.map(line => line.length));
    
    // Measure character width
    const charWidth = ctx.measureText('M').width;
    
    // Set canvas dimensions with padding
    const padding = 30;
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
        toast.error('Failed to generate PNG');
        return;
      }

      const element = document.createElement('a');
      element.href = URL.createObjectURL(blob);
      element.download = `ascii-art-${Date.now()}.png`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success('ASCII art PNG downloaded!');
    }, 'image/png');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100vh-160px)] sm:h-[calc(100vh-180px)] lg:h-[calc(100vh-200px)] max-w-full">
      {/* Controls Sidebar */}
      <div className="w-full lg:w-80 flex-shrink-0">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Text to ASCII</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="text-input">Enter text to convert</Label>
              <Input
                id="text-input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your text here..."
                maxLength={20}
              />
              <p className="text-sm text-muted-foreground">
                Maximum 20 characters for better display
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="font-select">ASCII Font Style</Label>
              <Select value={selectedFont} onValueChange={setSelectedFont}>
                <SelectTrigger id="font-select">
                  <SelectValue placeholder="Select font style" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ASCII_FONTS).map(([key, font]) => (
                    <SelectItem key={key} value={key}>
                      {font.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleCopy}
                disabled={!asciiOutput}
                className="w-full"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy to Clipboard
              </Button>
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={!asciiOutput}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download as TXT
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadPNG}
                disabled={!asciiOutput}
                className="w-full"
              >
                <Image className="w-4 h-4 mr-2" />
                Download as PNG
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>
                Supports letters (A-Z), numbers (0-9), and basic punctuation.
                Unsupported characters will be displayed as spaces.
              </p>
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
            <div className="h-full bg-muted/30 rounded-lg p-3 overflow-auto">
              <div className="w-full h-full overflow-auto scrollbar-thin">
                <pre className="font-mono text-base leading-[1.0] whitespace-pre block min-w-fit min-h-full select-all">
                  {asciiOutput || 'Enter text in the sidebar to generate ASCII art...'}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}