"""Test pypdf extraction on Nepali PDF with custom fonts."""
from pypdf import PdfReader

pdf_path = r"E:\class  1 to 10 book\Nepal Textbooks Grade 1-10\Class 1\Class 1 Nepali.pdf"
reader = PdfReader(pdf_path)

# Try page 2 (skip cover page 0 and page 1)
for pg in [2, 3]:
    page = reader.pages[pg]
    text = page.extract_text()
    print(f"--- Page {pg+1} ---")
    print(text[:500])
    print()

# Also check if there's a /ToUnicode map
page = reader.pages[0]
if '/ToUnicode' in page.get('/Resources', {}):
    print("Has ToUnicode in page resources")
    
# Check fonts used
page = reader.pages[2]
if '/Font' in page.get('/Resources', {}):
    fonts = page['/Resources']['/Font']
    for fname, font in fonts.items():
        print(f"Font: {fname}, BaseFont: {font.get('/BaseFont', 'N/A')}, Encoding: {font.get('/Encoding', 'N/A')}")
