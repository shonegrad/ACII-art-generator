import { ImageToAscii } from './components/ImageToAscii';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './components/theme-provider';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" attribute="class">
        <div className="app-shell">
          <div className="app-main">
            <ImageToAscii />
          </div>
          <footer className="app-footer">ASCII Art Generator</footer>
          <Toaster />
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}