const fs = require('fs').promises;
const path = require('path');
const { optimize } = require('svgo');

// Configuration for SVGO optimization
const svgoConfig = {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeXMLProcInst: true,     // Remove XML declarations
          removeDoctype: true,          // Remove DOCTYPE
          removeComments: true,        // Remove comments
          removeMetadata: true,        // Remove metadata
          removeEditorsNSData: true,   // Remove editor data
          cleanupAttrs: true,          // Clean up attributes
          removeEmptyAttrs: true,      // Remove empty attributes
          removeHiddenElems: true,     // Remove hidden elements
          removeEmptyText: true,      // Remove empty text
          removeEmptyContainers: true, // Remove empty container elements
          minifyStyles: true,          // Minify styles
          removeUselessStrokeAndFill: true, // Remove useless stroke and fill
          removeUnusedNS: true,        // Remove unused namespaces
          cleanupNumericValues: true,  // Cleanup numeric values
          convertColors: true,         // Convert colors
          removeUnknownsAndDefaults: true, // Remove unknown elements and defaults
          removeNonInheritableGroupAttrs: true, // Remove non-inheritable group attributes
          removeUselessDefs: true,     // Remove useless defs
          cleanupEnableBackground: true, // Cleanup enableBackground
          removeRasterImages: false,    // Keep raster images
          mergePaths: true,            // Merge paths
          convertShapeToPath: true,     // Convert shapes to paths
          sortAttrs: true,            // Sort attributes
          removeDimensions: false,       // Keep viewBox
        }
      }
    }
  ]
};

// Function to optimize a single SVG file
async function optimizeSvgFile(filePath) {
  try {
    // Read the original file
    const originalContent = await fs.readFile(filePath, 'utf8');
    const originalSize = Buffer.byteLength(originalContent, 'utf8');
    
    // Optimize the SVG
    const result = optimize(originalContent, svgoConfig);
    const optimizedContent = result.data;
    const optimizedSize = Buffer.byteLength(optimizedContent, 'utf8');
    
    // Calculate savings
    const savedBytes = originalSize - optimizedSize;
    const savedPercentage = ((savedBytes / originalSize) * 100).toFixed(2);
    
    // Write the optimized content back to the file
    await fs.writeFile(filePath, optimizedContent, 'utf8');
    
    console.log(`${path.basename(filePath)}: ${originalSize} → ${optimizedSize} bytes (${savedPercentage}% saved)`);
    
    return {
      fileName: path.basename(filePath),
      originalSize,
      optimizedSize,
      savedBytes,
      savedPercentage: parseFloat(savedPercentage)
    };
  } catch (error) {
    console.error(`Error optimizing ${filePath}:`, error.message);
    return null;
  }
}

// Main function to process all SVG files
async function main() {
  const iconsSrcDir = path.join(__dirname, '..', 'icons', 'src');
  
  try {
    // Read all files in the directory
    const files = await fs.readdir(iconsSrcDir);
    
    // Filter for SVG files
    const svgFiles = files.filter(file => path.extname(file) === '.svg');
    
    if (svgFiles.length === 0) {
      console.log('No SVG files found in icons/src/');
      return;
    }
    
    console.log(`Found ${svgFiles.length} SVG files to optimize...\n`);
    
    // Process each SVG file
    const results = [];
    for (const file of svgFiles) {
      const filePath = path.join(iconsSrcDir, file);
      const result = await optimizeSvgFile(filePath);
      if (result) {
        results.push(result);
      }
    }
    
    // Calculate and display totals
    const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
    const totalOptimizedSize = results.reduce((sum, r) => sum + r.optimizedSize, 0);
    const totalSavedBytes = totalOriginalSize - totalOptimizedSize;
    const totalSavedPercentage = ((totalSavedBytes / totalOriginalSize) * 100).toFixed(2);
    
    console.log('\n--- Summary ---');
    console.log(`Total files processed: ${results.length}`);
    console.log(`Original size: ${totalOriginalSize} bytes`);
    console.log(`Optimized size: ${totalOptimizedSize} bytes`);
    console.log(`Total saved: ${totalSavedBytes} bytes (${totalSavedPercentage}%)`);
    
  } catch (error) {
    console.error('Error reading directory:', error.message);
  }
}

// Run the script
main();