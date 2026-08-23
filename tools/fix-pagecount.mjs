// 把每份樂譜的 pageCount 更正為 PDF 的真實頁數。
// 只改這一個欄位，其餘（調性、註記等可能已被手動編輯過）原封不動。
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { readFileSync } from 'fs';

const env = {};
for (const l of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const t = l.trim();
  if (t && !t.startsWith('#') && t.includes('=')) { const i = t.indexOf('='); env[t.slice(0, i)] = t.slice(i + 1).trim(); }
}
const cfg = {apiKey:"AIzaSyAgxBDoY1hMDxJLqYo8g7Us2fuJLS64jv8",authDomain:"icc-worship-hub.firebaseapp.com",projectId:"icc-worship-hub",storageBucket:"icc-worship-hub.firebasestorage.app",messagingSenderId:"1036537441313",appId:"1:1036537441313:web:f9e7f5b8f70fe8c9538760"};
const app = initializeApp(cfg), db = getFirestore(app), APP = 'icc-worship-hub';
await signInWithEmailAndPassword(getAuth(app), env.ADMIN_EMAIL || 'timlin.ty@gmail.com', env.ADMIN_PASSWORD);
console.log('✅ 已登入');

const P = (...a) => doc(db, 'artifacts', APP, 'public', 'data', ...a);
const C = (c) => collection(db, 'artifacts', APP, 'public', 'data', c);

// sheetId -> 真實頁數
const real = new Map();
for (const s of JSON.parse(readFileSync(new URL('./uploaded.json', import.meta.url), 'utf8'))) {
  if (s.sheetId && s.realPages) real.set(s.sheetId, s.realPages);
}
console.log(`本地已知真實頁數：${real.size} 份`);

let songsFixed = 0, sheetsFixed = 0;
const songs = (await getDocs(C('icc_songs'))).docs.map(d => d.data());
for (const song of songs) {
  if (!song.sheets?.length) continue;
  let touched = false;
  const next = song.sheets.map(sh => {
    const r = real.get(sh.id);
    if (r && r !== sh.pageCount) { touched = true; sheetsFixed++; return { ...sh, pageCount: r }; }
    return sh;
  });
  if (touched) { await setDoc(P('icc_songs', song.id), { ...song, sheets: next }, { merge: true }); songsFixed++; }
}
console.log(`✅ 歌曲：${songsFixed} 首更新，共 ${sheetsFixed} 份樂譜`);

let poolFixed = 0;
const parts = (await getDocs(C('icc_sheet_pool'))).docs;
for (const d of parts) {
  const data = d.data();
  let touched = false;
  const next = (data.sheets || []).map(sh => {
    const r = real.get(sh.id);
    if (r && r !== sh.pageCount) { touched = true; poolFixed++; return { ...sh, pageCount: r }; }
    return sh;
  });
  if (touched) await setDoc(P('icc_sheet_pool', d.id), { ...data, sheets: next, updatedAt: new Date().toISOString() });
}
console.log(`✅ 待用樂譜庫：${poolFixed} 份更新`);
console.log(`\n合計修正 ${sheetsFixed + poolFixed} 份樂譜的頁數`);
process.exit(0);
