export async function captureScreenshot() {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ preferCurrentTab: true });
    const track = stream.getVideoTracks()[0];
    
    const imageCapture = new ImageCapture(track);
    const bitmap = await imageCapture.grabFrame();
    
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
    
    track.stop();
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    throw error;
  }
}

export function addStyles() {
  const styleId = 'buggy-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .buggy-button {
      position: fixed;
      z-index: 10000;
      padding: 8px 16px;
      border-radius: 4px;
      background: #ff4444;
      color: white;
      border: none;
      cursor: pointer;
      font-family: sans-serif;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
    }
    .buggy-button:hover {
      background: #ff6666;
      transform: translateY(-1px);
      box-shadow: 0 3px 6px rgba(0,0,0,0.2);
    }

    .buggy-annotation-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      z-index: 10001;
      display: flex;
      flex-direction: column;
      padding: 20px;
    }

    .buggy-toolbar {
      background: white;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 10px;
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .buggy-tools, .buggy-colors, .buggy-actions {
      display: flex;
      gap: 5px;
    }

    .buggy-tool, .buggy-color {
      padding: 5px 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      background: white;
    }

    .buggy-tool.active, .buggy-color.active {
      background: #e0e0e0;
    }

    .buggy-color {
      width: 24px;
      height: 24px;
      padding: 0;
      border: 2px solid #fff;
      box-shadow: 0 0 0 1px #ddd;
    }

    .buggy-canvas-wrapper {
      flex: 1;
      overflow: auto;
      background: #f0f0f0;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .buggy-form-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .buggy-form-modal {
      background: white;
      padding: 20px;
      border-radius: 8px;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .buggy-form {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .buggy-form-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .buggy-form-group label {
      font-weight: bold;
      color: #333;
    }

    .buggy-form-group input,
    .buggy-form-group textarea,
    .buggy-form-group select {
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .buggy-form-group textarea {
      min-height: 100px;
      resize: vertical;
    }

    .buggy-form-preview {
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      margin-top: 10px;
    }

    .buggy-form-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 20px;
    }

    .buggy-submit, .buggy-cancel {
      padding: 8px 16px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-size: 14px;
    }

    .buggy-submit {
      background: #4CAF50;
      color: white;
    }

    .buggy-cancel {
      background: #f44336;
      color: white;
    }
  `;

  document.head.appendChild(style);
}

export function showMessage(message, type = 'info') {
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 10px 20px;
    border-radius: 4px;
    color: white;
    font-family: sans-serif;
    z-index: 10002;
    animation: slideIn 0.3s ease;
  `;

  container.style.background = type === 'error' ? '#f44336' : '#4CAF50';
  container.textContent = message;

  document.body.appendChild(container);

  setTimeout(() => {
    container.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => document.body.removeChild(container), 300);
  }, 3000);

  const styleId = 'buggy-message-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
} 