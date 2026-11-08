# Feature Spec: Animated GIF Export for ASCII Art

## 1. Overview

Add the ability to record and download animated GIFs of the ASCII art output, where one control knob (Brightness, Contrast, or Gamma) is animated from its minimum to maximum value while the others remain fixed. Also supports a "random" animation mode and basic animation settings (duration, FPS, loop).

## 2. User Stories

### Primary: Single-knob animation
> As a user, I can click a small record (🎥) button beside any of the Brightness, Contrast, or Gamma sliders. When clicked, the app generates and downloads a GIF showing that knob animating from 0% → 100% of its range (e.g. Brightness 0→2, Contrast 0→3, Gamma 0.1→2.5), while the other two knobs stay at their current values.

### Secondary: Random animation
> As a user, I can click a "Random animation" button. The app picks a random knob, animates it across its full range, and downloads the GIF.

### Secondary: Animation settings
> As a user, I can open an animation settings dialog to configure duration (seconds), frames-per-second, loop count, and output size before recording.

## 3. Technical Design

### GIF encoding library: `gif.js`
- Full-featured JavaScript GIF encoder that runs in the browser
- Supports Web Workers → encoding happens off the main thread (UI stays responsive)
- Widely used, actively maintained
- Alternative considered: `gif-tools` (modern TS, zero-dep) — rejected because gif.js has better worker support and a longer track record

### Frame capture
- At each animation step, render the current ASCII output (with the animated knob value applied) to an offscreen canvas
- `getImageData` on that canvas → frame data → feed to gif.js `addFrame()`
- The existing `renderAscii()` pure function in `src/lib/asciiRender.ts` is reused for frame rendering (no DOM dependency)

### Animation loop
- Step through knob values linearly from min → max over the configured duration
- Capture one frame per FPS step
- After all frames captured, gif.js encodes + produces a Blob → object URL → `<a download>` click → download

### Non-goals (v1)
- Recording live preview interactivity (user dragging sliders during record)
- MP4/WebM output
- Text overlay/watermark
- Preview of the GIF before download (can be added in v2)

## 4. File Changes

### New files
- `src/lib/gifRecorder.ts` — pure GIF recording logic (frame capture + gif.js orchestration)
- `src/components/GifRecorderModal.tsx` — animation settings dialog
- `src/components/RecordButton.tsx` — small record button beside sliders

### Modified files
- `src/components/ControlPanel.tsx` — add record buttons beside Brightness/Contrast/Gamma sliders; wire record handler
- `src/hooks/useAsciiConverter.ts` — expose a `renderFrame(opts)` helper that renders ASCII for arbitrary options (for offline frame rendering)
- `src/lib/asciiRender.ts` — already exists; ensure `renderAscii` accepts arbitrary `finalWidth`/`finalHeight` (done)
- `package.json` — add `gif.js` dependency
- `CHANGELOG.md` — add feature entry

## 5. Animation Knobs & Ranges

| Knob | Min | Max | Default | Step |
|------|-----|-----|---------|------|
| Brightness | 0 | 2 | 0.8 | 0.1 |
| Contrast | 0 | 3 | 1.2 | 0.1 |
| Gamma | 0.1 | 3 | 1.0 | 0.1 |

Gamma min 0.1 (avoiding division-by-zero in `Math.pow(norm, 1/gamma)`).

## 6. Default Animation Settings

| Setting | Default |
|---------|---------|
| Duration | 3 seconds |
| FPS | 15 |
| Loop | 0 (infinite) |
| Width | match preview canvas width |

## 7. UX Details

- Record button: small 🎥 icon button, disabled while recording
- While recording: sliders disabled, toast "Recording GIF…", spinner in the preview
- On completion: toast "GIF saved!", auto-download via blob URL
- Errors: toast "Failed to record GIF"
- Cleanup: revoke object URL after download

## 8. Verification

- `npm run typecheck` — clean
- `npm run lint` — clean
- `npm run test` — existing + new tests pass
- `npm run build` — succeeds
- Manual: click record beside Brightness → GIF downloads, shows brightness sweeping 0→2

## 9. Out of Scope (v2 considerations)
- GIF preview before download
- Text animation (typing effect on the ASCII output itself)
- Color cycling animation
- Multi-knob simultaneous animation
