import fitz
doc = fitz.open(r"E:\class  1 to 10 book\Nepal Textbooks Grade 1-10\Class 1\Class 1 Nepali.pdf")
page = doc[0]
# Get character mapping
page.get_text("text")
# Check if there's a ToUnicode map
xref = doc.get_xml_metadata()
# Try getting raw text with different options
text = page.get_text("rawdict")
for block in text["blocks"]:
    if "lines" in block:
        for line in block["lines"]:
            for span in line["spans"]:
                print("Span:", repr(span["text"][:80]))
                print("  Font:", span["font"])
                print("  Bbox:", span["bbox"])
                break
        break

# Also try to detect if there's CMap
for i in range(1, min(doc.xref_length(), 50)):
    try:
        obj = doc.xref_object(i)
        if "CMap" in obj or "ToUnicode" in obj or "cmap" in obj.lower():
            print(f"XRef {i}: {obj[:200]}")
    except:
        pass
print("Done checking")
