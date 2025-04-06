# Buggy

A lightweight bug reporting tool with screenshot capture, annotation capabilities, and customizable submission.

## Features

- 📸 Screenshot capture directly from the browser
- ✏️ Screenshot annotation with drawing tools
- 🔍 Zoom and pan functionality for better image navigation
- 📋 Comprehensive bug report form with all necessary fields
- 🎨 Clean black and white UI
- 📱 Responsive design
- 🔌 Easy integration with any backend

## Installation

### Option 1: Via Script Tag

Add the script tag to your HTML:

```html
<script src="https://unpkg.com/buggy@1.0.0/scripts/buggy.min.js"></script>

<!-- Optional: Include html2canvas for better screenshot capability -->
<script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>
```

### Option 2: Manual Download

1. Download the latest release from the [releases page](https://github.com/yourusername/buggy/releases)
2. Extract and include in your project:

```html
<script src="path/to/buggy.min.js"></script>
```

## Usage

### Basic Initialization

```javascript
// Initialize with your backend API endpoint
const buggy = new Buggy({
    apiUrl: '/api/feedback'
});

// Show the bug report form
buggy.showBugReportForm();

// Capture screenshot and show form
buggy.captureScreenshotAndShowForm();
```

### Advanced Configuration

```javascript
const buggy = new Buggy({
    apiUrl: '/api/feedback',
    onSubmit: function(data) {
        // Custom handling of submission
        console.log('Bug report data:', data);
        return fetch('/api/custom-endpoint', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    },
    labels: {
        // Customize UI text
        title: 'Report an Issue',
        submitButton: 'Send Report'
    }
});
```

## API Reference

### Constructor Options

| Option | Type | Description |
|--------|------|-------------|
| `apiUrl` | String | The endpoint to submit bug reports to |
| `onSubmit` | Function | Optional custom submission handler |
| `labels` | Object | Customize UI text elements |

### Methods

| Method | Description |
|--------|-------------|
| `showBugReportForm()` | Shows the bug report form without a screenshot |
| `captureScreenshotAndShowForm()` | Captures a screenshot, allows annotation, and shows the form |
| `captureScreenshot()` | Just captures a screenshot and returns a promise with the data URL |

## Server Integration

The bug report is submitted as a POST request with the following structure:

```json
{
  "title": "Bug title",
  "description": "Detailed description of the issue",
  "category": "UI", // "UI", "Functionality", "Performance", "Other"
  "priority": "High", // "Low", "Medium", "High", "Critical"
  "steps": "Steps to reproduce the issue",
  "url": "https://page-where-bug-occurred.com",
  "browser": "Chrome 95.0.4638.69",
  "screenshot": "data:image/png;base64,..." // Optional, base64 encoded
}
```

## Browser Support

Buggy supports all modern browsers:
- Chrome, Firefox, Safari, Edge (latest 2 versions)
- IE11 with polyfills (screenshot functionality limited)

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Build for production: `npm run build`

## License

MIT 