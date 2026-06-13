"""Render PDF pages to images and save for external OCR."""
import fitz
import os

pdf_dir = r"E:\class  1 to 10 book\Nepal Textbooks Grade 1-10"
output_dir = r"E:\smatoroai\public\textbooks\images"
os.makedirs(output_dir, exist_ok=True)

# Render first 3 pages of Class 1 Nepali as sample
pdf_path = os.path.join(pdf_dir, "Class 1", "Class 1 Nepali.pdf")
doc = fitz.open(pdf_path)

for i in range(min(3, len(doc))):
    page = doc[i]
    pix = page.get_pixmap(dpi=200)
    img_path = os.path.join(output_dir, f"Class1_Nepali_p{i+1}.png")
    pix.save(img_path)
    print(f"Saved page {i+1} -> {img_path} ({pix.width}x{pix.height})")

doc.close()
print("Done rendering sample pages")
