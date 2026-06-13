"""Extract font files from PDF and build Unicode character mapping."""
import fitz
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._c_m_a_p import CmapSubtable
import io
import json

pdf_path = r"E:\class  1 to 10 book\Nepal Textbooks Grade 1-10\Class 1\Class 1 Nepali.pdf"
doc = fitz.open(pdf_path)

# Font file xrefs to try (Pathyakram variants)
font_xrefs = [1019, 1021, 1022, 1034, 1051, 1729, 1731, 1733]

for xref in font_xrefs:
    try:
        stream = doc.xref_stream(xref)
        if stream and len(stream) > 100:
            print(f"\n=== XRef {xref}: {len(stream)} bytes ===")
            try:
                font = TTFont(io.BytesIO(stream))
                
                # Get the best cmap
                for table in font['cmap'].tables:
                    if hasattr(table, 'cmap') and table.cmap:
                        print(f"  Platform: {table.platformID}, Encoding: {table.platEncID}")
                        entries = sorted(table.cmap.items())
                        
                        # Build a reverse mapping: char -> unicode
                        sorted_entries = sorted(entries, key=lambda x: x[0])
                        
                        # Print the mapping from WinAnsi codes to unicode
                        # WinAnsi encoding uses 0x80-0xFF and 0x20-0x7E
                        for char_code, unicode_val in sorted_entries[:100]:
                            if char_code >= 0x20:  # printable range
                                unicode_char = chr(unicode_val) if unicode_val < 0x110000 else '?'
                                print(f"    0x{char_code:02X} ({chr(char_code) if 0x20 <= char_code < 0x7F else '?'}) -> U+{unicode_val:04X} '{unicode_char}'")
                        
                        # Check if this is a full WinAnsiEncoding mapping
                        print(f"  Total entries: {len(entries)}")
                        
                        # Check if the mapping gives proper Nepali
                        # Sample: 'd' = 0x64, ']' = 0x5D, '/' = 0x2F, 'f' = 0x66
                        test_codes = [ord(c) for c in "d]/f] g]kfnL"]
                        if all(c in table.cmap for c in test_codes):
                            result = ''.join(chr(table.cmap[c]) if c in table.cmap else '?' for c in test_codes)
                            print(f"\n  Decoded 'd]/f] g]kfnL' -> '{result}'")
                        
                        # Only need one good table
                        break
                
                # Also check name table for font name
                if 'name' in font:
                    for record in font['name'].names:
                        if record.nameID in [1, 2, 4, 6]:
                            try:
                                name = record.toUnicode()
                                if name:
                                    print(f"  Name (ID={record.nameID}): {name}")
                            except:
                                pass
                
                font.close()
            except Exception as e:
                print(f"  Error loading font: {e}")
    except Exception as e:
        print(f"  Error reading xref {xref}: {e}")

doc.close()
print("\nDone")
