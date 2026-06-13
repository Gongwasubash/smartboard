"""Extract embedded font from Nepali PDF and build unicode mapping."""
import fitz
from fontTools.ttLib import TTFont
import io
import os

pdf_path = r"E:\class  1 to 10 book\Nepal Textbooks Grade 1-10\Class 1\Class 1 Nepali.pdf"
doc = fitz.open(pdf_path)

# Get font from page
page = doc[2]  # page 3 has Nepali text
fonts = page.get_fonts()
print("Fonts on page 3:")
for f in fonts:
    print(f"  {f}")

# Try to extract the embedded font file from the PDF
for i in range(len(fonts)):
    font_info = fonts[i]
    font_name = font_info[0]  # e.g. 'PBKKFP+PathyakramFont'
    print(f"\nTrying to extract font: {font_name}")
    
    # Get font xref
    for xref in range(1, doc.xref_length()):
        try:
            obj = doc.xref_object(xref)
            if f'/{font_name}' in obj or f'/{font_info[3]}' in obj:
                print(f"  Found font reference at xref {xref}")
        except:
            pass

# Try a different approach - extract font stream from xref
# Look for FontDescriptor with FontFile2
for xref in range(1, doc.xref_length()):
    try:
        obj = doc.xref_object(xref)
        if 'FontFile2' in obj or 'FontFile' in obj:
            print(f"\nFont file stream at xref {xref}:")
            print(f"  {obj[:200]}")
            
            # Try to extract the stream
            stream = doc.xref_stream(xref)
            if stream:
                print(f"  Stream length: {len(stream)} bytes")
                # Try to load as TrueType font
                try:
                    font = TTFont(io.BytesIO(stream))
                    cmap = font.getBestCmap()
                    if cmap:
                        print(f"  CMap entries: {len(cmap)}")
                        # Print first 50 mappings
                        items = sorted(cmap.items())
                        for char_code, unicode_val in items[:50]:
                            char = chr(unicode_val) if unicode_val < 0x110000 else '?'
                            print(f"    0x{char_code:04X} -> U+{unicode_val:04X} ('{char}')")
                    font.close()
                except Exception as e:
                    print(f"  Error loading font: {e}")
    except:
        pass

doc.close()
print("\nDone")
