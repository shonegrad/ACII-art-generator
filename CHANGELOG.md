# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-11-07

### Added

- Gamma mid-tone curve and reordered character sets (dark-to-light)
- Extended brightness (-2..2 → 0..2) and contrast (0..3) slider ranges
- Distinct artistic character sets
- Canvas drag-and-drop for the preview panel
- OffscreenCanvas processing surface with DOM canvas fallback
- Web-Worker-ready conversion pipeline
- ARIA labels on theme toggle and Invert/Color switches
- Animated GIF recording: record per-knob animations (brightness/contrast/gamma sweep) with configurable duration/FPS/loop, plus Web Worker-based GIF encoding via gif.js

### Fixed

- Invert toggle logic flipped per user feedback
- Color toggle using incorrect handler prop
- Object-URL memory leak on unmount
- In-flight conversion setting state after unmount
- PNG export clipping the final character
- `getProcessingCanvas` null-return type error and missing React dependency

### Changed

- Default brightness 1 → 0.8, contrast 1 → 1.2 for softer output
- Primary accent color indigo/violet → magenta

## [Unreleased]

### Added

- Development documentation (DEVELOPMENT.md)
- Contributing guidelines (CONTRIBUTING.md)
- GitHub Actions CI/CD workflow
- Vitest testing setup
- Agent workflows for development automation

### Changed

- Expanded README with comprehensive documentation

## [0.1.0] - 2025-12-29

### Added

- Initial release
- Text to ASCII art generator with Block, Small, and Thin fonts
- ASCII Banner creator with customizable styles
- Image to ASCII converter with multiple character sets
- Copy to clipboard functionality with fallbacks
- Download as TXT and PNG
- Responsive UI with shadcn/ui components
