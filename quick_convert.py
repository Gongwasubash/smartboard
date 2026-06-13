"""Fast PDF to markdown converter using PyMuPDF (much faster than pdfminer)."""
import os
import fitz
import sys

PDF_ROOT = r"E:\class  1 to 10 book\Nepal Textbooks Grade 1-10"
OUTPUT_ROOT = r"E:\smatoroai\public\textbooks"

def pdf_to_markdown_fast(pdf_path):
    """Convert PDF to markdown using PyMuPDF - fast but may have garbled Nepali text."""
    doc = fitz.open(pdf_path)
    pages_text = []
    for i in range(len(doc)):
        page = doc[i]
        text = page.get_text()
        if text.strip():
            pages_text.append(f"\n\n--- Page {i+1} ---\n\n{text}")
    doc.close()
    return "\n".join(pages_text)

def convert_pdf(pdf_path, output_md_path):
    try:
        text = pdf_to_markdown_fast(pdf_path)
        with open(output_md_path, "w", encoding="utf-8") as f:
            f.write(text)
        return True, len(text)
    except Exception as e:
        print(f"    ERROR: {e}")
        return False, 0

def main():
    class_name = sys.argv[1]
    class_path = os.path.join(PDF_ROOT, class_name)
    out_dir = os.path.join(OUTPUT_ROOT, class_name)
    os.makedirs(out_dir, exist_ok=True)

    pdfs = sorted([f for f in os.listdir(class_path) if f.lower().endswith('.pdf')])
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
        ok, length = convert_pdf(pdf_path, out_path)
        if ok:
            print(f"OK ({length} chars)")
            converted += 1
        else:
            print("FAILED")

    print(f"  -> {converted} converted, {skipped} skipped")

if __name__ == "__main__":
    main()
