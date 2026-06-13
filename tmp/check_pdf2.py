# Check Nepali version too
import PyPDF2

for fname, label in [
    (r'E:/smatoroai/public/textbooks/Class 6/Class 6 Health Physical Creative Arts (English).pdf', 'English'),
    (r'E:/smatoroai/public/textbooks/Class 6/Class 6 Health Physical (Nepali).pdf', 'Nepali'),
    (r'E:/smatoroai/public/textbooks/Class 6/Class 6 Social Studies.pdf', 'Social'),
]:
    with open(fname, 'rb') as f:
        reader = PyPDF2.PdfReader(f)
        total = len(reader.pages)
        print(f'\n=== {label} PDF ===')
        print(f'Total pages: {total}')
        for i in range(min(30, total)):
            p = reader.pages[i]
            text = p.extract_text()
            has_text = bool(text.strip())
            if has_text:
                print(f'  PDF page {i+1}: {text[:150]}')
