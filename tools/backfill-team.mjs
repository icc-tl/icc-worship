// 把主日服事表的同工名單補進「已經存在」的歌單。
//
//   node tools/backfill-team.mjs           試跑，只印出會改什麼，不寫入
//   node tools/backfill-team.mjs --write   實際寫入（需要 .env.local 的 ADMIN_PASSWORD）
//
// 只會補 team 這一個欄位（merge 寫入），不動歌單的其它內容。
// 已經有名單、或服事表上查不到那一天的，都會跳過。

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { lookupRoster, isRosterEmpty, ROSTER_ROLES } from '../src/roster.js';

const WRITE = process.argv.includes('--write');

const env = {};
try {
  for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
    const t = line.trim();
    if (t && !t.startsWith('#') && t.includes('=')) { const i = t.indexOf('='); env[t.slice(0, i)] = t.slice(i + 1).trim(); }
  }
} catch { /* 試跑時沒有 .env.local 也沒關係 */ }

const cfg = { apiKey: "AIzaSyAgxBDoY1hMDxJLqYo8g7Us2fuJLS64jv8", authDomain: "icc-worship-hub.firebaseapp.com", projectId: "icc-worship-hub", storageBucket: "icc-worship-hub.firebasestorage.app", messagingSenderId: "1036537441313", appId: "1:1036537441313:web:f9e7f5b8f70fe8c9538760" };
const APP_ID = 'icc-worship-hub';
const app = initializeApp(cfg), db = getFirestore(app);

if (WRITE) {
  if (!env.ADMIN_PASSWORD) { console.error('❌ 要寫入需要 .env.local 裡的 ADMIN_PASSWORD'); process.exit(1); }
  const email = env.ADMIN_EMAIL || 'timlin.ty@gmail.com';
  try {
    await signInWithEmailAndPassword(getAuth(app), email, env.ADMIN_PASSWORD);
    console.log(`✅ 已以主領身分登入（${email}）\n`);
  } catch (e) {
    console.error(`❌ 登入失敗：${e.code}`);
    if (e.code === 'auth/invalid-credential') console.error('   → .env.local 的 ADMIN_PASSWORD 不正確');
    process.exit(1);
  }
} else {
  await signInAnonymously(getAuth(app));   // 訪客身分即可讀取
  console.log('🔍 試跑模式：只會印出結果，不會寫入。確定沒問題後加上 --write\n');
}

const path = (...s) => ['artifacts', APP_ID, 'public', 'data', ...s];
const snap = await getDocs(collection(db, ...path('icc_setlists')));
const setlists = snap.docs.map(d => d.data()).sort((a, b) => String(b.date).localeCompare(String(a.date)));
console.log(`共 ${setlists.length} 份歌單\n`);

const summary = (team) => ROSTER_ROLES
  .filter(r => (team[r.key] || []).length)
  .map(r => `${r.label} ${team[r.key].join('/')}`)
  .join('  ');

let filled = 0, already = 0, notFound = 0, failed = 0;

for (const item of setlists) {
  const label = String(item.date || '(無日期)').padEnd(12);

  if (item.team && !isRosterEmpty(item.team)) { already += 1; console.log(`${label} 已有名單，跳過`); continue; }

  let team = null;
  try { team = await lookupRoster(item.date); }
  catch { /* 抓不到就當作沒有 */ }

  if (!team || isRosterEmpty(team)) { notFound += 1; console.log(`${label} 服事表上沒有這一天`); continue; }

  console.log(`${label} ${WRITE ? '寫入' : '會寫入'} → ${summary(team)}`);

  if (WRITE) {
    try {
      await setDoc(doc(db, ...path('icc_setlists', item.id)), { team }, { merge: true });
      filled += 1;
    } catch (e) {
      failed += 1;
      console.log(`${' '.repeat(12)} ❌ 寫入失敗：${e.code || e.message}`);
    }
  } else {
    filled += 1;
  }
}

console.log(`\n${WRITE ? '已補上' : '可補上'} ${filled} 份，已有名單 ${already} 份，服事表查無 ${notFound} 份${failed ? `，失敗 ${failed} 份` : ''}`);
process.exit(0);
