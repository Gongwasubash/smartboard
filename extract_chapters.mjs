import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { fontConvertor } = require('preeti-unicode');
const _p2uConv = new fontConvertor();

function toUnicodeNepali(text) {
  const origLog = console.log;
  console.log = () => {};
  try {
    const raw = _p2uConv.convertToUnicode(text);
    const lines = raw.trim().split('\n');
    const last = lines[lines.length - 1];
    return last || text;
  } catch { return text; }
  finally { console.log = origLog; }
}

function isNepaliBook(key) {
  const subj = key.split('|')[1] || '';
  if (/Nepali|nepali/i.test(subj)) return true;
  const nepaliOnly = ['Serofero', 'Samajik', 'सामाजिक','Social Studies','Social Studies and Human Value Education','Social Studies Creative Arts','Social Studies Population'];
  if (nepaliOnly.some(n => subj.includes(n))) return true;
  return false;
}

const TEXTBOOKS_DIR = 'public/textbooks';

// PDF page offset: some textbooks have front matter (cover, TOC, preface)
// that shifts printed page numbers relative to PDF page numbers.
// Format: "ClassName|SubjectTitle": offset (PDF page = printed page + offset)
const pdfPageOffsets = {
  "Class 10|Optional Mathematics": 4,
  "Class 10|Social Studies": 8,
  "Class 10|Economics": 4,
  "Class 10|Computer Science": 7,
  "Class 10|Accountancy": 4,
  "Class 10|Compulsory English": 8,
};

