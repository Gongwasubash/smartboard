import fitz, os, sys, tempfile, datetime

DIR = r'E:\smatoroai\public\textbooks\Class 9'
FILES = [
    "Class 9 Computer Science 2081.pdf",
    "Class 9 Economics 2074.pdf",
    "Class 9 English 2079.pdf",
    "Class 9 Mathematics (English) 2022.pdf",
    "Class 9 Mathematics (Nepali) 2079.pdf",
    "Class 9 Mathematics Open Ended 2079.pdf",
    "Class 9 Naturopath 2082.pdf",
    "Class 9 Nepali 2079.pdf",
    "Class 9 Optional Mathematics 2074.pdf",
    "Class 9 Optional Mathematics 2076.pdf",
    "Class 9 Science Technology 2024.pdf",
    "Class 9 Social Studies 2079.pdf",
    "Class 9 Yoga Education 2082.pdf",
]

TEMP = tempfile.mkdtemp(prefix='pdf_analysis_')
print(f'Temp directory: {TEMP}')
print('='*120)

print(f'{"File":<45} {"Pages":>6} {"Extractable":>12} {"Has TOC":>8} {"Notes":<50}')
print('-'*120)

for fname in FILES:
    fpath = os.path.join(DIR, fname)
    if not os.path.exists(fpath):
        print(f'{fname:<45} FILE NOT FOUND')
        continue
    try:
        doc = fitz.open(fpath)
        n = doc.page_count
        extractable_pages = 0
        total_chars = 0
        total_images = 0
        has_toc = bool(doc.get_toc())
        toc_text_found = False
        page_texts = []
        for i in range(min(5, n)):
            page = doc[i]
            text = page.get_text()
            images = page.get_images()
            chars = len(text.strip())
            total_chars += chars
            total_images += len(images)
            if chars > 0:
                extractable_pages += 1
            snippet = text.strip()[:300].replace('\n', ' | ')
            page_texts.append((i+1, chars, len(images), snippet))
            fbase = os.path.splitext(fname)[0].replace(' ', '_')
            outfile = os.path.join(TEMP, f'{fbase}_page{i+1:02d}.txt')
            with open(outfile, 'w', encoding='utf-8') as f:
                f.write(f'=== {fname} - Page {i+1} ===\n')
                f.write(f'Chars: {chars}, Images: {len(images)}\n\n')
                f.write(text[:200] if text.strip() else '[No extractable text - likely scanned image]')
                f.write('\n')
        if extractable_pages >= 3:
            extractable = 'YES'
        elif extractable_pages > 0:
            extractable = 'PARTIAL'
        else:
            extractable = 'NO (scanned)'
        for (pnum, chars, imgs, snippet) in page_texts[:3]:
            if any(kw in snippet.lower() for kw in ['contents', 'table of contents', 'index', 'unit', 'chapter', 'lesson']):
                toc_text_found = True
                break
        notes_parts = []
        for (pnum, chars, imgs, snippet) in page_texts:
            label = f'p{pnum}:{chars}c,{imgs}img'
            if chars > 0:
                label += f' "{snippet[:80]}"'
            else:
                label += ' [scanned]'
            notes_parts.append(label)
        notes = '; '.join(notes_parts)
        if len(notes) > 130:
            notes = notes[:127] + '...'
        print(f'{fname:<45} {n:>6} {extractable:>12} {str(toc_text_found):>8} {notes[:55]}')
        doc.close()
    except Exception as e:
        print(f'{fname:<45} ERROR: {e}')

print('='*120)
print(f'\nDetailed text extracts saved to: {TEMP}')
print('Listing saved files:')
for f in sorted(os.listdir(TEMP)):
    print(f'  {f}')
