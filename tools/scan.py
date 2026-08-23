#!/usr/bin/env python3
"""掃描樂譜資料夾，解析檔名結構，輸出 scan.json 供後續步驟使用。"""
import json, re, sys, unicodedata
from pathlib import Path
from collections import defaultdict

SRC = Path('/Users/timlin/Desktop/ICCSongs')
OUT = Path(__file__).parent / 'scan.json'

SHEET_EXT = {'.pdf', '.jpg', '.jpeg', '.png', '.tif', '.tiff', '.gif', '.webp'}
DOC_EXT   = {'.doc', '.docx'}
SKIP_EXT  = {'.mp3', '.txt', '.url', '.htm', '.html', '.numbers', '.pages', '.paper', ''}

# ---- 檔名結構解析規則 -------------------------------------------------------
KEY_RE   = re.compile(r'[_\s]([A-G][b#\u266d\u266f]?(?:-[A-G][b#\u266d\u266f]?)?)\s*$', re.I)
NOFM_RE  = re.compile(r'[\s_-]*(\d+)\s*(?:of|/)\s*(\d+)\s*$', re.I)   # "1 of 2"
PAREN_PG = re.compile(r'\((\d+)(?:-(\d+))?\)\s*$')                     # "(2)" "(2-2)"
TAIL_PG  = re.compile(r'[\s_-](\d)\s*$')                                # "更深呼求 2"

# 版本／內容註記：只在括號內、或以分隔符結尾的片段中才剝除，避免誤傷歌名
DESCRIPTORS = [
    'chords & lyrics', 'chords and lyrics', 'chord chart', 'chordchart',
    'chorus only', 'chords', 'chord', 'lyrics', 'lyric', 'key in',
    'multitrack', 'mmo', 'vocal', 'kb', 'guitar',
    '\u5409\u4ed6\u5f48\u5531\u8b5c', '\u7c21\u8b5c', '\u548c\u5f26', '\u8b5c', '\u6b4c\u8a5e', '\u7537', '\u5973',
]

S2T = dict(zip(
    '纯洁灵为荣归赞让给来见爱这个体们无从对时会说话开关问间国学实点声觉读写还进远运过达边连么义乐复华献谢赐权战胜举兴欢庆丽丰师总应灭罗铁银钱长门风飞龙儿单张决阳阴价旷诗篇希乐圣灵祷告赦罪恩典',
    '純潔靈為榮歸讚讓給來見愛這個體們無從對時會說話開關問間國學實點聲覺讀寫還進遠運過達邊連麼義樂復華獻謝賜權戰勝舉興歡慶麗豐師總應滅羅鐵銀錢長門風飛龍兒單張決陽陰價曠詩篇希樂聖靈禱告赦罪恩典'))

VARIANTS = {'爲':'為','著':'著','裏':'裡','夠':'夠','遯':'遇','跡':'跥','們':'們'}

def to_trad(s):
    s = ''.join(S2T.get(c, c) for c in s)
    return ''.join(VARIANTS.get(c, c) for c in s)

def norm_title(s):
    """歌名正規化，用於比對：去空白標點、繁簡統一、你/祢統一、小寫"""
    s = unicodedata.normalize('NFKC', s)
    s = s.replace('祢', '你').replace('裮', '你').replace('妳', '你')
    s = to_trad(s)
    s = re.sub(r'[\s_\-（）()【】\[\]{}、,，。.!！?？~～:：;；\'"`]', '', s)
    return s.lower()

def _norm_key(k):
    """BB -> Bb, EB -> Eb, bb-c -> Bb-C"""
    k = k.replace('\u266d', 'b').replace('\u266f', '#')
    out = []
    for part in k.split('-'):
        part = part.strip()
        if not part:
            continue
        out.append(part[0].upper() + part[1:].lower())
    return '-'.join(out)

def _strip_descriptors(text, labels):
    """只剝除位於字串結尾、或被分隔符隔開的註記片段"""
    changed = True
    while changed:
        changed = False
        t = text.strip(' -_&')
        low = t.lower()
        for d in DESCRIPTORS:
            if low.endswith(d):
                labels.append(d)
                t = t[: len(t) - len(d)]
                changed = True
                low = t.strip(' -_&').lower()
                t = t.strip(' -_&')
        text = t
    return text.strip(' -_&')

