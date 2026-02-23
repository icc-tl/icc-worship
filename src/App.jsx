import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Trash2, ArrowUp, ArrowDown, Edit2, X, ChevronLeft, Download, FileText, Music, Eye, Database, BookOpen, Save, CalendarDays, User, Home, ListMusic, Lock, Unlock, Youtube, Sparkles, Wand2, Loader2, Crown } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

// -----------------------------------------------------------------------------
// Firebase & App Configuration (正式版設定 - 相容預覽環境)
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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'icc-worship-hub';

// -----------------------------------------------------------------------------
// Constants & Mock Data
// -----------------------------------------------------------------------------
const SONG_MAP_TAGS = ['I', 'V', 'V1', 'V2', 'V3', 'V4', 'PC', 'C', 'C1', 'C2', 'C3', 'B', 'IT', 'FW', 'L1', 'L2', 'L3', 'OT', 'E'];
const STRUCTURAL_TAGS = ['I', 'IT', 'FW', 'L1', 'L2', 'L3', 'OT', 'E'];
const KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B', 'D-E', 'E-F#', 'F-G', 'G-A'];

const TAG_EXPLANATIONS = {
  'I': '前奏 (Intro)', 'V': '主歌 (Verse)', 'V1': '第一節主歌 (Verse 1)', 'V2': '第二節主歌 (Verse 2)', 'V3': '第三節主歌 (Verse 3)', 'V4': '第四節主歌 (Verse 4)',
  'PC': '導歌 (Pre Chorus)', 'C': '副歌 (Chorus)', 'C1': '副歌 1 (Chorus 1)', 'C2': '副歌 2 (Chorus 2)', 'C3': '副歌 3 (Chorus 3)', 
  'B': '橋段 (Bridge)', 'IT': '間奏 (Interlude)',
  'FW': '自由敬拜 (Free Worship)', 'L1': '最後一句 (Last Line)', 'L2': '最後兩句 (Last 2 Lines)',
  'L3': '最後三句 (Last 3 Lines)', 'OT': '尾奏 (Outro)', 'E': '結尾 (Ending)'
};

const MOCK_SONGS = [
  { id: '1', title: '我神我王', artist: '讚美之泉', defaultKey: 'D', youtubeId: '', lyrics: [{ section: 'V', text: '除祢以外天上有誰祢是我所愛慕\n雖我肉體漸漸衰退祢是我的力量' }, { section: 'PC', text: '走過死蔭幽谷我仍要宣揚\n祢與我同在祢使軟弱者得剛強' }, { section: 'C', text: '我神我王我信靠祢\n我的盼望我仰望祢\n祢是我心裡的力量\n我的福分直到永遠' }, { section: 'B', text: '受患難卻不被壓碎\n心困惑卻沒有絕望\n受逼迫卻不被撇棄\n被打倒卻沒有滅亡' }] },
  { id: '2', title: '哈...哈利路亞', artist: '約書亞樂團', defaultKey: 'F', youtubeId: '', lyrics: [{ section: 'V', text: '哈利路亞 讚美聲響起\n歸給萬王之王宇宙萬物的主宰\n天使天軍全地都呼喊\n哈利路亞 讚美主聖名' }, { section: 'C', text: '哈哈利路亞我們高舉祢\n用心靈和聲音來榮耀祢\n哈哈利路亞迴響在全地\n祢恩典的呼喚和豐盛的慈愛' }] },
  { id: '3', title: '最真實的我', artist: 'The Hope', defaultKey: 'D', youtubeId: '', lyrics: [{ section: 'V1', text: '祢全然的愛我最真實的我\n祢全然接納我即或我軟弱\n生命中的每一步有祢豐盛恩典\n使我更靠近祢' }, { section: 'V2', text: '祢全然的愛我緊緊擁抱我\n祢全然接納我永不離開我\n生命中的每一步有祢豐盛恩典\n使我更靠近祢' }, { section: 'C', text: '我只想要藏在祢翅膀蔭下\n渴求能更多停留在祢同在\n生命最大的盼望就在祢恩典之中\n祢就站立在我的身旁' }] },
  { id: '4', title: '只為祢國祢名', artist: '真道教會', defaultKey: 'E', youtubeId: '', lyrics: [{ section: 'V1', text: '祢創造了我的生命為我眾罪釘十架\n祢的犧牲完全救贖我使我生命美麗' }, { section: 'V2', text: '聽見祢呼召的聲音 願成為祢的器皿\n我願降服用我全人全心差遣我我在這裡' }, { section: 'C', text: '世上所有金銀珍寶和這世界所提供的美好\n我願放下只為要跟隨祢回應祢榮耀呼召\n直到那日 天地廢去我的生命呼吸將要停息\n跟隨我主何等榮耀歡喜\n我獻上自己只為祢國祢名' }] },
  { id: '7', title: '普天下歡慶', artist: 'Kua', defaultKey: 'E', youtubeId: '', lyrics: [{ section: 'V', text: '普天下當向耶和華歡呼\n你們當樂意事奉耶和華\n當來向祂歌唱' }, { section: 'C', text: '當稱謝進入祂的門當讚美進入祂的院\n當感謝祂 稱頌祂的名' }, { section: 'B', text: '來向祂歡呼來向祂跳舞' }] },
  { id: '8', title: '不停讚美祢', artist: 'SOP', defaultKey: 'E', youtubeId: '', lyrics: [{ section: 'V', text: '時時稱頌祢向祢來歌唱\n因祢是拯救我們偉大的神' }, { section: 'C', text: '不停讚美祢 大聲讚美祢\n唯有祢配得榮耀尊貴權柄' }, { section: 'B', text: '我讚美讚美不停讚美\n跳舞跳舞不停跳舞' }] },
  { id: '9', title: '不停湧出來', artist: '新店行道會', defaultKey: 'F', youtubeId: '', lyrics: [{ section: 'V', text: '救恩臨到我生命 我心激動不已\n罪污全被洗潔淨 我心激動不已' }, { section: 'PC', text: '在我裡面愛如泉源\n不停湧出來不停湧出來' }, { section: 'C', text: '啊我要盡情跳舞\n我所有掛慮全被取代' }] },
  { id: '10', title: '深深地敬拜', artist: 'SOP', defaultKey: 'D', youtubeId: '', lyrics: [{ section: 'V', text: '在我心門不停地叩門\n渴望愛我每天與我同行' }, { section: 'C', text: '深深地敬拜 深深地獻上我的愛' }] },
  { id: '13', title: '前來敬拜', artist: '讚美之泉', defaultKey: 'F', youtubeId: '', lyrics: [{ section: 'V', text: '哈利路亞哈利路亞\n前來敬拜永遠的君王' }, { section: 'C', text: '榮耀尊貴 能力權柄歸於祢' }] },
  { id: '14', title: '獻上尊榮', artist: '讚美之泉', defaultKey: 'F', youtubeId: '', lyrics: [{ section: 'V', text: '耶穌基督 榮耀父神彰顯' }, { section: 'C', text: '獻上尊榮 尊榮' }] },
  { id: '15', title: '永恆唯一的盼望', artist: '約書亞樂團', defaultKey: 'F', youtubeId: '', lyrics: [{ section: 'V', text: '有一位真神祂名字叫耶穌' }, { section: 'C', text: '耶穌是生命一切問題的解答' }] },
  { id: '16', title: 'You are good', artist: 'Bethel Music', defaultKey: 'G', youtubeId: '', lyrics: [{ section: 'V1', text: 'I want to scream it out' }, { section: 'C', text: 'And I sing because you are good' }] },
  { id: '17', title: '只想要歌唱', artist: '約書亞樂團', defaultKey: 'A', youtubeId: '', lyrics: [{ section: 'V1', text: '這絕不是表演不唱空洞語言' }, { section: 'C', text: '祢配得最高敬拜' }] }
];

