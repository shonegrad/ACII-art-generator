# ASCII Art Generator Design Guidelines

## General Guidelines

* Use responsive layouts with flexbox and grid
* Only use absolute positioning when necessary
* Refactor code as you go to keep code clean
* Keep file sizes small; extract helper functions and components into their own files
* Handle errors gracefully with user-friendly messages

---

## Design System

### Colors

* Use Tailwind CSS design tokens for all colors
* Prefer CSS variables for theming (`--background`, `--foreground`, `--primary`, etc.)
* Ensure sufficient contrast for accessibility (WCAG 2.1 AA)

### Typography

* Base font-size: 16px (1rem)
* Use the Inter font family from CSS variables
* Heading hierarchy: h1 > h2 > h3 > h4

### Spacing

* Use Tailwind spacing scale (4px increments)
* Consistent padding/margin: `p-2`, `p-4`, `gap-2`, `gap-4`

---

## Component Guidelines

### Button

**Variants:**

* **Primary** - Used for main actions. Filled with primary color.
* **Secondary** - Used for alternative actions. Outlined style.
* **Ghost** - Used for tertiary actions. Text-only.

**Rules:**

* One primary button per section
* Use descriptive, action-oriented labels
* Include icons for enhanced context where applicable

### Card

**Usage:**

* Container for grouped content
* Always include CardHeader for title/description
* Use CardContent for body content

### Input Fields

**Rules:**

* Always include associated labels
* Provide placeholder text for context
* Show validation states (error, success)

---

## ASCII Art Specific

### Font Selection

* Block - Best for bold, impactful text
* Small - Good for compact displays
* Thin - Ideal for elegant, line-based art

### Character Sets (Image to ASCII)

* Standard - General purpose
* Detailed - High-detail images
* Matrix - Binary/digital aesthetic
* Artistic - Creative/artistic effects

### Export Options

* Always offer both TXT and PNG export
* Include proper monospace font in PNG exports
* Maintain aspect ratio in image conversions
