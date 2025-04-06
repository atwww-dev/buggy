// Import the Buggy class from the core module
import { Buggy } from './core/Buggy';

// Export for ES modules
export default Buggy;
export { Buggy };

// Expose to global scope when loaded as script
if (typeof window !== 'undefined') {
  window.Buggy = Buggy;
} 