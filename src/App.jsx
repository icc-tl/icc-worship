import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Trash2, ArrowUp, ArrowDown, Edit2, X, ChevronLeft, ChevronRight, Download, FileText, Music, Eye, Database, BookOpen, Save, CalendarDays, User, Home, ListMusic, Lock, Unlock, Youtube, Sparkles, Wand2, Loader2, Crown, Code, Layers, Globe } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

// -----------------------------------------------------------------------------
// Translations (i18n) Dictionary
// -----------------------------------------------------------------------------
const TRANSLATIONS = {
  "權限已解鎖": "Admin Unlocked",
  "訪客模式": "Guest Mode",
  "雲端連線": "Cloud Connected",
  "連線中...": "Connecting...",
  "返回首頁": "Back to Home",
  "貼上 JSON 匯入歌單": "Import JSON Setlist",
  "雲端詩歌庫": "Song Library",
  "系統驗證": "System Authentication",
  "編輯功能目前僅開放主領使用，": "Edit access is for worship leaders only, ",
  "如需權限請洽師母 🙏": "please contact the pastor's wife for access 🙏",
  "取消返回": "Cancel",
  "確認解鎖": "Unlock",
  "密碼錯誤。": "Incorrect password.",
  "登出": "Sign Out",
  "改用新分頁開啟": "Open in a new tab",
  "樂譜載入失敗": "Could not load the sheet",
  "樂譜載入中...": "Loading sheet...",
  "無": "None",
  "先填好歌名後即可上傳樂譜，系統會自動先建立這首歌。": "Enter a song title first — uploading will create the song automatically.",
  "請先輸入歌名再上傳樂譜": "Enter a song title before uploading a sheet",
  "此裝置無法內嵌顯示，請點擊開啟": "This device cannot embed PDFs — tap to open",
  "開新分頁": "New Tab",
  "未標調性": "No key",
  "可用樂譜": "Available Sheets",
  "檔案上傳失敗，請再試一次。": "Upload failed. Please try again.",
  "請先登入主領帳號": "Please sign in as a worship leader first",
  "永久刪除": "Delete Forever",
  "這會連雲端上的檔案一起刪除，無法復原。若只是想從這首歌拿掉，請改用旁邊的「移除」。": "This deletes the file from the cloud and cannot be undone. To just take it off this song, use Remove instead.",
  "永久刪除樂譜？": "Delete sheet permanently?",
  "永久刪除檔案（不可復原）": "Delete file permanently (cannot be undone)",
  "上傳中...": "Uploading...",
  "上傳樂譜": "Upload Sheet",
  "僅顯示前 100 筆，請用搜尋縮小範圍": "Showing first 100 — use search to narrow down",
  "加入": "Add",
  "先看看內容": "Preview first",
  "待用庫查無符合的樂譜": "No matching sheets in the pool",
  "搜尋歌名、註記或調性...": "Search title, label, or key...",
  "份尚未關聯的樂譜": "unlinked sheets",
  "待用樂譜庫": "Sheet Pool",
  "調性與註記改完點擊別處即自動儲存。移除只是取消關聯，樂譜會回到待用庫，隨時能重新加入或改掛到別首歌。": "Key and label save automatically when you click away. Removing only unlinks it — the sheet returns to the pool and can be re-added or moved to another song.",
  "從這首歌移除（回到待用庫，可還原）": "Remove from this song (returns to pool, reversible)",
  "註記（女聲／吉他…）": "Label (female / guitar…)",
  "調性": "Key",
  "檢視": "View",
  "這首歌還沒有樂譜": "No sheets for this song yet",
  "從待用庫加入": "Add from Pool",
  "份": "sheets",
  "樂譜管理": "Sheet Music",
  "尚無樂譜": "No sheet music",
  "樂譜": "Sheet Music",
  "開啟樂譜": "Open Sheet",
  "已依本週歌單的調性自動挑選樂譜": "Sheets auto-selected to match this week\u2019s keys",
  "驗證中...": "Verifying...",
  "嘗試次數過多，請稍候幾分鐘再試。": "Too many attempts. Please wait a few minutes and try again.",
  "網路連線失敗，請確認網路後再試。": "Network error. Check your connection and try again.",
  "主領帳號尚未建立，請洽網站管理者。": "The leader account has not been set up yet. Please contact the site admin.",
  "無法連線至雲端資料庫，畫面上的內容可能不是最新的。": "Cannot reach the cloud database. What you see may be out of date.",
  "無法讀取雲端詩歌庫，畫面上的內容可能不是最新的。": "Cannot load the cloud song library. What you see may be out of date.",
  "無法讀取雲端歌單，畫面上的內容可能不是最新的。": "Cannot load cloud setlists. What you see may be out of date.",
  "透過此功能，您可以將過往的 SongMap 快速匯入系統，協助擴充雲端歌單。": "With this feature, you can quickly import past SongMaps into the system to help expand the cloud song library.",
  "請先申請或登入": "Please register or login to your ",
  "Google Gemini AI 免費帳號": "free Google Gemini AI account",
  "登入後，請點擊進入": "After logging in, please click to access the ",
  "歌單資訊轉換程式": "Setlist Converter Program",
  "點擊左下方的「+」號上傳欲轉換的 SongMap 檔案，接著直接按下右下角的送出鍵（不需輸入任何指令）。": "Click the '+' icon at the bottom left to upload your SongMap file, then simply press send at the bottom right (no prompt needed).",
  "複製 AI 產生的 JSON 格式文字，貼到下方輸入框中並開始匯入。系統會自動過濾多餘標籤，並將新詩歌建檔存入雲端！✨": "Copy the AI-generated JSON format text, paste it into the box below, and click import. The system will auto-filter excess tags and save new songs to the cloud! ✨",
  "取消": "Cancel",
  "處理並匯入中...": "Processing & Importing...",
  "開始匯入": "Start Import",
  "請先貼上 JSON 內容": "Please paste JSON content first",
  "無法解析內容，請確認 JSON 格式是否包含 songs 陣列。": "Failed to parse. Ensure JSON contains a 'songs' array.",
  "JSON 解析失敗，請檢查格式是否正確：": "JSON parsing failed. Check format: ",
  "敬請期待": "Coming Soon",
  "AI 網址抓取功能開發中！": "AI URL fetching is under development!",
  "爭取在牧師安息回來前做出來 🙏": "Working hard to release it soon 🙏",
  "我知道了": "Got it",
  "確定刪除？": "Confirm Deletion?",
  "永久刪除？": "Permanently Delete?",
  "此動作將移除雲端檔案，無法復原。": "This action removes the cloud file and cannot be undone.",
  "確認刪除": "Confirm Delete",
  "近期歌單總覽": "Recent Setlists",
  "搜尋日期、主領或歌名...": "Search date, leader, or song title...",
  "+ 預備歌單": "+ New Setlist",
  "未指定主領": "No Leader Assigned",
  "未指定": "Not specified",
  "更新:": "Updated:",
  "未命名": "Untitled",
  "前往 YouTube 聆聽": "Listen on YouTube",
  "YouTube 聆聽": "Listen on YouTube",
  "歌手預覽": "Singer View",
  "樂手樂譜": "Musician Sheets",
  "預覽": "Preview",
  "YouTube 播放清單": "YouTube Playlist",
  "編輯": "Edit",
  "刪除": "Delete",
  "查無歌單紀錄。": "No setlist records found.",
  "回到今天": "Back to Today",
  "顯示全部歌單": "Show All Setlists",
  "編輯歌單": "Edit Setlist",
  "建立新歌單": "Create New Setlist",
  "儲存中...": "Saving...",
  "已成功儲存！": "Saved Successfully!",
  "儲存歌單": "Save Setlist",
  "預覽與輸出": "Preview & Export",
  "日期": "Date",
  "主領": "Worship Leader",
  "主領是誰呢": "Who is leading?",
  "YouTube 歌單連結 (選填)": "YouTube Playlist URL (Optional)",
  "貼上 YouTube 歌單網址...": "Paste YouTube playlist URL...",
  "+ 新增詩歌": "+ Add Song",
  "未設定段落": "No map set",
  "返回歌單": "Back to Setlist",
  "編輯歌曲": "Edit Song",
  "新增歌曲": "Add Song",
  "由雲端資料庫搜尋或新增": "Search or Add from Cloud Database",
  "輸入歌名搜尋...": "Search song title...",
  "找不到？AI 網址抓取": "Not Found? AI URL Fetch",
  "手動建立新詩歌": "Create Song Manually",
  "雲端資料庫查無此歌 🥺": "Song not found in cloud database 🥺",
  "請點擊上方按鈕使用 AI 或手動新增": "Click buttons above to add via AI or manually",
  "調性 (Key)": "Key",
  "自訂或選擇...": "Custom or select...",
  "編輯詩歌檔案": "Edit Song File",
  "歌詞預覽": "Lyrics Preview",
  "建立段落 (Map Builder)": "Map Builder",
  "編輯字串 (Map String)": "Map String",
  "例如：": "e.g.: ",
  "確認加入歌單": "Confirm Add to Setlist",
  "搜尋結果": "Search Results",
  "瀏覽雲端詩歌庫 (全庫)": "Browse Cloud Library",
  "依近3個月熱度排序": "Sorted by 3-mo popularity",
  "近期熱門": "Trending",
  "未知歌手": "Unknown Artist",
  "近期未唱": "Not sung recently",
  "本週剛唱過": "Sung this week",
  "支援 Multitrack": "Multitrack Supported",
  "返回": "Back",
  "詩歌編輯器": "Song Editor",
  "新增詩歌資料庫": "Add to Song Database",
  "確認儲存更新": "Save Updates",
  "確認儲存至雲端資料庫": "Save to Cloud Database",
  "請輸入歌名！": "Please enter a song title!",
  "資料庫尚未連線，請稍後再試。": "Database not connected. Please try again later.",
  "儲存至雲端時發生錯誤：": "Error saving to cloud: ",
  "歌名 *": "Song Title *",
  "歌手 / 出處": "Artist / Source",
  "預設調性": "Default Key",
  "YouTube 連結或 ID": "YouTube URL or ID",
  "歌詞段落管理": "Lyrics Section Management",
  "在此貼上歌詞內容...": "Paste lyrics here...",
  "+ 新增段落": "+ Add Section",
  "詩歌庫管理": "Song Library Management",
  "搜尋雲端詩歌檔案...": "Search cloud song files...",
  "歌名 (Song Title)": "Song Title",
  "近期熱度": "Recent Popularity",
  "管理操作": "Actions",
  "下載 PDF": "Download PDF",
  "產生中...": "Generating...",
  "尚未設定段落": "No map set",
  "用心靈和誠實敬拜": "Worship in spirit and truth",
  "日": "Sun", "一": "Mon", "二": "Tue", "三": "Wed", "四": "Thu", "五": "Fri", "六": "Sat",
  "正常版": "Normal",
  "一頁版": "1-Page",
  "大字版": "Large Font",
  "首": "songs",
  "資料庫詩歌總數：": "Total songs in database: "
};

const t = (text, lang) => (lang === 'en' && TRANSLATIONS[text]) ? TRANSLATIONS[text] : text;

const getTagExplanation = (tag, lang) => {
  const exp = TAG_EXPLANATIONS[tag];
  if (!exp) return tag;
  if (lang === 'en') {
    const match = exp.match(/\(([^)]+)\)/);
    return match ? match[1] : exp;
  }
  return exp.split(' (')[0];
};

const getFullTagExplanation = (tag, lang) => {
  const exp = TAG_EXPLANATIONS[tag];
  if (!exp) return tag;
  if (lang === 'en') {
    const match = exp.match(/\(([^)]+)\)/);
    return match ? `${tag} (${match[1]})` : tag;
  }
  return `${tag} (${exp.split(' (')[0]})`;
};

// -----------------------------------------------------------------------------
// Firebase & App Configuration
// -----------------------------------------------------------------------------
const fallbackConfig = {
  apiKey: "AIzaSyAgxBDoY1hMDxJLqYo8g7Us2fuJLS64jv8",
  authDomain: "icc-worship-hub.firebaseapp.com",
  projectId: "icc-worship-hub",
  storageBucket: "icc-worship-hub.firebasestorage.app",
  messagingSenderId: "1036537441313",
  appId: "1:1036537441313:web:f9e7f5b8f70fe8c9538760"
};

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : fallbackConfig;
const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);
const firestoreDb = getFirestore(firebaseApp);
const currentAppId = typeof __app_id !== 'undefined' ? __app_id : 'icc-worship-hub';

// 主領共用帳號的識別碼。這不是機密，主領也不會看到 ——
// 登入視窗只要求輸入密碼，信箱由程式自動帶入。
// 密碼由 Firebase 伺服器驗證，不存在於前端。
// 要換密碼：Firebase Console → Authentication → 使用者 → 重設密碼（不需重新部署）
const ADMIN_EMAIL = 'timlin.ty@gmail.com';

// -----------------------------------------------------------------------------
// JSON 處理與清理工具
// -----------------------------------------------------------------------------
const cleanString = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/\[cite_start\]/g, '')
    .replace(/\[cite_end\]/g, '') 
    .replace(/ \n/g, '\n')
    .replace(/\n /g, '\n')
    .trim(); 
};

const cleanAndParseJSON = (rawText) => {
  let cleaned = rawText
    .replace(/\[cite_start\]/g, '')
    .replace(/\[cite_end\]/g, '')
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ');

  cleaned = cleaned.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
};

// -----------------------------------------------------------------------------
// Constants & Mock Data
// -----------------------------------------------------------------------------
const SONG_MAP_TAGS = ['I', 'V', 'V1', 'V2', 'V3', 'V4', 'PC', 'C', 'C1', 'C2', 'C3', 'B', 'IT', 'FW', 'L1', 'L2', 'L3', 'OT', 'E'];
const STRUCTURAL_TAGS = ['I', 'IT', 'FW', 'OT', 'E'];
const KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B', 'D-E', 'E-F#', 'F-G', 'G-A'];

const TAG_EXPLANATIONS = {
  'I': '前奏 (Intro)', 'V': '主歌 (Verse)', 'V1': '第一節主歌 (Verse 1)', 'V2': '第二節主歌 (Verse 2)', 'V3': '第三節主歌 (Verse 3)', 'V4': '第四節主歌 (Verse 4)',
  'PC': '導歌 (Pre Chorus)', 'C': '副歌 (Chorus)', 'C1': '副歌 1 (Chorus 1)', 'C2': '副歌 2 (Chorus 2)', 'C3': '副歌 3 (Chorus 3)', 
  'B': '橋段 (Bridge)', 'IT': '間奏 (Interlude)',
  'FW': '自由敬拜 (Free Worship)', 'L1': '最後一句 (Last Line)', 'L2': '最後兩句 (Last 2 Lines)',
  'L3': '最後三句 (Last 3 Lines)', 'OT': '尾奏 (Outro)', 'E': '結尾 (Ending)'
};

const QUICK_FILTERS = [
  { label: '讚美之泉', query: '讚美之泉' },
  { label: '約書亞', query: '約書亞' },
  { label: 'KUA', query: 'KUA' },
  { label: 'SOP', query: 'SOP' },
  { label: 'Multitrack', query: 'mt' }
];

// -----------------------------------------------------------------------------
// 樂譜工具
// -----------------------------------------------------------------------------
// 調性比較用：Bb 與 A# 視為同音，大小寫與全形一律統一
const KEY_ALIASES = { 'A#': 'Bb', 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab' };

const normalizeKey = (k) => {
  if (!k) return '';
  const t = String(k).normalize('NFKC').trim().replace(/♭/g, 'b').replace(/♯/g, '#');
  return t.split('-').map(part => {
    const p = part.trim();
    if (!p) return '';
    const std = p[0].toUpperCase() + p.slice(1).toLowerCase();
    return KEY_ALIASES[std] || std;
  }).filter(Boolean).join('-');
};

// 依歌單當週的調性挑出最合適的樂譜
// 完全相同 > 轉調字串的起始調相同 > 沒有標調性的通用譜 > 其他
const pickSheetForKey = (sheets, wantedKey) => {
  if (!sheets || sheets.length === 0) return null;
  const want = normalizeKey(wantedKey);
  if (!want) return sheets[0];
  const wantRoot = want.split('-')[0];
  const score = (sheet) => {
    const k = normalizeKey(sheet.key);
    if (!k) return 2;                       // 通用譜（沒標調性）
    if (k === want) return 0;               // 完全吻合
    if (k.split('-')[0] === wantRoot) return 1;  // 轉調譜的起始調相同
    return 3;
  };
  return [...sheets].sort((a, b) => score(a) - score(b) || (a.pageCount || 1) - (b.pageCount || 1))[0];
};

// 這份譜的調性跟本週要用的調不一樣時，回傳提示文字
const keyMismatchNote = (sheet, wantedKey, language) => {
  const k = normalizeKey(sheet?.key);
  const want = normalizeKey(wantedKey);
  if (!k || !want || k === want) return null;
  return language === 'en'
    ? `Sheet in ${sheet.key}, this week in ${wantedKey}`
    : `此為 ${sheet.key} 調，本週為 ${wantedKey} 調`;
};

// 上傳的圖片盡量轉成 PDF，讓所有樂譜格式一致、也方便日後合併列印
const imageFileToPdf = async (file) => {
  const { jsPDF } = await import('jspdf');
  const dataUrl = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file);
  });
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i); i.onerror = rej; i.src = dataUrl;
  });
  // 以圖片本身的比例決定紙張方向，避免留下大片空白
  const orientation = img.width > img.height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ orientation, unit: 'pt', format: 'letter' });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const scale = Math.min(pw / img.width, ph / img.height);
  const w = img.width * scale, h = img.height * scale;
  pdf.addImage(dataUrl, file.type === 'image/png' ? 'PNG' : 'JPEG', (pw - w) / 2, (ph - h) / 2, w, h);
  return new File([pdf.output('blob')], (file.name.replace(/\.[^.]+$/, '') || 'sheet') + '.pdf', { type: 'application/pdf' });
};

