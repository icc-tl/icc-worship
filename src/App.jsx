import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Trash2, ArrowUp, ArrowDown, Edit2, X, ChevronLeft, ChevronRight, Download, FileText, Music, Eye, Database, BookOpen, Save, CalendarDays, User, Home, ListMusic, Lock, Unlock, Youtube, Sparkles, Wand2, Loader2, Crown, Code, Layers, Globe } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
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

const MOCK_SONGS = [
  { id: '1', title: '我神我王', artist: '讚美之泉', defaultKey: 'D', youtubeId: '', hasMultitrack: true, lyrics: [{ section: 'V', text: '除祢以外天上有誰祢是我所愛慕\n雖我肉體漸漸衰退祢是我的力量' }, { section: 'PC', text: '走過死蔭幽谷我仍要宣揚\n祢與我同在祢使軟弱者得剛強' }, { section: 'C', text: '我神我王我信靠祢\n我的盼望我仰望祢\n祢是我心裡的力量\n我的福分直到永遠' }, { section: 'B', text: '受患難卻不被壓碎\n心困惑卻沒有絕望\n受逼迫卻不被撇棄\n被打倒卻沒有滅亡' }] },
  { id: '2', title: '哈...哈利路亞', artist: '約書亞樂團', defaultKey: 'F', youtubeId: '', hasMultitrack: false, lyrics: [{ section: 'V', text: '哈利路亞 讚美聲響起\n歸給萬王之王宇宙萬物的主宰\n天使天軍全地都呼喊\n哈利路亞 讚美主聖名' }, { section: 'C', text: '哈哈利路亞我們高舉祢\n用心靈和聲音來榮耀祢\n哈哈利路亞迴響在全地\n祢恩典的呼喚和豐盛的慈愛' }] },
  { id: '3', title: '最真實的我', artist: 'The Hope', defaultKey: 'D', youtubeId: '', hasMultitrack: true, lyrics: [{ section: 'V1', text: '祢全然的愛我最真實的我\n祢全然接納我即或我軟弱\n生命中的每一步有祢豐盛恩典\n使我更靠近祢' }, { section: 'V2', text: '祢全然的愛我緊緊擁抱我\n祢全然接納我永不離開我\n生命中的每一步有祢豐盛恩典\n使我更靠近祢' }, { section: 'C', text: '我只想要藏在祢翅膀蔭下\n渴求能更多停留在祢同在\n生命最大的盼望就在祢恩典之中\n祢就站立在我的身旁' }] },
  { id: '4', title: '只為祢國祢名', artist: '真道教會', defaultKey: 'E', youtubeId: '', hasMultitrack: false, lyrics: [{ section: 'V1', text: '祢創造了我的生命為我眾罪釘十架\n祢的犧牲完全救贖我使我生命美麗' }, { section: 'V2', text: '聽見祢呼召的聲音 願成為祢的器皿\n我願降服用我全人全心差遣我我在這裡' }, { section: 'C', text: '世上所有金銀珍寶和這世界所提供的美好\n我願放下只為要跟隨祢回應祢榮耀呼召\n直到那日 天地廢去我的生命呼吸將要停息\n跟隨我主何等榮耀歡喜\n我獻上自己只為祢國祢名' }] },
  { id: '7', title: '普天下歡慶', artist: 'Kua', defaultKey: 'E', youtubeId: '', hasMultitrack: false, lyrics: [{ section: 'V', text: '普天下當向耶和華歡呼\n你們當樂意事奉耶和華\n當來向祂歌唱' }, { section: 'C', text: '當稱謝進入祂的門當讚美進入祂的院\n當感謝祂 稱頌祂的名' }, { section: 'B', text: '來向祂歡呼來向祂跳舞' }] },
  { id: '8', title: '不停讚美祢', artist: 'SOP', defaultKey: 'E', youtubeId: '', hasMultitrack: false, lyrics: [{ section: 'V', text: '時時稱頌祢向祢來歌唱\n因祢是拯救我們偉大的神' }, { section: 'C', text: '不停讚美祢 大聲讚美祢\n唯有祢配得榮耀尊貴權柄' }, { section: 'B', text: '我讚美讚美不停讚美\n跳舞跳舞不停跳舞' }] },
  { id: '9', title: '不停湧出來', artist: '新店行道會', defaultKey: 'F', youtubeId: '', hasMultitrack: true, lyrics: [{ section: 'V', text: '救恩臨到我生命 我心激動不已\n罪污全被洗潔淨 我心激動不已' }, { section: 'PC', text: '在我裡面愛如泉源\n不停湧出來不停湧出來' }, { section: 'C', text: '啊我要盡情跳舞\n我所有掛慮全被取代' }] },
  { id: '10', title: '深深地敬拜', artist: 'SOP', defaultKey: 'D', youtubeId: '', hasMultitrack: false, lyrics: [{ section: 'V', text: '在我心門不停地叩門\n渴望愛我每天與我同行' }, { section: 'C', text: '深深地敬拜 深深地獻上我的愛' }] },
  { id: '13', title: '前來敬拜', artist: '讚美之泉', defaultKey: 'F', youtubeId: '', hasMultitrack: false, lyrics: [{ section: 'V', text: '哈利路亞哈利路亞\n前來敬拜永遠的君王' }, { section: 'C', text: '榮耀尊貴 能力權柄歸於祢' }] },
  { id: '14', title: '獻上尊榮', artist: '讚美之泉', defaultKey: 'F', youtubeId: '', hasMultitrack: false, lyrics: [{ section: 'V', text: '耶穌基督 榮耀父神彰顯' }, { section: 'C', text: '獻上尊榮 尊榮' }] },
  { id: '15', title: '永恆唯一的盼望', artist: '約書亞樂團', defaultKey: 'F', youtubeId: '', hasMultitrack: true, lyrics: [{ section: 'V', text: '有一位真神祂名字叫耶穌' }, { section: 'C', text: '耶穌是生命一切問題的解答' }] },
  { id: '16', title: 'You are good', artist: 'Bethel Music', defaultKey: 'G', youtubeId: '', hasMultitrack: true, lyrics: [{ section: 'V1', text: 'I want to scream it out' }, { section: 'C', text: 'And I sing because you are good' }] },
  { id: '17', title: '只想要歌唱', artist: '約書亞樂團', defaultKey: 'A', youtubeId: '', hasMultitrack: false, lyrics: [{ section: 'V1', text: '這絕不是表演不唱空洞語言' }, { section: 'C', text: '祢配得最高敬拜' }] }
];

