// 把失聯的樂譜救回來：比對本機匯入紀錄與線上資料，
// 原本掛在哪首歌就掛回哪首，原本在待用庫的就放回待用庫。
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { readFileSync } from 'fs';

const env = {};
for (const l of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const t = l.trim();
  if (t && !t.startsWith('#') && t.includes('=')) { const i = t.indexOf('='); env[t.slice(0, i)] = t.slice(i + 1).trim(); }
}
if (!env.ADMIN_PASSWORD) { console.error('❌ .env.local 缺少 ADMIN_PASSWORD'); process.exit(1); }

const cfg = {apiKey:"AIzaSyAgxBDoY1hMDxJLqYo8g7Us2fuJLS64jv8",authDomain:"icc-worship-hub.firebaseapp.com",projectId:"icc-worship-hub",storageBucket:"icc-worship-hub.firebasestorage.app",messagingSenderId:"1036537441313",appId:"1:1036537441313:web:f9e7f5b8f70fe8c9538760"};
const app = initializeApp(cfg), db = getFirestore(app), APP = 'icc-worship-hub';
await signInWithEmailAndPassword(getAuth(app), env.ADMIN_EMAIL || 'timlin.ty@gmail.com', env.ADMIN_PASSWORD);
const P = (...a) => doc(db, 'artifacts', APP, 'public', 'data', ...a);
const C = (c) => collection(db, 'artifacts', APP, 'public', 'data', c);

const songs = (await getDocs(C('icc_songs'))).docs.map(d => d.data());
const poolDocs = (await getDocs(C('icc_sheet_pool'))).docs;
const pool = poolDocs.flatMap(d => d.data().sheets || []);
const live = new Set([...songs.flatMap(s => (s.sheets || []).map(x => x.id)), ...pool.map(x => x.id)]);

const local = JSON.parse(readFileSync(new URL('./uploaded.json', import.meta.url), 'utf8'));
const lost = local.filter(s => s.sheetId && !live.has(s.sheetId));
console.log(`失聯樂譜：${lost.length} 份\n`);
if (!lost.length) { console.log('沒有需要救援的項目'); process.exit(0); }

const asSheet = (s) => ({
  id: s.sheetId, key: s.key || null, label: s.label || null, title: s.title,
  url: s.url, pageCount: s.realPages || s.pages.length, source: 'import',
  ...(s.pageImageUrls?.length ? { pageImages: s.pageImageUrls } : {}),
});

// 依原本的歸屬分類
const toSongs = new Map(), toPool = [];
for (const s of lost) {
  const owner = songs.find(x => (s.songIds || []).includes(x.id));
  if (owner) {
    if (!toSongs.has(owner.id)) toSongs.set(owner.id, { song: owner, add: [] });
    toSongs.get(owner.id).add.push(asSheet(s));
  } else {
    toPool.push(asSheet(s));
  }
}

for (const [id, { song, add }] of toSongs) {
  await setDoc(P('icc_songs', id), { ...song, sheets: [...(song.sheets || []), ...add] }, { merge: true });
  console.log(`✅ 《${song.title}》 復原 ${add.length} 份：${add.map(x => x.key || '未標').join('、')}`);
}

if (toPool.length) {
  const all = [...pool, ...toPool];
  const CH = 250, n = Math.max(1, Math.ceil(all.length / CH));
  for (let i = 0; i < n; i++) {
    await setDoc(P('icc_sheet_pool', `part-${i}`), { index: i, sheets: all.slice(i * CH, (i + 1) * CH), updatedAt: new Date().toISOString() });
  }
  console.log(`✅ 待用庫復原 ${toPool.length} 份：${toPool.map(x => x.title).join('、')}`);
}
console.log('\n完成');
process.exit(0);
