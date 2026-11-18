const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const origin = 'https://brasabetbr.com';
const prefix = '/releases/20261117234105344-1f7bfdfb6fde/assets/';
const map = fs.existsSync('src/data/sports-assets.json') ? JSON.parse(fs.readFileSync('src/data/sports-assets.json')) : {};
const pending = new Set();
const saved = fs.existsSync('evidence/assets.json') ? JSON.parse(fs.readFileSync('evidence/assets.json')).saved || [] : [];
fs.mkdirSync('public/assets', { recursive: true });
fs.mkdirSync('src/data', { recursive: true });
function localPath(url) {
  const absolute = new URL(url, origin).href;
  if (map[url]) return map[url];
  const parsed = new URL(absolute);
  const filename = parsed.pathname.startsWith(prefix)
    ? parsed.pathname.slice(prefix.length)
    : 'remote/' + crypto.createHash('sha256').update(absolute).digest('hex').slice(0,18) + path.extname(parsed.pathname);
  const target = '/assets/' + filename;
  map[url] = map[absolute] = map[parsed.pathname] = target;
  return target;
}
function save(url, bytes) {
  const dest = localPath(url);
  fs.mkdirSync(path.dirname('public' + dest), { recursive: true });
  fs.writeFileSync('public' + dest, bytes);
  const entry={ url, local: dest, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
  const existing=saved.findIndex(item=>item.local===dest);
  if(existing<0)saved.push(entry);else saved[existing]=entry;
}
const records = [];
const bundle = JSON.parse(fs.readFileSync('evidence/rea-public.bundle.json'));
records.push(...bundle.records);
for (const file of ['rea-casino.json', 'rea-sports-capture.json']) {
  if (!fs.existsSync('evidence/' + file)) continue;
  let r = JSON.parse(fs.readFileSync('evidence/' + file));
  r = r.evidence || r.structuredContent || r.data || r;
  if (r.normalized_result) records.push(r);
}
for (const record of records) {
  const events = record.normalized_result.events?.items || [];
  for (const event of events) {
    if (event.kind !== 'network-content' || event.phase !== 'response' || event.body?.state !== 'captured') continue;
    const request = events.find(item => item.kind === 'response' && item.transaction_id === event.transaction_id);
    if (request && ['image', 'font'].includes(request.resource_type)) save(request.url.url, Buffer.from(event.body.content, event.body.encoding));
  }
}
for (const file of ['evidence/home-original.html', 'evidence/brasa-original-casino.html', 'evidence/site.css', 'src/data/sports-home.json', 'src/data/sports-navigation.json', 'src/data/casino-lobby.json', 'src/data/sports-events.json']) {
  if (!fs.existsSync(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  const urls = text.match(/(?:https?:\/\/[^"'\s<>\\)]+|\/releases\/[^"'\s<>\\)]+|\/api\/participants\/[^"'\s<>\\)]+)/g) || [];
  for (const url of urls) if (/\.(?:svg|png|jpe?g|webp|avif|woff2?)(?:\?|$)/i.test(url)) pending.add(url);
}
// Referenced CSS image names use paths relative to the shipped asset directory.
const originalCss = fs.readFileSync('evidence/site.css', 'utf8');
for (const [,raw] of originalCss.matchAll(/url\(([^)]+)\)/g)) {
  const url = raw.replace(/["']/g,'');
  if (url.startsWith('data:') || url.startsWith('#')) continue;
  pending.add(new URL(url,origin + prefix + 'site.css').href);
}
async function run() {
  const queue = [...pending].filter(url => !fs.existsSync('public' + localPath(url)));
  let index = 0;
  const errors = [];
  await Promise.all(Array.from({length:8}, async () => {
    while (index < queue.length) {
      const url = queue[index++];
      try {
        const response = await fetch(new URL(url, origin), {signal:AbortSignal.timeout(25000)});
        if (!response.ok) throw new Error(String(response.status));
        save(url, Buffer.from(await response.arrayBuffer()));
      } catch (error) { errors.push({url, error:error.message}); }
    }
  }));
  let css = originalCss.replace(/url\(([^)]+)\)/g,(all,raw) => {
    const url = raw.replace(/["']/g,'');
    return url.startsWith('data:') || url.startsWith('#') ? all : `url("${localPath(new URL(url,origin+prefix+'site.css').href)}")`;
  });
  fs.writeFileSync('public/reference.css',css);
  for (const [key,value] of Object.entries({...map})) if (key.startsWith(origin+prefix+'images/')) map[key.split('/').at(-1)] = value;
  fs.writeFileSync('src/data/sports-assets.json', JSON.stringify(map,null,2));
  fs.writeFileSync('evidence/assets.json', JSON.stringify({source:'REA retained network bodies and supplemental public asset GET requests',saved,errors},null,2));
  console.log({saved:saved.length,requested:queue.length,errors});
}
run().catch(error=>{console.error(error.message);process.exitCode=1;});
