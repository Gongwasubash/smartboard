"""Analyze the cmap table of the embedded font."""
from fontTools.ttLib import TTFont

font = TTFont(r"E:\smatoroai\temp_font.ttf")

# Print all tables
print("Tables:", font.keys())

if "cmap" in font:
    for table in font["cmap"].tables:
        print(f"\nPlatform: {table.platformID}, Encoding: {table.platEncID}")
        if hasattr(table, "cmap"):
            items = sorted(table.cmap.items(), key=lambda x: x[0])
            print(f"Total entries: {len(items)}")
            for k, v in items:
                if 0x20 <= k < 0x7F:
                    repr_v = repr(v)
                    print(f"  0x{k:02X} ({chr(k)}) -> {repr_v}")
            # Print some extended range too
            for k, v in items:
                if 0x80 <= k < 0xA0:
                    repr_v = repr(v)
                    print(f"  0x{k:02X} -> {repr_v}")

# Also check name table
if "name" in font:
    for record in font["name"].names:
        try:
            val = record.toUnicode()
            if val:
                print(f"Name ID {record.nameID}: {val}")
        except:
            pass

font.close()
