"""Check page counts of remaining PDFs."""
import fitz, os

pdf_root = r"E:\class  1 to 10 book\Nepal Textbooks Grade 1-10"
done = set()
out_root = r"E:\smatoroai\public\textbooks"
for root, dirs, files in os.walk(out_root):
    for f in files:
        if f.endswith(".md"):
            done.add(f.replace(".md", ""))

classes = sorted(os.listdir(pdf_root))
for cls in classes:
    cls_path = os.path.join(pdf_root, cls)
    if not os.path.isdir(cls_path):
        continue
    for pdf in sorted(os.listdir(cls_path)):
        if not pdf.lower().endswith(".pdf"):
            continue
        stem = pdf.replace(".pdf", "")
        if stem in done:
            continue
        pdf_path = os.path.join(cls_path, pdf)
        try:
            d = fitz.open(pdf_path)
            print(f"{cls}/{pdf}: {len(d)} pages")
            d.close()
        except Exception as e:
            print(f"{cls}/{pdf}: ERROR - {e}")
