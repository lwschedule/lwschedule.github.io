#!/usr/bin/env python3
import os
import sys
from pathlib import Path
try:
    from scour import scour
    SCOUR_AVAILABLE = True
except ImportError:
    SCOUR_AVAILABLE = False
    print("Warning: scour library not available. Please install with: pip install scour")

def optimize_svg_with_scour(file_path):
    """Optimize a single SVG file using scour library."""
    try:
        # Get original file size
        original_size = os.path.getsize(file_path)
        
        # Read the original SVG content
        with open(file_path, 'r') as f:
            svg_content = f.read()
        
        # Optimize the SVG using scour
        if SCOUR_AVAILABLE:
            # Configure scour options for maximum optimization
            options = scour.generateDefaultOptions()
            options.remove_descriptions = True
            options.remove_descriptive_elements = True
            options.remove_metadata = True
            options.remove_titles = True
            options.remove_descriptions = True
            options.remove_metadata = True
            options.remove_descriptive_elements = True
            options.enable_viewboxing = True
            options.strip_xml_prolog = True
            options.remove_comments = True
            options.remove_ids = True
            options.indent_type = None
            options.shorten_ids = True
            
            optimized_content = scour.scourString(svg_content, options)
            
            # Write optimized content back to file
            with open(file_path, 'w') as f:
                f.write(optimized_content)
        else:
            # If scour is not available, just return original values
            optimized_size = original_size
            return original_size, optimized_size, 0.0
        
        # Get optimized file size
        optimized_size = os.path.getsize(file_path)
        
        # Calculate savings
        saved_bytes = original_size - optimized_size
        saved_percentage = (saved_bytes / original_size) * 100 if original_size > 0 else 0
        
        return original_size, optimized_size, saved_percentage
    except Exception as e:
        print(f"Error processing {file_path}: {str(e)}")
        return None, None, None

def main():
    # Get the icons/src directory path
    icons_src_dir = Path(__file__).parent.parent / 'icons' / 'src'
    
    if not icons_src_dir.exists():
        print(f"Directory {icons_src_dir} does not exist")
        return
        
    # Find all SVG files
    svg_files = list(icons_src_dir.glob('*.svg'))
    
    if not svg_files:
        print(f"No SVG files found in {icons_src_dir}")
        return
        
    print(f"Found {len(svg_files)} SVG files to optimize...")
    
    # Process each SVG file
    results = []
    for svg_file in svg_files:
        print(f"Optimizing {svg_file.name}...")
        original_size, optimized_size, saved_percentage = optimize_svg_with_scour(str(svg_file))
        if original_size is not None:
            results.append({
                'file': svg_file.name,
                'original_size': original_size,
                'optimized_size': optimized_size,
                'saved_percentage': saved_percentage
            })
            print(f"{svg_file.name}: {original_size} → {optimized_size} bytes ({saved_percentage:.2f}% saved)")
    
    # Print summary
    if results:
        total_original = sum(r['original_size'] for r in results)
        total_optimized = sum(r['optimized_size'] for r in results)
        total_saved = total_original - total_optimized
        total_percentage = (total_saved / total_original) * 100 if total_original > 0 else 0
        
        print('\n--- Summary ---')
        print(f"Total files processed: {len(results)}")
        print(f"Original size: {total_original} bytes")
        print(f"Optimized size: {total_optimized} bytes")
        print(f"Total saved: {total_saved} bytes ({total_percentage:.2f}%)")


if __name__ == "__main__":
    main()