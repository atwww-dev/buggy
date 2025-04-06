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
    button.onclick = () => this.startBugReport();
    document.body.appendChild(button);
  }

  async startBugReport() {
    try {
      // First capture the screenshot
      const screenshot = await this.captureScreenshot();
      // Then show the annotation interface
      this.showAnnotationInterface(screenshot);
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      this.showError('Failed to capture screenshot. Please try again.');
    }
  }

  async captureScreenshot() {
    try {
      const canvas = await html2canvas(document.body, {
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Screenshot capture error:', error);
      throw error;
    }
  }

  showAnnotationInterface(screenshot) {
    const container = document.createElement('div');
    container.className = 'buggy-annotation-container';
    container.innerHTML = `
      <div class="buggy-toolbar">
        <div class="buggy-tools">
          <button class="buggy-tool active" data-tool="pen">✏️ Draw</button>
          <button class="buggy-tool" data-tool="arrow">➡️ Arrow</button>
          <button class="buggy-tool" data-tool="rectangle">⬜ Rectangle</button>
          <button class="buggy-tool" data-tool="text">T Text</button>
        </div>
        <div class="buggy-colors">
          <button class="buggy-color active" data-color="#ff0000" style="background: #ff0000;"></button>
          <button class="buggy-color" data-color="#00ff00" style="background: #00ff00;"></button>
          <button class="buggy-color" data-color="#0000ff" style="background: #0000ff;"></button>
          <button class="buggy-color" data-color="#ffff00" style="background: #ffff00;"></button>
        </div>
        <div class="buggy-actions">
          <button class="buggy-clear">Clear</button>
          <button class="buggy-done">Done</button>
        </div>
      </div>
      <div class="buggy-canvas-wrapper">
        <canvas id="buggy-canvas"></canvas>
      </div>
    `;

    document.body.appendChild(container);

    const canvas = container.querySelector('#buggy-canvas');
    const ctx = canvas.getContext('2d');
    
    // Load and draw the screenshot
    const img = new Image();
    img.onload = () => {
      // Set canvas size to match the screenshot
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the screenshot
      ctx.drawImage(img, 0, 0);
      
      // Initialize drawing functionality
      this.initializeDrawing(canvas, container);
    };
    img.src = screenshot;

    // Add styles specific to annotation interface
    const style = document.createElement('style');
    style.textContent = `
      .buggy-annotation-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 999999;
        display: flex;
        flex-direction: column;
      }
      .buggy-toolbar {
        background: white;
        padding: 10px;
        display: flex;
        gap: 20px;
        align-items: center;
      }
      .buggy-tools, .buggy-colors, .buggy-actions {
        display: flex;
        gap: 10px;
      }
      .buggy-tool, .buggy-color {
        padding: 8px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        background: #f0f0f0;
      }
      .buggy-tool.active {
        background: #ddd;
      }
      .buggy-color {
        width: 30px;
        height: 30px;
        border: 2px solid transparent;
      }
      .buggy-color.active {
        border-color: #000;
      }
      .buggy-canvas-wrapper {
        flex: 1;
        overflow: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      #buggy-canvas {
        background: white;
        max-width: 100%;
        max-height: 100%;
        cursor: crosshair;
      }
    `;
    document.head.appendChild(style);
  }

  initializeDrawing(canvas, container) {
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let currentTool = 'pen';
    let currentColor = '#ff0000';

    // Tool selection
    container.querySelectorAll('.buggy-tool').forEach(tool => {
      tool.addEventListener('click', (e) => {
        container.querySelectorAll('.buggy-tool').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        currentTool = e.target.dataset.tool;
      });
    });

    // Color selection
    container.querySelectorAll('.buggy-color').forEach(color => {
      color.addEventListener('click', (e) => {
        container.querySelectorAll('.buggy-color').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        currentColor = e.target.dataset.color;
      });
    });

    // Drawing functions
    function draw(e) {
      if (!isDrawing) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      switch (currentTool) {
        case 'pen':
          ctx.beginPath();
          ctx.moveTo(lastX, lastY);
          ctx.lineTo(x, y);
          ctx.stroke();
          break;
        case 'arrow':
          // Clear the previous frame
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          ctx.putImageData(imageData, 0, 0);
          drawArrow(lastX, lastY, x, y);
          break;
        case 'rectangle':
          // Clear the previous frame
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          ctx.putImageData(imgData, 0, 0);
          drawRectangle(lastX, lastY, x, y);
          break;
      }

      [lastX, lastY] = [x, y];
    }

    function drawArrow(fromX, fromY, toX, toY) {
      const headLength = 15;
      const angle = Math.atan2(toY - fromY, toX - fromX);

      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(
        toX - headLength * Math.cos(angle - Math.PI / 6),
        toY - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        toX - headLength * Math.cos(angle + Math.PI / 6),
        toY - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    }

    function drawRectangle(startX, startY, endX, endY) {
      ctx.strokeRect(
        Math.min(startX, endX),
        Math.min(startY, endY),
        Math.abs(endX - startX),
        Math.abs(endY - startY)
      );
    }

    // Event listeners
    canvas.addEventListener('mousedown', (e) => {
      isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      [lastX, lastY] = [e.clientX - rect.left, e.clientY - rect.top];

      if (currentTool === 'text') {
        const text = prompt('Enter text:');
        if (text) {
          ctx.fillStyle = currentColor;
          ctx.font = '16px Arial';
          ctx.fillText(text, lastX, lastY);
        }
        isDrawing = false;
      }
    });

    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mouseout', () => isDrawing = false);

    // Clear button
    container.querySelector('.buggy-clear').addEventListener('click', () => {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = canvas.toDataURL();
    });

    // Done button
    container.querySelector('.buggy-done').addEventListener('click', () => {
      const annotatedImage = canvas.toDataURL('image/png');
      document.body.removeChild(container);
      this.showModal(annotatedImage);
    });
  }

  showModal(screenshot) {
    const modal = document.createElement('div');
    modal.className = 'buggy-modal';
    modal.innerHTML = `
      <div class="buggy-modal-content">
        <div class="buggy-modal-header">
          <h2>Report a Bug</h2>
          <button class="buggy-close">&times;</button>
        </div>
        <div class="buggy-modal-body">
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
            <div class="buggy-screenshot">
              <img src="${screenshot}" alt="Screenshot" style="max-width: 100%; margin-top: 10px;">
            </div>
            <button type="submit" class="buggy-submit">Submit Report</button>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Add event listeners
    modal.querySelector('.buggy-close').onclick = () => {
      document.body.removeChild(modal);
    };
    modal.querySelector('#buggy-form').onsubmit = (e) => this.handleSubmit(e, screenshot);
  }

  async handleSubmit(e, screenshot) {
    e.preventDefault();
    
    const form = e.target;
    const data = {
      title: form.querySelector('#buggy-title').value,
      description: form.querySelector('#buggy-description').value,
      category: form.querySelector('#buggy-category').value,
      priority: form.querySelector('#buggy-priority').value,
      steps: form.querySelector('#buggy-steps').value,
      screenshot: screenshot,
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
        document.body.removeChild(document.querySelector('.buggy-modal'));
      } else {
        this.showError();
      }
    } catch (error) {
      console.error('Error submitting bug report:', error);
      this.showError();
    }
  }

  showSuccess() {
    const message = document.createElement('div');
    message.className = 'buggy-message buggy-success';
    message.textContent = 'Bug report submitted successfully!';
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 3000);
  }

  showError(text = 'Failed to submit bug report. Please try again.') {
    const message = document.createElement('div');
    message.className = 'buggy-message buggy-error';
    message.textContent = text;
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 3000);
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .buggy-button {
        position: fixed;
        ${this.config.buttonPosition === 'bottom-right' ? 'bottom: 20px; right: 20px;' : ''}
        ${this.config.buttonPosition === 'bottom-left' ? 'bottom: 20px; left: 20px;' : ''}
        ${this.config.buttonPosition === 'top-right' ? 'top: 20px; right: 20px;' : ''}
        ${this.config.buttonPosition === 'top-left' ? 'top: 20px; left: 20px;' : ''}
        padding: 10px 20px;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 999998;
        font-family: system-ui, -apple-system, sans-serif;
      }
      .buggy-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
      }
      .buggy-modal-content {
        background: white;
        padding: 20px;
        border-radius: 8px;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
      }
      .buggy-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      .buggy-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
      }
      .buggy-form-group {
        margin-bottom: 15px;
      }
      .buggy-form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
      }
      .buggy-form-group input,
      .buggy-form-group textarea,
      .buggy-form-group select {
        width: 100%;
        padding: 8px;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
      }
      .buggy-form-group textarea {
        min-height: 100px;
        resize: vertical;
      }
      .buggy-submit {
        background: #000000;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        width: 100%;
      }
      .buggy-message {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 20px;
        border-radius: 4px;
        color: white;
        z-index: 1000000;
      }
      .buggy-message.buggy-success {
        background: #10b981;
      }
      .buggy-message.buggy-error {
        background: #ef4444;
      }
    `;
    document.head.appendChild(style);
  }
}

// Export for use in projects
window.Buggy = Buggy; 