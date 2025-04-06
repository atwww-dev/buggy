export class AnnotationTool {
  constructor() {
    this.currentTool = 'pen';
    this.currentColor = '#000000'; // Default to black
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;
    this.scale = 1; // For zoom
    this.offsetX = 0; // For panning
    this.offsetY = 0; // For panning
    this.isDragging = false; // For panning
    this.dragStart = { x: 0, y: 0 }; // For panning
  }

  async show(screenshot) {
    return new Promise((resolve, reject) => {
      // Skip info screen and directly show the annotation tool
      this.showAnnotationTool(screenshot, resolve, reject);
    });
  }

  showAnnotationTool(screenshot, resolve, reject) {
    const container = document.createElement('div');
    container.className = 'buggy-annotation-container';
    container.innerHTML = `
      <div class="buggy-annotation-modal">
        <div class="buggy-toolbar">
          <div class="buggy-tools">
            <button class="buggy-tool active" data-tool="pen" title="Pen Tool">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
              </svg>
            </button>
            <button class="buggy-tool" data-tool="arrow" title="Arrow Tool">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
            <button class="buggy-tool" data-tool="rectangle" title="Rectangle Tool">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              </svg>
            </button>
            <button class="buggy-tool" data-tool="text" title="Text Tool">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 9V5H7v4"></path>
                <path d="M12 12v8"></path>
                <path d="M7 9h10"></path>
              </svg>
            </button>
          </div>
          <div class="buggy-colors">
            <button class="buggy-color active" data-color="#000000" style="background: #000000;"></button>
            <button class="buggy-color" data-color="#ff0000" style="background: #ff0000;"></button>
            <button class="buggy-color" data-color="#0000ff" style="background: #0000ff;"></button>
          </div>
          <div class="buggy-actions">
            <button class="buggy-clear">Clear</button>
            <button class="buggy-done">Continue</button>
          </div>
        </div>
        <div class="buggy-canvas-wrapper">
          <canvas id="buggy-canvas"></canvas>
        </div>
        <div class="buggy-text-modal" style="display: none;">
          <div class="buggy-text-modal-content">
            <h3>Add Text</h3>
            <textarea id="buggy-text-input" placeholder="Enter text..."></textarea>
            <div class="buggy-text-modal-actions">
              <button class="buggy-text-cancel">Cancel</button>
              <button class="buggy-text-add">Add Text</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    const canvas = container.querySelector('#buggy-canvas');
    const ctx = canvas.getContext('2d');
    const textModal = container.querySelector('.buggy-text-modal');
    const textInput = container.querySelector('#buggy-text-input');

    // Load and draw the screenshot
    const img = new Image();
    img.onload = () => {
      // Set canvas size based on the screenshot while maintaining its aspect ratio
      // and ensuring it fits within the visible area
      const maxWidth = Math.min(window.innerWidth * 0.85, img.width);
      const maxHeight = Math.min(window.innerHeight * 0.75, img.height);
      
      const aspectRatio = img.width / img.height;
      
      let canvasWidth, canvasHeight;
      
      if (img.width > maxWidth) {
        canvasWidth = maxWidth;
        canvasHeight = maxWidth / aspectRatio;
      } else if (img.height > maxHeight) {
        canvasHeight = maxHeight;
        canvasWidth = maxHeight * aspectRatio;
      } else {
        canvasWidth = img.width;
        canvasHeight = img.height;
      }
      
      // Round dimensions to avoid blurry canvas
      canvas.width = Math.round(canvasWidth);
      canvas.height = Math.round(canvasHeight);
      
      // Initial render
      this.render(ctx, img);
      this.initializeDrawing(canvas, container, img, resolve);
    };
    img.onerror = () => reject(new Error('Failed to load screenshot'));
    img.src = screenshot;
  }

  render(ctx, img) {
    const canvas = ctx.canvas;
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the image, sized to fit the canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }

  initializeDrawing(canvas, container, img, resolve) {
    const ctx = canvas.getContext('2d');
    const textModal = container.querySelector('.buggy-text-modal');
    const textInput = container.querySelector('#buggy-text-input');
    const textAddBtn = container.querySelector('.buggy-text-add');
    const textCancelBtn = container.querySelector('.buggy-text-cancel');
    let textX = 0;
    let textY = 0;

    // Tool selection
    container.querySelectorAll('.buggy-tool').forEach(tool => {
      tool.addEventListener('click', (e) => {
        container.querySelectorAll('.buggy-tool').forEach(t => t.classList.remove('active'));
        e.target.closest('.buggy-tool').classList.add('active');
        this.currentTool = e.target.closest('.buggy-tool').dataset.tool;
      });
    });

    // Color selection
    container.querySelectorAll('.buggy-color').forEach(color => {
      color.addEventListener('click', (e) => {
        container.querySelectorAll('.buggy-color').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        this.currentColor = e.target.dataset.color;
      });
    });

    // Text modal
    textAddBtn.addEventListener('click', () => {
      const text = textInput.value.trim();
      if (text) {
        ctx.fillStyle = this.currentColor;
        ctx.font = '16px Arial';
        ctx.fillText(text, textX, textY);
      }
      textModal.style.display = 'none';
      textInput.value = '';
    });

    textCancelBtn.addEventListener('click', () => {
      textModal.style.display = 'none';
      textInput.value = '';
    });
    
    const getCanvasCoordinates = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const draw = (e) => {
      if (!this.isDrawing) return;
      
      const { x, y } = getCanvasCoordinates(e);
      
      ctx.strokeStyle = this.currentColor;
      ctx.fillStyle = this.currentColor;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      switch (this.currentTool) {
        case 'pen':
          ctx.beginPath();
          ctx.moveTo(this.lastX, this.lastY);
          ctx.lineTo(x, y);
          ctx.stroke();
          break;
        case 'arrow':
          // Clear the canvas and redraw the image
          this.render(ctx, img);
          this.drawArrow(ctx, this.lastX, this.lastY, x, y);
          break;
        case 'rectangle':
          // Clear the canvas and redraw the image
          this.render(ctx, img);
          this.drawRectangle(ctx, this.lastX, this.lastY, x, y);
          break;
      }

      [this.lastX, this.lastY] = [x, y];
    };

    canvas.addEventListener('mousedown', (e) => {
      // Only handle left mouse button
      if (e.button !== 0) return;
      
      this.isDrawing = true;
      const { x, y } = getCanvasCoordinates(e);
      [this.lastX, this.lastY] = [x, y];

      if (this.currentTool === 'text') {
        this.isDrawing = false;
        textX = x;
        textY = y;
        textModal.style.display = 'flex';
        textInput.focus();
      }
    });

    canvas.addEventListener('mousemove', draw);
    
    canvas.addEventListener('mouseup', () => {
      if (this.isDrawing) {
        this.isDrawing = false;
        // Save the image state after drawing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(canvas, 0, 0);
        img.src = tempCanvas.toDataURL();
      }
    });
    
    canvas.addEventListener('mouseout', () => {
      this.isDrawing = false;
    });

    // Clear button
    container.querySelector('.buggy-clear').addEventListener('click', () => {
      // Reset to original image
      this.render(ctx, img);
    });

    // Done button
    container.querySelector('.buggy-done').addEventListener('click', () => {
      const annotatedImage = canvas.toDataURL('image/png');
      document.body.removeChild(container);
      resolve(annotatedImage);
    });
  }

  drawArrow(ctx, fromX, fromY, toX, toY) {
    const headLength = 10;
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

  drawRectangle(ctx, startX, startY, endX, endY) {
    ctx.strokeRect(
      Math.min(startX, endX),
      Math.min(startY, endY),
      Math.abs(endX - startX),
      Math.abs(endY - startY)
    );
  }
} 