const textbookMap = {
  "Class 1|English": "Class 1 English.md",
  "Class 1|Mathematics (English)": "Class 1 Mathematics (English).md",
  "Class 1|Mathematics (Nepali)": "Class 1 Mathematics (Nepali).md",
  "Class 1|Nepali": "Class 1 Nepali.md",
  "Class 1|Serofero": "Class 1 Serofero.md",
  "Class 2|English": "Class 2 English.md",
  "Class 2|Health Physical Creative Arts (English)": "Class 2 Health Physical Creative Arts (English).md",
  "Class 2|Mathematics (English)": "Class 2 Mathematics (English).md",
  "Class 2|Mathematics (Nepali)": "Class 2 Mathematics (Nepali).md",
  "Class 2|Nepali": "Class 2 Nepali.md",
  "Class 3|English": "Class 3 English.md",
  "Class 3|Mathematics (English)": "Class 3 Maths (English).md",
  "Class 3|Mathematics (Nepali)": "Class 3 Maths (Nepali).md",
  "Class 3|Nepali": "Class 3 Nepali.md",
  "Class 3|Serofero": "Class 3 Serofero.md",
  "Class 4|English": "Class 4 English.md",
  "Class 4|Health Physical Creative Arts (Nepali)": "Class 4 Health Physical Creative Arts (Nepali).md",
  "Class 4|Mathematics (English)": "Class 4 Mathematics (English).md",
  "Class 4|Mathematics (Nepali)": "Class 4 Mathematics (Nepali).md",
  "Class 4|Nepali": "Class 4 Nepali.md",
  "Class 4|Science and Technology (English)": "Class 4 Science and Technology (English).md",
  "Class 4|Science and Technology (Nepali)": "Class 4 Science and Technology (Nepali).md",
  "Class 4|Social Studies and Human Value Education": "Class 4 Social Studies and Human Value Education.md",
  "Class 5|English": "Class 5 English.md",
  "Class 5|Mathematics (English)": "Class 5 Mathematics (English).md",
  "Class 5|Mathematics (Nepali)": "Class 5 Mathematics (Nepali).md",
  "Class 5|Nepali": "Class 5 Nepali.md",
  "Class 5|Science and Technology": "Class 5 Science and Technology.md",
  "Class 5|Health Physical (English)": "Class 5 Science Health Physical (English).md",
  "Class 5|Health Physical (Nepali)": "Class 5 Science Health Physical (Nepali).md",
  "Class 5|Social Studies Creative Arts (English)": "Class 5 Social Studies Creative Arts (English).md",
  "Class 5|Social Studies Creative Arts (Nepali)": "Class 5 Social Studies Creative Arts (Nepali).md",
  "Class 6|English": "Class 6 English.md",
  "Class 6|Health Physical (Nepali)": "Class 6 Health Physical (Nepali).md",
  "Class 6|Health Physical Creative Arts (English)": "Class 6 Health Physical Creative Arts (English).md",
  "Class 6|Mathematics (English)": "Class 6 Mathematics (English).md",
  "Class 6|Mathematics (Nepali)": "Class 6 Mathematics (Nepali).md",
  "Class 6|Nepali": "Class 6 Nepali.md",
  "Class 6|Science (Nepali)": "Class 6 Science (Nepali).md",
  "Class 6|Social Studies": "Class 6 Social Studies.md",
  "Class 7|English": "Class 7 English.md",
  "Class 7|Health Physical (Nepali)": "Class 7 Health Physical (Nepali).md",
  "Class 7|Health Physical Creative Arts (English)": "Class 7 Health Physical Creative Arts (English).md",
  "Class 7|Mathematics (English)": "Class 7 Maths (English).md",
  "Class 7|Mathematics (Nepali)": "Class 7 Maths (Nepali).md",
  "Class 7|Nepali": "Class 7 Nepali.md",
  "Class 7|Science Technology (English)": "Class 7 Science Technology (English).md",
  "Class 7|Science Technology (Nepali)": "Class 7 Science Technology (Nepali).md",
  "Class 7|Social Studies": "Class 7 Social Studies.md",
  "Class 8|English 2019": "Class 8 English 2019.md",
  "Class 8|English 2023": "Class 8 English 2023.md",
  "Class 8|Health Physical Creative Arts (English)": "Class 8 Health Physical Creative Arts (English).md",
  "Class 8|Health Physical Education": "Class 8 Health Physical Education.md",
  "Class 8|Mathematics (English)": "Class 8 Maths (English) OR Health PE (English).md",
  "Class 8|Mathematics (Nepali)": "Class 8 Maths (Nepali).md",
  "Class 8|Moral Education (English)": "Class 8 Moral Education (English).md",
  "Class 8|Moral Education (Nepali)": "Class 8 Moral Education (Nepali).md",
  "Class 8|Nepali 2076": "Class 8 Nepali 2076.md",
  "Class 8|Nepali 2080": "Class 8 Nepali 2080.md",
  "Class 8|Science Environment (English)": "Class 8 Science Environment (English).md",
  "Class 8|Science Environment (Nepali)": "Class 8 Science Environment (Nepali).md",
  "Class 8|Social Studies Population": "Class 8 Social Studies Population.md",
  "Class 8|Vocational Technical Education": "Class 8 Vocational Technical Education.md",
  "Class 9|Computer Science 2081": "Class 9 Computer Science 2081.md",
  "Class 9|Economics 2074": "Class 9 Economics 2074.md",
  "Class 9|English 2079": "Class 9 English 2079.md",
  "Class 9|Mathematics (English) 2022": "Class 9 Mathematics (English) 2022.md",
  "Class 9|Mathematics (Nepali) 2079": "Class 9 Mathematics (Nepali) 2079.md",
  "Class 9|Mathematics Open Ended 2079": "Class 9 Mathematics Open Ended 2079.md",
  "Class 9|Naturopath 2082": "Class 9 Naturopath 2082.md",
  "Class 9|Nepali 2079": "Class 9 Nepali 2079.md",
  "Class 9|Optional Mathematics 2074": "Class 9 Optional Mathematics 2074.md",
  "Class 9|Optional Mathematics 2076": "Class 9 Optional Mathematics 2076.md",
  "Class 9|Science Technology 2024": "Class 9 Science Technology 2024.md",
  "Class 9|Social Studies 2079": "Class 9 Social Studies 2079.md",
  "Class 9|Yoga Education 2082": "Class 9 Yoga Education 2082.md",
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

const NEPALI_NUM = {
  '!': '1', '@': '2', '#': '3', '$': '4', '%': '5',
  '^': '6', '&': '7', '*': '8', '(': '9', ')': '0',
};

function toArabic(s) {
  return s.replace(/[!@#$%^&*()]/g, c => NEPALI_NUM[c] || c);
}

const NEPALI_WORD_NUMS = {
  'Ps': '1', 'bO{': '2', 'tLg': '3', 'rf/': '4', 'kfFr': '5',
  '5': '6', ';ft': '7', 'cf7': '8', 'gf}': '9', '!)+': '10',
};


function isNepaliText(text) {
  return /[\u0900-\u097F]/.test(text);
}

function getPageMarkers(lines) {
  const pages = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^--- Page (\d+) ---$/);
    if (m) pages.push({ line: i, page: parseInt(m[1]) });
  }
  return pages;
}

function findNearestPage(pageMarkers, lineIdx) {
  let nearest = null;
  for (const p of pageMarkers) { if (p.line < lineIdx) nearest = p; else break; }
  return nearest;
}

// ===== Nepali Stacked TOC Parser (ljifo;"rL with vertical column entries) =====
// Handles stacked formats where each column is on its own line:
//   ljifo;"rL
//   kf7 M!\t  (or !=\t or kf7 !\t)
//   Title\t
//   Genre\t   (optional)
//   PageNum
function parseNepaliStackedTOC(lines) {
  // Find TOC start
  let tocStart = -1;
  for (let i = 0; i < Math.min(400, lines.length); i++) {
    if (/^ljifo\s*;?"?rL/i.test(lines[i].trim())) {
      tocStart = i; break;
    }
  }
  if (tocStart < 0) return null;

  // Find TOC end
  let tocEnd = Math.min(tocStart + 300, lines.length);
  for (let i = tocStart + 1; i < tocEnd; i++) {
    if (/^--- Page /.test(lines[i])) { tocEnd = i; break; }
  }

  // Collect all lines in the TOC region, trimming whitespace
  const tocLines = [];
  for (let i = tocStart; i < tocEnd; i++) {
    const t = lines[i].trim();
    if (t && !/^--- Page /.test(t)) tocLines.push(t);
  }

  // Process stacked entries
  const entries = [];

  for (let i = 0; i < tocLines.length; i++) {
    const line = tocLines[i];
    const NN = /^[!@#$%^&*()\d]+$/;

    // Detect entry start patterns
    let isEntry = false;
    let numStr = '';
    let labelType = '';

    // Pattern: kf7 M[num] (e.g., "kf7 M!", "kf7 M@")
    let m = line.match(/^kf7\s+M([!@#$%^&*()\d]+)$/);
    if (m) { isEntry = true; numStr = m[1]; labelType = 'Chapter'; }

    // Pattern: kf7 [num] (e.g., "kf7 !", "kf7 @")
    if (!m) {
      m = line.match(/^kf7\s+([!@#$%^&*()\d]+)$/);
      if (m) { isEntry = true; numStr = m[1]; labelType = 'Chapter'; }
    }

    // Pattern: [num]= (e.g., "!=", "@=", "#=", "!)=")
    if (!m) {
      m = line.match(/^([!@#$%^&*()\d]+)=\s*$/);
      if (m) { isEntry = true; numStr = m[1]; labelType = 'Unit'; }
    }

    // Pattern: standalone [num] that's followed by a title (not another number) on next line
    // e.g. "!" then "Title" then page number
    if (!m) {
      m = line.match(NN);
      if (m) {
        const nextLine = i + 1 < tocLines.length ? tocLines[i + 1] : '';
        if (nextLine && !NN.test(nextLine)) {
          isEntry = true; numStr = m[0]; labelType = 'Unit';
        }
      }
    }

    // Pattern: "•=;=" or "j|m=;=" (TOC header markers, skip)
    if (!isEntry && /^[•j]\S*=/.test(line)) {
      continue;
    }

    if (!isEntry) {
      // Also handle PsfO unit headers (e.g., "PsfO ! M Title")
      m = line.match(/^PsfO\s+([!@#$%^&*()\d]+)\s*[M:]\s*(.+)/);
      if (m) {
        const unitTitle = m[2].trim();
        entries.push({
          title: 'Unit ' + parseInt(toArabic(m[1])) + ': ' + unitTitle,
          page: -1, isUnit: true
        });
        continue;
      }
      // Skip column headers
      if (/^(PsfO|zLif\{s|ljwf|ljifoIf]q)/.test(line)) continue;
      if (/^k\[i7/.test(line)) continue;
      // Skip generic TOC structure lines
      if (line.startsWith('j|m=') || line.startsWith('•=')) continue;
      continue;
    }

    const chNum = parseInt(toArabic(numStr));

    // Look ahead for title and page
    const lookAhead = [];
    for (let k = 1; k <= 5 && i + k < tocLines.length; k++) {
      const nl = tocLines[i + k];
      if (!nl) continue;
      if (nl.match(/^(kf7|PsfO)/) || nl.match(/^[!@#$%^&*()\d]+=\s*$/)) break;
      lookAhead.push(nl);
    }

    if (lookAhead.length === 0) continue;

    const title = lookAhead[0];
    if (!title || title.length < 2) continue;

    // Find the page number in lookAhead
    let pageNum = -1;
    let pageIdx = -1;

    for (let k = 1; k < lookAhead.length; k++) {
      const candidate = toArabic(lookAhead[k]);
      if (/^\d+$/.test(candidate) && parseInt(candidate) > 0) {
        pageNum = parseInt(candidate);
        pageIdx = k;
        break;
      }
    }

    // If no page found in lookAhead, try the title itself (for "Title 23" format)
    if (pageNum < 0) {
      const titleMatch = title.match(/^(.+?)\s+(\d+)$/);
      if (titleMatch) {
        entries.push({
          title: labelType + ' ' + chNum + ': ' + titleMatch[1].trim(),
          page: parseInt(titleMatch[2])
        });
        continue;
      }
    }

    if (pageNum > 0) {
      entries.push({
        title: labelType + ' ' + chNum + ': ' + title,
        page: pageNum
      });
      i += pageIdx;
    }
  }

  const seenPages = new Set();
  const unique = entries.filter(e => {
    if (e.page < 1 || seenPages.has(e.page)) return false;
    seenPages.add(e.page);
    return true;
  });

  return unique.length > 0 ? unique : null;
}

// ===== English Numbered TOC Parser =====
// Handles:
//   Contents
//   S.No.	Unit	Page No.
//   1.	Computer System	1
//   2.	Number System	41
function parseEnglishNumberedTOC(lines) {
  let tocStart = -1;
  for (const kw of ['Contents', 'Table of Contents', 'CONTENTS']) {
    for (let i = 0; i < Math.min(300, lines.length); i++) {
      if (lines[i].trim() === kw) { tocStart = i; break; }
    }
    if (tocStart >= 0) break;
  }
  if (tocStart < 0) return null;

  let tocEnd = tocStart + 1;
  for (let i = tocStart + 1; i < Math.min(tocStart + 200, lines.length); i++) {
    if (/^--- Page /.test(lines[i])) { tocEnd = i; break; }
  }
  if (tocEnd <= tocStart) tocEnd = Math.min(tocStart + 100, lines.length);

  // Find column headers (S.No., Unit, Page No.)
  let dataStart = tocStart + 1;
  for (let i = tocStart + 1; i < tocEnd; i++) {
    const t = lines[i].trim().toLowerCase();
    if (/s\.?no/i.test(t) || /sn\.?\b/i.test(t) || (/page/i.test(t) && /unit/i.test(t))) {
      dataStart = i + 1;
      continue;
    }
    if (/^no\.?\b/i.test(t)) { dataStart = i + 1; continue; }
  }

  const entries = [];
  for (let i = dataStart; i < tocEnd; i++) {
    const t = lines[i].trim();
    if (!t) continue;
    if (/^--- Page /.test(t)) break;

    // Pattern: "1.  Title  PageNo" or "1.  Title PageNo"  
    let m = t.match(/^(\d+)\.\s+(.+?)(?:\t+|\s{2,})(\d+)$/);
    if (!m) {
      // Try: "1  Title  PageNo" (without dot)  
      m = t.match(/^(\d+)\s{2,}(.+?)(?:\t+|\s{2,})(\d+)$/);
    }
    if (!m) {
      // Try: "1. Title" with page on next line
      m = t.match(/^(\d+)\.\s+(.+)$/);
      if (m) {
        const title = m[2].trim();
        const nextLine = i + 1 < tocEnd ? lines[i + 1].trim() : '';
        // Check if page number is after title (separated by whitespace)
        const pg = title.match(/^(.*?)\s{2,}(\d+)$/);
        if (pg) {
          entries.push({ title: pg[1].trim(), page: parseInt(pg[2]) });
          continue;
        }
        // Or next line is just a number
        if (/^\d+$/.test(nextLine)) {
          entries.push({ title, page: parseInt(nextLine) });
          i++;
          continue;
        }
      }
    }
    if (m) {
      const title = m[2].trim();
      const pageNum = parseInt(m[3]);
      if (pageNum > 0 && title.length > 2) {
        entries.push({ title, page: pageNum });
      }
    }
  }

  return entries.length > 0 ? entries : null;
}

const SECTION_RE = /^(Reading\s*[Iv]*|Speaking|Listening|Grammar\s*[Iv]*|Writing|Pronunciation|Vocabulary|Project Work|Fun Corner|Extra Bit|Summary)\s*$/i;

// ===== Nepali TOC Parser =====
// Parses TOC with PsfO/kf7 entries like:
//   PsfO ! M xfdL, xfd|f] ;d'bfo / /fi6«
//   kf7 !  ljsf;  @
//   kf7 @  ;ª\3Lo /fHo / k|b]z  $
function parseNepaliTOC(lines) {
  // Find TOC start: look for ljifo ;"rL (Table of Contents in Nepali) or PsfO entry
  let tocStart = -1;
  for (let i = 0; i < Math.min(300, lines.length); i++) {
    const t = lines[i].trim();
    if (/^ljifo\s*;"rL/i.test(t) || /^v\w\s*;/.test(t) && i < 10) {
      tocStart = i; break;
    }
  }
  // If no Nepali TOC header, search for PsfO entries in early pages
  if (tocStart < 0) {
    for (let i = 0; i < Math.min(400, lines.length); i++) {
      const t = lines[i].trim();
      if (/^PsfO\s+[!@#$%^&*()\d]+/.test(t) || /^PsfO[—\-]\w+/.test(t)) {
        tocStart = i; break;
      }
    }
  }
  if (tocStart < 0) return null;

  // Find TOC end: next page marker or content start
  let tocEnd = Math.min(tocStart + 300, lines.length);

  const entries = [];
  let currentUnit = '';
  let unitNum = '';

  for (let i = tocStart; i < tocEnd; i++) {
    const t = lines[i].trim();
    // Skip page markers within multi-page TOC instead of breaking
    if (/^--- Page /.test(t)) continue;

    // PsfO M! Title or PsfO ! M? Title or PsfO—Ps Title
    let m = t.match(/^PsfO\s+[M]?\s*([!@#$%^&*()\d]+)\s*(?:[M:]\s*)?(.+)/);
    if (!m) {
      const neWord = t.match(/^PsfO[-—](.+?)\s+(.+)/);
      if (neWord) {
        unitNum = toArabic(neWord[1].replace(/[!@#$%^&*()]/g, c => NEPALI_NUM[c] || c));
        currentUnit = 'Unit ' + unitNum + ': ' + neWord[2].trim();
        entries.push({ title: currentUnit, page: -1, isUnit: true });
        continue;
      }
      // PsfO word numbers with space: PsfO Ps, PsfO b'O{, PsfO tLg, PsfO rf/, PsfO kf"r, PsfO 5
      const wordMatch = t.match(/^PsfO\s+(\S+)\s*$/);
      if (wordMatch) {
        let numVal = NEPALI_WORD_NUMS[wordMatch[1]];
        if (!numVal) {
          const norm = wordMatch[1].replace(/['"]/g, '');
          for (const [k, v] of Object.entries(NEPALI_WORD_NUMS)) {
            if (k.replace(/['"]/g, '') === norm) { numVal = v; break; }
          }
        }
        if (numVal) {
          const next1 = i + 1 < tocEnd ? lines[i + 1].trim() : '';
          if (next1 && !next1.match(/^kf7|^PsfO/) && next1.length > 2) {
            unitNum = numVal;
            currentUnit = 'Unit ' + numVal + ': ' + next1;
            entries.push({ title: currentUnit, page: -1, isUnit: true });
            continue;
          }
        }
      }
    }
    if (m) {
      unitNum = toArabic(m[1]);
      currentUnit = 'Unit ' + unitNum + ': ' + m[2].trim();
      entries.push({ title: currentUnit, page: -1, isUnit: true });
      continue;
    }

    // kf7 ! Title pageNum OR kf7 ! \t Title \t pageNum
    m = t.match(/^kf7\s+([!@#$%^&*()\d]+)\s+([^0-9!@#$%^&*()].*?)\s*([!@#$%^&*()\d]+)$/);
    if (m) {
      const chNum = toArabic(m[1]);
      const chTitle = m[2].trim();
      const chPage = parseInt(toArabic(m[3]));
      const entry = { title: 'Chapter ' + chNum + ': ' + chTitle, page: chPage };
      if (currentUnit) entry.unit = currentUnit;
      entries.push(entry);
      continue;
    }

    // kf7 ! (no title on same line, look at next lines)
    m = t.match(/^kf7\s+([!@#$%^&*()\d]+)\s*$/);
    if (m) {
      const chNum = toArabic(m[1]);
      // Look ahead for title on next line and page on line after
      const next1 = i + 1 < tocEnd ? lines[i + 1].trim() : '';
      const next2 = i + 2 < tocEnd ? lines[i + 2].trim() : '';
      const next3 = i + 3 < tocEnd ? lines[i + 3].trim() : '';

      if (next1 && !next1.match(/^kf7|^PsfO/) && !/^\d+$/.test(next1)) {
        const title = next1;
        // Page can be on next line or the one after
        if (/^[!@#$%^&*()\d]+$/.test(next2)) {
          const page = parseInt(toArabic(next2));
          entries.push({ title: 'Chapter ' + chNum + ': ' + title, page });
          i += 2;
        } else if (/^[!@#$%^&*()\d]+$/.test(next3)) {
          const page = parseInt(toArabic(next3));
          entries.push({ title: 'Chapter ' + chNum + ': ' + title, page });
          i += 3;
        } else {
          entries.push({ title: 'Chapter ' + chNum + ': ' + title, page: -1 });
          i += 1;
        }
      } else if (/^\d+$/.test(next1)) {
        entries.push({ title: 'Chapter ' + chNum, page: parseInt(next1) });
        i += 1;
      }
    }
  }

  // Clean up: keep only entries with page numbers, deduplicate
  const unique = [];
  const seenPages = new Set();
  for (const e of entries) {
    if (e.page > 0 && !seenPages.has(e.page)) {
      seenPages.add(e.page);
      unique.push(e);
    }
  }

  return unique.length > 0 ? unique : null;
}

// ===== Markdown Table TOC Parser =====
function parseMarkdownTableTOC(lines) {
  let tocStart = -1;
  // Match ONLY markdown table rows
  for (let i = 0; i < Math.min(lines.length, 300); i++) {
    const t = lines[i].trim().toLowerCase();
    if (!t.startsWith('|')) continue;
    if (t.includes('unit') && t.includes('page')) { tocStart = i; break; }
    if (t.includes('chapter') && t.includes('page')) { tocStart = i; break; }
    if (t.includes('lesson') && t.includes('page')) { tocStart = i; break; }
    if (t.includes('topic') && t.includes('page')) { tocStart = i; break; }
    if (/ljifo;"rL/.test(t) || /k\[i7/.test(t) || /\bj\|m=;=\b/.test(t)) { tocStart = i; break; }
  }
  if (tocStart < 0) return null;
  if (tocStart + 1 >= lines.length) return null;
  if (!/^\|[\s\-:]+\|/.test(lines[tocStart + 1].trim())) return null;

  // Detect if header row indicates chapters (kf7) vs units
  const headerRow = lines[tocStart].toLowerCase();
  const isChapterContext = headerRow.includes('kf7') || headerRow.includes('chapter');

  const entries = [];
  for (let i = tocStart + 2; i < Math.min(tocStart + 80, lines.length); i++) {
    const t = lines[i].trim();
    if (!t) continue;
    // For mixed format tables, also parse non-table Nepali rows
    if (!t.startsWith('|')) {
      const nm = t.match(/^(kf7|PsfO)\s+[–-]?\s*([!@#$%^&*()\d]+)\s+(.+?)\s*([!@#$%^&*()\d]+)$/);
      if (nm) {
        const prefix2 = nm[1] === 'PsfO' ? 'Unit' : 'Chapter';
        const num = parseInt(toArabic(nm[2]));
        const title2 = nm[3].trim();
        const page2 = parseInt(toArabic(nm[4]));
        entries.push({ title: prefix2 + ' ' + num + ': ' + title2, page: page2 });
        continue;
      }
      break;
    }
    // Skip separator lines (all dashes/colons)
    if (/^[\s\-:]+$/.test(t.replace(/\|/g, '').trim())) continue;
    const cells = t.split('|').map(c => c.trim()).filter(c => c);
    if (cells.length < 2) continue;
    // First cell: extract unit/chapter number from "Unit 1", "PsfO !", "kf7 !" or just "1"
    let unitNum = null, title = cells[1], prefix = 'Unit';
    let um = cells[0].match(/^(?:Unit|Lesson)\s+(\d+)$/i);
    if (um) {
      unitNum = parseInt(um[1]);
    } else {
      // Nepali kf7 patterns: "kf7 !", "kf7–!", "kf7 – !"
      um = cells[0].match(/^(kf7)\s*[–-]?\s*([!@#$%^&*()\d]+)\s*$/i);
      if (um) {
        prefix = 'Chapter';
        unitNum = parseInt(toArabic(um[2]));
        if (!title && cells.length >= 3) title = cells[2];
        if (!title) title = cells[0].replace(/^kf7\s*[–-]?\s*[!@#$%^&*()\d]+\s*/i, '').trim();
      } else {
        um = cells[0].match(/^(PsfO)\s+([!@#$%^&*()\d]+)$/i);
        if (um) {
          prefix = 'Unit';
          unitNum = parseInt(toArabic(um[2]));
          if (!title) title = cells[0].replace(/^PsfO\s+[!@#$%^&*()\d]+\s*/i, '').trim();
          if (!title && cells.length >= 3) title = cells[2];
        } else {
          um = cells[0].match(/^(\d+)$/);
          if (um) {
            unitNum = parseInt(um[1]);
            if (isChapterContext) prefix = 'Chapter';
          } else {
            // Preeti numeral chapter number like !, @, #, $, etc.
            const ar = toArabic(cells[0]);
            if (/^\d+$/.test(ar)) {
              unitNum = parseInt(ar);
              if (isChapterContext) prefix = 'Chapter';
            } else if (/^\d+$/.test(cells[1]) && cells.length >= 3) {
            unitNum = parseInt(cells[1]);
            title = cells[2];
            if (isChapterContext) prefix = 'Chapter';
          }
        }
      }
    }
  }
    if (unitNum === null) continue;
    if (title) title = title.replace(/\s*\([^)]*\)\s*/g, '').trim();
    const label = prefix + ' ' + unitNum + ': ' + (title || '(untitled)');
    // last cell is page (might be Nepali numerals like !, @, #)
    // Handle page ranges like "1 – 13" or "1-13"
    let pageStr = cells[cells.length - 1];
    const rangeMatch = pageStr.match(/^(\d+)\s*[–-]\s*/);
    if (rangeMatch) pageStr = rangeMatch[1];
    let pageNum = parseInt(pageStr);
    if (isNaN(pageNum)) {
      pageNum = parseInt(toArabic(pageStr.replace(/[!@#$%^&*()]/g, c => NEPALI_NUM[c] || c)));
    }
    if (!isNaN(pageNum)) {
      entries.push({ title: label, page: pageNum });
    }
  }
  return entries.length > 0 ? entries : null;
}

// ===== English Stacked TOC Parser =====
function parseStackedTOC(lines) {
  let tocStart = -1, tocEnd = -1, tocPageMarker = -1;
  for (const em of [{w:'Contents'}, {w:'Table of Contents'}, {w:'Table of Content'}]) {
    for (let i = 0; i < Math.min(lines.length, 300); i++) {
      if (lines[i].trim() === em.w) {
        tocStart = i;
        // Find the page this is on
        for (let j = i; j >= 0; j--) {
          const m = lines[j].match(/^--- Page (\d+) ---$/);
          if (m) { tocPageMarker = parseInt(m[1]); break; }
        }
        break;
      }
    }
    if (tocStart >= 0) break;
  }
  if (tocStart < 0) return null;

  // Find TOC end
  for (let i = tocStart + 1; i < lines.length; i++) {
    if (/^--- Page /.test(lines[i])) { tocEnd = i; break; }
  }
  if (tocEnd < 0) tocEnd = Math.min(tocStart + 300, lines.length);

  // Find the printed page number offset
  let printedPage1 = 1, pdfOffset = 5;
  for (let i = tocEnd; i < Math.min(tocEnd + 5, lines.length); i++) {
    const t = lines[i].trim();
    // t might be the page marker itself
  }
  // Use the next page marker after TOC as the first content page
  const nextPM = (() => { for (let i = tocEnd + 1; i < lines.length; i++) {
    const m = lines[i].match(/^--- Page (\d+) ---$/); if (m) return m[1]; } return '5'; })();
  const firstContentPage = parseInt(nextPM);
  // Find printed "1" on the first content page
  for (let i = lines.findIndex((l, idx) => idx > tocEnd && /^--- Page /.test(l)) + 1; i < Math.min(lines.length, lines.findIndex((l, idx) => idx > tocEnd && /^--- Page /.test(l)) + 10); i++) {
    if (/^\d+$/.test(lines[i].trim())) { printedPage1 = parseInt(lines[i].trim()); break; }
  }
  if (printedPage1 > 0) pdfOffset = firstContentPage - printedPage1;

  const entries = [];
  // Look for entries: Unit/Lesson header, title, page number stacked
  for (let i = tocStart + 1; i < tocEnd - 2; i++) {
    const l1 = lines[i].trim();
    const l2 = i + 1 < tocEnd ? lines[i + 1].trim() : '';
    const l3 = i + 2 < tocEnd ? lines[i + 2].trim() : '';

    let m = l1.match(/^(Unit|Lesson)\s+(.+)$/i);
    if (!m) {
      // "UNIT" on one line, "ONE" on next
      if (/^UNIT$/.test(l1) && /^(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)$/i.test(l2)) {
        const label = 'Unit ' + l2.charAt(0).toUpperCase() + l2.slice(1).toLowerCase();
        if (/^\d+$/.test(l3)) {
          entries.push({ title: label, page: parseInt(l3) + pdfOffset });
        } else {
          entries.push({ title: label + (l3 ? ': ' + l3 : ''), page: -1 });
        }
        i += 2; continue;
      }
      continue;
    }

    const heading = m[1] + ' ' + m[2];
    if (/^\d+$/.test(l3)) {
      entries.push({ title: heading + (l2 ? ': ' + l2 : ''), page: parseInt(l3) + pdfOffset });
      i += 2;
    } else if (l2 && (/^\d+$/.test(l2))) {
      entries.push({ title: heading, page: parseInt(l2) + pdfOffset });
      i += 1;
    }
  }

  // Also detect body-based Unit/Lesson headings
  const bodyChapters = [];
  for (const pm of (() => { const p = []; for (let j = 0; j < lines.length; j++) { const m = lines[j].match(/^--- Page (\d+) ---$/); if (m) p.push({line: j, page: parseInt(m[1])}); } return p; })()) {
    if (pm.page < firstContentPage) continue;
    const endLine = Math.min(pm.line + 15, lines.length);
    for (let j = pm.line + 1; j < endLine; j++) {
      const t = lines[j].trim();
      const m = t.match(/^(Unit|Lesson)\s+(\w+)$/i);
      if (m) {
        let title = m[1] + ' ' + m[2];
        if (j + 1 < endLine) {
          const n = lines[j + 1].trim();
          if (n && !n.match(/^(Unit|Lesson|Curriculum|Moral)/i) && n.length > 5 && !/^\d+$/.test(n)) {
            title += ': ' + n;
          }
        }
        bodyChapters.push({ title, page: pm.page });
        break;
      }
      // "UNIT" on one line, "ONE" on next (body version)
      const uMatch = t.match(/^(UNIT|Unit)\s*$/);
      if (uMatch && j + 1 < endLine) {
        const n = lines[j + 1].trim();
        if (n.match(/^(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)$/i) || /^\d+$/.test(n)) {
          bodyChapters.push({ title: 'Unit ' + n, page: pm.page });
          break;
        }
      }
    }
  }

  // Merge: prefer TOC entries, fill gaps with body entries
  const usedPages = new Set(entries.map(e => e.page));
  for (const bc of bodyChapters) {
    if (!usedPages.has(bc.page)) {
      entries.push(bc);
      usedPages.add(bc.page);
    }
  }

  return entries.length > 0 ? entries.filter(e => e.page > 0) : null;
}

// ===== Map TOC page numbers to PDF page numbers =====
function mapPagesToPDF(chapters, pageMarkers, firstContentPage, lines) {
  if (!chapters || chapters.length === 0) return null;
  if (chapters[0].page >= firstContentPage) return chapters;

  let printedPage1 = 1;
  for (const pm of pageMarkers) {
    if (pm.page >= firstContentPage && lines) {
      for (let j = pm.line + 1; j < Math.min(pm.line + 5, lines.length); j++) {
        const t = lines[j].trim();
        if (/^\d+$/.test(t)) { printedPage1 = parseInt(t); break; }
      }
      break;
    }
  }

  const offset = firstContentPage - printedPage1;
  return chapters.filter(ch => ch.page > 0).map(ch => ({
    title: ch.title,
    page: ch.page + offset,
  }));
}

// ===== Strategy selector =====
function extractFromFile(className, filename, textbookKey) {
  const filepath = join(TEXTBOOKS_DIR, className, filename);
  let content;
  try { content = readFileSync(filepath, 'utf-8'); }
  catch { return null; }

  const rawLines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const pageMarkers = getPageMarkers(rawLines);

  const hasReversed = (() => {
    const words = ['stnetnoC','elbaT','tinU','egaP','srebmuN','egasseM','rehpaxe','noitiddA'];
    let c = 0;
    for (let i = 50; i < Math.min(300, rawLines.length); i++) {
      for (const w of words) { if (rawLines[i].toLowerCase().includes(w)) c++; }
    }
    return c >= 3;
  })();

  let lines = rawLines;

  let chapters = null;

  const firstContentPage = pageMarkers.length > 4 ? pageMarkers[4].page : (pageMarkers.length > 0 ? pageMarkers[0].page : 1);

  // Collect candidates from all strategies
  const allCandidates = [];

  // 1. Nepali stacked TOC (ljifo;"rL with vertically stacked entries)
  let stacked = parseNepaliStackedTOC(lines);
  if (stacked && stacked.length > 0) {
    stacked = mapPagesToPDF(stacked, pageMarkers, firstContentPage, lines);
    if (stacked) allCandidates.push(stacked);
  }

  // 2. Nepali PsfO/kf7 TOC parser (for non-stacked formats)
  let nepaliToc = parseNepaliTOC(lines);
  if (nepaliToc && nepaliToc.length > 0) {
    nepaliToc = mapPagesToPDF(nepaliToc, pageMarkers, firstContentPage, lines);
    if (nepaliToc) allCandidates.push(nepaliToc);
  }

  // For reversed text, reverse words and try again
  if (hasReversed) {
    lines = rawLines.map(l => l.replace(/[a-zA-Z]+/g, w => w.split('').reverse().join('')));
  }

  // For all texts, try English parsers
  // 3. Numbered TOC (Contents with 1. Title PageNo)
  let numbered = parseEnglishNumberedTOC(lines);
  if (numbered && numbered.length > 0) {
    numbered = mapPagesToPDF(numbered, pageMarkers, firstContentPage, lines);
    if (numbered) allCandidates.push(numbered);
  }

  // 4. Stacked TOC
  let stackedToc = parseStackedTOC(lines);
  if (stackedToc && stackedToc.length > 0) {
    stackedToc = mapPagesToPDF(stackedToc, pageMarkers, firstContentPage, lines);
    if (stackedToc) allCandidates.push(stackedToc);
  }

  // 5. Markdown table TOC
  let mdTable = parseMarkdownTableTOC(lines);
  if (mdTable && mdTable.length > 0) {
    mdTable = mapPagesToPDF(mdTable, pageMarkers, firstContentPage, lines);
    if (mdTable) allCandidates.push(mdTable);
  }

  // 6. Body scan for inline unit/chapter headings
  const bodyCh = [];
  for (const pm of pageMarkers) {
    if (pm.page < 5) continue;
    const start = pm.line + 1;
    const end = Math.min(start + 15, lines.length);
    for (let i = start; i < end; i++) {
      const t = lines[i].trim();
      let title = null;
      if (t.match(/^(Unit|Lesson)\s+(\w+)$/i)) {
        const m = t.match(/^(Unit|Lesson)\s+(\w+)$/i);
        title = m[1] + ' ' + m[2];
        if (i + 1 < end) {
          const n = lines[i+1].trim();
          if (n && n.length > 5 && !n.match(/^(Unit|Lesson|Curriculum|Moral|Computer)/i) && !/^\d+$/.test(n)) title += ': ' + n;
        }
      }
      // Also detect Nepali kf7 body headings
      if (!title) {
        let km = t.match(/^kf7\s+[!@#$%^&*()\d]+\s/) || t.match(/^kf7\s+[!@#$%^&*()\d]+$/);
        if (km) {
          title = t.replace(/\s+/g, ' ').trim();
        } else if (/^kf7$/i.test(t) && i + 1 < end) {
          // kf7 alone on line, number on next line, title on previous
          const nextNum = lines[i + 1].trim();
          if (/^[!@#$%^&*()\d]+$/.test(nextNum)) {
            const prev = i > start ? lines[i - 1].trim() : '';
            if (prev && prev.length > 3 && !prev.match(/^kf7|^PsfO/) && !/^--- Page /.test(prev)) {
              title = 'kf7 ' + toArabic(nextNum) + ': ' + prev;
            } else {
              title = 'kf7 ' + toArabic(nextNum);
            }
          }
        }
        if (title && title.length > 100) title = title.substring(0, 100);
      }
      if (title) { bodyCh.push({ title, page: pm.page }); break; }
    }
  }
  if (bodyCh.length > 0) allCandidates.push(bodyCh);

  // Pick the candidate with the most valid entries (page >= 5)
  if (allCandidates.length > 0) {
    allCandidates.sort((a, b) => {
      const validA = a.filter(c => c.page >= 5).length;
      const validB = b.filter(c => c.page >= 5).length;
      return validB - validA;
    });
    chapters = allCandidates[0];
  }

  if (!chapters || chapters.length === 0) return null;

  // Filter: must be on or after content page 1, title < 100 chars
  chapters = chapters.filter(ch => ch.page >= 1 && ch.title.length < 100);

  // Deduplicate by page
  const seen = new Set();
  chapters = chapters.filter(ch => { const k = ch.page; if (seen.has(k)) return false; seen.add(k); return true; });
  chapters.sort((a, b) => a.page - b.page);

  // Apply PDF page offset for textbooks with front matter
  const offset = pdfPageOffsets[textbookKey] || 0;
  if (offset > 0) {
    chapters = chapters.map(ch => ({ ...ch, page: ch.page + offset }));
  }

  return chapters.map(ch => ({
    title: ch.title.replace(/\s+/g, ' ').trim(),
    page: ch.page,
    sections: [],
  }));
}

function main() {
  const result = {};
  let totalCh = 0;
  let ok = 0;

  for (const [key, filename] of Object.entries(textbookMap)) {
    const [cls] = key.split('|');
    process.stdout.write(`${key}... `);
    const data = extractFromFile(cls, filename, key);
    if (data && data.length > 0) {
      // Convert pseudo-Nepali titles to Unicode Devanagari
      const needsConversion = isNepaliBook(key) || data.some(ch =>
        /[\]\[|ˈ{}\\]/.test(ch.title.replace(/^(?:Unit|Chapter|Lesson)\s+\d+:\s*/, ''))
      );
      if (needsConversion) {
        for (const ch of data) {
          const m = ch.title.match(/^((?:Unit|Chapter|Lesson)\s+\d+:\s*)(.*)/);
          if (m) {
            ch.title = m[1] + toUnicodeNepali(m[2]);
          } else {
            ch.title = toUnicodeNepali(ch.title);
          }
        }
      }
      result[key] = data;
      totalCh += data.length;
      ok++;
      console.log(`[OK] ${data.length} ch`);
    } else {
      console.log(`[NO]`);
    }
  }

  let out = `// Auto-generated chapter map with sections\n`;
  out += `// Generated on ${new Date().toISOString().split('T')[0]}\n`;
  out += `export interface SectionEntry { title: string; page: number; }\n`;
  out += `export interface ChapterEntry { title: string; page: number; sections: SectionEntry[]; }\n\n`;
  out += `const chapterMap: Record<string, ChapterEntry[]> = {\n`;

  for (const key of Object.keys(result).sort()) {
    const chs = result[key];
    if (!chs.length) continue;
    out += `  "${key}": [\n`;
    for (const ch of chs) {
      out += `    { title: ${JSON.stringify(ch.title)}, page: ${ch.page}, sections: [] },\n`;
    }
    out += `  ],\n`;
  }
  out += `};\n\nexport default chapterMap;\n`;

  writeFileSync('src/chapterMap.ts', out, 'utf-8');
  console.log(`\nDone: ${ok}/87 textbooks, ${totalCh} chapters → src/chapterMap.ts`);
}

main();
