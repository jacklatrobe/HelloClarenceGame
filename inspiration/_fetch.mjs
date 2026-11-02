// One-off helper used to seed the inspiration/ folder.
// Pulls store screenshots + capsule art + blurb for reference games.
// Not part of the game build. Safe to delete.
import { mkdir, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const games = [
  { dir: '01_papers-please', appid: 239030, max: 6 },
  { dir: '02_look-outside', appid: 3373660, max: 6 },
  { dir: '03_world-of-horror', appid: 913740, max: 5 },
  { dir: '04_beholder', appid: 475550, max: 5 },
  { dir: '05_do-not-feed-the-monkeys', appid: 658850, max: 5 },
  { dir: '06_not-tonight', appid: 733790, max: 5 },
];

// This file lives in inspiration/; write output alongside it.
const root = dirname(fileURLToPath(import.meta.url));

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return buf.length;
}

for (const g of games) {
  const meta = await fetch(
    `https://store.steampowered.com/api/appdetails?appids=${g.appid}&l=en`,
  ).then((r) => r.json());
  const data = meta[String(g.appid)]?.data;
  if (!data) {
    console.log(`skip ${g.dir}: no data`);
    continue;
  }
  const dir = resolve(root, g.dir);
  await mkdir(dir, { recursive: true });

  console.log(`\n== ${data.name} ==`);
  const shots = (data.screenshots || []).slice(0, g.max);
  for (let i = 0; i < shots.length; i++) {
    const url = shots[i].path_full.split('?')[0];
    const dest = resolve(dir, `screenshot-${String(i + 1).padStart(2, '0')}.jpg`);
    const n = await download(url, dest);
    console.log(`  shot ${i + 1}: ${(n / 1024).toFixed(0)} KB ${basename(dest)}`);
  }
  for (const [name, url] of [
    ['header', data.header_image],
    ['capsule', data.capsule_image],
  ]) {
    if (!url) continue;
    await download(url.split('?')[0], resolve(dir, `${name}.jpg`));
    console.log(`  ${name}: ok`);
  }

  const blurb =
    `# ${data.name}\n\n` +
    `- Steam appid: ${g.appid}\n` +
    `- Store: https://store.steampowered.com/app/${g.appid}/\n` +
    `- Developers: ${(data.developers || []).join(', ')}\n` +
    `- Publishers: ${(data.publishers || []).join(', ')}\n` +
    `- Released: ${data.release_date?.date ?? 'n/a'}\n` +
    `- Genres: ${(data.genres || []).map((x) => x.description).join(', ')}\n\n` +
    `## Store description\n\n${(data.short_description || '').trim()}\n`;
  await writeFile(resolve(dir, 'notes.md'), blurb);
}
console.log('\ndone');
