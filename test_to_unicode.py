"""Check if the Nepali PDF has ToUnicode CMap and try to extract it."""
from pypdf import PdfReader
from pypdf.generic import ArrayObject, DictionaryObject

pdf_path = r"E:\class  1 to 10 book\Nepal Textbooks Grade 1-10\Class 1\Class 1 Nepali.pdf"
reader = PdfReader(pdf_path)

# Check page 3 (index 2) for the custom fonts
page = reader.pages[2]
resources = page.get('/Resources', {})
fonts = resources.get('/Font', {})

for fname, font in fonts.items():
    base = font.get('/BaseFont', '/Unknown')
    print(f"\n=== Font: {fname} ===")
    print(f"  BaseFont: {base}")
    print(f"  Subtype: {font.get('/Subtype')}")
    print(f"  Encoding: {font.get('/Encoding')}")
    
    # Check for ToUnicode
    if '/ToUnicode' in font:
        print(f"  Has ToUnicode: YES")
        to_unicode = font['/ToUnicode']
        print(f"  ToUnicode type: {type(to_unicode)}")
        try:
            data = to_unicode.get_data()
            print(f"  ToUnicode data length: {len(data)}")
            # Decode and print first 500 chars
            decoded = data.decode('utf-8', errors='replace')
            print(f"  ToUnicode content (first 500):\n{decoded[:500]}")
        except Exception as e:
            print(f"  Error reading ToUnicode: {e}")
    else:
        print(f"  Has ToUnicode: NO")
    
    # Check if font has a BaseFont with embedded subset
    if '+' in base:
        print(f"  Subset font: YES (subset prefix before +)")

# Also try to extract one specific character's mapping
print("\n\n=== RAW FONT DICT ===")
for fname, font in fonts.items():
    if 'Pathyakram' in str(font.get('/BaseFont', '')):
        print(f"\n{fname}:")
        try:
            # Get the font dictionary as a string representation
            font_ref = font.indirect_reference
            if font_ref:
                font_obj = font_ref.get_object()
                print(f"  Font dict keys: {list(font_obj.keys())}")
                if '/BaseFont' in font_obj:
                    print(f"  BaseFont: {font_obj['/BaseFont']}")
                if '/Encoding' in font_obj:
                    print(f"  Encoding: {font_obj['/Encoding']}")
                if '/ToUnicode' in font_obj:
                    print(f"  ToUnicode: FOUND")
                    tu = font_obj['/ToUnicode']
                    print(f"  ToUnicode data: {tu.get_data()[:200]}")
        except Exception as e:
            print(f"  Error: {e}")
