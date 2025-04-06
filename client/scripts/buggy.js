/**
 * Buggy - Bug Reporting Tool v1.0.0
 * https://github.com/yourusername/buggy
 * Licensed under MIT
 */
var BuggyExports = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/buggy/index.js
  var index_exports = {};
  __export(index_exports, {
    Buggy: () => Buggy,
    default: () => index_default
  });

  // src/buggy/components/AnnotationTool.js
  var AnnotationTool = class {
    constructor() {
      this.currentTool = "pen";
      this.currentColor = "#000000";
      this.isDrawing = false;
      this.lastX = 0;
      this.lastY = 0;
      this.scale = 1;
      this.offsetX = 0;
      this.offsetY = 0;
      this.isDragging = false;
      this.dragStart = { x: 0, y: 0 };
    }
    async show(screenshot) {
      return new Promise((resolve, reject) => {
        this.showAnnotationTool(screenshot, resolve, reject);
      });
    }
    showAnnotationTool(screenshot, resolve, reject) {
      const container = document.createElement("div");
      container.className = "buggy-annotation-container";
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
      const canvas = container.querySelector("#buggy-canvas");
      const ctx = canvas.getContext("2d");
      const textModal = container.querySelector(".buggy-text-modal");
      const textInput = container.querySelector("#buggy-text-input");
      const img = new Image();
      img.onload = () => {
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
        canvas.width = Math.round(canvasWidth);
        canvas.height = Math.round(canvasHeight);
        this.render(ctx, img);
        this.initializeDrawing(canvas, container, img, resolve);
      };
      img.onerror = () => reject(new Error("Failed to load screenshot"));
      img.src = screenshot;
    }
    render(ctx, img) {
      const canvas = ctx.canvas;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
    initializeDrawing(canvas, container, img, resolve) {
      const ctx = canvas.getContext("2d");
      const textModal = container.querySelector(".buggy-text-modal");
      const textInput = container.querySelector("#buggy-text-input");
      const textAddBtn = container.querySelector(".buggy-text-add");
      const textCancelBtn = container.querySelector(".buggy-text-cancel");
      let textX = 0;
      let textY = 0;
      container.querySelectorAll(".buggy-tool").forEach((tool) => {
        tool.addEventListener("click", (e) => {
          container.querySelectorAll(".buggy-tool").forEach((t) => t.classList.remove("active"));
          e.target.closest(".buggy-tool").classList.add("active");
          this.currentTool = e.target.closest(".buggy-tool").dataset.tool;
        });
      });
      container.querySelectorAll(".buggy-color").forEach((color) => {
        color.addEventListener("click", (e) => {
          container.querySelectorAll(".buggy-color").forEach((c) => c.classList.remove("active"));
          e.target.classList.add("active");
          this.currentColor = e.target.dataset.color;
        });
      });
      textAddBtn.addEventListener("click", () => {
        const text = textInput.value.trim();
        if (text) {
          ctx.fillStyle = this.currentColor;
          ctx.font = "16px Arial";
          ctx.fillText(text, textX, textY);
        }
        textModal.style.display = "none";
        textInput.value = "";
      });
      textCancelBtn.addEventListener("click", () => {
        textModal.style.display = "none";
        textInput.value = "";
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
        ctx.lineCap = "round";
        switch (this.currentTool) {
          case "pen":
            ctx.beginPath();
            ctx.moveTo(this.lastX, this.lastY);
            ctx.lineTo(x, y);
            ctx.stroke();
            break;
          case "arrow":
            this.render(ctx, img);
            this.drawArrow(ctx, this.lastX, this.lastY, x, y);
            break;
          case "rectangle":
            this.render(ctx, img);
            this.drawRectangle(ctx, this.lastX, this.lastY, x, y);
            break;
        }
        [this.lastX, this.lastY] = [x, y];
      };
      canvas.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        this.isDrawing = true;
        const { x, y } = getCanvasCoordinates(e);
        [this.lastX, this.lastY] = [x, y];
        if (this.currentTool === "text") {
          this.isDrawing = false;
          textX = x;
          textY = y;
          textModal.style.display = "flex";
          textInput.focus();
        }
      });
      canvas.addEventListener("mousemove", draw);
      canvas.addEventListener("mouseup", () => {
        if (this.isDrawing) {
          this.isDrawing = false;
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          const tempCtx = tempCanvas.getContext("2d");
          tempCtx.drawImage(canvas, 0, 0);
          img.src = tempCanvas.toDataURL();
        }
      });
      canvas.addEventListener("mouseout", () => {
        this.isDrawing = false;
      });
      container.querySelector(".buggy-clear").addEventListener("click", () => {
        this.render(ctx, img);
      });
      container.querySelector(".buggy-done").addEventListener("click", () => {
        const annotatedImage = canvas.toDataURL("image/png");
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
  };

  // src/buggy/components/BugReportForm.js
  var BugReportForm = class {
    constructor(apiUrl) {
      this.apiUrl = apiUrl;
    }
    show(screenshot) {
      return new Promise((resolve, reject) => {
        const container = document.createElement("div");
        container.className = "buggy-form-container";
        container.innerHTML = `
        <div class="buggy-form-modal">
          <h2>Report a Bug</h2>
          <form class="buggy-form">
            <div class="buggy-form-group">
              <label for="buggy-title">Title</label>
              <input type="text" id="buggy-title" name="title" required placeholder="Brief description of the bug">
            </div>
            <div class="buggy-form-group">
              <label for="buggy-category">Category</label>
              <select id="buggy-category" name="category" required>
                <option value="ui">UI Issue</option>
                <option value="functionality">Functionality</option>
                <option value="performance">Performance</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="buggy-form-group">
              <label for="buggy-priority">Priority</label>
              <select id="buggy-priority" name="priority" required>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div class="buggy-form-group">
              <label for="buggy-description">Description</label>
              <textarea id="buggy-description" name="description" required placeholder="Please describe the issue in detail"></textarea>
            </div>
            <div class="buggy-form-group">
              <label for="buggy-steps">Steps to Reproduce</label>
              <textarea id="buggy-steps" name="steps" required placeholder="1. Go to page&#10;2. Click on...&#10;3. Observe that..."></textarea>
            </div>
            <div class="buggy-form-preview">
              <img src="${screenshot}" alt="Bug Screenshot" style="max-width: 100%; height: auto;">
            </div>
            <div class="buggy-form-actions">
              <button type="button" class="buggy-cancel">Cancel</button>
              <button type="submit" class="buggy-submit">Submit Report</button>
            </div>
          </form>
        </div>
      `;
        document.body.appendChild(container);
        const form = container.querySelector(".buggy-form");
        const cancelButton = container.querySelector(".buggy-cancel");
        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          try {
            const submitButton = form.querySelector(".buggy-submit");
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = "Submitting...";
            const formData = new FormData(form);
            let processedScreenshot = screenshot;
            if (screenshot) {
              if (screenshot.startsWith("data:image/")) {
              } else {
                processedScreenshot = `data:image/png;base64,${screenshot}`;
              }
            }
            const data = {
              title: formData.get("title"),
              description: formData.get("description"),
              category: formData.get("category"),
              priority: formData.get("priority"),
              steps: formData.get("steps"),
              screenshot: processedScreenshot,
              url: window.location.href,
              browser: this.getBrowserInfo()
            };
            const response = await fetch(this.apiUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(data)
            });
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Failed to submit bug report: ${errorText}`);
            }
            const result = await response.json();
            document.body.removeChild(container);
            resolve(result);
          } catch (error) {
            console.error("Error submitting bug report:", error);
            const errorMessage = document.createElement("div");
            errorMessage.className = "buggy-form-error";
            errorMessage.textContent = error.message || "Failed to submit bug report. Please try again.";
            form.insertBefore(errorMessage, form.firstChild);
            const submitButton = form.querySelector(".buggy-submit");
            if (submitButton) {
              submitButton.disabled = false;
              submitButton.textContent = "Try Again";
            }
            reject(error);
          }
        });
        cancelButton.addEventListener("click", () => {
          document.body.removeChild(container);
          reject(new Error("Bug report cancelled"));
        });
      });
    }
    getBrowserInfo() {
      const ua = navigator.userAgent;
      let browserName = "Unknown";
      let browserVersion = "";
      if (ua.includes("Firefox/")) {
        browserName = "Firefox";
        browserVersion = ua.split("Firefox/")[1];
      } else if (ua.includes("Chrome/")) {
        browserName = "Chrome";
        browserVersion = ua.split("Chrome/")[1].split(" ")[0];
      } else if (ua.includes("Safari/") && !ua.includes("Chrome")) {
        browserName = "Safari";
        browserVersion = ua.split("Version/")[1].split(" ")[0];
      } else if (ua.includes("Edge/")) {
        browserName = "Edge";
        browserVersion = ua.split("Edge/")[1];
      }
      return `${browserName} ${browserVersion}`;
    }
  };

  // src/buggy/utils/index.js
  async function captureScreenshot() {
    try {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          preferCurrentTab: true,
          video: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        });
        if (!stream || stream.getVideoTracks().length === 0) {
          throw new Error("Screen capture cancelled or no video tracks available");
        }
        const track = stream.getVideoTracks()[0];
        showMessage("Captured current view. Processing...", "info");
        await new Promise((resolve) => setTimeout(resolve, 500));
        const imageCapture = new ImageCapture(track);
        const bitmap = await imageCapture.grabFrame();
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(bitmap, 0, 0);
        track.stop();
        stream.getTracks().forEach((track2) => track2.stop());
        return canvas.toDataURL("image/png");
      } catch (err) {
        console.error("Error with getDisplayMedia:", err);
        if (err.name === "NotAllowedError" || err.name === "AbortError" || err.message.includes("cancel") || err.message.includes("denied")) {
          showMessage("Screenshot cancelled. Bug report aborted.", "info");
          throw new Error("SCREENSHOT_CANCELLED");
        }
        showMessage("Unable to capture screenshot. Please describe the issue instead.", "error");
        const canvas = document.createElement("canvas");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#f5f5f5";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#333";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Screenshot capture unavailable", canvas.width / 2, canvas.height / 2);
        return canvas.toDataURL("image/png");
      }
    } catch (error) {
      console.error("Error capturing screenshot:", error);
      throw error;
    }
  }
  function addStyles() {
    const styleId = "buggy-styles";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
    .buggy-button {
      position: fixed;
      z-index: 10000;
      bottom: 30px;
      right: 0;
      padding: 8px 14px 8px 16px;
      border-radius: 30px 0 0 30px;
      background: #3a3a3a;
      color: white;
      border: none;
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
      font-size: 13px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .buggy-button::before {
      content: '';
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: #ff5252;
      margin-right: 2px;
    }
    .buggy-button:hover {
      padding-right: 20px;
      background: #444;
      transform: translateX(-5px);
      box-shadow: 2px 2px 10px rgba(0,0,0,0.25);
    }
    
    /* Info screen styles */
    .buggy-info-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.85);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .buggy-info-modal {
      background: white;
      border-radius: 8px;
      padding: 30px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    }
    
    .buggy-info-modal h2 {
      font-size: 24px;
      margin-bottom: 20px;
      color: #000;
    }
    
    .buggy-info-modal p {
      margin-bottom: 16px;
      line-height: 1.5;
      color: #333;
    }
    
    .buggy-info-modal ul {
      margin-bottom: 20px;
      padding-left: 20px;
    }
    
    .buggy-info-modal li {
      margin-bottom: 8px;
      color: #333;
    }
    
    .buggy-info-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
    
    .buggy-info-continue {
      background: #000;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
    }
    
    .buggy-info-continue:hover {
      background: #333;
    }

    /* Annotation tool styles */
    .buggy-annotation-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .buggy-annotation-modal {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      max-width: 90%;
      max-height: 90%;
      width: auto;
      box-shadow: 0 5px 25px rgba(0,0,0,0.25);
    }

    .buggy-toolbar {
      background: #f8f8f8;
      padding: 8px 12px;
      display: flex;
      gap: 10px;
      align-items: center;
      border-bottom: 1px solid #eee;
      flex-wrap: wrap;
    }

    .buggy-tools, .buggy-colors, .buggy-actions {
      display: flex;
      gap: 5px;
      align-items: center;
    }
    
    .buggy-tool {
      width: 32px;
      height: 32px;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      padding: 0;
    }

    .buggy-tool:hover {
      background: #f0f0f0;
    }

    .buggy-tool.active {
      background: #000;
      color: white;
      border-color: #000;
    }

    .buggy-color {
      width: 24px;
      height: 24px;
      padding: 0;
      border: 2px solid #fff;
      box-shadow: 0 0 0 1px #ddd;
      border-radius: 50%;
      cursor: pointer;
      transition: transform 0.2s ease;
    }
    
    .buggy-color.active {
      transform: scale(1.2);
      box-shadow: 0 0 0 2px #000;
    }

    .buggy-canvas-wrapper {
      position: relative;
      padding: 0;
      display: flex;
      justify-content: center;
      overflow: auto;
      background: #e5e5e5;
      max-height: calc(90vh - 60px);
    }

    #buggy-canvas {
      background: white;
      cursor: crosshair;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      display: block;
      max-width: 100%;
      max-height: 100%;
    }
    
    .buggy-actions {
      margin-left: auto;
    }

    .buggy-clear, .buggy-done {
      padding: 6px 12px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s ease;
    }
    
    .buggy-clear {
      background: #f0f0f0;
      border: 1px solid #ddd;
      color: #333;
    }
    
    .buggy-clear:hover {
      background: #e7e7e7;
    }

    .buggy-done {
      background: #000;
      color: white;
    }
    
    .buggy-done:hover {
      background: #333;
    }
    
    /* Text input modal */
    .buggy-text-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10002;
    }
    
    .buggy-text-modal-content {
      background: white;
      padding: 20px;
      border-radius: 8px;
      width: 90%;
      max-width: 350px;
      box-shadow: 0 5px 25px rgba(0,0,0,0.3);
    }
    
    .buggy-text-modal-content h3 {
      margin-top: 0;
      margin-bottom: 15px;
      font-size: 16px;
      color: #000;
    }
    
    #buggy-text-input {
      width: 100%;
      height: 80px;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      resize: vertical;
      font-family: inherit;
      font-size: 14px;
      margin-bottom: 15px;
    }
    
    .buggy-text-modal-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }
    
    .buggy-text-cancel, .buggy-text-add {
      padding: 6px 12px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-size: 13px;
    }
    
    .buggy-text-cancel {
      background: #f0f0f0;
      border: 1px solid #ddd;
      color: #333;
    }
    
    .buggy-text-add {
      background: #000;
      color: white;
    }

    /* Form styles */
    .buggy-form-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .buggy-form-modal {
      background: white;
      padding: 25px;
      border-radius: 8px;
      width: 100%;
      max-width: 550px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 5px 25px rgba(0,0,0,0.25);
    }
    
    .buggy-form-modal h2 {
      margin-top: 0;
      margin-bottom: 20px;
      font-size: 20px;
      color: #000;
    }

    .buggy-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .buggy-form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .buggy-form-group label {
      font-weight: 600;
      color: #333;
      font-size: 13px;
    }

    .buggy-form-group input,
    .buggy-form-group textarea,
    .buggy-form-group select {
      padding: 8px 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      line-height: 1.5;
      transition: border-color 0.2s ease;
    }
    
    .buggy-form-group input:focus,
    .buggy-form-group textarea:focus,
    .buggy-form-group select:focus {
      border-color: #000;
      outline: none;
    }

    .buggy-form-group textarea {
      min-height: 100px;
      resize: vertical;
    }

    .buggy-form-error {
      background-color: #ffebee;
      border: 1px solid #ffcdd2;
      color: #c62828;
      padding: 10px 15px;
      margin-bottom: 15px;
      border-radius: 4px;
      font-size: 14px;
      line-height: 1.5;
    }

    .buggy-form-preview {
      margin-top: 10px;
      border: 1px solid #eee;
      border-radius: 4px;
      padding: 10px;
      background: #f8f8f8;
    }
    
    .buggy-form-preview img {
      display: block;
      max-width: 100%;
      height: auto;
      border-radius: 2px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .buggy-form-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 15px;
    }

    .buggy-submit, .buggy-cancel {
      padding: 8px 16px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s ease;
    }

    .buggy-submit {
      background: #000;
      color: white;
    }
    
    .buggy-submit:hover {
      background: #333;
    }

    .buggy-cancel {
      background: #f0f0f0;
      border: 1px solid #ddd;
      color: #333;
    }
    
    .buggy-cancel:hover {
      background: #e7e7e7;
    }
    
    /* Message notification */
    .buggy-message {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 10px 16px;
      border-radius: 4px;
      background: rgba(0,0,0,0.8);
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      box-shadow: 0 3px 10px rgba(0,0,0,0.2);
      z-index: 10002;
      animation: buggy-slide-in 0.3s ease;
    }
    
    @keyframes buggy-slide-in {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes buggy-slide-out {
      from { transform: translateY(0); opacity: 1; }
      to { transform: translateY(20px); opacity: 0; }
    }
    
    /* Responsive styles */
    @media (max-width: 768px) {
      .buggy-annotation-modal,
      .buggy-form-modal,
      .buggy-text-modal-content {
        width: 95%;
      }
      
      .buggy-toolbar {
        flex-wrap: wrap;
      }
    }
  `;
    document.head.appendChild(style);
  }
  function showMessage(message, type = "info") {
    const existingMessages = document.querySelectorAll(".buggy-message");
    existingMessages.forEach((msg) => {
      document.body.removeChild(msg);
    });
    const container = document.createElement("div");
    container.className = "buggy-message";
    container.textContent = message;
    document.body.appendChild(container);
    setTimeout(() => {
      container.style.animation = "buggy-slide-out 0.3s ease forwards";
      setTimeout(() => {
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
      }, 300);
    }, 3e3);
  }

  // src/buggy/core/Buggy.js
  var Buggy = class {
    constructor(config = {}) {
      this.apiUrl = config.apiUrl || "/api/feedback";
      this.buttonText = config.buttonText || "Report Bug";
      this.buttonPosition = config.buttonPosition || { bottom: "20px", right: "20px" };
      this.annotationTool = new AnnotationTool();
      this.bugReportForm = new BugReportForm(this.apiUrl);
    }
    initialize() {
      addStyles();
      this.createButton();
    }
    createButton() {
      const button = document.createElement("button");
      button.className = "buggy-button";
      button.textContent = this.buttonText;
      Object.assign(button.style, this.buttonPosition);
      button.addEventListener("click", () => this.startBugReport());
      document.body.appendChild(button);
    }
    async startBugReport() {
      try {
        let screenshot;
        try {
          screenshot = await captureScreenshot();
          showMessage("Screenshot captured successfully");
        } catch (error) {
          if (error.message === "SCREENSHOT_CANCELLED") {
            return null;
          }
          throw error;
        }
        const annotatedScreenshot = await this.annotationTool.show(screenshot);
        showMessage("Annotations saved");
        const result = await this.bugReportForm.show(annotatedScreenshot);
        showMessage("Bug report submitted successfully");
        return result;
      } catch (error) {
        if (error.message === "Bug report cancelled") {
          showMessage("Bug report cancelled", "info");
        } else if (error.message === "SCREENSHOT_CANCELLED") {
        } else {
          console.error("Error in bug reporting flow:", error);
          showMessage("Failed to complete bug report", "error");
        }
        throw error;
      }
    }
  };

  // src/buggy/index.js
  var index_default = Buggy;
  if (typeof window !== "undefined") {
    window.Buggy = Buggy;
  }
  return __toCommonJS(index_exports);
})();
window.Buggy = BuggyExports.Buggy;
