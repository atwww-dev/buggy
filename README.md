# Buggy

A Chrome extension that allows users to capture screenshots of web pages, annotate them, and automatically create bug cards in Trello.

## Features

- **Screenshot Capture**
  - Full page capture
  - Visible area capture
  - Element-specific capture
- **Annotation Tools**
  - Highlight areas of interest
  - Draw on screenshots
  - Add text annotations
- **Technical Context Collection**
  - Browser and OS information
  - Page URL and title
  - Console errors
  - Element path and state
- **Trello Integration**
  - Automatic card creation
  - Customizable board and list selection
  - Attached screenshots and technical details

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Configuration

1. Get your Trello API key and token from [Trello Developer Portal](https://trello.com/app-key)
2. Click the extension icon and enter your Trello credentials
3. Select your default board and list for bug reports

## Usage

1. Click the extension icon in your browser toolbar
2. Choose your capture method:
   - Full Page: Captures the entire webpage
   - Visible Area: Captures only the currently visible portion
   - Element: Click to select a specific element
3. Annotate the screenshot using the provided tools
4. Fill in the bug details:
   - Title
   - Description
   - Category
   - Priority
   - Reproduction steps
5. Select the Trello board and list
6. Click "Submit Bug Report"

## Development

### Project Structure

- `manifest.json`: Extension configuration
- `popup.html`: Main extension interface
- `popup.js`: Popup functionality
- `content.js`: Content script for screenshot capture
- `background.js`: Background service worker
- `styles/`: CSS files
- `icons/`: Extension icons

### Dependencies

- html2canvas: For screenshot capture
- Trello API: For card creation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 