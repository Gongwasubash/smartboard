"""
Convert all textbook PDFs to markdown using markitdown.
Skips already converted files.
"""
import os
import sys
from markitdown import MarkItDown

PDF_ROOT = r"E:\class  1 to 10 book\Nepal Textbooks Grade 1-10"
OUTPUT_ROOT = r"E:\smatoroai\public\textbooks"

md_converter = MarkItDown()

def convert_pdf(pdf_path, output_md_path, class_name, file_stem):
    """Convert a single PDF to markdown."""
    try:
        result = md_converter.convert(pdf_path)
        text = result.text_content
        with open(output_md_path, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"    -> Saved ({len(text)} chars)")
        return True
    except Exception as e:
        print(f"    ERROR: {e}")
        return False

def main():
    classes = sorted(os.listdir(PDF_ROOT))
    total = 0
    skipped = 0

    for class_name in classes:
        class_path = os.path.join(PDF_ROOT, class_name)
        if not os.path.isdir(class_path):
            continue

        md_class_dir = os.path.join(OUTPUT_ROOT, class_name)
        os.makedirs(md_class_dir, exist_ok=True)

        pdfs = sorted([f for f in os.listdir(class_path) if f.lower().endswith('.pdf')])
        print(f"\n{class_name} ({len(pdfs)} PDFs):")

        for pdf_name in pdfs:
            pdf_path = os.path.join(class_path, pdf_name)
            file_stem = os.path.splitext(pdf_name)[0]
            output_md_path = os.path.join(md_class_dir, f"{file_stem}.md")

            if os.path.exists(output_md_path):
                skipped += 1
                continue

            total += 1
            print(f"  [{total}] {pdf_name}")
            convert_pdf(pdf_path, output_md_path, class_name, file_stem)

    print(f"\n{'='*50}")
    print(f"Converted: {total} new, {skipped} already existing")

if __name__ == "__main__":
    main()
