const fs = require('fs');
const n = String(process.argv[2] || '').padStart(2, '0');
const wb = JSON.parse(fs.readFileSync(`workbook/batch-${n}.json`, 'utf8'));
const dpath = `decisions/batch-${n}.json`;
if (!fs.existsSync(dpath)) {
  console.error(`FALTA ${dpath}`);
  process.exit(1);
}
const dec = JSON.parse(fs.readFileSync(dpath, 'utf8'));
const byKey = new Map(wb.map(v => [`${v.book_id}|${v.chapter}:${v.verse}`, v]));
let errs = 0,
  empty = 0,
  notes = 0;
const seen = new Set();
for (const d of dec) {
  const key = `${d.book_id}|${d.chapter}:${d.verse}`;
  const w = byKey.get(key);
  if (!w) {
    console.error(`ERROR ${d.ref}: no pertenece a este batch`);
    errs++;
    continue;
  }
  seen.add(key);
  if (!Array.isArray(d.quotes)) {
    console.error(`ERROR ${d.ref}: quotes no es array`);
    errs++;
    continue;
  }
  if (d.quotes.length === 0) {
    console.warn(
      `VACIO ${d.ref}: quotes=[] ${d.note ? '(' + d.note + ')' : '(sin note!)'}`,
    );
    empty++;
  }
  let cursor = 0;
  for (const q of d.quotes) {
    if (typeof q !== 'string' || q.length === 0) {
      console.error(`ERROR ${d.ref}: fragmento vacio`);
      errs++;
      continue;
    }
    const at = w.rvr_text.indexOf(q, cursor);
    if (at === -1) {
      const anywhere = w.rvr_text.indexOf(q);
      console.error(
        `ERROR ${d.ref}: fragmento NO literal${anywhere > -1 ? ' (fuera de orden)' : ''}\n   buscado: ${JSON.stringify(q)}\n   rvr    : ${JSON.stringify(w.rvr_text)}`,
      );
      errs++;
      continue;
    }
    cursor = at + q.length;
  }
  if (d.note) notes++;
}
for (const [key, w] of byKey)
  if (!seen.has(key)) {
    console.error(`FALTA versiculo ${w.ref}`);
    errs++;
  }
console.log(
  `\nbatch-${n}: ${dec.length}/${wb.length} versiculos | errores: ${errs} | vacios: ${empty} | notes: ${notes}`,
);
process.exit(errs ? 1 : 0);
