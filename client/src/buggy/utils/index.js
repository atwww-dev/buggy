export async function captureScreenshot() {
  try {
    // Always use the getDisplayMedia API as it doesn't have issues with color formats
    // and captures exactly what is visible on screen
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        preferCurrentTab: true,
        video: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      });
      
      // User might cancel after stream is created but before allowing capture
      if (!stream || stream.getVideoTracks().length === 0) {
        throw new Error('Screen capture cancelled or no video tracks available');
      }
      
      const track = stream.getVideoTracks()[0];
      
      // Create a message to guide the user
      showMessage('Captured current view. Processing...', 'info');
      
      // Small delay to allow the message to be seen
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const imageCapture = new ImageCapture(track);
      const bitmap = await imageCapture.grabFrame();
      
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);
      
      // Stop tracks
      track.stop();
      stream.getTracks().forEach(track => track.stop());
      
      return canvas.toDataURL('image/png');
    } catch (err) {
      console.error('Error with getDisplayMedia:', err);
      
      // Check if this was a user cancellation
      if (err.name === 'NotAllowedError' || 
          err.name === 'AbortError' || 
          err.message.includes('cancel') || 
          err.message.includes('denied')) {
        showMessage('Screenshot cancelled. Bug report aborted.', 'info');
        // Signal that the process was cancelled by user choice
        throw new Error('SCREENSHOT_CANCELLED');
      }
      
      // If getDisplayMedia fails for other reasons, fall back to a simple notification
      showMessage('Unable to capture screenshot. Please describe the issue instead.', 'error');
      
      // Return a blank canvas as a fallback
      const canvas = document.createElement('canvas');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext('2d');
      
      // Fill with light gray
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add message
      ctx.fillStyle = '#333';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Screenshot capture unavailable', canvas.width / 2, canvas.height / 2);
      
      return canvas.toDataURL('image/png');
    }
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

export function showMessage(message, type = 'info') {
  // Remove any existing messages
  const existingMessages = document.querySelectorAll('.buggy-message');
  existingMessages.forEach(msg => {
    document.body.removeChild(msg);
  });

  const container = document.createElement('div');
  container.className = 'buggy-message';
  container.textContent = message;

  document.body.appendChild(container);

  setTimeout(() => {
    container.style.animation = 'buggy-slide-out 0.3s ease forwards';
    setTimeout(() => {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }, 300);
  }, 3000);
} 