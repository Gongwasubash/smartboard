// Maps class/subject pairs to textbook filenames in public/textbooks/
// Key format: "{className}|{subjectTitle}"
const textbookMap: Record<string, string> = {
  // Class 1
  "Class 1|English": "Class 1 English.md",
  "Class 1|Mathematics (English)": "Class 1 Mathematics (English).md",
  "Class 1|Mathematics (Nepali)": "Class 1 Mathematics (Nepali).md",
  "Class 1|Nepali": "Class 1 Nepali.md",
  "Class 1|Serofero": "Class 1 Serofero.md",

  // Class 2
  "Class 2|English": "Class 2 English.md",
  "Class 2|Health Physical Creative Arts (English)": "Class 2 Health Physical Creative Arts (English).md",
  "Class 2|Mathematics (English)": "Class 2 Mathematics (English).md",
  "Class 2|Mathematics (Nepali)": "Class 2 Mathematics (Nepali).md",
  "Class 2|Nepali": "Class 2 Nepali.md",

  // Class 3
  "Class 3|English": "Class 3 English.md",
  "Class 3|Mathematics (English)": "Class 3 Maths (English).md",
  "Class 3|Mathematics (Nepali)": "Class 3 Maths (Nepali).md",
  "Class 3|Nepali": "Class 3 Nepali.md",
  "Class 3|Serofero": "Class 3 Serofero.md",

  // Class 4
  "Class 4|English": "Class 4 English.md",
  "Class 4|Health Physical Creative Arts (Nepali)": "Class 4 Health Physical Creative Arts (Nepali).md",
  "Class 4|Mathematics (English)": "Class 4 Mathematics (English).md",
  "Class 4|Mathematics (Nepali)": "Class 4 Mathematics (Nepali).md",
  "Class 4|Nepali": "Class 4 Nepali.md",
  "Class 4|Science and Technology (English)": "Class 4 Science and Technology (English).md",
  "Class 4|Science and Technology (Nepali)": "Class 4 Science and Technology (Nepali).md",
  "Class 4|Social Studies and Human Value Education": "Class 4 Social Studies and Human Value Education.md",

  // Class 5
  "Class 5|English": "Class 5 English.md",
  "Class 5|Mathematics (English)": "Class 5 Mathematics (English).md",
  "Class 5|Mathematics (Nepali)": "Class 5 Mathematics (Nepali).md",
  "Class 5|Nepali": "Class 5 Nepali.md",
  "Class 5|Science and Technology": "Class 5 Science and Technology.md",
  "Class 5|Health Physical (English)": "Class 5 Science Health Physical (English).md",
  "Class 5|Health Physical (Nepali)": "Class 5 Science Health Physical (Nepali).md",
  "Class 5|Social Studies Creative Arts (English)": "Class 5 Social Studies Creative Arts (English).md",
  "Class 5|Social Studies Creative Arts (Nepali)": "Class 5 Social Studies Creative Arts (Nepali).md",

  // Class 6
  "Class 6|English": "Class 6 English.md",
  "Class 6|Health Physical (Nepali)": "Class 6 Health Physical (Nepali).md",
  "Class 6|Health Physical Creative Arts (English)": "Class 6 Health Physical Creative Arts (English).md",
  "Class 6|Mathematics (Nepali)": "Class 6 Mathematics (Nepali).md",
  "Class 6|Nepali": "Class 6 Nepali.md",
  "Class 6|Science (Nepali)": "Class 6 Science (Nepali).md",
  "Class 6|Social Studies": "Class 6 Social Studies.md",

  // Class 7 - use className matching the directory name
  "Class 7|English": "Class 7 English.md",
  "Class 7|Health Physical (Nepali)": "Class 7 Health Physical (Nepali).md",
  "Class 7|Health Physical Creative Arts (English)": "Class 7 Health Physical Creative Arts (English).md",
  "Class 7|Mathematics (English)": "Class 7 Maths (English).md",
  "Class 7|Mathematics (Nepali)": "Class 7 Maths (Nepali).md",
  "Class 7|Nepali": "Class 7 Nepali.md",
  "Class 7|Science Technology (English)": "Class 7 Science Technology (English).md",
  "Class 7|Science Technology (Nepali)": "Class 7 Science Technology (Nepali).md",
  "Class 7|Social Studies": "Class 7 Social Studies.md",

  // Class 8
  "Class 8|English 2023": "Class 8 English 2023.md",
  "Class 8|Health Physical Creative Arts (English)": "Class 8 Health Physical Creative Arts (English).md",
  "Class 8|Health Physical Education": "Class 8 Health Physical Education.md",
  "Class 8|Mathematics (Nepali)": "Class 8 Maths (Nepali).md",
  "Class 8|Moral Education (English)": "Class 8 Moral Education (English).md",
  "Class 8|Moral Education (Nepali)": "Class 8 Moral Education (Nepali).md",
  "Class 8|Nepali 2080": "Class 8 Nepali 2080.md",
  "Class 8|Science Environment (English)": "Class 8 Science Environment (English).md",
  "Class 8|Science Environment (Nepali)": "Class 8 Science Environment (Nepali).md",
  "Class 8|Social Studies Population": "Class 8 Social Studies Population.md",

  // Class 9
  "Class 9|Computer Science 2081": "Class 9 Computer Science 2081.md",
  "Class 9|Economics 2074": "Class 9 Economics 2074.md",
  "Class 9|English 2079": "Class 9 English 2079.md",
  "Class 9|Mathematics (English) 2022": "Class 9 Mathematics (English) 2022.md",
  "Class 9|Mathematics (Nepali) 2079": "Class 9 Mathematics (Nepali) 2079.md",
  "Class 9|Mathematics Open Ended 2079": "Class 9 Mathematics Open Ended 2079.md",
  "Class 9|Nepali 2079": "Class 9 Nepali 2079.md",
  "Class 9|Optional Mathematics 2076": "Class 9 Optional Mathematics 2076.md",
  "Class 9|Social Studies 2079": "Class 9 Social Studies 2079.md",

  // Class 10
  "Class 10|Accountancy": "Class 10 Accountancy.md",
  "Class 10|English": "Class 10 Compulsory English.md",
  "Class 10|Mathematics (English)": "Class 10 Compulsory Mathematics (English).md",
  "Class 10|Mathematics (Nepali)": "Class 10 Compulsory Mathematics (Nepali).md",
  "Class 10|Nepali": "Class 10 Compulsory Nepali.md",
  "Class 10|Computer Science": "Class 10 Computer Science.md",
  "Class 10|Economics": "Class 10 Economics.md",
  "Class 10|History": "Class 10 History.md",
  "Class 10|Optional Mathematics": "Class 10 Optional Mathematics.md",
  "Class 10|Science": "Class 10 Science.md",
  "Class 10|Social Studies": "Class 10 Social Studies.md",
};

