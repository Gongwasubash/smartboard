import fitz
doc = fitz.open(r'E:\smatoroai\public\textbooks\Class 6\Class 6 Social Studies.pdf')
for i in range(8, min(25, doc.page_count)):
    page = doc[i]
    blocks = page.get_text('dict')['blocks']
    for b in blocks:
        if 'lines' in b:
            for l in b['lines']:
                for s in l['spans']:
                    if s['size'] > 14:
                        text = s['text'].strip()
                        if text:
                            print(f'PDFp{i+1} size={s["size"]} text={text!r}')
