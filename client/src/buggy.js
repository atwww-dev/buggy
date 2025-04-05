class Buggy {
  constructor(config) {
    this.config = {
      apiUrl: config.apiUrl || '/api/feedback',
      buttonText: config.buttonText || 'Report Bug',
      buttonPosition: config.buttonPosition || 'bottom-right',
      ...config
    };
    
    this.initialize();
  }

  initialize() {
    this.createButton();
    this.createModal();
    this.addStyles();
  }

  createButton() {
    const button = document.createElement('button');
    button.className = 'buggy-button';
    button.innerHTML = `
      <svg viewBox="0 0 24 24" width="24" height="24">
        <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
      </svg>
      ${this.config.buttonText}
    `;
    button.onclick = () => this.showModal();
    document.body.appendChild(button);
  }

  createModal() {
    const modal = document.createElement('div');
    modal.className = 'buggy-modal';
    modal.innerHTML = `
      <div class="buggy-modal-content">
        <div class="buggy-modal-header">
          <h2>Report a Bug</h2>
          <button class="buggy-close">&times;</button>
        </div>
        <div class="buggy-modal-body">
          <div class="buggy-screenshot-container">
            <canvas id="buggy-canvas"></canvas>
            <div class="buggy-annotation-tools">
              <button class="buggy-tool" data-tool="highlight">Highlight</button>
              <button class="buggy-tool" data-tool="draw">Draw</button>
              <button class="buggy-tool" data-tool="text">Text</button>
            </div>
          </div>
          <form id="buggy-form">
            <div class="buggy-form-group">
              <label for="buggy-title">Title</label>
              <input type="text" id="buggy-title" required placeholder="Brief description of the issue">
            </div>
            <div class="buggy-form-group">
              <label for="buggy-description">Description</label>
              <textarea id="buggy-description" required placeholder="Detailed description of the issue"></textarea>
            </div>
            <div class="buggy-form-group">
              <label for="buggy-category">Category</label>
              <select id="buggy-category" required>
                <option value="ui">UI Issue</option>
                <option value="functionality">Functionality</option>
                <option value="performance">Performance</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="buggy-form-group">
              <label for="buggy-priority">Priority</label>
              <select id="buggy-priority" required>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div class="buggy-form-group">
              <label for="buggy-steps">Reproduction Steps</label>
              <textarea id="buggy-steps" placeholder="Steps to reproduce the issue"></textarea>
            </div>
            <button type="submit" class="buggy-submit">Submit Report</button>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Add event listeners
    modal.querySelector('.buggy-close').onclick = () => this.hideModal();
    modal.querySelector('#buggy-form').onsubmit = (e) => this.handleSubmit(e);
    
    // Initialize canvas
    this.initializeCanvas();
  }

  async initializeCanvas() {
    const previewCanvas = document.getElementById('buggy-canvas');
    const previewCtx = previewCanvas.getContext('2d');
    
    // Capture screenshot
    const screenshot = await this.captureScreenshot();
    const img = new Image();
    img.onload = () => {
      previewCanvas.width = img.width;
      previewCanvas.height = img.height;
      previewCtx.drawImage(img, 0, 0);
    };
    img.src = screenshot;

    // Create canvas container
    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'buggy-canvas-container';
    canvasContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 999999;
    `;

    // Create toolbar
    const toolbar = document.createElement('div');
    toolbar.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      background: white;
      padding: 10px;
      border-radius: 8px;
      display: flex;
      gap: 10px;
      z-index: 1;
    `;

    // Drawing tools
    const tools = [
      { name: 'pen', icon: '✏️' },
      { name: 'arrow', icon: '➡️' },
      { name: 'rectangle', icon: '⬜' },
      { name: 'circle', icon: '⭕' },
      { name: 'text', icon: 'T' }
    ];

    let currentTool = 'pen';
    let isDrawing = false;
    let startX, startY;
    let annotations = [];
    let currentColor = '#ff0000';

    // Create tool buttons
    tools.forEach(tool => {
      const button = document.createElement('button');
      button.innerHTML = tool.icon;
      button.style.cssText = `
        padding: 8px;
        border: none;
        background: ${currentTool === tool.name ? '#e0e0e0' : 'white'};
        border-radius: 4px;
        cursor: pointer;
      `;
      button.onclick = () => {
        currentTool = tool.name;
        document.querySelectorAll('.buggy-tool-button').forEach(btn => {
          btn.style.background = 'white';
        });
        button.style.background = '#e0e0e0';
      };
      button.className = 'buggy-tool-button';
      toolbar.appendChild(button);
    });

    // Color picker
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#000000', '#ffffff'];
    const colorContainer = document.createElement('div');
    colorContainer.style.cssText = `
      display: flex;
      gap: 5px;
      margin-left: 10px;
    `;

    colors.forEach(color => {
      const colorButton = document.createElement('button');
      colorButton.style.cssText = `
        width: 24px;
        height: 24px;
        border: 2px solid ${currentColor === color ? '#000' : 'transparent'};
        border-radius: 50%;
        background: ${color};
        cursor: pointer;
      `;
      colorButton.onclick = () => {
        currentColor = color;
        document.querySelectorAll('.buggy-color-button').forEach(btn => {
          btn.style.borderColor = 'transparent';
        });
        colorButton.style.borderColor = '#000';
      };
      colorButton.className = 'buggy-color-button';
      colorContainer.appendChild(colorButton);
    });

    toolbar.appendChild(colorContainer);
    canvasContainer.appendChild(toolbar);

    // Create annotation canvas
    const annotationCanvas = document.createElement('canvas');
    annotationCanvas.style.cssText = `
      max-width: 90%;
      max-height: 80%;
      border: 2px solid white;
      cursor: crosshair;
    `;

    const annotationCtx = annotationCanvas.getContext('2d');
    annotationCanvas.width = screenshot.width;
    annotationCanvas.height = screenshot.height;
    annotationCtx.drawImage(screenshot, 0, 0);

    // Drawing functions
    function drawArrow(x1, y1, x2, y2) {
      const headLength = 20;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      
      annotationCtx.beginPath();
      annotationCtx.moveTo(x1, y1);
      annotationCtx.lineTo(x2, y2);
      annotationCtx.strokeStyle = currentColor;
      annotationCtx.lineWidth = 2;
      annotationCtx.stroke();

      // Arrow head
      annotationCtx.beginPath();
      annotationCtx.moveTo(x2, y2);
      annotationCtx.lineTo(
        x2 - headLength * Math.cos(angle - Math.PI / 6),
        y2 - headLength * Math.sin(angle - Math.PI / 6)
      );
      annotationCtx.lineTo(
        x2 - headLength * Math.cos(angle + Math.PI / 6),
        y2 - headLength * Math.sin(angle + Math.PI / 6)
      );
      annotationCtx.closePath();
      annotationCtx.fillStyle = currentColor;
      annotationCtx.fill();
    }

    function drawRectangle(x1, y1, x2, y2) {
      const width = x2 - x1;
      const height = y2 - y1;
      annotationCtx.strokeStyle = currentColor;
      annotationCtx.lineWidth = 2;
      annotationCtx.strokeRect(x1, y1, width, height);
    }

    function drawCircle(x1, y1, x2, y2) {
      const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      annotationCtx.beginPath();
      annotationCtx.arc(x1, y1, radius, 0, 2 * Math.PI);
      annotationCtx.strokeStyle = currentColor;
      annotationCtx.lineWidth = 2;
      annotationCtx.stroke();
    }

    // Event listeners for drawing
    annotationCanvas.addEventListener('mousedown', (e) => {
      isDrawing = true;
      startX = e.offsetX;
      startY = e.offsetY;

      if (currentTool === 'text') {
        const text = prompt('Enter text:');
        if (text) {
          annotationCtx.fillStyle = currentColor;
          annotationCtx.font = '16px Arial';
          annotationCtx.fillText(text, startX, startY);
          annotations.push({ type: 'text', x: startX, y: startY, text, color: currentColor });
        }
        isDrawing = false;
      }
    });

    annotationCanvas.addEventListener('mousemove', (e) => {
      if (!isDrawing) return;

      const currentX = e.offsetX;
      const currentY = e.offsetY;

      // Clear canvas and redraw everything
      annotationCtx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);
      annotationCtx.drawImage(screenshot, 0, 0);

      // Redraw all annotations
      annotations.forEach(annotation => {
        annotationCtx.strokeStyle = annotation.color;
        annotationCtx.fillStyle = annotation.color;
        switch (annotation.type) {
          case 'pen':
            annotationCtx.beginPath();
            annotationCtx.moveTo(annotation.startX, annotation.startY);
            annotationCtx.lineTo(annotation.endX, annotation.endY);
            annotationCtx.stroke();
            break;
          case 'arrow':
            drawArrow(annotation.startX, annotation.startY, annotation.endX, annotation.endY);
            break;
          case 'rectangle':
            drawRectangle(annotation.startX, annotation.startY, annotation.endX, annotation.endY);
            break;
          case 'circle':
            drawCircle(annotation.startX, annotation.startY, annotation.endX, annotation.endY);
            break;
          case 'text':
            annotationCtx.font = '16px Arial';
            annotationCtx.fillText(annotation.text, annotation.x, annotation.y);
            break;
        }
      });

      // Draw current annotation
      annotationCtx.strokeStyle = currentColor;
      annotationCtx.fillStyle = currentColor;

      switch (currentTool) {
        case 'pen':
          annotationCtx.beginPath();
          annotationCtx.moveTo(startX, startY);
          annotationCtx.lineTo(currentX, currentY);
          annotationCtx.stroke();
          break;
        case 'arrow':
          drawArrow(startX, startY, currentX, currentY);
          break;
        case 'rectangle':
          drawRectangle(startX, startY, currentX, currentY);
          break;
        case 'circle':
          drawCircle(startX, startY, currentX, currentY);
          break;
      }
    });

    annotationCanvas.addEventListener('mouseup', () => {
      if (!isDrawing) return;
      isDrawing = false;

      // Save the annotation
      if (currentTool !== 'text') {
        annotations.push({
          type: currentTool,
          startX,
          startY,
          endX: e.offsetX,
          endY: e.offsetY,
          color: currentColor
        });
      }
    });

    // Add clear button
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear';
    clearButton.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      padding: 8px 16px;
      background: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      z-index: 1;
    `;
    clearButton.onclick = () => {
      annotations = [];
      annotationCtx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);
      annotationCtx.drawImage(screenshot, 0, 0);
    };
    canvasContainer.appendChild(clearButton);

    canvasContainer.appendChild(annotationCanvas);
    document.body.appendChild(canvasContainer);

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: white;
      border: none;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      font-size: 20px;
      cursor: pointer;
      z-index: 1;
    `;
    closeButton.onclick = () => {
      document.body.removeChild(canvasContainer);
    };
    canvasContainer.appendChild(closeButton);

    // Add continue button
    const continueButton = document.createElement('button');
    continueButton.textContent = 'Continue';
    continueButton.style.cssText = `
      position: absolute;
      bottom: 20px;
      right: 20px;
      padding: 10px 20px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      z-index: 1;
    `;
    continueButton.onclick = () => {
      document.body.removeChild(canvasContainer);
      showForm(annotationCanvas.toDataURL());
    };
    canvasContainer.appendChild(continueButton);
  }

  async captureScreenshot() {
    const canvas = await html2canvas(document.body);
    return canvas.toDataURL('image/png');
  }

  showModal() {
    document.querySelector('.buggy-modal').style.display = 'flex';
  }

  hideModal() {
    document.querySelector('.buggy-modal').style.display = 'none';
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const data = {
      title: form.querySelector('#buggy-title').value,
      description: form.querySelector('#buggy-description').value,
      category: form.querySelector('#buggy-category').value,
      priority: form.querySelector('#buggy-priority').value,
      steps: form.querySelector('#buggy-steps').value,
      screenshot: document.getElementById('buggy-canvas').toDataURL('image/png'),
      url: window.location.href,
      browser: navigator.userAgent
    };

    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });

      if (response.ok) {
        this.showSuccess();
        this.hideModal();
      } else {
        this.showError();
      }
    } catch (error) {
      this.showError();
    }
  }

  showSuccess() {
    // Show success message
    const message = document.createElement('div');
    message.className = 'buggy-message buggy-success';
    message.textContent = 'Bug report submitted successfully!';
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 3000);
  }

  showError() {
    // Show error message
    const message = document.createElement('div');
    message.className = 'buggy-message buggy-error';
    message.textContent = 'Failed to submit bug report. Please try again.';
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 3000);
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .buggy-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #000000;
        color: white;
        border: none;
        border-radius: 50px;
        padding: 12px 24px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
        z-index: 9999;
      }

      .buggy-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0,0,0,0.15);
      }

      .buggy-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        justify-content: center;
        align-items: center;
        z-index: 10000;
      }

      .buggy-modal-content {
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 800px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      }

      .buggy-modal-header {
        padding: 24px;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .buggy-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #333;
        transition: color 0.3s ease;
      }

      .buggy-close:hover {
        color: #000;
      }

      .buggy-modal-body {
        padding: 24px;
      }

      .buggy-screenshot-container {
        margin-bottom: 24px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        overflow: hidden;
        background: #f8f8f8;
      }

      #buggy-canvas {
        width: 100%;
        height: auto;
        display: block;
      }

      .buggy-annotation-tools {
        padding: 12px;
        background: #f8f8f8;
        display: flex;
        gap: 12px;
        border-top: 1px solid #e0e0e0;
      }

      .buggy-tool {
        padding: 8px 16px;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        background: white;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.3s ease;
      }

      .buggy-tool:hover {
        background: #f0f0f0;
      }

      .buggy-tool.active {
        background: #000;
        color: white;
        border-color: #000;
      }

      .buggy-form-group {
        margin-bottom: 24px;
      }

      .buggy-form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #333;
      }

      .buggy-form-group input,
      .buggy-form-group textarea,
      .buggy-form-group select {
        width: 100%;
        padding: 12px;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        font-size: 14px;
        transition: all 0.3s ease;
      }

      .buggy-form-group input:focus,
      .buggy-form-group textarea:focus,
      .buggy-form-group select:focus {
        outline: none;
        border-color: #000;
        box-shadow: 0 0 0 2px rgba(0,0,0,0.1);
      }

      .buggy-submit {
        width: 100%;
        padding: 14px;
        background: #000;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .buggy-submit:hover {
        background: #333;
      }

      .buggy-message {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 16px 32px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 10001;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }

      .buggy-success {
        background: #000;
      }

      .buggy-error {
        background: #333;
      }

      .buggy-canvas-container {
        background: rgba(0,0,0,0.9);
      }

      .buggy-tool-button {
        background: white;
        border: 1px solid #e0e0e0;
        color: #333;
      }

      .buggy-tool-button:hover {
        background: #f0f0f0;
      }

      .buggy-color-button {
        border: 2px solid transparent;
      }

      .buggy-color-button:hover {
        border-color: #000;
      }
    `;
    document.head.appendChild(style);
  }
}

// Export for use in projects
window.Buggy = Buggy; 