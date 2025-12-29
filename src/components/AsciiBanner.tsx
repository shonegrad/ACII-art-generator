import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Copy, Download, Image } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { copyToClipboard } from './utils/clipboard';

const BANNER_STYLES = {
  simple: {
    name: 'Simple Box',
    generate: (text: string) => {
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length === 0) return '';

      const maxLength = Math.max(...lines.map(line => line.length));
      const border = '+' + '-'.repeat(maxLength + 2) + '+';

      return [
        border,
        ...lines.map(line => '| ' + line.padEnd(maxLength) + ' |'),
        border
      ].join('\n');
    }
  },
  double: {
    name: 'Double Line',
    generate: (text: string) => {
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length === 0) return '';

      const maxLength = Math.max(...lines.map(line => line.length));
      const topBorder = '╔' + '═'.repeat(maxLength + 2) + '╗';
      const bottomBorder = '╚' + '═'.repeat(maxLength + 2) + '╝';

      return [
        topBorder,
        ...lines.map(line => '║ ' + line.padEnd(maxLength) + ' ║'),
        bottomBorder
      ].join('\n');
    }
  },
  rounded: {
    name: 'Rounded Corner',
    generate: (text: string) => {
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length === 0) return '';

      const maxLength = Math.max(...lines.map(line => line.length));
      const topBorder = '╭' + '─'.repeat(maxLength + 2) + '╮';
      const bottomBorder = '╰' + '─'.repeat(maxLength + 2) + '╯';

      return [
        topBorder,
        ...lines.map(line => '│ ' + line.padEnd(maxLength) + ' │'),
        bottomBorder
      ].join('\n');
    }
  },
  stars: {
    name: 'Stars',
    generate: (text: string) => {
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length === 0) return '';

      const maxLength = Math.max(...lines.map(line => line.length));
      const border = '*'.repeat(maxLength + 4);

      return [
        border,
        ...lines.map(line => '* ' + line.padEnd(maxLength) + ' *'),
        border
      ].join('\n');
    }
  },
  hash: {
    name: 'Hash Border',
    generate: (text: string) => {
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length === 0) return '';

      const maxLength = Math.max(...lines.map(line => line.length));
      const border = '#'.repeat(maxLength + 4);

      return [
        border,
        ...lines.map(line => '# ' + line.padEnd(maxLength) + ' #'),
        border
      ].join('\n');
    }
  },
  fancy: {
    name: 'Fancy Frame',
    generate: (text: string) => {
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length === 0) return '';

      const maxLength = Math.max(...lines.map(line => line.length));
      const topBorder = '┌' + '─'.repeat(maxLength + 2) + '┐';
      const bottomBorder = '└' + '─'.repeat(maxLength + 2) + '┘';

      return [
        topBorder,
        ...lines.map(line => '│ ' + line.padEnd(maxLength) + ' │'),
        bottomBorder
      ].join('\n');
    }
  }
};

export function AsciiBanner() {
  const [inputText, setInputText] = useState('Welcome to ASCII Art!\nMade with ♥');
  const [selectedStyle, setSelectedStyle] = useState('simple');
  const [bannerOutput, setBannerOutput] = useState('');

  const generateBanner = React.useCallback((text: string, styleKey: string) => {
    try {
      console.log('Generating banner for:', text, 'with style:', styleKey);

      if (!text.trim()) {
        setBannerOutput('');
        return;
      }

      const style = BANNER_STYLES[styleKey as keyof typeof BANNER_STYLES];
      if (!style) {
        console.error('Style not found:', styleKey);
        setBannerOutput('Style not found');
        return;
      }

      const result = style.generate(text);
      console.log('Generated banner length:', result.length);
      setBannerOutput(result);
    } catch (error) {
      console.error('Error generating banner:', error);
      setBannerOutput('Error generating banner');
    }
  }, []);

  // Generate banner whenever input changes
  React.useEffect(() => {
    generateBanner(inputText, selectedStyle);
  }, [inputText, selectedStyle, generateBanner]);

  // Initial generation on mount
  React.useEffect(() => {
    generateBanner('Welcome to ASCII Art!\nMade with ♥', 'simple');
  }, [generateBanner]);

  const handleCopy = async () => {
    if (!bannerOutput) {
      toast.error('No banner to copy');
      return;
    }

    const result = await copyToClipboard(bannerOutput);

    if (result.success) {
      switch (result.method) {
        case 'modern':
          toast.success('Banner copied to clipboard!');
          break;
        case 'legacy':
          toast.success('Banner copied to clipboard! (using legacy method)');
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
    const file = new Blob([bannerOutput], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `ascii-banner-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Banner downloaded!');
  };

  const handleDownloadPNG = () => {
    if (!bannerOutput) return;

    // Create a temporary canvas for rendering
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    // Set up font and measurement
    const fontSize = 14;
    const lineHeight = fontSize * 1.2;
    const fontFamily = 'Courier New, monospace';
    ctx.font = `${fontSize}px ${fontFamily}`;

    // Split ASCII into lines and calculate dimensions
    const lines = bannerOutput.split('\n');
    const maxLineLength = Math.max(...lines.map(line => line.length));

    // Measure character width
    const charWidth = ctx.measureText('M').width;

    // Set canvas dimensions with padding
    const padding = 25;
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
      element.download = `ascii-banner-${Date.now()}.png`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success('ASCII banner PNG downloaded!');
    }, 'image/png');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100vh-160px)] sm:h-[calc(100vh-180px)] lg:h-[calc(100vh-200px)] max-w-full">
      {/* Controls Sidebar */}
      <div className="w-full lg:w-80 flex-shrink-0">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>ASCII Banner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="banner-text">Banner Text</Label>
              <textarea
                id="banner-text"
                className="min-h-[120px] w-full rounded-md border border-input bg-input-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter your banner text..."
                maxLength={500}
              />
              <p className="text-sm text-muted-foreground">
                Use line breaks for multiple lines. Maximum 500 characters.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="style-select">Banner Style</Label>
              <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                <SelectTrigger id="style-select">
                  <SelectValue placeholder="Select banner style" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BANNER_STYLES).map(([key, style]) => (
                    <SelectItem key={key} value={key}>
                      {style.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleCopy}
                disabled={!bannerOutput}
                className="w-full"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy to Clipboard
              </Button>
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={!bannerOutput}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download as TXT
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadPNG}
                disabled={!bannerOutput}
                className="w-full"
              >
                <Image className="w-4 h-4 mr-2" />
                Download as PNG
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ASCII Output Area */}
      <div className="flex-1 min-w-0">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Generated Banner</CardTitle>
          </CardHeader>
          <CardContent className="h-[calc(100%-80px)]">
            <div className="h-full bg-muted/30 rounded-lg p-3 overflow-auto">
              <div className="w-full h-full overflow-auto scrollbar-thin">
                <pre className="font-mono text-sm leading-[1.0] whitespace-pre block min-w-fit min-h-full select-all">
                  {bannerOutput || 'Enter text in the sidebar to generate a banner...'}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}