const MOCK_SETLISTS = [
  {
    id: 'mock-setlist-1', date: '2025-02-09', wl: 'Jovy and Rudy', youtubePlaylistUrl: 'https://youtube.com/playlist?list=PLexample123', updatedAt: new Date().toISOString(),
    songs: [
      { id: 'm1', songId: '1', title: '我神我王', key: 'D', mapString: 'I-V(Jovy)-V(Alex)-PC-C-C-V-PC-C-C-B-B-B-C-C-L1', lyrics: MOCK_SONGS.find(s=>s.id==='1')?.lyrics || [] },
      { id: 'm2', songId: '2', title: '哈...哈利路亞', key: 'F', mapString: 'V-C-V-C-I-C-C-V-C-L1-L1', lyrics: MOCK_SONGS.find(s=>s.id==='2')?.lyrics || [] },
      { id: 'm3', songId: '3', title: '最真實的我', key: 'D', mapString: 'V1-V2-C-V2-C-C-C-L3', lyrics: MOCK_SONGS.find(s=>s.id==='3')?.lyrics || [] },
      { id: 'm4', songId: '4', title: '只為祢國祢名', key: 'D-E', mapString: 'I-V1(Jovy)-V2-C-V1-V2-C-C-FW-升E-C-L2-L2', lyrics: MOCK_SONGS.find(s=>s.id==='4')?.lyrics || [] }
    ]
  },
  {
    id: 'mock-setlist-2', date: '2026-01-09', wl: '佳綺師母/Rudy', youtubePlaylistUrl: '', updatedAt: new Date().toISOString(),
    songs: [
      { id: 'm5', songId: '7', title: '普天下歡慶', key: 'E', mapString: 'I-V-C-V-C-C-I-B-B-B-B-C-C-L1', lyrics: MOCK_SONGS.find(s=>s.id==='7')?.lyrics || [] },
      { id: 'm6', songId: '8', title: '不停讚美祢', key: 'E', mapString: 'I-V-C-V-C- С-В-В-I- C-C', lyrics: MOCK_SONGS.find(s=>s.id==='8')?.lyrics || [] },
      { id: 'm7', songId: '9', title: '不停湧出來', key: 'F', mapString: 'I-V-PC-C-I-V-PC-PC-C-C-C-L1-L1', lyrics: MOCK_SONGS.find(s=>s.id==='9')?.lyrics || [] }
    ]
  }
];

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

