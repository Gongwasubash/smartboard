"""Test EasyOCR on a single page of a Nepali PDF."""
import fitz
import os
import sys

# Open the PDF
pdf_path = r"E:\class  1 to 10 book\Nepal Textbooks Grade 1-10\Class 1\Class 1 Nepali.pdf"
doc = fitz.open(pdf_path)

# Extract page 0 as image
page = doc[0]
pix = page.get_pixmap(dpi=300)
img_path = r"E:\smatoroai\temp_test_page.png"
pix.save(img_path)
print(f"Saved page 0 image: {pix.width}x{pix.height}")

# Check if we should also try English
print(f"Total pages: {len(doc)}")
doc.close()
