#!/usr/bin/env python3
"""把每份樂譜的每一頁轉成 JPEG。
iOS 的內嵌 PDF 只顯示第一頁，圖片則毫無限制 —— 原生捲動與雙指縮放都能用。"""
import json, sys
from pathlib import Path
import pymupdf

HERE = Path(__file__).parent
OUT  = HERE / 'out'
IMGS = HERE / 'pages'; IMGS.mkdir(exist_ok=True)

# 1600px 寬在平板上清晰、也夠列印閱讀，同時控制住檔案大小
TARGET_W = 1600
QUALITY  = 82

sheets = json.load(open(HERE / 'uploaded.json'))
done = fail = skipped = 0
total_bytes = 0

for i, s in enumerate(sheets, 1):
    if not s.get('pdf'):
        continue
    src = OUT / s['pdf']
    sid = s['sheetId']
    try:
        doc = pymupdf.open(str(src))
        paths = []
        for pno in range(doc.page_count):
            dst = IMGS / f"{sid}_p{pno + 1}.jpg"
            if dst.exists():
                paths.append(dst.name); total_bytes += dst.stat().st_size
                continue
            page = doc[pno]
            zoom = TARGET_W / page.rect.width
            pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False)
            pix.save(str(dst), jpg_quality=QUALITY)
            paths.append(dst.name); total_bytes += dst.stat().st_size
        doc.close()
        s['pageImages'] = paths
        done += 1
    except Exception as e:
        fail += 1
        print(f"  ✗ {s['title'][:30]}: {e}", flush=True)
    if i % 100 == 0:
        print(f"  {i}/{len(sheets)}  完成 {done} / 失敗 {fail}", flush=True)

json.dump(sheets, open(HERE / 'uploaded.json', 'w'), ensure_ascii=False, indent=1)
imgs = list(IMGS.glob('*.jpg'))
print(f"\n完成 {done} 份 / 失敗 {fail}")
print(f"產出 {len(imgs)} 張圖，共 {sum(f.stat().st_size for f in imgs)/1e6:.0f} MB → {IMGS}")
