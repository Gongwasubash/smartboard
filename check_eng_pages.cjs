const fs = require('fs');
const zlib = require('zlib');
const buf = fs.readFileSync('E:\\smatoroai\\public\\textbooks\\Class 10\\Class 10 Compulsory English.pdf');
const text = buf.toString('ascii');

function getObjDef(objNum) {
  const idx = text.indexOf(objNum + ' 0 obj');
  if (idx < 0) return null;
  return text.substring(idx, text.indexOf('endobj', idx) > 0 ? text.indexOf('endobj', idx) : idx + 1000);
}

function getKids(objNum) {
  const def = getObjDef(objNum);
  if (!def) return null;
  const ki = def.indexOf('/Kids[');
  if (ki < 0) return [];
  const ke = def.indexOf(']', ki);
  return (def.substring(ki, ke).match(/\d+/g) || []).filter(o => parseInt(o) > 0).map(Number);
}

function getUniqueStream(pageObjNum) {
  const def = getObjDef(pageObjNum);
  if (!def) return null;
  const cs = def.indexOf('/Contents[');
  if (cs < 0) return null;
  const ce = def.indexOf(']', cs);
  const streams = def.substring(cs, ce).match(/\d+/g);
  return streams && streams.length >= 4 ? parseInt(streams[2]) : null;
}

function getStreamText(objNum) {
  const idx = text.indexOf(objNum + ' 0 obj');
  if (idx < 0) return null;
  const si = text.indexOf('stream\n', idx);
  if (si < 0) return null;
  const ei = text.indexOf('\nendstream', si);
  if (ei < 0) return null;
  const compressed = buf.slice(si + 7, ei);
  try { return zlib.inflateSync(compressed).toString('utf8'); }
  catch(e) { try { return zlib.inflateRawSync(compressed).toString('utf8'); } catch(e2) { return null; } }
}

function traverse(objNum) {
  const kids = getKids(objNum);
  if (!kids || kids.length === 0) return [objNum];
  let r = [];
  for (const k of kids) r = r.concat(traverse(k));
  return r;
}

// Find root
let tpos = 0;
while (true) {
  const ki = text.indexOf('/Kids[', tpos);
  if (ki < 0) break;
  const before = text.substring(Math.max(0, ki - 200), ki);
  if (before.includes('/Type/Pages')) {
    const firstKid = parseInt((text.substring(ki, text.indexOf(']', ki)).match(/\d+/g) || []).filter(o => parseInt(o) > 0)[0]);
    const allPages = traverse(firstKid);
    console.log('Total pages: ' + allPages.length);

    // Show raw content for pages 8-10 (around where page 1 content starts)
    for (let i = 7; i < 11; i++) {
      const stream = getUniqueStream(allPages[i]);
      if (stream) {
        const raw = getStreamText(stream);
        if (raw) {
          console.log('\n=== PDF page ' + (i+1) + ' (obj ' + allPages[i] + ', stream ' + stream + ') ===');
          // Show first 500 chars and last 500 chars
          console.log('START:', raw.substring(0, 500));
          // Find numbers near the end (page numbers are usually at the bottom)
          const lines = raw.split('\n');
          console.log('END:', lines.slice(-10).join('\n'));
        }
      }
    }
    break;
  }
  tpos = text.indexOf(']', ki) + 1;
}
