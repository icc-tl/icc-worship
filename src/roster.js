// 主日服事表（Google Sheet）→ 當週服事同工名單
//
// 這份表不是我們的：擁有者可能改欄位、換分頁、關掉共用。
// 所以這裡的每一條路徑失敗都是「安靜回傳 null」，讓畫面退回手動輸入，
// 絕不丟錯誤打斷主領做歌單。

const SPREADSHEET_ID = '10c_wxS-WybfjJ4QQigkMTihGlKl_1yxnDL0kk6GcFhc';

// 每一年是一個新分頁。已知的先試，沒有的年份會自動去找（見 candidateGids）。
const KNOWN_GIDS = { 2026: '1425208194' };

const FETCH_TIMEOUT_MS = 8000;

export const ROSTER_ROLES = [
  { key: 'wl', label: '主領' },
  { key: 'vocals', label: '和聲' },
  { key: 'keys', label: '鍵盤' },
  { key: 'drums', label: '鼓' },
  { key: 'bass', label: '貝斯' },
  { key: 'sound', label: '音控' },
  { key: 'projection', label: '投影' },
];

// --- CSV ---------------------------------------------------------------

// Google 匯出的 CSV 會有引號包住的逗號（"Fifi, Peggy"）與換行，不能用 split(',')
const parseCsv = (text) => {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; }
        else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') { quoted = true; continue; }
    if (c === ',') { row.push(field); field = ''; continue; }
    if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field); rows.push(row); row = []; field = '';
      continue;
    }
    field += c;
  }
  row.push(field);
  if (row.length > 1 || row[0] !== '') rows.push(row);
  return rows;
};

// --- 欄位與人名 ---------------------------------------------------------

const findColumns = (header) => {
  const norm = header.map(h => String(h || '').trim().toLowerCase());
  const at = (pred) => norm.reduce((acc, h, i) => (pred(h) ? [...acc, i] : acc), []);
  return {
    wl: at(h => h === 'worship leader'),
    vocals: at(h => h.startsWith('vocal')),
    keys: at(h => h.startsWith('keyboard')),
    drums: at(h => h.startsWith('drum')),
    bass: at(h => h.startsWith('bass')),
    sound: at(h => h.startsWith('sound')),
    projection: at(h => h.replace(/\s+/g, '') === 'propresenter'),
  };
};

// 表上用來表示「這格沒人」的寫法，不是人名
const isPlaceholder = (name) => /^(-+|—|–|n\/?a|na|tbd|tba|\?+|x)$/i.test(name);

// 「Jovy / Rudy」「Sean/Rudy(2)」「Howard / Rudy (Bilingual)」→ ['Jovy', 'Rudy']
// 括號註記（雙語、第幾堂）不是人名，去掉；原始文字另外留著，不會弄丟資訊。
const splitNames = (cell) => String(cell || '')
  .split(/[/,、]/)
  .map(s => s.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim())
  .filter(s => s && !isPlaceholder(s));

const collect = (row, cols) => {
  const seen = new Set();
  const out = [];
  cols.forEach(ci => {
    if (ci >= row.length) return;
    splitNames(row[ci]).forEach(n => {
      const dedupeKey = n.toLowerCase();
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);
      out.push(n);
    });
  });
  return out;
};

// --- 日期 ---------------------------------------------------------------