// -----------------------------------------------------------------------------
// Main Application Component
// -----------------------------------------------------------------------------
export default function App() {
  const [language, setLanguage] = useState('zh');

  // --- Auth & Admin State ---
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [pendingAuthAction, setPendingAuthAction] = useState(null);

  // --- Database State ---
  const [songsDb, setSongsDb] = useState([]); 
  const [setlistsDb, setSetlistsDb] = useState([]);
  const [isDbReady, setIsDbReady] = useState(false);

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
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(firebaseAuth, __initial_auth_token);
        } else {
          await signInAnonymously(firebaseAuth);
        }
      } catch (error) { 
        console.error("Firebase Auth Error:", error); 
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(firebaseAuth, setUser);
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
      if (snapshot.empty && songsDb.length === 0) {
        setSongsDb(MOCK_SONGS);
        setIsDbReady(true);
        MOCK_SONGS.forEach(s => setDoc(doc(firestoreDb, 'artifacts', currentAppId, 'public', 'data', 'icc_songs', s.id), s).catch(console.error));
      } else if (!snapshot.empty) {
        const loaded = snapshot.docs.map(d => d.data());
        loaded.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        setSongsDb(loaded);
        setIsDbReady(true);
      }
    }, (err) => {
      console.error("Firestore Songs Error:", err);
      setSongsDb(MOCK_SONGS);
      setIsDbReady(true);
    });

    // 2. Sync Setlists
    const setlistsRef = collection(firestoreDb, 'artifacts', currentAppId, 'public', 'data', 'icc_setlists');
    const unsubSetlists = onSnapshot(setlistsRef, (snapshot) => {
      if (snapshot.empty && setlistsDb.length === 0) {
        setSetlistsDb(MOCK_SETLISTS);
        MOCK_SETLISTS.forEach(s => setDoc(doc(firestoreDb, 'artifacts', currentAppId, 'public', 'data', 'icc_setlists', s.id), s).catch(console.error));
      } else if (!snapshot.empty) {
        const loaded = snapshot.docs.map(d => d.data());
        loaded.sort((a, b) => new Date(b.date) - new Date(a.date));
        setSetlistsDb(loaded);
      }
    }, (err) => {
      console.error("Firestore Setlists Error:", err);
      setSetlistsDb(MOCK_SETLISTS);
    });

    return () => { unsubSongs(); unsubSetlists(); };
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

  const handleAuthSubmit = () => {
    if (authPassword === 'ICCWS1025') { setIsAdmin(true); setShowAuthModal(false); if (pendingAuthAction) pendingAuthAction(); setPendingAuthAction(null); }
    else setAuthError(t('密碼錯誤。', language));
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
            <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAuthSubmit()} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50 outline-none transition focus:border-sky-500 text-center text-lg tracking-widest mb-2 shadow-sm" placeholder="******" autoFocus />
            {authError && <p className="text-red-500 text-xs font-bold mb-2">{String(authError)}</p>}
            <div className="flex justify-center gap-3 mt-6">
              <button onClick={() => setShowAuthModal(false)} className="px-5 py-2.5 text-sm text-slate-500 hover:bg-slate-100 rounded-xl transition font-bold">{t('取消返回', language)}</button>
              <button onClick={handleAuthSubmit} className="px-6 py-2.5 text-sm bg-sky-500 hover:bg-sky-600 text-white rounded-xl transition shadow-md font-bold">{t('確認解鎖', language)}</button>
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
              {isAdmin ? <span className="text-sky-600 font-bold flex items-center gap-1"><Unlock size={12}/> {t('權限已解鎖', language)}</span> : <span className="flex items-center gap-1"><Lock size={12}/> {t('訪客模式', language)}</span>}
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
                            <Eye size={16}/> {t('預覽', language)}
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