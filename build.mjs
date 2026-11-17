// digests/*.md を読み、dist/ に静的サイトを生成する。
// Vercel の buildCommand (npm run build) から実行される。
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { marked } from 'marked';

const ROOT = process.cwd();
const DIGESTS_DIR = path.join(ROOT, 'digests');
const OUT_DIR = path.join(ROOT, 'dist');

const CSS = `
body { font-family: -apple-system, 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif; max-width: 760px; margin: 0 auto; padding: 24px 20px 64px; color: #1a1a1a; line-height: 1.8; }
a { color: #0b5fff; }
h1 { font-size: 1.6rem; line-height: 1.4; }
h2 { font-size: 1.25rem; margin-top: 2em; border-bottom: 1px solid #e5e5e5; padding-bottom: 4px; }
h3 { font-size: 1.05rem; margin-top: 1.6em; }
ul { padding-left: 1.4em; }
li { margin: 0.3em 0; }
blockquote { border-left: 3px solid #ddd; margin: 1em 0; padding: 0.2em 1em; color: #555; }
header { margin-bottom: 2em; }
.meta { color: #666; font-size: 0.9rem; }
.day-list { list-style: none; padding: 0; }
.day-list li { padding: 12px 0; border-bottom: 1px solid #eee; }
.day-list a { font-weight: 600; text-decoration: none; }
footer { margin-top: 3em; color: #888; font-size: 0.85rem; }
`;

function page({ title, body, meta = '' }) {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>${CSS}</style>
</head>
<body>
${body}
<footer><a href="https://github.com/Hapikunn/daily-research-digest">GitHub: Hapikunn/daily-research-digest</a></footer>
</body>
</html>`;
}

function firstHeading(md) {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : 'Daily Research Digest';
}

function scopeLine(md) {
  const m = md.match(/^対象期間：(.+)$/m);
  return m ? `対象期間：${m[1].trim()}` : '';
}

const files = (await readdir(DIGESTS_DIR))
  .filter((f) => f.endsWith('.md'))
  .sort()
  .reverse();

await mkdir(OUT_DIR, { recursive: true });

const entries = [];
for (const file of files) {
  const date = file.replace(/\.md$/, '');
  const md = await readFile(path.join(DIGESTS_DIR, file), 'utf-8');
  const title = firstHeading(md);
  const scope = scopeLine(md);
  const html = marked.parse(md);
  entries.push({ date, title, scope });
  await writeFile(
    path.join(OUT_DIR, `${date}.html`),
    page({
      title: `${title} — Daily Research Digest`,
      body: `<header><p class="meta"><a href="./">← 一覧に戻る</a> · ${date}</p></header>${html}`,
    }),
  );
}

const listItems = entries
  .map(
    (e) =>
      `<li><a href="./${e.date}.html">${e.date} — ${e.title}</a>${e.scope ? `<br><span class="meta">${e.scope}</span>` : ''}</li>`,
  )
  .join('\n');

await writeFile(
  path.join(OUT_DIR, 'index.html'),
  page({
    title: 'Daily Research Digest',
    body: `<header><h1>Daily Research Digest</h1><p class="meta">CVに基づく毎日の研究ダイジェスト。毎朝のブリーフィングと同じ内容をアーカイブしています。</p></header><ul class="day-list">${listItems}</ul>`,
  }),
);

console.log(`Built ${entries.length} day(s) into dist/`);
