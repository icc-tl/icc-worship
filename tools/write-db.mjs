// 把樂譜資料寫入 Firestore。需要 .env.local 內的 ADMIN_PASSWORD。
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { readFileSync } from 'fs';

const env = {};
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const t = line.trim();
  if (t && !t.startsWith('#') && t.includes('=')) { const i = t.indexOf('='); env[t.slice(0,i)] = t.slice(i+1).trim(); }
}
if (!env.ADMIN_PASSWORD) { console.error('❌ .env.local 缺少 ADMIN_PASSWORD'); process.exit(1); }

const cfg = {apiKey:"AIzaSyAgxBDoY1hMDxJLqYo8g7Us2fuJLS64jv8",authDomain:"icc-worship-hub.firebaseapp.com",projectId:"icc-worship-hub",storageBucket:"icc-worship-hub.firebasestorage.app",messagingSenderId:"1036537441313",appId:"1:1036537441313:web:f9e7f5b8f70fe8c9538760"};
const APP_ID = 'icc-worship-hub';
const app = initializeApp(cfg), db = getFirestore(app);

const EMAIL = env.ADMIN_EMAIL || 'timlin.ty@gmail.com';
try {
  await signInWithEmailAndPassword(getAuth(app), EMAIL, env.ADMIN_PASSWORD);
  console.log(`✅ 已以主領身分登入（${EMAIL}）`);
} catch (e) {
  console.error(`❌ 登入失敗：${e.code}`);
  if (e.code === 'auth/invalid-credential') console.error('   → .env.local 的 ADMIN_PASSWORD 不正確');
  process.exit(1);
}

const sheets = JSON.parse(readFileSync(new URL('./uploaded.json', import.meta.url), 'utf8'));
const P = (...s) => doc(db, 'artifacts', APP_ID, 'public', 'data', ...s);

// 1. 讀回現有歌曲（保留既有欄位）
const snap = await getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'icc_songs'));
const songs = new Map(snap.docs.map(d => [d.data().id, d.data()]));
console.log(`讀入歌庫 ${songs.size} 首`);

// 2. 依歌曲彙整樂譜
const bySong = new Map();
const pool = [];
for (const s of sheets) {
  const entry = {
    id: s.sheetId,
    key: s.key || null,
    label: s.label || null,
    title: s.title,
    url: s.url,
    pageCount: s.pages.length,
    source: 'import',
  };
  if (s.songIds?.length) {
    for (const sid of s.songIds) {
      if (!bySong.has(sid)) bySong.set(sid, []);
      bySong.get(sid).push(entry);
    }
  } else {
    pool.push(entry);
  }
}

// 3. 寫回歌曲（只加 sheets 欄位，其餘不動）
let n = 0;
for (const [sid, list] of bySong) {
  const song = songs.get(sid);
  if (!song) { console.warn(`  ⚠️ 找不到歌曲 ${sid}`); continue; }
  list.sort((a, b) => (a.key || 'zz').localeCompare(b.key || 'zz'));
  await setDoc(P('icc_songs', sid), { ...song, sheets: list }, { merge: true });
  n++;
  if (n % 25 === 0) console.log(`  已更新 ${n}/${bySong.size} 首`);
}
console.log(`✅ ${n} 首歌曲已掛上樂譜`);

// 4. 待用樂譜庫：存成單一文件（一次讀取即可，省配額）
const CHUNK = 250;
for (let i = 0; i < pool.length; i += CHUNK) {
  const part = pool.slice(i, i + CHUNK);
  await setDoc(P('icc_sheet_pool', `part-${i / CHUNK}`), { index: i / CHUNK, sheets: part, updatedAt: new Date().toISOString() });
  console.log(`  待用樂譜庫 part-${i / CHUNK}: ${part.length} 份`);
}
console.log(`✅ 待用樂譜庫 ${pool.length} 份`);
console.log(`\n完成：${n} 首掛譜 / ${pool.length} 份待用`);
process.exit(0);
