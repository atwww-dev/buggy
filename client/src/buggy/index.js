import { Buggy } from './core/Buggy';

// Universal Module Definition (UMD) pattern to support various environments
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module
    define(['exports'], factory);
  } else if (typeof exports === 'object' && typeof module !== 'undefined') {
    // CommonJS/Node
    factory(exports);
  } else {
    // Browser globals
    factory(root);
  }
}(typeof self !== 'undefined' ? self : this, function (exports) {
  // Export the Buggy class
  exports.Buggy = Buggy;
}));

// Also export as ES module
export default Buggy;

// Example usage:
/*
// ES module import
import Buggy from './buggy';

// OR global variable when loaded via <script> tag
// const Buggy = window.Buggy;

const bugReporter = new Buggy({
  apiUrl: '/api/feedback',  // Your API endpoint for bug reports
  buttonText: 'Report Bug',  // Custom button text
  buttonPosition: {  // Custom button position
    bottom: '20px',
    right: '20px'
  }
});

bugReporter.initialize();
*/ 