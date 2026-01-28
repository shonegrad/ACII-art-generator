import { ImageToAscii } from './components/ImageToAscii';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './components/theme-provider';


export default function App() {

  return (
    <ThemeProvider defaultTheme="dark" attribute="class">
      <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden transition-colors duration-300">
        <div className="flex-1 overflow-hidden">
          <ImageToAscii />
        </div>
        <footer className="flex-none py-2 text-center border-t border-border bg-card/50">
          <span className="text-xs text-muted-foreground">ASCII Art Generator</span>
        </footer>
        <Toaster />
      </div>
    </ThemeProvider>
  );
}