const sheetLabel = (sheet, language) => {
  const bits = [];
  if (sheet.key) bits.push(sheet.key);
  if (sheet.pageCount > 1) bits.push(language === 'en' ? `${sheet.pageCount} pages` : `${sheet.pageCount} 頁`);
  if (sheet.label) bits.push(sheet.label);
  return bits.join(' · ');
};

const generateId = () => (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `id-${Date.now()}-${Math.floor(Math.random()*1000)}`;

// -----------------------------------------------------------------------------
// UI Helper Components
// -----------------------------------------------------------------------------
const ICCLogo = ({ className }) => (
  <div className={`flex flex-col items-center justify-center ${className}`}>
    <img 
      src="https://static.wixstatic.com/media/bdcebb_ef3ed0565d6d4ffc8f41b87e4edc0599~mv2.png/v1/fill/w_236,h_64,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/ICC_Logo.png" 
      alt="Irvine City Church Logo" className="h-8 sm:h-14 object-contain"
    />
  </div>
);

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, cancelText, confirmText }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-600 mb-6 text-sm leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">{cancelText}</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-sm">{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

// --- Custom Fast Tooltip Component ---
const FastTooltip = ({ text, position = 'top' }) => {
  if (!text) return null;
  let posClasses = '';
  let arrowClasses = '';
  if (position === 'top') {
    posClasses = 'bottom-full mb-1.5 left-1/2 -translate-x-1/2';
    arrowClasses = 'top-full left-1/2 -translate-x-1/2 border-t-slate-800/95';
  } else if (position === 'left') {
    posClasses = 'right-full mr-2 top-1/2 -translate-y-1/2';
    arrowClasses = 'left-full top-1/2 -translate-y-1/2 border-l-slate-800/95';
  }
  return (
    <div className={`absolute ${posClasses} w-max max-w-[200px] bg-slate-800/95 backdrop-blur-sm text-white text-[11px] px-2.5 py-1.5 rounded-md opacity-0 group-hover/tt:opacity-100 transition-all duration-100 pointer-events-none z-[200] shadow-xl whitespace-pre-line text-center font-sans font-normal leading-relaxed scale-95 group-hover/tt:scale-100`}>
      {text}
      <div className={`absolute border-[4px] border-transparent ${arrowClasses}`}></div>
    </div>
  );
};

// --- 單一樂譜連結（含調性不符提示）---
const SheetLink = ({ sheet, wantedKey, language, compact }) => {
  const note = keyMismatchNote(sheet, wantedKey, language);
  return (
    <a href={sheet.url} target="_blank" rel="noopener noreferrer"
       className={`relative group/tt inline-flex items-center gap-1.5 rounded-lg border transition shadow-sm
         ${compact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'}
         ${note ? 'bg-amber-50 border-amber-200 text-amber-700 hover:border-amber-400'
                : 'bg-white border-slate-200 text-slate-700 hover:border-sky-400 hover:text-sky-600'}`}>
      <FileText size={compact ? 12 : 14} className={note ? 'text-amber-500' : 'text-sky-500'} />
      <span className="font-bold font-mono">{sheet.key || (language === 'en' ? 'Sheet' : '樂譜')}</span>
      {sheet.pageCount > 1 && <span className="opacity-60">{sheet.pageCount}p</span>}
      {sheet.label && !compact && <span className="opacity-70 truncate max-w-[90px]">{sheet.label}</span>}
      <FastTooltip text={note || (language === 'en' ? 'Open sheet music' : '開啟樂譜')} />
    </a>
  );
};

// --- 一首歌的樂譜群組：優先顯示符合本週調性的那份 ---
const SheetGroup = ({ sheets, wantedKey, language, compact }) => {
  const [expanded, setExpanded] = useState(false);
  if (!sheets || sheets.length === 0) {
    return <span className="text-[11px] text-slate-300 italic">{t('尚無樂譜', language)}</span>;
  }
  const best = pickSheetForKey(sheets, wantedKey);
  const rest = sheets.filter(x => x.id !== best.id);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <SheetLink sheet={best} wantedKey={wantedKey} language={language} compact={compact} />
      {rest.length > 0 && (expanded
        ? rest.map(x => <SheetLink key={x.id} sheet={x} wantedKey={wantedKey} language={language} compact />)
        : <button onClick={() => setExpanded(true)}
            className="px-2 py-1 text-[11px] font-bold text-slate-400 hover:text-sky-600 bg-slate-50 hover:bg-sky-50 rounded-lg border border-slate-200 transition">
            +{rest.length}
          </button>)}
    </div>
  );
};

// --- 調性配對的視覺標示 ---
// 藍＝與本週調性相符 灰＝樂譜沒標調性 黃＝不同調性
const sheetTone = (sheet, wantedKey) => {
  const k = normalizeKey(sheet?.key);
  const want = normalizeKey(wantedKey);
  if (!k) return 'none';
  if (!want || k === want) return k && want ? 'match' : 'none';
  return k.split('-')[0] === want.split('-')[0] ? 'match' : 'diff';
};

