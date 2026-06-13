import PyPDF2
with open(r'E:/smatoroai/public/textbooks/Class 6/Class 6 Health Physical Creative Arts (English).pdf', 'rb') as f:
    reader = PyPDF2.PdfReader(f)
    total = len(reader.pages)
    print(f'Total pages: {total}')
    for i in range(min(20, total)):
        p = reader.pages[i]
        text = p.extract_text()
        has_text = bool(text.strip())
        print(f'PDF page {i+1}: has_text={has_text}')
        if has_text:
            print(f'  Text: {text[:200]}')
