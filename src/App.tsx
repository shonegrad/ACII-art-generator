import React from 'react';
import { AsciiArtGenerator } from './components/AsciiArtGenerator';
import { AsciiBanner } from './components/AsciiBanner';
import { ImageToAscii } from './components/ImageToAscii';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    // Simple check that components are loaded
    setIsReady(true);
    console.log('ASCII Art Generator loaded successfully');
  }, []);

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <div className="max-w-full mx-auto space-y-3 sm:space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl">ASCII Art Generator</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Convert text into beautiful ASCII art, create decorative banners, and transform images into ASCII art
          </p>
          {!isReady && (
            <p className="text-xs text-muted-foreground">Loading generators...</p>
          )}
        </div>

        <Tabs defaultValue="text-art" className="w-full">
          <div className="flex justify-center mb-3 sm:mb-4">
            <TabsList className="grid grid-cols-3 w-full sm:w-fit text-xs sm:text-sm">
              <TabsTrigger value="text-art" className="px-2 sm:px-3">Text to ASCII</TabsTrigger>
              <TabsTrigger value="banner" className="px-2 sm:px-3">ASCII Banner</TabsTrigger>
              <TabsTrigger value="image-art" className="px-2 sm:px-3">Image to ASCII</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="text-art" className="mt-0">
            <AsciiArtGenerator />
          </TabsContent>

          <TabsContent value="banner" className="mt-0">
            <AsciiBanner />
          </TabsContent>

          <TabsContent value="image-art" className="mt-0">
            <ImageToAscii />
          </TabsContent>
        </Tabs>
      </div>
      
      <Toaster />
    </div>
  );
}