#!/usr/bin/env python3
"""把掃描到的檔案組成「樂譜」，並與線上歌庫配對，輸出 match.json 供審查。"""
import json, re, sys, unicodedata
from pathlib import Path
from collections import defaultdict
sys.path.insert(0, str(Path(__file__).parent))
from scan import norm_title            # 沿用同一套正規化，確保兩邊一致

HERE = Path(__file__).parent
files = json.load(open(HERE / 'scan.json'))['files']
songs = json.load(open(HERE / 'songs.json'))

# ---- 1. 把檔案組成樂譜：同歌名 + 同調性 + 同註記 = 一份譜（多頁合併）--------
sheets = defaultdict(list)
for f in files:
    sheets[(f['norm'], f['key'] or '', f['label'] or '')].append(f)

grouped = []
for (norm, key, label), items in sheets.items():
    items.sort(key=lambda x: (x['page'] or 1, x['path']))
    grouped.append({
        'norm': norm,
        'title': max((i['title'] for i in items), key=len),
        'key': key or None,
        'label': label or None,
        'pages': [i['path'] for i in items],
        'kinds': sorted({i['kind'] for i in items}),
        'bytes': sum(i['size'] for i in items),
    })
grouped.sort(key=lambda g: (g['title'], g['key'] or ''))

# ---- 2. 與歌庫配對 ----------------------------------------------------------
by_norm = defaultdict(list)
for s in songs:
    by_norm[norm_title(s['title'])].append(s)

import difflib

def _latin_ratio(t):
    letters = [c for c in t if not c.isspace()]
    if not letters: return 0.0
    return sum(1 for c in letters if ord(c) < 0x2E80) / len(letters)

def _sub_conf(short, long_):
    """判斷包含式配對的可信度。
    多出來的部分若主要是英文 -> 雙語標題，可信；
    若是中文且差很多 -> 很可能是不同的歌（如 在這裡 vs 君王就在這裡）。"""
    extra = long_.replace(short, '', 1)
    diff = len(long_) - len(short)
    if _latin_ratio(extra) > 0.7:
        return 'high'          # 中英雙語同一首
    if diff <= 2 and len(short) >= 4:
        return 'high'          # 詩篇63 / 詩篇63篇
    if len(short) <= 3:
        return 'low'           # 短歌名做包含比對極易誤判
    return 'low'

def find(norm):
    """回傳 (符合的歌曲清單, 方式, 信心度)"""
    if norm in by_norm:
        return by_norm[norm], 'exact', 'high'
    cands = [(n, s) for n, ss in by_norm.items() for s in ss
             if n and norm and (n in norm or norm in n)]
    if cands:
        best = min(abs(len(c[0]) - len(norm)) for c in cands)
        picked = [c for c in cands if abs(len(c[0]) - len(norm)) == best]
        n0 = picked[0][0]
        short, long_ = (n0, norm) if len(n0) < len(norm) else (norm, n0)
        conf = _sub_conf(short, long_)
        return [c[1] for c in picked], 'contains', conf
    close = difflib.get_close_matches(norm, list(by_norm), n=1, cutoff=0.86)
    if close:
        return by_norm[close[0]], 'similar', 'low'
    return [], 'none', 'none'


for g in grouped:
    matches, how, conf = find(g['norm'])
    g['match'] = how
    g['confidence'] = conf
    g['songIds'] = [m['id'] for m in matches]
    g['songTitles'] = [m['title'] for m in matches]

# ---- 2b. 套用人工審查決定 --------------------------------------------------
dec_path = HERE / 'decisions.json'
if dec_path.exists():
    rejected = {tuple(r) for r in json.load(open(dec_path))['rejected']}
    n = 0
    for g in grouped:
        if (g['norm'], g['key'] or '', g['label'] or '') in rejected:
            g['songIds'], g['songTitles'] = [], []
            g['match'], g['confidence'] = 'none', 'rejected'
            n += 1
    print(f"（已套用人工審查：{n} 筆解除關聯，改入待用池）\n")

# ---- 3. 統計 ---------------------------------------------------------------
matched_songs = {sid for g in grouped for sid in g['songIds']}
stat = defaultdict(int)
for g in grouped:
    stat[g['confidence']] += 1

json.dump(grouped, open(HERE / 'match.json', 'w'), ensure_ascii=False, indent=1)

print(f"檔案 {len(files)} 個  →  組成 {len(grouped)} 份樂譜")
print(f"  其中多頁合併的樂譜: {sum(1 for g in grouped if len(g['pages'])>1)}")
print()
auto = sum(1 for g in grouped if g['confidence']=='high')
review = [g for g in grouped if g['confidence']=='low']
print(f"配對結果（以樂譜計）:")
print(f"  可自動採用 : {auto}")
print(f"  需人工確認 : {len(review)}   ← 審查重點")
print(f"  歌庫查無   : {stat['none']}   ← 存入待用池")
print()
print(f"歌庫 {len(songs)} 首中，{len(matched_songs)} 首找到樂譜 "
      f"({len(matched_songs)*100//len(songs)}%)")
missing = [s['title'] for s in songs if s['id'] not in matched_songs]
print(f"仍無樂譜的歌 ({len(missing)}): {'、'.join(missing)}")
print(f"\n→ 已寫入 {HERE/'match.json'}")
