"""Dump font cmap table to understand the character mapping."""
import fitz
import io

pdf_path = r"E:\class  1 to 10 book\Nepal Textbooks Grade 1-10\Class 1\Class 1 Nepali.pdf"
doc = fitz.open(pdf_path)

# Try xref 1022 (PathyakramFont normal, 35KB)
xref = 1022
try:
    stream = doc.xref_stream(xref)
    print(f"Stream: {len(stream)} bytes")
    print(f"First 50 bytes: {stream[:50].hex()}")
    
    # Check if it's a valid TTF by looking at the header
    # TTF starts with 0x00010000 or 'OTTO'
    header = stream[:4]
    print(f"Header: {header.hex() if isinstance(header, bytes) else header}")
    
    # Save to temp file for fonttools analysis
    with open(r"E:\smatoroai\temp_font.ttf", "wb") as f:
        f.write(stream)
    print("Saved to temp_font.ttf")
    
except Exception as e:
    print(f"Error: {e}")

doc.close()
