import { AnnotationTool } from '../components/AnnotationTool';
import { BugReportForm } from '../components/BugReportForm';
import { captureScreenshot, addStyles, showMessage } from '../utils';

export class Buggy {
  constructor(config = {}) {
    this.apiUrl = config.apiUrl || '/api/bugs';
    this.buttonText = config.buttonText || 'Report Bug';
    this.buttonPosition = config.buttonPosition || { bottom: '20px', right: '20px' };
    
    this.annotationTool = new AnnotationTool();
    this.bugReportForm = new BugReportForm(this.apiUrl);
  }

  initialize() {
    addStyles();
    this.createButton();
  }

  createButton() {
    const button = document.createElement('button');
    button.className = 'buggy-button';
    button.textContent = this.buttonText;
    
    Object.assign(button.style, this.buttonPosition);
    
    button.addEventListener('click', () => this.startBugReport());
    
    document.body.appendChild(button);
  }

  async startBugReport() {
    try {
      // Step 1: Capture screenshot
      const screenshot = await captureScreenshot();
      showMessage('Screenshot captured successfully');

      // Step 2: Show annotation tool
      const annotatedScreenshot = await this.annotationTool.show(screenshot);
      showMessage('Annotations saved');

      // Step 3: Show bug report form
      const result = await this.bugReportForm.show(annotatedScreenshot);
      showMessage('Bug report submitted successfully');

      return result;
    } catch (error) {
      if (error.message === 'Bug report cancelled') {
        showMessage('Bug report cancelled', 'info');
      } else {
        console.error('Error in bug reporting flow:', error);
        showMessage('Failed to complete bug report', 'error');
      }
      throw error;
    }
  }
} 