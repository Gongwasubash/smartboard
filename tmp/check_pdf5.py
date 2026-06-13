import fitz
import numpy as np

doc = fitz.open(r'E:/smatoroai/public/textbooks/Class 6/Class 6 Health Physical Creative Arts (English).pdf')

print(f'Total pages: {doc.page_count}')
for i in range(min(30, doc.page_count)):
    page = doc[i]
    pix = page.get_pixmap()
    img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)
    gray = img_data.mean(axis=2)
    # Variance - high variance means more text/content
    var = gray.var()
    # Count dark pixels (text)
    dark_pixels = (gray < 200).sum()
    total_pixels = gray.size
    dark_ratio = dark_pixels / total_pixels * 100
    print(f'PDF Page {i+1}: var={var:.1f}, dark%={dark_ratio:.1f}%')

doc.close()
