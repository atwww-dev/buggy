const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Get package version from package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const version = packageJson.version;

// Output directory
const outputDir = 'scripts';

async function build() {
  try {
    // Build the minified bundle
    const result = await esbuild.build({
      entryPoints: ['src/buggy/index.js'],
      bundle: true,
      minify: true,
      format: 'iife',
      globalName: 'BuggyExports',
      footer: {
        js: 'window.Buggy = BuggyExports.Buggy;'
      },
      outfile: `${outputDir}/buggy.min.js`,
      metafile: true,
      banner: {
        js: `/**
 * Buggy - Bug Reporting Tool v${version}
 * https://github.com/yourusername/buggy
 * Licensed under MIT
 */`
      },
      loader: {
        '.js': 'jsx',
      },
      external: ['html2canvas'],
    });

    // Log the bundle size
    const outputFile = `${outputDir}/buggy.min.js`;
    const stats = fs.statSync(outputFile);
    const fileSizeKB = (stats.size / 1024).toFixed(2);
    console.log(`✅ Bundle created: ${outputFile} (${fileSizeKB} KB)`);

    // Generate a non-minified version for development
    await esbuild.build({
      entryPoints: ['src/buggy/index.js'],
      bundle: true,
      minify: false,
      format: 'iife',
      globalName: 'BuggyExports',
      footer: {
        js: 'window.Buggy = BuggyExports.Buggy;'
      },
      outfile: `${outputDir}/buggy.js`,
      banner: {
        js: `/**
 * Buggy - Bug Reporting Tool v${version}
 * https://github.com/yourusername/buggy
 * Licensed under MIT
 */`
      },
      loader: {
        '.js': 'jsx',
      },
      external: ['html2canvas'],
    });
    
    console.log(`✅ Development bundle created: ${outputDir}/buggy.js`);

    // Generate a standalone bundle with IIFE format (UMD alternative)
    await esbuild.build({
      entryPoints: ['src/buggy/index.js'],
      bundle: true,
      minify: true,
      format: 'iife',
      globalName: 'BuggyExports',
      outfile: `${outputDir}/buggy.standalone.min.js`,
      footer: {
        js: `
// Provide UMD-like exports
if (typeof module === 'object' && typeof module.exports === 'object') {
  module.exports = BuggyExports;
}
if (typeof window !== "undefined") window.Buggy = BuggyExports.Buggy;`
      },
      banner: {
        js: `/**
 * Buggy - Bug Reporting Tool v${version} (Standalone)
 * https://github.com/yourusername/buggy
 * Licensed under MIT
 */`
      },
      loader: {
        '.js': 'jsx',
      },
      external: ['html2canvas'],
    });
    
    console.log(`✅ Standalone bundle created: ${outputDir}/buggy.standalone.min.js`);

    // Optional: analyze the bundle
    const meta = result.metafile;
    const output = Object.keys(meta.outputs)[0];
    console.log('\nBundle composition:');
    for (const [importPath, importData] of Object.entries(meta.inputs)) {
      const importSizeKB = (importData.bytes / 1024).toFixed(2);
      console.log(`- ${importPath}: ${importSizeKB} KB`);
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Run the build
build(); 