// Get all available textbooks grouped by class
export function getTextbooksByClass(): { className: string; subjects: { title: string; filename: string }[] }[] {
  const grouped: Record<string, { title: string; filename: string }[]> = {};
  for (const [key, filename] of Object.entries(textbookMap)) {
    const [className, ...rest] = key.split("|");
    const subjectTitle = rest.join("|");
    if (!grouped[className]) grouped[className] = [];
    grouped[className].push({ title: subjectTitle, filename });
  }
  const order = ["Class 1","Class 2","Class 3","Class 4","Class 5","Class 6","Class 7","Class 8","Class 9","Class 10"];
  return order.map(c => ({ className: c, subjects: grouped[c] || [] }));
}

// Reverse mapping: textbook filename -> { classId, subjectTitle }
export function getTextbookInfo(classId: string, subjectTitle: string): { className: string; filename: string } | null {
  // Map classId to display class name
  const classNameMap: Record<string, string> = {
    "nursery": "Class 1",
    "lkg": "Class 1",
    "ukg": "Class 1",
    "class-1": "Class 1",
    "class-2": "Class 2",
    "class-3": "Class 3",
    "class-4": "Class 4",
    "class-5": "Class 5",
    "class-6": "Class 6",
    "class-7": "Class 7",
    "class-8": "Class 8",
    "class-9": "Class 9",
    "class-10": "Class 10",
  };

  const className = classNameMap[classId];
  if (!className) return null;

  const key = `${className}|${subjectTitle}`;
  const filename = textbookMap[key];
  if (!filename) return null;

  return { className, filename };
}

export function getTextbookUrl(className: string, filename: string): string {
  return `/textbooks/${encodeURIComponent(className)}/${encodeURIComponent(filename)}`;
}

export function getTextbookPdfUrl(className: string, mdFilename: string): string {
  const pdfFilename = mdFilename.replace(/\.md$/i, ".pdf");
  return `/textbooks/${encodeURIComponent(className)}/${encodeURIComponent(pdfFilename)}`;
}

export function getTextbookPdfUrlFromInfo(className: string, subjectTitle: string): string | null {
  const key = `${className}|${subjectTitle}`;
  const mdFilename = textbookMap[key];
  if (!mdFilename) return null;
  return getTextbookPdfUrl(className, mdFilename);
}

export default textbookMap;
