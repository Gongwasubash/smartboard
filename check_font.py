import fitz
doc = fitz.open(r"E:\class  1 to 10 book\Nepal Textbooks Grade 1-10\Class 1\Class 1 Nepali.pdf")
page = doc[0]
blocks = page.get_text("dict")["blocks"]
for b in blocks[:5]:
    if "lines" in b:
        for l in b["lines"]:
            for s in l["spans"]:
                print(f'Font: {s["font"]}, Size: {s["size"]}, Text: {s["text"][:60]}')
    if b.get("type") == 1:
        print("Image block")
