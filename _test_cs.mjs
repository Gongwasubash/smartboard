const N = {'!':1,'@':2,'#':3,'$':4,'%':5,'^':6,'&':7,'*':8,'(':9,')':6};
function toA(s) { let r = ''; for (const ch of s) { r += N[ch] !== undefined ? String(N[ch]) : ch; } return r.replace(/\D/g,''); }

const lines = require('fs').readFileSync('E:/smatoroai/public/textbooks/Class 10/Class 10 Computer Science.md','utf-8').replace(/\r/g,'').split('\n');

let tocStart = -1;
for (let i = 0; i < Math.min(lines.length, 300); i++) {
    const t = lines[i].trim().toLowerCase();
    if (t.includes('unit') && t.includes('page')) { tocStart = i; break; }
    if (t.includes('chapter') && t.includes('page')) { tocStart = i; break; }
    if (t.includes('lesson') && t.includes('page')) { tocStart = i; break; }
    if (t.includes('topic') && t.includes('page')) { tocStart = i; break; }
    if (/[lj][ijf][fo];"rL|k\[i7|j\|m=;=|PsfO|kf7/i.test(t)) { tocStart = i; break; }
}
console.log('tocStart:', tocStart);

if (tocStart < 0) { console.log('NO TOC found'); process.exit(1); }

const headerLine = lines[tocStart].trim();
console.log('headerLine:', headerLine);
console.log('startsWith |:', headerLine.startsWith('|'));

const nextLine = lines[tocStart + 1]?.trim();
console.log('nextLine:', nextLine);
console.log('separator test:', /^\|[\s\-:]+\|/.test(nextLine));

if (!headerLine.startsWith('|')) { console.log('FAIL: not table'); process.exit(1); }
if (!/^\|[\s\-:]+\|/.test(nextLine)) { console.log('FAIL: not separator'); process.exit(1); }

const entries = [];
for (let i = tocStart + 2; i < Math.min(tocStart + 80, lines.length); i++) {
    const t = lines[i].trim();
    if (!t) continue;
    if (!t.startsWith('|')) { console.log('break at', i, ':', t.substring(0,60)); break; }
    if (/^[\s\-:]+$/.test(t.replace(/\|/g, '').trim())) continue;
    const cells = t.split('|').map(c => c.trim()).filter(c => c);
    if (cells.length < 2) continue;
    console.log('i=' + i + ' cells:', JSON.stringify(cells));

    let unitNum = null, title = cells[1], prefix = 'Unit';
    let um = cells[0].match(/^(?:Unit|Lesson)\s+(\d+)$/i);
    if (um) {
        unitNum = parseInt(um[1]);
        console.log('  -> Unit match:', um[1]);
    } else {
        um = cells[0].match(/^(PsfO|kf7)\s+([!@#$%^&*()\d]+)$/);
        if (um) {
            prefix = um[1] === 'PsfO' ? 'Unit' : 'Chapter';
            unitNum = parseInt(toA(um[2]));
        } else {
            um = cells[0].match(/^(\d+)$/);
            if (um) unitNum = parseInt(um[1]);
            else if (/^\d+$/.test(cells[1]) && cells.length >= 3) {
                unitNum = parseInt(cells[1]);
                title = cells[2];
            }
        }
    }
    if (unitNum === null) { console.log('  -> no unitNum'); continue; }

    const label = prefix + ' ' + unitNum + ': ' + title;
    const pageStr = cells[cells.length - 1];
    let pageNum = parseInt(pageStr);
    if (isNaN(pageNum)) {
        pageNum = parseInt(toA(pageStr.replace(/[!@#$%^&*()]/g, c => N[c] || c)));
    }
    if (!isNaN(pageNum)) {
        entries.push({ title: label, page: pageNum });
        console.log('  -> PUSHED:', label, pageNum);
    } else {
        console.log('  -> invalid page:', pageStr);
    }
}
console.log('Total entries:', entries.length);
