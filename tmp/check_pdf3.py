import fitz

doc = fitz.open(r'E:/smatoroai/public/textbooks/Class 6/Class 6 Health Physical Creative Arts (English).pdf')
print(f'Total pages: {doc.page_count}')
print(f'Metadata: {doc.metadata}')
for i in range(min(20, doc.page_count)):
    page = doc[i]
    blocks = page.get_text('blocks')
    text_blocks = [b for b in blocks if b[6] == 0]  # text blocks
    image_blocks = [b for b in blocks if b[6] == 1]  # image blocks
    print(f'Page {i+1}: text_blocks={len(text_blocks)}, image_blocks={len(image_blocks)}')
    if text_blocks:
        for b in text_blocks[:3]:
            print(f'  Text: {b[4][:200]}')
doc.close()