const MOCK_SETLISTS = [
  {
    id: 'mock-setlist-1', date: '2025-02-09', wl: 'Jovy and Rudy', updatedAt: new Date().toISOString(),
    songs: [
      { id: 'm1', songId: '1', title: '我神我王', key: 'D', mapString: 'I-V(Jovy)-V(Alex)-PC-C-C-V-PC-C-C-B-B-B-C-C-L1', lyrics: MOCK_SONGS.find(s=>s.id==='1')?.lyrics || [] },
      { id: 'm2', songId: '2', title: '哈...哈利路亞', key: 'F', mapString: 'V-C-V-C-I-C-C-V-C-L1-L1', lyrics: MOCK_SONGS.find(s=>s.id==='2')?.lyrics || [] },
      { id: 'm3', songId: '3', title: '最真實的我', key: 'D', mapString: 'V1-V2-C-V2-C-C-C-L3', lyrics: MOCK_SONGS.find(s=>s.id==='3')?.lyrics || [] },
      { id: 'm4', songId: '4', title: '只為祢國祢名', key: 'D-E', mapString: 'I-V1(Jovy)-V2-C-V1-V2-C-C-FW-升E-C-L2-L2', lyrics: MOCK_SONGS.find(s=>s.id==='4')?.lyrics || [] }
    ]
  },
  {
    id: 'mock-setlist-2', date: '2026-01-09', wl: '佳綺師母/Rudy', updatedAt: new Date().toISOString(),
    songs: [
      { id: 'm5', songId: '7', title: '普天下歡慶', key: 'E', mapString: 'I-V-C-V-C-C-I-B-B-B-B-C-C-L1', lyrics: MOCK_SONGS.find(s=>s.id==='7')?.lyrics || [] },
      { id: 'm6', songId: '8', title: '不停讚美祢', key: 'E', mapString: 'I-V-C-V-C- С-В-В-I- C-C', lyrics: MOCK_SONGS.find(s=>s.id==='8')?.lyrics || [] },
      { id: 'm7', songId: '9', title: '不停湧出來', key: 'F', mapString: 'I-V-PC-C-I-V-PC-PC-C-C-C-L1-L1', lyrics: MOCK_SONGS.find(s=>s.id==='9')?.lyrics || [] }
    ]
  }
];

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

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-600 mb-6 text-sm leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">取消</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-sm">確認刪除</button>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Main Application Component
// -----------------------------------------------------------------------------
export default function App() {
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
  
  const today = new Date().toISOString().split('T')[0];
  const [meta, setMeta] = useState({ date: today, wl: '' });
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Setlist Management State ---
  const [currentSetlistId, setCurrentSetlistId] = useState(null);
  const [isSavingSetlist, setIsSavingSetlist] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteSetlistConfirmId, setDeleteSetlistConfirmId] = useState(null);
  const [homeSearchQuery, setHomeSearchQuery] = useState(''); 

  // --- Feature State ---
  const [showComingSoonModal, setShowComingSoonModal] = useState(false); 

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
  const [customLyrics, setCustomLyrics] = useState([{ section: 'V', text: '' }]);
  const [isSaving, setIsSaving] = useState(false);

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
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) { 
        console.error("Firebase Auth Error:", error); 
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // -----------------------------------------------------------------------------
  // Data Sync (Cloud Firestore)
  // -----------------------------------------------------------------------------
  useEffect(() => {
    if (!user) return;
    
    // 1. Sync Songs
    const songsRef = collection(db, 'artifacts', appId, 'public', 'data', 'icc_songs');
    const unsubSongs = onSnapshot(songsRef, (snapshot) => {
      if (snapshot.empty && songsDb.length === 0) {
        setSongsDb(MOCK_SONGS);
        setIsDbReady(true);
        MOCK_SONGS.forEach(s => setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'icc_songs', s.id), s).catch(console.error));
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
    const setlistsRef = collection(db, 'artifacts', appId, 'public', 'data', 'icc_setlists');
    const unsubSetlists = onSnapshot(setlistsRef, (snapshot) => {
      if (snapshot.empty && setlistsDb.length === 0) {
        setSetlistsDb(MOCK_SETLISTS);
        MOCK_SETLISTS.forEach(s => setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'icc_setlists', s.id), s).catch(console.error));
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
  // UI Logic
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
    setSearchResults(songsDb.filter(s => (s.title||'').toLowerCase().includes(q) || (s.artist||'').toLowerCase().includes(q)));
  }, [searchQuery, songsDb]);

  const requireAdmin = (cb) => {
    if (isAdmin) cb(); 
    else { setPendingAuthAction(() => cb); setAuthPassword(''); setAuthError(''); setShowAuthModal(true); }
  };

  const handleAuthSubmit = () => {
    if (authPassword === 'ICCWS1025') { setIsAdmin(true); setShowAuthModal(false); if (pendingAuthAction) pendingAuthAction(); setPendingAuthAction(null); }
    else setAuthError('密碼錯誤。');
  };

  const filteredHomeSetlists = setlistsDb.filter(item => {
    const q = homeSearchQuery.toLowerCase();
    if (!q) return true;
    return (item.date && item.date.includes(q)) || (item.wl && item.wl.toLowerCase().includes(q)) || (item.songs && item.songs.some(s => s.title?.toLowerCase().includes(q)));
  });

  // --- 歌曲熱度統計與排行榜計算 ---
  const songStats = React.useMemo(() => {
    const stats = {};
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    songsDb.forEach(song => {
      let count3Months = 0;
      let latestDate = null;

      setlistsDb.forEach(sl => {
        if (sl.songs && sl.songs.some(s => s.songId === song.id)) {
          const setlistDate = new Date(sl.date);
          if (setlistDate >= threeMonthsAgo && setlistDate <= now) {
            count3Months++;
          }
          if (!latestDate || setlistDate > latestDate) {
            latestDate = setlistDate;
          }
        }
      });

      let weeksAgo = null;
      if (latestDate) {
        const diffTime = Math.max(0, now - latestDate);
        weeksAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
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
      return (a.title || '').localeCompare(b.title || '');
    });
  }, [songsDb, searchResults, searchQuery, songStats]);

  const libraryDisplaySongs = React.useMemo(() => {
    return songsDb.filter(s => (s.title||'').toLowerCase().includes(librarySearch.toLowerCase()) || (s.artist||'').toLowerCase().includes(librarySearch.toLowerCase()))
      .map(song => ({
        ...song,
        stats: songStats[song.id] || { count3Months: 0, weeksAgo: null }
      })).sort((a, b) => {
        if (!librarySearch && b.stats.count3Months !== a.stats.count3Months) {
          return b.stats.count3Months - a.stats.count3Months;
        }
        return (a.title || '').localeCompare(b.title || '');
      });
  }, [songsDb, librarySearch, songStats]);


  const saveCurrentSetlist = async () => {
    if (!user) return;
    setIsSavingSetlist(true);
    try {
      const id = currentSetlistId || 'setlist-' + Date.now();
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'icc_setlists', id), { id, date: meta.date, wl: meta.wl, songs: setlist, updatedAt: new Date().toISOString() });
      setCurrentSetlistId(id); setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000); 
    } catch (e) { console.error("Save Setlist Error:", e); } 
    finally { setIsSavingSetlist(false); }
  };

  const executeDeleteSetlist = async (id) => {
    if (!user) return;
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'icc_setlists', id)); } finally { setDeleteSetlistConfirmId(null); }
  };

  const openSetlist = (obj) => { setCurrentSetlistId(obj.id); setMeta({ date: obj.date, wl: obj.wl }); setSetlist(obj.songs || []); setView('list'); };
  const createNewSetlist = () => { setCurrentSetlistId(null); setMeta({ date: today, wl: '' }); setSetlist([]); setView('list'); };
  const openPreviewFromHome = (obj) => { openSetlist(obj); setPreviewSource('home'); setView('preview'); };
  const openPreviewFromList = () => { setPreviewSource('list'); setView('preview'); };

  const openEditor = (item = null) => {
    setEditingItem(item);
    if (item) {
      const dbSong = songsDb.find(s => s.id === item.songId);
      setCurrentSong(dbSong || { id: item.songId, title: item.title, lyrics: item.lyrics });
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
      const opt = { 
        margin: [0, 0, 0, 0], 
        filename: `ICC_WorshipMap_${dateStr}.pdf`, 
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true }, 
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } 
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
    if (editingItem) setSetlist(setlist.map(i => i.id === editingItem.id ? { ...i, key: currentKey, mapString: currentMap } : i));
    else setSetlist([...setlist, { id: Date.now().toString(), songId: currentSong.id, title: currentSong.title, key: currentKey, mapString: currentMap, lyrics: currentSong.lyrics }]);
    setView('list');
  };

  const moveItem = (idx, dir) => {
    const nl = [...setlist];
    if (dir === 'up' && idx > 0) [nl[idx-1], nl[idx]] = [nl[idx], nl[idx-1]];
    else if (dir === 'down' && idx < setlist.length - 1) [nl[idx+1], nl[idx]] = [nl[idx], nl[idx+1]];
    setSetlist(nl);
  };

  const deleteItem = (id) => { setSetlist(setlist.filter(item => item.id !== id)); };

  const openManualEntry = (songToEdit = null, initialTitle = '', source = 'manage') => {
    setManualSource(source);
    setSaveError('');
    if (songToEdit) {
      setEditingDbSongId(songToEdit.id); setCustomTitle(songToEdit.title); setCustomArtist(songToEdit.artist || ''); setCustomKey(songToEdit.defaultKey || 'C'); setCustomYoutubeUrl(songToEdit.youtubeId ? `https://youtu.be/${songToEdit.youtubeId}` : ''); setCustomLyrics(songToEdit.lyrics && songToEdit.lyrics.length > 0 ? songToEdit.lyrics : [{ section: 'V', text: '' }]);
    } else {
      setEditingDbSongId(null); setCustomTitle(initialTitle); setCustomArtist(''); setCustomKey('C'); setCustomYoutubeUrl(''); setCustomLyrics([{ section: 'V', text: '' }]);
    }
    setView('manual'); setShowDropdown(false);
  };

  const handleSaveCustomSong = async () => {
    if (!customTitle.trim()) { setSaveError('請輸入歌名！'); return; }
    if (!user) { setSaveError('資料庫尚未連線，請稍後再試。'); return; }
    
    setIsSaving(true);
    setSaveError('');
    
    try {
      const sid = editingDbSongId || 'custom-' + Date.now();
      const extractId = (url) => url?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]{11})/)?.[1] || url;
      const ns = { 
        id: sid, 
        title: customTitle, 
        artist: customArtist || 'Custom', 
        defaultKey: customKey, 
        youtubeId: extractId(customYoutubeUrl) || '', 
        lyrics: customLyrics.filter(l => l.text.trim()) 
      };
      
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'icc_songs', sid), ns);
      
      if (manualSource === 'editor') { setCurrentSong(ns); setSearchQuery(ns.title); setView('editor'); } 
      else { setView('manage'); }
    } catch (error) { 
      console.error("Firestore Save Error:", error); 
      setSaveError('儲存至雲端時發生錯誤：' + error.message);
    } finally { 
      setIsSaving(false); 
    }
  };

  const executeDeleteDbSong = async (id) => { if (!user) return; await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'icc_songs', id)); setDeleteConfirmId(null); };

  const getMonthNameShort = (m) => ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][parseInt(m)-1] || m;

  // -----------------------------------------------------------------------------
  // Render Components
  // -----------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans relative overflow-x-hidden flex flex-col">

      {/* Hidden Print Area */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <div id="actual-print-area" className="bg-white text-black p-6 w-[750px] mx-auto box-border">
          <PrintLayoutContent meta={meta} setlist={setlist} />
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="text-5xl mb-4 animate-bounce">🐰</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-2">
              <Lock size={20} className="text-sky-500"/> 系統驗證
            </h3>
            <div className="text-slate-600 text-[14px] leading-relaxed mb-6 font-medium bg-sky-50 p-4 rounded-xl border border-sky-100 shadow-inner">
              編輯功能目前僅開放主領使用，<br/>如需權限請洽師母 🙏
            </div>
            <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAuthSubmit()} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50 outline-none transition focus:border-sky-500 text-center text-lg tracking-widest mb-2 shadow-sm" placeholder="******" autoFocus />
            {authError && <p className="text-red-500 text-xs font-bold mb-2">{authError}</p>}
            <div className="flex justify-center gap-3 mt-6">
              <button onClick={() => setShowAuthModal(false)} className="px-5 py-2.5 text-sm text-slate-500 hover:bg-slate-100 rounded-xl transition font-bold">取消返回</button>
              <button onClick={handleAuthSubmit} className="px-6 py-2.5 text-sm bg-sky-500 hover:bg-sky-600 text-white rounded-xl transition shadow-md font-bold">確認解鎖</button>
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
            <h3 className="text-2xl font-bold text-slate-900 mb-2 font-serif">敬請期待</h3>
            <p className="text-slate-600 mb-8 text-[15px] leading-relaxed font-medium">
              AI 智能歌詞抓取功能開發中！<br/>爭取在牧師安息回來前做出來 🙏
            </p>
            <button onClick={() => setShowComingSoonModal(false)} className="w-full px-4 py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl transition shadow-lg text-sm tracking-widest">
              我知道了
            </button>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      {view !== 'preview' && (
        <div className="bg-white border-b border-slate-200 text-slate-600 text-xs py-3 px-4 sm:px-6 flex flex-col sm:flex-row justify-center sm:justify-between items-center relative z-50 shadow-sm gap-3">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              {isAdmin ? <span className="text-sky-600 font-bold flex items-center gap-1"><Unlock size={12}/> 權限已解鎖</span> : <span className="flex items-center gap-1"><Lock size={12}/> 訪客模式</span>}
            </div>
            {/* 資料庫連線狀態指示 */}
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3 sm:pl-4">
              {user ? (
                <span className="text-emerald-500 font-bold flex items-center gap-1.5 tracking-widest"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> 雲端連線</span>
              ) : (
                <span className="text-amber-500 font-bold flex items-center gap-1.5 tracking-widest"><Loader2 size={12} className="animate-spin" /> 連線中...</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 w-full sm:w-auto">
            {view !== 'home' && <button onClick={() => setView('home')} className="hover:text-sky-600 transition flex items-center gap-1"><Home size={12}/> 返回首頁</button>}
            <button onClick={() => requireAdmin(() => setView('manage'))} className="hover:text-sky-600 transition flex items-center gap-1"><Database size={12}/> 雲端詩歌庫</button>
          </div>
        </div>
      )}

      {/* Main Views */}
      {view === 'home' && (
        <div className="pb-20">
          <ConfirmModal isOpen={deleteSetlistConfirmId !== null} title="確定刪除？" onCancel={() => setDeleteSetlistConfirmId(null)} onConfirm={() => executeDeleteSetlist(deleteSetlistConfirmId)} />
          <div className="max-w-6xl mx-auto p-4 sm:p-8 relative pt-6 sm:pt-4 text-center">
            <header className="mb-10 sm:mb-12 border-b border-slate-200 pb-6 sm:pb-8 flex flex-col items-center">
              <ICCLogo className="mb-4 sm:mb-6" />
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4 px-2">
                <BookOpen size={24} className="text-[#C4A977] hidden sm:block"/>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-[0.05em] sm:tracking-[0.08em] text-slate-900 uppercase">ICC Worship Corner</h1>
                <Music size={24} className="text-[#C4A977] hidden sm:block"/>
              </div>
              <p className="text-slate-500 font-medium mb-4 sm:mb-6 flex items-center justify-center gap-2 text-sm sm:text-base">
                <Sparkles size={16} className="text-sky-400"/>
                用心靈和誠實敬拜
                <Sparkles size={16} className="text-sky-400"/>
              </p>
            </header>

            <div className="flex flex-col md:flex-row justify-between items-center mb-6 sm:mb-8 gap-4 text-left">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 font-serif text-slate-900"><CalendarDays size={24} className="text-sky-500"/> 近期歌單總覽</h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <input type="text" placeholder="搜尋日期、主領或歌名..." className="w-full sm:w-[350px] pl-4 pr-4 py-2.5 border rounded-xl bg-white focus:border-sky-500 shadow-sm outline-none transition text-sm sm:text-base" value={homeSearchQuery} onChange={e => setHomeSearchQuery(e.target.value)} />
                <button onClick={() => requireAdmin(createNewSetlist)} className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2.5 rounded-xl shadow-lg font-bold text-sm whitespace-nowrap transition w-full sm:w-auto flex justify-center items-center gap-1">+ 預備歌單</button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm divide-y divide-slate-100 text-left flex flex-col">
              {filteredHomeSetlists.length > 0 ? filteredHomeSetlists.map(item => {
                const parts = item.date ? item.date.split('-') : [];
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
                        <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><User size={14} className="text-sky-500"/> {item.wl || '未指定主領'}</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-400 italic">更新: {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '-'}</div>
                      </div>
                    </div>
                    
                    <div className="flex-1 w-full mt-2 sm:mt-0">
                      <div className="flex flex-wrap gap-2">
                        {item.songs?.map((s, i) => (
                          <span key={i} className="inline-flex items-center text-[12px] sm:text-[13px] font-medium text-slate-700 bg-white border border-slate-200 px-2.5 sm:px-3 py-1.5 rounded-full shadow-sm group-hover:border-sky-200 transition">
                            <span className="text-sky-500 font-bold mr-1.5 opacity-80">{i+1}.</span> <span className="truncate max-w-[150px] sm:max-w-none">{s.title}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-4 sm:pt-0 mt-2 sm:mt-0 border-t sm:border-0 border-slate-50">
                      <button onClick={() => openPreviewFromHome(item)} className="flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-2.5 bg-sky-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md hover:bg-sky-600 transition flex justify-center items-center gap-2"><Eye size={16}/> 預覽</button>
                      <button onClick={() => requireAdmin(() => openSetlist(item))} className="p-2 sm:p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:text-sky-600 hover:border-sky-300 transition shadow-sm" title="編輯"><Edit2 size={16}/></button>
                      <button onClick={() => requireAdmin(() => setDeleteSetlistConfirmId(item.id))} className="p-2 sm:p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition shadow-sm" title="刪除"><Trash2 size={16}/></button>
                    </div>
                  </div>
                );
              }) : (
                <div className="p-16 sm:p-20 text-center text-slate-400">
                  <ListMusic size={40} className="mx-auto mb-4 opacity-20" />
                  <p className="text-sm">查無歌單紀錄。</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {view === 'list' && (
        <div className="pb-20 max-w-4xl mx-auto p-4 sm:p-8 pt-4 sm:pt-6 w-full">
          <header className="mb-6 sm:mb-10 text-center flex flex-col items-center border-b border-slate-200 pb-4 sm:pb-6"><ICCLogo className="mb-4 sm:mb-5 scale-90" /><h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mb-2 uppercase">{currentSetlistId ? '編輯歌單' : '建立新歌單'}</h1></header>
          <div className="flex flex-col sm:flex-row justify-end mb-6 gap-3">
            <button onClick={saveCurrentSetlist} disabled={isSavingSetlist} className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-serif text-sm transition shadow-sm flex items-center justify-center gap-2 ${saveSuccess ? 'bg-green-600 text-white' : 'bg-white border border-sky-500 text-sky-600 hover:bg-sky-50'}`}><Save size={18}/> {isSavingSetlist ? '儲存中...' : (saveSuccess ? '已成功儲存！' : '儲存歌單')}</button>
            <button onClick={openPreviewFromList} className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-serif text-sm bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center gap-2 shadow-lg transition"><Eye size={18}/> 預覽與輸出</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
            <div className="md:col-span-4 bg-white p-5 sm:p-6 border rounded-2xl h-fit shadow-sm">
              <h2 className="text-xs sm:text-sm font-bold tracking-widest text-slate-900 border-b pb-3 mb-5 sm:mb-6 uppercase">Information</h2>
              <div className="space-y-4">
                <div><label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-widest">日期</label><input type="date" value={meta.date} onChange={e => setMeta({...meta, date: e.target.value})} className="w-full px-3 py-2 border-b-2 bg-transparent focus:border-sky-500 outline-none transition text-sm sm:text-base" /></div>
                <div><label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-widest">主領</label><input type="text" value={meta.wl} onChange={e => setMeta({...meta, wl: e.target.value})} className="w-full px-3 py-2 border-b-2 bg-transparent focus:border-sky-500 outline-none transition text-sm sm:text-base" placeholder="例如：Rudy" /></div>
              </div>
            </div>
            <div className="md:col-span-8 space-y-4">
              <div className="flex justify-between items-end border-b pb-3"><h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest">Setlist</h2><button onClick={() => openEditor()} className="text-xs font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition">+ 新增詩歌</button></div>
              <div className="space-y-3">
                {setlist.map((item, index) => (
                  <div key={item.id} className="bg-white border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between group shadow-sm transition hover:border-sky-200 gap-3">
                    <div className="flex-1 w-full overflow-hidden">
                      <div className="flex items-center gap-2 sm:gap-3 mb-1">
                        <span className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold shrink-0">0{index + 1}</span>
                        <h3 className="font-bold font-serif text-base sm:text-lg truncate">{item.title} <span className="font-sans font-normal text-slate-400 text-xs sm:text-sm">({item.key})</span></h3>
                      </div>
                      <div className="text-[11px] sm:text-[13px] text-blue-600 font-mono pl-8 sm:pl-9 font-bold tracking-wider overflow-x-auto custom-scrollbar pb-1">
                        {item.mapString || '未設定段落'}
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-1.5 sm:gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-slate-50 w-full sm:w-auto">
                      <div className="flex flex-row sm:flex-col gap-1 sm:gap-0.5 mr-auto sm:mr-0">
                        <button onClick={() => moveItem(index, 'up')} className="p-1.5 sm:p-1 text-slate-400 hover:text-sky-600 transition bg-slate-50 sm:bg-transparent rounded sm:rounded-none"><ArrowUp size={14}/></button>
                        <button onClick={() => moveItem(index, 'down')} className="p-1.5 sm:p-1 text-slate-400 hover:text-sky-600 transition bg-slate-50 sm:bg-transparent rounded sm:rounded-none"><ArrowDown size={14}/></button>
                      </div>
                      <button onClick={() => openEditor(item)} className="p-2 sm:p-2 text-slate-500 hover:text-sky-600 transition bg-slate-50 sm:bg-transparent rounded-lg"><Edit2 size={16}/></button>
                      <button onClick={() => deleteItem(item.id)} className="p-2 sm:p-2 text-slate-400 hover:text-red-600 transition bg-slate-50 sm:bg-transparent rounded-lg"><Trash2 size={16}/></button>
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
          <header className="mb-6 sm:mb-8 border-b pb-4 sm:pb-6 flex justify-between items-center"><button onClick={() => setView('list')} className="flex items-center gap-1 sm:gap-2 font-medium text-slate-500 hover:text-slate-900 transition text-sm sm:text-base"><ChevronLeft size={18}/> 返回歌單</button><div className="font-serif tracking-widest text-xs sm:text-sm uppercase font-bold text-slate-700">{editingItem ? '編輯歌曲' : '新增歌曲'}</div></header>
          <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 sm:p-8 bg-[#FAFAFA] border-b">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
                <div className="md:col-span-3 relative" ref={searchRef}>
                  <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 block mb-1.5 sm:mb-2 uppercase tracking-widest">由雲端資料庫搜尋或新增</label>
                  <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 sm:h-5 sm:w-5" /><input type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }} className="w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 border-b-2 bg-transparent focus:border-sky-500 outline-none font-serif text-base sm:text-lg transition" placeholder="輸入歌名搜尋..." /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-3 sm:mt-4">
                    <button onClick={() => requireAdmin(() => setShowComingSoonModal(true))} className="py-2 sm:py-2.5 px-3 sm:px-4 bg-gradient-to-r from-sky-50 to-transparent border border-sky-100 hover:border-sky-300 rounded-xl text-xs sm:text-[13px] text-slate-700 font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition shadow-sm hover:shadow">
                      <Sparkles size={14} className="text-sky-500"/> 找不到？AI 智能抓取
                    </button>
                    <button onClick={() => requireAdmin(() => openManualEntry(null, '', 'editor'))} className="py-2 sm:py-2.5 px-3 sm:px-4 bg-white border border-slate-200 hover:border-sky-500 rounded-xl text-xs sm:text-[13px] text-slate-700 font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition shadow-sm hover:shadow">
                      <Edit2 size={14} className="text-slate-400"/> 手動建立新詩歌
                    </button>
                  </div>
                  {showDropdown && searchQuery && currentSong && (
                    <ul className="absolute z-20 mt-2 w-full bg-white shadow-2xl border rounded-2xl max-h-64 overflow-auto border-slate-100">
                      {searchResults.length > 0 ? searchResults.map(s => (<li key={s.id} onClick={() => handleSelectSong(s)} className="p-3 sm:p-4 border-b last:border-0 border-slate-50 flex justify-between cursor-pointer hover:bg-slate-50 group transition"><span className="font-serif font-bold text-slate-800 group-hover:text-sky-600 text-sm sm:text-base">{s.title}</span><span className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-widest group-hover:text-sky-500">{s.artist}</span></li>)) : <li className="p-8 sm:p-10 text-center bg-slate-50"><p className="mb-2 text-xs sm:text-sm text-slate-500 font-bold">雲端資料庫查無此歌 🥺</p><p className="text-[10px] sm:text-xs text-slate-400 mb-2">請點擊上方按鈕使用 AI 或手動新增</p></li>}
                    </ul>
                  )}
                </div>
                <div className="md:col-span-1"><label className="text-[10px] sm:text-[11px] font-bold text-slate-400 block mb-1.5 sm:mb-2 uppercase tracking-widest">調性 (Key)</label><select value={currentKey} onChange={e => setCurrentKey(e.target.value)} className="w-full px-2 sm:px-3 py-2.5 sm:py-3 border-b-2 bg-transparent focus:border-sky-500 font-sans text-sm sm:text-base transition outline-none">{KEYS.map(k => <option key={k} value={k}>{k}</option>)}</select></div>
              </div>
            </div>
            
            {currentSong ? (
              <div className="p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 bg-white">
                <div className="order-2 lg:order-1">
                  <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
                    <a href={currentSong.youtubeId ? `https://youtu.be/${currentSong.youtubeId}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(currentSong.title)}`} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2 sm:py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition hover:bg-red-100"><Youtube size={16}/> YouTube 聆聽</a>
                    <button onClick={() => requireAdmin(() => openManualEntry(currentSong, '', 'editor'))} className="flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition hover:bg-slate-100 text-slate-700"><Database size={16} className="text-sky-500"/> 編輯詩歌檔案</button>
                  </div>
                  <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-400 mb-3 sm:mb-4 border-b pb-2 uppercase tracking-widest">歌詞預覽</h3>
                  <div className="space-y-4 sm:space-y-6 max-h-[350px] sm:max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                    {currentSong.lyrics?.map((s, i) => (<div key={i} className="mb-3 sm:mb-4"><span onClick={() => handleAppendTag(s.section)} title={TAG_EXPLANATIONS[s.section]} className="inline-block px-1.5 sm:px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[9px] sm:text-[10px] font-bold rounded shadow-sm cursor-pointer hover:bg-sky-500 hover:text-white transition mb-1.5 sm:mb-2">{s.section}</span><p className="text-xs sm:text-[14px] text-slate-700 leading-relaxed whitespace-pre-wrap">{s.text}</p></div>))}
                  </div>
                </div>
                <div className="bg-[#FAFAFA] p-5 sm:p-6 border rounded-2xl shadow-sm h-fit order-1 lg:order-2">
                  <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-400 mb-3 sm:mb-4 border-b pb-2 uppercase tracking-widest">建立段落 (Map Builder)</h3>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-5 sm:mb-6">{SONG_MAP_TAGS.map(tag => { const isAvail = STRUCTURAL_TAGS.includes(tag) || currentSong.lyrics?.some(l => l.section === tag); return (<button key={tag} onClick={() => isAvail && handleAppendTag(tag)} disabled={!isAvail} title={TAG_EXPLANATIONS[tag]} className={`px-2.5 sm:px-3 py-1 sm:py-1.5 font-mono text-xs sm:text-sm border rounded-lg transition ${isAvail ? 'bg-white text-slate-700 hover:border-sky-500 shadow-sm cursor-pointer' : 'bg-slate-50 text-slate-300 cursor-not-allowed opacity-60'}`}>{tag}</button>); })}</div>
                  <div className="mb-6 sm:mb-8"><label className="text-[10px] sm:text-[11px] font-bold text-slate-400 block mb-1.5 sm:mb-2 uppercase tracking-widest">編輯字串 (Map String)</label><textarea value={currentMap} onChange={e => setCurrentMap(e.target.value)} rows={3} className="w-full border rounded-xl p-3 sm:p-4 bg-white font-mono shadow-sm outline-none focus:border-sky-500 transition text-blue-600 font-bold text-sm sm:text-base" placeholder="例如：I-V1-C-V2-C-B-C-E" /></div>
                  <button onClick={saveToSetlist} disabled={!currentMap.trim()} className="w-full py-3 sm:py-4 bg-sky-500 hover:bg-sky-600 text-white font-serif rounded-xl shadow-lg transition active:scale-[0.98] disabled:opacity-50 text-sm sm:text-base">確認加入歌單</button>
                </div>
              </div>
            ) : (
              <div className="p-5 sm:p-8 bg-slate-50/50">
                <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-400 mb-3 sm:mb-4 border-b pb-2 uppercase tracking-widest flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
                  <span>{searchQuery ? '搜尋結果' : '瀏覽雲端詩歌庫 (全庫)'}</span>
                  {!searchQuery && <span className="text-[9px] font-normal flex items-center gap-1 text-slate-400 bg-white border border-slate-200 shadow-sm px-2 py-0.5 rounded-full"><Crown size={10} className="text-orange-400"/> 依近3個月熱度排序</span>}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-2 custom-scrollbar pb-4">
                  {displaySongs.map((s, index) => (
                    <div key={s.id} onClick={() => handleSelectSong(s)} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 cursor-pointer hover:border-sky-400 hover:shadow-lg transition-all group flex flex-col justify-between relative overflow-hidden">
                      
                      {s.stats.count3Months > 0 && index < 3 && !searchQuery && (
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-400 to-red-500 text-white text-[8px] sm:text-[9px] font-bold px-2.5 sm:px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1">
                          <Crown size={10} /> 推薦熱門
                        </div>
                      )}

                      <div>
                        <h4 className="font-serif font-bold text-slate-800 text-[15px] sm:text-[17px] group-hover:text-sky-600 mb-1 leading-tight pr-12 sm:pr-14 truncate">{s.title}</h4>
                        <p className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-widest mb-3 sm:mb-4 truncate">{s.artist || '未知歌手'}</p>
                      </div>
                      
                      <div className="flex flex-col gap-2 sm:gap-2.5 mt-1">
                        <div className="flex flex-wrap gap-1.5">
                          {s.stats.count3Months > 0 ? (
                            <span className="bg-red-50 text-red-600 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-1 rounded-md font-bold border border-red-100 flex items-center gap-1">
                              🔥 近三月: {s.stats.count3Months} 次
                            </span>
                          ) : (
                            <span className="bg-slate-50 text-slate-400 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-1 rounded-md font-medium border border-slate-100 flex items-center gap-1">
                              ❄️ 近期未唱
                            </span>
                          )}
                          {s.stats.weeksAgo !== null && (
                            <span className="bg-sky-50 text-sky-600 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-1 rounded-md font-bold border border-sky-100 flex items-center gap-1">
                              🕒 {s.stats.weeksAgo === 0 ? '本週剛唱' : `${s.stats.weeksAgo} 週前`}
                            </span>
                          )}
                        </div>

                        <div className="flex justify-between items-end pt-2 sm:pt-3 border-t border-slate-50 mt-1">
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 flex items-center gap-1"><Music size={12}/> {s.lyrics?.length || 0} 段落</span>
                          <span className="font-mono text-[10px] sm:text-xs font-bold text-sky-600 bg-sky-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg border border-sky-100">{s.defaultKey || 'C'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {displaySongs.length === 0 && (
                    <div className="col-span-full py-12 sm:py-16 text-center bg-white border border-slate-100 rounded-xl shadow-sm">
                      <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🥺</div>
                      <p className="mb-1 text-xs sm:text-sm text-slate-600 font-bold">雲端資料庫查無此歌</p>
                      <p className="text-[10px] sm:text-xs text-slate-400">請點擊上方按鈕使用手動新增</p>
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
          <header className="mb-6 sm:mb-8 border-b pb-4 sm:pb-6 flex justify-between items-center"><button onClick={() => setView(manualSource)} className="flex items-center gap-1 sm:gap-2 text-slate-500 transition hover:text-slate-900 font-medium text-sm sm:text-base"><ChevronLeft size={18}/> 返回</button><div className="font-serif tracking-widest font-bold uppercase text-slate-700 text-xs sm:text-sm">詩歌編輯器</div></header>
          <div className="bg-white border rounded-2xl p-5 sm:p-8 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 mb-6 sm:mb-8 flex items-center gap-2">{editingDbSongId ? '編輯詩歌檔案' : '新增詩歌資料庫'}</h2>
            
            {saveError && (
              <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs sm:text-sm font-bold flex items-center gap-2">
                <X size={16} className="shrink-0"/> {saveError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-8 mb-6 sm:mb-8">
              <div><label className="text-[10px] sm:text-[11px] font-bold text-slate-400 block mb-1 uppercase tracking-widest">歌名 *</label><input type="text" value={customTitle} onChange={e => setCustomTitle(e.target.value)} className="w-full border-b-2 bg-transparent focus:border-sky-500 p-2 font-serif text-base sm:text-lg outline-none transition" /></div>
              <div><label className="text-[10px] sm:text-[11px] font-bold text-slate-400 block mb-1 uppercase tracking-widest">歌手 / 出處</label><input type="text" value={customArtist} onChange={e => setCustomArtist(e.target.value)} className="w-full border-b-2 bg-transparent focus:border-sky-500 p-2 outline-none transition text-sm sm:text-base" /></div>
              <div><label className="text-[10px] sm:text-[11px] font-bold text-slate-400 block mb-1 uppercase tracking-widest">預設調性</label><select value={customKey} onChange={e => setCustomKey(e.target.value)} className="w-full border-b-2 bg-transparent p-2 transition outline-none focus:border-sky-500 text-sm sm:text-base">{KEYS.map(k => <option key={k} value={k}>{k}</option>)}</select></div>
            </div>
            <div className="mb-8 sm:mb-10"><label className="text-[10px] sm:text-[11px] font-bold text-slate-400 flex items-center gap-1.5 mb-1 uppercase tracking-widest"><Youtube size={14} className="text-red-500"/> YouTube 連結或 ID (必填)</label><input type="text" value={customYoutubeUrl} onChange={e => setCustomYoutubeUrl(e.target.value)} className="w-full border-b-2 bg-transparent p-2 text-xs sm:text-sm outline-none transition focus:border-sky-500" placeholder="https://youtu.be/..." /></div>
            <div className="mb-8 sm:mb-10"><div className="flex justify-between items-end border-b pb-2 mb-6 sm:mb-8"><h3 className="text-[10px] sm:text-[11px] font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest">歌詞段落管理</h3></div><div className="space-y-4 sm:space-y-6">{customLyrics.map((l, i) => (<div key={i} className="flex flex-col sm:flex-row gap-3 sm:gap-5 items-start group transition hover:bg-slate-50/50 p-3 rounded-xl border border-transparent hover:border-slate-100"><div className="w-full sm:w-auto shrink-0 flex sm:block justify-between items-center"><select value={l.section} onChange={e => { const nl = [...customLyrics]; nl[i].section = e.target.value; setCustomLyrics(nl); }} className="w-20 sm:w-24 p-1.5 sm:p-2 border rounded-lg font-mono text-xs sm:text-sm shadow-sm bg-white focus:border-sky-500 outline-none">{SONG_MAP_TAGS.map(t => <option key={t} value={t}>{t}</option>)}</select><div className="text-[9px] text-slate-400 mt-1 font-mono hidden sm:block text-center">{TAG_EXPLANATIONS[l.section]?.split(' ')[0]}</div><button onClick={() => { const nl = [...customLyrics]; nl.splice(i, 1); setCustomLyrics(nl); }} className="sm:hidden p-1.5 text-slate-300 hover:text-red-600 transition bg-white border rounded shadow-sm"><Trash2 size={16}/></button></div><textarea value={l.text} onChange={e => { const nl = [...customLyrics]; nl[i].text = e.target.value; setCustomLyrics(nl); }} rows={3} className="w-full flex-1 p-3 sm:p-4 border rounded-xl font-sans text-sm shadow-sm outline-none focus:border-sky-500 transition" placeholder="在此貼上歌詞內容..." /><button onClick={() => { const nl = [...customLyrics]; nl.splice(i, 1); setCustomLyrics(nl); }} className="hidden sm:block p-2 text-slate-200 hover:text-red-600 transition self-center"><Trash2 size={20}/></button></div>))}</div><button onClick={() => setCustomLyrics([...customLyrics, { section: 'V', text: '' }])} className="mt-6 sm:mt-8 flex items-center gap-1.5 text-xs font-bold uppercase text-sky-600 transition hover:text-sky-500 bg-sky-50 px-4 py-2 rounded-lg w-fit">+ 新增段落</button></div>
            <div className="flex justify-end pt-6 sm:pt-8 border-t"><button onClick={handleSaveCustomSong} disabled={!customTitle.trim() || isSaving} className="w-full sm:w-auto px-8 sm:px-12 py-3.5 sm:py-4 bg-sky-500 hover:bg-sky-600 text-white font-serif rounded-xl shadow-xl transition active:scale-95 disabled:opacity-30 tracking-widest font-bold text-sm sm:text-base">{isSaving ? '儲存中...' : (editingDbSongId ? '確認儲存更新' : '確認儲存至雲端資料庫')}</button></div>
          </div>
        </div>
      )}

      {view === 'manage' && (
        <div className="pb-20 max-w-6xl mx-auto p-4 sm:p-8 pt-4 w-full">
          <ConfirmModal isOpen={deleteConfirmId !== null} title="永久刪除？" message="此動作將移除雲端檔案，無法復原。" onCancel={() => setDeleteConfirmId(null)} onConfirm={() => executeDeleteDbSong(deleteConfirmId)} />
          <header className="mb-6 sm:mb-8 border-b pb-4 sm:pb-6 flex justify-between items-center"><button onClick={() => setView('home')} className="flex items-center gap-1 sm:gap-2 text-slate-500 hover:text-slate-900 transition font-medium text-sm sm:text-base"><ChevronLeft size={18}/> 返回</button><div className="font-serif tracking-widest text-slate-900 uppercase font-bold flex items-center gap-1 sm:gap-2 text-xs sm:text-base"><Database size={16} className="text-sky-500 hidden sm:block" /> 詩歌庫管理</div></header>
          <div className="bg-white border p-4 sm:p-6 rounded-2xl mb-6 sm:mb-8 flex flex-col md:flex-row gap-3 sm:gap-4 shadow-sm items-center">
            <div className="relative flex-1 w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4"/><input type="text" value={librarySearch} onChange={e => setLibrarySearch(e.target.value)} className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 border rounded-xl bg-slate-50 focus:bg-white focus:ring-1 focus:ring-sky-500 outline-none transition text-sm sm:text-base" placeholder="搜尋雲端詩歌檔案..." /></div>
            <div className="flex gap-2 w-full md:w-auto relative" ref={addDropdownRef}>
              <button onClick={() => requireAdmin(() => setShowAddDropdown(!showAddDropdown))} className="w-full md:w-auto justify-center bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition flex items-center gap-2">
                <Plus size={16}/> 新增詩歌
              </button>
              {showAddDropdown && (
                <div className="absolute top-full right-0 mt-2 w-full sm:w-48 bg-white border border-slate-100 shadow-xl rounded-xl overflow-hidden z-20 flex flex-col">
                  <button onClick={() => { setShowAddDropdown(false); requireAdmin(() => setShowComingSoonModal(true)); }} className="text-left px-4 py-3 text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-700 transition border-b border-slate-50"><Sparkles size={14} className="text-sky-500"/> AI 歌詞抓取</button>
                  <button onClick={() => { setShowAddDropdown(false); requireAdmin(() => openManualEntry(null, '', 'manage')); }} className="text-left px-4 py-3 text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-700 transition"><Edit2 size={14} className="text-slate-400"/> 手動新增檔案</button>
                </div>
              )}
            </div>
          </div>
          <div className="bg-white border rounded-2xl shadow-sm overflow-hidden overflow-x-auto w-full">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 border-b text-slate-500 text-[9px] sm:text-[10px] uppercase tracking-widest font-bold">
                  <th className="p-3 sm:p-4">歌名 (Song Title)</th>
                  <th className="p-3 sm:p-4">歌手 / 出處</th>
                  <th className="p-3 sm:p-4">近期熱度</th>
                  <th className="p-3 sm:p-4">預設調性</th>
                  <th className="p-3 sm:p-4 text-right">管理操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {libraryDisplaySongs.map((s, index) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition group">
                    <td className="p-3 sm:p-4">
                      <div className="flex flex-col items-start gap-1">
                        {s.stats.count3Months > 0 && index < 3 && !librarySearch && (
                          <span className="bg-gradient-to-r from-orange-400 to-red-500 text-white text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 w-fit font-bold">
                            <Crown size={10} /> 推薦熱門
                          </span>
                        )}
                        <span className="font-serif font-bold text-slate-800 text-sm sm:text-lg group-hover:text-sky-600 whitespace-nowrap sm:whitespace-normal">{s.title}</span>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 text-xs sm:text-sm text-slate-500">{s.artist || '-'}</td>
                    <td className="p-3 sm:p-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        {s.stats.count3Months > 0 ? (
                          <span className="bg-red-50 text-red-600 text-[9px] sm:text-[10px] px-2 py-1 rounded-md font-bold border border-red-100 flex items-center gap-1 w-fit whitespace-nowrap">
                            🔥 近三月: {s.stats.count3Months} 次
                          </span>
                        ) : (
                          <span className="bg-slate-50 text-slate-400 text-[9px] sm:text-[10px] px-2 py-1 rounded-md font-medium border border-slate-100 flex items-center gap-1 w-fit whitespace-nowrap">
                            ❄️ 近期未唱
                          </span>
                        )}
                        {s.stats.weeksAgo !== null && (
                          <span className="bg-sky-50 text-sky-600 text-[9px] sm:text-[10px] px-2 py-1 rounded-md font-bold border border-sky-100 flex items-center gap-1 w-fit whitespace-nowrap">
                            🕒 {s.stats.weeksAgo === 0 ? '本週剛唱' : `${s.stats.weeksAgo} 週前`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 font-mono text-xs sm:text-sm text-slate-400">{s.defaultKey}</td>
                    <td className="p-3 sm:p-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => requireAdmin(() => openManualEntry(s, '', 'manage'))} className="p-2 sm:p-2.5 hover:bg-white rounded-lg text-slate-400 hover:text-sky-600 transition shadow-sm border border-transparent hover:border-slate-100"><Edit2 size={16}/></button>
                        <button onClick={() => requireAdmin(() => setDeleteConfirmId(s.id))} className="p-2 sm:p-2.5 hover:bg-white rounded-lg text-slate-300 hover:text-red-600 transition border border-transparent hover:border-red-50"><Trash2 size={16}/></button>
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
          <header className="bg-white/90 backdrop-blur-md border-b px-4 sm:px-6 py-3 sm:py-4 flex flex-row flex-wrap sm:flex-nowrap justify-between items-center sticky top-0 z-50 shadow-sm gap-2 sm:gap-0">
            <button onClick={() => setView(previewSource)} className="flex items-center gap-1 sm:gap-2 font-medium hover:text-slate-900 transition text-slate-500 text-xs sm:text-base"><ChevronLeft size={18}/> 返回</button>
            <span className="font-serif font-bold flex items-center gap-1.5 sm:gap-2 text-slate-800 text-sm sm:text-lg"><Eye size={16} className="text-[#C4A977]"/> 預覽與輸出</span>
            <button onClick={handleExportPDF} disabled={isGenerating} className="px-3 sm:px-6 py-1.5 sm:py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold shadow-lg transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5 text-xs sm:text-base">{isGenerating ? '產生中...' : '下載 PDF'} <Download size={14} className="sm:w-4 sm:h-4"/></button>
          </header>
          
          <main className="flex-1 overflow-auto p-2 sm:p-8 flex items-start justify-start md:justify-center pb-24 w-full custom-scrollbar">
            <div className="w-fit shrink-0">
              <div id="pdf-print-area" className="bg-white shadow-2xl relative overflow-hidden">
                <PrintLayoutContent meta={meta} setlist={setlist} />
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
            <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed mb-2 max-w-2xl px-2">
              本站收錄之詩歌歌詞僅供爾灣城市教會（Irvine City Church）家人內部敬拜、練習與靈修使用。<br className="hidden sm:block"/>所有歌曲與歌詞之版權均歸原創作者及發行機構所有，感謝這些美好的創作豐富了我們的敬拜。
            </p>
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
// PDF / Print Layout Content (重新設計的高質感版面)
// -----------------------------------------------------------------------------
const PrintLayoutContent = ({ meta, setlist }) => (
  <div className="bg-white text-slate-900 w-[816px] min-h-[1056px] mx-auto box-border p-[40px] flex flex-col font-sans shrink-0">
    
    {/* Modern Header - Smaller & Styled */}
    <div className="flex justify-between items-end border-b-[3px] border-slate-900 pb-3 mb-4 mt-0">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[26px] font-serif font-black tracking-widest text-slate-900 uppercase leading-none m-0">ICC Worship Song Map</h1>
        <div className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded shadow-sm w-fit">
          <CalendarDays size={12} className="text-sky-500" />
          <span className="text-[11px] font-bold tracking-[0.15em] font-mono leading-none pt-[1px]">
            {meta.date?.replace(/-/g, '/') || 'YYYY / MM / DD'}
          </span>
        </div>
      </div>
      <div className="text-right flex flex-col items-end gap-1">
        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Worship Leader</span>
        <span className="text-[15px] font-serif font-bold text-slate-800 leading-none">{meta.wl || '未指定'}</span>
      </div>
    </div>

    {/* Highlighted Song Map Section (優化壓縮為 Grid 排版) */}
    <div className="mb-5 bg-slate-50 rounded-lg p-3.5 border border-slate-200">
      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
        {setlist.map((item, idx) => (
          <div key={idx} className="flex gap-2 items-start">
            <div className="w-[18px] h-[18px] shrink-0 bg-slate-900 text-white rounded-[4px] flex items-center justify-center font-bold font-serif text-[9px] mt-[1px] shadow-sm">
              {idx + 1}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-bold text-[13px] font-serif leading-none truncate">{item.title}</span>
                <span className="text-[8px] font-mono font-bold text-sky-600 bg-sky-100/80 px-1 py-[1px] rounded leading-none shrink-0 border border-sky-200">{item.key}</span>
              </div>
              <div className="flex flex-wrap gap-0.5 items-center">
                {item.mapString ? item.mapString.split('-').map((tag, tIdx) => (
                  <div key={tIdx} className="flex items-center">
                    <span className="inline-flex items-center justify-center px-1.5 py-[2px] bg-white border border-slate-300 text-slate-600 text-[8px] font-bold font-mono rounded-[3px] shadow-sm">
                      {tag}
                    </span>
                    {tIdx < item.mapString.split('-').length - 1 && (
                      <span className="text-slate-300 mx-[2px] font-bold text-[7px]">→</span>
                    )}
                  </div>
                )) : <span className="text-[8px] text-slate-400 italic">尚未設定段落</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Lyrics Layout in Columns */}
    <div className="columns-2 gap-10 flex-1 pt-0">
      {setlist.map((item, idx) => (
        <div key={idx} className="mb-6 break-inside-avoid text-left" style={{ pageBreakInside: 'avoid' }}>
          <div className="flex items-center gap-2 mb-2.5 border-b border-slate-100 pb-1">
            <span className="text-slate-300 font-black text-[22px] font-serif leading-none">{idx + 1}.</span>
            <h2 className="text-[15px] font-bold font-serif tracking-wide text-slate-900 leading-none pt-1">{item.title}</h2>
          </div>
          <div className="space-y-3.5">
            {item.lyrics?.map((s, si) => (
              <div key={si} className="pl-2.5 border-l-[3px] border-sky-300">
                <div className="font-bold text-sky-600 text-[9px] mb-1 tracking-widest uppercase">{TAG_EXPLANATIONS[s.section]?.split(' ')[0] || s.section} ({s.section})</div>
                <div className="whitespace-pre-wrap text-[12px] text-slate-800 leading-[1.5] font-sans">{s.text}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>

    {/* Footer */}
    <div className="mt-4 pt-3 border-t-2 border-slate-900 flex justify-between items-center">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Irvine City Church</span>
        <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] font-serif">用心靈和誠實敬拜</span>
    </div>
  </div>
);