import fitz
import numpy as np

for label, path in [
    ('English', r'E:/smatoroai/public/textbooks/Class 6/Class 6 Health Physical Creative Arts (English).pdf'),
    ('Nepali', r'E:/smatoroai/public/textbooks/Class 6/Class 6 Health Physical (Nepali).pdf'),
]:
    doc = fitz.open(path)
    print(f'\n=== {label} (total: {doc.page_count} pages) ===')
    for i in range(min(35, doc.page_count)):
        page = doc[i]
        pix = page.get_pixmap()
        img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)
        gray = img_data.mean(axis=2)
        dark_pixels = (gray < 200).sum()
        total_pixels = gray.size
        dark_ratio = dark_pixels / total_pixels * 100
        print(f'PDF Page {i+1}: dark%={dark_ratio:.1f}%')
    doc.close()
