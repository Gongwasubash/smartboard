import fitz
import os

doc = fitz.open(r'E:/smatoroai/public/textbooks/Class 6/Class 6 Health Physical Creative Arts (English).pdf')

# Check images on each page
print(f'Total pages: {doc.page_count}')
for i in range(min(20, doc.page_count)):
    page = doc[i]
    # Get images
    images = page.get_images()
    # Check if page has any content
    pix = page.get_pixmap()
    # Check average pixel value to detect blank vs non-blank pages
    import numpy as np
    img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)
    avg_brightness = img_data.mean()
    
    print(f'Page {i+1}: images={len(images)}, size={pix.width}x{pix.height}, avg_brightness={avg_brightness:.1f}')

doc.close()
