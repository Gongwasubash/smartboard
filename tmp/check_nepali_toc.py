import PyPDF2

with open(r'E:/smatoroai/public/textbooks/Class 6/Class 6 Health Physical (Nepali).pdf', 'rb') as f:
    reader = PyPDF2.PdfReader(f)
    for i in range(3, 8):
        text = reader.pages[i].extract_text()
        print(f'=== PDF Page {i+1} ===')
        print(text[:500])
        print()
