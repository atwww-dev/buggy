export class AnnotationTool {
  constructor() {
    this.currentTool = 'pen';
    this.currentColor = '#ff0000';
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;
  }

  async show(screenshot) {
    return new Promise((resolve, reject) => {
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
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        this.initializeDrawing(canvas, container, resolve);
      };
      img.onerror = () => reject(new Error('Failed to load screenshot'));
      img.src = screenshot;
    });
  }

  initializeDrawing(canvas, container, resolve) {
    const ctx = canvas.getContext('2d');

    // Tool selection
    container.querySelectorAll('.buggy-tool').forEach(tool => {
      tool.addEventListener('click', (e) => {
        container.querySelectorAll('.buggy-tool').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.currentTool = e.target.dataset.tool;
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

    const draw = (e) => {
      if (!this.isDrawing) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
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
          this.drawArrow(ctx, this.lastX, this.lastY, x, y);
          break;
        case 'rectangle':
          this.drawRectangle(ctx, this.lastX, this.lastY, x, y);
          break;
      }

      [this.lastX, this.lastY] = [x, y];
    };

    canvas.addEventListener('mousedown', (e) => {
      this.isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      [this.lastX, this.lastY] = [e.clientX - rect.left, e.clientY - rect.top];

      if (this.currentTool === 'text') {
        const text = prompt('Enter text:');
        if (text) {
          ctx.fillStyle = this.currentColor;
          ctx.font = '16px Arial';
          ctx.fillText(text, this.lastX, this.lastY);
        }
        this.isDrawing = false;
      }
    });

    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', () => this.isDrawing = false);
    canvas.addEventListener('mouseout', () => this.isDrawing = false);

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
      resolve(annotatedImage);
    });
  }

  drawArrow(ctx, fromX, fromY, toX, toY) {
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

  drawRectangle(ctx, startX, startY, endX, endY) {
    ctx.strokeRect(
      Math.min(startX, endX),
      Math.min(startY, endY),
      Math.abs(endX - startX),
      Math.abs(endY - startY)
    );
  }
} 