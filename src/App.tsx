
import { AsciiArtGenerator } from './components/AsciiArtGenerator';
import { AsciiBanner } from './components/AsciiBanner';
import { ImageToAscii } from './components/ImageToAscii';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';


export default function App() {

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <div className="max-w-full mx-auto space-y-3 sm:space-y-4">
        <Tabs defaultValue="image-to-ascii" className="w-full h-full flex flex-col">
          <div className="flex-none px-4 sm:px-6 lg:px-8 py-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold tracking-tight">ASCII Art Generator</h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline-block">
                  Create beautiful text art
                </span>
              </div>
            </div>
            <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
              <TabsTrigger value="image-to-ascii">Image to ASCII</TabsTrigger>
              <TabsTrigger value="text-to-ascii">Text to ASCII</TabsTrigger>
              <TabsTrigger value="ascii-banner">ASCII Banner</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden p-4 sm:p-6 lg:px-8 bg-muted/10">
            <TabsContent value="image-to-ascii" className="h-full m-0 data-[state=inactive]:hidden">
              <ImageToAscii />
            </TabsContent>
            <TabsContent value="text-to-ascii" className="h-full m-0 data-[state=inactive]:hidden">
              <AsciiArtGenerator />
            </TabsContent>
            <TabsContent value="ascii-banner" className="h-full m-0 data-[state=inactive]:hidden">
              <AsciiBanner />
            </TabsContent>
          </div>
        </Tabs>
      </div>


    </div>
  );
}