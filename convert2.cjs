const fs = require('fs');
const { convertFont } = require('preeti-to-unicode');

const text = fs.readFileSync('public/textbooks/Class 6/Class 6 Science (Nepali).md', 'utf8');

const lines = text.split('\n');
let currentPage = 0;
console.log('=== SECTION TITLES ===');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (/^--- Page (\d+) ---/.test(line)) {
    currentPage = parseInt(line.match(/^--- Page (\d+) ---/)[1]);
  }
  if (/^(\d+\.\d+)\s+(.+)/.test(line)) {
    const m = line.match(/^(\d+\.\d+)\s+(.+)/);
    const num = m[1];
    const title = m[2].trim();
    if (title.length > 5 && !title.includes("x'G5")) {
      const unicode = convertFont(title, 'preeti');
      console.log(num + ' (page ' + currentPage + '): ' + title + ' -> ' + unicode);
    }
  }
}
