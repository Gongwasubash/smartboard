import re

with open(r'E:\smatoroai\tmp_full_text.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# Find all kf7 markers and their positions
# Pattern: kf7\n!\n (chapter 1) or kf7\n@\n (chapter 2)
lines = text.split('\n')
chapters = []
current_chapter = None
current_sections = []
in_exercise = False

for i, line in enumerate(lines):
    if line == '===PAGE ':
        continue
    
    # Detect chapter start
    m = re.match(r'^kf7$', line.strip())
    if m and i+1 < len(lines):
        next_line = lines[i+1].strip()
        # Check if next line is a chapter number (Nepali numeral or digit)
        if next_line in ['!','@','#','$','%','^','&','*','(','!@','!!','!#','!$','!%','!^','!&','!*','!(','!)']:
            if current_chapter:
                chapters.append((current_chapter, current_sections.copy()))
            current_chapter = {'start_line': i, 'chapter_num': next_line}
            current_sections = []
            continue
    
    # Look for section headings (numbered patterns != ..., @= ..., #= ... etc.)
    # But need to exclude exercise/activity items
    
print(f"Found {len(chapters)} chapters")
for ch in chapters[:10]:
    print(f"Chapter {ch[0]['chapter_num']}: {len(ch[1])} sections")
