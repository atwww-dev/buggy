export class BugReportForm {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
  }

  show(screenshot) {
    return new Promise((resolve, reject) => {
      const container = document.createElement('div');
      container.className = 'buggy-form-container';
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

      const form = container.querySelector('.buggy-form');
      const cancelButton = container.querySelector('.buggy-cancel');

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
          // Show a loading indicator or disable the submit button
          const submitButton = form.querySelector('.buggy-submit');
          const originalButtonText = submitButton.textContent;
          submitButton.disabled = true;
          submitButton.textContent = 'Submitting...';
          
          const formData = new FormData(form);
          
          // Prepare the screenshot data
          let processedScreenshot = screenshot;
          
          // Convert screenshot to proper format if needed
          if (screenshot) {
            // If it's already a data URL, we need to strip the prefix to get just the base64 data
            if (screenshot.startsWith('data:image/')) {
              // Keep the screenshot as is - the server will extract the data properly
            } else {
              // Ensure it has the proper data URL prefix
              processedScreenshot = `data:image/png;base64,${screenshot}`;
            }
          }
          
          // Create the data object with all form fields
          const data = {
            title: formData.get('title'),
            description: formData.get('description'),
            category: formData.get('category'),
            priority: formData.get('priority'),
            steps: formData.get('steps'),
            screenshot: processedScreenshot,
            url: window.location.href,
            browser: this.getBrowserInfo()
          };
          
          // Make the API request
          const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
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
          console.error('Error submitting bug report:', error);
          
          // Show error message to user
          const errorMessage = document.createElement('div');
          errorMessage.className = 'buggy-form-error';
          errorMessage.textContent = error.message || 'Failed to submit bug report. Please try again.';
          
          // Insert at the top of the form
          form.insertBefore(errorMessage, form.firstChild);
          
          // Re-enable the submit button
          const submitButton = form.querySelector('.buggy-submit');
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Try Again';
          }
          
          reject(error);
        }
      });

      cancelButton.addEventListener('click', () => {
        document.body.removeChild(container);
        reject(new Error('Bug report cancelled'));
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
} 