const parseDate = (raw) => {
  const m = String(raw || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  const month = +m[1], day = +m[2];
  let year = +m[3];
  if (year < 100) year += 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
};

const iso = ({ year, month, day }) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

// --- 解析整張表 ---------------------------------------------------------

const parseTable = (csvText) => {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return null;

  const cols = findColumns(rows[0]);
  if (cols.wl.length === 0) return null;   // 不是服事表，可能抓到別的分頁

  const parsed = rows.slice(1)
    .map(row => ({ row, date: parseDate(row[0]) }))
    .filter(x => x.date);

  // 年份打錯的列（例如 2/22/0206）用這張表最常見的年份補回去，不要整列丟掉
  const tally = {};
  parsed.forEach(({ date }) => {
    if (date.year >= 1900) tally[date.year] = (tally[date.year] || 0) + 1;
  });
  const modalYear = Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0];

  const byDate = new Map();
  const years = new Set();
  parsed.forEach(({ row, date }) => {
    const year = date.year >= 1900 ? date.year : Number(modalYear);
    if (!year) return;
    const key = iso({ ...date, year });
    years.add(year);
    if (byDate.has(key)) return;           // 同一天重複出現時，以第一列為準
    byDate.set(key, {
      wl: collect(row, cols.wl),
      vocals: collect(row, cols.vocals),
      keys: collect(row, cols.keys),
      drums: collect(row, cols.drums),
      bass: collect(row, cols.bass),
      sound: collect(row, cols.sound),
      projection: collect(row, cols.projection),
      raw: cols.wl.map(ci => row[ci]).join(' ').trim(),
    });
  });

  return { byDate, years };
};

// --- 抓取 ---------------------------------------------------------------

const fetchText = async (url) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

const tableCache = new Map();   // gid -> parsed table（一次瀏覽期間不重抓）

const loadTable = async (gid) => {
  if (tableCache.has(gid)) return tableCache.get(gid);
  const csv = await fetchText(
    `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`
  );
  const table = csv ? parseTable(csv) : null;
  tableCache.set(gid, table);
  return table;
};

const rememberGid = (year, gid) => {
  try { localStorage.setItem(`iccRosterGid:${year}`, gid); } catch { /* 無痕模式 */ }
};

const recallGid = (year) => {
  try { return localStorage.getItem(`iccRosterGid:${year}`); } catch { return null; }
};

// 分頁順序：記住的 → 寫死的 → 從試算表頁面上找出來的其它分頁。
// 最後一步讓明年開了新分頁也不必改程式。
const candidateGids = async (year) => {
  const out = [];
  const push = (g) => { if (g && !out.includes(g)) out.push(g); };
  push(recallGid(year));
  push(KNOWN_GIDS[year]);
  Object.values(KNOWN_GIDS).forEach(push);

  const html = await fetchText(`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/htmlview`);
  if (html) [...html.matchAll(/gid=(\d+)/g)].forEach(m => push(m[1]));
  return out;
};

/**
 * 查某一天的服事名單。
 * @param {string} dateStr 'YYYY-MM-DD'
 * @returns {Promise<object|null>} 找不到、抓不到、格式不對時一律回傳 null
 */
export const lookupRoster = async (dateStr) => {
  const year = Number(String(dateStr || '').slice(0, 4));
  if (!year) return null;

  // 先試記得的與寫死的分頁，命中就不用去掃整份試算表
  const quick = [recallGid(year), KNOWN_GIDS[year]].filter(Boolean);
  for (const gid of quick) {
    const table = await loadTable(gid);
    if (table?.byDate.has(dateStr)) { rememberGid(year, gid); return table.byDate.get(dateStr); }
  }

  for (const gid of await candidateGids(year)) {
    const table = await loadTable(gid);
    if (!table) continue;
    if (table.byDate.has(dateStr)) { rememberGid(year, gid); return table.byDate.get(dateStr); }
    // 這個分頁就是該年度的表，只是那一天還沒排 → 不必再找別的分頁
    if (table.years.has(year)) { rememberGid(year, gid); return null; }
  }
  return null;
};

// 名單是不是空的（每個角色都沒人）
export const isRosterEmpty = (team) =>
  !team || ROSTER_ROLES.every(r => !(team[r.key] || []).length);

// 顯示用：'Johnny / Zoe / Alex'
export const formatNames = (names) => (names || []).join(' / ');

// 手動輸入時用的解析：只切開分隔符，不像讀表那樣清掉括號與佔位符 ——
// 主領想寫什麼就是什麼，不要自作聰明。
export const parseNameList = (text) => String(text || '')
  .split(/[/,、]/)
  .map(x => x.replace(/\s+/g, ' ').trim())
  .filter(Boolean);
