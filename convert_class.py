"""Convert PDFs for a specific class."""
import sys
import os
from markitdown import MarkItDown

PDF_ROOT = r"E:\class  1 to 10 book\Nepal Textbooks Grade 1-10"
OUTPUT_ROOT = r"E:\smatoroai\public\textbooks"
md = MarkItDown()

class_name = sys.argv[1]
class_path = os.path.join(PDF_ROOT, class_name)
out_dir = os.path.join(OUTPUT_ROOT, class_name)
os.makedirs(out_dir, exist_ok=True)

pdfs = sorted([f for f in os.listdir(class_path) if f.lower().endswith('.pdf')])
print(f"{class_name}: {len(pdfs)} PDFs")

converted = 0
skipped = 0
for pdf_name in pdfs:
    pdf_path = os.path.join(class_path, pdf_name)
    stem = os.path.splitext(pdf_name)[0]
    out_path = os.path.join(out_dir, f"{stem}.md")
    if os.path.exists(out_path):
        skipped += 1
        continue
    print(f"  {pdf_name}...", end=" ", flush=True)
    try:
        result = md.convert(pdf_path)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(result.text_content)
        print(f"OK ({len(result.text_content)} chars)")
        converted += 1
    except Exception as e:
        print(f"FAIL: {e}")

print(f"  -> {converted} converted, {skipped} skipped")