const TONE_STYLES = {
  match: { chip: 'bg-sky-500 text-white border-sky-500 shadow-sm', idle: 'bg-sky-50 text-sky-700 border-sky-200 hover:border-sky-400' },
  none:  { chip: 'bg-slate-600 text-white border-slate-600 shadow-sm', idle: 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400' },
  diff:  { chip: 'bg-amber-500 text-white border-amber-500 shadow-sm', idle: 'bg-amber-50 text-amber-700 border-amber-300 hover:border-amber-500' },
};

// --- 樂譜檢視器 ---
// 用 PDF.js 自己把每頁畫到 canvas 上，而不是交給瀏覽器內建的 PDF 外掛。
// 原因：內建外掛在各裝置行為差很多，iPad Safari 常常只顯示第一頁，
// 而樂手主日多半就是拿平板看譜。自己渲染才能保證每台裝置一致。
let pdfLibPromise = null;
const loadPdfLib = () => {
  if (!pdfLibPromise) {
    pdfLibPromise = import('pdfjs-dist').then(async (lib) => {
      const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
      lib.GlobalWorkerOptions.workerSrc = worker.default;
      return lib;
    });
  }
  return pdfLibPromise;
};

const SheetViewer = ({ sheet, language, height = '75vh' }) => {
  const wrapRef = useRef(null);
  const [doc, setDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [status, setStatus] = useState(sheet?.url ? 'loading' : 'idle');   // idle | loading | ready | error
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  // 換一份樂譜時由呼叫端的 key 觸發重新掛載，這裡只負責載入，
  // 不在 effect 內同步重設狀態（那會造成連鎖渲染）
  useEffect(() => {
    if (!sheet?.url) return;
    let cancelled = false;
    (async () => {
      const lib = await loadPdfLib();
      const open = (url) => lib.getDocument({ url }).promise;
      try {
        let d;
        try {
          d = await open(sheet.url);
        } catch {
          // 樂譜標為 immutable 長期快取，若使用者手邊存著舊的、
          // 缺少 CORS 標頭的回應，正常請求會被瀏覽器擋下。繞過快取重試一次。
          if (cancelled) return;
          d = await open(`${sheet.url}${sheet.url.includes('?') ? '&' : '?'}r=${Date.now()}`);
        }
        if (!cancelled) { setDoc(d); setStatus('ready'); }
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [sheet?.url]);

  // 畫出目前這一頁，寬度自動貼合容器
  useEffect(() => {
    if (!doc || !canvasRef.current) return;
    let cancelled = false;

    (async () => {
      // 先確實等上一次的渲染結束再開始下一次。
      // 設定 canvas.width 會清空畫布，若兩次繪製交錯，新畫的內容會被舊的抹掉。
      const prev = renderTaskRef.current;
      if (prev) {
        prev.cancel();
        try { await prev.promise; } catch { /* 取消必然 reject，屬預期 */ }
        renderTaskRef.current = null;
      }
      if (cancelled) return;

      let page;
      try { page = await doc.getPage(pageNum); } catch { return; }
      if (cancelled || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const avail = (wrapRef.current?.clientWidth || 800) - 24;
      const base = page.getViewport({ scale: 1 });
      const scale = (avail / base.width) * zoom;
      // 高解析螢幕要乘上 devicePixelRatio，否則譜會糊
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = page.getViewport({ scale: scale * dpr });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / dpr}px`;
      canvas.style.height = `${viewport.height / dpr}px`;

      const task = page.render({ canvasContext: canvas.getContext('2d'), viewport });
      renderTaskRef.current = task;
      try { await task.promise; } catch { /* 換頁時被取消，忽略 */ }
    })();

    return () => { cancelled = true; };
  }, [doc, pageNum, zoom]);

  if (!sheet) {
    return (
      <div className="flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400" style={{ height }}>
        <FileText size={36} className="mb-2 opacity-30" />
        <p className="text-sm">{t('這首歌還沒有樂譜', language)}</p>
      </div>
    );
  }

  const total = doc?.numPages || 0;
  return (
    <div className="flex flex-col bg-slate-100 border border-slate-200 rounded-xl overflow-hidden" style={{ height }}>
      {/* 工具列 */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-1">
          <button onClick={() => setPageNum(n => Math.max(1, n - 1))} disabled={pageNum <= 1 || !doc}
            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-slate-50 disabled:opacity-30 transition"><ChevronLeft size={18}/></button>
          <span className="text-xs font-mono font-bold text-slate-600 tabular-nums min-w-[62px] text-center">
            {total ? `${pageNum} / ${total}` : '—'}
          </span>
          <button onClick={() => setPageNum(n => Math.min(total, n + 1))} disabled={pageNum >= total || !doc}
            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-slate-50 disabled:opacity-30 transition"><ChevronRight size={18}/></button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))} disabled={zoom <= 0.5}
            className="px-2 py-1 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-slate-50 text-sm font-bold disabled:opacity-30 transition">−</button>
          <button onClick={() => setZoom(1)}
            className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-500 hover:text-sky-600 hover:bg-slate-50 transition tabular-nums">{Math.round(zoom * 100)}%</button>
          <button onClick={() => setZoom(z => Math.min(3, +(z + 0.25).toFixed(2)))} disabled={zoom >= 3}
            className="px-2 py-1 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-slate-50 text-sm font-bold disabled:opacity-30 transition">＋</button>
          <a href={sheet.url} target="_blank" rel="noopener noreferrer"
             className="ml-1 p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-slate-50 transition"><Eye size={16}/></a>
        </div>
      </div>

      {/* 畫布 */}
      <div ref={wrapRef} className="flex-1 overflow-auto custom-scrollbar p-3 flex justify-center items-start">
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <Loader2 size={28} className="animate-spin"/>
            <p className="text-xs">{t('樂譜載入中...', language)}</p>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
            <FileText size={32} className="text-slate-300"/>
            <p className="text-sm text-slate-500">{t('樂譜載入失敗', language)}</p>
            <a href={sheet.url} target="_blank" rel="noopener noreferrer"
               className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold rounded-xl shadow-md transition">
              {t('改用新分頁開啟', language)}
            </a>
          </div>
        )}
        <canvas ref={canvasRef} className={`shadow-lg bg-white rounded ${status === 'ready' ? '' : 'hidden'}`} />
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Main Application Component
// -----------------------------------------------------------------------------
export default function App() {
  const [language, setLanguage] = useState('zh');

  // --- Auth & Admin State ---
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [pendingAuthAction, setPendingAuthAction] = useState(null);

  // 管理權限直接由登入狀態推導，不另存 state —— 避免前端狀態與實際權限脫節。
  // 真正的權限判定在 Firestore 規則，這裡只決定 UI 要不要顯示編輯按鈕。
  const isAdmin = !!user && !user.isAnonymous;

  // --- Database State ---
  const [songsDb, setSongsDb] = useState([]);
  const [setlistsDb, setSetlistsDb] = useState([]);
  const [isDbReady, setIsDbReady] = useState(false);
  const [dbError, setDbError] = useState('');
  const [sheetPool, setSheetPool] = useState([]);
  const [activeSheetSong, setActiveSheetSong] = useState(0);
  const [activeSheetId, setActiveSheetId] = useState(null);

  // --- View State ---
  const [view, setView] = useState('home'); 
  const [previewSource, setPreviewSource] = useState('list'); 
  const [manualSource, setManualSource] = useState('manage'); 
  const [setlist, setSetlist] = useState([]);
  const [pdfMode, setPdfMode] = useState('normal'); // 'normal' | 'onepage' | 'large'
  
  const today = new Date().toISOString().split('T')[0];
  const [meta, setMeta] = useState({ date: today, wl: '', youtubePlaylistUrl: '' });
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Setlist Management State ---
  const [currentSetlistId, setCurrentSetlistId] = useState(null);
  const [isSavingSetlist, setIsSavingSetlist] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteSetlistConfirmId, setDeleteSetlistConfirmId] = useState(null);
  const [homeSearchQuery, setHomeSearchQuery] = useState(''); 
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Track changes for Auto-Save
  const [hasSetlistChanges, setHasSetlistChanges] = useState(false);

  // --- Feature State ---
  const [showComingSoonModal, setShowComingSoonModal] = useState(false); 
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');

  // --- Editor State ---
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentKey, setCurrentKey] = useState('C');
  const [currentMap, setCurrentMap] = useState('');

  // --- Manual Entry State ---
  const [editingDbSongId, setEditingDbSongId] = useState(null); 
  const [customTitle, setCustomTitle] = useState('');
  const [customArtist, setCustomArtist] = useState('');
  const [customKey, setCustomKey] = useState('C');
  const [customYoutubeUrl, setCustomYoutubeUrl] = useState('');
  const [customHasMultitrack, setCustomHasMultitrack] = useState(false);
  const [customLyrics, setCustomLyrics] = useState([{ section: 'V', text: '' }]);
  const [isSaving, setIsSaving] = useState(false);
  // Track initial state to enable save button when changes occur
  const [initialCustomState, setInitialCustomState] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [librarySearch, setLibrarySearch] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [saveError, setSaveError] = useState('');

  const searchRef = useRef(null);
  const addDropdownRef = useRef(null);

  // -----------------------------------------------------------------------------
  // Firebase Auth
  // -----------------------------------------------------------------------------
  useEffect(() => {
    // 由 onAuthStateChanged 單一入口決定登入狀態：
    // 已登入（主領帳號或既有匿名 session）就沿用，只有完全沒有 session 才建立匿名身分。
    // 這樣主領重新整理頁面後不會被降回訪客。
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (account) => {
      if (account) { setUser(account); return; }
      setUser(null);
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(firebaseAuth, __initial_auth_token);
        } else {
          await signInAnonymously(firebaseAuth);
        }
      } catch (error) {
        console.error("Firebase Auth Error:", error);
        // 存原文當 key，在畫面上才依語言翻譯，避免語言切換時重建連線
        setDbError('無法連線至雲端資料庫，畫面上的內容可能不是最新的。');
      }
    });
    return () => unsubscribe();
  }, []);

  // -----------------------------------------------------------------------------
  // Data Sync (Cloud Firestore)
  // -----------------------------------------------------------------------------
  useEffect(() => {
    if (!user) return;
    
    // 1. Sync Songs
    const songsRef = collection(firestoreDb, 'artifacts', currentAppId, 'public', 'data', 'icc_songs');
    const unsubSongs = onSnapshot(songsRef, (snapshot) => {
      const loaded = snapshot.docs.map(d => d.data());
      loaded.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      setSongsDb(loaded);
      setIsDbReady(true);
      setDbError('');
    }, (err) => {
      // 讀不到就明講，不再靜默改用假資料 —— 否則主領會以為自己在編輯真的歌單
      console.error("Firestore Songs Error:", err);
      setIsDbReady(true);
      setDbError('無法讀取雲端詩歌庫，畫面上的內容可能不是最新的。');
    });

    // 2. Sync Setlists
    const setlistsRef = collection(firestoreDb, 'artifacts', currentAppId, 'public', 'data', 'icc_setlists');
    const unsubSetlists = onSnapshot(setlistsRef, (snapshot) => {
      const loaded = snapshot.docs.map(d => d.data());
      loaded.sort((a, b) => new Date(b.date) - new Date(a.date));
      setSetlistsDb(loaded);
      setDbError('');
    }, (err) => {
      console.error("Firestore Setlists Error:", err);
      setDbError('無法讀取雲端歌單，畫面上的內容可能不是最新的。');
    });

    // 3. Sync 待用樂譜庫（尚未關聯到任何歌曲的樂譜）
    const poolRef = collection(firestoreDb, 'artifacts', currentAppId, 'public', 'data', 'icc_sheet_pool');
    const unsubPool = onSnapshot(poolRef, (snapshot) => {
      const all = [];
      snapshot.docs
        .map(d => d.data())
        .sort((a, b) => (a.index || 0) - (b.index || 0))
        .forEach(part => (part.sheets || []).forEach(x => all.push(x)));
      setSheetPool(all);
    }, (err) => console.error("Firestore Sheet Pool Error:", err));

    return () => { unsubSongs(); unsubSetlists(); unsubPool(); };
  }, [user]);

  // -----------------------------------------------------------------------------
  // UI Logic & Helpers
  // -----------------------------------------------------------------------------
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowDropdown(false);
      if (addDropdownRef.current && !addDropdownRef.current.contains(event.target)) setShowAddDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
    setSearchResults(songsDb.filter(s => {
      const titleMatch = String(s.title||'').toLowerCase().includes(q);
      const artistMatch = String(s.artist||'').toLowerCase().includes(q);
      const mtMatch = (q === 'mt' || q === 'multitrack' || q === 'multitracks') && s.hasMultitrack;
      return titleMatch || artistMatch || mtMatch;
    }));
  }, [searchQuery, songsDb]);

  // Check for unsaved changes in manual entry mode
  useEffect(() => {
    if (view !== 'manual' || !initialCustomState) return;
    
    const currentState = {
      title: customTitle,
      artist: customArtist,
      key: customKey,
      youtubeUrl: customYoutubeUrl,
      hasMultitrack: customHasMultitrack,
      lyrics: JSON.stringify(customLyrics)
    };
    
    const hasChanges = Object.keys(currentState).some(
      k => currentState[k] !== initialCustomState[k]
    );
    
    setHasUnsavedChanges(hasChanges);
  }, [customTitle, customArtist, customKey, customYoutubeUrl, customHasMultitrack, customLyrics, initialCustomState, view]);

  // --- Auto-Save Logic for Setlist ---
  const saveCurrentSetlist = useCallback(async () => {
    if (!user) return;
    setIsSavingSetlist(true);
    try {
      const id = currentSetlistId || 'setlist-' + Date.now();
      await setDoc(doc(firestoreDb, 'artifacts', currentAppId, 'public', 'data', 'icc_setlists', id), { 
        id, 
        date: meta.date, 
        wl: meta.wl, 
        youtubePlaylistUrl: meta.youtubePlaylistUrl || '',
        songs: setlist, 
        updatedAt: new Date().toISOString() 
      });
      setCurrentSetlistId(id);
      setHasSetlistChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000); 
    } catch (e) { 
      console.error("Save Setlist Error:", e); 
    } finally { 
      setIsSavingSetlist(false); 
    }
  }, [user, currentSetlistId, meta, setlist]);

  // Trigger auto-save after 2 seconds of inactivity if there are changes
  useEffect(() => {
    if (view === 'list' && hasSetlistChanges && !isSavingSetlist) {
      const timer = setTimeout(() => {
        saveCurrentSetlist();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasSetlistChanges, view, saveCurrentSetlist, isSavingSetlist]);

  // Helper functions to update state and mark as changed
  const handleMetaChange = (field, value) => {
    setMeta(prev => ({ ...prev, [field]: value }));
    setHasSetlistChanges(true);
  };

  const handleSetlistChange = (newSetlist) => {
    setSetlist(newSetlist);
    setHasSetlistChanges(true);
  };

  const requireAdmin = (cb) => {
    if (isAdmin) cb();
    else { setPendingAuthAction(() => cb); setAuthPassword(''); setAuthError(''); setShowAuthModal(true); }
  };

  // 密碼交由 Firebase 伺服器驗證。前端不持有、也無從比對密碼，
  // 因此沒有可以被繞過的檢查 —— 真正的把關在 Firestore 規則。
  const handleAuthSubmit = async () => {
    if (!authPassword || isAuthenticating) return;
    setIsAuthenticating(true);
    setAuthError('');
    try {
      await signInWithEmailAndPassword(firebaseAuth, ADMIN_EMAIL, authPassword);
      setAuthPassword('');
      setShowAuthModal(false);
      if (pendingAuthAction) pendingAuthAction();
      setPendingAuthAction(null);
    } catch (error) {
      console.error("Sign-in Error:", error);
      const code = error?.code || '';
      if (code === 'auth/too-many-requests') {
        setAuthError(t('嘗試次數過多，請稍候幾分鐘再試。', language));
      } else if (code === 'auth/network-request-failed') {
        setAuthError(t('網路連線失敗，請確認網路後再試。', language));
      } else if (code === 'auth/operation-not-allowed' || code === 'auth/user-not-found') {
        setAuthError(t('主領帳號尚未建立，請洽網站管理者。', language));
      } else {
        setAuthError(t('密碼錯誤。', language));
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 共用電腦上用完請登出，把權限交回訪客模式
  const handleSignOut = async () => {
    try {
      await signOut(firebaseAuth);
      setView('home');
    } catch (error) {
      console.error("Sign-out Error:", error);
    }
  };

  const filteredHomeSetlists = setlistsDb.filter(item => {
    const q = homeSearchQuery.toLowerCase();
    if (!q) return true;
    return (String(item.date||'').includes(q)) || (String(item.wl||'').toLowerCase().includes(q)) || (item.songs && item.songs.some(s => String(s.title||'').toLowerCase().includes(q)));
  });

  // --- Calendar Logic ---
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

    weekDays.forEach(day => {
      days.push(<div key={`h-${day}`} className="text-center text-[11px] font-bold text-slate-400 py-1.5">{t(day, language)}</div>);
    });

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`e-${i}`} className="p-1"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const daySetlists = setlistsDb.filter(s => s.date === dateStr);
      const hasSetlist = daySetlists.length > 0;
      const isSelected = homeSearchQuery === dateStr;
      const isToday = dateStr === today;
      
      let tooltipText = '';
      if (hasSetlist) {
        tooltipText = daySetlists.map(s => `${t('主領', language)}: ${s.wl || t('未指定', language)}`).join('\n');
      }

      days.push(
        <div key={d} className="p-1 flex justify-center items-center">
          <button
            onClick={() => {
              if (homeSearchQuery === dateStr) setHomeSearchQuery(''); // 取消過濾
              else if (hasSetlist) setHomeSearchQuery(dateStr); // 過濾此日歌單
            }}
            className={`relative group/tt w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs transition-all
              ${isSelected ? 'bg-sky-500 text-white font-bold shadow-md scale-110' :
                hasSetlist ? 'bg-sky-50 text-sky-600 font-bold hover:bg-sky-100 border border-sky-200 cursor-pointer' :
                isToday ? 'bg-slate-100 text-slate-900 font-bold' :
                'text-slate-400 hover:bg-slate-50 cursor-default opacity-50'}`}
          >
            {d}
            {hasSetlist && !isSelected && (
              <span className="absolute bottom-0.5 w-1 h-1 bg-sky-500 rounded-full"></span>
            )}
            {hasSetlist && <FastTooltip text={tooltipText} />}
          </button>
        </div>
      );
    }
    return days;
  };

  // --- 歌曲熱度統計與排行榜計算 ---
  const songStats = React.useMemo(() => {
    const stats = {};
    const now = new Date();
    // 取得今天的日期基準 (時間歸零)，以利精準比對
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const threeMonthsAgo = new Date(todayDate);
    threeMonthsAgo.setMonth(todayDate.getMonth() - 3);

    // 取得該日期所在週的星期日 (星期日 = 0)
    const getSunday = (date) => {
      const d = new Date(date);
      d.setDate(d.getDate() - d.getDay());
      return d;
    };

    const currentWeekSunday = getSunday(todayDate);

    songsDb.forEach(song => {
      let count3Months = 0;
      let latestDate = null;

      setlistsDb.forEach(sl => {
        if (sl.songs && sl.songs.some(s => s.songId === song.id)) {
          // 解析日期，避免直接 new Date(字串) 造成時區偏移落差
          const parts = (sl.date || '').split('-');
          if (parts.length !== 3) return;
          const setlistDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));

          // 忽略尚未發生的未來歌單
          if (setlistDate > todayDate) {
            return;
          }

          if (setlistDate >= threeMonthsAgo && setlistDate <= todayDate) {
            count3Months++;
          }
          
          if (!latestDate || setlistDate > latestDate) {
            latestDate = setlistDate;
          }
        }
      });

      let weeksAgo = null;
      if (latestDate) {
        const latestWeekSunday = getSunday(latestDate);
        const diffTime = currentWeekSunday.getTime() - latestWeekSunday.getTime();
        // 考量日光節約等時間差，使用 Math.round 四捨五入天數後除以 7
        weeksAgo = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24 * 7)));
      }

      stats[song.id] = { count3Months, weeksAgo };
    });
    return stats;
  }, [songsDb, setlistsDb]);

  const displaySongs = React.useMemo(() => {
    return (searchQuery ? searchResults : songsDb).map(song => ({
      ...song,
      stats: songStats[song.id] || { count3Months: 0, weeksAgo: null }
    })).sort((a, b) => {
      if (!searchQuery && b.stats.count3Months !== a.stats.count3Months) {
        return b.stats.count3Months - a.stats.count3Months; 
      }
      return String(a.title || '').localeCompare(String(b.title || ''));
    });
  }, [songsDb, searchResults, searchQuery, songStats]);

  const libraryDisplaySongs = React.useMemo(() => {
    return songsDb.filter(s => {
        const q = librarySearch.toLowerCase();
        const titleMatch = String(s.title||'').toLowerCase().includes(q);
        const artistMatch = String(s.artist||'').toLowerCase().includes(q);
        const mtMatch = (q === 'mt' || q === 'multitrack' || q === 'multitracks') && s.hasMultitrack;
        return titleMatch || artistMatch || mtMatch;
      })
      .map(song => ({
        ...song,
        stats: songStats[song.id] || { count3Months: 0, weeksAgo: null }
      })).sort((a, b) => {
        if (!librarySearch && b.stats.count3Months !== a.stats.count3Months) {
          return b.stats.count3Months - a.stats.count3Months;
        }
        return String(a.title || '').localeCompare(String(b.title || ''));
      });
  }, [songsDb, librarySearch, songStats]);

  const executeDeleteSetlist = async (id) => {
    if (!user) return;
    try { await deleteDoc(doc(firestoreDb, 'artifacts', currentAppId, 'public', 'data', 'icc_setlists', id)); } finally { setDeleteSetlistConfirmId(null); }
  };

  const openSetlist = (obj) => { 
    setCurrentSetlistId(obj.id); 
    setMeta({ date: obj.date, wl: obj.wl, youtubePlaylistUrl: obj.youtubePlaylistUrl || '' }); 
    setSetlist(obj.songs || []); 
    setHasSetlistChanges(false);
    setView('list'); 
  };
  const createNewSetlist = () => { setCurrentSetlistId(null); setMeta({ date: today, wl: '', youtubePlaylistUrl: '' }); setSetlist([]); setHasSetlistChanges(false); setView('list'); };
  const openPreviewFromHome = (obj) => { openSetlist(obj); setPreviewSource('home'); setView('preview'); };
  const openPreviewFromList = () => { setPreviewSource('list'); setView('preview'); };

  const openEditor = (item = null) => {
    setEditingItem(item);
    if (item) {
      const dbSong = songsDb.find(s => s.id === item.songId);
      setCurrentSong(dbSong || { id: item.songId, title: item.title, lyrics: item.lyrics, hasMultitrack: item.hasMultitrack });
      setCurrentKey(item.key || 'C');
      setCurrentMap(item.mapString || '');
      setSearchQuery(item.title || '');
    } else {
      setCurrentSong(null);
      setCurrentKey('C');
      setCurrentMap('');
      setSearchQuery('');
    }
    setView('editor');
  };

  // --- 優化 PDF 匯出機制 ---
  const handleExportPDF = async () => {
    if (setlist.length === 0) return;
    setIsGenerating(true);
    try {
      if (!window.html2pdf) {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
          s.onload = res; s.onerror = rej; document.head.appendChild(s);
        });
      }
      
      const el = document.getElementById('pdf-print-area');
      const dateStr = meta.date ? meta.date.replace(/-/g, '') : 'Date';
      
      // 優化分頁配置: [Top, Right, Bottom, Left]
      // 左右 margin 設為 0 以避免 HTML (w-816px) 在轉換時被水平壓縮導致吃字。
      // 上下 margin 設為 0.4 英吋確保印表機有足夠的安全邊距。
      const opt = { 
        margin: [0.4, 0, 0.4, 0], 
        filename: `ICC_WorshipMap_${dateStr}.pdf`, 
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 }, 
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: '.pdf-avoid-break' } 
      };
      await window.html2pdf().set(opt).from(el).save();
    } catch (e) { console.error("PDF Export Error:", e); } finally { setIsGenerating(false); }
  };

  const handleSelectSong = (song) => { 
    setCurrentSong(song); 
    setCurrentKey(song.defaultKey || 'C'); 
    setCurrentMap(''); 
    setSearchQuery(song.title); 
    setShowDropdown(false); 
  };

  const handleAppendTag = (tag) => { setCurrentMap(prev => prev ? `${prev}-${tag}` : tag); };
  
  const saveToSetlist = () => {
    if (!currentSong) return;
    // 修復更新邏輯：確保加入或更新歌單時，把 currentSong 最新編輯過的 lyrics 快照一併存入
    if (editingItem) handleSetlistChange(setlist.map(i => i.id === editingItem.id ? { ...i, key: currentKey, mapString: currentMap, lyrics: currentSong.lyrics } : i));
    else handleSetlistChange([...setlist, { id: generateId(), songId: currentSong.id, title: currentSong.title, key: currentKey, mapString: currentMap, lyrics: currentSong.lyrics }]);
    setView('list');
  };

  const moveItem = (idx, dir) => {
    const nl = [...setlist];
    if (dir === 'up' && idx > 0) [nl[idx-1], nl[idx]] = [nl[idx], nl[idx-1]];
    else if (dir === 'down' && idx < setlist.length - 1) [nl[idx+1], nl[idx]] = [nl[idx], nl[idx+1]];
    handleSetlistChange(nl);
  };

  const deleteItem = (id) => { handleSetlistChange(setlist.filter(item => item.id !== id)); };

  const openManualEntry = (songToEdit = null, initialTitle = '', source = 'manage') => {
    setManualSource(source);
    setSaveError('');
    setHasUnsavedChanges(false);
    
    if (songToEdit) {
      setEditingDbSongId(songToEdit.id); 
      setCustomTitle(songToEdit.title); 
      setCustomArtist(songToEdit.artist || ''); 
      setCustomKey(songToEdit.defaultKey || 'C'); 
      setCustomYoutubeUrl(songToEdit.youtubeId ? `https://youtu.be/${songToEdit.youtubeId}` : ''); 
      setCustomHasMultitrack(songToEdit.hasMultitrack || false);
      const lyrics = songToEdit.lyrics && Array.isArray(songToEdit.lyrics) && songToEdit.lyrics.length > 0 ? songToEdit.lyrics : [{ section: 'V', text: '' }];
      setCustomLyrics(lyrics);
      
      setInitialCustomState({
        title: songToEdit.title,
        artist: songToEdit.artist || '',
        key: songToEdit.defaultKey || 'C',
        youtubeUrl: songToEdit.youtubeId ? `https://youtu.be/${songToEdit.youtubeId}` : '',
        hasMultitrack: songToEdit.hasMultitrack || false,
        lyrics: JSON.stringify(lyrics)
      });
    } else {
      setEditingDbSongId(null); 
      setCustomTitle(initialTitle); 
      setCustomArtist(''); 
      setCustomKey('C'); 
      setCustomYoutubeUrl(''); 
      setCustomHasMultitrack(false);
      setCustomLyrics([{ section: 'V', text: '' }]);
      
      setInitialCustomState({
        title: initialTitle,
        artist: '',
        key: 'C',
        youtubeUrl: '',
        hasMultitrack: false,
        lyrics: JSON.stringify([{ section: 'V', text: '' }])
      });
    }
    setView('manual'); setShowDropdown(false);
  };

  const handleSaveCustomSong = async () => {
    if (!customTitle.trim()) { setSaveError(t('請輸入歌名！', language)); return; }
    if (!user) { setSaveError(t('資料庫尚未連線，請稍後再試。', language)); return; }
    
    setIsSaving(true);
    setSaveError('');
    
    try {
      const sid = editingDbSongId || 'custom-' + Date.now();
      const extractId = (url) => String(url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]{11})/)?.[1] || String(url || '');
      
      // 確保使用者如果只有加上標籤(如 L1、Intro)但沒有歌詞，也能夠存進資料庫，不要被過濾掉
      const filteredLyrics = customLyrics
        .filter(l => l.section && String(l.section).trim() !== '')
        .map(l => ({ 
          section: String(l.section).trim().toUpperCase(), 
          text: String(l.text || '').trim() 
        }));

      const ns = { 
        id: sid, 
        title: customTitle, 
        artist: customArtist || 'Custom', 
        defaultKey: customKey, 
        youtubeId: extractId(customYoutubeUrl) || '', 
        hasMultitrack: customHasMultitrack,
        lyrics: filteredLyrics 
      };
      
      await setDoc(doc(firestoreDb, 'artifacts', currentAppId, 'public', 'data', 'icc_songs', sid), ns);
      
      setHasUnsavedChanges(false);
      
      if (manualSource === 'editor') { setCurrentSong(ns); setSearchQuery(ns.title); setView('editor'); } 
      else { setView('manage'); }
    } catch (error) { 
      console.error("Firestore Save Error:", error); 
      setSaveError(t('儲存至雲端時發生錯誤：', language) + String(error.message));
    } finally { 
      setIsSaving(false); 
    }
  };

  // ---------------------------------------------------------------------------
  // 樂譜管理
  // ---------------------------------------------------------------------------
  const [sheetBusy, setSheetBusy] = useState('');
  const [sheetError, setSheetError] = useState('');
  const [showPoolPicker, setShowPoolPicker] = useState(false);
  const [poolSearch, setPoolSearch] = useState('');

  // 待用池存成多份文件（每份 250 筆），改動時整批重寫
  const writePool = async (list) => {
    const CHUNK = 250;
    const parts = Math.max(1, Math.ceil(list.length / CHUNK));
    for (let i = 0; i < parts; i++) {
      await setDoc(doc(firestoreDb, 'artifacts', currentAppId, 'public', 'data', 'icc_sheet_pool', `part-${i}`), {
        index: i,
        sheets: list.slice(i * CHUNK, (i + 1) * CHUNK),
        updatedAt: new Date().toISOString(),
      });
    }
    // 清掉因為變短而多出來的舊分頁
    const stale = Math.ceil(sheetPool.length / CHUNK);
    for (let i = parts; i < stale; i++) {
      await deleteDoc(doc(firestoreDb, 'artifacts', currentAppId, 'public', 'data', 'icc_sheet_pool', `part-${i}`)).catch(() => {});
    }
  };

  const saveSongSheets = async (songId, sheets) => {
    const song = songsDb.find(x => x.id === songId);
    if (!song) throw new Error('找不到歌曲');
    await setDoc(doc(firestoreDb, 'artifacts', currentAppId, 'public', 'data', 'icc_songs', songId),
                 { ...song, sheets }, { merge: true });
  };

  // 修改樂譜的調性／註記／名稱
  const updateSheetMeta = async (songId, sheetId, patch) => {
    setSheetBusy(sheetId); setSheetError('');
    try {
      const song = songsDb.find(x => x.id === songId);
      await saveSongSheets(songId, (song.sheets || []).map(x => x.id === sheetId ? { ...x, ...patch } : x));
    } catch (e) { setSheetError(String(e.message)); }
    finally { setSheetBusy(''); }
  };

  // 從歌曲移除 -> 回到待用池（可還原）
  const unlinkSheet = async (songId, sheetId) => {
    setSheetBusy(sheetId); setSheetError('');
    try {
      const song = songsDb.find(x => x.id === songId);
      const sheet = (song.sheets || []).find(x => x.id === sheetId);
      await saveSongSheets(songId, (song.sheets || []).filter(x => x.id !== sheetId));
      if (sheet && !sheetPool.some(x => x.id === sheetId)) {
        await writePool([...sheetPool, sheet]);
      }
    } catch (e) { setSheetError(String(e.message)); }
    finally { setSheetBusy(''); }
  };

  // 從待用池關聯到歌曲
  const attachSheet = async (songId, sheet) => {
    setSheetBusy(sheet.id); setSheetError('');
    try {
      const song = songsDb.find(x => x.id === songId);
      const cur = song.sheets || [];
      if (!cur.some(x => x.id === sheet.id)) await saveSongSheets(songId, [...cur, sheet]);
      await writePool(sheetPool.filter(x => x.id !== sheet.id));
      setShowPoolPicker(false); setPoolSearch('');
    } catch (e) { setSheetError(String(e.message)); }
    finally { setSheetBusy(''); }
  };

  // 上傳新樂譜：先向後端換取一次性上傳網址，再由瀏覽器直傳 R2
  const [uploadingSheet, setUploadingSheet] = useState(false);
  const [deleteSheetTarget, setDeleteSheetTarget] = useState(null);
  const [previewSheet, setPreviewSheet] = useState(null);

  const callSheetApi = async (payload) => {
    const token = await firebaseAuth.currentUser?.getIdToken();
    if (!token) throw new Error(t('請先登入主領帳號', language));
    const r = await fetch('/api/sheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
    return data;
  };

  // 確保歌曲已存在於資料庫（新建立的歌先存檔才能掛樂譜）
  const ensureSongSaved = async () => {
    if (editingDbSongId) return editingDbSongId;
    if (!customTitle.trim()) throw new Error(t('請先輸入歌名再上傳樂譜', language));
    const sid = 'custom-' + Date.now();
    const extractId = (url) => String(url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]{11})/)?.[1] || String(url || '');
    const ns = {
      id: sid, title: customTitle, artist: customArtist || 'Custom', defaultKey: customKey,
      youtubeId: extractId(customYoutubeUrl) || '', hasMultitrack: customHasMultitrack,
      lyrics: customLyrics.filter(l => l.section && String(l.section).trim() !== '')
        .map(l => ({ section: String(l.section).trim().toUpperCase(), text: String(l.text || '').trim() })),
      sheets: [],
    };
    await setDoc(doc(firestoreDb, 'artifacts', currentAppId, 'public', 'data', 'icc_songs', sid), ns);
    setEditingDbSongId(sid);
    return sid;
  };

  const handleUploadSheet = async (file, opts = {}) => {
    if (!file) return;
    setUploadingSheet(true); setSheetError('');
    try {
      const songId = opts.songId || await ensureSongSaved();
      let payload = file;
      if (file.type.startsWith('image/')) {
        try { payload = await imageFileToPdf(file); }
        catch { /* 轉檔失敗就照原檔上傳，不擋住使用者 */ }
      }
      const niceName = [opts.title || customTitle || '樂譜', opts.key || null, opts.label || null]
        .filter(Boolean).join('_');
      const { uploadUrl, key, publicUrl } = await callSheetApi({
        action: 'upload', contentType: payload.type, size: payload.size, filename: niceName,
      });
      const put = await fetch(uploadUrl, { method: 'PUT', body: payload, headers: { 'Content-Type': payload.type } });
      if (!put.ok) throw new Error(t('檔案上傳失敗，請再試一次。', language));

      const fresh = songsDb.find(x => x.id === songId);
      const sheet = {
        id: generateId(),
        key: opts.key ?? (customKey || null),
        label: opts.label || null,
        title: opts.title || customTitle || fresh?.title || '',
        url: publicUrl, r2key: key, pageCount: 1,
        source: 'upload', uploadedAt: new Date().toISOString(),
      };
      const song = songsDb.find(x => x.id === songId);
      const cur = song?.sheets || [];
      await setDoc(doc(firestoreDb, 'artifacts', currentAppId, 'public', 'data', 'icc_songs', songId),
                   { ...(song || { id: songId }), sheets: [...cur, sheet] }, { merge: true });
    } catch (e) {
      setSheetError(String(e.message));
    } finally {
      setUploadingSheet(false);
    }
  };

  // 永久刪除：連 R2 上的檔案一起移除，不可復原
  const handleDeleteSheetForever = async (sheet) => {
    setSheetBusy(sheet.id); setSheetError('');
    try {
      const r2key = sheet.r2key || (() => {
        try { return new URL(sheet.url).pathname.replace(/^\//, ''); } catch { return null; }
      })();
      if (r2key) await callSheetApi({ action: 'delete', key: r2key });
      const song = songsDb.find(x => x.id === editingDbSongId);
      if (song) await saveSongSheets(editingDbSongId, (song.sheets || []).filter(x => x.id !== sheet.id));
      await writePool(sheetPool.filter(x => x.id !== sheet.id));
      setDeleteSheetTarget(null);
    } catch (e) { setSheetError(String(e.message)); }
    finally { setSheetBusy(''); }
  };

  const executeDeleteDbSong = async (id) => { if (!user) return; await deleteDoc(doc(firestoreDb, 'artifacts', currentAppId, 'public', 'data', 'icc_songs', id)); setDeleteConfirmId(null); };

  // --- JSON Import Logic ---
  const handleImportSubmit = async () => {
    if (!importText.trim()) return setImportError(t("請先貼上 JSON 內容", language));
    setIsImporting(true);
    setImportError('');
    try {
      const result = cleanAndParseJSON(importText);
      if (result && result.songs && Array.isArray(result.songs) && result.songs.length > 0) {
        
        const newSetlistSongs = [];
        
        for (const song of result.songs) {
          const cleanTitle = cleanString(song.title || t('未命名', language));
          const cleanKey = cleanString(song.key || 'C');
          const cleanMap = cleanString(song.mapString || '');
          
          let existingSong = songsDb.find(s => String(s.title||'').replace(/\s+/g,'').toLowerCase() === cleanTitle.replace(/\s+/g,'').toLowerCase());
          
          const cleanLyrics = (Array.isArray(song.lyrics) ? song.lyrics : [])
            .filter(l => l.section && String(l.section).trim() !== '')
            .map(l => ({
               section: cleanString(l.section || 'V').toUpperCase(),
               text: cleanString(l.text || '')
            }));

          if (!existingSong) {
            existingSong = {
              id: 'imported-song-' + generateId(),
              title: cleanTitle,
              artist: 'JSON 匯入',
              defaultKey: cleanKey,
              youtubeId: '',
              hasMultitrack: false,
              lyrics: cleanLyrics
            };
            if (user) {
              await setDoc(doc(firestoreDb, 'artifacts', currentAppId, 'public', 'data', 'icc_songs', existingSong.id), existingSong);
            }
          }

          newSetlistSongs.push({
            id: generateId(),
            songId: existingSong.id,
            title: cleanTitle,
            key: cleanKey || existingSong.defaultKey || 'C',
            mapString: cleanMap,
            lyrics: cleanLyrics.length > 0 ? cleanLyrics : (existingSong.lyrics || [])
          });
        }
        
        const newSetlistId = 'setlist-' + Date.now();
        let cleanDate = cleanString(result.date || today);
        const dateMatch = cleanDate.match(/\d{4}-\d{2}-\d{2}/);
        cleanDate = dateMatch ? dateMatch[0] : today;

        const cleanWl = cleanString(result.wl || '');
        const cleanYoutubeUrl = cleanString(result.youtubePlaylistUrl || '');

        const setlistData = {
          id: newSetlistId,
          date: cleanDate,
          wl: cleanWl,
          youtubePlaylistUrl: cleanYoutubeUrl,
          songs: newSetlistSongs,
          updatedAt: new Date().toISOString()
        };

        if (user) {
          await setDoc(doc(firestoreDb, 'artifacts', currentAppId, 'public', 'data', 'icc_setlists', newSetlistId), setlistData);
        }
        
        setShowImportModal(false);
        setImportText('');
        openSetlist(setlistData);
      } else {
        setImportError(t("無法解析內容，請確認 JSON 格式是否包含 songs 陣列。", language));
      }
    } catch(e) {
      setImportError(t("JSON 解析失敗，請檢查格式是否正確：", language) + String(e.message));
    } finally {
      setIsImporting(false);
    }
  };

  const getMonthNameShort = (m) => ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][parseInt(m)-1] || m;

  // -----------------------------------------------------------------------------
  // Render Components
  // -----------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans relative flex flex-col">
      <datalist id="key-list">
        {KEYS.map(k => <option key={k} value={k} />)}
      </datalist>
      <datalist id="section-list">
        {SONG_MAP_TAGS.map(t => <option key={t} value={t} />)}
      </datalist>

      {/* Hidden Print Area */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <div id="actual-print-area">
          <PrintLayoutContent meta={meta} setlist={setlist} songsDb={songsDb} language={language} t={t} getTagExplanation={getTagExplanation} getFullTagExplanation={getFullTagExplanation} pdfMode={pdfMode} />
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="text-5xl mb-4 animate-bounce">🐰</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-2">
              <Lock size={20} className="text-sky-500"/> {t('系統驗證', language)}
            </h3>
            <div className="text-slate-600 text-[14px] leading-relaxed mb-6 font-medium bg-sky-50 p-4 rounded-xl border border-sky-100 shadow-inner">
              {t('編輯功能目前僅開放主領使用，', language)}<br/>{t('如需權限請洽師母 🙏', language)}
            </div>
            <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAuthSubmit()} disabled={isAuthenticating} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50 outline-none transition focus:border-sky-500 text-center text-lg tracking-widest mb-2 shadow-sm disabled:opacity-60" placeholder="******" autoComplete="current-password" autoFocus />
            {authError && <p className="text-red-500 text-xs font-bold mb-2">{String(authError)}</p>}
            <div className="flex justify-center gap-3 mt-6">
              <button onClick={() => setShowAuthModal(false)} disabled={isAuthenticating} className="px-5 py-2.5 text-sm text-slate-500 hover:bg-slate-100 rounded-xl transition font-bold disabled:opacity-50">{t('取消返回', language)}</button>
              <button onClick={handleAuthSubmit} disabled={isAuthenticating || !authPassword} className="px-6 py-2.5 text-sm bg-sky-500 hover:bg-sky-600 text-white rounded-xl transition shadow-md font-bold disabled:opacity-50 flex items-center gap-2">
                {isAuthenticating && <Loader2 size={14} className="animate-spin"/>}
                {isAuthenticating ? t('驗證中...', language) : t('確認解鎖', language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSON Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header - Fixed at top */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 shrink-0">
              <h3 className="text-xl font-bold flex items-center gap-2 font-serif text-slate-900">
                <Code size={22} className="text-sky-500"/> {t('貼上 JSON 匯入歌單', language)}
              </h3>
              <button onClick={() => !isImporting && setShowImportModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24}/>
              </button>
            </div>
            
            {/* Body - Scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 py-4 flex flex-col gap-4">
              <div className="text-[13px] text-slate-600 leading-relaxed bg-sky-50 p-4 rounded-xl border border-sky-100 shrink-0">
                <p className="mb-2 font-medium text-slate-700">
                  {t('透過此功能，您可以將過往的 SongMap 快速匯入系統，協助擴充雲端歌單。', language)}
                </p>
                <ol className="list-decimal pl-4 space-y-1.5">
                  <li>
                    {t('請先申請或登入', language)} <a href="https://gemini.google.com/app" target="_blank" rel="noopener noreferrer" className="text-sky-600 font-bold hover:underline">{t('Google Gemini AI 免費帳號', language)}</a>。
                  </li>
                  <li>
                    {t('登入後，請點擊進入', language)} <a href="https://gemini.google.com/gem/1YkkQT2ImJy4mmH2p2-EOB6rjzyRfnoxZ?usp=sharing" target="_blank" rel="noopener noreferrer" className="text-sky-600 font-bold hover:underline">{t('歌單資訊轉換程式', language)}</a>。
                  </li>
                  <li>
                    {t('點擊左下方的「+」號上傳欲轉換的 SongMap 檔案，接著直接按下右下角的送出鍵（不需輸入任何指令）。', language)}
                  </li>
                  <li>
                    {t('複製 AI 產生的 JSON 格式文字，貼到下方輸入框中並開始匯入。系統會自動過濾多餘標籤，並將新詩歌建檔存入雲端！✨', language)}
                  </li>
                </ol>
              </div>

              <div className="flex-1 flex flex-col min-h-[150px] shrink-0">
                <textarea
                  value={importText}
                  onChange={(e) => { setImportText(e.target.value); setImportError(''); }}
                  className="w-full flex-1 p-4 border-2 border-slate-200 rounded-xl bg-slate-50 outline-none transition focus:border-sky-500 font-mono text-sm resize-none custom-scrollbar"
                  placeholder="{\n  &quot;date&quot;: &quot;2026-01-11&quot;,\n  &quot;wl&quot;: &quot;Peggy/Howard&quot;,\n  &quot;youtubePlaylistUrl&quot;: &quot;&quot;,\n  &quot;songs&quot;: [\n    ...\n  ]\n}"
                  disabled={isImporting}
                />
              </div>
            </div>

            {/* Footer - Fixed at bottom */}
            <div className="p-6 sm:p-8 pt-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
              {importError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 font-bold flex flex-col gap-2 shadow-sm">
                  <div className="flex items-start gap-1.5"><X size={16} className="shrink-0 mt-0.5"/> <span className="leading-relaxed">{String(importError)}</span></div>
                </div>
              )}
              
              <div className="flex gap-3">
                <button disabled={isImporting} onClick={() => setShowImportModal(false)} className="flex-1 px-4 py-3 text-sm text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition bg-slate-100">{t('取消', language)}</button>
                <button disabled={isImporting || !importText.trim()} onClick={handleImportSubmit} className="flex-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50">
                  {isImporting ? <Loader2 size={18} className="animate-spin"/> : <Wand2 size={16}/>} 
                  {isImporting ? t('處理並匯入中...', language) : t('開始匯入', language)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 待用樂譜庫挑選器 */}
      {showPoolPicker && (() => {
        const q = poolSearch.trim().toLowerCase();
        const hits = (q ? sheetPool.filter(x =>
          String(x.title || '').toLowerCase().includes(q) ||
          String(x.label || '').toLowerCase().includes(q) ||
          String(x.key || '').toLowerCase() === q
        ) : sheetPool).slice(0, 100);
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
              <div className="flex justify-between items-center p-5 sm:p-6 pb-4 border-b border-slate-100 shrink-0">
                <div>
                  <h3 className="text-lg font-bold font-serif text-slate-900 flex items-center gap-2">
                    <FileText size={20} className="text-[#C4A977]"/> {t('待用樂譜庫', language)}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{sheetPool.length} {t('份尚未關聯的樂譜', language)}</p>
                </div>
                <button onClick={() => { setShowPoolPicker(false); setPoolSearch(''); }} className="text-slate-400 hover:text-slate-600"><X size={22}/></button>
              </div>

              <div className="p-5 sm:p-6 py-3 shrink-0 border-b border-slate-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4"/>
                  <input type="text" value={poolSearch} onChange={e => setPoolSearch(e.target.value)} autoFocus
                    placeholder={t('搜尋歌名、註記或調性...', language)}
                    className="w-full pl-9 pr-4 py-2.5 border rounded-xl bg-slate-50 focus:bg-white focus:border-sky-500 outline-none transition text-sm"/>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 pt-3">
                {hits.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <div className="text-3xl mb-2">🔍</div>
                    <p className="text-sm">{t('待用庫查無符合的樂譜', language)}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {hits.map(sh => (
                      <div key={sh.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:border-sky-300 hover:bg-sky-50/40 transition">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-slate-800 truncate">{sh.title}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">{sheetLabel(sh, language) || '—'}</div>
                        </div>
                        <a href={sh.url} target="_blank" rel="noopener noreferrer"
                           className="relative group/tt shrink-0 p-2 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-white transition">
                          <Eye size={16}/><FastTooltip text={t('先看看內容', language)} position="left"/>
                        </a>
                        <button onClick={() => attachSheet(editingDbSongId, sh)} disabled={sheetBusy === sh.id}
                          className="shrink-0 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1.5">
                          {sheetBusy === sh.id ? <Loader2 size={14} className="animate-spin"/> : <Plus size={14}/>}
                          {t('加入', language)}
                        </button>
                      </div>
                    ))}
                    {sheetPool.length > hits.length && !q && (
                      <p className="text-center text-[11px] text-slate-400 pt-3">{t('僅顯示前 100 筆，請用搜尋縮小範圍', language)}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <ConfirmModal isOpen={!!deleteSheetTarget}
        title={t('永久刪除樂譜？', language)}
        message={t('這會連雲端上的檔案一起刪除，無法復原。若只是想從這首歌拿掉，請改用旁邊的「移除」。', language)}
        cancelText={t('取消', language)} confirmText={t('永久刪除', language)}
        onCancel={() => setDeleteSheetTarget(null)}
        onConfirm={() => handleDeleteSheetForever(deleteSheetTarget)} />

      {/* 樂譜快速預覽 */}
      {previewSheet && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[210] flex items-center justify-center p-3 sm:p-6" onClick={() => setPreviewSheet(null)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[88vh] shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-5 py-3.5 border-b border-slate-100 shrink-0 gap-3">
              <div className="min-w-0">
                <h3 className="font-serif font-bold text-slate-900 truncate">{previewSheet.title}</h3>
                <p className="text-[11px] text-slate-500 font-mono">{sheetLabel(previewSheet, language) || t('未標調性', language)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={previewSheet.url} target="_blank" rel="noopener noreferrer"
                   className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-sky-600 border border-slate-200 hover:border-sky-300 rounded-lg transition flex items-center gap-1.5">
                  <Eye size={13}/> {t('開新分頁', language)}
                </a>
                <button onClick={() => setPreviewSheet(null)} className="text-slate-400 hover:text-slate-600"><X size={22}/></button>
              </div>
            </div>
            <div className="flex-1 p-3 sm:p-4 bg-slate-50 overflow-hidden">
              <SheetViewer key={previewSheet.id} sheet={previewSheet} language={language} height="100%" />
            </div>
          </div>
        </div>
      )}

      {/* Coming Soon Modal */}
      {showComingSoonModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center relative overflow-hidden">
            <button onClick={() => setShowComingSoonModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
            <div className="text-6xl mb-4 animate-bounce mt-2">🙇‍♂️</div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2 font-serif">{t('敬請期待', language)}</h3>
            <p className="text-slate-600 mb-8 text-[15px] leading-relaxed font-medium">
              {t('AI 網址抓取功能開發中！', language)}<br/>{t('爭取在牧師安息回來前做出來 🙏', language)}
            </p>
            <button onClick={() => setShowComingSoonModal(false)} className="w-full px-4 py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl transition shadow-lg text-sm tracking-widest">
              {t('我知道了', language)}
            </button>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      {view !== 'preview' && (
        <div className="bg-white border-b border-slate-200 text-slate-600 text-xs py-3 px-4 sm:px-6 flex flex-col sm:flex-row justify-center sm:justify-between items-center relative z-50 shadow-sm gap-3">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <>
                  <span className="text-sky-600 font-bold flex items-center gap-1"><Unlock size={12}/> {t('權限已解鎖', language)}</span>
                  <button onClick={handleSignOut} className="text-slate-400 hover:text-red-600 transition font-bold underline underline-offset-2">{t('登出', language)}</button>
                </>
              ) : (
                <span className="flex items-center gap-1"><Lock size={12}/> {t('訪客模式', language)}</span>
              )}
            </div>
            {/* 資料庫連線狀態指示 */}
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3 sm:pl-4">
              {user ? (
                <span className="text-emerald-500 font-bold flex items-center gap-1.5 tracking-widest"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> {t('雲端連線', language)}</span>
              ) : (
                <span className="text-amber-500 font-bold flex items-center gap-1.5 tracking-widest"><Loader2 size={12} className="animate-spin" /> {t('連線中...', language)}</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 w-full sm:w-auto">
            <button onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')} className="hover:text-sky-600 transition flex items-center gap-1.5 font-bold bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 shadow-sm">
              <Globe size={12} className="text-sky-500" /> {language === 'zh' ? 'EN' : '中'}
            </button>

            {view !== 'home' && <button onClick={() => setView('home')} className="hover:text-sky-600 transition flex items-center gap-1"><Home size={12}/> {t('返回首頁', language)}</button>}
            
            <button onClick={() => requireAdmin(() => setShowImportModal(true))} className="hover:text-sky-600 transition flex items-center gap-1">
              <Code size={12}/> {t('貼上 JSON 匯入歌單', language)}
            </button>
            
            <button onClick={() => requireAdmin(() => setView('manage'))} className="hover:text-sky-600 transition flex items-center gap-1"><Database size={12}/> {t('雲端詩歌庫', language)}</button>
          </div>
        </div>
      )}

      {/* 資料庫連線異常提示 —— 讓主領知道現在不該編輯 */}
      {dbError && view !== 'preview' && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-xs sm:text-sm py-2.5 px-4 sm:px-6 flex items-center justify-center gap-2 font-bold text-center">
          <X size={16} className="shrink-0"/> {t(dbError, language)}
        </div>
      )}

      {/* Main Views */}
      {view === 'home' && (
        <div className="pb-20">
          <ConfirmModal isOpen={deleteSetlistConfirmId !== null} title={t('確定刪除？', language)} message={t('此動作將移除雲端檔案，無法復原。', language)} cancelText={t('取消', language)} confirmText={t('確認刪除', language)} onCancel={() => setDeleteSetlistConfirmId(null)} onConfirm={() => executeDeleteSetlist(deleteSetlistConfirmId)} />
          <div className="max-w-7xl mx-auto p-4 sm:p-8 relative pt-6 sm:pt-4 text-center">
            
            {/* Header & Slogan */}
            <header className="mb-8 sm:mb-12 border-b border-slate-200 pb-6 sm:pb-8 flex flex-col items-center">
              <ICCLogo className="mb-4 sm:mb-6" />
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4 px-2">
                <BookOpen size={24} className="text-[#C4A977] hidden sm:block"/>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-[0.05em] sm:tracking-[0.08em] text-slate-900 uppercase">ICC Worship Corner</h1>
                <Music size={24} className="text-[#C4A977] hidden sm:block"/>
              </div>
              <div className="text-slate-500 font-medium mb-4 sm:mb-6 flex flex-col items-center justify-center gap-1.5 text-sm sm:text-base font-serif text-center px-4">
                <span className="flex items-center justify-center gap-2 text-slate-700 leading-relaxed">
                  <Sparkles size={16} className="text-[#C4A977] shrink-0"/>
                  <span>{t('「你們要讚美耶和華！因歌頌我們的神為善為美；讚美的話是合宜的。」', language)}</span>
                  <Sparkles size={16} className="text-[#C4A977] shrink-0"/>
                </span>
                <span className="text-[11px] sm:text-xs text-sky-600 tracking-widest mt-1">{t('— 詩篇 147:1 —', language)}</span>
              </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 text-left items-start">
              
              {/* Main List Column */}
              <div className="flex-1 w-full order-2 lg:order-1">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 sm:mb-8 gap-4 text-left">
                  <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 font-serif text-slate-900"><ListMusic size={24} className="text-sky-500"/> {t('近期歌單總覽', language)}</h2>
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <input type="text" placeholder={t('搜尋日期、主領或歌名...', language)} className="w-full sm:w-[350px] pl-4 pr-4 py-2.5 border rounded-xl bg-white focus:border-sky-500 shadow-sm outline-none transition text-sm sm:text-base" value={homeSearchQuery} onChange={e => setHomeSearchQuery(e.target.value)} />
                    <button onClick={() => requireAdmin(createNewSetlist)} className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2.5 rounded-xl shadow-lg font-bold text-sm whitespace-nowrap transition w-full sm:w-auto flex justify-center items-center gap-1">{t('+ 預備歌單', language)}</button>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm divide-y divide-slate-100 text-left flex flex-col">
                  {filteredHomeSetlists.length > 0 ? filteredHomeSetlists.map(item => {
                    const parts = item.date ? String(item.date).split('-') : [];
                    return (
                      <div key={item.id} className="p-4 sm:p-6 md:p-8 hover:bg-slate-50 transition flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8 items-start md:items-center group">
                        
                        <div className="flex gap-4 sm:gap-5 items-center shrink-0 w-full sm:w-auto min-w-[200px] border-b sm:border-0 border-slate-100 pb-3 sm:pb-0">
                          <div className="text-center w-14 sm:w-16">
                            <div className="text-[10px] sm:text-[11px] font-bold text-sky-500 uppercase tracking-widest">{parts[1] ? getMonthNameShort(parts[1]) : 'MTH'}</div>
                            <div className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 my-0.5 leading-none">{parts[2] || 'DD'}</div>
                            <div className="text-[9px] sm:text-[10px] font-mono text-slate-400">{parts[0] || 'YYYY'}</div>
                          </div>
                          <div className="w-px h-10 sm:h-12 bg-slate-200 group-hover:bg-sky-200 transition hidden sm:block"></div>
                          <div className="flex flex-col gap-1">
                            <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><User size={14} className="text-sky-500"/> {item.wl || t('未指定主領', language)}</div>
                            <div className="text-[9px] sm:text-[10px] text-slate-400 italic">{t('更新:', language)} {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '-'}</div>
                          </div>
                        </div>
                        
                        <div className="flex-1 w-full mt-2 sm:mt-0">
                          <div className="flex flex-wrap gap-2 relative">
                            {item.songs?.map((s, i) => {
                              const dbSong = songsDb.find(dbS => dbS.id === s.songId);
                              const ytLink = dbSong?.youtubeId 
                                ? `https://youtu.be/${dbSong.youtubeId}` 
                                : `https://www.youtube.com/results?search_query=${encodeURIComponent(s.title)}`;
                              
                              return (
                                <a key={i} href={ytLink} target="_blank" rel="noopener noreferrer" className="relative group/tt inline-flex items-center text-[12px] sm:text-[13px] font-medium text-slate-700 bg-white border border-slate-200 px-2.5 sm:px-3 py-1.5 rounded-full shadow-sm group-hover:border-sky-200 hover:border-sky-300 hover:text-sky-600 transition cursor-pointer">
                                  <span className="text-sky-500 font-bold mr-1.5 opacity-80">{i+1}.</span>
                                  <span className="truncate max-w-[150px] sm:max-w-none">{String(s.title || t('未命名', language))}</span>
                                  <FastTooltip text={t('前往 YouTube 聆聽', language)} />
                                </a>
                              );
                            })}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 shrink-0 w-full md:w-[130px] pt-4 md:pt-0 mt-2 md:mt-0 border-t md:border-0 border-slate-50">
                          <button onClick={() => openPreviewFromHome(item)} className="w-full px-4 py-2 sm:py-2.5 bg-sky-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md hover:bg-sky-600 transition flex justify-center items-center gap-2">
                            <Eye size={16}/> {t('歌手預覽', language)}
                          </button>
                          <button onClick={() => { setCurrentSetlistId(item.id); setMeta({ date: item.date, wl: item.wl, youtubePlaylistUrl: item.youtubePlaylistUrl || '' }); setSetlist(item.songs || []); setActiveSheetSong(0); setActiveSheetId(null); setView('sheets'); }}
                            className="w-full px-4 py-2 sm:py-2.5 bg-[#C4A977] hover:bg-[#B39866] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition flex justify-center items-center gap-2">
                            <FileText size={16}/> {t('樂手樂譜', language)}
                          </button>
                          <div className="flex items-center justify-between md:justify-end gap-2 w-full">
                            {item.youtubePlaylistUrl && (
                              <a href={item.youtubePlaylistUrl} target="_blank" rel="noopener noreferrer" className="relative group/tt flex-1 md:flex-none p-2 sm:p-2 bg-white border border-slate-200 text-red-500 rounded-xl hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition shadow-sm flex justify-center items-center">
                                <Youtube size={16}/>
                                <FastTooltip text={t('YouTube 播放清單', language)} position="top" />
                              </a>
                            )}
                            <button onClick={() => requireAdmin(() => openSetlist(item))} className="relative group/tt flex-1 md:flex-none p-2 sm:p-2 bg-white border border-slate-200 text-slate-500 rounded-xl hover:text-sky-600 hover:border-sky-300 transition shadow-sm flex justify-center items-center">
                              <Edit2 size={16}/>
                              <FastTooltip text={t('編輯', language)} position="top" />
                            </button>
                            <button onClick={() => requireAdmin(() => setDeleteSetlistConfirmId(item.id))} className="relative group/tt flex-1 md:flex-none p-2 sm:p-2 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition shadow-sm flex justify-center items-center">
                              <Trash2 size={16}/>
                              <FastTooltip text={t('刪除', language)} position="top" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="p-16 sm:p-20 text-center text-slate-400">
                      <ListMusic size={40} className="mx-auto mb-4 opacity-20" />
                      <p className="text-sm">{t('查無歌單紀錄。', language)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Calendar Sidebar Column */}
              <div className="w-full lg:w-[280px] shrink-0 order-1 lg:order-2 lg:sticky lg:top-8 z-10 self-start">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-5">
                  <div className="flex justify-between items-center mb-3">
                    <div className="font-serif font-bold text-slate-800 text-[17px] tracking-wider pl-1">
                      {currentMonth.getFullYear()} <span className="text-slate-300 font-light mx-0.5">/</span> <span className="text-sky-600">{String(currentMonth.getMonth() + 1).padStart(2, '0')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setCurrentMonth(new Date())} className="relative group/tt text-[10px] text-slate-500 font-bold bg-slate-50 border border-slate-200 hover:border-sky-300 hover:text-sky-600 px-2 py-1 rounded-md transition shadow-sm">
                        Today
                        <FastTooltip text={t('回到今天', language)} />
                      </button>
                      <div className="flex items-center bg-slate-50 rounded-lg border border-slate-100 p-0.5">
                        <button onClick={prevMonth} className="p-1 hover:bg-white rounded-md text-slate-400 hover:text-sky-600 transition shadow-sm"><ChevronLeft size={14}/></button>
                        <button onClick={nextMonth} className="p-1 hover:bg-white rounded-md text-slate-400 hover:text-sky-600 transition shadow-sm"><ChevronRight size={14}/></button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-y-1">
                    {renderCalendar()}
                  </div>

                  {homeSearchQuery && setlistsDb.some(s => s.date === homeSearchQuery) && (
                    <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                      <button onClick={() => setHomeSearchQuery('')} className="text-[11px] font-bold text-slate-400 hover:text-sky-600 transition flex items-center justify-center gap-1 w-full bg-slate-50 hover:bg-sky-50 py-2 rounded-lg">
                        <X size={14}/> {t('顯示全部歌單', language)}
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Other Views... */}
      {view === 'list' && (
        <div className="pb-20 max-w-4xl mx-auto p-4 sm:p-8 pt-4 sm:pt-6 w-full">
          <header className="mb-6 sm:mb-10 text-center flex flex-col items-center border-b border-slate-200 pb-4 sm:pb-6"><ICCLogo className="mb-4 sm:mb-5 scale-90" /><h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mb-2 uppercase">{currentSetlistId ? t('編輯歌單', language) : t('建立新歌單', language)}</h1></header>
          <div className="flex flex-col sm:flex-row justify-end mb-6 gap-3">
            <button onClick={saveCurrentSetlist} disabled={isSavingSetlist} className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-serif text-sm transition shadow-sm flex items-center justify-center gap-2 ${saveSuccess ? 'bg-green-600 text-white' : (hasSetlistChanges ? 'bg-sky-50 border border-sky-500 text-sky-600 hover:bg-sky-100' : 'bg-white border border-slate-200 text-slate-400 cursor-not-allowed')}`}><Save size={18}/> {isSavingSetlist ? t('儲存中...', language) : (saveSuccess ? t('已成功儲存！', language) : t('儲存歌單', language))}</button>
            <button onClick={openPreviewFromList} className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-serif text-sm bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center gap-2 shadow-lg transition"><Eye size={18}/> {t('預覽與輸出', language)}</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
            <div className="md:col-span-4 bg-white p-5 sm:p-6 border rounded-2xl h-fit shadow-sm">
              <h2 className="text-xs sm:text-sm font-bold tracking-widest text-slate-900 border-b pb-3 mb-5 sm:mb-6 uppercase">Information</h2>
              <div className="space-y-4">
                <div><label className="text-[10px] font-bold text-sky-500 block mb-1 uppercase tracking-widest">{t('日期', language)}</label><input type="date" value={meta.date} onChange={e => handleMetaChange('date', e.target.value)} className="w-full px-3 py-2 border-b-2 bg-transparent focus:border-sky-500 outline-none transition text-sm sm:text-base" /></div>
                <div><label className="text-[10px] font-bold text-sky-500 block mb-1 uppercase tracking-widest">{t('主領', language)}</label><input type="text" value={meta.wl} onChange={e => handleMetaChange('wl', e.target.value)} className="w-full px-3 py-2 border-b-2 bg-transparent focus:border-sky-500 outline-none transition text-sm sm:text-base" placeholder={t('主領是誰呢', language)} /></div>
                <div>
                  <label className="text-[10px] font-bold text-sky-500 block mb-1 uppercase tracking-widest flex items-center gap-1"><Youtube size={12}/> {t('YouTube 歌單連結 (選填)', language)}</label>
                  <input type="text" value={meta.youtubePlaylistUrl} onChange={e => handleMetaChange('youtubePlaylistUrl', e.target.value)} className="w-full px-3 py-2 border-b-2 bg-transparent focus:border-sky-500 outline-none transition text-sm sm:text-base" placeholder={t('貼上 YouTube 歌單網址...', language)} />
                </div>
              </div>
            </div>
            <div className="md:col-span-8 space-y-4">
              <div className="flex justify-between items-end border-b pb-3"><h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest">Setlist</h2><button onClick={() => openEditor()} className="text-xs font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition">{t('+ 新增詩歌', language)}</button></div>
              <div className="space-y-3">
                {setlist.map((item, index) => (
                  <div key={item.id} className="bg-white border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between group shadow-sm transition hover:border-sky-200 gap-3">
                    <div className="flex-1 w-full overflow-hidden">
                      <div className="flex items-center gap-2 sm:gap-3 mb-1">
                        <span className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold shrink-0">0{index + 1}</span>
                        <h3 className="font-bold font-serif text-base sm:text-lg truncate">{String(item.title || t('未命名', language))} <span className="font-sans font-normal text-slate-400 text-xs sm:text-sm">({String(item.key || 'C')})</span></h3>
                      </div>
                      <div className="text-[11px] sm:text-[13px] text-blue-600 font-mono pl-8 sm:pl-9 font-bold tracking-wider overflow-x-auto custom-scrollbar pb-1">
                        {String(item.mapString || t('未設定段落', language))}
                      </div>
                      <div className="pl-8 sm:pl-9 mt-2">
                        <SheetGroup sheets={songsDb.find(d => d.id === item.songId)?.sheets}
                                    wantedKey={item.key} language={language} compact />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-1.5 sm:gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-slate-50 w-full sm:w-auto">
                      <div className="flex flex-row sm:flex-col gap-1 sm:gap-0.5 mr-auto sm:mr-0">
                        <button onClick={() => moveItem(index, 'up')} className="p-1.5 sm:p-1 text-slate-400 hover:text-sky-600 transition bg-slate-50 sm:bg-transparent rounded sm:rounded-none"><ArrowUp size={14}/></button>
                        <button onClick={() => moveItem(index, 'down')} className="p-1.5 sm:p-1 text-slate-400 hover:text-sky-600 transition bg-slate-50 sm:bg-transparent rounded sm:rounded-none"><ArrowDown size={14}/></button>
                      </div>
                      <button onClick={() => openEditor(item)} className="relative group/tt p-2 sm:p-2 text-slate-500 hover:text-sky-600 transition bg-slate-50 sm:bg-transparent rounded-lg"><Edit2 size={16}/><FastTooltip text={t('編輯', language)} /></button>
                      <button onClick={() => deleteItem(item.id)} className="relative group/tt p-2 sm:p-2 text-slate-400 hover:text-red-600 transition bg-slate-50 sm:bg-transparent rounded-lg"><Trash2 size={16}/><FastTooltip text={t('刪除', language)} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'editor' && (
        <div className="pb-20 max-w-5xl mx-auto p-4 sm:p-8 pt-4 w-full">
          <header className="mb-6 sm:mb-8 border-b pb-4 sm:pb-6 flex justify-between items-center"><button onClick={() => setView('list')} className="flex items-center gap-1 sm:gap-2 font-medium text-slate-500 hover:text-slate-900 transition text-sm sm:text-base"><ChevronLeft size={18}/> {t('返回歌單', language)}</button><div className="font-serif tracking-widest text-xs sm:text-sm uppercase font-bold text-slate-700">{editingItem ? t('編輯歌曲', language) : t('新增歌曲', language)}</div></header>
          <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 sm:p-8 bg-[#FAFAFA] border-b">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
                <div className="md:col-span-3 relative" ref={searchRef}>
                  <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 block mb-1.5 sm:mb-2 uppercase tracking-widest">{t('由雲端資料庫搜尋或新增', language)}</label>
                  <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 sm:h-5 sm:w-5" /><input type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }} className="w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 border-b-2 bg-transparent focus:border-sky-500 outline-none font-serif text-base sm:text-lg transition" placeholder={t('輸入歌名搜尋...', language)} /></div>
                  
                  {/* Quick Filters */}
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1 custom-scrollbar">
                    {QUICK_FILTERS.map(f => (
                      <button key={f.label} onClick={() => { setSearchQuery(f.query); setShowDropdown(true); }} className="px-3 py-1 bg-white hover:bg-sky-50 text-slate-600 hover:text-sky-700 text-[11px] sm:text-xs rounded-full transition whitespace-nowrap border border-slate-200 hover:border-sky-300 shadow-sm">
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-3 sm:mt-4">
                    <button onClick={() => requireAdmin(() => setShowComingSoonModal(true))} className="py-2 sm:py-2.5 px-3 sm:px-4 bg-gradient-to-r from-sky-50 to-transparent border border-sky-100 hover:border-sky-300 rounded-xl text-xs sm:text-[13px] text-slate-700 font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition shadow-sm hover:shadow">
                      <Sparkles size={14} className="text-sky-500"/> {t('找不到？AI 網址抓取', language)}
                    </button>
                    <button onClick={() => requireAdmin(() => openManualEntry(null, '', 'editor'))} className="py-2 sm:py-2.5 px-3 sm:px-4 bg-white border border-slate-200 hover:border-sky-500 rounded-xl text-xs sm:text-[13px] text-slate-700 font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition shadow-sm hover:shadow">
                      <Edit2 size={14} className="text-slate-400"/> {t('手動建立新詩歌', language)}
                    </button>
                  </div>
                  {showDropdown && searchQuery && currentSong && (
                    <ul className="absolute z-20 mt-2 w-full bg-white shadow-2xl border rounded-2xl max-h-64 overflow-auto border-slate-100">
                      {searchResults.length > 0 ? searchResults.map(s => (<li key={s.id} onClick={() => handleSelectSong(s)} className="p-3 sm:p-4 border-b last:border-0 border-slate-50 flex justify-between cursor-pointer hover:bg-slate-50 group transition"><span className="font-serif font-bold text-slate-800 group-hover:text-sky-600 text-sm sm:text-base">{s.title}</span><span className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-widest group-hover:text-sky-500">{s.artist}</span></li>)) : <li className="p-8 sm:p-10 text-center bg-slate-50"><p className="mb-2 text-xs sm:text-sm text-slate-500 font-bold">{t('雲端資料庫查無此歌 🥺', language)}</p><p className="text-[10px] sm:text-xs text-slate-400 mb-2">{t('請點擊上方按鈕使用 AI 或手動新增', language)}</p></li>}
                    </ul>
                  )}
                </div>
                <div className="md:col-span-1">
                  <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 block mb-1.5 sm:mb-2 uppercase tracking-widest">{t('調性 (Key)', language)}</label>
                  <input type="text" list="key-list" value={currentKey} onChange={e => setCurrentKey(e.target.value)} className="w-full px-2 sm:px-3 py-2.5 sm:py-3 border-b-2 bg-transparent focus:border-sky-500 font-sans text-sm sm:text-base transition outline-none" placeholder={t('自訂或選擇...', language)} />
                </div>
              </div>
            </div>
            
            {currentSong ? (
              <div className="p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 bg-white">
                <div className="order-2 lg:order-1">
                  <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
                    <a href={currentSong.youtubeId ? `https://youtu.be/${currentSong.youtubeId}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(currentSong.title)}`} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2 sm:py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition hover:bg-red-100"><Youtube size={16}/> {t('YouTube 聆聽', language)}</a>
                    <button onClick={() => requireAdmin(() => openManualEntry(currentSong, '', 'editor'))} className="flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition hover:bg-slate-100 text-slate-700"><Database size={16} className="text-sky-500"/> {t('編輯詩歌檔案', language)}</button>
                  </div>
                  {/* 這首歌的樂譜：主領編歌單時就能確認樂手有沒有譜 */}
                  <div className="mb-6">
                    <div className="flex flex-wrap justify-between items-center border-b pb-2 mb-3 gap-2">
                      <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <FileText size={13} className="text-[#C4A977]"/> {t('樂譜', language)}
                        <span className="text-slate-300 normal-case tracking-normal">{(currentSong.sheets || []).length}</span>
                      </h3>
                      <label className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${uploadingSheet ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}>
                        {uploadingSheet ? <Loader2 size={12} className="animate-spin"/> : <Download size={12} className="rotate-180"/>}
                        {uploadingSheet ? t('上傳中...', language) : t('上傳樂譜', language)}
                        <input type="file" accept="application/pdf,image/jpeg,image/png" disabled={uploadingSheet} className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; e.target.value = '';
                            handleUploadSheet(f, { songId: currentSong.id, key: currentKey, title: currentSong.title }); }}/>
                      </label>
                    </div>
                    {sheetError && <p className="text-[11px] text-red-600 font-bold mb-2">{sheetError}</p>}
                    <div className="flex flex-wrap gap-1.5">
                      {(currentSong.sheets || []).length === 0
                        ? <span className="text-[11px] text-slate-400 italic">{t('這首歌還沒有樂譜', language)}</span>
                        : (currentSong.sheets || []).map(sh => {
                            const tone = sheetTone(sh, currentKey);
                            return (
                              <button key={sh.id} onClick={() => setPreviewSheet(sh)}
                                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1.5 ${TONE_STYLES[tone].idle}`}>
                                <FileText size={11}/>
                                <span className="font-mono">{sh.key || t('未標調性', language)}</span>
                                {sh.pageCount > 1 && <span className="opacity-60 font-normal">{sh.pageCount}p</span>}
                              </button>
                            );
                          })}
                    </div>
                  </div>
                  <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-400 mb-3 sm:mb-4 border-b pb-2 uppercase tracking-widest">{t('歌詞預覽', language)}</h3>
                  <div className="space-y-4 sm:space-y-6 max-h-[350px] sm:max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                    {currentSong.lyrics?.map((s, i) => (<div key={i} className="mb-3 sm:mb-4"><span onClick={() => handleAppendTag(s.section)} className="relative group/tt inline-block px-1.5 sm:px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[9px] sm:text-[10px] font-bold rounded shadow-sm cursor-pointer hover:bg-sky-500 hover:text-white transition mb-1.5 sm:mb-2">{String(s.section||'')} <FastTooltip text={getTagExplanation(s.section, language)} /></span><p className="text-xs sm:text-[14px] text-slate-700 leading-relaxed whitespace-pre-wrap">{String(s.text||'')}</p></div>))}
                  </div>
                </div>
                <div className="bg-[#FAFAFA] p-5 sm:p-6 border rounded-2xl shadow-sm h-fit order-1 lg:order-2">
                  <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-400 mb-3 sm:mb-4 border-b pb-2 uppercase tracking-widest">{t('建立段落 (Map Builder)', language)}</h3>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-5 sm:mb-6">
                    {Array.from(new Set([...SONG_MAP_TAGS, ...(currentSong.lyrics?.map(l => l.section) || [])])).map(tag => { 
                      const isAvail = STRUCTURAL_TAGS.includes(tag) || currentSong.lyrics?.some(l => l.section === tag); 
                      return (
                        <button key={tag} onClick={() => isAvail && handleAppendTag(tag)} disabled={!isAvail} className={`relative group/tt px-2.5 sm:px-3 py-1 sm:py-1.5 font-mono text-xs sm:text-sm border rounded-lg transition ${isAvail ? 'bg-white text-slate-700 hover:border-sky-500 shadow-sm cursor-pointer' : 'bg-slate-50 text-slate-300 cursor-not-allowed opacity-60'}`}>
                          {tag}{isAvail && <FastTooltip text={getTagExplanation(tag, language)} />}
                        </button>
                      ); 
                    })}
                  </div>
                  <div className="mb-6 sm:mb-8"><label className="text-[10px] sm:text-[11px] font-bold text-slate-400 block mb-1.5 sm:mb-2 uppercase tracking-widest">{t('編輯字串 (Map String)', language)}</label><textarea value={currentMap} onChange={e => setCurrentMap(e.target.value)} rows={3} className="w-full border rounded-xl p-3 sm:p-4 bg-white font-mono shadow-sm outline-none focus:border-sky-500 transition text-blue-600 font-bold text-sm sm:text-base" placeholder={`${t('例如：', language)}I-V1-C-V2-C-B-C-E`} /></div>
                  <button onClick={saveToSetlist} disabled={!currentMap.trim()} className="w-full py-3 sm:py-4 bg-sky-500 hover:bg-sky-600 text-white font-serif rounded-xl shadow-lg transition active:scale-[0.98] disabled:opacity-50 text-sm sm:text-base">{t('確認加入歌單', language)}</button>
                </div>
              </div>
            ) : (
              <div className="p-5 sm:p-8 bg-slate-50/50">
                <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-400 mb-3 sm:mb-4 border-b pb-2 uppercase tracking-widest flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
                  <span>{searchQuery ? t('搜尋結果', language) : t('瀏覽雲端詩歌庫 (全庫)', language)}</span>
                  {!searchQuery && <span className="text-[9px] font-normal flex items-center gap-1 text-[#C4A977] bg-[#FAF8F5] border border-[#E8DCC4] shadow-sm px-2 py-0.5 rounded-full"><Crown size={10} fill="currentColor"/> {t('依近3個月熱度排序', language)}</span>}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-2 custom-scrollbar pb-4">
                  {displaySongs.map((s, index) => (
                    <div key={s.id} onClick={() => handleSelectSong(s)} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 cursor-pointer hover:border-sky-400 hover:shadow-lg transition-all group flex flex-col justify-between relative overflow-hidden">
                      
                      {s.stats.count3Months > 0 && index < 3 && !searchQuery && (
                        <div className="absolute top-0 right-0 bg-[#FAF8F5] text-[#C4A977] text-[8px] sm:text-[9px] font-bold px-3 py-1.5 rounded-bl-xl border-b border-l border-[#E8DCC4] shadow-sm flex items-center gap-1.5">
                          <Crown size={12} fill="currentColor" /> {t('近期熱門', language)}
                        </div>
                      )}

                      <div>
                        <h4 className="font-serif font-bold text-slate-800 text-[15px] sm:text-[17px] group-hover:text-sky-600 mb-1 leading-tight pr-12 sm:pr-14 truncate">{String(s.title || t('未命名', language))}</h4>
                        <p className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-widest mb-3 sm:mb-4 truncate">{String(s.artist || t('未知歌手', language))}</p>
                      </div>
                      
                      <div className="flex flex-col gap-2 sm:gap-2.5 mt-1">
                        <div className="flex flex-wrap gap-1.5">
                          {s.stats.count3Months > 0 ? (
                            <span className="bg-[#FAF8F5] text-[#C4A977] text-[9px] sm:text-[10px] px-2 py-1 rounded-md font-bold border border-[#E8DCC4] flex items-center gap-1.5 w-fit whitespace-nowrap shadow-sm">
                              <Crown size={12} fill="currentColor" className="opacity-80"/> 
                              {language === 'en' ? `Sung ${s.stats.count3Months} times in 3 mos` : `三月內唱過: ${s.stats.count3Months} 次`}
                            </span>
                          ) : (
                            <span className="bg-slate-50 text-slate-400 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-1 rounded-md font-medium border border-slate-100 flex items-center gap-1">
                              ❄️ {t('近期未唱', language)}
                            </span>
                          )}
                          {s.stats.weeksAgo !== null && (
                            <span className="bg-slate-50 text-slate-500 text-[9px] sm:text-[10px] px-2 py-1 rounded-md font-medium border border-slate-200 flex items-center gap-1.5 w-fit whitespace-nowrap shadow-sm">
                              <CalendarDays size={12} className="opacity-70" /> 
                              {s.stats.weeksAgo === 0 ? t('本週剛唱過', language) : (language === 'en' ? `Sung ${s.stats.weeksAgo} weeks ago` : `${s.stats.weeksAgo} 週前唱過`)}
                            </span>
                          )}
                        </div>

                        <div className="flex justify-between items-end pt-2 sm:pt-3 border-t border-slate-50 mt-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 flex items-center gap-1"><Music size={12}/> {s.lyrics?.length || 0} {t('段落', language)}</span>
                            {s.hasMultitrack && <span className="text-[9px] sm:text-[10px] font-bold text-indigo-500 flex items-center gap-1"><Layers size={12}/> MT</span>}
                          </div>
                          <span className="font-mono text-[10px] sm:text-xs font-bold text-sky-600 bg-sky-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg border border-sky-100">{String(s.defaultKey || 'C')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {displaySongs.length === 0 && (
                    <div className="col-span-full py-12 sm:py-16 text-center bg-white border border-slate-100 rounded-xl shadow-sm">
                      <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🥺</div>
                      <p className="mb-1 text-xs sm:text-sm text-slate-600 font-bold">{t('雲端資料庫查無此歌 🥺', language).replace(' 🥺', '')}</p>
                      <p className="text-[10px] sm:text-xs text-slate-400">{t('請點擊上方按鈕使用 AI 或手動新增', language)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'manual' && (
        <div className="pb-20 max-w-4xl mx-auto p-4 sm:p-8 pt-4 w-full">
          <header className="mb-6 sm:mb-8 border-b pb-4 sm:pb-6 flex justify-between items-center"><button onClick={() => setView(manualSource)} className="flex items-center gap-1 sm:gap-2 text-slate-500 transition hover:text-slate-900 font-medium text-sm sm:text-base"><ChevronLeft size={18}/> {t('返回', language)}</button><div className="font-serif tracking-widest font-bold uppercase text-slate-700 text-xs sm:text-sm">{t('詩歌編輯器', language)}</div></header>
          <div className="bg-white border rounded-2xl p-5 sm:p-8 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 mb-6 sm:mb-8 flex items-center gap-2">{editingDbSongId ? t('編輯詩歌檔案', language) : t('新增詩歌資料庫', language)}</h2>
            
            {saveError && (
              <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs sm:text-sm font-bold flex items-center gap-2">
                <X size={16} className="shrink-0"/> {String(saveError)}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-8 mb-6 sm:mb-8">
              <div><label className="text-[10px] sm:text-[11px] font-bold text-slate-400 block mb-1 uppercase tracking-widest">{t('歌名 *', language)}</label><input type="text" value={customTitle} onChange={e => setCustomTitle(e.target.value)} className="w-full border-b-2 bg-transparent focus:border-sky-500 p-2 font-serif text-base sm:text-lg outline-none transition" /></div>
              <div><label className="text-[10px] sm:text-[11px] font-bold text-slate-400 block mb-1 uppercase tracking-widest">{t('歌手 / 出處', language)}</label><input type="text" value={customArtist} onChange={e => setCustomArtist(e.target.value)} className="w-full border-b-2 bg-transparent focus:border-sky-500 p-2 outline-none transition text-sm sm:text-base" /></div>
              <div>
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 block mb-1 uppercase tracking-widest">{t('預設調性', language)}</label>
                <input type="text" list="key-list" value={customKey} onChange={e => setCustomKey(e.target.value)} className="w-full border-b-2 bg-transparent p-2 transition outline-none focus:border-sky-500 text-sm sm:text-base" placeholder={t('自訂或選擇...', language)} />
              </div>
            </div>
            
            <div className="mb-8 sm:mb-10 flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 flex items-center gap-1.5 mb-1 uppercase tracking-widest"><Youtube size={14} className="text-red-500"/> {t('YouTube 連結或 ID', language)}</label>
                <input type="text" value={customYoutubeUrl} onChange={e => setCustomYoutubeUrl(e.target.value)} className="w-full border-b-2 bg-transparent p-2 text-xs sm:text-sm outline-none transition focus:border-sky-500" placeholder="https://youtu.be/..." />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" checked={customHasMultitrack} onChange={e => setCustomHasMultitrack(e.target.checked)} className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-md checked:bg-indigo-500 checked:border-indigo-500 transition-all cursor-pointer shadow-sm" />
                    <Layers size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-widest group-hover:text-indigo-600 transition">{t('支援 Multitrack', language)}</span>
                </label>
              </div>
            </div>

            {/* ---- 樂譜管理 ---- */}
            {(() => {
              const song = songsDb.find(x => x.id === editingDbSongId);
              const mySheets = song?.sheets || [];
              return (
                <div className="mb-8 sm:mb-10">
                  <div className="flex flex-wrap justify-between items-end border-b pb-2 mb-5 gap-2">
                    <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                      <FileText size={14} className="text-[#C4A977]"/> {t('樂譜管理', language)}
                      <span className="text-slate-300 normal-case tracking-normal font-medium">{mySheets.length} {t('份', language)}</span>
                    </h3>
                    <div className="flex gap-2">
                      <label className={`text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${uploadingSheet ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}>
                        {uploadingSheet ? <Loader2 size={14} className="animate-spin"/> : <Download size={14} className="rotate-180"/>}
                        {uploadingSheet ? t('上傳中...', language) : t('上傳樂譜', language)}
                        <input type="file" accept="application/pdf,image/jpeg,image/png" disabled={uploadingSheet}
                          onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; handleUploadSheet(f); }}
                          className="hidden"/>
                      </label>
                      <button onClick={() => { setShowPoolPicker(true); setPoolSearch(customTitle || ''); }}
                        className="text-xs font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5">
                        <Plus size={14}/> {t('從待用庫加入', language)}
                      </button>
                    </div>
                  </div>

                  {sheetError && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-bold">{sheetError}</div>}

                  {!editingDbSongId && (
                    <p className="mb-3 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      {t('先填好歌名後即可上傳樂譜，系統會自動先建立這首歌。', language)}
                    </p>
                  )}
                  {mySheets.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100">
                      <FileText size={28} className="mx-auto mb-2 text-slate-300"/>
                      <p className="text-xs text-slate-400">{t('這首歌還沒有樂譜', language)}</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {mySheets.map(sh => (
                        <div key={sh.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-sky-200 transition">
                          <button onClick={() => setPreviewSheet(sh)}
                             className="shrink-0 flex items-center gap-2 px-3 py-2 bg-sky-50 text-sky-700 border border-sky-100 rounded-lg text-xs font-bold hover:bg-sky-100 transition">
                            <Eye size={14}/> {t('檢視', language)}
                            {sh.pageCount > 1 && <span className="opacity-60">{sh.pageCount}p</span>}
                          </button>
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 min-w-0">
                            <input type="text" list="key-list" defaultValue={sh.key || ''} placeholder={t('調性', language)}
                              onBlur={e => e.target.value !== (sh.key || '') && updateSheetMeta(editingDbSongId, sh.id, { key: e.target.value.trim() || null })}
                              className="px-2 py-1.5 border rounded-lg text-sm font-mono bg-slate-50 focus:bg-white focus:border-sky-500 outline-none transition"/>
                            <input type="text" defaultValue={sh.label || ''} placeholder={t('註記（女聲／吉他…）', language)}
                              onBlur={e => e.target.value !== (sh.label || '') && updateSheetMeta(editingDbSongId, sh.id, { label: e.target.value.trim() || null })}
                              className="px-2 py-1.5 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-sky-500 outline-none transition sm:col-span-2"/>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => unlinkSheet(editingDbSongId, sh.id)} disabled={sheetBusy === sh.id}
                              className="relative group/tt p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition disabled:opacity-40">
                              {sheetBusy === sh.id ? <Loader2 size={16} className="animate-spin"/> : <X size={16}/>}
                              <FastTooltip text={t('從這首歌移除（回到待用庫，可還原）', language)} position="left"/>
                            </button>
                            <button onClick={() => setDeleteSheetTarget(sh)} disabled={sheetBusy === sh.id}
                              className="relative group/tt p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-40">
                              <Trash2 size={16}/>
                              <FastTooltip text={t('永久刪除檔案（不可復原）', language)} position="left"/>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                    {t('調性與註記改完點擊別處即自動儲存。移除只是取消關聯，樂譜會回到待用庫，隨時能重新加入或改掛到別首歌。', language)}
                  </p>
                </div>
              );
            })()}

            <div className="mb-8 sm:mb-10">
              <div className="flex justify-between items-end border-b pb-2 mb-6 sm:mb-8"><h3 className="text-[10px] sm:text-[11px] font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest">{t('歌詞段落管理', language)}</h3></div>
              <div className="space-y-4 sm:space-y-6">
                {customLyrics.map((l, i) => (
                  <div key={i} className="flex flex-col sm:flex-row gap-3 sm:gap-5 items-start group transition hover:bg-slate-50/50 p-3 rounded-xl border border-transparent hover:border-slate-100">
                    <div className="w-full sm:w-auto shrink-0 flex sm:block justify-between items-center">
                      <input type="text" list="section-list" value={l.section} onChange={e => { const nl = [...customLyrics]; nl[i].section = e.target.value.toUpperCase(); setCustomLyrics(nl); }} className="w-20 sm:w-24 p-1.5 sm:p-2 border rounded-lg font-mono text-xs sm:text-sm shadow-sm bg-white focus:border-sky-500 outline-none uppercase" placeholder="Tag" />
                      <div className="text-[9px] text-slate-400 mt-1 font-mono hidden sm:block text-center">{getTagExplanation(l.section, language).split(' ')[0]}</div>
                      <button onClick={() => { const nl = [...customLyrics]; nl.splice(i, 1); setCustomLyrics(nl); }} className="sm:hidden p-1.5 text-slate-300 hover:text-red-600 transition bg-white border rounded shadow-sm"><Trash2 size={16}/></button>
                    </div>
                    <textarea value={l.text} onChange={e => { const nl = [...customLyrics]; nl[i].text = e.target.value; setCustomLyrics(nl); }} rows={3} className="w-full flex-1 p-3 sm:p-4 border rounded-xl font-sans text-sm shadow-sm outline-none focus:border-sky-500 transition" placeholder={t('在此貼上歌詞內容...', language)} />
                    <button onClick={() => { const nl = [...customLyrics]; nl.splice(i, 1); setCustomLyrics(nl); }} className="hidden sm:block p-2 text-slate-200 hover:text-red-600 transition self-center"><Trash2 size={20}/></button>
                  </div>
                ))}
              </div>
              <button onClick={() => setCustomLyrics([...customLyrics, { section: 'V', text: '' }])} className="mt-6 sm:mt-8 flex items-center gap-1.5 text-xs font-bold uppercase text-sky-600 transition hover:text-sky-500 bg-sky-50 px-4 py-2 rounded-lg w-fit">{t('+ 新增段落', language)}</button>
            </div>
            <div className="flex justify-end pt-6 sm:pt-8 border-t"><button onClick={handleSaveCustomSong} disabled={!customTitle.trim() || (editingDbSongId && !hasUnsavedChanges) || isSaving} className="w-full sm:w-auto px-8 sm:px-12 py-3.5 sm:py-4 bg-sky-500 hover:bg-sky-600 text-white font-serif rounded-xl shadow-xl transition active:scale-95 disabled:opacity-30 tracking-widest font-bold text-sm sm:text-base">{isSaving ? t('儲存中...', language) : (editingDbSongId ? t('確認儲存更新', language) : t('確認儲存至雲端資料庫', language))}</button></div>
          </div>
        </div>
      )}

      {view === 'manage' && (
        <div className="pb-20 max-w-6xl mx-auto p-4 sm:p-8 pt-4 w-full">
          <ConfirmModal isOpen={deleteConfirmId !== null} title={t('永久刪除？', language)} message={t('此動作將移除雲端檔案，無法復原。', language)} cancelText={t('取消', language)} confirmText={t('確認刪除', language)} onCancel={() => setDeleteConfirmId(null)} onConfirm={() => executeDeleteDbSong(deleteConfirmId)} />
          <header className="mb-6 sm:mb-8 border-b pb-4 sm:pb-6 flex justify-between items-center">
            <button onClick={() => setView('home')} className="flex items-center gap-1 sm:gap-2 text-slate-500 hover:text-slate-900 transition font-medium text-sm sm:text-base"><ChevronLeft size={18}/> {t('返回', language)}</button>
            <div className="font-serif tracking-widest text-slate-900 uppercase font-bold flex items-center gap-1 sm:gap-2 text-xs sm:text-base">
              <Database size={16} className="text-sky-500 hidden sm:block" /> {t('詩歌庫管理', language)}
            </div>
          </header>
          <div className="bg-white border p-4 sm:p-6 rounded-2xl mb-3 sm:mb-4 flex flex-col md:flex-row gap-3 sm:gap-4 shadow-sm items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4"/>
              <input type="text" value={librarySearch} onChange={e => setLibrarySearch(e.target.value)} className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 border rounded-xl bg-slate-50 focus:bg-white focus:ring-1 focus:ring-sky-500 outline-none transition text-sm sm:text-base" placeholder={t('搜尋雲端詩歌檔案...', language)} />
              {/* Quick Filters */}
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1 custom-scrollbar">
                {QUICK_FILTERS.map(f => (
                  <button key={f.label} onClick={() => setLibrarySearch(f.query)} className="px-3 py-1 bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 text-slate-600 hover:text-sky-700 text-[11px] sm:text-xs rounded-full transition whitespace-nowrap shadow-sm">
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto relative" ref={addDropdownRef}>
              <button onClick={() => requireAdmin(() => setShowAddDropdown(!showAddDropdown))} className="w-full md:w-auto justify-center bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition flex items-center gap-2">
                <Plus size={16}/> {t('+ 新增詩歌', language).replace('+ ', '')}
              </button>
              {showAddDropdown && (
                <div className="absolute top-full right-0 mt-2 w-full sm:w-48 bg-white border border-slate-100 shadow-xl rounded-xl overflow-hidden z-20 flex flex-col">
                  <button onClick={() => { setShowAddDropdown(false); requireAdmin(() => setShowComingSoonModal(true)); }} className="text-left px-4 py-3 text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-700 transition border-b border-slate-50"><Sparkles size={14} className="text-sky-500"/> {t('找不到？AI 網址抓取', language).replace('找不到？', '')}</button>
                  <button onClick={() => { setShowAddDropdown(false); requireAdmin(() => openManualEntry(null, '', 'manage')); }} className="text-left px-4 py-3 text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-700 transition"><Edit2 size={14} className="text-slate-400"/> {t('手動建立新詩歌', language)}</button>
                </div>
              )}
            </div>
          </div>
          
          <div className="px-2 mb-3 sm:mb-4 flex justify-start items-center text-xs sm:text-sm font-medium text-slate-500">
            {t('資料庫詩歌總數：', language)} <span className="font-bold text-sky-600 mx-1">{songsDb.length}</span> {t('首', language)}
          </div>

          <div className="bg-white border rounded-2xl shadow-sm overflow-hidden overflow-x-auto w-full">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 border-b text-slate-500 text-[9px] sm:text-[10px] uppercase tracking-widest font-bold">
                  <th className="p-3 sm:p-4">{t('歌名 (Song Title)', language)}</th>
                  <th className="p-3 sm:p-4">{t('歌手 / 出處', language)}</th>
                  <th className="p-3 sm:p-4">{t('近期熱度', language)}</th>
                  <th className="p-3 sm:p-4">{t('樂譜', language)}</th>
                  <th className="p-3 sm:p-4">{t('預設調性', language)}</th>
                  <th className="p-3 sm:p-4 text-center" title="Multitrack">Multitrack</th>
                  <th className="p-3 sm:p-4 text-right">{t('管理操作', language)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {libraryDisplaySongs.map((s, index) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition group">
                    <td className="p-3 sm:p-4">
                      <div className="flex flex-col items-start gap-1">
                        {s.stats.count3Months > 0 && index < 3 && !librarySearch && (
                          <span className="bg-[#FAF8F5] text-[#C4A977] border border-[#E8DCC4] text-[8px] sm:text-[9px] px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1.5 w-fit font-bold">
                            <Crown size={10} fill="currentColor" /> {t('近期熱門', language)}
                          </span>
                        )}
                        <span className="font-serif font-bold text-slate-800 text-sm sm:text-lg group-hover:text-sky-600 whitespace-nowrap sm:whitespace-normal">{s.title}</span>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 text-xs sm:text-sm text-slate-500">{s.artist || '-'}</td>
                    <td className="p-3 sm:p-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        {s.stats.count3Months > 0 ? (
                          <span className="bg-[#FAF8F5] text-[#C4A977] text-[9px] sm:text-[10px] px-2 py-1 rounded-md font-bold border border-[#E8DCC4] flex items-center gap-1.5 w-fit whitespace-nowrap shadow-sm">
                            <Crown size={12} fill="currentColor" className="opacity-80"/> 
                            {language === 'en' ? `Sung ${s.stats.count3Months} times in 3 mos` : `三月內唱過: ${s.stats.count3Months} 次`}
                          </span>
                        ) : (
                          <span className="bg-slate-50 text-slate-400 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-1 rounded-md font-medium border border-slate-100 flex items-center gap-1 w-fit whitespace-nowrap">
                            ❄️ {t('近期未唱', language)}
                          </span>
                        )}
                        {s.stats.weeksAgo !== null && (
                          <span className="bg-slate-50 text-slate-500 text-[9px] sm:text-[10px] px-2 py-1 rounded-md font-medium border border-slate-200 flex items-center gap-1.5 w-fit whitespace-nowrap shadow-sm">
                            <CalendarDays size={12} className="opacity-70" /> 
                            {s.stats.weeksAgo === 0 ? t('本週剛唱過', language) : (language === 'en' ? `Sung ${s.stats.weeksAgo} weeks ago` : `${s.stats.weeksAgo} 週前唱過`)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 sm:p-4">
                      {(s.sheets || []).length === 0 ? (
                        <span className="text-[10px] text-slate-300 italic">{t('無', language)}</span>
                      ) : (
                        <div className="flex flex-wrap gap-1 items-center max-w-[190px]">
                          {(s.sheets || []).slice(0, 5).map(sh => (
                            <span key={sh.id}
                              className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold border ${sh.key ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                              {sh.key || '—'}
                            </span>
                          ))}
                          {(s.sheets || []).length > 5 && <span className="text-[10px] text-slate-400 font-bold">+{(s.sheets || []).length - 5}</span>}
                        </div>
                      )}
                    </td>
                    <td className="p-3 sm:p-4 font-mono text-xs sm:text-sm text-slate-400">
                      <div className="flex flex-col items-start gap-1.5">
                        <span className="bg-sky-50 text-sky-600 px-2 py-0.5 rounded border border-sky-100 font-bold">{s.defaultKey}</span>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 text-center">
                      {s.hasMultitrack ? (
                        <div className="relative group/tt flex justify-center">
                          <Layers size={18} className="text-indigo-500 drop-shadow-sm" />
                          <FastTooltip text={t('支援 Multitrack', language)} />
                        </div>
                      ) : (
                        <span className="text-slate-200 font-medium">-</span>
                      )}
                    </td>
                    <td className="p-3 sm:p-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => requireAdmin(() => openManualEntry(s, '', 'manage'))} className="relative group/tt p-2 sm:p-2.5 hover:bg-white rounded-lg text-slate-400 hover:text-sky-600 transition shadow-sm border border-transparent hover:border-slate-100"><Edit2 size={16}/><FastTooltip text={t('編輯', language)} position="left" /></button>
                        <button onClick={() => requireAdmin(() => setDeleteConfirmId(s.id))} className="relative group/tt p-2 sm:p-2.5 hover:bg-white rounded-lg text-slate-300 hover:text-red-600 transition border border-transparent hover:border-red-50"><Trash2 size={16}/><FastTooltip text={t('刪除', language)} position="left" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 樂手版：依本週調性列出每首歌的樂譜 */}
      {/* 樂手樂譜：上方是完整 song map，下方直接內嵌預覽，分頁切換歌曲 */}
      {view === 'sheets' && (() => {
        const active = setlist[activeSheetSong] || setlist[0];
        const dbSong = active ? songsDb.find(d => d.id === active.songId) : null;
        const sheets = dbSong?.sheets || [];
        const chosen = sheets.find(x => x.id === activeSheetId) || pickSheetForKey(sheets, active?.key);
        return (
          <div className="pb-16 max-w-6xl mx-auto p-4 sm:p-6 pt-4 w-full">
            <header className="mb-5 border-b border-slate-200 pb-4">
              <button onClick={() => setView('home')} className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition font-medium text-sm mb-3"><ChevronLeft size={18}/> {t('返回首頁', language)}</button>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 flex items-center gap-2.5">
                  <FileText size={24} className="text-[#C4A977]"/> {t('樂手樂譜', language)}
                </h1>
                <div className="text-left sm:text-right shrink-0">
                  <div className="font-mono font-bold text-sky-600">{meta.date?.replace(/-/g, ' / ')}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1 sm:justify-end mt-0.5"><User size={12}/> {meta.wl || t('未指定', language)}</div>
                </div>
              </div>
            </header>

            {/* 完整 Song Map —— 與歌手看到的相同 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 mb-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                {setlist.map((item, idx) => (
                  <button key={item.id || idx} onClick={() => { setActiveSheetSong(idx); setActiveSheetId(null); }}
                    className={`text-left flex gap-2.5 items-start p-2 rounded-lg transition ${idx === activeSheetSong ? 'bg-white shadow-sm border border-sky-200' : 'hover:bg-white/70 border border-transparent'}`}>
                    <span className={`shrink-0 w-5 h-5 rounded flex items-center justify-center font-bold font-serif text-[10px] mt-0.5 ${idx === activeSheetSong ? 'bg-sky-500 text-white' : 'bg-slate-900 text-white'}`}>{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-serif font-bold text-[13px] text-slate-900">{item.title}</span>
                        <span className="font-mono text-[9px] font-bold text-sky-600 bg-sky-100/80 border border-sky-200 px-1 py-px rounded">{item.key}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono tracking-wide truncate">{item.mapString}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 歌曲分頁 */}
            <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-2 mb-3">
              {setlist.map((item, idx) => {
                const sc = (songsDb.find(d => d.id === item.songId)?.sheets || []).length;
                return (
                  <button key={item.id || idx} onClick={() => { setActiveSheetSong(idx); setActiveSheetId(null); }}
                    className={`shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition border flex items-center gap-1.5 ${idx === activeSheetSong ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
                    <span className="opacity-60">{idx + 1}.</span>
                    <span className="max-w-[130px] truncate">{item.title}</span>
                    {sc === 0 && <span className="text-[9px] opacity-50">✕</span>}
                  </button>
                );
              })}
            </div>

            {/* 樂譜選擇：藍＝調性相符 灰＝未標調性 黃＝不同調性 */}
            {active && (
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mr-1">{t('可用樂譜', language)}</span>
                {sheets.length === 0 && <span className="text-xs text-slate-400 italic">{t('這首歌還沒有樂譜', language)}</span>}
                {sheets.map(sh => {
                  const tone = sheetTone(sh, active.key);
                  const on = chosen?.id === sh.id;
                  return (
                    <button key={sh.id} onClick={() => setActiveSheetId(sh.id)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 ${on ? TONE_STYLES[tone].chip : TONE_STYLES[tone].idle}`}>
                      <span className="font-mono">{sh.key || t('未標調性', language)}</span>
                      {sh.pageCount > 1 && <span className="opacity-70 font-normal">{sh.pageCount}p</span>}
                      {sh.label && <span className="opacity-70 font-normal max-w-[80px] truncate">{sh.label}</span>}
                    </button>
                  );
                })}
                {chosen && (
                  <a href={chosen.url} target="_blank" rel="noopener noreferrer"
                     className="ml-auto px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:text-sky-600 hover:border-sky-300 transition flex items-center gap-1.5">
                    <Eye size={13}/> {t('開新分頁', language)}
                  </a>
                )}
              </div>
            )}

            {chosen && sheetTone(chosen, active?.key) === 'diff' && (
              <p className="text-[11px] text-amber-700 font-bold mb-2 flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                ⚠️ {keyMismatchNote(chosen, active.key, language)}
              </p>
            )}

            <SheetViewer key={chosen?.id || 'none'} sheet={chosen} language={language} />
          </div>
        );
      })()}


      {view === 'preview' && (
        <div className="min-h-screen flex flex-col bg-slate-200">
          <header className="bg-white/90 backdrop-blur-md border-b px-4 sm:px-6 py-3 sm:py-4 flex flex-row flex-wrap justify-between items-center sticky top-0 z-50 shadow-sm gap-3">
            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={() => setView(previewSource)} className="flex items-center gap-1 sm:gap-2 font-medium hover:text-slate-900 transition text-slate-500 text-xs sm:text-base mr-2"><ChevronLeft size={18}/> {t('返回', language)}</button>
              <span className="font-serif font-bold flex items-center gap-1.5 sm:gap-2 text-slate-800 text-sm sm:text-lg hidden md:flex"><Eye size={16} className="text-[#C4A977]"/> {t('預覽與輸出', language)}</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 flex-wrap w-full sm:w-auto mt-2 sm:mt-0 justify-end">
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setPdfMode('normal')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${pdfMode === 'normal' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t('正常版', language)}</button>
                <button onClick={() => setPdfMode('onepage')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${pdfMode === 'onepage' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t('一頁版', language)}</button>
                <button onClick={() => setPdfMode('large')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${pdfMode === 'large' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t('大字版', language)}</button>
              </div>
              <button onClick={handleExportPDF} disabled={isGenerating} className="px-4 py-2 sm:py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold shadow-lg transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5 text-xs sm:text-base">{isGenerating ? t('產生中...', language) : t('下載 PDF', language)} <Download size={14} className="sm:w-4 sm:h-4"/></button>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto p-2 sm:p-8 flex items-start justify-start md:justify-center pb-24 w-full custom-scrollbar">
            <div className="w-fit shrink-0 shadow-2xl relative overflow-hidden bg-white">
              <div id="pdf-print-area">
                <PrintLayoutContent meta={meta} setlist={setlist} songsDb={songsDb} language={language} t={t} getTagExplanation={getTagExplanation} getFullTagExplanation={getFullTagExplanation} pdfMode={pdfMode} />
              </div>
            </div>
          </main>
        </div>
      )}

      {/* Global Footer */}
      {view !== 'preview' && (
        <footer className="mt-auto bg-white border-t border-slate-200 pt-8 sm:pt-10 pb-10 sm:pb-12 z-10 w-full">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center">
            <p className="text-[10px] sm:text-xs font-bold text-slate-700 mb-2 sm:mb-3">© 2026 Irvine City Church. All Rights Reserved.</p>
            {language === 'en' ? (
              <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed mb-2 max-w-2xl px-2">
                Lyrics collected on this site are for internal worship, practice, and devotion at Irvine City Church.<br className="hidden sm:block"/>All song and lyric copyrights belong to their original creators and publishers.
              </p>
            ) : (
              <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed mb-2 max-w-2xl px-2">
                本站收錄之詩歌歌詞僅供爾灣城市教會（Irvine City Church）家人內部敬拜、練習與靈修使用。<br className="hidden sm:block"/>所有歌曲與歌詞之版權均歸原創作者及發行機構所有，感謝這些美好的創作豐富了我們的敬拜。
              </p>
            )}
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-serif italic leading-relaxed mb-4 sm:mb-6 max-w-2xl px-2">
              This site is for internal worship use at Irvine City Church only.<br className="hidden sm:block"/>All lyrics and music copyrights belong to their respective original authors.
            </p>
            <a href="https://www.irvinecitychurch.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-5 sm:px-6 py-2 sm:py-2.5 bg-slate-900 text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-sky-600 transition shadow-md">
              Contact Us
            </a>
          </div>
        </footer>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.6; }
      `}</style>
    </div>
  );
}

// -----------------------------------------------------------------------------
// PDF / Print Layout Content
// -----------------------------------------------------------------------------
const PrintLayoutContent = ({ meta, setlist, songsDb, language, t, getTagExplanation, getFullTagExplanation, pdfMode }) => {
  const isOnePage = pdfMode === 'onepage';
  const isLarge = pdfMode === 'large';
  const count = setlist.length;
  
  // 針對一頁版進行更激進的動態字體壓縮
  let scaleTier = 1;
  if (isOnePage) {
    if (count <= 4) scaleTier = 1;
    else if (count === 5) scaleTier = 2;
    else if (count === 6) scaleTier = 3;
    else scaleTier = 4;
  }

  const containerBase = "bg-white text-slate-900 w-[816px] mx-auto box-border flex flex-col font-sans shrink-0 relative";
  
  const titleTextClass = isOnePage ? "text-[20px]" : (isLarge ? "text-[32px]" : "text-[26px]");
  const headerGap = isOnePage ? "mb-2 pb-1 border-b-[2px]" : "mb-5 pb-2 border-b-[3px]";
  const mapGap = isOnePage ? (scaleTier > 1 ? "mb-1.5 p-1.5" : "mb-2 p-2") : "mb-5 p-3.5";
  const mapGridGap = isOnePage ? "gap-y-1" : "gap-y-3";

  // 大字版專用的歌單地圖字體大小
  const mapSongTitleFontSize = isLarge ? "text-[16px]" : (scaleTier > 1 ? "text-[11px]" : "text-[13px]");
  const mapKeyFontSize = isLarge ? "text-[10px]" : "text-[8px]";
  const mapTagFontSize = isLarge ? "text-[11px]" : (scaleTier > 1 ? "text-[7px]" : "text-[8px]");
  const mapArrowFontSize = isLarge ? "text-[10px]" : "text-[7px]";
  const mapNumberSize = isLarge ? "w-[24px] h-[24px] text-[12px]" : "w-[18px] h-[18px] text-[9px]";

  // 歌詞字體大小調整 (擁擠模式會再縮小一點點)
  let lyricFontSize = "text-[12px] leading-[1.5]";
  let sectionFontSize = "text-[9px]";
  let songTitleFontSize = "text-[15px]";
  let songNumberFontSize = "text-[22px]";

  if (isLarge) {
    lyricFontSize = "text-[16px] leading-[1.6]";
    sectionFontSize = "text-[12px]";
    songTitleFontSize = "text-[20px]";
    songNumberFontSize = "text-[32px]";
  } else if (isOnePage) {
    if (scaleTier === 1) { lyricFontSize = "text-[10px] leading-[1.3]"; sectionFontSize = "text-[8px]"; songTitleFontSize = "text-[14px]"; songNumberFontSize = "text-[18px]"; }
    else if (scaleTier === 2) { lyricFontSize = "text-[9.5px] leading-[1.25]"; sectionFontSize = "text-[7.5px]"; songTitleFontSize = "text-[13px]"; songNumberFontSize = "text-[16px]"; }
    else if (scaleTier === 3) { lyricFontSize = "text-[9px] leading-[1.15]"; sectionFontSize = "text-[7px]"; songTitleFontSize = "text-[12px]"; songNumberFontSize = "text-[14px]"; }
    else { lyricFontSize = "text-[8.5px] leading-[1.1]"; sectionFontSize = "text-[7px]"; songTitleFontSize = "text-[11px]"; songNumberFontSize = "text-[13px]"; }
  }
  
  const rowMargin = isOnePage ? (scaleTier > 1 ? "mb-1" : "mb-3") : "mb-6";
  const titleMargin = isOnePage ? "mb-0.5 pb-0.5" : "mb-2 pb-1";
  const lyricSpace = isOnePage ? (scaleTier > 1 ? "space-y-0.5" : "space-y-1.5") : "space-y-3";
  const colPadding = isOnePage ? "px-2" : "px-4";

  // 提取排序與補齊段落邏輯
  const getOrderedLyrics = (item) => {
    const mapTags = item.mapString ? item.mapString.split('-').filter(Boolean) : [];
    const uniqueBaseTags = Array.from(new Set(mapTags.map(t => t.replace(/\(.*?\)/g, '').trim().toUpperCase())));
    
    const dbSong = songsDb?.find(s => s.id === item.songId);
    const activeLyrics = (dbSong && dbSong.lyrics && dbSong.lyrics.length > 0) ? dbSong.lyrics : (item.lyrics || []);

    const lyricsMap = new Map();
    activeLyrics.forEach(l => {
      if (l.section) lyricsMap.set(l.section.toUpperCase(), l.text || '');
    });
    
    const orderedLyrics = [];
    
    lyricsMap.forEach((text, tag) => {
        if (text.trim() !== '') {
            orderedLyrics.push({ section: tag, text });
        }
    });

    orderedLyrics.sort((a, b) => {
        const indexA = uniqueBaseTags.indexOf(a.section);
        const indexB = uniqueBaseTags.indexOf(b.section);

        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
        }
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        
        return 0;
    });
    
    return orderedLyrics;
  };

  // --- 計算太長會爆頁的歌 (Long Song Heuristic) ---
  const checkIsLongSong = (item) => {
    const ordered = getOrderedLyrics(item);
    let lines = 0;
    ordered.forEach(s => {
      lines += 1; // Tag title
      if (s.text) lines += s.text.split('\n').length;
      lines += 1; // Gap
    });
    
    if (pdfMode === 'large') return lines > 18;
    if (pdfMode === 'onepage') return false; // 為了強制擠在一頁，一頁版絕對不啟動獨立換頁
    return lines > 26; // Normal Mode: > 26 lines breaks to a full 2-col page
  };

  // --- 計算分頁與切割邏輯 (Pagination Logic) ---
  const pages = [];
  let currentPage = [];
  
  const maxNormal = isLarge ? 2 : 4;

  if (isOnePage) {
    // 一頁版：不管幾首，全部塞進第一頁的陣列中
    pages.push(setlist);
  } else {
    // 正常版/大字版：依照行數與首數限制進行分頁
    setlist.forEach((song) => {
      const isLong = checkIsLongSong(song);
      
      if (isLong) {
        if (currentPage.length > 0) {
          pages.push(currentPage);
          currentPage = [];
        }
        pages.push([song]); // Long song gets its own page
      } else {
        if (currentPage.length >= maxNormal) {
          pages.push(currentPage);
          currentPage = [];
        }
        currentPage.push(song);
      }
    });

    if (currentPage.length > 0) {
      pages.push(currentPage);
    }
  }

  // 若沒歌，給個空陣列
  if (pages.length === 0) pages.push([]);

  return (
    <div className="flex flex-col bg-white">
      {pages.map((pageSongs, pageIdx) => {
        // 確認這頁是否為獨立的長歌頁面
        const isLongSongPage = !isOnePage && pageSongs.length === 1 && checkIsLongSong(pageSongs[0]);

        return (
          <React.Fragment key={pageIdx}>
            {/* 降低 minHeight 至 940px 以釋放緩衝空間，防止瀏覽器小數點誤差觸發 PDF 原生換頁 */}
            <div className={`pdf-page-wrapper ${containerBase}`} style={{ padding: isOnePage ? '15px 30px' : '20px 40px', minHeight: '940px', height: 'auto' }}>
              
              {/* Header (每一頁都有) */}
              <div className={`flex justify-between items-end border-slate-900 ${headerGap} mt-0 shrink-0`}>
                <div className="flex flex-col gap-1">
                  <h1 className={`${titleTextClass} font-serif font-black tracking-widest text-slate-900 uppercase leading-none m-0`}>ICC Worship Song Map</h1>
                  <div className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded shadow-sm w-fit">
                    <CalendarDays size={12} className="text-sky-500" />
                    <span className="text-[11px] font-bold tracking-[0.15em] font-mono leading-none pt-[1px]">
                      {meta.date?.replace(/-/g, '/') || 'YYYY / MM / DD'}
                    </span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Worship Leader</span>
                  <span className="text-[15px] font-serif font-bold text-slate-800 leading-none">{meta.wl || t('未指定', language)}</span>
                </div>
              </div>

              {/* Highlighted Song Map Section (每一頁都有，永遠顯示完整歌單 Map) */}
              <div className={`${mapGap} bg-slate-50 rounded-lg border border-slate-200 shrink-0`}>
                <div className={`grid grid-cols-2 gap-x-6 ${mapGridGap}`}>
                  {setlist.map((item, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start">
                      <div className={`${mapNumberSize} shrink-0 bg-slate-900 text-white rounded-[4px] flex items-center justify-center font-bold font-serif mt-[1px] shadow-sm`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`font-bold ${mapSongTitleFontSize} font-serif leading-none truncate`}>{item.title}</span>
                          <span className={`${mapKeyFontSize} font-mono font-bold text-sky-600 bg-sky-100/80 px-1 py-[2px] rounded leading-none shrink-0 border border-sky-200`}>{item.key}</span>
                        </div>
                        <div className="flex flex-wrap gap-0.5 items-center">
                          {item.mapString ? item.mapString.split('-').map((tag, tIdx) => (
                            <div key={tIdx} className="flex items-center">
                              <span className={`inline-flex items-center justify-center px-1.5 py-[2px] bg-white border border-slate-300 text-slate-600 ${mapTagFontSize} font-bold font-mono rounded-[3px] shadow-sm`}>
                                {tag}
                              </span>
                              {tIdx < item.mapString.split('-').length - 1 && (
                                <span className={`text-slate-300 mx-[2px] font-bold ${mapArrowFontSize}`}>→</span>
                              )}
                            </div>
                          )) : <span className="text-[8px] text-slate-400 italic">{t('尚未設定段落', language)}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lyrics Layout in Rows */}
              <div className={`flex flex-col flex-1 ${isOnePage ? 'mt-2' : 'mt-4'}`}>
                {isLongSongPage ? (
                  // --- 單首長歌：雙欄排版模式 ---
                  <div className={`w-full ${rowMargin} pdf-avoid-break`}>
                    <div className={`flex items-center gap-2 ${titleMargin} border-b border-slate-200 mb-4`}>
                      <span className={`text-slate-300 font-black font-serif leading-none ${songNumberFontSize}`}>{setlist.indexOf(pageSongs[0]) + 1}.</span>
                      <h2 className={`${songTitleFontSize} font-bold font-serif tracking-wide text-slate-900 leading-none pt-1`}>{pageSongs[0].title}</h2>
                    </div>
                    <div style={{ columnCount: 2, columnGap: '2rem' }} className={lyricSpace}>
                      {getOrderedLyrics(pageSongs[0]).map((s, si) => (
                        <div key={si} className="pl-2 border-l-[3px] border-sky-300 inline-block w-full mb-3" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                          <div className={`font-bold text-sky-600 ${sectionFontSize} mb-0.5 tracking-widest uppercase`}>{getFullTagExplanation(s.section, language)}</div>
                          {s.text && <div className={`whitespace-pre-wrap ${lyricFontSize} text-slate-800 font-sans`}>{s.text}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // --- 普通歌曲：雙格 Grid 排版模式 ---
                  Array.from({ length: Math.ceil(pageSongs.length / 2) }).map((_, rowIdx) => {
                    const rowItems = pageSongs.slice(rowIdx * 2, rowIdx * 2 + 2);
                    return (
                      <div key={rowIdx} className={`flex w-full ${rowMargin} pdf-avoid-break`} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                        {rowItems.map((item, colIdx) => {
                          const globalIdx = setlist.indexOf(item);
                          return (
                            <div key={colIdx} className={`w-1/2 ${colPadding}`}>
                              <div className={`flex items-center gap-2 ${titleMargin} border-b border-slate-200`}>
                                <span className={`text-slate-300 font-black font-serif leading-none ${songNumberFontSize}`}>{globalIdx + 1}.</span>
                                <h2 className={`${songTitleFontSize} font-bold font-serif tracking-wide text-slate-900 leading-none pt-1`}>{item.title}</h2>
                              </div>
                              <div className={lyricSpace}>
                                {getOrderedLyrics(item).map((s, si) => (
                                  <div key={si} className="pl-2 border-l-[3px] border-sky-300 inline-block w-full mb-1">
                                    <div className={`font-bold text-sky-600 ${sectionFontSize} mb-0.5 tracking-widest uppercase`}>{getFullTagExplanation(s.section, language)}</div>
                                    {s.text && <div className={`whitespace-pre-wrap ${lyricFontSize} text-slate-800 font-sans`}>{s.text}</div>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="mt-auto pt-3 border-t-2 border-slate-900 flex justify-between items-center shrink-0">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Irvine City Church</span>
                  <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] font-serif">{t('用心靈和誠實敬拜', language)}</span>
              </div>
            </div>

            {/* 原生的 html2pdf 換頁元素，只在不是最後一頁時渲染 */}
            {pageIdx < pages.length - 1 && <div className="html2pdf__page-break" style={{ height: 0, margin: 0, padding: 0, border: 'none' }}></div>}
          </React.Fragment>
        );
      })}
    </div>
  );
};