def parse(stem):
    raw = unicodedata.normalize('NFKC', stem)
    labels = []

    # 1. 括號內容 -> 註記（純數字的留給頁碼處理）
    for m in re.finditer(r'[\uff08(]([^\uff09)]*)[\uff09)]', raw):
        inner = m.group(1).strip()
        if inner and not re.fullmatch(r'\d+(-\d+)?', inner):
            labels.append(inner)

    s = raw
    page = total = None

    # 2. 括號頁碼
    m = PAREN_PG.search(s)
    if m:
        page = int(m.group(1))
        total = int(m.group(2)) if m.group(2) else None
        s = s[: m.start()].strip()

    s = re.sub(r'[\uff08(][^\uff09)]*[\uff09)]', ' ', s)
    s = re.sub(r'(?i)\bcopy\b', ' ', s).strip()

    # 3. 調性
    key = None
    m = KEY_RE.search(s)
    if m:
        key = _norm_key(m.group(1))
        s = s[: m.start()].strip()

    # 4. "N of M" 分頁
    if page is None:
        m = NOFM_RE.search(s)
        if m:
            page, total = int(m.group(1)), int(m.group(2))
            s = s[: m.start()].strip()

    # 5. 尾端單一數字頁碼
    if page is None:
        m = TAIL_PG.search(s)
        if m:
            page = int(m.group(1))
            s = s[: m.start()].strip()

    # 6. 註記片段（只剝結尾，保護歌名）
    s = _strip_descriptors(s, labels)

    # 7. " - " 之後若整段是註記，移到 label
    if ' - ' in s:
        head, _, tail = s.rpartition(' - ')
        if tail.strip().lower() in DESCRIPTORS and head.strip():
            labels.append(tail.strip())
            s = head.strip()

    title = re.sub(r'\s+', ' ', s).strip(' -_&')
    return {
        'title': title,
        'key': key,
        'page': page,
        'page_total': total,
        'label': ' / '.join(dict.fromkeys(x.strip() for x in labels if x.strip())) or None,
    }

def main():
    files, skipped = [], []
    for p in sorted(SRC.rglob('*')):
        if not p.is_file() or p.name.startswith('.'):
            continue
        ext = p.suffix.lower()
        if ext in SKIP_EXT or (ext not in SHEET_EXT and ext not in DOC_EXT):
            skipped.append({'path': str(p.relative_to(SRC)), 'ext': ext})
            continue
        info = parse(p.stem)
        files.append({
            'path': str(p.relative_to(SRC)),
            'ext': ext,
            'kind': 'doc' if ext in DOC_EXT else ('pdf' if ext == '.pdf' else 'image'),
            'size': p.stat().st_size,
            'norm': norm_title(info['title']),
            **info,
        })

    groups = defaultdict(list)
    for f in files:
        groups[(f['norm'], f['key'] or '', f['label'] or '')].append(f)

    OUT.write_text(json.dumps({'files': files, 'skipped': skipped}, ensure_ascii=False, indent=1))

    print(f"掃描來源 : {SRC}")
    n_pdf = sum(1 for f in files if f['kind'] == 'pdf')
    n_img = sum(1 for f in files if f['kind'] == 'image')
    n_doc = sum(1 for f in files if f['kind'] == 'doc')
    print(f"樂譜檔案 : {len(files)}   （PDF {n_pdf} / 圖片 {n_img} / Word {n_doc}）")
    print(f"略過檔案 : {len(skipped)}  （錄音、捷徑等非樂譜）")
    print(f"不重複歌名: {len(set(f['norm'] for f in files))}")
    print(f"解析出調性: {sum(1 for f in files if f['key'])}")
    print(f"多頁分割檔: {sum(1 for f in files if f['page'])}")
    print(f"有版本註記: {sum(1 for f in files if f['label'])}")
    print(f"\n→ 已寫入 {OUT}")

if __name__ == '__main__':
    main()
