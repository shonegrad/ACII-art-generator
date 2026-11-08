# ASCII Art Generator

A modern web application for converting text and images into ASCII art. Built with React, TypeScript, and Tailwind CSS.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![React](https://img.shields.io/badge/React-18.3.1-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- **Text to ASCII** - Convert text into stylized ASCII art with multiple font styles (Block, Small, Thin)
- **ASCII Banner** - Create decorative banners with customizable borders and styles
- **Image to ASCII** - Transform images into ASCII art with multiple character sets and adjustable width

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/shonegrad/ACII-art-generator.git
cd ACII-art-generator

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React 18.3.1 |
| **Build Tool** | Vite 6.3.5 |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS v4.1.3 |
| **UI Components** | shadcn/ui + Radix primitives |
| **Testing** | Vitest + React Testing Library |

## 📁 Project Structure

```
ASCII Art Generator/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components (48 files)
│   │   ├── utils/           # Utility functions
│   │   ├── AsciiArtGenerator.tsx
│   │   ├── AsciiBanner.tsx
│   │   └── ImageToAscii.tsx
│   ├── styles/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .github/workflows/       # CI/CD pipelines
├── .agent/workflows/        # Agent workflows
├── DEVELOPMENT.md           # Development guide
├── CONTRIBUTING.md          # Contribution guidelines
├── CHANGELOG.md             # Version history
└── VERSION                  # Current version
```

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 5173 |
| `npm run build` | Build for production |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch
```

## 🚢 Deployment

The project automatically deploys to GitHub Pages when pushing to the `main` branch via GitHub Actions.

**Manual build**:

```bash
npm run build
```

The production build will be in the `build/` directory.

## 📖 Documentation

- [Development Guide](./DEVELOPMENT.md) - Development rules and best practices
- [Contributing](./CONTRIBUTING.md) - How to contribute
- [Changelog](./CHANGELOG.md) - Version history

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) before submitting a PR.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

*Design originally from [Figma](https://www.figma.com/design/K8vzpXM7gCGfq2HgHn1QOC/ASCII-Art-Generator)*
