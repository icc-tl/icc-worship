// 把逐頁圖片的網址寫進每份樂譜。只新增 pageImages 欄位，其餘不動。
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

const imgs = new Map();
for (const s of JSON.parse(readFileSync(new URL('./uploaded.json', import.meta.url), 'utf8'))) {
  if (s.sheetId && s.pageImageUrls?.length) imgs.set(s.sheetId, s.pageImageUrls);
}
console.log(`本地已知頁圖：${imgs.size} 份樂譜`);

let songsTouched = 0, sheetsTouched = 0;
for (const song of (await getDocs(C('icc_songs'))).docs.map(d => d.data())) {
  if (!song.sheets?.length) continue;
  let touched = false;
  const next = song.sheets.map(sh => {
    const u = imgs.get(sh.id);
    if (u && JSON.stringify(u) !== JSON.stringify(sh.pageImages)) { touched = true; sheetsTouched++; return { ...sh, pageImages: u }; }
    return sh;
  });
  if (touched) { await setDoc(P('icc_songs', song.id), { ...song, sheets: next }, { merge: true }); songsTouched++; }
}
console.log(`✅ 歌曲：${songsTouched} 首 / ${sheetsTouched} 份樂譜`);

let poolTouched = 0;
for (const d of (await getDocs(C('icc_sheet_pool'))).docs) {
  const data = d.data();
  let touched = false;
  const next = (data.sheets || []).map(sh => {
    const u = imgs.get(sh.id);
    if (u && JSON.stringify(u) !== JSON.stringify(sh.pageImages)) { touched = true; poolTouched++; return { ...sh, pageImages: u }; }
    return sh;
  });
  if (touched) await setDoc(P('icc_sheet_pool', d.id), { ...data, sheets: next, updatedAt: new Date().toISOString() });
}
console.log(`✅ 待用庫：${poolTouched} 份`);
process.exit(0);
